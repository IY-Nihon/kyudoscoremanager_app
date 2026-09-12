/**
 * 名寄せ（src/ocrNamae.js）。Gemini の照合（roster）を主にした決まりと、重なりの扱い。
 * 名前は架空。
 */
const test = require('node:test');
const assert = require('node:assert');
const { 名簿で名寄せ, 重なりを外す, matchArcherName } = require('../src/ocrNamae');

const 名簿 = [
  { id: 'm1', name: '河原 太郎', isAlumni: false },
  { id: 'm2', name: '橋本 次郎', isAlumni: false },
  { id: 'm3', name: '†永井 三郎†', isAlumni: false },
  { id: 'm4', name: '渡辺 四郎', isAlumni: false },
  { id: 'm5', name: '渡邉 五郎', isAlumni: false },
  { id: 'm6', name: '田端 六郎', isAlumni: false },
  { id: 'a1', name: '飯田 七郎', isAlumni: true },
];

test('roster が名簿の表記なら、その人に寄る（記号付きの表記も）', () => {
  assert.strictEqual(名簿で名寄せ('河原', '河原', 名簿).match.id, 'm1');
  assert.strictEqual(名簿で名寄せ('永井', '†永井', 名簿).match.id, 'm3');
  assert.strictEqual(名簿で名寄せ('河原', '河原(太)', 名簿).match.id, 'm1');
  assert.strictEqual(名簿で名寄せ('河原', '河原 太郎', 名簿).match.id, 'm1');
});

test('roster が null なら、編集距離では寄せない（相手校の選手が部員に化けない）', () => {
  // 文字比較だけだと 松本 → 橋本 になっていた
  assert.strictEqual(matchArcherName('松本', 名簿).status, 'matched');
  assert.strictEqual(名簿で名寄せ('松本', null, 名簿).status, 'guest');
  assert.strictEqual(名簿で名寄せ('田中', null, 名簿).status, 'guest');
  // 完全一致・姓の一致だけは認める（Gemini が見落としても救う）
  assert.strictEqual(名簿で名寄せ('橋本', null, 名簿).match.id, 'm2');
});

test('roster が無い（古い返事）なら、これまでの文字比較のまま', () => {
  assert.strictEqual(名簿で名寄せ('松本', undefined, 名簿).status, 'matched');
});

test('roster が複数の人に当たるなら「もしかして」', () => {
  const r = 名簿で名寄せ('渡邊', '渡邉', 名簿);
  // 渡邉 → 正規化で 渡辺 になり、渡辺と渡邉の2人に当たる
  assert.strictEqual(r.status, 'ambiguous');
  assert.deepStrictEqual(r.options.map((o) => o.id).sort(), ['m4', 'm5']);
});

test('roster が付いていても、読めた字が名簿の姓と違うなら「もしかして」で止める', () => {
  // 「田」だけ読めて Gemini が 田端 に寄せた／「砂原」を 笹原 に寄せた、は人に決めてもらう
  const r = 名簿で名寄せ('田', '田端', 名簿);
  assert.strictEqual(r.status, 'ambiguous');
  assert.deepStrictEqual(r.options.map((o) => o.id), ['m6']);
  assert.strictEqual(名簿で名寄せ('河源', '河原', 名簿).status, 'ambiguous');
  // 姓と同じなら決まり（氏名まで読めていても）
  assert.strictEqual(名簿で名寄せ('河原太郎', '河原', 名簿).status, 'matched');
});

test('roster が名簿に無い表記（作ったもの）なら、読めた文字で厳しく照合', () => {
  assert.strictEqual(名簿で名寄せ('橋本', '橋元', 名簿).match.id, 'm2');
  assert.strictEqual(名簿で名寄せ('松本', '橋元', 名簿).status, 'guest');
});

test('空なら empty', () => {
  assert.strictEqual(名簿で名寄せ('', null, 名簿).status, 'empty');
});

test('同じ人に2行が寄ったら、読めた文字が名簿と同じ行を残し、ほかは「もしかして」に落とす', () => {
  const rows = [
    { rawText: '河原', status: 'matched', match: 名簿[0] },
    { rawText: '橋本', status: 'matched', match: 名簿[1] },
    // 相手校の「河本」を「河原」と読み違えた行（roster も 河原）
    { rawText: '河源', status: 'matched', match: 名簿[0] },
  ];
  const 出 = 重なりを外す(rows);
  assert.strictEqual(出[0].status, 'matched');
  assert.strictEqual(出[1].status, 'matched');
  assert.strictEqual(出[2].status, 'ambiguous');
  assert.deepStrictEqual(出[2].options.map((o) => o.id), ['m1']);
  assert.strictEqual(出[2].rawText, '河源');
});

test('重なり: どちらも読めた文字が名簿と同じなら、先の行を残す', () => {
  const rows = [
    { rawText: '河原', status: 'matched', match: 名簿[0] },
    { rawText: '河原', status: 'matched', match: 名簿[0] },
  ];
  const 出 = 重なりを外す(rows);
  assert.strictEqual(出[0].status, 'matched');
  assert.strictEqual(出[1].status, 'ambiguous');
});
