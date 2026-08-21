// App.js
// Vokabeltrainer + Firebase Accounts + Multiplayer + Homework + Admin Panel
//
// WICHTIG:
// 1. Aktiviere in Firebase Authentication -> Sign-in method -> Email/Password.
// 2. Passwörter werden NICHT in Realtime Database gespeichert.
// 3. Realtime Database Rules müssen die Rollen ebenfalls absichern.
// 4. Der Admin ist alexmaxi14@evgbm.net.
// 5. Admins können Passwörter nicht auslesen, sondern Passwort-Reset-Mails senden.

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

import { initializeApp } from "firebase/app";
import {
  getDatabase,
  ref,
  set,
  push,
  onValue,
  update,
  get,
  onDisconnect,
  remove
} from "firebase/database";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail
} from "firebase/auth";

// ============================================================
// FIREBASE
// ============================================================

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

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

const ADMIN_EMAIL = "alexmaxi14@evgbm.net";

const ROLES = {
  STUDENT: "student",
  TEACHER: "teacher",
  HOST: "host",
  ADMIN: "admin"
};

// ============================================================
// VOKABELSETS
// ============================================================

const SETS = {
  "Unit 2": "https://raw.githubusercontent.com/Maksimuiu/voka/main/Unit2",
  "2b": "https://raw.githubusercontent.com/Maksimuiu/voka/main/2b",
  "The Months": "https://raw.githubusercontent.com/Maksimuiu/voka/main/The%20Months",
  "Food": "https://raw.githubusercontent.com/Maksimuiu/voka/main/Food",
  "Unit 1Story": "https://raw.githubusercontent.com/Maksimuiu/voka/main/Unit%201%20Story",
  "Unit 3Story": "https://raw.githubusercontent.com/Maksimuiu/voka/main/Unit%203%20Story",
  "Dare": "https://raw.githubusercontent.com/Maksimuiu/voka/main/Dare",
  "Unit 2  want - wait": "https://raw.githubusercontent.com/Maksimuiu/voka/main/Unit%202%20%20want%20-%20wait",
  "irgendwas": "random"
};

// ============================================================
// STYLES
// ============================================================

const styles = {
  container: {
    fontFamily: "Arial, sans-serif",
    textAlign: "center",
    marginTop: 20,
    paddingBottom: 150,
    minHeight: "100vh",
    boxSizing: "border-box"
  },
  box: {
    width: "380px",
    maxWidth: "calc(100% - 30px)",
    padding: "15px",
    margin: "12px auto",
    borderRadius: "10px",
    background: "#f2f2f2",
    boxShadow: "0 3px 10px rgba(0,0,0,0.2)",
    boxSizing: "border-box"
  },
  wideBox: {
    width: "900px",
    maxWidth: "calc(100% - 30px)",
    padding: "20px",
    margin: "12px auto",
    borderRadius: "12px",
    background: "#fff",
    boxShadow: "0 3px 14px rgba(0,0,0,0.12)",
    boxSizing: "border-box",
    textAlign: "left"
  },
  input: {
    width: "320px",
    maxWidth: "100%",
    padding: "10px",
    marginBottom: "10px",
    borderRadius: "5px",
    border: "1px solid #aaa",
    fontSize: "14px",
    boxSizing: "border-box"
  },
  textarea: {
    width: "320px",
    maxWidth: "100%",
    padding: "10px",
    borderRadius: "5px",
    border: "1px solid #aaa",
    fontSize: "14px",
    marginBottom: "10px",
    resize: "vertical",
    boxSizing: "border-box"
  },
  button: {
    width: "320px",
    maxWidth: "100%",
    padding: "10px",
    marginTop: "5px",
    borderRadius: "5px",
    border: "none",
    background: "#4a6eff",
    color: "white",
    cursor: "pointer"
  },
  buttonSmall: {
    width: "150px",
    maxWidth: "100%",
    padding: "8px",
    margin: "5px",
    borderRadius: "5px",
    border: "none",
    background: "#4a6eff",
    color: "white",
    cursor: "pointer"
  },
  danger: {
    background: "#d93025",
    color: "#fff",
    border: "none",
    borderRadius: 5,
    padding: "8px 12px",
    cursor: "pointer",
    margin: 4
  },
  success: {
    background: "#2dbe60",
    color: "#fff",
    border: "none",
    borderRadius: 5,
    padding: "8px 12px",
    cursor: "pointer",
    margin: 4
  },
  orange: {
    background: "#f39c12",
    color: "#fff",
    border: "none",
    borderRadius: 5,
    padding: "8px 12px",
    cursor: "pointer",
    margin: 4
  },
  flashcards: {
    maxHeight: "220px",
    overflowY: "auto",
    marginBottom: "10px"
  },
  card: {
    padding: "8px",
    marginBottom: "6px",
    background: "white",
    borderRadius: "5px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.15)"
  },
  bottomBar: {
    position: "fixed",
    left: 20,
    right: 20,
    bottom: 20,
    display: "flex",
    justifyContent: "center",
    gap: 12,
    zIndex: 100
  },
  lobbyBox: {
    width: "560px",
    maxWidth: "calc(100% - 30px)",
    padding: "15px",
    margin: "12px auto",
    borderRadius: "10px",
    background: "#fff",
    boxShadow: "0 3px 12px rgba(0,0,0,0.07)",
    boxSizing: "border-box"
  },
  playersList: {
    maxHeight: 200,
    overflowY: "auto",
    textAlign: "left"
  },
  row: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center"
  },
  adminRow: {
    padding: 10,
    borderBottom: "1px solid #ddd",
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between"
  },
  badge: {
    display: "inline-block",
    padding: "4px 8px",
    borderRadius: 20,
    background: "#eee",
    fontSize: 12
  }
};

// ============================================================
// HELPERS
// ============================================================

const parseVocab = (text) =>
  (text || "")
    .split("\n")
    .map((line) => {
      const parts = line.split(/[,;]+/);
      const de = parts[0]?.trim();
      const en = parts[1]?.trim();
      return de && en ? { de, en } : null;
    })
    .filter(Boolean);

const normalize = (str) =>
  (str || "")
    .trim()
    .replace(/[.!?]/g, "")
    .replace(/\s+/g, " ")
    .toLowerCase();

const getValidAnswers = (word) =>
  (word || "").split("/").map((w) => normalize(w));

const genLobbyId = () =>
  Math.random().toString(36).substring(2, 8).toUpperCase();

const genHomeworkId = () =>
  Math.random().toString(36).substring(2, 10).toUpperCase();

const isSchoolEmail = (email) =>
  typeof email === "string" &&
  email.trim().toLowerCase().endsWith("@evgbm.net");

const canCreateHomework = (role) =>
  role === ROLES.ADMIN ||
  role === ROLES.TEACHER ||
  role === ROLES.HOST;

const isAdminEmail = (email) =>
  String(email || "").trim().toLowerCase() === ADMIN_EMAIL;

const defaultHomework = (email) => ({
  title: "Neue Hausaufgabe",
  description: "",
  amount: 3,
  setName: "Unit 2",
  vocabText: "",
  timeLimit: 0,
  pointsPerCorrect: 1,
  shuffle: true,
  allowRetry: true,
  active: true,
  createdBy: email,
  createdAt: Date.now()
});

// ============================================================
// APP
// ============================================================

export default function App() {
  // ----------------------------------------------------------
  // ACCOUNT
  // ----------------------------------------------------------

  const [firebaseUser, setFirebaseUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [showLoginMenu, setShowLoginMenu] = useState(false);
  const [authMode, setAuthMode] = useState("login");

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [username, setUsername] = useState("");
  const [multiusername, setMultiUsername] = useState("");

  const loggedIn = !!firebaseUser;
  const isAdmin = !!profile?.isAdmin || isAdminEmail(firebaseUser?.email);
  const role = isAdmin ? ROLES.ADMIN : profile?.role || ROLES.STUDENT;

  // ----------------------------------------------------------
  // SINGLEPLAYER
  // ----------------------------------------------------------

  const [vocabText, setVocabText] = useState("");
  const [vocabList, setVocabList] = useState([]);
  const [currentCard, setCurrentCard] = useState(null);
  const [answer, setAnswer] = useState("");
  const [score, setScore] = useState(0);
  const [displayScore, setDisplayScore] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [done, setDone] = useState(false);
  const [started, setStarted] = useState(false);
  const [showGermanFirst, setShowGermanFirst] = useState(true);
  const [selectedSet, setSelectedSet] = useState("Unit 2");
  const [languageLabel, setLanguageLabel] = useState("");
  const [titleClicks, setTitleClicks] = useState(0);
  const [pendingBonusPoints, setPendingBonusPoints] = useState(0);
  const [showEmoji, setShowEmoji] = useState(false);
  const [, setEmojiAnimating] = useState(false);
  const [setLoading, setSetLoading] = useState(false);

  // ----------------------------------------------------------
  // MULTIPLAYER
  // ----------------------------------------------------------

  const [isMultiplayerMode, setIsMultiplayerMode] = useState(false);
  const [lobbyId, setLobbyId] = useState("");
  const [joinLobbyId, setJoinLobbyId] = useState("");
  const [lobbyData, setLobbyData] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [hostPlays, setHostPlays] = useState(true);
  const [playersLocal, setPlayersLocal] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [multiplayerResultsVisible, setMultiplayerResultsVisible] = useState(false);

  const [autoAdvance, setAutoAdvance] = useState(true);
  const [bonusRoundActive, setBonusRoundActive] = useState(false);

  const roundTimerRef = useRef(null);
  const lobbyListenerRef = useRef(null);
  const monitorListenerRef = useRef(null);

  // ----------------------------------------------------------
  // HOMEWORK
  // ----------------------------------------------------------

  const [homeworkList, setHomeworkList] = useState([]);
  const [homeworkView, setHomeworkView] = useState(false);
  const [homeworkEditorOpen, setHomeworkEditorOpen] = useState(false);
  const [homeworkEditor, setHomeworkEditor] = useState(defaultHomework(""));
  const [activeHomework, setActiveHomework] = useState(null);
  const [homeworkResults, setHomeworkResults] = useState({});

  // ----------------------------------------------------------
  // ADMIN
  // ----------------------------------------------------------

  const [adminOpen, setAdminOpen] = useState(false);
  const [allUsers, setAllUsers] = useState({});
  const [allHomework, setAllHomework] = useState({});
  const [adminTab, setAdminTab] = useState("users");

  // ----------------------------------------------------------
  // ACCOUNT AUTH LISTENER
  // ----------------------------------------------------------

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);

      if (!user) {
        setProfile(null);
        setUsername("");
        setMultiUsername("");
        setAuthLoading(false);
        return;
      }

      try {
        const userRef = ref(db, `users/${user.uid}`);
        const snap = await get(userRef);

        let p = snap.exists() ? snap.val() : null;

        if (!p) {
          p = {
            uid: user.uid,
            email: user.email,
            username: user.email.split("@")[0],
            role: isAdminEmail(user.email) ? ROLES.ADMIN : ROLES.STUDENT,
            isAdmin: isAdminEmail(user.email),
            blocked: false,
            createdAt: Date.now(),
            lastLogin: Date.now()
          };

          await set(userRef, p);
        } else {
          const updates = {
            lastLogin: Date.now()
          };

          if (isAdminEmail(user.email)) {
            updates.role = ROLES.ADMIN;
            updates.isAdmin = true;
          }

          await update(userRef, updates);
          p = { ...p, ...updates };
        }

        setProfile(p);
        setUsername(p.username || user.email.split("@")[0]);
        setMultiUsername(p.username || user.email.split("@")[0]);

        if (p.blocked) {
          alert("Dieses Konto wurde gesperrt.");
          await signOut(auth);
        }
      } catch (err) {
        console.error(err);
        alert("Profil konnte nicht geladen werden.");
      }

      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // ----------------------------------------------------------
  // LOAD HOMEWORK
  // ----------------------------------------------------------

  useEffect(() => {
    if (!firebaseUser) {
      setHomeworkList([]);
      return;
    }

    const homeworkRef = ref(db, "homework");

    const unsubscribe = onValue(homeworkRef, (snap) => {
      const data = snap.val() || {};

      const arr = Object.entries(data)
        .map(([id, value]) => ({ id, ...value }))
        .filter((h) => h.active !== false);

      setHomeworkList(arr);
      setAllHomework(data);
    });

    return () => unsubscribe();
  }, [firebaseUser]);

  // ----------------------------------------------------------
  // ADMIN USER LIST
  // ----------------------------------------------------------

  useEffect(() => {
    if (!isAdmin) {
      setAllUsers({});
      return;
    }

    const usersRef = ref(db, "users");

    const unsubscribe = onValue(usersRef, (snap) => {
      setAllUsers(snap.val() || {});
    });

    return () => unsubscribe();
  }, [isAdmin]);

  // ----------------------------------------------------------
  // HOMEWORK RESULTS
  // ----------------------------------------------------------

  useEffect(() => {
    if (!firebaseUser) return;

    const resultsRef = ref(db, `homeworkResults/${firebaseUser.uid}`);

    const unsubscribe = onValue(resultsRef, (snap) => {
      setHomeworkResults(snap.val() || {});
    });

    return () => unsubscribe();
  }, [firebaseUser]);

  // ==========================================================
  // AUTH
  // ==========================================================

  const handleAuth = async () => {
    const email = loginEmail.trim().toLowerCase();

    if (!isSchoolEmail(email)) {
      alert("Bitte eine @evgbm.net Schul-E-Mail verwenden.");
      return;
    }

    if (loginPassword.length < 8) {
      alert("Das Passwort muss mindestens 8 Zeichen haben.");
      return;
    }

    try {
      if (authMode === "register") {
        const credential = await createUserWithEmailAndPassword(
          auth,
          email,
          loginPassword
        );

        const user = credential.user;

        const userData = {
          uid: user.uid,
          email,
          username: email.split("@")[0],
          role: isAdminEmail(email) ? ROLES.ADMIN : ROLES.STUDENT,
          isAdmin: isAdminEmail(email),
          blocked: false,
          createdAt: Date.now(),
          lastLogin: Date.now()
        };

        await set(ref(db, `users/${user.uid}`), userData);

        setShowLoginMenu(false);
        setLoginPassword("");
        alert("Konto erstellt und eingeloggt.");
      } else {
        // WICHTIG:
        // Hier wird KEIN neues Konto angelegt.
        // Firebase prüft, ob das Konto bereits existiert.
        const credential = await signInWithEmailAndPassword(
          auth,
          email,
          loginPassword
        );

        const userRef = ref(db, `users/${credential.user.uid}`);
        const snap = await get(userRef);

        if (snap.exists() && snap.val().blocked) {
          await signOut(auth);
          alert("Dieses Konto ist gesperrt.");
          return;
        }

        setShowLoginMenu(false);
        setLoginPassword("");
      }
    } catch (err) {
      console.error(err);

      if (err.code === "auth/email-already-in-use") {
        alert("Dieses Konto existiert bereits. Bitte einloggen.");
      } else if (
        err.code === "auth/invalid-credential" ||
        err.code === "auth/wrong-password" ||
        err.code === "auth/user-not-found"
      ) {
        alert("E-Mail oder Passwort falsch.");
      } else if (err.code === "auth/weak-password") {
        alert("Das Passwort ist zu schwach.");
      } else {
        alert(`Login-Fehler: ${err.message}`);
      }
    }
  };

  const handlePasswordReset = async () => {
    const email = loginEmail.trim().toLowerCase();

    if (!isSchoolEmail(email)) {
      alert("Bitte zuerst deine @evgbm.net E-Mail eingeben.");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      alert("Eine Passwort-Reset-Mail wurde angefordert.");
    } catch (err) {
      console.error(err);
      alert("Passwort-Reset konnte nicht gesendet werden.");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setAdminOpen(false);
      setHomeworkView(false);
      setIsMultiplayerMode(false);
    } catch (err) {
      console.error(err);
    }
  };

  // ==========================================================
  // VOCAB
  // ==========================================================

 
  const mixSetsRandomly = async (setNames, amountPerSet = 5) => {
    if (setNames.includes("random")) {
      setNames = Object.keys(SETS).filter((s) => SETS[s] !== "random");
      amountPerSet = Math.ceil(20 / setNames.length);
    }

    let result = [];

    for (const name of setNames) {
      try {
        const res = await fetch(SETS[name]);
        const text = await res.text();
        const words = parseVocab(text);

        const random = [...words]
          .sort(() => 0.5 - Math.random())
          .slice(0, amountPerSet);

        result.push(...random);
      } catch (err) {
        console.error("Set konnte nicht geladen werden:", name, err);
      }
    }

    return result.sort(() => 0.5 - Math.random()).slice(0, 20);
  };

  const addGitHubVocab = async () => {
    try {
      setSetLoading(true);

      const url = SETS[selectedSet];

      if (url === "random") {
        const randomWords = await mixSetsRandomly(["random"], 20);

        setVocabText(
          randomWords.map((v) => `${v.de},${v.en}`).join("\n")
        );

        return;
      }

      const res = await fetch(url);
      const text = await res.text();
      const imported = parseVocab(text);

      const existing = parseVocab(vocabText);
      const combined = [...existing, ...imported].slice(0, 50);

      setVocabText(
        combined.map((v) => `${v.de},${v.en}`).join("\n")
      );
    } catch (err) {
      console.error(err);
      alert("Fehler beim Importieren.");
    } finally {
      setSetLoading(false);
    }
  };

  // ==========================================================
  // SINGLEPLAYER
  // ==========================================================

  const startSession = (providedList = null) => {
    let listToUse =
      Array.isArray(providedList) && providedList.length
        ? providedList
        : [];

    if (!listToUse.length && vocabList.length) {
      listToUse = vocabList;
    }

    if (!listToUse.length) {
      const parsed = parseVocab(vocabText);

      if (parsed.length) {
        listToUse = parsed.slice(0, 50);
      }
    }

    if (!listToUse.length) {
      alert("Keine Vokabeln vorhanden.");
      return;
    }

    const prep = listToUse
      .map((v) => ({
        de: v.de,
        en: v.en,
        answered: false,
        correct: false,
        userAnswer: ""
      }))
      .slice(0, 50);

    setVocabList(prep);
    setScore(0);
    setDisplayScore(0);
    setDone(false);
    setStarted(true);
    setShowEmoji(false);
    setEmojiAnimating(false);
    setFeedback("");

    nextCard(prep);
  };

  const nextCard = (list = vocabList) => {
    const remaining = (list || []).filter((v) => !v.answered);

    if (!remaining.length) {
      setDone(true);
      setCurrentCard(null);
      setShowEmoji(true);
      setDisplayScore(0);
      return;
    }

    const random =
      remaining[Math.floor(Math.random() * remaining.length)];

    const germanFirst = Math.random() > 0.5;

    setShowGermanFirst(germanFirst);
    setLanguageLabel(
      germanFirst
        ? "Deutsch → Englisch"
        : "Englisch → Deutsch"
    );

    setCurrentCard(random);
    setAnswer("");
    setFeedback("");
  };

  const checkAnswer = () => {
    if (!currentCard) return;

    if (currentCard.answered) {
      setFeedback("Diese Vokabel wurde bereits beantwortet.");
      return;
    }

    const correctWord = showGermanFirst
      ? currentCard.en
      : currentCard.de;

    const validAnswers = getValidAnswers(correctWord);
    const userNorm = normalize(answer);

    const isSpecial = userNorm === "am";
    const isCorrect =
      isSpecial || validAnswers.includes(userNorm);

    setFeedback(
      isCorrect
        ? "✅ richtig!"
        : `❌ richtig: ${correctWord}`
    );

    let addedScore = isCorrect ? 1 : 0;

    if (pendingBonusPoints > 0) {
      addedScore += pendingBonusPoints;
      setPendingBonusPoints(0);
    }

    if (addedScore > 0) {
      setScore((prev) => prev + addedScore);
    }

    const updated = vocabList.map((v) =>
      v.de === currentCard.de
        ? {
            ...v,
            answered: true,
            correct: isCorrect,
            userAnswer: isSpecial
              ? correctWord
              : answer
          }
        : v
    );

    setVocabList(updated);

    setTimeout(() => nextCard(updated), 900);
  };

  useEffect(() => {
    if (!done && displayScore < score) {
      const t = setTimeout(
        () => setDisplayScore((prev) => prev + 1),
        250
      );

      return () => clearTimeout(t);
    }
  }, [displayScore, score, done]);

  useEffect(() => {
    if (!done) return;

    setShowEmoji(true);
    setEmojiAnimating(true);

    const duration = 1200;

    const id = setTimeout(() => {
      setEmojiAnimating(false);
      setDisplayScore(0);

      const total = score;

      if (total <= 0) return;

      const steps = Math.min(30, total);
      const increment = Math.ceil(total / steps);
      const intervalMs = Math.max(
        30,
        Math.floor(duration / steps)
      );

      let current = 0;

      const timer = setInterval(() => {
        current += increment;

        if (current >= total) {
          setDisplayScore(total);
          clearInterval(timer);
        } else {
          setDisplayScore(current);
        }
      }, intervalMs);

      return () => clearInterval(timer);
    }, duration);

    return () => clearTimeout(id);
  }, [done, score]);

  const handleTitleClick = () => {
    const clicks = titleClicks + 1;

    setTitleClicks(clicks);

    if (clicks === 12) {
      setPendingBonusPoints(10);
    } else if (clicks > 12) {
      setPendingBonusPoints((prev) => prev + 1);
    }
  };

  const getEmoji = () =>
    score < 5 ? "😢" : score < 10 ? "😐" : "😄";

  const exportPDF = async () => {
    const element = document.getElementById("flashcards");

    if (!element) {
      alert("Keine Flashcards.");
      return;
    }

    const canvas = await html2canvas(element);
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF();

    pdf.addImage(
      imgData,
      "PNG",
      10,
      10,
      180,
      180
    );

    pdf.save("flashcards.pdf");
  };

  const reset = () => {
    setStarted(false);
    setDone(false);
    setVocabList([]);
    setCurrentCard(null);
    setAnswer("");
    setFeedback("");
    setScore(0);
    setDisplayScore(0);
    setShowEmoji(false);
    setLanguageLabel("");
    setTitleClicks(0);
    setPendingBonusPoints(0);
    setEmojiAnimating(false);
    setMultiplayerResultsVisible(false);
    setActiveHomework(null);
  };

  // ==========================================================
  // HOMEWORK CREATION
  // ==========================================================

  const openHomeworkCreator = () => {
    if (!loggedIn) {
      alert("Du musst eingeloggt sein.");
      setShowLoginMenu(true);
      return;
    }

    if (!canCreateHomework(role)) {
      alert("Nur Lehrer, Hosts oder Admins dürfen Hausaufgaben erstellen.");
      return;
    }

    setHomeworkEditor({
      ...defaultHomework(firebaseUser.email),
      id: genHomeworkId()
    });

    setHomeworkEditorOpen(true);
  };

  const saveHomework = async () => {
    if (!firebaseUser) return;

    if (!canCreateHomework(role)) {
      alert("Keine Berechtigung.");
      return;
    }

    const h = homeworkEditor;

    const amount = Math.max(
      1,
      Math.min(100, Number(h.amount) || 3)
    );

    let vocab = [];

    if (h.vocabText.trim()) {
      vocab = parseVocab(h.vocabText);
    } else if (h.setName) {
      try {
        const url = SETS[h.setName];

        if (url === "random") {
          vocab = await mixSetsRandomly(["random"], amount);
        } else {
          const res = await fetch(url);
          const text = await res.text();
          vocab = parseVocab(text);
        }
      } catch (err) {
        console.error(err);
      }
    }

    vocab = vocab.slice(0, amount);

    if (!vocab.length) {
      alert("Keine Vokabeln für die Hausaufgabe gefunden.");
      return;
    }

    const homeworkId =
      h.id || genHomeworkId();

    const data = {
      ...h,
      id: homeworkId,
      amount,
      vocab,
      createdBy: firebaseUser.email,
      createdByRole: role,
      createdAt: h.createdAt || Date.now(),
      active: true
    };

    await set(
      ref(db, `homework/${homeworkId}`),
      data
    );

    setHomeworkEditorOpen(false);

    alert("Hausaufgabe gespeichert.");
  };

  const deleteHomework = async (id) => {
    if (!isAdmin && !canCreateHomework(role)) return;

    if (!window.confirm("Hausaufgabe wirklich löschen?")) {
      return;
    }

    await remove(ref(db, `homework/${id}`));
  };

 
  // ==========================================================
  // HOMEWORK PLAY
  // ==========================================================

  const startHomework = (homework) => {
    if (!firebaseUser) {
      setShowLoginMenu(true);
      return;
    }

    let list = Array.isArray(homework.vocab)
      ? [...homework.vocab]
      : [];

    if (homework.shuffle !== false) {
      list = list.sort(() => Math.random() - 0.5);
    }

    list = list.slice(
      0,
      Number(homework.amount) || list.length
    );

    if (!list.length) {
      alert("Diese Hausaufgabe enthält keine Vokabeln.");
      return;
    }

    const prepared = list.map((v) => ({
      ...v,
      answered: false,
      correct: false,
      userAnswer: ""
    }));

    setActiveHomework(homework);
    setHomeworkView(false);

    setVocabList(prepared);
    setVocabText(
      prepared.map((v) => `${v.de},${v.en}`).join("\n")
    );

    setScore(0);
    setDisplayScore(0);
    setDone(false);
    setStarted(true);
    setShowEmoji(false);

    nextCard(prepared);
  };

  const finishHomework = async (finalScore, answers) => {
    if (!firebaseUser || !activeHomework) return;

    const result = {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      homeworkId: activeHomework.id,
      homeworkTitle: activeHomework.title,
      score: finalScore,
      maxScore:
        (activeHomework.amount || vocabList.length) *
        (activeHomework.pointsPerCorrect || 1),
      answers,
      completedAt: Date.now()
    };

    await set(
      ref(
        db,
        `homeworkResults/${firebaseUser.uid}/${activeHomework.id}`
      ),
      result
    );
  };

  // Wenn eine Hausaufgabe beendet wird, Ergebnis speichern.
  useEffect(() => {
    if (!done || !activeHomework) return;

    finishHomework(score, vocabList);
  }, [done]);

  // ==========================================================
  // ADMIN
  // ==========================================================

  const updateUserRole = async (uid, newRole) => {
    if (!isAdmin) return;

    await update(
      ref(db, `users/${uid}`),
      {
        role: newRole,
        isAdmin: newRole === ROLES.ADMIN
      }
    );
  };

  const toggleUserBlocked = async (uid, blocked) => {
    if (!isAdmin) return;

    await update(
      ref(db, `users/${uid}`),
      { blocked: !blocked }
    );
  };

  const adminPasswordReset = async (email) => {
    if (!isAdmin) return;

    try {
      await sendPasswordResetEmail(auth, email);
      alert(`Passwort-Reset wurde an ${email} gesendet.`);
    } catch (err) {
      console.error(err);
      alert("Passwort-Reset konnte nicht gesendet werden.");
    }
  };

  const adminDeleteUserRecord = async (uid) => {
    if (!isAdmin) return;

    if (
      !window.confirm(
        "Das Profil aus der Realtime Database löschen? Das Firebase-Authentication-Konto bleibt bestehen."
      )
    ) {
      return;
    }

    await remove(ref(db, `users/${uid}`));
  };

  const simulateHomework = (homework) => {
    if (!isAdmin) return;

    alert(
      `Admin-Testmodus:\n\n"${homework.title}" wird jetzt simuliert.`
    );

    startHomework(homework);
  };

  // ==========================================================
  // MULTIPLAYER
  // ==========================================================

  const openMultiplayer = () => {
    if (!loggedIn) {
      setShowLoginMenu(true);
      return;
    }

    setIsMultiplayerMode(true);
  };

  const createLobby = async (list) => {
    if (!loggedIn) {
      setShowLoginMenu(true);
      return;
    }

    if (
      role !== ROLES.ADMIN &&
      role !== ROLES.TEACHER &&
      role !== ROLES.HOST
    ) {
      alert("Nur Lehrer, Hosts oder Admins dürfen Lobbys erstellen.");
      return;
    }

    const id = genLobbyId();

    setLobbyId(id);
    setIsHost(true);

    const lobbyRef = ref(db, `lobbies/${id}`);

    const initial = {
      hostId: null,
      hostPlays,
      state: "waiting",
      vocabList: list || [],
      currentIndex: 0,
      roundDeadline: 0,
      createdAt: Date.now(),
      bonusRoundActive
    };

    await set(lobbyRef, initial);

    const playerRef = push(
      ref(db, `lobbies/${id}/players`)
    );

    const pid = playerRef.key;

    await set(playerRef, {
      name:
        username ||
        multiusername ||
        firebaseUser.email.split("@")[0],
      email: firebaseUser.email,
      score: 0,
      answeredIndex: -1,
      lastAnswer: "",
      isHost: true,
      joinedAt: Date.now(),
      plays: !!hostPlays
    });

    await update(lobbyRef, {
      hostId: pid
    });

    setPlayerId(pid);

    onDisconnect(playerRef).remove();

    listenToLobby(id);
  };

  const joinLobby = async (id) => {
    if (!loggedIn) {
      setShowLoginMenu(true);
      return;
    }

    if (!id) {
      alert("Bitte Lobby-ID eingeben.");
      return;
    }

    const lobbyRef = ref(db, `lobbies/${id}`);
    const snap = await get(lobbyRef);

    if (!snap.exists()) {
      alert("Lobby existiert nicht.");
      return;
    }

    const playerRef = push(
      ref(db, `lobbies/${id}/players`)
    );

    const pid = playerRef.key;

    await set(playerRef, {
      name:
        username ||
        multiusername ||
        firebaseUser.email.split("@")[0],
      email: firebaseUser.email,
      score: 0,
      answeredIndex: -1,
      lastAnswer: "",
      isHost: false,
      joinedAt: Date.now(),
      plays: true
    });

    onDisconnect(playerRef).remove();

    setPlayerId(pid);
    setLobbyId(id);
    setIsHost(false);
    setJoinLobbyId("");

    listenToLobby(id);
  };

  const listenToLobby = (id) => {
    if (lobbyListenerRef.current) {
      lobbyListenerRef.current();
    }

    const lobbyRef = ref(db, `lobbies/${id}`);

    const unsubscribe = onValue(
      lobbyRef,
      (snapshot) => {
        const val = snapshot.val();

        setLobbyData(val || null);
        setPlayersLocal(val?.players || {});

        if (!val) {
          setLobbyId("");
          setPlayerId(null);
          setIsHost(false);
          return;
        }

        if (val.state === "playing") {
          const idx = val.currentIndex ?? 0;
          const list = val.vocabList || [];
          const card = list[idx];

          if (card) {
            setVocabList(
              list.map((v) => ({
                ...v,
                answered: false,
                correct: false,
                userAnswer: ""
              }))
            );

            setStarted(true);
            setDone(false);
            setCurrentCard(card);

            const germanFirst =
              Math.random() > 0.5;

            setShowGermanFirst(germanFirst);
            setLanguageLabel(
              germanFirst
                ? "Deutsch → Englisch"
                : "Englisch → Deutsch"
            );

            const deadline =
              val.roundDeadline || 0;

            setTimeLeft(
              Math.max(
                0,
                Math.round(
                  (deadline - Date.now()) / 1000
                )
              )
            );

            startRoundCountdown(deadline);
            setMultiplayerResultsVisible(false);
          }
        }

        if (val.state === "finished") {
          setMultiplayerResultsVisible(true);
          setStarted(false);
          setCurrentCard(null);
          setTimeLeft(0);
        }
      }
    );

    lobbyListenerRef.current = unsubscribe;
  };

  const hostStartGame = async () => {
    if (!isHost || !lobbyId) return;

    let list = [];

    if (vocabList.length) {
      list = vocabList.map((v) => ({
        de: v.de,
        en: v.en
      }));
    } else if (vocabText.trim()) {
      list = parseVocab(vocabText).slice(0, 15);
    } else {
      list = await mixSetsRandomly(
        [selectedSet],
        15
      );
    }

    if (!list.length) {
      alert("Keine Vokabeln.");
      return;
    }

    const deadline =
      Date.now() + 15000;

    await update(
      ref(db, `lobbies/${lobbyId}`),
      {
        vocabList: list,
        state: "playing",
        currentIndex: 0,
        roundDeadline: deadline,
        hostPlays,
        bonusRoundActive
      }
    );

    const playersSnap = await get(
      ref(db, `lobbies/${lobbyId}/players`)
    );

    if (playersSnap.exists()) {
      const players = playersSnap.val();

      for (const pid of Object.keys(players)) {
        await update(
          ref(
            db,
            `lobbies/${lobbyId}/players/${pid}`
          ),
          {
            answeredIndex: -1,
            score: 0,
            lastAnswer: "",
            plays:
              players[pid].plays ?? true
          }
        );
      }
    }

    startRoundCountdown(deadline);
    monitorAdvanceConditions(lobbyId);
  };

  const submitAnswerToLobby = async (ans) => {
    if (!lobbyId || !playerId) return;

    const snap = await get(
      ref(db, `lobbies/${lobbyId}`)
    );

    if (!snap.exists()) return;

    const lobby = snap.val();

    const idx = lobby.currentIndex ?? 0;
    const current =
      (lobby.vocabList || [])[idx];

    if (!current) return;

    const playerRef = ref(
      db,
      `lobbies/${lobbyId}/players/${playerId}`
    );

    const playerSnap = await get(playerRef);

    const existing =
      playerSnap.exists()
        ? playerSnap.val()
        : {};

    if (
      (existing.answeredIndex ?? -1) >= idx
    ) {
      setFeedback(
        "Du hast diese Vokabel bereits beantwortet."
      );
      return;
    }

    const userNorm = normalize(ans);

    const validAnswers = getValidAnswers(
      showGermanFirst
        ? current.en
        : current.de
    );

    const isCorrect =
      userNorm === "am" ||
      validAnswers.includes(userNorm);

    let pointsEarned = 0;

    if (isCorrect) {
      const secondsLeft = Math.max(
        0,
        Math.round(
          (lobby.roundDeadline - Date.now()) /
            1000
        )
      );

      const timeBonus = Math.round(
        (secondsLeft * 10) / 15
      );

      pointsEarned = 5 + timeBonus;

      if (lobby.bonusRoundActive) {
        pointsEarned += 5;
      }
    }

    const newScore =
      (existing.score || 0) +
      pointsEarned;

    await update(playerRef, {
      answeredIndex: idx,
      lastAnswer: ans,
      score: newScore,
      lastCorrect: isCorrect,
      lastPoints: pointsEarned,
      answeredAt: Date.now()
    });

    setFeedback(
      isCorrect
        ? `✅ richtig! +${pointsEarned} Punkte`
        : "❌ falsch"
    );
  };

  const monitorAdvanceConditions = (id) => {
    if (monitorListenerRef.current) {
      monitorListenerRef.current();
    }

    const lobbyRef = ref(db, `lobbies/${id}`);

    const unsubscribe = onValue(
      lobbyRef,
      async (snap) => {
        const val = snap.val();

        if (!val || val.state !== "playing") {
          return;
        }

        const idx = val.currentIndex ?? 0;

        const players =
          val.players || {};

        const activePlayers =
          Object.entries(players).filter(
            ([, p]) => p.plays !== false
          );

        const allAnswered =
          activePlayers.length > 0 &&
          activePlayers.every(
            ([, p]) =>
              (p.answeredIndex ?? -1) >= idx
          );

        const now = Date.now();

        if (
          allAnswered ||
          (val.roundDeadline &&
            now >= val.roundDeadline)
        ) {
          if (val.hostId === playerId) {
            const nextIndex = idx + 1;
            const total =
              (val.vocabList || []).length;

            if (nextIndex >= total) {
              await update(
                lobbyRef,
                {
                  state: "finished",
                  roundDeadline: 0
                }
              );
            } else {
              const newDeadline =
                Date.now() + 15000;

              await update(
                lobbyRef,
                {
                  currentIndex: nextIndex,
                  roundDeadline: newDeadline
                }
              );

              startRoundCountdown(
                newDeadline
              );
            }
          }
        }
      }
    );

    monitorListenerRef.current =
      unsubscribe;
  };

  const startRoundCountdown = (deadline) => {
    if (roundTimerRef.current) {
      clearInterval(roundTimerRef.current);
    }

    const tick = async () => {
      const left = Math.max(
        0,
        Math.round(
          (deadline - Date.now()) / 1000
        )
      );

      setTimeLeft(left);

      if (left <= 0) {
        clearInterval(roundTimerRef.current);

        if (
          isHost &&
          autoAdvance &&
          lobbyId
        ) {
          const snap = await get(
            ref(db, `lobbies/${lobbyId}`)
          );

          if (!snap.exists()) return;

          const val = snap.val();

          const idx =
            val.currentIndex ?? 0;

          const total =
            (val.vocabList || []).length;

          if (idx + 1 >= total) {
            await update(
              ref(db, `lobbies/${lobbyId}`),
              {
                state: "finished",
                roundDeadline: 0
              }
            );
          } else {
            const newDeadline =
              Date.now() + 15000;

            await update(
              ref(db, `lobbies/${lobbyId}`),
              {
                currentIndex: idx + 1,
                roundDeadline: newDeadline
              }
            );

            startRoundCountdown(
              newDeadline
            );
          }
        }
      }
    };

    tick();

    roundTimerRef.current =
      setInterval(tick, 250);
  };

  const toggleHostPlays = async (value) => {
    setHostPlays(value);

    if (!lobbyId) return;

    await update(
      ref(db, `lobbies/${lobbyId}`),
      {
        hostPlays: !!value
      }
    );

    if (playerId) {
      await update(
        ref(
          db,
          `lobbies/${lobbyId}/players/${playerId}`
        ),
        {
          plays: !!value
        }
      );
    }
  };

  const leaveLobby = async () => {
    if (!lobbyId || !playerId) {
      setIsMultiplayerMode(false);
      setLobbyId("");
      setLobbyData(null);
      return;
    }

    await remove(
      ref(
        db,
        `lobbies/${lobbyId}/players/${playerId}`
      )
    ).catch(() => {});

    if (isHost) {
      const snap = await get(
        ref(db, `lobbies/${lobbyId}/players`)
      );

      if (snap.exists()) {
        const players = snap.val();
        const keys = Object.keys(players);

        if (keys.length) {
          const newHost = keys[0];

          await update(
            ref(db, `lobbies/${lobbyId}`),
            {
              hostId: newHost,
              state: "waiting"
            }
          );

          await update(
            ref(
              db,
              `lobbies/${lobbyId}/players/${newHost}`
            ),
            {
              isHost: true
            }
          );
        } else {
          await remove(
            ref(db, `lobbies/${lobbyId}`)
          );
        }
      } else {
        await remove(
          ref(db, `lobbies/${lobbyId}`)
        );
      }
    }

    setIsHost(false);
    setPlayerId(null);
    setLobbyId("");
    setLobbyData(null);
    setIsMultiplayerMode(false);
    setMultiplayerResultsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (roundTimerRef.current) {
        clearInterval(roundTimerRef.current);
      }

      if (lobbyListenerRef.current) {
        lobbyListenerRef.current();
      }

      if (monitorListenerRef.current) {
        monitorListenerRef.current();
      }
    };
  }, []);

  // ==========================================================
  // LOGIN SCREEN
  // ==========================================================

  if (authLoading) {
    return (
      <div style={styles.container}>
        <div style={styles.box}>
          <h2>Lade...</h2>
        </div>
      </div>
    );
  }

  if (showLoginMenu && !loggedIn) {
    return (
      <div style={styles.container}>
        <div style={styles.box}>
          <h2>
            {authMode === "login"
              ? "Einloggen"
              : "Konto erstellen"}
          </h2>

          <input
            type="email"
            placeholder="Schul-E-Mail"
            value={loginEmail}
            onChange={(e) =>
              setLoginEmail(e.target.value)
            }
            style={styles.input}
          />

          <input
            type="password"
            placeholder="Passwort"
            value={loginPassword}
            onChange={(e) =>
              setLoginPassword(e.target.value)
            }
            style={styles.input}
          />

          <button
            style={styles.button}
            onClick={handleAuth}
          >
            {authMode === "login"
              ? "Einloggen"
              : "Konto erstellen"}
          </button>

          {authMode === "login" && (
            <button
              style={styles.button}
              onClick={handlePasswordReset}
            >
              Passwort vergessen
            </button>
          )}

          <button
            style={{
              ...styles.button,
              background: "#777"
            }}
            onClick={() =>
              setAuthMode(
                authMode === "login"
                  ? "register"
                  : "login"
              )
            }
          >
            {authMode === "login"
              ? "Neues Konto erstellen"
              : "Zum Login"}
          </button>

          <button
            style={{
              ...styles.button,
              background: "#999"
            }}
            onClick={() =>
              setShowLoginMenu(false)
            }
          >
            Abbrechen
          </button>

          <p style={styles.smallMuted}>
            Nur @evgbm.net E-Mail-Adressen sind erlaubt.
          </p>
        </div>
      </div>
    );
  }

  // ==========================================================
  // ADMIN PANEL
  // ==========================================================

  if (adminOpen && isAdmin) {
    const users = Object.entries(allUsers);

    return (
      <div style={styles.container}>
        <div style={styles.wideBox}>
          <div style={styles.adminHeader}>
            <div>
              <h2>🛠 Admin Panel</h2>
              <div style={styles.smallMuted}>
                Angemeldet als {firebaseUser.email}
              </div>
            </div>

            <button
              style={styles.danger}
              onClick={() =>
                setAdminOpen(false)
              }
            >
              Schließen
            </button>
          </div>

          <div style={styles.row}>
            <button
              style={{
                ...styles.buttonSmall,
                background:
                  adminTab === "users"
                    ? "#2dbe60"
                    : "#4a6eff"
              }}
              onClick={() =>
                setAdminTab("users")
              }
            >
              Benutzer
            </button>

            <button
              style={{
                ...styles.buttonSmall,
                background:
                  adminTab === "homework"
                    ? "#2dbe60"
                    : "#4a6eff"
              }}
              onClick={() =>
                setAdminTab("homework")
              }
            >
              Hausaufgaben
            </button>
          </div>

          {adminTab === "users" && (
            <div>
              <h3>
                Benutzer ({users.length})
              </h3>

              {users.length === 0 && (
                <p>Keine Benutzer gefunden.</p>
              )}

              {users.map(([uid, user]) => (
                <div
                  key={uid}
                  style={styles.adminRow}
                >
                  <div>
                    <strong>
                      {user.username ||
                        user.email}
                    </strong>

                    <br />

                    <span style={styles.smallMuted}>
                      {user.email}
                    </span>

                    <br />

                    <span style={styles.badge}>
                      {user.role ||
                        ROLES.STUDENT}
                    </span>

                    {user.blocked && (
                      <span
                        style={{
                          ...styles.badge,
                          background: "#ffd6d6"
                        }}
                      >
                        GESPERRT
                      </span>
                    )}
                  </div>

                  <div>
                    <select
                      value={
                        user.role ||
                        ROLES.STUDENT
                      }
                      onChange={(e) =>
                        updateUserRole(
                          uid,
                          e.target.value
                        )
                      }
                    >
                      <option value="student">
                        Schüler
                      </option>
                      <option value="teacher">
                        Lehrer
                      </option>
                      <option value="host">
                        Host
                      </option>
                      <option value="admin">
                        Admin
                      </option>
                    </select>

                    <button
                      style={
                        user.blocked
                          ? styles.success
                          : styles.danger
                      }
                      onClick={() =>
                        toggleUserBlocked(
                          uid,
                          !!user.blocked
                        )
                      }
                    >
                      {user.blocked
                        ? "Entsperren"
                        : "Sperren"}
                    </button>

                    <button
                      style={styles.orange}
                      onClick={() =>
                        adminPasswordReset(
                          user.email
                        )
                      }
                    >
                      Passwort-Reset
                    </button>

                    <button
                      style={styles.danger}
                      onClick={() =>
                        adminDeleteUserRecord(
                          uid
                        )
                      }
                    >
                      Profildaten löschen
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {adminTab === "homework" && (
            <div>
              <h3>Hausaufgaben</h3>

              <button
                style={styles.success}
                onClick={() => {
                  setHomeworkEditor({
                    ...defaultHomework(
                      firebaseUser.email
                    ),
                    id: genHomeworkId()
                  });

                  setHomeworkEditorOpen(true);
                }}
              >
                + Hausaufgabe erstellen
              </button>

              {Object.entries(allHomework).map(
                ([id, h]) => (
                  <div
                    key={id}
                    style={styles.adminRow}
                  >
                    <div>
                      <strong>
                        {h.title}
                      </strong>

                      <br />

                      <span
                        style={styles.smallMuted}
                      >
                        {h.amount} Vokabeln ·{" "}
                        {h.setName}
                      </span>
                    </div>

                    <div>
                      <button
                        style={styles.success}
                        onClick={() =>
                          simulateHomework({
                            id,
                            ...h
                          })
                        }
                      >
                        🧪 Simulieren
                      </button>

                      <button
                        style={styles.orange}
                        onClick={() => {
                          setHomeworkEditor({
                            id,
                            ...h,
                            vocabText:
                              (h.vocab || [])
                                .map(
                                  (v) =>
                                    `${v.de},${v.en}`
                                )
                                .join("\n")
                          });

                          setHomeworkEditorOpen(
                            true
                          );
                        }}
                      >
                        Bearbeiten
                      </button>

                      <button
                        style={styles.danger}
                        onClick={() =>
                          deleteHomework(id)
                        }
                      >
                        Löschen
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>

        {homeworkEditorOpen && (
          <HomeworkEditor
            editor={homeworkEditor}
            setEditor={setHomeworkEditor}
            onSave={saveHomework}
            onCancel={() =>
              setHomeworkEditorOpen(false)
            }
          />
        )}
      </div>
    );
  }

  // ==========================================================
  // MULTIPLAYER LEADERBOARD
  // ==========================================================

  if (
    multiplayerResultsVisible &&
    isMultiplayerMode &&
    lobbyData
  ) {
    const players =
      lobbyData.players || {};

    const sorted = Object.entries(players)
      .sort(
        (a, b) =>
          (b[1].score || 0) -
          (a[1].score || 0)
      );

    return (
      <div style={styles.container}>
        <div style={styles.box}>
          <h2>
            Leaderboard — Lobby {lobbyId}
          </h2>

          {sorted.length === 0 ? (
            <p>Keine Spieler</p>
          ) : (
            sorted.map(
              ([pid, p], i) => (
                <div
                  key={pid}
                  style={{
                    padding: 8,
                    borderBottom:
                      "1px solid #eee",
                    textAlign: "left"
                  }}
                >
                  <strong>
                    {i + 1}.
                  </strong>{" "}
                  {p.name} —{" "}
                  <strong>
                    {p.score || 0}
                  </strong>{" "}
                  Punkte{" "}
                  {p.isHost ? "👑" : ""}
                </div>
              )
            )
          )}

          <button
            style={styles.button}
            onClick={() => {
              leaveLobby();
              reset();
            }}
          >
            Zurück zum Menü
          </button>
        </div>
      </div>
    );
  }

  // ==========================================================
  // DEFAULT UI
  // ==========================================================

  return (
    <div style={styles.container}>
      <div
        style={{
          position: "absolute",
          right: 20,
          top: 10,
          display: "flex",
          gap: 5,
          alignItems: "center"
        }}
      >
        {loggedIn ? (
          <>
            <span style={styles.smallMuted}>
              {multiusername}
              {isAdmin ? " 👑" : ""}
            </span>

            <button
              style={{
                padding: "6px 10px",
                cursor: "pointer"
              }}
              onClick={handleLogout}
            >
              Logout
            </button>
          </>
        ) : null}
      </div>

      <h2
        onClick={handleTitleClick}
        style={{ cursor: "pointer" }}
      >
        Vokabeltrainer
      </h2>

      {loggedIn && (
        <div
          style={{
            ...styles.smallMuted,
            marginBottom: 10
          }}
        >
          Rolle: {role}
        </div>
      )}

      {/* ======================================================
          HOMEWORK EDITOR
      ====================================================== */}

      {homeworkEditorOpen && (
        <HomeworkEditor
          editor={homeworkEditor}
          setEditor={setHomeworkEditor}
          onSave={saveHomework}
          onCancel={() =>
            setHomeworkEditorOpen(false)
          }
        />
      )}

      {/* ======================================================
          HOMEWORK VIEW
      ====================================================== */}

      {homeworkView && !started && (
        <div style={styles.wideBox}>
          <h2>📚 Hausaufgaben</h2>

          {canCreateHomework(role) && (
            <button
              style={styles.success}
              onClick={openHomeworkCreator}
            >
              + Hausaufgabe erstellen
            </button>
          )}

          {!homeworkList.length && (
            <p>Keine aktiven Hausaufgaben.</p>
          )}

          {homeworkList.map((h) => {
            const result =
              homeworkResults[h.id];

            return (
              <div
                key={h.id}
                style={{
                  padding: 12,
                  marginBottom: 10,
                  border:
                    "1px solid #ddd",
                  borderRadius: 8
                }}
              >
                <h3>
                  {h.title}
                </h3>

                <p>
                  {h.description ||
                    "Keine Beschreibung"}
                </p>

                <p>
                  <strong>
                    {h.amount}
                  </strong>{" "}
                  Vokabeln ·{" "}
                  {h.pointsPerCorrect ||
                    1}{" "}
                  Punkt(e) pro richtig
                </p>

                {result ? (
                  <p>
                    ✅ Bereits erledigt:{" "}
                    <strong>
                      {result.score}/
                      {result.maxScore}
                    </strong>
                  </p>
                ) : (
                  <button
                    style={styles.buttonSmall}
                    onClick={() =>
                      startHomework(h)
                    }
                  >
                    Hausaufgabe starten
                  </button>
                )}

                {canCreateHomework(role) && (
                  <>
                    <button
                      style={styles.orange}
                      onClick={() => {
                        setHomeworkEditor({
                          ...h,
                          vocabText:
                            (h.vocab || [])
                              .map(
                                (v) =>
                                  `${v.de},${v.en}`
                              )
                              .join("\n")
                        });

                        setHomeworkEditorOpen(
                          true
                        );
                      }}
                    >
                      Bearbeiten
                    </button>

                    <button
                      style={styles.danger}
                      onClick={() =>
                        deleteHomework(h.id)
                      }
                    >
                      Löschen
                    </button>
                  </>
                )}

                {isAdmin && (
                  <button
                    style={styles.success}
                    onClick={() =>
                      simulateHomework(h)
                    }
                  >
                    🧪 Admin-Test
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ======================================================
          SINGLEPLAYER MENU
      ====================================================== */}

      {!started &&
        !isMultiplayerMode &&
        !homeworkView && (
          <div style={styles.box}>
            <input
              type="text"
              value={username}
              onChange={(e) =>
                setUsername(e.target.value)
              }
              placeholder="Benutzername"
              style={styles.input}
            />

            <select
              value={selectedSet}
              onChange={(e) =>
                setSelectedSet(e.target.value)
              }
              style={styles.input}
            >
              {Object.keys(SETS).map(
                (key) => (
                  <option
                    key={key}
                    value={key}
                  >
                    {key}
                  </option>
                )
              )}
            </select>

            <div style={styles.row}>
              <button
                type="button"
                style={styles.buttonSmall}
                onClick={
                  addGitHubVocab
                }
              >
                {setLoading
                  ? "Lade..."
                  : "Set hinzufügen"}
              </button>

              <button
                type="button"
                style={
                  styles.buttonSmall
                }
                onClick={async () => {
                  const mixed =
                    await mixSetsRandomly(
                      [selectedSet],
                      5
                    );

                  setVocabText(
                    mixed
                      .map(
                        (v) =>
                          `${v.de},${v.en}`
                      )
                      .join("\n")
                  );

                  setVocabList(
                    mixed
                      .slice(0, 15)
                      .map((v) => ({
                        ...v,
                        answered: false,
                        correct: false,
                        userAnswer: ""
                      }))
                  );
                }}
              >
                Mix laden
              </button>
            </div>

            <textarea
              value={vocabText}
              onChange={(e) =>
                setVocabText(
                  e.target.value
                )
              }
              placeholder="Deutsch,Englisch — eine pro Zeile"
              rows={6}
              style={styles.textarea}
            />

            <button
              type="button"
              style={styles.button}
              onClick={() =>
                startSession(
                  vocabList.length
                    ? vocabList
                    : null
                )
              }
            >
              Start
            </button>

            <button
              type="button"
              style={styles.button}
              onClick={() => {
                if (!loggedIn) {
                  setShowLoginMenu(true);
                  return;
                }

                setHomeworkView(true);
              }}
            >
              📚 Hausaufgaben
            </button>

            {!loggedIn && (
              <button
                type="button"
                style={styles.button}
                onClick={() =>
                  setShowLoginMenu(true)
                }
              >
                Account / Login
              </button>
            )}

            {isAdmin && (
              <button
                type="button"
                style={{
                  ...styles.button,
                  background: "#222"
                }}
                onClick={() =>
                  setAdminOpen(true)
                }
              >
                🛠 Admin Panel
              </button>
            )}
          </div>
        )}

      {/* ======================================================
          MULTIPLAYER LOBBY
      ====================================================== */}

      {isMultiplayerMode &&
        !started && (
          <div style={styles.lobbyBox}>
            <h3>
              Multiplayer Lobby
            </h3>

            {!lobbyId && (
              <>
                {canCreateHomework(
                  role
                ) && (
                  <button
                    style={styles.button}
                    onClick={async () => {
                      let list = [];

                      if (
                        vocabList.length
                      ) {
                        list =
                          vocabList.map(
                            (v) => ({
                              de: v.de,
                              en: v.en
                            })
                          );
                      } else if (
                        vocabText.trim()
                      ) {
                        list =
                          parseVocab(
                            vocabText
                          ).slice(
                            0,
                            15
                          );
                      } else {
                        list =
                          await mixSetsRandomly(
                            [selectedSet],
                            15
                          );
                      }

                      await createLobby(
                        list
                      );
                    }}
                  >
                    Lobby erstellen
                  </button>
                )}

                <input
                  type="text"
                  placeholder="Lobby-ID"
                  style={{
                    ...styles.input,
                    width: 200
                  }}
                  value={
                    joinLobbyId
                  }
                  onChange={(e) =>
                    setJoinLobbyId(
                      e.target.value.toUpperCase()
                    )
                  }
                />

                <button
                  style={
                    styles.buttonSmall
                  }
                  onClick={() =>
                    joinLobby(
                      joinLobbyId
                    )
                  }
                >
                  Beitreten
                </button>

                {!canCreateHomework(
                  role
                ) && (
                  <p style={styles.smallMuted}>
                    Schüler können
                    bestehenden Lobbys
                    beitreten.
                  </p>
                )}
              </>
            )}

            {lobbyId &&
              lobbyData && (
                <>
                  <p>
                    <b>Lobby:</b>{" "}
                    {lobbyId}
                  </p>

                  <p>
                    <b>Status:</b>{" "}
                    {
                      lobbyData.state
                    }
                  </p>

                  <h4>
                    Spieler
                  </h4>

                  <div
                    style={
                      styles.playersList
                    }
                  >
                    {Object.entries(
                      lobbyData.players ||
                        {}
                    ).map(
                      ([pid, p]) => (
                        <div
                          key={pid}
                          style={{
                            padding: 6,
                            borderBottom:
                              "1px solid #eee"
                          }}
                        >
                          {p.isHost
                            ? "👑 "
                            : ""}
                          {p.name} —{" "}
                          {p.score ||
                            0}{" "}
                          Punkte{" "}
                          {p.plays ===
                          false
                            ? "(Zuschauer)"
                            : ""}

                          {pid ===
                          playerId
                            ? " (du)"
                            : ""}
                        </div>
                      )
                    )}
                  </div>

                  {isHost && (
                    <div
                      style={{
                        marginTop: 12
                      }}
                    >
                      <label>
                        <input
                          type="checkbox"
                          checked={
                            hostPlays
                          }
                          onChange={(e) =>
                            toggleHostPlays(
                              e.target
                                .checked
                            )
                          }
                        />{" "}
                        Host spielt mit
                      </label>

                      <br />

                      <label>
                        <input
                          type="checkbox"
                          checked={
                            bonusRoundActive
                          }
                          onChange={(e) =>
                            setBonusRoundActive(
                              e.target
                                .checked
                            )
                          }
                        />{" "}
                        Bonusrunde
                      </label>

                      <br />

                      <label>
                        <input
                          type="checkbox"
                          checked={
                            autoAdvance
                          }
                          onChange={(e) =>
                            setAutoAdvance(
                              e.target
                                .checked
                            )
                          }
                        />{" "}
                        Auto-Advance
                      </label>

                      <button
                        style={
                          styles.button
                        }
                        onClick={
                          hostStartGame
                        }
                      >
                        Spiel starten
                      </button>

                      <button
                        style={
                          styles.orange
                        }
                        onClick={async () => {
                          const snap =
                            await get(
                              ref(
                                db,
                                `lobbies/${lobbyId}`
                              )
                            );

                          if (
                            !snap.exists()
                          )
                            return;

                          const val =
                            snap.val();

                          const nextIndex =
                            (val.currentIndex ||
                              0) + 1;

                          const total =
                            (
                              val.vocabList ||
                              []
                            ).length;

                          if (
                            nextIndex >=
                            total
                          ) {
                            await update(
                              ref(
                                db,
                                `lobbies/${lobbyId}`
                              ),
                              {
                                state:
                                  "finished",
                                roundDeadline: 0
                              }
                            );
                          } else {
                            const deadline =
                              Date.now() +
                              15000;

                            await update(
                              ref(
                                db,
                                `lobbies/${lobbyId}`
                              ),
                              {
                                currentIndex:
                                  nextIndex,
                                roundDeadline:
                                  deadline
                              }
                            );
                          }
                        }}
                      >
                        Nächste Frage
                      </button>
                    </div>
                  )}

                  <button
                    style={
                      styles.buttonSmall
                    }
                    onClick={
                      leaveLobby
                    }
                  >
                    Lobby verlassen
                  </button>
                </>
              )}
          </div>
        )}

      {/* ======================================================
          GAME
      ====================================================== */}

      {started &&
        currentCard &&
        !done && (
          <AnimatePresence mode="wait">
            <motion.div
              key={
                currentCard.de +
                (isMultiplayerMode
                  ? `_${lobbyId}_${lobbyData?.currentIndex}`
                  : "")
              }
              style={styles.box}
              initial={{
                y: -100,
                opacity: 0
              }}
              animate={{
                y: 0,
                opacity: 1
              }}
              exit={{
                y: 100,
                opacity: 0
              }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30
              }}
            >
              <h4>
                {activeHomework
                  ? activeHomework.title
                  : languageLabel}
              </h4>

              <p>
                {activeHomework
                  ? languageLabel
                  : ""}
              </p>

              <h3>
                {showGermanFirst
                  ? currentCard.de
                  : currentCard.en}
              </h3>

              {isMultiplayerMode && (
                <div>
                  <b>
                    Runde:
                  </b>{" "}
                  {(lobbyData?.currentIndex ||
                    0) + 1}{" "}
                  /{" "}
                  {(
                    lobbyData?.vocabList ||
                    []
                  ).length}

                  <br />

                  <b>
                    Zeit:
                  </b>{" "}
                  {timeLeft}s
                </div>
              )}

              {activeHomework &&
                activeHomework.timeLimit >
                  0 && (
                  <p>
                    Zeitlimit:{" "}
                    {
                      activeHomework.timeLimit
                    }{" "}
                    Sekunden
                  </p>
                )}

              <input
                type="text"
                autoFocus
                value={answer}
                onChange={(e) =>
                  setAnswer(
                    e.target.value
                  )
                }
                onKeyDown={(e) => {
                  if (
                    e.key === "Enter"
                  ) {
                    if (
                      isMultiplayerMode
                    ) {
                      submitAnswerToLobby(
                        answer
                      );
                      setAnswer("");
                    } else {
                      checkAnswer();
                    }
                  }
                }}
                style={styles.input}
              />

              <button
                style={styles.button}
                onClick={() => {
                  if (
                    isMultiplayerMode
                  ) {
                    submitAnswerToLobby(
                      answer
                    );
                    setAnswer("");
                  } else {
                    checkAnswer();
                  }
                }}
              >
                OK
              </button>

              <p>{feedback}</p>

              <motion.p
                style={{
                  fontSize: 20,
                  fontWeight: "bold"
                }}
                key={
                  `score_${displayScore}`
                }
                initial={{
                  y: -30,
                  opacity: 0
                }}
                animate={{
                  y: 0,
                  opacity: 1
                }}
              >
                Punkte:{" "}
                {displayScore}
              </motion.p>

              {isMultiplayerMode && (
                <div
                  style={{
                    textAlign:
                      "left",
                    marginTop: 10
                  }}
                >
                  <b>
                    Spieler:
                  </b>

                  {Object.entries(
                    playersLocal
                  ).map(
                    ([pid, p]) => (
                      <div
                        key={pid}
                        style={{
                          padding: 5
                        }}
                      >
                        {p.isHost
                          ? "👑 "
                          : ""}
                        {p.name} —{" "}
                        {p.score ||
                          0}{" "}
                        {pid ===
                        playerId
                          ? "(du)"
                          : ""}
                      </div>
                    )
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}

      {/* ======================================================
          RESULTS
      ====================================================== */}

      {!isMultiplayerMode &&
        done && (
          <div style={styles.box}>
            <h3>
              Ergebnisse
            </h3>

            <AnimatePresence>
              {showEmoji && (
                <motion.div
                  initial={{
                    scale: 0.5,
                    opacity: 0
                  }}
                  animate={{
                    scale: 1,
                    opacity: 1
                  }}
                  transition={{
                    duration: 0.8
                  }}
                  style={{
                    fontSize: 80
                  }}
                >
                  {getEmoji()}

                  <p
                    style={{
                      fontSize: 32,
                      fontWeight:
                        "bold"
                    }}
                  >
                    Punkte:{" "}
                    {displayScore}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <div
              id="flashcards"
              style={
                styles.flashcards
              }
            >
              {vocabList.map(
                (v, i) => (
                  <div
                    key={i}
                    style={styles.card}
                  >
                    <b>
                      DE:
                    </b>{" "}
                    {v.de}
                    <br />

                    <b>
                      EN:
                    </b>{" "}
                    {v.en}
                    <br />

                    <b>
                      Antwort:
                    </b>{" "}
                    {v.userAnswer ||
                      ""}{" "}
                    {v.correct
                      ? "✅"
                      : "❌"}
                  </div>
                )
              )}
            </div>

            <button
              style={
                styles.buttonSmall
              }
              onClick={
                exportPDF
              }
            >
              PDF
            </button>

            <button
              style={
                styles.buttonSmall
              }
              onClick={
                reset
              }
            >
              Neue Runde
            </button>

            {activeHomework && (
              <p>
                Hausaufgabe
                abgeschlossen:
                <br />
                <strong>
                  {
                    activeHomework.title
                  }
                </strong>
              </p>
            )}
          </div>
        )}

      {/* ======================================================
          BOTTOM BAR
      ====================================================== */}

      <div
        style={
          styles.bottomBar
        }
      >
        <button
          type="button"
          style={{
            ...styles.buttonSmall,
            width: 160
          }}
          onClick={
            openMultiplayer
          }
        >
          Multiplayer
        </button>

        {loggedIn && (
          <button
            type="button"
            style={{
              ...styles.buttonSmall,
              width: 150
            }}
            onClick={() => {
              setHomeworkView(
                (v) => !v
              );
              setStarted(false);
            }}
          >
            Hausaufgaben
          </button>
        )}

        {isAdmin && (
          <button
            type="button"
            style={{
              ...styles.buttonSmall,
              width: 130,
              background: "#222"
            }}
            onClick={() =>
              setAdminOpen(true)
            }
          >
            Admin
          </button>
        )}

        <button
          type="button"
          style={{
            ...styles.buttonSmall,
            width: 100,
            background: "#999"
          }}
          onClick={() => {
            reset();
            setIsMultiplayerMode(
              false
            );
            setHomeworkView(
              false
            );
            setLobbyId("");
            setLobbyData(null);
          }}
        >
          Menü
        </button>
      </div>
    </div>
  );
}

// ============================================================
// HOMEWORK EDITOR
// ============================================================

function HomeworkEditor({
  editor,
  setEditor,
  onSave,
  onCancel
}) {
  const change = (key, value) => {
    setEditor((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div
      style={{
        ...styles.wideBox,
        textAlign: "left"
      }}
    >
      <h2>
        📝 Hausaufgabe bearbeiten
      </h2>

      <label>
        Titel
      </label>

      <br />

      <input
        style={styles.input}
        value={editor.title || ""}
        onChange={(e) =>
          change(
            "title",
            e.target.value
          )
        }
      />

      <br />

      <label>
        Beschreibung
      </label>

      <br />

      <textarea
        style={styles.textarea}
        rows={3}
        value={
          editor.description || ""
        }
        onChange={(e) =>
          change(
            "description",
            e.target.value
          )
        }
      />

      <br />

      <label>
        Anzahl Vokabeln
      </label>

      <br />

      <input
        type="number"
        min="1"
        max="100"
        style={styles.input}
        value={
          editor.amount || 3
        }
        onChange={(e) =>
          change(
            "amount",
            Number(e.target.value)
          )
        }
      />

      <br />

      <label>
        Vokabelset
      </label>

      <br />

      <select
        style={styles.input}
        value={
          editor.setName ||
          "Unit 2"
        }
        onChange={(e) =>
          change(
            "setName",
            e.target.value
          )
        }
      >
        {Object.keys(SETS).map(
          (name) => (
            <option
              key={name}
              value={name}
            >
              {name}
            </option>
          )
        )}
      </select>

      <br />

      <label>
        Eigene Vokabeln
      </label>

      <br />

      <textarea
        style={{
          ...styles.textarea,
          width: "100%"
        }}
        rows={8}
        placeholder="Deutsch,Englisch"
        value={
          editor.vocabText || ""
        }
        onChange={(e) =>
          change(
            "vocabText",
            e.target.value
          )
        }
      />

      <br />

      <label>
        Zeitlimit pro Aufgabe
        (0 = kein Limit)
      </label>

      <br />

      <input
        type="number"
        min="0"
        style={styles.input}
        value={
          editor.timeLimit || 0
        }
        onChange={(e) =>
          change(
            "timeLimit",
            Number(
              e.target.value
            )
          )
        }
      />

      <br />

      <label>
        Punkte pro richtiger
        Antwort
      </label>

      <br />

      <input
        type="number"
        min="1"
        style={styles.input}
        value={
          editor.pointsPerCorrect ||
          1
        }
        onChange={(e) =>
          change(
            "pointsPerCorrect",
            Number(
              e.target.value
            )
          )
        }
      />

      <br />

      <label>
        <input
          type="checkbox"
          checked={
            editor.shuffle !== false
          }
          onChange={(e) =>
            change(
              "shuffle",
              e.target.checked
            )
          }
        />{" "}
        Vokabeln mischen
      </label>

      <br />

      <label>
        <input
          type="checkbox"
          checked={
            editor.allowRetry !==
            false
          }
          onChange={(e) =>
            change(
              "allowRetry",
              e.target.checked
            )
          }
        />{" "}
        Wiederholung erlauben
      </label>

      <div
        style={{
          marginTop: 15
        }}
      >
        <button
          style={styles.success}
          onClick={onSave}
        >
          Speichern
        </button>

        <button
          style={styles.danger}
          onClick={onCancel}
        >
          Abbrechen
        </button>
      </div>
    </div>
  );
}
