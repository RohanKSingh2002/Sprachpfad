// Learning state. Guests save locally; the account controller supplies a separate save handler.

import { LEVELS, LEVEL_BY_ID, ALL_LESSONS, ALL_WORDS, gradedTasks } from "./content.js";
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
  coursePlans: {}, // start of the current pace, anchored at the first unfinished course target
});

let S = fresh();
let seeded = false; // an older save got its review queue on this load
let accountSave = null;

/** Days until a word comes back after 1, 2, 3, 4 and 5 or more right answers in a row. */
export const INTERVALS = [1, 3, 7, 14, 30];
/** Saves from before the review queue: at most this many of their words come due on the same day. */
const SEED_PER_DAY = 20;
/** New words a day in today's session. */
export const NEW_PER_DAY = 10;

const object = value => value && typeof value === "object" && !Array.isArray(value) ? value : {};
const count = (value, max = 1000000) => Number.isFinite(value) ? Math.max(0, Math.min(max, Math.floor(value))) : 0;
const dateKey = value => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
const lessonKey = value => typeof value === "string" && /^(a1|a2|b1)-\d+$/.test(value);
const targetKey = value => lessonKey(value) || typeof value === "string" && /^checkpoint-\d+$/.test(value);
const levelKey = value => Object.hasOwn(LEVEL_BY_ID, value);
function entries(value, convert) {
  return Object.fromEntries(Object.entries(object(value)).flatMap(([key, item]) => {
    if (["__proto__", "prototype", "constructor"].includes(key)) return [];
    const next = convert(item, key);
    return next === undefined ? [] : [[key, next]];
  }));
}

function savedToday(value) {
  const t = object(value);
  if (!dateKey(t.date)) return null;
  return {
    date: t.date, cards: count(t.cards), added: count(t.added),
    opened: Array.isArray(t.opened) ? t.opened.filter(lessonKey) : [],
    plan: entries(t.plan, (key, level) => levelKey(level) && lessonKey(key) ? key : undefined),
    courseSessions: entries(t.courseSessions, (session, level) => {
      const s = object(session);
      if (!levelKey(level) || !targetKey(s.key) || ![8, 16, 24].includes(s.weeks) ||
          !["all", "study", "exercises", "review", "comprehension", "production", "feedback"].includes(s.phase)) return;
      return { key: s.key, phase: s.phase, week: count(s.week, 24), day: count(s.day, 7),
        rest: s.rest === true, weeks: s.weeks, version: count(s.version) };
    }),
  };
}

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
function load(value) {
  try {
    const s = value === undefined ? JSON.parse(localStorage.getItem(KEY)) : value;
    if (!s || typeof s !== "object" || Array.isArray(s)) return fresh();
    const lessons = {};
    Object.entries(object(s.lessons || s.l)).forEach(([k, v]) => {
      const key = /^\d+$/.test(k) ? `a1-${k}` : k;
      if (lessonKey(key) && v && typeof v === "object") lessons[key] = { done: v.done === true, score: count(v.score, 1000) };
    });
    let tests = s.tests || s.test || {};
    if (typeof tests.best === "number") tests = { a1: tests };
    const level = s.level || s.lv;
    const known = Array.isArray(s.known) ? [...new Set(s.known.filter(word => typeof word === "string" && ALL_WORDS.includes(word)))] : [];
    return {
      lessons,
      known,
      review: s.review && typeof s.review === "object" ? entries(s.review, (value, word) => {
        const r = object(value);
        if (!ALL_WORDS.includes(word) || !dateKey(r.due)) return;
        return { box: count(r.box, INTERVALS.length), due: r.due, seen: dateKey(r.seen) ? r.seen : null,
          missed: r.missed === true, ...(lessonKey(r.from) ? { from: r.from } : {}) };
      }) : seedReview(lessons, known),
      days: entries(s.days, (value, day) => dateKey(day) ? count(value) : undefined),
      tests: entries(tests, (value, id) => levelKey(id) && Number.isFinite(value?.best)
        ? { best: count(value.best, 1000), date: count(value.date, 8640000000000000), version: count(value.version) || 1 } : undefined),
      level: levelKey(level) ? level : null,
      today: savedToday(s.today),
      courseChecks: entries(s.courseChecks, (value, key) => /^[a-z0-9]+-v\d+-\d+$/.test(key)
        ? entries(value, (result, skill) => skill === "workshopScore" ? count(result, 6)
          : ["listening", "reading", "writing", "speaking"].includes(skill) ? result === true : undefined) : undefined),
      coursePace: entries(s.coursePace, (weeks, id) => levelKey(id) && [8, 16, 24].includes(weeks) ? weeks : undefined),
      coursePlans: entries(s.coursePlans, (value, id) => {
        const p = object(value);
        if (!levelKey(id) || !dateKey(p.date) || !targetKey(p.firstTarget) || ![8, 16, 24].includes(p.weeks)) return;
        return { date: p.date, firstTarget: p.firstTarget, weeks: p.weeks, version: count(p.version) };
      }),
    };
  } catch (e) {
    return fresh();
  }
}

/** Call once the content has loaded. */
export function initState({ value, onSave = null } = {}) {
  seeded = false;
  accountSave = onSave;
  S = load(value);
  if (seeded) save(); // keep the queue's dates from shifting on the next visit
}

export const stateSnapshot = () => JSON.parse(JSON.stringify(S));
export const emptyProgress = fresh;
export const browserProgress = () => load();
export const hasProgress = (s) => !!(s && (Object.keys(s.lessons || {}).length ||
  s.known?.length || Object.keys(s.days || {}).length || Object.keys(s.tests || {}).length ||
  Object.keys(s.courseChecks || {}).length));

function save() {
  if (accountSave) {
    accountSave(stateSnapshot());
    return;
  }
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
export const coursePace = (level) => [8, 16, 24].includes(S.coursePace[level.id]) ? S.coursePace[level.id] : level.course.weeks;
export function setCoursePace(level, weeks) {
  if (![8, 16, 24].includes(weeks)) return;
  if (weeks === coursePace(level)) return;
  S.coursePace[level.id] = weeks;
  delete S.coursePlans[level.id];
  if (S.today?.courseSessions) delete S.today.courseSessions[level.id];
  save();
}

/** A pace change starts the remaining targets today; existing results are kept separately. */
export function coursePlanStart(level, firstTarget) {
  let plan = S.coursePlans[level.id];
  if (!plan || plan.weeks !== coursePace(level) || plan.version !== level.course.version ||
      !/^\d{4}-\d{2}-\d{2}$/.test(plan.date || "")) {
    plan = { date: todayKey(), firstTarget, weeks: coursePace(level), version: level.course.version };
    S.coursePlans[level.id] = plan;
    save();
  }
  return plan;
}

/** Keep today's suggestion in place when it is completed, just like the ordinary lesson session. */
export function courseDay(level, suggestion) {
  const t = today();
  t.courseSessions ||= {};
  let session = t.courseSessions[level.id];
  if (!session || session.weeks !== coursePace(level) || session.version !== level.course.version) {
    session = { ...suggestion, weeks: coursePace(level), version: level.course.version };
    t.courseSessions[level.id] = session;
    save();
  }
  return session;
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

/** Current module vocabulary first, then gaps in earlier modules. Other levels keep topic order. */
export function newWords(level) {
  let sets = level.topics;
  if (level.course) {
    const modules = level.course.modules;
    const current = modules.findIndex(module => {
      const checks = courseChecks(level, module.id);
      return !module.lessonIds.every(id => {
        const lesson = level.lessons.find(item => item.id === id);
        return isDone(lesson) && lessonScore(lesson) / gradedTasks(lesson).length >= 0.8;
      }) || !(checks.workshopScore >= 5) || !["listening", "reading", "writing", "speaking"].every(skill => checks[skill]);
    });
    const through = current < 0 ? modules : [modules[current], ...modules.slice(0, current)];
    sets = through.flatMap(module => [
      ...module.lessonIds.map(id => level.lessons.find(lesson => lesson.id === id)),
      ...module.topics.map(id => level.topics.find(topic => topic.id === id)),
    ]).filter(Boolean);
    if (current < 0) sets.push(...level.topics);
  }
  const words = sets.flatMap(set => set.vocab.map(word => word.de));
  return words.filter((w, i) => !S.review[w] && words.indexOf(w) === i);
}

/** Today's new words for the level: what is left of the day's ten. */
export const wordsToLearn = (level) => newWords(level).slice(0, Math.max(0, NEW_PER_DAY - addedToday()));

/** The lesson or topic introducing the next word in the current study queue. */
export const nextTopic = (level) => {
  const word = newWords(level)[0];
  return [...(level.course ? level.lessons : []), ...level.topics].find(set => set.vocab.some(item => item.de === word)) || null;
};

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
