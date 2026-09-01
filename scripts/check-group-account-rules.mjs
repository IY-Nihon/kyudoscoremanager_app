/**
 * group_accounts の決まりが、意図どおりに効いているかを確かめる。
 *
 *   node scripts/check-group-account-rules.mjs         （検証環境）
 *   node scripts/check-group-account-rules.mjs prod    （本番）
 *
 * 見たいのは4つ。
 *   1. 未認証でも公開の帳面は読める（ログインが認証前にここを引くため）
 *   2. 公開の帳面に入っているのは id と email だけ
 *   3. **未認証では private を読めない**（ここが今回の目的）
 *   4. **匿名で入っても private を読めない**
 *      ——このアプリは部員向けに匿名ログインを開けているので、
 *        「認証を求める」だけでは総当たりを止められない
 *
 * 読むだけ。何も書かない。
 */
import { configFor, signInAnonymously } from './fb-rest.mjs';

const 対象 = process.argv[2] || 'stg';
if (!['stg', 'prod'].includes(対象)) {
  console.error('使い方: node scripts/check-group-account-rules.mjs <stg|prod>');
  process.exit(1);
}
const { apiKey, projectId } = configFor(対象);
const 根 = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;

/** 確かめたい団体を1つ選ぶ（公開の帳面が読めるものなら何でもよい） */
const 団体 = process.env.CHECK_GROUP || (対象 === 'stg' ? '100001' : '698098');

const 読む = async (道, token) =>
  fetch(`${根}/${道}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });

let だめ = 0;
const 見る = (題, 良いか, 添え) => {
  console.log(`  ${良いか ? 'ok ' : '★  '} ${題}${添え ? '  … ' + 添え : ''}`);
  if (!良いか) だめ++;
};

console.log(`${projectId} / 団体${団体} の決まりを確かめます（読むだけ）\n`);

// ① 未認証で公開の帳面
const 公開 = await 読む(`group_accounts/${団体}`);
見る('未認証でも公開の帳面は読める（ログインに要る）', 公開.ok, `HTTP ${公開.status}`);

// ② 中身はログインに要る2つだけか
if (公開.ok) {
  const 鍵 = Object.keys((await 公開.json()).fields || {}).sort();
  const 余計 = 鍵.filter((k) => !['id', 'email'].includes(k));
  見る(
    '公開の帳面は id と email だけ',
    余計.length === 0,
    余計.length ? `まだ ${余計.join('・')} が入っている` : 鍵.join('・')
  );
}

// ③ 未認証で private
const 未認証 = await 読む(`group_accounts/${団体}/private/consent`);
見る('未認証では private を読めない', !未認証.ok, `HTTP ${未認証.status}`);

// ④ 匿名で入ってから private
//    このアプリは部員向けに匿名ログインを開けている。だから
//    「認証を求める」だけでは、総当たりする側は匿名で入ればよいことになる
const 匿名 = await signInAnonymously(apiKey);
const 匿名で = await 読む(`group_accounts/${団体}/private/consent`, 匿名);
見る('匿名で入っても private を読めない', !匿名で.ok, `HTTP ${匿名で.status}`);

console.log('');
if (だめ) {
  console.log(`${だめ} 件が意図どおりではありません。`);
  process.exit(1);
}
console.log('すべて意図どおりです。');
