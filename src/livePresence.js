/**
 * Module ID: livePresence
 *
 * ライブに何台つながっているかを数える。
 *
 * ■ なぜ要るか
 * 弓道場は電波が切れがちで、記録係は「自分の○×が相手に届いているか」を
 * 確かめる手立てが無い。届いていないことに気づくのは、あとで見比べたとき
 * になる。つないでいる台数が出ていれば、相手が落ちたその場で分かる。
 *
 * ■ 置き場所
 * live_sessions/{枝}/{ライブ名}/presence/{端末} に、端末ごとに日時を置く。
 * 盤面（state）とは別の枝にする。state は丸ごと書き換える処理があり
 * （リセットや入り直し）、中に置くと在席まで消えるため。
 *
 * ■ 切れた端末の消し方
 * Realtime Database の onDisconnect に任せる。回線が切れたら、サーバーの
 * 側で在席を消してくれる。アプリが落ちても効くのが利点。
 * ただし onDisconnect は一度きりなので、つなぎ直すたびに掛け直す
 * （`.info/connected` を見張って掛け直す）。
 *
 * それでも取りこぼしはある（サーバーが切断を見つけるまでに間がある）。
 * そこで日時も置き、古すぎるものは数えない。二段構えにしてある。
 *
 * 画面にも Firebase にも触れない純粋な関数なので、そのまま検査できる
 * （test/livePresence.test.js）。
 */
'use strict';

const { 訳 } = require('./i18n');

/** 在席の日時を置き直す間隔（ミリ秒） */
const 打ち直す間隔 = 30000;

/**
 * これより古い在席は、居ないものとして数えない（ミリ秒）。
 *
 * 打ち直す間隔の3倍。1回や2回の打ち漏らし（電波が一瞬切れた、画面が
 * 裏に回った）で人が消えると、居るのに居ないと出て、かえって不安になる。
 */
const 古いとみなす = 打ち直す間隔 * 3;

/** 端末の名前を作る。台ごとに違えば何でもよく、秘密ではない */
function 端末の名前を作る(乱数源) {
  const c = 乱数源 || (typeof globalThis !== 'undefined' ? globalThis.crypto : undefined);
  if (c && typeof c.randomUUID === 'function') return c.randomUUID().replace(/-/g, '').slice(0, 16);
  if (c && typeof c.getRandomValues === 'function') {
    const 桶 = new Uint8Array(8);
    c.getRandomValues(桶);
    return [...桶].map((x) => x.toString(16).padStart(2, '0')).join('');
  }
  return (Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)).slice(0, 16);
}

/**
 * 在席の節点から、いまつながっている台数を数える。
 *
 * 今 にはサーバーに合わせた時刻を渡すこと。日時はサーバーが打つので、
 * 端末の時計をそのまま渡すと、時計が進んでいる台では全員が「古い」と
 * 見なされ、居るのに0台と出る。
 *
 * サーバーに合わせられていないときは 今 に null を渡す。そのときは
 * 古さで落とさず、全部数える。少なく出るのがいちばん困るため
 * （届いていないと誤解して、記録を取り直すことになる）。
 */
/**
 * @param {object|null|undefined} 節点
 * @param {number|null} 今 サーバーに合わせた時刻。合わせられないときは null
 * @returns {number}
 */
function 在席を数える(節点, 今) {
  if (!節点 || typeof 節点 !== 'object') return 0;
  const 数えるだけ = 'number' != typeof 今;
  let 数 = 0;
  for (const 鍵 of Object.keys(節点)) {
    const x = 節点[鍵];
    if (!x) continue;
    const at = typeof x.at === 'number' ? x.at : null;
    // 日時が読めないものは数える。サーバーが日時を打つ前の一瞬があり、
    // そこで落とすと、置いた直後に自分の台が消えて見える
    if (数えるだけ || at === null || 今 - at <= 古いとみなす) 数++;
  }
  return 数;
}

/**
 * 画面に出す文言。0台と1台は出さない。
 *
 * 1台は自分だけで、まだ誰も来ていない。「1台接続中」と出すと、
 * 相手が居るのか自分だけなのか読み取れない。
 */
function 台数の文言(台数) {
  return 'number' == typeof 台数 && 台数 >= 2 ? 訳('在席.台数', { n: 台数 }) : null;
}

module.exports = {
  端末の名前を作る,
  在席を数える,
  台数の文言,
  打ち直す間隔,
  古いとみなす,
};
