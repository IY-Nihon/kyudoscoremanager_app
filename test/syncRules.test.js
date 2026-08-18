/**
 * 同期の判断を決める純粋な関数の検査。
 *
 *   npm test
 *
 * Firebase にも画面にも触れないので、通信なしで一瞬で終わる。
 * scripts/verify-*.mjs は実際の Firestore を相手にする「外側」の検査で、
 * こちらは手元だけで回せる「内側」の検査。役割が違うので両方ある。
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const {
  学年でまとめる,
  一立の射数,
  立の数,
  立の頭の射,
  射の立番号,
  toMillis,
  trashedAtMillis,
  mergeById,
  dropUndefinedDeep,
  normalizeTag,
  cleanUpTagsArray,
  cleanUpSessions,
  generateUniquePersonalId,
  mergeLiveArchers,
  normalizeArrowLocations,
  ライブ名に使えない字,
} = require('../src/syncRules');

/** Firestore の Timestamp のふり */
const 日時 = (ms) => ({ toMillis: () => ms });

// ──────────────────────────────────────────────────────────────
test('toMillis: 4つの形をミリ秒に直す', () => {
  assert.equal(toMillis(1500), 1500);
  assert.equal(toMillis(日時(9000)), 9000);
  assert.equal(toMillis({ seconds: 5, nanoseconds: 0 }), 5000);
  assert.equal(toMillis('2026-08-01T00:00:00Z'), Date.parse('2026-08-01T00:00:00Z'));
  assert.equal(toMillis(null), 0);
  assert.equal(toMillis(undefined), 0);
  assert.equal(toMillis('ごみ'), 0);
});

test('trashedAtMillis: 捨てた日時 → 更新日時 → 練習日 の順に見る', () => {
  assert.equal(trashedAtMillis({ deletedAt: 300, lastModified: 200, date: 100 }), 300);
  assert.equal(trashedAtMillis({ lastModified: 200, date: 100 }), 200);
  assert.equal(trashedAtMillis({ date: 100 }), 100);
  assert.equal(trashedAtMillis({}), 0);
  assert.equal(trashedAtMillis(null), 0);
  // 本番で実際に化けていた {seconds, nanoseconds} の形
  assert.equal(trashedAtMillis({ deletedAt: { seconds: 7, nanoseconds: 0 } }), 7000);
});

// ──────────────────────────────────────────────────────────────
// mergeById は同期の勝ち負けを決める中心。ここが緩むと編集が消える。
// ──────────────────────────────────────────────────────────────
const 手元 = (o) => [Object.assign({ id: 'x', name: '手元' }, o)];
const 雲 = (o) => [Object.assign({ id: 'x', name: 'クラウド' }, o)];
const 勝者 = (r) => r[0].name;

test('mergeById: 送信が済んでいれば、クラウドが1秒以上新しいとクラウドが勝つ', () => {
  const r = mergeById(手元({ lastModified: 1000, syncStatus: '同期済み' }), 雲({ lastModified: 5000 }));
  assert.equal(勝者(r), 'クラウド');
});

test('mergeById: まだ送っていなければ、クラウドが新しくても手元が残る', () => {
  // ここが崩れると、端末の時計が数秒遅れているだけで、直したばかりの
  // ○×が黙って元に戻る。記録アプリでは入力が消えるほうが致命的なので、
  // 送信が済むまでは手元を優先する。届けば普通の突き合わせに戻るため、
  // 端末どうしで食い違ったままにはならない。
  const r = mergeById(手元({ lastModified: 1000, syncStatus: '未同期' }), 雲({ lastModified: 5000 }));
  assert.equal(勝者(r), '手元');
});

test('mergeById: 未同期なら、クラウドが1時間新しくても手元が残る', () => {
  const r = mergeById(手元({ lastModified: 1000, syncStatus: '未同期' }), 雲({ lastModified: 3601000 }));
  assert.equal(勝者(r), '手元');
});

test('mergeById: 差が1秒以内なら、それだけではクラウドは勝てない', () => {
  const r = mergeById(手元({ lastModified: 1000, syncStatus: '未同期' }), 雲({ lastModified: 1500 }));
  assert.equal(勝者(r), '手元');
});

test('mergeById: 手元が「同期済み」で日時が近ければ、古いクラウドでも勝つ', () => {
  // サーバーが打った正式な日時に置き換えるための条件。意図した挙動。
  const r = mergeById(手元({ lastModified: 5000, syncStatus: '同期済み' }), 雲({ lastModified: 1000 }));
  assert.equal(勝者(r), 'クラウド');
});

test('mergeById: 手元が「未同期」なら、古いクラウドに上書きされない', () => {
  // これが守られないと、電波の無い場所でした編集が消える
  const r = mergeById(手元({ lastModified: 5000, syncStatus: '未同期' }), 雲({ lastModified: 1000 }));
  assert.equal(勝者(r), '手元');
});

test('mergeById: syncStatus が無いものは「同期済み」とみなす', () => {
  const r = mergeById(手元({ lastModified: 5000 }), 雲({ lastModified: 1000 }));
  assert.equal(勝者(r), 'クラウド');
});

test('mergeById: 日時の差が5分以上あれば、古いクラウドは勝てない', () => {
  const r = mergeById(手元({ lastModified: 400000, syncStatus: '同期済み' }), 雲({ lastModified: 1000 }));
  assert.equal(勝者(r), '手元');
});

test('mergeById: force ならいつでもクラウドが勝つ', () => {
  const r = mergeById(手元({ lastModified: 999999, syncStatus: '未同期' }), 雲({ lastModified: 1 }), true);
  assert.equal(勝者(r), 'クラウド');
});

test('mergeById: 手元に無いものはクラウドから足す', () => {
  const r = mergeById([], 雲({ lastModified: 1 }));
  assert.equal(r.length, 1);
  assert.equal(勝者(r), 'クラウド');
});

test('mergeById: purge はクラウドから消えたものを手元からも消す', () => {
  const r = mergeById(手元({ lastModified: 1, syncStatus: '同期済み' }), [], false, true);
  assert.equal(r.length, 0);
});

test('mergeById: purge でも「未同期」は消さない', () => {
  // 送信前のものを消すと、まだクラウドに届いていない記録が失われる
  const r = mergeById(手元({ lastModified: 1, syncStatus: '未同期' }), [], false, true);
  assert.equal(r.length, 1);
});

test('mergeById: purge を指定しなければ消さない', () => {
  const r = mergeById(手元({ lastModified: 1, syncStatus: '同期済み' }), [], false, false);
  assert.equal(r.length, 1);
});

test('mergeById: 日時が {seconds} の入れ物でも読めて、新しければクラウドが勝つ', () => {
  // 元の実装は入れ物を読めず、比較が NaN になってクラウドが永久に勝てなかった。
  // その記録だけ他の端末の編集が反映されなくなるため、読めるようにした。
  const r = mergeById(手元({ lastModified: 0, syncStatus: '同期済み' }), 雲({ lastModified: { seconds: 5 } }));
  assert.equal(勝者(r), 'クラウド');
});

test('mergeById: 日時が文字列でも読める', () => {
  const 雲の日時 = '2026-08-01T00:00:00Z';
  const r = mergeById(
    手元({ lastModified: Date.parse(雲の日時) - 60000, syncStatus: '同期済み' }),
    雲({ lastModified: 雲の日時 })
  );
  assert.equal(勝者(r), 'クラウド');
});

test('mergeById: 入れ物の形でも、手元が未同期で新しければ手元が残る', () => {
  // 読めるようにしても、送信前の編集を守る条件は変わらない
  const r = mergeById(手元({ lastModified: 999000, syncStatus: '未同期' }), 雲({ lastModified: { seconds: 5 } }));
  assert.equal(勝者(r), '手元');
});

test('mergeById: 読めない日時は 0 として扱い、手元が残る', () => {
  const r = mergeById(手元({ lastModified: 999000, syncStatus: '未同期' }), 雲({ lastModified: 'ごみ' }));
  assert.equal(勝者(r), '手元');
});

test('mergeById: Timestamp は数値に直して返す', () => {
  const r = mergeById([], 雲({ lastModified: 日時(4242) }));
  assert.equal(r[0].lastModified, 4242);
  assert.equal(typeof r[0].lastModified, 'number');
});

test('mergeById: null や id 無しは黙って読み飛ばす', () => {
  const r = mergeById([null, { name: 'id無し' }, { id: 'a' }], [null, { id: 'b' }, { name: 'id無し' }]);
  assert.deepEqual(r.map((x) => x.id).sort(), ['a', 'b']);
});

test('mergeById: 両方 null でも落ちない', () => {
  assert.deepEqual(mergeById(null, null), []);
});

// ──────────────────────────────────────────────────────────────
test('dropUndefinedDeep: undefined だけを取り除く', () => {
  assert.deepEqual(dropUndefinedDeep({ a: 1, b: undefined, c: { d: undefined, e: 2 } }), { a: 1, c: { e: 2 } });
  assert.deepEqual(dropUndefinedDeep([1, undefined, 2]), [1, undefined, 2].map(dropUndefinedDeep));
});

test('dropUndefinedDeep: null は残す（Firestore は null を受け付ける）', () => {
  assert.deepEqual(dropUndefinedDeep({ a: null }), { a: null });
});

test('dropUndefinedDeep: Date など素のオブジェクトでないものはそのまま', () => {
  const d = new Date(0);
  assert.equal(dropUndefinedDeep(d), d);
});

// ──────────────────────────────────────────────────────────────
test('normalizeTag: 先頭に # をひとつ付ける', () => {
  assert.equal(normalizeTag('練習'), '#練習');
  assert.equal(normalizeTag('#練習'), '#練習');
  assert.equal(normalizeTag('＃練習'), '#練習');
  assert.equal(normalizeTag('##練習'), '#練習');
  assert.equal(normalizeTag('  #  練習 '), '#練習');
});

test('normalizeTag: 中身が無くなるもの・文字列でないものは空', () => {
  assert.equal(normalizeTag(''), '');
  assert.equal(normalizeTag('#'), '');
  assert.equal(normalizeTag('   '), '');
  assert.equal(normalizeTag(null), '');
  assert.equal(normalizeTag(123), '');
});

test('normalizeTag: 途中の全角 ＃ も半角に直す', () => {
  assert.equal(normalizeTag('的前＃前半'), '#的前#前半');
});

test('cleanUpTagsArray: 揃えたうえで重複を除く', () => {
  assert.deepEqual(cleanUpTagsArray(['練習', '#練習', '＃練習', '的前']), ['#練習', '#的前']);
  assert.deepEqual(cleanUpTagsArray([null, '', ' x ']), ['#x']);
});

test('cleanUpTagsArray: 配列でなければそのまま返す', () => {
  assert.equal(cleanUpTagsArray('練習'), '練習');
  assert.equal(cleanUpTagsArray(null), null);
});

test('cleanUpSessions: タグを持つ記録だけ入れ替える', () => {
  const 元 = [{ id: 1, tags: ['a', '#a'] }, { id: 2 }, null];
  const 後 = cleanUpSessions(元);
  assert.deepEqual(後[0].tags, ['#a']);
  assert.equal(後[1], 元[1]);
  assert.equal(後[2], null);
});

// ──────────────────────────────────────────────────────────────
test('generateUniquePersonalId: 4桁で、使用中と重ならない', () => {
  const 使用中 = Array.from({ length: 8999 }, (_, i) => ({ personalId: String(1000 + i) })); // 9999 だけ空き
  const id = generateUniquePersonalId(使用中, []);
  assert.match(id, /^\d{4}$/);
  assert.equal(id, '9999');
});

// ──────────────────────────────────────────────────────────────
// ライブ記録（RTDB）の突き合わせ。ここが緩むと入力中の○×や矢所が消える。
// ──────────────────────────────────────────────────────────────
const 射手 = (o) =>
  Object.assign({ id: 'a1', name: '一人目', marks: ['', '', '', ''], lastModified: 0 }, o);

test('normalizeArrowLocations: 配列はそのまま、空文字は null に戻す', () => {
  // 送るときは空欄を '' にする（○× と同じ）。RTDB が null だらけの配列を
  // 落として添字のオブジェクトに変えてしまうのを避けるため。
  assert.deepEqual(normalizeArrowLocations(['', { x: 1, y: 2 }, ''], 3), [null, { x: 1, y: 2 }, null]);
});

test('normalizeArrowLocations: 添字のオブジェクトを配列に戻す', () => {
  assert.deepEqual(normalizeArrowLocations({ 1: { x: 5, y: 6 } }, 3), [null, { x: 5, y: 6 }, null]);
});

test('normalizeArrowLocations: 長さを揃える', () => {
  assert.deepEqual(normalizeArrowLocations([{ x: 1, y: 1 }], 3), [{ x: 1, y: 1 }, null, null]);
});

test('normalizeArrowLocations: 無いときは undefined（「情報が無い」と「空」を区別する）', () => {
  assert.equal(normalizeArrowLocations(undefined, 4), undefined);
  assert.equal(normalizeArrowLocations(null, 4), undefined);
});

test('mergeLiveArchers: 受信が新しければ受信が勝つ', () => {
  const r = mergeLiveArchers(
    [射手({ marks: ['○', '', '', ''], lastModified: 1000 })],
    [射手({ marks: ['×', '×', '', ''], lastModified: 2000 })],
    4,
    4
  );
  assert.deepEqual(r.archers[0].marks, ['×', '×', '', '']);
  assert.equal(r.changed, true);
});

test('mergeLiveArchers: 手元が新しければ、日時ごと手元が残る', () => {
  // ここが崩れると、次の更新で手元の○×が古い内容に戻る。
  // 日時まで手元のまま残すことが肝心（受信側の古い日時に巻き戻すと、
  // 次の受信で「受信のほうが新しい」と誤判定されて消える）。
  const r = mergeLiveArchers(
    [射手({ marks: ['○', '○', '', ''], lastModified: 3000 })],
    [射手({ marks: ['', '', '', ''], lastModified: 1000 })],
    4,
    4
  );
  assert.deepEqual(r.archers[0].marks, ['○', '○', '', '']);
  assert.equal(r.archers[0].lastModified, 3000, '日時が巻き戻っていない');
});

test('mergeLiveArchers: 同着なら手元を優先する', () => {
  const r = mergeLiveArchers(
    [射手({ marks: ['○', '', '', ''], lastModified: 5000 })],
    [射手({ marks: ['', '', '', ''], lastModified: 5000 })],
    4,
    4
  );
  assert.deepEqual(r.archers[0].marks, ['○', '', '', '']);
});

test('mergeLiveArchers: 手元に無い射手は受信から足す', () => {
  const r = mergeLiveArchers([], [射手({ id: 'a2' })], 4, 4);
  assert.equal(r.archers.length, 1);
  assert.equal(r.archers[0].id, 'a2');
  assert.equal(r.changed, true);
});

test('mergeLiveArchers: 受信に矢所が無ければ手元の矢所を残す', () => {
  // 古い版のアプリは矢所を送らない。配信の途中で混在しても消さないための守り。
  const 手元の矢所 = [{ x: 1, y: 1 }, null, null, null];
  const r = mergeLiveArchers(
    [射手({ lastModified: 1000, arrowLocations: 手元の矢所 })],
    [射手({ lastModified: 2000 })],
    4,
    4
  );
  assert.deepEqual(r.archers[0].arrowLocations, 手元の矢所);
});

test('mergeLiveArchers: 受信が新しく矢所を持っていれば、受信の矢所になる', () => {
  // 受け取った形（'' 混じり・添字のオブジェクト）を配列に直すのは
  // normalizeArrowLocations の役目で、突き合わせに入る前に済んでいる。
  // 電波に乗せてから戻すまでの一続きは test/liveSync.test.js で見る。
  const r = mergeLiveArchers(
    [射手({ lastModified: 1000, arrowLocations: [{ x: 1, y: 1 }, null, null, null] })],
    [射手({ lastModified: 2000, arrowLocations: [null, { x: 9, y: 9 }, null, null] })],
    4,
    4
  );
  assert.deepEqual(r.archers[0].arrowLocations, [null, { x: 9, y: 9 }, null, null]);
});

test('mergeLiveArchers: 手元が新しければ矢所も手元のまま', () => {
  const 手元の矢所 = [{ x: 2, y: 2 }, null, null, null];
  const r = mergeLiveArchers(
    [射手({ lastModified: 9000, arrowLocations: 手元の矢所 })],
    [射手({ lastModified: 1000, arrowLocations: ['', '', '', ''] })],
    4,
    4
  );
  assert.deepEqual(r.archers[0].arrowLocations, 手元の矢所);
});

test('mergeLiveArchers: 中身が同じなら changed は false（無駄な描き直しをしない）', () => {
  const r = mergeLiveArchers([射手({ lastModified: 1000 })], [射手({ lastModified: 1000 })], 4, 4);
  assert.equal(r.changed, false);
});

test('mergeLiveArchers: 人数や本数が違えば changed は true', () => {
  assert.equal(mergeLiveArchers([射手()], [], 4, 4).changed, true);
  assert.equal(mergeLiveArchers([射手()], [射手()], 4, 8).changed, true);
});

test('mergeLiveArchers: 空でも落ちない', () => {
  const r = mergeLiveArchers(null, null, 4, 4);
  assert.deepEqual(r.archers, []);
});

// ──────────────────────────────────────────────────────────────
test('generateUniquePersonalId: 卒業生の分も避ける', () => {
  const 名簿 = [{ personalId: '1111' }];
  const 卒業生 = [{ personalId: '2222' }];
  for (let i = 0; i < 200; i++) {
    const id = generateUniquePersonalId(名簿, 卒業生);
    assert.ok(id !== '1111' && id !== '2222', '重複した: ' + id);
  }
});

// ──────────────────────────────────────────────────────────────
test('ライブ名：Realtime Database で使えない字を弾く', () => {
  // 「/」は例外にならず階層の区切りとして通ってしまう。本番には
  // 「5/8」という日付を名前にしたせいで、参加も削除もできないライブが
  // 1件残っていた
  assert.equal(ライブ名に使えない字('5/8'), '/', 'スラッシュを弾く');
  assert.equal(ライブ名に使えない字('2026.5.8'), '.', 'ピリオドを弾く');
  assert.equal(ライブ名に使えない字('a#b'), '#');
  assert.equal(ライブ名に使えない字('x$y'), '$');
  assert.equal(ライブ名に使えない字('[]'), '[ ]', '複数あれば並べる');
  assert.equal(ライブ名に使えない字('改行\nあり'), '改行などの制御文字');
});

test('ライブ名：ふつうの名前は通す', () => {
  for (const 名 of ['朝練', '5月8日', '2026-05-08', 'morning practice', '一年生 交替あり']) {
    assert.equal(ライブ名に使えない字(名), null, `弾かれた: ${名}`);
  }
  assert.equal(ライブ名に使えない字(''), null, '空は別の検査で弾く');
  assert.equal(ライブ名に使えない字(undefined), null, '文字列でなければ何も言わない');
});

// ── 立の数え方（途中交代を立の単位でも入れられるようにしたときに出した） ──

test('1立は4射', () => {
  assert.strictEqual(一立の射数, 4);
});

test('立の数：半端が出たら、その端数で1立と数える', () => {
  assert.strictEqual(立の数(4), 1);
  assert.strictEqual(立の数(8), 2);
  assert.strictEqual(立の数(12), 3);
  assert.strictEqual(立の数(6), 2, '5〜6射目は2立目として数えたい');
  assert.strictEqual(立の数(1), 1);
  // 読めないものが来ても、画面が壊れないように1を返す
  assert.strictEqual(立の数(0), 1);
  assert.strictEqual(立の数(-3), 1);
  assert.strictEqual(立の数(null), 1);
  assert.strictEqual(立の数('やま'), 1);
});

test('立の頭の射：その立の1本目が何射目か（0始まり）', () => {
  assert.strictEqual(立の頭の射(1, 8), 0, '1立目は1射目から');
  assert.strictEqual(立の頭の射(2, 8), 4, '2立目は5射目から');
  assert.strictEqual(立の頭の射(3, 12), 8, '3立目は9射目から');
});

test('立の頭の射：射数からはみ出す番号は、端に寄せる', () => {
  // 画面側でも 1〜上限 に絞っているが、ここが素通しだと
  // 印の付いていない位置に交代が入り、表示が崩れる
  assert.strictEqual(立の頭の射(9, 8), 4, '2立しか無いのに9立目');
  assert.strictEqual(立の頭の射(0, 8), 0);
  assert.strictEqual(立の頭の射(-1, 8), 0);
  assert.strictEqual(立の頭の射('やま', 8), 0);
});

test('射の立番号：何射目が何立目か', () => {
  assert.strictEqual(射の立番号(0), 1, '1射目は1立目');
  assert.strictEqual(射の立番号(3), 1, '4射目は1立目');
  assert.strictEqual(射の立番号(4), 2, '5射目は2立目');
  assert.strictEqual(射の立番号(7), 2);
  assert.strictEqual(射の立番号(8), 3);
  assert.strictEqual(射の立番号(-1), 1);
});

test('立と射目は行き来できる（立の頭 → 立番号 で元に戻る）', () => {
  for (let 立 = 1; 立 <= 立の数(12); 立++) {
    assert.strictEqual(射の立番号(立の頭の射(立, 12)), 立, `${立}立目で行き来が合わない`);
  }
});

// ── 学年でまとめる（交代相手・分析の比較・人の選択で同じ分け方にする） ──

test('学年でまとめる：進級で5年になった人は「卒業生」', () => {
  // 進級すると4年生は grade:5 になる（ストアの進級処理）。
  // ここで拾えないと「5年生」という枠ができ、しかも開く学年を
  // 決め打ちしていた画面ではその枠が閉じたまま出て、中の人に辿り着けない
  const 組 = 学年でまとめる([
    { name: '一年', grade: 1 },
    { name: '五年', grade: 5 },
    { name: '七年', grade: 7 },
    { name: '卒A', isAlumni: true },
    { name: '卒B', graduationYear: 2025 },
  ]);
  const 卒 = 組.find((x) => x.題 === '卒業生');
  assert.ok(卒, '卒業生のまとまりが無い');
  assert.deepStrictEqual(
    卒.人たち.map((p) => p.name),
    ['五年', '七年', '卒A', '卒B']
  );
  assert.ok(!組.some((x) => /^[5-9]年生$/.test(x.題)), '5年生などの枠ができている');
});

test('学年でまとめる：学年が無い人は「その他/ゲスト」', () => {
  const 組 = 学年でまとめる([{ name: 'あ' }, { name: 'い', grade: null }, { name: 'う', grade: 0 }]);
  assert.strictEqual(組.length, 1);
  assert.strictEqual(組[0].題, 'その他/ゲスト');
  assert.strictEqual(組[0].人たち.length, 3);
});

test('学年でまとめる：並びは 1年生→…→その他→卒業生', () => {
  const 組 = 学年でまとめる([
    { name: '卒', grade: 5 },
    { name: '他', grade: 0 },
    { name: '三', grade: 3 },
    { name: '一', grade: 1 },
  ]);
  assert.deepStrictEqual(
    組.map((x) => x.題),
    ['1年生', '3年生', 'その他/ゲスト', '卒業生']
  );
});

test('学年でまとめる：開け閉めの覚えに使う印は文字', () => {
  // 数と文字が混ざると Set の照合が外れ、閉じたはずの枠が開く（逆も）
  const 組 = 学年でまとめる([{ grade: 2 }, { grade: 5 }, {}]);
  組.forEach((x) => assert.strictEqual(typeof x.学年, 'string', `印が文字でない: ${x.題}`));
  assert.deepStrictEqual(組.map((x) => x.学年), ['2', '0', '卒']);
});

test('学年でまとめる：空でも落ちない', () => {
  assert.deepStrictEqual(学年でまとめる([]), []);
  assert.deepStrictEqual(学年でまとめる(null), []);
  assert.deepStrictEqual(学年でまとめる([null, undefined]), []);
});
