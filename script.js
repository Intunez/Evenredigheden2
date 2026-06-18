const LEVEL1_ROUNDS = 10;
const level3Exercises = [
  { question: "10/5 = 2 / …", answers: ["1"] },
  { question: "… / 12 = 3/4", answers: ["9"] },
  { question: "-4/6 = 12/… = -8/…", answers: ["-18", "12"] },
  { question: "-18/-25 = … / 125", answers: ["90"] },
  { question: "-16/… = 48/-63 = … / 42", answers: ["21", "-32"] },
  { question: "2/3 = -16/…", answers: ["-24"] },
  { question: "x/3 = 3/9", answers: ["1"] },
  { question: "4/x = 6/12", answers: ["8"] },
  { question: "x/5 = 6/15", answers: ["2"] },
  { question: "2/3 = x/4", answers: ["8/3"] },
  { question: "-x/4 = -9/10", answers: ["3,6"] },
  { question: "-4/5 = -2/x", answers: ["5/2"] },
  { question: "x/-7 = 5/11", answers: ["-35/11"] },
  { question: "13/x = -36/-9", answers: ["13/4"] },
  { question: "2x/5 = 12/3", answers: ["10"] },
  { question: "5/10 = -x/-2", answers: ["1"] },
  { question: "14/23 = 2/3x", answers: ["23/21"] },
  { question: "-3/10x = 2", answers: ["-3/20"] }
];

const images = [{ file: "images/afbeelding 1.jpg" }, { file: "images/afbeelding 2.jpg" }];
const audioFiles = ["audio/a.mp3", "audio/b.mp3", "audio/c.mp3", "audio/d.mp3", "audio/a en d.mp3", "audio/b en c.mp3"];
const categoryOptions = [
  { key: "a", label: "Eerste term" }, { key: "b", label: "Tweede term" },
  { key: "c", label: "Derde term" }, { key: "d", label: "Vierde term" },
  { key: "a,d", label: "Uiterste termen" }, { key: "b,c", label: "Middelste termen" }
];
const categoryLabels = { a: "eerste term", b: "tweede term", c: "derde term", d: "vierde term", "a,d": "uiterste termen", "b,c": "middelste termen" };

const $ = id => document.getElementById(id);
const startScreen = $("startScreen"), gameScreen = $("gameScreen"), endScreen = $("endScreen");
const levelTitle = $("levelTitle"), levelIntro = $("levelIntro"), levelNumber = $("levelNumber");
const gameImage = $("gameImage"), imageWrapper = $("imageWrapper"), gameAudio = $("gameAudio");
const termGrid = $("termGrid"), messageEl = $("message"), selectedAnswersEl = $("selectedAnswers"), selectedCategoryEl = $("selectedCategory");
const scoreEl = $("score"), roundEl = $("round"), maxRoundsEl = $("maxRounds"), finalScoreEl = $("finalScore");
const successSound = $("successSound"), errorSound = $("errorSound");
let level = 1, score = 0, round = 0, currentAudio = null, correctAnswers = [], selectedAnswers = new Set(), selectedCategory = null, requiredCategory = null, roundLocked = false, alreadyWrong = false, shuffledAudioQueue = [], currentAudioIndex = 0, exerciseIndex = 0;

function shuffleArray(array) { const copy = [...array]; for (let i = copy.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [copy[i], copy[j]] = [copy[j], copy[i]]; } return copy; }
function getRandomItem(array) { return array[Math.floor(Math.random() * array.length)]; }
function playSound(audio) { if (audio) { audio.currentTime = 0; audio.play().catch(() => {}); } }
function setMessage(el, text, type = "") { el.textContent = text; el.className = "message"; if (type) el.classList.add(type); }
function showSection(id) { document.querySelectorAll(".level-section").forEach(s => s.classList.add("hidden")); $(id).classList.remove("hidden"); }
function setHeader(title, intro, maxRounds) { levelTitle.textContent = title; levelIntro.textContent = intro; levelNumber.textContent = level; maxRoundsEl.textContent = maxRounds; roundEl.textContent = round; scoreEl.textContent = score; }

function extractAnswersFromAudioPath(path) { return path.split("/").pop().replace(".mp3", "").trim().toLowerCase().split(" en ").map(x => x.trim()).sort(); }
function getRequiredCategory(answers) { const joined = [...answers].sort().join(","); return ["a", "b", "c", "d", "a,d", "b,c"].includes(joined) ? joined : null; }
function arraysEqualAsSets(a, b) { return a.length === b.length && [...a].sort().join(",") === [...b].sort().join(","); }
function buildNewAudioQueue() { shuffledAudioQueue = shuffleArray(audioFiles); currentAudioIndex = 0; }
function getNextAudio() { if (currentAudioIndex >= shuffledAudioQueue.length) buildNewAudioQueue(); return shuffledAudioQueue[currentAudioIndex++]; }
function clearHotspots() { imageWrapper.querySelectorAll(".hotspot").forEach(el => el.remove()); }
function updateSelectedAnswersText() { selectedAnswersEl.textContent = selectedAnswers.size ? [...selectedAnswers].sort().join(" en ") : "geen"; }
function updateSelectedCategoryText() { selectedCategoryEl.textContent = selectedCategory ? categoryLabels[selectedCategory] : "geen"; }
function resetVisualState() { imageWrapper.querySelectorAll(".hotspot").forEach(h => h.classList.remove("selected", "correct", "wrong")); }
function createHotspots() {
  clearHotspots();
  [{ label: "a", left: 10, top: 10, width: 33, height: 36 }, { label: "c", left: 57, top: 10, width: 33, height: 36 }, { label: "b", left: 10, top: 54, width: 33, height: 34 }, { label: "d", left: 57, top: 54, width: 33, height: 34 }].forEach(zone => {
    const h = document.createElement("button"); h.type = "button"; h.className = "hotspot"; h.dataset.label = zone.label;
    Object.assign(h.style, { left: `${zone.left}%`, top: `${zone.top}%`, width: `${zone.width}%`, height: `${zone.height}%` });
    h.addEventListener("click", () => { if (roundLocked) return; selectedAnswers.has(zone.label) ? selectedAnswers.delete(zone.label) : selectedAnswers.add(zone.label); h.classList.toggle("selected"); updateSelectedAnswersText(); setMessage(messageEl, ""); });
    imageWrapper.appendChild(h);
  });
}
function renderCategoryButtons() { termGrid.innerHTML = ""; categoryOptions.forEach(o => { const b = document.createElement("button"); b.className = "category-btn"; b.textContent = o.label; b.onclick = () => { if (roundLocked) return; selectedCategory = o.key; updateSelectedCategoryText(); renderCategoryButtons(); }; if (selectedCategory === o.key) b.classList.add("active"); termGrid.appendChild(b); }); }
function startLevel1() { level = 1; round = 0; buildNewAudioQueue(); setHeader("Benamingen evenredigheden", "Luister naar het audiofragment en maak de juiste keuze tussen a, b, c of d. Kies nadien ook de juiste benaming.", LEVEL1_ROUNDS); showSection("level1"); startNewRound(); }
function startNewRound() {
  if (round >= LEVEL1_ROUNDS) return startLevel2();
  selectedAnswers = new Set(); selectedCategory = null; alreadyWrong = false; roundLocked = false; updateSelectedAnswersText(); updateSelectedCategoryText(); resetVisualState(); setMessage(messageEl, "");
  gameImage.src = getRandomItem(images).file; currentAudio = getNextAudio(); correctAnswers = extractAnswersFromAudioPath(currentAudio); requiredCategory = getRequiredCategory(correctAnswers); gameAudio.src = currentAudio; gameAudio.load(); createHotspots(); renderCategoryButtons(); round++; setHeader("Benamingen evenredigheden", levelIntro.textContent, LEVEL1_ROUNDS);
}
function checkAnswer() { if (roundLocked) return; if (!selectedAnswers.size) return setMessage(messageEl, "Klik eerst minstens één vak aan.", "error"); if (!selectedCategory) return setMessage(messageEl, "Kies ook de juiste termknop.", "error"); const ok = arraysEqualAsSets([...selectedAnswers], correctAnswers) && selectedCategory === requiredCategory; if (ok) { roundLocked = true; if (!alreadyWrong) score++; scoreEl.textContent = score; playSound(successSound); setMessage(messageEl, "Goed! Volgende ronde...", "success"); setTimeout(startNewRound, 1000); } else { alreadyWrong = true; playSound(errorSound); setMessage(messageEl, "Niet juist, probeer opnieuw!", "error"); } }
function clearSelection() { if (roundLocked) return; selectedAnswers = new Set(); selectedCategory = null; resetVisualState(); updateSelectedAnswersText(); updateSelectedCategoryText(); renderCategoryButtons(); setMessage(messageEl, ""); }

function startLevel2() { level = 2; round = 1; setHeader("Hoofdeigenschap evenredigheden", "Vind de correcte definitie.", 1); showSection("level2"); const grid = $("definitionGrid"); grid.innerHTML = ""; shuffleArray(["juist.jpg", "fout1.jpg", "fout2.jpg", "fout3.jpg"]).forEach(file => { const btn = document.createElement("button"); btn.className = "definition-card"; btn.innerHTML = `<img src="images/${file}" alt="definitie">`; btn.onclick = () => { if (file === "juist.jpg") { score++; scoreEl.textContent = score; playSound(successSound); setMessage($("level2Message"), "Goed! Je gaat naar level 3.", "success"); setTimeout(startLevel3, 1000); } else { playSound(errorSound); setMessage($("level2Message"), "Niet juist, probeer opnieuw.", "error"); } }; grid.appendChild(btn); }); }

function startLevel3() { level = 3; round = 1; exerciseIndex = 0; setHeader("Oefeningen evenredigheden", "Vul de ontbrekende blauwe antwoorden in.", level3Exercises.length); showSection("level3"); renderExercise(); }
function renderExercise() { const ex = level3Exercises[exerciseIndex]; round = exerciseIndex + 1; setHeader("Oefeningen evenredigheden", levelIntro.textContent, level3Exercises.length); $("nextExerciseBtn").classList.add("hidden"); setMessage($("level3Message"), ""); $("exerciseBox").innerHTML = `<div class="exercise-question">${ex.question}</div>` + ex.answers.map((_, i) => `<input class="exercise-input" aria-label="antwoord ${i + 1}" />`).join(""); }
function normalize(v) { return v.trim().replace(/\s/g, "").replace(",", "."); }
function answerOk(user, correct) { const u = normalize(user), c = normalize(correct); if (u === c) return true; const uf = Number(u.replace("/", "/")), cf = Number(c.replace("/", "/")); if (!u.includes("/") && !c.includes("/")) return Math.abs(Number(u) - Number(c)) < 0.0001; return false; }
function checkExercise() { const ex = level3Exercises[exerciseIndex]; const inputs = [...document.querySelectorAll(".exercise-input")]; const ok = inputs.every((inp, i) => answerOk(inp.value, ex.answers[i])); if (ok) { score++; scoreEl.textContent = score; playSound(successSound); setMessage($("level3Message"), "Goed!", "success"); $("nextExerciseBtn").classList.remove("hidden"); } else { playSound(errorSound); setMessage($("level3Message"), "Niet juist, probeer opnieuw.", "error"); } }
function nextExercise() { exerciseIndex++; if (exerciseIndex >= level3Exercises.length) return finishGame(); renderExercise(); }
function finishGame() { finalScoreEl.textContent = `${score} op ${LEVEL1_ROUNDS + 1 + level3Exercises.length}`; endScreen.classList.remove("hidden"); }
function restartGame() { score = 0; startScreen.classList.remove("hidden"); gameScreen.classList.add("hidden"); endScreen.classList.add("hidden"); }

$("startGameBtn").onclick = () => { startScreen.classList.add("hidden"); gameScreen.classList.remove("hidden"); startLevel1(); };
$("playAudioBtn").onclick = () => gameAudio.play().catch(() => setMessage(messageEl, "Klik nog eens op de knop.", "error"));
$("checkBtn").onclick = checkAnswer; $("clearBtn").onclick = clearSelection; $("checkExerciseBtn").onclick = checkExercise; $("nextExerciseBtn").onclick = nextExercise; $("restartBtn").onclick = restartGame;
restartGame();
