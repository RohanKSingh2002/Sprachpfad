// Home page: the next stop on the departure board, today's session, the route across the levels, the
// line of stops for one level, the practice calendar, a ticker of the level's words, and questions.
//
// Motion: the first visit plays the full opening (headline words rise, board flips in, the session and
// the line draw themselves). Coming back plays a shorter version, and switching level only animates
// what changes. Further down, sections reveal as they scroll into view.

import { LEVELS, ALL_LESSONS, ALL_WORDS, FAQ, gradedTasks } from "../content.js";
import {
  addedToday,
  answersOn,
  cardsToday,
  doneCount,
  doneTotal,
  dueCount,
  isDone,
  knownIn,
  lessonScore,
  NEW_PER_DAY,
  newWords,
  nextDue,
  nextLesson,
  nextTopic,
  openedToday,
  passed,
  sessionLesson,
  streak,
} from "../state.js";
import { boardHTML, runBoards } from "../ui/board.js";
import { magnetic, slidePill } from "../ui/effects.js";
import { ARROW_ICON, CHECK_ICON, PAUSE_ICON, PLAY_ICON } from "../ui/icons.js";
import {
  countUp,
  drawIn,
  gsap,
  motionOK,
  onLeave,
  revealOnScroll,
  ScrollTrigger,
  splitReveal,
} from "../ui/motion.js";
import { daysBetween, esc, shuffle, todayKey } from "../utils.js";
import { levelSwitch } from "./shared.js";

const WEEKS = 17;
const TICKER_WORDS = 24;
let shown = null; // level on screen, used to place the green rail
let openingPlayed = false; // the full opening plays once per visit

/** Switching level on the home page is animated by this page itself (see router.js). */
export const updatesInPlace = true;

/* ---------- next stop ---------- */

function board(level, next) {
  const total = level.lessons.length;
  if (next) {
    return boardHTML({
      id: "home",
      text: next.germanTitle,
      foot: `<span>${level.name}, lesson ${next.position} of ${total}: ${esc(next.title)}</span><span>Gleis ${next.position}</span>`,
      label: `Next stop: ${next.germanTitle}, ${level.name} lesson ${next.position} of ${total}`,
    });
  }
  return boardHTML({
    id: "home",
    text: `${level.name} geschafft`,
    foot: `<span>All ${total} ${level.name} lessons done</span><span>Endstation</span>`,
    label: `${level.name} complete`,
  });
}

function actions(level, next) {
  const after = LEVELS[level.index + 1];
  const primary = (href, label) => `<a class="btn btn-go" href="${href}">${label}${ARROW_ICON}</a>`;
  if (next) {
    const label = doneCount(level) ? `Continue with lesson ${next.position}` : "Start lesson 1";
    return primary(`#/${level.id}/lektion/${next.id}`, label);
  }
  if (!passed(level)) {
    const second = after
      ? `<a class="tlink" href="#/${after.id}">Continue to ${after.name}</a>`
      : `<a class="tlink" href="#/karten?l=${level.id}">Review flashcards</a>`;
    return `${primary(`#/${level.id}/test`, `Take the ${level.name} mock test`)}${second}`;
  }
  const certificate = `#/${level.id}/zertifikat`;
  return after
    ? `${primary(`#/${after.id}`, `Continue to ${after.name}`)}<a class="tlink" href="${certificate}">View your ${level.name} certificate</a>`
    : `${primary(certificate, `View your ${level.name} certificate`)}<a class="tlink" href="#/karten?l=all">Review all flashcards</a>`;
}

/* ---------- today's session ---------- */

// A realistic pace: seconds per flashcard (a new word takes longer) and per kind of exercise
const CARD_SECONDS = 10;
const NEW_CARD_SECONDS = 15;
const TASK_SECONDS = { choice: 25, listen: 40, fill: 35, order: 50, write: 150 };

const minutes = (seconds) => Math.max(1, Math.round(seconds / 60));
const words = (text) => String(text).split(/\s+/).filter(Boolean).length;

/** Reading the lesson's grammar at 90 words a minute, and saying each example out loud twice. */
function grammarMinutes(lesson) {
  const text = [
    lesson.intro,
    ...lesson.rules,
    ...lesson.table.head,
    ...lesson.table.rows.flat(),
    ...lesson.examples.flatMap((e) => [e.de, e.en]),
  ];
  const reading = text.reduce((n, t) => n + words(t), 0) / 90;
  return Math.max(2, Math.ceil(reading + (lesson.examples.length * 8) / 60));
}

const exerciseMinutes = (lesson) =>
  minutes(lesson.tasks.reduce((s, t) => s + (TASK_SECONDS[t.type] || 40), 0));

/** "tomorrow", "in 3 days" */
function whenDue(date) {
  const days = daysBetween(todayKey(), date);
  return days === 1 ? "tomorrow" : `in ${days} days`;
}

/**
 * About fifteen minutes: the words the review queue has due, ten new words from the level's topics,
 * then the next lesson's grammar and its exercises. Each step knows when it's done.
 */
function sessionSteps(level) {
  const lesson = sessionLesson(level);
  const due = dueCount();
  const steps = [];
  const learned = addedToday();
  const reviewed = cardsToday() > learned;
  if (due) {
    steps.push({
      title: `Review ${due} ${due === 1 ? "word" : "words"}`,
      sub: "Due today in your review queue",
      href: "#/karten?l=due",
      min: minutes(due * CARD_SECONDS),
    });
  } else if (reviewed) {
    steps.push({
      title: "Review your words",
      sub: "Nothing left due today",
      href: "#/karten?l=due",
      done: true,
    });
  }
  const left = newWords(level).length;
  const goal = Math.min(NEW_PER_DAY, learned + left);
  if (goal) {
    const topic = nextTopic(level);
    const done = learned >= goal;
    steps.push({
      title: `Learn ${goal} new ${goal === 1 ? "word" : "words"}`,
      sub: done ? `${learned} met today` : `From ${topic.title}${learned ? `, ${learned} of ${goal} done` : ""}`,
      href: "#/karten?l=new",
      min: minutes((goal - Math.min(learned, goal)) * NEW_CARD_SECONDS),
      done,
    });
  } else if (!due && !reviewed) {
    steps.push({
      title: `Practise the ${level.name} words`,
      sub: "Nothing is due today",
      href: `#/karten?l=${level.id}`,
      min: minutes(10 * CARD_SECONDS),
    });
  }
  if (lesson) {
    steps.push({
      title: "Study the grammar",
      sub: `Lesson ${lesson.position}: ${lesson.germanTitle}`,
      href: `#/${level.id}/lektion/${lesson.id}`,
      min: grammarMinutes(lesson),
      done: openedToday(lesson) || isDone(lesson),
    });
    steps.push({
      title: `Answer ${lesson.tasks.length} exercises`,
      sub: `${gradedTasks(lesson).length} of them scored, on your first try`,
      href: `#/${level.id}/lektion/${lesson.id}?part=exercises`,
      min: exerciseMinutes(lesson),
      done: isDone(lesson),
    });
  } else if (!passed(level)) {
    steps.push({
      title: `Take the ${level.name} mock test`,
      sub: "Listening, reading, writing and speaking",
      href: `#/${level.id}/test`,
      min: 20,
    });
  } else if (LEVELS[level.index + 1]) {
    const after = LEVELS[level.index + 1];
    steps.push({
      title: `Start the ${after.name} line`,
      sub: `${after.lessons.length} lessons`,
      href: `#/${after.id}`,
    });
  }
  return steps;
}

function sessionCard(level) {
  const steps = sessionSteps(level);
  const open = steps.filter((s) => !s.done);
  const total = open.reduce((n, s) => n + (s.min || 0), 0);
  const first = steps.findIndex((s) => !s.done);
  const status = open.length
    ? `<span class="session-time">${total ? `about ${total} min` : ""}</span>`
    : `<span class="session-time is-done">Done for today</span>`;
  const items = steps
    .map((s, i) => {
      const cls = s.done ? "done" : i === first ? "next" : "";
      const meta = s.done ? "Done" : s.min ? `${s.min} min` : "";
      return `<li${cls ? ` class="${cls}"` : ""}><a href="${s.href}">
        <span class="step-n" aria-hidden="true">${s.done ? CHECK_ICON : i + 1}</span>
        <span class="step-t"><b>${esc(s.title)}</b><span>${esc(s.sub)}</span></span>
        <span class="step-m">${meta}</span></a></li>`;
    })
    .join("");
  let foot = "";
  if (!open.length) {
    const next = nextLesson(level);
    const due = nextDue();
    const back = due
      ? `${due.count} ${due.count === 1 ? "word comes" : "words come"} back ${whenDue(due.date)}. `
      : "";
    const more = next
      ? `<a class="tlink" href="#/${level.id}/lektion/${next.id}">Keep going: lesson ${next.position}</a>`
      : "";
    foot = `<p class="session-foot muted small">${back}${more}</p>`;
  }
  return `<section class="session spot" aria-labelledby="session-h">
    <div class="session-head"><h2 id="session-h">Today's session</h2>${status}</div>
    <ol class="session-steps">${items}</ol>${foot}
  </section>`;
}

/* ---------- the route across the levels ---------- */

/** How far the green line runs along the route: a finished level carries it on to the next stop. */
function routeProgress() {
  let p = 0;
  for (const lv of LEVELS.slice(0, -1)) {
    const part = doneCount(lv) / lv.lessons.length;
    p += part;
    if (part < 1) break;
  }
  return p;
}

function routeMap(current) {
  const stops = LEVELS.map((lv) => {
    const done = doneCount(lv);
    const total = lv.lessons.length;
    const cls = [done === total ? "done" : "", lv === current ? "now" : ""].filter(Boolean).join(" ");
    const here = lv === current ? '<span class="sr"> (the line you are on)</span>' : "";
    const cert = passed(lv) ? `<a class="rm-cert" href="#/${lv.id}/zertifikat">Certificate</a>` : "";
    return `<li${cls ? ` class="${cls}"` : ""}><span class="rm-dot" aria-hidden="true"></span><a class="rm-stop" href="#/${lv.id}"><b>${lv.name}</b>${here} <span class="num">${done}/${total} lessons</span></a>${cert}</li>`;
  }).join("");
  return `<nav class="routemap" aria-label="Your route through the levels" style="--p:${routeProgress().toFixed(3)}">
    <span class="rm-label">Your route</span>
    <div class="rm-track"><span class="rm-line" aria-hidden="true"></span><span class="rm-fill" aria-hidden="true"></span><ol>${stops}</ol></div>
  </nav>`;
}

/* ---------- the line for one level ---------- */

function stops(level, next) {
  const nextIndex = next ? level.lessons.indexOf(next) : level.lessons.length;
  const start = level.course ? Math.min(Math.max(0, level.lessons.length - 8), Math.max(0, nextIndex - 2)) : 0;
  const visible = level.course ? level.lessons.slice(start, start + 8) : level.lessons;
  return visible
    .map((lesson) => {
      const done = isDone(lesson);
      const cls = done ? "done" : next === lesson ? "next" : "";
      const label = done
        ? `${lessonScore(lesson)}/${gradedTasks(lesson).length}`
        : cls === "next"
          ? "Next"
          : "";
      return `<li class="${cls}" data-lesson-key="${lesson.key}"><a href="#/${level.id}/lektion/${lesson.id}">
        <span class="dot">${done ? CHECK_ICON : ""}</span>
        <span><span class="st-title" lang="de">${lesson.position}. ${esc(lesson.germanTitle)}</span><span class="st-sub">${esc(lesson.title)}</span></span>
        <span class="st">${label}</span></a></li>`;
    })
    .join("");
}

/* ---------- further down ---------- */

/** A moving strip of the level's words, like the ticker on a station platform. Tap a word to hear it. */
function ticker(level) {
  const words = [...level.lessons, ...level.topics].flatMap((set) => set.vocab);
  const list = shuffle(words.filter((w, i) => words.findIndex((x) => x.de === w.de) === i)).slice(0, TICKER_WORDS);
  const items = (copy) =>
    list
      .map(
        (w) =>
          `<li><button class="tk" type="button" data-say="${esc(w.de)}"${copy ? ' tabindex="-1"' : ""}><b lang="de">${esc(w.de)}</b><span>${esc(w.en)}</span></button></li>`,
      )
      .join("");
  return `<section class="ticker" aria-label="Words from the ${level.name} lessons and topics. Select a word to hear it.">
    <div class="ticker-viewport">
      <div class="ticker-track">
        <ul class="ticker-set">${items(false)}</ul>
        <ul class="ticker-set" aria-hidden="true">${items(true)}</ul>
      </div>
    </div>
    <button class="ticker-toggle" type="button" aria-pressed="false" aria-label="Pause the moving words">${PAUSE_ICON}${PLAY_ICON}</button>
  </section>`;
}

function heatmap() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekday = (today.getDay() + 6) % 7; // Monday = 0
  const start = new Date(today);
  start.setDate(start.getDate() - weekday - (WEEKS - 1) * 7);
  let cells = "";
  let active = 0;
  for (let i = 0; i < WEEKS * 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    if (d > today) {
      cells += '<i class="future"></i>';
      continue;
    }
    const n = answersOn(d);
    if (n) active++;
    const level = n === 0 ? 0 : n < 5 ? 1 : n < 10 ? 2 : n < 20 ? 3 : 4;
    const label = d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    cells += `<i class="l${level}${+d === +today ? " today" : ""}" title="${label}: ${n} answer${n === 1 ? "" : "s"}"></i>`;
  }
  return { cells, active, total: WEEKS * 7 };
}

export function render(level) {
  shown = level;
  const next = nextLesson(level);
  const hm = heatmap();
  const days = streak();
  const done = doneTotal();
  const known = knownIn(ALL_WORDS);
  const faq = FAQ.map((f) => `<dt>${esc(f.question)}</dt><dd>${esc(f.answer)}</dd>`).join("");
  return `
  <div class="hero">
    <div class="hero-main">
      <h1>A little German, every day.</h1>
      ${board(level, next)}
      <div class="hero-actions">${actions(level, next)}</div>
      ${sessionCard(level)}
      ${level.course ? `<section class="panel course-callout"><h2 class="h3">Explore A1 lessons</h2><p class="muted small">32 lessons, 16 modules, vocabulary, pronunciation and all four exam skills. Follow the sequence and review your checkpoints.</p><a class="btn small ghost" href="#/${level.id}/roadmap">Open all A1 lessons</a></section>` : ""}
    </div>
    <aside class="linecard spot" aria-labelledby="line-h">
      <div class="line-head"><h2 id="line-h">${level.name} line</h2>${levelSwitch(level, "", "Choose a level")}</div>
      <p class="muted small">${doneCount(level)} of ${level.lessons.length} stops reached</p>
      <div class="stops-wrap"><span class="rail" aria-hidden="true"></span><span class="rail-fill" aria-hidden="true"></span><ol class="stops">${stops(level, next)}</ol></div>
      ${level.course ? `<p class="muted small">Nearby stops are shown above. <a class="tlink" href="#/${level.id}/roadmap">See all 32 lessons and module checkpoints</a></p>` : ''}
    </aside>
    ${routeMap(level)}
  </div>

  <section aria-labelledby="practice-h">
    <div class="practice">
      <div>
        <h2 id="practice-h">Your practice</h2>
        <p class="muted">${hm.active ? "Each square is a day. It darkens with every answer you give in lessons, extra practice, flashcards and mock tests." : "Each square is a day. Your first answer fills in today's square."}</p>
        <a class="btn small ghost" href="#/${level.id}/practice">Try fill-in, translation and matching</a>
        <div class="stats">
          <div class="stat"><b data-count="${days}">${days}</b><span>${days === 1 ? "day" : "days"} in a row</span></div>
          <div class="stat"><b data-count="${done}" data-suffix="/${ALL_LESSONS.length}">${done}/${ALL_LESSONS.length}</b><span>lessons done</span></div>
          <div class="stat"><b data-count="${known}">${known}</b><span>of ${ALL_WORDS.length} words known</span></div>
        </div>
      </div>
      <div>
        <div class="heat" role="img" aria-label="Practised on ${hm.active} of the last ${hm.total} days">${hm.cells}</div>
        <div class="heat-cap"><span>${WEEKS} weeks ago</span><span>Today</span></div>
      </div>
    </div>
  </section>

  ${ticker(level)}

  <section aria-labelledby="faq-h">
    <details class="faq-dropdown">
      <summary class="faq-toggle"><h2 id="faq-h">Questions</h2></summary>
      <div class="faq-content"><dl class="faq">${faq}</dl></div>
    </details>
  </section>`;
}

/* ---------- layout ---------- */

/** Size the grey rail between the first and last stop, and the green part up to the next stop. */
function fillRail() {
  const wrap = document.querySelector(".stops-wrap");
  if (!wrap || !shown) return;
  const dots = [...wrap.querySelectorAll(".dot")];
  if (!dots.length) return;
  const base = wrap.getBoundingClientRect().top;
  const middle = (el) => {
    const r = el.getBoundingClientRect();
    return r.top - base + r.height / 2;
  };
  const first = middle(dots[0]);
  const last = middle(dots[dots.length - 1]);
  const rail = wrap.querySelector(".rail");
  const fill = wrap.querySelector(".rail-fill");
  rail.style.top = `${first}px`;
  rail.style.height = `${last - first}px`;
  const next = nextLesson(shown);
  const nextDot = next && dots.find(dot => dot.closest('li').dataset.lessonKey === next.key);
  const target = doneCount(shown) === 0 ? first : !next ? last : nextDot ? middle(nextDot) : first;
  fill.style.top = `${first}px`;
  fill.style.height = `${Math.max(0, target - first)}px`;
}

/* ---------- motion ---------- */

/** The line draws itself: rail, then the stops pop in one by one, then the green progress runs. */
function lineCascade(speed = 1) {
  const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
  tl.from(
    ".stops-wrap .rail",
    { scaleY: 0, transformOrigin: "50% 0%", duration: 1.1 * speed, ease: "power3.inOut" },
    0,
  )
    .from(
      ".stops .dot",
      { scale: 0, duration: 0.6, stagger: 0.06 * speed, ease: "back.out(2.4)" },
      0.1 * speed,
    )
    .from(
      ".stops .st-title, .stops .st-sub",
      { autoAlpha: 0, x: -12, duration: 0.8, stagger: 0.03 * speed, clearProps: "transform" },
      0.12 * speed,
    )
    .from(".stops .st", { autoAlpha: 0, duration: 0.6 }, 0.5 * speed)
    .from(
      ".stops-wrap .rail-fill",
      { scaleY: 0, transformOrigin: "50% 0%", duration: 1.2 * speed, ease: "power2.inOut" },
      0.5 * speed,
    );
  return tl;
}

/** The route across the levels: the line runs out, the stops pop, the green part follows. */
function routeDraw(speed = 1) {
  const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
  tl.from(".routemap", { autoAlpha: 0, y: 16, duration: 0.9 * speed, clearProps: "transform" }, 0)
    .from(
      ".rm-line",
      { scaleX: 0, transformOrigin: "0% 50%", duration: 1 * speed, ease: "power3.inOut" },
      0.1,
    )
    .from(".rm-dot", { scale: 0, duration: 0.6, stagger: 0.12 * speed, ease: "back.out(2.4)" }, 0.2)
    .from(
      ".rm-fill",
      { scaleX: 0, transformOrigin: "0% 50%", duration: 1.1 * speed, ease: "power2.inOut" },
      0.45,
    );
  return tl;
}

/** Today's session: the card rises, then its steps follow one after another. */
const sessionIn = (delay = 0) =>
  gsap
    .timeline({ defaults: { ease: "expo.out" }, delay })
    .from(".session", { autoAlpha: 0, y: 22, duration: 0.9, clearProps: "transform" }, 0)
    .from(
      ".session-steps li",
      { autoAlpha: 0, x: -10, duration: 0.7, stagger: 0.07, clearProps: "transform" },
      0.12,
    );

function playOpening() {
  splitReveal(document.querySelector(".hero h1"), { by: "words", duration: 1.15, stagger: 0.045 });
  const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
  tl.from(
    ".hero .flapboard",
    { autoAlpha: 0, y: 30, scale: 0.97, duration: 1.1, clearProps: "transform" },
    0.3,
  )
    .from(
      ".hero-actions > *",
      { autoAlpha: 0, y: 14, duration: 0.9, stagger: 0.08, clearProps: "transform" },
      0.55,
    )
    .add(sessionIn(), 0.65)
    .from(".linecard", { autoAlpha: 0, y: 40, duration: 1.2, clearProps: "transform" }, 0.25)
    .add(lineCascade(), 0.55)
    .add(routeDraw(), 0.85);
  runBoards(document, { delay: 0.65 });
  onLeave(() => tl.kill());
}

function playReturn() {
  const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
  tl.from(
    ".hero-main > :not(.session)",
    { autoAlpha: 0, y: 16, duration: 0.8, stagger: 0.05, clearProps: "transform" },
    0,
  )
    .add(sessionIn(), 0.12)
    .from(".linecard", { autoAlpha: 0, y: 24, duration: 0.9, clearProps: "transform" }, 0.08)
    .add(lineCascade(0.6), 0.2)
    .add(routeDraw(0.6), 0.3);
  runBoards(document, { delay: 0.3 });
  onLeave(() => tl.kill());
}

/** Level switch: only what changed moves; the board flips from the old stop to the new one. */
function playLevelChange() {
  const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
  tl.from(
    ".hero-actions > *, .session-steps li",
    { autoAlpha: 0, y: 10, duration: 0.6, stagger: 0.05, clearProps: "transform" },
    0,
  )
    .from("#line-h, .linecard > .muted", { autoAlpha: 0, y: 8, duration: 0.5, stagger: 0.04 }, 0)
    .add(lineCascade(0.6), 0)
    .from(".routemap .now .rm-dot", { scale: 0, duration: 0.6, ease: "back.out(2.4)" }, 0.15);
  runBoards(document, { delay: 0.05 });
  onLeave(() => tl.kill());
}

/** Sections further down animate as they scroll into view. */
function scrollScenes() {
  ["#practice-h", "#faq-h"].forEach((sel) =>
    splitReveal(document.querySelector(sel), { onScroll: true, duration: 1.1 }),
  );
  revealOnScroll(".practice > div:first-child > p", { y: 16 });
  drawIn(document.querySelector(".stats"), { onScroll: true });
  document.querySelectorAll(".stat b").forEach((b, i) => {
    const suffix = b.dataset.suffix || "";
    countUp(b, +b.dataset.count, { delay: i * 0.08, format: (v) => `${v}${suffix}` });
  });
  revealOnScroll(".stat span", { y: 8, stagger: 0.06 });
  revealOnScroll(".ticker", { y: 16 });

  if (!ScrollTrigger) return;
  const heat = document.querySelector(".heat");
  const squares = gsap.from(".heat i:not(.future)", {
    scale: 0.3,
    opacity: 0,
    duration: 0.6,
    ease: "back.out(1.8)",
    stagger: { grid: "auto", from: "end", amount: 0.9 },
    scrollTrigger: { trigger: heat, start: "top 88%", once: true },
  });
  onLeave(() => squares.kill());
}

/** The word ticker glides slowly; it eases to a stop under the pointer or keyboard focus. */
function runTicker() {
  const box = document.querySelector(".ticker");
  if (!box) return;
  if (!motionOK()) {
    box.classList.add("is-static");
    return;
  }
  const loop = gsap.to(".ticker-track", { xPercent: -50, duration: 80, ease: "none", repeat: -1 });
  const toggle = box.querySelector(".ticker-toggle");
  let paused = false;
  const speed = (v, duration) =>
    gsap.to(loop, { timeScale: v, duration, ease: "power2.out", overwrite: true });
  const hold = () => speed(0, 0.6);
  const resume = () => {
    if (!paused) speed(1, 1.2);
  };
  box.addEventListener("pointerenter", hold);
  box.addEventListener("pointerleave", resume);
  box.addEventListener("focusin", hold);
  box.addEventListener("focusout", resume);
  toggle.addEventListener("click", () => {
    paused = !paused;
    toggle.setAttribute("aria-pressed", String(paused));
    toggle.setAttribute("aria-label", paused ? "Play the moving words" : "Pause the moving words");
    if (paused) hold();
    else speed(1, 1.2);
  });
  // No need to keep it moving while it's scrolled out of sight.
  ScrollTrigger?.create({
    trigger: box,
    start: "top bottom",
    end: "bottom top",
    onToggle: (self) => (self.isActive ? loop.resume() : loop.pause()),
  });
  onLeave(() => loop.kill());
}

/** Keep the native disclosure open until its closing animation finishes. */
function runQuestions() {
  const faq = document.querySelector('.faq-dropdown');
  if (!faq) return;
  const toggle = faq.querySelector('.faq-toggle');
  const content = faq.querySelector('.faq-content');
  const list = faq.querySelector('.faq');
  let expanded = faq.open;
  let animation = null;

  const finish = () => {
    animation = null;
    faq.open = expanded;
    faq.classList.remove('is-closing');
    toggle.removeAttribute('aria-expanded');
    gsap.set(content, { clearProps: 'height' });
    gsap.set(list, { clearProps: 'opacity,transform' });
    ScrollTrigger?.refresh();
  };
  const onClick = (e) => {
    // Native keyboard and disclosure behaviour remains available without motion.
    if (!motionOK()) {
      if (animation) { animation.kill(); finish(); }
      return;
    }
    e.preventDefault();
    animation?.kill();
    const height = faq.open ? content.getBoundingClientRect().height : 0;
    if (!faq.open) gsap.set(list, { opacity: 0, y: 12 });
    expanded = !expanded;
    faq.open = true;
    faq.classList.toggle('is-closing', !expanded);
    toggle.setAttribute('aria-expanded', String(expanded));
    gsap.set(content, { height });
    // Measuring the inner list lets interrupted transitions resume from their current height.
    animation = gsap.timeline({ defaults: { ease: 'expo.out' }, onComplete: finish })
      .to(content, { height: expanded ? list.getBoundingClientRect().height : 0, duration: expanded ? 0.65 : 0.5 }, 0)
      .to(list, { opacity: expanded ? 1 : 0, y: expanded ? 0 : 8, duration: expanded ? 0.45 : 0.25 }, expanded ? 0.08 : 0);
  };
  const onFaqToggle = () => {
    if (animation) return;
    expanded = faq.open;
    ScrollTrigger?.refresh();
  };
  toggle.addEventListener('click', onClick);
  faq.addEventListener('toggle', onFaqToggle);
  onLeave(() => {
    animation?.kill();
    toggle.removeEventListener('click', onClick);
    faq.removeEventListener('toggle', onFaqToggle);
  });
}

export function mount(level, { sameKind } = {}) {
  fillRail();
  runQuestions();
  const scene = !motionOK() ? "still" : sameKind ? "level" : openingPlayed ? "return" : "opening";
  openingPlayed = true;
  slidePill(document.querySelector(".linecard .lvswitch"), "home-levels", { animate: scene === "level" });
  if (scene === "opening") playOpening();
  else if (scene === "return") playReturn();
  else if (scene === "level") playLevelChange();
  else runBoards();
  if (motionOK()) scrollScenes();
  runTicker();
  magnetic(document.querySelector(".hero-actions .btn"));
  document.fonts?.ready.then(fillRail); // web fonts can shift the stops
  let timer;
  const onResize = () => {
    clearTimeout(timer);
    timer = setTimeout(fillRail, 150);
  };
  window.addEventListener("resize", onResize);
  onLeave(() => {
    clearTimeout(timer);
    window.removeEventListener("resize", onResize);
  });
}
