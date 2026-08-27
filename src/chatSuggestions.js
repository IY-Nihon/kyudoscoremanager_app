/**
 * チャットボットの質問例と、打ちかけの言葉から出す候補。
 *
 * 画面にも Firebase にも触れない純粋な関数なので、node --test で
 * 手元だけで確かめられる（test/chatSuggestions.test.js）。
 *
 * 「何でも聞いてください」とだけ出しても、何を聞けるか分からない。
 * 道具で答えられることを、その団体の実際の中身（部員の名前・今月）に
 * 当てはめて見せる。答えられないことを例に出すと、
 * 一度外れただけで使われなくなるので、道具のある範囲に限る。
 */
'use strict';

const 二桁 = (n) => String(n).padStart(2, '0');

/**
 * 質問例を作る。
 *
 * @param {{人たち?: Array, 記録たち?: Array, いま?: Date}} 材料
 * @returns {Array<{分類: string, 文: string}>}
 */
function 質問例(材料) {
  const 素 = 材料 || {};
  const 人たち = Array.isArray(素.人たち) ? 素.人たち.filter((x) => x && x.name) : [];
  const 記録たち = Array.isArray(素.記録たち) ? 素.記録たち : [];
  const いま = 素.いま instanceof Date ? 素.いま : new Date();
  const 今月 = `${いま.getFullYear()}年${いま.getMonth() + 1}月`;

  // 記録がまだ無い団体に成績の質問を出しても、必ず空振りする
  const 記録あり = 記録たち.length > 0;
  const 出欠あり = 記録たち.some((r) => r && r.attendance && Object.keys(r.attendance).length > 0);
  // 名前を出す例は、いちばん最近の記録に出ている人から採る。
  // 部員一覧の先頭だと、辞めた人や名簿の並び順が出てしまう
  const 最近の人 = (() => {
    const 新しい順 = [...記録たち].sort((a, b) => (b.date || 0) - (a.date || 0));
    for (const r of 新しい順) {
      const 出ている = (Array.isArray(r.archers) ? r.archers : []).find(
        (a) => a && a.name && !a.isSeparator && !a.isTotalCalculator
      );
      if (出ている) return 出ている.name;
    }
    return 人たち.length ? 人たち[0].name : null;
  })();

  const 例 = [];
  const 足す = (分類, 文) => 例.push({ 分類, 文 });

  if (記録あり) {
    // 名前入りの例を先頭に。その部に合わせていることが一目で伝わる
    if (最近の人) 足す('成績', `${最近の人}さんの最近の調子は？`);
    足す('成績', `${今月}の的中率が高い順に3人教えて`);
    足す('成績', '団体全体の的中率はいまどれくらい？');
    足す('立ち順', '大前に向いているのは誰？');
    足す('立ち順', '落で的中率が高いのは誰？');
    足す('記録', '直近3回の練習の的中率を教えて');
    足す('記録', '先月いちばん的中が多かった日は？');
  } else {
    // まだ記録が無いときは、成績の話をしても答えられない
    足す('使い方', '記録の付け方を教えて');
    足す('使い方', '途中で人が代わったときはどうする？');
  }

  if (出欠あり) {
    足す('出欠', `${今月}いちばん練習に来ているのは誰？`);
    足す('出欠', '欠席が多いのは誰？');
  }

  足す('使い方', 'ライブ記録の使い方を教えて');
  足す('使い方', '記録表を横向きにするには？');

  // 全部出すと画面が埋まり、挨拶も見えなくなる。分類ごとに1件ずつ拾って
  // 幅を持たせ、5件までにする。続きは打ちながらの候補で出る
  if (素.件数 === Infinity) return 例; // 打ちかけの候補は全部から探す
  const 上限 = Number.isFinite(素.件数) && 素.件数 > 0 ? 素.件数 : 5;
  const 出た = [];
  const 使った = new Set();
  // まず分類ごとに1件（並びの順＝大事な順）
  for (const x of 例) {
    if (出た.length >= 上限) break;
    if (使った.has(x.分類)) continue;
    使った.add(x.分類);
    出た.push(x);
  }
  // 空きがあれば、上から順に足す
  for (const x of 例) {
    if (出た.length >= 上限) break;
    if (!出た.includes(x)) 出た.push(x);
  }
  return 出た;
}

/** 打ちかけの候補に使う、絞る前の全部 */
function 質問例のすべて(材料) {
  return 質問例(Object.assign({}, 材料, { 件数: Infinity }));
}

/**
 * 打ちかけの言葉から、続きの候補を出す。
 * 送る前に選べるので、通信も費用もかからない。
 */
function 打ちかけの候補(打った, 例たち, 上限) {
  const 語 = String(打った || '').trim().replace(/\s/g, '');
  const 全部 = Array.isArray(例たち) ? 例たち : [];
  const 数 = Number.isFinite(上限) && 上限 > 0 ? 上限 : 4;
  if (!語) return 全部.slice(0, 数);
  // 打った言葉を含むものだけ。前から一致するものを先に出す
  const 当たり = 全部.filter((x) => x.文.replace(/\s/g, '').includes(語));
  当たり.sort((a, b) => {
    const A = a.文.replace(/\s/g, '').indexOf(語);
    const B = b.文.replace(/\s/g, '').indexOf(語);
    return A - B;
  });
  return 当たり.slice(0, 数);
}

/** 分類ごとにまとめる（画面で見出しを付けるため） */
function 分類ごと(例たち) {
  const 束 = new Map();
  (Array.isArray(例たち) ? 例たち : []).forEach((x) => {
    if (!束.has(x.分類)) 束.set(x.分類, []);
    束.get(x.分類).push(x.文);
  });
  return [...束.entries()].map(([分類, 文たち]) => ({ 分類, 文たち }));
}

module.exports = { 質問例, 質問例のすべて, 打ちかけの候補, 分類ごと };
