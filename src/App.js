import React, { useState } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function App() {
  const [username, setUsername] = useState("");
  const [vocabText, setVocabText] = useState("");
  const [vocabList, setVocabList] = useState([]);
  const [currentCard, setCurrentCard] = useState(null);
  const [answer, setAnswer] = useState("");
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [done, setDone] = useState(false);
  const [started, setStarted] = useState(false);
  const [showGermanFirst, setShowGermanFirst] = useState(true);

  const RAW_URL = "https://raw.githubusercontent.com/Maksimuiu/voka/refs/heads/main/vokables";

  const addGitHubVocab = async () => {
    try {
      const res = await fetch(RAW_URL);
      const text = await res.text();
      const imported = text
        .split("\n")
        .map(line => {
          const [first, second] = line.split(",");
          return { de: first?.trim(), en: second?.trim() };
        })
        .filter(v => v.de && v.en);

      const userVocab = vocabText
        .split("\n")
        .map(line => {
          const [first, second] = line.split(",");
          return { de: first?.trim(), en: second?.trim() };
        })
        .filter(v => v.de && v.en);

      const combined = [...userVocab, ...imported].slice(0, 15);
      setVocabText(combined.map(v => `${v.de},${v.en}`).join("\n"));
    } catch (err) {
      alert("Fehler beim Laden der Vokabeln!");
      console.error(err);
    }
  };

  const startSession = () => {
    const list = vocabText
      .split("\n")
      .map(line => {
        const [de, en] = line.split(",");
        return { de: de?.trim(), en: en?.trim() };
      })
      .filter(v => v.de && v.en)
      .slice(0, 15);
    setVocabList(list);
    setScore(0);
    setDone(false);
    setStarted(true);
    nextCard(list);
  };

  const nextCard = (list = vocabList) => {
    const remaining = list.filter(v => !v.answered);
    if (remaining.length === 0) {
      setDone(true);
      setCurrentCard(null);
      return;
    }
    const random = remaining[Math.floor(Math.random() * remaining.length)];
    setCurrentCard(random);
    setAnswer("");
    setFeedback("");
    setShowGermanFirst(Math.random() >= 0.5);
  };

  const checkAnswer = () => {
    if (!currentCard) return;
    const correctAnswer = showGermanFirst ? currentCard.en : currentCard.de;
    const correct = correctAnswer.toLowerCase() === answer.toLowerCase();
    setFeedback(correct ? "✅ richtig!" : `❌ richtig: ${correctAnswer}`);
    if (correct) setScore(prev => prev + 1);

    const updatedList = vocabList.map(v =>
      v.de === currentCard.de ? { ...v, answered: true, userAnswer: answer, correct } : v
    );
    setVocabList(updatedList);

    setTimeout(() => nextCard(updatedList), 1000);
  };

  const getEmoji = () => (score < 5 ? "😢" : score < 10 ? "😐" : "😄");

  const exportPDF = async () => {
    const element = document.getElementById("flashcards");
    const canvas = await html2canvas(element);
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF();
    pdf.addImage(imgData, "PNG", 10, 10, 180, 160);
    pdf.save("flashcards.pdf");
  };

  return (
    <div style={styles.container}>
      {!started && (
        <div style={styles.box}>
          <h2>Vokabeltrainer starten</h2>
          <input
            placeholder="Benutzername"
            value={username}
            onChange={e => setUsername(e.target.value)}
            style={styles.input}
          /><br />
          <textarea
            placeholder="Vokabeln eintragen (DE,EN je Zeile)"
            value={vocabText}
            onChange={e => setVocabText(e.target.value)}
            rows={10}
            style={styles.textarea}
          /><br />
          <button onClick={addGitHubVocab} style={styles.button}>
            Neueste Vokabeln hinzufügen
          </button>
          <button onClick={startSession} style={{...styles.button, marginLeft: 10}}>
            Start
          </button>
        </div>
      )}

      {started && currentCard && (
        <div style={styles.box}>
          <h3>{showGermanFirst ? "DE:" : "EN:"} {showGermanFirst ? currentCard.de : currentCard.en}</h3>
          <input
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            onKeyDown={e => e.key === "Enter" && checkAnswer()}
            style={styles.input}
          />
          <button onClick={checkAnswer} style={styles.button}>Überprüfen</button>
          <div style={{marginTop:10}}>{feedback}</div>
          <div style={{marginTop:5}}>Punktzahl: {score} / {vocabList.length}</div>
        </div>
      )}

      {done && (
        <div style={styles.box}>
          <h2>Fertig! {username}</h2>
          <h3>Punkte: {score} / {vocabList.length} {getEmoji()}</h3>
          <div id="flashcards" style={{marginTop:10}}>
            {vocabList.map((v, idx) => (
              <div key={idx} style={styles.card}>
                <b>DE:</b> {v.de} <br />
                <b>EN:</b> {v.en} <br />
                <b>Deine Antwort:</b> {v.userAnswer} ({v.correct ? "✅" : "❌"})
              </div>
            ))}
          </div>
          <button onClick={exportPDF} style={styles.button}>Als PDF exportieren</button>
          <button onClick={() => setStarted(false)} style={{...styles.button, marginLeft: 10}}>Neue Runde starten</button>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    fontFamily: "Arial, sans-serif",
    textAlign: "center",
    margin: "20px"
  },
  box: {
    display: "inline-block",
    padding: "20px",
    borderRadius: "10px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    backgroundColor: "#f9f9f9"
  },
  input: {
    width: "250px",
    padding: "10px",
    borderRadius: "5px",
    border: "1px solid #ccc",
    marginBottom: "10px"
  },
  textarea: {
    width: "250px",
    padding: "10px",
    borderRadius: "5px",
    border: "1px solid #ccc",
    marginBottom: "10px"
  },
  button: {
    padding: "10px 20px",
    borderRadius: "5px",
    border: "none",
    backgroundColor: "#4f46e5",
    color: "white",
    cursor: "pointer",
    marginTop: "10px"
  },
  card: {
    border: "1px solid #ccc",
    borderRadius: "8px",
    padding: "10px",
    marginBottom: "5px",
    backgroundColor: "white",
    boxShadow: "0 2px 6px rgba(0,0,0,0.1)"
  }
};
