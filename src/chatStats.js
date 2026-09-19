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
const { 日付の文字, 練習日で数える } = require('./attendanceRules');
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

/** その人の1射かどうか。部員IDだけで判定する */
function その人の射か(人, 引いた人) {
  return !!(人 && 人.id && 引いた人 && 引いた人.id !== undefined && String(引いた人.id) === String(人.id));
}

/**
 * 全員の成績を数え、並べ替えて返す。
 *
 * @param {Array} 人たち   部員
 * @param {Array} 記録たち セッション
 * @param {{期間?: {始め?: number, 終わり?: number}, 並び?: string, 件数?: number, 最小射数?: number}} [注文]
 * @returns {{並び:string, 人数:number, 数えた記録:number, 射数が足りず外した人数:number,
 *   全体:{的中:number, 射数:number, 的中率:number|null},
 *   一覧:Array<{名前:string, 学年:any, 的中:number, 射数:number, 的中率:number|null, 順位?:number}>}}
 */
function 全員の成績(人たち, 記録たち, 注文) {
  const 設定 = 注文 || {};
  const 始め = (設定.期間 && 設定.期間.始め) || 0;
  const 終わり = (設定.期間 && 設定.期間.終わり) || Infinity;
  // 「集計に含めない」にした記録は数えない。ここを見ていなかったため、
  // 同じことを聞いても分析画面と数字が食い違っていた
  const 対象 = (Array.isArray(記録たち) ? 記録たち : []).filter(
    (記録) => 記録 && 集.集計に入れるか(記録) && (記録.date || 0) >= 始め && (記録.date || 0) <= 終わり
  );

  const 数え = (人) => {
    let 的中 = 0;
    let 射数 = 0;
    対象.forEach((記録) => {
      (Array.isArray(記録.archers) ? 記録.archers : []).forEach((射手) => {
        if (!射手 || !Array.isArray(射手.marks)) return;
        射手.marks.forEach((印, 射目) => {
          if (!集.引いた射か(印)) return;
          if (!その人の射か(人, その射を引いた人(射手, 射目))) return;
          射数 += 1;
          if ('○' === 印) 的中 += 1;
        });
      });
    });
    return { 的中, 射数 };
  };

  const 最小射数 = Number.isFinite(設定.最小射数) ? 設定.最小射数 : 1;
  const 全部 = (Array.isArray(人たち) ? 人たち : []).map((人) => {
    const { 的中, 射数 } = 数え(人);
    // 順位は並べ替えたあとで足す（下の 残す.forEach）。型にも書いておかないと、
    // 足すところで「そんな項目は無い」と怒られる
    return /** @type {{名前:string, 学年:any, 的中:number, 射数:number, 的中率:number|null, 順位?:number}} */ ({
      名前: 人.name || '',
      学年: 人.grade,
      的中,
      射数,
      的中率: 射数 > 0 ? Number(((的中 / 射数) * 100).toFixed(1)) : null,
    });
  });

  const 残す = 全部.filter((人) => 人.射数 >= 最小射数);
  const 並び = 設定.並び || '的中率';
  const 比べ = {
    // 率が同じときは、たくさん引いた人を上にする。3射で100%が首位に立たない
    的中率: (甲, 乙) => 乙.的中率 - 甲.的中率 || 乙.射数 - 甲.射数,
    的中数: (甲, 乙) => 乙.的中 - 甲.的中 || 乙.射数 - 甲.射数,
    射数: (甲, 乙) => 乙.射数 - 甲.射数 || 乙.的中 - 甲.的中,
    名前: (甲, 乙) => String(甲.名前).localeCompare(String(乙.名前), 'ja'),
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
    射数が足りず外した人数: 全部.length - 残す.length,
    全体: {
      的中: 全体の的中,
      射数: 全体の射数,
      的中率: 全体の射数 > 0 ? Number(((全体の的中 / 全体の射数) * 100).toFixed(1)) : null,
    },
    一覧: 残す.slice(0, 件数),
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
 * 練習日が無いとき（個人モード・練習日を登録していない団体）は前のまま、記録の出欠の印を数える。
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

  /** @type {Array<{名前:string, 学年:any, 出席:number, 遅刻:number, 早退:number, 欠席:number, 来た回数:number, 練習日数?:number, 出席率:number|null, 順位?:number}>} */
  const 全部 = 練習日で
    ? 練習日で数える(人たち, 記録たち, 練習日, { 今日: 設定.今日 }).map(
        ({ 部員, 出席, 遅刻, 早退, 欠席, 来た回数, 練習日数, 出席率 }) => ({
          名前: 部員.name || '',
          学年: 部員.grade,
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
  const 残す = 全部.filter((人) => (練習日で && (Number(人.学年) || 0) < 5) || 人.来た回数 + 人.欠席 > 0);
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
    一覧: 残す.slice(0, 件数),
  };
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
    return /** @type {{名前:string, 学年:any, 出席:number, 遅刻:number, 早退:number, 欠席:number, 来た回数:number, 出席率:number|null, 順位?:number}} */ ({
      名前: 人.name || '',
      学年: 人.grade,
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
  const 箱 = new Map();
  const 入れる = (名前, 射位, 印) => {
    if (!箱.has(名前)) 箱.set(名前, { 名前, 全体: { 的中: 0, 射数: 0 }, 射位: {} });
    const 人 = 箱.get(名前);
    if (!人.射位[射位]) 人.射位[射位] = { 的中: 0, 射数: 0 };
    人.全体.射数 += 1;
    人.射位[射位].射数 += 1;
    if ('○' === 印) {
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
        if ('○' !== 印 && '×' !== 印) return;
        入れる(その射を引いた人(射手, 射目).名前 || 射手.name || '', 射位, 印);
      });
    });
  });

  const 率 = (成績) => (成績.射数 > 0 ? Number(((成績.的中 / 成績.射数) * 100).toFixed(1)) : null);
  const 最小射数 = Number.isFinite(設定.最小射数) ? 設定.最小射数 : 1;
  // 模型は「永井」のように短く渡す。記録の名前は「†永井 優郷†」のように長いので、含む・含まれるで見る
  const 名前で絞る =
    Array.isArray(設定.名前たち) && 設定.名前たち.length ? 設定.名前たち.map(詰める).filter(Boolean) : null;
  const 名前が当たる = (名前) => {
    const 名 = 詰める(名前);
    return 名前で絞る.some((求める) => 名 === 求める || 名.includes(求める) || 求める.includes(名));
  };

  return {
    一覧: [...箱.values()]
      .filter((人) => 人.全体.射数 >= 最小射数)
      .filter((人) => !名前で絞る || 名前が当たる(人.名前))
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
  if (!人) {
    if (候補.length > 1) {
      return {
        error: `「${名前}」に当てはまる部員が ${候補.length} 人います：${候補.map((x) => x.name).join('、')}。どの人か聞き返してください。`,
        候補: 候補.map((x) => x.name),
      };
    }
    // 名簿に無い名前（ゲストなど）は、記録に名前が出ていても成績を出せない。0 を並べるより、その旨を返す
    const 求める = 詰める(名前);
    const 記録に出ている = 使える記録.some((記録) =>
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
    let 射位 = '';
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
        if (!出た) 射位 = 射位の名前(番, 人数);
        出た = true;
        const 位置 = 射目 % 4;
        射ごと[位置].射数++;
        全体.射数++;
        この記録.射数++;
        印の並び += 印;
        if (大前か) 大前.射数++;
        if (落か) 落.射数++;
        if ('○' === 印) {
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
        position: 射位,
        marks: 印の並び,
        result: `${この記録.的中}/${この記録.射数}`,
      });
    }
  }
  const 率 = (x) => (x.射数 > 0 ? ((x.的中 / x.射数) * 100).toFixed(1) + '%' : 'データなし');
  return {
    name: 人.name,
    期間: 期間 && (期間.始め || (期間.終わり && 期間.終わり !== Infinity)) ? '指定の期間だけ' : '全期間',
    totalSessions: 出た記録,
    totalHitRate: 率(全体),
    totalArrows: 全体.射数,
    recentHitRate: 率(直近),
    // 皆中は分析画面と同じ決まりで数える
    kaichuCount: 集.成績を数える(使える記録, 部員id).patterns.kaichu,
    firstShotHitRate: 率(射ごと[0]),
    secondShotHitRate: 率(射ごと[1]),
    thirdShotHitRate: 率(射ごと[2]),
    fourthShotHitRate: 率(射ごと[3]),
    omaeHitRate: 率(大前),
    ochiHitRate: 率(落),
    recentSessionsDetail: 直近の記録,
  };
}

module.exports = {
  全員の成績,
  出欠の集計,
  記録をさがす,
  射位ごとの成績,
  一人の成績,
  名前で選ぶ,
  期間にする,
  日付の始まり,
  日付の終わり,
  その射を引いた人,
  その人の射か,
};
