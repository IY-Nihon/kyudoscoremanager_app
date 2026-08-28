/**
 * 不具合の便り（src/errorReport.js）。
 *
 *   npm test
 *
 * 電波が切れている最中にこそ失敗するので、「送れなかったぶんが残ること」と
 * 「つながったら出し直すこと」を重点的に見る。
 * 便りに氏名や的中が混ざらないことも、ここで押さえる。
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const {
  行動を残す,
  行動の控え,
  行動を捨てる,
  不具合の便を組む,
  同じ不具合か,
  貯めに足す,
  貯めから消す,
  送り係をつくる,
  控えの数,
  貯めの上限,
} = require('../src/errorReport');

test('行動：残した順に控え、古いものから捨てる', () => {
  行動を捨てる();
  for (let i = 0; i < 控えの数 + 5; i++) 行動を残す('動き' + i);
  const c = 行動の控え();
  assert.strictEqual(c.length, 控えの数, '控えが際限なく増えている');
  assert.strictEqual(c[c.length - 1].名, '動き' + (控えの数 + 4), '新しいほうが残る');
  assert.strictEqual(c[0].名, '動き5', '古いほうから捨てる');
});

test('行動：控えを書き換えても、中の控えは変わらない', () => {
  行動を捨てる();
  行動を残す('保存', '3件');
  const c = 行動の控え();
  c[0].名 = '書き換えた';
  assert.strictEqual(行動の控え()[0].名, '保存');
});

test('行動：名前が無いものは残さない', () => {
  行動を捨てる();
  行動を残す('');
  行動を残す(null);
  assert.strictEqual(行動の控え().length, 0);
});

test('行動：長すぎる名前と中身は切り詰める（1件の便りが重くならないように）', () => {
  行動を捨てる();
  行動を残す('あ'.repeat(200), 'い'.repeat(500));
  const x = 行動の控え()[0];
  assert.strictEqual(x.名.length, 60);
  assert.strictEqual(x.中身.length, 120);
});

test('便り：Error から起きたこと・符号・跡を取り出す', () => {
  行動を捨てる();
  行動を残す('分析を開く');
  const e = new Error('permission-denied');
  e.code = 'permission-denied';
  const 便 = 不具合の便を組む(e, {
    出どころ: 'クラウドへ同期',
    団体id: '000910',
    役割: 'group',
    版: '2026-08-28',
    時刻: 1000,
  });
  assert.strictEqual(便.起きたこと, 'permission-denied');
  assert.strictEqual(便.符号, 'permission-denied');
  assert.ok(便.跡.length > 0, '跡（stack）が入っていない');
  assert.strictEqual(便.出どころ, 'クラウドへ同期');
  assert.strictEqual(便.時刻, 1000);
  assert.strictEqual(便.回数, 1);
  assert.deepStrictEqual(
    便.行動.map((x) => x.名),
    ['分析を開く'],
    '直前の行動が入っていない'
  );
});

test('便り：文字列だけ投げられても組める', () => {
  行動を捨てる();
  const 便 = 不具合の便を組む('よく分からない失敗', { 出どころ: 'どこか' });
  assert.strictEqual(便.起きたこと, 'よく分からない失敗');
  assert.strictEqual(便.符号, '');
});

test('便り：中身が空でも落ちない', () => {
  行動を捨てる();
  const 便 = 不具合の便を組む(null, null);
  assert.strictEqual(便.出どころ, '不明');
  assert.strictEqual(便.起きたこと, '');
  assert.ok(便.id, 'idが無いと、送れたぶんを貯めから消せない');
});

test('便り：長い跡は切り詰める', () => {
  行動を捨てる();
  const e = new Error('長い');
  e.stack = 'x'.repeat(5000);
  assert.ok(不具合の便を組む(e, {}).跡.length <= 2001);
});

test('便り：回線が切れているときは、そう書いておく', () => {
  行動を捨てる();
  assert.strictEqual(不具合の便を組む('失敗', { 回線: false }).回線, 'つながっていない');
  assert.strictEqual(不具合の便を組む('失敗', {}).回線, 'つながっている');
});

test('便り：氏名や的中を渡していない限り、便りに人の中身は入らない', () => {
  // 行動の控えに入るのは、呼ぶ側が渡した名前と手がかりだけ。
  // 記録の中身を渡さない約束が守られていれば、便りに名簿は出ない
  行動を捨てる();
  行動を残す('記録を保存', '射手8人');
  const 文 = JSON.stringify(不具合の便を組む(new Error('失敗'), { 出どころ: '保存' }));
  assert.ok(!文.includes('○'), '的中が混ざっている');
  assert.ok(!文.includes('×'), '的中が混ざっている');
  assert.strictEqual(文.includes('射手8人'), true, '手がかりは残ってよい');
});

// ── 貯め ──────────────────────────────────────────

const 便 = (o) => Object.assign({ id: 'a', 時刻: 1000, 出どころ: 'X', 起きたこと: 'Y' }, o);

test('貯め：同じ不具合が続いたら、件数を増やさず回数を増やす', () => {
  let 貯め = 貯めに足す([], 便({ id: 'a', 時刻: 1000 }), 1000);
  貯め = 貯めに足す(貯め, 便({ id: 'b', 時刻: 1500 }), 1500);
  assert.strictEqual(貯め.length, 1, '同じ不具合で貯めが埋まっている');
  assert.strictEqual(貯め[0].回数, 2);
});

test('貯め：間が空いたら別の不具合として貯める', () => {
  let 貯め = 貯めに足す([], 便({ id: 'a', 時刻: 1000 }), 1000);
  貯め = 貯めに足す(貯め, 便({ id: 'b', 時刻: 1000 + 60001 }), 1000 + 60001);
  assert.strictEqual(貯め.length, 2);
});

test('貯め：出どころが違えば別の不具合', () => {
  let 貯め = 貯めに足す([], 便({ id: 'a', 出どころ: '同期' }), 1000);
  貯め = 貯めに足す(貯め, 便({ id: 'b', 出どころ: '保存' }), 1000);
  assert.strictEqual(貯め.length, 2);
});

test('貯め：上限を超えたら古いほうから捨てる', () => {
  let 貯め = [];
  for (let i = 0; i < 貯めの上限 + 5; i++)
    貯め = 貯めに足す(貯め, 便({ id: 'id' + i, 起きたこと: 'Y' + i }), 1000);
  assert.strictEqual(貯め.length, 貯めの上限);
  assert.strictEqual(貯め[貯め.length - 1].id, 'id' + (貯めの上限 + 4), '新しいほうが残る');
});

test('貯め：足しても元の配列は変わらない', () => {
  const 元 = [便({ id: 'a' })];
  貯めに足す(元, 便({ id: 'b', 出どころ: 'Z' }), 1000);
  assert.strictEqual(元.length, 1);
});

test('貯め：送れたぶんを id で消せる', () => {
  const 貯め = [便({ id: 'a' }), 便({ id: 'b' })];
  assert.deepStrictEqual(
    貯めから消す(貯め, 'a').map((x) => x.id),
    ['b']
  );
  assert.strictEqual(貯めから消す(null, 'a').length, 0);
});

test('同じ不具合か：中身が欠けていても落ちない', () => {
  assert.strictEqual(同じ不具合か(null, 便({}), 1000), false);
  assert.strictEqual(同じ不具合か(便({}), null, 1000), false);
});

// ── 送り係 ────────────────────────────────────────

const 台をつくる = (失敗する) => {
  let 貯め = [];
  const 送った = [];
  return {
    送った,
    見る: () => 貯め,
    係: 送り係をつくる({
      送る: async (便) => {
        if (失敗する()) throw new Error('つながっていない');
        送った.push(便);
      },
      読む: () => 貯め,
      書く: (x) => {
        貯め = x;
      },
      いま: () => 1000,
    }),
  };
};

test('送り係：送れたら貯めない', async () => {
  const 台 = 台をつくる(() => false);
  assert.strictEqual(await 台.係.出す(便({ id: 'a' })), true);
  assert.strictEqual(台.送った.length, 1);
  assert.strictEqual(台.見る().length, 0);
});

test('送り係：送れなかったら貯める（捨てない）', async () => {
  const 台 = 台をつくる(() => true);
  assert.strictEqual(await 台.係.出す(便({ id: 'a' })), false);
  assert.strictEqual(台.見る().length, 1, '送れなかった便りが消えている');
});

test('送り係：つながったら、貯まっているぶんを出し直す', async () => {
  let 切れている = true;
  const 台 = 台をつくる(() => 切れている);
  await 台.係.出す(便({ id: 'a', 出どころ: 'A' }));
  await 台.係.出す(便({ id: 'b', 出どころ: 'B' }));
  assert.strictEqual(台.見る().length, 2);

  切れている = false;
  const 数 = await 台.係.溜まりを流す();
  assert.strictEqual(数, 2);
  assert.strictEqual(台.見る().length, 0, '出せたのに貯めに残っている');
  assert.deepStrictEqual(
    台.送った.map((x) => x.id),
    ['a', 'b'],
    '古いほうから出す'
  );
});

test('送り係：流している途中で失敗したら、そこで止めて残す', async () => {
  let 回 = 0;
  let 貯め = [便({ id: 'a', 出どころ: 'A' }), 便({ id: 'b', 出どころ: 'B' })];
  const 係 = 送り係をつくる({
    送る: async () => {
      if (1 === ++回) return;
      throw new Error('また切れた');
    },
    読む: () => 貯め,
    書く: (x) => {
      貯め = x;
    },
  });
  assert.strictEqual(await 係.溜まりを流す(), 1);
  assert.deepStrictEqual(
    貯め.map((x) => x.id),
    ['b'],
    '送れた1件だけ消え、残りは残る'
  );
});

test('送り係：貯めが読めない端末でも落ちない', async () => {
  const 係 = 送り係をつくる({
    送る: async () => {
      throw new Error('だめ');
    },
    読む: () => {
      throw new Error('保存領域が使えない');
    },
    書く: () => {},
  });
  assert.strictEqual(await 係.出す(便({})), false, '例外が外に出ている');
  assert.strictEqual(await 係.溜まりを流す(), 0);
});

// ── 送るときの形 ──────────────────────────────────

const { 外向きの形 } = require('../src/errorReport');
const fs = require('node:fs');
const path = require('node:path');

test('送る形：中の日本語の名前を、英字に直して出す', () => {
  行動を捨てる();
  行動を残す('保存', '8人');
  const 出 = 外向きの形(不具合の便を組む(new Error('だめ'), { 出どころ: '同期', 団体id: '000910', 時刻: 5 }));
  assert.strictEqual(出.where, '同期');
  assert.strictEqual(出.message, 'だめ');
  assert.strictEqual(出.at, 5);
  assert.strictEqual(出.groupId, '000910');
  assert.strictEqual(出.online, true);
  assert.deepStrictEqual(出.trail, [{ at: 出.trail[0].at, name: '保存', detail: '8人' }]);
});

test('送る形：中身が空でも、項目は欠けない（決まりが項目を数える）', () => {
  const 出 = 外向きの形(null);
  assert.deepStrictEqual(Object.keys(出).sort(), [
    'at', 'code', 'count', 'device', 'groupId', 'id', 'message',
    'online', 'role', 'stack', 'trail', 'version', 'where',
  ]);
});

test('送る形：回線が切れていたら online は false', () => {
  assert.strictEqual(外向きの形(不具合の便を組む('x', { 回線: false })).online, false);
});

test('決まり（firestore.rules）が数える項目と、送る形が一致する', () => {
  // 決まりは hasOnly で項目を数える。片方だけ増やすと、その日から
  // 「送っているのに1件も届かない」状態になり、しかも誰も気づけない
  const 決まり = fs.readFileSync(path.join(__dirname, '..', 'firestore.rules'), 'utf8');
  const i = 決まり.indexOf('match /errorReports/');
  assert.ok(i > 0, 'firestore.rules に errorReports が無い');
  const 塊 = 決まり.slice(i, 決まり.indexOf('}', 決まり.indexOf('allow read', i)));
  const 並び = 塊.slice(塊.indexOf('hasOnly(['), 塊.indexOf('])'));
  const 決まりの項目 = [...並び.matchAll(/'([a-zA-Z]+)'/g)].map((m) => m[1]).sort();
  const 送る項目 = Object.keys(外向きの形(不具合の便を組む('x', {}))).concat(['createdAt']).sort();
  assert.deepStrictEqual(送る項目, 決まりの項目, '送る項目と決まりの項目が食い違っている');
});

// ── 時間切れ ──────────────────────────────────────

const { 間に合わなければ諦める } = require('../src/errorReport');

test('時間切れ：返ってこない送信は諦めて、貯めに回せるようにする', async () => {
  // Firestore は電波が無いと「失敗」ではなく「返ってこない」になる。
  // 待ち続けると、アプリを閉じた時点で便りごと消える
  const 返らない = new Promise(() => {});
  await assert.rejects(() => 間に合わなければ諦める(返らない, 5, (f) => setTimeout(f, 0)), /時間内に送れなかった/);
});

test('時間切れ：間に合えば、そのまま通す', async () => {
  const r = await 間に合わなければ諦める(Promise.resolve('できた'), 1000);
  assert.strictEqual(r, 'できた');
});

test('時間切れ：先に失敗したら、その失敗をそのまま返す', async () => {
  await assert.rejects(
    () => 間に合わなければ諦める(Promise.reject(new Error('権限がない')), 1000),
    /権限がない/
  );
});

test('時間切れ：諦めたあとに返ってきても、二重に解決しない', async () => {
  let 遅い;
  const 約束 = new Promise((応) => {
    遅い = 応;
  });
  await assert.rejects(() => 間に合わなければ諦める(約束, 5, (f) => setTimeout(f, 0)));
  遅い('あとから来た');
  await new Promise((r) => setTimeout(r, 10));
  // ここで落ちなければよい（二重解決は Node が握りつぶすので、落ちないことが検査）
  assert.ok(true);
});

// ── 送りすぎない歯止め ────────────────────────────

const { 一度に送る上限 } = require('../src/errorReport');

test('歯止め：同じ不具合を続けて出しても、送るのは1回だけ', async () => {
  // 描画の繰り返しの中で落ちると、同じ不具合が毎秒のように起きる。
  // 歯止めが無いと Firestore へ何百通も書きにいってしまう
  const 台 = 台をつくる(() => false);
  await 台.係.出す(便({ id: 'a', 時刻: 1000 }));
  await 台.係.出す(便({ id: 'b', 時刻: 1000 }));
  await 台.係.出す(便({ id: 'c', 時刻: 1000 }));
  assert.strictEqual(台.送った.length, 1, '同じ不具合を何通も送っている');
  assert.strictEqual(台.見る().length, 0, '送らなかったぶんを貯めている（貯めも埋まる）');
});

test('歯止め：違う不具合なら、それぞれ送る', async () => {
  const 台 = 台をつくる(() => false);
  await 台.係.出す(便({ id: 'a', 出どころ: 'A' }));
  await 台.係.出す(便({ id: 'b', 出どころ: 'B' }));
  assert.strictEqual(台.送った.length, 2);
});

test('歯止め：時間が空けば、同じ不具合でもまた送る', async () => {
  let 時 = 1000;
  let 送った = [];
  const 係 = 送り係をつくる({
    送る: async (便) => {
      送った.push(便);
    },
    読む: () => [],
    書く: () => {},
    いま: () => 時,
  });
  await 係.出す(便({ id: 'a', 時刻: 1000 }));
  時 = 1000 + 60001;
  await 係.出す(便({ id: 'b', 時刻: 時 }));
  assert.strictEqual(送った.length, 2, '一度きりで止まっている');
});

test('歯止め：1回の起動で送る数に上限がある', async () => {
  const 台 = 台をつくる(() => false);
  for (let i = 0; i < 一度に送る上限 + 5; i++)
    await 台.係.出す(便({ id: 'id' + i, 出どころ: 'ところ' + i }));
  assert.strictEqual(台.送った.length, 一度に送る上限);
});

// ── 受け取った便りをまとめる ──────────────────────

const { 便りをまとめる } = require('../src/errorReport');

const 受 = (o) =>
  Object.assign({ id: 'x', at: 1000, where: '同期', message: 'だめ', count: 1, groupId: 'g1', version: 'v1', device: 'A' }, o);

test('まとめ：出どころと起きたことが同じなら1つに束ねる', () => {
  const r = 便りをまとめる([受({ id: 'a' }), 受({ id: 'b', at: 2000 }), 受({ id: 'c', where: '保存' })]);
  assert.strictEqual(r.length, 2);
  assert.strictEqual(r[0].件数, 2);
  assert.strictEqual(r[0].where, '同期');
});

test('まとめ：のべ回数は、端末側でまとめた回数も足す', () => {
  const r = 便りをまとめる([受({ count: 3 }), 受({ count: 2 })]);
  assert.strictEqual(r[0].件数, 2, '便りの数');
  assert.strictEqual(r[0].のべ回数, 5, '実際に起きた数');
});

test('まとめ：多い順に並ぶ', () => {
  const r = 便りをまとめる([
    受({ message: '少ない' }),
    受({ message: '多い', count: 9 }),
    受({ message: '中くらい', count: 4 }),
  ]);
  assert.deepStrictEqual(
    r.map((x) => x.message),
    ['多い', '中くらい', '少ない']
  );
});

test('まとめ：団体・版・端末は重なりを取り除いて数える', () => {
  const r = 便りをまとめる([
    受({ groupId: 'g1', version: 'v1', device: 'A' }),
    受({ groupId: 'g1', version: 'v2', device: 'B' }),
    受({ groupId: 'g2', version: 'v1', device: 'A' }),
  ]);
  assert.deepStrictEqual(r[0].団体.sort(), ['g1', 'g2']);
  assert.deepStrictEqual(r[0].版.sort(), ['v1', 'v2']);
  assert.deepStrictEqual(r[0].端末.sort(), ['A', 'B']);
});

test('まとめ：例にはいちばん新しいものを残す（いまの姿に近い）', () => {
  const r = 便りをまとめる([受({ id: '古', at: 100 }), 受({ id: '新', at: 900 }), 受({ id: '中', at: 500 })]);
  assert.strictEqual(r[0].例.id, '新');
  assert.strictEqual(r[0].新しい, 900);
  assert.strictEqual(r[0].古い, 100);
});

test('まとめ：中身が欠けていても落ちない', () => {
  assert.deepStrictEqual(便りをまとめる(null), []);
  assert.deepStrictEqual(便りをまとめる([null, undefined]), []);
  const r = 便りをまとめる([{}]);
  assert.strictEqual(r.length, 1);
  assert.strictEqual(r[0].のべ回数, 1);
  assert.strictEqual(r[0].古い, 0);
});
