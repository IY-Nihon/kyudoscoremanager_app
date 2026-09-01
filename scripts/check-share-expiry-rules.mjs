/**
 * 共有リンクの期限が、決まり（database.rules.json）の側で本当に効いているかを
 * 検証環境の Realtime Database に当てて確かめる。
 *
 *   node scripts/check-share-expiry-rules.mjs
 *
 * 画面の側で「期限切れです」と出すだけなら、開発者ツールで素通りできる。
 * ここで見たいのは「素通りできないこと」なので、SDK を直に叩いて確かめる。
 * つまりこの道具そのものが、改造した端末の役をしている。
 *
 * 使い捨ての枝を作り、終わったら片付ける。ほかの検証には触らない。
 */
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getDatabase, ref, get, set, remove } from 'firebase/database';
import { configFor, readEnv } from './fb-rest.mjs';

const env = readEnv('.env.development.local');
const { databaseURL, projectId } = configFor('stg');
if (projectId !== 'kyudoscoremanager-stg') {
  console.error('停止：検証環境を指していません');
  process.exit(1);
}
const app = initializeApp({
  apiKey: env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  databaseURL,
  appId: env.EXPO_PUBLIC_FIREBASE_APP_ID,
});
await signInAnonymously(getAuth(app));
const db = getDatabase(app);

const 枝 = 'zzテスト期限' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
const 名 = 'ルール確認';
let 合否 = [];
const 確かめる = (題, 実際, 期待) => {
  const ok = 実際 === 期待;
  合否.push(ok);
  console.log(`  ${ok ? '○' : '×'} ${題}${ok ? '' : `（${実際} を期待したのは ${期待}）`}`);
};

/** 通ったら 'できた'、決まりに弾かれたら '弾かれた'、それ以外は理由 */
const 試す = async (f) => {
  try {
    await f();
    return 'できた';
  } catch (e) {
    return /permission[ _]denied/i.test(String(e && e.message)) ? '弾かれた' : String(e && e.message);
  }
};

console.log(`検証環境（${projectId}）で期限の決まりを確かめる\n枝: ${枝}\n`);

console.log('■ 期限が無いあいだは、これまでどおり');
確かめる('書ける', await 試す(() => set(ref(db, `live_sessions/${枝}/${名}/state`), { archers: { a1: { name: '一人目' } }, timestamp: Date.now() })), 'できた');
確かめる('読める', await 試す(() => get(ref(db, `live_sessions/${枝}/${名}/state`))), 'できた');

console.log('\n■ 先の期限を置いても、まだ通る');
確かめる('期限を置ける', await 試す(() => set(ref(db, `live_limits/${枝}`), Date.now() + 3600000)), 'できた');
確かめる('読める', await 試す(() => get(ref(db, `live_sessions/${枝}/${名}/state`))), 'できた');
確かめる('書ける', await 試す(() => set(ref(db, `live_sessions/${枝}/${名}/state`), { archers: { a1: { name: '一人目' } }, timestamp: Date.now() })), 'できた');

console.log('\n■ 期限は縮められるが、延ばせない');
const 過去 = Date.now() - 1000;
確かめる('延ばそうとすると弾かれる', await 試す(() => set(ref(db, `live_limits/${枝}`), Date.now() + 99999999)), '弾かれた');
確かめる('縮めるのは通る', await 試す(() => set(ref(db, `live_limits/${枝}`), 過去)), 'できた');

console.log('\n■ 切れたら、もう読めない（ここが要）');
確かめる('読めない', await 試す(() => get(ref(db, `live_sessions/${枝}/${名}/state`))), '弾かれた');
確かめる('枝ごと読むのも弾かれる', await 試す(() => get(ref(db, `live_sessions/${枝}`))), '弾かれた');
確かめる('書けない', await 試す(() => set(ref(db, `live_sessions/${枝}/${名}/state`), { archers: { a1: { name: '書けたら困る' } } })), '弾かれた');
確かめる('写しも読めない', await 試す(() => get(ref(db, `live_view/${枝}`))), '弾かれた');

console.log('\n■ 期限を外してよみがえらせることはできない');
確かめる('中身が残っているうちは消せない', await 試す(() => remove(ref(db, `live_limits/${枝}`))), '弾かれた');

console.log('\n■ 片付けはできる（残骸が読めないまま溜まらないように）');
確かめる('枝ごとなら消せる', await 試す(() => remove(ref(db, `live_sessions/${枝}`))), 'できた');
確かめる('中身が無くなれば期限も消せる', await 試す(() => remove(ref(db, `live_limits/${枝}`))), 'できた');

console.log('\n■ 短い枝はこれまでどおり断る');
確かめる('6桁の団体IDでは読めない', await 試す(() => get(ref(db, 'live_sessions/100001'))), '弾かれた');

await remove(ref(db, `live_sessions/${枝}`)).catch(() => {});
await remove(ref(db, `live_limits/${枝}`)).catch(() => {});
const 落ち = 合否.filter((x) => !x).length;
console.log(`\n${合否.length - 落ち}/${合否.length} 通過`);
process.exit(落ち ? 1 : 0);
