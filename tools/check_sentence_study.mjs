// Exercises save migrations and offline audio responses without touching real study progress.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

globalThis.fetch = async url => ({ ok: true, json: async () => JSON.parse(await readFile(url, "utf8")) });
const content = await import("../js/content.js");
await content.loadContent();
const state = await import("../js/state.js");
const { selectSentenceBatch } = await import("../js/sentence-practice.js");
const { todayKey } = await import("../js/utils.js");

const NativeDate = Date;
let now = new Date(2026, 10, 6, 12).getTime();
globalThis.Date = class extends NativeDate {
  constructor(...args) { super(...(args.length ? args : [now])); }
  static now() { return now; }
};
let snapshot;
const init = value => state.initState({ value, onSave: saved => { snapshot = saved; } });
const lesson = content.LEVELS[0].lessons.find(item => item.examples.length >= 4);
const cards = lesson.examples.map((_, index) => state.lessonSentence(lesson, index)).filter(Boolean);
const [first, second, third] = cards;
const today = todayKey();

init({
  sentencePreferences: { speed: 1.25, pause: 3, autoplay: false, loop: true, largeText: true, language: "fr" },
  sentenceReview: { [first.id]: { due: today, seen: today, missed: false, rating: 3 } },
  studyGoal: { unit: "actions", target: 12 },
  recentLessons: [lesson.key],
});
assert.equal(state.sentencePreferences().speed, 1.25);
assert.equal(state.sentencePreferences().loop, "sentence");
assert.equal(state.sentencePreferences().textSize, "large");
assert.equal(state.sentencePreferences().pause, 3);
assert.deepEqual(state.studyGoal(), { unit: "actions", target: 12 });
assert.equal(state.sentenceReviewInfo(first.id).rating, 3);
assert.equal(state.sitePreferences().appLanguage, "fr", "The previous shared language should migrate");
state.setSitePreferences({ appLanguage: "es", reviewMode: "listen", cardDirection: "en", cardSize: 10 });
assert.equal(state.sentencePreferences().language, "fr", "Changing the app language should leave the prompt language alone");

state.setSentencePreferences({ speed: 1.05, loop: "batch", languagePause: 0.5, pairEveryRepeat: true });
assert.equal(state.setSentenceRatings([first.id, second.id, second.id, "missing"], 2, "listen"), 2);
assert.equal(state.sentenceReviewInfo(first.id).rating, 3);
assert.equal(state.sentenceReviewInfo(first.id, "listen").rating, 2);
assert.deepEqual(selectSentenceBatch(cards, { filter: "1-2", mode: "listen" }).map(item => item.id), [first.id, second.id]);
assert.deepEqual(selectSentenceBatch(cards, { search: `${first.de}, ${third.en}` }).map(item => item.id), [first.id, third.id]);
assert.equal(state.answersOn(new Date()), 0, "Editing ratings should not award practice actions");
state.setSentenceRatings([first.id], 0, "listen");
assert.equal(state.sentenceReviewInfo(first.id, "listen").rating, undefined);
assert.equal(state.sentenceReviewInfo(first.id).rating, 3);

const original = state.sentenceReviewInfo(first.id);
const undo = state.setSentenceBatchRatings([first.id, second.id, third.id], 1, "recall");
assert.equal(state.sentenceReviewInfo(first.id).missed, true);
state.setSentenceRatings([third.id], 5, "recall");
assert.equal(undo(), 2, "Undo must preserve a newer rating");
assert.deepEqual(state.sentenceReviewInfo(first.id), original, "Undo must restore the exact dates and flags");
assert.equal(state.sentenceReviewInfo(second.id), null, "Undo must restore an unrated sentence");
assert.equal(state.sentenceReviewInfo(third.id).rating, 5);
assert.equal(undo(), 0, "Undo is safe to repeat");

const collection = state.createSentenceCollection("Examples");
assert.equal(state.toggleSentenceCollectionPin(collection), true);
init(snapshot);
assert.equal(state.savedSentenceCollections().find(item => item.id === collection).pinned, true);
assert.equal(state.saveSentenceBatch(collection, [first, second, second]).added, 2);
assert.equal(state.saveSentenceBatch(collection, [first, second]).added, 0);
const imported = state.importSentencePairs(collection, [{ de: "Ich übe.", en: "I practise." }], "Examples", "voice-test");
assert.equal(imported.added, 1);
state.setSentencePreferences({ smartSource: "saved", smartSize: 20 });
let review = state.smartReviewPlan(true);
assert.equal(review.due, 1);
assert.equal(review.fresh, 2);
assert.equal(review.total, 3);
state.rateSentence(first.id, 5);
state.logSentenceActivity(first, "recall", { smart: true });
state.logSentenceActivity(second, "listen", { repetitions: 2, seconds: 7 });
state.logSentenceActivity(second, "challenge", { points: 10 });
assert.equal(state.setStudyGoal("either", 5, 2), true);
assert.equal(state.setStudyGoal("either", 5, 0), false);
assert.deepEqual(state.dailyGoalProgress(), [
  { unit: "minutes", target: 5, value: 0 }, { unit: "repetitions", target: 2, value: 2 },
]);
assert.equal(state.lessonSentenceProgress(lesson).next, 2);
assert.deepEqual(state.sentenceStats(7, new Date(), lesson.key), {
  recall: 1, listen: 1, build: 0, challenge: 10, reps: 2, audioSeconds: 7, unique: 2,
});

init(snapshot);
review = state.smartReviewPlan();
assert.equal(review.completed, 1);
assert.equal(review.due, 0);
assert.equal(review.total, 3);
assert.equal(state.savedSentenceCollections()[0].sentences.at(-1).voice, "voice-test");
assert.equal(state.sentencePreferences().speed, 1.05);
assert.equal(state.sentencePreferences().loop, "batch");
assert.equal(state.sitePreferences().appLanguage, "es");
assert.equal(state.sitePreferences().reviewMode, "listen");
assert.equal(state.sitePreferences().cardDirection, "en");
assert.equal(state.sitePreferences().cardSize, 10);
assert.equal(state.hasShadowedSentence(second.id), true);
state.setSentencePreferences({ smartSource: "all", smartSize: 30 });
assert.equal(state.smartReviewPlan(true).size, 30);
state.setSentencePreferences({ smartSize: 20 });
assert.equal(state.smartReviewPlan().size, 30);
now += 86400000;
assert.equal(state.smartReviewPlan().size, 20);

const handlers = new Map();
const origin = "https://example.test/learn/";
const clip = new URL("audio/abcd.mp3", origin);
const calls = [];
const cachedBytes = new Uint8Array([1, 2, 3, 4, 5, 6]);
const worker = vm.createContext({
  self: { registration: { scope: origin }, addEventListener: (type, handler) => handlers.set(type, handler) },
  URL, Response,
  fetch: async () => { throw new Error("Offline"); },
  caches: {
    keys: async () => ["sprachpfad:/learn/:lesson:a1-9"],
    match: async (url, { cacheName }) => {
      calls.push([url, cacheName]);
      if (url === clip.href) return new Response(cachedBytes);
      if (url === origin) return new Response("offline shell");
    },
  },
});
vm.runInContext(await readFile(new URL("../study-worker.js", import.meta.url), "utf8"), worker);
function fetchThroughWorker(request) {
  let result;
  handlers.get("fetch")({ request, respondWith: response => { result = response; } });
  return result;
}
const partial = await fetchThroughWorker(new Request(clip, { headers: { Range: "bytes=1-3" } }));
assert.equal(partial.status, 206);
assert.equal(partial.headers.get("content-range"), "bytes 1-3/6");
assert.deepEqual([...new Uint8Array(await partial.arrayBuffer())], [2, 3, 4]);
const invalid = await fetchThroughWorker(new Request(clip, { headers: { Range: "bytes=10-" } }));
assert.equal(invalid.status, 416);
const navigation = { method: "GET", cache: "default", mode: "navigate", headers: new Headers() };
assert.equal(await (await fetchThroughWorker({ ...navigation, url: origin })).text(), "offline shell");
assert.equal(fetchThroughWorker({ ...navigation, url: `${origin}?code=example` }), undefined);
assert.equal(fetchThroughWorker(new Request("https://other.test/audio/abcd.mp3")), undefined);
assert(calls.every(([, name]) => name.startsWith("sprachpfad:/learn/:")));

const storage = new Map();
globalThis.localStorage = { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value) };
globalThis.Audio = class {};
globalThis.caches = {};
const notifications = [];
Object.defineProperty(globalThis, "navigator", { configurable: true, value: {
  serviceWorker: { register: async () => ({
    active: true, showNotification: async (title, options) => notifications.push({ title, options }),
  }) },
  locks: { request: async (_key, action) => action() },
} });
const events = new Map();
globalThis.window = { addEventListener: (type, callback) => events.set(type, callback) };
globalThis.Notification = { permission: "default", requestPermission: async () => "denied" };
const reminders = await import("../js/study-reminder.js");
const weekdayCalendar = reminders.studyReminderCalendar("18:00", new Date(2026, 10, 6, 19), ["MO", "WE"]);
assert.match(weekdayCalendar, /DTSTART:20261109T180000/);
assert.match(weekdayCalendar, /RRULE:FREQ=WEEKLY;BYDAY=MO,WE/);
await assert.rejects(reminders.setStudyNotification("18:00", true), /Allow notifications/);
assert.equal(reminders.studyNotification().enabled, false);
globalThis.Notification.permission = "granted";
const nativeTimer = setTimeout, nativeClear = clearTimeout;
let scheduled;
globalThis.setTimeout = callback => { scheduled = callback; return 1; };
globalThis.clearTimeout = () => {};
try {
  await reminders.setStudyNotification("18:00", true, ["SA"]);
  assert.deepEqual(reminders.studyNotification().days, ["SA"]);
  reminders.startStudyNotifications();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(notifications.length, 0);
  now = new Date(2026, 10, 7, 18, 0).getTime();
  reminders.setReminderPaused(true);
  await events.get("focus")();
  assert.equal(notifications.length, 0);
  reminders.setReminderPaused(false);
  scheduled();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(notifications.length, 1);
  assert.equal(notifications[0].options.tag, "sprachpfad-study-reminder");
  await events.get("focus")();
  assert.equal(notifications.length, 1, "Opening or refocusing another tab must not notify twice");
  await reminders.setStudyNotification("18:00", false);
  assert.equal(reminders.studyNotification().enabled, false);
} finally {
  globalThis.setTimeout = nativeTimer;
  globalThis.clearTimeout = nativeClear;
}
console.log("Sentence preferences, old saves, split ratings, ranges, imports, Smart Review, goals, resume, offline audio, and reminders passed.");
