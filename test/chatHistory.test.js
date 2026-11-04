// AI アシスタントの会話の控えの鍵と片付け（src/chatHistory.js）
const test = require('node:test');
const assert = require('node:assert');
const 控え = require('../src/chatHistory');

/** localStorage と同じ口を持つ偽の置き場 */
const 偽の置き場 = (中身 = {}) => {
  const 表 = new Map(Object.entries(中身));
  return {
    get length() {
      return 表.size;
    },
    key: (番) => [...表.keys()][番] ?? null,
    getItem: (鍵) => (表.has(鍵) ? 表.get(鍵) : null),
    setItem: (鍵, 値) => void 表.set(鍵, String(値)),
    removeItem: (鍵) => void 表.delete(鍵),
    鍵たち: () => [...表.keys()].sort(),
  };
};

test('会話の鍵：団体ごと・個人は団体＋本人ごと（別の団体に入り直しても前の会話は出ない）', () => {
  assert.equal(控え.会話の鍵('G1', false), 'aiChatMessages_v1_g_G1');
  assert.notEqual(控え.会話の鍵('G1', false), 控え.会話の鍵('G2', false));
  assert.equal(控え.会話の鍵('G1', true, 'm1'), 'aiChatMessages_v1_g_G1_member_m1');
  assert.notEqual(控え.会話の鍵('G1', true, 'm1'), 控え.会話の鍵('G2', true, 'm1'));
  // 本人・団体がまだ分からないときも、ほかの人の会話の鍵にならない
  assert.equal(控え.会話の鍵(null, true, null), 'aiChatMessages_v1_g_-_member_-');
  assert.notEqual(控え.会話の鍵('G1', true, null), 控え.会話の鍵('G1', false));
});

test('前の会話を消す：団体の入っていない前の鍵だけ消す', () => {
  const 場 = 偽の置き場({
    aiChatMessages_v1: '[]',
    aiChatMessages_v1_member_m1: '[]',
    aiChatMessages_v1_g_G1: '[]',
    aiButtonPos_v1: '{}',
    'archery-score-storage': '{}',
  });
  assert.equal(控え.前の会話を消す(場), 2);
  assert.deepStrictEqual(場.鍵たち(), ['aiButtonPos_v1', 'aiChatMessages_v1_g_G1', 'archery-score-storage']);
});

test('会話を全部消す：ログアウトのとき、端末にある AI の会話を全部消す（ほかの控えは残す）', () => {
  const 場 = 偽の置き場({
    aiChatMessages_v1: '[]',
    aiChatMessages_v1_g_G1: '[]',
    aiChatMessages_v1_g_G1_member_m1: '[]',
    aiButtonPos_v1: '{}',
    'archery-score-storage': '{}',
  });
  assert.equal(控え.会話を全部消す(場), 3);
  assert.deepStrictEqual(場.鍵たち(), ['aiButtonPos_v1', 'archery-score-storage']);
  // 置き場が無い（触れない端末）ときは何もしない
  assert.equal(控え.会話を全部消す(null), 0);
});
