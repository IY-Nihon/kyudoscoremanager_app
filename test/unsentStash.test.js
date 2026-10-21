/**
 * ログアウトしても送れていない記録を残す控え（src/unsentStash.js）の検査。
 *
 *   npm test
 *
 * 2026-10-17、ログインが外れた端末でログアウトし、送れていない部内戦 27 人分が消えた。
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const 控 = require('../src/unsentStash');

const 記録 = (id, 送った, 時刻 = 1) => ({ id, syncStatus: 送った ? '同期済み' : '未同期', lastModified: 時刻 });

test('送れていないものだけを団体ごとに残し、送ったものは残さない', () => {
  const 手元 = { sessions: [記録('a', false), 記録('b', true)], members: [記録('m', false)], alumni: [], trash: [] };
  const 控え = 控.控えに入れる({}, 'G1', 手元);
  assert.deepEqual(控え.G1.sessions.map((x) => x.id), ['a']);
  assert.deepEqual(控え.G1.members.map((x) => x.id), ['m']);
  assert.equal(控.件数(控え.G1), 2);
});

test('送れていないものが無ければ、控えは変えない', () => {
  const 元 = { G9: { sessions: [記録('z', false)] } };
  assert.strictEqual(控.控えに入れる(元, 'G1', { sessions: [記録('b', true)] }), 元);
});

test('同じ団体で入ったら、手元へ戻して未同期のまま送らせ、控えからは外す', () => {
  const 控え = 控.控えに入れる({}, 'G1', { sessions: [記録('a', false, 5)] });
  const { 控え: 後, 手元, 戻した数 } = 控.控えを戻す(控え, 'G1', { sessions: [記録('c', true)] });
  assert.equal(戻した数, 1);
  assert.deepEqual(手元.sessions.map((x) => x.id).sort(), ['a', 'c']);
  assert.equal(手元.sessions.find((x) => x.id === 'a').syncStatus, '未同期');
  assert.equal(後.G1, undefined);
});

test('別の団体で入ったときは戻さない（記録が混ざる）', () => {
  const 控え = 控.控えに入れる({}, 'G1', { sessions: [記録('a', false)] });
  const 結果 = 控.控えを戻す(控え, 'G2', { sessions: [] });
  assert.equal(結果.手元, null);
  assert.equal(控.件数(結果.控え.G1), 1, '控えは残ったまま');
});

test('鍵は団体の見える ID を先に使い、大文字にそろえる（個人ログインでも同じ鍵）', () => {
  assert.equal(控.控えの鍵('abc123', 'secret-branch'), 'ABC123');
  assert.equal(控.控えの鍵(null, 'g1'), 'G1');
  assert.equal(控.控えの鍵(null, null), null);
});

test('同じ id が手元にもあれば、新しいほうを残す', () => {
  const 控え = 控.控えに入れる({}, 'G1', { sessions: [記録('a', false, 5)] });
  const { 手元 } = 控.控えを戻す(控え, 'G1', { sessions: [Object.assign(記録('a', true, 9), { 印: '雲' })] });
  assert.equal(手元.sessions.length, 1);
  assert.equal(手元.sessions[0].印, '雲');
});
