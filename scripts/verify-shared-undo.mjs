/**
 * 共有履歴（取り消し・やり直し）を、本物の Firebase SDK で確かめる。
 *
 *   node scripts/verify-shared-undo.mjs [stg]
 *
 * 手元の検査は偽の RTDB を相手にしている。ここでは実際の SDK と検証サーバーで
 * 同じ順序を踏み、ストアが使う関数（get / update / set / remove）が
 * 期待どおり動くかを見る。stg 専用。
 */
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getDatabase, ref, get, set, update, remove, onValue, serverTimestamp } from 'firebase/database';
import { configFor, readEnv } from './fb-rest.mjs';

const target = process.argv[2] || 'stg';
if (target !== 'stg') {
  console.error('stg 専用です');
  process.exit(1);
}

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

const rows = [];
const check = (項目, 期待, 実際, 備考 = '') => {
  const ok = JSON.stringify(期待) === JSON.stringify(実際);
  rows.push({ 項目, 期待: JSON.stringify(期待), 実際: JSON.stringify(実際), 判定: ok ? 'OK' : 'NG', 備考 });
};

const 名 = `共有履歴の検証-${Date.now()}`;
// ライブは団体IDではなく、団体ごとの合言葉の枝に置く（src/liveSecret.js）。
// この道具は自分で作って自分で消すので、本物の合言葉は要らない。
// 決まりは枝の長さしか見ないため、検査用の長い枝で足りる
const 枝 = 'verify-shared-undo-0000000000';
const 根 = `live_sessions/${枝}/${名}`;
// 共有履歴はライブの枝の外。参加一覧が live_sessions/{団体} を丸ごと読むとき、
// 中に置いていると履歴まで降りてきて重い（実測 47KB のうち 43KB が履歴だった）
const 履歴の根 = `live_history/${枝}/${名}`;

try {
  // ── ストアと同じ順序を踏む ───────────────────────────────
  // 1. ライブ開始（state を置く）
  await update(ref(db, `${根}/state`), {
    archers: [{ id: 'a1', name: '一人目', lastModified: 1000 }],
    marks_by_id: { a1: ['', '', '', ''] },
    archer_timestamps: { a1: 1000 },
    shotsPerRound: 4,
    timestamp: Date.now(),
    status: 'active',
  });
  check('ライブを開始できる', true, (await get(ref(db, `${根}/state`))).exists());

  // 2. 1手ぶん共有履歴に積む（state の外へ書き、目印だけ state に置く）
  await set(ref(db, `${履歴の根}/0`), {
    前: [{ id: 'a1', name: '一人目', marks: ['', '', '', ''], lastModified: 1000 }],
    後: [{ id: 'a1', name: '一人目', marks: ['○', '', '', ''], lastModified: 2000 }],
    本数: 4,
    at: Date.now(),
  });
  await update(ref(db, `${根}/state`), { history_len: 1, history_max: 1 });
  const 状態1 = (await get(ref(db, `${根}/state`))).val();
  check('目印が state に載る', [1, 1], [状態1.history_len, 状態1.history_max], '全員へ配られる');

  // 3. 履歴はライブの枝の外にあること。参加一覧は live_sessions/{団体} を
  //    丸ごと読むので、中にあると一覧の取得に履歴まで付いてくる
  check('履歴は state の中に入っていない', undefined, 状態1.history, '再取得が重くならない');
  const ライブの枝 = (await get(ref(db, 根))).val();
  check('履歴はライブの枝の中にも無い', ['state'], Object.keys(ライブの枝 || {}), '一覧の取得が軽い');

  // 4. 取り消し：目印の1つ手前を読む
  const 手 = (await get(ref(db, `${履歴の根}/0`))).val();
  check('履歴を添字で直接読める', '○', 手.後[0].marks[0], '問い合わせ（query）を使わない');
  check('取り消し先の盤面が入っている', '', 手.前[0].marks[0]);
  await update(ref(db, `${根}/state`), {
    history_len: 0,
    history_max: 1,
    history_at: Date.now(),
    history_kind: '取り消し',
  });
  const 状態2 = (await get(ref(db, `${根}/state`))).val();
  check('取り消しで目印が戻る', [0, 1], [状態2.history_len, 状態2.history_max]);
  check('取り消しの知らせが載る', '取り消し', 状態2.history_kind);

  // 5. やり直し：目印の位置を読む
  const 手2 = (await get(ref(db, `${履歴の根}/0`))).val();
  check('やり直し先の盤面が入っている', '○', 手2.後[0].marks[0]);
  await update(ref(db, `${根}/state`), { history_len: 1, history_max: 1, history_kind: 'やり直し' });
  check('やり直しで目印が進む', 1, (await get(ref(db, `${根}/state`))).val().history_len);

  // 6. 上限を超えた古い手を捨てられる
  await remove(ref(db, `${履歴の根}/0`));
  check('古い手を捨てられる', false, (await get(ref(db, `${履歴の根}/0`))).exists());

  // 7. サーバーの時計まわり。手元の偽 RTDB では再現できないので、ここで見る。
  //    古いライブを消すかどうかはこの時刻で決まるため、黙って手元の時計に
  //    落ちると、時計の狂った端末が使用中のライブを消しかねない
  let getで読めた = true;
  try {
    await get(ref(db, '.info/serverTimeOffset'));
  } catch (e) {
    getで読めた = false;
  }
  check('時差は get では読めない', false, getで読めた, 'onValue を使うこと');
  const 差 = await new Promise((r) => {
    let 解除;
    解除 = onValue(ref(db, '.info/serverTimeOffset'), (s) => {
      (r(s.val()), 解除 && 解除());
    });
  });
  check('時差は onValue で読める', 'number', typeof 差, `いまの差 ${差}ms`);

  // 8. サーバーが打つ日時が state に入る（参加一覧の判定はこれを見る）
  await update(ref(db, `${根}/state`), { timestamp: 1, updated_at: serverTimestamp() });
  const 状態3 = (await get(ref(db, `${根}/state`))).val();
  check('updated_at はサーバーが打つ', true, 状態3.updated_at > Date.now() - 60000);
  check('timestamp は端末の値のまま', 1, 状態3.timestamp, '自分の送信の返りの見分けに使う');
} finally {
  // 履歴は別の枝にあるので、そちらも片付ける
  (await remove(ref(db, 根)).catch(() => {}), await remove(ref(db, 履歴の根)).catch(() => {}));
}

console.table(rows);
const 不合格 = rows.filter((r) => r.判定 === 'NG').length;
console.log(`\n合格 ${rows.length - 不合格} / 不合格 ${不合格}`);
process.exit(不合格 ? 1 : 0);
