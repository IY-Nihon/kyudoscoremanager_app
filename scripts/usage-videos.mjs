/**
 * 撮った絵（e2e/.usage-raw/<名>/*.jpg）を「使い方を見る」の動画 public/usage/<名>.mp4 にまとめる。
 *
 *   node scripts/usage-videos.mjs [名 ...]
 *
 * 絵は画面が変わったときだけ届くので、届いた時刻の差をそのまま 1 枚の長さにする。
 * 古い端末でも軽く流れるよう、幅 540・H.264・音なし。
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const 元 = process.env.USAGE_RAW || path.join('e2e', '.usage-raw');
const 先 = path.join('public', 'usage');
fs.mkdirSync(先, { recursive: true });
const 名たち = process.argv.slice(2).length ? process.argv.slice(2) : fs.readdirSync(元);

for (const 名 of 名たち) {
  const 絵 = fs
    .readdirSync(path.join(元, 名))
    .filter((f) => f.endsWith('.jpg'))
    .sort();
  if (絵.length === 0) continue;
  const 時 = 絵.map((f) => Number(f.split('_')[1].replace('.jpg', '')));
  let 書き = 'ffconcat version 1.0\n';
  絵.forEach((f, 番) => {
    const 長さ = 番 + 1 < 絵.length ? Math.max(0.02, 時[番 + 1] - 時[番]) : 1.2;
    書き += `file '${path.resolve(元, 名, f).replace(/\\/g, '/')}'\nduration ${長さ.toFixed(3)}\n`;
  });
  // 最後の絵は duration が効かないので、もう一度並べる
  書き += `file '${path.resolve(元, 名, 絵.at(-1)).replace(/\\/g, '/')}'\n`;
  const 台帳 = path.join(元, 名, 'list.txt');
  fs.writeFileSync(台帳, 書き);
  const 出 = path.join(先, `${名}.mp4`);
  execFileSync(
    'ffmpeg',
    [
      '-y',
      '-loglevel',
      'error',
      '-safe',
      '0',
      '-f',
      'concat',
      '-i',
      台帳,
      '-vf',
      'scale=540:-2:flags=lanczos,fps=24',
      '-c:v',
      'libx264',
      '-preset',
      'slow',
      '-crf',
      '28',
      '-pix_fmt',
      'yuv420p',
      '-movflags',
      '+faststart',
      '-an',
      出,
    ],
    { stdio: 'inherit' }
  );
  console.log(名, Math.round(fs.statSync(出).size / 1024) + 'KB');
}
