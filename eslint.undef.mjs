/**
 * src ぜんぶに「未定義の変数」だけを当てる設定。
 *
 *   npm run lint:undef
 *
 * ■ なぜ別に置くのか
 * eslint.config.mjs は手で書いたファイルだけを見ている。src の大半は
 * ソースマップから復元した圧縮コードで、一般的な規則を当てると数千件出て
 * 本物が埋もれるためだった。
 *
 * ただし no-undef は話が別で、**圧縮コードでも意味がある**。
 * 実際、2026-08-30 に2件の即クラッシュがこれで見つかった。
 *   ・引き継ぎの窓が、描くときに無い変数（残）を読んでいた
 *   ・ますが、関数に切り出したあとの古い変数（archer）を読んでいた
 * どちらも「その分岐に入ったときだけ落ちる」ので、検査も e2e も素通りした。
 * 未定義の変数は、走らせなくても分かる。走らせて見つけるものではない。
 *
 * ■ Metro の走らせ方に出てくる名前
 * 復元コードには metroImport / dependencyMap / id が素で出てくる。
 * これは束ね方の都合で、書き間違いではないので既知のものとして通す。
 *
 * ■ import で書いたファイルの見分け
 * 一覧を手で持たない。持つと、次に import のファイルを足した人が
 * 「Parsing error」という中身と関係の無い失敗に当たる。ここで中身を見て振り分ける。
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import globals from 'globals';

/** そのファイルが import／export で書かれているか（行頭のものだけ見る） */
function 取り込みの書き方か(道) {
  try {
    return /^\s*(import|export)[\s{]/m.test(readFileSync(道, 'utf8'));
  } catch {
    return false;
  }
}

const 見る場所 = [
  'App.js',
  ...readdirSync('src')
    .filter((f) => f.endsWith('.js'))
    .map((f) => join('src', f)),
];
const ESM = 見る場所.filter(取り込みの書き方か).map((p) => p.split('\\').join('/'));

export default [
  { ignores: ['dist/**', 'node_modules/**', 'ios/**', 'android/**', '_archive/**'] },
  {
    files: ['src/**/*.js', 'App.js'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
        ...globals.browser,
        // Metro が束ねるときに差し込む名前
        metroImport: 'readonly',
        dependencyMap: 'readonly',
        id: 'readonly',
        __DEV__: 'readonly',
        // UMD で書かれた取り込みがある（JP_module_1033.js）
        define: 'readonly',
      },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    // ここでは1つだけ見る。ほかを足すと、また埋もれる
    rules: { 'no-undef': 'error' },
  },
  {
    // import／export で書いてあるファイル。commonjs のままだと読めない。
    // 一覧は上で中身から拾う（手で持たない）
    files: ESM.length ? ESM : ['__該当なし__'],
    languageOptions: { sourceType: 'module' },
  },
];
