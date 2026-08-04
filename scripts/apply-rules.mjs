/**
 * ルールの適用。rules/ 配下のファイルを firestore.rules へコピーしてデプロイする。
 *
 *   node scripts/apply-rules.mjs <bootstrap|stage1|stage2|rollback> <stg|prod>
 *
 * ・firebase deploy は firebase.json が指す firestore.rules を読むため、
 *   目的のルールをそこへ置いてからデプロイする。
 * ・--only firestore:rules に固定する。--only firestore はインデックス定義
 *   （firestore.indexes.json）も反映してしまい、中身が空のテンプレートのままなので
 *   本番の複合インデックスを削除する恐れがある。
 * ・--project を必ず明示する。付け忘れると .firebaserc の default＝本番に飛ぶ。
 */
import fs from 'node:fs';
import { execSync } from 'node:child_process';

const SOURCES = {
  bootstrap: 'rules/bootstrap.rules',
  stage1: 'rules/stage1.rules',
  stage2: 'rules/stage2.rules',
  rollback: '_archive/rollback.rules',
};
const PROJECTS = { stg: 'kyudoscoremanager-stg', prod: 'kyudoscoremanager' };

const [which, target] = process.argv.slice(2);
const src = SOURCES[which];
const project = PROJECTS[target];

if (!src || !project) {
  console.error('使い方: node scripts/apply-rules.mjs <bootstrap|stage1|stage2|rollback> <stg|prod>');
  process.exit(1);
}
if (which === 'bootstrap' && target === 'prod') {
  console.error('bootstrap は全許可ルール。本番には絶対に適用しない。');
  process.exit(1);
}

fs.copyFileSync(src, 'firestore.rules');
console.log(`${src} → firestore.rules にコピーしました`);
console.log(`デプロイ先: ${project}`);

// Windows では .cmd を直接 spawn できない（EINVAL）ため shell 経由で起動する
execSync(
  `npx firebase deploy --only firestore:rules --project ${project}`,
  { stdio: 'inherit' }
);
