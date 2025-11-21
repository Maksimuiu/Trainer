// src/firebase.js
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue, update, push, transaction } from "firebase/database";
import { getAnalytics } from "firebase/analytics";

// Firebase-Konfiguration
const firebaseConfig = {
  apiKey: "AIzaSyAhvwwaURB4D9aFtTclXyt8Tdq0b3x76UI",
  authDomain: "vokabelnenglish.firebaseapp.com",
  databaseURL: "https://vokabelnenglish-default-rtdb.firebaseio.com",
  projectId: "vokabelnenglish",
  storageBucket: "vokabelnenglish.firebasestorage.app",
  messagingSenderId: "116210775262",
  appId: "1:116210775262:web:a14f5baf61f208bbdc3e4f",
  measurementId: "G-YZ9N9ZQZ5M"
};

// Firebase initialisieren
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getDatabase(app);

export { db, ref, set, onValue, update, push, transaction };
