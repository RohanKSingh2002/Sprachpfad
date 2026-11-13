// Lesson page: grammar table, rules, spoken examples, word list, exercises with instant checking.

import { gradedTasks, pluralText } from "../content.js";
import { LESSON_SENTENCE_COLLECTION, audioPlaybackSpeed, isDone, isStudyPinned, lessonSentence, logPractice, markLessonSentenceSeen, markOpened, recordLesson, savedSentenceCollections, saveSentenceToCollection, sentencePreferences, sitePreferences, toggleStudyPin } from "../state.js";
import { lessonMistakes, lessonScorecard, saveLessonMistake, saveLessonScorecard } from "../practice-progress.js";
import { playAudioLine, speakerButton, stopAudio } from "../ui/audio.js";
import { downloadOfflineLesson, offlineLessonInfo, offlineSize } from "../offline-study.js";
import { waitBetweenLines } from "../sentence-practice.js";
import { ARROW_ICON } from "../ui/icons.js";
import { toast } from "../ui/toast.js";
import { drawIn, Flip, gsap, motionOK, onLeave, revealOnScroll, shake, splitReveal } from "../ui/motion.js?v=20261113-polish1";
import { jumpTo, scrollToCenter } from "../ui/scroll.js?v=20261113-polish1";
import { esc, germanDate, norm, shuffle } from "../utils.js";
import { breadcrumb } from "./shared.js";
import { applySentenceStar, copySentence, copySentenceButton, sentenceStars } from "../ui/sentence-controls.js";
import { refreshInterface, refreshSentencePrompts } from "../study-language.js";
import { currentGuide, guidedContinue } from "../guided-study.js";

const KIND = {
  choice: "Choose the answer",
  listen: "Listen",
  fill: "Fill the gap",
  order: "Put the words in order",
  write: "Write",
};

let lesson = null; // lesson on screen
let firstTry = {};
let scoreShown = false;
let exerciseIndex = null;
let retry = null;
let missed = [];
let guide = null;
let lessonPlayback;
let feedbackAudio;

function lessonSections(l, dialogue) {
  const sections = [["lesson-overview", "Overview"], ...(l.examples.length ? [["lesson-examples", "Examples"]] : []),
    ...(dialogue ? [["lesson-dialogue", "Dialogue"]] : []),
    ...(l.vocab.length ? [["words-h", "Vocabulary"]] : []), ...(l.tasks.length ? [["ex-h", "Exercises"]] : []),
    ...(l.speaking?.length ? [["speaking-h", "Speaking"]] : [])];
  return `<nav class="lesson-sections" aria-label="Lesson sections">${sections.map(([id, name]) =>
    `<button class="link-btn" type="button" data-lesson-section="${id}">${name}</button>`).join("")}</nav>`;
}

function dialoguePanel({ title, lines }, showTranslation) {
  return `<section class="panel lesson-dialogue" aria-labelledby="lesson-dialogue">
    <h2 class="h3" id="lesson-dialogue">${esc(title)}</h2>
    <p class="small muted">Listen to the conversation, then say one speaker’s lines aloud.</p>
    <div class="lesson-dialogue-tools">
      <button type="button" class="btn small" data-play-dialogue>Play dialogue</button>
      <label><input type="checkbox" data-dialogue-translation aria-controls="dialogue-lines"${showTranslation ? ' checked' : ''}> <span>Show English translation</span></label>
    </div>
    <ol class="dialogue-lines" id="dialogue-lines">${lines.map(({ de, en }, index) => {
      const speaker = index % 2 ? 'B' : 'A';
      return `<li><span class="dialogue-speaker" aria-hidden="true">${speaker}</span>
        <div><span class="sr">Speaker ${speaker}</span><p lang="de">${esc(de)}</p><p class="small muted" lang="en" data-dialogue-meaning${showTranslation ? '' : ' hidden'}>${esc(en)}</p></div>
        ${speakerButton(de, `Play line ${index + 1}`, undefined, { alternate: index % 2 === 1 })}</li>`;
    }).join('')}</ol>
    <p class="small muted" data-dialogue-audio-status role="status"></p>
  </section>`;
}

function taskBody(task, i, prefix) {
  switch (task.type) {
    case "listen":
    case "choice": {
      const lang = task.englishOptions ? "" : ' lang="de"';
      const player =
        task.type === "listen"
          ? `<div class="row" style="margin:0 0 12px">${speakerButton(task.audioText, 'Play listening exercise')}<button type="button" class="btn small ghost" data-say="${esc(task.audioText)}" data-say-slower>Play slower</button></div>`
          : "";
      const options = shuffle(task.options.map((o, k) => ({ o, k })))
        .map(
          ({ o, k }) =>
            `<button class="opt" type="button"${lang} data-mc="${i}" data-k="${k}" aria-pressed="false">${esc(o)}</button>`,
        )
        .join("");
      return `${player}<div class="opts" role="group" aria-label="Choose an answer">${options}</div><div class="row"><button class="btn small" type="button" data-check-choice="${i}" disabled>Check</button></div>`;
    }
    case "fill":
      return `<div class="row" style="margin:0"><input class="fill" id="${prefix}f${i}" lang="de" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Your answer"><button class="btn small" type="button" data-fill="${i}">Check</button></div>
        <div class="lesson-characters" role="group" aria-label="German characters">${["ä", "ö", "ü", "ß"].map(letter => `<button class="chip" type="button" lang="de" data-insert-character="${letter}">${letter}</button>`).join("")}</div>`;
    case "order": {
      const words = task.words.map(word => word === task.neutralStart ? word[0].toLowerCase() + word.slice(1) : word);
      const chips = shuffle(words)
        .map((w) => `<button class="chip" type="button" lang="de" data-chip="${i}" data-word="${esc(w)}">${esc(w)}</button>`)
        .join("");
      return `<div class="built" id="${prefix}b${i}" aria-label="Your sentence"></div><div class="opts" id="${prefix}p${i}">${chips}</div>
        <div class="row"><button class="btn small" type="button" data-order="${i}">Check</button><button class="btn small ghost" type="button" data-clear="${i}">Clear</button></div>`;
    }
    case "write":
      return `<textarea id="w${i}" aria-label="Your answer" placeholder="Schreib hier…" data-lenis-prevent></textarea><div class="row"><button class="btn small ghost" type="button" data-write="${i}">Show a model answer</button></div>`;
    default:
      return "";
  }
}

const renderTask = (task, i, prefix = "") =>
  `<div class="lesson-exercise-item" data-exercise-index="${i}">${task.notebookPractice ? '<h3 class="h3 notebook-practice-heading">Practice from your A1 notes</h3>' : ''}<div class="task" id="${prefix}t${i}"><div class="kind">${i + 1}. ${KIND[task.type]}</div>${task.readingText ? `<div class="reading" lang="de">${esc(task.readingText)}</div>` : ""}<div class="q" tabindex="-1">${esc(task.question)}</div>${taskBody(task, i, prefix)}<div id="${prefix}fb${i}" aria-live="polite"></div></div></div>`;

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
  exerciseIndex = l.tasks.length && sitePreferences().lessonLayout === "focus" ? 0 : null;
  retry = null;
  missed = lessonMistakes(l);
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
  const dialogue = l.dialogue;
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
  ${lessonSections(l, dialogue)}
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
  ${dialogue ? dialoguePanel(dialogue, showTranslation) : ''}
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
    <div class="lesson-exercise-controls">
      <button class="btn small ghost" type="button" data-lesson-words>Review lesson words</button>
      ${l.tasks.length ? '<button class="btn small ghost" type="button" data-exercise-mode aria-pressed="false">One at a time</button>' : ''}
      <button class="btn small ghost" type="button" data-lesson-mistakes hidden></button>
      <button class="btn small ghost" type="button" data-exercise-exit hidden>Exit retry</button>
    </div>
    <p class="lesson-exercise-position small muted" data-exercise-position role="status"></p>
    <div id="lesson-exercise-list">${l.tasks.map((task, index) => renderTask(task, index)).join("")}</div>
    <div id="lesson-exercise-retry" hidden></div>
    <div class="lesson-exercise-navigation" data-exercise-navigation hidden>
      <button class="btn small ghost" type="button" data-exercise-previous>Previous</button>
      <button class="btn small" type="button" data-exercise-check hidden>Check</button>
      <button class="btn small" type="button" data-exercise-next>Next exercise</button>
    </div>
    <div id="scorebox" aria-live="polite">${exercisesDone}</div>
    <div id="lesson-scorecard">${scorecardHTML(lessonScorecard(l))}</div>
    <p data-exercise-review-status role="status" class="small muted"></p>
  </section>
  ${l.speaking ? `<section class="course-speaking" aria-labelledby="speaking-h"><h2 id="speaking-h">Speak and interact</h2><p class="muted">Try the task before revealing the example. Invent the personal details and practise both roles with a partner.</p>${l.speaking.map((s, i) => `<div class="task"><div class="q">${esc(s.task)}</div><button type="button" class="btn small ghost" data-speech-model="${i}">Show and hear an example</button><div id="speech-model-${i}"></div><ul class="check-list">${s.checklist.map((item) => `<li><label><input type="checkbox">${esc(item)}</label></li>`).join("")}</ul></div>`).join("")}<p class="muted small">Writing and speaking need feedback. Your objective exercise score does not measure pronunciation or spoken interaction.</p></section>` : ""}
  ${guide ? "" : `<div class="pager">${back}${forward}</div>`}`;
}

const exerciseField = (name, index) => document.getElementById(`${retry ? "retry-" : ""}${name}${index}`);
const lessonPart = () => new URLSearchParams(location.hash.split("?")[1] || "").get("part");
const taskCheck = box => box.querySelector('[data-check-choice], [data-fill], [data-order]');

function firstUnanswered() {
  return gradedTasks(lesson).find(index => !(index in firstTry));
}

function showExerciseView(focus = false) {
  const list = document.getElementById("lesson-exercise-list");
  const review = document.getElementById("lesson-exercise-retry");
  const navigation = document.querySelector("[data-exercise-navigation]");
  const position = retry?.position ?? exerciseIndex;
  const active = position !== null;
  const total = retry?.items.length ?? lesson.tasks.length;
  const index = retry ? retry.items[position] : position;
  list.hidden = Boolean(retry);
  review.hidden = !retry;
  const currentList = retry ? review : list;
  list.classList.toggle('is-focused', active);
  review.classList.toggle('is-focused', active);
  for (const item of currentList.children) {
    item.hidden = active && Number(item.dataset.exerciseIndex) !== index;
  }

  const mode = document.querySelector("[data-exercise-mode]");
  if (mode) {
    mode.hidden = Boolean(retry);
    mode.setAttribute("aria-pressed", String(exerciseIndex !== null));
  }
  const savedMistakes = document.querySelector("[data-lesson-mistakes]");
  savedMistakes.hidden = Boolean(retry) || !missed.length || scoreShown && !active;
  savedMistakes.textContent = `Retry ${missed.length} missed ${missed.length === 1 ? "exercise" : "exercises"}`;
  const resultRetry = document.querySelector("[data-exercise-retry]");
  if (resultRetry) resultRetry.hidden = !missed.length;
  document.querySelector("[data-lesson-result-words]")?.classList.toggle("ghost", Boolean(missed.length));
  document.querySelector("[data-exercise-exit]").hidden = !retry;
  document.querySelector(".lprog").hidden = Boolean(retry);
  document.getElementById("scorebox").hidden = active;
  document.getElementById("lesson-scorecard").hidden = active;
  const label = document.querySelector("[data-exercise-position]");
  label.textContent = active ? `${retry ? "Retry" : "Exercise"} ${position + 1} of ${total}` : "";
  navigation.hidden = !active;
  if (!active) return;

  const previous = navigation.querySelector("[data-exercise-previous]");
  const next = navigation.querySelector("[data-exercise-next]");
  const check = navigation.querySelector('[data-exercise-check]');
  const last = position === total - 1;
  previous.disabled = position === 0;
  const writing = lesson.tasks[index].type === "write";
  const checked = retry ? retry.answers.get(index) : index in firstTry;
  next.hidden = !writing && !checked;
  check.hidden = !next.hidden;
  check.disabled = Boolean(taskCheck(exerciseField('t', index))?.disabled);
  next.textContent = last ? (retry ? "Finish retry" : firstUnanswered() === undefined ? "See results" : "Go to unanswered exercise") : "Continue";
  if (focus) {
    exerciseField("t", index).querySelector(".q").focus({ preventScroll: true });
    jumpTo(document.querySelector(".lesson-exercise-controls"));
  }
}

function beginRetry() {
  const items = [...missed];
  if (!items.length) return;
  retry = { items, position: 0, answers: new Map() };
  document.querySelector("[data-exercise-review-status]").textContent = "";
  document.getElementById("lesson-exercise-retry").innerHTML = items.map(index => renderTask(lesson.tasks[index], index, "retry-")).join("");
  showExerciseView(true);
}

function finishRetry(completed) {
  stopAudio();
  retry = null;
  document.getElementById("lesson-exercise-retry").replaceChildren();
  showExerciseView();
  const result = document.querySelector("[data-exercise-review-status]");
  result.textContent = completed ? "Retry complete." : "";
  if (lessonPart() === "mistakes") {
    const back = document.createElement("a");
    back.className = "tlink";
    back.href = `#/${lesson.level.id}/practice?tab=missed`;
    back.textContent = "Back to missed exercises";
    result.append(" ", back);
    back.focus({ preventScroll: true });
    jumpTo(back);
    return;
  }
  const heading = document.querySelector("[data-exercise-review-status]");
  const destination = completed ? heading : document.querySelector('[data-lesson-mistakes]:not([hidden])') || document.getElementById("ex-h");
  destination.tabIndex = -1;
  destination.focus({ preventScroll: true });
  jumpTo(destination);
}

function updateProgress() {
  const graded = gradedTasks(lesson);
  const answered = graded.filter((i) => i in firstTry).length;
  document.getElementById("lprog-txt").textContent = `${answered} of ${graded.length} answered`;
  document.getElementById("lprog-bar").style.width = `${graded.length ? answered / graded.length * 100 : 0}%`;
}

function correctAnswer(task) {
  return task.options?.[task.answer] ?? task.answers?.[0] ?? "";
}

function scorecardHTML(records) {
  if (!Object.keys(records).length) return "";
  return `<details class="lesson-scorecard"><summary>Review your answers</summary><div class="lesson-scorecard-items">${Object.entries(records).map(([index, record]) => {
    const task = lesson.tasks[index];
    return `<details><summary><span>${Number(index) + 1}. ${esc(task.question)}</span><span class="lesson-scorecard-status ${record.correct ? 'is-correct' : 'is-missed'}">${record.correct ? 'Correct' : 'Missed'}</span></summary>
      <dl><div><dt>Your first answer</dt><dd>${esc(record.response)}</dd></div><div><dt>${record.correct ? 'Example answer' : 'Correct answer'}</dt><dd>${esc(correctAnswer(task))}</dd></div></dl>
      ${task.type === 'listen' ? speakerButton(task.audioText, 'Replay listening prompt') : ''}${task.hint ? `<p class="small muted">${esc(task.hint)}</p>` : ''}</details>`;
  }).join('')}</div></details>`;
}

function playAnswerCue(ok) {
  if (!sitePreferences().lessonSounds || !window.AudioContext) return;
  try {
    feedbackAudio ||= new AudioContext();
    const cue = feedbackAudio.createOscillator(), volume = feedbackAudio.createGain();
    const start = feedbackAudio.currentTime;
    cue.frequency.setValueAtTime(ok ? 523 : 294, start);
    cue.frequency.setValueAtTime(ok ? 659 : 247, start + 0.075);
    volume.gain.setValueAtTime(0.06, start);
    volume.gain.exponentialRampToValueAtTime(0.001, start + 0.18);
    cue.connect(volume).connect(feedbackAudio.destination);
    cue.start(start);
    cue.stop(start + 0.18);
    if (feedbackAudio.state === 'suspended') void feedbackAudio.resume().catch(() => {});
  } catch { /* Audio feedback is optional. */ }
}

/** Show feedback for task i; only the first answer counts toward the score. */
function mark(i, ok, response, el) {
  const task = lesson.tasks[i];
  const hint = task.hint;
  const answer = correctAnswer(task);
  if (ok || !retry) {
    const remaining = new Set(missed);
    if (ok) remaining.delete(i);
    else remaining.add(i);
    missed = [...remaining].sort((a, b) => a - b);
    saveLessonMistake(lesson, i, ok);
  }
  if (retry) {
    if (!retry.answers.has(i)) logPractice();
    retry.answers.set(i, ok);
  } else if (!(i in firstTry)) {
    firstTry[i] = { correct: ok, response: response.slice(0, 600) };
    logPractice();
  }
  const fb = exerciseField("fb", i);
  stopLessonPlayback();
  stopAudio();
  playAnswerCue(ok);
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
      ease: "power3.out",
      clearProps: "all",
    });
    if (el) {
      if (ok)
        gsap.fromTo(
          el,
          { scale: 0.94 },
          { scale: 1, duration: 0.28, ease: "power3.out", clearProps: "transform" },
        );
      else shake(el);
    }
  }
  if (!retry) {
    updateProgress();
    showScoreWhenDone();
  }
  showExerciseView();
  if (exerciseIndex !== null || retry) {
    const next = document.querySelector('[data-exercise-next]:not([hidden])');
    next?.focus({ preventScroll: true });
  }
}

function showScoreWhenDone() {
  const graded = gradedTasks(lesson);
  if (scoreShown || graded.some((i) => !(i in firstTry))) return;
  scoreShown = true;
  const score = graded.filter((i) => firstTry[i].correct).length;
  const total = graded.length;
  const queued = recordLesson(lesson, score);
  const message =
    (score === total ? "Every answer right on the first try." : `${total - score} missed on the first try.`) +
    (queued ? ` ${queued} ${queued === 1 ? "word joined" : "words joined"} your vocabulary review queue.` : "");
  const box = document.getElementById("scorebox");
  // With motion on, the visible number counts up; screen readers (this is a live region) get the
  // real score straight away.
  const celebrations = sitePreferences().lessonCelebrations;
  const animateScore = celebrations && motionOK() && exerciseIndex === null;
  const number = animateScore
    ? `<span aria-hidden="true">0/${total}</span><span class="sr">${score}/${total}</span>`
    : `${score}/${total}`;
  const retryAction = `<button class="btn small" type="button" data-exercise-retry${missed.length ? "" : " hidden"}>Retry missed exercises</button>`;
  const actions = retryAction + (guide ? (wantsExercises() ? guidedContinue(guide) : "") :
    `<a class="btn small${missed.length ? " ghost" : ""}" data-lesson-result-words href="#/karten?l=${lesson.key}">Practise these words</a><a class="btn small ghost" href="#/sentences">Open sentence review</a>`);
  box.innerHTML = `<div class="score" tabindex="-1"><div><strong class="num" id="scoreNum">${number}</strong><p>Lesson ${lesson.position}: objective exercises complete. ${message}</p><div class="sentence-actions">${actions}</div></div>${celebrations ? `<div class="stamp" id="stamp" aria-hidden="true">Erledigt<small>${germanDate(new Date(), true)}</small></div>` : ''}</div>`;
  saveLessonScorecard(lesson, firstTry);
  document.getElementById('lesson-scorecard').innerHTML = scorecardHTML(firstTry);
  if (animateScore) {
    const counter = { v: 0 };
    const digits = document.getElementById("scoreNum").firstChild;
    const tl = gsap.timeline();
    tl.from(box.firstChild, { y: 10, scale: 0.99, opacity: 0, duration: 0.46, ease: "power3.out" })
      .to(
        counter,
        {
          v: score,
          duration: 0.62,
          ease: "power2.out",
          onUpdate: () => {
            digits.textContent = `${Math.round(counter.v)}/${total}`;
          },
        },
        "<.1",
      )
      .from(
        "#stamp",
        { scale: 1.55, opacity: 0, rotation: -12, duration: 0.34, ease: "power3.out" },
        ">-.1",
      );
    onLeave(() => tl.kill());
  }
  if (exerciseIndex === null) scrollToCenter(box);
}

/** Move word chips between the pool and the sentence, gliding them into place when motion is on. */
function moveChips(i, chips, target) {
  const all = exerciseField("t", i).querySelectorAll(".chip");
  const labels = () => {
    const built = exerciseField("b", i);
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
  if (d.exerciseMode !== undefined) {
    stopLessonPlayback();
    stopAudio();
    exerciseIndex = exerciseIndex === null ? firstUnanswered() ?? 0 : null;
    showExerciseView(exerciseIndex !== null);
    return;
  }
  if (d.insertCharacter !== undefined) {
    const input = button.closest(".task").querySelector("input.fill");
    if (input.disabled) return;
    input.setRangeText(d.insertCharacter, input.selectionStart, input.selectionEnd, "end");
    input.focus({ preventScroll: true });
    return;
  }
  if (d.exerciseRetry !== undefined || d.lessonMistakes !== undefined) { stopLessonPlayback(); stopAudio(); beginRetry(); return; }
  if (d.exerciseExit !== undefined) { finishRetry(false); return; }
  if (d.exerciseCheck !== undefined) {
    const index = retry ? retry.items[retry.position] : exerciseIndex;
    taskCheck(exerciseField('t', index)).click();
    return;
  }
  if (d.exercisePrevious !== undefined || d.exerciseNext !== undefined) {
    stopLessonPlayback();
    stopAudio();
    const step = d.exercisePrevious !== undefined ? -1 : 1;
    if (retry) {
      const next = retry.position + step;
      if (next === retry.items.length) { finishRetry(true); return; }
      retry.position = next;
    } else {
      const next = exerciseIndex + step;
      exerciseIndex = next === lesson.tasks.length ? firstUnanswered() ?? null : next;
    if (exerciseIndex === null) {
        showExerciseView();
        const score = document.querySelector("#scorebox .score");
        const destination = score || document.getElementById("ex-h");
        destination.tabIndex = -1;
        destination.focus({ preventScroll: true });
        jumpTo(destination);
        return;
      }
    }
    showExerciseView(true);
    return;
  }
  if (d.lessonSection) {
    const heading = document.getElementById(d.lessonSection);
    if (heading) { heading.tabIndex = -1; heading.focus({ preventScroll: true }); jumpTo(heading); }
    return;
  }
  if (d.playExamples !== undefined) {
    void playLessonLines(button, lesson.examples.map(item => item.de).filter(Boolean), "Play examples", "Stop examples");
    return;
  }
  if (d.playDialogue !== undefined) {
    const status = document.querySelector("[data-dialogue-audio-status]");
    status.textContent = "";
    void playLessonLines(button, lesson.dialogue.lines.map(({ de }) => de), "Play dialogue", "Stop dialogue", status);
    return;
  }
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
    const box = exerciseField("t", i);
    box.querySelectorAll('.opt').forEach(option => {
      option.setAttribute('aria-pressed', String(option === button));
      option.classList.remove('wrong');
    });
    box.querySelector('[data-check-choice]').disabled = false;
    if (exerciseIndex !== null || retry) document.querySelector('[data-exercise-check]').disabled = false;
  } else if (d.checkChoice !== undefined) {
    const i = +d.checkChoice;
    const task = lesson.tasks[i];
    const box = exerciseField('t', i);
    const selected = box.querySelector('.opt[aria-pressed="true"]');
    if (!selected) return;
    const ok = Number(selected.dataset.k) === task.answer;
    selected.classList.add(ok ? 'right' : 'wrong');
    if (ok || (exerciseIndex !== null && !retry)) {
      box.querySelectorAll('.opt, [data-check-choice]').forEach(control => { control.disabled = true; });
    }
    mark(i, ok, task.options[Number(selected.dataset.k)], selected);
  } else if (d.fill !== undefined) {
    const i = +d.fill;
    const task = lesson.tasks[i];
    const input = exerciseField("f", i);
    if (!input.value.trim()) {
      input.focus();
      shake(input);
      return;
    }
    const ok = task.answers.some((a) => norm(a) === norm(input.value));
    input.classList.toggle("is-ok", ok);
    input.classList.toggle("is-no", !ok);
    if (ok || (exerciseIndex !== null && !retry)) {
      input.disabled = true;
      button.disabled = true;
      input.closest(".task").querySelectorAll("[data-insert-character]").forEach(key => { key.disabled = true; });
    }
    mark(i, ok, input.value.trim(), input);
  } else if (d.chip !== undefined) {
    const built = exerciseField("b", d.chip);
    const pool = exerciseField("p", d.chip);
    moveChips(d.chip, [button], button.parentElement === built ? pool : built);
  } else if (d.clear !== undefined) {
    moveChips(
      d.clear,
      [...exerciseField("b", d.clear).children],
      exerciseField("p", d.clear),
    );
  } else if (d.order !== undefined) {
    // Any sentence in `answers` is accepted; the first one is shown when the answer is wrong.
    const i = +d.order;
    const task = lesson.tasks[i];
    const built = exerciseField("b", i);
    const sentence = [...built.children].map((c) => c.textContent).join(" ");
    if (!sentence) {
      shake(built);
      return;
    }
    const ok = task.answers.some((a) => norm(a) === norm(sentence));
    if (ok || (exerciseIndex !== null && !retry))
      exerciseField("t", i).querySelectorAll(".chip, [data-order], [data-clear]").forEach((x) => {
        x.disabled = true;
      });
    mark(i, ok, sentence, built);
  } else if (d.write !== undefined) {
    const task = lesson.tasks[+d.write];
    document.getElementById(`fb${d.write}`).innerHTML =
      `<div class="fb info"><b>Model:</b> <span lang="de" style="white-space:pre-line">${esc(task.modelAnswer)}</span> ${speakerButton(task.modelAnswer)}</div>`;
  }
}

/** Enter in a gap checks the answer. */
export function onKeydown(e) {
  if (e.key !== "Enter" || e.isComposing || !e.target.classList?.contains("fill")) return;
  e.preventDefault();
  if (e.repeat) return;
  const check = e.target.closest(".task")?.querySelector("[data-fill]");
  if (check && !check.disabled) check.click();
}

export function onChange(e) {
  if (e.target.dataset.dialogueTranslation === undefined) return;
  document.querySelectorAll("[data-dialogue-meaning]").forEach(line => { line.hidden = !e.target.checked; });
}

export function onAudioPlay() { stopLessonPlayback(); }

/* ---------- motion: calm, so studying stays easy ---------- */

/** Today's session links straight to a lesson's exercises with ?part=exercises. */
const wantsExercises = () => lessonPart() === "exercises";

export function mount() {
  markOpened(lesson);
  showExerciseView();
  refreshSentencePrompts(document.querySelector(".say-panel"));
  void showDownload(document.querySelector("[data-download-lesson]"), lesson.key);
  if (wantsExercises()) jumpTo(document.querySelector(".exercises"));
  if (lessonPart() === "mistakes") {
    if (missed.length) beginRetry();
    else jumpTo(document.querySelector(".exercises"));
  }
  if (lessonPart() === "examples") jumpTo(document.getElementById("lesson-examples"));
  if (!motionOK()) return;
  splitReveal(document.querySelector(".lesson-head h1"), { duration: 0.62 });
  drawIn(document.querySelector(".lesson-head"));
  const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
  tl.from(".crumb", { autoAlpha: 0, y: 5, duration: 0.34 }, 0)
    .from(".lesson-head .en", { autoAlpha: 0, y: 6, duration: 0.38 }, 0.04)
    .from(".intro", { autoAlpha: 0, y: 8, duration: 0.42 }, 0.08)
    .from(
      ".lesson-grid > .panel",
      { autoAlpha: 0, y: 10, duration: 0.48, stagger: 0.045, clearProps: "transform" },
      0.12,
    )
    .from(".tbl tbody tr", { autoAlpha: 0, x: -5, duration: 0.34, stagger: 0.02 }, 0.24)
    .from(".rules li", { autoAlpha: 0, y: 5, duration: 0.36, stagger: 0.03 }, 0.24);
  onLeave(() => tl.kill());
  revealOnScroll(".say-panel, .exercises > h2, .exercises > .muted, .words-h, .pager", { y: 10, duration: 0.46 });
  revealOnScroll(".vocab > div", { y: 6, duration: 0.38, stagger: 0.018 });
}

function stopLessonPlayback() {
  if (!lessonPlayback) return;
  const { controller, button, playLabel } = lessonPlayback;
  lessonPlayback = undefined;
  controller.abort();
  stopAudio();
  button.textContent = playLabel;
  refreshInterface(button);
}

async function playLessonLines(button, lines, playLabel, stopLabel, status) {
  const toggledOff = lessonPlayback?.button === button;
  stopLessonPlayback();
  if (toggledOff) return;
  const controller = new AbortController();
  const playback = lessonPlayback = { controller, button, playLabel };
  button.textContent = stopLabel;
  refreshInterface(button);
  try {
    for (const [index, line] of lines.entries()) {
      if (controller.signal.aborted) break;
      if (!await playAudioLine(line, button, { alternate: Boolean(status) && index % 2 === 1 })) {
        if (status && !controller.signal.aborted) status.textContent = "Dialogue audio is unavailable on this device.";
        break;
      }
      await waitBetweenLines(0.5, controller.signal);
    }
  } finally {
    if (lessonPlayback === playback) {
      lessonPlayback = undefined;
      button.textContent = playLabel;
      refreshInterface(button);
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

export function unmount() { stopLessonPlayback(); stopAudio(); }
