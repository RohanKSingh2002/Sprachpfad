// Learning state. Guests save locally; the account controller supplies a separate save handler.

import { LEVELS, LEVEL_BY_ID, ALL_LESSONS, ALL_WORDS, SETS, gradedTasks, isFlashcardSet, isSavedWord } from "./content.js";
import { addDays, dayKey, todayKey } from "./utils.js";
import { DEFAULT_GERMAN_VOICE, GERMAN_VOICES } from "./german-voices.js";

const KEY = "sprachpfad-v1";

const fresh = () => ({
  lessons: {}, // "a2-3": { done: true, score: 5 }
  known: [], // German words marked as known in the flashcards at least once
  review: {}, // "der Tisch": { box: 0–5, due: "2026-10-04", seen: "2026-10-01" | null, missed: false, from?: "a1-3" }
  days: {}, // "2026-10-01": number of answers that day
  studySeconds: {},
  studyGoal: { unit: "actions", target: 10 },
  recentLessons: [],
  sentenceActivity: {},
  lessonVisits: {},
  sentenceListening: {},
  smartReview: null,
  studyPins: [],
  wordCues: {},
  tests: {}, // "a2": { best: 8, date: 1790000000000 }
  level: null, // id of the level last opened
  today: null, // { date, cards, added, opened: ["a2-3"], plan: { a2: "a2-3" } }
  courseChecks: {}, // learner practice and feedback records for course modules
  coursePace: {}, // preferred course length in weeks
  coursePlans: {}, // start of the current pace, anchored at the first unfinished course target
  sentenceCollections: {}, // personal sentence groups; source cards keep a stable content id
  sentenceReview: {}, // sentence id: { due, seen, missed }
  sentenceFavorites: [],
  sentencePreferences: savedSentencePreferences(),
  sitePreferences: savedSitePreferences(),
});

/** Days until a word comes back after 1, 2, 3, 4 and 5 or more right answers in a row. */
export const INTERVALS = [1, 3, 7, 14, 30];
/** Saves from before the review queue: at most this many of their words come due on the same day. */
const SEED_PER_DAY = 20;
/** New words a day in today's session. */
export const NEW_PER_DAY = 10;
/** Return delays for the five sentence confidence ratings. */
export const SENTENCE_INTERVALS = [0, 1, 3, 7, 30];
export const SENTENCE_ROUND_SIZES = [5, 10, 20, 30];
export const SENTENCE_SOURCES = { all: "All sentences", lesson: "Lesson examples", saved: "My collections" };
export const SENTENCE_MODES = { recall: "Active recall", listen: "Listen and repeat", build: "Build the sentence" };
export const SENTENCE_REPEATS = [1, 2, 3, 4, 5];
export const AUDIO_SPEED_RANGE = { min: 0.5, max: 2, step: 0.05 };
export const SMART_REVIEW_SIZES = [20, 30, 50, 75, 100];
export const SMART_REVIEW_SOURCES = {
  all: "All material", preferSaved: "Collections first", saved: "Collections only",
};
export const LESSON_SENTENCE_COLLECTION = "lesson-sentences";
const SENTENCE_SEED_PER_DAY = 20;
const MAX_SAVED_SENTENCES = 200;

const object = value => value && typeof value === "object" && !Array.isArray(value) ? value : {};
let S = fresh();
let seeded = false; // an older save got its review queue on this load
let accountSave = null;

const count = (value, max = 1000000) => Number.isFinite(value) ? Math.max(0, Math.min(max, Math.floor(value))) : 0;
const dateKey = value => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
const lessonKey = value => typeof value === "string" && /^(a1|a2|b1)-\d+$/.test(value);
const targetKey = value => lessonKey(value) || typeof value === "string" && /^checkpoint-\d+$/.test(value);
const levelKey = value => Object.hasOwn(LEVEL_BY_ID, value);
const sentenceId = value => typeof value === "string" && /^[a-z0-9][a-z0-9_-]{0,119}$/i.test(value) && !Object.hasOwn(Object.prototype, value);
const cleanSentenceText = value => typeof value === "string" ? value.trim().slice(0, 500) : "";
const savedVoice = value => typeof value === "string" ? value.trim().slice(0, 250) : "";
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

/** Existing completed lessons join sentence review gradually, so an update does not flood today's queue. */
function seedSentenceReview(lessons) {
  const sentences = ALL_LESSONS.flatMap(lesson => lessons[lesson.key]?.done
    ? (lesson.examples || []).map((_, index) => lessonSentence(lesson, index)).filter(Boolean) : []);
  if (!sentences.length) return {};
  const today = todayKey();
  seeded = true;
  return Object.fromEntries(sentences.map(({ id }, position) => [id, {
    due: addDays(today, Math.floor(position / SENTENCE_SEED_PER_DAY)), seen: null, missed: false,
  }]));
}

function savedSentencePreferences(value) {
  const p = object(value);
  const { source, size, mode, speed, repeats, pause, paired, autoplay, loop, largeText } = p;
  const decimal = (number, min, max, step, fallback) => Number.isFinite(number) && number >= min && number <= max
    ? Math.round(number / step) * step : fallback;
  const playbackLoop = ["off", "sentence", "batch"].includes(loop) ? loop : loop === true ? "sentence" : "off";
  return {
    source: Object.hasOwn(SENTENCE_SOURCES, source) ? source : "all",
    size: SENTENCE_ROUND_SIZES.includes(size) ? size : 10,
    mode: Object.hasOwn(SENTENCE_MODES, mode) ? mode : "recall",
    speed: Number(decimal(speed, AUDIO_SPEED_RANGE.min, AUDIO_SPEED_RANGE.max, AUDIO_SPEED_RANGE.step, 1).toFixed(2)),
    repeats: SENTENCE_REPEATS.includes(repeats) ? repeats : 1,
    pause: decimal(pause, 0, 10, 0.5, 2),
    languagePause: decimal(p.languagePause, 0, 10, 0.5, 0.5),
    paired: paired === true,
    pairEveryRepeat: p.pairEveryRepeat === true,
    autoplay: autoplay === true,
    loop: playbackLoop,
    textSize: ["small", "normal", "large", "largest"].includes(p.textSize) ? p.textSize : largeText ? "large" : "normal",
    translation: typeof p.translation === "boolean" ? p.translation : null,
    feedback: ["first", "always", "off"].includes(p.feedback) ? p.feedback : "first",
    smartSize: SMART_REVIEW_SIZES.includes(p.smartSize) ? p.smartSize : 20,
    smartSource: Object.hasOwn(SMART_REVIEW_SOURCES, p.smartSource) ? p.smartSource : "all",
    language: ["en", "es", "fr"].includes(p.language) ? p.language : "en",
  };
}

function savedSitePreferences(value, oldLanguage) {
  const { appLanguage, text, motion, home, reviewMode, cardDirection, cardSize, cardMissed, lessonLayout, lessonSounds, lessonCelebrations, germanVoice } = object(value);
  return {
    appLanguage: ["en", "es", "fr"].includes(appLanguage) ? appLanguage : ["es", "fr"].includes(oldLanguage) ? oldLanguage : "en",
    text: ["normal", "large", "extra"].includes(text) ? text : "normal",
    motion: ["device", "reduced", "full"].includes(motion) ? motion : "device",
    home: ["mix", "course", "review"].includes(home) ? home : "mix",
    reviewMode: Object.hasOwn(SENTENCE_MODES, reviewMode) ? reviewMode : "recall",
    lessonLayout: lessonLayout === "focus" ? "focus" : "list",
    lessonSounds: lessonSounds === true,
    lessonCelebrations: lessonCelebrations !== false,
    germanVoice: Object.hasOwn(GERMAN_VOICES, germanVoice) ? germanVoice : DEFAULT_GERMAN_VOICE,
    cardDirection: ["de", "en", "mixed"].includes(cardDirection) ? cardDirection : "de",
    cardSize: [0, 10, 20].includes(cardSize) ? cardSize : 0,
    cardMissed: cardMissed === true,
  };
}

function loadSentenceState(saved, lessons) {
  let loaded = 0;
  const sentenceCollections = entries(saved.sentenceCollections, (value, id) => {
    const collection = object(value);
    if (!sentenceId(id) || typeof collection.name !== "string") return;
    const sentences = [];
    const ids = new Set();
    for (const item of Array.isArray(collection.sentences) ? collection.sentences : []) {
      if (loaded >= MAX_SAVED_SENTENCES) break;
      const card = object(item);
      const de = cleanSentenceText(card.de), en = cleanSentenceText(card.en);
      if (!sentenceId(card.id) || ids.has(card.id) || !de || !en) continue;
      ids.add(card.id);
      sentences.push({ id: card.id, de, en,
        ...(typeof card.origin === "string" ? { origin: card.origin.slice(0, 120) } : {}),
        ...(savedVoice(card.voice) ? { voice: savedVoice(card.voice) } : {}),
      });
      loaded++;
    }
    return { name: collection.name.trim().slice(0, 60) || "My sentences", sentences, ...(collection.pinned === true ? { pinned: true } : {}) };
  });
  const sentenceReview = saved.sentenceReview && typeof saved.sentenceReview === "object" && !Array.isArray(saved.sentenceReview)
    ? entries(saved.sentenceReview, (value, id) => {
      const review = object(value);
      if (!sentenceId(id) || !dateKey(review.due)) return;
      return { due: review.due, seen: dateKey(review.seen) ? review.seen : null, missed: review.missed === true,
        ...(Number.isInteger(review.rating) && review.rating >= 1 && review.rating <= 5 ? { rating: review.rating } : {}) };
    }) : seedSentenceReview(lessons);
  for (const group of Object.values(sentenceCollections)) {
    for (const card of group.sentences) sentenceReview[card.id] ??= newSentenceReview();
  }
  const sentenceFavorites = Array.isArray(saved.sentenceFavorites)
    ? [...new Set(saved.sentenceFavorites.filter(id => sentenceId(id) && Object.hasOwn(sentenceReview, id)))] : [];
  const sentenceListening = entries(saved.sentenceListening, (value, id) =>
    sentenceId(id) && Number.isInteger(value) && value >= 1 && value <= 5 ? value : undefined);
  return { sentenceCollections, sentenceReview, sentenceListening, sentenceFavorites, sentencePreferences: savedSentencePreferences(saved.sentencePreferences) };
}

export const STUDY_GOAL_LIMITS = { minutes: 120, actions: 300, repetitions: 1000 };
function savedStudyGoal(value) {
  const { unit, target, repetitions } = object(value);
  if (unit === "either" && validGoal("minutes", target) && validGoal("repetitions", repetitions)) {
    return { unit, target, repetitions };
  }
  if (!Object.hasOwn(STUDY_GOAL_LIMITS, unit) || !Number.isInteger(target) || target < 1 || target > STUDY_GOAL_LIMITS[unit]) {
    return { unit: "actions", target: 10 };
  }
  return { unit, target };
}

function validGoal(unit, target) {
  return Number.isInteger(target) && target >= 1 && target <= STUDY_GOAL_LIMITS[unit];
}

function savedActivity(value) {
  return entries(value, (row, date) => {
    if (!dateKey(date)) return;
    return entries(row, (item, id) => {
      if (!sentenceId(id)) return;
      return Object.fromEntries(["recall", "listen", "build", "challenge", "reps", "audioSeconds"].map(key => [key, count(item?.[key])]));
    });
  });
}

function savedSmartReview(value) {
  const p = object(value);
  if (p.date !== todayKey() || !Array.isArray(p.items)) return null;
  const items = p.items.filter(item => sentenceId(item?.id) && typeof item.fresh === "boolean").slice(0, 100);
  return { date: p.date, size: SMART_REVIEW_SIZES.includes(p.size) ? p.size : 20,
    source: Object.hasOwn(SMART_REVIEW_SOURCES, p.source) ? p.source : "all", items,
    done: Array.isArray(p.done) ? [...new Set(p.done.filter(sentenceId))].slice(0, 1000) : [] };
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
    const known = Array.isArray(s.known) ? [...new Set(s.known.filter(isSavedWord))] : [];
    return {
      lessons,
      known,
      review: s.review && typeof s.review === "object" ? entries(s.review, (value, word) => {
        const r = object(value);
        if (!isSavedWord(word) || !dateKey(r.due)) return;
        return { box: count(r.box, INTERVALS.length), due: r.due, seen: dateKey(r.seen) ? r.seen : null,
          missed: r.missed === true, ...(lessonKey(r.from) ? { from: r.from } : {}) };
      }) : seedReview(lessons, known),
      days: entries(s.days, (value, day) => dateKey(day) ? count(value) : undefined),
      studySeconds: entries(s.studySeconds, (value, day) => dateKey(day) ? count(value, 86400) : undefined),
      studyGoal: savedStudyGoal(s.studyGoal),
      sitePreferences: savedSitePreferences(s.sitePreferences, s.sentencePreferences?.language),
      sentenceActivity: savedActivity(s.sentenceActivity),
      smartReview: savedSmartReview(s.smartReview),
      lessonVisits: entries(s.lessonVisits, (visit, key) => lessonKey(key) && SETS.has(key) ? {
        opened: count(visit?.opened, 8640000000000000),
        next: count(visit?.next, SETS.get(key).examples?.length || 0),
        seen: Array.isArray(visit?.seen) ? [...new Set(visit.seen.filter(i =>
          Number.isInteger(i) && i >= 0 && i < (SETS.get(key).examples?.length || 0)))] : [],
      } : undefined),
      recentLessons: Array.isArray(s.recentLessons) ? [...new Set(s.recentLessons.filter(key => lessonKey(key) && SETS.has(key)))].slice(0, 8) : [],
      studyPins: Array.isArray(s.studyPins) ? [...new Set(s.studyPins.filter(key => SETS.has(key)))] : [],
      wordCues: entries(s.wordCues, (cue, word) => isSavedWord(word) && typeof cue === "string" ? cue.trim().slice(0, 120) : undefined),
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
      ...loadSentenceState(s, lessons),
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
  Object.keys(s.courseChecks || {}).length || Object.keys(s.sentenceCollections || {}).length ||
  Object.keys(s.sentenceReview || {}).length || Object.keys(s.sentenceListening || {}).length ||
  Object.keys(s.sentenceActivity || {}).length || Object.keys(s.studySeconds || {}).length ||
  s.studyPins?.length || Object.keys(s.wordCues || {}).length));

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

export const studyGoal = () => ({ ...S.studyGoal });
export function setStudyGoal(unit, target, repetitions) {
  if (unit === "either") {
    if (!validGoal("minutes", target) || !validGoal("repetitions", repetitions)) return false;
  } else if (!validGoal(unit, target)) return false;
  S.studyGoal = savedStudyGoal({ unit, target, repetitions });
  save();
  return true;
}

export function dailyGoalProgress(date = new Date()) {
  const { unit, target, repetitions } = S.studyGoal;
  const goals = unit === "either" ? [["minutes", target], ["repetitions", repetitions]] : [[unit, target]];
  const totals = { minutes: Math.floor(studySecondsOn(date) / 60), actions: answersOn(date), repetitions: sentenceStats(1, date).reps };
  return goals.map(([key, goal]) => ({ unit: key, target: goal, value: totals[key] }));
}

export const studySecondsOn = (date) => S.studySeconds[dayKey(date)] || 0;
export function logStudySeconds(day, seconds) {
  const duration = count(seconds, 86400);
  if (!dateKey(day) || !duration) return;
  S.studySeconds[day] = Math.min(86400, (S.studySeconds[day] || 0) + duration);
  save();
}

export const recentStudyLessons = () => S.recentLessons.map(key => SETS.get(key)).filter(Boolean);
export function lessonSentenceProgress(lesson) {
  const visit = S.lessonVisits[lesson.key];
  const seenIndices = [...(visit?.seen || [])];
  const eligible = (lesson.examples || []).flatMap((_, index) => lessonSentence(lesson, index) ? [index] : []);
  const remaining = eligible.filter(index => !seenIndices.includes(index));
  const next = remaining.find(index => index >= (visit?.next || 0)) ?? remaining[0] ?? 0;
  return { opened: visit?.opened || 0, next, total: eligible.length, seen: eligible.length - remaining.length, seenIndices };
}

function recordLessonSentenceVisit(lesson, index) {
  if (!lessonSentence(lesson, index)) return;
  const visit = S.lessonVisits[lesson.key] ??= { opened: Date.now(), next: 0, seen: [] };
  if (!visit.seen.includes(index)) visit.seen.push(index);
  visit.next = (index + 1) % lesson.examples.length;
  visit.opened = Date.now();
  S.recentLessons = [lesson.key, ...S.recentLessons.filter(value => value !== lesson.key)].slice(0, 8);
}
export const pinnedStudySets = () => S.studyPins.map(key => SETS.get(key)).filter(isFlashcardSet);
export const isStudyPinned = key => S.studyPins.includes(key);
export function toggleStudyPin(key) {
  if (!SETS.has(key)) return false;
  const pinned = !isStudyPinned(key);
  S.studyPins = pinned ? [...S.studyPins, key] : S.studyPins.filter(value => value !== key);
  save();
  return pinned;
}

export const wordCue = word => Object.hasOwn(S.wordCues, word) ? S.wordCues[word] : "";
export function setWordCue(word, cue) {
  if (!ALL_WORDS.includes(word)) return false;
  const text = cleanSentenceText(cue).slice(0, 120);
  if (text) S.wordCues[word] = text;
  else delete S.wordCues[word];
  save();
  return true;
}

export const courseChecks = (level, moduleId) => S.courseChecks[`${level.id}-v${level.course.version}-${moduleId}`] || {};
export function recordCourseCheck(level, moduleId, skill, value) {
  recordCourseChecks(level, moduleId, { [skill]: value });
}
export function recordCourseChecks(level, moduleId, changes) {
  const key = `${level.id}-v${level.course.version}-${moduleId}`;
  S.courseChecks[key] = { ...courseChecks(level, moduleId), ...changes };
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
  const visit = S.lessonVisits[lesson.key] ??= { opened: 0, next: 0, seen: [] };
  visit.opened = Date.now();
  if (!t.opened.includes(lesson.key)) t.opened.push(lesson.key);
  S.recentLessons = [lesson.key, ...S.recentLessons.filter(key => key !== lesson.key)].slice(0, 8);
  save();
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
 * Mark a lesson as done, keeping the best score, and queue its words and example sentences.
 * Returns how many words joined the vocabulary queue.
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
  (lesson.examples || []).forEach((_, index) => {
    const sentence = lessonSentence(lesson, index);
    if (sentence) S.sentenceReview[sentence.id] ??= newSentenceReview();
  });
  save();
  return queued;
}

/* ---------- sentence collections and review ---------- */

const makeId = prefix => `${prefix}-${globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2)}`;
const lessonSentenceId = (lesson, index) => `lesson-${lesson.key}-example-${index}`;
const newSentenceReview = () => ({ due: todayKey(), seen: null, missed: false });

export const savedSentenceCollections = () => Object.entries(S.sentenceCollections)
  .map(([id, collection]) => ({ id, ...collection }))
  .sort((a, b) => a.name.localeCompare(b.name));

export function createSentenceCollection(name) {
  const cleanName = cleanSentenceText(name).slice(0, 60);
  if (!cleanName) return null;
  const existing = Object.entries(S.sentenceCollections).find(([, collection]) => collection.name.toLowerCase() === cleanName.toLowerCase());
  if (existing) return existing[0];
  const id = makeId("collection");
  S.sentenceCollections[id] = { name: cleanName, sentences: [] };
  save();
  return id;
}

export function renameSentenceCollection(id, name) {
  const cleanName = cleanSentenceText(name).slice(0, 60);
  if (!Object.hasOwn(S.sentenceCollections, id) || !cleanName) return false;
  S.sentenceCollections[id].name = cleanName;
  save();
  return true;
}

export function toggleSentenceCollectionPin(id) {
  if (!Object.hasOwn(S.sentenceCollections, id)) return false;
  const collection = S.sentenceCollections[id];
  collection.pinned = !collection.pinned;
  save();
  return collection.pinned;
}

export function deleteSentenceCollection(id) {
  if (!Object.hasOwn(S.sentenceCollections, id)) return false;
  const removed = S.sentenceCollections[id].sentences;
  delete S.sentenceCollections[id];
  removed.forEach(item => pruneSentenceReview(item.id));
  save();
  return true;
}

export function saveSentenceToCollection(collectionId, item, persist = true) {
  if (!sentenceId(collectionId)) return null;
  const collection = S.sentenceCollections[collectionId];
  if (!collection && collectionId !== LESSON_SENTENCE_COLLECTION) return null;
  const de = cleanSentenceText(item?.de), en = cleanSentenceText(item?.en);
  if (!de || !en) return null;
  const existing = item.id && collection?.sentences.find(sentence => sentence.id === item.id);
  if (existing) return { id: existing.id, added: false };
  const totalSaved = Object.values(S.sentenceCollections).reduce((total, group) => total + group.sentences.length, 0);
  if (totalSaved >= MAX_SAVED_SENTENCES) return { added: false, limit: true };
  const target = S.sentenceCollections[collectionId] ??= { name: "Lesson sentences", sentences: [] };
  const courseCard = courseSentence(item.id);
  const cardId = courseCard?.id || (sentenceId(item.id) && Object.hasOwn(S.sentenceReview, item.id) ? item.id : makeId("sentence"));
  target.sentences.push({ id: cardId, de, en, origin: courseCard?.origin || item.origin || "Your sentence",
    ...(savedVoice(item.voice) ? { voice: savedVoice(item.voice) } : {}) });
  S.sentenceReview[cardId] ??= newSentenceReview();
  if (persist) save();
  return { id: cardId, added: true };
}

export function saveSentenceBatch(collectionId, items) {
  const target = S.sentenceCollections[collectionId];
  if (!target && collectionId !== LESSON_SENTENCE_COLLECTION) return { added: 0 };
  const existing = new Set((target?.sentences || []).map(item => item.id));
  const additions = [...new Map(items.filter(item => !existing.has(item.id)).map(item => [item.id, item])).values()];
  const total = Object.values(S.sentenceCollections).reduce((sum, group) => sum + group.sentences.length, 0);
  if (total + additions.length > MAX_SAVED_SENTENCES) return { limit: true, added: 0 };
  const added = additions.filter(item => saveSentenceToCollection(collectionId, item, false)?.added).length;
  if (added) save();
  return { added };
}

export function importSentencePairs(collectionId, pairs, name = "Imported sentences", voice = "") {
  if (!Array.isArray(pairs) || !pairs.length || pairs.length > 40) return { error: "Review between 1 and 40 pairs at a time." };
  if (collectionId && !Object.hasOwn(S.sentenceCollections, collectionId)) return { error: "Choose an existing collection." };
  const cleanName = cleanSentenceText(name).slice(0, 60);
  if (!collectionId && !cleanName) return { error: "Give the new collection a name." };
  const existing = collectionId ? S.sentenceCollections[collectionId] : null;
  const pairKey = ({ de, en }) => JSON.stringify([de, en]);
  const seen = new Set((existing?.sentences || []).map(pairKey));
  const additions = [];
  for (const pair of pairs) {
    const de = typeof pair?.de === "string" ? pair.de.trim() : "";
    const en = typeof pair?.en === "string" ? pair.en.trim() : "";
    if (!de || !en || de.length > 500 || en.length > 500) return { error: "Each row needs German and English text of up to 500 characters each." };
    const key = pairKey({ de, en });
    if (seen.has(key)) continue;
    seen.add(key);
    additions.push({ id: makeId("sentence"), de, en, origin: "Imported sentence", ...(savedVoice(voice) ? { voice: savedVoice(voice) } : {}) });
  }
  if (!additions.length) return { error: "All of these pairs are already in this collection." };
  const total = Object.values(S.sentenceCollections).reduce((sum, group) => sum + group.sentences.length, 0);
  if (total + additions.length > MAX_SAVED_SENTENCES) return { error: "These pairs would exceed the 200 sentence library limit." };
  const id = collectionId || makeId("collection");
  const group = existing || (S.sentenceCollections[id] = { name: cleanName, sentences: [] });
  group.sentences.push(...additions);
  for (const card of additions) S.sentenceReview[card.id] = newSentenceReview();
  save();
  return { id, added: additions.length };
}

export function moveSavedSentence(collectionId, cardId, direction) {
  if (!Object.hasOwn(S.sentenceCollections, collectionId) || ![-1, 1].includes(direction)) return false;
  const { sentences } = S.sentenceCollections[collectionId];
  const index = sentences.findIndex(item => item.id === cardId);
  const next = index + direction;
  if (index < 0 || next < 0 || next >= sentences.length) return false;
  [sentences[index], sentences[next]] = [sentences[next], sentences[index]];
  save();
  return true;
}

export function updateSavedSentence(collectionId, cardId, values) {
  if (!Object.hasOwn(S.sentenceCollections, collectionId)) return false;
  const item = S.sentenceCollections[collectionId]?.sentences.find(sentence => sentence.id === cardId);
  const de = cleanSentenceText(values?.de), en = cleanSentenceText(values?.en);
  if (!item || !de || !en) return false;
  if (item.de === de && item.en === en) return true;
  // An edited example is a new personal card. Its rating should not affect the original example.
  if (courseSentence(cardId) || Object.entries(S.sentenceCollections).some(([id, group]) =>
    id !== collectionId && group.sentences.some(card => card.id === cardId))) {
    item.id = makeId("sentence");
    item.origin = "Adapted from a lesson example";
    pruneSentenceReview(cardId);
  }
  item.de = de;
  item.en = en;
  S.sentenceReview[item.id] = newSentenceReview();
  delete S.sentenceListening[item.id];
  save();
  return true;
}

export function removeSavedSentence(collectionId, cardId) {
  if (!Object.hasOwn(S.sentenceCollections, collectionId)) return false;
  const collection = S.sentenceCollections[collectionId];
  const before = collection.sentences.length;
  collection.sentences = collection.sentences.filter(sentence => sentence.id !== cardId);
  if (before === collection.sentences.length) return false;
  pruneSentenceReview(cardId);
  save();
  return true;
}

export function lessonSentence(lesson, index) {
  const example = lesson?.examples?.[index];
  if (!example?.de?.trim() || !example?.en?.trim()) return null;
  return { id: lessonSentenceId(lesson, index), de: example.de, en: example.en,
    lessonKey: lesson.key, origin: `${lesson.level.name} lesson ${lesson.position}: ${lesson.title}` };
}

function courseSentence(id) {
  const match = typeof id === "string" && id.match(/^lesson-((?:a1|a2|b1)-\d+)-example-(\d+)$/);
  return match ? lessonSentence(SETS.get(match[1]), Number(match[2])) : null;
}

function pruneSentenceReview(id) {
  const original = courseSentence(id);
  if (original && (S.lessons[original.lessonKey]?.done || S.sentenceReview[id]?.seen || S.sentenceListening[id])) return;
  if (Object.values(S.sentenceCollections).some(group => group.sentences.some(item => item.id === id))) return;
  delete S.sentenceReview[id];
  delete S.sentenceListening[id];
  S.sentenceFavorites = S.sentenceFavorites.filter(value => value !== id);
}

export const sentenceReviewInfo = (id, mode = "recall") => {
  const review = Object.hasOwn(S.sentenceReview, id) ? S.sentenceReview[id] : null;
  if (mode !== "listen") return review ? { ...review } : null;
  const rating = Object.hasOwn(S.sentenceListening, id) ? S.sentenceListening[id] : undefined;
  return { due: review?.due, rating };
};
export const hasShadowedSentence = id => Boolean(sentenceReviewInfo(id, "listen").rating ||
  Object.values(S.sentenceActivity).some(day => day[id]?.listen));
export const isSentenceFavorite = id => S.sentenceFavorites.includes(id);
export function toggleSentenceFavorite(id) {
  if (!Object.hasOwn(S.sentenceReview, id) && !courseSentence(id)) return false;
  S.sentenceReview[id] ??= newSentenceReview();
  const favorite = !isSentenceFavorite(id);
  S.sentenceFavorites = favorite ? [...S.sentenceFavorites, id] : S.sentenceFavorites.filter(value => value !== id);
  save();
  return favorite;
}

export const sentencePreferences = () => ({ ...S.sentencePreferences });
export const sitePreferences = () => ({ ...S.sitePreferences });
export function setSitePreferences(changes) {
  S.sitePreferences = savedSitePreferences({ ...S.sitePreferences, ...changes });
  save();
}
export const audioPlaybackSpeed = () => S.sentencePreferences.speed;
export function setSentencePreferences(changes) {
  S.sentencePreferences = savedSentencePreferences({ ...S.sentencePreferences, ...changes });
  save();
}

export function dueSentences(source = S.sentencePreferences.source) {
  const date = todayKey();
  const saved = new Map(Object.values(S.sentenceCollections).flatMap(group => group.sentences.map(item => [item.id, item])));
  return Object.entries(S.sentenceReview).filter(([, review]) => review.due <= date)
    .map(([id, review]) => {
      const original = source === "saved" ? null : courseSentence(id);
      const personal = source === "lesson" ? null : saved.get(id);
      return { sentence: personal || original, review };
    })
    .filter(item => item.sentence)
    .sort((a, b) => Number(b.review.missed) - Number(a.review.missed) || a.review.due.localeCompare(b.review.due)
      || Number(Boolean(b.review.seen)) - Number(Boolean(a.review.seen)))
    .map(item => item.sentence);
}
export const dueSentenceCount = () => dueSentences().length;

export function rateSentence(id, rating, mode = "recall") {
  if (!rating || !setSentenceRatings([id], rating, mode, false)) return false;
  countAnswer();
  save();
  return true;
}

export function setSentenceRatings(ids, rating, mode = "recall", persist = true) {
  if (!Number.isInteger(rating) || rating < 0 || rating > 5 || !["listen", "recall"].includes(mode)) return 0;
  const valid = [...new Set(ids)].filter(id => Object.hasOwn(S.sentenceReview, id) || courseSentence(id));
  const date = todayKey();
  for (const id of valid) {
    if (mode === "listen") {
      if (rating) S.sentenceListening[id] = rating;
      else delete S.sentenceListening[id];
    } else if (rating) S.sentenceReview[id] = { due: addDays(date, SENTENCE_INTERVALS[rating - 1]), seen: date, missed: rating === 1, rating };
    else if (S.sentenceReview[id]?.rating) S.sentenceReview[id] = newSentenceReview();
  }
  if (persist && valid.length) save();
  return valid.length;
}

/** Capture the original schedule so an undo restores the exact review dates. */
export function setSentenceBatchRatings(ids, rating, mode) {
  const state = S;
  const ratings = mode === "listen" ? S.sentenceListening : S.sentenceReview;
  const changes = [...new Set(ids)].map(id => ({ id, before: ratings[id] }));
  if (!setSentenceRatings(ids, rating, mode, false)) return null;
  const updated = changes.flatMap(({ id, before }) => before === ratings[id] ? [] : [{ id, before, after: ratings[id] }]);
  if (!updated.length) return null;
  save();
  return () => {
    if (S !== state) return 0;
    let restored = 0;
    for (const { id, before, after } of updated) {
      if (ratings[id] !== after || !(Object.hasOwn(S.sentenceReview, id) || courseSentence(id))) continue;
      if (before === undefined) delete ratings[id];
      else ratings[id] = before;
      restored++;
    }
    if (restored) save();
    return restored;
  };
}

function reviewMaterial() {
  const orderedLevels = [currentLevel(), ...LEVELS.filter(level => level !== currentLevel())];
  const course = orderedLevels.flatMap(level => level.lessons.flatMap(lesson =>
    (lesson.examples || []).map((_, index) => lessonSentence(lesson, index)).filter(Boolean)));
  const saved = Object.values(S.sentenceCollections).flatMap(group => group.sentences);
  return { course, saved };
}

export function smartReviewPlan(start = false) {
  const date = todayKey();
  const { smartSize, smartSource: source } = S.sentencePreferences;
  const { course, saved } = reviewMaterial();
  const previous = S.smartReview?.date === date ? S.smartReview : null;
  const sameSource = previous?.source === source;
  const size = sameSource ? Math.max(previous.size, smartSize) : smartSize;
  const done = previous?.done || [];
  const savedIds = new Set(saved.map(item => item.id));
  const due = dueSentences(source === "saved" ? "saved" : "all").filter(item => S.sentenceReview[item.id]?.seen);
  const fresh = [...(source === "saved" ? [] : course), ...saved].filter(item => !S.sentenceReview[item.id]?.seen &&
    (!S.sentenceReview[item.id] || S.sentenceReview[item.id].due <= date));
  const byId = new Map([...(source === "saved" ? [] : course), ...saved].map(item => [item.id, item]));
  const candidates = [...due.map(item => ({ id: item.id, fresh: false })), ...fresh.map(item => ({ id: item.id, fresh: true }))];
  if (source === "preferSaved") candidates.sort((a, b) => Number(savedIds.has(b.id)) - Number(savedIds.has(a.id)));
  const fixed = sameSource ? previous.items : [];
  const seen = new Set();
  const items = [...fixed, ...candidates].filter(({ id }) => {
    if (!byId.has(id) || seen.has(id)) return false;
    seen.add(id);
    return true;
  }).slice(0, size);
  if (start && (!sameSource || previous.size !== size || fixed.length !== items.length ||
      fixed.some((item, index) => item.id !== items[index]?.id))) {
    S.smartReview = { date, size, source, items, done };
    save();
  }
  const remaining = items.filter(item => !done.includes(item.id));
  return {
    items: remaining.map(item => byId.get(item.id)),
    due: remaining.filter(item => !item.fresh).length,
    fresh: remaining.filter(item => item.fresh).length,
    completed: items.length - remaining.length, total: items.length, size,
  };
}

export function logSentenceActivity(item, mode, { repetitions = 0, seconds = 0, points = 0, smart = false } = {}) {
  const date = todayKey();
  const daily = S.sentenceActivity[date] ??= {};
  const activity = daily[item.id] ??= { recall: 0, listen: 0, build: 0, challenge: 0, reps: 0, audioSeconds: 0 };
  if (mode) activity[mode] += mode === "challenge" ? points : 1;
  activity.reps += repetitions;
  activity.audioSeconds += Math.max(0, Math.round(seconds));
  if (smart && S.smartReview?.date === date && !S.smartReview.done.includes(item.id)) S.smartReview.done.push(item.id);
  const match = mode && item.id.match(/^lesson-((?:a1|a2|b1)-\d+)-example-(\d+)$/);
  if (match && mode !== "challenge") {
    const [, key, index] = match;
    recordLessonSentenceVisit(SETS.get(key), Number(index));
  }
  for (const key of Object.keys(S.sentenceActivity)) if (key < addDays(date, -90)) delete S.sentenceActivity[key];
  save();
}

export function markLessonSentenceSeen(lesson, index) {
  recordLessonSentenceVisit(lesson, index);
  save();
}

export function sentenceStats(days = 7, date = new Date(), lesson = "") {
  const end = dayKey(date), start = addDays(end, 1 - days);
  const result = { recall: 0, listen: 0, build: 0, challenge: 0, reps: 0, audioSeconds: 0, unique: 0 };
  const studied = new Set();
  for (const [day, row] of Object.entries(S.sentenceActivity)) {
    if (day < start || day > end) continue;
    for (const [id, item] of Object.entries(row)) {
      if (lesson && !id.startsWith(`lesson-${lesson}-example-`)) continue;
      studied.add(id);
      for (const key of ["recall", "listen", "build", "challenge", "reps", "audioSeconds"]) result[key] += item[key];
    }
  }
  result.unique = studied.size;
  return result;
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
    ]);
    if (current < 0) sets.push(...level.topics);
  }
  const words = sets.filter(isFlashcardSet).flatMap(set => set.vocab.map(word => word.de));
  return words.filter((w, i) => !S.review[w] && words.indexOf(w) === i);
}

/** Today's new words for the level: what is left of the day's ten. */
export const wordsToLearn = (level) => newWords(level).slice(0, Math.max(0, NEW_PER_DAY - addedToday()));

/** The lesson or topic introducing the next word in the current study queue. */
export const nextTopic = (level) => {
  const word = newWords(level)[0];
  return [...(level.course ? level.lessons : []), ...level.topics]
    .find(set => isFlashcardSet(set) && set.vocab.some(item => item.de === word)) || null;
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
