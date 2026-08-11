/**
 * 同期まわりの純粋な関数をまとめたもの。
 *
 * ここに置くものは「入れたものだけで答えが決まる」関数に限る。Firebase にも
 * 画面にも触れないので、node --test で手元だけで確かめられる（test/syncRules.test.js）。
 *
 * 元は JP_useScoreStore_174.js の中に最小化された形（y / h / normalizeTag など）で
 * 埋まっていた。同期の勝ち負けを決める中心の判断が読めない状態だったため、
 * 中身は変えずに名前を付けて外へ出した。ストア側は従来の1文字の名前に
 * 割り当て直して使うので、呼び出し側の書き換えは不要。
 */
'use strict';

/** クラウドが新しいと見なす最小の差（ミリ秒）。時計のずれを吸収する */
const CLOUD_NEWER_MARGIN_MS = 1000;

/** サーバーの日時に置き換えてよいと見なす差（ミリ秒） */
const SERVER_STAMP_WINDOW_MS = 5 * 60 * 1000;

const SYNCED = '同期済み';
const UNSYNCED = '未同期';

/**
 * Firestore の日時（Timestamp / {seconds} / 数値 / 文字列）をミリ秒に直す。
 * 読めないものは 0 を返す。
 */
function toMillis(value) {
  if (!value) return 0;
  if (typeof value.toMillis === 'function') return value.toMillis();
  if (typeof value === 'object' && value.seconds != null) return Number(value.seconds) * 1000;
  const n = Number(value);
  return isNaN(n) ? Date.parse(value) || 0 : n;
}

/**
 * ゴミ箱の並べ替えに使う日時。捨てた日時 → 更新日時 → 練習日 の順に見る。
 */
function trashedAtMillis(item) {
  return toMillis(item && (item.deletedAt || item.lastModified || item.date));
}

/**
 * 手元とクラウドの一覧を id で突き合わせる。
 *
 * まだ送っていないもの（未同期）は、クラウドが新しくても採用しない。
 * 送信が済んでいるときだけ、次のいずれかでクラウドを採用する。
 *   1. force が true
 *   2. クラウドのほうが 1 秒以上新しい
 *   3. 日時の差が 5 分未満（サーバーが打った正式な日時への置き換え）
 *
 * 以前は 2 が単独でクラウド採用を決めており、未同期でも上書きされた。
 * 手元の日時は端末の時計、クラウドの日時はサーバー時刻なので、端末の時計が
 * 1〜2秒でも遅れていると「クラウドのほうが新しい」と判定される。その状態で
 * 定期同期（5分ごと）や電波復帰が編集の直後に割り込むと、直したばかりの
 * ○×が黙って元に戻り、しかも送信タイマーが戻された内容を送るため永久に
 * 失われた。記録のリスナーは未同期を守っていたので、そちらとも食い違っていた。
 *
 * 守りは一時的で、送信が届けば「同期済み」になり普通の突き合わせに戻る。
 * そのため端末どうしで食い違ったままにはならない（最後には全端末が揃う）。
 *
 * purge が true のとき、クラウドに無くなったものを手元からも消す。ただし
 * 「未同期」のものは送信前なので残す。
 *
 * 日時は toMillis で読む。Timestamp・数値・{seconds} の入れ物・文字列の
 * いずれでも比較できる。
 *
 * 元の実装は Timestamp と数値しか読まず、入れ物や文字列だと比較が NaN に
 * なって 2 も 3 も成立しなかった。つまりクラウド側が永久に勝てず、その記録
 * だけ他の端末の編集が反映されない状態になる。本番では入れ物の形の25件を
 * 数値に直して解消済みだが、また生まれても静かに壊れないようにしておく。
 * 手元側は Date.now() の数値しか入らないので、そのままでよい。
 */
function mergeById(localList, cloudList, force = false, purge = false) {
  const byId = new Map();
  (localList || []).forEach((item) => {
    if (item && item.id) byId.set(item.id, item);
  });

  const cloudIds = new Set();
  (cloudList || []).forEach((cloudItem) => {
    if (!cloudItem || !cloudItem.id) return;
    cloudIds.add(cloudItem.id);

    const localItem = byId.get(cloudItem.id);
    if (!localItem) {
      byId.set(cloudItem.id, cloudItem);
      return;
    }

    const cloudAt = toMillis(cloudItem.lastModified);
    const localAt = localItem.lastModified || 0;
    const クラウドが新しい = cloudAt > localAt + CLOUD_NEWER_MARGIN_MS;
    const 手元は送信済み = localItem.syncStatus === SYNCED || !localItem.syncStatus;
    const 日時が近い = Math.abs(cloudAt - localAt) < SERVER_STAMP_WINDOW_MS;

    if (force || ((クラウドが新しい || 日時が近い) && 手元は送信済み)) {
      byId.set(cloudItem.id, cloudItem);
    }
  });

  if (purge) {
    for (const [id, item] of byId.entries()) {
      const 送信済み = item.syncStatus !== UNSYNCED;
      const クラウドに無い = !cloudIds.has(id);
      if (送信済み && クラウドに無い) {
        console.log(`[Store] Purging local item deleted in cloud: ${id} (${item.name || 'unknown'})`);
        byId.delete(id);
      }
    }
  }

  // Timestamp のまま持ち回ると比較できないので、数値に直して返す
  return Array.from(byId.values()).map((item) =>
    item.lastModified && typeof item.lastModified.toMillis === 'function'
      ? Object.assign({}, item, { lastModified: item.lastModified.toMillis() })
      : item
  );
}

/**
 * Firestore は undefined を受け付けないので、書き込む前に取り除く。
 * 日時が入れ物の形にならないよう、JSON を経由しないで写す。
 */
function dropUndefinedDeep(value) {
  if (Array.isArray(value)) return value.map(dropUndefinedDeep);
  if (value && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) {
    const out = {};
    for (const key in value) {
      if (value[key] !== undefined) out[key] = dropUndefinedDeep(value[key]);
    }
    return out;
  }
  return value;
}

/**
 * タグを「先頭に # がひとつ」の形に揃える。全角の ＃ は半角に直す。
 * 文字列でないもの、中身が空になるものは '' を返す（呼び出し側で落とす）。
 */
function normalizeTag(tag) {
  if (typeof tag !== 'string') return '';
  let body = tag.trim().replace(/^[#＃\s]+/, '');
  body = body.replace(/＃/g, '#');
  return body ? `#${body}` : '';
}

/** タグの配列を揃えて重複を除く。配列でなければそのまま返す */
function cleanUpTagsArray(tags) {
  if (!Array.isArray(tags)) return tags;
  return Array.from(new Set(tags.map(normalizeTag).filter(Boolean)));
}

/** 記録の一覧のタグをまとめて揃える */
function cleanUpSessions(sessions) {
  if (!Array.isArray(sessions)) return sessions;
  return sessions.map((session) =>
    session && session.tags && Array.isArray(session.tags)
      ? Object.assign({}, session, { tags: cleanUpTagsArray(session.tags) })
      : session
  );
}

/**
 * 名簿と卒業生のどちらとも重ならない4桁の個人IDを作る。
 */
function generateUniquePersonalId(members, alumni) {
  const 使用中 = new Set(
    [...members.map((m) => m.personalId), ...alumni.map((a) => a.personalId)].filter(Boolean)
  );
  let id;
  do {
    id = Math.floor(1000 + 9000 * Math.random()).toString();
  } while (使用中.has(id));
  return id;
}

module.exports = {
  toMillis,
  trashedAtMillis,
  mergeById,
  dropUndefinedDeep,
  normalizeTag,
  cleanUpTagsArray,
  cleanUpSessions,
  generateUniquePersonalId,
  SYNCED,
  UNSYNCED,
  CLOUD_NEWER_MARGIN_MS,
  SERVER_STAMP_WINDOW_MS,
};
