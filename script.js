const MAX_ROUNDS = 10;

const images = [
  {
    file: "images/afbeelding 1.jpg",
    zones: {
      a: { left: 3, top: 1, width: 45, height: 48 },
      c: { left: 50, top: 1, width: 45, height: 48 },
      b: { left: 3, top: 51, width: 45, height: 47 },
      d: { left: 50, top: 51, width: 45, height: 47 }
    }
  },
  {
    file: "images/afbeelding 2.jpg",
    zones: {
      a: { left: 2, top: 2, width: 46, height: 45 },
      c: { left: 51, top: 2, width: 46, height: 45 },
      b: { left: 2, top: 50, width: 46, height: 45 },
      d: { left: 51, top: 50, width: 46, height: 45 }
    }
  },
  {
    file: "images/afbeelding 3.jpg",
    zones: {
      a: { left: 2, top: 2, width: 46, height: 45 },
      c: { left: 51, top: 2, width: 46, height: 45 },
      b: { left: 2, top: 50, width: 46, height: 45 },
      d: { left: 51, top: 50, width: 46, height: 45 }
    }
  },
  {
    file: "images/afbeelding 4.jpg",
    zones: {
      a: { left: 2, top: 2, width: 46, height: 45 },
      c: { left: 51, top: 2, width: 46, height: 45 },
      b: { left: 2, top: 50, width: 46, height: 45 },
      d: { left: 51, top: 50, width: 46, height: 45 }
    }
  }
];

const audioFiles = [
  "audio/a.mp3",
  "audio/b.mp3",
  "audio/c.mp3",
  "audio/d.mp3",
  "audio/a en d.mp3",
  "audio/c en b.mp3"
];

const gameImage = document.getElementById("gameImage");
const imageWrapper = document.getElementById("imageWrapper");
const gameAudio = document.getElementById("gameAudio");

const playAudioBtn = document.getElementById("playAudioBtn");
const checkBtn = document.getElementById("checkBtn");
const clearBtn = document.getElementById("clearBtn");
const newRoundBtn = document.getElementById("newRoundBtn");
const restartBtn = document.getElementById("restartBtn");

const messageEl = document.getElementById("message");
const selectedAnswersEl = document.getElementById("selectedAnswers");
const answerCountInfoEl = document.getElementById("answerCountInfo");
const scoreEl = document.getElementById("score");
const roundEl = document.getElementById("round");
const maxRoundsEl = document.getElementById("maxRounds");
const endScreen = document.getElementById("endScreen");
const finalScoreEl = document.getElementById("finalScore");

const successSound = document.getElementById("successSound");
const errorSound = document.getElementById("errorSound");

let currentImage = null;
let currentAudio = null;
let correctAnswers = [];
let selectedAnswers = new Set();
let score = 0;
let round = 0;
let roundLocked = false;

maxRoundsEl.textContent = MAX_ROUNDS;

function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function extractAnswersFromAudioPath(path) {
  const fileName = path.split("/").pop().replace(".mp3", "").trim().toLowerCase();
  return fileName.split(" en ").map(item => item.trim()).sort();
}

function arraysEqualAsSets(arr1, arr2) {
  if (arr1.length !== arr2.length) return false;
  return [...arr1].sort().join(",") === [...arr2].sort().join(",");
}

function clearHotspots() {
  const existingHotspots = imageWrapper.querySelectorAll(".hotspot");
  existingHotspots.forEach(h => h.remove());
}

function updateSelectedAnswersText() {
  if (selectedAnswers.size === 0) {
    selectedAnswersEl.textContent = "geen";
    return;
  }
  selectedAnswersEl.textContent = [...selectedAnswers].sort().join(" en ");
}

function setMessage(text, type = "") {
  messageEl.textContent = text;
  messageEl.className = "message";
  if (type) {
    messageEl.classList.add(type);
  }
}

function createHotspots() {
  clearHotspots();

  Object.entries(currentImage.zones).forEach(([label, zone]) => {
    const hotspot = document.createElement("button");
    hotspot.className = "hotspot";
    hotspot.dataset.label = label;
    hotspot.type = "button";
    hotspot.setAttribute("aria-label", `Kies ${label}`);

    hotspot.style.left = `${zone.left}%`;
    hotspot.style.top = `${zone.top}%`;
    hotspot.style.width = `${zone.width}%`;
    hotspot.style.height = `${zone.height}%`;

    hotspot.addEventListener("click", () => toggleAnswer(label, hotspot));
    imageWrapper.appendChild(hotspot);
  });
}

function toggleAnswer(label, hotspotEl) {
  if (roundLocked) return;

  setMessage("");

  if (selectedAnswers.has(label)) {
    selectedAnswers.delete(label);
    hotspotEl.classList.remove("selected");
  } else {
    selectedAnswers.add(label);
    hotspotEl.classList.add("selected");
  }

  updateSelectedAnswersText();
}

function resetVisualState() {
  const hotspots = imageWrapper.querySelectorAll(".hotspot");
  hotspots.forEach(h => {
    h.classList.remove("selected", "correct", "wrong");
  });
}

function clearSelection() {
  if (roundLocked) return;
  selectedAnswers = new Set();
  resetVisualState();
  updateSelectedAnswersText();
  setMessage("");
}

function markAnswers(isCorrect) {
  const hotspots = imageWrapper.querySelectorAll(".hotspot");

  hotspots.forEach(h => {
    const label = h.dataset.label;
    const isSelected = selectedAnswers.has(label);
    const isActuallyCorrect = correctAnswers.includes(label);

    h.classList.remove("selected");

    if (isActuallyCorrect) {
      h.classList.add("correct");
    }

    if (isSelected && !isActuallyCorrect) {
      h.classList.add("wrong");
    }
  });

  if (isCorrect) {
    setMessage("Goed gedaan! Volgende ronde...", "success");
  } else {
    setMessage(`Niet juist. Correct antwoord: ${correctAnswers.join(" en ")}`, "error");
  }
}

function playSound(audioElement) {
  if (!audioElement) return;
  audioElement.currentTime = 0;
  audioElement.play().catch(() => {});
}

function playCurrentAudio() {
  if (!currentAudio) return;
  gameAudio.currentTime = 0;
  gameAudio.play().catch(() => {
    setMessage("Het audiofragment kon niet starten. Klik nog eens op de knop.", "error");
  });
}

function updateAnswerCountInfo() {
  if (correctAnswers.length === 1) {
    answerCountInfoEl.textContent = "Deze ronde moet je 1 antwoord kiezen.";
  } else {
    answerCountInfoEl.textContent = "Deze ronde moet je 2 antwoorden kiezen.";
  }
}

function lockRound() {
  roundLocked = true;
}

function unlockRound() {
  roundLocked = false;
}

function endGame() {
  finalScoreEl.textContent = score;
  endScreen.classList.remove("hidden");
}

function startNewRound() {
  if (round >= MAX_ROUNDS) {
    endGame();
    return;
  }

  unlockRound();
  selectedAnswers = new Set();
  updateSelectedAnswersText();
  resetVisualState();
  setMessage("");

  currentImage = getRandomItem(images);
  currentAudio = getRandomItem(audioFiles);
  correctAnswers = extractAnswersFromAudioPath(currentAudio);

  gameImage.src = currentImage.file;
  gameAudio.src = currentAudio;

  createHotspots();
  updateAnswerCountInfo();

  round += 1;
  roundEl.textContent = round;
}

function checkAnswer() {
  if (roundLocked) return;

  if (selectedAnswers.size === 0) {
    setMessage("Klik eerst minstens één antwoord aan.", "error");
    return;
  }

  if (selectedAnswers.size !== correctAnswers.length) {
    setMessage(`Je moet precies ${correctAnswers.length} antwoord(en) kiezen.`, "error");
    return;
  }

  const userAnswers = [...selectedAnswers].sort();
  const isCorrect = arraysEqualAsSets(userAnswers, correctAnswers);

  lockRound();
  markAnswers(isCorrect);

  if (isCorrect) {
    score += 1;
    scoreEl.textContent = score;
    playSound(successSound);

    setTimeout(() => {
      if (round >= MAX_ROUNDS) {
        endGame();
      } else {
        startNewRound();
      }
    }, 1400);
  } else {
    playSound(errorSound);

    setTimeout(() => {
      unlockRound();
    }, 700);
  }
}

function restartGame() {
  score = 0;
  round = 0;
  selectedAnswers = new Set();
  correctAnswers = [];
  currentImage = null;
  currentAudio = null;
  roundLocked = false;

  scoreEl.textContent = score;
  roundEl.textContent = round;
  finalScoreEl.textContent = score;
  endScreen.classList.add("hidden");

  startNewRound();
}

playAudioBtn.addEventListener("click", playCurrentAudio);
checkBtn.addEventListener("click", checkAnswer);
clearBtn.addEventListener("click", clearSelection);
newRoundBtn.addEventListener("click", startNewRound);
restartBtn.addEventListener("click", restartGame);

restartGame();
