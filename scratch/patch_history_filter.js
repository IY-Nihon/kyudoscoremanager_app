// JP_HistoryScreen_692.js を書き換え、個人IDログイン時にその人の記録がない期間・タグを非表示（選択不可）にするスクリプトです。
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/JP_HistoryScreen_692.js');
let code = fs.readFileSync(filePath, 'utf8');

// 1. mySessions の挿入
const insertTarget = `,Le=e=>{`;
const insertReplacement = `,mySessions = (0, t.useMemo)(() => {
    let e = B || [];
    const t = D, o = ee;
    if ('member' === z && t) {
      e = e.filter(e => e.archers && e.archers.some(n => n.memberId === t || o && n.name === o || e.substitutionIds && Object.values(e.substitutionIds).includes(t) || o && e.substitutions && Object.values(e.substitutions).includes(o)));
    }
    return e;
  }, [B, z, D, ee]),Le=e=>{`;

if (!code.includes(insertTarget)) {
  console.error("エラー: 挿入ターゲットが見つかりません。");
  process.exit(1);
}
code = code.replace(insertTarget, insertReplacement);

// 2. $e の置換
const target$e = `$e=(0,t.useMemo)(()=>{const e=new Set,t=new Date,o=t.getMonth()+1>=4?t.getFullYear():t.getFullYear()-1;e.add(o),B.forEach(t=>{const o='number'==typeof t.date?t.date:Number(t.date);if(isNaN(o))return;const n=new Date(o),l=n.getFullYear(),a=n.getMonth()+1>=4?l:l-1;e.add(a)});return Array.from(e).sort((e,t)=>t-e)},[B])`;
const replacement$e = `$e=(0,t.useMemo)(()=>{const e=new Set,t=new Date,o=t.getMonth()+1>=4?t.getFullYear():t.getFullYear()-1;e.add(o),mySessions.forEach(t=>{const o='number'==typeof t.date?t.date:Number(t.date);if(isNaN(o))return;const n=new Date(o),l=n.getFullYear(),a=n.getMonth()+1>=4?l:l-1;e.add(a)});return Array.from(e).sort((e,t)=>t-e)},[mySessions])`;

if (!code.includes(target$e)) {
  console.error("エラー: $e の置換ターゲットが見つかりません。");
  process.exit(1);
}
code = code.replace(target$e, replacement$e);

// 3. Ne の置換
const targetNe = `Ne=(0,t.useMemo)(()=>{const e=new Set;return B.forEach(t=>{t.tags&&Array.isArray(t.tags)&&t.tags.forEach(t=>e.add(t))}),Array.from(e).sort((e,t)=>{const o=J.includes(e),n=J.includes(t);return o&&!n?-1:!o&&n?1:e.localeCompare(t)})},[B,J])`;
const replacementNe = `Ne=(0,t.useMemo)(()=>{const e=new Set;return mySessions.forEach(t=>{t.tags&&Array.isArray(t.tags)&&t.tags.forEach(t=>e.add(t))}),Array.from(e).sort((e,t)=>{const o=J.includes(e),n=J.includes(t);return o&&!n?-1:!o&&n?1:e.localeCompare(t)})},[mySessions,J])`;

if (!code.includes(targetNe)) {
  console.error("エラー: Ne の置換ターゲットが見つかりません。");
  process.exit(1);
}
code = code.replace(targetNe, replacementNe);

// 4. Ge の置換
const targetGe = `Ge=(0,t.useMemo)(()=>{const e=new Set;return B.forEach(t=>{const o=new Date(t.date),n=o.getFullYear(),l=o.getMonth()+1;(l>=4?n:n-1)===ie&&e.add(\`\${n}/\${String(l).padStart(2,'0')}\`)}),Array.from(e).sort((e,t)=>e.localeCompare(t))},[B,ie])`;
const replacementGe = `Ge=(0,t.useMemo)(()=>{const e=new Set;return mySessions.forEach(t=>{const o=new Date(t.date),n=o.getFullYear(),l=o.getMonth()+1;(l>=4?n:n-1)===ie&&e.add(\`\${n}/\${String(l).padStart(2,'0')}\`)}),Array.from(e).sort((e,t)=>e.localeCompare(t))},[mySessions,ie])`;

if (!code.includes(targetGe)) {
  console.error("エラー: Ge の置換ターゲットが見つかりません。");
  process.exit(1);
}
code = code.replace(targetGe, replacementGe);

// 5. Ye の置換
const targetYe = `Ye=(0,t.useMemo)(()=>{let e=B||[];const t=D,o=ee;return'member'===z&&t&&(e=e.filter(e=>e.archers&&e.archers.some(n=>n.memberId===t||o&&n.name===o||e.substitutionIds&&Object.values(e.substitutionIds).includes(t)||o&&e.substitutions&&Object.values(e.substitutions).includes(o)))),e.filter(e=>{`;
const replacementYe = `Ye=(0,t.useMemo)(()=>{let e=mySessions||[];return e.filter(e=>{`;

if (!code.includes(targetYe)) {
  console.error("エラー: Ye の置換ターゲットが見つかりません。");
  process.exit(1);
}
code = code.replace(targetYe, replacementYe);

// 6. Ye 依存配列の置換
const targetYeDeps = `},[B,te,oe,ie,J,K,z,D,ee]),`;
const replacementYeDeps = `},[mySessions,te,oe,ie,J,K]),`;

if (!code.includes(targetYeDeps)) {
  console.error("エラー: Ye 依存配列の置換ターゲットが見つかりません。");
  process.exit(1);
}
code = code.replace(targetYeDeps, replacementYeDeps);

fs.writeFileSync(filePath, code, 'utf8');
console.log("JP_HistoryScreen_692.js の修正が完了しました。");
