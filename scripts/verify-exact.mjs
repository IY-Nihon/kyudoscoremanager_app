// scripts/verify-exact.mjs
// バックアップ直後にFirestoreの実データと1文字単位で照合するスクリプト
// backup.yml の中でバックアップ実行直後に呼ばれる

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getDatabase } from 'firebase-admin/database';
import { readFileSync, readdirSync } from 'fs';
import { gunzipSync } from 'zlib';
import { resolve } from 'path';

// ─────────────────────────────────────────
// 初期化
// ─────────────────────────────────────────

const firebaseServiceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
const app = initializeApp({
  credential: cert(firebaseServiceAccount),
  databaseURL: 'https://kyudoscoremanager-default-rtdb.firebaseio.com',
});
const db = getFirestore();
const auth = getAuth();
const rtdb = getDatabase(app);

// ─────────────────────────────────────────
// バックアップ読み込み
// ─────────────────────────────────────────

function loadBackup() {
  const dir = './backup-output';
  const files = readdirSync(dir).filter(f => f.endsWith('.json.gz')).sort();
  if (files.length === 0) throw new Error('backup-output/ にファイルがありません');
  const latest = files.at(-1);
  console.log(`📂 照合対象: ${latest}`);
  return JSON.parse(gunzipSync(readFileSync(resolve(dir, latest))).toString('utf8'));
}

// ─────────────────────────────────────────
// 値の正規化（比較前に型を揃える）
// ─────────────────────────────────────────

function normalize(value) {
  if (value === null || value === undefined) return null;
  // Firestore Timestamp → 数値（ミリ秒）
  if (typeof value?.toDate === 'function') return value.toDate().getTime();
  if (Array.isArray(value)) return value.map(normalize);
  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => [k, normalize(v)])
    );
  }
  return value;
}

// バックアップ値の正規化（ISOString → 数値）
function normalizeBk(value) {
  if (value === null || value === undefined) return null;
  // ISOString → 数値（sanitize でタイムスタンプを文字列化したものを戻す）
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
    return new Date(value).getTime();
  }
  if (Array.isArray(value)) return value.map(normalizeBk);
  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => [k, normalizeBk(v)])
    );
  }
  return value;
}

// ─────────────────────────────────────────
// 差分検出
// ─────────────────────────────────────────

function diff(fbVal, bkVal, path, diffs) {
  const fb = normalize(fbVal);
  const bk = normalizeBk(bkVal);
  const fbStr = JSON.stringify(fb);
  const bkStr = JSON.stringify(bk);
  if (fbStr !== bkStr) {
    diffs.push({ path, fb: fbStr?.slice(0, 100), bk: bkStr?.slice(0, 100) });
  }
}

function diffObjects(fbData, bkData, prefix, diffs) {
  const allKeys = new Set([...Object.keys(fbData || {}), ...Object.keys(bkData || {})]);
  for (const key of allKeys) {
    diff(fbData?.[key], bkData?.[key], `${prefix}.${key}`, diffs);
  }
}

// ─────────────────────────────────────────
// コレクション照合
// ─────────────────────────────────────────

async function verifyCollection(colRef, bkDocs, label) {
  const docRefs = await colRef.listDocuments();
  const bkMap = Object.fromEntries((bkDocs || []).map(d => [d.id, d._fields || {}]));
  const fbIds = docRefs.map(r => r.id);
  const bkIds = Object.keys(bkMap);

  let errors = 0;

  // 件数チェック
  if (fbIds.length !== bkIds.length) {
    console.log(`  ❌ ${label}: 件数不一致 Firebase=${fbIds.length} BK=${bkIds.length}`);
    const missingInBk = fbIds.filter(id => !bkMap[id]);
    const extraInBk = bkIds.filter(id => !fbIds.includes(id));
    if (missingInBk.length) console.log(`     BK未収録ID: ${missingInBk.slice(0, 5).join(', ')}`);
    if (extraInBk.length) console.log(`     BK余分ID:   ${extraInBk.slice(0, 5).join(', ')}`);
    errors++;
  }

  // 中身チェック
  let fieldDiffs = 0;
  for (const docRef of docRefs) {
    const snap = await docRef.get();
    const fbFields = snap.exists ? snap.data() : {};
    const bkFields = bkMap[docRef.id];
    if (!bkFields) continue;

    const diffs = [];
    diffObjects(fbFields, bkFields, docRef.id, diffs);
    if (diffs.length > 0) {
      fieldDiffs += diffs.length;
      for (const d of diffs.slice(0, 2)) {
        console.log(`     差分 ${d.path}`);
        console.log(`       Firebase:  ${d.fb}`);
        console.log(`       バックアップ: ${d.bk}`);
      }
    }
  }

  if (fieldDiffs > 0) {
    console.log(`  ❌ ${label}: フィールド差分 ${fieldDiffs} 箇所`);
    errors++;
  } else if (fbIds.length === bkIds.length) {
    console.log(`  ✅ ${label}: ${fbIds.length}件 完全一致`);
  }

  return errors;
}

// ─────────────────────────────────────────
// メイン
// ─────────────────────────────────────────

async function main() {
  console.log('\n🔍 バックアップ完全照合を開始します\n');

  const backup = loadBackup();
  const bFirestore = backup.firestore || {};
  const bkGroups = bFirestore.groups || [];

  let totalErrors = 0;

  // ① group_accounts
  console.log('=== group_accounts ===');
  const gaRef = db.collection('group_accounts');
  totalErrors += await verifyCollection(gaRef, bFirestore.group_accounts, 'group_accounts');

  // ② 各グループのサブコレクション
  const gaDocs = await gaRef.listDocuments();
  for (const gaRef of gaDocs) {
    const gid = gaRef.id;
    const gaSnap = await gaRef.get();
    const name = gaSnap.exists ? (gaSnap.data().name || '不明') : '不明';
    console.log(`\n=== グループ ${gid} (${name}) ===`);

    const bkGroup = bkGroups.find(g => g.id === gid);
    if (!bkGroup) {
      console.log(`  ❌ バックアップに存在しない`);
      totalErrors++;
      continue;
    }

    const bkCols = bkGroup._collections || {};
    for (const col of ['sessions', 'members', 'config', 'trash', 'officialPracticeDays']) {
      const colRef = db.collection('groups').doc(gid).collection(col);
      totalErrors += await verifyCollection(colRef, bkCols[col], col);
    }
  }

  // ③ RTDB
  console.log('\n=== RTDB live_sessions ===');
  const rtdbSnap = await rtdb.ref('/live_sessions').once('value');
  const fbRtdb = rtdbSnap.val() || {};
  const bkRtdb = (backup.rtdb || {}).live_sessions || {};
  const fbJson = JSON.stringify(normalize(fbRtdb));
  const bkJson = JSON.stringify(normalizeBk(bkRtdb));
  if (fbJson === bkJson) {
    console.log(`  ✅ RTDB live_sessions: 完全一致`);
  } else {
    console.log(`  ❌ RTDB live_sessions: 差分あり`);
    totalErrors++;
  }

  // ④ Firebase Auth
  console.log('\n=== Firebase Auth ===');
  const authUsers = [];
  let pageToken;
  do {
    const result = await auth.listUsers(1000, pageToken);
    authUsers.push(...result.users);
    pageToken = result.pageToken;
  } while (pageToken);
  const bkUsers = backup.auth?.users || [];
  const authOk = authUsers.length === bkUsers.length;
  console.log(`  ${authOk ? '✅' : '❌'} Auth: Firebase=${authUsers.length}件 BK=${bkUsers.length}件${authOk ? ' 完全一致' : ' 件数不一致'}`);
  if (!authOk) totalErrors++;

  // ─ 結果
  console.log('\n' + '='.repeat(50));
  if (totalErrors === 0) {
    console.log('✅ 全データが完全に一致しています（1文字の差異もなし）');
  } else {
    console.log(`❌ ${totalErrors} 件の問題が検出されました`);
    process.exitCode = 1;
  }

  await app.delete();
}

main().catch(async err => {
  console.error('\n❌ 照合スクリプトエラー:', err.message);
  await app.delete().catch(() => {});
  process.exit(1);
});
