/**
 * ログイン画面の配色。
 *
 * この画面だけは、テーマ変換を通さない前提で組まれている（theme.js の頭に
 * その旨が書いてある）。地は #030508、文字は金 #E5C184/#B8965A の系統で、
 * 変換表に載っているライト用の色は使わない。
 *
 * 使ってしまうと、明るいテーマのときに変換されず、暗い地に暗い文字が
 * そのまま残って読めなくなる。実際、同意のチェックの説明文で #3C3C43 を
 * 使ってしまい、地との比が 1.78 しかない状態で出てしまった。
 */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const 場所 = (名) => path.join(__dirname, '..', 'src', 名);

/** 注記の中に色名を書くことがあるので、コメントを外してから数える */
function 色を拾う(本体) {
  const 素 = 本体.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  return [...new Set((素.match(/#[0-9a-fA-F]{6}\b/g) || []).map((c) => c.toLowerCase()))];
}

/**
 * theme.js の変換表を役割ごとに取り出す。
 * 同じ色でも役割で変換先が違う（白は背景ならカード面、文字なら白のまま）ので、
 * ひとまとめにすると、正しい使い方まで咎めてしまう
 */
function 変換表たち() {
  const 本体 = fs.readFileSync(場所('theme.js'), 'utf8');
  const 拾う = (名) => {
    const 始 = 本体.indexOf('const ' + 名 + ' = ');
    assert.ok(始 > 0, 'theme.js に ' + 名 + ' が無い');
    // 表の終わりは '});'（Object.assign 形式）か '};'（素のオブジェクト）
    const 候補 = [本体.indexOf('\n});', 始), 本体.indexOf('\n};', 始)].filter((i) => i > 0);
    const 終 = 候補.length ? Math.min(...候補) : 本体.length;
    const 塊 = 本体.slice(始, 終);
    // 変換先が自分自身の行は、暗いテーマでも色が変わらないので咎めない
    // （TEXT_MAP の '#ffffff': '#ffffff' ＝ 色付きボタン上の白文字）
    return new Set(
      [...塊.matchAll(/'(#[0-9a-fA-F]{3,8})'\s*:\s*'(#[0-9a-fA-F]{3,8})'/g)]
        .map((m) => [m[1].toLowerCase(), m[2].toLowerCase()])
        .filter(([鍵, 値]) => 鍵 !== 値)
        .map(([鍵]) => 鍵)
    );
  };
  const 共通 = 拾う('ACCENT');
  const 足す = (名) => new Set([...共通, ...拾う(名)]);
  return { bg: 足す('BG_MAP'), text: 足す('TEXT_MAP'), border: 足す('BORDER_MAP') };
}

/** その画面で「どの役割で」使われている色かを拾う */
function 役割ごとの色(本体) {
  const 素 = 本体.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  const 取る = (鍵) =>
    new Set(
      [...素.matchAll(new RegExp(鍵 + ":\\s*'(#[0-9a-fA-F]{3,8})'", 'g'))].map((m) => m[1].toLowerCase())
    );
  const 出来 = {
    text: 取る('color'),
    bg: 取る('backgroundColor'),
    border: 取る('borderColor'),
  };
  // 一時、正規表現の書き間違いで1色も拾えず、この検査が空振りしたまま
  // 通り続けていた。何も拾えないときは、合格ではなく壊れているとみなす
  assert.ok(
    出来.text.size + 出来.bg.size + 出来.border.size > 0,
    '色をひとつも拾えていない。拾い方が壊れている（空振りのまま通ってしまう）'
  );
  return 出来;
}

const h2r = (h) => {
  let s = h.replace('#', '');
  if (s.length === 3) s = [...s].map((c) => c + c).join('');
  return { r: parseInt(s.slice(0, 2), 16), g: parseInt(s.slice(2, 4), 16), b: parseInt(s.slice(4, 6), 16) };
};
const 明るさ = ({ r, g, b }) => {
  const f = (v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const 比 = (a, b) => {
  const x = 明るさ(h2r(a));
  const y = 明るさ(h2r(b));
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};

// 地の色。#030508 に rgba(255,255,255,0.03) のカードを重ねたあたり
const 地 = '#0b0d10';
// 地そのものとして使う色。文字ではないので比の対象から外す
const 地の色たち = new Set(['#030508']);

test('ログイン画面は、テーマ変換表の色を使わない', () => {
  const 表 = 変換表たち();
  const 使用 = 役割ごとの色(fs.readFileSync(場所('LoginScreen.js'), 'utf8'));
  const 混入 = [];
  for (const 役 of ['text', 'bg', 'border']) {
    for (const c of 使用[役]) if (表[役].has(c)) 混入.push(役 + ': ' + c);
  }
  assert.deepStrictEqual(
    混入.sort(),
    [],
    '変換表の色は明るいテーマで変換されず、暗い地に沈む。この画面の配色（#030508 / #E5C184 / #B8965A / #A09880 / #C9C1AE）から選ぶこと'
  );
});

test('ログイン画面の文字は、地に対して十分な濃さがある', () => {
  const 使用 = 色を拾う(fs.readFileSync(場所('LoginScreen.js'), 'utf8'));
  const 薄い = [];
  for (const c of 使用) {
    if (地の色たち.has(c)) continue;
    const v = 比(c, 地);
    if (v < 4.5) 薄い.push(c + '（比 ' + v.toFixed(2) + '）');
  }
  assert.deepStrictEqual(薄い, [], '地 ' + 地 + ' に対して 4.5 を下回る色がある');
});

test('設定の法的情報のリンクは、そばのバージョン表記と同じ濃さ', () => {
  // 目立たせない方針だが、探して見つからないほど薄くはしない。
  // #C7C7CC だと明るい地との比が 1.5 しかなく、事実上見えなかった
  const 本体 = fs.readFileSync(場所('SettingsScreen.js'), 'utf8');
  const 拾う = (名) => {
    const m = 本体.match(new RegExp(名 + ":\\s*\\{[^}]*color:\\s*'(#[0-9a-fA-F]{3,6})'"));
    return m ? m[1].toLowerCase() : null;
  };
  const 法 = 拾う('legalText');
  const 版 = 拾う('versionText');
  assert.ok(法, '法的情報のリンクの色が見つからない');
  assert.ok(版, 'バージョン表記の色が見つからない');
  assert.strictEqual(法, 版, '法的情報のリンクだけが薄いと、探しても見つからない');
});

// 暗いテーマのカード面。この上で沈むかどうかを見る
const 暗い面 = '#2c2c2e';

test('分析の比較で使う色が、暗いテーマで消えない', () => {
  // 明るいテーマ向けの暗い灰色を、変換表に載せずに使うと、暗いテーマでは
  // そのまま出て、暗い面の上でほぼ見えなくなる。
  // 実際 #3C3C43（本人の丸・比 1.27）と #48484A（射数の副文字・比 1.53）で踏んだ。
  //
  // 明るい色は変換表に無くても暗い面では読めるので咎めない。
  // 既存の配色（緑や黄が明るい面でやや薄い等）まで咎めると、
  // この検査は「今あるものが全部だめ」と言うだけの役に立たないものになる。
  const 本体 = fs.readFileSync(場所('theme.js'), 'utf8');
  const 鍵たち = (名) => {
    const 始 = 本体.indexOf('const ' + 名 + ' = ');
    assert.ok(始 > 0, 'theme.js に ' + 名 + ' が無い');
    const 候補 = [本体.indexOf('\n});', 始), 本体.indexOf('\n};', 始)].filter((i) => i > 0);
    const 塊 = 本体.slice(始, Math.min(...候補));
    return new Set([...塊.matchAll(/'(#[0-9a-fA-F]{3,8})'\s*:/g)].map((m) => m[1].toLowerCase()));
  };
  // 丸は backgroundColor で塗るので、見るのは背景の表。文字の表と混ぜると、
  // #3C3C43 のように「文字なら変換されるが背景では変換されない」色を見逃す
  // （実際それで一度、この検査が素通りした）
  const 背景に使える = new Set([...鍵たち('ACCENT'), ...鍵たち('BG_MAP')]);

  const 分析 = fs.readFileSync(場所('AnalysisScreen.js'), 'utf8');
  const 並び = (分析.match(/const 比較の色たち = \[([^\]]+)\]/) || [])[1];
  assert.ok(並び, '比較の色たち が見つからない');
  const 色たち = [...並び.matchAll(/'(#[0-9a-fA-F]{6})'/g)].map((m) => m[1].toLowerCase());
  const 本人 = [...分析.matchAll(/色: '(#[0-9a-fA-F]{6})'/g)].map((m) => m[1].toLowerCase());
  assert.ok(本人.length > 0, '本人の色が見つからない');

  const 沈む = [...new Set([...色たち, ...本人])]
    .filter((c) => !背景に使える.has(c) && 比(c, 暗い面) < 2)
    .map((c) => c + '（暗い面との比 ' + 比(c, 暗い面).toFixed(2) + '）');
  assert.deepStrictEqual(
    沈む.sort(),
    [],
    '変換表に無い暗い色を丸に使っている。暗いテーマでそのまま出て見えなくなる'
  );
});

test('ログイン画面：使っている名前が、すべて読み込まれている', () => {
  // 2026-08-29 に踏んだ。法.開く(法.規約のURL) を書いたのに
  // const 法 = require('./legalDocs') が無く、押すと
  // ReferenceError: 法 is not defined になっていた。
  // 押さない限り現れないので、画面を開くだけの確認では見つからない。
  const 本体 = fs.readFileSync(場所('LoginScreen.js'), 'utf8');
  const 素 = 本体.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

  // 「漢字の名前.なにか」の形で使っている入れ物を集める
  const 使っている = new Set(
    [...素.matchAll(/(?:^|[^.\w\u3040-\u30ff\u4e00-\u9fff])([\u4e00-\u9fff]{1,4})\./g)].map((m) => m[1])
  );
  // 定義されているもの（require の別名・const/let/var・引数の分解）
  const 定義 = new Set([
    ...[...素.matchAll(/([\u4e00-\u9fff]{1,4})\s*=\s*require\(/g)].map((m) => m[1]),
    ...[...素.matchAll(/(?:const|let|var)\s+([\u4e00-\u9fff]{1,4})\b/g)].map((m) => m[1]),
    ...[...素.matchAll(/\[\s*([\u4e00-\u9fff]{1,4})\s*,/g)].map((m) => m[1]),
  ]);
  const 無い = [...使っている].filter((x) => !定義.has(x));
  assert.deepStrictEqual(
    無い.sort(),
    [],
    '読み込んでいない名前を使っている（押したときに ReferenceError になる）'
  );
});

test('ログイン画面：IDは整えてから使い、パスワードは整えない', () => {
  // LINE やメモ帳から貼ると、前後に空白が混じることがある。そのまま
  // 照合すると「合っているのに入れない」になり、見た目では気づけない。
  //
  // 逆にパスワードを整えてはいけない。空白も文字のうちで、末尾に空白を
  // 含むパスワードを設定した人が入れなくなる。
  const 本体 = fs.readFileSync(場所('LoginScreen.js'), 'utf8');
  const 素 = 本体.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

  assert.ok(/const 整えたID = /.test(素), '整えたID が無い');

  // 生の toUpperCase が残っていないこと（整えるのを飛ばした経路）
  const 生 = [...素.matchAll(/([A-Za-z_$][\w$]*)\.toUpperCase\(\)/g)].map((m) => m[0]);
  assert.deepStrictEqual(生, [], '整えたID を通さずに大文字化している所がある: ' + 生.join(', '));

  // パスワード（L）を整えていないこと
  assert.ok(!/整えたID\(L\)/.test(素), 'パスワードを整えている（空白も文字のうち）');
});
