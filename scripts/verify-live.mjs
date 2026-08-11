/**
 * ライブ記録（Realtime Database）の直しを、実際の検証サーバーで確かめる。
 *
 *   node scripts/verify-live.mjs [stg]
 *
 * 手元の検査（test/liveSync.test.js）は偽の RTDB を相手にしている。
 * その偽物が本物と同じ振る舞いをしているか——とくに「配列の中の null は
 * 落とされて添字のオブジェクトになる」という前提が本当かを、ここで確かめる。
 * この前提が崩れていると、矢所の直しが本番で効かない。
 *
 * stg 専用（書いて消すため）。
 */
import { configFor, signIn } from './fb-rest.mjs';

const target = process.argv[2] || 'stg';
if (target !== 'stg') {
  console.error('stg 専用です');
  process.exit(1);
}

const { apiKey, databaseURL } = configFor('stg');
const PW = 'StgTest!2026';
const G1 = '100001';
const 名 = `検証ライブ-${Date.now()}`;
const 道 = `/live_sessions/${G1}/${名}/state`;

const rows = [];
const check = (区分, 項目, 期待, 実際, 備考 = '') => {
  const ok = JSON.stringify(期待) === JSON.stringify(実際);
  rows.push({ 区分, 項目, 期待: JSON.stringify(期待), 実際: JSON.stringify(実際), 判定: ok ? 'OK' : 'NG', 備考 });
};

const tok = await signIn(apiKey, 'nihonu.kouka@gmail.com', PW);
const rt = async (method, path, body) => {
  const r = await fetch(`${databaseURL}${path}.json?auth=${tok}`, {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: r.status, json: r.status === 200 ? await r.json() : null };
};

try {
  // ── 1. 前提の確認：null 混じりの配列はどう保存されるか ────────────
  await rt('PUT', `${道}/前提_null混じり`, [null, { x: 1, y: 2 }, null]);
  const a = await rt('GET', `${道}/前提_null混じり`);
  check(
    '前提',
    'null の要素は保存されず、末尾の null は落ちる',
    [null, { x: 1, y: 2 }],
    a.json,
    '長さが変わる。これが理由で矢所は空欄を "" にして送る'
  );

  await rt('PUT', `${道}/前提_空文字混じり`, ['', { x: 1, y: 2 }, '']);
  const b = await rt('GET', `${道}/前提_空文字混じり`);
  check('前提', '空文字混じりなら配列のまま保たれる', ['', { x: 1, y: 2 }, ''], b.json, '位置がずれない');

  await rt('PUT', `${道}/前提_全部null`, [null, null, null]);
  const c = await rt('GET', `${道}/前提_全部null`);
  check('前提', '全部 null の配列は丸ごと消える', null, c.json, '「無い」と「空」が区別できなくなる');

  // ── 2. アプリと同じ形で矢所を往復させる ──────────────────────
  const 射手 = {
    id: 'a1',
    name: '検証射手',
    gender: '男性',
    grade: 1,
    isSeparator: false,
    isTotalCalculator: false,
    isGuest: false,
    memberId: null,
    lockedBlocks: {},
    substitutions: {},
    substitutionIds: {},
    bowWeight: null,
    lastModified: Date.now(),
    // b() が作る形：空欄は '' で送る
    arrowLocations: ['', { x: 12, y: 34 }, '', ''],
  };
  const st = await rt('PUT', 道, {
    archers: [射手],
    marks_by_id: { a1: ['', '', '', ''] },
    archer_timestamps: { a1: 射手.lastModified },
    shotsPerRound: 4,
    timestamp: Date.now(),
    status: 'active',
  });
  check('往復', 'ライブの状態を書ける', 200, st.status);

  const 読み = await rt('GET', 道);
  check('往復', '矢所が配列のまま戻る', ['', { x: 12, y: 34 }, '', ''], 読み.json.archers[0].arrowLocations);
  check('往復', '矢所の位置がずれない', { x: 12, y: 34 }, 読み.json.archers[0].arrowLocations[1]);

  // ── 3. 1射ごとの軽量送信で、矢所が消えないこと ──────────────
  // updateMark は marks_by_id と archer_timestamps だけを更新する。
  // このとき archers（矢所を含む）に触らないことを確かめる
  const 後 = Date.now();
  await rt('PATCH', 道, { 'marks_by_id/a1/3': '○', 'archer_timestamps/a1': 後, timestamp: 後 });
  const 読み2 = await rt('GET', 道);
  check('1射ごと', '○が入る', '○', 読み2.json.marks_by_id.a1[3]);
  check(
    '1射ごと',
    '矢所は触られない',
    ['', { x: 12, y: 34 }, '', ''],
    読み2.json.archers[0].arrowLocations,
    '軽量送信は archers を書き換えない'
  );

  // ── 4. 矢所を持たない古い版が上書きしたときの見え方 ────────────
  const 古い = { ...射手 };
  delete 古い.arrowLocations;
  await rt('PUT', `${道}/archers`, [古い]);
  const 読み3 = await rt('GET', 道);
  check(
    '互換',
    '古い版が送ると矢所の項目ごと消える',
    undefined,
    読み3.json.archers[0].arrowLocations,
    'このとき受信側は手元の矢所を残す（mergeLiveArchers）'
  );

  // ── 5. 後始末 ──────────────────────────────────────────
  const 消し = await rt('DELETE', `/live_sessions/${G1}/${名}`);
  check('後始末', 'ライブを消せる', 200, 消し.status);
  const 残り = await rt('GET', `/live_sessions/${G1}/${名}`);
  check('後始末', '消えている', null, 残り.json);
} finally {
  await fetch(`${databaseURL}/live_sessions/${G1}/${名}.json?auth=${tok}`, { method: 'DELETE' }).catch(() => {});
}

console.table(rows);
const 不合格 = rows.filter((r) => r.判定 === 'NG').length;
console.log(`\n合格 ${rows.length - 不合格} / 不合格 ${不合格}`);
process.exit(不合格 ? 1 : 0);
