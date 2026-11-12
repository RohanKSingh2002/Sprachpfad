// Lesson page: grammar table, rules, spoken examples, word list, exercises with instant checking.

import { gradedTasks, pluralText } from "../content.js";
import { LESSON_SENTENCE_COLLECTION, audioPlaybackSpeed, isDone, isStudyPinned, lessonSentence, logPractice, markLessonSentenceSeen, markOpened, recordLesson, savedSentenceCollections, saveSentenceToCollection, sentencePreferences, toggleStudyPin } from "../state.js";
import { playAudioLine, speakerButton, stopAudio } from "../ui/audio.js";
import { downloadOfflineLesson, offlineLessonInfo, offlineSize } from "../offline-study.js";
import { waitBetweenLines } from "../sentence-practice.js";
import { ARROW_ICON } from "../ui/icons.js";
import { toast } from "../ui/toast.js";
import { drawIn, Flip, gsap, motionOK, onLeave, revealOnScroll, shake, splitReveal } from "../ui/motion.js";
import { jumpTo, scrollToCenter } from "../ui/scroll.js";
import { esc, germanDate, norm, shuffle } from "../utils.js";
import { breadcrumb } from "./shared.js";
import { applySentenceStar, copySentence, copySentenceButton, sentenceStars } from "../ui/sentence-controls.js";
import { refreshSentencePrompts } from "../study-language.js";
import { currentGuide, guidedContinue } from "../guided-study.js";

const KIND = {
  choice: "Choose the answer",
  listen: "Listen",
  fill: "Fill the gap",
  order: "Put the words in order",
  write: "Write",
};

let lesson = null; // lesson on screen
let firstTry = {}; // task index → answered right on the first try?
let scoreShown = false;
let guide = null;
let examplePlayback;

function lessonSections(l) {
  const sections = [["lesson-overview", "Overview"], ...(l.examples.length ? [["lesson-examples", "Examples"]] : []),
    ...(l.vocab.length ? [["words-h", "Vocabulary"]] : []), ...(l.tasks.length ? [["ex-h", "Exercises"]] : []),
    ...(l.speaking?.length ? [["speaking-h", "Speaking"]] : [])];
  return `<nav class="lesson-sections" aria-label="Lesson sections">${sections.map(([id, name]) =>
    `<button class="link-btn" type="button" data-lesson-section="${id}">${name}</button>`).join("")}</nav>`;
}

function taskBody(task, i) {
  switch (task.type) {
    case "listen":
    case "choice": {
      const lang = task.englishOptions ? "" : ' lang="de"';
      const player =
        task.type === "listen"
          ? `<div class="row" style="margin:0 0 12px">${speakerButton(task.audioText, 'Play listening exercise')}<span class="muted small">Tap to play. You can replay it.</span></div>`
          : "";
      const options = shuffle(task.options.map((o, k) => ({ o, k })))
        .map(
          ({ o, k }) =>
            `<button class="opt" type="button"${lang} data-mc="${i}" data-k="${k}">${esc(o)}</button>`,
        )
        .join("");
      return `${player}<div class="opts">${options}</div>`;
    }
    case "fill":
      return `<div class="row" style="margin:0"><input class="fill" id="f${i}" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Your answer"><button class="btn small" type="button" data-fill="${i}">Check</button></div>`;
    case "order": {
      const words = task.words.map(word => word === task.neutralStart ? word[0].toLowerCase() + word.slice(1) : word);
      const chips = shuffle(words)
        .map((w) => `<button class="chip" type="button" lang="de" data-chip="${i}" data-word="${esc(w)}">${esc(w)}</button>`)
        .join("");
      return `<div class="built" id="b${i}" aria-label="Your sentence"></div><div class="opts" id="p${i}">${chips}</div>
        <div class="row"><button class="btn small" type="button" data-order="${i}">Check</button><button class="btn small ghost" type="button" data-clear="${i}">Clear</button></div>`;
    }
    case "write":
      return `<textarea id="w${i}" aria-label="Your answer" placeholder="Schreib hier…" data-lenis-prevent></textarea><div class="row"><button class="btn small ghost" type="button" data-write="${i}">Show a model answer</button></div>`;
    default:
      return "";
  }
}

const renderTask = (task, i) =>
  `<div class="task" id="t${i}"><div class="kind">${i + 1}. ${KIND[task.type]}</div>${task.readingText ? `<div class="reading" lang="de">${esc(task.readingText)}</div>` : ""}<div class="q">${esc(task.question)}</div>${taskBody(task, i)}<div id="fb${i}" aria-live="polite"></div></div>`;

function grammarTable({ head, rows }) {
  const th = head.map((h) => `<th scope="col">${esc(h)}</th>`).join("");
  const tr = rows
    .map(
      (r) =>
        `<tr>${r.map((c, k) => (k === 0 ? `<td class="muted">${esc(c)}</td>` : `<td><b>${esc(c)}</b></td>`)).join("")}</tr>`,
    )
    .join("");
  return `<div class="tbl"><table><thead><tr>${th}</tr></thead><tbody>${tr}</tbody></table></div>`;
}

export function render(l) {
  lesson = l;
  firstTry = {};
  scoreShown = false;
  guide = currentGuide();
  const { level } = l;
  const position = level.lessons.indexOf(l);
  const prev = level.lessons[position - 1];
  const next = level.lessons[position + 1];
  const graded = gradedTasks(l).length;
  const collections = savedSentenceCollections();
  const defaultCollection = collections.find(collection => collection.id === LESSON_SENTENCE_COLLECTION);
  const collectionOptions = [
    `<option value="${LESSON_SENTENCE_COLLECTION}">${esc(defaultCollection?.name ?? "Lesson sentences")}</option>`,
    ...collections.filter(collection => collection.id !== LESSON_SENTENCE_COLLECTION).map(collection => `<option value="${esc(collection.id)}">${esc(collection.name)}</option>`),
  ].join("");
  const preferences = sentencePreferences();
  const showTranslation = preferences.translation === true;
  const examples = l.examples.map((example, index) => {
    const item = lessonSentence(l, index);
    return `<article class="shadow-card"><div class="say">${speakerButton(example.de)}<div><div class="de-line" lang="de">${esc(example.de)}</div>
      <div class="en-line" id="shadow-meaning-${index}" data-study-prompt="${esc(example.en)}" lang="en"${showTranslation ? "" : " hidden"}>${esc(example.en)}</div></div></div>
      <div class="shadow-card-actions"><button class="link-btn shadow-reveal" type="button" data-reveal-meaning="${index}" aria-expanded="${showTranslation}" aria-controls="shadow-meaning-${index}">${showTranslation ? "Hide meaning" : "Try to recall the meaning"}</button>
      <button class="link-btn" type="button" data-save-example="${index}">Save sentence</button>${copySentenceButton(example.de)}
      ${item ? sentenceStars(item.id, preferences.mode === "listen" ? "listen" : "recall") : ""}</div></article>`;
  }).join("");
  const words = l.vocab
    .map((w) => {
      const pl = pluralText(w);
      const plural = pl ? `<small class="pl"${w.pl.length > 2 ? ' lang="de"' : ""}>${esc(pl)}</small>` : "";
      return `<div><span class="w"><span lang="de">${esc(w.de)}</span>${plural}</span><span>${esc(w.en)}</span></div>`;
    })
    .join("");
  const back = prev
    ? `<a class="btn ghost" href="#/${level.id}/lektion/${prev.id}">Lesson ${prev.position}</a>`
    : "<span></span>";
  const forward = next
    ? `<a class="btn btn-go" href="#/${level.id}/lektion/${next.id}">Lesson ${next.position}${ARROW_ICON}</a>`
    : `<a class="btn btn-go" href="#/${level.id}/test">${level.name} mock test${ARROW_ICON}</a>`;
  const studyDone = guide && !wantsExercises() ? `<div class="panel study-guide-end"><p>When you’re ready, continue your guided session.</p>${guidedContinue(guide)}</div>` : "";
  const exercisesDone = guide && wantsExercises() && isDone(l) ? `<p>These exercises are already complete.</p>${guidedContinue(guide)}` : "";
  return `
  ${breadcrumb(level, `Lesson ${l.position}`)}
  <header class="lesson-head"><h1 id="lesson-overview" lang="de">${esc(l.germanTitle)}</h1><div class="en">${esc(l.title)}</div><button class="link-btn" type="button" data-pin-lesson aria-pressed="${isStudyPinned(l.key)}">${isStudyPinned(l.key) ? "★ Lesson favorited" : "☆ Favorite lesson"}</button></header>
  ${lessonSections(l)}
  <p class="intro">${esc(l.intro)}</p>
  ${l.outcomes ? `<div class="panel course-outcomes"><a class="tlink" href="#/${level.id}/roadmap">Module ${l.module} · Course roadmap</a><h2 class="h3">What you will practise</h2><ul>${l.outcomes.map((goal) => `<li>${esc(goal)}</li>`).join("")}</ul><p class="muted small"><b>Pronunciation:</b> ${esc(l.pronunciation)}</p></div>` : ""}
  <div class="lesson-grid">
    <div class="panel spot">${grammarTable(l.table)}</div>
    ${l.tables ? l.tables.map(table => `<div class="panel"><h2>${esc(table.title)}</h2>${grammarTable(table)}</div>`).join('') : ''}
    ${l.pronunciationDrills ? `<section class="panel course-pronunciation"><h2>Listen and practise pronunciation</h2><p class="muted">Listen, repeat after a pause, then say the phrase without reading. Ask a partner which word or detail they understood.</p>${l.pronunciationDrills.map(drill => `<div class="say">${speakerButton(drill.text)}<div><b>${esc(drill.label)}</b><div class="de-line" lang="de">${esc(drill.text)}</div><p class="muted small">${esc(drill.instruction)}</p></div></div>`).join('')}</section>` : ''}
    <div class="panel spot"><h2 class="h3">Remember</h2><ul class="rules">${l.rules.map((r) => `<li>${esc(r)}</li>`).join("")}</ul></div>
  </div>
  <div class="panel spot say-panel"><h2 class="h3" id="lesson-examples">Listen, repeat, recall</h2><p class="muted small">Listen to each sentence and repeat it aloud. Then try to recall its meaning before revealing the translation.</p>
    <div class="lesson-example-tools">
      ${examples ? `<button class="btn small" type="button" data-play-examples>Play examples</button>
      <a class="btn small ghost" href="#/sentences?lesson=${l.key}&amp;start=1">Practise these sentences</a>` : ""}
      <button class="btn small ghost" type="button" data-download-lesson>Download lesson</button>
      <a class="link-btn" href="#/settings?section=audio" aria-label="Open audio playback settings">Speed <span data-current-audio-speed>${audioPlaybackSpeed()}×</span></a>
    </div>
    <p class="small muted" data-lesson-download-status role="status"></p>
    <div class="lesson-sentence-save"><label for="lesson-sentence-collection">Save to</label><select id="lesson-sentence-collection">${collectionOptions}</select>
    <a href="#/sentences?lesson=${l.key}">Open sentence practice settings</a></div>
    <p class="small muted shadow-progress" id="shadow-progress" aria-live="polite">${showTranslation ? l.examples.length : 0} of ${l.examples.length} meanings revealed</p>
    <div class="ex-list sentence-size-${preferences.textSize}">${examples}</div></div>
  <section class="lesson-words" aria-labelledby="words-h">
    <h2 class="words-h" id="words-h" tabindex="-1">Words from this lesson</h2>
    <p class="muted">Read the words and their meanings before you start. You can refer back to this list during the exercises.</p>
    <div class="vocab">${words}</div>
  </section>
  ${studyDone}
  <section class="exercises" aria-labelledby="ex-h">
    <div class="lprog"><span id="lprog-txt" class="num">0 of ${graded} answered</span><span class="bar" aria-hidden="true"><i id="lprog-bar"></i></span></div>
    <h2 id="ex-h">Exercises</h2>
    <p class="muted">Your first try on each one counts toward your score.</p>
    <button class="btn small ghost" type="button" data-lesson-words>Review lesson words</button>
    ${l.tasks.map(renderTask).join("")}
    <div id="scorebox" aria-live="polite">${exercisesDone}</div>
  </section>
  ${l.speaking ? `<section class="course-speaking" aria-labelledby="speaking-h"><h2 id="speaking-h">Speak and interact</h2><p class="muted">Try the task before revealing the example. Invent the personal details and practise both roles with a partner.</p>${l.speaking.map((s, i) => `<div class="task"><div class="q">${esc(s.task)}</div><button type="button" class="btn small ghost" data-speech-model="${i}">Show and hear an example</button><div id="speech-model-${i}"></div><ul class="check-list">${s.checklist.map((item) => `<li><label><input type="checkbox">${esc(item)}</label></li>`).join("")}</ul></div>`).join("")}<p class="muted small">Writing and speaking need feedback. Your objective exercise score does not measure pronunciation or spoken interaction.</p></section>` : ""}
  ${guide ? "" : `<div class="pager">${back}${forward}</div>`}`;
}

function updateProgress() {
  const graded = gradedTasks(lesson);
  const answered = graded.filter((i) => i in firstTry).length;
  document.getElementById("lprog-txt").textContent = `${answered} of ${graded.length} answered`;
  document.getElementById("lprog-bar").style.width = `${(answered / graded.length) * 100}%`;
}

/** Show feedback for task i; only the first answer counts toward the score. */
function mark(i, ok, hint, answer, el) {
  if (!(i in firstTry)) {
    firstTry[i] = ok;
    logPractice();
  }
  const fb = document.getElementById(`fb${i}`);
  fb.innerHTML = ok
    ? `<div class="fb ok">Richtig. ${esc(hint || "")}</div>`
    : `<div class="fb no">Not quite.${answer ? ` Answer: <b>${esc(answer)}</b>.` : ""} ${esc(hint || "")}</div>`;
  if (motionOK()) {
    // the note slides open, pushing the next exercise down smoothly instead of jumping
    gsap.from(fb.firstChild, {
      height: 0,
      marginTop: 0,
      paddingTop: 0,
      paddingBottom: 0,
      opacity: 0,
      duration: 0.45,
      ease: "expo.out",
      clearProps: "all",
    });
    if (el) {
      if (ok)
        gsap.fromTo(
          el,
          { scale: 0.94 },
          { scale: 1, duration: 0.5, ease: "back.out(3)", clearProps: "transform" },
        );
      else shake(el);
    }
  }
  updateProgress();
  showScoreWhenDone();
}

function showScoreWhenDone() {
  const graded = gradedTasks(lesson);
  if (scoreShown || graded.some((i) => !(i in firstTry))) return;
  scoreShown = true;
  const score = graded.filter((i) => firstTry[i]).length;
  const total = graded.length;
  const queued = recordLesson(lesson, score);
  const message =
    (score === total ? "Every answer right on the first try." : "Redo the ones you missed tomorrow.") +
    (queued ? ` ${queued} ${queued === 1 ? "word joined" : "words joined"} your vocabulary review queue.` : "");
  const box = document.getElementById("scorebox");
  // With motion on, the visible number counts up; screen readers (this is a live region) get the
  // real score straight away.
  const number = motionOK()
    ? `<span aria-hidden="true">0/${total}</span><span class="sr">${score}/${total}</span>`
    : `${score}/${total}`;
  const actions = guide ? (wantsExercises() ? guidedContinue(guide) : "") :
    `<a class="btn small" href="#/karten?l=${lesson.key}">Practise these words</a><a class="btn small ghost" href="#/sentences">Open sentence review</a>`;
  box.innerHTML = `<div class="score"><div><strong class="num" id="scoreNum">${number}</strong><p>Lesson ${lesson.position}: objective exercises complete. ${message}</p><div class="sentence-actions">${actions}</div></div><div class="stamp" id="stamp" aria-hidden="true">Erledigt<small>${germanDate(new Date(), true)}</small></div></div>`;
  if (motionOK()) {
    const counter = { v: 0 };
    const digits = document.getElementById("scoreNum").firstChild;
    const tl = gsap.timeline();
    tl.from(box.firstChild, { y: 24, scale: 0.98, opacity: 0, duration: 0.7, ease: "expo.out" })
      .to(
        counter,
        {
          v: score,
          duration: 0.9,
          ease: "power2.out",
          onUpdate: () => {
            digits.textContent = `${Math.round(counter.v)}/${total}`;
          },
        },
        "<.1",
      )
      .from(
        "#stamp",
        { scale: 2.4, opacity: 0, rotation: -28, duration: 0.42, ease: "back.out(1.8)" },
        ">-.1",
      );
    onLeave(() => tl.kill());
  }
  scrollToCenter(box);
}

/** Move word chips between the pool and the sentence, gliding them into place when motion is on. */
function moveChips(i, chips, target) {
  const all = document.querySelectorAll(`#t${i} .chip`);
  const labels = () => {
    const built = document.getElementById(`b${i}`);
    all.forEach(chip => {
      const word = chip.dataset.word;
      chip.textContent = chip === built.firstElementChild ? word[0].toUpperCase() + word.slice(1) : word;
    });
  };
  if (motionOK() && Flip) {
    const state = Flip.getState(all);
    chips.forEach((c) => target.appendChild(c));
    labels();
    Flip.from(state, { duration: 0.32, ease: "power2.out" });
  } else {
    chips.forEach((c) => target.appendChild(c));
    labels();
  }
}

export function onClick(e, button) {
  if (!button || !lesson) return;
  const d = button.dataset;
  if (d.lessonSection) {
    const heading = document.getElementById(d.lessonSection);
    if (heading) { heading.tabIndex = -1; heading.focus({ preventScroll: true }); jumpTo(heading); }
    return;
  }
  if (d.playExamples !== undefined) { void playExamples(button); return; }
  if (d.downloadLesson !== undefined) { void downloadLesson(button); return; }
  if (d.starId) { applySentenceStar(button); return; }
  if (d.copySentence) { void copySentence(d.copySentence); return; }
  if (d.pinLesson !== undefined) {
    const pinned = toggleStudyPin(lesson.key);
    button.setAttribute("aria-pressed", String(pinned));
    button.textContent = pinned ? "★ Lesson favorited" : "☆ Favorite lesson";
    return;
  }
  if (d.lessonWords !== undefined) {
    const heading = document.getElementById("words-h");
    heading?.focus({ preventScroll: true });
    jumpTo(heading);
  } else if (d.revealMeaning !== undefined) {
    const i = +d.revealMeaning;
    const meaning = document.getElementById(`shadow-meaning-${i}`);
    const reveal = meaning.hidden;
    meaning.hidden = !reveal;
    if (reveal) markLessonSentenceSeen(lesson, i);
    button.setAttribute("aria-expanded", String(reveal));
    button.textContent = reveal ? "Hide meaning" : "Try to recall the meaning";
    const count = lesson.examples.filter((_, index) => !document.getElementById(`shadow-meaning-${index}`).hidden).length;
    document.getElementById("shadow-progress").textContent = `${count} of ${lesson.examples.length} meanings revealed`;
  } else if (d.saveExample !== undefined) {
    const sentence = lessonSentence(lesson, +d.saveExample);
    const collectionId = document.getElementById("lesson-sentence-collection")?.value || LESSON_SENTENCE_COLLECTION;
    const result = sentence && saveSentenceToCollection(collectionId, sentence);
    toast(result?.limit ? "Your collections have reached the 200 sentence limit. Remove a sentence before adding another."
      : !result ? "This example needs both a German sentence and an English prompt."
      : result.added ? "Sentence saved to your collection and review queue." : "That sentence is already in this collection.");
  } else if (d.speechModel !== undefined) {
    const s = lesson.speaking[+d.speechModel];
    document.getElementById(`speech-model-${d.speechModel}`).innerHTML = `<div class="fb info"><span lang="de">${esc(s.modelAnswer)}</span> ${speakerButton(s.modelAnswer)}</div>`;
  } else if (d.mc !== undefined) {
    const i = +d.mc;
    const task = lesson.tasks[i];
    const box = document.getElementById(`t${i}`);
    box.querySelectorAll(".opt").forEach((o) => o.classList.remove("wrong"));
    const ok = +d.k === task.answer;
    button.classList.add(ok ? "right" : "wrong");
    if (ok)
      box.querySelectorAll(".opt").forEach((o) => {
        o.disabled = true;
      });
    mark(i, ok, task.hint, "", button);
  } else if (d.fill !== undefined) {
    const i = +d.fill;
    const task = lesson.tasks[i];
    const input = document.getElementById(`f${i}`);
    if (!input.value.trim()) {
      input.focus();
      shake(input);
      return;
    }
    const ok = task.answers.some((a) => norm(a) === norm(input.value));
    input.classList.toggle("is-ok", ok);
    input.classList.toggle("is-no", !ok);
    if (ok) {
      input.disabled = true;
      button.disabled = true;
    }
    mark(i, ok, task.hint, ok ? "" : task.answers[0], input);
  } else if (d.chip !== undefined) {
    const built = document.getElementById(`b${d.chip}`);
    const pool = document.getElementById(`p${d.chip}`);
    moveChips(d.chip, [button], button.parentElement === built ? pool : built);
  } else if (d.clear !== undefined) {
    moveChips(
      d.clear,
      [...document.getElementById(`b${d.clear}`).children],
      document.getElementById(`p${d.clear}`),
    );
  } else if (d.order !== undefined) {
    // Any sentence in `answers` is accepted; the first one is shown when the answer is wrong.
    const i = +d.order;
    const task = lesson.tasks[i];
    const built = document.getElementById(`b${i}`);
    const sentence = [...built.children].map((c) => c.textContent).join(" ");
    if (!sentence) {
      shake(built);
      return;
    }
    const ok = task.answers.some((a) => norm(a) === norm(sentence));
    if (ok)
      document.querySelectorAll(`#t${i} .chip, #t${i} [data-order], #t${i} [data-clear]`).forEach((x) => {
        x.disabled = true;
      });
    const shownAnswer = task.answers[0] + (/question/i.test(task.question) ? "?" : ".");
    mark(i, ok, task.hint, ok ? "" : shownAnswer, built);
  } else if (d.write !== undefined) {
    const task = lesson.tasks[+d.write];
    document.getElementById(`fb${d.write}`).innerHTML =
      `<div class="fb info"><b>Model:</b> <span lang="de" style="white-space:pre-line">${esc(task.modelAnswer)}</span> ${speakerButton(task.modelAnswer)}</div>`;
  }
}

/** Enter in a gap checks the answer. */
export function onKeydown(e) {
  if (e.key !== "Enter" || !e.target.classList?.contains("fill")) return;
  const check = document.querySelector(`[data-fill="${e.target.id.slice(1)}"]`);
  if (check && !check.disabled) check.click();
}

/* ---------- motion: calm, so studying stays easy ---------- */

/** Today's session links straight to a lesson's exercises with ?part=exercises. */
const wantsExercises = () =>
  new URLSearchParams(location.hash.split("?")[1] || "").get("part") === "exercises";

export function mount() {
  markOpened(lesson);
  refreshSentencePrompts(document.querySelector(".say-panel"));
  void showDownload(document.querySelector("[data-download-lesson]"), lesson.key);
  if (wantsExercises()) jumpTo(document.querySelector(".exercises"));
  if (new URLSearchParams(location.hash.split("?")[1] || "").get("part") === "examples") jumpTo(document.getElementById("lesson-examples"));
  if (!motionOK()) return;
  splitReveal(document.querySelector(".lesson-head h1"), { duration: 0.9 });
  drawIn(document.querySelector(".lesson-head"));
  const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
  tl.from(".crumb", { autoAlpha: 0, y: 8, duration: 0.6 }, 0)
    .from(".lesson-head .en", { autoAlpha: 0, y: 10, duration: 0.7 }, 0.12)
    .from(".intro", { autoAlpha: 0, y: 14, duration: 0.8 }, 0.18)
    .from(
      ".lesson-grid > .panel",
      { autoAlpha: 0, y: 22, duration: 0.9, stagger: 0.08, clearProps: "transform" },
      0.22,
    )
    .from(".tbl tbody tr", { autoAlpha: 0, x: -8, duration: 0.6, stagger: 0.035 }, 0.45)
    .from(".rules li", { autoAlpha: 0, y: 8, duration: 0.6, stagger: 0.05 }, 0.45);
  onLeave(() => tl.kill());
  revealOnScroll(".say-panel, .exercises > h2, .exercises > .muted, .words-h, .pager", { y: 18 });
  revealOnScroll(".exercises .task", { y: 20, stagger: 0.08 });
  revealOnScroll(".vocab > div", { y: 10, stagger: 0.025 });
}

function stopExamples() {
  if (!examplePlayback) return;
  examplePlayback.abort();
  examplePlayback = undefined;
  stopAudio();
}

async function playExamples(button) {
  if (examplePlayback) { stopExamples(); button.textContent = "Play examples"; return; }
  const player = examplePlayback = new AbortController();
  const lines = lesson.examples.filter(item => item.de);
  button.textContent = "Stop examples";
  try {
    for (const item of lines) {
      if (player.signal.aborted || !await playAudioLine(item.de, button)) break;
      await waitBetweenLines(0.5, player.signal);
    }
  } finally {
    if (examplePlayback === player) {
      examplePlayback = undefined;
      button.textContent = "Play examples";
    }
  }
}

async function showDownload(button, key) {
  if (!button) return;
  const note = button.closest(".say-panel").querySelector("[data-lesson-download-status]");
  try {
    const info = await offlineLessonInfo(key);
    if (!button.isConnected || !info) return;
    button.textContent = "Downloaded";
    button.disabled = true;
    note.textContent = `Ready offline on this device · ${offlineSize(info.bytes)} of audio`;
  } catch { /* The download button will report storage issues when used. */ }
}

async function downloadLesson(button) {
  const current = lesson;
  const note = button.closest(".say-panel").querySelector("[data-lesson-download-status]");
  button.disabled = true;
  note.textContent = "Downloading the lesson and its recordings…";
  try {
    await downloadOfflineLesson(current);
    await showDownload(button, current.key);
  } catch (error) {
    note.textContent = navigator.onLine ? error.message : "Connect to the internet to download this lesson.";
  } finally {
    if (button.textContent !== "Downloaded") button.disabled = false;
  }
}

export function unmount() { stopExamples(); }
