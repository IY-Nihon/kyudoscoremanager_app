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
 * ■ リンク
 * https://…/#招待=<団体>.<合言葉>。「#」の後ろはサーバーの記録や Referer に流れない
 * （ライブの共有リンクと同じ。src/liveShare.js）。
 */
'use strict';

/** 合言葉の形。16 進 32 字（128 ビット） */
const 合言葉の形 = /^[0-9a-f]{32}$/;
/** 団体の鍵の形（groups/{団体} の id） */
const 団体の形 = /^[A-Za-z0-9_-]{1,40}$/;

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

/**
 * そのメンバーの招待の合言葉を探す（団体の持ち主だけが一覧できる）。無ければ null
 * @param {{Firestore: any, db: any}} 道具
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
    if (!見つけた && 招待の文書か(文書.data())) 見つけた = 文書.id;
  });
  return 見つけた;
}

/**
 * 招待を作り直す。前の合言葉は消すので、前のリンクでは入れなくなる（すでに入っている端末は
 * そのまま）。作った合言葉を返す
 */
async function 招待を作り直す(道具, 団体, memberId, 乱数源) {
  const { Firestore, db } = 道具;
  const 合言葉 = 合言葉を作る(乱数源);
  const 返り = await Firestore.getDocs(
    Firestore.query(
      Firestore.collection(db, `groups/${団体}/member_lookup`),
      Firestore.where('memberId', '==', memberId)
    )
  );
  const 一括 = Firestore.writeBatch(db);
  返り.forEach((文書) => {
    if (招待の文書か(文書.data())) 一括.delete(文書.ref);
  });
  一括.set(Firestore.doc(db, `groups/${団体}/member_lookup`, 合言葉), {
    memberId,
    招待: true,
    // Date で置く（管理画面で日時として読める）
    updatedAt: new Date(),
  });
  await 一括.commit();
  return 合言葉;
}

/** 招待を取り消す（そのメンバーの合言葉をすべて消す） */
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
  招待を探す,
  招待を作り直す,
  招待を取り消す,
};
