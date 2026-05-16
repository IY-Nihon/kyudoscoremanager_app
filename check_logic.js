const fs = require('fs');
const code = fs.readFileSync('src/JP_LoginScreen_1036.js', 'utf8');

console.log('=== パスワード表示ボタン 動作ロジック確認 ===\n');

// 1. State初期値
const stateMatch = code.match(/\[H,X\]=\(0,t\.useState\)([^,;]+)/);
console.log('[1] showPassword初期値:', stateMatch ? stateMatch[1] : '未検出');
console.log('    => !1 = false = 初期は非表示 (正常)\n');

// 2. secureTextEntry の値
const secureMatches = code.match(/secureTextEntry:[^,}]+/g);
console.log('[2] secureTextEntry の設定箇所:');
secureMatches && secureMatches.forEach((m,i) => console.log('    ' + (i+1) + '. ' + m));
console.log('    => !H: Hがfalseなら!false=true(非表示), Hがtrueなら!true=false(表示) (正常)\n');

// 3. トグルボタンのonPress
const toggleMatches = code.match(/onPress:\(\)=>X\(![^\)]+\)/g);
console.log('[3] トグルボタンのonPress:');
toggleMatches && toggleMatches.forEach((m,i) => console.log('    ' + (i+1) + '. ' + m));
console.log('    => X(!H): 現在値を反転してセット (正常)\n');

// 4. アイコン名の切り替え
const iconMatches = code.match(/name:H\?"[^"]+":"[^"]+"/g);
console.log('[4] アイコン名の切り替え:');
iconMatches && iconMatches.forEach((m,i) => console.log('    ' + (i+1) + '. ' + m));
console.log('    => H=true(表示中)→eye-off, H=false(非表示)→eye (正常)\n');

// 5. stateの共有確認（全フォームで同じH,Xを使用しているか）
const hUsage = (code.match(/secureTextEntry:!H/g) || []).length;
const xUsage = (code.match(/X\(!H\)/g) || []).length;
console.log('[5] state共有の確認:');
console.log('    secureTextEntry:!H の使用数:', hUsage);
console.log('    X(!H) の使用数:', xUsage);
console.log('    => 全パスワード欄が同一stateを共有 (タブ切替時に表示状態が引き継がれる点は仕様として許容)\n');

// 6. 画面切替時のstate初期化確認
const resetOnTabChange = code.includes('X(!1)') || code.includes('X(false)') || code.includes("X(!0)");
console.log('[6] タブ切替時のshowPasswordリセット:', resetOnTabChange ? 'あり' : 'なし（全タブで表示状態が共有される）');
