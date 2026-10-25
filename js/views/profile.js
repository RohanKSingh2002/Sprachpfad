// Personal progress for the active account, or the separate browser-only save.

import { ALL_LESSONS, ALL_WORDS, LEVELS, wordsOfLevel } from "../content.js";
import {
  answersOn,
  currentLevel,
  doneCount,
  doneTotal,
  knownIn,
  nextLesson,
  passed,
  streak,
  testResult,
} from "../state.js";
import { ARROW_ICON } from "../ui/icons.js";
import { countUp, enter, gsap, motionOK, onLeave, revealOnScroll } from "../ui/motion.js";
import { esc } from "../utils.js";
import { profileAccount } from "./account.js";

const WEEKS = 17;
const dateLabel = (date) => date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

/** Seventeen Monday-first columns; days after today don't count towards the summary. */
function practiceCalendar() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekday = (today.getDay() + 6) % 7;
  const start = new Date(today);
  start.setDate(start.getDate() - weekday - (WEEKS - 1) * 7);
  let cells = "";
  let active = 0;
  let elapsed = 0;
  let answers = 0;
  for (let i = 0; i < WEEKS * 7; i++) {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    if (day > today) {
      cells += '<i class="profile-heat-cell profile-heat-future" aria-hidden="true"></i>';
      continue;
    }
    const count = answersOn(day);
    const intensity = count === 0 ? 0 : count < 5 ? 1 : count < 10 ? 2 : count < 20 ? 3 : 4;
    elapsed++;
    answers += count;
    if (count) active++;
    const label = `${dateLabel(day)}: ${count} ${count === 1 ? "answer" : "answers"}`;
    cells += `<i class="profile-heat-cell profile-heat-l${intensity}${+day === +today ? " profile-heat-today" : ""}" title="${esc(label)}" aria-hidden="true"></i>`;
  }
  return { cells, active, elapsed, answers, start };
}

function overview() {
  const days = streak();
  const done = doneTotal();
  const known = knownIn(ALL_WORDS);
  return `<dl class="profile-overview" aria-label="Your overall progress">
    <div class="profile-metric"><dt>Current streak</dt><dd><b data-profile-count="${days}">${days}</b><span>${days === 1 ? "day" : "days"} in a row</span></dd></div>
    <div class="profile-metric"><dt>Lessons completed</dt><dd><b data-profile-count="${done}">${done}</b><span>of ${ALL_LESSONS.length} lessons</span></dd></div>
    <div class="profile-metric"><dt>Words known</dt><dd><b data-profile-count="${known}">${known}</b><span>of ${ALL_WORDS.length} words</span></dd></div>
  </dl>`;
}

function practice(level) {
  const calendar = practiceCalendar();
  const summary = calendar.active
    ? `${calendar.active} active ${calendar.active === 1 ? "day" : "days"} and ${calendar.answers} ${calendar.answers === 1 ? "answer" : "answers"} in this view.`
    : "Your first answer fills in today's square.";
  const legend = ["0", "1–4", "5–9", "10–19", "20+"]
    .map((label, i) => `<span><i class="profile-heat-cell profile-heat-l${i}" aria-hidden="true"></i>${label}</span>`)
    .join("");
  return `<section class="profile-section profile-practice" aria-labelledby="profile-practice-h">
    <div class="profile-practice-copy">
      <h2 id="profile-practice-h">Your practice</h2>
      <p class="muted">Each square is a day. It darkens with every answer in lessons, extra practice, flashcards and mock tests.</p>
      <p class="profile-activity-summary">${summary}</p>
      <a class="btn small ghost" href="#/${level.id}/practice">Try extra practice${ARROW_ICON}</a>
    </div>
    <div class="profile-calendar">
      <div class="profile-calendar-chart">
        <div class="profile-weekdays" aria-hidden="true"><span>Mon</span><span></span><span>Wed</span><span></span><span>Fri</span><span></span><span>Sun</span></div>
        <div class="profile-heat" role="img" aria-label="Practice calendar. Practised on ${calendar.active} of the ${calendar.elapsed} days from ${esc(dateLabel(calendar.start))} through today, with ${calendar.answers} answers in total. A darker square means more answers. Today's square has an outline.">${calendar.cells}</div>
      </div>
      <div class="profile-calendar-caption"><span>${dateLabel(calendar.start)}</span><span>Today</span></div>
      <div class="profile-heat-legend" aria-label="Answers per day"><span>Answers per day</span>${legend}</div>
    </div>
  </section>`;
}

function levelCard(level) {
  const done = doneCount(level);
  const total = level.lessons.length;
  const percent = total ? Math.round((done / total) * 100) : 0;
  const words = wordsOfLevel(level);
  const known = knownIn(words);
  const next = nextLesson(level);
  const href = next ? `#/${level.id}/lektion/${next.id}` : `#/${level.id}/test`;
  const label = next ? `${done ? "Continue" : "Start"} lesson ${next.position}` : `Review the ${level.name} mock test`;
  const allLessons = level.course ? `#/${level.id}/roadmap` : `#/${level.id}`;
  return `<article class="profile-level-card" aria-labelledby="profile-level-${level.id}">
    <div class="profile-card-head"><h3 id="profile-level-${level.id}">${level.name}</h3><span class="profile-status${done === total ? " profile-status-complete" : ""}">${done === total ? "Lessons complete" : done ? "In progress" : "Ready to start"}</span></div>
    <div class="profile-level-count"><b>${done}<span> / ${total}</span></b><span>lessons completed</span></div>
    <div class="profile-progress" role="progressbar" aria-label="${esc(level.name)} lessons completed" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${done}" aria-valuetext="${done} of ${total} lessons completed"><span class="profile-progress-fill" style="width:${percent}%"></span></div>
    <p class="profile-level-words muted small">${known} of ${words.length} ${level.name} words known</p>
    <div class="profile-card-actions"><a class="tlink" href="${href}">${label}</a><a class="profile-secondary-link" href="${allLessons}">All lessons</a></div>
  </article>`;
}

function testCard(level) {
  const result = testResult(level);
  const complete = passed(level);
  const test = level.test;
  const objectives = test.objectiveLabel || "listening and reading";
  const date = result && new Date(result.date);
  const savedDate = date && Number.isFinite(+date) ? `Best score saved ${dateLabel(date)}` : "";
  return `<article class="profile-test-card" aria-labelledby="profile-test-${level.id}">
    <div class="profile-card-head"><h3 id="profile-test-${level.id}">${level.name} mock test</h3><span class="profile-status${complete ? " profile-status-complete" : ""}">${complete ? "Passed" : result ? "Keep practising" : "Not taken yet"}</span></div>
    ${result
      ? `<p class="profile-test-score"><b>${result.best}</b><span> / ${test.total}</span><span class="sr"> objective points, your best saved score</span></p><p class="profile-test-date muted small">${savedDate}</p>`
      : '<p class="profile-test-empty muted">Take a mock test to save your first result here.</p>'}
    <p class="profile-test-detail muted small">${result ? "Scored in" : "Scoring covers"} ${esc(objectives)}. Pass mark: ${test.passMark} of ${test.total}.</p>
    <div class="profile-card-actions"><a class="tlink" href="#/${level.id}/test">${result ? "Retake" : "Take"} mock test</a>${complete ? `<a class="profile-secondary-link" href="#/${level.id}/zertifikat">View practice certificate</a>` : ""}</div>
  </article>`;
}

export function render(level = currentLevel()) {
  return `<div class="profile-page">
    <div class="profile-head">
      <div><p class="profile-eyebrow">Your learning, at a glance</p><h1>Your profile</h1><p class="muted">See your progress, revisit a level and keep your practice going.</p></div>
      <a class="btn small ghost" href="#/${level.id}">Back to today's session${ARROW_ICON}</a>
    </div>
    ${profileAccount()}
    ${overview()}
    ${practice(level)}
    <section class="profile-section" aria-labelledby="profile-levels-h">
      <div class="profile-section-head"><h2 id="profile-levels-h">Level progress</h2><p class="muted">Every completed lesson is another stop reached.</p></div>
      <div class="profile-card-grid">${LEVELS.map(levelCard).join("")}</div>
    </section>
    <section class="profile-section" aria-labelledby="profile-tests-h">
      <div class="profile-section-head"><h2 id="profile-tests-h">Mock test results</h2><p class="muted">Your best saved scores. Writing and speaking use self-review and are not included in these scores.</p></div>
      <div class="profile-card-grid">${LEVELS.map(testCard).join("")}</div>
      <p class="profile-test-note muted small">Practice certificates record your own practice. They are not official exam results.</p>
    </section>
  </div>`;
}

/** A small entrance and section reveals; the complete page stays visible without motion support. */
export function mount() {
  const page = document.querySelector(".profile-page");
  if (!page || !motionOK()) return;
  const scene = gsap.context(() => {
    enter(".profile-head, .profile-save-note, .profile-overview", { y: 12, duration: 0.65, stagger: 0.05 });
    revealOnScroll(".profile-section", { y: 12, duration: 0.65, stagger: 0.05 });
    page.querySelectorAll("[data-profile-count]").forEach((el) => {
      countUp(el, Number(el.dataset.profileCount), { duration: 0.9 });
    });
  }, page);
  onLeave(() => scene.revert());
}
