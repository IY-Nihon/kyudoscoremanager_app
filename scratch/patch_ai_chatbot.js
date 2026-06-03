const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/JP_AIChatBot_1034.js');
let code = fs.readFileSync(filePath, 'utf8');

// 1. getAllMembersStats の置換
const target1 = `            const rows = targetMembers.map(m => {
              let hits = 0, total = 0;
              const markCounts = {};
              targetSessions.forEach(s => {
                const archer = s.archers.find(a =>
                  a.memberId === m.id ||
                  a.name === m.name ||
                  (a.name && m.name && a.name.replace(/\\s/g,'') === m.name.replace(/\\s/g,''))
                );
                if (!archer?.marks) return;
                archer.marks.forEach(mk => {
                  // 文字コード記録（デバッグ用）
                  const code = mk ? mk.charCodeAt(0) : 'empty';
                  markCounts[\`\${mk}(\${code})\`] = (markCounts[\`\${mk}(\${code})\`] || 0) + 1;
                  if (mk === '○') { hits++; total++; }
                  else if (mk === '×') { total++; }
                });
              });
              // 永井 優郷のみデバッグ出力
              if (m.name === '永井 優郷') {
                console.log('[Debug 永井] markCounts:', JSON.stringify(markCounts), 'hits:', hits, 'total:', total);
              }
              const rate = total > 0 ? ((hits / total) * 100).toFixed(1) : '-';
              return \`\${m.name}|\${rate}|\${hits}/\${total}\`;
            });`;

const replacement1 = `            const rows = targetMembers.map(m => {
              let hits = 0, total = 0;
              const markCounts = {};
              targetSessions.forEach(s => {
                s.archers.forEach(a => {
                  if (!a || !a.marks) return;
                  const subs = a.substitutions || {};
                  const subIds = a.substitutionIds || {};
                  const subIndices = Object.keys(subs).map(Number).sort((e, t) => e - t);
                  
                  a.marks.forEach((mk, shotIdx) => {
                    if (mk !== '○' && mk !== '×') return; // 空欄は除外
                    
                    let currentId = a.memberId;
                    let currentName = a.name || '';
                    for (const subIdx of subIndices) {
                      if (subIdx <= shotIdx) {
                        currentId = subIds[subIdx] || undefined;
                        currentName = subs[subIdx] || '';
                      } else {
                        break;
                      }
                    }
                    
                    const isM = (m.id && currentId === m.id) || 
                                (currentName && m.name && currentName.replace(/\\s/g,'') === m.name.replace(/\\s/g,''));
                                
                    if (isM) {
                      const code = mk.charCodeAt(0);
                      markCounts[\`\${mk}(\${code})\`] = (markCounts[\`\${mk}(\${code})\`] || 0) + 1;
                      if (mk === '○') { hits++; total++; }
                      else if (mk === '×') { total++; }
                    }
                  });
                });
              });
              // 永井 優郷のみデバッグ出力
              if (m.name === '永井 優郷') {
                console.log('[Debug 永井] markCounts:', JSON.stringify(markCounts), 'hits:', hits, 'total:', total);
              }
              const rate = total > 0 ? ((hits / total) * 100).toFixed(1) : '-';
              return \`\${m.name}|\${rate}|\${hits}/\${total}\`;
            });`;

// 2. getDetailedMemberStats の置換
const target2 = `              sortedSessions.forEach((session, sessionIdx) => {
                const archerIdx = session.archers.findIndex(a => a.memberId === targetMember.id || a.name === targetMember.name);
                if (archerIdx !== -1) {
                  totalSessions++;
                  const archer = session.archers[archerIdx];
                  if (archer.marks && archer.marks.length > 0) {
                    // 各矢の的中 (1本目, 2本目, 3本目, 4本目)
                    archer.marks.forEach((m, idx) => {
                      if (m === '○' || m === '×') {
                        const arrowPos = idx % 4;
                        shotTotals[arrowPos]++;
                        if (m === '○') shotHits[arrowPos]++;
                        totalMarks++;
                        if (m === '○') hitMarks++;
                        if (sessionIdx < 10) {
                          recentTotal++;
                          if (m === '○') recentHit++;
                        }
                      }
                    });
                    // 皆中判定
                    for (let i = 0; i < Math.floor(archer.marks.length / 4); i++) {
                      const group = archer.marks.slice(4 * i, 4 * (i + 1));
                      if (group.length === 4 && group.every(m => m === '○')) kaichu++;
                    }
                    
                    // 大前 (1番目)
                    if (archerIdx === 0) {
                      archer.marks.forEach(m => {
                        if (m === '○' || m === '×') {
                          omaeTotal++;
                          if (m === '○') omaeHit++;
                        }
                      });
                    }
                    // 落 (最後、3人以上の場合)
                    if (session.archers.length >= 3 && archerIdx === session.archers.length - 1) {
                      archer.marks.forEach(m => {
                        if (m === '○' || m === '×') {
                          ochiTotal++;
                          if (m === '○') ochiHit++;
                        }
                      });
                    }
                  }
                }
              });`;

const replacement2 = `              sortedSessions.forEach((session, sessionIdx) => {
                let participatedInSession = false;
                session.archers.forEach((archer, archerIdx) => {
                  if (!archer || !archer.marks) return;
                  const subs = archer.substitutions || {};
                  const subIds = archer.substitutionIds || {};
                  const subIndices = Object.keys(subs).map(Number).sort((e, t) => e - t);
                  
                  archer.marks.forEach((m, idx) => {
                    if (m !== '○' && m !== '×') return;
                    
                    let currentId = archer.memberId;
                    let currentName = archer.name || '';
                    for (const subIdx of subIndices) {
                      if (subIdx <= idx) {
                        currentId = subIds[subIdx] || undefined;
                        currentName = subs[subIdx] || '';
                      } else {
                        break;
                      }
                    }
                    
                    const isTarget = (targetMember.id && currentId === targetMember.id) ||
                                     (currentName && targetMember.name && currentName.replace(/\\s/g,'') === targetMember.name.replace(/\\s/g,''));
                                     
                    if (isTarget) {
                      participatedInSession = true;
                      const arrowPos = idx % 4;
                      shotTotals[arrowPos]++;
                      if (m === '○') shotHits[arrowPos]++;
                      totalMarks++;
                      if (m === '○') hitMarks++;
                      if (sessionIdx < 10) {
                        recentTotal++;
                        if (m === '○') recentHit++;
                      }
                      
                      // 大前 (1番目)
                      if (archerIdx === 0) {
                        omaeTotal++;
                        if (m === '○') omaeHit++;
                      }
                      // 落 (最後、3人以上の場合)
                      if (session.archers.length >= 3 && archerIdx === session.archers.length - 1) {
                        ochiTotal++;
                        if (m === '○') ochiHit++;
                      }
                    }
                  });
                  
                  // 皆中判定
                  for (let i = 0; i < Math.floor(archer.marks.length / 4); i++) {
                    let isBlockAllTarget = true;
                    let isBlockAllHit = true;
                    for (let l = 0; l < 4; l++) {
                      const shotIdx = 4 * i + l;
                      const mark = archer.marks[shotIdx];
                      
                      let currentId = archer.memberId;
                      let currentName = archer.name || '';
                      for (const subIdx of subIndices) {
                        if (subIdx <= shotIdx) {
                          currentId = subIds[shotIdx] || undefined;
                          currentName = subs[shotIdx] || '';
                        } else {
                          break;
                        }
                      }
                      
                      const isTarget = (targetMember.id && currentId === targetMember.id) ||
                                       (currentName && targetMember.name && currentName.replace(/\\s/g,'') === targetMember.name.replace(/\\s/g,''));
                      
                      if (!isTarget) {
                        isBlockAllTarget = false;
                        break;
                      }
                      if (mark !== '○') {
                        isBlockAllHit = false;
                      }
                    }
                    if (isBlockAllTarget && isBlockAllHit) {
                      kaichu++;
                    }
                  }
                });
                if (participatedInSession) {
                  totalSessions++;
                }
              });`;

// 3. getSessionsByDate の置換
const target3 = `                const archer = s.archers.find(a =>
                  a.name === memberName ||
                  (a.name && memberName && a.name.replace(/\\s/g,'') === memberName.replace(/\\s/g,''))
                );
                if (!archer || !archer.marks) return null;
                const marks = archer.marks || [];
                const aTotal = marks.filter(m => m === '○' || m === '×').length;
                const aHits = marks.filter(m => m === '○').length;
                if (aTotal === 0) return null;
                totalHits += aHits;
                totalArrows += aTotal;
                const rate = ((aHits / aTotal) * 100).toFixed(1);
                return \`\${dateStr}|\${s.title || '無題'}|\${rate}|\${aHits}/\${aTotal}\`;`;

const replacement3 = `                let aTotal = 0;
                let aHits = 0;
                
                s.archers.forEach(archer => {
                  if (!archer || !archer.marks) return;
                  const subs = archer.substitutions || {};
                  const subIds = archer.substitutionIds || {};
                  const subIndices = Object.keys(subs).map(Number).sort((e, t) => e - t);
                  
                  archer.marks.forEach((mark, shotIdx) => {
                    if (mark !== '○' && mark !== '×') return;
                    
                    let currentName = archer.name || '';
                    for (const subIdx of subIndices) {
                      if (subIdx <= shotIdx) {
                        currentName = subs[subIdx] || '';
                      } else {
                        break;
                      }
                    }
                    
                    const isTarget = currentName && memberName && currentName.replace(/\\s/g,'') === memberName.replace(/\\s/g,'');
                    if (isTarget) {
                      aTotal++;
                      if (mark === '○') {
                        aHits++;
                      }
                    }
                  });
                });
                
                if (aTotal === 0) return null;
                totalHits += aHits;
                totalArrows += aTotal;
                const rate = ((aHits / aTotal) * 100).toFixed(1);
                return \`\${dateStr}|\${s.title || '無題'}|\${rate}|\${aHits}/\${aTotal}\`;`;

// 各ターゲットの存在を確認して置換
const checkAndReplace = (target, replacement, name) => {
  // 改行や余分なスペースに影響されないよう簡易正規化してマッチするか、部分マッチを使う
  // 今回はそのまま文字列置換を試みる。
  const targetClean = target.replace(/\r\n/g, '\n');
  const codeClean = code.replace(/\r\n/g, '\n');
  
  if (!codeClean.includes(targetClean)) {
    console.error(`Error: target for [${name}] not found in code!`);
    
    // ターゲットが存在しない原因を調査するために部分文字列でマッチテスト
    const lines = targetClean.split('\n');
    if (lines.length > 0) {
      console.log(`Checking first line of target: "${lines[0]}"`);
      console.log(`Includes first line? ${codeClean.includes(lines[0])}`);
    }
    process.exit(1);
  }
  code = codeClean.replace(targetClean, replacement.replace(/\r\n/g, '\n'));
  console.log(`Replacement for [${name}] succeeded.`);
};

checkAndReplace(target1, replacement1, "getAllMembersStats");
checkAndReplace(target2, replacement2, "getDetailedMemberStats");
checkAndReplace(target3, replacement3, "getSessionsByDate");

fs.writeFileSync(filePath, code, 'utf8');
console.log("AI ChatBot statistics patched successfully for all tools!");
