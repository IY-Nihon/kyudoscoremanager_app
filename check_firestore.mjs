import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyB5Hv66bWUSqYidR5Dd7_ECMmQYklrT8x4",
  databaseURL: "https://nihondaigakukoukascore-default-rtdb.firebaseio.com",
  projectId: "nihondaigakukoukascore",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function main() {
  try {
    await signInWithEmailAndPassword(auth, "MASKED", "MASKED");
    console.log("Auth OK");

    const mSnap = await getDocs(collection(db, 'members'));
    console.log("Firestore members count:", mSnap.size);
    mSnap.forEach(d => {
      const data = d.data();
      console.log("  Member:", d.id, data.name || 'NO NAME');
    });

    const sSnap = await getDocs(collection(db, 'sessions'));
    console.log("Firestore sessions count:", sSnap.size);
    sSnap.forEach(d => {
      const data = d.data();
      console.log("  Session:", d.id, data.title || data.date || 'NO TITLE');
    });
  } catch(e) {
    console.error("Error:", e.message);
  }
  process.exit(0);
}
main();
