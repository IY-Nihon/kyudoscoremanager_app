/**
 * 読み込み直しても戻したい画面の様子（分析の絞り込み・履歴の月・スクロールの位置など）の控え。
 *
 * 2026-11-22 本人：新しい版で読み込み直したときに、選んでいた物と位置を戻す（あわせて、分析・履歴を
 * 見ているあいだは自動で読み込み直さない。src/updateNotice.js の 自動で更新してよいか）。
 *
 * そのタブを開いているあいだだけ控える（sessionStorage。web だけ）。端末をまたいで残す物ではないので、
 * 店の控え（AsyncStorage）には入れない。タブを閉じれば消える。読めない・書けない（private モードなど）
 * ときは何もしない。前の版の控え・壊れた控えで画面が落ちないよう、読むときは型を確かめる（控えの値）。
 * ログアウトのとき・別の人で入ったときは全部消す（共用の端末で、前の人の検索の字や月を次の人に見せない。
 * src/useScoreStore.js の setAuth）。
 *
 * 置き場を差し替えて検査できる（test/yominaoshiHikae.test.js）。
 */
'use strict';

const React = require('react');

const 頭 = '読み込み直しの控え:';

/** @returns {Storage|null} */
function 置き場() {
  try {
    return typeof window !== 'undefined' && window.sessionStorage ? window.sessionStorage : null;
  } catch {
    return null;
  }
}

/**
 * @param {string} 名 控えの名前（画面ごと）
 * @param {Storage|null} [場]
 * @returns {Record<string, any>|null}
 */
function 控えを読む(名, 場 = 置き場()) {
  if (!場) return null;
  try {
    const 字 = 場.getItem(頭 + 名);
    const 中 = 字 ? JSON.parse(字) : null;
    return 中 && typeof 中 === 'object' && !Array.isArray(中) ? 中 : null;
  } catch {
    return null;
  }
}

/**
 * @param {string} 名
 * @param {Record<string, any>} 中身
 * @param {Storage|null} [場]
 */
function 控えを書く(名, 中身, 場 = 置き場()) {
  if (!場) return;
  try {
    場.setItem(頭 + 名, JSON.stringify(中身));
  } catch {
    /* いっぱい・使えない。読み込み直したら初めの形に戻るだけ */
  }
}

/**
 * 控えを全部消す（ログアウト・別の人で入ったとき）。消した数を返す
 * @param {Storage|null} [場]
 * @returns {number}
 */
function 控えを全部消す(場 = 置き場()) {
  if (!場) return 0;
  /** @type {string[]} */
  const 拾った = [];
  try {
    // 消しながら回ると番号がずれるので、先に拾う
    for (let 番 = 0; 番 < 場.length; 番++) {
      const 鍵 = 場.key(番);
      if (鍵 != null && 鍵.startsWith(頭)) 拾った.push(鍵);
    }
  } catch {
    return 0;
  }
  for (const 鍵 of 拾った) {
    try {
      場.removeItem(鍵);
    } catch {
      /* 消せなくても先へ */
    }
  }
  return 拾った.length;
}

/**
 * 控えの中の 1 つを、確かめが通るときだけ返す。無い・型が違うときは 既定
 * @template T
 * @param {Record<string, any>|null} 控え
 * @param {string} 鍵
 * @param {T} 既定
 * @param {(値: any) => boolean} 確かめる
 * @returns {T}
 */
function 控えの値(控え, 鍵, 既定, 確かめる) {
  if (!控え || !Object.prototype.hasOwnProperty.call(控え, 鍵)) return 既定;
  const 値 = 控え[鍵];
  return 確かめる(値) ? 値 : 既定;
}

/** 控えを書くのを、続けて動いているあいだは待つ長さ（ミリ秒） */
const 位置を書く間 = 300;

/** 小数の画素の端数で「届かない」としないための遊び */
const 高さの遊び = 2;

/**
 * 流れる一覧（ScrollView・FlatList）の縦の位置を控え、読み込み直したあとに 1 回だけ戻す。
 * 返す onScroll・onContentSizeChange・onLayout・scrollEventThrottle を一覧に渡す。
 *
 * 中身が控えた位置まで流せる高さ（中身の高さ − 枠の高さ）になってから戻す。記録が読み込まれる前や、
 * 枠の高さが分かる前に戻すと、流せる所までで止まって位置がずれる（一番下まで流していたときも戻せるよう、
 * 枠の高さを引いて比べる）。高さが届かないまま（記録が減ったなど）なら戻さない。
 * 戻す前に自分で流したら、もう戻さない（あとから引き戻されると驚く）。
 *
 * @param {string} 名
 * @param {{current: any}} ref 一覧の ref（FlatList は scrollToOffset、ScrollView は scrollTo で戻す）
 * @param {Storage|null} [場] 検査で差し替える置き場
 */
function use位置の控え(名, ref, 場 = 置き場()) {
  const 持ち物 = React.useRef(
    /** @type {{戻す位置: number, 戻した: boolean, 中身の高さ: number, 枠の高さ: number, 最後の位置: number, 時計: any}|null} */ (
      null
    )
  );
  if (!持ち物.current) {
    const y = 控えの値(
      控えを読む(名, 場),
      'y',
      0,
      (v) => typeof v === 'number' && Number.isFinite(v) && v > 0
    );
    持ち物.current = { 戻す位置: y, 戻した: !(y > 0), 中身の高さ: 0, 枠の高さ: 0, 最後の位置: 0, 時計: null };
  }
  const 置き場の参照 = React.useRef(場);
  置き場の参照.current = 場;
  React.useEffect(
    () => () => {
      const 今 = 持ち物.current;
      if (今 && 今.時計) clearTimeout(今.時計);
    },
    []
  );
  const 戻せるなら戻す = React.useCallback(() => {
    const 今 = 持ち物.current;
    if (!今 || 今.戻した || !(今.枠の高さ > 0)) return;
    if (今.中身の高さ - 今.枠の高さ < 今.戻す位置 - 高さの遊び) return;
    今.戻した = true;
    const 相手 = ref && ref.current;
    if (!相手) return;
    if (typeof 相手.scrollToOffset === 'function')
      相手.scrollToOffset({ offset: 今.戻す位置, animated: false });
    else if (typeof 相手.scrollTo === 'function') 相手.scrollTo({ y: 今.戻す位置, animated: false });
  }, [ref]);
  const onScroll = React.useCallback(
    (/** @type {any} */ 出来事) => {
      const 今 = 持ち物.current;
      const 位置 = 出来事 && 出来事.nativeEvent && 出来事.nativeEvent.contentOffset;
      const y = Number(位置 && 位置.y);
      if (!今 || !Number.isFinite(y)) return;
      if (!今.戻した) {
        // 先頭のままの知らせ（描いた直後など）は、控えた位置を上書きしない
        if (!(y > 0)) return;
        今.戻した = true;
      }
      今.最後の位置 = y;
      if (今.時計) return;
      今.時計 = setTimeout(() => {
        今.時計 = null;
        控えを書く(名, { y: 今.最後の位置 }, 置き場の参照.current);
      }, 位置を書く間);
    },
    [名]
  );
  const onContentSizeChange = React.useCallback(
    (/** @type {number} */ _幅, /** @type {number} */ 高さ) => {
      const 今 = 持ち物.current;
      if (!今 || !Number.isFinite(高さ)) return;
      今.中身の高さ = 高さ;
      戻せるなら戻す();
    },
    [戻せるなら戻す]
  );
  const onLayout = React.useCallback(
    (/** @type {any} */ 出来事) => {
      const 今 = 持ち物.current;
      const 枠 = 出来事 && 出来事.nativeEvent && 出来事.nativeEvent.layout;
      const 高さ = Number(枠 && 枠.height);
      if (!今 || !Number.isFinite(高さ)) return;
      今.枠の高さ = 高さ;
      戻せるなら戻す();
    },
    [戻せるなら戻す]
  );
  return { onScroll, onContentSizeChange, onLayout, scrollEventThrottle: 100 };
}

module.exports = { 控えを読む, 控えを書く, 控えを全部消す, 控えの値, use位置の控え, 位置を書く間 };
