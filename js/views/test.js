// Mock test for one level: listening and reading are scored, writing and speaking are self-checked.

import { audioPlaybackSpeed, logPractice, recordTest } from "../state.js";
import { speakerButton, stopAudio } from "../ui/audio.js";
import { slidePill } from "../ui/effects.js?v=20261113-polish1";
import { enter, gsap, motionOK, onLeave, shake, splitReveal } from "../ui/motion.js?v=20261113-polish1";
import { jumpTo, scrollToCenter } from "../ui/scroll.js?v=20261113-polish1";
import { esc, norm } from "../utils.js";
import { refreshInterface } from "../study-language.js";
import { breadcrumb, levelSwitch } from "./shared.js";

let level = null; // level whose test is on screen
let answers = {}; // "L0", "R2"… → answered correctly?
let countdown = null;
let rehearsal = false;
let attemptStarted = false;
let plays = [];
const pendingAudio = new Set();
const SECTIONS = ["Listening", "Reading", "Writing", "Speaking"];
const playLimit = item => Number.isInteger(item.plays) && item.plays > 0 ? item.plays : 2;

export function teacherContext() {
  const waiting = attemptStarted && rehearsal && Object.keys(answers).length < level.test.total;
  return { label: `${level.name} mock test`, mode: waiting ? 'locked' : 'study', text: waiting ? '' : 'German mock test. Explain general skills, exam vocabulary and grammar.' };
}

function listeningPart(test) {
  return test.listening
    .map(
      (item, i) => `<div class="task" id="L${i}"><div class="kind">${item.part ? `Part ${item.part} · ` : ""}Text ${i + 1}${item.plays ? ` · rehearsal: ${item.plays === 1 ? "one play" : "two plays"}` : ""}</div>
      <div class="row" style="margin:0 0 10px">${speakerButton(item.audioText, `Play listening text ${i + 1}`).replace('<button ', `<button data-test-listen="${i}" `)}<span class="muted small" id="test-plays-${i}">Play, then answer.</span></div>
      <div class="q"${test.form ? ' lang="de"' : ""}>${esc(item.question)}</div>
      <div class="opts">${item.options.map((o, k) => `<button class="opt" type="button"${test.form ? ' lang="de"' : ""} data-tl="${i}" data-k="${k}">${esc(o)}</button>`).join("")}</div>
      <div id="Lfb${i}"></div></div>`,
    )
    .join("");
}

function readingPart(test) {
  if (test.reading.groups) {
    let index = 0;
    return test.reading.groups.map(group => {
      let previousText = group.text || '';
      return `<h3>${esc(group.title)}</h3>${group.text ? `<div class="reading" lang="de">${esc(group.text)}</div>` : ""}${group.items.map(item => {
      const i = index++;
      const passage = item.text && item.text !== previousText ? `<div class="reading" lang="de">${esc(item.text)}</div>` : '';
      if (item.text) previousText = item.text;
      return `<div class="task">${passage}<div class="q" lang="de">${esc(item.question)}</div><div class="opts">${item.options.map((option, k) => `<button class="opt" type="button" lang="de" data-tr-choice="${i}" data-k="${k}">${esc(option)}</button>`).join("")}</div></div>`;
    }).join("")}`;
    }).join("");
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
      (s, i) => `<div class="task"><div class="q">${esc(s.task)}</div>${s.card ? `<div class="speaking-card" lang="de" aria-label="Speaking card">${esc(s.card)}</div>` : ""}
      <div class="row"><button class="btn small ghost" type="button" data-tsm="${i}">Show model</button></div>
      <div id="Sfb${i}"></div></div>`,
    )
    .join("");
}

export function render(lv) {
  level = lv;
  answers = {};
  rehearsal = false;
  attemptStarted = false;
  plays = [];
  pendingAudio.clear();
  const { test } = lv;
  return `
  ${breadcrumb(lv, "Mock test")}
  <div class="page-head"><h1>${lv.name} mock test</h1>${levelSwitch(lv, "/test", "Choose a mock test")}</div>
  <p class="muted">${test.form ? `Original A1 preparation assessment. Listening, reading and form completion are checked automatically (${test.total} items); short-message writing and speaking require feedback. Aim for ${test.passMark}/${test.total} in objective practice.` : `Four parts in the shape of a ${lv.name} exam. Original practice questions, not official exam material. Score ${test.passMark} of ${test.total} or more in listening and reading to earn your ${lv.name} practice certificate.`}</p>
  <section class="panel test-setup" id="test-setup" aria-labelledby="test-setup-title">
    <h2 id="test-setup-title" tabindex="-1">Before you start</h2><p class="muted">Pick how you want to take this attempt.</p>
    <fieldset class="test-setup-field"><legend>Mode</legend><div class="setting-segments">
      <label><input type="radio" name="test-mode" value="practice" checked><span>Practice</span></label>
      <label><input type="radio" name="test-mode" value="rehearsal"><span>Rehearsal</span></label>
    </div></fieldset>
    <div class="setting-row"><div><strong>Written-practice timer</strong>
      <p>${test.form ? "65 minutes for this A1 practice paper." : "Choose a timer for this practice paper."}</p></div>
      <label class="setting-switch-label"><input class="setting-switch" type="checkbox" id="test-use-timer" aria-label="Use written-practice timer"><span>Use timer</span></label>
    </div>
    ${test.form ? "" : '<label class="test-timer-length" id="test-timer-length" hidden>Timer minutes <input type="number" id="test-timer-minutes" min="1" max="240" value="60" required></label>'}
    <div class="setting-row"><div><strong>Listening playback</strong><p id="test-mode-note">Replay as needed and see transcripts after answering.</p></div></div>
    <div class="setting-row"><div><strong>Audio speed</strong><p><span data-current-audio-speed>${audioPlaybackSpeed()}×</span> · From your global setting</p></div>
      <button class="btn small ghost" type="button" data-reset-audio-speed>Reset to 1×</button></div>
    <button class="btn" type="button" data-start-test>Start practice</button>
  </section>
  <div id="test-attempt" hidden>
    <div class="test-attempt-tools">
      <nav class="lesson-sections" aria-label="Test sections">${SECTIONS.map((label, i) =>
        `<button type="button" class="link-btn" data-test-section="t${i+1}">${label}</button>`).join("")}</nav>
      <p><span id="test-unanswered">${test.total} objective questions unanswered</span><span id="test-timer" class="num" role="timer" aria-live="off"></span></p>
      <button class="link-btn" type="button" data-new-test>Start a new attempt</button>
    </div>
  <section class="test-sec" aria-labelledby="t1"><h2 id="t1">1. Listening</h2>${listeningPart(test)}</section>
  <section class="test-sec" aria-labelledby="t2"><h2 id="t2">2. Reading</h2>${readingPart(test)}</section>
  <section class="test-sec" aria-labelledby="t3"><h2 id="t3">3. Writing</h2>${formPart(test)}${writingPart(test)}</section>
  <section class="test-sec" aria-labelledby="t4"><h2 id="t4">4. Speaking</h2>
    <p class="muted">Say your answer out loud first, then listen to the model.</p>${speakingPart(test)}</section>
  <div id="testscore" aria-live="polite"></div>${reviewScores(test)}</div>`;
}

function startTimer(minutes) {
  const finish = Date.now() + minutes * 60 * 1000;
  const timer = document.getElementById("test-timer");
  const tick = () => {
    const seconds = Math.max(0, Math.ceil((finish - Date.now()) / 1000));
    timer.textContent = seconds ? ` · ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")} remaining` : " · Time finished";
    if (!seconds) clearInterval(countdown);
  };
  tick();
  countdown = setInterval(tick, 1000);
}

function startAttempt() {
  if (attemptStarted) return;
  const useTimer = document.getElementById("test-use-timer").checked;
  const time = document.getElementById("test-timer-minutes");
  if (useTimer && time && !time.reportValidity()) { time.focus(); return; }
  rehearsal = document.querySelector('[name="test-mode"]:checked').value === "rehearsal";
  attemptStarted = true;
  document.getElementById("test-setup").hidden = true;
  document.getElementById("test-attempt").hidden = false;
  document.querySelectorAll('[data-tsm], [data-tmodel]').forEach(button => { button.disabled = rehearsal; });
  level.test.listening.forEach((item, i) => {
    if (rehearsal) document.getElementById(`test-plays-${i}`).textContent = `${playLimit(item)} ${playLimit(item) === 1 ? "play" : "plays"} remaining`;
  });
  if (useTimer) startTimer(time?.valueAsNumber ?? 65);
  focusTestSection("t1");
}

function focusTestSection(id) {
  const heading = document.getElementById(id);
  heading.tabIndex = -1;
  heading.focus({ preventScroll: true });
  jumpTo(heading);
}

/** Once every listening and reading item is answered, show the score and save the best result. */
function showScoreWhenDone() {
  const { test } = level;
  const unanswered = test.total - Object.keys(answers).length;
  document.getElementById("test-unanswered").textContent = unanswered ? `${unanswered} objective questions unanswered` : "Objective questions complete";
  if (unanswered > 0) return;
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
  if (rehearsal) {
    document.querySelectorAll('[data-tsm], [data-tmodel]').forEach(button => { button.disabled = false; });
    test.listening.forEach((item, i) => {
      document.getElementById(`Lfb${i}`).innerHTML = `<div class="fb info">Transcript: <span lang="de">${esc(item.audioText)}</span></div>`;
    });
  }
  if (motionOK())
    gsap.from(box.firstChild, { y: 10, scale: 0.99, opacity: 0, duration: 0.46, ease: "power3.out" });
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
  if (d.startTest !== undefined) { startAttempt(); return; }
  if (d.newTest !== undefined) {
    if (!confirm("Start a new attempt? Answers in this attempt will be cleared. Your best saved result stays.")) return;
    unmount();
    const app = document.getElementById("app");
    app.innerHTML = render(level);
    refreshInterface(app);
    mount(level, { sameKind: true });
    focusTestSection("test-setup-title");
    return;
  }
  if (d.testSection) { focusTestSection(d.testSection); return; }
  if (!attemptStarted) return;
  if (d.testForm !== undefined) {
    const i = +d.testForm;
    if (`F${i}` in answers) return;
    const input = document.getElementById(`TF${i}`);
    if (!input.value.trim()) { input.focus(); return; }
    const field = test.form.fields[i];
    const normalise = field.match === 'exact' ? value => value.trim().toLowerCase() : norm;
    const ok = field.answers.some(answer => normalise(answer) === normalise(input.value));
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
    document.getElementById(`Lfb${i}`).innerHTML = rehearsal
      ? '<div class="fb info">Answer recorded. Review the transcript after the objective questions.</div>'
      : `<div class="fb info">Transcript: <span lang="de">${esc(item.audioText)}</span></div>`;
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
      `<div class="fb info"><p lang="de">${esc(test.speaking[+d.tsm].modelAnswer)}</p>${speakerButton(test.speaking[+d.tsm].modelAnswer)}</div>`;
  }
}

export function onChange(e) {
  if (e.target.name === "test-mode") {
    const selected = e.target.value === "rehearsal";
    document.querySelector("[data-start-test]").textContent = selected ? "Start rehearsal" : "Start practice";
    document.getElementById("test-mode-note").textContent = selected
      ? `${level.test.form ? "Each listening item has a set number of plays." : "Each listening item has two plays."} Models and transcripts stay hidden until the objective questions are complete.`
      : "Replay as needed and see transcripts after answering.";
    refreshInterface(document.getElementById("test-setup"));
  }
  if (e.target.id === "test-use-timer") {
    const field = document.getElementById("test-timer-length");
    if (field) field.hidden = !e.target.checked;
  }
  if (e.target.id.startsWith('review-')) updateEstimate();
}

export function onAudioPlay(button) {
  if (button.dataset.testListen === undefined) return;
  const i = +button.dataset.testListen;
  if (!attemptStarted || pendingAudio.has(i) || (rehearsal && (plays[i] || 0) >= playLimit(level.test.listening[i]))) return false;
  pendingAudio.add(i);
  button.disabled = true;
}

export function audioSegments(button) {
  return level.test.listening[Number(button.dataset.testListen)]?.segments;
}

export function onAudioStarted(button, started) {
  if (button.dataset.testListen === undefined) return;
  const i = +button.dataset.testListen;
  pendingAudio.delete(i);
  if (started) plays[i] = (plays[i] || 0) + 1;
  const remaining = playLimit(level.test.listening[i]) - (plays[i] || 0);
  button.disabled = rehearsal && remaining <= 0;
  if (rehearsal) document.getElementById(`test-plays-${i}`).textContent = `${remaining} ${remaining === 1 ? 'play' : 'plays'} remaining`;
}

export function onKeydown(e) {
  if (e.key === 'Enter' && /^TF\d+$/.test(e.target.id)) {
    e.preventDefault();
    document.querySelector(`[data-test-form="${e.target.id.slice(2)}"]`)?.click();
  }
}

/** Switching level on the test page is animated by this page itself (see router.js). */
export const updatesInPlace = true;
export function unmount() {
  clearInterval(countdown);
  countdown = null;
  stopAudio();
}

export function mount(lv, { sameKind } = {}) {
  slidePill(document.querySelector(".page-head .lvswitch"), "test-levels", { animate: !!sameKind });
  if (!motionOK()) return;
  if (sameKind) {
    enter("#app > h1, .page-head h1, #app > .muted", { y: 12, duration: 0.6, stagger: 0.05 });
    return;
  }
  splitReveal(document.querySelector(".page-head h1"), { duration: 0.62 });
  const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
  tl.from(".crumb", { autoAlpha: 0, y: 5, duration: 0.34 }, 0)
    .from(".page-head .lvswitch", { autoAlpha: 0, y: 6, duration: 0.38 }, 0.04)
    .from("#app > .muted", { autoAlpha: 0, y: 8, duration: 0.42 }, 0.08);
  onLeave(() => tl.kill());
}
