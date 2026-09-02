import fs from 'fs';
import path from 'path';

import { fileURLToPath, pathToFileURL } from 'url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'src');

// ── 実際の theme.js を読み込む（isDark を true 固定にしてダーク時の挙動を見る）──
const themeSrc = fs
  .readFileSync(path.join(SRC, 'theme.js'), 'utf8')
  .replace("const isDark = () => getEffectiveTheme() === 'dark';", 'const isDark = () => true;');
const tmp = path.join(ROOT, 'node_modules', '.cache-theme-dark.cjs');
fs.mkdirSync(path.dirname(tmp), { recursive: true });
fs.writeFileSync(tmp, themeSrc);
const theme = await import(pathToFileURL(tmp).href);
const { mapColor } = theme;

// ── WCAG コントラスト ──
const hex2rgb = (h) => {
  let s = h.replace('#', '');
  if (s.length === 3) s = [...s].map((c) => c + c).join('');
  return { r: parseInt(s.slice(0, 2), 16), g: parseInt(s.slice(2, 4), 16), b: parseInt(s.slice(4, 6), 16) };
};
const lum = ({ r, g, b }) => {
  const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const ratio = (a, b) => { const l1 = lum(hex2rgb(a)), l2 = lum(hex2rgb(b)); const hi = Math.max(l1, l2), lo = Math.min(l1, l2); return (hi + 0.05) / (lo + 0.05); };

// ── 自作コードから「役割つき」の色使用を抽出 ──
// ログイン画面は元から独自のダーク基調（#030508 + 金）で設計されており
// テーマ変換の対象外。ここで検査すると金背景上の暗色文字を誤検知するため除く。
const EXCLUDE = new Set(['LoginScreen.js', 'KyudoBackgroundAnimation.js']);

const appFiles = fs.readdirSync(SRC).filter((f) => {
  if (EXCLUDE.has(f)) return false;
  const b = f.replace(/\.js$/, '');
  return f.endsWith('.js') && (b.startsWith('JP_') || /^(Arrow|Attendance|Kyudo)/.test(b));
});
appFiles.push(path.join('..', 'App.js'));

const TEXT_KEYS = ['color', 'placeholderTextColor', 'tintColor'];
const BG_KEYS = ['backgroundColor'];
const usage = { text: new Map(), bg: new Map() };

const record = (kind, color, file) => {
  const m = usage[kind];
  if (!m.has(color)) m.set(color, new Set());
  m.get(color).add(file);
};

for (const f of appFiles) {
  const p = f.startsWith('..') ? path.join(SRC, f) : path.join(SRC, f);
  let c;
  try { c = fs.readFileSync(p, 'utf8'); } catch { continue; }
  const base = path.basename(f);
  for (const key of TEXT_KEYS) {
    const re = new RegExp(key + `\\s*:\\s*["'](#[0-9a-fA-F]{3,8})["']`, 'g');
    let m; while ((m = re.exec(c))) record('text', m[1].toLowerCase(), base);
  }
  for (const key of BG_KEYS) {
    const re = new RegExp(key + `\\s*:\\s*["'](#[0-9a-fA-F]{3,8})["']`, 'g');
    let m; while ((m = re.exec(c))) record('bg', m[1].toLowerCase(), base);
  }
}

// ── ダークモードで実際に使われる面の色 ──
const SURFACES = { '画面背景 #000000': '#000000', 'カード面 #1C1C1E': '#1c1c1e', '沈んだ面 #2C2C2E': '#2c2c2e' };
const norm = (h) => { let s = h.replace('#', ''); if (s.length === 3) s = [...s].map(c => c + c).join(''); return '#' + s.slice(0, 6).toLowerCase(); };

console.log('=== 1. 文字色の変換とコントラスト（ダークモード） ===');
console.log('元の色      → 変換後      ' + Object.keys(SURFACES).map(s => s.padStart(16)).join('') + '   判定');
let textFail = [], textWarn = [];
for (const [color, files] of [...usage.text.entries()].sort()) {
  const mapped = norm(mapColor(color, 'text'));
  const ratios = Object.values(SURFACES).map(s => ratio(mapped, s));
  // 白系文字は #000 の上に来ないケースもあるため、最も明るい面（#2C2C2E）を基準に判定
  const worst = Math.min(...ratios);
  const best = Math.max(...ratios);
  const verdict = best < 3.0 ? 'NG' : worst < 3.0 ? '注意' : 'OK';
  if (verdict === 'NG') textFail.push({ color, mapped, best, files: [...files] });
  else if (verdict === '注意') textWarn.push({ color, mapped, worst, files: [...files] });
  console.log(
    norm(color).padEnd(11) + ' → ' + mapped.padEnd(11) +
    ratios.map(r => r.toFixed(2).padStart(16)).join('') + '   ' + verdict
  );
}

console.log('\n=== 2. 背景色の変換（ダークモード） ===');
for (const [color, files] of [...usage.bg.entries()].sort()) {
  const mapped = norm(mapColor(color, 'bg'));
  const changed = mapped !== norm(color);
  console.log(norm(color).padEnd(11) + ' → ' + mapped.padEnd(11) + (changed ? '  変換' : '  据え置き') + '   (' + [...files].length + 'ファイル)');
}

console.log('\n=== 3. 判定 ===');
console.log('文字色として使われている色: ' + usage.text.size + ' 種');
console.log('背景色として使われている色: ' + usage.bg.size + ' 種');
console.log('');
if (textFail.length === 0) {
  console.log('✅ どの面に置いてもコントラスト3.0未満になる文字色: なし');
} else {
  console.log('★ 全ての面でコントラスト不足の文字色: ' + textFail.length + ' 件');
  textFail.forEach(x => console.log('   ' + x.color + ' → ' + x.mapped + '  最良比 ' + x.best.toFixed(2) + '  ' + x.files.slice(0, 3).join(', ')));
}
if (textWarn.length) {
  console.log('\n△ 一部の面で3.0を下回る文字色: ' + textWarn.length + ' 件（その面に載らなければ問題なし）');
  textWarn.forEach(x => console.log('   ' + x.color + ' → ' + x.mapped + '  最悪比 ' + x.worst.toFixed(2) + '  ' + x.files.slice(0, 3).join(', ')));
}

// ── 4. 二重変換の検査 ──
console.log('\n=== 4. 二重変換の検査（変換後の色をもう一度変換しても変わらないか） ===');
let dbl = 0;
for (const kind of ['text', 'bg']) {
  for (const [color] of usage[kind]) {
    const once = norm(mapColor(color, kind));
    const twice = norm(mapColor(once, kind));
    if (once !== twice) { console.log('   ★ ' + kind + ': ' + color + ' → ' + once + ' → ' + twice); dbl++; }
  }
}
console.log(dbl === 0 ? '✅ 二重変換なし（冪等）' : '★ ' + dbl + ' 件で二重変換が発生');

process.exit(textFail.length || dbl ? 1 : 0);
