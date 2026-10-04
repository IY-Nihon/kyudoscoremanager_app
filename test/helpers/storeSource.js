/**
 * 店（ストア）の字をまとめて読む手助け（2026-10-05）。
 *
 * 店は useScoreStore.js 1 つだったが、2026-10-05 に幾つかのファイルに分けた（外側の部品 storeShared.js・
 * 盤面の操作 storeBoard.js など。名前は store で始まる）。中身を字として読む検査は、どのファイルに
 * 移っても見られるように、ここから「店ぜんぶの字」を読む。
 * storeSlice.js（画面が店の一部だけを購読する手助け）は店の中身ではないので外す。
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const 根 = path.join(__dirname, '..', '..', 'src');

/** 店のファイルの名前（src からの相対） */
function 店のファイル() {
  return ['useScoreStore.js', ...fs.readdirSync(根).filter((名) => /^store.*\.js$/.test(名) && 名 !== 'storeSlice.js').sort()];
}

/** 店ぜんぶの字（ファイルをつないだもの） */
function 店の字() {
  return 店のファイル()
    .map((名) => fs.readFileSync(path.join(根, 名), 'utf8'))
    .join('\n');
}

module.exports = { 店のファイル, 店の字 };
