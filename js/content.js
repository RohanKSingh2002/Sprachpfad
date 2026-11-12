// Loads the lessons, word topics, mock tests and questions from data/*.json and builds the lookups the
// app uses.

const DATA_DIR = new URL("../data/", import.meta.url);

/** Levels in order, each with its lessons, word topics and mock test. Filled by loadContent(). */
export const LEVELS = [];
/** Levels by id, e.g. LEVEL_BY_ID.a2 */
export const LEVEL_BY_ID = {};
/** Every lesson across all levels, in order. */
export const ALL_LESSONS = [];
/** Every word topic across all levels, in order. */
export const ALL_TOPICS = [];
/** Lessons and topics by key: "a2-3" is A2 lesson 3, "a1-food" the A1 topic "food". */
export const SETS = new Map();
/** Every distinct word available in flashcards, lowest level first. */
export const ALL_WORDS = [];
/**
 * Each German word's entry ({ de, en, pl?, ex?, forms? }) and `from`, the lesson or topic that introduces it:
 * the lowest level that teaches the word, and within a level its lessons before its topics.
 */
export const WORDS = new Map();
const excludedFlashcardTopics = new Set(["a1-alphabet", "a1-numbers"]);
const archivedFlashcardWords = new Set();
export const isFlashcardSet = set => Boolean(set) && !excludedFlashcardTopics.has(set.key);
/** Existing saves may still contain cards from a retired deck. */
export const isSavedWord = word => WORDS.has(word) || archivedFlashcardWords.has(word);
/** Home page questions and answers. */
export const FAQ = [];

async function getJSON(file) {
  const res = await fetch(new URL(file, DATA_DIR));
  if (!res.ok) throw new Error(`data/${file} could not be loaded (${res.status})`);
  return res.json();
}

export async function loadContent() {
  const [levels, faq, practice] = await Promise.all([getJSON("levels.json"), getJSON("faq.json"), getJSON("practice.json")]);
  const files = await Promise.all(levels.map((lv) => getJSON(`${lv.id}.json`)));
  const courses = await Promise.all(levels.map((lv) => lv.courseFile ? getJSON(lv.courseFile) : null));

  levels.forEach((meta, index) => {
    const { lessons: baseLessons, topics = [], test: baseTest } = files[index];
    const course = courses[index];
    topics.push(...(course?.topics || []));
    const byId = new Map([...baseLessons, ...(course?.lessons || [])].map((l) => [l.id, l]));
    const lessons = course ? course.lessonOrder.map((id) => byId.get(id)) : baseLessons;
    if (lessons.some((l) => !l)) throw new Error(`The ${meta.name} course references a missing lesson`);
    const test = course?.test || baseTest;
    const level = { ...meta, index, lessons, topics, test, course, practice: practice.levels[meta.id] || [] };
    test.total = test.listening.length + (test.reading.groups ? test.reading.groups.reduce((n, g) => n + g.items.length, 0) : test.reading.statements.length) + (test.form?.fields.length || 0);
    lessons.forEach((lesson, position) => {
      lesson.level = level;
      lesson.position = position + 1;
      lesson.kind = "lesson";
      lesson.key = `${level.id}-${lesson.id}`; // used in saved progress and flashcard links
      if (course?.support[lesson.id]) {
        const { readingTask, ...support } = course.support[lesson.id];
        Object.assign(lesson, support);
        if (readingTask) lesson.tasks.push(readingTask);
      }
    });
    topics.forEach((topic) => {
      topic.level = level;
      topic.kind = "topic";
      topic.key = `${level.id}-${topic.id}`;
    });
    LEVELS.push(level);
    LEVEL_BY_ID[level.id] = level;
  });

  ALL_LESSONS.push(...LEVELS.flatMap((lv) => lv.lessons));
  ALL_TOPICS.push(...LEVELS.flatMap((lv) => lv.topics));
  LEVELS.forEach((level) =>
    [...level.lessons, ...level.topics].forEach((set) => {
      SETS.set(set.key, set);
      if (!isFlashcardSet(set)) {
        set.vocab.forEach(word => archivedFlashcardWords.add(word.de));
        return;
      }
      set.vocab.forEach((w) => {
        const entry = WORDS.get(w.de);
        if (!entry) WORDS.set(w.de, { ...w, from: set });
        // a lesson word that a topic of the same or a higher level also teaches: keep the lesson as its
        // home, but take the topic's plural and example sentence
        else if (!entry.ex && w.ex) WORDS.set(w.de, { ...w, ...entry, ex: w.ex, pl: entry.pl ?? w.pl, forms: entry.forms ?? w.forms });
      });
    }),
  );
  ALL_WORDS.push(...WORDS.keys());
  FAQ.push(...faq);
}

/** Positions of the exercises that are scored (writing tasks only show a model answer). */
export const gradedTasks = (lesson) => lesson.tasks.flatMap((task, i) => (task.type === "write" ? [] : [i]));

/** The words a level introduces (each word belongs to the lowest level that teaches it). */
export const wordsOfLevel = (level) => ALL_WORDS.filter((w) => WORDS.get(w).from.level === level);

/** "die Tische", "usually no plural" or "plural only", for a noun's entry; "" for other words. */
export function pluralText(entry) {
  if (!entry.pl) return "";
  if (entry.pl === "-") return "usually no plural";
  if (entry.pl === "pl") return "plural only";
  return `die ${entry.pl}`;
}

/** Where a word comes from, for labels: "A1 lesson 3" or "A1 topic: Food and shopping". */
export const setLabel = (set) =>
  set.kind === "topic" ? `${set.level.name} topic: ${set.title}` : `${set.level.name} lesson ${set.position || set.id}`;
