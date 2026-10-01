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
/** Every distinct German word, lowest level first. */
export const ALL_WORDS = [];
/**
 * Each German word's entry ({ de, en, pl?, ex? }) and `from`, the lesson or topic that introduces it:
 * the lowest level that teaches the word, and within a level its lessons before its topics.
 */
export const WORDS = new Map();
/** Home page questions and answers. */
export const FAQ = [];

async function getJSON(file) {
  const res = await fetch(new URL(file, DATA_DIR));
  if (!res.ok) throw new Error(`data/${file} could not be loaded (${res.status})`);
  return res.json();
}

export async function loadContent() {
  const [levels, faq] = await Promise.all([getJSON("levels.json"), getJSON("faq.json")]);
  const files = await Promise.all(levels.map((lv) => getJSON(`${lv.id}.json`)));

  levels.forEach((meta, index) => {
    const { lessons, topics = [], test } = files[index];
    const level = { ...meta, index, lessons, topics, test };
    test.total = test.listening.length + test.reading.statements.length;
    lessons.forEach((lesson) => {
      lesson.level = level;
      lesson.kind = "lesson";
      lesson.key = `${level.id}-${lesson.id}`; // used in saved progress and flashcard links
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
      set.vocab.forEach((w) => {
        const entry = WORDS.get(w.de);
        if (!entry) WORDS.set(w.de, { ...w, from: set });
        // a lesson word that a topic of the same or a higher level also teaches: keep the lesson as its
        // home, but take the topic's plural and example sentence
        else if (!entry.ex && w.ex) WORDS.set(w.de, { ...w, ...entry, ex: w.ex, pl: entry.pl ?? w.pl });
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
  set.kind === "topic" ? `${set.level.name} topic: ${set.title}` : `${set.level.name} lesson ${set.id}`;
