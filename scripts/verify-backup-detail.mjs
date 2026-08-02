// scripts/verify-backup-detail.mjs
// Firebaseの実データとバックアップの中身を詳細に差分チェック

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getDatabase, ref, get } from 'firebase/database';
import { readFileSync, readdirSync } from 'fs';
import { gunzipSync } from 'zlib';
import { resolve } from 'path';

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

// バックアップファイルを読み込む
function loadBackup() {
  const dir = './backup-output';
  const files = readdirSync(dir).filter(f => f.endsWith('.json.gz')).sort();
  if (files.length === 0) throw new Error('backup-output/ にバックアップファイルがありません');
  const latest = files.at(-1);
  console.log(`📂 バックアップ: ${latest}\n`);
  const buf = readFileSync(resolve(dir, latest));
  return JSON.parse(gunzipSync(buf).toString('utf8'));
}

// Firestoreの値とバックアップの値を比較する
function compareValues(fbVal, bkVal, path) {
  const diffs = [];

  // nullや未定義の扱い
  if (fbVal === null || fbVal === undefined) return diffs;
  if (bkVal === null || bkVal === undefined) {
    diffs.push({ path, fb: fbVal, bk: bkVal });
    return diffs;
  }

  // タイムスタンプ（Firestoreはオブジェクト、バックアップはISOString or 数値）
  if (fbVal?.toDate) {
    const fbMs = fbVal.toDate().getTime();
    const bkMs = typeof bkVal === 'string' ? new Date(bkVal).getTime() : bkVal;
    if (Math.abs(fbMs - bkMs) > 1000) {
      diffs.push({ path, fb: fbVal.toDate().toISOString(), bk: bkVal });
    }
    return diffs;
  }

  // 配列
  if (Array.isArray(fbVal)) {
    if (!Array.isArray(bkVal) || fbVal.length !== bkVal.length) {
      diffs.push({ path, fb: `Array(${fbVal.length})`, bk: Array.isArray(bkVal) ? `Array(${bkVal.length})` : bkVal });
    } else {
      fbVal.forEach((v, i) => {
        diffs.push(...compareValues(v, bkVal[i], `${path}[${i}]`));
      });
    }
    return diffs;
  }

  // オブジェクト
  if (typeof fbVal === 'object') {
    for (const key of Object.keys(fbVal)) {
      diffs.push(...compareValues(fbVal[key], bkVal?.[key], `${path}.${key}`));
    }
    return diffs;
  }

  // プリミティブ
  if (String(fbVal) !== String(bkVal)) {
    diffs.push({ path, fb: fbVal, bk: bkVal });
  }
  return diffs;
}

let totalDiffs = 0;

async function checkCollection(gid, colName, bkDocs) {
  const snap = await getDocs(collection(db, 'groups', gid, colName));
  const bkMap = {};
  for (const d of (bkDocs || [])) {
    bkMap[d.id] = d._fields || {};
  }

  let colDiffs = 0;
  let missingInBk = 0;
  let extraInBk = 0;

  // FirebaseにあってバックアップにないID
  for (const fbDoc of snap.docs) {
    const id = fbDoc.id;
    if (!bkMap[id]) {
      missingInBk++;
      continue;
    }
    const diffs = compareValues(fbDoc.data(), bkMap[id], id);
    if (diffs.length > 0) {
      colDiffs += diffs.length;
      for (const d of diffs.slice(0, 3)) {
        console.log(`    差分: ${d.path}`);
        console.log(`      Firebase:  ${JSON.stringify(d.fb)?.slice(0, 80)}`);
        console.log(`      バックアップ: ${JSON.stringify(d.bk)?.slice(0, 80)}`);
      }
      if (diffs.length > 3) console.log(`    ... 他 ${diffs.length - 3} 件の差分`);
    }
  }

  // バックアップにあってFirebaseにないID
  const fbIds = new Set(snap.docs.map(d => d.id));
  for (const id of Object.keys(bkMap)) {
    if (!fbIds.has(id)) extraInBk++;
  }

  const fbCount = snap.size;
  const bkCount = (bkDocs || []).length;
  const countOk = fbCount === bkCount;
  const contentOk = colDiffs === 0 && missingInBk === 0 && extraInBk === 0;

  let status = '✅';
  let note = '';
  if (!countOk) { status = '⚠️'; note += ` 件数差(Firebase:${fbCount} BK:${bkCount})`; }
  if (missingInBk) { status = '⚠️'; note += ` BK未収録:${missingInBk}件`; }
  if (extraInBk) { status = '⚠️'; note += ` BK余分:${extraInBk}件`; }
  if (colDiffs > 0) { status = '❌'; note += ` フィールド差分:${colDiffs}件`; }

  console.log(`  ${status} ${colName}: Firebase=${fbCount} BK=${bkCount}${note}`);
  totalDiffs += colDiffs + missingInBk;
  return contentOk && countOk;
}

async function main() {
  console.log('🔐 Firebaseにログイン中...');
  const adminEmail = process.env.KSM_ADMIN_EMAIL;
  const adminPassword = process.env.KSM_ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword) {
    console.error('❌ 環境変数 KSM_ADMIN_EMAIL / KSM_ADMIN_PASSWORD を設定してください。');
    console.error('   例: $env:KSM_ADMIN_EMAIL="..."; $env:KSM_ADMIN_PASSWORD="..."; node scripts/verify-backup-detail.mjs');
    process.exit(1);
  }
  await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
  console.log('✅ ログイン成功\n');

  const backup = loadBackup();
  const bFirestore = backup.firestore || {};
  const bkGroups = bFirestore.groups || [];

  // group_accounts の中身チェック
  console.log('=== group_accounts ===');
  const gaSnap = await getDocs(collection(db, 'group_accounts'));
  const bkGa = bFirestore.group_accounts || [];
  const bkGaMap = Object.fromEntries(bkGa.map(d => [d.id, d._fields || {}]));
  let gaDiffs = 0;
  for (const d of gaSnap.docs) {
    const diffs = compareValues(d.data(), bkGaMap[d.id] || {}, d.id);
    gaDiffs += diffs.length;
    for (const diff of diffs.slice(0, 3)) {
      console.log(`  差分: ${diff.path} Firebase=${JSON.stringify(diff.fb)?.slice(0,60)} BK=${JSON.stringify(diff.bk)?.slice(0,60)}`);
    }
  }
  console.log(`  ${gaDiffs === 0 ? '✅' : '❌'} ${gaSnap.size}件 フィールド差分: ${gaDiffs}件\n`);

  // 各グループのサブコレクション
  for (const gaDoc of gaSnap.docs) {
    const gid = gaDoc.id;
    const name = gaDoc.data().name || '不明';
    console.log(`=== グループ ${gid} (${name}) ===`);

    const bkGroup = bkGroups.find(g => g.id === gid);
    if (!bkGroup) { console.log('  ❌ バックアップに存在しない\n'); continue; }

    const bkCols = bkGroup._collections || {};
    for (const col of ['sessions','members','config','trash','officialPracticeDays']) {
      await checkCollection(gid, col, bkCols[col] || []);
    }
    console.log();
  }

  // RTDB
  console.log('=== RTDB live_sessions ===');
  const rtdbSnap = await get(ref(rtdb, '/live_sessions'));
  const fbRtdb = rtdbSnap.val() || {};
  const bkRtdb = (backup.rtdb || {}).live_sessions || {};
  const fbGids = Object.keys(fbRtdb);
  const bkGids = Object.keys(bkRtdb);
  console.log(`  Firebase: ${fbGids.length}グループ  BK: ${bkGids.length}グループ  ${fbGids.length === bkGids.length ? '✅' : '⚠️'}`);
  for (const gid of fbGids) {
    const fbSessions = Object.keys(fbRtdb[gid] || {});
    const bkSessions = Object.keys(bkRtdb[gid] || {});
    const ok = fbSessions.length === bkSessions.length;
    console.log(`  ${ok ? '✅' : '⚠️'} ${gid}: Firebase=${fbSessions.length} BK=${bkSessions.length}`);
  }

  console.log('\n' + '='.repeat(50));
  if (totalDiffs === 0) {
    console.log('✅ 全データの中身が一致しています');
  } else {
    console.log(`⚠️ 合計 ${totalDiffs} 件の差分があります（バックアップ後の変更の可能性があります）`);
  }

  process.exit(0);
}

main().catch(err => {
  console.error('❌ エラー:', err.message);
  process.exit(1);
});
