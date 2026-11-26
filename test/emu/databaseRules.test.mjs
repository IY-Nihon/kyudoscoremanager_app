// database.rules.json（ライブ・共有リンクの期限）を模擬環境で確かめる（npm run test:rules）。
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { 証, 企画 } from './emu.mjs';

const 宛先 = process.env.FIREBASE_DATABASE_EMULATOR_HOST || '127.0.0.1:9000';
const 根 = `http://${宛先}`;
const 倉庫 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

// Realtime Database の模擬環境は、Authorization の見出しで来た証を管理者として扱う（決まりを通らない）。
// 利用者の証は ?auth= で渡す。管理者（決まりを通さずに用意するとき）だけ見出しで渡す
async function 送る(人, 道, 頼み = {}) {
  const 札 = 証(人);
  const 管理 = 人 === 'owner';
  const 返り = await fetch(`${根}/${道}.json?ns=${企画}${札 && !管理 ? `&auth=${札}` : ''}`, {
    ...頼み,
    headers: 管理 ? { Authorization: 'Bearer owner' } : {},
  });
  return { 通った: 返り.ok, 状態: 返り.status, 中身: await 返り.text() };
}
const 置く = (人, 道, 値) => 送る(人, 道, { method: 'PUT', body: JSON.stringify(値) });
const 足す = (人, 道, 値) => 送る(人, 道, { method: 'PATCH', body: JSON.stringify(値) });
const 消す = (人, 道) => 送る(人, 道, { method: 'DELETE' });
const 読む = (人, 道) => 送る(人, 道);

const 甲 = { uid: 'anon-a' };
const 乙 = { uid: 'anon-b' };
const 団の枝 = 'g'.repeat(32);
const 共の枝 = 's'.repeat(32);
const 見の枝 = 'v'.repeat(32);
const 後で = () => Date.now() + 3600000;

test.before(async () => {
  const 返り = await fetch(`${根}/.settings/rules.json?ns=${企画}`, {
    method: 'PUT',
    headers: { Authorization: 'Bearer owner' },
    body: readFileSync(path.join(倉庫, 'database.rules.json'), 'utf8'),
  });
  if (!返り.ok) throw new Error(`決まりを置けません: ${await 返り.text()}`);
});
test.beforeEach(async () => {
  await 置く('owner', '', null);
});

test('ふだんの手順：団体の枝でライブを始める・配る（期限と置いた口座）・配った枝で記録する', async () => {
  assert.ok((await 置く(甲, `live_sessions/${団の枝}/練習/state`, { status: 'active' })).通った);
  assert.ok((await 置く(甲, `live_groups/${団の枝}`, true)).通った, '団体の枝に印を置けない');
  // 配る：期限と置いた口座を 1 回で
  assert.ok(
    (
      await 足す(甲, '', {
        [`live_limits/${共の枝}`]: 後で(),
        [`live_limits/${見の枝}`]: 後で(),
        [`live_limit_owners/${共の枝}`]: 甲.uid,
        [`live_limit_owners/${見の枝}`]: 甲.uid,
      })
    ).通った,
    '期限を置けない'
  );
  assert.ok(
    (await 置く(乙, `live_sessions/${共の枝}/練習/state`, { status: 'active', 期限: 1 })).通った,
    '配った枝に書けない'
  );
  assert.ok((await 置く(乙, `live_view/${見の枝}/練習/state`, { status: 'active' })).通った);
  assert.ok((await 読む(乙, `live_view/${見の枝}`)).通った);
  // 団体の枝の道しるべ（移った先）は、期限の無い枝なので書ける
  assert.ok((await 足す(甲, `live_sessions/${団の枝}/練習/state`, { 移った先: 共の枝 })).通った);
});

test('B6 ①：団体の枝（印あり）には期限を置けない。期限のある枝には印を置けない', async () => {
  await 置く(甲, `live_groups/${団の枝}`, true);
  assert.equal(
    (await 置く(乙, `live_limits/${団の枝}`, Date.now() + 60000)).通った,
    false,
    '団体の枝に期限を置けた'
  );
  assert.equal((await 消す(乙, `live_groups/${団の枝}`)).通った, false, '印を消せた');
  // 期限のある枝（配った枝）には印を置けない（置けると、印を盾に期限を外せてしまう）
  await 置く(甲, `live_limits/${共の枝}`, 後で());
  assert.equal((await 置く(乙, `live_groups/${共の枝}`, true)).通った, false, '配った枝に印を置けた');
});

test('B6 ②：新しく配った期限は、置いた口座だけが縮め・外せる', async () => {
  await 足す(甲, '', { [`live_limits/${見の枝}`]: 後で(), [`live_limit_owners/${見の枝}`]: 甲.uid });
  await 置く(甲, `live_view/${見の枝}/練習/state`, { status: 'active' });
  assert.equal(
    (await 置く(乙, `live_limits/${見の枝}`, Date.now() + 1000)).通った,
    false,
    'ほかの人が期限を縮めた'
  );
  // 写しを消してから期限を外す（期限の無いリンクにする）
  assert.ok((await 消す(乙, `live_view/${見の枝}`)).通った);
  assert.equal((await 消す(乙, `live_limits/${見の枝}`)).通った, false, 'ほかの人が期限を外せた');
  assert.equal(
    (await 置く(乙, `live_limit_owners/${見の枝}`, 乙.uid)).通った,
    false,
    '置いた口座を書き換えた'
  );
  assert.equal((await 消す(乙, `live_limit_owners/${見の枝}`)).通った, false);
  // 置いた口座はできる
  assert.ok((await 置く(甲, `live_limits/${見の枝}`, Date.now() + 2000)).通った, '置いた口座が縮められない');
  assert.ok((await 消す(甲, `live_limits/${見の枝}`)).通った);
  assert.ok((await 消す(甲, `live_limit_owners/${見の枝}`)).通った);
  // 期限を置いたあとから、置いた口座を名乗ることはできない
  await 置く(甲, `live_limits/${共の枝}`, 後で());
  assert.equal(
    (await 置く(乙, `live_limit_owners/${共の枝}`, 乙.uid)).通った,
    false,
    'あとから置いた口座を名乗れた'
  );
});

test('B6 ②：前の版で配った期限（置いた口座なし）は、今までどおり縮める・中身を消したら外せる', async () => {
  await 置く(甲, `live_limits/${共の枝}`, 後で());
  assert.ok((await 置く(乙, `live_limits/${共の枝}`, Date.now() + 1000)).通った);
  assert.equal(
    (await 置く(乙, `live_limits/${共の枝}`, Date.now() + 99999999)).通った,
    false,
    '期限を延ばせた'
  );
  assert.ok((await 消す(乙, `live_limits/${共の枝}`)).通った);
});

test('B6 ③：期限のある枝では「移った先」を書けない（期限の無い置き場へ移して期限を逃れられない）', async () => {
  await 足す(甲, '', { [`live_limits/${共の枝}`]: 後で(), [`live_limit_owners/${共の枝}`]: 甲.uid });
  await 置く(甲, `live_sessions/${共の枝}/練習/state`, { status: 'active' });
  assert.equal(
    (await 足す(乙, `live_sessions/${共の枝}/練習/state`, { 移った先: 'z'.repeat(32) })).通った,
    false,
    '期限のある枝で移った先を書けた'
  );
  assert.equal(
    (
      await 置く(乙, `live_sessions/${共の枝}/練習/state`, {
        status: 'active',
        移った先の閲覧枝: 'z'.repeat(32),
      })
    ).通った,
    false
  );
  // 盤面を書き直すのはできる（移った先は空のまま）
  assert.ok(
    (await 置く(乙, `live_sessions/${共の枝}/練習/state`, { status: 'active', 移った先: null })).通った
  );
});

test('期限の切れた枝は読めない・書けない。中身を消すのはできる', async () => {
  await 置く(甲, `live_sessions/${共の枝}/練習/state`, { status: 'active' });
  await 置く('owner', `live_limits/${共の枝}`, Date.now() - 1000);
  await 置く('owner', `live_limit_owners/${共の枝}`, 甲.uid);
  assert.equal((await 読む(乙, `live_sessions/${共の枝}`)).通った, false);
  assert.equal((await 置く(乙, `live_sessions/${共の枝}/練習/state`, { status: 'active' })).通った, false);
  assert.ok((await 消す(乙, `live_sessions/${共の枝}`)).通った, '切れた枝の中身を片付けられない');
  // 切れた期限は、中身が無ければ誰でも片付けられる
  assert.ok((await 消す(乙, `live_limits/${共の枝}`)).通った, '切れた期限を片付けられない');
  assert.ok((await 消す(乙, `live_limit_owners/${共の枝}`)).通った);
});

// ── S8（2026-11-26）：中身の形と枝の長さの上限（scripts/database-rules.mjs で作る）──
const 時刻 = { '.sv': 'timestamp' };
/** 端末の射手（ライブを始めるときは、記録画面の射手をそのまま書く。前の版の記録の項目 hits・totalShots も） */
const 手元の射手 = (id, 名前 = '部員1') => ({
  id,
  name: 名前,
  gender: '男',
  grade: 1,
  marks: ['○', '×', '', '?'],
  arrowLocations: ['', { x: 0.25, y: -0.5, targetType: 'kasumi' }, '', ''],
  isGuest: false,
  isSeparator: false,
  isTotalCalculator: false,
  またぐ合計: false,
  lockedBlocks: { 0: true },
  substitutions: { 1: '代わり' },
  substitutionIds: { 1: 'member-2' },
  memberId: 'member-1',
  teamName: 'A',
  bowWeight: '13',
  lastModified: 1764000000000,
  hits: 1,
  totalShots: 4,
});
/** ライブへ送る形（○× と前の版の項目は入れない） */
const 送る形 = (id) => {
  const 形 = 手元の射手(id);
  delete 形.marks;
  delete 形.hits;
  delete 形.totalShots;
  return 形;
};

test('S8：アプリが書く形は全部通る（始める・盤面・1 射・配る・道しるべ・写し・取り消しの控え・在席・やり直し・保存）', async () => {
  const 盤 = `live_sessions/${団の枝}/練習/state`;
  // 始める（setIsLiveActive）：端末の射手をそのまま
  const 始め = { archers: [手元の射手('a1'), 手元の射手('sep-1', '---')], shotsPerRound: 4, timestamp: 1 };
  assert.ok((await 置く(甲, 盤, 始め)).通った, '始められない');
  // 射手の一覧（runTransaction）と、盤面をまとめて送る（ライブへ盤面を送る）
  assert.ok((await 置く(甲, `${盤}/archers`, [送る形('a1'), 送る形('a2')])).通った, '射手の一覧を送れない');
  const 盤面 = {
    timestamp: 2,
    updated_at: 時刻,
    status: 'active',
    'marks_by_id/a1': ['○', '×', '', ''],
    'marks_by_id/a2/3': '?',
    'archer_timestamps/a1': 3,
    shotsPerRound: 4,
  };
  assert.ok((await 足す(甲, 盤, 盤面)).通った, '盤面を送れない');
  // 1 射（ライブへ1射を送る）・消す（null）
  const 一射 = { 'marks_by_id/a1/2': '○', 'archer_timestamps/a1': 4, timestamp: 5, updated_at: 時刻 };
  assert.ok((await 足す(甲, 盤, 一射)).通った, '1 射を送れない');
  assert.ok((await 足す(甲, 盤, { 'marks_by_id/a1/3': null })).通った);
  // 取り消しの目印
  const 目印 = { history_len: 1, history_max: 1, history_at: 6, history_kind: '取り消し' };
  assert.ok((await 足す(甲, 盤, 目印)).通った, '取り消しの目印を置けない');
  // 控えの 3 つの形（○× だけ・項目・射数）
  const 前 = [Object.assign(送る形('a1'), { marks: ['○', '', '', ''] })];
  const 後 = [Object.assign(送る形('a1'), { marks: ['○', '×', '', ''] })];
  const 控えの道 = `live_history/${団の枝}/練習`;
  const 印の控え = { 前, 後, 本数: 4, at: 7, 差分: [{ 射手: 'a1', 射番: 1, 前: '', 後: '×' }] };
  assert.ok((await 置く(甲, `${控えの道}/0`, 印の控え)).通った, '○× の控えを積めない');
  const 項目の控え = {
    前,
    後,
    本数: 4,
    at: 8,
    項目: [
      {
        射手: 'a1',
        項目: {
          name: { 前: '部員1', 後: '部員2' },
          lockedBlocks: { 前: { 0: true }, 後: { 1: true } },
          arrowLocations: { 前: ['', { x: 1, y: 2, targetType: 'kasumi' }], 後: ['', ''] },
          memberId: { 後: 'member-3' },
        },
      },
    ],
  };
  assert.ok((await 置く(甲, `${控えの道}/1`, 項目の控え)).通った, '項目の控えを積めない');
  const 射数の控え = { 前, 後, 本数: 4, at: 9, 射数: { 前: 8, 後: 4, 切った: { a1: ['○', '×', '', ''] } } };
  assert.ok((await 置く(甲, `${控えの道}/2`, 射数の控え)).通った, '射数の控えを積めない');
  // 在席
  const 在席 = `live_presence/${団の枝}/練習/0123456789abcdef`;
  assert.ok((await 置く(甲, 在席, { at: 時刻 })).通った, '在席を置けない');
  // 配る：配った枝へ盤面を写す（種・閲覧の枝・鍵・期限）、閲覧用の写し、団体の枝の道しるべ、元の枝の移った先
  await 足す(甲, '', { [`live_limits/${共の枝}`]: 後で(), [`live_limits/${見の枝}`]: 後で() });
  const 写した盤面 = {
    archers: [送る形('a1')],
    marks_by_id: { a1: ['○', '×', '', ''] },
    archer_timestamps: { a1: 4 },
    shotsPerRound: 4,
    status: 'active',
    history_len: 3,
    history_max: 3,
  };
  const 配った盤面 = {
    ...写した盤面,
    閲覧の枝: 見の枝,
    種: { 編集: 'e'.repeat(32), 閲覧: 'f'.repeat(32) },
    鍵が要るか: true,
    期限: 後で(),
    移った先: null,
    timestamp: 10,
    updated_at: 時刻,
  };
  assert.ok((await 置く(甲, `live_sessions/${共の枝}/練習/state`, 配った盤面)).通った, '配った枝へ写せない');
  const 写し = { ...写した盤面, 期限: 後で(), timestamp: 11, updated_at: 時刻 };
  assert.ok((await 置く(甲, `live_view/${見の枝}/練習/state`, 写し)).通った, '閲覧用の写しを作れない');
  const 道しるべ = {
    共有の枝: 共の枝,
    閲覧の枝: 見の枝,
    期限: 後で(),
    status: 'active',
    timestamp: 12,
    updated_at: 時刻,
  };
  assert.ok((await 置く(甲, `live_sessions/${団の枝}/練習/state`, 道しるべ)).通った, '道しるべを置けない');
  const 移った = { 移った先: 共の枝, 移った先の閲覧枝: 見の枝, updated_at: 時刻 };
  assert.ok((await 足す(甲, `live_sessions/${団の枝}/別/state`, 移った)).通った, '移った先を置けない');
  // 取り消しの控えを配った枝へ引き継ぐ（まとめて置く）
  const 引き継ぎ = { 0: { 前, 後, 本数: 4, at: 7 } };
  assert.ok((await 置く(甲, `live_history/${共の枝}/練習`, 引き継ぎ)).通った, '控えを引き継げない');
  // やり直し（resetLiveSync）
  const やり直し = {
    archers: [],
    marks_by_id: {},
    archer_timestamps: {},
    reset_at: 13,
    timestamp: 13,
    updated_at: 時刻,
    history_len: 0,
    history_max: 0,
  };
  assert.ok((await 足す(甲, `live_sessions/${共の枝}/練習/state`, やり直し)).通った, 'やり直せない');
  // 保存して終わる（団体の枝は「終わった」印だけ残す）
  const 終わり = { state: { status: 'finished', timestamp: 時刻, updated_at: 時刻 } };
  assert.ok((await 置く(甲, `live_sessions/${団の枝}/練習`, 終わり)).通った, '終わった印を置けない');
  // 知らない小さな項目（前の版・これからの版）は通す
  assert.ok(
    (await 足す(甲, `live_sessions/${団の枝}/練習/state`, { 新しい印: true, 新しい字: 'あ' })).通った
  );
  const 新しい射手 = { ...送る形('a3'), 新しい項目: 3 };
  assert.ok((await 置く(甲, `live_sessions/${団の枝}/練習2/state/archers/0`, 新しい射手)).通った);
});

test('S8：決まりの外の形は断る（長い枝・知らない入れ物・長い字・型の違い・数の上限）', async () => {
  const 盤 = `live_sessions/${団の枝}/練習/state`;
  await 置く(甲, 盤, { status: 'active', archers: [送る形('a1')] });
  const 断る = async (返り, 訳) => assert.equal((await 返り).通った, false, 訳);
  const 長い枝 = 'g'.repeat(65);
  await 断る(置く(甲, `live_sessions/${長い枝}/練習/state`, { status: 'active' }), '65 字の枝に書けた');
  await 断る(置く(甲, `live_groups/${長い枝}`, true), '65 字の枝に印を置けた');
  await 断る(置く(甲, `live_limits/${長い枝}`, 後で()), '65 字の枝に期限を置けた');
  await 断る(足す(甲, 盤, { 'よその物/中身': 'x' }), '知らない入れ物を置けた');
  await 断る(置く(甲, `live_sessions/${団の枝}/練習/よその物`, { a: 1 }), 'state の外に置けた');
  await 断る(足す(甲, 盤, { 'archers/0/よその物': { a: 1 } }), '射手に知らない入れ物を置けた');
  await 断る(足す(甲, 盤, { 'archers/0/name': 'あ'.repeat(201) }), '201 字の名前を置けた');
  await 断る(足す(甲, 盤, { 新しい字: 'あ'.repeat(201) }), '知らない項目に 201 字を置けた');
  await 断る(足す(甲, 盤, { timestamp: '1' }), '字の timestamp を置けた');
  await 断る(足す(甲, 盤, { shotsPerRound: 1001 }), '射数 1001 を置けた');
  await 断る(足す(甲, 盤, { 'marks_by_id/a1/0': '○○○' }), '3 字の ○× を置けた');
  await 断る(足す(甲, 盤, { 'marks_by_id/a1/10000': '○' }), '10000 本目の ○× を置けた');
  await 断る(足す(甲, 盤, { 'marks_by_id/a1': { 中身: { x: 1 } } }), '○× に入れ物を置けた');
  await 断る(足す(甲, 盤, { 'archers/1000': 送る形('a9') }), '1001 人目の射手を置けた');
  await 断る(足す(甲, 盤, { 'archer_timestamps/a1': 'x' }), '字の日時を置けた');
  await 断る(足す(甲, 盤, { 種: { 編集: 'e', よその物: 'x' } }), '種に知らない項目を置けた');
  await 断る(足す(甲, 盤, { 'archers/0/arrowLocations/0': { x: '1' } }), '字の矢所を置けた');
  await 断る(足す(甲, 盤, { 'archers/0/lockedBlocks/0': 'はい' }), '字の鍵を置けた');
  // 控え
  const 控え = `live_history/${団の枝}/練習`;
  await 断る(置く(甲, `${控え}/0`, { at: 1, よその物: { a: 1 } }), '控えに知らない入れ物を置けた');
  const 長い差分 = { 差分: [{ 射手: 'a1', 射番: 0, 前: '', 後: '○', よその物: 1 }] };
  await 断る(置く(甲, `${控え}/0`, 長い差分), '差分に知らない項目を置けた');
  await 断る(置く(甲, `${控え}/x`, { at: 1 }), '番号でない控えを置けた');
  const 深い = { 項目: [{ 射手: 'a1', 項目: { name: { 前: { a: { b: { c: 1 } } } } } }] };
  await 断る(置く(甲, `${控え}/0`, 深い), '3 段の入れ物を置けた');
  // 在席
  const 在席 = `live_presence/${団の枝}/練習/0123456789abcdef`;
  await 断る(置く(甲, 在席, { at: 時刻, よその物: 1 }), '在席に知らない項目を置けた');
  await 断る(置く(甲, 在席, { 名前: 'x' }), 'at の無い在席を置けた');
  await 断る(
    置く(甲, `live_presence/${団の枝}/練習/${'d'.repeat(65)}`, { at: 時刻 }),
    '65 字の端末名を置けた'
  );
  // 消すのは今までどおりできる
  assert.ok((await 消す(甲, `live_sessions/${団の枝}/練習`)).通った, '消せない');
});
