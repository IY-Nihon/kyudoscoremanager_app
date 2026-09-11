/**
 * 学習用の見本を読む・描く（Node 専用。sharp と fs を使う）。
 * 読み取りの中身 manabu.mjs はアプリの束に入るので、ここに分けてある。
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { 印をえがく, 画にする } from './egaku.mjs';
import { 種類, 形にする } from './manabu.mjs';

const 逆 = String.fromCharCode(92);

/** 描いた見本をつくる */
export async function 描いた見本(一種類あたり) {
  const 出 = [];
  for (let k = 0; k < 種類.length; k++) {
    for (let i = 0; i < 一種類あたり; i++) {
      const 板 = 画にする(印をえがく(種類[k], k * 1000003 + i * 7919 + 13, 64));
      出.push({ 形: await 形にする(板.画, 板.幅, 板.高), 札: k });
    }
  }
  return 出;
}

/** 本物のマス（確かめ用） */
export async function 本物の見本(根) {
  const 記号 = { batsu: '×', maru2: '◎', maru_gyaku: '○' + 逆, maru_seki: '○/' };
  const 出 = [];
  for (const 札 of fs.readdirSync(根)) {
    const k = 種類.indexOf(記号[札]);
    if (k < 0) continue;
    for (const f of fs.readdirSync(path.join(根, 札))) {
      const { data, info } = await sharp(path.join(根, 札, f)).greyscale().raw().toBuffer({ resolveWithObject: true });
      出.push({ 形: await 形にする(data, info.width, info.height), 札: k, 名: 札 + '/' + f });
    }
  }
  return 出;
}

