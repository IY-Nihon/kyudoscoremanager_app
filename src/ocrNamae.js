/**
 * Module ID: ocrNamae
 *
 * 写真から読んだ氏名を、名簿の誰かに寄せる（名寄せ）。
 *
 * ■ 2つの照合
 *   ・Gemini の照合（roster）… 指示文で名簿を渡し、「字の形を見て確信できるときだけ
 *     名簿の表記を返す、無ければ null」と頼んだもの。手書きの字形と名簿の照合は
 *     文字比較よりこちらが強い
 *   ・文字比較（matchArcherName）… 完全一致 → 姓 → 編集距離。もともとはこれだけだった
 *
 * ■ なぜ Gemini の照合を主にしたか（2026-09-12、本物の板・部員39人で測った）
 *   文字比較だけだと 16人中 8人しか合わなかった。相手校の8人（名簿に無い）が、
 *   2文字の姓の編集距離2で部員に化ける（松本→橋本、長谷川→長野、小野→小野里）か、
 *   「もしかして」になる（松田→飯田/池田、砂原→篠原/東原/河原）。
 *   Gemini に roster を返させると、相手校の8人はほぼ null になり、部員の8人は
 *   名簿の表記で返る。roster が null のときは緩い照合をしない（ゲストのまま）。
 *
 * ■ 同じ人が2回出たら
 *   1枚の写真に同じ人は1回しか出ない。読み違えで同じ名簿の人に寄った2行目以降は
 *   「もしかして」に落とす（実測で、相手校の「河本」が「河原」と読まれ、部員の河原と重なった）。
 */
'use strict';

// ─────────────────────────────────────────
// 氏名の正規化・分割（姓／名）
// ─────────────────────────────────────────
function splitName(fullName) {
  if (!fullName) return { sei: "", mei: "" };
  const parts = fullName.trim().split(/[\s\u3000]+/);
  return { sei: parts[0] || "", mei: parts.length > 1 ? parts.slice(1).join("") : "" };
}

// 異体字正規化は行わず、空白の除去のみ行う（表記そのものの完全一致を判定するためのヘルパー）
function stripSpace(s) {
  if (!s) return "";
  return s.replace(/[\s\u3000]+/g, "");
}

// 代表的な異体字・旧字体を新字体・常用漢字に正規化してマッチング精度を飛躍的に高める
function normalize(s) {
  if (!s) return "";
  let nStr = s.replace(/[\s\u3000]+/g, "");
  const mapping = {
    "澁": "渋",
    "眞": "真",
    "邉": "辺",
    "邊": "辺",
    "齋": "斉",
    "齊": "斉",
    "廣": "広",
    "澤": "沢",
    "嶋": "島",
    "嶌": "島",
    "栁": "柳",
    "國": "国",
    "櫻": "桜",
    "髙": "高",
    "﨑": "崎"
  };
  for (const [oldChar, newChar] of Object.entries(mapping)) {
    nStr = nStr.replace(new RegExp(oldChar, "g"), newChar);
  }
  return nStr;
}

// ─────────────────────────────────────────
// 編集距離（Levenshtein Distance）の計算
// ─────────────────────────────────────────
function getLevenshteinDistance(a, b) {
  const tmp = [];
  for (let i = 0; i <= a.length; i++) {
    tmp[i] = [i];
  }
  for (let j = 0; j <= b.length; j++) {
    tmp[0][j] = j;
  }
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      tmp[i][j] = Math.min(
        tmp[i - 1][j] + 1,
        tmp[i][j - 1] + 1,
        tmp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return tmp[a.length][b.length];
}

// ─────────────────────────────────────────
// 名前マッチング（要件定義 3.3 名寄せロジック）
// candidates: [{id, name, gender, grade, isAlumni}]
// 戻り値: { status: 'matched'|'ambiguous'|'guest', match, options }
// ─────────────────────────────────────────
function matchArcherName(rawText, candidates) {
  const text = normalize(rawText);
  if (!text) return { status: "empty" };

  // 括弧付き識別子: "林(飛)" 形式を分離
  const parenMatch = rawText.match(/^([^\s\u3000(（]+)[\(（]([^)）]+)[\)）]$/);
  const searchSei = parenMatch ? parenMatch[1] : null;
  const searchDisambig = parenMatch ? parenMatch[2] : null;

  // 1. 完全一致（現役優先）
  const exact = candidates.filter(c => normalize(c.name) === text);
  if (exact.length === 1) return { status: "matched", match: exact[0] };
  if (exact.length > 1) {
    // 異体字正規化により複数候補が同居した場合、まずは「変換なしの表記そのもの」が
    // 完全一致する候補を優先する（例：渡辺/渡邉/渡邊が同居する場合、書かれた文字通りの「渡辺」を優先）
    const rawExact = exact.filter(c => stripSpace(c.name) === stripSpace(rawText));
    if (rawExact.length === 1) return { status: "matched", match: rawExact[0] };

    const active = exact.filter(c => !c.isAlumni);
    if (active.length === 1) return { status: "matched", match: active[0] };
    return { status: "ambiguous", options: exact };
  }

  // 2. 姓+識別子（括弧書き）一致
  if (searchSei && searchDisambig) {
    const bySei = candidates.filter(c => splitName(c.name).sei === searchSei);
    const withDisambig = bySei.filter(c => splitName(c.name).mei.startsWith(searchDisambig));
    if (withDisambig.length === 1) return { status: "matched", match: withDisambig[0] };
    if (bySei.length > 0) return { status: "ambiguous", options: bySei };
  }

  // 3. 姓のみ一致（現役生を優先、前方一致やスペース無しも強力にマッチ）
  const bySeiOnly = candidates.filter(c => {
    const sName = splitName(c.name);
    if (normalize(sName.sei) === text) return true;
    const cn = normalize(c.name);
    // 部員名が「澁川航大」（正規化で「渋川航大」）で、読み取ったテキストが「渋川」などの場合（前方一致で長さ2以上）
    if (text.length >= 2 && cn.startsWith(text) && cn.length > text.length) return true;
    return false;
  });
  if (bySeiOnly.length === 1) return { status: "matched", match: bySeiOnly[0] };
  if (bySeiOnly.length > 1) {
    // 異体字正規化により複数候補が同居した場合、まずは「変換なしの表記そのもの」の姓が
    // 完全一致する候補を優先する（例：渡辺/渡邉/渡邊のうち、書かれた文字通りの「渡辺」姓を優先）
    const rawSeiExact = bySeiOnly.filter(c => stripSpace(splitName(c.name).sei) === stripSpace(rawText));
    if (rawSeiExact.length === 1) return { status: "matched", match: rawSeiExact[0] };

    const activeOnly = bySeiOnly.filter(c => !c.isAlumni);
    if (activeOnly.length === 1) return { status: "matched", match: activeOnly[0] };
    return { status: "ambiguous", options: bySeiOnly };
  }

  // 3.5. 姓のみの編集距離救済（OCRが名前部分を読み落とし／姓自体を誤読した場合）
  // 例：候補「渋川航大」に対し、OCRが名前部分を読み落として姓のみ「渋川」と読み取った上に
  //     さらに1文字を誤読して「渋谷」となったケース。姓（2〜3文字程度）同士の編集距離で救済する。
  if (text.length >= 2 && text.length <= 4) {
    let minSeiDistance = 2; // 姓は短いので許容距離は最大1まで
    let seiFuzzyMatches = [];
    candidates.forEach(c => {
      const sei = normalize(splitName(c.name).sei);
      if (!sei || sei.length > 4) return; // 姓が極端に長い（＝姓名を分割できていない）データは対象外
      const dist = getLevenshteinDistance(text, sei);
      if (dist < minSeiDistance) {
        minSeiDistance = dist;
        seiFuzzyMatches = [c];
      } else if (dist === minSeiDistance) {
        seiFuzzyMatches.push(c);
      }
    });
    if (seiFuzzyMatches.length === 1 && minSeiDistance <= 1) {
      return { status: "matched", match: seiFuzzyMatches[0], fuzzy: true };
    } else if (seiFuzzyMatches.length > 1 && minSeiDistance <= 1) {
      const activeSeiFuzzy = seiFuzzyMatches.filter(c => !c.isAlumni);
      if (activeSeiFuzzy.length === 1) return { status: "matched", match: activeSeiFuzzy[0], fuzzy: true };
      return { status: "ambiguous", options: seiFuzzyMatches };
    }
  }

  // 4. 部分一致（手書き誤字・略字の緩やかな救済）
  const partial = candidates.filter(c => {
    const cn = normalize(c.name);
    return cn.includes(text) || text.includes(cn.slice(0, 1)) && cn.startsWith(text.slice(0, 1)) && Math.abs(cn.length - text.length) <= 1;
  });
  if (partial.length === 1) return { status: "matched", match: partial[0], fuzzy: true };

  // 5. 編集距離（Levenshtein Distance）による漢字書き間違い救済
  let bestFuzzyMatches = [];
  let minDistance = 3; // 最大許容距離は2まで
  candidates.forEach(c => {
    const cn = normalize(c.name);
    const dist = getLevenshteinDistance(text, cn);
    if (dist < minDistance) {
      minDistance = dist;
      bestFuzzyMatches = [c];
    } else if (dist === minDistance) {
      bestFuzzyMatches.push(c);
    }
  });

  if (bestFuzzyMatches.length === 1 && minDistance <= 2) {
    return { status: "matched", match: bestFuzzyMatches[0], fuzzy: true };
  } else if (bestFuzzyMatches.length > 1 && minDistance <= 2) {
    return { status: "ambiguous", options: bestFuzzyMatches };
  }

  // 6. 一致なし → ゲスト扱い
  return { status: "guest", rawText: rawText.trim() };
}


/**
 * Gemini の照合（roster）を主にした名寄せ。
 *
 * @param {string} rawText 読めた文字
 * @param {string|null|undefined} roster Gemini が返した名簿の表記。undefined は「照合していない」（古い返事）
 * @param {object[]} candidates
 */
/** 記号や空白を落として、字だけにする（名簿の「†永井 優郷†」と読めた「永井」を比べるため） */
function 文字だけ(s) {
  return String(s || '').replace(/[^\p{L}\p{N}]/gu, '');
}

function 名簿で名寄せ(rawText, roster, candidates) {
  // 照合していない返事なら、これまでどおり文字比較だけ
  if (roster === undefined) return matchArcherName(rawText, candidates);
  const text = normalize(rawText);
  if (!text && !roster) return { status: 'empty' };
  if (roster) {
    const r = normalize(roster);
    // 名簿の表記は「姓」か「姓(名の頭)」（formatMemberName）で渡している。どちらでも受ける
    const 同じ = candidates.filter((c) => {
      const cn = normalize(c.name);
      const sei = normalize(splitName(c.name).sei);
      const 頭 = normalize(splitName(c.name).mei).slice(0, 1);
      return cn === r || sei === r || (頭 && `${sei}(${頭})` === r.replace(/（/g, '(').replace(/）/g, ')'));
    });
    const 一人 = 同じ.length === 1 ? 同じ[0] : 同じ.filter((c) => !c.isAlumni).length === 1 ? 同じ.find((c) => !c.isAlumni) : null;
    if (一人) {
      // 読めた文字が名簿の姓（か氏名）と同じなら決まり。違うのに Gemini が寄せたなら
      //（「田」→田端、「長」→長野、「砂原」→笹原 のように、字の一部や似た字で寄せる）
      // 「もしかして」で止めて、人に決めてもらう
      const 素 = (v) => 文字だけ(normalize(v));
      const 同じ字 = 素(rawText) && [一人.name, splitName(一人.name).sei].some((v) => 素(v) === 素(rawText));
      return 同じ字 ? { status: 'matched', match: 一人, 照合: 'AI' } : { status: 'ambiguous', options: [一人], 照合: 'AI' };
    }
    if (同じ.length > 1) return { status: 'ambiguous', options: 同じ };
    // 名簿に無い表記を返してきた（作った）。読めた文字で厳しく照合する
  }
  if (!text) return { status: 'empty' };
  // roster が null … 名簿に無いと Gemini が言っている。完全一致か姓の一致だけ認め、
  // 編集距離の救済はしない（ここで緩めると相手校の選手が部員に化ける）
  const exact = candidates.filter((c) => normalize(c.name) === text || normalize(splitName(c.name).sei) === text);
  if (exact.length === 1) return { status: 'matched', match: exact[0] };
  if (exact.length > 1) {
    const 現役 = exact.filter((c) => !c.isAlumni);
    if (現役.length === 1) return { status: 'matched', match: 現役[0] };
    return { status: 'ambiguous', options: exact };
  }
  return { status: 'guest', rawText: rawText.trim() };
}

/**
 * 同じ名簿の人に寄った行が2つ以上あれば、2つ目からを「もしかして」に落とす。
 * 読めた文字が名簿の表記と完全に同じ行を残す（無ければ先の行）。
 *
 * @param {{status:string, match?:object, rawText?:string}[]} rows 名寄せの結果（順に）
 * @returns 同じ長さの配列
 */
function 重なりを外す(rows) {
  const 鍵 = (c) => (c && c.id != null ? `${c.isAlumni ? 'a' : 'm'}:${c.id}` : null);
  const 群 = new Map();
  rows.forEach((r, i) => {
    if (r.status !== 'matched' || !鍵(r.match)) return;
    const k = 鍵(r.match);
    if (!群.has(k)) 群.set(k, []);
    群.get(k).push(i);
  });
  const 出 = rows.slice();
  for (const 番たち of 群.values()) {
    if (番たち.length < 2) continue;
    const 素の一致 = 番たち.filter((i) => {
      const c = rows[i].match;
      const t = normalize(rows[i].rawText || '');
      return t && (t === normalize(c.name) || t === normalize(splitName(c.name).sei));
    });
    const 残す = 素の一致.length ? 素の一致[0] : 番たち[0];
    for (const i of 番たち) {
      if (i === 残す) continue;
      出[i] = { status: 'ambiguous', options: [rows[i].match], rawText: rows[i].rawText, 重なり: true };
    }
  }
  return 出;
}

module.exports = { splitName, stripSpace, normalize, getLevenshteinDistance, matchArcherName, 名簿で名寄せ, 重なりを外す, 文字だけ };
