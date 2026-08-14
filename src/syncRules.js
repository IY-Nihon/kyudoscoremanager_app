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

/**
 * 矢所（arrowLocations）を配列に揃える。
 *
 * 送るときは空欄を '' にする（○× と同じ）。null のままだと Realtime Database が
 * 配列から落として `{1:…}` の形に変えてしまい、受け取り側で位置がずれるため。
 * ここではその逆をして、'' を null に戻し、添字のオブジェクトも配列に直す。
 *
 * 入っていないときは undefined を返す。「情報が無い」と「全部空」を区別するため。
 * 古い版のアプリは矢所を送らないので、この区別が無いと配信の途中で
 * 手元の矢所を消してしまう。
 */
function normalizeArrowLocations(value, length) {
  if (value == null) return undefined;
  const 長さ = typeof length === 'number' && length > 0 ? length : 0;
  const 空へ = (v) => (v === '' || v == null ? null : v);

  if (Array.isArray(value)) {
    const out = value.map(空へ);
    while (out.length < 長さ) out.push(null);
    return out;
  }
  if (typeof value === 'object') {
    const keys = Object.keys(value);
    if (keys.length === 0) return Array(長さ).fill(null);
    if (!keys.every((k) => !isNaN(Number(k)))) return undefined;
    const 最大 = Math.max(...keys.map(Number));
    const out = Array(Math.max(長さ, 最大 + 1)).fill(null);
    keys.forEach((k) => {
      out[Number(k)] = 空へ(value[k]);
    });
    return out;
  }
  return undefined;
}

/** 描き直しが要るかの判定に使う。射手1人分が同じ中身かを見る */
const 射手の単純な項目 = [
  'id',
  'name',
  'gender',
  'grade',
  'isSeparator',
  'isTotalCalculator',
  'isGuest',
  'memberId',
  'bowWeight',
  'lastModified',
];
function 射手が同じ(a, b) {
  if (!a || !b) return a === b;
  for (const k of 射手の単純な項目) {
    const x = a[k] === undefined ? null : a[k];
    const y = b[k] === undefined ? null : b[k];
    if (x !== y) return false;
  }
  const 同じ入れ物 = (x, y) => JSON.stringify(x || null) === JSON.stringify(y || null);
  return (
    同じ入れ物(a.marks, b.marks) &&
    同じ入れ物(a.lockedBlocks, b.lockedBlocks) &&
    同じ入れ物(a.substitutions, b.substitutions) &&
    同じ入れ物(a.substitutionIds, b.substitutionIds) &&
    同じ入れ物(a.arrowLocations, b.arrowLocations)
  );
}

/**
 * 前後の盤面を見比べて、○×だけの違いなら「変えたますの一覧」を返す。
 * 盤面の形が変わっていれば null（差分では表せない）。
 *
 * なぜ要るか：
 *   共有履歴が「盤面まるごと」を前として持つと、2台が同時に入れたとき、
 *   後に積まれた手の「前」には相手の入力がまだ入っていない。取り消すと
 *   その盤面が丸ごと戻り、相手の○×まで消える。変えたますだけを持てば、
 *   自分が変えたところしか戻らない。
 *
 * 射手の増減・並び替え・射数の変更・鍵・名前・矢所は差分で表せないので、
 * そのときは null を返し、呼ぶ側は従来どおり盤面まるごとに任せる。
 */
function 印だけの差分(前, 後) {
  const a = Array.isArray(前) ? 前 : null;
  const b = Array.isArray(後) ? 後 : null;
  if (!a || !b || a.length !== b.length) return null;
  const 出 = [];
  for (let i = 0; i < a.length; i++) {
    const x = a[i];
    const y = b[i];
    if (!x || !y || !x.id || x.id !== y.id) return null;
    if (!印以外が同じ(x, y)) return null;
    const p = Array.isArray(x.marks) ? x.marks : [];
    const q = Array.isArray(y.marks) ? y.marks : [];
    if (p.length !== q.length) return null;
    for (let j = 0; j < q.length; j++) {
      const 元 = p[j] == null ? '' : p[j];
      const 先 = q[j] == null ? '' : q[j];
      if (元 !== 先) 出.push({ 射手: y.id, 射番: j, 前: 元, 後: 先 });
    }
  }
  return 出.length ? 出 : null;
}

/** ○×と更新日時をのぞいて、射手の中身が同じか */
function 印以外が同じ(a, b) {
  for (const k of 射手の単純な項目) {
    if (k === 'lastModified') continue;
    const x = a[k] === undefined ? null : a[k];
    const y = b[k] === undefined ? null : b[k];
    if (x !== y) return false;
  }
  const 同じ入れ物 = (x, y) => JSON.stringify(x || null) === JSON.stringify(y || null);
  return (
    同じ入れ物(a.lockedBlocks, b.lockedBlocks) &&
    同じ入れ物(a.substitutions, b.substitutions) &&
    同じ入れ物(a.substitutionIds, b.substitutionIds) &&
    同じ入れ物(a.arrowLocations, b.arrowLocations)
  );
}

/**
 * 「変えたますの一覧」を、いまの盤面に当てる。
 * 向きが -1 なら前の値へ、+1 なら後の値へ戻す。
 * 盤面まるごとを置き換えないので、他の人が入れた○×には触れない。
 * 手元に居ない射手は飛ばす。
 */
function 差分を当てる(いまの一覧, 差分, 向き) {
  const 束 = new Map();
  (Array.isArray(差分) ? 差分 : []).forEach((d) => {
    if (!d || !d.射手 || typeof d.射番 !== 'number') return;
    if (!束.has(d.射手)) 束.set(d.射手, []);
    束.get(d.射手).push(d);
  });
  let 変わった = false;
  const archers = (Array.isArray(いまの一覧) ? いまの一覧 : []).map((a) => {
    if (!a || !a.id || !束.has(a.id)) return a;
    const marks = Array.isArray(a.marks) ? [...a.marks] : [];
    let この射手が変わった = false;
    束.get(a.id).forEach((d) => {
      const 値 = 向き < 0 ? d.前 : d.後;
      const 入れる = 値 == null ? '' : 値;
      const いま = marks[d.射番] == null ? '' : marks[d.射番];
      if (いま !== 入れる) {
        marks[d.射番] = 入れる;
        この射手が変わった = true;
      }
    });
    if (!この射手が変わった) return a;
    変わった = true;
    return Object.assign({}, a, { marks });
  });
  return { archers, changed: 変わった };
}

/**
 * ライブ記録で受け取った射手の一覧を、手元の一覧と突き合わせる。
 *
 * 元は主催者側と参加者側に同じ処理が丸ごと二重に書かれていた
 * （JP_useScoreStore_174.js の 2600 行目付近と 2700 行目付近）。
 * 片方だけ直す事故を防ぐためここへ出した。中身は次の3点を直してある。
 *
 * 1. 判定を `>=` から `>` にした。同着は手元を優先する
 * 2. 勝ったほうを土台にする。元は常に受信側が土台で、手元が新しいときも
 *    lastModified が受信側の古い値に巻き戻っていた。そのせいで次の受信で
 *    「受信のほうが新しい」と誤判定され、直したばかりの○×が消えていた
 * 3. 矢所は、受信に入っていなければ手元を残す。元は受信側が土台だったため、
 *    誰かが1本記録するたびに参加者全員の矢所が消えていた（矢所は送信の項目に
 *    そもそも入っていなかった）
 *
 * 一覧は受信側の並びで作る。誰が参加しているかはライブ側を正とするため。
 * changed は「画面を描き直す必要があるか」。無駄な描き直しを避けるために返す。
 */
function mergeLiveArchers(localList, remoteList, localShots, remoteShots) {
  const 手元 = Array.isArray(localList) ? localList : [];
  const 受信 = Array.isArray(remoteList) ? remoteList : [];

  const 索引 = new Map();
  手元.forEach((a) => {
    if (a && a.id) 索引.set(a.id, a);
  });

  const archers = 受信.map((r) => {
    if (!r || !r.id) return r;
    const l = 索引.get(r.id);
    if (!l) return r;

    const 受信が新しい = (r.lastModified || 0) > (l.lastModified || 0);
    const 勝ち = 受信が新しい ? r : l;
    // 受信に矢所が入っていなければ、手元の値を残す（古い版との混在対策）
    const 矢所 = r.arrowLocations === undefined ? l.arrowLocations : 勝ち.arrowLocations;

    const out = Object.assign({}, 勝ち);
    if (矢所 === undefined) delete out.arrowLocations;
    else out.arrowLocations = 矢所;
    return out;
  });

  let changed = archers.length !== 手元.length || remoteShots !== localShots;
  if (!changed) {
    for (let i = 0; i < archers.length; i++) {
      const a = archers[i];
      if (!射手が同じ(a, 索引.get(a && a.id))) {
        changed = true;
        break;
      }
    }
  }
  return { archers, changed };
}

/**
 * 取り消し・やり直しで戻す一覧に、新しい日時を打ち直す。
 *
 * 取り消しは「前の状態」をそのまま戻すので、射手の更新日時も古い値に戻る。
 * ライブ記録の突き合わせは日時で勝ち負けを決めるため、そのままだと相手の
 * 側では自分の値のほうが新しく見え、取り消しが無視される。主催者の画面
 * だけ戻って参加者の画面は戻らない、という食い違いになる。
 *
 * 中身が変わった射手にだけ打ち直す。変わっていないものまで触ると、
 * 相手が加えた新しい入力を古い内容で上書きしてしまう。
 */
function restampChangedArchers(戻す一覧, いまの一覧, 日時) {
  const 戻す = Array.isArray(戻す一覧) ? 戻す一覧 : [];
  const 索引 = new Map();
  (Array.isArray(いまの一覧) ? いまの一覧 : []).forEach((a) => {
    if (a && a.id) 索引.set(a.id, a);
  });
  return 戻す.map((a) => {
    if (!a || !a.id) return a;
    const いま = 索引.get(a.id);
    if (いま && 射手が同じ(a, いま)) return a;
    return Object.assign({}, a, { lastModified: 日時 });
  });
}

/**
 * ライブ名に使えない字が入っていれば、それを並べて返す（無ければ null）。
 *
 * Realtime Database の枝の名前には . $ # [ ] / と制御文字が使えない。
 * . $ # [ ] は書き込みが例外になるので開始そのものが失敗するが、
 * 「/」だけは例外にならず階層の区切りとして通ってしまう。そのため
 * 「5/8」のような日付を名前にすると live_sessions/{団体}/5/8 が作られ、
 * 名前の直下に state が無いので参加一覧にも出ず、参加も削除もできない
 * ライブが残る（本番に1件あった）。
 */
function ライブ名に使えない字(名前) {
  const s = typeof 名前 === 'string' ? 名前 : '';
  const 見つかった = [];
  for (const 字 of ['/', '.', '$', '#', '[', ']']) {
    if (s.includes(字)) 見つかった.push(字);
  }
  // 制御文字はまとめて1つの案内にする
  if (/[\u0000-\u001F\u007F]/.test(s)) 見つかった.push('改行などの制御文字');
  return 見つかった.length ? 見つかった.join(' ') : null;
}

/**
 * 参加一覧から外す目安。最終更新からこれを過ぎたライブは、もう使われて
 * いないものとして扱う。ライブは主催者・参加者のどちらが抜けても残る作りで、
 * 終わらせるのは「終了・保存」か一覧から消したときだけなので、放っておくと
 * 使われなくなったライブが溜まり続ける。
 */
const LIVE_STALE_MS = 14 * 24 * 60 * 60 * 1000;

/**
 * ライブの最終更新として使う日時を取り出す。
 *
 * updated_at はサーバーが打った時刻（serverTimestamp）。端末の時計が狂って
 * いても正しい。timestamp のほうは書いた端末の時計で、「自分の送信の返りを
 * 無視する」判定に使うため端末の値のままにしてある。
 * updated_at を持たないのは、この仕組みより前に作られたライブだけ。
 */
function ライブの最終更新(state) {
  if (!state) return null;
  if (typeof state.updated_at === 'number') return state.updated_at;
  if (typeof state.timestamp === 'number') return state.timestamp;
  return null;
}

/**
 * ライブ節点の一覧を、参加一覧に出す形へ整える。
 *
 *   { 出す: ['朝練', ...], 古い: ['先月の練習', ...] }
 *
 * 「出す」は最終更新が新しい順。「古い」は一覧から外して消してよいもの。
 * 最終更新が分からないものは、古いとは見なさない。判断できないものを
 * 消すほうが危ないので、一覧には出したうえで残す。
 *
 * 「いま」にはサーバー時刻を渡すこと（端末の時計そのままだと、時計が
 * 大きく狂った端末が、使用中のライブを古いと見なして消しかねない）。
 */
function 参加できるライブ(節点, いま = Date.now()) {
  const 生きている = [];
  const 古い = [];
  Object.keys(節点 || {}).forEach((名) => {
    const v = 節点[名];
    // state が無いものは、そもそも一覧に出さない（従来どおり）
    if (!v || !v.state) return;
    const 日時 = ライブの最終更新(v.state);
    if (日時 !== null && いま - 日時 > LIVE_STALE_MS) {
      古い.push(名);
      return;
    }
    生きている.push({ 名, 日時: 日時 === null ? 0 : 日時 });
  });
  生きている.sort((a, b) => b.日時 - a.日時);
  return { 出す: 生きている.map((x) => x.名), 古い };
}

module.exports = {
  toMillis,
  trashedAtMillis,
  mergeById,
  mergeLiveArchers,
  印だけの差分,
  差分を当てる,
  参加できるライブ,
  ライブの最終更新,
  ライブ名に使えない字,
  LIVE_STALE_MS,
  normalizeArrowLocations,
  restampChangedArchers,
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
