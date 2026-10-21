/**
 * ログアウトしても、送れていない記録を端末に残しておく控え。
 *
 * ■ なぜ要るか
 * 2026-10-17、接続の設定が違う束を配信してしまい、本番の端末のログインが外れた。
 * 「ログアウトしてもう一度ログイン」の案内どおりに抜けたところ、送れていない記録
 * （部内戦 27 人分）が、ログアウトで手元の記録ごと消えた。ログインが外れていると
 * 送ることもできないので、消すしか選べなかった。
 *
 * ログアウトのときは、送れていないもの（syncStatus が 未同期）だけを団体ごとに
 * 取っておき、次に同じ団体で入ったときに手元へ戻して送り直す。別の団体で入ったときは
 * 戻さない（記録が混ざる）。
 *
 * 店（useScoreStore の setAuth）から使う。画面を動かさずに検査するため切り出してある。
 */
'use strict';

const 種類 = ['sessions', 'members', 'alumni', 'trash'];
const 未同期 = '未同期';

/**
 * 控えの鍵。団体の見える ID（個人ログインでも同じになる）と、入り方（group / member）。
 * 入り方も分けるのは、団体で入って残した記録を個人ログインで送ると決まりに断られ、
 * 断られるたびにログインし直しの窓が出続けるため
 */
function 控えの鍵(公開の団体ID, 団体ID, 役割) {
  const id = String(公開の団体ID || 団体ID || '').toUpperCase();
  return id ? `${id}:${役割 || 'group'}` : null;
}

/** 送れていないものだけを抜き出す */
function 送れていないもの(状態) {
  const 出 = {};
  for (const 種 of 種類) {
    const 一覧 = Array.isArray(状態 && 状態[種]) ? 状態[種] : [];
    出[種] = 一覧.filter((一つ) => 一つ && 一つ.id && 未同期 === 一つ.syncStatus);
  }
  return 出;
}

/** 控えに何件あるか */
function 件数(箱) {
  return 箱 ? 種類.reduce((和, 種) => 和 + (Array.isArray(箱[種]) ? 箱[種].length : 0), 0) : 0;
}

/** id で重ねる。同じ id は新しいほう（lastModified）を残す */
function 重ねる(前, 後) {
  const 表 = new Map();
  for (const 一つ of [...(前 || []), ...(後 || [])]) {
    if (!一つ || !一つ.id) continue;
    const 既 = 表.get(一つ.id);
    if (!既 || (Number(一つ.lastModified) || 0) >= (Number(既.lastModified) || 0)) 表.set(一つ.id, 一つ);
  }
  return [...表.values()];
}

/**
 * ログアウトの直前に呼ぶ。送れていないものを控えに足した、新しい控えを返す。
 * 送れていないものが無ければ、控えはそのまま。
 */
function 控えに入れる(控え, 鍵, 状態) {
  const 元 = 控え && 'object' === typeof 控え ? 控え : {};
  if (!鍵) return 元;
  const 足す = 送れていないもの(状態);
  if (!件数(足す)) return 元;
  const 前 = 元[鍵] || {};
  const 箱 = { 退避した時刻: Date.now() };
  for (const 種 of 種類) 箱[種] = 重ねる(前[種], 足す[種]);
  return Object.assign({}, 元, { [鍵]: 箱 });
}

/**
 * 入った直後に呼ぶ。その団体の控えがあれば手元へ重ね、控えからは外す。
 * 戻したものは 未同期 のまま（次の同期で送られる）。手元に同じ id があれば新しいほうを残す。
 * 返り値: { 控え, 手元: { sessions, members, alumni, trash } | null, 戻した数 }
 */
function 控えを戻す(控え, 鍵, 状態) {
  const 元 = 控え && 'object' === typeof 控え ? 控え : {};
  const 箱 = 鍵 ? 元[鍵] : null;
  if (!箱 || !件数(箱)) return { 控え: 元, 手元: null, 戻した数: 0 };
  const 手元 = {};
  for (const 種 of 種類) {
    const 戻すもの = (箱[種] || []).map((一つ) => Object.assign({}, 一つ, { syncStatus: 未同期 }));
    手元[種] = 重ねる(Array.isArray(状態 && 状態[種]) ? 状態[種] : [], 戻すもの);
  }
  const 残り = Object.assign({}, 元);
  delete 残り[鍵];
  return { 控え: 残り, 手元, 戻した数: 件数(箱) };
}

module.exports = { 控えの鍵, 控えに入れる, 控えを戻す, 件数, 送れていないもの };
