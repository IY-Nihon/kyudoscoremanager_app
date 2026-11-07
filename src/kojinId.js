/**
 * 個人ID（部員が団体ID と一緒に打つ合言葉）の形（2026-11-03 本人）。
 *
 * 前は数字 4 桁（1 万通り）で、団体ID を知った人がプログラムで順に試すと数分で誰かとして入れた。
 * 見間違えやすい字（I・L・O と 0・1）を除いた大文字と数字の 6 字（31 の 6 乗＝約 9 億通り）にする。
 * 打った字は大文字にそろえる（src/totonoeru.js の IDを整える）ので、大文字と小文字は分けない。
 *
 * 今ある 4 桁は 古い形を使える終わり までは使える（決まりの member_claims も同じ日で止める）。
 * そのあいだに団体の持ち主が設定から新しい ID を配る。過ぎたら持ち主の端末が残りを自動で替える。
 * 画面から切り離してあり、そのまま検査できる（test/kojinId.test.js）。
 */
'use strict';

/** 使う字（31 種）。I・L・O・0・1 を除く */
const 使う字 = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const 長さ = 6;
const 新しい形 = new RegExp(`^[${使う字}]{${長さ}}$`);
const 古い形 = /^\d{4}$/;

/**
 * 4 桁の個人ID を使える終わり（この日の 0 時 UTC）。配信日＋1 か月に書き直す。
 * firestore.rules の legacyIdUsable と同じ日にする（test/kojinId.test.js が見張る）
 */
const 古い形を使える終わり = '2026-12-03';
const 古い形を使えるか = (今 = Date.now()) => 今 < Date.parse(古い形を使える終わり + 'T00:00:00Z');

/** 今使ってよい形か（新しい 6 字か、終わりの前の 4 桁） */
const 使える個人IDか = (id, 今) =>
  typeof id === 'string' && (新しい形.test(id) || (古い形.test(id) && 古い形を使えるか(今)));

/** 逆引き表に載せる形か（4 桁は終わりまで載せておく） */
const 個人IDの形か = (id) => typeof id === 'string' && (新しい形.test(id) || 古い形.test(id));

/**
 * 新しい個人ID を作る。使っている ID とは重ねない。推測できない乱数を使う（Math.random は使わない）
 * @param {string[]} 使っている
 * @param {{getRandomValues: Function}} [乱数源]
 */
function 個人IDを作る(使っている = [], 乱数源) {
  const 乱数 = 乱数源 || (typeof globalThis !== 'undefined' ? globalThis.crypto : undefined);
  if (!乱数 || typeof 乱数.getRandomValues !== 'function')
    throw new Error('この端末では個人IDを作れません（乱数を用意できません）');
  const 使用中 = new Set(使っている);
  for (let 回 = 0; 回 < 100; 回++) {
    const 桶 = new Uint8Array(長さ);
    乱数.getRandomValues(桶);
    // 248 以上は捨てて偏りを無くす（256 は 31 で割り切れない。248 = 31 × 8）
    if ([...桶].some((x) => x >= 248)) continue;
    const 候補 = [...桶].map((x) => 使う字[x % 使う字.length]).join('');
    if (!使用中.has(候補)) return 候補;
  }
  throw new Error('個人IDを作れませんでした');
}

/**
 * 逆引き表（groups/{団体}/member_lookup/{鍵}）の行の形（2026-11-07。レビューの指摘 1）。
 * 新しい版は行に 形: 2 を付け、行を消さずに「消した」印に書き換える。決まり（firestore.rules）は 形 の無い書き込みと
 * 端末からの削除を断る。前の版の端末（開いたままのタブ）は、名簿に個人ID が無いのを見ると逆引き表の行を全部消して
 * 作り直したので、その書き込みを一括ごと断って壊させない
 */
const 逆引きの形 = 2;
/** 消した行（読む側は無いものとして扱う） */
const 消した行 = () => ({ memberId: '', 消した: true, 形: 逆引きの形, updatedAt: new Date() });
/** 使える行か（消した印・memberId の無い行は無いものとして扱う） */
const 生きている行か = (中身) => !!(中身 && 中身.消した !== true && 中身.memberId);

module.exports = {
  逆引きの形,
  消した行,
  生きている行か,
  使う字,
  長さ,
  新しい形,
  古い形,
  古い形を使える終わり,
  古い形を使えるか,
  使える個人IDか,
  個人IDの形か,
  個人IDを作る,
};
