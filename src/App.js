import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// ----------------------
// Lernsets
// ----------------------
const SETS = {
  "Unit 2": "https://raw.githubusercontent.com/Maksimuiu/voka/main/Unit2",
  "2b": "https://raw.githubusercontent.com/Maksimuiu/voka/main/2b",
  "Random": "random"
};

export default function App() {
  const [username, setUsername] = useState("");
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
  const [showEmoji, setShowEmoji] = useState(false);
  const [languageLabel, setLanguageLabel] = useState("");
  const [titleClicks, setTitleClicks] = useState(0);
  const [pendingBonusPoints, setPendingBonusPoints] = useState(0);

  // ----------------------
  // Vokabelparser
  // ----------------------
  const parseVocab = (text) =>
    text
      .split("\n")
      .map((line) => {
        const [de, en] = line.split(",");
        return { de: de?.trim(), en: en?.trim() };
      })
      .filter((v) => v.de && v.en);

  // Case-sensitive normalize (Groß-/Kleinschreibung bleibt erhalten)
  const normalize = (str) =>
    str?.trim().replace(/[.!?]/g, "").replace(/\s+/g, " ");

  const getValidAnswers = (word) =>
    word.split("/").map((w) => normalize(w));

  // ----------------------
  // GitHub Vokabeln laden
  // ----------------------
  const loadVocabFromGitHub = async () => {
    try {
      const url = SETS[selectedSet];
      if (url === "random") return;
      const res = await fetch(url);
      const text = await res.text();
      const imported = parseVocab(text);
      setVocabText(imported.map((v) => `${v.de},${v.en}`).join("\n"));
    } catch (err) {
      console.error("Fehler beim Laden von GitHub:", err);
    }
  };

  // ----------------------
  // Intervall für automatische Aktualisierung
  // ----------------------
  useEffect(() => {
    if (selectedSet === "random") return;

    loadVocabFromGitHub(); // einmal sofort laden
    const interval = setInterval(() => loadVocabFromGitHub(), 1000);

    return () => clearInterval(interval);
  }, [selectedSet]);

  // ----------------------
  // GitHub Vokabel hinzufügen
  // ----------------------
  const addGitHubVocab = async () => {
    try {
      const url = SETS[selectedSet];
      if (url === "random") {
        const randomWords = await mixSetsRandomly(["random"], 20);
        setVocabText(randomWords.map((v) => `${v.de},${v.en}`).join("\n"));
        return;
      }
      const res = await fetch(url);
      const text = await res.text();
      const imported = parseVocab(text);
      const userVocab = parseVocab(vocabText);
      const combined = [...userVocab, ...imported].slice(0, 15);
      setVocabText(combined.map((v) => `${v.de},${v.en}`).join("\n"));
    } catch {
      alert("Fehler beim Import!");
    }
  };

  // ----------------------
  // Mix aus Sets
  // ----------------------
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

  // ----------------------
  // Session starten
  // ----------------------
  const startSession = (list) => {
    setVocabList(list);
    setScore(0);
    setDisplayScore(0);
    setDone(false);
    setStarted(true);
    setShowEmoji(false);
    nextCard(list);
  };

  const nextCard = (list = vocabList) => {
    const remaining = list.filter((v) => !v.answered);
    if (remaining.length === 0) {
      setDone(true);
      setCurrentCard(null);
      setShowEmoji(true);
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

  // ----------------------
  // Antwort prüfen (case-sensitive)
  // ----------------------
  const checkAnswer = () => {
    if (!currentCard) return;
    const correctWord = showGermanFirst ? currentCard.en : currentCard.de;
    const validAnswers = getValidAnswers(correctWord);
    const userNorm = normalize(answer);
    const isCorrect = validAnswers.includes(userNorm);

    setFeedback(isCorrect ? "✅ richtig!" : `❌ richtig: ${correctWord}`);

    let addedScore = isCorrect ? 1 : 0;
    if (pendingBonusPoints > 0) {
      addedScore += pendingBonusPoints;
      setPendingBonusPoints(0);
    }
    if (addedScore > 0) setScore((prev) => prev + addedScore);

    const updated = vocabList.map((v) =>
      v.de === currentCard.de
        ? { ...v, answered: true, correct: isCorrect, userAnswer: answer }
        : v
    );
    setVocabList(updated);
    setTimeout(() => nextCard(updated), 900);
  };

  // ----------------------
  // Punkte hochzählen animieren
  // ----------------------
  useEffect(() => {
    if (displayScore < score) {
      const timer = setTimeout(() => setDisplayScore((prev) => prev + 1), 300);
      return () => clearTimeout(timer);
    }
  }, [displayScore, score]);

  // ----------------------
  // Easter Egg
  // ----------------------
  const handleTitleClick = () => {
    const newClicks = titleClicks + 1;
    setTitleClicks(newClicks);
    if (newClicks === 12) setPendingBonusPoints(10);
    else if (newClicks > 12) setPendingBonusPoints((prev) => prev + 1);
  };

  const getEmoji = () => (score < 5 ? "😢" : score < 10 ? "😐" : "😄");

  // ----------------------
  // PDF Export
  // ----------------------
  const exportPDF = async () => {
    const element = document.getElementById("flashcards");
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
  };

  // ----------------------
  // UI
  // ----------------------
  return (
    <div style={styles.container}>
      <h2 onClick={handleTitleClick} style={{ cursor: "pointer" }}>Vokabeltrainer</h2>

      {!started && (
        <div style={styles.box}>
          <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Benutzername" style={styles.input} />

          <select value={selectedSet} onChange={(e) => setSelectedSet(e.target.value)} style={styles.input}>
            {Object.keys(SETS).map((key) => (
              <option key={key} value={key}>{key}</option>
            ))}
          </select>

          <button onClick={addGitHubVocab} style={styles.buttonSmall}>Ausgewählte Vokabeln hinzufügen</button>

          <button
            onClick={async () => {
              const mixed = await mixSetsRandomly([selectedSet], 5);
              setVocabText(mixed.map((v) => `${v.de},${v.en}`).join("\n"));
              startSession(mixed.slice(0, 15));
            }}
            style={styles.buttonSmall}
          >
            Mix aus Sets
          </button>

          <textarea value={vocabText} rows={8} onChange={(e) => setVocabText(e.target.value)} placeholder="Deutsch,Englisch" style={styles.textarea} />

          <button onClick={() => startSession(parseVocab(vocabText).slice(0, 15))} style={styles.button}>Start</button>
        </div>
      )}

      {started && currentCard && !done && (
        <AnimatePresence exitBeforeEnter>
          <motion.div
            key={currentCard.de}
            style={styles.box}
            initial={{ y: -300, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 300, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <h4>{languageLabel}</h4>
            <h3>{showGermanFirst ? currentCard.de : currentCard.en}</h3>

            <input
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && checkAnswer()}
              style={styles.input}
            />

            <button onClick={checkAnswer} style={styles.button}>OK</button>

            <p>{feedback}</p>

            <motion.p
              style={{ fontSize: "20px", fontWeight: "bold" }}
              key={displayScore}
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              Punkte: {displayScore}
            </motion.p>
          </motion.div>
        </AnimatePresence>
      )}

      {done && (
        <div style={styles.box}>
          <AnimatePresence>
            {showEmoji && (
              <motion.div
                initial={{ scale: 5, opacity: 1 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1 }}
                style={{ fontSize: "80px", textAlign: "center", margin: "10px auto" }}
              >
                {getEmoji()}

                <motion.p
                  style={{ fontSize: "32px", fontWeight: "bold", marginTop: "10px" }}
                  initial={{ y: -50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 1 }}
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
                <b>Antwort:</b> {v.userAnswer} {v.correct ? "✅" : "❌"}
              </div>
            ))}
          </div>

          <button onClick={exportPDF} style={styles.buttonSmall}>PDF</button>
          <button onClick={reset} style={styles.buttonSmall}>Neue Runde</button>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { fontFamily: "Arial", textAlign: "center", marginTop: 20 },
  box: { width: "300px", padding: "15px", margin: "auto", borderRadius: "10px", background: "#f2f2f2", boxShadow: "0 3px 10px rgba(0,0,0,0.2)" },
  input: { width: "260px", padding: "10px", marginBottom: "10px", borderRadius: "5px", border: "1px solid #aaa", fontSize: "14px" },
  textarea: { width: "260px", padding: "10px", borderRadius: "5px", border: "1px solid #aaa", fontSize: "14px", marginBottom: "10px", resize: "none" },
  button: { width: "260px", padding: "10px", marginTop: "5px", borderRadius: "5px", border: "none", background: "#4a6eff", color: "white", cursor: "pointer" },
  buttonSmall: { width: "120px", padding: "8px", margin: "5px", borderRadius: "5px", border: "none", background: "#4a6eff", color: "white", cursor: "pointer" },
  flashcards: { maxHeight: "220px", overflowY: "auto", marginBottom: "10px" },
  card: { padding: "8px", marginBottom: "6px", background: "white", borderRadius: "5px", boxShadow: "0 1px 4px rgba(0,0,0,0.15)" }
};
