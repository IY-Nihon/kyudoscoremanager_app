/**
 * 配信の設定（firebase.json）の、画面の道の控えの指定。
 *
 * アプリの画面の道（/record・/history など）は index.html に回される（rewrites）。
 * 回された先ではなく、求められた道で指定が探されるので、道ごとに指定が無いと、Firebase の既定
 * （max-age=3600）になる。Chrome を閉じて開き直すと、その1時間のあいだ、前の版の HTML を確かめずに
 * 使い、前の版のまま動いた（更新の帯がまた出る。2026-10-03）。
 * 道が増えたのに指定を足し忘れないよう、MainNavigator の道を全部読んで確かめる。
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const 設定 = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'firebase.json'), 'utf8'));
const 規則たち = 設定.hosting.headers;

/**
 * firebase.json の source が、道に当たるか。使っている書き方だけ読む：
 *   そのままの道 ／ ** （どこまでも）／ * （/ を除く）／ @(a|b) （a と b のどちらか）
 */
function 当たるか(source, 道) {
  let 式 = '';
  for (let i = 0; i < source.length; ) {
    if (source.startsWith('@(', i)) {
      const 閉じ = source.indexOf(')', i);
      const 候補 = source.slice(i + 2, 閉じ).split('|').map((x) => 当たる式(x));
      式 += '(' + 候補.join('|') + ')';
      i = 閉じ + 1;
    } else if (source.startsWith('**/', i)) {
      式 += '(.*/)?';
      i += 3;
    } else if (source.startsWith('**', i)) {
      式 += '.*';
      i += 2;
    } else if (source[i] === '*') {
      式 += '[^/]*';
      i += 1;
    } else {
      式 += 字として(source[i]);
      i += 1;
    }
  }
  return new RegExp('^' + 式 + '$').test(道);
}
function 字として(c) {
  return '.+?^$|()[]{}'.includes(c) || c === String.fromCharCode(92) ? String.fromCharCode(92) + c : c;
}
function 当たる式(x) {
  return [...x].map((c) => (c === '*' ? '[^/]*' : 字として(c))).join('');
}

const 控えの値 = (道) => {
  const 値 = [];
  for (const 規則 of 規則たち) {
    if (!当たるか(規則.source, 道)) continue;
    for (const h of 規則.headers) if (h.key === 'Cache-Control') 値.push(h.value);
  }
  return 値;
};

test('画面の道（MainNavigator の リンクの決まり）は、すべて「控えさせない」指定に当たる', () => {
  const 画面の作り = fs.readFileSync(path.join(__dirname, '..', 'src', 'MainNavigator.js'), 'utf8');
  const 道たち = [...画面の作り.matchAll(/'[^']+':\s*'([a-z]+)',/g)].map((m) => '/' + m[1]);
  assert.ok(道たち.length >= 6, '道が読めない（' + 道たち.join(',') + '）');
  for (const 道 of 道たち) {
    const 値 = 控えの値(道);
    assert.ok(値.length > 0, 道 + ' に Cache-Control の指定が無い（既定の max-age=3600 になる）');
    assert.ok(値.every((v) => /no-store/.test(v)), 道 + ' が no-store でない: ' + 値.join(' | '));
  }
});

test('入口の / と index.html も、控えさせない', () => {
  for (const 道 of ['/', '/index.html']) {
    const 値 = 控えの値(道);
    assert.ok(値.length > 0 && 値.every((v) => /no-store/.test(v)), 道 + ': ' + 値.join(' | '));
  }
});

test('束（名前に中身の印が付く）は、長く控えさせる。画面の道の指定に巻き込まれない', () => {
  const 値 = 控えの値('/_expo/static/js/web/AppEntry-0123456789abcdef.js');
  assert.ok(値.some((v) => /immutable/.test(v)), '束の指定が変わった: ' + 値.join(' | '));
  assert.ok(!値.some((v) => /no-store/.test(v)), '束まで控えさせなくなっている');
});

test('当たるか：使っている書き方の確かめ', () => {
  assert.ok(当たるか('@(/record|/history)', '/history'));
  assert.ok(!当たるか('@(/record|/history)', '/historyx'));
  assert.ok(当たるか('**/*.html', '/a/b/index.html'));
  assert.ok(当たるか('**/*.html', '/index.html'));
  assert.ok(!当たるか('/', '/record'));
  assert.ok(当たるか('/_expo/static/**', '/_expo/static/js/web/a.js'));
  assert.ok(!当たるか('/_expo/static/**', '/record'));
});
