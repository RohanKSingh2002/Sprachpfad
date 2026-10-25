// Extra practice across a level: fill in the blank, translate, and match vocabulary.

import { logPractice } from "../state.js";
import { enter, motionOK, splitReveal } from "../ui/motion.js";
import { esc, norm, shuffle } from "../utils.js";
import { breadcrumb, levelSwitch } from "./shared.js";

const MODES = [
  ["fill", "Fill in the blanks"],
  ["translate", "Build a sentence"],
  ["match", "Match the words"],
];
let level;
let mode = "fill";
let queue = [];
let current = null;
let solved = false;
let score = 0;
let matched = new Set();
let selectedEnglish = null;
let matchMessage = "";

function bankFor(lv, kind) {
  if (kind === "fill")
    return lv.lessons.flatMap((lesson) => lesson.tasks
      .filter((task) => task.type === "fill")
      .map((task) => ({ question: task.question, answers: task.answers, hint: task.hint })));
  if (kind === "translate")
    return lv.lessons.flatMap((lesson) => lesson.examples.map((example) => ({
      question: example.en,
      answer: example.de,
    })));
  const seen = new Set();
  return [...lv.lessons.flatMap((lesson) => lesson.vocab), ...lv.topics.flatMap((topic) => topic.vocab)]
    .filter((word) => {
      const key = `${word.de}\u0000${word.en}`;
      if (!word.de || !word.en || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function startMode(nextMode = mode) {
  mode = nextMode;
  const bank = bankFor(level, mode);
  queue = shuffle(bank);
  score = 0;
  solved = false;
  matched = new Set();
  selectedEnglish = null;
  matchMessage = "";
  current = mode === "match" ? queue.slice(0, Math.min(5, queue.length)) : queue.shift();
  paintExercise();
}

function modeTabs() {
  return `<div class="practice-modes" role="tablist" aria-label="Practice type">${MODES.map(([id, label]) =>
    `<button class="practice-mode${mode === id ? " is-active" : ""}" type="button" role="tab" aria-selected="${mode === id}" data-mode="${id}">${label}</button>`,
  ).join("")}</div>`;
}

function exerciseHTML() {
  if (mode === "match") return matchHTML();
  const label = mode === "fill" ? "Fill in the missing word" : "Translate this sentence into German";
  const prompt = mode === "fill" ? current.question.replace(/_{2,}/g, "________") : current.question;
  const answer = mode === "fill" ? current.answers[0] : current.answer;
  const hint = mode === "fill" ? current.hint : "Compare meaning, verb position, noun capitals and du/Sie. Other correct translations and word orders are possible.";
  return `<div class="practice-card">
    <p class="practice-kicker">${label} <span>${queue.length + 1} in this round</span></p>
    <p class="practice-prompt"${mode === "fill" ? ' lang="de"' : ""}>${esc(prompt)}</p>
    ${mode === 'translate' ? '<p class="muted small">Write your version, then compare it with one possible model. This practice is not graded.</p>' : ''}
    <div class="practice-answer">
      <label class="sr" for="practice-input">Your answer in German</label>
      <input id="practice-input" class="fill" autocomplete="off" autocapitalize="off" spellcheck="false"${solved ? " disabled" : ""}>
      <button class="btn small" type="button" data-check${solved ? " disabled" : ""}>${mode === "translate" ? "Compare with a model" : "Check"}</button>
    </div>
    <div class="fb-slot" aria-live="polite">${solved ? mode === "translate" ? `<div class="fb info"><p>Your version: <span lang="de">${esc(current.response)}</span></p><p>One model: <b lang="de">${esc(answer)}</b></p>${esc(hint)} This translation is not automatically graded.</div>` : `<div class="fb ${current.wasRight ? "ok" : "no"}">${current.wasRight ? "Richtig." : `Answer: <b lang="de">${esc(answer)}</b>.`} ${esc(hint || "")}</div>` : ""}</div>
    ${solved ? '<button class="btn small ghost practice-next" type="button" data-next>Next question</button>' : ""}
  </div>`;
}

function matchHTML() {
  if (!current?.length) return `<div class="practice-card"><p>No vocabulary is available for this level yet.</p></div>`;
  const left = current.map((word, i) => ({ word, i }));
  const right = current.map((word, i) => ({ word, i })).reverse();
  return `<div class="practice-card">
    <p class="practice-kicker">Choose an English word, then its German match <span>${matched.size} / ${current.length} matched</span></p>
    <div class="match-columns"><div class="match-list" aria-label="English words">${left.map(({ word, i }) => `<button class="match-option${matched.has(i) ? " is-matched" : ""}${selectedEnglish === i ? " is-selected" : ""}" type="button" data-match-side="en" data-match-index="${i}"${matched.has(i) ? " disabled" : ""}>${esc(word.en)}</button>`).join("")}</div>
    <div class="match-list" lang="de" aria-label="German words">${right.map(({ word, i }) => `<button class="match-option${matched.has(i) ? " is-matched" : ""}" type="button" data-match-side="de" data-match-index="${i}"${matched.has(i) ? " disabled" : ""}>${esc(word.de)}</button>`).join("")}</div></div>
    <div class="fb-slot" aria-live="polite">${matchMessage ? `<div class="fb ${matchMessage === "Correct match." ? "ok" : "no"}">${esc(matchMessage)}</div>` : ""}</div>
    ${matched.size === current.length ? '<button class="btn small practice-next" type="button" data-next>Next matching round</button>' : ""}
  </div>`;
}

function paintExercise() {
  const stage = document.getElementById("practice-stage");
  if (!stage) return;
  stage.innerHTML = current ? exerciseHTML() : `<div class="practice-card"><p>That’s the end of this round. ${mode === 'translate' ? `You compared ${score} sentences with a model. These responses are not graded.` : `You answered ${score} ${score === 1 ? 'question' : 'questions'} correctly.`}</p><button class="btn small" type="button" data-next>Start another round</button></div>`;
  const tally = document.getElementById("practice-score");
  if (tally) tally.textContent = mode === "translate" ? `${score} sentences compared · not graded` : `${score} correct`;
  document.querySelectorAll(".practice-mode").forEach((tab) => {
    const active = tab.dataset.mode === mode;
    tab.classList.toggle("is-active", active);
    tab.setAttribute("aria-selected", String(active));
  });
}

export function render(lv) {
  level = lv;
  mode = "fill";
  startMode("fill");
  return `${breadcrumb(lv, "Practice")}
    <div class="page-head"><h1>${lv.name} practice</h1>${levelSwitch(lv, "/practice", "Choose a level")}</div>
    <p class="muted">Practise grammar, sentence translation, and vocabulary from every lesson in ${lv.name}. Your answers count toward your practice calendar.</p>
    ${modeTabs()}
    <section class="practice-stage" id="practice-stage" aria-label="Practice question">${current ? exerciseHTML() : ""}</section>
    <p class="practice-score" id="practice-score" aria-live="polite">${score} correct</p>`;
}

function nextQuestion() {
  solved = false;
  selectedEnglish = null;
  matchMessage = "";
  if (mode === "match") {
    current = shuffle(bankFor(level, "match")).slice(0, 5);
    matched = new Set();
  } else {
    if (!queue.length) queue = shuffle(bankFor(level, mode));
    current = queue.shift();
  }
  paintExercise();
}

function checkTextAnswer(input) {
  const value = input.value.trim();
  if (!value) {
    input.focus();
    return;
  }
  if (mode === "translate") {
    current.response = value;
    solved = true;
    score++;
    logPractice();
    paintExercise();
    return;
  }
  const accepted = current.answers;
  const ok = accepted.some((item) => norm(item) === norm(value));
  current.wasRight = ok;
  solved = true;
  if (ok) score++;
  logPractice();
  paintExercise();
}

export function onClick(e, button) {
  if (!button) return;
  if (button.dataset.mode) {
    startMode(button.dataset.mode);
  } else if (button.dataset.check !== undefined) {
    checkTextAnswer(document.getElementById("practice-input"));
    document.querySelector(".practice-next")?.focus();
  } else if (button.dataset.next !== undefined) {
    nextQuestion();
    document.getElementById("practice-input")?.focus();
  } else if (button.dataset.matchSide) {
    const index = +button.dataset.matchIndex;
    if (matched.has(index)) return;
    if (button.dataset.matchSide === "en") {
      selectedEnglish = index;
      matchMessage = "";
    } else if (selectedEnglish !== null) {
      const isCorrect = selectedEnglish === index;
      logPractice();
      if (isCorrect) {
        matched.add(index);
        score++;
        matchMessage = "Correct match.";
      } else {
        matchMessage = "Not quite. Try another match.";
      }
      selectedEnglish = null;
    }
    paintExercise();
    if (matched.size === current.length) document.querySelector(".practice-next")?.focus();
    else {
      const targetSide = selectedEnglish === null ? "en" : "de";
      document.querySelector(`#practice-stage [data-match-side="${targetSide}"]:not(:disabled)`)?.focus();
    }
  }
}

export function onKeydown(e) {
  if (e.key === "Enter" && e.target.id === "practice-input") {
    e.preventDefault();
    checkTextAnswer(e.target);
    document.querySelector(".practice-next")?.focus();
  }
}

export function onChange() {}

export function mount(lv, { sameKind } = {}) {
  level = lv;
  if (!motionOK()) return;
  if (sameKind) enter(".page-head h1, #app > .muted, .practice-modes, .practice-card", { y: 14, duration: 0.55, stagger: 0.05 });
  else splitReveal(document.querySelector(".page-head h1"), { duration: 0.8 });
}

export const updatesInPlace = true;
