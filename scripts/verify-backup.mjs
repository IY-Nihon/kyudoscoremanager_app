// scripts/verify-backup.mjs
// Firebaseの実データのカウントを取得してバックアップと照合するスクリプト

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getDatabase, ref, get } from 'firebase/database';

const firebaseConfig = {
  apiKey: 'AIzaSyAQ6boCxhgWryZDYzDCvqx-0hsokPR71oU',
  authDomain: 'kyudoscoremanager.firebaseapp.com',
  databaseURL: 'https://kyudoscoremanager-default-rtdb.firebaseio.com',
  projectId: 'kyudoscoremanager',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const rtdb = getDatabase(app);

async function main() {
  console.log('🔐 Firebaseにログイン中...');
  const adminEmail = process.env.KSM_ADMIN_EMAIL;
  const adminPassword = process.env.KSM_ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword) {
    console.error('❌ 環境変数 KSM_ADMIN_EMAIL / KSM_ADMIN_PASSWORD を設定してください。');
    console.error('   例: $env:KSM_ADMIN_EMAIL="..."; $env:KSM_ADMIN_PASSWORD="..."; node scripts/verify-backup.mjs');
    process.exit(1);
  }
  await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
  console.log('✅ ログイン成功\n');

  // ① group_accounts
  const gaSnap = await getDocs(collection(db, 'group_accounts'));
  console.log(`group_accounts: ${gaSnap.size}件`);
  for (const d of gaSnap.docs) {
    console.log(`  ${d.id} (${d.data().name || '不明'})`);
  }
  console.log();

  // ② 各グループのサブコレクション
  for (const gaDoc of gaSnap.docs) {
    const gid = gaDoc.id;
    const name = gaDoc.data().name || '不明';
    console.log(`グループ ${gid} (${name})`);
    for (const col of ['sessions','members','config','trash','officialPracticeDays']) {
      const snap = await getDocs(collection(db, 'groups', gid, col));
      console.log(`  ${col}: ${snap.size}件`);
    }
    console.log();
  }

  // ③ RTDB
  const rtdbSnap = await get(ref(rtdb, '/live_sessions'));
  const ls = rtdbSnap.val() || {};
  console.log(`RTDB live_sessions: ${Object.keys(ls).length}グループ`);
  for (const [gid, sessions] of Object.entries(ls)) {
    console.log(`  ${gid}: ${Object.keys(sessions).length}セッション`);
  }

  await app.delete();
}

main().catch(async err => {
  console.error('❌ エラー:', err.message);
  await app.delete().catch(() => {});
  process.exit(1);
});
