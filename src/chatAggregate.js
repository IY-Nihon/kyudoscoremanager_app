/**
 * AI チャットの「万能の集計」（aggregateStats）と「名簿の問い合わせ」（listMembers）。
 *
 * 専用の道具（全員の成績・2 つの期間の比べ・射位など）は、問いの形ごとに 1 つずつ作ってきた。
 * 形の合わない問い（「月ごとの部の的中率の推移」「曜日ごと」「何射目が一番当たるか」「1年生の月ごと」
 * 「月ごとの落差が激しい人」など）は、道具が無くて断るか、模型が記録を読んで数え違えていた。
 * ここでは、絞り込み（期間・人・性別・学年・何射目・射位・曜日）と切り口（最大 2 つ）を模型が組み合わせ、
 * 数えるのと並べるのは端末で済ませる。2026-10-25 に足した。
 *
 * 数え方は全員の成績（src/chatStats.js）と同じ：「集計に含めない」の記録を外し、途中交代は交代した人の側、
 * 部員に結び付かない射（ゲスト・相手校）は数えない。
 * 画面にも Firebase にも触れないので、node --test で確かめられる（test/chatAggregate.test.js）。
 */
'use strict';

const 集 = require('./statsRules');
const 学 = require('./gakunen');
const 区 = require('./kubun');
const { 射位の名前 } = require('./a11yLabels');
const { 射位を割り振る } = require('./teamGrouping');

/** 的中率（百分率・小数 1 桁）。射数が 0 なら null */
const 率 = (的中, 射数) => (射数 > 0 ? Number(((的中 / 射数) * 100).toFixed(1)) : null);

const 曜日の名 = ['日', '月', '火', '水', '木', '金', '土'];
const 二桁 = (数) => String(数).padStart(2, '0');
const 日の文字 = (日付) => `${日付.getFullYear()}-${二桁(日付.getMonth() + 1)}-${二桁(日付.getDate())}`;

/** 使える切り口。時や順のあるもの（順のある）は、既定でその順に並べる */
const 切り口たち = [
  '人',
  '月',
  '週',
  '日',
  '曜日',
  '記録',
  '射目',
  '立目',
  '射位',
  'タグ',
  '学年',
  '性別',
  '区分',
];
const 順のある = new Set(['月', '週', '日', '曜日', '記録', '射目', '立目', '射位', '学年']);

/** 性別を '男子' / '女子' / '未設定' にそろえる（名簿は '男子'、古い控えや引数は 'male' もある） */
function 性別の名(値) {
  const 文 = String(値 || '');
  return /男|^male$/i.test(文) ? '男子' : /女|^female$/i.test(文) ? '女子' : '未設定';
}

/** 射位の並び順（大前が先、落が最後） */
function 射位の順(名) {
  if (名 === '大前') return 0;
  if (名 === '落') return 99;
  const 数 = Number(String(名).replace(/[^0-9]/g, ''));
  return Number.isFinite(数) ? 数 : 50;
}

/** 空白を落とす（名前の突き合わせだけに使う） */
const 詰める = (文) => String(文 || '').replace(/\s/g, '');

/**
 * 名前の並びから部員を選ぶ。同じ名前→含む・含まれるの順で、1 人に決まったものだけ選ぶ
 * @returns {{選んだ: Set<object>, 見つからない: string[], 迷った: Array<{名前:string, 候補:string[]}>}}
 */
function 名前で何人も選ぶ(人たち, 名前たち) {
  const 選んだ = new Set();
  const 見つからない = [];
  const 迷った = [];
  for (const 名前 of 名前たち) {
    const 求める = 詰める(名前);
    if (!求める) continue;
    const 同じ = 人たち.filter((人) => 詰める(人.name) === 求める);
    const 似た = 同じ.length
      ? 同じ
      : 人たち.filter((人) => {
          const 名 = 詰める(人.name);
          return 名.includes(求める) || (名.length >= 2 && 求める.includes(名));
        });
    if (似た.length === 1) 選んだ.add(似た[0]);
    else if (似た.length > 1) 迷った.push({ 名前, 候補: 似た.map((人) => 人.name) });
    else 見つからない.push(名前);
  }
  return { 選んだ, 見つからない, 迷った };
}

/** 1 つのまとまり（箱）。射を数え、どの記録・誰から来たかを覚える */
function 箱を作る(鍵, 順) {
  return { 鍵, 順, 的中: 0, 射数: 0, 皆中: 0, 記録: new Set(), 人: new Set() };
}

/** 箱を返す形に。人数は人の切り口でないときだけ */
function 箱の中身(箱, 切り口, 皆中を出す) {
  return {
    [切り口]: 箱.鍵,
    的中: 箱.的中,
    射数: 箱.射数,
    的中率: 率(箱.的中, 箱.射数),
    記録の数: 箱.記録.size,
    ...(皆中を出す ? { 皆中: 箱.皆中 } : {}),
    ...(切り口 !== '人' ? { 人数: 箱.人.size } : {}),
  };
}

/**
 * 記録を絞り、切り口ごとにまとめて的中を数える。
 *
 * @param {Array<object>} 人たち 部員
 * @param {Array<object>} 記録たち 期間・タグ・題で絞ったあとの記録（ここでは「集計に含めない」だけ外す）
 * @param {{切り口?: string[], 期間?: {始め?: number, 終わり?: number}, 性別?: string, 学年?: any,
 *   名前たち?: string[], 射目?: {から?: number, まで?: number}, 射位たち?: string[], 曜日たち?: string[],
 *   並び?: string, 向き?: string, 最小射数?: number, 件数?: number, 区分たち?: Array<object>}} [注文]
 */
function 集計する(人たち, 記録たち, 注文) {
  const 設定 = 注文 || {};
  const 切り口 = (Array.isArray(設定.切り口) ? 設定.切り口 : [])
    .map((x) => String(x || '').trim())
    .filter((x) => 切り口たち.includes(x))
    .slice(0, 2);
  const 知らない切り口 = (Array.isArray(設定.切り口) ? 設定.切り口 : []).filter(
    (x) => !切り口たち.includes(x)
  );
  if (!切り口.length) {
    return {
      error: `切り口（groupBy）を 1 つか 2 つ渡してください。使えるのは ${切り口たち.join('・')} です。`,
      ...(知らない切り口.length ? { 使えない切り口: 知らない切り口 } : {}),
    };
  }

  // 人を絞る（性別・学年・名前）
  const 部員 = (Array.isArray(人たち) ? 人たち : []).filter((人) => 人 && 人.id);
  const 性別で = 設定.性別 ? 性別の名(設定.性別) : null;
  const 学年で =
    設定.学年 == null || 設定.学年 === '' ? null : Number(String(設定.学年).replace(/[^0-9]/g, ''));
  const 名前で =
    Array.isArray(設定.名前たち) && 設定.名前たち.length ? 名前で何人も選ぶ(部員, 設定.名前たち) : null;
  const 数える人 = 部員.filter(
    (人) =>
      (!性別で || 性別の名(人.gender) === 性別で) &&
      (学年で == null || !Number.isFinite(学年で) || Number(人.grade) === 学年で) &&
      (!名前で || 名前で.選んだ.has(人))
  );
  const idから = new Map(数える人.map((人) => [String(人.id), 人]));

  const 始め = (設定.期間 && 設定.期間.始め) || 0;
  const 終わり = (設定.期間 && 設定.期間.終わり) || Infinity;
  const 対象 = (Array.isArray(記録たち) ? 記録たち : []).filter(
    (記録) => 記録 && 集.集計に入れるか(記録) && (記録.date || 0) >= 始め && (記録.date || 0) <= 終わり
  );
  const 射目から = Math.max(1, Math.floor(Number(設定.射目 && 設定.射目.から) || 1));
  const 射目まで = Math.max(射目から, Math.floor(Number(設定.射目 && 設定.射目.まで) || Infinity));
  const 射位で =
    Array.isArray(設定.射位たち) && 設定.射位たち.length ? new Set(設定.射位たち.map(String)) : null;
  const 曜日で =
    Array.isArray(設定.曜日たち) && 設定.曜日たち.length
      ? new Set(設定.曜日たち.map((x) => String(x).replace(/曜日?$/, '')))
      : null;
  const 区分の一覧 = 区.区分たち(設定.区分たち);
  // 皆中は 1 立（4 射）がまとまる切り口だけ（何射目で分けると、1 立が 4 つの箱に割れる）
  const 皆中を出す = !切り口.includes('射目');

  /** その射の、切り口ごとの鍵と並び順 */
  const 鍵を作る = (名, 場) => {
    const 日付 = new Date(場.記録.date || 0);
    switch (名) {
      case '人':
        return [場.人.name || '', 0];
      case '月':
        return [
          `${日付.getFullYear()}-${二桁(日付.getMonth() + 1)}`,
          日付.getFullYear() * 100 + 日付.getMonth(),
        ];
      case '週': {
        // 月曜はじまりの週。鍵はその週の月曜の日付
        const 月曜 = new Date(
          日付.getFullYear(),
          日付.getMonth(),
          日付.getDate() - ((日付.getDay() + 6) % 7)
        );
        return [`${日の文字(月曜)}の週`, 月曜.getTime()];
      }
      case '日':
        return [日の文字(日付), new Date(日付.getFullYear(), 日付.getMonth(), 日付.getDate()).getTime()];
      case '曜日':
        return [曜日の名[日付.getDay()], 日付.getDay()];
      case '記録':
        return [`${日の文字(日付)} ${場.記録.title || '無題'}`, (場.記録.date || 0) + 場.記録順 / 1e6];
      case '射目':
        return [`${場.射目 + 1}射目`, 場.射目];
      case '立目':
        return [`${Math.floor(場.射目 / 4) + 1}立目`, Math.floor(場.射目 / 4)];
      case '射位':
        return [場.射位, 射位の順(場.射位)];
      case 'タグ':
        return [場.タグ, 0];
      case '学年':
        return [学.学年の名前(場.人), Number(場.人.grade) || 0];
      case '性別':
        return [性別の名(場.人.gender), 0];
      case '区分':
        return [区.人の区分の名前(場.人, 区分の一覧) || '区分なし', 0];
      default:
        return ['', 0];
    }
  };

  // 箱：1 つ目の切り口 → { 箱, 内訳: 2 つ目の切り口 → 箱 }
  const 上の箱 = new Map();
  const 全体 = 箱を作る('全体', 0);
  const 入れる = (場, 印, 皆中か) => {
    const タグたち =
      切り口.includes('タグ') && Array.isArray(場.記録.tags) && 場.記録.tags.length
        ? 場.記録.tags.map((タグ) => String(タグ).replace(/^#/, ''))
        : ['タグなし'];
    // タグの切り口では、タグの数だけ同じ射を入れる（1 つの記録に 2 つのタグなら両方に）
    for (const タグ of 切り口.includes('タグ') ? タグたち : ['']) {
      const 一 = 鍵を作る(切り口[0], { ...場, タグ });
      if (!上の箱.has(一[0])) 上の箱.set(一[0], { 箱: 箱を作る(一[0], 一[1]), 内訳: new Map() });
      const 上 = 上の箱.get(一[0]);
      const 箱たち = [上.箱];
      if (切り口[1]) {
        const 二 = 鍵を作る(切り口[1], { ...場, タグ });
        if (!上.内訳.has(二[0])) 上.内訳.set(二[0], 箱を作る(二[0], 二[1]));
        箱たち.push(上.内訳.get(二[0]));
      }
      for (const 箱 of 箱たち) {
        if (印 !== null) {
          箱.射数 += 1;
          if (印 === '○') 箱.的中 += 1;
        }
        if (皆中か) 箱.皆中 += 1;
        箱.記録.add(場.記録);
        箱.人.add(場.人);
      }
    }
    if (印 !== null) {
      全体.射数 += 1;
      if (印 === '○') 全体.的中 += 1;
    }
    if (皆中か) 全体.皆中 += 1;
    全体.記録.add(場.記録);
    全体.人.add(場.人);
  };

  対象.forEach((記録, 記録順) => {
    const 日付 = new Date(記録.date || 0);
    if (曜日で && !曜日で.has(曜日の名[日付.getDay()])) return;
    const 並び = Array.isArray(記録.archers) ? 記録.archers : [];
    const 射位たち = 射位を割り振る(並び);
    並び.forEach((射手, 位置) => {
      if (!射手 || !Array.isArray(射手.marks) || !射位たち[位置]) return; // 区切り・計
      const 射位 = 射位の名前(射位たち[位置].番, 射位たち[位置].人数);
      if (射位で && !射位で.has(射位)) return;
      const 引いた人を見る = (射目) => {
        const id = 集.その射の部員id(射手, 射目);
        return id !== undefined && id !== null ? idから.get(String(id)) : undefined;
      };
      射手.marks.forEach((印, 射目) => {
        if (!集.引いた射か(印)) return;
        if (射目 + 1 < 射目から || 射目 + 1 > 射目まで) return;
        const 人 = 引いた人を見る(射目);
        if (!人) return;
        入れる({ 記録, 記録順, 人, 射目, 射位 }, 印, false);
      });
      // 皆中：1 立（4 射）を同じ人が引いて 4 つとも ○。射目の範囲に 1 立が丸ごと入るときだけ
      if (!皆中を出す) return;
      for (let 頭 = 0; 頭 + 3 < 射手.marks.length; 頭 += 4) {
        if (頭 + 1 < 射目から || 頭 + 4 > 射目まで) continue;
        const 四つ = [0, 1, 2, 3].map((k) => 射手.marks[頭 + k]);
        if (!四つ.every((印) => 印 === '○')) continue;
        const 人 = 引いた人を見る(頭);
        if (!人 || [1, 2, 3].some((k) => 引いた人を見る(頭 + k) !== 人)) continue;
        入れる({ 記録, 記録順, 人, 射目: 頭, 射位 }, null, true);
      }
    });
  });

  // 並べる
  const 最小射数 = Number.isFinite(設定.最小射数) && 設定.最小射数 > 0 ? 設定.最小射数 : 1;
  const 一つ目 = 切り口[0];
  const 既定の並び = 順のある.has(一つ目) ? 'キー' : '的中率';
  const 並び = ['キー', '的中率', '的中数', '射数', '皆中', '記録の数', '振れ幅'].includes(設定.並び)
    ? 設定.並び
    : 既定の並び;
  const 振れ幅で = 並び === '振れ幅' && 切り口.length === 2;
  const 向き = 設定.向き === '低い順' || (設定.向き == null && 並び === 'キー') ? '低い順' : '高い順';
  // 振れ幅（2 つ目の切り口の中で、的中率がいちばん高い所と低い所の差）は、射数が足りる所だけで見る
  const 内訳の最小射数 = Math.max(最小射数, 8);

  const 行たち = [...上の箱.values()]
    .filter((上) => 上.箱.射数 >= 最小射数)
    .map((上) => {
      const 行 = /** @type {any} */ (箱の中身(上.箱, 一つ目, 皆中を出す));
      if (切り口[1]) {
        const 内訳 = [...上.内訳.values()].sort(
          (甲, 乙) => 甲.順 - 乙.順 || String(甲.鍵).localeCompare(String(乙.鍵), 'ja')
        );
        行.内訳 = 内訳.slice(0, 40).map((箱) => 箱の中身(箱, 切り口[1], 皆中を出す));
        if (内訳.length > 40) 行.内訳を返していない数 = 内訳.length - 40;
        const 足りる = 内訳.filter((箱) => 箱.射数 >= 内訳の最小射数);
        if (足りる.length >= 2) {
          const 率たち = 足りる.map((箱) => ({ 鍵: 箱.鍵, 率: 率(箱.的中, 箱.射数) }));
          const 高 = 率たち.reduce((甲, 乙) => (乙.率 > 甲.率 ? 乙 : 甲));
          const 低 = 率たち.reduce((甲, 乙) => (乙.率 < 甲.率 ? 乙 : 甲));
          行.いちばん高い = { [切り口[1]]: 高.鍵, 的中率: 高.率 };
          行.いちばん低い = { [切り口[1]]: 低.鍵, 的中率: 低.率 };
          行.振れ幅 = Number((高.率 - 低.率).toFixed(1));
        } else {
          行.振れ幅 = null;
        }
      }
      行._順 = 上.箱.順;
      return 行;
    });

  const 値 = (行) => {
    if (並び === '振れ幅') return 行.振れ幅;
    if (並び === '的中数') return 行.的中;
    if (並び === 'キー') return 行._順;
    return 行[並び];
  };
  const 並べる行 = 振れ幅で ? 行たち.filter((行) => 行.振れ幅 != null) : 行たち;
  並べる行.sort((甲, 乙) => {
    const 差 = 向き === '低い順' ? 値(甲) - 値(乙) : 値(乙) - 値(甲);
    if (差) return 差;
    if (並び === 'キー') return String(甲[一つ目]).localeCompare(String(乙[一つ目]), 'ja');
    return 乙.射数 - 甲.射数;
  });
  const 上限 = Math.min(Number.isFinite(設定.件数) && 設定.件数 > 0 ? 設定.件数 : 切り口[1] ? 30 : 100, 100);
  const 一覧 = 並べる行.slice(0, 上限).map((行, 番) => {
    const { _順, ...残り } = 行;
    return 並び === 'キー' ? 残り : { 順位: 番 + 1, ...残り };
  });

  return {
    切り口,
    並び: 並び === 'キー' ? `${一つ目}の順` : `${並び}の${向き}`,
    数えた記録: 全体.記録.size,
    全体: 箱の中身(全体, '全体', 皆中を出す),
    条件: {
      ...(設定.期間 && (設定.期間.始め || Number.isFinite(設定.期間.終わり))
        ? {
            期間: {
              始め: 設定.期間.始め ? 日の文字(new Date(設定.期間.始め)) : null,
              終わり: Number.isFinite(設定.期間.終わり) ? 日の文字(new Date(設定.期間.終わり)) : null,
            },
          }
        : {}),
      ...(性別で ? { 性別: 性別で } : {}),
      ...(学年で != null && Number.isFinite(学年で) ? { 学年: 学年で } : {}),
      ...(名前で ? { 人: [...名前で.選んだ].map((人) => 人.name) } : {}),
      ...(射目から > 1 || Number.isFinite(射目まで)
        ? { 射目: `${射目から}〜${Number.isFinite(射目まで) ? 射目まで : ''}射目` }
        : {}),
      ...(射位で ? { 射位: [...射位で] } : {}),
      ...(曜日で ? { 曜日: [...曜日で] } : {}),
      ...(最小射数 > 1 ? { 最小射数 } : {}),
    },
    ...(名前で && 名前で.見つからない.length ? { 見つからない名前: 名前で.見つからない } : {}),
    ...(名前で && 名前で.迷った.length ? { 同じ名前が複数: 名前で.迷った } : {}),
    ...(知らない切り口.length ? { 使えない切り口: 知らない切り口 } : {}),
    ...(振れ幅で ? { 振れ幅を出せず外した数: 行たち.length - 並べる行.length } : {}),
    まとまりの数: 並べる行.length,
    ...(並べる行.length > 一覧.length ? { 返していない数: 並べる行.length - 一覧.length } : {}),
    一覧,
  };
}

/**
 * 名簿を数える・並べる。「1年生は何人？」「女子は誰？」「期ごとの人数」に答えるための道具。
 * 指示文の部員一覧（名前と学年）を模型が数えると数え違えるので、ここで数える
 * @param {Array<object>} 人たち 部員（在籍）
 * @param {{性別?: string, 学年?: any, 区分?: string, 名前に?: string, 期を出す?: boolean,
 *   区分たち?: Array<object>, 卒業生?: Array<object>, 卒業生も?: boolean}} [注文]
 */
function 名簿を数える(人たち, 注文) {
  const 設定 = 注文 || {};
  const 区分の一覧 = 区.区分たち(設定.区分たち);
  const 性別で = 設定.性別 ? 性別の名(設定.性別) : null;
  const 学年で =
    設定.学年 == null || 設定.学年 === '' ? null : Number(String(設定.学年).replace(/[^0-9]/g, ''));
  const 区分で = 設定.区分 ? 詰める(設定.区分) : null;
  const 名前で = 設定.名前に ? 詰める(設定.名前に) : null;
  const 選ぶ = (人) =>
    人 &&
    (!性別で || 性別の名(人.gender) === 性別で) &&
    (学年で == null || !Number.isFinite(学年で) || Number(人.grade) === 学年で) &&
    (!区分で || 詰める(区.人の区分の名前(人, 区分の一覧)).includes(区分で)) &&
    (!名前で || 詰める(人.name).includes(名前で));
  const 選んだ = (Array.isArray(人たち) ? 人たち : []).filter(選ぶ);
  const 数える = (鍵) => {
    const 数 = {};
    for (const 人 of 選んだ) 数[鍵(人)] = (数[鍵(人)] || 0) + 1;
    return 数;
  };
  const 並び = [...選んだ].sort(
    (甲, 乙) =>
      (Number(甲.grade) || 99) - (Number(乙.grade) || 99) ||
      String(甲.name).localeCompare(String(乙.name), 'ja')
  );
  const 上限 = 200;
  const 卒業生 = 設定.卒業生も
    ? (Array.isArray(設定.卒業生) ? 設定.卒業生 : []).filter((人) => 人 && 人.name)
    : null;
  return {
    人数: 選んだ.length,
    学年ごと: 数える((人) => 学.学年の名前(人)),
    性別ごと: 数える((人) => 性別の名(人.gender)),
    ...(区分の一覧.length
      ? { 区分ごと: 数える((人) => 区.人の区分の名前(人, 区分の一覧) || '区分なし') }
      : {}),
    ...(設定.期を出す ? { 期ごと: 数える((人) => (人.termKi ? `${人.termKi}期` : '期なし')) } : {}),
    一覧: 並び.slice(0, 上限).map((人) => ({
      名前: 人.name,
      学年: 学.学年の名前(人),
      性別: 性別の名(人.gender),
      ...(設定.期を出す && 人.termKi ? { 期: `${人.termKi}期` } : {}),
      ...(区分の一覧.length ? { 区分: 区.人の区分の名前(人, 区分の一覧) || '区分なし' } : {}),
    })),
    ...(並び.length > 上限 ? { 返していない数: 並び.length - 上限 } : {}),
    ...(卒業生 ? { 卒業生の人数: 卒業生.length, 卒業生: 卒業生.slice(0, 上限).map((人) => 人.name) } : {}),
  };
}

module.exports = { 集計する, 名簿を数える, 切り口たち };
