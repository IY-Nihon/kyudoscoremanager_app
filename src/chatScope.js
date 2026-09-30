/**
 * チャットボットに渡すデータを、個人ログイン（部員）の分に絞る。
 *
 * ■ なぜ要るか
 *   個人ログインの端末には、団体ぜんぶの部員・記録が入っている（権限のルールが団体の中を
 *   読ませているため）。履歴・分析・メンバーの画面は、画面の側で「自分の分だけ」に絞って
 *   見せている。チャットボットは道具（getAllMembersStats など）が端末の部員・記録を直に
 *   読むので、絞らずに個人へ出すと、他の人の名前と成績を答えてしまう。
 *   ここで **AI に渡す前に** 絞る。AI の手元に無いものは、指示文で断らなくても答えに出ない。
 *
 * ■ 何を残すか
 *   ・部員 … 自分ひとりだけ。名前・学年・性別・期のみ（個人ID＝ログインに使う 4 桁は入れない）
 *   ・記録 … 自分が写っている記録だけ。題・覚え書き・目印・日付は画面と同じく出す
 *   ・射手 … 自分の列は、氏名を自分のものだけ残し、他の人は「（他の人）」にする
 *            （途中交代で入った・代わってもらった相手の名前も同じ）
 *   ・他の人の列 … 名前も○×も無い空の列として **残す**。消すと、射位（大前・落）と人数の
 *            割り振りが狂う（自分だけが並びの先頭になり、毎回「大前」と数えてしまう）。
 *            割り振りが見るのは、列の並びと、区切り・計の印だけ
 *   ・○× … 自分が引いた射だけ残し、他の人の射は空にする（交代の相手の的中を渡さない）
 *   ・出欠・チーム名・矢所などは残さない（チャットの道具は使わない）。区切りは印だけ残す
 *
 * 画面にも Firebase にも触れない純粋な関数なので、node --test で確かめられる
 * （test/chatScope.test.js）。
 */
'use strict';

const { 自分の射手か, 自分の記録か } = require('./syncRules');
const 集 = require('./statsRules');

/** 他の人の氏名の代わりに置く言葉 */
const 他の人 = '（他の人）';

/**
 * 部員の氏名を空白を除いて比べる。氏名だけで割り当てた射手（メンバーを選ばずに名前を入れた場合）を
 * 拾うのに、syncRules の 自分の射手か が「同じ文字列」で見ているのに合わせる（緩めない）。
 */
const 同じ名前 = (甲, 乙) => !!甲 && !!乙 && 甲 === 乙;

/**
 * 記録の 1 人ぶんの列を、自分だけの形にする。
 * @param {object} 射手
 * @param {string|undefined} 自分id
 * @param {string|undefined} 自分名
 */
function 射手を絞る(射手, 自分id, 自分名) {
  const 自分の名前か = (名前) => 同じ名前(名前, 自分名);
  const 名前 = (自分id && 射手.memberId === 自分id) || 自分の名前か(射手.name) ? 射手.name : 他の人;

  const 交代 = {};
  for (const [位置, 相手] of Object.entries(射手.substitutions || {})) {
    交代[位置] = 相手 === '' || 相手 == null ? '' : 自分の名前か(相手) ? 相手 : 他の人;
  }
  const 交代のid = {};
  for (const [位置, id] of Object.entries(射手.substitutionIds || {})) {
    交代のid[位置] = 自分id && id === 自分id ? id : '';
  }

  // ○×は、自分が引いた射だけ残す。持ち主は分析と同じ決まり（statsRules）で決める。
  // 部員idで結び付いていない射手（名前だけ）は、その射を引いた人の表示名で見る
  const 渡す = Object.assign({}, 射手, {
    name: 名前,
    memberId: 自分id && 射手.memberId === 自分id ? 自分id : undefined,
    substitutions: 交代,
    substitutionIds: 交代のid,
  });
  const 印たち = Array.isArray(射手.marks) ? 射手.marks : [];
  const 絞った印 = 印たち.map((印, 射目) => {
    const 自分の射 =
      (自分id && 集.その射の部員id(射手, 射目) === 自分id) ||
      (自分名 && !集.その射の部員id(射手, 射目) && 自分の名前か(集.その射の名前(射手, 射目)));
    return 自分の射 ? 印 : '';
  });
  return {
    id: 射手.id,
    name: 渡す.name,
    memberId: 渡す.memberId,
    marks: 絞った印,
    substitutions: 渡す.substitutions,
    substitutionIds: 渡す.substitutionIds,
    isGuest: false,
  };
}

/**
 * 他の人の列を、名前も○×も無い空の列にする。列の並びと 区切り・計 の印だけ残す。
 * 射位を割り振る（teamGrouping）が見るのはこれだけなので、自分の射位は絞る前と同じになる。
 * 区切りのチーム名（相手校）は、割り振りに要らないので渡さない
 * @param {object|null} 射手
 */
function 空の列にする(射手) {
  if (!射手) return 射手;
  const 列 = {
    id: 射手.id,
    name: '',
    marks: [],
    memberId: undefined,
    substitutions: {},
    substitutionIds: {},
    isGuest: false,
  };
  if (射手.isSeparator) 列.isSeparator = true;
  if (射手.isTotalCalculator) 列.isTotalCalculator = true;
  return 列;
}

/**
 * @param {{members?: Array, sessions?: Array, myMemberId?: string, myMemberName?: string}} 材料
 * @returns {{members: Array, sessions: Array}} 自分だけの部員一覧（1 人）と、自分が写っている記録
 */
function 自分だけに絞る(材料) {
  const 素 = 材料 || {};
  const 自分id = 素.myMemberId || undefined;
  const 自分名 = 素.myMemberName || undefined;
  if (!自分id && !自分名) return { members: [], sessions: [] };

  const 部員たち = Array.isArray(素.members) ? 素.members : [];
  const 本人 = 部員たち.find((人) => 人 && 自分id && 人.id === 自分id) || null;
  const 自分 = {
    id: 自分id,
    name: (本人 && 本人.name) || 自分名 || '',
    grade: 本人 && typeof 本人.grade === 'number' ? 本人.grade : undefined,
    gender: 本人 ? 本人.gender : undefined,
    termKi: 本人 ? 本人.termKi : undefined,
  };

  // 1 件ずつ絞る。想定外の形の記録で例外になっても、その記録を渡さずに捨てて先へ進む。
  // 画面の描画ごと落とさず、絞れなかったものを「絞らずに渡す」側にも倒さない
  const 記録たち = [];
  for (const 記録 of Array.isArray(素.sessions) ? 素.sessions : []) {
    try {
      if (!自分の記録か(記録, 自分id, 自分名)) continue;
      記録たち.push({
        id: 記録.id,
        date: 記録.date,
        title: 記録.title,
        note: 記録.note,
        tags: 記録.tags,
        includeInStats: 記録.includeInStats,
        // 並びはそのまま。自分の列（交代で入った列も）は氏名と他の人の射を落として残し、
        // 他の人の列は空の列にする
        archers: (Array.isArray(記録.archers) ? 記録.archers : []).map((射手) =>
          自分の射手か(射手, 自分id, 自分名) ? 射手を絞る(射手, 自分id, 自分名) : 空の列にする(射手)
        ),
      });
    } catch (誤り) {
      console.warn('[chatScope] 絞れなかった記録は渡しません:', 誤り && 誤り.message);
    }
  }

  return { members: [自分], sessions: 記録たち };
}

module.exports = { 自分だけに絞る, 他の人 };
