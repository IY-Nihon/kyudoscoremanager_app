import fs from 'fs';
const content = fs.readFileSync('live_bundle.js', 'utf8');
// Unicodeを日本語に変換
const unescaped = content.replace(/\\u([0-9a-fA-F]{4})/g, (match, grp) => String.fromCharCode(parseInt(grp, 16)));

// ひらがな・カタカナ・漢字が連続する文字列をすべて抽出
const strings = unescaped.match(/[\u3000-\u303F\u3040-\u309F\u30A0-\u30FF\uFF00-\uFFEF\u4E00-\u9FAF]{2,}/g) || [];
const unique = [...new Set(strings)];

fs.writeFileSync('found_japanese.txt', unique.join('\n'));
console.log('Found ' + unique.length + ' unique Japanese strings.');
