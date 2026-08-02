import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCQszmAjoOoIDst3f1Sf7qg8ZN3jgVVEpI",
  authDomain: "retreat-flow-2026.firebaseapp.com",
  databaseURL: "https://retreat-flow-2026-default-rtdb.firebaseio.com",
  projectId: "retreat-flow-2026",
  storageBucket: "retreat-flow-2026.firebasestorage.app",
  messagingSenderId: "590927482405",
  appId: "1:590927482405:web:0a3d696b939cf1d20639cc",
  measurementId: "G-P7F7QHRR2X"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const analytics = typeof window !== "undefined" ? isSupported().then(yes => yes ? getAnalytics(app) : null) : null;