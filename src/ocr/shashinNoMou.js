/**
 * 写真で学習済みの網の重み（scripts/ocr-cells/omomi-mobilenet.bin・0.79MB）を、写真の読み取りを使うときだけ取りに行く。
 *
 * ■ なぜ
 * 板のマスは畳み込みの網（omomi-tatami.json）で読み、迷ったマスだけこの網と混ぜる（src/ocr/yomu.js）。
 * 重みをアプリの束（AppEntry）に入れると、読み取りを使わない人まで毎回 0.7MB 余計に落とすので、
 * Metro の asset（metro.config.js で bin を足した）にして fetch する。/assets/ は sw.js が控えるので、
 * 2 回目からは取りに行かない。
 *
 * 取れないとき（電波が無い・弱い）は null。畳み込みの網だけで読む（板ごとに外して 99.6% 前後）。
 */
'use strict';

let 約束 = null;

/**
 * @param {{場所?: () => string, fetch?: typeof fetch}} [道具] 検査で差し替えるため
 * @returns {Promise<Uint8Array|null>}
 */
function 写真の網の重みを読む(道具 = {}) {
  if (!約束) {
    約束 = (async () => {
      const 場所 = 道具.場所
        ? 道具.場所()
        : require('expo-asset').Asset.fromModule(require('../../scripts/ocr-cells/omomi-mobilenet.bin')).uri;
      const 返事 = await (道具.fetch || fetch)(場所);
      if (!返事.ok) throw new Error(`HTTP ${返事.status}`);
      return new Uint8Array(await 返事.arrayBuffer());
    })().catch((誤り) => {
      // 次に読み取るときに取り直す
      約束 = null;
      console.warn('[写真の網] 重みが取れないので、畳み込みの網だけで読む:', 誤り && 誤り.message);
      return null;
    });
  }
  return 約束;
}

/**
 * 待つのは 上限 まで。電波が弱いときに読み取りそのものを止めない（取り寄せは裏で続け、次の読み取りで使う）
 * @param {number} [上限] ms
 * @param {object} [道具]
 */
function 写真の網の重みを待つ(上限 = 8000, 道具) {
  return Promise.race([写真の網の重みを読む(道具), new Promise((r) => setTimeout(() => r(null), 上限))]);
}

/** 検査用：控えを捨てる */
function 写真の網の控えを捨てる() {
  約束 = null;
}

module.exports = { 写真の網の重みを読む, 写真の網の重みを待つ, 写真の網の控えを捨てる };
