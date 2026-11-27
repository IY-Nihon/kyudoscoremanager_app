/**
 * 配る直前に、dist/ に焼き込まれた接続先と、配り先のプロジェクトが
 * 合っているかを確かめる。
 *
 * firebase.json の hosting.predeploy から呼ばれる。どの入口から
 * `firebase deploy --only hosting` を叩いても必ず通る場所に置いてある。
 *
 * なぜ要るか：
 *   expo export は Metro のキャッシュを使い回す。検証向けに書き出した
 *   あと（npm run build:stg）に、そのまま `expo export` を流すと、
 *   本番のつもりでも検証環境を向いた束ができる。--clear を付けない限り
 *   .env を読み直さない。実際に再現した：
 *
 *     build:stg のあと expo export            → kyudoscoremanager-stg
 *     build:stg のあと expo export --clear    → kyudoscoremanager
 *
 *   検証を向いた束を本番へ配ると、利用者の記録が検証環境へ流れ込み、
 *   本番の記録は消えたように見える。ここで止める。
 */
import fs from 'node:fs';
import path from 'node:path';

/** 配り先。firebase が predeploy に渡してくれる */
const 配り先 = process.env.GCLOUD_PROJECT || process.env.FIREBASE_PROJECT || 既定のプロジェクト();

function 既定のプロジェクト() {
  try {
    const rc = JSON.parse(fs.readFileSync('.firebaserc', 'utf8'));
    return rc?.projects?.default || '';
  } catch {
    return '';
  }
}

const 置き場 = path.join('dist', '_expo', 'static', 'js', 'web');
if (!fs.existsSync(置き場)) {
  console.error(`停止：${置き場} がありません。先に書き出してください`);
  process.exit(1);
}

/**
 * 実際に配信される束を選ぶ。
 *
 * ディレクトリを走査して最初の1つを取ると、古い束が残っていたときに
 * 配信されないファイルを調べてしまう。index.html が読み込む名前を見る。
 */
const 束 = (() => {
  try {
    const html = fs.readFileSync(path.join('dist', 'index.html'), 'utf8');
    const m = html.match(/AppEntry-[A-Za-z0-9]+\.js/);
    if (m && fs.existsSync(path.join(置き場, m[0]))) return m[0];
  } catch {
    /* index.html が読めなければ下の走査に任せる */
  }
  return fs.readdirSync(置き場).find((f) => f.startsWith('AppEntry-') && f.endsWith('.js'));
})();

if (!束) {
  console.error('停止：AppEntry の束が見つかりません');
  process.exit(1);
}

const 中身 = fs.readFileSync(path.join(置き場, 束), 'utf8');
const m = 中身.match(/projectId:"([a-z0-9-]+)"/);
const 焼き込み = m ? m[1] : null;

if (!焼き込み) {
  console.error('停止：束から接続先を読み取れませんでした');
  process.exit(1);
}

if (!配り先) {
  console.error('停止：配り先のプロジェクトが分かりません');
  process.exit(1);
}

if (焼き込み !== 配り先) {
  console.error('');
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.error('  配るのをやめました');
  console.error('');
  console.error(`  dist/ の接続先 : ${焼き込み}`);
  console.error(`  配り先         : ${配り先}`);
  console.error('');
  console.error('  中身と配り先が食い違っています。');
  console.error('  本番へ配るなら、まず書き出し直してください：');
  console.error('');
  console.error('    npx expo export --platform web --clear');
  console.error('');
  console.error('  --clear が要ります。付けないと、検証向けに書き出した');
  console.error('  ときの設定がキャッシュから使い回されます。');
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.error('');
  process.exit(1);
}

// App Check の試しの印（EXPO_PUBLIC_APPCHECK_DEBUG_TOKEN）が束に焼き込まれていたら配らない。
// アプリは手元（localhost）でしか使わないが、EXPO_PUBLIC_ の値は束にそのまま入るので、配った束から誰でも読める。
// 読んだ印を Firebase に登録された試しの印として使われると、App Check を強いていても素通りされる（2026-11-20 の別の AI の点検の S11）。
// 値の無いときは void 0 で入る
const 試しの印 = 中身.match(/EXPO_PUBLIC_APPCHECK_DEBUG_TOKEN:("[^"]*"|'[^']*'|`[^`]*`)/);
if (試しの印 && 試しの印[1].length > 2) {
  console.error('');
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.error('  配るのをやめました');
  console.error('');
  console.error('  束に App Check の試しの印（EXPO_PUBLIC_APPCHECK_DEBUG_TOKEN）が入っています。');
  console.error('  .env から外して、書き出し直してください：');
  console.error('');
  console.error('    npx expo export --platform web --clear');
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.error('');
  process.exit(1);
}

// 中継（Gemini）の住所も配り先と合わせる（2026-11-28）。検証環境の .env.development.local は検証用の中継を向くので、
// それが束に入ったまま本番へ配ると、本番の証を検証用の中継が断り、AI チャットと写真の読み取りがみな止まる（10/17 の止まり方に近い）
const 中継の住所たち = [
  ...new Set(中身.match(/kyudo-gemini-chukei[a-z0-9-]*\.kyudo-chukei\.workers\.dev/g) || []),
];
const 来るべき中継 =
  配り先 === 'kyudoscoremanager-stg'
    ? 'kyudo-gemini-chukei-stg.kyudo-chukei.workers.dev'
    : 'kyudo-gemini-chukei.kyudo-chukei.workers.dev';
if (中継の住所たち.length !== 1 || 中継の住所たち[0] !== 来るべき中継) {
  console.error('');
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.error('  配るのをやめました');
  console.error('');
  console.error(`  束の中継 : ${中継の住所たち.join('・') || '見つからない'}`);
  console.error(`  来るべき : ${来るべき中継}（配り先 ${配り先}）`);
  console.error('');
  console.error('  .env の EXPO_PUBLIC_GEMINI_CHUKEI_URL を確かめて、書き出し直してください：');
  console.error('');
  console.error('    npx expo export --platform web --clear');
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.error('');
  process.exit(1);
}

console.log(`接続先を確かめました: ${焼き込み}（中継 ${中継の住所たち[0]}）`);
