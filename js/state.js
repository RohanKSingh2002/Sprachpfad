// Progress saved in the browser: finished lessons, known words, the review queue, practice days,
// test results, the current level and what has been done today.

import { LEVELS, LEVEL_BY_ID, ALL_LESSONS, ALL_WORDS } from "./content.js";
import { addDays, dayKey, todayKey } from "./utils.js";

const KEY = "sprachpfad-v1";

const fresh = () => ({
  lessons: {}, // "a2-3": { done: true, score: 5 }
  known: [], // German words marked as known in the flashcards at least once
  review: {}, // "der Tisch": { box: 0–5, due: "2026-10-04", seen: "2026-10-01" | null, missed: false, from?: "a1-3" }
  days: {}, // "2026-10-01": number of answers that day
  tests: {}, // "a2": { best: 8, date: 1790000000000 }
  level: null, // id of the level last opened
  today: null, // { date, cards, added, opened: ["a2-3"], plan: { a2: "a2-3" } }
  courseChecks: {}, // learner practice and feedback records for course modules
  coursePace: {}, // preferred course length in weeks
});

let S = fresh();
let seeded = false; // an older save got its review queue on this load

/** Days until a word comes back after 1, 2, 3, 4 and 5 or more right answers in a row. */
export const INTERVALS = [1, 3, 7, 14, 30];
/** Saves from before the review queue: at most this many of their words come due on the same day. */
const SEED_PER_DAY = 20;
/** New words a day in today's session. */
export const NEW_PER_DAY = 10;

/**
 * Saves from before the review queue: queue the words met so far (marked known, or from finished
 * lessons), spread over the coming days so they don't all come due at once.
 */
function seedReview(lessons, known) {
  const today = todayKey();
  const seen = new Set(known);
  ALL_LESSONS.forEach((l) => lessons[l.key]?.done && l.vocab.forEach((w) => seen.add(w.de)));
  const met = ALL_WORDS.filter((w) => seen.has(w));
  const review = {};
  seeded = true;
  met.forEach((w, i) => {
    review[w] = {
      box: known.includes(w) ? 1 : 0,
      due: addDays(today, Math.floor(i / SEED_PER_DAY)),
      seen: null,
      missed: false,
    };
  });
  return review;
}

/**
 * Read saved progress. Older saves used short keys (l, test, lv), plain A1 lesson numbers
 * and a single test result, and had no review queue; they are converted here.
 */
function load() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    if (!s) return fresh();
    const lessons = {};
    Object.entries(s.lessons || s.l || {}).forEach(([k, v]) => {
      lessons[/^\d+$/.test(k) ? `a1-${k}` : k] = v;
    });
    let tests = s.tests || s.test || {};
    if (typeof tests.best === "number") tests = { a1: tests };
    const level = s.level || s.lv;
    const known = Array.isArray(s.known) ? s.known : [];
    return {
      lessons,
      known,
      review: s.review && typeof s.review === "object" ? s.review : seedReview(lessons, known),
      days: s.days || {},
      tests,
      level: LEVEL_BY_ID[level] ? level : null,
      today: s.today && typeof s.today === "object" ? s.today : null,
      courseChecks: s.courseChecks && typeof s.courseChecks === "object" ? s.courseChecks : {},
      coursePace: s.coursePace && typeof s.coursePace === "object" ? s.coursePace : {},
    };
  } catch (e) {
    return fresh();
  }
}

/** Call once the content has loaded. */
export function initState() {
  S = load();
  if (seeded) save(); // keep the queue's dates from shifting on the next visit
}

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(S));
  } catch (e) {
    // Storage can be full or blocked (private mode); the app keeps working without it.
  }
}

export function resetState() {
  S = fresh();
  save();
}

/* ---------- practice log ---------- */

function countAnswer() {
  const k = todayKey();
  S.days[k] = (S.days[k] || 0) + 1;
}

/** Count one answer towards today's square on the practice calendar. */
export function logPractice() {
  countAnswer();
  save();
}

export const courseChecks = (level, moduleId) => S.courseChecks[`${level.id}-v${level.course.version}-${moduleId}`] || {};
export function recordCourseCheck(level, moduleId, skill, value) {
  const key = `${level.id}-v${level.course.version}-${moduleId}`;
  S.courseChecks[key] = { ...courseChecks(level, moduleId), [skill]: value };
  save();
}
export const coursePace = (level) => S.coursePace[level.id] || level.course.weeks;
export function setCoursePace(level, weeks) {
  if (![8, 16, 24].includes(weeks)) return;
  S.coursePace[level.id] = weeks;
  save();
}

export const answersOn = (date) => S.days[dayKey(date)] || 0;

/** Days in a row with at least one answer, counting today or, if nothing yet today, yesterday. */
export function streak() {
  let n = 0;
  let day = todayKey();
  if (!S.days[day]) day = addDays(day, -1);
  while (S.days[day]) {
    n++;
    day = addDays(day, -1);
  }
  return n;
}

/* ---------- today ---------- */

/** What has been done today; starts fresh every day. */
function today() {
  const date = todayKey();
  if (!S.today || S.today.date !== date) S.today = { date, cards: 0, added: 0, opened: [], plan: {} };
  return S.today;
}

/** Flashcard answers given today. */
export const cardsToday = () => today().cards;

/** Words seen for the first time today (they joined the review queue when they were answered). */
export const addedToday = () => today().added || 0;

/** A lesson page was opened (its grammar is the second step of today's session). */
export function markOpened(lesson) {
  const t = today();
  if (!t.opened.includes(lesson.key)) {
    t.opened.push(lesson.key);
    save();
  }
}

export const openedToday = (lesson) => today().opened.includes(lesson.key);

/**
 * The lesson today's session is about: the level's next lesson, fixed for the day so that finishing it
 * shows the session as done instead of moving on to the next one. Null when the level is finished.
 */
export function sessionLesson(level) {
  const t = today();
  const planned = level.lessons.find((l) => l.key === t.plan[level.id]);
  if (planned) return planned;
  const next = nextLesson(level);
  if (next) {
    t.plan[level.id] = next.key;
    save();
  }
  return next;
}

/* ---------- lessons ---------- */

export const isDone = (lesson) => !!S.lessons[lesson.key]?.done;
export const lessonScore = (lesson) => S.lessons[lesson.key]?.score ?? 0;
export const nextLesson = (level) => level.lessons.find((l) => !isDone(l)) || null;
export const doneCount = (level) => level.lessons.filter(isDone).length;
export const doneTotal = () => ALL_LESSONS.filter(isDone).length;

/**
 * Mark a lesson as done, keeping the best score, and queue its words for review (new words come due
 * today). Returns how many words joined the queue.
 */
export function recordLesson(lesson, score) {
  S.lessons[lesson.key] = { done: true, score: Math.max(score, lessonScore(lesson)) };
  let queued = 0;
  lesson.vocab.forEach(({ de }) => {
    if (!S.review[de]) {
      S.review[de] = { box: 0, due: todayKey(), seen: null, missed: false, from: lesson.key };
      queued++;
    }
  });
  save();
  return queued;
}

/* ---------- mock tests ---------- */

export const testResult = (level) => {
  const result = S.tests[level.id];
  return result && (result.version || 1) === (level.test.version || 1) ? result : null;
};
export const passed = (level) => (testResult(level)?.best ?? -1) >= level.test.passMark;

/** Keep the best score (a tie updates the date). */
export function recordTest(level, score) {
  const prev = testResult(level);
  if (!prev || score >= prev.best) {
    S.tests[level.id] = { best: score, date: Date.now(), version: level.test.version || 1 };
    save();
  }
}

/* ---------- words and the review queue ---------- */

export const knownIn = (words) => words.filter((w) => S.known.includes(w)).length;

export const reviewOf = (word) => S.review[word] || null;

/**
 * Record a flashcard answer. "I knew it" moves the word up a box and sends it away for longer
 * (1, 3, 7, 14, then 30 days); "Again" puts it back in the first box, due today.
 */
export function rateWord(word, knew) {
  const date = todayKey();
  const t = today();
  if (!S.review[word]) t.added = (t.added || 0) + 1;
  const r = S.review[word] || { box: 0 };
  if (knew) {
    r.box = Math.min((r.box || 0) + 1, INTERVALS.length);
    r.due = addDays(date, INTERVALS[r.box - 1]);
    r.missed = false;
    if (!S.known.includes(word)) S.known.push(word);
  } else {
    r.box = 0;
    r.due = date;
    r.missed = true;
  }
  r.seen = date;
  S.review[word] = r;
  t.cards++;
  countAnswer();
  save();
}

const isDue = (word, date) => S.review[word] && S.review[word].due <= date;

/** Words due today or earlier: missed ones first, then the longest overdue, then new words in lesson order. */
export function dueWords() {
  const date = todayKey();
  const group = (w) => (S.review[w].missed ? 0 : S.review[w].seen ? 1 : 2);
  return ALL_WORDS.filter((w) => isDue(w, date)).sort(
    (a, b) => group(a) - group(b) || S.review[a].due.localeCompare(S.review[b].due),
  );
}

/** The level's topic words that aren't in the review queue yet, topic by topic. */
export function newWords(level) {
  const words = level.topics.flatMap((t) => t.vocab.map((w) => w.de));
  return words.filter((w, i) => !S.review[w] && words.indexOf(w) === i);
}

/** Today's new words for the level: what is left of the day's ten. */
export const wordsToLearn = (level) => newWords(level).slice(0, Math.max(0, NEW_PER_DAY - addedToday()));

/** The first topic of the level that still has new words, or null. */
export const nextTopic = (level) => level.topics.find((t) => t.vocab.some((w) => !S.review[w.de])) || null;

export const dueCount = () => {
  const date = todayKey();
  return ALL_WORDS.reduce((n, w) => n + (isDue(w, date) ? 1 : 0), 0);
};

/** The next day words come due (after today) and how many: { date, count }, or null. */
export function nextDue() {
  const date = todayKey();
  let first = null;
  let count = 0;
  ALL_WORDS.forEach((w) => {
    const due = S.review[w]?.due;
    if (!due || due <= date) return;
    if (!first || due < first) {
      first = due;
      count = 1;
    } else if (due === first) count++;
  });
  return first ? { date: first, count } : null;
}

/* ---------- current level ---------- */

/** The level shown on the home page: the one last opened, else the first with lessons left. */
export const currentLevel = () =>
  LEVEL_BY_ID[S.level] || LEVELS.find((lv) => nextLesson(lv)) || LEVELS[LEVELS.length - 1];

export function setLevel(level) {
  if (S.level !== level.id) {
    S.level = level.id;
    save();
  }
}
