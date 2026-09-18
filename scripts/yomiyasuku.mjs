/**
 * ソースマップから復元した最小化コードを、読める形に書き直す（構文木の変換）。
 *
 *   node scripts/yomiyasuku.mjs src/LabelColumn.js            … 1 file だけ（書き込む）
 *   node scripts/yomiyasuku.mjs --all                          … (0, X.jsx)( を使っている file 全部
 *   node scripts/yomiyasuku.mjs --dry src/LabelColumn.js       … 書かずに結果を標準出力へ
 *
 * ■ 何をするか（動きは変えない）
 *   1. 読み込みの別名を本名に … `l = e(require('./View'))` → `const View = require('./View').default`
 *      `x = require('./useScoreStore')` で `x.useScoreStore` としか使っていなければ
 *      `const { useScoreStore } = require('./useScoreStore')`
 *   2. `(0, A.jsx)(View, { style, children })` → `<View style={…}>…</View>`
 *      （babel の設定で JSX は同じテーマ用の runtime を通るので、動きは同じ）
 *   3. `!0` `!1` `void 0` → `true` `false` `undefined`
 *   4. `(a(), b());` → 2 文、`x && f();` → `if (x) f();`
 *   5. `{ addArcher: R }` のような取り出しの別名（1〜2 字）を本名に（`R` → `addArcher`）
 *   6. `Object.defineProperty(exports, 'Name', { get: () => k })` → `exports.Name = Name`、k も Name に
 *
 * ■ 確かめ方
 *   書き換えたあと npm test と e2e を通す。名前の付け替えは scope.rename（babel）で行うので、
 *   同じ名前の別の変数を巻き込まない。
 */
import fs from 'node:fs';
import path from 'node:path';
import { parse } from '@babel/parser';
import traverseModule from '@babel/traverse';
import generateModule from '@babel/generator';
import * as t from '@babel/types';
import * as prettier from 'prettier';

const traverse = traverseModule.default || traverseModule;
const generate = generateModule.default || generateModule;

const 引数 = process.argv.slice(2);
const 書かない = 引数.includes('--dry');
const 全部 = 引数.includes('--all');
const 道たち = 全部
  ? fs
      .readdirSync('src')
      .filter((f) => f.endsWith('.js'))
      .map((f) => 'src/' + f)
      .filter((p) => /\(0, [A-Za-z_$][\w$]*\.jsxs?\)\(/.test(fs.readFileSync(p, 'utf8')))
  : 引数.filter((a) => !a.startsWith('--'));

/** 読み込み先から付ける名前。既定は file 名（拡張子なし） */
const 名の表 = {
  react: 'React',
  'react-native': 'RN',
  './alertBridge': 'Alert',
  'react-native-svg': 'Svg',
  // 取り出し（pick）にできないとき（名前が衝突するなど）の名前空間の名
  'firebase/auth': 'FirebaseAuth',
  'firebase/firestore': 'Firestore',
  'firebase/database': 'RTDB',
  'firebase/storage': 'Storage',
  '@react-navigation/native': 'Navigation',
  '@react-navigation/bottom-tabs': 'BottomTabs',
  '@expo/vector-icons': 'Icons',
  './themedJsx': null, // JSX に直すので消える
};

function 名を決める(道, 既定 = null) {
  if (道 in 名の表) return 名の表[道];
  if (既定) return 既定;
  const 名 = path.basename(道).replace(/\.[a-z]+$/, '');
  if (/^[A-Za-z_$][\w$]*$/.test(名)) return 名;
  // async-storage のような名は、区切りを外して頭を大文字に（AsyncStorage）
  const 直 = 名
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join('');
  return /^[A-Za-z_$][\w$]*$/.test(直) ? 直 : null;
}

function 解析(元) {
  return parse(元, { sourceType: 'unambiguous', plugins: ['jsx'], attachComment: true });
}

/** `function e(e){ return e && e.__esModule ? e : { default: e } }` か */
function 既定の橋か(節) {
  if (!t.isFunctionDeclaration(節) || 節.params.length !== 1) return false;
  const 中 = generate(節.body).code.replace(/\s+/g, '');
  return 中.includes('__esModule?') && 中.includes('{default:');
}

/** `(function(e){ if (e && e.__esModule) return e; var t = {}; … })(require('x'))` なら require の道 */
function 名前空間の橋の道(節) {
  if (!t.isCallExpression(節) || !t.isFunctionExpression(節.callee) || 節.arguments.length !== 1) return null;
  const 中 = generate(節.callee.body).code.replace(/\s+/g, '');
  if (!中.includes('__esModule')) return null;
  const a = 節.arguments[0];
  return t.isCallExpression(a) && t.isIdentifier(a.callee, { name: 'require' }) && t.isStringLiteral(a.arguments[0])
    ? a.arguments[0].value
    : null;
}

/**
 * default の読み込みの右辺。橋の関数 e(m) は「__esModule なら m、違えば { default: m }」だった。
 * 手元の file（./…）は __esModule と default を持つので .default でよい。npm の package は
 * CommonJS のもの（react・react-native）はそのまま、ほかは default が無いこともあるので
 * `require('m').default ?? require('m')` にする（require は 2 度呼んでも同じ物が返る）
 */
const CommonJSの部品 = new Set(['react', 'react-native']);
function 既定の読み込み(道) {
  const 呼ぶ = () => t.callExpression(t.identifier('require'), [t.stringLiteral(道)]);
  if (CommonJSの部品.has(道)) return 呼ぶ();
  if (道.startsWith('.')) return t.memberExpression(呼ぶ(), t.identifier('default'));
  return t.logicalExpression('??', t.memberExpression(呼ぶ(), t.identifier('default')), 呼ぶ());
}

function require道(節) {
  return t.isCallExpression(節) && t.isIdentifier(節.callee, { name: 'require' }) && t.isStringLiteral(節.arguments[0])
    ? 節.arguments[0].value
    : null;
}

export async function 読みやすく(元, 名札) {
  const 木 = 解析(元);
  const 本体 = 木.program.body;

  // ── 0. 頭の決まり文句を片付ける ───────────────────────────
  // `const _e = exports;` `('use strict');` `function e(e){…}`（既定の橋）、
  // `(Object.defineProperty(_e, '__esModule', …), Object.defineProperty(_e, 'Name', { get }), require('react'))`
  let 橋の名 = null;
  const 出す名たち = []; // [{ 名, 実体 }]
  const 消す = new Set();
  let exportsの別名 = null;
  for (const 節 of 本体) {
    if (t.isVariableDeclaration(節) && 節.declarations.length === 1) {
      const d = 節.declarations[0];
      if (t.isIdentifier(d.id) && t.isIdentifier(d.init, { name: 'exports' })) {
        exportsの別名 = d.id.name;
        消す.add(節);
      }
    }
    if (t.isExpressionStatement(節) && t.isStringLiteral(節.expression, { value: 'use strict' }) && 節 !== 本体[0]) 消す.add(節);
    if (t.isExpressionStatement(節) && t.isStringLiteral(節.expression, { value: 'use strict' }) && 節.expression.extra?.parenthesized) 消す.add(節);
    if (既定の橋か(節)) {
      橋の名 = 節.id.name;
      消す.add(節);
    }
  }
  const exportsか = (n) => t.isIdentifier(n, { name: 'exports' }) || (exportsの別名 && t.isIdentifier(n, { name: exportsの別名 }));
  for (const 節 of 本体) {
    if (!t.isExpressionStatement(節)) continue;
    const 式たち = t.isSequenceExpression(節.expression) ? 節.expression.expressions : [節.expression];
    let 決まり文句 = true;
    const 名たち = [];
    for (const 式 of 式たち) {
      if (t.isCallExpression(式) && require道(式)) continue; // 裸の require('react')
      if (
        t.isCallExpression(式) &&
        t.isMemberExpression(式.callee) &&
        t.isIdentifier(式.callee.object, { name: 'Object' }) &&
        t.isIdentifier(式.callee.property, { name: 'defineProperty' }) &&
        exportsか(式.arguments[0]) &&
        t.isStringLiteral(式.arguments[1])
      ) {
        const 鍵 = 式.arguments[1].value;
        const 指定 = 式.arguments[2];
        if (鍵 === '__esModule') continue;
        const get = t.isObjectExpression(指定) && 指定.properties.find((p) => t.isObjectProperty(p) && t.isIdentifier(p.key, { name: 'get' }));
        if (get && t.isFunction(get.value) && t.isBlockStatement(get.value.body) && get.value.body.body.length === 1 && t.isReturnStatement(get.value.body.body[0]) && t.isIdentifier(get.value.body.body[0].argument)) {
          名たち.push({ 名: 鍵, 実体: get.value.body.body[0].argument.name });
          continue;
        }
      }
      決まり文句 = false;
      break;
    }
    if (決まり文句 && 式たち.length) {
      消す.add(節);
      出す名たち.push(...名たち);
    }
  }

  // 決まり文句はここで消す（あとの変換で節が入れ替わると、控えた節が見つからなくなる）
  木.program.body = 木.program.body.filter((n) => !消す.has(n));
  // `const _e = exports` を消したので、残りの _e.x = … は exports.x = … に
  if (exportsの別名) {
    traverse(木, {
      Identifier(p) {
        if (p.node.name === exportsの別名 && !p.scope.getBinding(exportsの別名) && p.isReferencedIdentifier()) p.node.name = 'exports';
      },
    });
  }
  if (木.program.directives) for (const d of 木.program.directives) if (d.leadingComments) d.leadingComments = d.leadingComments.filter((c) => !/Module ID:/.test(c.value));

  // ── 1. 読み込みの別名 ───────────────────────────────────
  // 別名 → { 道, 種: 'default' | 'namespace' }
  const 読み込み = new Map();
  const reactの別名 = new Set();
  for (const 節 of 本体) {
    if (!t.isVariableDeclaration(節)) continue;
    for (const d of 節.declarations) {
      if (!t.isIdentifier(d.id) || !d.init) continue;
      const 直 = require道(d.init);
      if (直) {
        読み込み.set(d.id.name, { 道: 直, 種: 'namespace', 宣言: d, 文: 節 });
        continue;
      }
      const 空 = 名前空間の橋の道(d.init);
      if (空) {
        読み込み.set(d.id.name, { 道: 空, 種: 'namespace', 宣言: d, 文: 節 });
        continue;
      }
      if (橋の名 && t.isCallExpression(d.init) && t.isIdentifier(d.init.callee, { name: 橋の名 }) && d.init.arguments.length === 1) {
        const a = d.init.arguments[0];
        const 道 = require道(a);
        if (道) {
          読み込み.set(d.id.name, { 道, 種: 'default', 宣言: d, 文: 節 });
          continue;
        }
        if (t.isIdentifier(a) && 読み込み.get(a.name)?.種 === 'namespace') {
          // o = e(t) で t = require('m')。o.default は m の default
          読み込み.set(d.id.name, { 道: 読み込み.get(a.name).道, 種: 'default', 宣言: d, 文: 節 });
          continue;
        }
      }
      // X = require('m').Y や X = 名前空間.Y のような取り出し
      if (t.isMemberExpression(d.init) && !d.init.computed && t.isIdentifier(d.init.property)) {
        const 道 = require道(d.init.object) || (t.isIdentifier(d.init.object) && 読み込み.get(d.init.object.name)?.種 === 'namespace' ? 読み込み.get(d.init.object.name).道 : null);
        if (道) 読み込み.set(d.id.name, { 道, 種: 'member', 員: d.init.property.name, 宣言: d, 文: 節 });
      }
    }
  }

  // 使われ方を集める（namespace の別名が X.prop の形でしか使われないなら、取り出しに直せる）
  const 使い方 = new Map(); // 別名 → { 員: Set, 素のまま: boolean }
  traverse(木, {
    Identifier(p) {
      const 名 = p.node.name;
      if (!読み込み.has(名)) return;
      const 情報 = 読み込み.get(名);
      if (p.parent === 情報.宣言 && p.parentKey === 'id') return;
      if (!p.isReferencedIdentifier()) return;
      if (!p.scope.getBinding(名) || p.scope.getBinding(名).path.node !== 情報.宣言) return;
      const u = 使い方.get(名) || { 員: new Set(), 素のまま: false };
      const 親 = p.parent;
      if (t.isMemberExpression(親) && 親.object === p.node && !親.computed && t.isIdentifier(親.property)) u.員.add(親.property.name);
      else {
        u.素のまま = true;
        if (process.env.YOMI_DEBUG) console.error('素のまま', 名, 親.type, p.node.loc && p.node.loc.start.line);
      }
      使い方.set(名, u);
    },
  });

  // 名前を決める。衝突したら付けない
  const 使用中の名 = new Set();
  traverse(木, {
    Scope(p) {
      for (const 名 of Object.keys(p.scope.bindings)) 使用中の名.add(名);
    },
  });
  const 付け替え = new Map(); // 別名 → { 新, 種, 道, 員たち }
  // 同じ道を default と namespace の両方で読んでいる file がある（t = e(require('react')) と
  // React = require('react')）。その道は namespace の別名を本名にして 1 つにまとめ、
  // default の別名の X.default はその名前に置き換える
  const 道ごと = new Map();
  for (const [別名, 情報] of 読み込み) {
    if (!道ごと.has(情報.道)) 道ごと.set(情報.道, []);
    道ごと.get(情報.道).push([別名, 情報]);
  }
  const 相乗り = new Map(); // default の別名 → まとめ先の名
  for (const [道, 組] of 道ごと) {
    const 既定たち = 組.filter(([, v]) => v.種 === 'default');
    const 空間たち = 組.filter(([, v]) => v.種 === 'namespace');
    // default と namespace が同じ物なのは react と react-native（CommonJS）だけ。
    // react-native-svg などは default（Svg）と名前空間（Circle …）が別物なので、まとめない
    if (既定たち.length && 空間たち.length && (道 === 'react' || 道 === 'react-native')) {
      const 名 = 名を決める(道) || 空間たち[0][0];
      if (名 && (!使用中の名.has(名) || 組.some(([k]) => k === 名))) {
        付け替え.set(空間たち[0][0], { 種: 'namespace', 新: 名, 道 });
        使用中の名.add(名);
        for (const [k] of 既定たち) 相乗り.set(k, 名);
        for (const [k] of 空間たち.slice(1)) 相乗り.set(k, 名);
      }
    }
  }
  // default を先に決める（Svg のように、default と名前空間が別物の module で default に本名を渡す）
  const 順 = [...読み込み].sort(([, a], [, b]) => (a.種 === 'default' ? 0 : 1) - (b.種 === 'default' ? 0 : 1));
  for (const [別名, 情報] of 順) {
    if (付け替え.has(別名)) continue;
    if (相乗り.has(別名)) {
      付け替え.set(別名, { 種: 情報.種 === 'default' ? 'default-alias' : 'namespace-alias', 新: 相乗り.get(別名), 道: 情報.道 });
      continue;
    }
    const u = 使い方.get(別名) || { 員: new Set(), 素のまま: false };
    if (情報.道 === './themedJsx' || 情報.道 === 'react/jsx-runtime') {
      付け替え.set(別名, { 種: 'jsx', 道: 情報.道 });
      continue;
    }
    if (情報.種 === 'member') {
      // h = 規.generateUniquePersonalId のような 1〜2 字の別名は、員の名にする
      if (/^[A-Za-z_$]{1,2}$/.test(別名) && !使用中の名.has(情報.員)) {
        付け替え.set(別名, { 種: 'member', 新: 情報.員, 道: 情報.道 });
        使用中の名.add(情報.員);
      }
      continue;
    }
    if (情報.種 === 'default') {
      const 新 = 名を決める(情報.道);
      if (!新 || (使用中の名.has(新) && 新 !== 別名)) continue;
      // X.default だけで使われているか（X 自体を渡している所があれば default 以外の使い方）
      付け替え.set(別名, { 種: 'default', 新, 道: 情報.道, 員たち: u.員 });
      使用中の名.add(新);
      continue;
    }
    // すでに意味のある名（案内・組・同期規則 など、英字 1〜2 字でないもの）の名前空間はそのまま
    if (!/^[A-Za-z_$]{1,2}$/.test(別名)) continue;
    if (process.env.YOMI_DEBUG) console.error('名前空間', 別名, 情報.道, '員', [...u.員].join(','), '素のまま', u.素のまま);
    // namespace：X.a X.b の形だけなら取り出しに。素のまま渡していれば名前だけ本名に。
    // npm の package は取り出さない（検査の道具が module の関数を差し替えるので、
    // 呼ぶたびに引く形 `RTDB.get(…)` のままにして、動きを変えない）
    // 員の名は日本語でもよい（ライブ名に使えない字 など）
    if (情報.道.startsWith('.') && !u.素のまま && u.員.size > 0 && u.員.size <= 40 && [...u.員].every((m) => /^[\p{L}_$][\p{L}\p{N}_$]*$/u.test(m) && m !== 'default')) {
      const 衝突 = [...u.員].filter((m) => 使用中の名.has(m) && m !== 別名);
      if (process.env.YOMI_DEBUG && 衝突.length) console.error('取り出せない', 別名, 情報.道, '衝突', 衝突.join(','));
      if (衝突.length === 0) {
        付け替え.set(別名, { 種: 'pick', 道: 情報.道, 員たち: u.員 });
        for (const m of u.員) 使用中の名.add(m);
        continue;
      }
    }
    let 新 = 名を決める(情報.道);
    // default が本名を取っていれば、名前空間は「〜の部品」
    if (新 && 使用中の名.has(新) && 新 !== 別名 && !使用中の名.has(新 + 'の部品')) 新 = 新 + 'の部品';
    if (新 && (!使用中の名.has(新) || 新 === 別名)) {
      付け替え.set(別名, { 種: 'namespace', 新, 道: 情報.道 });
      使用中の名.add(新);
    }
  }

  // 既定の橋（function e）を消したあとで、直せなかった default の読み込みが残るなら橋を戻す
  if (橋の名 && [...読み込み].some(([k, v]) => v.種 === 'default' && !付け替え.has(k))) {
    const 橋 = 本体 && 消す && [...消す].find((n) => 既定の橋か(n));
    if (橋) 木.program.body.unshift(橋);
  }
  if (process.env.YOMI_DEBUG) console.error('読み込み', [...読み込み].map(([k, v]) => k + ':' + v.種 + ':' + v.道).join(' '), '/ 付け替え', [...付け替え].map(([k, v]) => k + '→' + v.種 + ':' + (v.新 || [...(v.員たち || [])].join('|'))).join(' '));

  // ── 2. JSX へ ─────────────────────────────────────────
  const jsxの別名たち = new Set([...付け替え].filter(([, v]) => v.種 === 'jsx').map(([k]) => k));

  function jsx呼び出しか(node) {
    if (!t.isCallExpression(node)) return null;
    let callee = node.callee;
    if (t.isSequenceExpression(callee) && callee.expressions.length === 2 && t.isNumericLiteral(callee.expressions[0], { value: 0 })) callee = callee.expressions[1];
    if (!t.isMemberExpression(callee) || !t.isIdentifier(callee.object) || !jsxの別名たち.has(callee.object.name)) return null;
    if (!t.isIdentifier(callee.property)) return null;
    if (callee.property.name === 'jsx' || callee.property.name === 'jsxs') return callee.property.name;
    return null;
  }
  const Fragmentか = (node) => t.isMemberExpression(node) && t.isIdentifier(node.object) && jsxの別名たち.has(node.object.name) && t.isIdentifier(node.property, { name: 'Fragment' });

  let Reactが要る = false;
  const 持ち上げ = []; // [{ 名, 道, 員 }] … require('./X').default のような型を、頭の読み込みに直す
  let 今の経路 = null; // 変換中の呼び出しの経路。小文字の型名を付け替えるときに scope を使う
  const 読み込みの束か = (束) => {
    if (!束.path.isVariableDeclarator()) return false;
    let 有 = false;
    t.traverseFast(束.path.node, (n) => { if (t.isCallExpression(n) && t.isIdentifier(n.callee, { name: 'require' })) 有 = true; });
    return 有;
  };
  function 型名(node, 頭か = true) {
    if (t.isIdentifier(node)) {
      // <x style=…> と書くと HTML の <x> 要素になってしまう。変数を型にするときは頭を大文字にする
      // （読み込みの別名は、後の段で付け替えるのでここでは触らない）
      if (頭か && /^[a-z]/.test(node.name)) {
        const 束 = 今の経路 && 今の経路.scope.getBinding(node.name);
        if (!束) return null;
        if (読み込みの束か(束)) return null;
        let 新 = node.name[0].toUpperCase() + node.name.slice(1) + '要素';
        while (束.scope.hasBinding(新) || 使用中の名.has(新)) 新 += '_';
        束.scope.rename(node.name, 新);
        使用中の名.add(新);
      }
      return t.jsxIdentifier(node.name);
    }
    if (t.isMemberExpression(node) && !node.computed && t.isIdentifier(node.property) && require道(node.object)) {
      const 道 = require道(node.object);
      const 員 = node.property.name;
      const 名 = 員 === 'default' ? 名を決める(道) : 員;
      if (!名) return null;
      const 既 = 持ち上げ.find((h) => h.名 === 名);
      if (既 && (既.道 !== 道 || 既.員 !== 員)) return null;
      if (!既) {
        if (使用中の名.has(名)) return null;
        持ち上げ.push({ 名, 道, 員 });
        使用中の名.add(名);
      }
      return t.jsxIdentifier(名);
    }
    if (t.isStringLiteral(node)) return t.jsxIdentifier(node.value);
    if (t.isMemberExpression(node) && !node.computed && t.isIdentifier(node.property)) {
      const 左 = 型名(node.object, false);
      if (!左) return null;
      return t.jsxMemberExpression(左, t.jsxIdentifier(node.property.name));
    }
    if (t.isThisExpression(node)) return t.jsxIdentifier('this');
    return null;
  }
  const 文字でよいか = (s) => !/[{}<>\n\r&]/.test(s) && s.trim() === s && s !== '';

  // JSX の子の間に置ける注釈は {/* … */} だけ。行の注釈も塊の注釈に直す
  const 注釈の子 = (comments) => {
    const 空 = t.jsxEmptyExpression();
    空.innerComments = comments.map((c) => ({ type: 'CommentBlock', value: c.type === 'CommentLine' ? ' ' + c.value.trim() + ' ' : c.value.replace(/\*\//g, '* /') }));
    return t.jsxExpressionContainer(空);
  };
  // 子を 1 つ以上の子（注釈の子を含む）にする
  function 子にする(node) {
    const 前 = node.leadingComments || [];
    const 後 = node.trailingComments || [];
    node.leadingComments = null;
    node.trailingComments = null;
    let 本体;
    if (t.isJSXElement(node) || t.isJSXFragment(node)) 本体 = node;
    else if (t.isStringLiteral(node) && 文字でよいか(node.value)) 本体 = t.jsxText(node.value);
    else 本体 = t.jsxExpressionContainer(node);
    const 出 = [];
    if (前.length) 出.push(注釈の子(前));
    出.push(本体);
    if (後.length) 出.push(注釈の子(後));
    return 出;
  }

  function 属性にする(prop) {
    if (t.isSpreadElement(prop)) return t.jsxSpreadAttribute(prop.argument);
    if (!t.isObjectProperty(prop)) return null;
    let 名;
    if (t.isIdentifier(prop.key) && !prop.computed) 名 = prop.key.name;
    else if (t.isStringLiteral(prop.key)) 名 = prop.key.value;
    else return null;
    // JSX の属性名は日本語でもよい（識別子の決まりと同じ。'aria-label' の - も可）
    if (!/^[\p{L}_$][\p{L}\p{N}_$-]*$/u.test(名)) return null;
    let 値 = prop.value;
    if (t.isAssignmentPattern(値)) return null;
    let 属性;
    if (t.isStringLiteral(値) && !/["\\\n\r]/.test(値.value)) 属性 = t.jsxAttribute(t.jsxIdentifier(名), t.stringLiteral(値.value));
    else if (t.isBooleanLiteral(値, { value: true }) || (t.isUnaryExpression(値, { operator: '!' }) && t.isNumericLiteral(値.argument, { value: 0 })))
      属性 = t.jsxAttribute(t.jsxIdentifier(名), null);
    else 属性 = t.jsxAttribute(t.jsxIdentifier(名), t.jsxExpressionContainer(値));
    if (prop.leadingComments) 属性.leadingComments = prop.leadingComments;
    if (prop.trailingComments) 属性.trailingComments = prop.trailingComments;
    return 属性;
  }

  function 要素にする(node) {
    const 種 = jsx呼び出しか(node);
    if (!種) return null;
    const [型, 属性の元, 鍵] = node.arguments;
    if (!型 || node.arguments.length > 3) return null;
    const 断片 = Fragmentか(型);
    const 名 = 断片 ? null : 型名(型);
    if (!断片 && !名) return null;
    const 属性たち = [];
    let 子たち = [];
    // props は { … } か Object.assign({}, a, { … }) か 変数
    const 塊たち = [];
    if (t.isObjectExpression(属性の元)) 塊たち.push(属性の元);
    else if (
      t.isCallExpression(属性の元) &&
      t.isMemberExpression(属性の元.callee) &&
      t.isIdentifier(属性の元.callee.object, { name: 'Object' }) &&
      t.isIdentifier(属性の元.callee.property, { name: 'assign' }) &&
      属性の元.arguments.length >= 1 &&
      t.isObjectExpression(属性の元.arguments[0])
    ) {
      // Object.assign({ a }, {}, false, b, { c }) → a, …b, c。空の {} と false/null は何も足さない
      for (const a of 属性の元.arguments) {
        if (t.isObjectExpression(a)) {
          if (a.properties.length) 塊たち.push(a);
        } else if (t.isBooleanLiteral(a, { value: false }) || t.isNullLiteral(a) || t.isIdentifier(a, { name: 'undefined' })) continue;
        else 塊たち.push(t.spreadElement(a));
      }
    } else if (属性の元 === undefined || t.isNullLiteral(属性の元)) {
      // 属性なし
    } else if (t.isIdentifier(属性の元) || t.isMemberExpression(属性の元)) {
      塊たち.push(t.spreadElement(属性の元));
    } else return null;
    if (鍵) 属性たち.push(t.jsxAttribute(t.jsxIdentifier('key'), t.jsxExpressionContainer(鍵)));
    for (const 塊 of 塊たち) {
      if (t.isSpreadElement(塊)) {
        属性たち.push(t.jsxSpreadAttribute(塊.argument));
        continue;
      }
      for (const prop of 塊.properties) {
        if (t.isObjectProperty(prop) && !prop.computed && ((t.isIdentifier(prop.key) && prop.key.name === 'children') || t.isStringLiteral(prop.key, { value: 'children' }))) {
          const 値 = prop.value;
          const 元たち = t.isArrayExpression(値) ? 値.elements : [値];
          for (const 子 of 元たち) {
            if (!子) continue;
            if (t.isSpreadElement(子)) {
              子たち.push(t.jsxExpressionContainer(t.arrayExpression([子])));
              continue;
            }
            const 変換 = 要素にする(子) || 子;
            if (prop.leadingComments && 子たち.length === 0 && 元たち.length === 1) {
              変換.leadingComments = [...(prop.leadingComments || []), ...(変換.leadingComments || [])];
            }
            子たち.push(...子にする(変換));
          }
          continue;
        }
        const 属性 = 属性にする(prop);
        if (!属性) return null; // 直せない形は、その要素は諦める（呼び出しのまま残す）
        属性たち.push(属性);
      }
    }
    if (断片) {
      if (!属性たち.length) return t.jsxFragment(t.jsxOpeningFragment(), t.jsxClosingFragment(), 子たち);
      // key 付きの断片は <React.Fragment key={…}> にする（React の読み込みはあとで足す）
      Reactが要る = true;
      const 名前 = t.jsxMemberExpression(t.jsxIdentifier('React'), t.jsxIdentifier('Fragment'));
      return t.jsxElement(t.jsxOpeningElement(名前, 属性たち, false), t.jsxClosingElement(t.cloneNode(名前)), 子たち, false);
    }
    const 閉じるか = 子たち.length === 0;
    const 要素 = t.jsxElement(t.jsxOpeningElement(名, 属性たち, 閉じるか), 閉じるか ? null : t.jsxClosingElement(t.cloneNode(名)), 子たち, 閉じるか);
    if (node.leadingComments) 要素.leadingComments = node.leadingComments;
    if (node.trailingComments) 要素.trailingComments = node.trailingComments;
    return 要素;
  }

  // 内側から外側へ（後順）
  traverse(木, {
    CallExpression: {
      exit(p) {
        今の経路 = p;
        const 要素 = 要素にする(p.node);
        if (要素) p.replaceWith(要素);
      },
    },
  });
  // 持ち上げた読み込みと React を、頭の読み込みの後ろに足す
  {
    const 足す = [];
    for (const { 名, 道, 員 } of 持ち上げ) {
      足す.push(
        員 === 'default'
          ? t.variableDeclaration('const', [t.variableDeclarator(t.identifier(名), 既定の読み込み(道))])
          : t.variableDeclaration('const', [t.variableDeclarator(t.objectPattern([t.objectProperty(t.identifier(員), t.identifier(名), false, true)]), t.callExpression(t.identifier('require'), [t.stringLiteral(道)]))])
      );
    }
    const Reactあり = [...読み込み.values()].some((v) => v.道 === 'react') || 使用中の名.has('React');
    if (Reactが要る && !Reactあり) {
      足す.push(t.variableDeclaration('const', [t.variableDeclarator(t.identifier('React'), t.callExpression(t.identifier('require'), [t.stringLiteral('react')]))]));
      使用中の名.add('React');
    }
    if (足す.length) {
      let 位置 = 0;
      木.program.body.forEach((n, i) => {
        if (t.isVariableDeclaration(n) && n.declarations.some((d) => d.init && (require道(d.init) || 名前空間の橋の道(d.init) || (t.isCallExpression(d.init) && d.init.arguments[0] && require道(d.init.arguments[0])) || (t.isMemberExpression(d.init) && require道(d.init.object))))) 位置 = i + 1;
      });
      木.program.body.splice(位置, 0, ...足す);
    }
  }
  // Fragment を単独で使っている所（型として渡すなど）は残す。jsx の別名は、もう使われていなければ読み込みごと消す

  // ── 3. !0 !1 void 0 ─────────────────────────────────
  traverse(木, {
    UnaryExpression(p) {
      const n = p.node;
      if (n.operator === '!' && t.isNumericLiteral(n.argument)) {
        p.replaceWith(t.booleanLiteral(n.argument.value === 0));
      } else if (n.operator === 'void' && t.isNumericLiteral(n.argument, { value: 0 })) {
        p.replaceWith(t.identifier('undefined'));
      }
    },
  });

  // ── 4. カンマの文をばらす、&& の文を if に ─────────────────
  traverse(木, {
    ExpressionStatement(p) {
      const e = p.node.expression;
      if (t.isSequenceExpression(e)) {
        const 文たち = e.expressions.map((x) => t.expressionStatement(x));
        if (p.node.leadingComments) 文たち[0].leadingComments = p.node.leadingComments;
        p.replaceWithMultiple(文たち);
        return;
      }
      if (t.isLogicalExpression(e) && (e.operator === '&&' || e.operator === '||') && t.isCallExpression(e.right)) {
        const 条件 = e.operator === '&&' ? e.left : t.unaryExpression('!', e.left);
        const 文 = t.ifStatement(条件, t.expressionStatement(e.right));
        if (p.node.leadingComments) 文.leadingComments = p.node.leadingComments;
        p.replaceWith(文);
        return;
      }
      if (t.isConditionalExpression(e) && t.isCallExpression(e.consequent) && (t.isCallExpression(e.alternate) || t.isNullLiteral(e.alternate) || t.isIdentifier(e.alternate, { name: 'undefined' }))) {
        const 文 = t.ifStatement(e.test, t.expressionStatement(e.consequent), t.isCallExpression(e.alternate) ? t.expressionStatement(e.alternate) : null);
        if (p.node.leadingComments) 文.leadingComments = p.node.leadingComments;
        p.replaceWith(文);
      }
    },
    ArrowFunctionExpression(p) {
      const b = p.node.body;
      if (t.isSequenceExpression(b)) {
        const 文たち = b.expressions.map((x) => t.expressionStatement(x));
        p.node.body = t.blockStatement(文たち);
      }
    },
  });

  // ── 5. 取り出しの別名を本名に ────────────────────────────
  traverse(木, {
    ObjectPattern(p) {
      for (const prop of p.node.properties) {
        if (!t.isObjectProperty(prop) || prop.computed || !t.isIdentifier(prop.key)) continue;
        const 本名 = prop.key.name;
        let 値 = prop.value;
        const 既定 = t.isAssignmentPattern(値) ? 値 : null;
        const 識別子 = 既定 ? 既定.left : 値;
        if (!t.isIdentifier(識別子) || 識別子.name === 本名) continue;
        if (!/^[A-Za-z_$]{1,2}$/.test(識別子.name) || !/^[A-Za-z_$][\w$]*$/.test(本名)) continue;
        const scope = p.scope;
        const 束縛 = scope.getBinding(識別子.name);
        if (!束縛 || 束縛.identifier !== 識別子) continue;
        if (scope.hasBinding(本名) || scope.hasGlobal(本名) || scope.hasReference(本名) || 使用中の名.has(本名)) continue;
        scope.rename(識別子.name, 本名);
        使用中の名.add(本名);
        prop.shorthand = true;
      }
    },
  });

  // ── 6. exports ────────────────────────────────────────
  // 出す名の実体（k など）を出す名に付け替える。最後に exports.Name = Name を足す
  const 出し方 = [];
  traverse(木, {
    Program(p) {
      for (const { 名, 実体 } of 出す名たち) {
        if (実体 !== 名 && p.scope.hasBinding(実体) && !p.scope.hasBinding(名) && !使用中の名.has(名)) {
          p.scope.rename(実体, 名);
          使用中の名.add(名);
          出し方.push({ 名, 実体: 名 });
        } else 出し方.push({ 名, 実体 });
      }
      p.stop();
    },
  });

  // ── 1'. 読み込みの付け替えを実際に当てる ────────────────────
  // JSX に直したあとなので、束縛の参照の控えは古い。木を歩き直して名前で当てる
  {
    const 別名たち = new Set(付け替え.keys());
    const 宣言の節 = new Set([...読み込み.values()].map((v) => v.宣言));
    const 置き換え = (p) => {
      const 名 = p.node.name;
      if (!別名たち.has(名)) return;
      const 情報 = 付け替え.get(名);
      const b = p.scope.getBinding(名);
      if (!b || !宣言の節.has(b.path.node)) return; // 同名の別の変数
      const 親 = p.parentPath;
      if (親.isVariableDeclarator() && 親.node.id === p.node) return;
      if (情報.種 === 'default') {
        if (親.isMemberExpression() && 親.node.object === p.node && !親.node.computed && t.isIdentifier(親.node.property, { name: 'default' })) 親.replaceWith(t.identifier(情報.新));
        else if (親.isJSXMemberExpression() && 親.node.object === p.node && t.isJSXIdentifier(親.node.property, { name: 'default' })) 親.replaceWith(t.jsxIdentifier(情報.新));
        else if (p.isIdentifier()) {
          if (親.isObjectProperty() && 親.node.shorthand && 親.node.value === p.node) {
            親.node.shorthand = false;
            親.node.key = t.identifier(名);
          }
          p.replaceWith(t.objectExpression([t.objectProperty(t.identifier('default'), t.identifier(情報.新))]));
        }
      } else if (情報.種 === 'pick') {
        if (親.isMemberExpression() && 親.node.object === p.node && !親.node.computed && t.isIdentifier(親.node.property)) 親.replaceWith(t.identifier(親.node.property.name));
        else if (親.isJSXMemberExpression() && 親.node.object === p.node) 親.replaceWith(t.jsxIdentifier(親.node.property.name));
      } else if (情報.種 === 'namespace' || 情報.種 === 'namespace-alias' || 情報.種 === 'member') {
        if (情報.新 !== 名) {
          // { a } の省略形は鍵の名も変わってしまう（渡す先の決まり事）。{ a: 新 } に開いてから変える
          if (親.isObjectProperty() && 親.node.shorthand && 親.node.value === p.node) {
            親.node.shorthand = false;
            親.node.key = t.identifier(名);
          }
          p.node.name = 情報.新;
        }
      } else if (情報.種 === 'default-alias') {
        if (親.isMemberExpression() && 親.node.object === p.node && !親.node.computed && t.isIdentifier(親.node.property, { name: 'default' })) 親.replaceWith(t.identifier(情報.新));
        else if (親.isJSXMemberExpression() && 親.node.object === p.node && t.isJSXIdentifier(親.node.property, { name: 'default' })) 親.replaceWith(t.jsxIdentifier(情報.新));
        else if (p.isIdentifier()) p.replaceWith(t.objectExpression([t.objectProperty(t.identifier('default'), t.identifier(情報.新))]));
      }
    };
    traverse(木, { Identifier: 置き換え, JSXIdentifier: 置き換え });
    traverse(木, {
      Program(p) {
        p.scope.crawl();
        for (const [別名, 情報] of 付け替え) {
          const 宣言 = 読み込み.get(別名).宣言;
          if (情報.種 === 'default') {
            宣言.id = t.identifier(情報.新);
            宣言.init = 既定の読み込み(情報.道);
          } else if (情報.種 === 'pick') {
            宣言.id = t.objectPattern([...情報.員たち].sort().map((m) => t.objectProperty(t.identifier(m), t.identifier(m), false, true)));
            宣言.init = t.callExpression(t.identifier('require'), [t.stringLiteral(情報.道)]);
          } else if (情報.種 === 'namespace') {
            宣言.id = t.identifier(情報.新);
            宣言.init = t.callExpression(t.identifier('require'), [t.stringLiteral(情報.道)]);
          } else if (情報.種 === 'member') {
            宣言.id = t.identifier(情報.新);
          } else if (情報.種 === 'jsx') {
            const b2 = p.scope.getBinding(別名);
            if (b2 && b2.referencePaths.length === 0) b2.path.remove();
          } else if (情報.種 === 'default-alias' || 情報.種 === 'namespace-alias') {
            // まとめ先に置き換えたので、この宣言は要らない
            const b2 = p.scope.getBinding(別名);
            if (b2) b2.path.remove();
          }
        }
        p.stop();
      },
    });
  }

  // (0, f)(…) の呼び出しを f(…) に。読み込んだ物の関数は this を使わないので、
  // 別名を本名に直したあとの (0, useScoreStore)(…) の形も同じ
  const 読み込みの名 = new Set([...付け替え.values()].flatMap((v) => (v.種 === 'pick' ? [...v.員たち] : v.新 ? [v.新] : [])));
  // そのまま残した名前空間（案内・組・航 など）の関数呼び出しも (0, 航.f)( → 航.f( に
  for (const [別名, 情報] of 読み込み) if (情報.種 === 'namespace' && !付け替え.has(別名)) 読み込みの名.add(別名);
  // 読み込みの名（React など）に、素のまま付け替えたものも含める
  traverse(木, {
    CallExpression(p) {
      const c = p.node.callee;
      if (!t.isSequenceExpression(c) || c.expressions.length !== 2 || !t.isNumericLiteral(c.expressions[0], { value: 0 })) return;
      const f = c.expressions[1];
      if (t.isIdentifier(f)) p.node.callee = f;
      else if (t.isMemberExpression(f) && t.isIdentifier(f.object) && 読み込みの名.has(f.object.name)) p.node.callee = f;
    },
  });
  // exports を足す
  if (出し方.length) {
    木.program.body.push(t.expressionStatement(t.callExpression(t.memberExpression(t.identifier('Object'), t.identifier('defineProperty')), [t.identifier('exports'), t.stringLiteral('__esModule'), t.objectExpression([t.objectProperty(t.identifier('value'), t.booleanLiteral(true))])])));
    for (const { 名, 実体 } of 出し方) {
      木.program.body.push(t.expressionStatement(t.assignmentExpression('=', t.memberExpression(t.identifier('exports'), t.identifier(名)), t.identifier(実体))));
    }
  }
  // 1 つの const に幾つも並べた宣言をばらす（for の頭は除く）。読み込みの束も 1 行 1 つに
  traverse(木, {
    VariableDeclaration(p) {
      if (p.node.declarations.length < 2) return;
      if (p.parentPath.isFor() || p.parentPath.isForXStatement()) return;
      const 文たち = p.node.declarations.map((d) => {
        const 文 = t.variableDeclaration(p.node.kind, [d]);
        文.loc = d.loc; // 注釈の行の判定に使う
        if (d.trailingComments) {
          文.trailingComments = d.trailingComments;
          d.trailingComments = null;
        }
        return 文;
      });
      if (p.node.leadingComments) 文たち[0].leadingComments = p.node.leadingComments;
      if (p.node.trailingComments) 文たち[文たち.length - 1].trailingComments = [...(文たち[文たち.length - 1].trailingComments || []), ...p.node.trailingComments];
      p.replaceWithMultiple(文たち);
    },
  });
  // var → const（再代入していないもの）
  traverse(木, { Program(p) { p.scope.crawl(); p.stop(); } });
  traverse(木, {
    VariableDeclaration(p) {
      if (p.node.kind !== 'var') return;
      const 全部const = p.node.declarations.every((d) => {
        if (!d.init) return false;
        return Object.keys(t.getBindingIdentifiers(d.id)).every((名) => {
          const b = p.scope.getBinding(名);
          return b && b.constant;
        });
      });
      if (全部const) p.node.kind = 'const';
    },
  });
  // 「Module ID」の注釈は消す
  if (木.comments) 木.comments = 木.comments.filter((c) => !/Module ID:/.test(c.value));
  if (木.program.body[0]?.leadingComments) 木.program.body[0].leadingComments = 木.program.body[0].leadingComments.filter((c) => !/Module ID:/.test(c.value));

  // 次の行の頭に書いた注釈が、前の文の「後ろの注釈」として同じ行に出てしまうのを直す。
  // 元の位置（行）で見て、前の文より下の行の注釈は次の文の頭へ移す
  const 注釈を直す = (文たち) => {
    for (let i = 0; i < 文たち.length; i++) {
      const 節 = 文たち[i];
      if (!節.trailingComments || !節.loc) continue;
      const 残す = [];
      const 移す = [];
      for (const c of 節.trailingComments) (c.loc && c.loc.start.line > 節.loc.end.line ? 移す : 残す).push(c);
      if (!移す.length) continue;
      節.trailingComments = 残す;
      const 次 = 文たち[i + 1];
      if (次) {
        const 既 = new Set((次.leadingComments || []).map((c) => c.start));
        次.leadingComments = [...移す.filter((c) => !既.has(c.start)), ...(次.leadingComments || [])];
      } else 節.trailingComments = [...残す, ...移す];
    }
  };
  traverse(木, {
    Program(p) { 注釈を直す(p.node.body); },
    BlockStatement(p) { 注釈を直す(p.node.body); },
  });
  let 出 = generate(木, { retainLines: false, comments: true, jsescOption: { minimal: true } }, 元).code;
  const 設定 = await prettier.resolveConfig(path.resolve('.prettierrc.json'));
  // objectWrap: 'collapse' … 生成した木は { の後で改行するので、そのままだと物が縦に伸びる
  出 = await prettier.format(出, Object.assign({}, 設定, { parser: 'babel', filepath: 名札 || 'x.js', objectWrap: 'collapse' }));
  return 出;
}

if (import.meta.url === new URL('file:///' + process.argv[1].replace(/\\/g, '/')).href || process.argv[1].endsWith('yomiyasuku.mjs')) {
  for (const 道 of 道たち) {
    const 元 = fs.readFileSync(道, 'utf8');
    const 新 = await 読みやすく(元, 道);
    if (書かない) process.stdout.write(新);
    else {
      fs.writeFileSync(道, 新);
      console.log(`${道}: ${元.split('\n').length} 行 → ${新.split('\n').length} 行`);
    }
  }
}
