// Mock test for one level: listening and reading are scored, writing and speaking are self-checked.

import { logPractice, recordTest } from "../state.js";
import { speakerButton } from "../ui/audio.js";
import { slidePill } from "../ui/effects.js";
import { enter, gsap, motionOK, onLeave, revealOnScroll, shake, splitReveal } from "../ui/motion.js";
import { scrollToCenter } from "../ui/scroll.js";
import { esc, norm } from "../utils.js";
import { breadcrumb, levelSwitch } from "./shared.js";

let level = null; // level whose test is on screen
let answers = {}; // "L0", "R2"… → answered correctly?
let countdown = null;

function listeningPart(test) {
  return test.listening
    .map(
      (item, i) => `<div class="task" id="L${i}"><div class="kind">${item.part ? `Part ${item.part} · ` : ""}Text ${i + 1}${item.plays ? ` · rehearsal: ${item.plays === 1 ? "one play" : "two plays"}` : ""}</div>
      <div class="row" style="margin:0 0 10px">${speakerButton(item.audioText)}<span class="muted small">Play, then answer.</span></div>
      <div class="q"${test.version === 2 ? ' lang="de"' : ""}>${esc(item.question)}</div>
      <div class="opts">${item.options.map((o, k) => `<button class="opt" type="button"${test.version === 2 ? ' lang="de"' : ""} data-tl="${i}" data-k="${k}">${esc(o)}</button>`).join("")}</div>
      <div id="Lfb${i}"></div></div>`,
    )
    .join("");
}

function readingPart(test) {
  if (test.reading.groups) {
    let index = 0;
    return test.reading.groups.map(group => `<h3>${esc(group.title)}</h3>${group.text ? `<div class="reading" lang="de">${esc(group.text)}</div>` : ""}${group.items.map(item => {
      const i = index++;
      return `<div class="task">${item.text ? `<div class="reading" lang="de">${esc(item.text)}</div>` : ""}<div class="q" lang="de">${esc(item.question)}</div><div class="opts">${item.options.map((option, k) => `<button class="opt" type="button" lang="de" data-tr-choice="${i}" data-k="${k}">${esc(option)}</button>`).join("")}</div></div>`;
    }).join("")}`).join("");
  }
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

function formPart(test) {
  if (!test.form) return "";
  return `<h3>Part 1 · Complete the form</h3><p class="reading" lang="de">${esc(test.form.profile)}</p>${test.form.fields.map((field, i) => `<div class="task"><label class="q" for="TF${i}" lang="de">${esc(field.label)}</label><div class="row"><input class="fill" id="TF${i}" autocomplete="off"><button class="btn small" type="button" data-test-form="${i}">Check field</button></div><div id="TFfb${i}" aria-live="polite"></div></div>`).join("")}<h3>Part 2 · Write a short message</h3>`;
}

function reviewScores(test) {
  if (!test.form) return "";
  return `<section class="panel test-review"><h2>Review writing and speaking</h2><p class="muted">Ask a tutor or practice partner to review task completion and intelligibility. Record their totals using the official model paper’s assessment guidance. Self-entered scores are practice estimates.</p><div class="row"><label>Short-message score (0–10)<input class="fill" id="review-writing" type="number" min="0" max="10" step="0.5"></label><label>Speaking score (0–15)<input class="fill" id="review-speaking" type="number" min="0" max="15" step="0.5"></label></div><label><input type="checkbox" id="review-confirm"> I have feedback on both my writing and spoken interaction.</label><div id="exam-estimate" aria-live="polite"></div></section>`;
}

function updateEstimate() {
  const box = document.getElementById('exam-estimate');
  if (!box) return;
  const writing = document.getElementById('review-writing');
  const speaking = document.getElementById('review-speaking');
  if (Object.keys(answers).length < level.test.total || !writing.value || !speaking.value || !writing.checkValidity() || !speaking.checkValidity() || !document.getElementById('review-confirm').checked) {
    box.innerHTML = '<p class="muted small">Complete the objective questions and add both reviewed scores to calculate an estimate.</p>';
    return;
  }
  const raw = Object.values(answers).filter(Boolean).length + +writing.value + +speaking.value;
  const score = Math.round(raw * 1.66);
  box.innerHTML = `<div class="fb ${score >= 80 ? "ok" : "info"}"><b>${score}/100 practice estimate.</b> ${score >= 80 ? 'Course preparation target reached on this paper; repeat with a different unfamiliar paper.' : 'The course preparation target is 80/100. Use the feedback to review your weakest tasks.'} This is not an official result.</div>`;
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
  <p class="muted">${test.form ? `Original A1 preparation assessment. Listening, reading and form completion are checked automatically (${test.total} items); short-message writing and speaking require feedback. Aim for ${test.passMark}/${test.total} in objective practice.` : `Four parts in the shape of a ${lv.name} exam. Original practice questions, not official exam material. Score ${test.passMark} of ${test.total} or more in listening and reading to earn your ${lv.name} practice certificate.`}</p>
  ${test.form ? `<div class="panel test-rehearsal"><p class="small">For a rehearsal: listening about 20 minutes, reading 25 minutes, writing 20 minutes; speaking 15 minutes with a partner. Follow the listed audio play counts yourself. Use the official recordings for a realistic full rehearsal.</p><button type="button" class="btn small ghost" data-start-timer>Start a 65-minute written-practice timer</button><span id="test-timer" class="num" role="timer" aria-live="off"></span><p><a class="tlink" href="#/a1/roadmap">Course roadmap and official practice resources</a></p></div>` : ""}
  <section class="test-sec" aria-labelledby="t1"><h2 id="t1">1. Listening</h2>${listeningPart(test)}</section>
  <section class="test-sec" aria-labelledby="t2"><h2 id="t2">2. Reading</h2>${readingPart(test)}</section>
  <section class="test-sec" aria-labelledby="t3"><h2 id="t3">3. Writing</h2>${formPart(test)}${writingPart(test)}</section>
  <section class="test-sec" aria-labelledby="t4"><h2 id="t4">4. Speaking</h2>
    <p class="muted">Say your answer out loud first, then listen to the model.</p>${speakingPart(test)}</section>
  <div id="testscore" aria-live="polite"></div>${reviewScores(test)}`;
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
    ? test.form ? 'Objective practice target reached. Finish the writing and speaking review before assessing your preparation.' : `Listening and reading passed. You're on track for ${level.name}.`
    : esc(test.reviewTip);
  const link = ok
    ? `<a class="btn small" href="#/${level.id}/zertifikat">See your certificate</a>`
    : `<a class="btn small" href="#/${level.id}">Back to the ${level.name} lessons</a>`;
  box.innerHTML = `<div class="score"><div><strong class="num">${score}/${test.total}</strong><p>${message}</p>${link}</div></div>`;
  updateEstimate();
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
  if (d.startTimer !== undefined) {
    if (countdown) return;
    const finish = Date.now() + 65 * 60 * 1000;
    button.disabled = true;
    const tick = () => {
      const seconds = Math.max(0, Math.ceil((finish - Date.now()) / 1000));
      document.getElementById('test-timer').textContent = seconds ? ` ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')} remaining` : ' Time finished. Stop writing and review your answers.';
      if (!seconds) { clearInterval(countdown); countdown = null; }
    };
    tick();
    countdown = setInterval(tick, 1000);
    onLeave(() => { clearInterval(countdown); countdown = null; });
  } else if (d.testForm !== undefined) {
    const i = +d.testForm;
    if (`F${i}` in answers) return;
    const input = document.getElementById(`TF${i}`);
    if (!input.value.trim()) { input.focus(); return; }
    const field = test.form.fields[i];
    const ok = field.answers.some(answer => norm(answer) === norm(input.value));
    answers[`F${i}`] = ok;
    logPractice();
    input.disabled = button.disabled = true;
    document.getElementById(`TFfb${i}`).innerHTML = `<div class="fb ${ok ? 'ok' : 'no'}">${ok ? 'Richtig.' : `Answer: ${esc(field.answers[0])}`}</div>`;
    showScoreWhenDone();
  } else if (d.trChoice !== undefined) {
    const i = +d.trChoice;
    if (`R${i}` in answers) return;
    const item = test.reading.groups.flatMap(group => group.items)[i];
    const ok = +d.k === item.answer;
    answers[`R${i}`] = ok;
    logPractice();
    lockOptions(button, o => +o.dataset.k === item.answer);
    if (!ok) button.classList.add('wrong');
    showScoreWhenDone();
  } else if (d.tl !== undefined) {
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

export function onChange(e) {
  if (e.target.id.startsWith('review-')) updateEstimate();
}

export function onKeydown(e) {
  if (e.key === 'Enter' && /^TF\d+$/.test(e.target.id)) {
    e.preventDefault();
    document.querySelector(`[data-test-form="${e.target.id.slice(2)}"]`)?.click();
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
