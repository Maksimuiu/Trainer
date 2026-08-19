

markdown(1).md eingefügt
Datei
add like account saving like it checks if u have account if yes wont create new one and if the guy ist host or teacher they can give home work like do 3 vokables and more very customisible and alexmaxi14@evgbm.net will have a button to fake do the homework :



Done. I updated the app with:

Account checking: login now checks whether the @evgbm.net account already exists before creating one. The old version always used push() and therefore created a new account every login. 


Saved email: remembers the last school email locally, without storing the password locally.

Custom homework system: teachers/hosts can create:

e.g. 3 Vokabeln

custom instructions

custom vocabulary

custom number of questions

optional deadline

custom text-answer assignments

lobby-specific assignments when the creator is a host

Homework submissions: completed homework is saved in Firebase.

Special alexmaxi14@evgbm.net test button: I made this a clearly labeled “🧪 Testen (nicht gewertet)” mode. It lets that account simulate/preview homework without recording it as completed, rather than creating a hidden fake completion.

Teacher/host permissions: only isTeacher || isHost can publish assignments.

Homework panel: students can see and start available assignments.

The upgraded file is here:

Download the upgraded App.js source

Important: your current app stores passwords directly in Firebase Realtime Database. That's fine for a prototype, but for a real deployment you should move login to Firebase Authentication and remove plaintext passwords from users. 


App_upgraded_homework_accounts.md
Dokument


Bibliothek
/
App_upgraded_homework_accounts.md


// App.js
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
  remove
} from "firebase/database";

// ----------------------
// Konfiguration (Firebase)
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

// Lehrerpw (fest im Code; empfehlenswert: später Firebase Auth + Security Rules)
const TEACHER_PASSWORD = "Host";

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ----------------------
// Lernsets (URLs bleiben unverändert wie gewünscht)
const SETS = {
  "Unit 2": "https://raw.githubusercontent.com/Maksimuiu/voka/main/Unit2",
  "Unit 2Story": "https://raw.githubusercontent.com/Maksimuiu/voka/main/Unit%202%20Story",
  "2b": "https://raw.githubusercontent.com/Maksimuiu/voka/main/2b",
  "The Months": "https://raw.githubusercontent.com/Maksimuiu/voka/main/The%20Months",
  "Food": "https://raw.githubusercontent.com/Maksimuiu/voka/main/Food",
  "Unit 1Story":"https://raw.githubusercontent.com/Maksimuiu/voka/main/Unit%201%20Story",
  "Unit 3Story": "https://raw.githubusercontent.com/Maksimuiu/voka/main/Unit%203%20Story",
  "Dare": "https://raw.githubusercontent.com/Maksimuiu/voka/main/Dare",
  "Unit 2  want - wait": "https://raw.githubusercontent.com/Maksimuiu/voka/main/Unit%202%20%20want%20-%20wait",	
  "irgendwas": "random"
};

// ----------------------
// Styles
const styles = {
  container: { fontFamily: "Arial", textAlign: "center", marginTop: 20, paddingBottom: 140 },
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
    fontSize: "14px"
  },
  textarea: {
    width: "320px",
    padding: "10px",
    borderRadius: "5px",
    border: "1px solid #aaa",
    fontSize: "14px",
    marginBottom: "10px",
    resize: "none"
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
  flashcards: { maxHeight: "220px", overflowY: "auto", marginBottom: "10px" },
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
    gap: 12
  },
  smallMuted: { fontSize: 12, color: "#666" },
  lobbyBox: { width: "520px", padding: "15px", margin: "12px auto", borderRadius: "10px", background: "#fff", boxShadow: "0 3px 12px rgba(0,0,0,0.07)" },
  playersList: { maxHeight: 200, overflowY: "auto", textAlign: "left" }
};

// ----------------------
// Helpers: parsing/normalize
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
  (str || "").trim().replace(/[.!?]/g, "").replace(/\s+/g, " ").toLowerCase();

const getValidAnswers = (word) =>
  (word || "").split("/").map((w) => normalize(w));

const genLobbyId = () =>
  Math.random().toString(36).substring(2, 8).toUpperCase();

// Firebase-safe stable key for an email address.
const getUserKey = (email) =>
  btoa(unescape(encodeURIComponent((email || "").trim().toLowerCase())))
    .replace(/\//g, "_")
    .replace(/\+/g, "-")
    .replace(/=+$/g, "");

const TEST_HOMEWORK_EMAIL = "alexmaxi14@evgbm.net";

// ----------------------
// App
export default function App() {
  // ---------- Singleplayer
  const [username, setUsername] = useState("");
  const [vocabText, setVocabText] = useState(""); // textarea content
  const [vocabList, setVocabList] = useState([]); // active learning list
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

  // end animation / smiley control
  const [showEmoji, setShowEmoji] = useState(false);
  const [emojiAnimating, setEmojiAnimating] = useState(false);

  // ---------- Multiplayer / Teacher
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

  // LOGIN STATE (for multiplayer gating)
  const [showLoginMenu, setShowLoginMenu] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  //const [username, setUsername] = useState("");

  // teacher login
  const [isTeacher, setIsTeacher] = useState(false);

  // teacher UI controls
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [bonusRoundActive, setBonusRoundActive] = useState(false);

  // set-picker modal short state
  const [setLoading, setSetLoading] = useState(false);

  // ---------- Homework / assignments
  const [homeworks, setHomeworks] = useState({});
  const [showHomeworkPanel, setShowHomeworkPanel] = useState(false);
  const [homeworkTitle, setHomeworkTitle] = useState("");
  const [homeworkInstructions, setHomeworkInstructions] = useState("");
  const [homeworkType, setHomeworkType] = useState("vocab");
  const [homeworkAmount, setHomeworkAmount] = useState(3);
  const [homeworkVocabText, setHomeworkVocabText] = useState("");
  const [homeworkDueDate, setHomeworkDueDate] = useState("");
  const [activeHomeworkId, setActiveHomeworkId] = useState(null);
  const [homeworkTestMode, setHomeworkTestMode] = useState(false);
  const homeworkSubmissionRef = useRef(false);

  // ---------- Vocab helpers
  const addVocabFromInput = () => {
    const parsed = parseVocab(vocabText);
    if (parsed.length === 0) {
      alert("Bitte Vokabeln im Format 'Deutsch,Englisch' eingeben (eine pro Zeile).");
      return;
    }
    const prepared = parsed.map((v) => ({ ...v, answered: false, correct: false, userAnswer: "" }));
    setVocabList(prepared.slice(0, 50));
    alert(`Hinzugefügt: ${prepared.length} Vokabeln (max 50 verwendet).`);
  };

  const mixSetsRandomly = async (setNames, amountPerSet = 5) => {
    if (setNames.includes("random")) {
      setNames = Object.keys(SETS).filter((s) => SETS[s] !== "random");
      amountPerSet = Math.ceil(20 / setNames.length);
    }
    let result = [];
    for (let name of setNames) {
      const res = await fetch(SETS[name]);
      const text = await res.text();
      const words = parseVocab(text);
      const random = words.sort(() => 0.5 - Math.random()).slice(0, amountPerSet);
      result.push(...random);
    }
    return result.sort(() => 0.5 - Math.random()).slice(0, 20);
  };

  // ---------------------- GitHub import (selectedSet)
  const addGitHubVocab = async () => {
    try {
      setSetLoading(true);
      const url = SETS[selectedSet];

      if (url === "random") {
        const randomWords = await mixSetsRandomly(["random"], 20);
        setVocabText(randomWords.map((v) => `${v.de},${v.en}`).join("\n"));
        setSetLoading(false);
        return;
      }

      const res = await fetch(url);
      const text = await res.text();
      const imported = parseVocab(text);
      // append to existing textarea content (user might have custom vocab)
      const existing = parseVocab(vocabText);
      const combined = [...existing, ...imported].slice(0, 50);
      setVocabText(combined.map((v) => `${v.de},${v.en}`).join("\n"));
    } catch (err) {
      console.error(err);
      alert("Fehler beim Importieren des Sets.");
    } finally {
      setSetLoading(false);
    }
  };
// ---------------------- LOGIN RULES
const isValidSchoolEmail = (email) => typeof email === "string" && email.trim().toLowerCase().endsWith("@evgbm.net");
const isValidPassword = (pw) => typeof pw === "string" && /^[A-Za-z0-9]{8}$/.test(pw);
 // ---------------------- LOGIN HANDLER
  const handleLogin = async () => {
    const email = loginEmail.trim().toLowerCase();

    if (!isValidSchoolEmail(email)) {
      alert("E-Mail muss auf @evgbm.net enden.");
      return;
    }
    if (!isValidPassword(loginPassword)) {
      alert("Passwort muss genau 8 Zeichen/Zahlen enthalten (keine Sonderzeichen).");
      return;
    }

    try {
      // First check whether the account already exists.
      // This prevents a new Firebase user entry being created on every login.
      const usersSnap = await get(ref(db, "users"));
      const users = usersSnap.exists() ? usersSnap.val() : {};
      const existingEntry = Object.entries(users).find(
        ([, user]) => (user?.email || "").trim().toLowerCase() === email
      );

      if (existingEntry) {
        const [, existingUser] = existingEntry;

        if (existingUser.password !== loginPassword) {
          alert("Dieser Account existiert bereits, aber das Passwort ist falsch.");
          return;
        }

        await update(existingEntry[0] ? ref(db, `users/${existingEntry[0]}`) : ref(db, "users"), {
          lastLoginAt: Date.now()
        });

        setUsername(email.split("@")[0]);
        setmultiUsername(email.split("@")[0]);
        setLoginEmail(email);
        setLoggedIn(true);
        setShowLoginMenu(false);
        localStorage.setItem("voka_saved_email", email);
        setIsMultiplayerMode(true);
        return;
      }

      // No account yet -> create exactly one account.
      const userRef = push(ref(db, "users"));
      await set(userRef, {
        email,
        password: loginPassword,
        createdAt: Date.now(),
        lastLoginAt: Date.now()
      });

      setUsername(email.split("@")[0]);
      setmultiUsername(email.split("@")[0]);
      setLoggedIn(true);
      setShowLoginMenu(false);
      localStorage.setItem("voka_saved_email", email);
      setIsMultiplayerMode(true);
      alert("Account erstellt und eingeloggt.");
    } catch (err) {
      console.error(err);
      alert("Fehler beim Prüfen/Speichern des Accounts in Firebase.");
    }
  };

  const handleCancelLogin = () => {
    setShowLoginMenu(false);
  };

  const handleLogout = () => {
    setLoggedIn(false);
    setUsername("");
    setmultiUsername("");
    setLoginEmail("");
    setLoginPassword("");
    setIsTeacher(false);
    setShowHomeworkPanel(false);
    setActiveHomeworkId(null);
    setHomeworkTestMode(false);
    localStorage.removeItem("voka_saved_email");
  };


  // ---------------------- Homework
  const canManageHomework = isTeacher || isHost;
  const isTestHomeworkUser =
    (loginEmail || "").trim().toLowerCase() === TEST_HOMEWORK_EMAIL;

  useEffect(() => {
    if (!loggedIn) {
      setHomeworks({});
      return undefined;
    }

    const homeworkRef = ref(db, "homeworks");
    const unsubscribe = onValue(homeworkRef, (snapshot) => {
      const data = snapshot.exists() ? snapshot.val() : {};
      setHomeworks(data || {});
    });

    return () => unsubscribe();
  }, [loggedIn]);

  useEffect(() => {
    if (!loggedIn) return;

    const savedEmail = localStorage.getItem("voka_saved_email");
    if (savedEmail && !loginEmail) setLoginEmail(savedEmail);
  }, [loggedIn, loginEmail]);

  const createHomework = async () => {
    if (!loggedIn || !canManageHomework) {
      alert("Nur Lehrer oder der Host darf Hausaufgaben erstellen.");
      return;
    }

    const title = homeworkTitle.trim();
    const instructions = homeworkInstructions.trim();
    let sourceList = parseVocab(homeworkVocabText);

    if (homeworkType === "vocab" && sourceList.length === 0) {
      if (vocabList.length > 0) {
        sourceList = vocabList.map(({ de, en }) => ({ de, en }));
      } else if (vocabText.trim()) {
        sourceList = parseVocab(vocabText);
      } else {
        sourceList = await mixSetsRandomly(
          [selectedSet],
          Math.max(3, Number(homeworkAmount) || 3)
        );
      }
    }

    if (!title) {
      alert("Bitte einen Titel für die Hausaufgabe eingeben.");
      return;
    }

    if (homeworkType === "vocab" && sourceList.length === 0) {
      alert("Bitte mindestens eine Vokabel angeben.");
      return;
    }

    const amount = Math.max(
      1,
      Math.min(
        Number(homeworkAmount) || 1,
        homeworkType === "vocab" ? sourceList.length : 100
      )
    );

    const assignmentRef = push(ref(db, "homeworks"));
    await set(assignmentRef, {
      title,
      instructions,
      type: homeworkType,
      amount,
      vocabList: sourceList.slice(0, 100),
      createdBy: loginEmail || username,
      createdAt: Date.now(),
      dueDate: homeworkDueDate || "",
      targetLobbyId: isHost && lobbyId ? lobbyId : "",
      active: true
    });

    setHomeworkTitle("");
    setHomeworkInstructions("");
    setHomeworkVocabText("");
    setHomeworkDueDate("");
    setHomeworkAmount(3);
    alert(`Hausaufgabe "${title}" wurde erstellt.`);
  };

  const startHomework = (homeworkId, testMode = false) => {
    const homework = homeworks[homeworkId];
    if (!homework) return;

    if (homework.targetLobbyId && homework.targetLobbyId !== lobbyId) {
      alert("Diese Hausaufgabe gehört zu einer anderen Lobby.");
      return;
    }

    setActiveHomeworkId(homeworkId);
    setHomeworkTestMode(testMode);
    homeworkSubmissionRef.current = false;

    if (homework.type === "vocab") {
      const list = (homework.vocabList || []).slice(0, homework.amount || 3);
      if (!list.length) {
        alert("Diese Hausaufgabe enthält keine Vokabeln.");
        return;
      }

      setVocabText(list.map((v) => `${v.de},${v.en}`).join("\n"));
      setVocabList(list);
      setIsMultiplayerMode(false);
      setShowHomeworkPanel(false);
      startSession(list);
    } else {
      setIsMultiplayerMode(false);
      setShowHomeworkPanel(false);
      setStarted(true);
      setDone(false);
      setCurrentCard({
        de: homework.instructions || homework.title,
        en: homework.instructions || homework.title
      });
      setShowGermanFirst(true);
      setLanguageLabel("Hausaufgabe");
      setAnswer("");
      setFeedback("");
      setScore(0);
      setDisplayScore(0);
    }
  };

  const completeTextHomework = async () => {
    if (!activeHomeworkId) return;

    if (!answer.trim()) {
      setFeedback("Bitte zuerst eine Antwort eingeben.");
      return;
    }

    setFeedback("✅ Aufgabe abgeschlossen.");
    setDone(true);

    if (!homeworkTestMode && !homeworkSubmissionRef.current) {
      homeworkSubmissionRef.current = true;
      const submissionKey = getUserKey(loginEmail || username);

      await update(
        ref(db, `homeworks/${activeHomeworkId}/submissions/${submissionKey}`),
        {
          email: loginEmail || "",
          username: username || multiusername,
          completed: true,
          testMode: false,
          answer,
          completedAt: Date.now()
        }
      );
    }
  };

  const startHomeworkTest = (homeworkId) => {
    if (!isTestHomeworkUser) {
      alert("Der Testmodus ist nur für den Test-Account verfügbar.");
      return;
    }
    startHomework(homeworkId, true);
  };

  // ---------------------- Singleplayer/core gameplay
  const startSession = (providedList = null) => {
    // Fix: don't start with an empty list — try to parse textarea if necessary
    let listToUse = Array.isArray(providedList) && providedList.length > 0 ? providedList : [];

    if (listToUse.length === 0) {
      // if vocabList state already has items, use those
      if (vocabList && vocabList.length > 0) {
        listToUse = vocabList;
      } else {
        // try parse from textarea
        const parsed = parseVocab(vocabText);
        if (parsed.length > 0) {
          listToUse = parsed.slice(0, 50);
        }
      }
    }

    if (!listToUse || listToUse.length === 0) {
      alert("Keine Vokabeln vorhanden. Bitte Vokabeln eingeben oder ein Set importieren.");
      return;
    }

    // Prepare entries
    const prep = listToUse.map((v) => ({ ...v, answered: false, correct: false, userAnswer: "" })).slice(0, 50);
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
      // end
      setDone(true);
      setCurrentCard(null);
      setShowEmoji(true);
      // we want final score to animate after emoji — set displayScore to 0 here
      setDisplayScore(0);
      return;
    }
    const random = remaining[Math.floor(Math.random() * remaining.length)];
    const germanFirst = Math.random() > 0.5;
    setShowGermanFirst(germanFirst);
    setLanguageLabel(germanFirst ? "Deutsch → Englisch" : "Englisch → Deutsch");
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

    const correctWord = showGermanFirst ? currentCard.en : currentCard.de;
    const validAnswers = getValidAnswers(correctWord);
    const userNorm = normalize(answer);

    const isSpecial = userNorm === "am";
    const isCorrect = isSpecial || validAnswers.includes(userNorm);

    setFeedback(isCorrect ? "✅ richtig!" : `❌ richtig: ${correctWord}`);

    let addedScore = isCorrect ? 1 : 0;
    if (pendingBonusPoints > 0) {
      addedScore += pendingBonusPoints;
      setPendingBonusPoints(0);
    }
    if (addedScore > 0) setScore((prev) => prev + addedScore);

    const updated = vocabList.map((v) =>
      v.de === currentCard.de
        ? {
            ...v,
            answered: true,
            correct: isCorrect,
            userAnswer: isSpecial ? correctWord : answer
          }
        : v
    );

    setVocabList(updated);
    // small delay so user sees feedback, then next card
    setTimeout(() => nextCard(updated), 900);
  };

  // animate score during gameplay (increment displayScore until reaching score)
  useEffect(() => {
    // only animate live while not in final "done and post-smiley count up"
    if (!done && displayScore < score) {
      const t = setTimeout(() => setDisplayScore((prev) => prev + 1), 250);
      return () => clearTimeout(t);
    }
  }, [displayScore, score, done]);

  // handle final smiley animation and final score tally
  useEffect(() => {
    if (done) {
      // start smiley animation, then after it finishes, count up to final score and show motivation
      setShowEmoji(true);
      setEmojiAnimating(true);

      // duration of smiley animation (ms) — adjust to match framer-motion timings
      const SMILEY_DURATION = 1200;

      const id = setTimeout(() => {
        setEmojiAnimating(false);
        // animate displayScore from 0 to final score
        setDisplayScore(0);
        const total = score;
        if (total <= 0) {
          setDisplayScore(0);
        } else {
          const steps = Math.min(30, total); // cap steps to keep animation reasonable
          const increment = Math.ceil(total / steps);
          const intervalMs = Math.max(30, Math.floor(SMILEY_DURATION / steps));
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
        }
      }, SMILEY_DURATION);

      return () => clearTimeout(id);
    }
  }, [done, score]);

  useEffect(() => {
    if (!done || !activeHomeworkId || homeworkTestMode || homeworkSubmissionRef.current) {
      return;
    }

    const submitHomeworkResult = async () => {
      homeworkSubmissionRef.current = true;
      const submissionKey = getUserKey(loginEmail || username);

      try {
        await update(
          ref(db, `homeworks/${activeHomeworkId}/submissions/${submissionKey}`),
          {
            email: loginEmail || "",
            username: username || multiusername,
            completed: true,
            testMode: false,
            score,
            total: vocabList.length,
            completedAt: Date.now()
          }
        );
      } catch (err) {
        console.error("Hausaufgabe konnte nicht gespeichert werden:", err);
      }
    };

    submitHomeworkResult();
  }, [
    done,
    activeHomeworkId,
    homeworkTestMode,
    loginEmail,
    username,
    multiusername,
    score,
    vocabList.length
  ]);

  const handleTitleClick = () => {
    const newClicks = titleClicks + 1;
    setTitleClicks(newClicks);
    if (newClicks === 12) setPendingBonusPoints(10);
    else if (newClicks > 12) setPendingBonusPoints((prev) => prev + 1);
  };

  const getEmoji = () => (score < 5 ? "😢" : score < 10 ? "😐" : "😄");

  const exportPDF = async () => {
    const element = document.getElementById("flashcards");
    if (!element) return alert("Keine Flashcards zum Exportieren.");
    const canvas = await html2canvas(element);
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF();
    pdf.addImage(imgData, "PNG", 10, 10, 180, 180);
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
    setHomeworkTestMode(false);
    homeworkSubmissionRef.current = false;
  };


  // ---------------------- MULTIPLAYER (Realtime DB) ----------------------
  // ---------------------- Multiplayer opener
  const openMultiplayer = () => {
    if (!loggedIn) {
      setShowLoginMenu(true);
      return;
    }
    // user already logged in -> open multiplayer menu (placeholder)
   // alert("Multiplayer-Menü (eingeloggt) — hier kannst du Lobby/Realtime einbauen.");
   setIsMultiplayerMode(true);
  };
  // create lobby (teacher-only: if logged in skip prompt)
  const createLobby = async (vocabListForLobby) => {
    // if not teacher, prompt password inline
    if (!isTeacher) {
      const pw = prompt("Lehrer-Passwort eingeben (nur Lehrer darf Lobbys erstellen):");
      if (pw === null) return; // canceled
      if (pw !== TEACHER_PASSWORD) {
        alert("Falsches Lehrer-Passwort. Lobby wird nicht erstellt.");
        return;
      }
      setIsTeacher(true);
    }

    // proceed to create
    const id = genLobbyId();
    setLobbyId(id);
    setIsHost(true);

    const lobbyRef = ref(db, `lobbies/${id}`);
    const initial = {
      hostId: null,
      hostPlays: hostPlays,
      state: "waiting", // waiting | playing | finished
      vocabList: vocabListForLobby || [],
      currentIndex: 0,
      roundDeadline: 0,
      createdAt: Date.now(),
      bonusRoundActive: bonusRoundActive
    };

    await set(lobbyRef, initial);

    const playerRef = push(ref(db, `lobbies/${id}/players`));
    const pid = playerRef.key;
    const playerObj = {
      name: username || multiusername,
      score: 0,
      answeredIndex: -1,
      lastAnswer: "",
      isHost: true,
      joinedAt: Date.now(),
      plays: !!hostPlays
    };
    await set(playerRef, playerObj);
    await update(lobbyRef, { hostId: pid });
    setPlayerId(pid);
    onDisconnect(playerRef).remove();
    listenToLobby(id);
  };

  const joinLobby = async (id) => {
    if (!id) return alert("Bitte Lobby-ID eingeben.");
    const lobbyRef = ref(db, `lobbies/${id}`);
    const snap = await get(lobbyRef);
    if (!snap.exists()) return alert("Lobby existiert nicht.");

    const playerRef = push(ref(db, `lobbies/${id}/players`));
    const pid = playerRef.key;
    const playerObj = {
      name: username || multiusername,
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
    setLobbyId(id);
    setIsHost(false);
    listenToLobby(id);
    setJoinLobbyId("");
			  console.log("join lobby");
  };

  // listen to lobby changes
  const listenToLobby = (id) => {
    const lobbyRef = ref(db, `lobbies/${id}`);
    onValue(lobbyRef, (snapshot) => {
      const val = snapshot.val();
      setLobbyData(val || null);

      if (val && val.players) setPlayersLocal(val.players);
      else setPlayersLocal({});

      if (val && val.state === "playing") {
        const idx = val.currentIndex ?? 0;
        const list = val.vocabList || [];
        const card = list[idx];
        if (card) {
          setVocabList(list.map(v => ({...v, answered:false, correct:false, userAnswer:""})));
          setStarted(true);
          setDone(false);
          setCurrentCard(card);
          const germanFirst = Math.random() > 0.5;
          setShowGermanFirst(germanFirst);
          setLanguageLabel(germanFirst ? "Deutsch → Englisch" : "Englisch → Deutsch");
          const deadline = val.roundDeadline ?? 0;
          const left = Math.max(0, Math.round((deadline - Date.now()) / 1000));
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
				  console.log("lost lobby");
      }

      if (val && val.state === "finished") {
        setMultiplayerResultsVisible(true);
        setStarted(false);
        setCurrentCard(null);
        setTimeLeft(0);
      }
    });
  };

  // teacher (host) starts the game
  const hostStartGame = async () => {
    if (!isHost || !lobbyId) return;
    let list = [];
    if (vocabList && vocabList.length > 0) {
      list = vocabList.map(v => ({ de: v.de, en: v.en }));
    } else if (vocabText && vocabText.trim()) {
      list = parseVocab(vocabText).slice(0, 15);
    } else {
      list = await mixSetsRandomly([selectedSet], 15);
    }

    const lobbyRef = ref(db, `lobbies/${lobbyId}`);
    const deadline = Date.now() + 15000; // 15s per round
    await update(lobbyRef, {
      vocabList: list,
      state: "playing",
      currentIndex: 0,
      roundDeadline: deadline,
      hostPlays: hostPlays,
      bonusRoundActive: bonusRoundActive
    });

    // reset players
    const playersSnap = await get(ref(db, `lobbies/${lobbyId}/players`));
    if (playersSnap.exists()) {
      const players = playersSnap.val();
      for (const pid of Object.keys(players)) {
        await update(ref(db, `lobbies/${lobbyId}/players/${pid}`), {
          answeredIndex: -1,
          score: 0,
          lastAnswer: "",
          plays: players[pid].plays ?? true
        });
      }
    }
    startRoundCountdown(deadline);
    monitorAdvanceConditions(lobbyId);
  };

  // submit answer to lobby 
  const submitAnswerToLobby = async (ans) => {
    if (!lobbyId || !playerId) return;
    const lobbyRef = ref(db, `lobbies/${lobbyId}`);
    const snap = await get(lobbyRef);
    if (!snap.exists()) return;
    const lobby = snap.val();
    const idx = lobby.currentIndex ?? 0;
    const current = (lobby.vocabList || [])[idx];
    if (!current) return;

    const playerRef = ref(db, `lobbies/${lobbyId}/players/${playerId}`);
    const playerSnap = await get(playerRef);
    const existing = playerSnap.exists() ? playerSnap.val() : {};

    if ((existing.answeredIndex ?? -1) >= idx) {
      setFeedback("Du hast diese Vokabel bereits beantwortet.");
      return;
    }

    const userNorm = normalize(ans);
    const validAnswers = getValidAnswers(showGermanFirst ? current.en : current.de);
    const isSpecial = userNorm === "am";
    const isCorrect = isSpecial || validAnswers.includes(userNorm);

    let pointsEarned = 0;
    if (isCorrect) {
      const secondsLeft = Math.max(0, Math.round((lobby.roundDeadline - Date.now()) / 1000));
      const timeBonus = Math.round(secondsLeft * 10 / 15); // 0..10
      pointsEarned = 5 + timeBonus;
      if (lobby.bonusRoundActive) pointsEarned += 5; // bonus round extra points
    }

    const newScore = (existing.score || 0) + pointsEarned;

    await update(playerRef, {
      answeredIndex: idx,
      lastAnswer: ans,
      score: newScore,
      lastCorrect: isCorrect,
      lastPoints: pointsEarned,
      answeredAt: Date.now()
    });

    setFeedback(isCorrect ? `✅ richtig! +${pointsEarned} Punkte` : `❌ falsch`);
  };

  // monitor advance conditions (host responsibility)
  const monitorAdvanceConditions = (id) => {
    const lobbyRef = ref(db, `lobbies/${id}`);
    onValue(lobbyRef, async (snap) => {
      const val = snap.val();
      if (!val) return;
      if (val.state !== "playing") return;

      const idx = val.currentIndex ?? 0;
      const players = val.players || {};
      const activePlayers = Object.entries(players).filter(([, p]) => p.plays !== false);

      const allAnswered =
        activePlayers.length > 0 &&
        activePlayers.every(([, p]) => (p.answeredIndex ?? -1) >= idx);

      const now = Date.now();
	  

	        console.log("monitorAdvanceConditions");


      if (allAnswered || (val.roundDeadline && now >= (val.roundDeadline))) 
	  {
        // only host should advance
        if (val.hostId === playerId) 
		{
          const nextIndex = idx + 1;
          //const total = (val.vconst roundTimerRef = useRef(null);vocabList || []).length;
		  const total = (val.vocabList || []).length;
          if (nextIndex >= total) {
            await update(lobbyRef, {
              state: "finished",
              roundDeadline: 0
            });
          } else {
            const newDeadline = Date.now() + 15000;
            await update(lobbyRef, {
              currentIndex: nextIndex,
              roundDeadline: newDeadline
            });
            startRoundCountdown(newDeadline);
          }
        }
						  	  console.log("isHost2: ", isHost);
	  console.log("autoAdvance2: ", autoAdvance);
	  console.log("lobbyId2: ", lobbyId);
      }
    });
  };

  // start local countdown
  const startRoundCountdown = (deadline) => {
  if (roundTimerRef.current) clearInterval(roundTimerRef.current);

  const tick = async () => {
    const left = Math.max(0, Math.round((deadline - Date.now()) / 1000));
    setTimeLeft(left);

    if (left <= 0) {
		console.log("timer is 0");
      clearInterval(roundTimerRef.current);

      // ⬇️ NEU: Nur Host darf weiterschalten, wenn der Timer abläuft
	  console.log("isHost: ", isHost);
	  console.log("autoAdvance: ", autoAdvance);
	  console.log("lobbyId: ", lobbyId);
      if (isHost && autoAdvance && lobbyId) 
	  {
        const lobbyRef = ref(db, `lobbies/${lobbyId}`);
        const snap = await get(lobbyRef);
				console.log("check snap");
        if (!snap.exists()) return;

        const val = snap.val();
        const idx = val.currentIndex ?? 0;
        const total = (val.vocabList || []).length;
        if (idx + 1 >= total) {
					console.log("completed");
          await update(lobbyRef, { state: "finished", roundDeadline: 0 });
        } else {
					console.log("next card");
          const newDeadline = Date.now() + 15000;
          await update(lobbyRef, {
            currentIndex: idx + 1,
            roundDeadline: newDeadline
          });
		              startRoundCountdown(newDeadline);
        }
      }
    }
  };

  tick();
  roundTimerRef.current = setInterval(tick, 250);
};


  const toggleHostPlays = async (val) => {
    setHostPlays(val);
    if (!lobbyId) return;
    await update(ref(db, `lobbies/${lobbyId}`), { hostPlays: !!val });
    if (playerId) {
      await update(ref(db, `lobbies/${lobbyId}/players/${playerId}`), { plays: !!val });
    }
  };

  const leaveLobby = async () => {
    if (!lobbyId || !playerId) {
      setIsMultiplayerMode(false);
      setLobbyId("");
      setLobbyData(null);
	  				console.log("leave lobby 2");
      return;
    }
		  				console.log("leave lobby 3");
    await remove(ref(db, `lobbies/${lobbyId}/players/${playerId}`)).catch(() => {});
    if (isHost) {
      const snap = await get(ref(db, `lobbies/${lobbyId}/players`));
      if (snap.exists()) {
        const players = snap.val();
        const keys = Object.keys(players);
        if (keys.length === 0) {
          await remove(ref(db, `lobbies/${lobbyId}`));
        } else {
          const newHost = keys[0];
          await update(ref(db, `lobbies/${lobbyId}`), { hostId: newHost, state: "waiting" });
          await update(ref(db, `lobbies/${lobbyId}/players/${newHost}`), { isHost: true });
        }
      } else {
        await remove(ref(db, `lobbies/${lobbyId}`));
			  				console.log("leave lobby 3");
      }
    }
		  console.log("leave lobby");
    setIsHost(false);
    setPlayerId(null);
    setLobbyId("");
    setLobbyData(null);
    setIsMultiplayerMode(false);
    setMultiplayerResultsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (roundTimerRef.current) clearInterval(roundTimerRef.current);
    };
  }, []);

  // ---------- UI Rendering

  // Leaderboard (multiplayer end)
  if (multiplayerResultsVisible && isMultiplayerMode && lobbyData) {
    const players = lobbyData.players || {};
    const sorted = Object.entries(players).sort((a, b) => (b[1].score || 0) - (a[1].score || 0));
    return (
      <div style={styles.container}>
        <div style={styles.box}>
          <h2>Leaderboard — Lobby {lobbyId}</h2>
          <div style={{ textAlign: "left" }}>
            {sorted.length === 0 ? <div>Keine Spieler</div> : sorted.map(([pid, p], i) => (
              <div key={pid} style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                <strong>{i + 1}.</strong> {p.name} — <strong>{p.score ?? 0}</strong> Punkte {p.isHost ? "👑" : ""}
              </div>
            ))}
          </div>

          <div style={{ marginTop: 12 }}>
            <button type="button" style={styles.button} onClick={() => { reset(); leaveLobby(); }}>
              Zurück zum Menü
            </button>
          </div>
        </div>
      </div>
    );
  }

// ---------------------- RENDER LOGIC
  // Option B: login is own screen shown when multiplayer clicked
  if (showLoginMenu && !loggedIn) {
    return (
      <div style={styles.container}>
        <div style={styles.box}>
          <h2>Login für Multiplayer</h2>

          <input
            type="email"
            placeholder="Schul-E-Mail "
            value={loginEmail}
            onChange={(e) => setLoginEmail(e.target.value)}
            style={styles.input}
          />

          <input
            type="password"
            placeholder="Passwort"
            value={loginPassword}
            onChange={(e) => setLoginPassword(e.target.value)}
            style={styles.input}
          />

          <div style={{ display: "flex", gap: 8, flexDirection: "column", alignItems: "center" }}>
            <button style={styles.button} onClick={handleLogin}>Einloggen</button>
            <button style={{ ...styles.button, background: "#999" }} onClick={handleCancelLogin}>Abbrechen</button>
          </div>

          <p style={{ fontSize: 12, color: "#666", marginTop: 8 }}>
            Wenn die E-Mail schon registriert ist, wird kein neuer Account angelegt.
          </p>
        </div>
      </div>
    );
  }

  // Default UI
  return (
    <div style={styles.container}>
	      <div style={{ position: "absolute", right: 20, top: 10 }}>
        {loggedIn ? (
          <>
            <span style={{ marginRight: 8 }}>{multiusername}</span>
            <button style={{ padding: "6px 10px", cursor: "pointer" }} onClick={handleLogout}>Logout</button>
          </>
        ) : null}
      </div>
	  
      <h2 onClick={handleTitleClick} style={{ cursor: "pointer" }}>Vokabeltrainer</h2>

      {/* TOP: Name + Singleplayer controls */}
      {!started && !isMultiplayerMode && (
        <div style={styles.box}>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Benutzername"
            style={styles.input}
          />

          <select
            value={selectedSet}
            onChange={(e) => setSelectedSet(e.target.value)}
            style={styles.input}
          >
            {Object.keys(SETS).map((key) => (
              <option key={key} value={key}>{key}</option>
            ))}
          </select>

          <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
            <button type="button" style={styles.buttonSmall} onClick={addGitHubVocab}>
              {setLoading ? "Lade..." : "Ausgewählte Vokabeln hinzufügen"}
            </button>

            <button type="button" style={styles.buttonSmall} onClick={async () => {
              const mixed = await mixSetsRandomly([selectedSet], 5);
              setVocabText(mixed.map(v => `${v.de},${v.en}`).join("\n"));
              // don't immediately start — user can choose to start or edit list
              setVocabList(mixed.slice(0,15).map(v => ({...v, answered:false, correct:false, userAnswer:""})));

              alert("Mix geladen (15 Vokabeln).");
            }}>
              Mix laden
            </button>
          </div>

          <textarea
            value={vocabText}
            onChange={(e) => setVocabText(e.target.value)}
            placeholder="Deutsch,Englisch  — eine pro Zeile"
            rows={6}
            style={styles.textarea}
          />

          <div style={{ marginTop: 10 }}>
            <button type="button" style={styles.button} onClick={() => startSession(vocabList.length ? vocabList : null)}>Start (Singleplayer)</button>
          </div>
        </div>
      )}

      {/* Homework UI */}
      {loggedIn && !started && (
        <div style={styles.lobbyBox}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ margin: 0 }}>📚 Hausaufgaben</h3>
            <button
              type="button"
              style={{ ...styles.buttonSmall, width: 130 }}
              onClick={() => setShowHomeworkPanel((v) => !v)}
            >
              {showHomeworkPanel ? "Schließen" : "Öffnen"}
            </button>
          </div>

          {showHomeworkPanel && (
            <>
              {canManageHomework && (
                <div style={{ ...styles.card, marginTop: 12, textAlign: "left" }}>
                  <h4>Neue Hausaufgabe erstellen</h4>

                  <input
                    type="text"
                    value={homeworkTitle}
                    onChange={(e) => setHomeworkTitle(e.target.value)}
                    placeholder="Titel, z. B. 3 Vokabeln lernen"
                    style={styles.input}
                  />

                  <textarea
                    value={homeworkInstructions}
                    onChange={(e) => setHomeworkInstructions(e.target.value)}
                    placeholder="Aufgabe / Anweisungen – frei anpassbar"
                    rows={3}
                    style={styles.textarea}
                  />

                  <select
                    value={homeworkType}
                    onChange={(e) => setHomeworkType(e.target.value)}
                    style={styles.input}
                  >
                    <option value="vocab">Vokabeln</option>
                    <option value="custom">Eigene Aufgabe / Textantwort</option>
                  </select>

                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={homeworkAmount}
                    onChange={(e) => setHomeworkAmount(e.target.value)}
                    placeholder="Anzahl"
                    style={styles.input}
                  />

                  {homeworkType === "vocab" && (
                    <textarea
                      value={homeworkVocabText}
                      onChange={(e) => setHomeworkVocabText(e.target.value)}
                      placeholder={"Eigene Vokabeln (eine pro Zeile):\nHaus,house\nBaum,tree\n..."}
                      rows={5}
                      style={styles.textarea}
                    />
                  )}

                  <input
                    type="datetime-local"
                    value={homeworkDueDate}
                    onChange={(e) => setHomeworkDueDate(e.target.value)}
                    style={styles.input}
                  />

                  <p style={styles.smallMuted}>
                    {isHost && lobbyId
                      ? `Wird für Lobby ${lobbyId} erstellt.`
                      : "Wird als allgemeine Hausaufgabe gespeichert."}
                  </p>

                  <button type="button" style={styles.button} onClick={createHomework}>
                    Hausaufgabe veröffentlichen
                  </button>
                </div>
              )}

              <div style={{ marginTop: 12, textAlign: "left" }}>
                {Object.entries(homeworks)
                  .filter(([, hw]) => hw?.active !== false)
                  .filter(([, hw]) => !hw?.targetLobbyId || hw.targetLobbyId === lobbyId)
                  .sort(([, a], [, b]) => (b.createdAt || 0) - (a.createdAt || 0))
                  .map(([id, hw]) => (
                    <div key={id} style={styles.card}>
                      <b>{hw.title}</b>
                      <div style={styles.smallMuted}>
                        {hw.type === "vocab"
                          ? `${hw.amount || 1} Vokabeln`
                          : "Eigene Aufgabe"}
                        {hw.dueDate
                          ? ` · Abgabe: ${new Date(hw.dueDate).toLocaleString()}`
                          : ""}
                      </div>

                      {hw.instructions && (
                        <p style={{ margin: "8px 0" }}>{hw.instructions}</p>
                      )}

                      <button
                        type="button"
                        style={styles.buttonSmall}
                        onClick={() => startHomework(id, false)}
                      >
                        Hausaufgabe starten
                      </button>

                      {isTestHomeworkUser && (
                        <button
                          type="button"
                          style={{ ...styles.buttonSmall, background: "#f39c12" }}
                          onClick={() => startHomeworkTest(id)}
                          title="Nur Vorschau/Test – wird nicht als erledigt gespeichert"
                        >
                          🧪 Testen (nicht gewertet)
                        </button>
                      )}
                    </div>
                  ))}

                {Object.keys(homeworks).length === 0 && (
                  <p style={styles.smallMuted}>
                    Noch keine Hausaufgaben vorhanden.
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Multiplayer Lobby UI */}
      {isMultiplayerMode && !started && (
        <div style={styles.lobbyBox}>
          <h3>Multiplayer Lobby</h3>

          {!lobbyId && (
            <>
              <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 8 }}>
                <button
                  type="button"
                  style={styles.buttonSmall}
                  onClick={async () => {
                    // create lobby: if teacher logged in, no prompt, else prompt inside createLobby
                    let list = [];
                    if (vocabList && vocabList.length > 0) list = vocabList.map(v => ({ de: v.de, en: v.en }));
                    else if (vocabText && vocabText.trim()) list = parseVocab(vocabText).slice(0, 15);
                    else list = await mixSetsRandomly([selectedSet], 15);
                    await createLobby(list);
                  }}
                >
                  Lobby erstellen (Lehrer)
                </button>

                <input
                  type="text"
                  placeholder="Lobby-ID eingeben"
                  style={{ ...styles.input, width: "200px" }}
                  value={joinLobbyId}
                  onChange={(e) => setJoinLobbyId(e.target.value.toUpperCase())}
                />

                <button
                  type="button"
                  style={styles.buttonSmall}
                  onClick={() => joinLobby(joinLobbyId)}
                >
                  Beitreten
                </button>
              </div>

              <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 8 }}>
                {!isTeacher ? (
                  <button style={{ ...styles.buttonSmall, background: "#2dbe60" }} onClick={() => {
                    const pw = prompt("Lehrer-Passwort eingeben:");
                    if (pw === TEACHER_PASSWORD) {
                      setIsTeacher(true);
                      alert("Lehrer eingeloggt.");
                    } else {
                      alert("Falsches Passwort.");
                    }
                  }}>Als Lehrer einloggen</button>
                ) : (
                  <div style={styles.smallMuted}>Lehrer eingeloggt ✅</div>
                )}

                <div style={styles.smallMuted}>Tipp: Lehrer braucht Passwort, um Lobby zu erstellen.</div>
              </div>

              <p style={{ fontSize: "12px", color: "#333" }}>
                Nur Lehrer kann Lobbys erstellen (Lehrer-Passwort erforderlich). Schüler können beitreten.
              </p>
            </>
          )}

          {lobbyId && lobbyData && (
            <>
              <p><b>Lobby:</b> {lobbyId}</p>
              <p><b>Status:</b> {lobbyData.state}</p>

              <h4>Spieler</h4>
              <div style={styles.playersList}>
                {lobbyData.players
                  ? Object.entries(lobbyData.players).map(([pid, p]) => (
                      <div key={pid} style={{ padding: 6, borderBottom: "1px solid #eee" }}>
                        {p.isHost ? "👑 " : ""}{p.name} — {p.score ?? 0} {p.plays === false ? "(Zuschauer)" : ""} {pid === playerId ? " (du)" : ""}
                      </div>
                    ))
                  : <div>Keine Spieler</div>}
              </div>

              {/* Lehrer-Controls */}
              {isHost && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ display: "flex", gap: 8, justifyContent: "space-between", alignItems: "center" }}>
                    <label>
                      <input type="checkbox" checked={hostPlays} onChange={(e) => toggleHostPlays(e.target.checked)} /> Host spielt mit
                    </label>

                    <label>
                      <input type="checkbox" checked={bonusRoundActive} onChange={(e) => setBonusRoundActive(e.target.checked)} /> Bonusrunde
                    </label>

                    <label title="Auto-Advance: Wenn alle Antworten oder Zeit abgelaufen, geht's automatisch weiter">
                      <input type="checkbox" checked={autoAdvance} onChange={(e) => setAutoAdvance(e.target.checked)} /> Auto-Advance
                    </label>
                  </div>

                  <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                    <button
                      type="button"
                      style={styles.button}
                      onClick={() => hostStartGame()}
                      disabled={!(hostPlays || Object.values(lobbyData.players || {}).filter(p => !p.isHost).length > 0)}
                    >
                      Spiel starten
                    </button>

                    <button type="button" style={{ ...styles.buttonSmall, background: "#999" }} onClick={() => leaveLobby()}>
                      Lobby verlassen
                    </button>

                    <button
                      type="button"
                      style={{ ...styles.buttonSmall, background: "#f39c12" }}
                      onClick={async () => {
                        // Manuelles Vorwärts (nur Host)
                        if (!lobbyId) return;
                        const snap = await get(ref(db, `lobbies/${lobbyId}`));
                        if (!snap.exists()) return;
                        const val = snap.val();
                        if (val.state !== "playing") return alert("Spiel ist nicht aktiv.");
                        const nextIndex = (val.currentIndex ?? 0) + 1;
                        const total = (val.vocabList || []).length;
                        if (nextIndex >= total) {
                          await update(ref(db, `lobbies/${lobbyId}`), { state: "finished", roundDeadline: 0 });
                        } else {
                          const newDeadline = Date.now() + 15000;
                          await update(ref(db, `lobbies/${lobbyId}`), { currentIndex: nextIndex, roundDeadline: newDeadline });
                          startRoundCountdown(newDeadline);
                        }
                      }}
                    >
                      Nächste Frage
                    </button>
                  </div>
                </div>
              )}

              {/* Nicht-Host: Leave */}
              {!isHost && (
                <div style={{ marginTop: 10 }}>
                  <button type="button" style={styles.buttonSmall} onClick={() => leaveLobby()}>Lobby verlassen</button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* In-game UI */}
      {started && currentCard && !done && (
        <AnimatePresence exitBeforeEnter>
          <motion.div
            key={currentCard.de + (isMultiplayerMode ? `_${lobbyId}_${lobbyData?.currentIndex}` : "")}
            style={styles.box}
            initial={{ y: -300, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 300, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <h4>{languageLabel}</h4>
            <h3>{showGermanFirst ? currentCard.de : currentCard.en}</h3>

            {activeHomeworkId && homeworks[activeHomeworkId]?.instructions && (
              <div style={{ ...styles.card, textAlign: "left", marginBottom: 10 }}>
                <b>Hausaufgabe:</b> {homeworks[activeHomeworkId].title}
                <br />
                {homeworks[activeHomeworkId].instructions}
                {homeworkTestMode && (
                  <div style={{ marginTop: 6, fontWeight: "bold" }}>
                    🧪 Testmodus – wird nicht als erledigt gespeichert
                  </div>
                )}
              </div>
            )}

            {isMultiplayerMode && (
              <div style={{ marginBottom: 8 }}>
                <b>Runde:</b> {(lobbyData?.currentIndex ?? 0) + 1} / {(lobbyData?.vocabList?.length ?? vocabList.length)}
                <br />
                <b>Zeit:</b> {timeLeft}s
              </div>
            )}

            <input
              type="text"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  if (activeHomeworkId && homeworks[activeHomeworkId]?.type === "custom") {
                    completeTextHomework();
                  } else if (isMultiplayerMode) {
                    submitAnswerToLobby(answer);
                  } else {
                    checkAnswer();
                  }
                  setAnswer("");
                }
              }}
              style={styles.input}
            />

            <div>
              <button
                type="button"
                onClick={() => {
                  if (activeHomeworkId && homeworks[activeHomeworkId]?.type === "custom") {
                    completeTextHomework();
                  } else if (isMultiplayerMode) {
                    submitAnswerToLobby(answer);
                    setAnswer("");
                  } else {
                    checkAnswer();
                  }
                }}
                style={styles.button}
              >
                OK
              </button>
            </div>

            <p>{feedback}</p>

            <motion.p
              style={{ fontSize: "20px", fontWeight: "bold" }}
              key={`live_score_${displayScore}`}
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              Punkte: {displayScore}
            </motion.p>

            {isMultiplayerMode && lobbyData && (
              <div style={{ textAlign: "left", marginTop: 10 }}>
                <b>Spieler-Status:</b>
                <div style={{ maxHeight: 120, overflowY: "auto" }}>
                  {Object.entries(playersLocal).map(([pid, p]) => (
                    <div key={pid} style={{ padding: 6 }}>
                      {p.isHost ? "👑 " : ""}{p.name} — {p.score ?? 0} — { (p.answeredIndex ?? -1) >= (lobbyData.currentIndex ?? 0) ? "✅ beantwortet" : "⏳ wartet" } {pid === playerId ? "(du)" : ""}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Results / Leaderboard for singleplayer */}
      {(!isMultiplayerMode && done) && (
        <div style={styles.box}>
          <h3>Ergebnisse</h3>

          {activeHomeworkId && homeworkTestMode && (
            <p style={{ fontWeight: "bold" }}>
              🧪 Testmodus: Diese Hausaufgabe wurde nur simuliert und nicht als erledigt gespeichert.
            </p>
          )}

          <AnimatePresence>
            {showEmoji && (
              <motion.div
                initial={{ scale: 3, opacity: 0 }}
                animate={ emojiAnimating ? { scale: [0.6, 1.15, 1], opacity: 1 } : { scale: 1, opacity: 1 } }
                exit={{ opacity: 0 }}
                transition={{ duration: emojiAnimating ? 1.0 : 0.4, times: [0, 0.6, 1] }}
                style={{ fontSize: "80px", textAlign: "center", margin: "10px auto" }}
              >
                {getEmoji()}

                {/* Final score — will be animated via displayScore state after smiley animation */}
                <motion.p
                  style={{ fontSize: "32px", fontWeight: "bold", marginTop: "10px" }}
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.6, delay: emojiAnimating ? 0.8 : 0 }}
                >
                  Punkte: {displayScore}
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>

          <div id="flashcards" style={styles.flashcards}>
            {vocabList.map((v, i) => (
              <div key={i} style={styles.card}>
                <b>DE:</b> {v.de}<br />
                <b>EN:</b> {v.en}<br />
                <b>Antwort:</b> {v.userAnswer ?? ""} {v.correct ? "✅" : "❌"}
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 8 }}>
            <button type="button" onClick={exportPDF} style={styles.buttonSmall}>PDF</button>
            <button type="button" onClick={() => { reset(); }} style={styles.buttonSmall}>Neue Runde</button>
          </div>

          {/* Benutzername-Motivation (shows after smiley too; we show it always here but user sees it after smiley + countup) */}
          {username && (
            <p style={{ marginTop: "10px", fontWeight: "bold", fontSize: "16px" }}>
              Gut gemacht, {username}!
            </p>
          )}
        </div>
      )}

      {/* Bottom bar: open multiplayer */}
      <div style={styles.bottomBar}>
        <button
          type="button"
          //onClick={() => {
            //setIsMultiplayerMode(true);
          //}}
		  onClick={openMultiplayer}
          style={{ ...styles.buttonSmall, width: 200 }}
        >
          Multiplayer
        </button>

        <button
          type="button"
          onClick={() => {
            // quick switch: back to singleplayer menu
            setIsMultiplayerMode(false);
            setLobbyId("");
            setLobbyData(null);
          }}
          style={{ ...styles.buttonSmall, width: 120, background: "#999" }}
        >
          Menü
        </button>
      </div>
    </div>
  );
}
