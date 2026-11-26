'use strict';

/**
 * 団体のパスワードを変える（設定。2026-11-26 U1 本人「管理者モードでなくても出す」）の、画面に触れない部分。
 * 窓は src/GroupPasswordModal.js、変える処理は店の changeGroupPassword（今のパスワードで確かめてから変える）。
 *
 * 変えると Firebase がほかの端末のログインを切る（ほかの端末の団体アカウントはログインし直し）。
 * 管理者の合言葉（src/kanriAikotoba.js）は別のもので、変わらない。
 */

/** Firebase が受け付ける最短（団体の登録と同じ） */
const 最短 = 6;

/**
 * 3 つの欄を確かめる。空・短い・同じ・食い違いを欄ごとの字で返す（無ければ {}）。欄の下に出す（U5）
 * @param {{今?: string, 新しい?: string, もう一度?: string}} 欄
 * @returns {{今?: string, 新しい?: string, もう一度?: string}}
 */
function 入れ替えを確かめる(欄) {
  const 今 = String((欄 && 欄.今) || '');
  const 新しい = String((欄 && 欄.新しい) || '');
  const もう一度 = String((欄 && 欄.もう一度) || '');
  const 誤り = {};
  if (!今) 誤り.今 = '今のパスワードを入力してください';
  if (!新しい) 誤り.新しい = '新しいパスワードを入力してください';
  else if (新しい.length < 最短) 誤り.新しい = `${最短}文字以上にしてください`;
  else if (今 && 新しい === 今) 誤り.新しい = '今と同じパスワードです';
  if (!誤り.新しい && もう一度 !== 新しい) 誤り.もう一度 = '同じパスワードを2回入力してください';
  return 誤り;
}

/**
 * 変える処理の誤り（Firebase の code）を、どの欄に何と出すかにする
 * @returns {{欄: '今'|'新しい'|null, 文: string}}
 */
function 誤りの訳(誤り) {
  const 符号 = String((誤り && 誤り.code) || '');
  if (['auth/wrong-password', 'auth/invalid-credential', 'auth/invalid-login-credentials'].includes(符号))
    return { 欄: '今', 文: 'パスワードが違います' };
  if (符号 === 'auth/too-many-requests')
    return { 欄: '今', 文: '間違いが続いたので、しばらく止めています。時間を置いてもう一度お試しください' };
  if (符号 === 'auth/weak-password') return { 欄: '新しい', 文: `${最短}文字以上にしてください` };
  if (符号 === 'auth/network-request-failed')
    return { 欄: null, 文: '通信できませんでした。電波の良い場所でもう一度お試しください' };
  if (誤り && 誤り.欄) return { 欄: 誤り.欄, 文: String(誤り.message || '') };
  return { 欄: null, 文: '変えられませんでした。時間を置いてもう一度お試しください' };
}

module.exports = { 最短, 入れ替えを確かめる, 誤りの訳 };
