/**
 * Module ID: statsRules
 *
 * 「その1射は誰のものか」の決まり。成績の集計はすべてここを通す。
 *
 * 以前は分析画面の順位・的中率推移のグラフ・矢所の傾向・チャットボットで
 * 判定が4通りに分かれていた。同じ人について順位とグラフと点の数が食い違い、
 * ひとつの射が2人に数えられることもあった。
 *
 * 決まりは「部員IDだけで判定する」。氏名では拾わない。
 * 名簿から選んで立てた射手には必ず部員IDが付くので、通常の記録は
 * すべてこれで数えられる。氏名でしか特定できない射（ゲスト、名簿に無い
 * 名前で入れたもの）は、誰の成績にも入らない。
 *
 * 氏名で拾わない理由は、同姓同名や異体字（渡邊／渡辺）で別人を同一視する
 * 危険があるため。2026-08-28 に本番を数えたところ、○×の入った 49,527 射のうち
 * 部員IDが無いのは 6.01% で、その 99.2% は名簿に居ないゲストだった。
 * 氏名で拾えるのは 24 射（2人ぶん）だけで、外しても的中率は 0.1 ポイントしか
 * 動かない（scripts/audit-name-matching.mjs で数え直せる）。
 *
 * 画面にも Firebase にも触れない純粋な関数なので、そのまま検査できる
 * （test/statsRules.test.js）。
 */
'use strict';

/**
 * 途中交代を踏まえて、その1射を引いた人の部員IDを返す。
 *
 * 交代は archer.substitutionIds に「射の添字（0始まり） → 部員ID」で入る。
 * その射以下でいちばん後ろの交代が効く。交代相手がゲストのときは
 * 部員IDが無いので undefined を返す。
 *
 * @param {object} 射手 その立ちの1人ぶん（archers の要素）
 * @param {number} 射目 0始まりの射の添字
 * @returns {string|undefined}
 */
function その射の部員id(射手, 射目) {
  if (!射手) return undefined;
  let id = 射手.memberId;
  const 交代 = 射手.substitutions;
  const 交代のid = 射手.substitutionIds;
  // 交代の位置は substitutions 側にだけ入っていることがある（相手がゲストのとき）。
  // 位置を取りこぼすと、交代後の射を交代前の人に付けてしまう
  const 位置たち = new Set();
  for (const 元 of [交代, 交代のid]) {
    if (元 && typeof 元 === 'object') for (const k of Object.keys(元)) 位置たち.add(Number(k));
  }
  const 順 = [...位置たち].filter((n) => Number.isFinite(n)).sort((a, b) => a - b);
  for (const 位置 of 順) {
    if (位置 > 射目) break;
    id = (交代のid && 交代のid[位置]) || undefined;
  }
  return id == null || id === '' ? undefined : id;
}

/**
 * 途中交代を踏まえて、その1射を引いた人の「表示上の名前」を返す。
 *
 * 部員に結び付けるための判定には使わないこと（同姓同名や異体字で別人を
 * 同一視するため）。射位ごとの成績のように、記録に書かれている名前で
 * 束ねて見せるときだけ使う。
 *
 * @param {object} 射手 archers の要素
 * @param {number} 射目 0始まりの射の添字
 * @returns {string}
 */
function その射の名前(射手, 射目) {
  if (!射手) return '';
  let 名前 = 射手.name || '';
  const 交代 = 射手.substitutions;
  if (交代 && typeof 交代 === 'object') {
    const 順 = Object.keys(交代)
      .map(Number)
      .filter((n) => Number.isFinite(n))
      .sort((a, b) => a - b);
    for (const 位置 of 順) {
      if (位置 > 射目) break;
      名前 = 交代[位置] || '';
    }
  }
  return 名前;
}

/**
 * その1射が、その部員のものか。
 *
 * @param {object} 射手 archers の要素
 * @param {number} 射目 0始まりの射の添字
 * @param {string|number} 部員id 調べたい部員の id
 * @returns {boolean}
 */
function その人の射か(射手, 射目, 部員id) {
  if (部員id == null || 部員id === '') return false;
  const id = その射の部員id(射手, 射目);
  return id !== undefined && String(id) === String(部員id);
}

/** ○ か × が入っているか。空欄と、それ以外の文字は数えない */
function 引いた射か(印) {
  return 印 === '○' || 印 === '×';
}

/**
 * その記録を集計に入れるか。
 *
 * includeInStats が入っていない古い記録は「含める」とみなす。
 * 未設定を外すと、この項目が無かった頃の記録が黙って分析から消え、
 * Excel の書き出し（未設定を含める扱い）とも食い違う。
 */
function 集計に入れるか(記録) {
  return !!記録 && 記録.includeInStats !== false;
}

// 立ちは4射で数える。画面の「立ち順別の的中率 (1-4射目)」「立ちの結果分布 (4射単位)」と同じ
const 立ちの射数 = 4;

/**
 * ある部員の成績を、記録の一覧から数える。
 *
 * 分析画面の順位も、詳細の比較相手も、ここを通す。
 * 以前は比較相手だけ「絞り込み後の一覧」から引いていたため、学年や性別で
 * 絞っている最中に相手を選ぶと、立ち順別が全部 0% になっていた。
 * 相手は全員から選べるのに、値は絞り込みの外にある人のぶんが無かった。
 *
 * 返す形は画面がそのまま使えるようにしてある。
 *
 * @param {Array} 記録たち すでに期間・タグで絞ったあとの記録
 * @param {string|number} 部員id
 * @returns {{shots:number, hits:number, rate:number, perShotStats:Array<{shots:number,hits:number}>, patterns:object}}
 */
function 成績を数える(記録たち, 部員id) {
  let shots = 0;
  let hits = 0;
  const perShotStats = Array.from({ length: 立ちの射数 }, () => ({ shots: 0, hits: 0 }));
  const patterns = { kaichu: 0, sanchu: 0, hake: 0, icchu: 0, zannen: 0 };

  for (const 記録 of Array.isArray(記録たち) ? 記録たち : []) {
    if (!記録 || !Array.isArray(記録.archers)) continue;
    for (const 射手 of 記録.archers) {
      if (!射手 || !Array.isArray(射手.marks)) continue;

      射手.marks.forEach((印, 射目) => {
        if (!引いた射か(印)) return;
        if (!その人の射か(射手, 射目, 部員id)) return;
        shots++;
        if (印 === '○') hits++;
        const 位置 = 射目 % 立ちの射数;
        perShotStats[位置].shots++;
        if (印 === '○') perShotStats[位置].hits++;
      });

      // 立ちの結果分布。4射そろっていて、かつ4射とも同じ人のときだけ数える。
      // 立ちの途中で交代していたら、どちらの皆中・残念にも数えない
      const 立ち数 = Math.floor(射手.marks.length / 立ちの射数);
      for (let 立ち = 0; 立ち < 立ち数; 立ち++) {
        let そろった = true;
        let 中り = 0;
        for (let i = 0; i < 立ちの射数; i++) {
          const 射目 = 立ち * 立ちの射数 + i;
          const 印 = 射手.marks[射目];
          if (!引いた射か(印) || !その人の射か(射手, 射目, 部員id)) {
            そろった = false;
            break;
          }
          if (印 === '○') 中り++;
        }
        if (!そろった) continue;
        if (中り === 4) patterns.kaichu++;
        else if (中り === 3) patterns.sanchu++;
        else if (中り === 2) patterns.hake++;
        else if (中り === 1) patterns.icchu++;
        else patterns.zannen++;
      }
    }
  }

  return { shots, hits, rate: shots > 0 ? (hits / shots) * 100 : 0, perShotStats, patterns };
}

/**
 * 1人ぶんの列を、途中交代で区切って「誰が何射引いたか」に分ける。
 *
 * 明細の書き出しのように、1行が1人でなければ意味を成さない場面で使う。
 * 分けないと、交代後の射も交代前の人の行に入ってしまう。
 * ○ か × が1つも入っていない区間は返さない。
 *
 * @param {object} 射手 archers の要素
 * @returns {Array<{部員id:string|undefined, 名前:string, 的中:number, 射数:number, 開始:number}>}
 */
function 射手を区間に分ける(射手) {
  if (!射手 || !Array.isArray(射手.marks)) return [];
  const 出来 = [];
  let いま = null;
  射手.marks.forEach((印, 射目) => {
    if (!引いた射か(印)) return;
    const id = その射の部員id(射手, 射目);
    const 名前 = その射の名前(射手, 射目);
    // 同じ人が続いているあいだは1つにまとめる
    if (!いま || いま.部員id !== id || いま.名前 !== 名前) {
      いま = { 部員id: id, 名前, 的中: 0, 射数: 0, 開始: 射目 };
      出来.push(いま);
    }
    いま.射数++;
    if (印 === '○') いま.的中++;
  });
  return 出来;
}

module.exports = {
  その射の部員id,
  その射の名前,
  その人の射か,
  引いた射か,
  集計に入れるか,
  成績を数える,
  射手を区間に分ける,
};
