// 紙のマスを書き出す（32×32・アプリの 縮める と同じ）。描いた紙・9/6 の本物（cells-kami）・10/1 の本物（男子の用紙）
//   node scripts/ocr-cells/cnn/kami-dump.mjs [描く枚数]
// 10/1 の写真と正解は名前入りなので倉庫の外（KAMI_HAKARI、既定は kyudo-ocr-ag/.hakari）。書き出しは cnn/kdata（倉庫に入れない）
import fs from 'node:fs';
const 本体 = 'C:/Users/yutoi/Documents/kyudo/app/';
const ここ = new URL('.', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const 置き場 = (process.env.KAMI_HAKARI || 'C:/Users/yutoi/Documents/kyudo/kyudo-ocr-ag/.hakari').split(String.fromCharCode(92)).join('/');
fs.mkdirSync(ここ + 'kdata', { recursive: true });
process.chdir(本体);
const sharp = (await import('file:///' + 本体 + 'node_modules/sharp/lib/index.js')).default;
const { 紙をえがく } = await import('file:///' + 本体 + 'scripts/ocr-cells/kami-ban.mjs');
const { 紙の表たちを探す, 紙の格子, 紙の箱 } = await import('file:///' + 本体 + 'scripts/ocr-cells/kami.mjs');
const { 切り取る } = await import('file:///' + 本体 + 'scripts/ocr-cells/manabu.mjs');
const { 明暗を伸ばす } = await import('file:///' + 本体 + 'scripts/ocr-cells/koushi.mjs');
const { 縮める } = await import('file:///' + 本体 + 'scripts/ocr-cells/tatami.mjs');
const { 画を読む } = await import('file:///' + 本体 + 'scripts/ocr-cells/gazou-node.mjs');
const { 紙1001 } = await import('file:///' + 置き場 + '/kami-seikai-1001.mjs');
const 種類 = ['×', '○'];
const 辺 = 32;
const 書く = (名, 見本) => {
  const u8 = new Uint8Array(見本.length * 辺 * 辺);
  見本.forEach((x, i) => { const v = 縮める(x.画, x.幅, x.高, 辺); for (let j = 0; j < 辺 * 辺; j++) u8[i * 辺 * 辺 + j] = Math.round(v[j] * 255); });
  fs.writeFileSync(`${ここ}kdata/${名}.u8`, u8);
  fs.writeFileSync(`${ここ}kdata/${名}.json`, JSON.stringify({ 辺, 種類, 札: 見本.map((x) => x.札), 組: 見本.map((x) => x.組 || '') }));
  console.log(名, 見本.length);
};
// 描いた紙（kami-manabu.mjs と同じ切り方・ずらし）
const 枚数 = Number(process.argv[2]) || 60;
const 描いた = [];
for (let i = 0; i < 枚数; i++) {
  const b = 紙をえがく({ 種: 7000 + i * 4111 });
  const 生 = { 画素: 明暗を伸ばす(b.白黒), 幅: b.幅, 高: b.高 };
  const 箱 = 紙の箱({ 幅: b.答え.マス幅, 高: b.答え.マス高 });
  const ずらし = [[0, 0], [0, -0.15], [0, 0.15], [-0.12, 0.08], [0.12, -0.08]];
  for (let c = 0; c < b.答え.人数; c++) for (let s = 0; s < b.答え.マス[c].length; s++) {
    const k = 種類.indexOf(b.答え.マス[c][s]);
    for (const [dx, dy] of ずらし) {
      const 左 = Math.round(b.答え.列のx[c] + dx * b.答え.マス幅) - 箱.半幅;
      const 上 = Math.round(b.答え.射のy[s] + dy * b.答え.マス高) - 箱.半高;
      const 切 = 切り取る(生.画素, 生.幅, 生.高, 左, 上, 箱.半幅 * 2, 箱.半高 * 2);
      描いた.push({ 画: 切.画, 幅: 切.幅, 高: 切.高, 札: k });
    }
  }
}
書く('syn', 描いた);
// 9/6 の本物（kami-honmono.mjs が切ったマス。名前は無い）
const 本物0906 = [];
for (const [札, k] of [['batsu', 0], ['maru', 1]]) for (const 名 of fs.readdirSync(`docs/ocr-samples/cells-kami/${札}`)) {
  const { data, info } = await sharp(`docs/ocr-samples/cells-kami/${札}/${名}`).greyscale().raw().toBuffer({ resolveWithObject: true });
  本物0906.push({ 画: data, 幅: info.width, 高: info.height, 札: k, 組: 'k0906' });
}
書く('k0906', 本物0906);
// 10/1 の本物（男子の用紙。アプリと同じ道で切る）
const 元 = await 画を読む(置き場 + '/kami-1001.jpg');
const 四角たち = 紙の表たちを探す(元, { 人数たち: [4, 4] });
const 本物1001 = [];
for (let b = 0; b < 2; b++) {
  const q = 四角たち[b];
  const 切 = 切り取る(元.画素, 元.幅, 元.高, q.left, q.top, q.width, q.height);
  const g = await 紙の格子({ 画素: 切.画, 幅: 切.幅, 高: 切.高 }, { 人数: 4, 立数: 5, 立のマス: 4, 枠: q.枠 });
  for (let c = 0; c < 4; c++) g.マス[c].slice().reverse().forEach((m, k) => {
    const { 半幅, 半高 } = 紙の箱(m);
    const 切2 = 切り取る(g.生.画素, g.生.幅, g.生.高, Math.max(0, Math.round(m.x) - 半幅), Math.max(0, Math.round(m.y) - 半高), 半幅 * 2, 半高 * 2);
    本物1001.push({ 画: 切2.画, 幅: 切2.幅, 高: 切2.高, 札: 種類.indexOf(紙1001[b * 4 + c][k]), 組: 'k1001' });
  });
}
書く('k1001', 本物1001);
