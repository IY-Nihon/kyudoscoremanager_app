const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// babel.config.js の jsxImportSource から参照される別名。
// テーマ変換を挟んだ JSX ランタイム（src/theme-runtime）へ解決する。
config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules || {}),
  'theme-jsx': path.resolve(__dirname, 'src/theme-runtime'),
};

module.exports = config;
