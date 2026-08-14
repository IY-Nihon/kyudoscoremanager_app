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
const 配り先 =
  process.env.GCLOUD_PROJECT || process.env.FIREBASE_PROJECT || 既定のプロジェクト();

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

const 束 = fs.readdirSync(置き場).find((f) => f.startsWith('AppEntry-') && f.endsWith('.js'));
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

console.log(`接続先を確かめました: ${焼き込み}`);
