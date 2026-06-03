import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAQ6boCxhgWryZDYzDCvqx-0hsokPR71oU",
  authDomain: "kyudoscoremanager.firebaseapp.com",
  databaseURL: "https://kyudoscoremanager-default-rtdb.firebaseio.com",
  projectId: "kyudoscoremanager",
  storageBucket: "kyudoscoremanager.firebasestorage.app",
  messagingSenderId: "850678478571",
  appId: "1:850678478571:web:e3603c9b00acec7c2830ae"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const email = "admin@nitidai.app";
const password = "123400";

async function main() {
  try {
    console.log("Authenticating...");
    await signInWithEmailAndPassword(auth, email, password);
    console.log("Auth OK!");

    const gSnap = await getDocs(collection(db, 'groups'));
    let groupIds = [];
    gSnap.forEach(d => groupIds.push(d.id));

    for (const groupId of groupIds) {
      if (groupId !== "910280") continue; // 今回は日本大学工科弓道部 (910280) のみ

      console.log(`\n--- Scanning group: ${groupId} ---`);
      
      const mSnap = await getDocs(collection(db, `groups/${groupId}/members`));
      let nagaiId = null;
      mSnap.forEach(d => {
        const data = d.data();
        if (data.name === "永井 優郷" || data.name?.includes("永井")) {
          nagaiId = d.id;
        }
      });
      console.log("Nagai Member ID:", nagaiId);

      const sSnap = await getDocs(collection(db, `groups/${groupId}/sessions`));

      let totalArrowsWithSub = 0;
      let hitsWithSub = 0;
      let detailedMatches = [];

      sSnap.forEach(d => {
        const session = d.data();
        let dateObj = null;

        if (session.date) {
          if (typeof session.date === 'string') dateObj = new Date(session.date);
          else if (typeof session.date === 'number') dateObj = new Date(session.date);
          else if (session.date.seconds !== undefined) dateObj = new Date(session.date.seconds * 1000);
        }

        if (!dateObj || isNaN(dateObj.getTime())) return;
        const year = dateObj.getFullYear();
        const month = dateObj.getMonth();
        if (year !== 2026 || month !== 4) return; // 2026年5月のみ

        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;

        if (session.archers && Array.isArray(session.archers)) {
          session.archers.forEach((archer, archerIdx) => {
            if (!archer || archer.isSeparator || archer.isTotalCalculator) return;

            const marks = archer.marks || [];
            const substitutions = archer.substitutions || {};
            const substitutionIds = archer.substitutionIds || {};
            const subIndices = Object.keys(substitutions).map(Number).sort((e, t) => e - t);

            // この行で永井優郷が関与しているかチェック
            // （元の射手が永井優郷、または交代相手に永井優郷がいる）
            let hasNagai = (archer.memberId === nagaiId || archer.name === "永井 優郷" || archer.name?.trim().replace(/\s/g, "") === "永井優郷");
            if (!hasNagai) {
              // 交代メンバーに永井がいるか確認
              for (const idx of subIndices) {
                const subName = substitutions[idx] || '';
                const subId = substitutionIds[idx];
                if (subId === nagaiId || subName === "永井 優郷" || subName.trim().replace(/\s/g, "") === "永井優郷") {
                  hasNagai = true;
                  break;
                }
              }
            }

            if (!hasNagai) return;

            // 1射ごとに、その射を引いたのが永井かどうかを判定してカウント
            let nagaiArrowsInSession = 0;
            let nagaiHitsInSession = 0;
            let archerDetails = [];

            marks.forEach((mark, shotIdx) => {
              if (mark !== '○' && mark !== '\u25cb' && mark !== '×' && mark !== '\xd7') {
                return; // 空欄は除外
              }

              // 交代の判定
              let currentId = archer.memberId;
              let currentName = archer.name || '';
              for (const subIdx of subIndices) {
                if (subIdx <= shotIdx) {
                  currentId = substitutionIds[subIdx] || undefined;
                  currentName = substitutions[subIdx] || '';
                } else {
                  break;
                }
              }

              const isNagai = (nagaiId && currentId === nagaiId) || (currentName === "永井 優郷" || currentName.trim().replace(/\s/g, "") === "永井優郷");

              if (isNagai) {
                nagaiArrowsInSession++;
                const isHit = mark === '○' || mark === '\u25cb';
                if (isHit) {
                  nagaiHitsInSession++;
                }
                archerDetails.push({
                  shotIdx,
                  mark,
                  isHit,
                  shooter: currentName,
                  isSubbed: currentName !== archer.name
                });
              }
            });

            if (nagaiArrowsInSession > 0) {
              totalArrowsWithSub += nagaiArrowsInSession;
              hitsWithSub += nagaiHitsInSession;
              detailedMatches.push({
                sessionId: d.id,
                date: dateStr,
                title: session.title,
                originalArcher: archer.name,
                arrows: nagaiArrowsInSession,
                hits: nagaiHitsInSession,
                details: archerDetails,
                substitutions: substitutions
              });
            }
          });
        }
      });

      console.log(`\n=== Correct Sub-aware Summary for 5月 (Nagai Yuugo) ===`);
      console.log("Total matched rows involving Nagai:", detailedMatches.length);
      console.log("Total Arrows (excluding blanks, sub-aware):", totalArrowsWithSub);
      console.log("Hits (strictly sub-aware):", hitsWithSub, `(${((hitsWithSub/totalArrowsWithSub)*100).toFixed(1)}%)`);

      detailedMatches.forEach(m => {
        console.log(`\nSession: ${m.date} - ${m.title || "No Title"} (${m.sessionId})`);
        console.log(`  Row Original Archer: ${m.originalArcher}`);
        console.log(`  Nagai Arrows here: ${m.arrows}, Hits: ${m.hits}`);
        if (Object.keys(m.substitutions).length > 0) {
          console.log(`  Substitutions mapping in row:`, JSON.stringify(m.substitutions));
        }
        console.log(`  Nagai Shot list:`, m.details.map(d => `${d.shotIdx+1}:${d.mark}${d.isSubbed?'(交代)':''}`).join(" "));
      });
    }

  } catch(e) {
    console.error("Error running script:", e);
  }
  process.exit(0);
}

main();
