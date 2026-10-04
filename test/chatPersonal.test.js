/**
 * チャットボットの「個人ログイン（部員）用」の決まりの検査（src/chatPersonal.js）。
 *
 *   npm test
 *
 * AIChatBot.js は画面の部品で Node から読み込めないので、指示文・Q&A・道具の宣言は
 * ソースの文字として読み取って当てる。読み取れなくなったら（書き方を変えたら）
 * ここが落ちるので、そのとき読み取り方を直す。
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const 個人用 = require('../src/chatPersonal');

// 指示文と Q&A は 2026-10-05 に src/chatKnowledge.js へ移した。道具の宣言は AIChatBot.js のまま。
// チャットボットぜんぶの字として、まとめて読む
const ソース = ['AIChatBot.js', 'chatKnowledge.js']
  .map((名) => fs.readFileSync(path.join(__dirname, '..', 'src', 名), 'utf8'))
  .join('\n')
  .replace(/\r\n/g, '\n');

/** 団体用の指示文（systemInstructionBase）。中に逆斜線も ${} も無い静的な文 */
function 基本の指示文を読む() {
  const 頭 = ソース.indexOf('const systemInstructionBase = `');
  assert.ok(頭 >= 0, 'systemInstructionBase が見つからない');
  const 始め = ソース.indexOf('`', 頭) + 1;
  const 終わり = ソース.indexOf('`;', 始め);
  return ソース.slice(始め, 終わり);
}

/** Q&A の一覧（qaData）の t の文を、出てくる順に */
function Q_Aを読む() {
  const 頭 = ソース.indexOf('const qaData = [');
  assert.ok(頭 >= 0, 'qaData が見つからない');
  const 塊 = ソース.slice(頭, ソース.indexOf('\n];', 頭));
  return [...塊.matchAll(/t:\s*'((?:Q\d+):[^']*)'/g)].map((m) => m[1]);
}

/** 道具の宣言の名前（handleSend の tools） */
function 道具の名前を読む() {
  const 頭 = ソース.indexOf('const tools = [');
  assert.ok(頭 >= 0, 'tools が見つからない');
  const 塊 = ソース.slice(頭, ソース.indexOf('const model = genAI.getGenerativeModel(', 頭));
  return [...塊.matchAll(/name: '(\w+)',\n\s+description:/g)].map((m) => m[1]);
}

const 団体だけの道具 = ['getAllMembersStats', 'getAttendanceStats', 'addMember', 'addMembers'];

test('道具：宣言してある道具は、すべて「個人が使える」か「団体だけ」のどちらかに決めてある（新しい道具を足したら決める）', () => {
  const 名前たち = 道具の名前を読む();
  assert.ok(名前たち.length >= 9, `道具の名前が読み取れていない: ${名前たち.join(',')}`);
  for (const 名 of 名前たち) {
    assert.ok(
      個人用.個人が使える道具.includes(名) || 団体だけの道具.includes(名),
      `道具「${名}」を個人に出すか決めていない（src/chatPersonal.js の 個人が使える道具、または この検査の 団体だけの道具）`
    );
  }
  // 個人が使える道具は、実在する道具だけ
  for (const 名 of 個人用.個人が使える道具) assert.ok(名前たち.includes(名), `「${名}」という道具は無い`);
});

test('道具：全員の成績・出欠・部員の追加は、個人には出さない', () => {
  for (const 名 of ['getAllMembersStats', 'getAttendanceStats', 'addMember', 'addMembers'])
    assert.ok(!個人用.個人が使える道具.includes(名), `個人に「${名}」を出している`);
});

test('道具：個人向けの宣言は使える道具だけに絞る。元の宣言は書き換えない', () => {
  const 宣言 = 道具の名前を読む().map((name) => ({
    name,
    description: `元の説明 ${name}`,
    parameters: {
      type: 'OBJECT',
      properties: {
        memberNames: { type: 'ARRAY', description: '名前' },
        memberName: { type: 'STRING', description: '名前' },
        screenName: {
          type: 'STRING',
          description: '遷移先の画面名（記録, 履歴, 分析, メンバー, 出欠, 設定 のいずれか）',
        },
        dateFrom: { type: 'STRING', description: '開始日' },
      },
    },
  }));
  const 前 = JSON.stringify(宣言);
  const 出す = 個人用.個人向けの道具(宣言);
  assert.strictEqual(JSON.stringify(宣言), 前, '元の宣言を書き換えている');
  assert.deepStrictEqual(出す.map((d) => d.name).sort(), [...個人用.個人が使える道具].sort());

  const 射位 = 出す.find((d) => d.name === 'getPositionStats');
  assert.ok(!('memberNames' in 射位.parameters.properties), '射位の道具に、人を絞る引数が残っている');
  const 画面 = 出す.find((d) => d.name === 'navigateToScreen');
  assert.ok(
    !画面.parameters.properties.screenName.description.includes('出欠'),
    '画面の一覧に出欠が残っている'
  );
  assert.ok(画面.parameters.properties.screenName.description.includes('メンバー'));
  for (const d of 出す)
    assert.ok(
      !/全部員|全員|ランキング/.test(d.description),
      `「${d.name}」の説明が団体向けのまま: ${d.description}`
    );
  assert.deepStrictEqual(個人用.個人向けの道具(undefined), []);
});

test('画面：個人が開ける画面は、出欠だけが無い（MainNavigator と同じ）', () => {
  assert.deepStrictEqual(個人用.個人が行ける画面, ['記録', '履歴', '分析', 'メンバー', '設定']);
  const 画面の作り = fs.readFileSync(path.join(__dirname, '..', 'src', 'MainNavigator.js'), 'utf8');
  for (const 名 of 個人用.個人が行ける画面)
    assert.ok(画面の作り.includes(`name="${名}"`), `MainNavigator に「${名}」のタブが無い`);
});

test('Q&A：個人から外した番号は、どれも実在する（番号を振り直したら、ここで気づく）', () => {
  const 番号たち = Q_Aを読む().map((t) => /^(Q\d+):/.exec(t)[1]);
  assert.ok(番号たち.length >= 70, `Q&A が読み取れていない（${番号たち.length} 件）`);
  const 外した = 番号たち.filter((番, i) => !個人用.個人に案内してよいか(Q_Aを読む()[i]));
  assert.ok(外した.length >= 20, `個人から外した Q&A が少なすぎる（${外した.join(',')}）`);
  for (const 番 of [
    'Q3',
    'Q4',
    'Q5',
    'Q11',
    'Q13',
    'Q14',
    'Q15',
    'Q21',
    'Q28',
    'Q29',
    'Q30',
    'Q31',
    'Q32',
    'Q33',
    'Q34',
    'Q35',
    'Q36',
    'Q37',
    'Q38',
    'Q41',
    'Q42',
    'Q51',
    'Q52',
  ])
    assert.ok(番号たち.includes(番), `外した番号 ${番} が Q&A に無い（振り直された？）`);
});

test('Q&A：番号が 2 つの Q70 は、団体アカウントの削除だけを外し、弓具の前後の的中は残す', () => {
  const Q70 = Q_Aを読む().filter((t) => t.startsWith('Q70:'));
  assert.strictEqual(Q70.length, 2);
  const 消す = Q70.find((t) => t.startsWith('Q70: 団体アカウント'));
  const 弓具 = Q70.find((t) => t.startsWith('Q70: 弓や矢'));
  assert.ok(消す && 弓具);
  assert.strictEqual(個人用.個人に案内してよいか(消す), false);
  assert.strictEqual(個人用.個人に案内してよいか(弓具), true);
});

test('Q&A：個人にも要る案内は残す（記録の付け方・履歴・ライブ・自分の弓具・個人のメンバー画面）', () => {
  const 全部 = Q_Aを読む();
  const 残る = 全部.filter((t) => 個人用.個人に案内してよいか(t)).map((t) => /^(Q\d+):/.exec(t)[1]);
  for (const 番 of ['Q0', 'Q1', 'Q20', 'Q22', 'Q24', 'Q53', 'Q54', 'Q65', 'Q76', 'Q77'])
    assert.ok(残る.includes(番), `${番} を個人から外してしまっている`);
  assert.ok(残る.length < 全部.length && 残る.length > 全部.length / 2);
  // 番号の付いていない文は外さない
  assert.strictEqual(個人用.個人に案内してよいか('番号の無い文'), true);
  assert.strictEqual(個人用.個人に案内してよいか(undefined), true);
});

test('Q0：個人用のタブの案内は、出欠を含まず、使えるタブが並ぶ', () => {
  const Q0 = 個人用.個人用のQ0;
  assert.ok(Q0.startsWith('Q0:'), 'Q0 で始まらない（Q&A の基本の項目の印）');
  for (const 名 of ['記録', '履歴', '分析', 'メンバー', '設定'])
    assert.ok(Q0.includes(`【${名}】`), `【${名}】が無い`);
  assert.ok(!Q0.includes('【出欠】'), '個人には出欠のタブが無いのに案内している');
  assert.ok(Q0.includes('個人で入っている'));
});

test('指示文：本人の分だけを扱う決まりと、断り方が入る。団体の管理・全員の道具の案内は入らない', () => {
  const 基本 = 基本の指示文を読む();
  const 文 = 個人用.個人用の指示文(基本, { name: '山田', grade: 2 });
  assert.ok(文.includes('「山田」（2年）'), '本人の名前・学年が入っていない');
  assert.ok(文.includes('本人の分だけを扱います'));
  assert.ok(文.includes('自分の分だけお答えできます'), '断り方（決まった言い方）が無い');
  assert.ok(文.includes('memberName は 「山田」'), '道具に渡す名前が本人になっていない');
  // 団体向けの道具・操作は出てこない
  for (const 禁 of [
    'getAllMembersStats',
    'getAttendanceStats',
    'addMember',
    '部員の追加について',
    '立ち順を尋ねられたとき',
  ])
    assert.ok(!文.includes(禁), `個人用の指示文に「${禁}」が残っている`);
  // 共通の決まり（言葉づかい・答え方・用語）は引き継ぐ
  for (const 見出し of [
    '【弓道用語の読み方（厳守）】',
    '【アプリの言葉づかい（画面と揃えること）】',
    '【答え方】',
    '【できないこと（正直に断ること）】',
  ])
    assert.ok(文.includes(見出し), `${見出し}が入っていない`);
  // 「この団体の記録」ではなく、本人の記録と言う
  assert.ok(!文.includes('この団体の記録'));
  assert.ok(文.includes('本人の記録とQ&Aだけです'));
});

test('指示文：卒業生・名前が分からないときも壊れない', () => {
  const 基本 = 基本の指示文を読む();
  assert.ok(個人用.個人用の指示文(基本, { name: '山田', grade: 5 }).includes('（卒業生）'));
  // 学年 0 は「その他」（画面と同じ。0年とは書かない）
  const その他 = 個人用.個人用の指示文(基本, { name: '山田', grade: 0 });
  assert.ok(その他.includes('（その他）') && !その他.includes('0年'));
  const 名無し = 個人用.個人用の指示文(基本, null);
  assert.ok(名無し.includes('本人'));
  assert.ok(!名無し.includes('undefined') && !名無し.includes('null'));
  assert.ok(個人用.個人用の指示文('', { name: '山田', grade: 1 }).length > 200, '基本が空でも本体は出る');
});

test('節を取る：見出しから次の節の手前まで。無い見出しは空', () => {
  const 文 = '【甲】\nあ\nい\n\n【乙】\nう\n\n【丙】\nえ';
  assert.strictEqual(個人用.節を取る(文, '【甲】'), '【甲】\nあ\nい');
  assert.strictEqual(個人用.節を取る(文, '【丙】'), '【丙】\nえ');
  assert.strictEqual(個人用.節を取る(文, '【丁】'), '');
});

test('挨拶：ほかの人の成績は答えられないと、最初に伝える', () => {
  assert.ok(個人用.個人の挨拶.includes('ほかの人の成績はお答えできません'));
});

test('参加回数：個人ログインでも使え、数えるのは本人だけ（ほかの人の名前も回数も出ない）', () => {
  const 個人用 = require('../src/chatPersonal');
  const { 自分だけに絞る } = require('../src/chatScope');
  const { 参加回数を数える } = require('../src/chatStats');
  assert.ok(個人用.個人が使える道具.includes('countSessionParticipation'));
  const 宣言 = 個人用.個人向けの道具([{ name: 'countSessionParticipation', description: '団体向けの説明', parameters: { type: 'OBJECT', properties: { keyword: { type: 'STRING' } } } }]);
  assert.strictEqual(宣言.length, 1);
  assert.ok(!宣言[0].description.includes('団体向け'), '個人向けの言い回しに直す');
  const members = [
    { id: 'me', name: '自分 太郎', grade: 2 },
    { id: 'o1', name: '他人 花子', grade: 1 },
    { id: 'o2', name: '別人 次郎', grade: 3 },
  ];
  const 記録 = (id, ids) => ({ id, date: 1000 + Number(id.slice(1)), title: '練習', tags: ['#自主稽古'], archers: ids.map((m, i) => ({ id: id + i, memberId: m, name: members.find((x) => x.id === m).name })) });
  const sessions = [記録('s1', ['me', 'o1']), 記録('s2', ['me', 'o2']), 記録('s3', ['o1', 'o2'])];
  const 絞った = 自分だけに絞る({ members, sessions, myMemberId: 'me', myMemberName: '自分 太郎' });
  const 結果 = 参加回数を数える(絞った.members, 絞った.sessions, { 言葉: '#自主稽古' });
  assert.deepStrictEqual(結果.一覧.map((x) => [x.名前, x.回数]), [['自分 太郎', 2]]);
  const 文字列 = JSON.stringify(結果);
  assert.ok(!文字列.includes('他人') && !文字列.includes('別人'), 'ほかの人の名前が出ない');
});
