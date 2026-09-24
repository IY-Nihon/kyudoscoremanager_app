/**
 * 差分の同期と起動の境目が、本物の Firestore でも成り立つかを確かめる。書く。検証環境だけ。
 *
 *   node scripts/verify-warm-start.mjs
 *
 * 差分の同期（src/useScoreStore.js の syncSessions）は、lastModified が境目以降の文書だけを
 * 日時型で問い合わせる。境目は雲から読んだままの文書の、日時型の lastModified の最大
 * （src/syncRules.js の 境目を進める）。偽の Firestore（test/helpers/storeHarness.js）は
 * これに合わせて作ってあるが、本物が同じ振る舞いかをここで見る。
 *   1. serverTimestamp で書いた lastModified は、読むと日時型（toMillis を持つ）で返る
 *   2. 端末の時計の数や、日時型を JSON に通した入れ物は、境目に数えない
 *   3. 境目ちょうどの文書も差分の問い合わせに返る（>=。マイクロ秒の端数があっても落ちない）
 *   4. 数・入れ物の lastModified は、日時型の問い合わせに返らない
 *   5. 直した文書は次の差分に返り、境目が進む
 *   6. 控えから外した記録を id で取り直せる（documentId() の in。雲に無い id は返らない）
 *
 * 使い捨ての団体（997xxx）と口座を作り、終わったら消す。
 */
import { createRequire } from 'node:module';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, deleteUser } from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  query,
  where,
  getDocs,
  setDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
  documentId,
} from 'firebase/firestore';
import { configFor, signIn } from './fb-rest.mjs';

const { 境目を進める } = createRequire(import.meta.url)('../src/syncRules.js');
const { apiKey, projectId } = configFor('stg');
if (projectId !== 'kyudoscoremanager-stg') {
  console.error('検証環境の設定を読めませんでした。中止します。');
  process.exit(1);
}

const 印 = Date.now().toString(36);
const 団体 = '997' + String(Math.floor(Math.random() * 1000)).padStart(3, '0');
const メール = `warm-${印}@example.com`;
const 合言葉 = `Warm-${印}-x9`;

let だめ = 0;
const 見る = (題, 良いか, 添え) => {
  console.log(`  ${良いか ? 'ok ' : '★  '} ${題}${添え ? '  … ' + 添え : ''}`);
  if (!良いか) だめ++;
};

console.log(`${projectId} / 使い捨ての団体 ${団体} で差分の同期の境目を確かめます\n`);
await signIn(apiKey, メール, 合言葉, { create: true });
const app = initializeApp({ apiKey, projectId });
const auth = getAuth(app);
await signInWithEmailAndPassword(auth, メール, 合言葉);
const db = getFirestore(app);
const 記録の置き場 = collection(db, `groups/${団体}/sessions`);
const 置いた = [];
const 置く = async (id, 中身) => {
  await setDoc(doc(記録の置き場, id), Object.assign({ id, title: id }, 中身));
  置いた.push(id);
};
const 読んだまま = (返り) => 返り.docs.map((文書) => 文書.data());
const 差分 = (境目) =>
  getDocs(query(記録の置き場, where('lastModified', '>=', Timestamp.fromMillis(境目))));

try {
  await setDoc(doc(db, 'group_accounts', 団体), { id: 団体, email: メール });
  await 置く('a', { lastModified: serverTimestamp() });
  await 置く('b', { lastModified: serverTimestamp() });
  // 時計が 1 時間進んだ端末が、数で書いたもの
  await 置く('c', { lastModified: Date.now() + 3600000 });
  // 日時型を JSON に通した入れ物（map として残る）
  await 置く('d', { lastModified: JSON.parse(JSON.stringify(Timestamp.fromMillis(Date.now() + 7200000))) });

  const 全部 = await getDocs(記録の置き場);
  const 生 = Object.fromEntries(全部.docs.map((文書) => [文書.id, 文書.data()]));
  見る(
    '1. serverTimestamp の lastModified は日時型で返る',
    typeof 生.a.lastModified?.toMillis === 'function' && typeof 生.b.lastModified?.toMillis === 'function'
  );
  const 境目 = 境目を進める(0, 読んだまま(全部));
  const サーバーの最大 = Math.max(生.a.lastModified.toMillis(), 生.b.lastModified.toMillis());
  見る(
    '2. 境目はサーバーの時刻の最大。数・入れ物は数えない',
    境目 === サーバーの最大,
    `境目 ${new Date(境目).toISOString()} / 数 ${new Date(生.c.lastModified).toISOString()}`
  );

  const 一回目 = await 差分(境目);
  const 一回目のid = 一回目.docs.map((文書) => 文書.id).sort();
  const ちょうど = ['a', 'b'].filter((id) => 生[id].lastModified.toMillis() === 境目);
  見る(
    '3. 境目ちょうどの文書も差分に返る',
    ちょうど.every((id) => 一回目のid.includes(id)),
    `返った ${一回目のid.join(',') || '(なし)'} / ちょうど ${ちょうど.join(',')}`
  );
  見る(
    '4. 数・入れ物の lastModified は日時型の問い合わせに返らない',
    !一回目のid.includes('c') && !一回目のid.includes('d')
  );

  // 別の端末が a を直した
  await 置く('a', { title: '直した', lastModified: serverTimestamp() });
  const 二回目 = await 差分(境目);
  const 二回目のid = 二回目.docs.map((文書) => 文書.id);
  const 次の境目 = 境目を進める(境目, 読んだまま(二回目));
  見る(
    '5. 直した文書は次の差分に返り、境目が進む',
    二回目のid.includes('a') &&
      二回目.docs.find((文書) => 文書.id === 'a').data().title === '直した' &&
      次の境目 > 境目,
    `返った ${二回目のid.sort().join(',')}`
  );

  const idで = await getDocs(query(記録の置き場, where(documentId(), 'in', ['a', 'c', '無い記録'])));
  const idで取れた = idで.docs.map((文書) => 文書.id).sort();
  見る('6. id で取り直せる。雲に無い id は返らない', idで取れた.join(',') === 'a,c', `返った ${idで取れた.join(',')}`);
} finally {
  for (const id of new Set(置いた)) await deleteDoc(doc(記録の置き場, id)).catch(() => {});
  await deleteDoc(doc(db, 'group_accounts', 団体)).catch(() => {});
  await deleteUser(auth.currentUser).catch(() => {});
}
console.log('');
if (だめ) {
  console.log(`${だめ} 件が意図どおりではありません。`);
  process.exit(1);
}
console.log('すべて意図どおりです。使い捨ての団体と口座は消しました。');
process.exit(0);
