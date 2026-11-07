'use strict';

/**
 * AI アシスタントの会話の控え（端末の localStorage）の置き場の名前と片付け。
 *
 * 前は団体ログインの会話の鍵が全団体で 1 つ（aiChatMessages_v1）で、別の団体に入り直しても
 * 前の団体の会話が残って見えた（2026-11-04 本人）。いまは鍵に団体を入れ、個人は団体＋本人にする。
 *   団体 … aiChatMessages_v1_g_{団体}
 *   個人 … aiChatMessages_v1_g_{団体}_member_{部員の id}
 * 団体の入っていない前の鍵（aiChatMessages_v1・aiChatMessages_v1_member_{id}）は、どの団体のものか
 * 分からないので消す。ログアウトのときも会話を端末から消す（共用の端末で次の人に見せない。setAuth(null)）。
 *
 * 画面から切り離してあり、置き場を差し替えて検査できる（test/chatHistory.test.js）。
 */

const 会話の鍵の頭 = 'aiChatMessages_v1';

/** 会話の鍵。団体がまだ分からないときも、ほかの団体の会話を読まない名前にする */
const 会話の鍵 = (団体, 個人, 部員id) =>
  `${会話の鍵の頭}_g_${団体 || '-'}` + (個人 ? `_member_${部員id || '-'}` : '');

/** 団体の入っていない前の鍵か */
const 前の鍵か = (鍵) => 鍵 === 会話の鍵の頭 || String(鍵).startsWith(`${会話の鍵の頭}_member_`);

/** 会話の鍵か（今の鍵も前の鍵も） */
const 会話の控えか = (鍵) => 鍵 === 会話の鍵の頭 || String(鍵).startsWith(`${会話の鍵の頭}_`);

const 置き場 = () => {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null;
  } catch {
    // 端末の設定で localStorage に触れないときは、片付けるものも無い
    return null;
  }
};

/** 置き場にある鍵を、当てはまるものだけ拾う（消しながら回ると番号がずれるので、先に拾う） */
function 鍵を拾う(場, 当てはまる) {
  const 拾った = [];
  try {
    for (let 番 = 0; 番 < 場.length; 番++) {
      const 鍵 = 場.key(番);
      if (鍵 != null && 当てはまる(鍵)) 拾った.push(鍵);
    }
  } catch {
    /* 読めなければ消さない */
  }
  return 拾った;
}

function 消す(場, 鍵たち) {
  for (const 鍵 of 鍵たち) {
    try {
      場.removeItem(鍵);
    } catch {
      /* 消せなくても先へ */
    }
  }
  return 鍵たち.length;
}

/** 団体の入っていない前の会話を消す（AI の窓を開いたとき）。消した数を返す */
function 前の会話を消す(場 = 置き場()) {
  if (!場) return 0;
  return 消す(場, 鍵を拾う(場, 前の鍵か));
}

/** 端末にある AI の会話を全部消す（ログアウトのとき）。消した数を返す */
function 会話を全部消す(場 = 置き場()) {
  if (!場) return 0;
  return 消す(場, 鍵を拾う(場, 会話の控えか));
}

module.exports = { 会話の鍵の頭, 会話の鍵, 前の鍵か, 会話の控えか, 前の会話を消す, 会話を全部消す };
