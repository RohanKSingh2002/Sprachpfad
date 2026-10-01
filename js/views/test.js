// Mock test for one level: listening and reading are scored, writing and speaking are self-checked.

import { logPractice, recordTest } from "../state.js";
import { speakerButton } from "../ui/audio.js";
import { slidePill } from "../ui/effects.js";
import { enter, gsap, motionOK, onLeave, revealOnScroll, shake, splitReveal } from "../ui/motion.js";
import { scrollToCenter } from "../ui/scroll.js";
import { esc } from "../utils.js";
import { breadcrumb, levelSwitch } from "./shared.js";

let level = null; // level whose test is on screen
let answers = {}; // "L0", "R2"… → answered correctly?

function listeningPart(test) {
  return test.listening
    .map(
      (item, i) => `<div class="task" id="L${i}"><div class="kind">Text ${i + 1}</div>
      <div class="row" style="margin:0 0 10px">${speakerButton(item.audioText)}<span class="muted small">Play, then answer.</span></div>
      <div class="q">${esc(item.question)}</div>
      <div class="opts">${item.options.map((o, k) => `<button class="opt" type="button" data-tl="${i}" data-k="${k}">${esc(o)}</button>`).join("")}</div>
      <div id="Lfb${i}"></div></div>`,
    )
    .join("");
}

function readingPart(test) {
  const statements = test.reading.statements
    .map(
      (s, i) => `<div class="task"><div class="q" lang="de">${esc(s.text)}</div>
      <div class="opts"><button class="opt" type="button" data-tr="${i}" data-v="1">Richtig</button><button class="opt" type="button" data-tr="${i}" data-v="0">Falsch</button></div></div>`,
    )
    .join("");
  return `<div class="reading" lang="de">${esc(test.reading.text)}</div>${statements}`;
}

function writingPart(test) {
  const w = test.writing;
  return `<div class="task"><div class="q">${esc(w.task)}</div>
    <textarea id="tw" aria-label="Your answer" placeholder="${esc(w.placeholder)}" data-lenis-prevent></textarea>
    <p class="muted small" style="margin:14px 0 0">Check your text:</p>
    <ul class="check-list">${w.checklist.map((c) => `<li><label><input type="checkbox">${esc(c)}</label></li>`).join("")}</ul>
    <button class="btn small ghost" type="button" data-tmodel>Show a model answer</button><div id="twfb"></div></div>`;
}

function speakingPart(test) {
  return test.speaking
    .map(
      (s, i) => `<div class="task"><div class="q">${esc(s.task)}</div>
      <div class="row">${speakerButton(s.modelAnswer)}<button class="btn small ghost" type="button" data-tsm="${i}">Show model</button></div>
      <div id="Sfb${i}"></div></div>`,
    )
    .join("");
}

export function render(lv) {
  level = lv;
  answers = {};
  const { test } = lv;
  return `
  ${breadcrumb(lv, "Mock test")}
  <div class="page-head"><h1>${lv.name} mock test</h1>${levelSwitch(lv, "/test", "Choose a mock test")}</div>
  <p class="muted">Four parts in the shape of a ${lv.name} exam. Original practice questions, not official exam material. Score ${test.passMark} of ${test.total} or more in listening and reading to earn your ${lv.name} practice certificate.</p>
  <section class="test-sec" aria-labelledby="t1"><h2 id="t1">1. Listening</h2>${listeningPart(test)}</section>
  <section class="test-sec" aria-labelledby="t2"><h2 id="t2">2. Reading</h2>${readingPart(test)}</section>
  <section class="test-sec" aria-labelledby="t3"><h2 id="t3">3. Writing</h2>${writingPart(test)}</section>
  <section class="test-sec" aria-labelledby="t4"><h2 id="t4">4. Speaking</h2>
    <p class="muted">Say your answer out loud first, then listen to the model.</p>${speakingPart(test)}</section>
  <div id="testscore" aria-live="polite"></div>`;
}

/** Once every listening and reading item is answered, show the score and save the best result. */
function showScoreWhenDone() {
  const { test } = level;
  if (Object.keys(answers).length < test.total) return;
  const score = Object.values(answers).filter(Boolean).length;
  const ok = score >= test.passMark;
  recordTest(level, score);
  const box = document.getElementById("testscore");
  const message = ok
    ? `Listening and reading passed. You're on track for ${level.name}.`
    : esc(test.reviewTip);
  const link = ok
    ? `<a class="btn small" href="#/${level.id}/zertifikat">See your certificate</a>`
    : `<a class="btn small" href="#/${level.id}">Back to the ${level.name} lessons</a>`;
  box.innerHTML = `<div class="score"><div><strong class="num">${score}/${test.total}</strong><p>${message}</p>${link}</div></div>`;
  if (motionOK())
    gsap.from(box.firstChild, { y: 24, scale: 0.98, opacity: 0, duration: 0.7, ease: "expo.out" });
  scrollToCenter(box);
}

/** Lock a question's options, mark the right one and the wrong pick. */
function lockOptions(button, isRight) {
  button.parentElement.querySelectorAll(".opt").forEach((o) => {
    o.disabled = true;
    if (isRight(o)) o.classList.add("right");
  });
}

export function onClick(e, button) {
  if (!button || !level) return;
  const d = button.dataset;
  const { test } = level;

  if (d.tl !== undefined) {
    const i = +d.tl;
    const item = test.listening[i];
    if (`L${i}` in answers) return;
    const ok = +d.k === item.answer;
    answers[`L${i}`] = ok;
    logPractice();
    lockOptions(button, (o) => +o.dataset.k === item.answer);
    if (!ok) {
      button.classList.add("wrong");
      shake(button);
    }
    document.getElementById(`Lfb${i}`).innerHTML =
      `<div class="fb info">Transcript: <span lang="de">${esc(item.audioText)}</span></div>`;
    showScoreWhenDone();
  } else if (d.tr !== undefined) {
    const i = +d.tr;
    const statement = test.reading.statements[i];
    if (`R${i}` in answers) return;
    const ok = (d.v === "1") === statement.isTrue;
    answers[`R${i}`] = ok;
    logPractice();
    lockOptions(button, (o) => (o.dataset.v === "1") === statement.isTrue);
    if (!ok) {
      button.classList.add("wrong");
      shake(button);
    }
    showScoreWhenDone();
  } else if (d.tmodel !== undefined) {
    document.getElementById("twfb").innerHTML =
      `<div class="fb info" style="white-space:pre-line" lang="de">${esc(test.writing.modelAnswer)}</div>`;
  } else if (d.tsm !== undefined) {
    document.getElementById(`Sfb${d.tsm}`).innerHTML =
      `<div class="fb info" lang="de">${esc(test.speaking[+d.tsm].modelAnswer)}</div>`;
  }
}

/** Switching level on the test page is animated by this page itself (see router.js). */
export const updatesInPlace = true;

export function mount(lv, { sameKind } = {}) {
  slidePill(document.querySelector(".page-head .lvswitch"), "test-levels", { animate: !!sameKind });
  if (!motionOK()) return;
  if (sameKind) {
    enter("#app > h1, .page-head h1, #app > .muted, .test-sec", { y: 12, duration: 0.6, stagger: 0.05 });
    return;
  }
  splitReveal(document.querySelector(".page-head h1"), { duration: 0.9 });
  const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
  tl.from(".crumb", { autoAlpha: 0, y: 8, duration: 0.6 }, 0)
    .from(".page-head .lvswitch", { autoAlpha: 0, y: 10, duration: 0.7 }, 0.1)
    .from("#app > .muted", { autoAlpha: 0, y: 12, duration: 0.8 }, 0.15);
  onLeave(() => tl.kill());
  revealOnScroll(".test-sec > h2, .test-sec > .muted, .test-sec .task, .test-sec .reading", {
    y: 20,
    stagger: 0.07,
  });
}
