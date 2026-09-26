/**
 * 戻るボタン（ブラウザの戻る・Android の戻る）で、開いている窓を閉じる。web だけ。
 *
 * タブの移動はブラウザの履歴に積まれる（MainNavigator の linking）。窓は履歴に何も
 * 積まないので、窓を開いたまま戻るを押すと前のタブへ移り、窓は開いたまま残った
 * （メンバーの詳細を開いて戻ると、分析の上にメンバーの詳細が出ていた。2026-09-26 に
 * 使う人から）。
 *
 * 窓が開いたら同じ住所の履歴を 1 つ積み、戻るでそれが外れたら、いちばん上の窓だけを
 * 閉じる。×や保存など戻る以外で閉じたときは、積んだ 1 つを自分で戻して消す。
 * どちらの戻りでも住所は変わらないので、タブの移動（react-navigation）は起きない。
 *
 * 窓の部品（src/rn.js の Modal）が onRequestClose を持っていれば、それを閉じる手に使う。
 * 閉じる手が断ったら（削除の途中など）、積み直して、窓が開いたままでも前のタブへ移らないようにする。
 */
'use strict';

const React = require('react');

const 使える =
  typeof window !== 'undefined' && !!window.history && typeof window.addEventListener === 'function';

/** 開いている窓（開いた順）。{ 印, 閉じる: ref, 片付いた } */
const 開いている窓 = [];
let 自分で戻した = 0;
let 見張っている = false;
let 次の印 = 1;

/** 窓の印を付けた履歴を積む。住所は今のまま、react-navigation の控え（state.id など）も写す */
function 積む(窓) {
  try {
    window.history.pushState(Object.assign({}, window.history.state, { __窓: 窓.印 }), '');
  } catch (e) {
    /* 積めなくても窓は使える（戻るで閉じないだけ） */
  }
}

/**
 * いまいる履歴に付いている窓の印（無ければ undefined）。
 *
 * react-navigation も画面を戻すときに history.go(-1) を呼ぶ（履歴の「やめる」で記録詳細へ
 * 戻るなど）。popstate だけを見ていると、それを使う人の戻るだと取り違えて、開いている
 * 記録詳細を閉じていた（2026-09-26 に e2e で踏んだ）。戻るの直前に「窓の履歴にいた」ときだけ
 * 窓を閉じる。そのために pushState と replaceState も見張って、いまいる履歴を控える
 */
let いまの窓 = undefined;
const 印を読む = (状態) => (状態 && typeof 状態 === 'object' ? 状態.__窓 : undefined);

function 見張る() {
  if (見張っている || !使える) return;
  見張っている = true;
  いまの窓 = 印を読む(window.history.state);
  for (const 名 of ['pushState', 'replaceState']) {
    const 元 = window.history[名].bind(window.history);
    window.history[名] = (状態, ...残り) => {
      const 返り = 元(状態, ...残り);
      いまの窓 = 印を読む(状態);
      return 返り;
    };
  }
  // react-navigation より先に受ける。あちらは popstate の中で replaceState を呼ぶので、後に受けると
  // 「戻る直前にいた履歴」の控えが書き換わったあとになり、窓の戻るを見分けられない。
  // 捕まえる段階（capture）で受け、しかも読み込んだ時点で付ける（あちらが付けるのは画面を描いてから）
  window.addEventListener(
    'popstate',
    () => {
      const 前の窓 = いまの窓;
      いまの窓 = 印を読む(window.history.state);
      if (自分で戻した > 0) {
        自分で戻した--;
        return;
      }
      const 上 = 開いている窓[開いている窓.length - 1];
      if (!上) return;
      // 上の窓の履歴から離れたときだけ閉じる。窓の履歴にいなかったなら、画面の移動（react-navigation）
      if (前の窓 !== 上.印 || いまの窓 === 上.印) return;
      // 戻るで、上の窓の履歴が外れた。その窓だけ閉じる
      開いている窓.pop();
      上.戻るで外れた = true;
      try {
        if (上.閉じる.current) 上.閉じる.current();
      } catch (e) {
        /* 閉じる手の失敗は、次の確かめで積み直す */
      }
      // 閉じる手が断ったとき（削除の途中など）は窓が残る。積み直して、次の戻るも窓で受ける
      setTimeout(() => {
        if (上.片付いた) return;
        上.戻るで外れた = false;
        開いている窓.push(上);
        積む(上);
      }, 300);
    },
    true
  );
}
見張る();

/**
 * 開いているあいだ、戻るで 閉じる を呼ぶ。
 * @param {boolean} 開いている
 * @param {(() => void)|undefined} 閉じる 無ければ何もしない（戻るは今までどおりタブを移る）
 */
function 戻るで閉じる(開いている, 閉じる) {
  const 閉じる手 = React.useRef(閉じる);
  閉じる手.current = 閉じる;
  const 手がある = typeof 閉じる === 'function';
  React.useEffect(() => {
    if (!使える || !開いている || !手がある) return undefined;
    見張る();
    const 窓 = { 印: 次の印++, 閉じる: 閉じる手, 片付いた: false, 戻るで外れた: false };
    開いている窓.push(窓);
    積む(窓);
    return () => {
      窓.片付いた = true;
      const 番 = 開いている窓.indexOf(窓);
      if (番 >= 0) 開いている窓.splice(番, 1);
      if (窓.戻るで外れた) return;
      // 戻る以外で閉じた。積んだ履歴がいちばん上に残っていれば、自分で戻して消す。
      // すぐには戻さない。窓を閉じると同時にタブを移る操作（履歴の「記録画面で直す」など）では、
      // その場で戻すと、あとから来るタブの移動の履歴を戻してしまい、元のタブへ引き返した
      // （2026-09-26 に e2e で踏んだ）。一息おいて、まだ自分の履歴がいちばん上のときだけ戻す。
      // 上に別の履歴が積まれていたら触らない（戻すとそちらを消してしまう。戻るを 1 回余計に押すだけ）
      setTimeout(() => {
        try {
          if (window.history.state && window.history.state.__窓 === 窓.印) {
            自分で戻した++;
            window.history.back();
          }
        } catch (e) {
          /* 消せなくても、戻るを 1 回余計に押すだけ */
        }
      }, 50);
    };
  }, [開いている, 手がある]);
}

module.exports = { 戻るで閉じる };
