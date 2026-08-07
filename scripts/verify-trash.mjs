/**
 * ゴミ箱の不具合の修正を、実際の Firebase SDK で検証する。
 *
 *   node scripts/verify-trash.mjs [stg|prod]
 *
 * ストアと同じ操作（単体削除・複数選択削除・復元・個別完全削除・すべて削除）を
 * 実データに対して行い、そのたびにリスナーが何を受け取るかを見る。
 * 並べ替えの関数は実装（src/syncRules.js）をそのまま使うので食い違わない。
 *
 * 既定は検証環境。本番を指定しても読み取りしかしない。
 */
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import {
  getFirestore, collection, doc, query, limit, orderBy, onSnapshot,
  getDocs, writeBatch, serverTimestamp, deleteDoc, setDoc,
} from 'firebase/firestore';
import { configFor } from './fb-rest.mjs';

const target = process.argv[2] || 'stg';
if (target !== 'stg') {
  console.error('このスクリプトは書き込みを伴うため検証環境専用です。');
  process.exit(1);
}

const { apiKey, projectId } = configFor(target);
const GID = '100001';
const EMAIL = 'nihonu.kouka@gmail.com';
const PW = 'StgTest!2026';

// ── 実装から並べ替え関数をそのまま持ってくる ────────────────
// 以前はストアの本文から正規表現で切り出していたが、純粋な関数を
// src/syncRules.js へ移したので、そのまま読み込む。
const src = fs.readFileSync('src/JP_useScoreStore_174.js', 'utf8');
const { trashedAtMillis } = createRequire(import.meta.url)('../src/syncRules.js');

// ── 実装のクエリが想定どおりか確かめる ──────────────────────
const 修正済み = /\}\/trash`\),n=\(0,a\.query\)\(i,\(0,a\.limit\)\(200\)\)/.test(src);
const 旧クエリ残り = /trash`\),n=\(0,a\.query\)\(i,\(0,a\.orderBy\)\('deletedAt'/.test(src);
const 単体削除にdeletedAt = /i\.lastModified=\(0,a\.serverTimestamp\)\(\),i\.deletedAt=\(0,a\.serverTimestamp\)\(\),e\.set\(\(0,a\.doc\)\(fb\.db,`groups\/\$\{\s*\r?\ns\(\)\.activeGroupId\s*\r?\n\}\/trash`,o\),i\)/.test(src);

const app = initializeApp({ apiKey, projectId });
const auth = getAuth(app);
await signInWithEmailAndPassword(auth, EMAIL, PW);
const db = getFirestore(app);

const trashCol = collection(db, `groups/${GID}/trash`);
const sessCol = collection(db, `groups/${GID}/sessions`);

const results = [];
const check = (id, name, expect, actual) => {
  const ok = JSON.stringify(expect) === JSON.stringify(actual);
  results.push({ ID: id, 項目: name, 期待: String(expect), 実際: String(actual), 判定: ok ? 'OK' : 'NG' });
  return ok;
};

/** 修正後の listenToTrash と同じ読み方 */
const listen = () => new Promise((res, rej) => {
  const un = onSnapshot(query(trashCol, limit(200)), (s) => {
    un();
    const o = s.docs.map((d) => ({ id: d.id, ...d.data() }));
    o.sort((a, b) => trashedAtMillis(b) - trashedAtMillis(a));
    res(o);
  }, (e) => { un(); rej(e); });
});

/** 修正前の listenToTrash と同じ読み方 */
const listenOld = () => new Promise((res) => {
  const un = onSnapshot(query(trashCol, orderBy('deletedAt', 'desc'), limit(50)),
    (s) => { un(); res(s.size); }, () => { un(); res('エラー'); });
});

const wipe = async (col) => {
  const s = await getDocs(col);
  for (let i = 0; i < s.docs.length; i += 400) {
    const b = writeBatch(db);
    s.docs.slice(i, i + 400).forEach((d) => b.delete(d.ref));
    await b.commit();
  }
};

const mkSession = (id, date) => ({
  id, date, title: `検証${id}`, archers: [{ id: 'a1', name: '部員1', marks: ['○'] }],
  archerNames: ['部員1'], tags: [], shotCount: 1, includeInStats: true, lastModified: Date.now(),
});

// ── ストアと同じ操作 ────────────────────────────────────────
const deleteSession = async (sess) => {                       // deleteSession :964
  const b = writeBatch(db);
  b.delete(doc(sessCol, sess.id));
  const t = JSON.parse(JSON.stringify({ ...sess, syncStatus: 'trashed' }));
  t.lastModified = serverTimestamp(); t.deletedAt = serverTimestamp();
  b.set(doc(trashCol, sess.id), t);
  await b.commit();
};
const deleteMultipleSessions = async (list) => {              // deleteMultipleSessions :1035
  const b = writeBatch(db);
  list.forEach((sess) => {
    b.delete(doc(sessCol, sess.id));
    const t = JSON.parse(JSON.stringify({ ...sess, syncStatus: 'trashed' }));
    t.lastModified = serverTimestamp(); t.deletedAt = serverTimestamp();
    b.set(doc(trashCol, sess.id), t);
  });
  await b.commit();
};
const restoreSession = async (item) => {                      // restoreSession :1061
  const b = writeBatch(db);
  b.delete(doc(trashCol, item.id));
  const s = JSON.parse(JSON.stringify({ ...item, syncStatus: 'synced' }));
  s.lastModified = serverTimestamp();
  b.set(doc(sessCol, item.id), s);
  await b.commit();
};
const deleteTrashItems = async (ids) => {                     // deleteTrashItems :1010
  const b = writeBatch(db); ids.forEach((id) => b.delete(doc(trashCol, id))); await b.commit();
};
const emptyTrash = async (items) => {                         // emptyTrash :992
  const b = writeBatch(db); items.forEach((x) => b.delete(doc(trashCol, x.id))); await b.commit();
};

console.log(`対象: ${projectId} / 団体 ${GID}\n`);

// ══ 準備 ══════════════════════════════════════════════════
await wipe(trashCol);
await wipe(sessCol);

// ── T-0 実装そのものの確認 ─────────────────────────────────
check('T-0a', 'listenToTrash が並べ替えなし・上限200になっている', true, 修正済み);
check('T-0b', '旧クエリ orderBy(deletedAt) が残っていない', true, !旧クエリ残り);
check('T-0c', 'deleteSession が deletedAt を書くようになっている', true, 単体削除にdeletedAt);

// ── T-1 古い形式（deletedAt なし）の記録が見えるか ──────────
// 本番に取り残されている36件と同じ形を作る
for (let i = 1; i <= 3; i++) {
  await setDoc(doc(trashCol, `legacy-${i}`), {
    ...mkSession(`legacy-${i}`, Date.now() - i * 864e5), syncStatus: 'trashed',
    lastModified: Date.now() - i * 864e5,
  });
}
check('T-1', '古い形式（deletedAt なし）の記録がゴミ箱に出る', 3, (await listen()).length);
check('T-1b', '（対比）修正前のクエリでの取得件数', 0, await listenOld());

// ── T-2/T-3 単体削除 ───────────────────────────────────────
const s1 = mkSession('one-1', Date.now());
await setDoc(doc(sessCol, s1.id), s1);
await deleteSession(s1);
const afterSingle = await listen();
check('T-2', '単体削除した記録がゴミ箱に出る', true, afterSingle.some((x) => x.id === 'one-1'));
check('T-2b', '単体削除で deletedAt が書かれる', true,
  !!afterSingle.find((x) => x.id === 'one-1')?.deletedAt);
check('T-3', '古い記録も残ったまま（合計）', 4, afterSingle.length);
check('T-3b', '記録側からは消えている', false,
  (await getDocs(sessCol)).docs.some((d) => d.id === 'one-1'));

// ── T-4 複数選択削除で他の中身が消えないか ──────────────────
const multi = [mkSession('multi-1', Date.now()), mkSession('multi-2', Date.now())];
for (const s of multi) await setDoc(doc(sessCol, s.id), s);
await deleteMultipleSessions(multi);
const afterMulti = await listen();
check('T-4', '複数選択削除しても前の中身が残る', 6, afterMulti.length);
check('T-4b', '複数選択で削除した2件も入っている', true,
  ['multi-1', 'multi-2'].every((id) => afterMulti.some((x) => x.id === id)));

// ── T-10 並び順（新しい削除が上） ───────────────────────────
check('T-10', '新しく削除したものが先頭に来る', true,
  ['multi-1', 'multi-2', 'one-1'].includes(afterMulti[0].id));
check('T-10b', '古い形式の記録が末尾に並ぶ', true,
  afterMulti.slice(-3).every((x) => x.id.startsWith('legacy-')));

// ── T-5 復元 ───────────────────────────────────────────────
const toRestore = afterMulti.find((x) => x.id === 'legacy-1');
await restoreSession(toRestore);
const afterRestore = await listen();
check('T-5', '復元するとゴミ箱から消える', false, afterRestore.some((x) => x.id === 'legacy-1'));
check('T-5b', '復元した記録が記録側に戻る', true,
  (await getDocs(sessCol)).docs.some((d) => d.id === 'legacy-1'));

// ── T-6 個別に完全削除 ─────────────────────────────────────
await deleteTrashItems(['multi-1', 'legacy-2']);
const afterPurge = await listen();
check('T-6', '選んだ2件だけが完全に消える', 3, afterPurge.length);
check('T-6b', '消したものが残っていない', false,
  afterPurge.some((x) => ['multi-1', 'legacy-2'].includes(x.id)));

// ── T-8 再起動（全件取得 → リスナー） ──────────────────────
const 全件 = (await getDocs(trashCol)).size;                  // fetchAndOverwriteFromCloud :1780
const 再起動後 = (await listen()).length;                      // listenToTrash
check('T-8', '再起動してもゴミ箱の中身が保たれる', 全件, 再起動後);

// ── T-7 すべて削除 ─────────────────────────────────────────
await emptyTrash(await listen());
check('T-7', 'すべて削除でゴミ箱が空になる', 0, (await listen()).length);
check('T-7b', 'Firestore からも消えている', 0, (await getDocs(trashCol)).size);

// ── T-9 50件を超えても全部出るか ───────────────────────────
const many = [];
for (let i = 0; i < 60; i++) many.push(mkSession(`bulk-${String(i).padStart(3, '0')}`, Date.now() - i * 6e4));
for (let i = 0; i < many.length; i += 400) {
  const b = writeBatch(db);
  many.slice(i, i + 400).forEach((s) => b.set(doc(sessCol, s.id), s));
  await b.commit();
}
await deleteMultipleSessions(many);
check('T-9', '60件でも全部ゴミ箱に出る（旧実装は50件で頭打ち）', 60, (await listen()).length);
check('T-9b', '（対比）修正前のクエリは50件で止まる', 50, await listenOld());

// ── 後始末 ────────────────────────────────────────────────
await wipe(trashCol);
await wipe(sessCol);

console.table(results);
const ng = results.filter((r) => r.判定 === 'NG');
console.log(`\n合格 ${results.length - ng.length} / 不合格 ${ng.length}`);
process.exit(ng.length ? 1 : 0);
