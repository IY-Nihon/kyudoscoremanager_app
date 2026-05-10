import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyB5Hv66bWUSqYidR5Dd7_ECMmQYklrT8x4",
  databaseURL: "https://nihondaigakukoukascore-default-rtdb.firebaseio.com",
  projectId: "nihondaigakukoukascore",
  storageBucket: "nihondaigakukoukascore.appspot.com",
  messagingSenderId: "891442494014",
  appId: "1:891442494014:web:fdecb0d493c8cb0a382f6f"
};

// Initialize Firebase only if it hasn't been initialized yet
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const db = getFirestore(app); // Firestore as default 'db'
export const rtdb = getDatabase(app); // Realtime Database as 'rtdb'
export const auth = getAuth(app);

export const ADMIN_EMAIL = "admin@nitidai.app";
export const ADMIN_PASSWORD = "123400";
