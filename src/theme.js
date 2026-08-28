/**
 * theme.js — ライト/ダークモードのカラーマッピング基盤
 *
 * ■ なぜこの作りなのか
 * src/ はソースマップから復元されたコードで、カラーリテラルが 1300 箇所以上
 * ハードコードされている（うち約半分は JSX 内のインライン指定）。
 * 全箇所をテーマトークンへ書き換えるのは現実的でないため、
 * 「既存のライト色 → ダーク色」への変換を実行時に一箇所で行う方式を採る。
 *
 * 変換の差し込み口は2つだけ:
 *   1. src/default_45.js   … StyleSheet.create の結果を変換（styles 定義側）
 *   2. src/module_427.js   … JSX ランタイムで style / color 系 props を変換（インライン側）
 *
 * ■ 配色の根拠
 * 元のパレットが Apple のシステムカラー（systemBlue #007AFF、
 * systemGroupedBackground #F2F2F7 等）で統一されていたため、
 * ダーク側も Apple のダークモード定義値をそのまま採用している。
 *
 * ■ 変換しない色
 * ログイン画面は元から独自のダーク基調（#030508 + 金 #E5C184/#B8965A）で
 * 設計されており、下表のライト色を使っていないため自動的に対象外になる。
 */
'use strict';

/**
 * ■ 変換表を用途別に分けている理由
 * 同じ色でも役割によって正しい変換先が違う。
 * 例: '#FFFFFF' は背景なら「カード面 → #1C1C1E」だが、
 *     青ボタン上の文字色なら白のままでなければ読めなくなる。
 * そのため背景用・文字用・罫線用を分け、共通のアクセント色だけ束ねている。
 */

// アクセント（Apple のダークモード定義値）。用途を問わず同じ変換でよい
const ACCENT = {
  '#007aff': '#0a84ff', // systemBlue
  '#ff3b30': '#ff453a', // systemRed
  '#34c759': '#30d158', // systemGreen
  '#ff9500': '#ff9f0a', // systemOrange
  '#5856d6': '#5e5ce6', // systemIndigo
  '#ff2d55': '#ff375f', // systemPink
  '#af52de': '#bf5af2', // systemPurple
  // 比較相手を見分ける色のうち、systemGreen/Orange/Yellow は明るい面との比が
  // 2.2／2.2／1.5 しかなく、白いカードの上で薄すぎた。明るい面用に濃い色を置き、
  // 暗い面では元の鮮やかな色に戻す（src/JP_AnalysisScreen_1000.js の 比較の色たち）
  '#248a3d': '#30d158', // 濃い緑 → systemGreen(dark)
  '#c93400': '#ff9f0a', // 濃い橙 → systemOrange(dark)
  '#8b6d00': '#ffd426', // 濃い黄土 → systemYellow(dark)
  '#056b7a': '#32ade6', // 濃い青緑 → systemCyan(dark)
  // '#8e8e93' (systemGray) はライト/ダーク共通のため変換しない
};

// 背景・面
const BG_MAP = Object.assign({}, ACCENT, {
  '#f2f2f7': '#000000', // 画面全体の背景 (systemGroupedBackground)
  '#ffffff': '#1c1c1e', // カード・前面 (secondarySystemGroupedBackground)
  '#f9f9f9': '#2c2c2e', // 一段沈んだ面
  '#fafafa': '#2c2c2e',
  '#f0f0f5': '#2c2c2e',
  // 塗り分け面 (systemGray5)。Apple のダーク定義は #2C2C2E だが、この値は
  // 「ほぼ白の面」(#F8F8F8/#F9F9F9 等) の変換先と同じで、その上に置くと
  // 完全に同色になって要素が消える。一段明るい systemGray4 相当を使う。
  '#e5e5ea': '#3a3a3c',
  '#c6c6c8': '#38383a',
  '#c7c7cc': '#3a3a3c',
  '#d1d1d6': '#48484a',
  '#e0e0e0': '#3a3a3c',
  '#eeeeee': '#2c2c2e',
  '#f0f0f0': '#2c2c2e',
  '#f8f8f8': '#2c2c2e',
  '#f9f9fb': '#2c2c2e',
  '#f8f9ff': '#2c2c2e',
  '#f0f0ff': '#2c2c2e',

  // 状態を示す淡い色付き背景（そのままだとダーク画面に白いカードが浮く）
  '#e1f0ff': '#0a2a4a', // 選択中・情報（淡い青）
  '#e5f1ff': '#0a2a4a', // 一致（淡い青）
  '#e3f2fd': '#0a2a4a',
  '#a2c8f2': '#1d3f63', // やや濃い青の塗り
  '#ffe5e5': '#3a1416', // 要確認（淡い赤）
  '#fff0f0': '#3a1416',
  '#e8f5e9': '#12301a', // 成功（淡い緑）
  '#fff9e6': '#3a2f10', // 警告（淡い黄）
  '#fff3cd': '#3a2f10',

  '#000000': '#000000', // 既に暗い背景はそのまま（二重変換の防止）
  '#1c1c1e': '#1c1c1e',
  '#2c2c2e': '#2c2c2e',
});

// 文字
const TEXT_MAP = Object.assign({}, ACCENT, {
  '#000000': '#ffffff', // 主要テキスト (label)
  '#1c1c1e': '#ffffff',
  '#1a1a1a': '#ffffff',
  '#333333': '#ebebf5',
  '#3c3c43': '#ebebf5', // 副次テキスト (secondaryLabel)
  '#3a3a3c': '#d1d1d6',
  // 中間グレーの文字は暗い面の上で沈むため、systemGray2 相当まで持ち上げる
  '#636366': '#aeaeb2',
  '#666666': '#aeaeb2',
  '#555555': '#aeaeb2',
  '#444444': '#d1d1d6',
  '#ffffff': '#ffffff', // 色付きボタン上の白文字は白のまま
  '#f2f2f7': '#ffffff',
  // systemIndigo はダーク面で 3.0 を下回るため、文字用途のみ明るめにする
  '#5856d6': '#7d7aff',
});

// 罫線・区切り
const BORDER_MAP = Object.assign({}, ACCENT, {
  '#c6c6c8': '#38383a', // separator
  '#c7c7cc': '#3a3a3c', // systemGray4
  '#d1d1d6': '#48484a', // systemGray3
  '#e5e5ea': '#38383a',
  '#f2f2f7': '#2c2c2e',
  '#ffffff': '#2c2c2e',
  '#000000': '#48484a',
});

// 後方互換・参照用（README や動作確認から参照する）
const DARK_MAP = Object.assign({}, BG_MAP, TEXT_MAP);

// 3桁HEX・色名も拾えるように別名を登録
const ALIASES = {
  '#fff': '#ffffff',
  '#000': '#000000',
  white: '#ffffff',
  black: '#000000',
};

// style のキー → どの変換表を使うか
const KEY_KIND = {
  color: 'text',
  textDecorationColor: 'text',
  textShadowColor: 'text',
  placeholderTextColor: 'text',
  selectionColor: 'text',
  cursorColor: 'text',
  tintColor: 'text',

  backgroundColor: 'bg',
  overlayColor: 'bg',
  underlayColor: 'bg',
  shadowColor: 'bg',

  borderColor: 'border',
  borderTopColor: 'border',
  borderBottomColor: 'border',
  borderLeftColor: 'border',
  borderRightColor: 'border',
  borderStartColor: 'border',
  borderEndColor: 'border',

  // react-native-svg（分析画面のグラフ）
  stroke: 'border', // 罫線・折れ線
  fill: 'text', // 点や塗り。'none' などの非色は mapColor が素通しする
  stopColor: 'bg',
};

// jsx の props のうち、値が色文字列そのものであるもの（style 以外）
const COLOR_PROPS = new Set([
  'color',
  'tintColor',
  'placeholderTextColor',
  'selectionColor',
  'underlayColor',
  'backgroundColor',
  'borderColor',
  'thumbColor',
  'activeOutlineColor',
  'stroke',
  'fill',
]);

// 値が「色文字列を持つオブジェクト」である props。
// 例: Switch の trackColor={{ false: '#D1D1D6', true: '#34C759' }}
const COLOR_MAP_PROPS = { trackColor: 'bg' };

const STORAGE_KEY = '@kyudo/themeMode';

let mode = 'system'; // 'light' | 'dark' | 'system'
let systemScheme = 'light';
const listeners = new Set();

const notify = () => listeners.forEach((l) => l());

/** 実効テーマ（'light' | 'dark'）を返す */
const getEffectiveTheme = () => (mode === 'system' ? systemScheme : mode);

const isDark = () => getEffectiveTheme() === 'dark';

const RGB_FN = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/;

const toHex = (r, g, b) =>
  '#' + [r, g, b].map((n) => Math.round(Number(n)).toString(16).padStart(2, '0')).join('');

const hexToRgbParts = (hex) => [
  parseInt(hex.slice(1, 3), 16),
  parseInt(hex.slice(3, 5), 16),
  parseInt(hex.slice(5, 7), 16),
];

const TABLES = { text: TEXT_MAP, bg: BG_MAP, border: BORDER_MAP };

/**
 * 単色の変換。ダーク時かつ対応表にある色だけ差し替える。
 * kind は 'text' | 'bg' | 'border'（既定は 'bg'）。
 * rgba() 形式は RGB 部分だけを対応表で引き、透明度はそのまま保つ
 * （オーバーレイや淡い選択背景が rgba で書かれているため）。
 */
function mapColor(value, kind) {
  if (!isDark() || typeof value !== 'string') return value;
  const table = TABLES[kind] || BG_MAP;
  const key = value.trim().toLowerCase();

  // 3桁HEXの省略記法（#333）を6桁へ展開してから引く。
  // 展開しないと #333 や #eee が対応表に当たらず素通りしてしまう。
  const expand = (h) => (/^#[0-9a-f]{3}$/.test(h) ? '#' + h[1] + h[1] + h[2] + h[2] + h[3] + h[3] : h);

  const normalized = ALIASES[key] || expand(key);
  const direct = table[normalized];
  if (direct) return direct;

  const m = RGB_FN.exec(key);
  if (m) {
    const mapped = table[toHex(m[1], m[2], m[3])];
    if (mapped) {
      const [r, g, b] = hexToRgbParts(mapped);
      return m[4] === undefined ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, ${m[4]})`;
    }
  }
  return value;
}

// 変換済みオブジェクトを記録し、二重変換と再計算を防ぐ
let cache = new WeakMap();
const MAPPED = Symbol('themeMapped');

// 入れ子をたどる深さの上限。
// スタイルの入れ子は shadowOffset や transform でも数段しかない。
// これを超えるものはスタイルではない別種のオブジェクトなので、そのまま返す。
const MAX_DEPTH = 8;

/**
 * 素のスタイルオブジェクトかどうか。
 *
 * style には Animated.Value のような「見た目の値ではないオブジェクト」も入る。
 * Animated の内部は _parent と _children で相互参照しており、
 * 何も考えずに再帰すると循環をたどり続けてスタックを使い切る
 * （実際に外観の切替時に RangeError で画面が落ちた）。
 * クラスのインスタンスは変換対象ではないので、素のオブジェクトだけをたどる。
 */
function isPlainObject(v) {
  if (v === null || typeof v !== 'object') return false;
  const proto = Object.getPrototypeOf(v);
  return proto === Object.prototype || proto === null;
}

/** style（オブジェクト/配列/入れ子）を再帰的に変換する */
function mapStyle(style, depth = 0) {
  if (!isDark() || style == null) return style;
  if (typeof style !== 'object') return style; // 登録済みIDなど

  if (style[MAPPED]) return style;
  const hit = cache.get(style);
  if (hit) return hit;

  // 想定より深い入れ子はスタイルではないとみなし、触らずに返す
  if (depth > MAX_DEPTH) return style;

  let out;
  if (Array.isArray(style)) {
    let changed = false;
    const arr = style.map((s) => {
      const m = mapStyle(s, depth + 1);
      if (m !== s) changed = true;
      return m;
    });
    out = changed ? arr : style;
  } else if (!isPlainObject(style)) {
    // Animated.Value などクラスのインスタンスは変換せずそのまま使う
    return style;
  } else {
    let changed = false;
    const obj = {};
    for (const k in style) {
      const v = style[k];
      let nv = v;
      if (KEY_KIND[k]) nv = mapColor(v, KEY_KIND[k]);
      else if (Array.isArray(v) || isPlainObject(v)) nv = mapStyle(v, depth + 1);
      if (nv !== v) changed = true;
      obj[k] = nv;
    }
    out = changed ? obj : style;
  }

  if (out !== style) Object.defineProperty(out, MAPPED, { value: true, enumerable: false });
  cache.set(style, out);
  return out;
}

/**
 * style が関数の場合に包む。
 * Pressable の style={({hovered}) => [...]} のような指定は呼び出しが後で行われるため、
 * 戻り値を変換するラッパーに差し替える必要がある。
 */
const fnCache = new WeakMap();
function wrapStyleFn(fn) {
  const hit = fnCache.get(fn);
  if (hit) return hit;
  const wrapped = (...args) => mapStyle(fn(...args));
  fnCache.set(fn, wrapped);
  return wrapped;
}

/** jsx の props を変換する（style と色系 props） */
function mapProps(props) {
  if (!isDark() || !props || typeof props !== 'object') return props;

  const hit = cache.get(props);
  if (hit) return hit;

  let changed = false;
  let out = props;

  const nextStyle =
    typeof props.style === 'function'
      ? wrapStyleFn(props.style)
      : props.style != null
        ? mapStyle(props.style)
        : props.style;
  if (nextStyle !== props.style) changed = true;

  const patch = {};
  for (const p of COLOR_PROPS) {
    if (typeof props[p] === 'string') {
      // アイコンなどの color prop は「文字」扱い（白アイコンを暗色にしないため）
      const nv = mapColor(props[p], KEY_KIND[p] || 'text');
      if (nv !== props[p]) {
        patch[p] = nv;
        changed = true;
      }
    }
  }

  // trackColor のように、色文字列を値に持つオブジェクト形式の props
  for (const p in COLOR_MAP_PROPS) {
    const obj = props[p];
    if (obj && typeof obj === 'object') {
      let objChanged = false;
      const next = {};
      for (const k in obj) {
        const nv = typeof obj[k] === 'string' ? mapColor(obj[k], COLOR_MAP_PROPS[p]) : obj[k];
        if (nv !== obj[k]) objChanged = true;
        next[k] = nv;
      }
      if (objChanged) {
        patch[p] = next;
        changed = true;
      }
    }
  }

  if (changed) {
    out = Object.assign({}, props, patch);
    if (nextStyle !== props.style) out.style = nextStyle;
  }
  cache.set(props, out);
  return out;
}

// ─── モードの読み書き ───

function setThemeMode(next) {
  if (next !== 'light' && next !== 'dark' && next !== 'system') return;
  if (mode === next) return;
  mode = next;
  cache = new WeakMap(); // テーマが変わったら変換キャッシュを捨てる
  notify();
  try {
    require('@react-native-async-storage/async-storage').default.setItem(STORAGE_KEY, next);
  } catch (e) {
    console.warn('[theme] 保存に失敗:', e);
  }
}

const getThemeMode = () => mode;

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** アプリ起動時に一度だけ呼ぶ。保存値の復元と OS 配色の追従を開始する */
let initialized = false;
function initTheme() {
  if (initialized) return;
  initialized = true;

  try {
    const { Appearance } = require('react-native');
    systemScheme = Appearance.getColorScheme() === 'dark' ? 'dark' : 'light';
    Appearance.addChangeListener(({ colorScheme }) => {
      const next = colorScheme === 'dark' ? 'dark' : 'light';
      if (next === systemScheme) return;
      systemScheme = next;
      if (mode === 'system') {
        cache = new WeakMap();
        notify();
      }
    });
  } catch (e) {
    console.warn('[theme] Appearance の取得に失敗:', e);
  }

  try {
    require('@react-native-async-storage/async-storage')
      .default.getItem(STORAGE_KEY)
      .then((saved) => {
        if (saved && saved !== mode) {
          mode = saved;
          cache = new WeakMap();
          notify();
        }
      })
      .catch(() => {});
  } catch (e) {
    /* 保存値が読めなくても既定値で動作する */
  }
}

/** テーマ変更で再レンダリングさせるためのフック */
function useThemeMode() {
  const React = require('react');
  const subscribeRef = React.useCallback((cb) => subscribe(cb), []);
  const snapshot = React.useCallback(() => mode + ':' + systemScheme, []);
  React.useSyncExternalStore(subscribeRef, snapshot, snapshot);
  return { mode, theme: getEffectiveTheme(), setThemeMode };
}

module.exports = {
  DARK_MAP,
  initTheme,
  getThemeMode,
  setThemeMode,
  getEffectiveTheme,
  isDark,
  mapColor,
  mapStyle,
  mapProps,
  subscribe,
  useThemeMode,
};
