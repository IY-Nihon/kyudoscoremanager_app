/**
 * 決まり（firestore.rules）の管理者 isAdmin() に書いた例のアドレスを、手元の運営のアドレスに差し替えた写しを作る。
 *
 * 公開の倉庫の決まりには例のアドレス（kanri@example.com）だけを書く（2026-11-24 本人「例だけにする」）。
 * 運営のアドレスが外から分かると、全部を動かせる口座（Firebase・Cloudflare・決まりの管理者）がどれか分かり、
 * その口座を狙ったなりすましの的になるため。本物は手元の .env の ADMIN_EMAIL だけに置く（scripts/fb-rest.mjs）。
 *
 * 配るときは npm run deploy:rules（:stg）がこれを通し、作った firebase.kimari.json（倉庫に入れない）で写しを配る。
 * 素の firebase deploy で配ると例のアドレスのまま出て、管理の操作が止まる。例のアドレスはメールの確認が
 * できないので誰も管理者にはなれない（穴にはならない）が、配り直すまで運営の操作ができない。
 *
 *   node scripts/kimari-sashikomi.mjs                       … firestore.rules から .kimari/firestore.rules と firebase.kimari.json を作る
 *   node scripts/kimari-sashikomi.mjs rules/rollback.rules  … 切り戻し用の決まりから作る（rules/rollback.rules の頭の使い方）
 */
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import { 運営のアドレス, 例の運営のアドレス } from './fb-rest.mjs';

const 例 = `'${例の運営のアドレス}'`;
const アドレスの形 = /^[^@\s'"]+@[^@\s'"]+\.[A-Za-z]{2,}$/;

/**
 * 決まりの例のアドレス（1 か所だけのはず）を本物に差し替える。ほかの字は変えない
 * @param {string} 決まり
 * @param {string} 本物
 */
export function 差し込む(決まり, 本物) {
  const 数 = 決まり.split(例).length - 1;
  if (数 !== 1) throw new Error(`決まりに例のアドレス ${例} が ${数} か所ある（1 か所のはず）`);
  if (!アドレスの形.test(本物) || 本物 === 例の運営のアドレス)
    throw new Error('差し込むアドレスの形が正しくない');
  return 決まり.replace(例, `'${本物}'`);
}

/**
 * 出ている決まり（本物入り）の isAdmin() のアドレスを例に戻す（手元の決まりと比べるため）
 * @param {string} 決まり
 */
export function 例に戻す(決まり) {
  const i = 決まり.indexOf('function isAdmin()');
  if (i < 0) return 決まり;
  const j = 決まり.indexOf(']', i);
  if (j < 0) return 決まり;
  return 決まり.slice(0, i) + 決まり.slice(i, j).replace(/'[^'\s]+@[^'\s]+'/g, 例) + 決まり.slice(j);
}

/**
 * 倉庫の決まりに運営のアドレスを差し込んだ中身（読むだけの台本が、本物と同じ決まりを見るため）
 * @param {string} [道]
 */
export function 差し込んだ決まり(道 = 'firestore.rules') {
  return 差し込む(fs.readFileSync(道, 'utf8'), 運営のアドレス());
}

if (process.argv[1] && import.meta.url === url.pathToFileURL(path.resolve(process.argv[1])).href) {
  const 元 = process.argv[2] || 'firestore.rules';
  const 写し = 差し込んだ決まり(元);
  fs.mkdirSync('.kimari', { recursive: true });
  fs.writeFileSync(path.join('.kimari', 'firestore.rules'), 写し);
  const 設定 = JSON.parse(fs.readFileSync('firebase.json', 'utf8'));
  設定.firestore = { ...設定.firestore, rules: '.kimari/firestore.rules' };
  fs.writeFileSync('firebase.kimari.json', JSON.stringify(設定, null, 2) + '\n');
  console.log(
    `決まりに運営のアドレスを差し込んだ写しを作った（元: ${元} → .kimari/firestore.rules・設定: firebase.kimari.json）`
  );
}
