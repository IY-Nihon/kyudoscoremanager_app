// アイコンの字体（Ionicons）を、画面より先に読んでおく。
//
// ■ なぜ
//   @expo/vector-icons の Icon は、字体が無ければ mount のときに自分で読みに行く
//   （componentDidMount で await Font.loadAsync）。web では 12 秒で諦めて例外になり、
//   その await は誰にも受け止められないので「約束の投げっぱなし」の便りになる。
//   電波の弱い端末で 12000ms timeout exceeded と A network error occurred.（字体の
//   取り寄せに失敗した DOMException）が 9 月に 47 通届いた。しかも同じ字体を待つ
//   Icon は全部が同じ約束を待つので、1 度の失敗で開いている Icon の数だけ便りが出る。
//
// ■ どうする
//   起動のときにこちらから読む。失敗しても受け止め、5 秒・15 秒・45 秒あけて読み直す。
//   読めたあとに mount する Icon は Font.isLoaded で済むので、自分では読みに行かない。
//   読み終わる前に mount した Icon は自分でも待つが、そちらは同じ約束を待つだけで、
//   こちらが先に受け止めていても Icon 側の await は別に断られる。それは web の
//   キャッシュ（sw.js が字体を先に返す）で 2 回目から起きなくする。
'use strict';

/** 読み直すまでの間（ms）。並びの数だけ読み直す */
const 読み直す間 = [5000, 15000, 45000];

/**
 * @param {{読む?: () => Promise<any>, 待つ?: (ms:number) => Promise<void>, 読めているか?: () => boolean}} [道具]
 *   検査で差し替えるため。省くと Ionicons と setTimeout
 * @returns {Promise<boolean>} 読めたら true。全部だめなら false（例外は出さない）
 */
async function アイコンの字体を読んでおく(道具 = {}) {
  const 読む = 道具.読む || (() => require('@expo/vector-icons').Ionicons.loadFont());
  const 待つ = 道具.待つ || ((ms) => new Promise((r) => setTimeout(r, ms)));
  const 読めているか =
    道具.読めているか ||
    (() => require('expo-font').isLoaded(require('@expo/vector-icons').Ionicons.getFontFamily()));
  for (let 回 = 0; ; 回++) {
    if (読めているか()) return true;
    try {
      await 読む();
      return true;
    } catch (誤り) {
      if (回 >= 読み直す間.length) return false;
      await 待つ(読み直す間[回]);
    }
  }
}

module.exports = { アイコンの字体を読んでおく, 読み直す間 };
