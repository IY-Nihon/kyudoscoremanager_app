/**
 * ソース中の \uXXXX を日本語の文字そのものに戻す。
 *
 *   node scripts/unescape-japanese.mjs           確認のみ（書き込まない）
 *   node scripts/unescape-japanese.mjs --commit  書き込む
 *
 * src/ はソースマップから復元した最小化コードで、日本語が
 * '同期済み' のような形で埋まっている。読めないため、
 * 変更のたびに検索も差分の確認も難しく、事故のもとになっていた。
 *
 * 置き換えは「意味を変えないこと」を構文木で確かめてから行う。
 *   1. 変換前を @babel/parser で解析
 *   2. \uXXXX を文字に戻す（日本語まわりの範囲のみ）
 *   3. 変換後を解析し、位置情報と表記の差を除いた構文木が一致するか比較
 * 一致しないファイルは書き換えない。
 *
 * 正規表現リテラルの中は触らない。[\s　] を [\s　] に変えても
 * 照合の結果は同じだが、source や toString() を読む箇所があると
 * 見た目が変わってしまうため、はじめから対象外にしている。
 */
import fs from 'node:fs';
import path from 'node:path';
import { parse } from '@babel/parser';

const COMMIT = process.argv.includes('--commit');
const SRC = 'src';

/** 戻してよい文字か（日本語と、記録表で使う記号） */
function 戻してよい(code) {
  return (
    (code >= 0x3000 && code <= 0x30ff) || // 句読点・ひらがな・カタカナ
    (code >= 0x3400 && code <= 0x4dbf) || // 漢字（拡張A）
    (code >= 0x4e00 && code <= 0x9fff) || // 漢字
    (code >= 0xff00 && code <= 0xffef) || // 全角英数・記号
    code === 0x25cb || // ○
    code === 0x25cf || // ●
    code === 0x25b3 || // △
    code === 0x00d7 // ×
  );
}

/** 構文木をたどって、正規表現リテラルの占める範囲を集める */
function 正規表現の範囲(node, 範囲 = []) {
  if (Array.isArray(node)) {
    node.forEach((n) => 正規表現の範囲(n, 範囲));
    return 範囲;
  }
  if (node && typeof node === 'object') {
    if (node.type === 'RegExpLiteral' && typeof node.start === 'number') {
      範囲.push([node.start, node.end]);
    }
    for (const key of Object.keys(node)) {
      if (key === 'loc') continue;
      正規表現の範囲(node[key], 範囲);
    }
  }
  return 範囲;
}

function 戻す(src, 除外) {
  let 件数 = 0;
  const 除外か = (i) => 除外.some(([s, e]) => i >= s && i < e);
  const out = src.replace(/\\u([0-9a-fA-F]{4})/g, (全体, hex, offset) => {
    // 直前のバックスラッシュが奇数個なら、それはエスケープされた
    // バックスラッシュ + u なので触らない
    let b = 0;
    for (let j = offset - 1; j >= 0 && src[j] === '\\'; j--) b++;
    if (b % 2 === 1) return 全体;
    if (除外か(offset)) return 全体;
    const code = parseInt(hex, 16);
    if (!戻してよい(code)) return 全体;
    件数++;
    return String.fromCharCode(code);
  });
  return { out, 件数 };
}

const 解析設定 = {
  sourceType: 'unambiguous',
  allowReturnOutsideFunction: true,
  errorRecovery: false,
  plugins: ['jsx', 'optionalChaining', 'nullishCoalescingOperator', 'classProperties'],
};

/**
 * 位置情報と「書き方の差」を落として、意味だけを残した形にする。
 * extra.raw と、テンプレート文字列の value.raw は表記そのものなので外す。
 * 文字列の value と value.cooked（実際の中身）は残すので、
 * 中身が変わっていればここで差として出る。
 */
const 落とす = new Set(['loc', 'start', 'end', 'range', 'extra', 'raw',
  'leadingComments', 'trailingComments', 'innerComments', 'comments']);

function 骨格(node) {
  if (Array.isArray(node)) return node.map(骨格);
  if (node && typeof node === 'object') {
    const out = {};
    for (const key of Object.keys(node)) {
      if (落とす.has(key)) continue;
      out[key] = 骨格(node[key]);
    }
    return out;
  }
  return node;
}

const 結果 = [];
let 失敗 = 0;

for (const f of fs.readdirSync(SRC).sort()) {
  if (!f.endsWith('.js')) continue;
  const p = path.join(SRC, f);
  const 元 = fs.readFileSync(p, 'utf8');

  let 元木;
  try {
    元木 = parse(元, 解析設定);
  } catch (e) {
    結果.push({ ファイル: f, 戻した数: 0, 構文木: '解析できず: ' + e.message.slice(0, 40) });
    失敗++;
    continue;
  }

  const { out: 新, 件数 } = 戻す(元, 正規表現の範囲(元木.program));
  if (件数 === 0) continue;

  let 判定;
  try {
    const a = JSON.stringify(骨格(元木.program));
    const b = JSON.stringify(骨格(parse(新, 解析設定).program));
    判定 = a === b ? '一致' : '不一致';
  } catch (e) {
    判定 = '解析できず: ' + e.message.slice(0, 60);
  }

  if (判定 === '一致') {
    if (COMMIT) fs.writeFileSync(p, 新);
  } else {
    失敗++;
  }
  結果.push({ ファイル: f, 戻した数: 件数, 構文木: 判定 });
}

console.table(結果);
const 合計 = 結果.reduce((a, b) => a + b.戻した数, 0);
console.log(
  COMMIT
    ? `${結果.length - 失敗} 本 / ${合計} 箇所を日本語に戻しました（見送り ${失敗} 本）`
    : `対象 ${結果.length} 本 / ${合計} 箇所。書き込むには --commit を付けてください（見送り予定 ${失敗} 本）`
);
if (失敗) process.exit(1);
