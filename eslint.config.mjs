/**
 * ESLint の設定。
 *
 *   npm run lint
 *
 * ■ どこを見るか
 * 見る対象は package.json の lint スクリプトで明示している（src・App.js・e2e・道具・検査。2026-10-24 に広げた）。
 * src の未定義の変数は eslint.undef.mjs で見る（npm test でも通す）。
 *
 * ■ 何を見ないか
 * 見た目や書き方の好みは prettier に任せる。ここでは「黙って壊れる書き方」
 * だけを見る（未定義の変数、握りつぶした catch、緩い等号など）。
 */
import js from '@eslint/js';
import globals from 'globals';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

// 別のフォルダーから呼ばれても src を見つけられるよう、この設定ファイルの場所から数える
const 根 = import.meta.dirname;

// import / export で書いてある .js（App.js・src/ocr など）は ESM として読む。
// commonjs として読むと、構文の誤りで止まり、そのファイルは何も検査されない
//（eslint.undef.mjs と同じ見分け方。2026-09-24 に src 全体へ当てて気づいた）
const ESMのファイル = readdirSync(join(根, 'src'), { withFileTypes: true })
  .flatMap((d) =>
    d.isDirectory()
      ? readdirSync(join(根, 'src', d.name))
          .filter((f) => f.endsWith('.js'))
          .map((f) => join('src', d.name, f))
      : d.name.endsWith('.js')
        ? [join('src', d.name)]
        : []
  )
  .concat(['App.js'])
  .filter((道) => {
    try {
      return /^\s*(import|export)[\s{]/m.test(readFileSync(join(根, 道), 'utf8'));
    } catch {
      return false;
    }
  })
  .map((道) => 道.split('\\').join('/'));

export default [
  { ignores: ['dist/**', 'node_modules/**', 'ios/**', 'android/**', '_archive/**'] },
  {
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'commonjs',
      globals: { ...globals.node, ...globals.browser },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      ...js.configs.recommended.rules,
      // 使っていない変数は、消し忘れか書き間違い。引数は前詰めで残ることがある
      'no-unused-vars': ['warn', { args: 'none', varsIgnorePattern: '^_' }],
      // 握りつぶした catch は原因が見えなくなる。この repo で何度も痛い目を見ている
      'no-empty': ['error', { allowEmptyCatch: false }],
      // == は型が違うと黙って通る。日時や個人IDの比較で効く
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      // 中で一度も待たない async は、await の付け忘れか、要らない async
      'require-await': 'warn',
      'no-console': 'off',
    },
  },
  {
    // ESM で書いてある道具
    files: ['**/*.mjs'],
    languageOptions: { sourceType: 'module' },
  },
  {
    // ESM で書いてある画面の部品（上の ESMのファイル）
    files: ESMのファイル,
    languageOptions: { sourceType: 'module' },
  },
  {
    // 呼ぶ側がそろって await できるよう、約束を返す決まりにしている操作（中では待たないものもある）。
    // 店の操作（記録の保存など。検査は .then でつなぐ）と、写真の読み取りの道具（画を読む は .then でつなぐ）
    files: ['src/store*.js', 'src/useScoreStore.js', 'src/ocr/**/*.js', 'scripts/ocr-cells/**/*.mjs'],
    rules: { 'require-await': 'off' },
  },
  {
    // 検査の偽物（Firestore・fetch・端末の保存など）は、本物と同じく約束を返す
    files: ['test/**/*.js'],
    rules: { 'require-await': 'off' },
  },
  {
    // Playwright は、第一引数の分割から使う道具（page など）を読む。何も使わないときは空の分割 {} を書く決まり
    files: ['e2e/**/*.mjs'],
    rules: { 'no-empty-pattern': ['error', { allowObjectPatternsAsParameters: true }] },
  },
  {
    // 全角スペースを含む文字列をわざと扱うので、そこだけ外す
    files: ['scripts/unescape-japanese.mjs', 'scripts/format-src.mjs'],
    rules: { 'no-irregular-whitespace': 'off' },
  },
];
