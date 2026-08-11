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
import { createRequire } from 'node:module';
import { configFor, signIn } from './fb-rest.mjs';

// 判断そのものは実装（src/syncRules.js）をそのまま使う。写すと食い違うため。
const { mergeLiveArchers, normalizeArrowLocations } = createRequire(import.meta.url)('../src/syncRules.js');

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

  // ── 5. 端末を2台に見立てて、本物の判断を実データに当てる ────────
  //
  // アプリの受信側と同じ順序で処理する。
  //   サーバーの値 → 受信の整形（w 相当）→ mergeLiveArchers → 手元の一覧
  // 整形の糊だけこの場で書き、判断は src/syncRules.js のものをそのまま使う。
  const 受信の整形 = (状態) => {
    const 本数 = typeof 状態.shotsPerRound === 'number' ? 状態.shotsPerRound : 8;
    const marks = 状態.marks_by_id || {};
    const 日時 = 状態.archer_timestamps || {};
    return {
      本数,
      archers: (状態.archers || []).filter(Boolean).map((a) => ({
        ...a,
        marks: marks[a.id] ? marks[a.id].map((m) => (m == null ? '' : m)) : a.marks || [],
        lastModified: Math.max(a.lastModified || 0, 日時[a.id] || 0),
        arrowLocations: normalizeArrowLocations(a.arrowLocations, a.isSeparator ? 0 : 本数),
      })),
    };
  };

  // A（主催者）が矢所つきで開始した状態を置く
  const A時刻 = Date.now();
  const A射手 = { ...射手, lastModified: A時刻, arrowLocations: ['', { x: 12, y: 34 }, '', ''] };
  await rt('PUT', 道, {
    archers: [A射手],
    marks_by_id: { a1: ['', '', '', ''] },
    archer_timestamps: { a1: A時刻 },
    shotsPerRound: 4,
    timestamp: A時刻,
    status: 'active',
  });

  // B（参加者）が受け取る。手元は空
  const B受信 = 受信の整形((await rt('GET', 道)).json);
  const B = mergeLiveArchers([], B受信.archers, 4, B受信.本数);
  check('2台', 'B が A の矢所を受け取る', [null, { x: 12, y: 34 }, null, null], B.archers[0].arrowLocations);

  // B が自分の矢所を置き、○を1本入れて軽量送信する。
  // updateMark は「手元に反映してから送る」ので、こちらも同じ順序にする
  const B時刻 = Date.now() + 1;
  const B手元 = [
    {
      ...B.archers[0],
      marks: ['', '', '', '○'],
      arrowLocations: [{ x: 1, y: 2 }, { x: 12, y: 34 }, null, null],
      lastModified: B時刻,
    },
  ];
  await rt('PATCH', 道, { 'marks_by_id/a1/3': '○', 'archer_timestamps/a1': B時刻, timestamp: B時刻 });

  // B が自分の送信の返りを受け取っても、自分の矢所を失わない
  const B返り = 受信の整形((await rt('GET', 道)).json);
  const B2 = mergeLiveArchers(B手元, B返り.archers, 4, B返り.本数);
  check('2台', 'B は自分の矢所を失わない', [{ x: 1, y: 2 }, { x: 12, y: 34 }, null, null], B2.archers[0].arrowLocations);
  check('2台', 'B の○は残る', '○', B2.archers[0].marks[3]);

  // A が受け取る。A は自分の矢所を持ったまま B の○を受け取る
  const A受信 = 受信の整形((await rt('GET', 道)).json);
  const A2 = mergeLiveArchers(
    [{ ...A射手, arrowLocations: [null, { x: 12, y: 34 }, null, null] }],
    A受信.archers,
    4,
    A受信.本数
  );
  check('2台', 'A は B の○を受け取る', '○', A2.archers[0].marks[3]);
  check('2台', 'A の矢所は消えない', [null, { x: 12, y: 34 }, null, null], A2.archers[0].arrowLocations);

  // 古い版の端末が矢所なしで上書きしても、手元の矢所は残る
  const 古い版 = { ...射手, lastModified: Date.now() + 2 };
  delete 古い版.arrowLocations;
  await rt('PUT', `${道}/archers`, [古い版]);
  await rt('PATCH', 道, { 'archer_timestamps/a1': Date.now() + 2, timestamp: Date.now() + 2 });
  const 古い受信 = 受信の整形((await rt('GET', 道)).json);
  const A3 = mergeLiveArchers(A2.archers, 古い受信.archers, 4, 古い受信.本数);
  check('2台', '古い版の上書きでも矢所が残る', [null, { x: 12, y: 34 }, null, null], A3.archers[0].arrowLocations);

  // ── 6. 後始末 ──────────────────────────────────────────
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
