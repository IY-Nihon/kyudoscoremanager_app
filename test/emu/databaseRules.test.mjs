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
  assert.ok((await 置く(乙, `live_sessions/${共の枝}/練習/state`, { status: 'active', 期限: 1 })).通った, '配った枝に書けない');
  assert.ok((await 置く(乙, `live_view/${見の枝}/練習`, { status: 'active' })).通った);
  assert.ok((await 読む(乙, `live_view/${見の枝}`)).通った);
  // 団体の枝の道しるべ（移った先）は、期限の無い枝なので書ける
  assert.ok((await 足す(甲, `live_sessions/${団の枝}/練習/state`, { 移った先: 共の枝 })).通った);
});

test('B6 ①：団体の枝（印あり）には期限を置けない。期限のある枝には印を置けない', async () => {
  await 置く(甲, `live_groups/${団の枝}`, true);
  assert.equal((await 置く(乙, `live_limits/${団の枝}`, Date.now() + 60000)).通った, false, '団体の枝に期限を置けた');
  assert.equal((await 消す(乙, `live_groups/${団の枝}`)).通った, false, '印を消せた');
  // 期限のある枝（配った枝）には印を置けない（置けると、印を盾に期限を外せてしまう）
  await 置く(甲, `live_limits/${共の枝}`, 後で());
  assert.equal((await 置く(乙, `live_groups/${共の枝}`, true)).通った, false, '配った枝に印を置けた');
});

test('B6 ②：新しく配った期限は、置いた口座だけが縮め・外せる', async () => {
  await 足す(甲, '', { [`live_limits/${見の枝}`]: 後で(), [`live_limit_owners/${見の枝}`]: 甲.uid });
  await 置く(甲, `live_view/${見の枝}/練習`, { status: 'active' });
  assert.equal((await 置く(乙, `live_limits/${見の枝}`, Date.now() + 1000)).通った, false, 'ほかの人が期限を縮めた');
  // 写しを消してから期限を外す（期限の無いリンクにする）
  assert.ok((await 消す(乙, `live_view/${見の枝}`)).通った);
  assert.equal((await 消す(乙, `live_limits/${見の枝}`)).通った, false, 'ほかの人が期限を外せた');
  assert.equal((await 置く(乙, `live_limit_owners/${見の枝}`, 乙.uid)).通った, false, '置いた口座を書き換えた');
  assert.equal((await 消す(乙, `live_limit_owners/${見の枝}`)).通った, false);
  // 置いた口座はできる
  assert.ok((await 置く(甲, `live_limits/${見の枝}`, Date.now() + 2000)).通った, '置いた口座が縮められない');
  assert.ok((await 消す(甲, `live_limits/${見の枝}`)).通った);
  assert.ok((await 消す(甲, `live_limit_owners/${見の枝}`)).通った);
  // 期限を置いたあとから、置いた口座を名乗ることはできない
  await 置く(甲, `live_limits/${共の枝}`, 後で());
  assert.equal((await 置く(乙, `live_limit_owners/${共の枝}`, 乙.uid)).通った, false, 'あとから置いた口座を名乗れた');
});

test('B6 ②：前の版で配った期限（置いた口座なし）は、今までどおり縮める・中身を消したら外せる', async () => {
  await 置く(甲, `live_limits/${共の枝}`, 後で());
  assert.ok((await 置く(乙, `live_limits/${共の枝}`, Date.now() + 1000)).通った);
  assert.equal((await 置く(乙, `live_limits/${共の枝}`, Date.now() + 99999999)).通った, false, '期限を延ばせた');
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
    (await 置く(乙, `live_sessions/${共の枝}/練習/state`, { status: 'active', 移った先の閲覧枝: 'z'.repeat(32) })).通った,
    false
  );
  // 盤面を書き直すのはできる（移った先は空のまま）
  assert.ok((await 置く(乙, `live_sessions/${共の枝}/練習/state`, { status: 'active', 移った先: null })).通った);
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
