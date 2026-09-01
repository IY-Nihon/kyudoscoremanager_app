/**
 * Module ID: localTrim
 *
 * 端末に残す記録を選ぶ。
 *
 * ■ なぜ要るか
 * 記録は1件およそ20KB（射手32人で18.6KB。うち archers が14.5KB）。
 * 本番の最大の団体は110件で2.2MB あり、部員とごみ箱を足すと2.35MB。
 * localStorage の目安は5MB、Android の AsyncStorage は既定6MB なので、
 * 週3回の練習だと1年前後で上限に当たる。
 *
 * 上限に当たると書き込みが失敗し、端末の控えが黙って古いまま残る。
 * そうなる前に、古いものを端末から外す（雲には残るので、次に開いたときに
 * 取り直せる）。
 *
 * ■ 落としてはいけないもの
 * まだ雲へ送れていない記録。落とすと、その練習ぶんがどこにも無くなる。
 * 予算を超えていても、送れていないものは必ず残す。ここが唯一の禁じ手。
 *
 * 画面にも Firebase にも触れない純粋な関数なので、そのまま検査できる
 * （test/localTrim.test.js）。
 */
'use strict';

/**
 * 端末に残す記録の目安（バイト）。
 *
 * localStorage 5MB のうち、記録に充てる分。部員・ごみ箱・設定などで
 * 200KB ほど使うので、その手前で止める
 */
const 記録の予算 = 1500000;

/** その記録が、まだ雲へ送れていないか */
/**
 * @param {any} 記録
 * @param {number} 最後に送った時刻
 * @returns {boolean}
 */
function 送れていないか(記録, 最後に送った時刻) {
  if (!記録) return !1;
  if ('未同期' === 記録.syncStatus) return !0;
  // 送った時刻より後に触られていれば、まだ届いていない見込み。
  // syncStatus が付かない道（一括の同期）でもここで拾える
  const 触った = 'number' == typeof 記録.lastModified ? 記録.lastModified : 0;
  return 触った > ('number' == typeof 最後に送った時刻 ? 最後に送った時刻 : 0);
}

/** 記録の新しさ。日付が読めないものは0にして、古い側へ寄せる */
function 新しさ(記録) {
  if (!記録) return 0;
  for (const 鍵 of ['lastModified', 'date', 'createdAt']) {
    const v = 記録[鍵];
    if ('number' == typeof v) return v;
    if ('string' == typeof v) {
      const t = Date.parse(v);
      if (!isNaN(t)) return t;
    }
  }
  return 0;
}

/**
 * 端末に残す記録を選ぶ。
 *
 * 送れていないものは全部残し、残りは新しい順に予算まで。
 * 並び順は元のまま返す（画面が並べ直す前提を崩さないため）。
 */
/**
 * @param {Array|null|undefined} 記録たち
 * @param {{最後に送った時刻?:number, 予算?:number}} [選び]
 * @returns {Array}
 */
function 端末に残す記録(記録たち, 選び) {
  const 一覧 = Array.isArray(記録たち) ? 記録たち : [];
  const { 最後に送った時刻, 予算 } = Object.assign({ 最後に送った時刻: 0, 予算: 記録の予算 }, 選び);
  if (!一覧.length) return 一覧;

  // 件数が少ないうちは、測るまでもなく予算に収まる。
  // 1件あたりの大きめの見当（60KB。実測の最大がおよそ57KB）で見切る
  if (一覧.length * 60000 <= 予算) return 一覧;

  const 残す = new Set();
  let 使った = 0;

  // ① 送れていないものは、予算に関わらず残す
  for (const 記録 of 一覧)
    if (送れていないか(記録, 最後に送った時刻)) {
      残す.add(記録);
      使った += 目方(記録);
    }

  // ② 残りは新しい順に、予算に収まるまで
  const 残り = 一覧.filter((x) => !残す.has(x)).sort((a, b) => 新しさ(b) - 新しさ(a));
  for (const 記録 of 残り) {
    const m = 目方(記録);
    if (使った + m > 予算) break;
    (残す.add(記録), (使った += m));
  }

  return 一覧.filter((x) => 残す.has(x));
}

/**
 * 一度測った目方は覚えておく。
 *
 * この関数は保存のたびに呼ばれ、ライブ中は○×を入れるたびに保存が走る。
 * 毎回すべての記録を JSON にすると、実測で110件のとき1回8.6ミリ秒かかり、
 * 遅い端末では○×の反応が鈍る。記録は書き換えるたびに別の入れ物になるので、
 * 入れ物そのものを鍵にして覚えておけば、変わった記録だけを測り直せる
 */
const 覚え = typeof WeakMap === 'function' ? new WeakMap() : null;

/** その記録が端末で占める見当（バイト） */
function 目方(記録) {
  if (!記録 || 'object' != typeof 記録) return 0;
  if (覚え && 覚え.has(記録)) return 覚え.get(記録);
  let n = 0;
  try {
    n = JSON.stringify(記録).length;
  } catch {
    n = 0;
  }
  if (覚え) 覚え.set(記録, n);
  return n;
}

/** 何件を端末から外したか。知らせに使う */
function 外した数(元の一覧, 残した一覧) {
  const 元 = Array.isArray(元の一覧) ? 元の一覧.length : 0;
  const 残 = Array.isArray(残した一覧) ? 残した一覧.length : 0;
  return Math.max(0, 元 - 残);
}

module.exports = { 端末に残す記録, 送れていないか, 新しさ, 目方, 外した数, 記録の予算 };
