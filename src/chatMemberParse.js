/**
 * 初めの案内（部員 0 人の団体）で、AI に送った文から部員（名前・学年・性別）を読み取る。
 * AI へ届かなかったとき（通信の不調・上限）にだけ使う控えの道。読み取れたら確認のカードを出し、
 * 使う人が承認してから登録する（勝手には足さない）。
 * 画面にも通信にも触れない純粋な関数なので、node --test で確かめられる（test/chatMemberParse.test.js）。
 */
'use strict';

/** 名前の前後に付いた助詞や敬称を落とす（「の山田」「高橋を」「佐藤さん」） */
function 字を整える(字) {
  return String(字 || '')
    .replace(/^[のをにでは]+/, '')
    .replace(/(さん|くん|ちゃん|君|様)$/, '')
    .replace(/[のをにでは]+$/, '');
}

/**
 * 「1年の山田 太郎 男子 を追加して」→ { name: '山田 太郎', grade: 1, gender: '男子' }。
 * 追加の言葉も学年も無い文、名前が残らない文は null（でっち上げの名前は作らない）
 * @param {string} 文
 * @returns {{ name: string, grade: number, gender: '男子' | '女子' | '未設定' } | null}
 */
function 入力から部員を読み取る(文) {
  if (!文 || typeof 文 !== 'string') return null;
  // 全角の数字・空白を半角に
  const テキスト = 文.normalize('NFKC').trim();
  const 追加の意図 = /追加|登録|足して|入れて|入部|加え/.test(テキスト) || /[1-4]\s*年/.test(テキスト);
  if (!追加の意図) return null;

  const 学年合致 = テキスト.match(/([1-4])\s*年/);
  const grade = 学年合致 ? Number(学年合致[1]) : 1;
  // 「男」「女」1 字では見ない（「一男」のような名前の字に当たる）
  const gender = /男子|男性/.test(テキスト) ? '男子' : /女子|女性/.test(テキスト) ? '女子' : '未設定';

  const 残り = テキスト
    .replace(/こんにちは|よろしくお願いします|よろしく|お願いします|おねがいします|ください/g, ' ')
    .replace(/[1-4]\s*年生?/g, ' ')
    .replace(/男子|女子|男性|女性/g, ' ')
    .replace(/(を|に)?(追加|登録|入部)(して|する|お願い|頼む)?/g, ' ')
    .replace(/(を|に)?(足して|入れて|加えて)/g, ' ')
    .replace(/メンバー|部員/g, ' ')
    .replace(/[、。,.!！?？「」]/g, ' ');
  const name = 残り
    .split(/\s+/)
    .map(字を整える)
    .filter(Boolean)
    .join(' ');
  if (!name) return null;
  return { name, grade, gender };
}

module.exports = { 入力から部員を読み取る };
