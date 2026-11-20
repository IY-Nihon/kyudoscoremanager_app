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

/**
 * 続きを読む回数の上限（続きが壊れて回り続けないように）。1 ページは中継が答えの大きさから決める（ふつうの記録なら
 * 25 件・矢所つきの大きい記録なら少なく。中継の Workers の 1 回の CPU を無料枠に収めるため。11/20）
 */
const ページの上限 = 1000;
/** id で取り直すときの 1 回の数（中継の上限と同じ） */
const idの数 = 5;
/**
 * 呼びすぎ（429）で断られたときに、待って同じ頼みを送り直す回数と間（中継の上限は人ごとに 1 分 120 回。射手の多い
 * 矢所つきの記録ばかりの団体は 1 ページが数件になり、全部を取るときに上限に当たる。待てば続きから取れる。11/20）
 */
const 送り直しの上限 = 6;
const 送り直しの待ち = 15 * 1000;

/**
 * App Check の印が取れていないままか（src/setupAppCheck.js が印の取り直しの失敗を数えている）。
 * 読めなければ（検査・web でない）取れていないとは言えないので偽
 */
function 印が取れていないか() {
  try {
    return !!require('./setupAppCheck').印が取れていないか();
  } catch {
    return false;
  }
}

/** 中継の誤りを、同期の誤りの形（入り直しの案内を出すかの見分けに code を見る）にする */
function 中継の誤り(状態, 中身, 道具 = {}) {
  const 誤り = new Error((中身 && 中身.error) || `中継から記録を取れませんでした（${状態}）`);
  // 中継が App Check の印で断った（401 と 印: 'appcheck'。中継へfetch が印を長めに待って送り直したあと）。ログインの証の
  // 誤りではないので、入り直しの案内は出さない（開いてすぐ印が間に合わなかっただけなら、戻った・引いたときに取れる）。
  // 印の取り直しが失敗し続けているときだけ、前のとおり入り直しの案内（印の断りの文を添える。src/ReloginModal.js）を出す
  const 印の断り = 状態 === 401 && !!中身 && 中身.印 === 'appcheck';
  const 取れていない = 道具.印が取れていないか || 印が取れていないか;
  誤り.code = 印の断り
    ? 取れていない()
      ? 'permission-denied'
      : 'unavailable'
    : 状態 === 401
      ? 'unauthenticated'
      : 状態 === 403
        ? 'permission-denied'
        : 状態 === 429
          ? 'resource-exhausted'
          : 'unavailable';
  return 誤り;
}

async function 呼ぶ(中継, 体, 道具 = {}) {
  let 返り;
  try {
    返り = await 中継.中継へfetch('/jibun', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(体),
    });
  } catch {
    // 届かない（電波が無い・中継が落ちている）。通信が切れていただけの形にする（不具合の便りに送らない。storeShared の 不具合を控える）
    throw 中継の誤り(0, { error: '通信できませんでした。電波の良い場所で引いて更新してください' });
  }
  if (!返り || 返り.status === 404) return { 古い中継: true };
  const 中身 = await Promise.resolve()
    .then(() => 返り.json())
    .catch(() => ({}));
  if (!返り.ok) throw 中継の誤り(返り.status, 中身, 道具);
  return 中身 || {};
}

/** 呼びすぎで断られたら待って送り直す（ほかの誤りはそのまま投げる） */
async function 待って呼ぶ(中継, 体, 道具) {
  const 待つ = 道具.待つ || ((ミリ秒) => new Promise((済む) => setTimeout(済む, ミリ秒)));
  for (let 回 = 0; ; 回++) {
    try {
      return await 呼ぶ(中継, 体, 道具);
    } catch (誤り) {
      if (!誤り || 誤り.code !== 'resource-exhausted' || 回 >= 送り直しの上限) throw 誤り;
      await 待つ(送り直しの待ち);
    }
  }
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
  // 次のページで読む数。最初は頼まない（中継が小さく決める）。そのあとは中継の 次の件 をそのまま頼む
  let 件 = null;
  for (let 回 = 0; 回 < ページの上限; 回++) {
    const 答え = await 待って呼ぶ(
      中継,
      {
        団体,
        形,
        境目: { 記録: Number(境目.記録) || 0, ごみ箱: Number(境目.ごみ箱) || 0 },
        ...(続き ? { 続き } : {}),
        ...(件 ? { 件 } : {}),
      },
      道具
    );
    if (答え.古い中継) return 答え;
    受け取る(答え);
    続き = 答え.続き || null;
    件 = Number(答え.次の件) || null;
    if (!続き) break;
  }
  // 端末の控えから外した記録を id で取り直す。取れなかったら（古い中継）、外した一覧は残して次に回す
  const 一意 = [...new Set((ids || []).filter((id) => typeof id === 'string' && id))];
  for (let 頭 = 0; 頭 < 一意.length; 頭 += idの数) {
    const 答え = await 待って呼ぶ(中継, { 団体, 形: 'id', ids: 一意.slice(頭, 頭 + idの数) }, 道具);
    if (答え.古い中継) {
      出.idで取れた = false;
      break;
    }
    受け取る({ ...答え, 境目: null });
  }
  return 出;
}

/**
 * id を名指しして、中継から記録を取る（5 件まで。4 段目の送り直しが断られたときに、雲にもう届いているかを確かめる）。
 * 中継の答えの 外す には、その人の写っていない記録と、雲に無い記録の両方が入る
 * @param {{団体: string, ids: string[]}} 頼み
 * @returns {Promise<{古い中継: true} | {記録たち: object[], 外す: string[]}>}
 */
async function idで取る(頼み, 道具 = {}) {
  const 中継 = 道具.中継 || require('./geminiChukei');
  if (!中継 || !中継.中継がある()) return { 古い中継: true };
  const { 団体, ids = [] } = 頼み || {};
  const 一意 = [...new Set((ids || []).filter((id) => typeof id === 'string' && id))].slice(0, idの数);
  if (!一意.length) return { 記録たち: [], 外す: [] };
  const 答え = await 待って呼ぶ(中継, { 団体, 形: 'id', ids: 一意 }, 道具);
  if (答え.古い中継) return 答え;
  return {
    記録たち: Array.isArray(答え.記録) ? 答え.記録.filter((記録) => 記録 && 記録.id) : [],
    外す: Array.isArray(答え.外す) ? 答え.外す.filter((id) => typeof id === 'string') : [],
  };
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

module.exports = { 中継から取る, idで取る, 返りの形, 外すものを外す, ページの上限, idの数 };
