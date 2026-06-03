// 括弧内の補足説明を削除し、「記録時に矢所も記録できるようにします」にシンプルにするスクリプトです。
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/JP_SettingsScreen_1023.js');
let code = fs.readFileSync(filePath, 'utf8');

// 修正前: \\u8a18\\u9332\\u6642\\u306b\\u77e2\\u6240\\uff08\\u7684\\u3078\\u306e\\u7740\\u5f3e\\u4f4d\\u7f6e\\uff09\\u3082\\u8a18\\u9332\\u3067\\u304d\\u308b\\u3088\\u3046\\u306b\\u3057\\u307e\\u3059
// 修正後: \\u8a18\\u9332\\u6642\\u306b\\u77e2\\u6240\\u3082\\u8a18\\u9332\\u3067\\u304d\\u308b\\u3088\\u3046\\u306b\\u3057\\u307e\\u3059 (記録時に矢所も記録できるようにします)
const targetStr = '\\u8a18\\u9332\\u6642\\u306b\\u77e2\\u6240\\uff08\\u7684\\u3078\\u306e\\u7740\\u5f3e\\u4f4d\\u7f6e\\uff09\\u3082\\u8a18\\u9332\\u3067\\u304d\\u308b\\u3088\\u3046\\u306b\\u3057\\u307e\\u3059';
const replacementStr = '\\u8a18\\u9332\\u6642\\u306b\\u77e2\\u6240\\u3082\\u8a18\\u9332\\u3067\\u304d\\u308b\\u3088\\u3046\\u306b\\u3057\\u307e\\u3059';

if (code.includes(targetStr)) {
  code = code.replace(targetStr, replacementStr);
} else {
  if (code.includes('記録時に矢所（安全な着弾位置）も記録できるようにします') || code.includes('記録時に矢所（的への着弾位置）も記録できるようにします')) {
    code = code.replace(/記録時に矢所（.*?）も記録できるようにします/, '記録時に矢所も記録できるようにします');
  } else {
    // 予備的に部分検索
    const backupTarget = '\\u77e2\\u6240\\uff08\\u7684\\u3078\\u306e\\u7740\\u5f3e\\u4f4d\\u7f6e\\uff09\\u3082';
    const backupReplacement = '\\u77e2\\u6240\\u3082';
    if (code.includes(backupTarget)) {
      code = code.replace(backupTarget, backupReplacement);
    } else {
      console.error("エラー: 対象の文字列が見つかりません。");
      process.exit(1);
    }
  }
}

fs.writeFileSync(filePath, code, 'utf8');
console.log("カッコ部分の削除が成功しました！");
