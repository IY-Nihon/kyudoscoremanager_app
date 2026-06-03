// JP_SettingsScreen_1023.js から `'member'!==V&&` を削除し、個人ID（member）でも矢所記録の設定が行えるようにするスクリプトです。
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/JP_SettingsScreen_1023.js');
let code = fs.readFileSync(filePath, 'utf8');

const targetStr = "'member'!==V&&Ye('\\u77e2\\u6240\\u306e\\u8a18\\u9332'";
const replacementStr = "Ye('\\u77e2\\u6240\\u306e\\u8a18\\u9332'";

if (code.includes(targetStr)) {
  code = code.replace(targetStr, replacementStr);
} else {
  // Unicode エスケープを考慮
  const targetStrEscaped = "'member'!==V&&Ye('\\u77e2\\u6240\\u306e\\u8a18\\u9332'";
  if (code.includes(targetStrEscaped)) {
    code = code.replace(targetStrEscaped, replacementStr);
  } else {
    // raw文字列としてのマッチ
    const targetStrRaw = "'member'!==V&&Ye('\u77e2\u6240\u306e\u8a18\u9332'";
    const replacementStrRaw = "Ye('\u77e2\u6240\u306e\u8a18\u9332'";
    if (code.includes(targetStrRaw)) {
      code = code.replace(targetStrRaw, replacementStrRaw);
    } else {
      console.error("エラー: JP_SettingsScreen_1023.js の対象箇所が見つかりません。");
      process.exit(1);
    }
  }
}

fs.writeFileSync(filePath, code, 'utf8');
console.log("JP_SettingsScreen_1023.js の修正が完了しました。");
