/**
 * アプリの束に入る部品のライセンス（著作権表示と許諾文）を 1 つのファイルにまとめる。
 *
 *   node scripts/make-licenses.mjs [出す先のフォルダー（既定 dist）]
 *
 * MIT・Apache-2.0・ISC・BSD は「配る物に表示を添える」決まり。アプリの束はブラウザへ配る物なので、
 * 同じ置き場に licenses.txt を置く（2026-11-13 本人：画面には出さない。置き場に置くだけ）。
 * build-prod.mjs・build-stg.mjs が書き出しのあとに呼ぶ。
 *
 * 対象は package-lock.json の、開発用でない部品ぜんぶ（束に入らないものも混じるが、多いぶんには困らない）。
 * 同じ文の部品はまとめて、文は 1 回だけ書く。
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const 出す先 = process.argv[2] || 'dist';
const 錠 = JSON.parse(fs.readFileSync('package-lock.json', 'utf8')).packages;

/** 部品のフォルダーから、ライセンスと NOTICE の文を読む */
function 文を読む(場所) {
  let 名たち;
  try {
    名たち = fs.readdirSync(場所);
  } catch {
    return null;
  }
  const 当たり = 名たち.filter((名) => /^(licen[sc]e|copying|notice)([.\-_].*)?$/i.test(名)).sort();
  const 文 = 当たり
    .map((名) => {
      try {
        const 道 = path.join(場所, 名);
        return fs.statSync(道).isFile() ? fs.readFileSync(道, 'utf8').replace(/\r\n/g, '\n').trim() : '';
      } catch {
        return '';
      }
    })
    .filter(Boolean)
    .join('\n\n');
  return 文 || null;
}

const 組 = new Map(); // 文の要約 → { 文, 部品: [] }
const 文なし = [];
let 数 = 0;
for (const [道, 中身] of Object.entries(錠)) {
  if (!道 || 中身.dev || 中身.link) continue;
  if (!fs.existsSync(道)) continue; // この機械に入らない任意の部品
  let 荷札;
  try {
    荷札 = JSON.parse(fs.readFileSync(path.join(道, 'package.json'), 'utf8'));
  } catch {
    continue;
  }
  const 名 = `${荷札.name || 道.replace(/^.*node_modules\//, '')}@${荷札.version || 中身.version || ''}`;
  const 種 = typeof 荷札.license === 'string' ? 荷札.license : (荷札.license && 荷札.license.type) || '不明';
  数 += 1;
  const 文 = 文を読む(道);
  if (!文) {
    const 人 = typeof 荷札.author === 'string' ? 荷札.author : (荷札.author && 荷札.author.name) || '';
    文なし.push(`${名}（${種}）${人 ? ' — ' + 人 : ''}`);
    continue;
  }
  const 鍵 = crypto.createHash('sha1').update(文).digest('hex');
  if (!組.has(鍵)) 組.set(鍵, { 文, 部品: [] });
  組.get(鍵).部品.push(`${名}（${種}）`);
}

// 部品のほかに束と一緒に配るもの
const ほか = [
  {
    部品: [
      '写真の読み取りの網の重み（omomi-mobilenet.bin）：torchvision の MobileNetV3-small（IMAGENET1K_V1）を元に学び直したもの（BSD-3-Clause）',
    ],
    文: `BSD 3-Clause License

Copyright (c) Soumith Chintala 2016,
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice, this
  list of conditions and the following disclaimer.

* Redistributions in binary form must reproduce the above copyright notice,
  this list of conditions and the following disclaimer in the documentation
  and/or other materials provided with the distribution.

* Neither the name of the copyright holder nor the names of its
  contributors may be used to endorse or promote products derived from
  this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.`,
  },
];

const 線 = '\n' + '='.repeat(78) + '\n';
const 並び = [...ほか, ...[...組.values()].sort((甲, 乙) => 乙.部品.length - 甲.部品.length)];
let 出 =
  '弓道部的中ノート — このアプリが使っている部品のライセンス\n' +
  'Third-party software notices for this app.\n\n' +
  'このアプリは、下の部品を含んでいます。それぞれの著作権表示と許諾文を載せます。\n';
for (const 一組 of 並び) {
  出 += 線 + 一組.部品.sort().join('\n') + '\n' + '-'.repeat(78) + '\n' + 一組.文 + '\n';
}
if (文なし.length) {
  // ファイルが同梱されていない部品は、種類と作者を並べ、種類ごとの決まった文を下に載せる
  const 決まった文 = (見分け) => {
    const 当たり = [...組.values()]
      .filter((一組) => 見分け(一組.文))
      .sort((甲, 乙) => 甲.文.length - 乙.文.length)[0];
    return 当たり ? 当たり.文 : '';
  };
  const apache = 決まった文(
    (文) => /Apache License\s+Version 2\.0/.test(文) && /END OF TERMS AND CONDITIONS/.test(文)
  );
  const mit = 決まった文((文) => /^MIT License/.test(文) && /Permission is hereby granted/.test(文));
  const isc = 決まった文((文) => /Permission to use, copy, modify, and\/or distribute/.test(文));
  出 +=
    線 +
    'ライセンスのファイルが同梱されていない部品（種類と作者。文は下の決まった文のとおり）\n' +
    '-'.repeat(78) +
    '\n' +
    文なし.sort().join('\n') +
    '\n';
  for (const [題, 文] of [
    ['Apache-2.0', apache],
    ['MIT（著作権者は上の各部品の作者）', mit],
    ['ISC（著作権者は上の各部品の作者）', isc],
  ]) {
    if (文) 出 += 線 + 題 + '\n' + '-'.repeat(78) + '\n' + 文 + '\n';
  }
}
fs.mkdirSync(出す先, { recursive: true });
fs.writeFileSync(path.join(出す先, 'licenses.txt'), 出, 'utf8');
console.log(
  `licenses.txt：部品 ${数} 個・文 ${組.size} 通り・文なし ${文なし.length} 個・${Math.round(出.length / 1024)}KB → ${出す先}`
);
if (数 < 100) {
  console.error('停止：部品が少なすぎます（node_modules が無い？）');
  process.exit(1);
}
