module.exports = function(api) {
  api.cache(true);
  return {
    // jsxImportSource: JSX を 'theme-jsx/jsx-runtime' 経由にして、
    // ダークモードの色変換を全ファイルへ一律に適用する。
    // 別名 'theme-jsx' の解決先は metro.config.js で src/theme-runtime に設定している。
    presets: [['babel-preset-expo', { jsxImportSource: 'theme-jsx' }]],
    plugins: [
      "react-native-reanimated/plugin",
    ],
  };
};
