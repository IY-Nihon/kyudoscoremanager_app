/**
 * 主スレッドに一息つかせる。
 *
 * 端末の読み取りは全部が主スレッドの計算で、320 射の写真だと古い端末（CPU 6 倍遅い
 * 見当）で 13 秒、その間 1 回も画面が描き変わらなかった（2026-09-19 に実測）。
 * 重い段の間でここを await すると、押した反応や描き直しが割り込める。
 * 結果は変わらず、時間は数十 ms しか増えない。Node（学習・検査の道具）でも動く。
 *
 * 呼ぶたびに休むのではなく、前に休んでから 30ms 経っていたときだけ休む。
 * 休むこと自体に 1〜4ms かかる（setTimeout は 5 段重なると 4ms に切り上がる）ので、
 * 短い計算の中から何百回も呼ぶと、休む時間のほうが長くなる（列ごとの行の当てはめで
 * 実際にそうなり、1.1 秒が 3.7 秒になった）。
 * scheduler.yield があれば（Chrome 129〜）そちら。続きを優先して戻してくれる
 */
const 今 = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
const 休む = () =>
  typeof globalThis.scheduler !== 'undefined' && typeof globalThis.scheduler.yield === 'function'
    ? globalThis.scheduler.yield()
    : new Promise((r) => setTimeout(r, 0));

let 前に休んだ = 0;

/** 前に休んでから 30ms 経っていれば、主スレッドに一息つかせる */
export async function 息継ぎ() {
  if (今() - 前に休んだ < 30) return;
  await 休む();
  前に休んだ = 今();
}
