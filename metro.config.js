const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// babel.config.js の jsxImportSource から参照される別名。
// テーマ変換を挟んだ JSX ランタイム（src/theme-runtime）へ解決する。
config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules || {}),
  'theme-jsx': path.resolve(__dirname, 'src/theme-runtime'),
};

// 写真で学習済みの網の重み（scripts/ocr-cells/omomi-mobilenet.bin）を、束に入れず asset として配る。
// 読み取りを使うときだけ src/ocr/shashinNoMou.js が取りに行く
config.resolver.assetExts = [...config.resolver.assetExts, 'bin'];

module.exports = config;
