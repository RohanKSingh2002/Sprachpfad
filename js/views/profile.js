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
  profilePhoto,
  sentenceStats,
  setProfilePhoto,
  streak,
  studySecondsOn,
  testResult,
} from "../state.js";
import { ARROW_ICON } from "../ui/icons.js";
import { countUp, enter, gsap, motionOK, onLeave, revealOnScroll } from "../ui/motion.js?v=20261113-polish1";
import { esc } from "../utils.js";
import { profileAccount } from "./account.js?v=20261113-profile-photo7";
import { prepareProfilePhoto } from "../profile-photo.js?v=20261113-profile-photo7";
import { localInstruction } from "../study-language.js";

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

function activityHistory(days) {
  const today = new Date();
  const history = Array.from({ length: days }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - days + 1 + index);
    return { date, actions: answersOn(date), seconds: studySecondsOn(date) };
  });
  const totals = history.reduce((sum, day) => ({ actions: sum.actions + day.actions, seconds: sum.seconds + day.seconds }), { actions: 0, seconds: 0 });
  const maxTime = Math.max(1, ...history.map(day => day.seconds));
  const maxActions = Math.max(1, ...history.map(day => day.actions));
  const bars = history.map(day => `<div title="${esc(dateLabel(day.date))}: ${Math.floor(day.seconds / 60)} min, ${day.actions} actions"><i style="--bar:${day.seconds / maxTime * 100}%"></i><b style="--bar:${day.actions / maxActions * 100}%"></b></div>`).join("");
  return `<p>${Math.floor(totals.seconds / 60)} study minutes · ${totals.actions} practice actions</p>
    <div class="profile-study-bars" aria-hidden="true">${bars}</div>
    <p class="small muted profile-study-legend"><span>Study time</span><span>Practice actions</span></p>
    <details><summary>View daily values</summary><div class="profile-study-table"><table><thead><tr><th scope="col">Date</th><th scope="col">Study time</th><th scope="col">Actions</th></tr></thead><tbody>${history.slice().reverse().map(day => `<tr><th scope="row">${esc(dateLabel(day.date))}</th><td>${Math.floor(day.seconds / 60)} min ${day.seconds % 60} s</td><td>${day.actions}</td></tr>`).join("")}</tbody></table></div></details>`;
}

function sentenceActivity(days, lesson) {
  const stats = sentenceStats(days, new Date(), lesson);
  const metrics = [
    ["Unique sentences", stats.unique], ["Shadowing completions", stats.listen], ["Recall completions", stats.recall],
    ["Build completions", stats.build], ["Audio repetitions", stats.reps],
    ["Listening time", `${Math.floor(stats.audioSeconds / 60)} min ${stats.audioSeconds % 60} s`],
    ["Challenge points", stats.challenge],
  ];
  return `<dl class="profile-sentence-stats">${metrics.map(([label, value]) =>
    `<div><dt>${label}</dt><dd>${value}</dd></div>`).join("")}</dl>`;
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
    </div>
    ${profileAccount()}
    ${overview()}
    ${practice(level)}
    <section class="profile-section" aria-labelledby="profile-activity-heading">
      <div class="profile-activity-head"><h2 id="profile-activity-heading">Activity details</h2>
        <label>Period <select id="profile-activity-period"><option value="7">Last 7 days</option><option value="30">Last 30 days</option></select></label>
      </div>
      <div class="profile-activity-grid">
        <article class="panel" aria-labelledby="profile-study-heading"><h3 id="profile-study-heading">Study activity</h3>
          <div id="profile-study-history">${activityHistory(7)}</div>
        </article>
        <article class="panel" aria-labelledby="profile-sentences-heading"><h3 id="profile-sentences-heading">Sentence practice activity</h3>
          <label class="profile-lesson-filter">Lesson<select id="profile-sentence-lesson"><option value="">All lessons and collections</option>${ALL_LESSONS.map(lesson =>
            `<option value="${lesson.key}">${esc(lesson.level.name)} · ${esc(lesson.title)}</option>`).join("")}</select></label>
          <div id="profile-sentence-activity" aria-live="polite">${sentenceActivity(7, "")}</div>
        </article>
      </div>
    </section>
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

function paintProfilePhoto(strip, message) {
  const photo = profilePhoto();
  const image = strip.querySelector('img');
  if (photo) image.src = photo;
  else image.removeAttribute('src');
  image.hidden = !photo;
  strip.querySelector('[data-profile-picture-label]').textContent = localInstruction(photo ? 'Change profile picture' : 'Add profile picture');
  strip.querySelector('[data-profile-picture-remove]').hidden = !photo;
  strip.querySelector('.profile-picture-status').textContent = localInstruction(message);
  document.dispatchEvent(new Event('profilephotochange'));
}

export function onClick(_event, button) {
  if (button?.hasAttribute('data-profile-picture-choose')) {
    const input = document.getElementById('profile-picture-file');
    input.value = '';
    input.click();
    return;
  }
  if (!button?.hasAttribute('data-profile-picture-remove')) return;
  const strip = button.closest('.profile-picture-strip');
  if (setProfilePhoto('')) {
    paintProfilePhoto(strip, 'Profile picture removed.');
    strip.querySelector('[data-profile-picture-choose]').focus();
  }
  else strip.querySelector('.profile-picture-status').textContent = localInstruction('The picture could not be saved in this browser.');
}

async function changeProfilePicture(input) {
  const file = input.files?.[0];
  if (!file) return;
  const strip = input.closest('.profile-picture-strip');
  const choose = strip.querySelector('[data-profile-picture-choose]');
  const remove = strip.querySelector('[data-profile-picture-remove]');
  const status = strip.querySelector('.profile-picture-status');
  choose.disabled = remove.disabled = true;
  status.textContent = localInstruction('Preparing picture…');
  try {
    const photo = await prepareProfilePhoto(file);
    if (!strip.isConnected) return;
    if (!setProfilePhoto(photo)) throw new Error('The picture could not be saved in this browser.');
    paintProfilePhoto(strip, 'Profile picture updated.');
  } catch (error) {
    if (strip.isConnected) status.textContent = localInstruction(error.message);
  } finally {
    choose.disabled = remove.disabled = false;
    if (strip.isConnected && document.activeElement === document.body) choose.focus();
  }
}

export function onChange(event) {
  if (event.target.id === 'profile-picture-file') { void changeProfilePicture(event.target); return; }
  const periodChanged = event.target.id === "profile-activity-period";
  if (!periodChanged && event.target.id !== "profile-sentence-lesson") return;
  const days = Number(document.getElementById("profile-activity-period").value);
  const lesson = document.getElementById("profile-sentence-lesson").value;
  if (periodChanged) document.getElementById("profile-study-history").innerHTML = activityHistory(days);
  document.getElementById("profile-sentence-activity").innerHTML = sentenceActivity(days, lesson);
}

/** A small entrance and section reveals; the complete page stays visible without motion support. */
export function mount() {
  const page = document.querySelector(".profile-page");
  if (!page || !motionOK()) return;
  const scene = gsap.context(() => {
    enter(".profile-head, .profile-save-note, .profile-overview", { y: 8, duration: 0.46, stagger: 0.035 });
    revealOnScroll(".profile-section", { y: 8, duration: 0.46, stagger: 0.035 });
    page.querySelectorAll("[data-profile-count]").forEach((el) => {
      countUp(el, Number(el.dataset.profileCount), { duration: 0.9 });
    });
  }, page);
  onLeave(() => scene.revert());
}
