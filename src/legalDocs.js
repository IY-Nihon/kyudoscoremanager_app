/**
 * 規約とプライバシーポリシーの置き場所と、同意の版。
 *
 * 同意は「いつの版に同意したか」を残す必要がある。版を上げたときに、
 * 誰にもう一度同意を求めるべきかが分からなくなるため。
 *
 * 文書そのものは docs/legal/ にあり、ホームページで公開している。
 * アプリからはそちらへ飛ばす（アプリ内に写しを持つと、直したときに
 * 二重管理になって食い違う）。
 */
'use strict';

/** 文書を改定したら、この版を上げる。上げると同意を取り直す */
const 同意の版 = '2026-08-28';

// 文書はホームページ（Netlify）に置く。アプリ本体（Firebase Hosting）は
// 知らないパスを index.html に回す設定なので、そちらに置くと
// 「200 が返るのにアプリが表示される」という分かりにくい壊れ方をする
const ホームページ = 'https://kyudoscoremanagehomepage.netlify.app';
const 規約のURL = ホームページ + '/terms.html';
const プライバシーのURL = ホームページ + '/privacy.html';

/**
 * 同意を取り直す必要があるか。
 * @param {string|undefined} 同意した版 保存されている版
 */
function 同意を取り直すか(同意した版) {
  if (!同意した版) return true;
  return String(同意した版) !== 同意の版;
}

/** 保存する形。いつ・どの版に同意したかを残す */
function 同意の記録() {
  return { 同意の版, 同意した日時: Date.now() };
}

/**
 * すでに使っている団体ぶんの記録。
 *
 * 同意の画面を入れる前から使っている団体からは、運営者が口頭で同意を得ている。
 * その事実を残すための形。アプリの中で押してもらったものと取り違えないよう、
 * 取り方を必ず書く（あとから「いつ・どうやって同意を得たか」を説明できるように）。
 */
function 口頭での同意の記録() {
  return { 同意の版, 同意した日時: Date.now(), 同意の取り方: '口頭（画面を入れる前からの団体）' };
}


/** 文書をブラウザで開く。アプリの外へ出るので、別の窓で開く */
function 開く(URL) {
  if (typeof window !== 'undefined' && window.open) {
    window.open(URL, '_blank', 'noopener,noreferrer');
    return;
  }
  // ネイティブでは Linking を使う
  try {
    require('react-native').Linking.openURL(URL);
  } catch (e) {
    console.warn('[legalDocs] 開けませんでした:', e);
  }
}
module.exports = {
  同意の版,
  規約のURL,
  プライバシーのURL,
  同意を取り直すか,
  同意の記録,
  口頭での同意の記録,
  開く,
};
