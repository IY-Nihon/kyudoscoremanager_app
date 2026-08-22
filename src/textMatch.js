/**
 * 言葉の近さを、コードだけで測る。
 *
 * 外の API（埋め込み）を使わない。往復が増えず、費用もかからず、
 * 質問文がもう一つの相手に渡ることもない。
 *
 * 日本語は語の切れ目が無いので、文字の二つ組（バイグラム）で測る。
 * 「文字が小さい」なら 文字/字が/が小/小さ の4つ。分かち書きも辞書も要らない。
 * 語が違っても字が重なれば当たるので、言い換えに強い。
 *
 * 重みは TF-IDF の考え方を使う。どのQ&Aにも出る二つ組（「して」「ます」など）は
 * 軽く、少数にしか出ない二つ組（「大前」「交代」など）は重く数える。
 * これをしないと、ありふれた言い回しだけで当たってしまう。
 */
'use strict';

/** 文字の二つ組に割る。空白と記号は落とす */
function 二つ組(文) {
  const s = String(文 || '')
    .replace(/[\s、。「」（）()？?！!・…\-ー～]/g, '')
    .toLowerCase();
  const 出た = [];
  for (let i = 0; i + 1 < s.length; i++) 出た.push(s.slice(i, i + 2));
  // 1文字しかないときは、その1文字を組として扱う
  if (出た.length === 0 && s.length === 1) 出た.push(s);
  return 出た;
}

/** 数える。同じ組が何度も出たら、その数だけ重くする */
function 数える(組たち) {
  const 表 = new Map();
  組たち.forEach((g) => 表.set(g, (表.get(g) || 0) + 1));
  return 表;
}

/**
 * 引きを作る。全部の文をあらかじめ数えておき、
 * 「どの文にも出る組」を軽くするための重みを持つ。
 *
 * @param {Array<{id: any, 文: string}>} 品たち
 */
function 引きをつくる(品たち) {
  const 一覧 = (Array.isArray(品たち) ? 品たち : []).map((x) => ({
    id: x.id,
    文: x.文,
    数: 数える(二つ組(x.文)),
  }));
  // その組が何件の文に出るか
  const 出た件数 = new Map();
  一覧.forEach((x) => {
    new Set(x.数.keys()).forEach((g) => 出た件数.set(g, (出た件数.get(g) || 0) + 1));
  });
  const 全件 = Math.max(1, 一覧.length);
  /** 珍しい組ほど重い */
  const 重み = (g) => Math.log(1 + 全件 / (1 + (出た件数.get(g) || 0)));

  // 文ごとの長さ（正規化用）。長い文が有利にならないようにする
  一覧.forEach((x) => {
    let 二乗 = 0;
    x.数.forEach((n, g) => {
      const w = n * 重み(g);
      二乗 += w * w;
    });
    x.長さ = Math.sqrt(二乗) || 1;
  });

  return { 一覧, 重み };
}

/**
 * 近い順に返す。0〜1の近さを付ける。
 *
 * @param {ReturnType<引きをつくる>} 引き
 * @param {string} 聞かれた文
 * @param {{件数?: number, 下限?: number}} 注文
 */
function 近い順(引き, 聞かれた文, 注文) {
  const 設定 = 注文 || {};
  const 問 = 数える(二つ組(聞かれた文));
  if (問.size === 0) return [];
  let 問の長さ = 0;
  問.forEach((n, g) => {
    const w = n * 引き.重み(g);
    問の長さ += w * w;
  });
  問の長さ = Math.sqrt(問の長さ) || 1;

  const 出た = 引き.一覧
    .map((x) => {
      let 内積 = 0;
      問.forEach((n, g) => {
        const 相手 = x.数.get(g);
        if (!相手) return;
        const w = 引き.重み(g);
        内積 += n * w * (相手 * w);
      });
      return { id: x.id, 文: x.文, 近さ: 内積 / (問の長さ * x.長さ) };
    })
    .filter((x) => x.近さ > (Number.isFinite(設定.下限) ? 設定.下限 : 0))
    .sort((a, b) => b.近さ - a.近さ);

  return Number.isFinite(設定.件数) && 設定.件数 > 0 ? 出た.slice(0, 設定.件数) : 出た;
}

module.exports = { 二つ組, 引きをつくる, 近い順 };
