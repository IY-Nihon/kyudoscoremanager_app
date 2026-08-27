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
  const 使用 = 役割ごとの色(fs.readFileSync(場所('JP_LoginScreen_1036.js'), 'utf8'));
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
  const 使用 = 色を拾う(fs.readFileSync(場所('JP_LoginScreen_1036.js'), 'utf8'));
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
  const 本体 = fs.readFileSync(場所('JP_SettingsScreen_1023.js'), 'utf8');
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
