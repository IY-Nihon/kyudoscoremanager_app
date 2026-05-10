import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get } from 'firebase/database';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyB5Hv66bWUSqYidR5Dd7_ECMmQYklrT8x4",
  databaseURL: "https://nihondaigakukoukascore-default-rtdb.firebaseio.com",
  projectId: "nihondaigakukoukascore",
};

const app = initializeApp(firebaseConfig);
const rtdb = getDatabase(app);
const auth = getAuth(app);

async function main() {
  try {
    // Sign in
    await signInWithEmailAndPassword(auth, "MASKED", "MASKED");
    console.log("Auth OK");

    // Read RTDB appData top-level keys
    const snap = await get(ref(rtdb, 'appData'));
    if (snap.exists()) {
      const data = snap.val();
      const keys = Object.keys(data);
      console.log("RTDB appData keys:", keys);
      
      // Show counts
      if (data.members) {
        const members = Array.isArray(data.members) ? data.members.filter(Boolean) : Object.values(data.members);
        console.log("Members count:", members.length);
        if (members.length > 0) console.log("First member:", JSON.stringify(members[0]).substring(0, 200));
      }
      if (data.sessions) {
        const sessions = Array.isArray(data.sessions) ? data.sessions.filter(Boolean) : Object.values(data.sessions);
        console.log("Sessions count:", sessions.length);
      }
      if (data.history) {
        const history = Array.isArray(data.history) ? data.history.filter(Boolean) : Object.values(data.history);
        console.log("History count:", history.length);
      }
      if (data.alumni) {
        const alumni = Array.isArray(data.alumni) ? data.alumni.filter(Boolean) : Object.values(data.alumni);
        console.log("Alumni count:", alumni.length);
      }
    } else {
      console.log("RTDB appData is EMPTY or doesn't exist");
    }
  } catch(e) {
    console.error("Error:", e.message);
  }
  process.exit(0);
}
main();
