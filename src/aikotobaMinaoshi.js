'use strict';

/**
 * ライブの合言葉を作り直すかの見直し（2026-11-28 本人「案のとおり全部直す」。11/27 の点検と別の AI の調べ）。画面に触れない部分。
 *
 * ライブは団体の合言葉を名前にした枝に置き、Realtime Database の決まりは「合言葉を知っているか」しか見られない。
 * 卒業・退部・削除にした人の端末に今の合言葉が残らないよう、作り直したときに「その時点で卒業・退部だった人の id」を
 * 団体の文書（groups/{団体}.liveSecretOut）に残す。名簿（雲に届いている分）の卒業・退部の人と前の形の卒業生のうち、
 * その一覧に無い人がいれば作り直す。
 *   ・配る前（11/26 より前）に卒業・退部にした人：一覧が無いので、最初に一度作り直す
 *   ・電波の無いときに退部にした・送り直しで届いた：届いて同期済みになったあとの見直しで拾う
 *   ・名簿がまだ届いていない端末：名簿が届いたあとの見直しで拾う
 * 手元で変えただけ（未同期）の人は数えない。雲に届く前に作り直すと、その人がまだ団体を読めて新しい合言葉を受け取れる。
 * 削除した人は名簿に残らないので、削除が雲に届いたときに名指しで作り直す（storeMembers・storeSync）。
 */

const 学 = require('./gakunen');

/** 一覧に置ける数の上限（firestore.rules の liveSecretOut と同じ） */
const 一覧の上限 = 3000;

/**
 * 卒業・退部の人の id（雲に届いている分）。名簿の卒業・退部と、前の形の卒業生（alumni）。並べ替えて重ねない
 * @param {Array<object>} 名簿
 * @param {Array<object>} [卒業生]
 * @returns {string[]}
 */
function 抜けた人たち(名簿, 卒業生) {
  const 出 = new Set();
  for (const 人 of Array.isArray(名簿) ? 名簿 : []) {
    if (!人 || !人.id || 人.syncStatus === '未同期') continue;
    if (!学.現役か(人)) 出.add(String(人.id));
  }
  for (const 人 of Array.isArray(卒業生) ? 卒業生 : []) {
    if (人 && 人.id && 人.syncStatus !== '未同期') 出.add(String(人.id));
  }
  return [...出].sort();
}

/** 書く一覧（上限まで） */
const 書く一覧 = (抜けた) => (抜けた || []).slice(0, 一覧の上限);

/**
 * 作り直しが要るか。合言葉が無ければ要らない（次に用意するときに新しく作る）。
 * @param {{liveSecret?: string, liveSecretOut?: string[]}} 団体の中身
 * @param {string[]} 抜けた
 */
function 作り直しが要るか(団体の中身, 抜けた) {
  const 中 = 団体の中身 || {};
  if (typeof 中.liveSecret !== 'string' || !中.liveSecret) return false;
  const 外した = new Set(Array.isArray(中.liveSecretOut) ? 中.liveSecretOut.map(String) : []);
  // 上限を超えた分は一覧に書けないので見ない（見ると、作り直すたびにまた要ると出て止まらない）
  return 書く一覧(抜けた).some((id) => !外した.has(id));
}

module.exports = { 一覧の上限, 抜けた人たち, 作り直しが要るか, 書く一覧 };
