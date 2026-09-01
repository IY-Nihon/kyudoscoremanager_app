/**
 * Module ID: liveSecret
 *
 * ライブ記録を置く枝の名前を決める。
 *
 * ■ なぜ団体IDを使わないのか
 * ライブは Realtime Database に置く。RTDB の決まりからは Firestore の
 * 所属情報を読めないので、「この団体の人か」を確かめる術が無く、
 * 決まりは auth != null（ログインしている誰か）にせざるを得ない。
 * 部員は匿名ログインなので、これは実質「誰でも」に近い。
 *
 * 枝の名前が団体ID（6桁の数字）のままだと、順に試すだけで他団体の
 * 練習中の的中を覗いたり書き換えたりできてしまう。
 *
 * そこで枝の名前を、団体ごとの推測できない合言葉に変える。合言葉は
 * Firestore の groups/{団体} に置く。そこは所属を確かめてからでないと
 * 読めない（firestore.rules の canAccess）ので、正しい部員だけが知る。
 *
 * ■ これは「権限の確認」ではない
 * 合言葉を一度知った人は、退部したあとも覚えていれば入れる。
 * 本来は Firebase Auth のカスタムクレームに団体IDを載せ、RTDB 側で
 * auth.token.groupId === $枝 と書くのが正しい。ただし発行にサーバーが
 * 要り、いまの無料枠では動かせない。その手前までの改善として置いている。
 *
 * ■ 従量課金へ移るときの道筋
 * 「利用者が作られたとき」の引き金では付けられない。部員はまず匿名で
 * ログインし、そのあと個人IDを示して member_claims を書くことで所属を
 * 証明するので、利用者が作られる時点ではどの団体かがまだ決まっていない。
 * 引き金は member_claims/{uid} の書き込みに掛ける。
 *
 *   1. member_claims/{uid} が書かれたら setCustomUserClaims(uid, { groupId })
 *   2. 団体アカウント（メール）側は group_accounts の email 突き合わせで同じく付ける
 *   3. 手元は付いた直後に getIdToken(true) で取り直す。取り直さないと
 *      RTDB の接続は古い切符のままで、新しい決まりに弾かれる
 *   4. 名簿から外れた人・member_claims が消えた人はクレームも消す。
 *      消さないと「退部後も入れる」がそのまま残り、直した意味が無くなる
 *   5. 決まりを auth.token.groupId === $枝 に変える。$枝 を団体IDへ戻すなら、
 *      この道具ごと外す。合言葉のまま残すなら、両方を満たす形にする
 *
 * 4 が要点。いまの合言葉方式と同じ穴を持ち越さないために要る。
 *
 * 決まり側では、枝の名前が短いものを禁じている（database.rules.json）。
 * これで、古い形の live_sessions/{6桁} は読み書きごと通らなくなる。
 *
 * 画面にも Firebase にも触れない純粋な関数なので、そのまま検査できる
 * （test/liveSecret.test.js）。
 */
'use strict';

/** 決まり（database.rules.json）が受け付ける最短の長さ。合わせて変えること */
const 枝の最短 = 20;

/**
 * 合言葉を作る。
 *
 * 推測できないことが唯一の守りなので、乱数の質が要る。
 * crypto があればそれを使い、無い環境でも動くように後ろ盾を置く。
 */
function 合言葉を作る(乱数源) {
  const c = 乱数源 || (typeof globalThis !== 'undefined' ? globalThis.crypto : undefined);
  if (c && typeof c.randomUUID === 'function') return c.randomUUID().replace(/-/g, '');
  if (c && typeof c.getRandomValues === 'function') {
    const 桶 = new Uint8Array(16);
    c.getRandomValues(桶);
    return [...桶].map((x) => x.toString(16).padStart(2, '0')).join('');
  }
  // ここへ来るのは crypto が無い古い環境だけ。Math.random は推測されうるが、
  // 団体IDそのままよりは桁数がある。届く範囲で最善にする
  let s = '';
  while (s.length < 32) s += Math.random().toString(36).slice(2);
  return s.slice(0, 32);
}

/** その値を枝の名前として使えるか（決まりが通す形か） */
function 枝として使えるか(値) {
  const s = null == 値 ? '' : String(値);
  // RTDB の道に使えない字が混じっていたら、道が壊れるので弾く
  if (/[.#$/[\]]/.test(s)) return false;
  return s.length >= 枝の最短;
}

/**
 * ライブを置く枝の名前を返す。
 *
 * 合言葉が無いときは null を返す。団体IDへ落とさないこと。
 * 落とすと、合言葉を持つ端末と持たない端末で枝が分かれ、同じ練習に
 * 入っているつもりで相手の○×が見えない、という直しにくい形になる。
 */
/**
 * @param {string|null|undefined} 合言葉
 * @returns {string|null}
 */
function ライブの枝(合言葉) {
  return 枝として使えるか(合言葉) ? String(合言葉) : null;
}

module.exports = {
  合言葉を作る,
  枝として使えるか,
  ライブの枝,
  枝の最短,
};
