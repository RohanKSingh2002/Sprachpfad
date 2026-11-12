// Pure session logic. No account data, DOM or storage: checking cannot double-count a task.
import { norm, shuffle } from './utils.js';

export const SKILLS = { grammar: 'Grammar', vocabulary: 'Vocabulary', reading: 'Reading', listening: 'Listening', writing: 'Writing' };
export const FORMAT = { fill: 'Complete the gap', choice: 'Choose an answer', order: 'Build a sentence', match: 'Match the phrases', write: 'Write & review' };
export const pointsFor = item => item.type === 'write' ? 0 : item.type === 'match' ? item.pairs.length : 1;
export const wordCount = text => String(text).trim().split(/\s+/u).filter(Boolean).length;

export function makeSession(set, indices = set.items.map((_, i) => i)) {
  return { set, indices: [...indices], position: 0, records: {}, drafts: {}, orders: {}, review: indices.length !== set.items.length, finished: false };
}
export const itemIndex = session => session.indices[session.position];
export const activeItem = session => session.set.items[itemIndex(session)];
export function orderedChoices(session) {
  const index = itemIndex(session), item = activeItem(session);
  if (!session.orders[index]) session.orders[index] = shuffle((item.tokens || item.options || item.pairs).map((_, i) => i));
  return session.orders[index];
}

export function grade(item, response) {
  if (item.type === 'write') return { earned: 0, total: 0, correct: null };
  if (item.type === 'match') {
    const checks = item.pairs.map((_, i) => String(response?.[i]) === String(i));
    return { earned: checks.filter(Boolean).length, total: checks.length, correct: checks.every(Boolean), checks };
  }
  const correct = item.type === 'choice'
    ? Number.isInteger(response) && response === item.answer
    : item.answers.some(answer => norm(answer) === norm(response));
  return { earned: Number(correct), total: 1, correct };
}

export function submit(session, response, { skipped = false } = {}) {
  const index = itemIndex(session), item = activeItem(session);
  if (session.finished || session.records[index]) return false;
  session.records[index] = { response, skipped, ...(skipped ? { earned: 0, total: pointsFor(item), correct: false } : grade(item, response)) };
  return true;
}
export function advance(session) {
  if (!session.records[itemIndex(session)]) return false;
  if (session.position + 1 === session.indices.length) session.finished = true;
  else session.position++;
  return true;
}
export function summary(session) {
  const records = session.indices.map(index => session.records[index]).filter(Boolean);
  return {
    earned: records.reduce((n, r) => n + r.earned, 0),
    total: session.indices.reduce((n, i) => n + pointsFor(session.set.items[i]), 0),
    skipped: records.filter(r => r.skipped).length,
    reviewed: records.filter(r => r.correct === null && !r.skipped).length,
    retry: session.indices.filter(index => session.records[index]?.correct === false),
  };
}
