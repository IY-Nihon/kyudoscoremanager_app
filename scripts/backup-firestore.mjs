// scripts/backup-firestore.mjs
// Firestore + RTDB の全データを Google Drive に毎日バックアップするスクリプト
// 保存期間: 直近365日分（366日以上前のファイルは自動削除）

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getDatabase } from 'firebase-admin/database';
import { google } from 'googleapis';
import { createGzip } from 'zlib';
import { Readable } from 'stream';

// ─────────────────────────────────────────
// 環境変数チェック（起動時に全部まとめて確認）
// ─────────────────────────────────────────

const REQUIRED_ENV = [
  'FIREBASE_SERVICE_ACCOUNT_JSON',
  'GDRIVE_SERVICE_ACCOUNT_JSON',
  'GDRIVE_FOLDER_ID',
];
const missingEnv = REQUIRED_ENV.filter(k => !process.env[k]);
if (missingEnv.length > 0) {
  console.error(`❌ 以下の環境変数（GitHub Secrets）が未設定です:\n  ${missingEnv.join('\n  ')}`);
  process.exit(1);
}

// ─────────────────────────────────────────
// JSON.parse を try-catch で囲む
// 壊れたJSONの場合にどのSecretが原因かを明示する
// ─────────────────────────────────────────

let firebaseServiceAccount;
try {
  firebaseServiceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
} catch {
  console.error('❌ FIREBASE_SERVICE_ACCOUNT_JSON が不正なJSONです。GitHub Secretsの登録内容を確認してください。');
  process.exit(1);
}

let gdriveServiceAccount;
try {
  gdriveServiceAccount = JSON.parse(process.env.GDRIVE_SERVICE_ACCOUNT_JSON);
} catch {
  console.error('❌ GDRIVE_SERVICE_ACCOUNT_JSON が不正なJSONです。GitHub Secretsの登録内容を確認してください。');
  process.exit(1);
}

// ─────────────────────────────────────────
// 初期化
// ─────────────────────────────────────────

let app, db, auth, rtdb;
try {
  app = initializeApp({
    credential: cert(firebaseServiceAccount),
    databaseURL: 'https://kyudoscoremanager-default-rtdb.firebaseio.com',
  });
  db = getFirestore();
  auth = getAuth();
  rtdb = getDatabase(app);
} catch {
  console.error('❌ Firebase初期化に失敗しました。FIREBASE_SERVICE_ACCOUNT_JSONが正しいFirebaseサービスアカウントのJSONか確認してください。');
  process.exit(1);
}

// Google Drive への認証
// フォルダ共有で編集者権限のみ付与済みのためバックアップフォルダ以外には影響なし
const driveAuth = new google.auth.GoogleAuth({
  credentials: gdriveServiceAccount,
  scopes: ['https://www.googleapis.com/auth/drive'],
});
const drive = google.drive({ version: 'v3', auth: driveAuth });

const FOLDER_ID = process.env.GDRIVE_FOLDER_ID;
const RETENTION_DAYS = 365;

// ファイル名に JST の日時を含める（同日複数実行でも区別できる）
const nowUtc = new Date();
const jstNow = new Date(nowUtc.getTime() + 9 * 60 * 60 * 1000);
const jstDate = jstNow.toISOString().slice(0, 10);
const jstTime = jstNow.toISOString().slice(11, 19).replace(/:/g, '-');
const BACKUP_FILENAME = `backup-${jstDate}_${jstTime}.json.gz`;

// ─────────────────────────────────────────
// ヘルパー
// ─────────────────────────────────────────

function sanitize(value) {
  if (value === null || value === undefined) return value;
  if (typeof value?.toDate === 'function') return value.toDate().toISOString();
  if (Array.isArray(value)) return value.map(sanitize);
  if (typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, sanitize(v)]));
  }
  return value;
}

function gzipBuffer(jsonString) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    const gz = createGzip();
    gz.on('data', chunk => chunks.push(chunk));
    gz.on('end', () => resolve(Buffer.concat(chunks)));
    gz.on('error', reject);
    gz.write(jsonString);
    gz.end();
  });
}

async function withRetry(fn, maxRetries = 3, delayMs = 30000) {
  const NO_RETRY_STATUS = [401, 403, 404];
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const status = err?.response?.status;
      if (NO_RETRY_STATUS.includes(status)) {
        console.error(`❌ リトライ不要なエラー (HTTP ${status})。処理を中断します。`);
        throw err;
      }
      if (attempt === maxRetries) throw err;
      console.warn(`⚠️  試行 ${attempt}/${maxRetries} 失敗。${delayMs / 1000}秒後にリトライします... (${err.message})`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
}

// ─────────────────────────────────────────
// 再帰的コレクション取得
// ─────────────────────────────────────────

async function backupDocument(docRef, depth = 0) {
  const snap = await docRef.get();
  const result = {
    _fields: snap.exists ? sanitize(snap.data()) : {},
    _collections: {},
  };

  const subcollections = await docRef.listCollections();
  await Promise.all(subcollections.map(async subColRef => {
    const subDocs = await subColRef.get();
    const subResults = await Promise.all(
      subDocs.docs.map(async subDoc => {
        const subData = await backupDocument(subDoc.ref, depth + 1);
        return { id: subDoc.id, ...subData };
      })
    );
    result._collections[subColRef.id] = subResults;
    const indent = '  '.repeat(depth + 1);
    console.log(`${indent}📂 ${subColRef.id}: ${subResults.length}件`);
  }));

  return result;
}

async function backupCollection(colRef, depth = 0) {
  const snap = await colRef.get();
  const results = await Promise.all(
    snap.docs.map(async docSnap => {
      const data = await backupDocument(docSnap.ref, depth);
      return { id: docSnap.id, ...data };
    })
  );
  return results;
}

// ─────────────────────────────────────────
// メイン処理
// ─────────────────────────────────────────

async function main() {
  console.log(`\n🔥 バックアップ開始: ${BACKUP_FILENAME}\n`);

  let backupData;
  try {
    backupData = {
      exportedAt: nowUtc.toISOString(),
      projectId: 'kyudoscoremanager',
      retentionDays: RETENTION_DAYS,
      firestore: {},
      rtdb: null,
      auth: {},
    };

    console.log('📁 Firestore コレクションを検出中...');
    const topCollections = await db.listCollections();
    const topColIds = topCollections.map(c => c.id);
    console.log(`  検出: [${topColIds.join(', ')}]\n`);

    for (const colRef of topCollections) {
      const colId = colRef.id;
      console.log(`📁 ${colId} を取得中...`);
      const docs = await backupCollection(colRef);
      backupData.firestore[colId] = docs;
      console.log(`✅ ${colId}: ${docs.length}件\n`);
    }

    console.log('⚡ RTDB データを取得中...');
    const rtdbSnap = await rtdb.ref('/').once('value');
    const rtdbData = rtdbSnap.val() ?? {};

    const liveSessions = rtdbData.live_sessions ?? {};
    const liveGroupIds = Object.keys(liveSessions);
    if (liveGroupIds.length === 0) {
      console.log('✅ RTDB live_sessions: 空（未保存データなし）');
    } else {
      for (const gid of liveGroupIds) {
        const sessions = liveSessions[gid] ?? {};
        const sessionNames = Object.keys(sessions);
        const activeSessions = sessionNames.filter(
          name => sessions[name]?.state?.status === 'active'
        );
        console.log(`⚠️  RTDB グループ ${gid}: ${sessionNames.length}セッション（うちactive: ${activeSessions.length}件）`);
        if (activeSessions.length > 0) {
          console.log(`    未保存セッション: [${activeSessions.join(', ')}]`);
        }
      }
    }
    backupData.rtdb = rtdbData;
    console.log('');

    console.log('👤 Firebase Auth ユーザーを取得中...');
    const authUsers = [];
    let pageToken;
    do {
      const result = await auth.listUsers(1000, pageToken);
      authUsers.push(...result.users.map(u => ({
        uid: u.uid,
        email: u.email,
        createdAt: u.metadata.creationTime,
        lastSignedIn: u.metadata.lastSignInTime,
      })));
      pageToken = result.pageToken;
    } while (pageToken);
    backupData.auth.users = authUsers;
    console.log(`✅ Auth ユーザー: ${authUsers.length}件\n`);

  } catch (err) {
    console.error('❌ データ取得中にエラーが発生しました。アップロードをスキップします。');
    throw err;
  }

  const jsonString = JSON.stringify(backupData, null, 2);
  const sizeKB = Math.round(Buffer.byteLength(jsonString) / 1024);
  console.log(`📄 JSON サイズ: ${sizeKB} KB`);

  const compressed = await gzipBuffer(jsonString);
  const compressedKB = Math.round(compressed.length / 1024);
  console.log(`📦 圧縮後サイズ: ${compressedKB} KB`);

  console.log(`☁️  Google Drive へアップロード中...`);
  await withRetry(() => drive.files.create({
    requestBody: { name: BACKUP_FILENAME, parents: [FOLDER_ID] },
    media: { mimeType: 'application/gzip', body: Readable.from(compressed) },
  }));
  console.log(`✅ アップロード完了: ${BACKUP_FILENAME}`);

  const cutoff = new Date(nowUtc);
  cutoff.setDate(cutoff.getDate() - RETENTION_DAYS);
  const cutoffISO = cutoff.toISOString();

  const oldFiles = await withRetry(() => drive.files.list({
    q: `'${FOLDER_ID}' in parents and createdTime < '${cutoffISO}' and trashed = false`,
    fields: 'files(id, name, createdTime)',
    pageSize: 1000,
  }));

  const toDelete = oldFiles.data.files || [];
  if (toDelete.length === 0) {
    console.log('🗑️  削除対象の古いファイルなし');
  } else {
    for (const file of toDelete) {
      await withRetry(() => drive.files.delete({ fileId: file.id }));
      console.log(`🗑️  削除: ${file.name}`);
    }
  }

  console.log('\n✅ バックアップ完了！\n');
}

main().catch(err => {
  console.error('\n❌ バックアップ失敗:', err);
  process.exit(1);
});
