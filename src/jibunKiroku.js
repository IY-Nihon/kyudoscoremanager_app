'use strict';

/**
 * 部員（自分）の記録を、中継（kyudo-chukei の POST /jibun）から受け取る（3 段目・2026-11-19 本人）。
 *
 * 役に「ほかの人の記録も見られる（全員を見る）」の無い個人ログイン（部員（自分）＝役の無い人みな）は、決まり
 * （firestore.rules の memberSeesAll）で記録とゴミ箱を直接読めない。練習 1 回の記録に同じ練習の全員の ○× が
 * 入っているため。中継がサービスアカウントで読み、その人の行だけにして返す（ほかの人の列は空の列）。
 *
 * 取りに行くのは、アプリを開いた・アプリに戻った・引いて更新したときと、ほかの端末が記録を書いたとき
 * （記録が変わった印。src/storeShared.js が書き、src/storeSync.js の 記録の印を見張る が見張る。11/19 本人）。
 *
 * 中継が無い・古い（/jibun が無く 404）ときは { 古い中継: true } を返す。店は前の道（直接読む）に戻る
 * （中継を配るまでのつなぎ。決まりを配ったあとは直接は読めない）。
 * 画面にも Firebase にも触れない作りにして、中継の口を差し替えて検査する（test/jibunKiroku.test.js）。
 */

/** 続きを読む回数の上限（25 件ずつなので 5,000 件まで。続きが壊れて回り続けないように） */
const ページの上限 = 200;
/** id で取り直すときの 1 回の数（中継の上限と同じ） */
const idの数 = 30;

/** 中継の誤りを、同期の誤りの形（入り直しの案内を出すかの見分けに code を見る）にする */
function 中継の誤り(状態, 中身) {
  const 誤り = new Error((中身 && 中身.error) || `中継から記録を取れませんでした（${状態}）`);
  誤り.code =
    状態 === 401
      ? 'unauthenticated'
      : 状態 === 403
        ? 'permission-denied'
        : 状態 === 429
          ? 'resource-exhausted'
          : 'unavailable';
  return 誤り;
}

async function 呼ぶ(中継, 体) {
  const 返り = await 中継.中継へfetch('/jibun', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(体),
  });
  if (!返り || 返り.status === 404) return { 古い中継: true };
  const 中身 = await Promise.resolve()
    .then(() => 返り.json())
    .catch(() => ({}));
  if (!返り.ok) throw 中継の誤り(返り.status, 中身);
  return 中身 || {};
}

/**
 * 中継から、その人の記録を受け取る。
 * @param {{団体: string, 形: '差分'|'全部', 境目?: {記録?: number, ごみ箱?: number}, ids?: string[]}} 頼み
 *   形 … 差分は境目より後に変わった記録（とゴミ箱へ移った id）、全部は全部の記録。ids は id で取り直す記録
 * @param {{中継?: object}} 道具
 * @returns {Promise<{古い中継: true} | {記録たち: object[], 外す: string[], 消えた: {id: string, 時: number}[],
 *   境目: {記録: number, ごみ箱: number}, idで取れた: boolean}>}
 *   境目 … 読んだ文書の lastModified（日時型）のいちばん新しいもの。何も読まなかった所は 0（店は今の境目と大きい方を取る）
 */
async function 中継から取る(頼み, 道具 = {}) {
  const 中継 = 道具.中継 || require('./geminiChukei');
  if (!中継 || !中継.中継がある()) return { 古い中継: true };
  const { 団体, 形, 境目 = {}, ids = [] } = 頼み || {};
  const 出 = { 記録たち: [], 外す: [], 消えた: [], 境目: { 記録: 0, ごみ箱: 0 }, idで取れた: true };
  const 受け取る = (答え) => {
    if (Array.isArray(答え.記録)) 出.記録たち.push(...答え.記録.filter((記録) => 記録 && 記録.id));
    if (Array.isArray(答え.外す)) 出.外す.push(...答え.外す.filter((id) => typeof id === 'string'));
    if (Array.isArray(答え.消えた))
      出.消えた.push(...答え.消えた.filter((一つ) => 一つ && typeof 一つ.id === 'string'));
    const 新 = 答え.境目 || {};
    出.境目.記録 = Math.max(出.境目.記録, Number(新.記録) || 0);
    出.境目.ごみ箱 = Math.max(出.境目.ごみ箱, Number(新.ごみ箱) || 0);
  };
  let 続き = null;
  for (let 回 = 0; 回 < ページの上限; 回++) {
    const 答え = await 呼ぶ(中継, {
      団体,
      形,
      境目: { 記録: Number(境目.記録) || 0, ごみ箱: Number(境目.ごみ箱) || 0 },
      ...(続き ? { 続き } : {}),
    });
    if (答え.古い中継) return 答え;
    受け取る(答え);
    続き = 答え.続き || null;
    if (!続き) break;
  }
  // 端末の控えから外した記録を id で取り直す。取れなかったら（古い中継）、外した一覧は残して次に回す
  const 一意 = [...new Set((ids || []).filter((id) => typeof id === 'string' && id))];
  for (let 頭 = 0; 頭 < 一意.length; 頭 += idの数) {
    const 答え = await 呼ぶ(中継, { 団体, 形: 'id', ids: 一意.slice(頭, 頭 + idの数) });
    if (答え.古い中継) {
      出.idで取れた = false;
      break;
    }
    受け取る({ ...答え, 境目: null });
  }
  return 出;
}

/**
 * 中継から受け取った記録を、Firestore の問い合わせの返りと同じ形にする（同期の続きの手をそのまま使うため）。
 * 雲から直接読んだ答えとして扱う（控えからの答えではない）
 */
function 返りの形(記録たち) {
  const 文書たち = (記録たち || []).map((記録) => ({
    id: 記録.id,
    data: () => 記録,
    metadata: { hasPendingWrites: false, fromCache: false },
  }));
  return {
    metadata: { fromCache: false, hasPendingWrites: false },
    forEach: (手) => 文書たち.forEach(手),
    docs: 文書たち,
    size: 文書たち.length,
    empty: 文書たち.length === 0,
  };
}

/**
 * 中継の答えで、手元の記録から外すものを外す。送れていない記録（未同期）は残す。
 * 外す … その人の写っていない記録。消えた … ゴミ箱へ移った記録（手元をそれより後に直していれば残す）
 */
function 外すものを外す(記録たち, 答え) {
  const 外す = new Set((答え && 答え.外す) || []);
  const 消えた = new Map(((答え && 答え.消えた) || []).map((一つ) => [一つ.id, Number(一つ.時) || 0]));
  return (記録たち || []).filter((記録) => {
    if (!記録 || 記録.syncStatus === '未同期') return true;
    if (外す.has(記録.id)) return false;
    if (消えた.has(記録.id) && (Number(記録.lastModified) || 0) <= 消えた.get(記録.id)) return false;
    return true;
  });
}

module.exports = { 中継から取る, 返りの形, 外すものを外す, ページの上限, idの数 };
