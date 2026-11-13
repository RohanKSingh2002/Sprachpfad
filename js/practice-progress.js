// Device-only attempts and writing drafts, separated by the active learner.
import { currentUser } from './auth.js';
import { grade, itemIndex, pointsFor } from './practice-engine.js';

const prefix = (user = currentUser()) => `sprachpfad-study-device:${user?.id || 'guest'}:`;
const versions = new WeakMap();
function version(set) {
  if (!versions.has(set)) {
    let hash = 2166136261;
    for (const char of JSON.stringify([set.items, set.passage, set.audioText])) {
      hash = Math.imul(hash ^ char.codePointAt(0), 16777619);
    }
    versions.set(set, hash);
  }
  return versions.get(set);
}

function read(key) {
  try { return JSON.parse(localStorage.getItem(prefix() + key)); }
  catch { return null; }
}

function write(key, data) {
  try {
    localStorage.setItem(prefix() + key, JSON.stringify(data));
    return true;
  } catch { return false; }
}

export function clearDevicePractice(user) {
  try {
    const scope = prefix(user);
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key?.startsWith(scope)) localStorage.removeItem(key);
    }
  } catch {}
}

const inRange = (value, count) => Number.isInteger(value) && value >= 0 && value < count;
const validIndices = (values, count) => Array.isArray(values) && values.length <= count &&
  new Set(values).size === values.length && values.every(value => inRange(value, count));
const text = (value, limit) => typeof value === 'string' ? value.slice(0, limit) : '';
const attemptKey = (level, set) => `set:${level.id}:${set.id}`;

function pairs(value, count) {
  return Object.fromEntries(Array.from({ length: count }, (_, index) => {
    const choice = value?.[index];
    return [index, (typeof choice === 'string' && /^\d+$/.test(choice) && inRange(Number(choice), count)) ? choice : ''];
  }));
}

function restore(set, attempt, review) {
  if (!attempt || !validIndices(attempt.indices, set.items.length) ||
      !inRange(attempt.position, attempt.indices.length) ||
      (!review && attempt.indices.some((value, index) => value !== index)) ||
      (!review && attempt.indices.length !== set.items.length)) return null;
  const { indices, position } = attempt;
  const finished = attempt.finished === true && position === indices.length - 1;
  const session = { set, indices, position, review, finished, records: {}, drafts: {}, orders: {} };
  for (const [step, index] of indices.entries()) {
    const item = set.items[index], draft = attempt.drafts?.[index], record = attempt.records?.[index];
    const count = (item.options || item.pairs || item.tokens || []).length;
    const checks = item.checklist?.length || 0;
    const order = attempt.orders?.[index];
    if (validIndices(order, count) && order.length === count) session.orders[index] = order;
    if (draft) session.drafts[index] = {
      text: text(draft.text, item.type === 'write' ? 6000 : 300),
      choice: inRange(draft.choice, count) ? draft.choice : null,
      pairs: pairs(draft.pairs, item.pairs?.length || 0),
      tokens: validIndices(draft.tokens, item.tokens?.length || 0) ? draft.tokens : [],
      reviewed: draft.reviewed === true,
      checks: validIndices(draft.checks, checks) ? draft.checks : [],
    };
    if (step > position) continue;
    if (record?.skipped === true) {
      session.records[index] = { response: '', skipped: true, earned: 0, total: pointsFor(item), correct: false };
    } else if (record) {
      const response = item.type === 'match' ? pairs(record.response, count) :
        item.type === 'choice' ? record.response : text(record.response, 6000);
      if (item.type !== 'choice' || inRange(response, count)) {
        session.records[index] = { response, skipped: false, ...grade(item, response) };
      }
    }
    if ((step < position || finished) && !session.records[index]) return null;
  }
  return session;
}

export function practiceProgress(level, set) {
  const data = read(attemptKey(level, set));
  if (data?.version !== version(set)) return { normal: null, review: null, missed: [], result: null };
  const result = data.result;
  return {
    normal: restore(set, data.normal, false), review: restore(set, data.review, true),
    missed: validIndices(data.missed, set.items.length) ? data.missed : [],
    result: result && ['earned', 'total', 'skipped', 'reviewed'].every(key => Number.isSafeInteger(result[key]) && result[key] >= 0) ? result : null,
    normalUpdated: Number(data.normalUpdated) || 0, reviewUpdated: Number(data.reviewUpdated) || 0,
  };
}

export function savePracticeProgress(level, session, { missed, result }, answered = false) {
  const { set, ...attempt } = session;
  const key = attemptKey(level, set);
  const stored = read(key);
  const data = stored?.version === version(set) ? stored : { version: version(set) };
  const slot = session.review ? 'review' : 'normal';
  const previousMisses = validIndices(data.missed, set.items.length) ? data.missed : missed;
  const current = itemIndex(session);
  const nextMisses = answered ? previousMisses.filter(index => index !== current) : previousMisses;
  if (answered && session.records[current]?.correct === false) nextMisses.push(current);
  return write(key, {
    ...data, [slot]: attempt, [`${slot}Updated`]: Date.now(),
    missed: answered ? nextMisses.sort((a, b) => a - b) : nextMisses,
    result: session.finished && !session.review ? result : data.result ?? result,
  });
}

export function pendingPractice(level, progress = set => practiceProgress(level, set), sets = level.practice || []) {
  return sets.flatMap(set => {
    const data = progress(set);
    return ['normal', 'review'].flatMap(slot => data[slot] && !data[slot].finished
      ? [{ session: data[slot], updated: data[`${slot}Updated`] || 0 }] : []);
  }).sort((a, b) => b.updated - a.updated);
}

const lessonReviewSets = new WeakMap();
function lessonReviewKey(lesson) {
  if (!lessonReviewSets.has(lesson)) lessonReviewSets.set(lesson, { items: lesson.tasks });
  return `lesson-mistakes:${lesson.key}:${version(lessonReviewSets.get(lesson))}`;
}

export function lessonMistakes(lesson) {
  const missed = read(lessonReviewKey(lesson));
  return validIndices(missed, lesson.tasks.length) ? missed.filter(index => lesson.tasks[index].type !== 'write') : [];
}

export function saveLessonMistake(lesson, index, correct) {
  const missed = new Set(lessonMistakes(lesson));
  if (correct) missed.delete(index);
  else missed.add(index);
  return write(lessonReviewKey(lesson), [...missed].sort((a, b) => a - b));
}

const lessonScorecardKey = lesson => `${lessonReviewKey(lesson)}:scorecard`;

export function lessonScorecard(lesson) {
  const saved = read(lessonScorecardKey(lesson));
  if (!saved || typeof saved !== 'object') return {};
  return Object.fromEntries(lesson.tasks.flatMap((task, index) => {
    const record = saved[index];
    return task.type !== 'write' && typeof record?.correct === 'boolean' && typeof record.response === 'string'
      ? [[index, { correct: record.correct, response: text(record.response, 600) }]] : [];
  }));
}

export const saveLessonScorecard = (lesson, records) => write(lessonScorecardKey(lesson), records);

const checkpointKey = (level, module) => `checkpoint:${level.id}:${level.course.version}:${module.id}`;
export function checkpointDraft(level, module) {
  const data = read(checkpointKey(level, module));
  return { text: text(data?.text, 6000), checks: Array.isArray(data?.checks) ? data.checks : [] };
}
export const saveCheckpointDraft = (level, module, draft) => write(checkpointKey(level, module), draft);
