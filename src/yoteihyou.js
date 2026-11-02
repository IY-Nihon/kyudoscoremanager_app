// 出欠の画面の「AI で予定表を読む」の答えを読む・練習日の保存の誤りを伝える（src/AttendanceScreen.js）。
//
// AI には [{"date":"YYYY-MM-DD","reason":"練習"}] の形で答えるよう頼んでいるが、形が少し違って返ることがある
//（```json で囲む・{ "days": [...] } のように包む・日付だけの並び・2026/11/3 の書き方）。読めるものは読む
'use strict';

/** 「2026-11-3」「2026/11/03」「2026.11.3」を「2026-11-03」に。ありえない日付は null */
function 日付をそろえる(元) {
  if (typeof 元 !== 'string') return null;
  const 合う = 元.trim().match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (!合う) return null;
  const [年, 月, 日] = [Number(合う[1]), Number(合う[2]), Number(合う[3])];
  const 日付 = new Date(年, 月 - 1, 日);
  if (日付.getFullYear() !== 年 || 日付.getMonth() !== 月 - 1 || 日付.getDate() !== 日) return null;
  return `${年}-${String(月).padStart(2, '0')}-${String(日).padStart(2, '0')}`;
}

/** 文字を JSON として読む。読めなければ undefined */
function 読んでみる(文) {
  try {
    return JSON.parse(文);
  } catch {
    return undefined;
  }
}

/** 包みを外して、項目の並びにする（{ days: [...] }・1 件だけの { date }・日付だけの並び） */
function 並びにする(値) {
  if (Array.isArray(値)) return 値;
  if (!値 || typeof 値 !== 'object') return null;
  if ('date' in 値 || '日付' in 値) return [値];
  const 中の並び = Object.values(値).find(Array.isArray);
  return 中の並び || null;
}

/**
 * AI の答えの字から練習日を取り出す。同じ日は 1 つにまとめる。
 * 読めない（JSON でない）ときは、見せてよい日本語の誤りを投げる
 * @param {string} 答え
 * @returns {{date: string, reason: string}[]}
 */
function 予定表の答えを読む(答え) {
  const 字 = String(答え || '')
    .replace(/```(?:json)?/gi, '')
    .trim();
  if (!字) throw new Error('AIからの応答内容が空、またはJSON形式ではありませんでした。');
  // まず全体を読み、だめなら前後の説明を外して [...] か {...} の部分を読む
  let 値 = 読んでみる(字);
  if (値 === undefined) {
    const 角 = 字.slice(字.indexOf('['), 字.lastIndexOf(']') + 1);
    if (角) 値 = 読んでみる(角);
  }
  if (値 === undefined) {
    const 波 = 字.slice(字.indexOf('{'), 字.lastIndexOf('}') + 1);
    if (波) 値 = 読んでみる(波);
  }
  const 並び = 並びにする(値);
  // 壊れた JSON の英文（Unexpected token …）は見せない
  if (!並び) throw new Error('AIの答えを読み取れませんでした。もう一度お試しください。');
  const 見た = new Set();
  const 出 = [];
  for (const 項目 of 並び) {
    const 元の日付 = typeof 項目 === 'string' ? 項目 : 項目 && (項目.date ?? 項目.日付 ?? 項目.day);
    const date = 日付をそろえる(元の日付);
    if (!date || 見た.has(date)) continue;
    見た.add(date);
    const 理由 = 項目 && typeof 項目 === 'object' ? (項目.reason ?? 項目.理由) : null;
    出.push({ date, reason: typeof 理由 === 'string' ? 理由 : '' });
  }
  return 出;
}

/**
 * 練習日を雲へ書けなかったときの文（練習日の付け外しと予定表の保存で同じにする）。
 * 権限 が true なら、呼ぶ側が入り直しの窓を出す（ログインが切れていると保存が断られる）
 * @returns {{見出し: string, 文: string, 権限: boolean}}
 */
function 練習日の保存の誤り(誤り) {
  const 権限 = /permission|unauthenticated|auth/i.test(String((誤り && (誤り.code || 誤り.message)) || ''));
  return {
    見出し: '保存できませんでした',
    文: 権限
      ? 'ログインの有効期限が切れているか、この操作の権限がありません。ログインし直してから、もう一度お試しください。'
      : '通信がつながっていないようです。電波の良い場所でもう一度お試しください。',
    権限,
  };
}

module.exports = { 予定表の答えを読む, 日付をそろえる, 練習日の保存の誤り };
