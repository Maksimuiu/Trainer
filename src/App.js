import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// Firebase v9 (modular)
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
  remove,
  query,
  orderByChild,
  equalTo
} from "firebase/database";

// ----------------------
// Konfiguration (Firebase)
const firebaseConfig = {
  apiKey: "AIzaSyAhvwwaUR4B9D4a9FtTclXyt8Tdq0b3x76UI",
  authDomain: "vokabelnenglish.firebaseapp.com",
  databaseURL: "https://vokabelnenglish-default-rtdb.firebaseio.com",
  projectId: "vokabelnenglish",
  storageBucket: "vokabelnenglish.firebasestorage.app",
  messagingSenderId: "116210775262",
  appId: "1:116210775262:web:a14f5baf61f208bbdc3e4f",
  measurementId: "G-YZ9N9ZQZ5M"
};

// Hinweis:
// Diese Demo verwendet weiterhin das bestehende Passwort-System.
// Für eine echte Anwendung sollte Firebase Authentication verwendet werden.
const TEACHER_PASSWORD = "Host";
const FAKE_HOMEWORK_EMAIL = "alexmaxi14@evgbm.net";

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ----------------------
// Lernsets
const SETS = {
  "Unit 2": "https://raw.githubusercontent.com/Maksimuiu/voka/main/Unit2",
  "Unit 2Story": "https://raw.githubusercontent.com/Maksimuiu/voka/main/Unit%202%20Story",
  "2b": "https://raw.githubusercontent.com/Maksimuiu/voka/main/2b",
  "The Months": "https://raw.githubusercontent.com/Maksimuiu/voka/main/The%20Months",
  "Food": "https://raw.githubusercontent.com/Maksimuiu/voka/main/Food",
  "Unit 1Story": "https://raw.githubusercontent.com/Maksimuiu/voka/main/Unit%201%20Story",
  "Unit 3Story": "https://raw.githubusercontent.com/Maksimuiu/voka/main/Unit%203%20Story",
  "Dare": "https://raw.githubusercontent.com/Maksimuiu/voka/main/Dare",
  "Unit 2  want - wait": "https://raw.githubusercontent.com/Maksimuiu/voka/main/Unit%202%20%20want%20-%20wait",
  "irgendwas": "random"
};

// ----------------------
// Styles
const styles = {
  container: {
    fontFamily: "Arial",
    textAlign: "center",
    marginTop: 20,
    paddingBottom: 140
  },
  box: {
    width: "360px",
    padding: "15px",
    margin: "12px auto",
    borderRadius: "10px",
    background: "#f2f2f2",
    boxShadow: "0 3px 10px rgba(0,0,0,0.2)"
  },
  input: {
    width: "320px",
    padding: "10px",
    marginBottom: "10px",
    borderRadius: "5px",
    border: "1px solid #aaa",
    fontSize: "14px",
    boxSizing: "border-box"
  },
  textarea: {
    width: "320px",
    padding: "10px",
    borderRadius: "5px",
    border: "1px solid #aaa",
    fontSize: "14px",
    marginBottom: "10px",
    resize: "none",
    boxSizing: "border-box"
  },
  button: {
    width: "320px",
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
    padding: "8px",
    margin: "5px",
    borderRadius: "5px",
    border: "none",
    background: "#4a6eff",
    color: "white",
    cursor: "pointer"
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
    zIndex: 20
  },
  smallMuted: {
    fontSize: 12,
    color: "#666"
  },
  lobbyBox: {
    width: "520px",
    padding: "15px",
    margin: "12px auto",
    borderRadius: "10px",
    background: "#fff",
    boxShadow: "0 3px 12px rgba(0,0,0,0.07)"
  },
  playersList: {
    maxHeight: 200,
    overflowY: "auto",
    textAlign: "left"
  },
  homeworkBox: {
    width: "520px",
    maxWidth: "calc(100vw - 30px)",
    padding: "15px",
    margin: "12px auto",
    borderRadius: "10px",
    background: "#eef3ff",
    boxShadow: "0 3px 12px rgba(0,0,0,0.08)",
    boxSizing: "border-box"
  }
};

// ----------------------
// Helpers
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

const makePreparedVocab = (list) =>
  (list || [])
    .map((v) => ({
      de: v.de,
      en: v.en,
      answered: false,
      correct: false,
      userAnswer: ""
    }))
    .slice(0, 50);

// ----------------------
// App
export default function App() {
  // ---------- Singleplayer
  const [username, setUsername] = useState("");
  const [vocabText, setVocabText] = useState("");
  const [vocabList, setVocabList] = useState([]);
  const [multiusername, setmultiUsername] = useState("");
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

  // end animation
  const [showEmoji, setShowEmoji] = useState(false);
  const [emojiAnimating, setEmojiAnimating] = useState(false);

  // ---------- Multiplayer
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
  const roundTimerRef = useRef(null);
  const lobbyListenerRef = useRef(null);
  const monitorListenerRef = useRef(null);

  // ---------- Login / Account
  const [showLoginMenu, setShowLoginMenu] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [accountKey, setAccountKey] = useState(null);
  const [accountData, setAccountData] = useState(null);

  // teacher
  const [isTeacher, setIsTeacher] = useState(false);

  // teacher controls
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [bonusRoundActive, setBonusRoundActive] = useState(false);

  const [setLoading, setSetLoading] = useState(false);

  // ---------- Homework
  const [homeworkList, setHomeworkList] = useState([]);
  const [activeHomeworkId, setActiveHomeworkId] = useState(null);

  const [homeworkTitle, setHomeworkTitle] = useState("");
  const [homeworkDescription, setHomeworkDescription] = useState("");
  const [homeworkAmount, setHomeworkAmount] = useState(3);
  const [homeworkSet, setHomeworkSet] = useState("Unit 2");
  const [homeworkPoints, setHomeworkPoints] = useState(10);
  const [homeworkTimeLimit, setHomeworkTimeLimit] = useState(0);
  const [homeworkDueDate, setHomeworkDueDate] = useState("");
  const [homeworkRandom, setHomeworkRandom] = useState(false);
  const [homeworkGermanFirst, setHomeworkGermanFirst] = useState(true);
  const [homeworkAllowRetry, setHomeworkAllowRetry] = useState(false);
  const [homeworkMinimumScore, setHomeworkMinimumScore] = useState(0);
  const [selectedHomeworkPlayer, setSelectedHomeworkPlayer] = useState("");

  const [allUsers, setAllUsers] = useState({});

  const canFakeHomework =
    accountData?.email?.toLowerCase() === FAKE_HOMEWORK_EMAIL;

  // ----------------------
  // Account restore
  useEffect(() => {
    const restoreAccount = async () => {
      try {
        const saved = localStorage.getItem("vokabeltrainerAccount");
        if (!saved) return;

        const parsed = JSON.parse(saved);
        if (!parsed.key) return;

        const userSnap = await get(ref(db, `users/${parsed.key}`));

        if (!userSnap.exists()) {
          localStorage.removeItem("vokabeltrainerAccount");
          return;
        }

        const user = userSnap.val();

        // Never trust a stale local email if the database account changed.
        if (
          parsed.email &&
          user.email?.toLowerCase() !== parsed.email.toLowerCase()
        ) {
          localStorage.removeItem("vokabeltrainerAccount");
          return;
        }

        setAccountKey(parsed.key);
        setAccountData(user);
        setUsername(user.username || user.email.split("@")[0]);
        setmultiUsername(user.username || user.email.split("@")[0]);
        setLoggedIn(true);
        setIsTeacher(user.role === "teacher");
      } catch (err) {
        console.error("Account restore failed:", err);
        localStorage.removeItem("vokabeltrainerAccount");
      }
    };

    restoreAccount();
  }, []);

  // ----------------------
  // Homework listener
  useEffect(() => {
    if (!accountKey) {
      setHomeworkList([]);
      return undefined;
    }

    const homeworkRef = ref(db, `users/${accountKey}/homework`);

    const unsubscribe = onValue(homeworkRef, (snapshot) => {
      const data = snapshot.val() || {};

      const list = Object.entries(data).map(([id, homework]) => ({
        id,
        ...homework
      }));

      list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setHomeworkList(list);
    });

    return unsubscribe;
  }, [accountKey]);

  // ----------------------
  // Load users for teacher/host homework creator
  useEffect(() => {
    if (!loggedIn || (!isTeacher && !isHost)) {
      setAllUsers({});
      return undefined;
    }

    const usersRef = ref(db, "users");

    const unsubscribe = onValue(usersRef, (snapshot) => {
      setAllUsers(snapshot.val() || {});
    });

    return unsubscribe;
  }, [loggedIn, isTeacher, isHost]);

  // ----------------------
  // Vocab helpers
  const addVocabFromInput = () => {
    const parsed = parseVocab(vocabText);

    if (parsed.length === 0) {
      alert(
        "Bitte Vokabeln im Format 'Deutsch,Englisch' eingeben (eine pro Zeile)."
      );
      return;
    }

    const prepared = makePreparedVocab(parsed);
    setVocabList(prepared);
    alert(`Hinzugefügt: ${prepared.length} Vokabeln (max 50 verwendet).`);
  };

  const mixSetsRandomly = async (setNames, amountPerSet = 5) => {
    let names = [...setNames];

    if (names.includes("random")) {
      names = Object.keys(SETS).filter((s) => SETS[s] !== "random");
      amountPerSet = Math.max(1, Math.ceil(20 / names.length));
    }

    const result = [];

    for (const name of names) {
      const res = await fetch(SETS[name]);
      if (!res.ok) {
        throw new Error(`Set konnte nicht geladen werden: ${name}`);
      }

      const text = await res.text();
      const words = parseVocab(text);
      const random = [...words]
        .sort(() => 0.5 - Math.random())
        .slice(0, amountPerSet);

      result.push(...random);
    }

    return [...result]
      .sort(() => 0.5 - Math.random())
      .slice(0, 50);
  };

  // ----------------------
  // GitHub import
  const addGitHubVocab = async () => {
    try {
      setSetLoading(true);

      const url = SETS[selectedSet];

      if (url === "random") {
        const randomWords = await mixSetsRandomly(["random"], 20);

        setVocabText(
          randomWords.map((v) => `${v.de},${v.en}`).join("\n")
        );

        setSetLoading(false);
        return;
      }

      const res = await fetch(url);

      if (!res.ok) {
        throw new Error("Set konnte nicht geladen werden.");
      }

      const text = await res.text();
      const imported = parseVocab(text);

      const existing = parseVocab(vocabText);
      const combined = [...existing, ...imported].slice(0, 50);

      setVocabText(
        combined.map((v) => `${v.de},${v.en}`).join("\n")
      );
    } catch (err) {
      console.error(err);
      alert("Fehler beim Importieren des Sets.");
    } finally {
      setSetLoading(false);
    }
  };

  // ----------------------
  // LOGIN RULES
  const isValidSchoolEmail = (email) =>
    typeof email === "string" &&
    email.trim().toLowerCase().endsWith("@evgbm.net");

  const isValidPassword = (pw) =>
    typeof pw === "string" &&
    /^[A-Za-z0-9]{8}$/.test(pw);

  // ----------------------
  // LOGIN HANDLER
  // Existing accounts are reused instead of creating another account.
  const handleLogin = async () => {
    const email = loginEmail.trim().toLowerCase();

    if (!isValidSchoolEmail(email)) {
      alert("E-Mail muss auf @evgbm.net enden.");
      return;
    }

    if (!isValidPassword(loginPassword)) {
      alert("Passwort muss genau 8 Buchstaben/Zahlen enthalten.");
      return;
    }

    try {
      const usersQuery = query(
        ref(db, "users"),
        orderByChild("email"),
        equalTo(email)
      );

      const snapshot = await get(usersQuery);

      let existingKey = null;
      let existingUser = null;

      if (snapshot.exists()) {
        const users = snapshot.val();

        const found = Object.entries(users).find(
          ([, user]) =>
            user.email &&
            user.email.toLowerCase() === email
        );

        if (found) {
          existingKey = found[0];
          existingUser = found[1];
        }
      }

      // Existing account
      if (existingUser) {
        if (existingUser.password !== loginPassword) {
          alert("Falsches Passwort.");
          return;
        }

        setAccountKey(existingKey);
        setAccountData(existingUser);

        const restoredUsername =
          existingUser.username || email.split("@")[0];

        setUsername(restoredUsername);
        setmultiUsername(restoredUsername);

        setLoggedIn(true);
        setShowLoginMenu(false);

        setIsTeacher(existingUser.role === "teacher");

        localStorage.setItem(
          "vokabeltrainerAccount",
          JSON.stringify({
            key: existingKey,
            email
          })
        );

        setIsMultiplayerMode(true);
        return;
      }

      // New account
      const userRef = push(ref(db, "users"));
      const newKey = userRef.key;
      const usernameFromEmail = email.split("@")[0];

      const newUser = {
        email,
        password: loginPassword,
        username: usernameFromEmail,
        role:
          email === FAKE_HOMEWORK_EMAIL
            ? "teacher"
            : "student",
        createdAt: Date.now()
      };

      await set(userRef, newUser);

      setAccountKey(newKey);
      setAccountData(newUser);
      setUsername(usernameFromEmail);
      setmultiUsername(usernameFromEmail);
      setLoggedIn(true);
      setShowLoginMenu(false);
      setIsTeacher(newUser.role === "teacher");

      localStorage.setItem(
        "vokabeltrainerAccount",
        JSON.stringify({
          key: newKey,
          email
        })
      );

      setIsMultiplayerMode(true);

      alert("Account wurde erstellt und gespeichert.");
    } catch (err) {
      console.error(err);
      alert("Fehler beim Login.");
    }
  };

  const handleCancelLogin = () => {
    setShowLoginMenu(false);
  };

  const handleLogout = async () => {
    try {
      await leaveLobby();
    } catch (err) {
      console.error(err);
    }

    setLoggedIn(false);
    setUsername("");
    setmultiUsername("");
    setAccountKey(null);
    setAccountData(null);
    setHomeworkList([]);
    setIsTeacher(false);

    localStorage.removeItem("vokabeltrainerAccount");
  };

  // ----------------------
  // Singleplayer
  const startSession = (providedList = null, homeworkId = null) => {
    let listToUse =
      Array.isArray(providedList) && providedList.length > 0
        ? providedList
        : [];

    if (listToUse.length === 0) {
      if (vocabList && vocabList.length > 0) {
        listToUse = vocabList;
      } else {
        const parsed = parseVocab(vocabText);

        if (parsed.length > 0) {
          listToUse = parsed.slice(0, 50);
        }
      }
    }

    if (!listToUse || listToUse.length === 0) {
      alert(
        "Keine Vokabeln vorhanden. Bitte Vokabeln eingeben oder ein Set importieren."
      );
      return;
    }

    const prep = makePreparedVocab(listToUse);

    setActiveHomeworkId(homeworkId);
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

    if (!remaining || remaining.length === 0) {
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
      setFeedback("❗ Diese Vokabel wurde bereits beantwortet.");
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

  // Animate score during gameplay
  useEffect(() => {
    if (!done && displayScore < score) {
      const t = setTimeout(
        () => setDisplayScore((prev) => prev + 1),
        250
      );

      return () => clearTimeout(t);
    }
  }, [displayScore, score, done]);

  // Final smiley animation
  useEffect(() => {
    if (!done) return undefined;

    setShowEmoji(true);
    setEmojiAnimating(true);

    const SMILEY_DURATION = 1200;

    const id = setTimeout(() => {
      setEmojiAnimating(false);
      setDisplayScore(0);

      const total = score;

      if (total <= 0) {
        setDisplayScore(0);
        return;
      }

      const steps = Math.min(30, total);
      const increment = Math.ceil(total / steps);
      const intervalMs = Math.max(
        30,
        Math.floor(SMILEY_DURATION / steps)
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
    }, SMILEY_DURATION);

    return () => clearTimeout(id);
  }, [done, score]);

  // Mark homework completed when the session finishes.
  useEffect(() => {
    if (!done || !activeHomeworkId || !accountKey) return;

    const markHomeworkFinished = async () => {
      try {
        const homeworkRef = ref(
          db,
          `users/${accountKey}/homework/${activeHomeworkId}`
        );

        const snap = await get(homeworkRef);

        if (!snap.exists()) return;

        const homework = snap.val();

        const possibleScore =
          homework.amount > 0
            ? Math.round(
                (score / homework.amount) *
                  Number(homework.points || 0)
              )
            : score;

        await update(homeworkRef, {
          completed: true,
          score: possibleScore,
          rawScore: score,
          completedAt: Date.now()
        });
      } catch (err) {
        console.error(
          "Homework completion save failed:",
          err
        );
      }
    };

    markHomeworkFinished();
  }, [done, activeHomeworkId, accountKey, score]);

  const handleTitleClick = () => {
    const newClicks = titleClicks + 1;

    setTitleClicks(newClicks);

    if (newClicks === 12) {
      setPendingBonusPoints(10);
    } else if (newClicks > 12) {
      setPendingBonusPoints((prev) => prev + 1);
    }
  };

  const getEmoji = () =>
    score < 5 ? "😢" : score < 10 ? "😐" : "😄";

  const exportPDF = async () => {
    const element = document.getElementById("flashcards");

    if (!element) {
      alert("Keine Flashcards zum Exportieren.");
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
    setActiveHomeworkId(null);
  };

  // ----------------------
  // HOMEWORK
  const createHomework = async () => {
    if (!accountKey) {
      alert("Du musst eingeloggt sein.");
      return;
    }

    if (!isTeacher && !isHost) {
      alert(
        "Nur Lehrer oder der Host können Hausaufgaben erstellen."
      );
      return;
    }

    if (!homeworkTitle.trim()) {
      alert("Bitte einen Titel eingeben.");
      return;
    }

    const amount = Math.max(
      1,
      Math.min(50, Number(homeworkAmount) || 0)
    );

    if (!amount) {
      alert("Mindestens 1 Vokabel.");
      return;
    }

    if (!selectedHomeworkPlayer) {
      alert("Bitte einen Schüler auswählen.");
      return;
    }

    try {
      let vocab = [];

      if (homeworkRandom) {
        vocab = await mixSetsRandomly(
          [homeworkSet],
          amount
        );
      } else {
        const url = SETS[homeworkSet];

        if (url === "random") {
          vocab = await mixSetsRandomly(
            ["random"],
            amount
          );
        } else {
          const response = await fetch(url);

          if (!response.ok) {
            throw new Error(
              `Set konnte nicht geladen werden: ${homeworkSet}`
            );
          }

          const text = await response.text();
          const parsed = parseVocab(text);

          vocab = [...parsed]
            .sort(() => Math.random() - 0.5)
            .slice(0, amount);
        }
      }

      if (vocab.length === 0) {
        alert("Keine Vokabeln gefunden.");
        return;
      }

      const homeworkRef = push(
        ref(
          db,
          `users/${selectedHomeworkPlayer}/homework`
        )
      );

      await set(homeworkRef, {
        title: homeworkTitle.trim(),
        description: homeworkDescription.trim(),
        type: "vocabulary",
        setName: homeworkSet,
        amount: vocab.length,
        points: Math.max(
          0,
          Number(homeworkPoints) || 0
        ),
        timeLimit: Math.max(
          0,
          Number(homeworkTimeLimit) || 0
        ),
        dueDate: homeworkDueDate || null,
        germanFirst: !!homeworkGermanFirst,
        allowRetry: !!homeworkAllowRetry,
        minimumScore: Math.max(
          0,
          Math.min(
            100,
            Number(homeworkMinimumScore) || 0
          )
        ),
        vocabList: vocab.map((v) => ({
          de: v.de,
          en: v.en
        })),
        completed: false,
        score: 0,
        createdBy: accountKey,
        createdByEmail:
          accountData?.email || "",
        createdAt: Date.now()
      });

      alert("Hausaufgabe wurde erstellt.");

      setHomeworkTitle("");
      setHomeworkDescription("");
      setHomeworkAmount(3);
      setHomeworkPoints(10);
      setHomeworkTimeLimit(0);
      setHomeworkDueDate("");
      setHomeworkRandom(false);
      setHomeworkGermanFirst(true);
      setHomeworkAllowRetry(false);
      setHomeworkMinimumScore(0);
      setSelectedHomeworkPlayer("");
    } catch (error) {
      console.error(error);
      alert(
        "Hausaufgabe konnte nicht erstellt werden."
      );
    }
  };

  const completeHomework = async (
    homework,
    scoreOverride = null
  ) => {
    if (!accountKey) return;

    try {
      const scoreToSave =
        scoreOverride !== null
          ? scoreOverride
          : homework.score || 0;

      await update(
        ref(
          db,
          `users/${accountKey}/homework/${homework.id}`
        ),
        {
          completed: true,
          score: scoreToSave,
          rawScore: scoreToSave,
          completedAt: Date.now()
        }
      );

      alert("Hausaufgabe erledigt ✅");
    } catch (err) {
      console.error(err);
      alert(
        "Hausaufgabe konnte nicht gespeichert werden."
      );
    }
  };

  const fakeHomework = async (homework) => {
    if (!canFakeHomework) return;

    const fakeScore =
      Number(homework.points || 0);

    await completeHomework(
      homework,
      fakeScore
    );
  };

  // ----------------------
  // Multiplayer opener
  const openMultiplayer = () => {
    if (!loggedIn) {
      setShowLoginMenu(true);
      return;
    }

    setIsMultiplayerMode(true);
  };

  // ----------------------
  // Create lobby
  const createLobby = async (vocabListForLobby) => {
    if (!isTeacher) {
      const pw = prompt(
        "Lehrer-Passwort eingeben (nur Lehrer darf Lobbys erstellen):"
      );

      if (pw === null) return;

      if (pw !== TEACHER_PASSWORD) {
        alert(
          "Falsches Lehrer-Passwort. Lobby wird nicht erstellt."
        );
        return;
      }

      setIsTeacher(true);

      // Persist teacher role if this is a normal logged-in account.
      if (accountKey) {
        await update(
          ref(db, `users/${accountKey}`),
          { role: "teacher" }
        );

        setAccountData((prev) =>
          prev
            ? { ...prev, role: "teacher" }
            : prev
        );
      }
    }

    const id = genLobbyId();

    setLobbyId(id);
    setIsHost(true);

    const lobbyRef = ref(db, `lobbies/${id}`);

    const initial = {
      hostId: null,
      hostPlays: hostPlays,
      state: "waiting",
      vocabList: vocabListForLobby || [],
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

    const playerObj = {
      name: username || multiusername,
      email: accountData?.email || "",
      score: 0,
      answeredIndex: -1,
      lastAnswer: "",
      isHost: true,
      joinedAt: Date.now(),
      plays: !!hostPlays
    };

    await set(playerRef, playerObj);

    await update(lobbyRef, {
      hostId: pid
    });

    setPlayerId(pid);

    onDisconnect(playerRef).remove();

    listenToLobby(id);
  };

  // ----------------------
  // Join lobby
  const joinLobby = async (id) => {
    if (!id) {
      alert("Bitte Lobby-ID eingeben.");
      return;
    }

    const cleanId = id.trim().toUpperCase();

    const lobbyRef = ref(
      db,
      `lobbies/${cleanId}`
    );

    const snap = await get(lobbyRef);

    if (!snap.exists()) {
      alert("Lobby existiert nicht.");
      return;
    }

    const playerRef = push(
      ref(
        db,
        `lobbies/${cleanId}/players`
      )
    );

    const pid = playerRef.key;

    const playerObj = {
      name: username || multiusername,
      email: accountData?.email || "",
      score: 0,
      answeredIndex: -1,
      lastAnswer: "",
      isHost: false,
      joinedAt: Date.now(),
      plays: true
    };

    await set(playerRef, playerObj);

    onDisconnect(playerRef).remove();

    setPlayerId(pid);
    setLobbyId(cleanId);
    setIsHost(false);

    listenToLobby(cleanId);
    setJoinLobbyId("");
  };

  // ----------------------
  // Lobby listener
  const listenToLobby = (id) => {
    if (lobbyListenerRef.current) {
      lobbyListenerRef.current();
      lobbyListenerRef.current = null;
    }

    const lobbyRef = ref(db, `lobbies/${id}`);

    const unsubscribe = onValue(
      lobbyRef,
      (snapshot) => {
        const val = snapshot.val();

        setLobbyData(val || null);

        if (val?.players) {
          setPlayersLocal(val.players);
        } else {
          setPlayersLocal({});
        }

        if (val && val.state === "playing") {
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
              val.roundDeadline ?? 0;

            const left = Math.max(
              0,
              Math.round(
                (deadline - Date.now()) / 1000
              )
            );

            setTimeLeft(left);
            startRoundCountdown(deadline);

            setMultiplayerResultsVisible(false);
          }
        }

        if (!val) {
          setLobbyData(null);
          setLobbyId("");
          setPlayerId(null);
          setIsHost(false);
        }

        if (val && val.state === "finished") {
          setMultiplayerResultsVisible(true);
          setStarted(false);
          setCurrentCard(null);
          setTimeLeft(0);
        }
      }
    );

    lobbyListenerRef.current = unsubscribe;
  };

  // ----------------------
  // Host starts game
  const hostStartGame = async () => {
    if (!isHost || !lobbyId) return;

    let list = [];

    if (vocabList && vocabList.length > 0) {
      list = vocabList.map((v) => ({
        de: v.de,
        en: v.en
      }));
    } else if (vocabText && vocabText.trim()) {
      list = parseVocab(vocabText).slice(0, 15);
    } else {
      list = await mixSetsRandomly(
        [selectedSet],
        15
      );
    }

    const lobbyRef = ref(
      db,
      `lobbies/${lobbyId}`
    );

    const deadline =
      Date.now() + 15000;

    await update(lobbyRef, {
      vocabList: list,
      state: "playing",
      currentIndex: 0,
      roundDeadline: deadline,
      hostPlays,
      bonusRoundActive
    });

    const playersSnap = await get(
      ref(
        db,
        `lobbies/${lobbyId}/players`
      )
    );

    if (playersSnap.exists()) {
      const players =
        playersSnap.val();

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

  // ----------------------
  // Multiplayer answer
  const submitAnswerToLobby = async (ans) => {
    if (!lobbyId || !playerId) return;

    const lobbyRef = ref(
      db,
      `lobbies/${lobbyId}`
    );

    const snap = await get(lobbyRef);

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

    const playerSnap =
      await get(playerRef);

    const existing = playerSnap.exists()
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

    const validAnswers =
      getValidAnswers(
        showGermanFirst
          ? current.en
          : current.de
      );

    const isSpecial =
      userNorm === "am";

    const isCorrect =
      isSpecial ||
      validAnswers.includes(userNorm);

    let pointsEarned = 0;

    if (isCorrect) {
      const secondsLeft =
        Math.max(
          0,
          Math.round(
            (lobby.roundDeadline -
              Date.now()) /
              1000
          )
        );

      const timeBonus =
        Math.round(
          (secondsLeft * 10) / 15
        );

      pointsEarned =
        5 + timeBonus;

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

  // ----------------------
  // Advance conditions
  const monitorAdvanceConditions = (id) => {
    if (monitorListenerRef.current) {
      monitorListenerRef.current();
      monitorListenerRef.current = null;
    }

    const lobbyRef = ref(
      db,
      `lobbies/${id}`
    );

    const unsubscribe = onValue(
      lobbyRef,
      async (snap) => {
        const val = snap.val();

        if (!val) return;
        if (val.state !== "playing") return;

        const idx =
          val.currentIndex ?? 0;

        const players =
          val.players || {};

        const activePlayers =
          Object.entries(players).filter(
            ([, p]) =>
              p.plays !== false
          );

        const allAnswered =
          activePlayers.length > 0 &&
          activePlayers.every(
            ([, p]) =>
              (p.answeredIndex ??
                -1) >= idx
          );

        const now = Date.now();

        if (
          allAnswered ||
          (val.roundDeadline &&
            now >=
              val.roundDeadline)
        ) {
          if (
            val.hostId === playerId
          ) {
            const nextIndex =
              idx + 1;

            const total =
              (val.vocabList || [])
                .length;

            if (
              nextIndex >= total
            ) {
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
                  currentIndex:
                    nextIndex,
                  roundDeadline:
                    newDeadline
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

  // ----------------------
  // Countdown
  const startRoundCountdown = (
    deadline
  ) => {
    if (roundTimerRef.current) {
      clearInterval(
        roundTimerRef.current
      );
    }

    const tick = async () => {
      const left = Math.max(
        0,
        Math.round(
          (deadline -
            Date.now()) /
            1000
        )
      );

      setTimeLeft(left);

      if (left <= 0) {
        clearInterval(
          roundTimerRef.current
        );

        if (
          isHost &&
          autoAdvance &&
          lobbyId
        ) {
          const lobbyRef = ref(
            db,
            `lobbies/${lobbyId}`
          );

          const snap =
            await get(lobbyRef);

          if (!snap.exists()) return;

          const val =
            snap.val();

          if (
            val.state !== "playing"
          ) {
            return;
          }

          const idx =
            val.currentIndex ?? 0;

          const total =
            (val.vocabList || [])
              .length;

          if (
            idx + 1 >= total
          ) {
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
                currentIndex:
                  idx + 1,
                roundDeadline:
                  newDeadline
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
      setInterval(
        tick,
        250
      );
  };

  // ----------------------
  // Host play toggle
  const toggleHostPlays = async (
    val
  ) => {
    setHostPlays(val);

    if (!lobbyId) return;

    await update(
      ref(db, `lobbies/${lobbyId}`),
      {
        hostPlays: !!val
      }
    );

    if (playerId) {
      await update(
        ref(
          db,
          `lobbies/${lobbyId}/players/${playerId}`
        ),
        {
          plays: !!val
        }
      );
    }
  };

  // ----------------------
  // Leave lobby
  const leaveLobby = async () => {
    if (roundTimerRef.current) {
      clearInterval(
        roundTimerRef.current
      );
      roundTimerRef.current = null;
    }

    if (lobbyListenerRef.current) {
      lobbyListenerRef.current();
      lobbyListenerRef.current = null;
    }

    if (monitorListenerRef.current) {
      monitorListenerRef.current();
      monitorListenerRef.current = null;
    }

    if (!lobbyId || !playerId) {
      setIsMultiplayerMode(false);
      setLobbyId("");
      setLobbyData(null);
      setPlayerId(null);
      setIsHost(false);
      return;
    }

    const currentLobbyId =
      lobbyId;

    const currentPlayerId =
      playerId;

    const currentIsHost =
      isHost;

    await remove(
      ref(
        db,
        `lobbies/${currentLobbyId}/players/${currentPlayerId}`
      )
    ).catch(() => {});

    if (currentIsHost) {
      const snap = await get(
        ref(
          db,
          `lobbies/${currentLobbyId}/players`
        )
      );

      if (snap.exists()) {
        const players =
          snap.val();

        const keys =
          Object.keys(players);

        if (keys.length === 0) {
          await remove(
            ref(
              db,
              `lobbies/${currentLobbyId}`
            )
          );
        } else {
          const newHost =
            keys[0];

          await update(
            ref(
              db,
              `lobbies/${currentLobbyId}`
            ),
            {
              hostId: newHost,
              state: "waiting"
            }
          );

          await update(
            ref(
              db,
              `lobbies/${currentLobbyId}/players/${newHost}`
            ),
            {
              isHost: true
            }
          );
        }
      } else {
        await remove(
          ref(
            db,
            `lobbies/${currentLobbyId}`
          )
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
        clearInterval(
          roundTimerRef.current
        );
      }

      if (lobbyListenerRef.current) {
        lobbyListenerRef.current();
      }

      if (monitorListenerRef.current) {
        monitorListenerRef.current();
      }
    };
  }, []);

  // ----------------------
  // Leaderboard
  if (
    multiplayerResultsVisible &&
    isMultiplayerMode &&
    lobbyData
  ) {
    const players =
      lobbyData.players || {};

    const sorted =
      Object.entries(players).sort(
        (a, b) =>
          (b[1].score || 0) -
          (a[1].score || 0)
      );

    return (
      <div style={styles.container}>
        <div style={styles.box}>
          <h2>
            Leaderboard — Lobby{" "}
            {lobbyId}
          </h2>

          <div
            style={{
              textAlign: "left"
            }}
          >
            {sorted.length === 0 ? (
              <div>
                Keine Spieler
              </div>
            ) : (
              sorted.map(
                ([pid, p], i) => (
                  <div
                    key={pid}
                    style={{
                      padding: 8,
                      borderBottom:
                        "1px solid #eee"
                    }}
                  >
                    <strong>
                      {i + 1}.
                    </strong>{" "}
                    {p.name} —{" "}
                    <strong>
                      {p.score ?? 0}
                    </strong>{" "}
                    Punkte{" "}
                    {p.isHost
                      ? "👑"
                      : ""}
                  </div>
                )
              )
            )}
          </div>

          <div
            style={{
              marginTop: 12
            }}
          >
            <button
              type="button"
              style={styles.button}
              onClick={async () => {
                reset();
                await leaveLobby();
              }}
            >
              Zurück zum Menü
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------
  // Login screen
  if (
    showLoginMenu &&
    !loggedIn
  ) {
    return (
      <div
        style={styles.container}
      >
        <div style={styles.box}>
          <h2>
            Login für Multiplayer
          </h2>

          <input
            type="email"
            placeholder="Schul-E-Mail"
            value={loginEmail}
            onChange={(e) =>
              setLoginEmail(
                e.target.value
              )
            }
            style={styles.input}
          />

          <input
            type="password"
            placeholder="Passwort (8 Zeichen)"
            value={loginPassword}
            onChange={(e) =>
              setLoginPassword(
                e.target.value
              )
            }
            style={styles.input}
          />

          <div
            style={{
              display: "flex",
              gap: 8,
              flexDirection:
                "column",
              alignItems:
                "center"
            }}
          >
            <button
              style={styles.button}
              onClick={handleLogin}
            >
              Einloggen / Account erstellen
            </button>

            <button
              style={{
                ...styles.button,
                background: "#999"
              }}
              onClick={
                handleCancelLogin
              }
            >
              Abbrechen
            </button>
          </div>

          <p
            style={{
              fontSize: 12,
              color: "#666",
              marginTop: 8
            }}
          >
            Ein vorhandener Account
            wird wiederverwendet.
            Ein neuer Account wird
            nur erstellt, wenn die
            E-Mail noch nicht
            existiert.
          </p>
        </div>
      </div>
    );
  }

  // ----------------------
  // Default UI
  return (
    <div
      style={styles.container}
    >
      <div
        style={{
          position:
            "absolute",
          right: 20,
          top: 10
        }}
      >
        {loggedIn ? (
          <>
            <span
              style={{
                marginRight: 8
              }}
            >
              {multiusername}
              {isTeacher
                ? " 👨‍🏫"
                : ""}
            </span>

            <button
              style={{
                padding:
                  "6px 10px",
                cursor:
                  "pointer"
              }}
              onClick={
                handleLogout
              }
            >
              Logout
            </button>
          </>
        ) : null}
      </div>

      <h2
        onClick={
          handleTitleClick
        }
        style={{
          cursor:
            "pointer"
        }}
      >
        Vokabeltrainer
      </h2>

      {/* ----------------------
          SINGLEPLAYER MENU
      */}
      {!started &&
        !isMultiplayerMode && (
          <>
            <div
              style={styles.box}
            >
              <input
                type="text"
                value={
                  username
                }
                onChange={(e) =>
                  setUsername(
                    e.target.value
                  )
                }
                placeholder="Benutzername"
                style={
                  styles.input
                }
              />

              <select
                value={
                  selectedSet
                }
                onChange={(e) =>
                  setSelectedSet(
                    e.target.value
                  )
                }
                style={
                  styles.input
                }
              >
                {Object.keys(
                  SETS
                ).map(
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

              <div
                style={{
                  display:
                    "flex",
                  justifyContent:
                    "center",
                  gap: 8,
                  flexWrap:
                    "wrap"
                }}
              >
                <button
                  type="button"
                  style={
                    styles.buttonSmall
                  }
                  onClick={
                    addGitHubVocab
                  }
                >
                  {setLoading
                    ? "Lade..."
                    : "Vokabeln hinzufügen"}
                </button>

                <button
                  type="button"
                  style={
                    styles.buttonSmall
                  }
                  onClick={async () => {
                    try {
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
                          .join(
                            "\n"
                          )
                      );

                      setVocabList(
                        makePreparedVocab(
                          mixed
                        )
                      );

                      alert(
                        "Mix geladen."
                      );
                    } catch (err) {
                      console.error(
                        err
                      );
                      alert(
                        "Mix konnte nicht geladen werden."
                      );
                    }
                  }}
                >
                  Mix laden
                </button>
              </div>

              <textarea
                value={
                  vocabText
                }
                onChange={(e) =>
                  setVocabText(
                    e.target.value
                  )
                }
                placeholder="Deutsch,Englisch — eine pro Zeile"
                rows={6}
                style={
                  styles.textarea
                }
              />

              <div
                style={{
                  marginTop: 10
                }}
              >
                <button
                  type="button"
                  style={
                    styles.button
                  }
                  onClick={() =>
                    startSession(
                      vocabList.length
                        ? vocabList
                        : null
                    )
                  }
                >
                  Start (Singleplayer)
                </button>
              </div>
            </div>

            {/* Homework list */}
            {loggedIn &&
              homeworkList.length >
                0 && (
                <div
                  style={
                    styles.box
                  }
                >
                  <h3>
                    📚 Meine
                    Hausaufgaben
                  </h3>

                  {homeworkList.map(
                    (homework) => (
                      <div
                        key={
                          homework.id
                        }
                        style={{
                          ...styles.card,
                          textAlign:
                            "left"
                        }}
                      >
                        <h4>
                          {
                            homework.title
                          }
                        </h4>

                        {homework.description && (
                          <p>
                            {
                              homework.description
                            }
                          </p>
                        )}

                        <p>
                          <b>
                            Vokabeln:
                          </b>{" "}
                          {
                            homework.amount
                          }
                          <br />

                          <b>
                            Punkte:
                          </b>{" "}
                          {
                            homework.points
                          }
                          <br />

                          <b>
                            Set:
                          </b>{" "}
                          {
                            homework.setName
                          }
                          <br />

                          {homework.dueDate && (
                            <>
                              <b>
                                Abgabe:
                              </b>{" "}
                              {
                                homework.dueDate
                              }
                            </>
                          )}
                        </p>

                        {homework.completed ? (
                          <div
                            style={{
                              color:
                                "green",
                              fontWeight:
                                "bold"
                            }}
                          >
                            ✅ Erledigt —{" "}
                            {
                              homework.score
                            }{" "}
                            Punkte
                          </div>
                        ) : (
                          <>
                            <button
                              type="button"
                              style={
                                styles.button
                              }
                              onClick={() => {
                                setActiveHomeworkId(
                                  homework.id
                                );

                                startSession(
                                  homework.vocabList,
                                  homework.id
                                );
                              }}
                            >
                              Hausaufgabe
                              starten
                            </button>

                            {canFakeHomework && (
                              <button
                                type="button"
                                style={{
                                  ...styles.button,
                                  background:
                                    "#e67e22"
                                }}
                                onClick={() =>
                                  fakeHomework(
                                    homework
                                  )
                                }
                              >
                                🧪 Hausaufgabe
                                faken
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    )
                  )}
                </div>
              )}

            {/* Fake homework panel */}
            {canFakeHomework &&
              loggedIn && (
                <div
                  style={{
                    ...styles.box,
                    background:
                      "#fff3cd",
                    border:
                      "2px dashed #e67e22"
                  }}
                >
                  <h3>
                    🧪 Testmodus
                  </h3>

                  <p>
                    Dieser Account darf
                    Hausaufgaben zum Testen
                    automatisch als erledigt
                    markieren.
                  </p>

                  {homeworkList
                    .filter(
                      (h) =>
                        !h.completed
                    )
                    .map(
                      (homework) => (
                        <button
                          key={
                            homework.id
                          }
                          type="button"
                          style={{
                            ...styles.button,
                            background:
                              "#e67e22"
                          }}
                          onClick={() =>
                            fakeHomework(
                              homework
                            )
                          }
                        >
                          🧪 „
                          {
                            homework.title
                          }
                          “ faken
                        </button>
                      )
                    )}
                </div>
              )}
          </>
        )}

      {/* ----------------------
          MULTIPLAYER LOBBY
      */}
      {isMultiplayerMode &&
        !started && (
          <div
            style={
              styles.lobbyBox
            }
          >
            <h3>
              Multiplayer Lobby
            </h3>

            {!lobbyId && (
              <>
                <div
                  style={{
                    display:
                      "flex",
                    justifyContent:
                      "center",
                    gap: 8,
                    marginBottom:
                      8,
                    flexWrap:
                      "wrap"
                  }}
                >
                  <button
                    type="button"
                    style={
                      styles.buttonSmall
                    }
                    onClick={async () => {
                      try {
                        let list =
                          [];

                        if (
                          vocabList &&
                          vocabList.length >
                            0
                        ) {
                          list =
                            vocabList.map(
                              (v) => ({
                                de: v.de,
                                en: v.en
                              })
                            );
                        } else if (
                          vocabText &&
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
                      } catch (err) {
                        console.error(
                          err
                        );
                        alert(
                          "Lobby konnte nicht erstellt werden."
                        );
                      }
                    }}
                  >
                    Lobby erstellen
                  </button>

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
                    type="button"
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
                </div>

                <div
                  style={{
                    display:
                      "flex",
                    justifyContent:
                      "center",
                    gap: 8,
                    marginBottom:
                      8,
                    flexWrap:
                      "wrap"
                  }}
                >
                  {!isTeacher ? (
                    <button
                      style={{
                        ...styles.buttonSmall,
                        background:
                          "#2dbe60"
                      }}
                      onClick={async () => {
                        const pw =
                          prompt(
                            "Lehrer-Passwort eingeben:"
                          );

                        if (
                          pw ===
                          TEACHER_PASSWORD
                        ) {
                          setIsTeacher(
                            true
                          );

                          if (
                            accountKey
                          ) {
                            await update(
                              ref(
                                db,
                                `users/${accountKey}`
                              ),
                              {
                                role:
                                  "teacher"
                              }
                            );

                            setAccountData(
                              (
                                prev
                              ) =>
                                prev
                                  ? {
                                      ...prev,
                                      role:
                                        "teacher"
                                    }
                                  : prev
                            );
                          }

                          alert(
                            "Lehrer eingeloggt."
                          );
                        } else {
                          alert(
                            "Falsches Passwort."
                          );
                        }
                      }}
                    >
                      Als Lehrer einloggen
                    </button>
                  ) : (
                    <div
                      style={
                        styles.smallMuted
                      }
                    >
                      Lehrer
                      eingeloggt ✅
                    </div>
                  )}

                  <div
                    style={
                      styles.smallMuted
                    }
                  >
                    Host/Lehrer kann
                    Hausaufgaben erstellen.
                  </div>
                </div>

                <p
                  style={{
                    fontSize:
                      "12px",
                    color:
                      "#333"
                  }}
                >
                  Schüler können
                  bestehenden Lobbys
                  beitreten.
                </p>
              </>
            )}

            {lobbyId &&
              lobbyData && (
                <>
                  <p>
                    <b>
                      Lobby:
                    </b>{" "}
                    {lobbyId}
                  </p>

                  <p>
                    <b>
                      Status:
                    </b>{" "}
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
                    {lobbyData.players ? (
                      Object.entries(
                        lobbyData.players
                      ).map(
                        ([pid, p]) => (
                          <div
                            key={pid}
                            style={{
                              padding:
                                6,
                              borderBottom:
                                "1px solid #eee"
                            }}
                          >
                            {p.isHost
                              ? "👑 "
                              : ""}
                            {p.name} —{" "}
                            {p.score ??
                              0}{" "}
                            {p.plays ===
                            false
                              ? "(Zuschauer)"
                              : ""}{" "}
                            {pid ===
                            playerId
                              ? "(du)"
                              : ""}
                          </div>
                        )
                      )
                    ) : (
                      <div>
                        Keine Spieler
                      </div>
                    )}
                  </div>

                  {/* Host controls */}
                  {isHost && (
                    <div
                      style={{
                        marginTop:
                          12
                      }}
                    >
                      <div
                        style={{
                          display:
                            "flex",
                          gap: 8,
                          justifyContent:
                            "space-between",
                          alignItems:
                            "center",
                          flexWrap:
                            "wrap"
                        }}
                      >
                        <label>
                          <input
                            type="checkbox"
                            checked={
                              hostPlays
                            }
                            onChange={(
                              e
                            ) =>
                              toggleHostPlays(
                                e.target.checked
                              )
                            }
                          />{" "}
                          Host spielt mit
                        </label>

                        <label>
                          <input
                            type="checkbox"
                            checked={
                              bonusRoundActive
                            }
                            onChange={(
                              e
                            ) =>
                              setBonusRoundActive(
                                e.target.checked
                              )
                            }
                          />{" "}
                          Bonusrunde
                        </label>

                        <label>
                          <input
                            type="checkbox"
                            checked={
                              autoAdvance
                            }
                            onChange={(
                              e
                            ) =>
                              setAutoAdvance(
                                e.target.checked
                              )
                            }
                          />{" "}
                          Auto-Advance
                        </label>
                      </div>

                      <div
                        style={{
                          marginTop:
                            8,
                          display:
                            "flex",
                          gap: 8,
                          flexWrap:
                            "wrap"
                        }}
                      >
                        <button
                          type="button"
                          style={
                            styles.button
                          }
                          onClick={
                            hostStartGame
                          }
                          disabled={
                            !(
                              hostPlays ||
                              Object.values(
                                lobbyData.players ||
                                  {}
                              ).filter(
                                (p) =>
                                  !p.isHost
                              ).length >
                                0
                            )
                          }
                        >
                          Spiel starten
                        </button>

                        <button
                          type="button"
                          style={{
                            ...styles.buttonSmall,
                            background:
                              "#999"
                          }}
                          onClick={
                            leaveLobby
                          }
                        >
                          Lobby verlassen
                        </button>

                        <button
                          type="button"
                          style={{
                            ...styles.buttonSmall,
                            background:
                              "#f39c12"
                          }}
                          onClick={async () => {
                            if (
                              !lobbyId
                            )
                              return;

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

                            if (
                              val.state !==
                              "playing"
                            ) {
                              alert(
                                "Spiel ist nicht aktiv."
                              );
                              return;
                            }

                            const nextIndex =
                              (val.currentIndex ??
                                0) +
                              1;

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
                                  roundDeadline:
                                    0
                                }
                              );
                            } else {
                              const newDeadline =
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
                                    newDeadline
                                }
                              );

                              startRoundCountdown(
                                newDeadline
                              );
                            }
                          }}
                        >
                          Nächste Frage
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Homework creator */}
                  {(isHost ||
                    isTeacher) && (
                    <div
                      style={
                        styles.homeworkBox
                      }
                    >
                      <h3>
                        📚 Hausaufgabe
                        erstellen
                      </h3>

                      <input
                        style={
                          styles.input
                        }
                        placeholder="Titel"
                        value={
                          homeworkTitle
                        }
                        onChange={(e) =>
                          setHomeworkTitle(
                            e.target.value
                          )
                        }
                      />

                      <textarea
                        style={
                          styles.textarea
                        }
                        placeholder="Beschreibung / Aufgabe"
                        rows={3}
                        value={
                          homeworkDescription
                        }
                        onChange={(e) =>
                          setHomeworkDescription(
                            e.target.value
                          )
                        }
                      />

                      <label>
                        Schüler:
                      </label>

                      <select
                        style={
                          styles.input
                        }
                        value={
                          selectedHomeworkPlayer
                        }
                        onChange={(e) =>
                          setSelectedHomeworkPlayer(
                            e.target.value
                          )
                        }
                      >
                        <option value="">
                          -- Schüler auswählen --
                        </option>

                        {Object.entries(
                          allUsers
                        )
                          .filter(
                            ([id, user]) =>
                              id !==
                                accountKey &&
                              user.role !==
                                "teacher"
                          )
                          .map(
                            ([id, user]) => (
                              <option
                                key={id}
                                value={id}
                              >
                                {user.username ||
                                  user.email}
                              </option>
                            )
                          )}
                      </select>

                      <label>
                        Vokabelset:
                      </label>

                      <select
                        style={
                          styles.input
                        }
                        value={
                          homeworkSet
                        }
                        onChange={(e) =>
                          setHomeworkSet(
                            e.target.value
                          )
                        }
                      >
                        {Object.keys(
                          SETS
                        ).map(
                          (setName) => (
                            <option
                              key={
                                setName
                              }
                              value={
                                setName
                              }
                            >
                              {setName}
                            </option>
                          )
                        )}
                      </select>

                      <label>
                        Anzahl Vokabeln:
                      </label>

                      <input
                        type="number"
                        min="1"
                        max="50"
                        style={
                          styles.input
                        }
                        value={
                          homeworkAmount
                        }
                        onChange={(e) =>
                          setHomeworkAmount(
                            Number(
                              e.target.value
                            )
                          )
                        }
                      />

                      <label>
                        Punkte:
                      </label>

                      <input
                        type="number"
                        min="0"
                        style={
                          styles.input
                        }
                        value={
                          homeworkPoints
                        }
                        onChange={(e) =>
                          setHomeworkPoints(
                            Number(
                              e.target.value
                            )
                          )
                        }
                      />

                      <label>
                        Zeitlimit pro
                        Vokabel (0 =
                        kein Limit):
                      </label>

                      <input
                        type="number"
                        min="0"
                        style={
                          styles.input
                        }
                        value={
                          homeworkTimeLimit
                        }
                        onChange={(e) =>
                          setHomeworkTimeLimit(
                            Number(
                              e.target.value
                            )
                          )
                        }
                      />

                      <label>
                        Abgabe:
                      </label>

                      <input
                        type="datetime-local"
                        style={
                          styles.input
                        }
                        value={
                          homeworkDueDate
                        }
                        onChange={(e) =>
                          setHomeworkDueDate(
                            e.target.value
                          )
                        }
                      />

                      <label
                        style={{
                          display:
                            "block",
                          marginBottom:
                            10
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={
                            homeworkRandom
                          }
                          onChange={(e) =>
                            setHomeworkRandom(
                              e.target.checked
                            )
                          }
                        />{" "}
                        Zufällige
                        Vokabeln
                      </label>

                      <label
                        style={{
                          display:
                            "block",
                          marginBottom:
                            10
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={
                            homeworkGermanFirst
                          }
                          onChange={(e) =>
                            setHomeworkGermanFirst(
                              e.target.checked
                            )
                          }
                        />{" "}
                        Standard:
                        Deutsch →
                        Englisch
                      </label>

                      <label
                        style={{
                          display:
                            "block",
                          marginBottom:
                            10
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={
                            homeworkAllowRetry
                          }
                          onChange={(e) =>
                            setHomeworkAllowRetry(
                              e.target.checked
                            )
                          }
                        />{" "}
                        Wiederholung
                        erlauben
                      </label>

                      <label>
                        Mindestpunktzahl
                        (%):
                      </label>

                      <input
                        type="number"
                        min="0"
                        max="100"
                        style={
                          styles.input
                        }
                        value={
                          homeworkMinimumScore
                        }
                        onChange={(e) =>
                          setHomeworkMinimumScore(
                            Number(
                              e.target.value
                            )
                          )
                        }
                      />

                      <button
                        type="button"
                        style={
                          styles.button
                        }
                        onClick={
                          createHomework
                        }
                      >
                        Hausaufgabe erstellen
                      </button>
                    </div>
                  )}

                  {!isHost && (
                    <div
                      style={{
                        marginTop:
                          10
                      }}
                    >
                      <button
                        type="button"
                        style={
                          styles.buttonSmall
                        }
                        onClick={
                          leaveLobby
                        }
                      >
                        Lobby verlassen
                      </button>
                    </div>
                  )}
                </>
              )}
          </div>
        )}

      {/* ----------------------
          IN-GAME
      */}
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
              style={
                styles.box
              }
              initial={{
                y: -300,
                opacity: 0
              }}
              animate={{
                y: 0,
                opacity: 1
              }}
              exit={{
                y: 300,
                opacity: 0
              }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30
              }}
            >
              <h4>
                {
                  languageLabel
                }
              </h4>

              <h3>
                {showGermanFirst
                  ? currentCard.de
                  : currentCard.en}
              </h3>

              {isMultiplayerMode && (
                <div
                  style={{
                    marginBottom: 8
                  }}
                >
                  <b>
                    Runde:
                  </b>{" "}
                  {(lobbyData?.currentIndex ??
                    0) + 1}{" "}
                  /{" "}
                  {lobbyData?.vocabList
                    ?.length ??
                    vocabList.length}
                  <br />

                  <b>
                    Zeit:
                  </b>{" "}
                  {timeLeft}s
                </div>
              )}

              <input
                type="text"
                value={
                  answer
                }
                onChange={(e) =>
                  setAnswer(
                    e.target.value
                  )
                }
                onKeyDown={(e) => {
                  if (
                    e.key ===
                    "Enter"
                  ) {
                    if (
                      isMultiplayerMode
                    ) {
                      submitAnswerToLobby(
                        answer
                      );
                    } else {
                      checkAnswer();
                    }

                    setAnswer("");
                  }
                }}
                style={
                  styles.input
                }
              />

              <div>
                <button
                  type="button"
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
                  style={
                    styles.button
                  }
                >
                  OK
                </button>
              </div>

              <p>
                {feedback}
              </p>

              <motion.p
                style={{
                  fontSize:
                    "20px",
                  fontWeight:
                    "bold"
                }}
                key={`live_score_${displayScore}`}
                initial={{
                  y: -50,
                  opacity: 0
                }}
                animate={{
                  y: 0,
                  opacity: 1
                }}
                exit={{
                  y: 50,
                  opacity: 0
                }}
                transition={{
                  duration: 0.5
                }}
              >
                Punkte:{" "}
                {
                  displayScore
                }
              </motion.p>

              {isMultiplayerMode &&
                lobbyData && (
                  <div
                    style={{
                      textAlign:
                        "left",
                      marginTop: 10
                    }}
                  >
                    <b>
                      Spieler-Status:
                    </b>

                    <div
                      style={{
                        maxHeight:
                          120,
                        overflowY:
                          "auto"
                      }}
                    >
                      {Object.entries(
                        playersLocal
                      ).map(
                        ([pid, p]) => (
                          <div
                            key={pid}
                            style={{
                              padding:
                                6
                            }}
                          >
                            {p.isHost
                              ? "👑 "
                              : ""}
                            {p.name} —{" "}
                            {p.score ??
                              0}{" "}
                            —{" "}
                            {(p.answeredIndex ??
                              -1) >=
                            (lobbyData.currentIndex ??
                              0)
                              ? "✅ beantwortet"
                              : "⏳ wartet"}{" "}
                            {pid ===
                            playerId
                              ? "(du)"
                              : ""}
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
            </motion.div>
          </AnimatePresence>
        )}

      {/* ----------------------
          SINGLEPLAYER RESULTS
      */}
      {!isMultiplayerMode &&
        done && (
          <div
            style={styles.box}
          >
            <h3>
              Ergebnisse
            </h3>

            <AnimatePresence>
              {showEmoji && (
                <motion.div
                  initial={{
                    scale: 3,
                    opacity: 0
                  }}
                  animate={
                    emojiAnimating
                      ? {
                          scale: [
                            0.6,
                            1.15,
                            1
                          ],
                          opacity: 1
                        }
                      : {
                          scale: 1,
                          opacity: 1
                        }
                  }
                  exit={{
                    opacity: 0
                  }}
                  transition={{
                    duration:
                      emojiAnimating
                        ? 1.0
                        : 0.4,
                    times: [
                      0,
                      0.6,
                      1
                    ]
                  }}
                  style={{
                    fontSize:
                      "80px",
                    textAlign:
                      "center",
                    margin:
                      "10px auto"
                  }}
                >
                  {getEmoji()}

                  <motion.p
                    style={{
                      fontSize:
                        "32px",
                      fontWeight:
                        "bold",
                      marginTop:
                        "10px"
                    }}
                    initial={{
                      y: -20,
                      opacity: 0
                    }}
                    animate={{
                      y: 0,
                      opacity: 1
                    }}
                    transition={{
                      duration:
                        0.6,
                      delay:
                        emojiAnimating
                          ? 0.8
                          : 0
                    }}
                  >
                    Punkte:{" "}
                    {
                      displayScore
                    }
                  </motion.p>
                </motion.div>
              )}
            </AnimatePresence>

            {activeHomeworkId && (
              <p
                style={{
                  fontWeight:
                    "bold",
                  color:
                    "green"
                }}
              >
                📚 Hausaufgabe
                gespeichert.
              </p>
            )}

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
                    style={
                      styles.card
                    }
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
                    {v.userAnswer ??
                      ""}{" "}
                    {v.correct
                      ? "✅"
                      : "❌"}
                  </div>
                )
              )}
            </div>

            <div
              style={{
                display:
                  "flex",
                gap: 8,
                justifyContent:
                  "center",
                marginBottom:
                  8,
                flexWrap:
                  "wrap"
              }}
            >
              <button
                type="button"
                onClick={
                  exportPDF
                }
                style={
                  styles.buttonSmall
                }
              >
                PDF
              </button>

              <button
                type="button"
                onClick={() => {
                  reset();
                }}
                style={
                  styles.buttonSmall
                }
              >
                Neue Runde
              </button>
            </div>

            {username && (
              <p
                style={{
                  marginTop:
                    "10px",
                  fontWeight:
                    "bold",
                  fontSize:
                    "16px"
                }}
              >
                Gut gemacht,{" "}
                {username}!
              </p>
            )}
          </div>
        )}

      {/* ----------------------
          BOTTOM BAR
      */}
      <div
        style={
          styles.bottomBar
        }
      >
        <button
          type="button"
          onClick={
            openMultiplayer
          }
          style={{
            ...styles.buttonSmall,
            width: 200
          }}
        >
          Multiplayer
        </button>

        <button
          type="button"
          onClick={() => {
            setIsMultiplayerMode(
              false
            );
            setLobbyId("");
            setLobbyData(null);
          }}
          style={{
            ...styles.buttonSmall,
            width: 120,
            background:
              "#999"
          }}
        >
          Menü
        </button>
      </div>
    </div>
  );
}
