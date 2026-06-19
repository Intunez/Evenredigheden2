const LEVEL1_ROUNDS = 10;

const level3Exercises = [
    { question: "10/5 = 2/…", answers: ["1"] },
    { question: "…/12 = 3/4", answers: ["9"] },
    { question: "-4/6 = 12/… = -8/…", answers: ["-18", "12"] },
    { question: "-18/-25 = …/125", answers: ["90"] },
    { question: "-16/… = 48/-63 = …/42", answers: ["21", "-32"] },
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

const images = [
    { file: "images/afbeelding 1.jpg" },
    { file: "images/afbeelding 2.jpg" }
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

const $ = id => document.getElementById(id);

const startScreen = $("startScreen");
const level2StartScreen = $("level2StartScreen");
const level3StartScreen = $("level3StartScreen");
const gameScreen = $("gameScreen");
const endScreen = $("endScreen");

const levelTitle = $("levelTitle");
const levelIntro = $("levelIntro");
const levelNumber = $("levelNumber");

const gameImage = $("gameImage");
const imageWrapper = $("imageWrapper");
const gameAudio = $("gameAudio");

const termGrid = $("termGrid");
const messageEl = $("message");
const selectedAnswersEl = $("selectedAnswers");
const selectedCategoryEl = $("selectedCategory");

const scoreEl = $("score");
const roundEl = $("round");
const maxRoundsEl = $("maxRounds");
const finalScoreEl = $("finalScore");

const successSound = $("successSound");
const errorSound = $("errorSound");

let level = 1;
let score = 0;
let round = 0;
let currentAudio = null;
let correctAnswers = [];
let selectedAnswers = new Set();
let selectedCategory = null;
let requiredCategory = null;
let roundLocked = false;
let alreadyWrong = false;
let shuffledAudioQueue = [];
let currentAudioIndex = 0;
let exerciseIndex = 0;
let level2Done = false;
let level3AnsweredCorrectly = false;
let level3WrongAttempts = 0;

function shuffleArray(array) {
    const copy = [...array];

    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }

    return copy;
}

function getRandomItem(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function playSound(audio) {
    if (!audio) return;
    audio.currentTime = 0;
    audio.play().catch(() => {});
}

function setMessage(el, text, type = "") {
    el.textContent = text;
    el.className = "message";
    if (type) el.classList.add(type);
}

function showSection(id) {
    document.querySelectorAll(".level-section").forEach(section => {
        section.classList.add("hidden");
    });

    $(id).classList.remove("hidden");
}

function setHeader(title, intro, maxRounds) {
    levelTitle.textContent = title;
    levelIntro.textContent = intro;
    levelNumber.textContent = level;
    maxRoundsEl.textContent = maxRounds;
    roundEl.textContent = round;
    scoreEl.textContent = score;
}

function extractAnswersFromAudioPath(path) {
    return path
        .split("/")
        .pop()
        .replace(".mp3", "")
        .trim()
        .toLowerCase()
        .split(" en ")
        .map(x => x.trim())
        .sort();
}

function getRequiredCategory(answers) {
    const joined = [...answers].sort().join(",");
    return ["a", "b", "c", "d", "a,d", "b,c"].includes(joined) ? joined : null;
}

function arraysEqualAsSets(a, b) {
    return a.length === b.length && [...a].sort().join(",") === [...b].sort().join(",");
}

function buildNewAudioQueue() {
    shuffledAudioQueue = shuffleArray(audioFiles);
    currentAudioIndex = 0;
}

function getNextAudio() {
    if (currentAudioIndex >= shuffledAudioQueue.length) {
        buildNewAudioQueue();
    }

    return shuffledAudioQueue[currentAudioIndex++];
}

function clearHotspots() {
    imageWrapper.querySelectorAll(".hotspot").forEach(el => el.remove());
}

function updateSelectedAnswersText() {
    selectedAnswersEl.textContent = selectedAnswers.size
        ? [...selectedAnswers].sort().join(" en ")
        : "geen";
}

function updateSelectedCategoryText() {
    selectedCategoryEl.textContent = selectedCategory
        ? categoryLabels[selectedCategory]
        : "geen";
}

function resetVisualState() {
    imageWrapper.querySelectorAll(".hotspot").forEach(h => {
        h.classList.remove("selected", "correct", "wrong");
    });
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
        const h = document.createElement("button");

        h.type = "button";
        h.className = "hotspot";
        h.dataset.label = zone.label;

        Object.assign(h.style, {
            left: `${zone.left}%`,
            top: `${zone.top}%`,
            width: `${zone.width}%`,
            height: `${zone.height}%`
        });

        h.addEventListener("click", () => {
            if (roundLocked) return;

            if (selectedAnswers.has(zone.label)) {
                selectedAnswers.delete(zone.label);
            } else {
                selectedAnswers.add(zone.label);
            }

            h.classList.toggle("selected");
            updateSelectedAnswersText();
            setMessage(messageEl, "");
        });

        imageWrapper.appendChild(h);
    });
}

function renderCategoryButtons() {
    termGrid.innerHTML = "";

    categoryOptions.forEach(option => {
        const button = document.createElement("button");

        button.className = "category-btn";
        button.textContent = option.label;

        button.onclick = () => {
            if (roundLocked) return;

            selectedCategory = option.key;
            updateSelectedCategoryText();
            renderCategoryButtons();
        };

        if (selectedCategory === option.key) {
            button.classList.add("active");
        }

        termGrid.appendChild(button);
    });
}

function startLevel1() {
    level = 1;
    round = 0;
    buildNewAudioQueue();

    setHeader(
        "Benamingen evenredigheden",
        "Luister naar het audiofragment en maak de juiste keuze tussen a, b, c of d. Kies nadien ook de juiste benaming.",
        LEVEL1_ROUNDS
    );

    showSection("level1");
    startNewRound();
}

function startNewRound() {
    if (round >= LEVEL1_ROUNDS) {
        gameScreen.classList.add("hidden");
        level2StartScreen.classList.remove("hidden");
        return;
    }

    selectedAnswers = new Set();
    selectedCategory = null;
    alreadyWrong = false;
    roundLocked = false;

    updateSelectedAnswersText();
    updateSelectedCategoryText();
    resetVisualState();
    setMessage(messageEl, "");

    gameImage.src = getRandomItem(images).file;
    currentAudio = getNextAudio();

    correctAnswers = extractAnswersFromAudioPath(currentAudio);
    requiredCategory = getRequiredCategory(correctAnswers);

    gameAudio.src = currentAudio;
    gameAudio.load();

    createHotspots();
    renderCategoryButtons();

    round++;

    setHeader(
        "Benamingen evenredigheden",
        levelIntro.textContent,
        LEVEL1_ROUNDS
    );
}

function checkAnswer() {
    if (roundLocked) return;

    if (!selectedAnswers.size) {
        return setMessage(messageEl, "Klik eerst minstens één vak aan.", "error");
    }

    if (!selectedCategory) {
        return setMessage(messageEl, "Kies ook de juiste termknop.", "error");
    }

    const ok =
        arraysEqualAsSets([...selectedAnswers], correctAnswers) &&
        selectedCategory === requiredCategory;

    if (ok) {
        roundLocked = true;

        if (!alreadyWrong) {
            score++;
            scoreEl.textContent = score;
        }

        playSound(successSound);
        setMessage(messageEl, "Goed! Volgende ronde...", "success");
        setTimeout(startNewRound, 1000);
    } else {
        alreadyWrong = true;
        playSound(errorSound);
        setMessage(messageEl, "Niet juist, probeer opnieuw!", "error");
    }
}

function clearSelection() {
    if (roundLocked) return;

    selectedAnswers = new Set();
    selectedCategory = null;

    resetVisualState();
    updateSelectedAnswersText();
    updateSelectedCategoryText();
    renderCategoryButtons();
    setMessage(messageEl, "");
}

function showLevel2() {
    level2StartScreen.classList.add("hidden");
    gameScreen.classList.remove("hidden");
    startLevel2();
}

function startLevel2() {
    level = 2;
    round = 1;
    level2Done = false;

    setHeader(
        "Hoofdeigenschap evenredigheden",
        "Vind de correcte definitie.",
        1
    );

    showSection("level2");

    const grid = $("definitionGrid");
    grid.innerHTML = "";
    setMessage($("level2Message"), "");

    shuffleArray(["juist.jpg", "fout1.jpg", "fout2.jpg", "fout3.jpg"]).forEach(file => {
        const btn = document.createElement("button");

        btn.className = "definition-card";
        btn.innerHTML = `<img src="images/${file}" alt="definitie">`;

        btn.onclick = () => {
            if (level2Done) return;

            if (file === "juist.jpg") {
                level2Done = true;
                score++;
                scoreEl.textContent = score;

                playSound(successSound);
                setMessage($("level2Message"), "Goed! Je gaat naar level 3.", "success");

                setTimeout(() => {
                    gameScreen.classList.add("hidden");
                    level3StartScreen.classList.remove("hidden");
                }, 1000);
            } else {
                playSound(errorSound);
                setMessage($("level2Message"), "Niet juist, probeer opnieuw.", "error");
            }
        };

        grid.appendChild(btn);
    });
}

function formatExerciseQuestion(question) {
    return question
        .replace(
            /([\-0-9a-zA-Z…]+)\/([\-0-9a-zA-Z…]+)/g,
            '<span class="fraction"><span class="top">$1</span><span class="bottom">$2</span></span>'
        )
        .replace(
            /=/g,
            '<span class="equals"> = </span>'
        );
}
function showLevel3() {
    level3StartScreen.classList.add("hidden");
    gameScreen.classList.remove("hidden");
    startLevel3();
}

function startLevel3() {
    level = 3;
    round = 1;
    exerciseIndex = 0;

    setHeader(
        "Oefeningen evenredigheden",
        "Vul de ontbrekende blauwe antwoorden in.",
        level3Exercises.length
    );

    showSection("level3");
    renderExercise();
}

function renderExercise() {
    const ex = level3Exercises[exerciseIndex];

    round = exerciseIndex + 1;
    level3AnsweredCorrectly = false;
    level3WrongAttempts = 0;

    setHeader(
        "Oefeningen evenredigheden",
        levelIntro.textContent,
        level3Exercises.length
    );

    $("nextExerciseBtn").classList.add("hidden");
    setMessage($("level3Message"), "");

    $("exerciseBox").innerHTML = `
        <div class="exercise-question equation">
            ${formatExerciseQuestion(ex.question)}
        </div>
        ${ex.answers.map((_, i) => `
            <input class="exercise-input" aria-label="antwoord ${i + 1}" />
        `).join("")}
    `;
}

function normalize(v) {
    return v
        .trim()
        .replace(/\s/g, "")
        .replace(",", ".");
}

function fractionToNumber(value) {
    if (!value.includes("/")) {
        return Number(value);
    }

    const parts = value.split("/");

    if (parts.length !== 2) {
        return NaN;
    }

    const numerator = Number(parts[0]);
    const denominator = Number(parts[1]);

    if (denominator === 0) {
        return NaN;
    }

    return numerator / denominator;
}

function answerOk(user, correct) {
    const u = normalize(user);
    const c = normalize(correct);

    if (u === c) return true;

    const userNumber = fractionToNumber(u);
    const correctNumber = fractionToNumber(c);

    if (!Number.isNaN(userNumber) && !Number.isNaN(correctNumber)) {
        return Math.abs(userNumber - correctNumber) < 0.0001;
    }

    return false;
}

function checkExercise() {
    const ex = level3Exercises[exerciseIndex];
    const inputs = [...document.querySelectorAll(".exercise-input")];

    const ok = inputs.every((input, i) => {
        return answerOk(input.value, ex.answers[i]);
    });

    if (ok) {
        if (!level3AnsweredCorrectly) {
            score++;
            scoreEl.textContent = score;
            level3AnsweredCorrectly = true;
        }

        playSound(successSound);
        setMessage($("level3Message"), "Goed!", "success");
        $("nextExerciseBtn").classList.remove("hidden");
    } else {
        level3WrongAttempts++;
        playSound(errorSound);

        if (level3WrongAttempts >= 4) {
            const correctText = ex.answers.join(" en ");

            inputs.forEach((input, i) => {
                input.value = ex.answers[i];
                input.disabled = true;
            });

            setMessage(
                $("level3Message"),
                `Niet erg! Het juiste antwoord is: ${correctText}`,
                "error"
            );

            $("nextExerciseBtn").classList.remove("hidden");
        } else {
            setMessage(
                $("level3Message"),
                `Niet juist, probeer opnieuw. Poging ${level3WrongAttempts}/4`,
                "error"
            );
        }
    }
}

function nextExercise() {
    exerciseIndex++;

    if (exerciseIndex >= level3Exercises.length) {
        return finishGame();
    }

    renderExercise();
}

function finishGame() {
    finalScoreEl.textContent = `${score} op ${LEVEL1_ROUNDS + 1 + level3Exercises.length}`;
    endScreen.classList.remove("hidden");
}

function restartGame() {
    score = 0;

    startScreen.classList.remove("hidden");
    level2StartScreen.classList.add("hidden");
    level3StartScreen.classList.add("hidden");

    gameScreen.classList.add("hidden");
    endScreen.classList.add("hidden");
}

$("startGameBtn").onclick = () => {
    startScreen.classList.add("hidden");
    gameScreen.classList.remove("hidden");
    startLevel1();
};

$("startLevel2Btn").onclick = showLevel2;
$("startLevel3Btn").onclick = showLevel3;

$("playAudioBtn").onclick = () => {
    gameAudio.play().catch(() => {
        setMessage(messageEl, "Klik nog eens op de knop.", "error");
    });
};

$("checkBtn").onclick = checkAnswer;
$("clearBtn").onclick = clearSelection;
$("checkExerciseBtn").onclick = checkExercise;
$("nextExerciseBtn").onclick = nextExercise;
$("restartBtn").onclick = restartGame;

restartGame();
