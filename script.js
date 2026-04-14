const MAX_ROUNDS = 10;

const images = [
  { file: "images/afbeelding 1.jpg" },
  { file: "images/afbeelding 2.jpg" },
  { file: "images/afbeelding 3.jpg" },
  { file: "images/afbeelding 4.jpg" }
];

const audioFiles = [
  "audio/a.mp3",
  "audio/b.mp3",
  "audio/c.mp3",
  "audio/d.mp3",
  "audio/a en d.mp3",
  "audio/b en c.mp3"
];

const categoryOptions = [
  { key: "a", label: "Eerste term" },
  { key: "b", label: "Tweede term" },
  { key: "c", label: "Derde term" },
  { key: "d", label: "Vierde term" },
  { key: "a,d", label: "Uiterste termen" },
  { key: "b,c", label: "Middelste termen" }
];

const categoryLabels = {
  a: "eerste term",
  b: "tweede term",
  c: "derde term",
  d: "vierde term",
  "a,d": "uiterste termen",
  "b,c": "middelste termen"
};

const gameImage = document.getElementById("gameImage");
const imageWrapper = document.getElementById("imageWrapper");
const gameAudio = document.getElementById("gameAudio");

const playAudioBtn = document.getElementById("playAudioBtn");
const checkBtn = document.getElementById("checkBtn");
const clearBtn = document.getElementById("clearBtn");
const newRoundBtn = document.getElementById("newRoundBtn");
const restartBtn = document.getElementById("restartBtn");

const termGrid = document.getElementById("termGrid");

const messageEl = document.getElementById("message");
const selectedAnswersEl = document.getElementById("selectedAnswers");
const selectedCategoryEl = document.getElementById("selectedCategory");
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
let selectedCategory = null;
let requiredCategory = null;
let score = 0;
let round = 0;
let roundLocked = false;

/* nieuw: audio-volgorde per spel */
let shuffledAudioQueue = [];
let currentAudioIndex = 0;

maxRoundsEl.textContent = MAX_ROUNDS;

function shuffleArray(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function extractAnswersFromAudioPath(path) {
  const fileName = path.split("/").pop().replace(".mp3", "").trim().toLowerCase();
  return fileName.split(" en ").map(item => item.trim()).sort();
}

function getRequiredCategory(answers) {
  const joined = [...answers].sort().join(",");

  if (joined === "a") return "a";
  if (joined === "b") return "b";
  if (joined === "c") return "c";
  if (joined === "d") return "d";
  if (joined === "a,d") return "a,d";
  if (joined === "b,c") return "b,c";

  return null;
}

function arraysEqualAsSets(arr1, arr2) {
  if (arr1.length !== arr2.length) return false;
  return [...arr1].sort().join(",") === [...arr2].sort().join(",");
}

function clearHotspots() {
  imageWrapper.querySelectorAll(".hotspot").forEach(el => el.remove());
}

function updateSelectedAnswersText() {
  if (selectedAnswers.size === 0) {
    selectedAnswersEl.textContent = "geen";
    return;
  }

  selectedAnswersEl.textContent = [...selectedAnswers].sort().join(" en ");
}

function updateSelectedCategoryText() {
  if (!selectedCategory) {
    selectedCategoryEl.textContent = "geen";
    return;
  }

  selectedCategoryEl.textContent = categoryLabels[selectedCategory] || "geen";
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

  const zones = [
    { label: "a", left: 10, top: 10, width: 33, height: 36 },
    { label: "c", left: 57, top: 10, width: 33, height: 36 },
    { label: "b", left: 10, top: 54, width: 33, height: 34 },
    { label: "d", left: 57, top: 54, width: 33, height: 34 }
  ];

  zones.forEach(zone => {
    const hotspot = document.createElement("button");
    hotspot.type = "button";
    hotspot.className = "hotspot";
    hotspot.dataset.label = zone.label;
    hotspot.setAttribute("aria-label", `Kies ${zone.label}`);

    hotspot.style.left = `${zone.left}%`;
    hotspot.style.top = `${zone.top}%`;
    hotspot.style.width = `${zone.width}%`;
    hotspot.style.height = `${zone.height}%`;

    hotspot.addEventListener("click", () => toggleAnswer(zone.label, hotspot));
    imageWrapper.appendChild(hotspot);
  });
}

function renderCategoryButtons() {
  termGrid.innerHTML = "";

  categoryOptions.forEach(option => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "category-btn";
    button.dataset.key = option.key;
    button.textContent = option.label;

    if (selectedCategory === option.key) {
      button.classList.add("active");
    }

    button.addEventListener("click", () => selectCategory(option.key));
    termGrid.appendChild(button);
  });
}

function refreshCategoryButtonState() {
  termGrid.querySelectorAll(".category-btn").forEach(button => {
    button.classList.toggle("active", button.dataset.key === selectedCategory);
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
  imageWrapper.querySelectorAll(".hotspot").forEach(h => {
    h.classList.remove("selected", "correct", "wrong");
  });
}

function clearCategorySelection() {
  selectedCategory = null;
  updateSelectedCategoryText();
  refreshCategoryButtonState();
}

function selectCategory(category) {
  if (roundLocked) return;

  selectedCategory = category;
  updateSelectedCategoryText();
  refreshCategoryButtonState();
  setMessage("");
}

function clearSelection() {
  if (roundLocked) return;

  selectedAnswers = new Set();
  resetVisualState();
  updateSelectedAnswersText();
  clearCategorySelection();
  setMessage("");
}

function markAnswers(isCorrect, isCategoryCorrect) {
  imageWrapper.querySelectorAll(".hotspot").forEach(h => {
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

  refreshCategoryButtonState();

  const neededText = categoryLabels[requiredCategory] || "juiste knop";

  if (isCorrect && isCategoryCorrect) {
    setMessage("Goed gedaan! Volgende ronde...", "success");
    return;
  }

  if (!isCorrect && !isCategoryCorrect) {
    setMessage(`Niet juist. Correct antwoord: ${correctAnswers.join(" en ")} + ${neededText}`, "error");
    return;
  }

  if (!isCorrect) {
    setMessage(`Niet juist. Correct antwoord: ${correctAnswers.join(" en ")}`, "error");
    return;
  }

  if (!isCategoryCorrect) {
    setMessage(`De vakken zijn goed, maar kies ook: ${neededText}.`, "error");
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

function updateInstructionText() {
  answerCountInfoEl.textContent = "Luister goed en kies het juiste antwoord.";
}

/* nieuw: maak een nieuwe audio-volgorde voor elk spel */
function buildNewAudioQueue() {
  shuffledAudioQueue = shuffleArray(audioFiles);
  currentAudioIndex = 0;
}

/* nieuw: neem volgende audio uit de geschudde reeks */
function getNextAudio() {
  if (currentAudioIndex >= shuffledAudioQueue.length) {
    shuffledAudioQueue = shuffleArray(audioFiles);
    currentAudioIndex = 0;
  }

  const nextAudio = shuffledAudioQueue[currentAudioIndex];
  currentAudioIndex += 1;
  return nextAudio;
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
  correctAnswers = [];
  requiredCategory = null;
  selectedCategory = null;

  updateSelectedAnswersText();
  updateSelectedCategoryText();
  resetVisualState();
  setMessage("");

  currentImage = getRandomItem(images);

  /* aangepast: niet meer random per beurt, maar uit de geschudde audio-volgorde */
  currentAudio = getNextAudio();

  correctAnswers = extractAnswersFromAudioPath(currentAudio);
  requiredCategory = getRequiredCategory(correctAnswers);

  gameImage.src = currentImage.file;
  gameAudio.src = currentAudio;

  createHotspots();
  renderCategoryButtons();
  updateInstructionText();

  round += 1;
  roundEl.textContent = round;
}

function checkAnswer() {
  if (roundLocked) return;

  if (selectedAnswers.size === 0) {
    setMessage("Klik eerst minstens één vak aan.", "error");
    return;
  }

  if (!selectedCategory) {
    setMessage("Kies ook de juiste termknop.", "error");
    return;
  }

  const userAnswers = [...selectedAnswers].sort();
  const isCorrect = arraysEqualAsSets(userAnswers, correctAnswers);
  const isCategoryCorrect = selectedCategory === requiredCategory;

  lockRound();
  markAnswers(isCorrect, isCategoryCorrect);

  if (isCorrect && isCategoryCorrect) {
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
  selectedCategory = null;
  requiredCategory = null;
  roundLocked = false;

  /* nieuw: bij opnieuw spelen een nieuwe audio-volgorde maken */
  buildNewAudioQueue();

  scoreEl.textContent = "0";
  roundEl.textContent = "0";
  finalScoreEl.textContent = "0";
  endScreen.classList.add("hidden");

  startNewRound();
}

playAudioBtn.addEventListener("click", playCurrentAudio);
checkBtn.addEventListener("click", checkAnswer);
clearBtn.addEventListener("click", clearSelection);
newRoundBtn.addEventListener("click", startNewRound);
restartBtn.addEventListener("click", restartGame);

restartGame();
