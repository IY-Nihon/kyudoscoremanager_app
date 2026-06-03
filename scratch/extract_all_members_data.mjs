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
    await signInWithEmailAndPassword(auth, email, password);

    const groupId = "910280";
    
    // 全メンバーを取得
    const mSnap = await getDocs(collection(db, `groups/${groupId}/members`));
    const membersMap = new Map(); // id -> memberData
    const memberNameMap = new Map(); // name -> id (for fallback)
    mSnap.forEach(d => {
      const data = d.data();
      membersMap.set(d.id, { id: d.id, name: data.name, grade: data.grade, stats: { shots: 0, hits: 0 } });
      if (data.name) {
        memberNameMap.set(data.name.trim().replace(/\s/g, ""), d.id);
      }
    });

    // 5月の全セッションを取得
    const sSnap = await getDocs(collection(db, `groups/${groupId}/sessions`));
    
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

      if (session.archers && Array.isArray(session.archers)) {
        session.archers.forEach(archer => {
          if (!archer || archer.isSeparator || archer.isTotalCalculator) return;

          const marks = archer.marks || [];
          const substitutions = archer.substitutions || {};
          const substitutionIds = archer.substitutionIds || {};
          const subIndices = Object.keys(substitutions).map(Number).sort((e, t) => e - t);

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

            // メンバーの特定
            let finalMemberId = null;
            if (currentId && membersMap.has(currentId)) {
              finalMemberId = currentId;
            } else {
              // 名前でのフォールバック
              const keyName = currentName.trim().replace(/\s/g, "");
              if (memberNameMap.has(keyName)) {
                finalMemberId = memberNameMap.get(keyName);
              }
            }

            if (finalMemberId) {
              const mData = membersMap.get(finalMemberId);
              mData.stats.shots++;
              if (mark === '○' || mark === '\u25cb') {
                mData.stats.hits++;
              }
            } else {
              // メンバー外（ゲストなど）
              const keyName = currentName.trim() || "ゲスト";
              if (!membersMap.has(keyName)) {
                membersMap.set(keyName, { id: keyName, name: keyName, grade: null, stats: { shots: 0, hits: 0 } });
              }
              const mData = membersMap.get(keyName);
              mData.stats.shots++;
              if (mark === '○' || mark === '\u25cb') {
                mData.stats.hits++;
              }
            }
          });
        });
      }
    });

    // 集計結果の出力用フォーマット
    const results = Array.from(membersMap.values())
      .filter(m => m.stats.shots > 0)
      .map(m => {
        const rate = (m.stats.hits / m.stats.shots * 100).toFixed(1);
        return {
          name: m.name,
          shots: m.stats.shots,
          hits: m.stats.hits,
          rate: parseFloat(rate)
        };
      })
      .sort((a, b) => b.rate - a.rate || b.shots - a.shots);

    console.log("=== CORRECTED MAY STATS ===");
    results.forEach(r => {
      console.log(`${r.name} ${r.rate}% (${r.hits}/${r.shots})`);
    });

  } catch(e) {
    console.error("Error:", e);
  }
  process.exit(0);
}

main();
