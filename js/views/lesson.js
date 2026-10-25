// Lesson page: grammar table, rules, spoken examples, exercises with instant checking, word list.

import { gradedTasks, pluralText } from "../content.js";
import { logPractice, markOpened, recordLesson } from "../state.js";
import { speakerButton } from "../ui/audio.js";
import { ARROW_ICON } from "../ui/icons.js";
import { drawIn, Flip, gsap, motionOK, onLeave, revealOnScroll, shake, splitReveal } from "../ui/motion.js";
import { jumpTo, scrollToCenter } from "../ui/scroll.js";
import { esc, germanDate, norm, shuffle } from "../utils.js";
import { breadcrumb } from "./shared.js";

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
  const { level } = l;
  const position = level.lessons.indexOf(l);
  const prev = level.lessons[position - 1];
  const next = level.lessons[position + 1];
  const graded = gradedTasks(l).length;
  const examples = l.examples
    .map(
      (e) =>
        `<div class="say">${speakerButton(e.de)}<div><div class="de-line" lang="de">${esc(e.de)}</div><div class="en-line">${esc(e.en)}</div></div></div>`,
    )
    .join("");
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
  return `
  ${breadcrumb(level, `Lesson ${l.position}`)}
  <header class="lesson-head"><h1 lang="de">${esc(l.germanTitle)}</h1><div class="en">${esc(l.title)}</div></header>
  <p class="intro">${esc(l.intro)}</p>
  ${l.outcomes ? `<div class="panel course-outcomes"><a class="tlink" href="#/${level.id}/roadmap">Module ${l.module} · Course roadmap</a><h2 class="h3">What you will practise</h2><ul>${l.outcomes.map((goal) => `<li>${esc(goal)}</li>`).join("")}</ul><p class="muted small"><b>Pronunciation:</b> ${esc(l.pronunciation)}</p></div>` : ""}
  <div class="lesson-grid">
    <div class="panel spot">${grammarTable(l.table)}</div>
    ${l.tables ? l.tables.map(table => `<div class="panel"><h2>${esc(table.title)}</h2>${grammarTable(table)}</div>`).join('') : ''}
    ${l.pronunciationDrills ? `<section class="panel course-pronunciation"><h2>Listen and practise pronunciation</h2><p class="muted">Listen, repeat after a pause, then say the phrase without reading. Ask a partner which word or detail they understood.</p>${l.pronunciationDrills.map(drill => `<div class="say">${speakerButton(drill.text)}<div><b>${esc(drill.label)}</b><div class="de-line" lang="de">${esc(drill.text)}</div><p class="muted small">${esc(drill.instruction)}</p></div></div>`).join('')}</section>` : ''}
    <div class="panel spot"><h2 class="h3">Remember</h2><ul class="rules">${l.rules.map((r) => `<li>${esc(r)}</li>`).join("")}</ul></div>
  </div>
  <div class="panel spot say-panel"><h2 class="h3">Say it out loud</h2><p class="muted small">Tap the speaker, listen, then repeat the sentence.</p><div class="ex-list">${examples}</div></div>
  <section class="exercises" aria-labelledby="ex-h">
    <div class="lprog"><span id="lprog-txt" class="num">0 of ${graded} answered</span><span class="bar" aria-hidden="true"><i id="lprog-bar"></i></span></div>
    <h2 id="ex-h">Exercises</h2>
    <p class="muted">Your first try on each one counts toward your score.</p>
    ${l.tasks.map(renderTask).join("")}
    <div id="scorebox" aria-live="polite"></div>
  </section>
  ${l.speaking ? `<section class="course-speaking" aria-labelledby="speaking-h"><h2 id="speaking-h">Speak and interact</h2><p class="muted">Try the task before revealing the example. Use your own details and practise both roles with a partner.</p>${l.speaking.map((s, i) => `<div class="task"><div class="q">${esc(s.task)}</div><button type="button" class="btn small ghost" data-speech-model="${i}">Show and hear an example</button><div id="speech-model-${i}"></div><ul class="check-list">${s.checklist.map((item) => `<li><label><input type="checkbox">${esc(item)}</label></li>`).join("")}</ul></div>`).join("")}<p class="muted small">Writing and speaking need feedback. Your objective exercise score does not measure pronunciation or spoken interaction.</p></section>` : ""}
  <h2 class="words-h">Words from this lesson</h2>
  <div class="vocab">${words}</div>
  <div class="pager">${back}${forward}</div>`;
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
    (queued ? ` Its ${queued} words are now in your review queue.` : "");
  const box = document.getElementById("scorebox");
  // With motion on, the visible number counts up; screen readers (this is a live region) get the
  // real score straight away.
  const number = motionOK()
    ? `<span aria-hidden="true">0/${total}</span><span class="sr">${score}/${total}</span>`
    : `${score}/${total}`;
  box.innerHTML = `<div class="score"><div><strong class="num" id="scoreNum">${number}</strong><p>Lesson ${lesson.position}: objective exercises complete. ${message}</p><a class="btn small" href="#/karten?l=${lesson.key}">Practise these words</a></div><div class="stamp" id="stamp" aria-hidden="true">Erledigt<small>${germanDate(new Date(), true)}</small></div></div>`;
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
  if (d.speechModel !== undefined) {
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
  if (wantsExercises()) jumpTo(document.querySelector(".exercises"));
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
