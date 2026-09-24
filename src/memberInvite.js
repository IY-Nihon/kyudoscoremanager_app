/**
 * メンバーの招待リンク。
 *
 * メンバーは「団体ID（6 桁）＋個人ID（4 桁）」で入る。個人ID は 9,000 通りしか無く、試す数にも
 * 上限が無いので、団体ID を知った人が総当たりで誰かとして入れた（2026-09-24 の調べ）。
 * 招待リンクは、メンバーごとに推測できない合言葉（128 ビット）を持たせ、リンクを開くだけで
 * そのメンバーとして入れるようにする。番号を打たなくてよいので、使い勝手もよくなる。
 *
 * ■ 置き場所
 * 個人ID と同じ逆引き表（groups/{団体}/member_lookup/{合言葉}）に { memberId, 招待: true } を置く。
 * 決まり（firestore.rules）はそのまま使える。
 *   ・get は入っている人なら誰でも（合言葉を知っている人だけが引ける）
 *   ・list と書き込みは団体の持ち主だけ（メンバーは他人の合言葉を一覧できない）
 *   ・所属の証（member_claims）は、逆引き表の memberId と一致するときだけ作れる
 * 名簿の文書（members）には置かない。メンバー全員が読めるので、他人の合言葉が見えてしまう。
 *
 * ■ 期限
 * 作ってから 7 日（expiresAt）。期限内なら何度でも使え、過ぎたら持ち主が作り直す。
 * 決まりでも止める（期限を過ぎた合言葉では所属の証を作れない）。すでに入っている端末は
 * そのまま使える（2026-09-24 に使う人が 7 日と決めた）。
 *
 * ■ リンク
 * https://…/#招待=<団体>.<合言葉>。「#」の後ろはサーバーの記録や Referer に流れない
 * （ライブの共有リンクと同じ。src/liveShare.js）。
 */
'use strict';

/** 合言葉の形。16 進 32 字（128 ビット） */
const 合言葉の形 = /^[0-9a-f]{32}$/;
/** 団体の鍵の形（groups/{団体} の id） */
const 団体の形 = /^[A-Za-z0-9_-]{1,40}$/;
/** 招待リンクを使える日数（作ってから） */
const 招待の期限の日数 = 7;

/** 推測できない合言葉を作る */
function 合言葉を作る(乱数源) {
  const 乱数 = 乱数源 || (typeof globalThis !== 'undefined' ? globalThis.crypto : undefined);
  if (!乱数 || typeof 乱数.getRandomValues !== 'function') {
    // 推測できない乱数が無い端末では作らない（Math.random では総当たりの対策にならない）
    throw new Error('この端末では招待リンクを作れません（乱数を用意できません）');
  }
  const 桶 = new Uint8Array(16);
  乱数.getRandomValues(桶);
  return [...桶].map((一字) => 一字.toString(16).padStart(2, '0')).join('');
}

/** 招待リンクを組み立てる */
function 招待リンクを作る(配り元, 団体, 合言葉) {
  const 元 = String(配り元 || '').replace(/\/+$/, '');
  return `${元}/#招待=${団体}.${合言葉}`;
}

/**
 * URL から招待を取り出す。無い・形が違うときは null
 * @returns {{団体: string, 合言葉: string}|null}
 */
function URLから招待を取る(URL文字列) {
  const 文 = String(URL文字列 || '');
  const 場所 = 文.indexOf('#');
  if (場所 < 0) return null;
  for (const 組 of 文.slice(場所 + 1).split('&')) {
    const 等 = 組.indexOf('=');
    if (等 < 0) continue;
    let 鍵 = 組.slice(0, 等);
    try {
      鍵 = decodeURIComponent(鍵); // encodeURIComponent された「招待」も受ける
    } catch {
      continue;
    }
    if (鍵 !== '招待') continue;
    const 値 = 組.slice(等 + 1);
    const 点 = 値.lastIndexOf('.');
    if (点 < 0) return null;
    const 団体 = 値.slice(0, 点);
    const 合言葉 = 値.slice(点 + 1).toLowerCase();
    if (!団体の形.test(団体) || !合言葉の形.test(合言葉)) return null;
    return { 団体, 合言葉 };
  }
  return null;
}

/** 逆引き表の文書が招待のものか（個人ID の文書と見分ける） */
const 招待の文書か = (中身) => !!(中身 && 中身.招待 === true);

/** 招待の文書の期限（ミリ秒）。読めなければ 0（切れている扱い） */
function 招待の期限(中身) {
  const 値 = 中身 && 中身.expiresAt;
  if (!値) return 0;
  if (typeof 値.toMillis === 'function') return 値.toMillis();
  if (値 instanceof Date) return 値.getTime();
  return typeof 値 === 'number' ? 値 : 0;
}

/** 招待の期限が切れているか（期限の無い招待の文書も切れている扱い。決まりと同じ） */
const 招待の期限切れか = (中身, 今 = Date.now()) => 招待の文書か(中身) && !(招待の期限(中身) > 今);

/**
 * そのメンバーの招待を探す（団体の持ち主だけが一覧できる）。無ければ null。
 * 期限が切れたものも返す（画面で「切れています」と出して作り直してもらう）
 * @param {{Firestore: any, db: any}} 道具
 * @returns {Promise<{合言葉: string, 期限: number}|null>}
 */
async function 招待を探す(道具, 団体, memberId) {
  const { Firestore, db } = 道具;
  const 返り = await Firestore.getDocs(
    Firestore.query(
      Firestore.collection(db, `groups/${団体}/member_lookup`),
      Firestore.where('memberId', '==', memberId)
    )
  );
  let 見つけた = null;
  返り.forEach((文書) => {
    const 中身 = 文書.data();
    // 作り直しの途中などで 2 つあれば、期限の遅いほう
    if (招待の文書か(中身) && (!見つけた || 招待の期限(中身) > 見つけた.期限))
      見つけた = { 合言葉: 文書.id, 期限: 招待の期限(中身) };
  });
  return 見つけた;
}

/**
 * 招待を作り直す。前の合言葉は消すので、前のリンクでは入れなくなる（すでに入っている端末は
 * そのまま）。作った合言葉と期限を返す。
 *
 * 前の合言葉は画面が知っているもの（招待を探す で出したもの）を名指しで消し、書く前に雲へ
 * 問い合わせない。前は書く前に「今の招待はどれか」を問い合わせていて、WebKit では書いた
 * 直後のその問い合わせが返らず、作り直しが終わらないことがあった（2026-09-24 に e2e で
 * 踏んだ。電波の弱い所でも同じ形になる）。ほかに残っている招待（別の端末で作ったもの
 * など）は、書き終えてから待たずに片付ける。
 *
 * @param {{前の合言葉?: string|null, 乱数源?: any, 今?: number}} [選び]
 * @returns {Promise<{合言葉: string, 期限: number}>}
 */
async function 招待を作り直す(道具, 団体, memberId, 選び = {}) {
  const { 前の合言葉 = null, 乱数源, 今 = Date.now() } = 選び;
  const { Firestore, db } = 道具;
  const 合言葉 = 合言葉を作る(乱数源);
  const 期限 = 今 + 招待の期限の日数 * 86400000;
  const 一括 = Firestore.writeBatch(db);
  if (前の合言葉 && 前の合言葉 !== 合言葉)
    一括.delete(Firestore.doc(db, `groups/${団体}/member_lookup`, 前の合言葉));
  一括.set(Firestore.doc(db, `groups/${団体}/member_lookup`, 合言葉), {
    memberId,
    招待: true,
    // Date で置く（管理画面で日時として読める。決まりは expiresAt を request.time と比べる）
    updatedAt: new Date(今),
    expiresAt: new Date(期限),
  });
  await 一括.commit();
  // 残っているほかの招待の片付け。返りを待たない（返らなくても作り直しは済んでいる）
  古い招待を片付ける(道具, 団体, memberId, 期限).catch(() => {});
  return { 合言葉, 期限 };
}

/**
 * そのメンバーの招待のうち、期限がこれより早い（先に作った）ものを消す。
 * 「今作ったもの以外」ではなく「今作ったものより古いもの」にするのは、返りの遅い片付けが
 * あとから作り直した新しい合言葉まで消さないため（2026-09-24 に WebKit の e2e で踏んだ。
 * 作る → すぐ作り直す で、作るの片付けが遅れて返り、作り直したリンクを消していた）
 */
async function 古い招待を片付ける(道具, 団体, memberId, 期限) {
  const { Firestore, db } = 道具;
  const 返り = await Firestore.getDocs(
    Firestore.query(
      Firestore.collection(db, `groups/${団体}/member_lookup`),
      Firestore.where('memberId', '==', memberId)
    )
  );
  const 一括 = Firestore.writeBatch(db);
  let 件数 = 0;
  返り.forEach((文書) => {
    const 中身 = 文書.data();
    if (招待の文書か(中身) && 招待の期限(中身) < 期限) {
      一括.delete(文書.ref);
      件数++;
    }
  });
  if (件数) await 一括.commit();
  return 件数;
}

/**
 * 招待を取り消す（そのメンバーの合言葉をすべて消す）
 * @returns {Promise<number>} 消した数
 */
async function 招待を取り消す(道具, 団体, memberId) {
  const { Firestore, db } = 道具;
  const 返り = await Firestore.getDocs(
    Firestore.query(
      Firestore.collection(db, `groups/${団体}/member_lookup`),
      Firestore.where('memberId', '==', memberId)
    )
  );
  const 一括 = Firestore.writeBatch(db);
  let 件数 = 0;
  返り.forEach((文書) => {
    if (招待の文書か(文書.data())) {
      一括.delete(文書.ref);
      件数++;
    }
  });
  if (件数) await 一括.commit();
  return 件数;
}

module.exports = {
  合言葉を作る,
  招待リンクを作る,
  URLから招待を取る,
  招待の文書か,
  招待の期限,
  招待の期限切れか,
  招待の期限の日数,
  招待を探す,
  招待を作り直す,
  招待を取り消す,
};
