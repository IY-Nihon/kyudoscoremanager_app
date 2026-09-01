// 検証環境のライブ節点をのぞく。node peek-live.mjs [ライブ名]
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getDatabase, ref, get, remove } from 'firebase/database';
import { configFor, readEnv } from './fb-rest.mjs';

const 名 = process.argv[2];
const env = readEnv('.env.development.local');
const { databaseURL } = configFor('stg');
const app = initializeApp({
  apiKey: env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  databaseURL,
  appId: env.EXPO_PUBLIC_FIREBASE_APP_ID,
});
await signInAnonymously(getAuth(app));
const db = getDatabase(app);

// ライブは団体IDではなく、団体ごとの推測できない合言葉の枝に置く
// （src/liveSecret.js）。合言葉は Firestore の groups/{団体}.liveSecret に
// あり、匿名でつなぐこの道具からは読めない。ブラウザの開発者ツールで
//   JSON.parse(localStorage["archery-score-storage"]).state.ライブの合言葉
// を見て、LIVE_BRANCH に入れて動かす
const 枝 = process.env.LIVE_BRANCH;
if (!枝 || 枝.length < 20) {
  console.error('LIVE_BRANCH にライブの合言葉を入れてください（上の説明を参照）');
  process.exit(1);
}

if (!名) {
  const 全部 = (await get(ref(db, `live_sessions/${枝}`))).val() || {};
  console.log('ライブ一覧:', Object.keys(全部));
  process.exit(0);
}
const 根 = `live_sessions/${枝}/${名}`;
if (process.argv[3] === '消す') {
  (await remove(ref(db, 根)), await remove(ref(db, `live_history/${枝}/${名}`)));
  console.log('消しました:', 名, '（共有履歴も）');
  process.exit(0);
}
const 状態 = (await get(ref(db, `${根}/state`))).val();
if (!状態) {
  console.log('state 無し');
  process.exit(0);
}
console.log('len/max :', 状態.history_len, '/', 状態.history_max);
console.log('知らせ  :', 状態.history_kind, 状態.history_at);
console.log('射手    :', (状態.archers || []).map((a) => `${a && a.id}:${a && a.name}`).join(' , '));
console.log('marks   :', JSON.stringify(状態.marks_by_id));
console.log('日時    :', JSON.stringify(状態.archer_timestamps), 'timestamp=', 状態.timestamp);
// 共有履歴はライブの枝の外（live_history）。参加一覧の取得を軽くするため
const 履歴 = (await get(ref(db, `live_history/${枝}/${名}`))).val();
console.log('履歴の数:', 履歴 ? Object.keys(履歴).length : 0, 履歴 ? Object.keys(履歴) : '');
const 中の古い履歴 = (await get(ref(db, `${根}/history`))).val();
if (中の古い履歴) console.log('★ 中にも古い履歴が残っている:', Object.keys(中の古い履歴).length, '手');
for (const k of Object.keys(履歴 || {})) {
  const h = 履歴[k];
  const 見 = (l) => (l || []).map((a) => (a.marks || []).join('')).join('|');
  console.log(`  [${k}] 前=${見(h.前)}  後=${見(h.後)}`);
}
process.exit(0);
