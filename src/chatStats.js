/**
 * チャットボットに渡す成績の集計。
 *
 * 画面にも Firebase にも触れない純粋な関数なので、node --test で
 * 手元だけで確かめられる（test/chatStats.test.js）。
 *
 * 元は AIChatBot.js の中で集計し、「名前|率|的中/総」を
 * 部員の数だけ並べて模型に渡していた。並べ替えも絞り込みも模型任せで、
 * 168人ぶんの表から「一番良い人」を選ばせると取り違える。
 * 数えるのも並べるのもここで済ませ、模型には答えだけを渡す。
 */
'use strict';

const { 射位の名前 } = require('./a11yLabels');

const 集 = require('./statsRules');
const 学 = require('./gakunen');
const { 日付の文字, 練習日で数える, 出ていた部員たち } = require('./attendanceRules');
// 射位は区切りごとに数え直す（記録画面の読み上げと同じ決まり）
const { 射位を割り振る } = require('./teamGrouping');

/** 空白を落とす。名前で絞り込むとき（表示の突き合わせ）にだけ使う */
const 詰める = (文) => String(文 || '').replace(/\s/g, '');

/**
 * 模型が渡す YYYY-MM-DD を、端末の時刻の「その日の 0 時」（ms）にする。
 *
 * new Date('2026-09-01') は世界標準時の 0 時＝日本の朝 9 時。そのまま使うと、
 * 月初の朝練（9 時前）が期間から落ち、月末の翌日の朝 9 時までが期間に入っていた。
 * 読めなければ null
 * @param {string} 文
 * @returns {number|null}
 */
function 日付の始まり(文) {
  const m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(String(文 || '').trim());
  if (!m) {
    const t = new Date(文).getTime();
    return Number.isFinite(t) ? t : null;
  }
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])).getTime();
}

/** その日の終わり（翌日の 0 時の 1ms 前）。読めなければ null */
function 日付の終わり(文) {
  const 始め = 日付の始まり(文);
  if (始め == null) return null;
  const d = new Date(始め);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1).getTime() - 1;
}

/**
 * 模型が渡した dateFrom / dateTo を 期間 { 始め, 終わり } にする（どちらも省ける）
 * @param {string} [dateFrom]
 * @param {string} [dateTo]
 */
function 期間にする(dateFrom, dateTo) {
  return {
    始め: (dateFrom && 日付の始まり(dateFrom)) || 0,
    終わり: (dateTo && 日付の終わり(dateTo)) || Infinity,
  };
}

/**
 * 名簿から名前で人を選ぶ。空白を除いて、まず同じ名前、無ければ含む・含まれる。
 * 当てはまる人が 2 人以上いれば 候補 に並べて返す（黙って先頭を取ると別人の成績を答える）
 * @param {Array<object>} 人たち
 * @param {string} 名前
 * @returns {{人: object|null, 候補: Array<object>}}
 */
function 名前で選ぶ(人たち, 名前) {
  const 求める = 詰める(名前);
  const 全部 = Array.isArray(人たち) ? 人たち.filter((人) => 人 && 人.name) : [];
  if (!求める) return { 人: null, 候補: [] };
  const 同じ = 全部.filter((人) => 詰める(人.name) === 求める);
  if (同じ.length === 1) return { 人: 同じ[0], 候補: 同じ };
  if (同じ.length > 1) return { 人: null, 候補: 同じ };
  const 似た = 全部.filter((人) => {
    const 名 = 詰める(人.name);
    // 「求める」が名前を含むほう（模型が長く渡したとき）は、1 文字の名前だと何にでも当たるので 2 文字から
    return 名.includes(求める) || (名.length >= 2 && 求める.includes(名));
  });
  return { 人: 似た.length === 1 ? 似た[0] : null, 候補: 似た };
}

/**
 * 途中交代を踏まえて、その1射を引いた人を返す。
 * 判定の決まりは分析画面と共通（src/statsRules.js）。
 * 以前はここだけ氏名でも拾っていたため、画面の順位と数字が食い違っていた
 */
function その射を引いた人(射手, 射目) {
  // 名前は、射位ごとの成績のように「記録に書かれた名前で束ねる」ときだけ使う。
  // 部員に結び付ける判定には使わない（同姓同名や異体字で別人を同一視するため）
  return { id: 集.その射の部員id(射手, 射目), 名前: 集.その射の名前(射手, 射目) };
}

/**
 * 名前で部員が決まらなかったときの答え（一人の成績・矢所の成績）。
 * 当てはまる人が何人も居れば聞き返させる。名簿に無い名前（ゲストなど）は、記録に名前が
 * 出ていても成績を出せない。0 を並べるより、その旨を返す
 * @returns {{error: string, 候補?: string[]}}
 */
function 見つからない人の答え(名前, 候補, 記録たち) {
  if (候補.length > 1) {
    return {
      error: `「${名前}」に当てはまる部員が ${候補.length} 人います：${候補.map((x) => x.name).join('、')}。どの人か聞き返してください。`,
      候補: 候補.map((x) => x.name),
    };
  }
  const 求める = 詰める(名前);
  const 記録に出ている = (Array.isArray(記録たち) ? 記録たち : []).some(
    (記録) =>
      Array.isArray(記録 && 記録.archers) &&
      記録.archers.some((射手) => {
        if (!射手) return false;
        const 名たち = [射手.name || ''].concat(Object.values(射手.substitutions || {}));
        return 名たち.some((名) => {
          const 名を詰めた = 詰める(名);
          return 名を詰めた && (名を詰めた.includes(求める) || 求める.includes(名を詰めた));
        });
      })
  );
  return {
    error: 記録に出ている
      ? `「${名前}」は部員名簿にありません。記録に名前は出ていますが、ゲストとして入力されているため成績は集計できません。`
      : '選手が見つかりませんでした。',
  };
}

/** その人の1射かどうか。部員IDだけで判定する */
function その人の射か(人, 引いた人) {
  return !!(人 && 人.id && 引いた人 && 引いた人.id !== undefined && String(引いた人.id) === String(人.id));
}

/** 的中率（百分率・小数 1 桁）。射数が 0 なら null */
const 率 = (的中, 射数) => (射数 > 0 ? Number(((的中 / 射数) * 100).toFixed(1)) : null);

/**
 * 数える記録：「集計に含めない」にした記録を外し、期間で絞る。
 * 「集計に含めない」を見ていなかったころは、同じことを聞いても分析画面と数字が食い違っていた
 * @param {Array} 記録たち
 * @param {{始め?: number, 終わり?: number}} [期間]
 */
function 数える記録(記録たち, 期間) {
  const 始め = (期間 && 期間.始め) || 0;
  const 終わり = (期間 && 期間.終わり) || Infinity;
  return (Array.isArray(記録たち) ? 記録たち : []).filter(
    (記録) => 記録 && 集.集計に入れるか(記録) && (記録.date || 0) >= 始め && (記録.date || 0) <= 終わり
  );
}

/**
 * 人ごとに的中と射数を数える。途中交代を踏まえて、その 1 射を引いた部員に付ける（部員 ID だけで見る）。
 * 射目の範囲 を渡すと、列の何本目か（1 始まり、両端を含む）で絞る。
 * 記録ごと には、その人が引いた記録 1 件ごとの的中と射数が入る（的中率の散らばりを見るため）
 * @param {Array<object>} 人たち
 * @param {Array<object>} 対象 数える記録
 * @param {{から:number, まで:number}} [射目の範囲]
 * @returns {Map<object, {的中:number, 射数:number, 記録ごと:Array<{的中:number, 射数:number}>}>}
 */
function 人ごとに数える(人たち, 対象, 射目の範囲) {
  /** @type {Map<object, {的中:number, 射数:number, 記録ごと:Array<{的中:number, 射数:number}>}>} */
  const 数え = new Map(人たち.map((人) => [人, { 的中: 0, 射数: 0, 記録ごと: [] }]));
  const idから = new Map(人たち.filter((人) => 人 && 人.id).map((人) => [String(人.id), 人]));
  for (const 記録 of 対象) {
    /** @type {Map<object, {的中:number, 射数:number}>} */
    const この記録 = new Map();
    for (const 射手 of Array.isArray(記録.archers) ? 記録.archers : []) {
      if (!射手 || !Array.isArray(射手.marks)) continue;
      射手.marks.forEach((印, 射目) => {
        if (!集.引いた射か(印)) return;
        if (射目の範囲 && (射目 + 1 < 射目の範囲.から || 射目 + 1 > 射目の範囲.まで)) return;
        const 引いた人 = その射を引いた人(射手, 射目);
        const 人 =
          引いた人.id !== undefined && 引いた人.id !== null ? idから.get(String(引いた人.id)) : undefined;
        if (!人) return;
        const 数 = 数え.get(人);
        const 記 = この記録.get(人) || { 的中: 0, 射数: 0 };
        数.射数 += 1;
        記.射数 += 1;
        if (印 === '○') {
          数.的中 += 1;
          記.的中 += 1;
        }
        この記録.set(人, 記);
      });
    }
    この記録.forEach((記, 人) => 数え.get(人).記録ごと.push(記));
  }
  return 数え;
}

/** 性別と学年で人を絞る（何も渡さなければそのまま）。'男子'・'male'、1・'1年' のどちらでもよい */
function 人を絞る(人たち, 注文) {
  const 設定 = 注文 || {};
  return (Array.isArray(人たち) ? 人たち : []).filter(
    (人) => 人 && 性別が合う(人.gender, 設定.性別) && 学年が合う(人.grade, 設定.学年)
  );
}

/** 道具の返事に添える絞り込み（絞っていなければ null） */
function 絞り込みの表示(注文) {
  const 設定 = 注文 || {};
  const 学年 = 設定.学年 == null || 設定.学年 === '' ? null : 設定.学年;
  return 設定.性別 || 学年 != null ? { 性別: 設定.性別 || null, 学年 } : null;
}

/** 記録ごとの的中率の散らばりを出すのに要る、1 記録の射数と記録の件数 */
const 散らばりを見る射数 = 4;
const 散らばりを見る記録の数 = 3;

/**
 * 記録ごとの的中率の散らばり（標準偏差。ポイント）。4 射以上引いた記録が 3 件に満たなければ null。
 * 「的中率が安定している人」に答えるため。小さいほど記録ごとの的中率がそろっている
 * @param {Array<{的中:number, 射数:number}>} 記録ごと
 * @returns {{散らばり:number|null, 見た記録:number}}
 */
function 的中率の散らばり(記録ごと) {
  const 率たち = 記録ごと
    .filter((記) => 記.射数 >= 散らばりを見る射数)
    .map((記) => (記.的中 / 記.射数) * 100);
  if (率たち.length < 散らばりを見る記録の数) return { 散らばり: null, 見た記録: 率たち.length };
  const 平均 = 率たち.reduce((和, x) => 和 + x, 0) / 率たち.length;
  const 分散 = 率たち.reduce((和, x) => 和 + (x - 平均) ** 2, 0) / 率たち.length;
  return { 散らばり: Number(Math.sqrt(分散).toFixed(1)), 見た記録: 率たち.length };
}

/**
 * @typedef {{名前:string, 学年:any, 的中:number, 射数:number, 的中率:number|null, 順位?:number,
 *   記録ごとの散らばり?:number|null, 散らばりを見た記録?:number}} 成績の行
 */

/**
 * 全員の成績を数え、並べ替えて返す。
 *
 * 並び '安定' は、記録ごとの的中率の散らばりが小さい順（4 射以上の記録が 3 件以上ある人だけ）。
 * 性別・学年を渡すと、その人たちだけで数えて順位を付ける（「男子で何位」も道具が返す。
 * 前は全員の順位から模型が男子だけを数え直していた。2026-10-24 の AI のログ）
 * @param {Array} 人たち   部員
 * @param {Array} 記録たち セッション
 * @param {{期間?: {始め?: number, 終わり?: number}, 並び?: string, 件数?: number, 最小射数?: number,
 *   性別?: string, 学年?: any}} [注文]
 * @returns {{並び:string, 人数:number, 数えた記録:number, 射数が足りず外した人数:number,
 *   散らばりを出せず外した人数:number, 絞り込み:{性別:string|null, 学年:any}|null,
 *   全体:{的中:number, 射数:number, 的中率:number|null},
 *   一覧:Array<成績の行>}}
 */
function 全員の成績(人たち, 記録たち, 注文) {
  const 設定 = 注文 || {};
  const 対象 = 数える記録(記録たち, 設定.期間);
  const 絞った人 = 人を絞る(人たち, 設定);
  const 数え = 人ごとに数える(絞った人, 対象);
  const 並び = 設定.並び || '的中率';
  const 安定で = 並び === '安定';

  const 最小射数 = Number.isFinite(設定.最小射数) ? 設定.最小射数 : 1;
  const 全部 = 絞った人.map((人) => {
    const { 的中, 射数, 記録ごと } = 数え.get(人);
    // 順位は並べ替えたあとで足す（下の 残す.forEach）
    /** @type {成績の行} */
    const 行 = { 名前: 人.name || '', 学年: 人.grade, 的中, 射数, 的中率: 率(的中, 射数) };
    if (安定で) {
      const { 散らばり, 見た記録 } = 的中率の散らばり(記録ごと);
      行.記録ごとの散らばり = 散らばり;
      行.散らばりを見た記録 = 見た記録;
    }
    return 行;
  });

  const 射数で残す = 全部.filter((人) => 人.射数 >= 最小射数);
  const 残す = 安定で ? 射数で残す.filter((人) => 人.記録ごとの散らばり != null) : 射数で残す;
  const 比べ = {
    // 率が同じときは、たくさん引いた人を上にする。3射で100%が首位に立たない
    的中率: (甲, 乙) => 乙.的中率 - 甲.的中率 || 乙.射数 - 甲.射数,
    的中数: (甲, 乙) => 乙.的中 - 甲.的中 || 乙.射数 - 甲.射数,
    射数: (甲, 乙) => 乙.射数 - 甲.射数 || 乙.的中 - 甲.的中,
    名前: (甲, 乙) => String(甲.名前).localeCompare(String(乙.名前), 'ja'),
    // 散らばりが同じなら、的中率の高い人を上に
    安定: (甲, 乙) => 甲.記録ごとの散らばり - 乙.記録ごとの散らばり || 乙.的中率 - 甲.的中率,
  };
  残す.sort(比べ[並び] || 比べ.的中率);
  残す.forEach((人, 番) => {
    人.順位 = 番 + 1;
  });

  const 全体の的中 = 全部.reduce((計, 人) => 計 + 人.的中, 0);
  const 全体の射数 = 全部.reduce((計, 人) => 計 + 人.射数, 0);
  const 件数 = Number.isFinite(設定.件数) && 設定.件数 > 0 ? 設定.件数 : 残す.length;

  return {
    並び,
    人数: 残す.length,
    数えた記録: 対象.length,
    射数が足りず外した人数: 全部.length - 射数で残す.length,
    散らばりを出せず外した人数: 射数で残す.length - 残す.length,
    絞り込み: 絞り込みの表示(設定),
    全体: { 的中: 全体の的中, 射数: 全体の射数, 的中率: 率(全体の的中, 全体の射数) },
    一覧: 残す.slice(0, 件数),
  };
}

/** 期間を YYYY-MM-DD で見せる（始めも終わりも無ければ null） */
function 期間の表示(期間) {
  const 始め = 期間 && 期間.始め > 0 ? 日付の文字(期間.始め) : null;
  const 終わり = 期間 && Number.isFinite(期間.終わり) ? 日付の文字(期間.終わり) : null;
  return 始め || 終わり ? { 始め, 終わり } : null;
}

/**
 * 比べる 2 つの期間を決める。今の期間を省くと「今日までの 30 日」、前の期間を省くと
 * 「今の期間のすぐ前の、同じ日数」。日付は端末の時刻で読む（期間にする と同じ）
 * @param {{dateFrom?: string, dateTo?: string, compareFrom?: string, compareTo?: string}} 引数
 * @param {Date} [今日]
 * @returns {{今の期間:{始め:number, 終わり:number}, 前の期間:{始め:number, 終わり:number}}}
 */
function 比べる期間を決める(引数, 今日 = new Date()) {
  const { dateFrom, dateTo, compareFrom, compareTo } = 引数 || {};
  const 今日の0時 = new Date(今日.getFullYear(), 今日.getMonth(), 今日.getDate());
  const 終わり =
    (dateTo && 日付の終わり(dateTo)) ||
    new Date(今日の0時.getFullYear(), 今日の0時.getMonth(), 今日の0時.getDate() + 1).getTime() - 1;
  const 始め =
    (dateFrom && 日付の始まり(dateFrom)) ||
    new Date(今日の0時.getFullYear(), 今日の0時.getMonth(), 今日の0時.getDate() - 29).getTime();
  const 今の期間 = { 始め, 終わり };
  if (compareFrom || compareTo) return { 今の期間, 前の期間: 期間にする(compareFrom, compareTo) };
  // 同じ日数だけ前へ（日付で数える。ミリ秒で引くと夏時間のある所でずれる）
  const 始めの日 = new Date(始め);
  const 日数 = Math.max(1, Math.round((終わり + 1 - 始め) / 86400000));
  return {
    今の期間,
    前の期間: {
      始め: new Date(始めの日.getFullYear(), 始めの日.getMonth(), 始めの日.getDate() - 日数).getTime(),
      終わり: 始め - 1,
    },
  };
}

/**
 * 2 つの期間の的中率を人ごとに比べる。「最近的中率が落ちている人」「先月より上がった人」「波に乗っているのは」に
 * 答えるための道具。前は全員の成績を 2 回呼んだあと模型が引き算できず、「その機能はありません」と断っていた
 * （2026-10-24 の AI のログ）。差は 今の期間 − 前の期間（ポイント）。どちらかの期間で最小射数に満たない人は
 * 比べず、人数だけ返す（数射で 100% が「上がった」の首位に立たないように）
 * @param {Array} 人たち
 * @param {Array} 記録たち
 * @param {{今の期間:{始め:number, 終わり:number}, 前の期間:{始め:number, 終わり:number}, 並び?: string,
 *   最小射数?: number, 件数?: number, 性別?: string, 学年?: any}} 注文
 */
function 二つの期間で比べる(人たち, 記録たち, 注文) {
  const 設定 = 注文 || /** @type {any} */ ({});
  const 絞った人 = 人を絞る(人たち, 設定);
  const 今 = 人ごとに数える(絞った人, 数える記録(記録たち, 設定.今の期間));
  const 前 = 人ごとに数える(絞った人, 数える記録(記録たち, 設定.前の期間));
  const 最小射数 = Number.isFinite(設定.最小射数) && 設定.最小射数 > 0 ? 設定.最小射数 : 8;
  const 成績 = (数) => ({ 的中: 数.的中, 射数: 数.射数, 的中率: 率(数.的中, 数.射数) });
  const 全部 = 絞った人.map((人) => {
    const 今の = 成績(今.get(人));
    const 前の = 成績(前.get(人));
    const 比べられる = 今の.射数 >= 最小射数 && 前の.射数 >= 最小射数;
    return /** @type {{名前:string, 学年:any, 今の期間:any, 前の期間:any, 差:number|null, 順位?:number}} */ ({
      名前: 人.name || '',
      学年: 人.grade,
      今の期間: 今の,
      前の期間: 前の,
      差: 比べられる ? Number((今の.的中率 - 前の.的中率).toFixed(1)) : null,
    });
  });
  const 並び = ['上がった', '差の大きさ'].includes(設定.並び) ? 設定.並び : '下がった';
  const 比べ = {
    下がった: (甲, 乙) => 甲.差 - 乙.差,
    上がった: (甲, 乙) => 乙.差 - 甲.差,
    差の大きさ: (甲, 乙) => Math.abs(乙.差) - Math.abs(甲.差),
  };
  const 比べた = 全部.filter((行) => 行.差 !== null).sort(比べ[並び]);
  比べた.forEach((行, 番) => {
    行.順位 = 番 + 1;
  });
  const 合わせる = (数え) => {
    let 的中 = 0;
    let 射数 = 0;
    数え.forEach((数) => {
      的中 += 数.的中;
      射数 += 数.射数;
    });
    return { 的中, 射数, 的中率: 率(的中, 射数) };
  };
  const 全体の今 = 合わせる(今);
  const 全体の前 = 合わせる(前);
  const 件数 = Number.isFinite(設定.件数) && 設定.件数 > 0 ? 設定.件数 : 比べた.length;
  return {
    並び,
    最小射数,
    今の期間: 期間の表示(設定.今の期間),
    前の期間: 期間の表示(設定.前の期間),
    比べた人数: 比べた.length,
    射数が足りず比べなかった人数: 全部.filter(
      (行) => 行.差 === null && (行.今の期間.射数 > 0 || 行.前の期間.射数 > 0)
    ).length,
    絞り込み: 絞り込みの表示(設定),
    全体: {
      今の期間: 全体の今,
      前の期間: 全体の前,
      差:
        全体の今.的中率 != null && 全体の前.的中率 != null
          ? Number((全体の今.的中率 - 全体の前.的中率).toFixed(1))
          : null,
    },
    一覧: 比べた.slice(0, 件数),
  };
}

/**
 * 1 本の列（1 人の 1 記録）の中で、前の射と後の射の的中率を比べる。「最初の 4 射と後半の 4 射が安定している人」
 * 「1〜4 射と 5〜8 射」に答えるための道具（2026-10-24 の AI のログで「その機能はありません」と断っていた）。
 * 射目は列の何本目か（1 始まり、両端を含む）。差は 後 − 前（ポイント）。並び '差が小さい' は差の大きさが小さい順
 * @param {Array} 人たち
 * @param {Array} 記録たち
 * @param {{期間?: {始め?: number, 終わり?: number}, 前?: {から:number, まで:number}, 後?: {から:number, まで:number},
 *   並び?: string, 最小射数?: number, 件数?: number, 性別?: string, 学年?: any}} [注文]
 */
function 射の前後で比べる(人たち, 記録たち, 注文) {
  const 設定 = 注文 || {};
  const 範囲 = (値, 既定) => {
    const から = Math.max(1, Math.floor(Number(値 && 値.から) || 既定.から));
    const まで = Math.max(から, Math.floor(Number(値 && 値.まで) || 既定.まで));
    return { から, まで };
  };
  const 前の範囲 = 範囲(設定.前, { から: 1, まで: 4 });
  const 後の範囲 = 範囲(設定.後, { から: 5, まで: 8 });
  const 対象 = 数える記録(記録たち, 設定.期間);
  const 絞った人 = 人を絞る(人たち, 設定);
  const 前 = 人ごとに数える(絞った人, 対象, 前の範囲);
  const 後 = 人ごとに数える(絞った人, 対象, 後の範囲);
  const 最小射数 = Number.isFinite(設定.最小射数) && 設定.最小射数 > 0 ? 設定.最小射数 : 8;
  const 成績 = (数) => ({ 的中: 数.的中, 射数: 数.射数, 的中率: 率(数.的中, 数.射数) });
  const 全部 = 絞った人.map((人) => {
    const 前の = 成績(前.get(人));
    const 後の = 成績(後.get(人));
    const 比べられる = 前の.射数 >= 最小射数 && 後の.射数 >= 最小射数;
    return /** @type {{名前:string, 学年:any, 前の射:any, 後の射:any, 差:number|null, 順位?:number}} */ ({
      名前: 人.name || '',
      学年: 人.grade,
      前の射: 前の,
      後の射: 後の,
      差: 比べられる ? Number((後の.的中率 - 前の.的中率).toFixed(1)) : null,
    });
  });
  const 並びたち = ['差が小さい', '後が上がった', '後が下がった', '前の的中率', '後の的中率'];
  const 並び = 並びたち.includes(設定.並び) ? 設定.並び : '差が小さい';
  const 比べ = {
    // 差が同じなら、全体に当たっている人を上に
    差が小さい: (甲, 乙) =>
      Math.abs(甲.差) - Math.abs(乙.差) ||
      乙.前の射.的中率 + 乙.後の射.的中率 - (甲.前の射.的中率 + 甲.後の射.的中率),
    後が上がった: (甲, 乙) => 乙.差 - 甲.差,
    後が下がった: (甲, 乙) => 甲.差 - 乙.差,
    前の的中率: (甲, 乙) => 乙.前の射.的中率 - 甲.前の射.的中率,
    後の的中率: (甲, 乙) => 乙.後の射.的中率 - 甲.後の射.的中率,
  };
  const 比べた = 全部.filter((行) => 行.差 !== null).sort(比べ[並び]);
  比べた.forEach((行, 番) => {
    行.順位 = 番 + 1;
  });
  const 件数 = Number.isFinite(設定.件数) && 設定.件数 > 0 ? 設定.件数 : 比べた.length;
  return {
    並び,
    最小射数,
    前の射の範囲: `${前の範囲.から}〜${前の範囲.まで}射目`,
    後の射の範囲: `${後の範囲.から}〜${後の範囲.まで}射目`,
    数えた記録: 対象.length,
    比べた人数: 比べた.length,
    射数が足りず比べなかった人数: 全部.filter(
      (行) => 行.差 === null && (行.前の射.射数 > 0 || 行.後の射.射数 > 0)
    ).length,
    絞り込み: 絞り込みの表示(設定),
    一覧: 比べた.slice(0, 件数),
  };
}

/**
 * 弓具を変えた前後の成績（メンバーの画面の弓具と同じ数え方。src/equipmentTrend.js）。
 * 「弓を変えてから当たるようになった？」に答えるための道具
 * @param {Array} 人たち
 * @param {Array} 記録たち
 * @param {string} 名前
 */
function 弓具の前後(人たち, 記録たち, 名前) {
  const { 人, 候補 } = 名前で選ぶ(人たち, 名前);
  if (!人) return 見つからない人の答え(名前, 候補, 記録たち);
  // equipmentTrend は このファイルの 全員の成績 を使うので、読み込みは呼ばれたときに（輪にしない）
  const 弓 = require('./equipmentTrend');
  const 移り = 弓.弓具の移り変わり(人, 記録たち);
  if (!移り.length) {
    return {
      名前: 人.name,
      弓具の記録: 0,
      message:
        'この人の弓具の記録はありません。メンバーの画面で弓力などを変えた日を入れると、前後の的中を比べられます。',
    };
  }
  return {
    名前: 人.name,
    率を出す最小射数: 弓.率を出す最小射数,
    // 新しい順
    一覧: 移り.map((一件) => ({
      変えた日: 日付の文字(一件.始め),
      種類: 一件.種類,
      ...(一件.変更 && 一件.変更.weight ? { 弓力: `${一件.変更.weight}kg` } : {}),
      ...(一件.変更 && 一件.変更.note ? { 覚え書き: 一件.変更.note } : {}),
      その弓具のあいだ: 一件.成績,
      前の弓具のあいだ: 一件.前の成績,
      差: 一件.差,
      見立て: 弓.見立ての言葉(一件),
    })),
  };
}

// ── ここから下は、チャットボットに足した道具のための集計 ──

/** 期間で記録を絞る */
function 期間で絞る(記録たち, 期間) {
  const 始め = (期間 && 期間.始め) || 0;
  const 終わり = (期間 && 期間.終わり) || Infinity;
  return (Array.isArray(記録たち) ? 記録たち : []).filter(
    (記録) => 記録 && (記録.date || 0) >= 始め && (記録.date || 0) <= 終わり
  );
}

const 出欠の名 = { present: '出席', late: '遅刻', early: '早退', absent: '欠席' };

/**
 * 出欠を数える。「今月いちばん来ているのは誰」に答えるための道具。
 *
 * 正規練習日（注文.練習日 { 'YYYY-MM-DD': … }）が期間に有れば、出欠画面と同じ決まりで数える
 * （attendanceRules の 練習日で数える：練習日ごとに、記録に出ていれば出席、記録が無ければ欠席。
 * 分母は今日までの練習日数）。前は記録に付いた出欠の印だけを数えていて、9 月に記録が 2 件しか
 * 無い団体で「来た回数 2 回・出席率 100%」が 8 人並び、出欠画面の数字と合わなかった（2026-09-20）。
 *
 * 練習日が無いとき（練習日を登録していない団体）は前のまま、記録の出欠の印を数える。
 * 記録には attendance: { 部員id: 'present'|'late'|'early'|'absent' } が入る。
 * 出欠を付けずに保存した記録もあるので、その回は数に入れない
 * （全員欠席として数えると、出席率が実態より低く出る）。
 */
function 出欠の集計(人たち, 記録たち, 注文) {
  const 設定 = 注文 || {};
  const 期間 = 設定.期間 || {};
  const 始めの日 = 期間.始め ? 日付の文字(期間.始め) : null;
  // 終わり は「翌日の 0 時」（ms）で渡ってくるので、その 1ms 前の日付が終わりの日
  const 終わりの日 = 期間.終わり && Number.isFinite(期間.終わり) ? 日付の文字(期間.終わり - 1) : null;
  const 練習日 = Object.fromEntries(
    Object.keys(設定.練習日 || {})
      .filter((日) => (!始めの日 || 日 >= 始めの日) && (!終わりの日 || 日 <= 終わりの日))
      .map((日) => [日, 設定.練習日[日]])
  );
  const 練習日で = Object.keys(練習日).length > 0;

  /** @type {Array<{名前:string, 学年:any, 性別?:string, 出席:number, 遅刻:number, 早退:number, 欠席:number, 来た回数:number, 練習日数?:number, 出席率:number|null, 順位?:number}>} */
  const 全部 = 練習日で
    ? 練習日で数える(人たち, 記録たち, 練習日, { 今日: 設定.今日 }).map(
        ({ 部員, 出席, 遅刻, 早退, 欠席, 来た回数, 練習日数, 出席率 }) => ({
          名前: 部員.name || '',
          学年: 部員.grade,
          性別: 部員.gender,
          出席,
          遅刻,
          早退,
          欠席,
          来た回数,
          練習日数,
          出席率: 練習日数 > 0 ? Number(出席率.toFixed(1)) : null,
        })
      )
    : 記録の印で数える(人たち, 期間で絞る(記録たち, 設定.期間));

  // 現役は練習日が 1 日でも有れば載せる（来ていない人も「休みが多いのは誰」の答えになる）。
  // 記録の印で数えたときは、一度も名前が出ない人は載せない
  const 載せる = 全部
    .filter((人) => (練習日で && 学.現役か({ grade: 人.学年 })) || 人.来た回数 + 人.欠席 > 0)
    .filter((人) => 性別が合う(人.性別, 設定.性別) && 学年が合う(人.学年, 設定.学年));
  // 期間に一度も来ていない人は順位に入れず、別に返す。「欠席が多いのは誰」の上位が、
  // コーチやもう来ていない部員（106 日中 106 回欠席など）で埋まった（2026-10 の AI のログ）
  const 来ていない = 練習日で ? 載せる.filter((人) => 人.来た回数 === 0) : [];
  // 出席率の上限・下限（「出席率が3分の1以下の人」）。百分率で渡す
  const 上限 = Number.isFinite(設定.出席率の上限) ? 設定.出席率の上限 : null;
  const 下限 = Number.isFinite(設定.出席率の下限) ? 設定.出席率の下限 : null;
  const 率が合う = (人) =>
    (上限 == null || (人.出席率 != null && 人.出席率 <= 上限)) &&
    (下限 == null || (人.出席率 != null && 人.出席率 >= 下限));
  const 残す = (練習日で ? 載せる.filter((人) => 人.来た回数 > 0) : 載せる).filter(率が合う);
  const 並び = 設定.並び || '出席率';
  const 比べ = {
    出席率: (甲, 乙) => 乙.出席率 - 甲.出席率 || 乙.来た回数 - 甲.来た回数,
    来た回数: (甲, 乙) => 乙.来た回数 - 甲.来た回数 || 乙.出席率 - 甲.出席率,
    欠席: (甲, 乙) => 乙.欠席 - 甲.欠席,
    名前: (甲, 乙) => String(甲.名前).localeCompare(String(乙.名前), 'ja'),
  };
  残す.sort(比べ[並び] || 比べ.出席率);
  残す.forEach((人, 番) => {
    人.順位 = 番 + 1;
  });
  const 件数 = Number.isFinite(設定.件数) && 設定.件数 > 0 ? 設定.件数 : 残す.length;
  const 対象 = 期間で絞る(記録たち, 設定.期間);
  const 印つき = 対象.filter((記録) => 記録.attendance && Object.keys(記録.attendance).length > 0);
  return {
    並び,
    数え方: 練習日で ? '練習日' : '記録の出欠',
    練習日数: 練習日で ? Object.keys(練習日).length : 0,
    出欠を付けた記録の件数: 印つき.length,
    出欠が付いていない記録の件数: 対象.length - 印つき.length,
    絞り込み: {
      性別: 設定.性別 || null,
      学年: 設定.学年 == null || 設定.学年 === '' ? null : 設定.学年,
      ...(上限 != null ? { 出席率の上限: 上限 } : {}),
      ...(下限 != null ? { 出席率の下限: 下限 } : {}),
    },
    一覧: 残す.slice(0, 件数),
    一度も来ていない人: 来ていない.map(({ 名前, 学年, 欠席, 練習日数 }) => ({ 名前, 学年, 欠席, 練習日数 })),
  };
}

/**
 * 出欠を月ごとに数える。「各月でカウントして」「出席率が3分の1以下だった月が何回あるか」に答えるための道具。
 * 2026-09〜10 の AI のログで、月ごとに何度も呼び直したうえ、当てはまった月の数を模型が数えていた。
 * 月ごとの数え方は 出欠の集計 と同じ（その月の練習日について、記録に出ていれば来た）。
 * 出席率の上限 を渡すと、その率以下だった月（練習日のある月だけ）を数えて、多い順に並べる
 * @param {Array} 人たち
 * @param {Array} 記録たち
 * @param {{期間?: {始め?: number, 終わり?: number}, 練習日?: object, 今日?: string, 性別?: string, 学年?: any,
 *   出席率の上限?: number, 件数?: number}} [注文]
 */
function 出欠を月ごとに(人たち, 記録たち, 注文) {
  const 設定 = 注文 || {};
  const 練習日 = 設定.練習日 || {};
  const 今日 = 設定.今日 || 日付の文字(Date.now());
  // 月の並び：期間の始め（無ければ練習日か記録のいちばん古い日）から、終わり（無ければ今日）まで
  const 日たち = [
    ...Object.keys(練習日),
    ...(Array.isArray(記録たち) ? 記録たち : [])
      .filter((記録) => 記録 && 記録.date)
      .map((記録) => 日付の文字(記録.date)),
  ].sort();
  const 始めの日 = 設定.期間 && 設定.期間.始め ? 日付の文字(設定.期間.始め) : 日たち[0];
  const いちばん新しい日 = 日たち.length ? 日たち[日たち.length - 1] : '';
  const 終わりの日 =
    設定.期間 && Number.isFinite(設定.期間.終わり)
      ? 日付の文字(設定.期間.終わり)
      : 今日 < いちばん新しい日
        ? いちばん新しい日
        : 今日;
  if (!始めの日) return { 数え方: '記録が無い', 月たち: [], 一覧: [] };
  const 月たち = [];
  let [年, 月] = 始めの日.split('-').map(Number);
  const [終わりの年, 終わりの月] = 終わりの日.split('-').map(Number);
  while ((年 < 終わりの年 || (年 === 終わりの年 && 月 <= 終わりの月)) && 月たち.length < 36) {
    月たち.push({ 年, 月 });
    月 += 1;
    if (月 > 12) {
      月 = 1;
      年 += 1;
    }
  }
  const 月の名 = (y, m) => y + '-' + String(m).padStart(2, '0');
  const 上限 = Number.isFinite(設定.出席率の上限) ? 設定.出席率の上限 : null;
  /** @type {Map<string, {名前:string, 学年:any, 月ごと:Array<{月:string, 来た回数:number, 練習日数:number|null, 出席率:number|null}>, 当てはまった月?:string[]}>} */
  const 人ごと = new Map();
  let 数え方 = '練習日';
  for (const { 年: y, 月: m } of 月たち) {
    const 期間 = { 始め: new Date(y, m - 1, 1).getTime(), 終わり: new Date(y, m, 1).getTime() - 1 };
    const その月 = 出欠の集計(人たち, 記録たち, { 期間, 練習日, 今日, 性別: 設定.性別, 学年: 設定.学年 });
    if (その月.数え方 !== '練習日') 数え方 = 'その月の記録の出欠';
    const 行たち = [
      ...その月.一覧.map((行) => ({
        名前: 行.名前,
        学年: 行.学年,
        来た回数: 行.来た回数,
        練習日数: 行.練習日数 ?? null,
        出席率: 行.出席率,
      })),
      ...その月.一度も来ていない人.map((行) => ({
        名前: 行.名前,
        学年: 行.学年,
        来た回数: 0,
        練習日数: 行.練習日数 ?? null,
        出席率: 0,
      })),
    ];
    for (const 行 of 行たち) {
      if (!人ごと.has(行.名前)) 人ごと.set(行.名前, { 名前: 行.名前, 学年: 行.学年, 月ごと: [] });
      人ごと.get(行.名前).月ごと.push({
        月: 月の名(y, m),
        来た回数: 行.来た回数,
        練習日数: 行.練習日数,
        出席率: 行.出席率,
      });
    }
  }
  const 一覧 = [...人ごと.values()];
  if (上限 != null) {
    for (const 人 of 一覧) {
      人.当てはまった月 = 人.月ごと
        .filter((月) => (月.練習日数 == null || 月.練習日数 > 0) && 月.出席率 != null && 月.出席率 <= 上限)
        .map((月) => 月.月);
    }
    一覧.sort(
      (甲, 乙) =>
        乙.当てはまった月.length - 甲.当てはまった月.length ||
        String(甲.名前).localeCompare(String(乙.名前), 'ja')
    );
  } else {
    一覧.sort((甲, 乙) => String(甲.名前).localeCompare(String(乙.名前), 'ja'));
  }
  const 件数 = Number.isFinite(設定.件数) && 設定.件数 > 0 ? 設定.件数 : 一覧.length;
  return {
    数え方,
    月たち: 月たち.map(({ 年: y, 月: m }) => 月の名(y, m)),
    ...(上限 != null ? { 出席率の上限: 上限 } : {}),
    一覧: 一覧
      .filter((人) => 上限 == null || 人.当てはまった月.length > 0)
      .slice(0, 件数)
      .map((人) => (上限 == null ? 人 : { ...人, 当てはまった月の数: 人.当てはまった月.length })),
  };
}

/** 性別を 'male' / 'female' / null にそろえる。名簿は '男子'・'女子' で持ち、道具の引数は '男子'・'male' のどちらも来る */
function 性別の印(値) {
  const 文 = String(値 || '');
  return /男|^male$/i.test(文) ? 'male' : /女|^female$/i.test(文) ? 'female' : null;
}

/**
 * 性別で絞る。何も渡さなければ絞らない（'男子'・'male' のどちらでもよい）。
 * 10/25 まで名簿の '男子' を 'male' とだけ比べていて、「男子で欠席が多いのは誰」が空になっていた
 * （検査の名簿が 'male' で書かれていたので気づかなかった）
 */
function 性別が合う(性別, 注文) {
  if (!注文) return true;
  const 欲しい = 性別の印(注文);
  return !欲しい || 性別の印(性別) === 欲しい;
}

/** 学年で絞る。1 や '1年' を渡す。何も渡さなければ絞らない */
function 学年が合う(学年, 注文) {
  if (注文 == null || 注文 === '') return true;
  const 数 = Number(String(注文).replace(/[^0-9]/g, ''));
  return !Number.isFinite(数) || Number(学年) === 数;
}

/** 記録に付いた出欠の印だけで数える（練習日が無いとき） */
function 記録の印で数える(人たち, 対象) {
  const 印つき = 対象.filter((記録) => 記録.attendance && Object.keys(記録.attendance).length > 0);
  return (Array.isArray(人たち) ? 人たち : []).map((人) => {
    const 数 = { 出席: 0, 遅刻: 0, 早退: 0, 欠席: 0 };
    印つき.forEach((記録) => {
      const 名 = 出欠の名[記録.attendance[人.id]];
      if (名) 数[名] += 1;
    });
    const 来た = 数.出席 + 数.遅刻 + 数.早退;
    const 数えた = 来た + 数.欠席;
    // 順位はあとから足す（出欠の集計 の 残す.forEach）
    return /** @type {{名前:string, 学年:any, 性別?:string, 出席:number, 遅刻:number, 早退:number, 欠席:number, 来た回数:number, 出席率:number|null, 順位?:number}} */ ({
      名前: 人.name || '',
      学年: 人.grade,
      性別: 人.gender,
      出席: 数.出席,
      遅刻: 数.遅刻,
      早退: 数.早退,
      欠席: 数.欠席,
      来た回数: 来た,
      出席率: 数えた > 0 ? Number(((来た / 数えた) * 100).toFixed(1)) : null,
    });
  });
}

/**
 * タグで記録を絞る。「自主練の的中率」「試合だけの成績」のように、成績をタグで分けて聞かれたときに使う。
 *
 * タグは、記録の tags（「#自主稽古」のように # が付いて入っている）に、渡した言葉が**含まれる**ものに当てる
 * （「自主」でも「#自主稽古」に当たる。# は付けても付けなくてもよい）。複数渡したときは、
 * すべてに当たる記録だけ（分析画面の「すべて含む」と同じ）。何も渡さなければ絞らない。
 * 当たる記録が無いときのために、使えるタグの一覧も返す（模型がタグの名前を選び直せるように）。
 *
 * @param {Array} 記録たち
 * @param {string[]|string|null|undefined} タグたち
 * @returns {{記録たち: Array, 絞った: boolean, タグ: string[], 当たった件数: number, 使えるタグ: string[], 当たったタグ: string[]}}
 *   当たったタグ … 絞った記録に付いていたタグのうち、渡した言葉に当たったもの（言葉は部分一致なので、
 *   「練習」で「#正規練習」と「#自主練習」の両方に当たることがある。答えにどのタグで数えたかを書けるように返す）
 */
function タグで絞る(記録たち, タグたち) {
  const 一覧 = Array.isArray(記録たち) ? 記録たち : [];
  const 正規 = (t) =>
    String(t == null ? '' : t)
      .replace(/^#/, '')
      .replace(/\s/g, '');
  const 要る = (Array.isArray(タグたち) ? タグたち : タグたち ? [タグたち] : []).map(正規).filter(Boolean);
  const 使えるタグ = Array.from(
    new Set(一覧.flatMap((記録) => (記録 && Array.isArray(記録.tags) ? 記録.tags : [])).map(String))
  ).sort();
  if (!要る.length)
    return {
      記録たち: 一覧,
      絞った: false,
      タグ: [],
      当たった件数: 一覧.length,
      使えるタグ,
      当たったタグ: [],
    };
  const 当たったタグ = new Set();
  const 当たる = 一覧.filter((記録) => {
    const 元のタグ = 記録 && Array.isArray(記録.tags) ? 記録.tags.map(String) : [];
    const 付いている = 元のタグ.map(正規);
    const 全部に当たる = 要る.every((t) => 付いている.some((x) => x.includes(t)));
    if (全部に当たる)
      元のタグ.forEach((元, 番) => 要る.some((t) => 付いている[番].includes(t)) && 当たったタグ.add(元));
    return 全部に当たる;
  });
  return {
    記録たち: 当たる,
    絞った: true,
    タグ: 要る,
    当たった件数: 当たる.length,
    使えるタグ,
    当たったタグ: [...当たったタグ].sort(),
  };
}

/**
 * 記録の題・覚え書きに含まれる言葉で記録を絞る。「リーグ戦に出た選手の的中率」のように、タグではなく
 * 題で分けて聞かれたとき用（2026-10-04 に「男子リーグ戦に出場している選手で的中率が高い選手」が
 * 「回答を生成できませんでした」になった。タグには「リーグ戦」が無く、題にだけあった）。
 * 空白は無視し、大文字小文字・全角半角はそろえて比べる
 */
function 題で絞る(記録たち, 言葉) {
  const 一覧 = Array.isArray(記録たち) ? 記録たち : [];
  const 整える = (t) =>
    String(t == null ? '' : t)
      .normalize('NFKC')
      .replace(/\s/g, '')
      .toLowerCase();
  const 探す = 整える(言葉);
  if (!探す) return { 記録たち: 一覧, 絞った: false, 言葉: '', 当たった件数: 一覧.length };
  const 当たる = 一覧.filter(
    (記録) => 記録 && (整える(記録.title).includes(探す) || 整える(記録.memo).includes(探す))
  );
  return { 記録たち: 当たる, 絞った: true, 言葉: String(言葉), 当たった件数: 当たる.length };
}

/**
 * 記録の中のチーム（区切りで分けた組）ごとの的中数と射数。「何中対何中」「どっちが勝った」に答えるため。
 * 区切り（isSeparator）の teamName をチーム名にし、次の区切りまでの射手の ○ と × を数える。計の列は数えない。
 * 区切りが 1 つも無ければ null（チームに分けていない記録）。最初の区切りより前の射手は「区切りより前」の組。
 * 前は AI が「足し算は禁じられている」と断り続けた（10/4、言い直し 8 回）。数えるのはここ
 */
function チームごとの的中(記録) {
  const 射手たち = 記録 && Array.isArray(記録.archers) ? 記録.archers : [];
  if (!射手たち.some((射手) => 射手 && 射手.isSeparator)) return null;
  const 組たち = [];
  let 今 = null;
  for (const 射手 of 射手たち) {
    if (!射手) continue;
    if (射手.isSeparator) {
      今 = {
        チーム: String(射手.teamName || 射手.name || '').trim() || `${組たち.length + 1}組目`,
        人数: 0,
        的中: 0,
        射数: 0,
      };
      組たち.push(今);
      continue;
    }
    if (射手.isTotalCalculator) continue;
    if (!今) {
      今 = { チーム: '区切りより前', 人数: 0, 的中: 0, 射数: 0 };
      組たち.push(今);
    }
    const 印たち = Array.isArray(射手.marks) ? 射手.marks : [];
    今.人数++;
    for (const 印 of 印たち) {
      if (印 === '○') {
        今.的中++;
        今.射数++;
      } else if (印 === '\xd7') 今.射数++;
    }
  }
  return 組たち
    .filter((組) => 組.人数 > 0)
    .map((組) => ({
      ...組,
      的中率: 組.射数 ? Math.round((組.的中 / 組.射数) * 1000) / 10 + '%' : 'データなし',
    }));
}

/**
 * 1 件の記録を、AI に渡す短い形にする（AIChatBot.js の getSessionsByDate）。
 * 人ごとの ○× の並びと的中数は、途中交代を踏まえて引いた人の名前で束ねる（名前の無い射はゲスト）。
 * 区切りと計の列は数えない（計の列に ○× が入っている記録が本番にある。全体の的中率が膨らむ）。
 * @param {{載せない名前?: string|null, チームも?: boolean}} [注文]
 *   載せない名前 … 人ごとの一覧に載せない名前（個人ログインで空にした交代の相手）。
 *   チームも … チームごとの的中も添えるか（既定は添える）
 */
function 記録の要約(記録, 注文 = {}) {
  const { 載せない名前 = null, チームも = true } = 注文;
  const 日付 = new Date(記録.date || 0);
  const 人ごと = new Map(); // 名前 → { 印たち, 的中, 射数 }
  let 的中 = 0;
  let 射数 = 0;
  for (const 射手 of 記録.archers || []) {
    if (!射手 || !Array.isArray(射手.marks) || 射手.isSeparator || 射手.isTotalCalculator) continue;
    射手.marks.forEach((印, 射目) => {
      const 名前 = String(集.その射の名前(射手, 射目) || '').trim() || 'ゲスト';
      if (!人ごと.has(名前)) 人ごと.set(名前, { 印たち: [], 的中: 0, 射数: 0 });
      const その人 = 人ごと.get(名前);
      その人.印たち.push(印);
      if (印 === '○' || 印 === '×') {
        その人.射数++;
        射数++;
      }
      if (印 === '○') {
        その人.的中++;
        的中++;
      }
    });
  }
  const 人たち = [...人ごと.entries()]
    .filter(([名前]) => 名前 !== 載せない名前)
    .map(([名前, その人]) => `${名前}:${その人.印たち.join('')}(${その人.的中}/${その人.射数})`)
    .join(', ');
  // チーム（区切り）ごとの的中数。「何中対何中」に答えるため
  const チームごと = チームも ? チームごとの的中(記録) : null;
  return {
    id: 記録.id,
    date: `${日付.getFullYear()}/${日付.getMonth() + 1}/${日付.getDate()}`,
    title: 記録.title || '無題',
    // メモとタグも返す。「この記録のメモは」「どのタグが付いている」に答えられるように
    ...(記録.note ? { memo: 記録.note } : {}),
    ...(Array.isArray(記録.tags) && 記録.tags.length ? { tags: 記録.tags } : {}),
    hitRate: 射数 > 0 ? ((的中 / 射数) * 100).toFixed(1) + '%' : 'データなし',
    totalArrows: 射数,
    archers: 人たち,
    ...(チームごと ? { チームごと } : {}),
  };
}

/**
 * 記録 1 件の全体の的中と射数（記録の要約と同じ見方。区切りと計の列は数えない）。
 * 「今月いちばん当たった日」のように、記録を的中で並べるときに使う
 * @param {object} 記録
 * @returns {{的中:number, 射数:number, 的中率:number|null}}
 */
function 記録の的中(記録) {
  let 的中 = 0;
  let 射数 = 0;
  for (const 射手 of (記録 && 記録.archers) || []) {
    if (!射手 || !Array.isArray(射手.marks) || 射手.isSeparator || 射手.isTotalCalculator) continue;
    for (const 印 of 射手.marks) {
      if (印 === '○' || 印 === '×') 射数++;
      if (印 === '○') 的中++;
    }
  }
  return { 的中, 射数, 的中率: 率(的中, 射数) };
}

/**
 * 記録に何回出たかを、人ごとに数える。「自主練がいちばん多いのは誰」に答えるための道具。
 *
 * 言葉（題・覚え書き・目印・出ている人の名前。記録をさがすと同じ見方）で記録を絞り、
 * 絞った記録に部員ごとに何回出たかを数える。出ている人は 出ていた部員たち（途中交代で入った人も含む。
 * 部員IDだけで見る。ゲストは部員IDが無いので数えない）。同じ記録に何度出ても 1 回。
 * 前は searchSessions で記録の一覧だけが返り、人ごとの回数は AI が 49 件を読んで数えていた
 * （数え間違えるうえ、「集計する機能がない」と断る答えも出ていた。2026-10-02）。
 */
function 参加回数を数える(人たち, 記録たち, 注文) {
  const 設定 = 注文 || {};
  const 見つけた = 記録をさがす(記録たち, { 言葉: 設定.言葉, 期間: 設定.期間, 件数: 1e9 });
  const ひとまとめ = new Set(見つけた.一覧.map((行) => 行.id));
  const 対象 = 期間で絞る(記録たち, 設定.期間).filter((記録) => ひとまとめ.has(記録.id));
  const 回数 = new Map();
  対象.forEach((記録) => {
    出ていた部員たち(記録.archers).forEach((id) => 回数.set(id, (回数.get(id) || 0) + 1));
  });
  const 並び = (Array.isArray(人たち) ? 人たち : [])
    .map((人) => ({ 名前: 人.name || '', 学年: 人.grade, 回数: 回数.get(String(人.id)) || 0 }))
    .filter((行) => 行.回数 > 0)
    .sort((甲, 乙) => 乙.回数 - 甲.回数 || String(甲.名前).localeCompare(String(乙.名前), 'ja'))
    .map((行, 番) => ({ ...行, 順位: 番 + 1 }));
  const 件数 = Number.isFinite(設定.件数) && 設定.件数 > 0 ? 設定.件数 : 並び.length;
  return {
    数えた記録: 対象.length,
    部員の数: 並び.length,
    一覧: 並び.slice(0, 件数),
  };
}

/**
 * 記録を言葉で探す。日付が分からない記録にたどり着くための道具。
 * 題・覚え書き・目印・出ている人の名前を見る。
 */
function 記録をさがす(記録たち, 注文) {
  const 設定 = 注文 || {};
  const 語 = String(設定.言葉 || '').replace(/\s/g, '');
  const 対象 = 期間で絞る(記録たち, 設定.期間);
  const 当たる = (記録) => {
    if (!語) return true;
    const 中身 = [記録.title || '', 記録.note || '', (記録.tags || []).join(' ')]
      .join(' ')
      .replace(/\s/g, '');
    if (中身.includes(語)) return true;
    return (Array.isArray(記録.archers) ? 記録.archers : []).some((射手) => {
      if (!射手) return false;
      const 名 = [射手.name || ''].concat(Object.values(射手.substitutions || {}));
      return 名.some((名前) =>
        String(名前 || '')
          .replace(/\s/g, '')
          .includes(語)
      );
    });
  };
  const 見つけた = 対象.filter(当たる).sort((甲, 乙) => (乙.date || 0) - (甲.date || 0));
  const 件数 = Number.isFinite(設定.件数) && 設定.件数 > 0 ? 設定.件数 : 20;
  return {
    見つかった件数: 見つけた.length,
    一覧: 見つけた.slice(0, 件数).map((記録) => ({
      id: 記録.id,
      日付: 端末の日付(記録.date || 0),
      題: 記録.title || '',
      目印: 記録.tags || [],
      覚え書き: 記録.note || '',
      人数: (Array.isArray(記録.archers) ? 記録.archers : []).filter(
        (射手) => 射手 && !射手.isSeparator && !射手.isTotalCalculator
      ).length,
    })),
  };
}

/**
 * 日時を「年-月-日」にする。端末の日付で切る。
 *
 * toISOString は世界標準時で切るので、日本では朝9時より前の練習が
 * 前の日にまとめられてしまう。朝練の記録がひとつ前の日付で答えられていた。
 */
function 端末の日付(日時) {
  const 日付 = new Date(日時);
  if (Number.isNaN(日付.getTime())) return '';
  return `${日付.getFullYear()}-${String(日付.getMonth() + 1).padStart(2, '0')}-${String(日付.getDate()).padStart(2, '0')}`;
}

/** 射位の見込みで、本人の全体の率へ寄せる射数 */
const 射位の寄せ = 8;

/**
 * 射位ごとの成績を出す。立ち順を考えるための材料。
 *
 * 大前は一番前、落は一番後ろ。記録表の並び順がそのまま射位で、区切りごとに
 * 数え直す（板が 2 つ写った記録の 2 枚目も先頭が大前。teamGrouping の 射位を割り振る）。
 * ここでは数字を出すだけで、誰をどこに置くかは決めない（決めるのは人）。
 */
function 射位ごとの成績(人たち, 記録たち, 注文) {
  const 設定 = 注文 || {};
  // 「集計に含めない」にした記録は数えない。全員の成績と揃えないと、
  // 同じ話の中で順位と射位別の射数が食い違う
  const 対象 = 期間で絞る(記録たち, 設定.期間).filter((記録) => 集.集計に入れるか(記録));
  // 人で絞る：渡した人たち（性別・学年で絞った部員）の射だけを数える。ふだんは記録に書かれた名前で束ね、
  // ゲストも並ぶ。10/25 まで、性別・学年を渡しても ここで名簿を見ておらず、何も絞れていなかった
  const 数える人 = 設定.人で絞る
    ? new Set((Array.isArray(人たち) ? 人たち : []).filter((人) => 人 && 人.id).map((人) => String(人.id)))
    : null;
  const 箱 = new Map();
  const 入れる = (名前, 射位, 印) => {
    if (!箱.has(名前)) 箱.set(名前, { 名前, 全体: { 的中: 0, 射数: 0 }, 射位: {} });
    const 人 = 箱.get(名前);
    if (!人.射位[射位]) 人.射位[射位] = { 的中: 0, 射数: 0 };
    人.全体.射数 += 1;
    人.射位[射位].射数 += 1;
    if (印 === '○') {
      人.全体.的中 += 1;
      人.射位[射位].的中 += 1;
    }
  };

  対象.forEach((記録) => {
    const 並び = Array.isArray(記録.archers) ? 記録.archers : [];
    const 射位たち = 射位を割り振る(並び);
    並び.forEach((射手, i) => {
      if (!射位たち[i]) return; // 区切り・計
      // 呼び方は src/a11yLabels.js に1か所だけ置く。2か所に書くと、
      // AIの答えと読み上げで違う呼び方になる
      const 射位 = 射位の名前(射位たち[i].番, 射位たち[i].人数);
      (Array.isArray(射手.marks) ? 射手.marks : []).forEach((印, 射目) => {
        if (印 !== '○' && 印 !== '×') return;
        const 引いた人 = その射を引いた人(射手, 射目);
        if (数える人 && !(引いた人.id != null && 数える人.has(String(引いた人.id)))) return;
        入れる(引いた人.名前 || 射手.name || '', 射位, 印);
      });
    });
  });

  const 率 = (成績) => (成績.射数 > 0 ? Number(((成績.的中 / 成績.射数) * 100).toFixed(1)) : null);
  const 最小射数 = Number.isFinite(設定.最小射数) ? 設定.最小射数 : 1;
  // 射数の少ない射位の率は、本人の全体の率へ 射位の寄せ 射ぶん寄せて見込む。
  // 2026-10-17 の本番：「大前に向いているのは誰？」に、大前 8 射 8 中・全体 50% の人を
  // 全体 94% の人と同じ 100% として並べて答えた。8 射の 100% は揺れの内
  const 見込む = (射位の成績, 全体) => {
    if (!(射位の成績.射数 > 0) || !(全体.射数 > 0)) return null;
    const 全体の率 = 全体.的中 / 全体.射数;
    const 見込み = (射位の成績.的中 + 射位の寄せ * 全体の率) / (射位の成績.射数 + 射位の寄せ);
    return Number((見込み * 100).toFixed(1));
  };
  // 模型は「鈴木」のように短く渡す。記録の名前は「☆鈴木 一郎☆」のように長いので、含む・含まれるで見る
  const 名前で絞る =
    Array.isArray(設定.名前たち) && 設定.名前たち.length ? 設定.名前たち.map(詰める).filter(Boolean) : null;
  const 名前が当たる = (名前) => {
    const 名 = 詰める(名前);
    return 名前で絞る.some((求める) => 名 === 求める || 名.includes(求める) || 求める.includes(名));
  };

  const 残す人 = [...箱.values()]
    .filter((人) => 人.全体.射数 >= 最小射数)
    .filter((人) => !名前で絞る || 名前が当たる(人.名前));
  // その射位に向いている順（「大前に向いているのは誰」）。見込みの高い順に並べるのも道具で済ませる
  // （前は模型が全員ぶんの 射位ごと から選んで並べていた）
  const その射位 = 設定.射位 ? String(設定.射位).trim() : '';
  const その射位の順位 = その射位
    ? 残す人
        .filter((人) => 人.射位[その射位] && 人.射位[その射位].射数 > 0)
        .map((人) => ({
          名前: 人.名前,
          射位: その射位,
          見込みの的中率: 見込む(人.射位[その射位], 人.全体),
          的中率: 率(人.射位[その射位]),
          的中: 人.射位[その射位].的中,
          射数: 人.射位[その射位].射数,
          全体の的中率: 率(人.全体),
        }))
        .sort((甲, 乙) => 乙.見込みの的中率 - 甲.見込みの的中率 || 乙.射数 - 甲.射数)
        .map((行, 番) => ({ 順位: 番 + 1, ...行 }))
    : null;

  return {
    ...(その射位の順位 ? { その射位の順位 } : {}),
    一覧: 残す人
      .sort((甲, 乙) => 率(乙.全体) - 率(甲.全体))
      .map((人) => ({
        名前: 人.名前,
        全体の的中率: 率(人.全体),
        全体の射数: 人.全体.射数,
        射位ごと: Object.keys(人.射位)
          .sort()
          .map((射位) => ({
            射位,
            的中率: 率(人.射位[射位]),
            的中: 人.射位[射位].的中,
            射数: 人.射位[射位].射数,
            見込みの的中率: 見込む(人.射位[射位], 人.全体),
          })),
      })),
  };
}

/**
 * 一人の詳しい成績。getDetailedMemberStats の中身（元は AIChatBot.js の中に在った）。
 *
 * 部員IDで数える。射位は区切りごとに数え直した並びで見る（射位ごとの成績と同じ。
 * 前は archers の生の添字で見ていて、計の列が末尾に在ると落が一度も数えられず、
 * 区切りの次の人が「6番目」になっていた）。直近は日付の新しい順（前は作った順）で、
 * その人が出た記録だけを 10 回数える。期間を渡せばその範囲だけ（皆中も同じ範囲）。
 *
 * @param {Array<object>} 人たち 名簿
 * @param {Array<object>} 記録たち
 * @param {string} 名前 模型が渡した名前
 * @param {{始め?: number, 終わり?: number}} [期間] 省くと全期間
 * @returns {object} 模型に返す中身（error か成績）
 */
function 一人の成績(人たち, 記録たち, 名前, 期間) {
  const { 人, 候補 } = 名前で選ぶ(人たち, 名前);
  const 使える記録 = 期間で絞る(記録たち, 期間).filter(
    (記録) => 記録 && Array.isArray(記録.archers) && 集.集計に入れるか(記録)
  );
  if (!人) return 見つからない人の答え(名前, 候補, 使える記録);
  const 部員id = 人.id;
  const 射ごと = [0, 0, 0, 0].map(() => ({ 的中: 0, 射数: 0 }));
  const 大前 = { 的中: 0, 射数: 0 };
  const 落 = { 的中: 0, 射数: 0 };
  const 全体 = { 的中: 0, 射数: 0 };
  const 直近 = { 的中: 0, 射数: 0 };
  const 直近の記録 = [];
  let 出た記録 = 0;
  const 新しい順 = [...使える記録].sort((甲, 乙) => (乙.date || 0) - (甲.date || 0));
  for (const 記録 of 新しい順) {
    const 並び = 記録.archers;
    const 射位たち = 射位を割り振る(並び);
    let 出た = false;
    // 1 つの記録に 2 回出た（区切りの前後で別の射位など）ときは、立った射位を全部並べる。
    // 最初の射位だけにすると、2 回目の射もその射位で引いたように見えた
    const 射位たちの名 = [];
    let 印の並び = '';
    const この記録 = { 的中: 0, 射数: 0 };
    並び.forEach((射手, i) => {
      if (!射位たち[i] || !Array.isArray(射手.marks)) return;
      const { 番, 人数 } = 射位たち[i];
      const 大前か = 番 === 0;
      const 落か = 人数 >= 3 && 番 === 人数 - 1;
      射手.marks.forEach((印, 射目) => {
        if (!集.引いた射か(印)) return;
        if (!集.その人の射か(射手, 射目, 部員id)) return;
        const この射位 = 射位の名前(番, 人数);
        if (!射位たちの名.includes(この射位)) 射位たちの名.push(この射位);
        出た = true;
        const 位置 = 射目 % 4;
        射ごと[位置].射数++;
        全体.射数++;
        この記録.射数++;
        印の並び += 印;
        if (大前か) 大前.射数++;
        if (落か) 落.射数++;
        if (印 === '○') {
          射ごと[位置].的中++;
          全体.的中++;
          この記録.的中++;
          if (大前か) 大前.的中++;
          if (落か) 落.的中++;
        }
      });
    });
    if (!出た) continue;
    出た記録++;
    // 直近 10 回は、その人が出た記録で数える（出ていない記録は飛ばす）
    if (出た記録 <= 10) {
      直近.的中 += この記録.的中;
      直近.射数 += この記録.射数;
    }
    if (直近の記録.length < 5) {
      直近の記録.push({
        date: 端末の日付(記録.date || 0),
        title: 記録.title || '無題',
        position: 射位たちの名.join('・'),
        marks: 印の並び,
        result: `${この記録.的中}/${この記録.射数}`,
      });
    }
  }
  const 率 = (x) => (x.射数 > 0 ? ((x.的中 / x.射数) * 100).toFixed(1) + '%' : 'データなし');
  const 画面の成績 = 集.成績を数える(使える記録, 部員id);
  return {
    name: 人.name,
    期間: 期間 && (期間.始め || (期間.終わり && 期間.終わり !== Infinity)) ? '指定の期間だけ' : '全期間',
    totalSessions: 出た記録,
    totalHitRate: 率(全体),
    totalArrows: 全体.射数,
    recentHitRate: 率(直近),
    // 皆中は分析画面と同じ決まりで数える
    kaichuCount: 画面の成績.patterns.kaichu,
    // 一射（1 本だけ）・一手（2 本だけ）引いた行。分析の「的中の型」と同じ数え方（statsRules の 成績を数える）。
    // 2026-10-13、画面に「一手 0中／2射」と出ているのに、AI はこれを持たず「見当たらない」と答えて撤回した
    ...一射と一手(新しい順, 部員id),
    firstShotHitRate: 率(射ごと[0]),
    secondShotHitRate: 率(射ごと[1]),
    thirdShotHitRate: 率(射ごと[2]),
    fourthShotHitRate: 率(射ごと[3]),
    omaeHitRate: 率(大前),
    ochiHitRate: 率(落),
    recentSessionsDetail: 直近の記録,
  };
}

/**
 * 一射・一手（立の 4 射に満たない行）の成績と、それがいつの記録か。
 * 行ごとに、その人が引いた印が 1 つなら一射、2 つなら一手、3 つなら三射（成績を数える と同じ見分け方。三射はそこでは端数）
 */
function 一射と一手(新しい順の記録, 部員id) {
  // 途中交代のある列は数えない。個人ログインでは同じ列の他の人の射が空で渡るため、列で引いた本数が
  // 絞る前と変わり、一射・一手の見分けが食い違う（分析の画面はその列も数える。めったに無い）
  const 束 = {
    1: { 射数: 0, 的中: 0, 記録: [] },
    2: { 射数: 0, 的中: 0, 記録: [] },
    3: { 射数: 0, 的中: 0, 記録: [] },
  };
  /** @type {Record<string, number>} */
  const 一手の型 = {};
  for (const 記録 of 新しい順の記録) {
    for (const 射手 of 記録.archers || []) {
      if (!射手 || !Array.isArray(射手.marks)) continue;
      if (Object.keys(射手.substitutions || {}).length) continue;
      const 印たち = 射手.marks.filter(
        (印, 射目) => 集.引いた射か(印) && 集.その人の射か(射手, 射目, 部員id)
      );
      const 置き場 = 束[印たち.length];
      if (!置き場 || 印たち.length !== 射手.marks.filter((印) => 集.引いた射か(印)).length) continue;
      置き場.射数 += 印たち.length;
      置き場.的中 += 印たち.filter((印) => 印 === '○').length;
      if (印たち.length === 2) 一手の型[印たち.join('')] = (一手の型[印たち.join('')] || 0) + 1;
      if (置き場.記録.length < 10)
        置き場.記録.push({
          date: 端末の日付(記録.date || 0),
          title: 記録.title || '無題',
          marks: 印たち.join(''),
        });
    }
  }
  const 率 = (x) => (x.射数 > 0 ? ((x.的中 / x.射数) * 100).toFixed(1) + '%' : 'データなし');
  const 形 = (x) => ({ 射数: x.射数, 的中: x.的中, 的中率: 率(x), 記録: x.記録 });
  return {
    oneShot: 形(束[1]),
    oneHand: Object.assign({ 手の数: 束[2].射数 / 2 }, 形(束[2]), {
      型: 集
        .一手の型を並べる(一手の型)
        .map((x) => ({ 型: x.型, 呼び名: x.呼び名, 回数: x.回数, 要点: x.要点 })),
    }),
    threeShots: 形(束[3]),
  };
}

/** ○か×か（空・その他の印は数えない） */
const 印か = (印) => 印 === '○' || 印 === '\xd7';

/** 矢所を置いた的の種類。種類の無い古い矢所は霞的とみなす（分析の的 ArrowLocationView と同じ） */
const 矢所の的 = (矢所) => (矢所 && 矢所.targetType) || 'kasumi36';

/**
 * 矢の集まり：中心（矢の平均の位置）と、散らばりの大きさ（中心からの距離の二乗平均の平方根）。
 * 位置は的の縁が 1。点が無ければ null
 * @param {{x:number, y:number}[]} 点たち
 * @returns {{x:number, y:number, 半径:number, 本数:number} | null}
 */
function 集まり(点たち) {
  const 点 = (Array.isArray(点たち) ? 点たち : []).filter(
    (p) => p && Number.isFinite(Number(p.x)) && Number.isFinite(Number(p.y))
  );
  if (!点.length) return null;
  const x = 点.reduce((和, p) => 和 + Number(p.x), 0) / 点.length;
  const y = 点.reduce((和, p) => 和 + Number(p.y), 0) / 点.length;
  const 半径 = Math.sqrt(
    点.reduce((和, p) => 和 + (Number(p.x) - x) ** 2 + (Number(p.y) - y) ** 2, 0) / 点.length
  );
  return { x, y, 半径, 本数: 点.length };
}

/**
 * 矢所の中心位置（x, y）から八方位または中心を判定する
 */
function 矢所の方位(x, y) {
  const 距離 = Math.hypot(x, y);
  if (距離 < 0.15) {
    return '的の中心付近';
  }
  const deg = (Math.atan2(y, x) * 180) / Math.PI;
  if (deg >= -22.5 && deg < 22.5) return '右寄り';
  if (deg >= 22.5 && deg < 67.5) return '右下寄り';
  if (deg >= 67.5 && deg < 112.5) return '下寄り';
  if (deg >= 112.5 && deg < 157.5) return '左下寄り';
  if (deg >= 157.5 || deg < -157.5) return '左寄り';
  if (deg >= -157.5 && deg < -112.5) return '左上寄り';
  if (deg >= -112.5 && deg < -67.5) return '上寄り';
  if (deg >= -67.5 && deg < -22.5) return '右上寄り';
  return '的の中心付近';
}

/**
 * 散らばり（半径）からまとまり具合を判定する
 */
function 矢所のまとまり(半径) {
  if (半径 < 0.25) return 'まとまりが非常に高い（集約している）';
  if (半径 < 0.4) return 'まとまりが良好（矢所が安定している）';
  if (半径 < 0.6) return '標準的な散らばり';
  return '散らばりがやや大きい（ばらつきがある）';
}

/**
 * ある部員の矢所（着弾位置、まとまり具合、外れ矢の傾向）を集計する
 */
function 矢所の成績(名簿, 記録たち, 名前, 条件 = {}) {
  const { 人, 候補 } = 名前で選ぶ(名簿, 名前);
  if (!人) return 見つからない人の答え(名前, 候補, 記録たち);

  // 「統計に含めない」にした記録は、ほかの集計と同じく矢所からも外す
  let 使える記録 = (Array.isArray(記録たち) ? 記録たち : []).filter(
    (記録) => 記録 && 集.集計に入れるか(記録)
  );
  const 期間 = 期間にする(
    条件.dateFrom || (条件.期間 && 条件.期間.始め),
    条件.dateTo || (条件.期間 && 条件.期間.終わり)
  );
  if (期間 && (期間.始め || (期間.終わり && 期間.終わり !== Infinity))) {
    使える記録 = 使える記録.filter((r) => {
      const d = r && r.date ? r.date : 0;
      return d >= (期間.始め || 0) && d <= (期間.終わり || Infinity);
    });
  }
  if (条件.tags || 条件.タグ) {
    使える記録 = タグで絞る(使える記録, 条件.tags || 条件.タグ).記録たち;
  }

  const 点たち = [];
  for (const 記録 of 使える記録) {
    const archers = Array.isArray(記録.archers) ? 記録.archers : [];
    for (const archer of archers) {
      if (!archer || archer.isSeparator || archer.isTotalCalculator) continue;
      const arrowLocations = Array.isArray(archer.arrowLocations) ? archer.arrowLocations : [];
      const marks = Array.isArray(archer.marks) ? archer.marks : [];
      const 本数 = Math.max(arrowLocations.length, marks.length);
      for (let idx = 0; idx < 本数; idx++) {
        if (!その人の射か(人, その射を引いた人(archer, idx))) continue;
        const loc = arrowLocations[idx];
        const mark = marks[idx];
        if (!loc || !印か(mark)) continue;
        if (loc.x === undefined || loc.y === undefined || loc.x === null || loc.y === null) continue;
        const 的 = 矢所の的(loc);
        if (条件.targetType && 的 !== 条件.targetType) continue;

        点たち.push({
          x: Number(loc.x) || 0,
          y: Number(loc.y) || 0,
          印: mark,
          targetType: 的,
          date: 記録.date,
          sessionTitle: 記録.title,
        });
      }
    }
  }

  if (点たち.length === 0) {
    return {
      name: 人.name,
      arrowCount: 0,
      hitCount: 0,
      missCount: 0,
      hitRate: '0%',
      message: `${人.name}さんの矢所の記録はありません。記録画面で矢所を記録すると、ここに傾向が表示されます。`,
    };
  }

  const 中り点 = 点たち.filter((p) => p.印 === '○');
  const 外れ点 = 点たち.filter((p) => p.印 === '×');

  const 全体集まり = 集まり(点たち);
  const 中り集まり = 集まり(中り点);
  const 外れ集まり = 集まり(外れ点);

  const arrowCount = 点たち.length;
  const hitCount = 中り点.length;
  const missCount = 外れ点.length;
  const hitRateNum = (hitCount / arrowCount) * 100;
  const hitRate = (hitRateNum % 1 === 0 ? hitRateNum.toFixed(0) : hitRateNum.toFixed(1)) + '%';

  const overallTrend = {
    direction: 矢所の方位(全体集まり.x, 全体集まり.y),
    grouping: 矢所のまとまり(全体集まり.半径),
    centerX: Number(全体集まり.x.toFixed(2)),
    centerY: Number(全体集まり.y.toFixed(2)),
    radius: Number(全体集まり.半径.toFixed(2)),
  };

  const hitTrend = 中り集まり
    ? {
        direction: 矢所の方位(中り集まり.x, 中り集まり.y),
        count: hitCount,
        centerX: Number(中り集まり.x.toFixed(2)),
        centerY: Number(中り集まり.y.toFixed(2)),
        radius: Number(中り集まり.半径.toFixed(2)),
      }
    : { direction: '的中なし', count: 0 };

  const missTrend = 外れ集まり
    ? {
        direction: 矢所の方位(外れ集まり.x, 外れ集まり.y),
        count: missCount,
        centerX: Number(外れ集まり.x.toFixed(2)),
        centerY: Number(外れ集まり.y.toFixed(2)),
        radius: Number(外れ集まり.半径.toFixed(2)),
      }
    : { direction: 'なし（すべて的中）', count: 0 };

  let 右上 = 0,
    右下 = 0,
    左上 = 0,
    左下 = 0;
  for (const p of 点たち) {
    if (p.x >= 0 && p.y <= 0) 右上++;
    else if (p.x >= 0 && p.y > 0) 右下++;
    else if (p.x < 0 && p.y <= 0) 左上++;
    else 左下++;
  }

  let summaryText = `${人.name}さんの矢所傾向（計${arrowCount}射、的中${hitCount}・外れ${missCount}、的中率${hitRate}）：\n`;
  summaryText += `・全体の矢所：中心は【${overallTrend.direction}】、${overallTrend.grouping}。\n`;
  if (missCount > 0) {
    summaryText += `・外れ矢（${missCount}本）：【${missTrend.direction}】に抜ける傾向があります。\n`;
  } else {
    summaryText += `・外れ矢：外れ矢はありません（皆中）。\n`;
  }
  if (hitCount > 0) {
    const 方位 = hitTrend.direction;
    const 付近文 = 方位.includes('付近') ? `中心は【${方位}】です。` : `中心は【${方位}】付近です。`;
    summaryText += `・的中矢（${hitCount}本）：${付近文}\n`;
  }

  return {
    name: 人.name,
    // 図（src/chatFigures.js の 矢所）のための点。模型には渡さない（_ で始まる項目は 図の分を外す で外す）
    _点たち: 点たち.map((点) => ({ x: 点.x, y: 点.y, 印: 点.印, targetType: 点.targetType })),
    arrowCount,
    hitCount,
    missCount,
    hitRate,
    overallTrend,
    hitTrend,
    missTrend,
    quadrants: { 右上, 右下, 左上, 左下 },
    summaryText,
  };
}

module.exports = {
  矢所の成績,
  全員の成績,
  二つの期間で比べる,
  比べる期間を決める,
  射の前後で比べる,
  弓具の前後,
  記録の的中,
  人を絞る,
  出欠の集計,
  出欠を月ごとに,
  記録をさがす,
  タグで絞る,
  題で絞る,
  チームごとの的中,
  記録の要約,
  端末の日付,
  参加回数を数える,
  射位ごとの成績,
  一人の成績,
  名前で選ぶ,
  期間にする,
  日付の始まり,
  日付の終わり,
  その射を引いた人,
  その人の射か,
};
