/**
 * チャットボットに渡す成績の集計。
 *
 * 画面にも Firebase にも触れない純粋な関数なので、node --test で
 * 手元だけで確かめられる（test/chatStats.test.js）。
 *
 * 元は JP_AIChatBot_1034.js の中で集計し、「名前|率|的中/総」を
 * 部員の数だけ並べて模型に渡していた。並べ替えも絞り込みも模型任せで、
 * 168人ぶんの表から「一番良い人」を選ばせると取り違える。
 * 数えるのも並べるのもここで済ませ、模型には答えだけを渡す。
 */
'use strict';

const 集 = require('./statsRules');

/** 空白を落とす。名前で絞り込むとき（表示の突き合わせ）にだけ使う */
const 詰める = (s) => String(s || '').replace(/\s/g, '');

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
 * @param {{期間?: {始め?: number, 終わり?: number}, 並び?: string, 件数?: number, 最小射数?: number}} 注文
 */
function 全員の成績(人たち, 記録たち, 注文) {
  const 設定 = 注文 || {};
  const 始め = (設定.期間 && 設定.期間.始め) || 0;
  const 終わり = (設定.期間 && 設定.期間.終わり) || Infinity;
  // 「集計に含めない」にした記録は数えない。ここを見ていなかったため、
  // 同じことを聞いても分析画面と数字が食い違っていた
  const 対象 = (Array.isArray(記録たち) ? 記録たち : []).filter(
    (r) => r && 集.集計に入れるか(r) && (r.date || 0) >= 始め && (r.date || 0) <= 終わり
  );

  const 数え = (人) => {
    let 的中 = 0;
    let 射数 = 0;
    対象.forEach((r) => {
      (Array.isArray(r.archers) ? r.archers : []).forEach((射手) => {
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
    return {
      名前: 人.name || '',
      学年: 人.grade,
      的中,
      射数,
      的中率: 射数 > 0 ? Number(((的中 / 射数) * 100).toFixed(1)) : null,
    };
  });

  const 残す = 全部.filter((x) => x.射数 >= 最小射数);
  const 並び = 設定.並び || '的中率';
  const 比べ = {
    // 率が同じときは、たくさん引いた人を上にする。3射で100%が首位に立たない
    的中率: (a, b) => b.的中率 - a.的中率 || b.射数 - a.射数,
    的中数: (a, b) => b.的中 - a.的中 || b.射数 - a.射数,
    射数: (a, b) => b.射数 - a.射数 || b.的中 - a.的中,
    名前: (a, b) => String(a.名前).localeCompare(String(b.名前), 'ja'),
  };
  残す.sort(比べ[並び] || 比べ.的中率);
  残す.forEach((x, i) => {
    x.順位 = i + 1;
  });
  // 並べ替えに使うだけの値。模型に渡すと答えに書いてしまうので落とす
  全部.forEach((x) => delete x.素の率);

  const 全体の的中 = 全部.reduce((a, x) => a + x.的中, 0);
  const 全体の射数 = 全部.reduce((a, x) => a + x.射数, 0);
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
    (r) => r && (r.date || 0) >= 始め && (r.date || 0) <= 終わり
  );
}

const 出欠の名 = { present: '出席', late: '遅刻', early: '早退', absent: '欠席' };

/**
 * 出欠を数える。「今月いちばん来ているのは誰」に答えるための道具。
 *
 * 記録には attendance: { 部員id: 'present'|'late'|'early'|'absent' } が入る。
 * 出欠を付けずに保存した記録もあるので、その回は数に入れない
 * （全員欠席として数えると、出席率が実態より低く出る）。
 */
function 出欠の集計(人たち, 記録たち, 注文) {
  const 設定 = 注文 || {};
  const 対象 = 期間で絞る(記録たち, 設定.期間).filter(
    (r) => r.attendance && Object.keys(r.attendance).length > 0
  );

  const 全部 = (Array.isArray(人たち) ? 人たち : []).map((人) => {
    const 数 = { 出席: 0, 遅刻: 0, 早退: 0, 欠席: 0 };
    対象.forEach((r) => {
      const 印 = r.attendance[人.id];
      const 名 = 出欠の名[印];
      if (名) 数[名] += 1;
    });
    const 来た = 数.出席 + 数.遅刻 + 数.早退;
    const 数えた = 来た + 数.欠席;
    return {
      名前: 人.name || '',
      学年: 人.grade,
      出席: 数.出席,
      遅刻: 数.遅刻,
      早退: 数.早退,
      欠席: 数.欠席,
      来た回数: 来た,
      出席率: 数えた > 0 ? Number(((来た / 数えた) * 100).toFixed(1)) : null,
    };
  });

  const 残す = 全部.filter((x) => x.来た回数 + x.欠席 > 0);
  const 並び = 設定.並び || '出席率';
  const 比べ = {
    出席率: (a, b) => b.出席率 - a.出席率 || b.来た回数 - a.来た回数,
    来た回数: (a, b) => b.来た回数 - a.来た回数 || b.出席率 - a.出席率,
    欠席: (a, b) => b.欠席 - a.欠席,
    名前: (a, b) => String(a.名前).localeCompare(String(b.名前), 'ja'),
  };
  残す.sort(比べ[並び] || 比べ.出席率);
  残す.forEach((x, i) => {
    x.順位 = i + 1;
  });
  const 件数 = Number.isFinite(設定.件数) && 設定.件数 > 0 ? 設定.件数 : 残す.length;
  return {
    並び,
    出欠を付けた記録の件数: 対象.length,
    出欠が付いていない記録の件数: 期間で絞る(記録たち, 設定.期間).length - 対象.length,
    一覧: 残す.slice(0, 件数),
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
  const 当たる = (r) => {
    if (!語) return true;
    const 中身 = [r.title || '', r.note || '', (r.tags || []).join(' ')].join(' ').replace(/\s/g, '');
    if (中身.includes(語)) return true;
    return (Array.isArray(r.archers) ? r.archers : []).some((a) => {
      if (!a) return false;
      const 名 = [a.name || ''].concat(Object.values(a.substitutions || {}));
      return 名.some((n) => String(n || '').replace(/\s/g, '').includes(語));
    });
  };
  const 見つけた = 対象.filter(当たる).sort((a, b) => (b.date || 0) - (a.date || 0));
  const 件数 = Number.isFinite(設定.件数) && 設定.件数 > 0 ? 設定.件数 : 20;
  return {
    見つかった件数: 見つけた.length,
    一覧: 見つけた.slice(0, 件数).map((r) => ({
      id: r.id,
      日付: new Date(r.date || 0).toISOString().slice(0, 10),
      題: r.title || '',
      目印: r.tags || [],
      覚え書き: r.note || '',
      人数: (Array.isArray(r.archers) ? r.archers : []).filter((a) => a && !a.isSeparator && !a.isTotalCalculator).length,
    })),
  };
}

/**
 * 射位ごとの成績を出す。立ち順を考えるための材料。
 *
 * 大前は一番前、落は一番後ろ。記録表の並び順がそのまま射位なので、
 * 区切りと合計の列を除いた並びで見る。ここでは数字を出すだけで、
 * 誰をどこに置くかは決めない（決めるのは人）。
 */
function 射位ごとの成績(人たち, 記録たち, 注文) {
  const 設定 = 注文 || {};
  // 「集計に含めない」にした記録は数えない。全員の成績と揃えないと、
  // 同じ話の中で順位と射位別の射数が食い違う
  const 対象 = 期間で絞る(記録たち, 設定.期間).filter((r) => 集.集計に入れるか(r));
  const 箱 = new Map();
  const 入れる = (名前, 射位, 印) => {
    if (!箱.has(名前)) 箱.set(名前, { 名前, 全体: { 的中: 0, 射数: 0 }, 射位: {} });
    const x = 箱.get(名前);
    if (!x.射位[射位]) x.射位[射位] = { 的中: 0, 射数: 0 };
    x.全体.射数 += 1;
    x.射位[射位].射数 += 1;
    if ('○' === 印) {
      x.全体.的中 += 1;
      x.射位[射位].的中 += 1;
    }
  };

  対象.forEach((r) => {
    const 並び = (Array.isArray(r.archers) ? r.archers : []).filter(
      (a) => a && !a.isSeparator && !a.isTotalCalculator
    );
    並び.forEach((射手, 番) => {
      const 射位 = 番 === 0 ? '大前' : 番 === 並び.length - 1 && 並び.length > 1 ? '落' : `${番 + 1}番`;
      (Array.isArray(射手.marks) ? 射手.marks : []).forEach((印, 射目) => {
        if ('○' !== 印 && '×' !== 印) return;
        入れる(その射を引いた人(射手, 射目).名前 || 射手.name || '', 射位, 印);
      });
    });
  });

  const 率 = (x) => (x.射数 > 0 ? Number(((x.的中 / x.射数) * 100).toFixed(1)) : null);
  const 最小射数 = Number.isFinite(設定.最小射数) ? 設定.最小射数 : 1;
  const 名前で絞る = Array.isArray(設定.名前たち) && 設定.名前たち.length ? 設定.名前たち.map(詰める) : null;

  return {
    一覧: [...箱.values()]
      .filter((x) => x.全体.射数 >= 最小射数)
      .filter((x) => !名前で絞る || 名前で絞る.includes(詰める(x.名前)))
      .sort((a, b) => 率(b.全体) - 率(a.全体))
      .map((x) => ({
        名前: x.名前,
        全体の的中率: 率(x.全体),
        全体の射数: x.全体.射数,
        射位ごと: Object.keys(x.射位)
          .sort()
          .map((射位) => ({
            射位,
            的中率: 率(x.射位[射位]),
            的中: x.射位[射位].的中,
            射数: x.射位[射位].射数,
          })),
      })),
  };
}


module.exports = {
  全員の成績,
  出欠の集計,
  記録をさがす,
  射位ごとの成績,
  その射を引いた人,
  その人の射か,
};
