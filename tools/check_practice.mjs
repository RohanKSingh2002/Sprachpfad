// Content invariants and finite-session regression checks; no real learner storage is touched.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { grade, makeSession, activeItem, submit, advance, summary, wordCount, orderedChoices } from '../js/practice-engine.js';
import { norm } from '../js/utils.js';
import { checkpointDraft, clearDevicePractice, pendingPractice, practiceProgress, saveCheckpointDraft, savePracticeProgress } from '../js/practice-progress.js';
const bank = JSON.parse(await readFile(new URL('../data/practice.json', import.meta.url), 'utf8'));
const audio = JSON.parse(await readFile(new URL('../audio/index.json', import.meta.url), 'utf8'));
const ids = new Set();
let tasks = 0, points = 0;
for (const [level, sets] of Object.entries(bank.levels)) {
  assert.equal(sets.length, 10);
  assert.equal(new Set(sets.map(s => s.skill)).size, 5);
  for (const set of sets) {
    assert(set.id.startsWith(level + '-'));
    assert(!ids.has(set.id)); ids.add(set.id);
    assert(set.title && set.focus && set.description && set.items.length);
    const session = makeSession(set);
    assert.equal(advance(session), false, 'Cannot advance without submitting or skipping');
    for (const item of set.items) {
      tasks++;
      assert(item.prompt && item.explanation);
      assert(['fill', 'choice', 'order', 'match', 'write'].includes(item.type));
      let response;
      if (item.type === 'choice') {
        assert(item.options.length >= 2 && new Set(item.options).size === item.options.length);
        assert(Number.isInteger(item.answer) && item.answer >= 0 && item.answer < item.options.length);
        response = item.answer;
        assert.equal(grade(item, (item.answer + 1) % item.options.length).correct, false);
      } else if (item.type === 'match') {
        assert.equal(new Set(item.pairs.map(p => p.left)).size, item.pairs.length);
        assert.equal(new Set(item.pairs.map(p => p.right)).size, item.pairs.length);
        response = Object.fromEntries(item.pairs.map((_, i) => [i, String(i)]));
        const wrong = { ...response, 0: '1' };
        assert.equal(grade(item, wrong).earned, item.pairs.length - 1);
      } else if (item.type === 'write') {
        const count = wordCount(item.model);
        assert(count >= item.target[0] && count <= item.target[1], `${set.id} model has ${count} words, outside ${item.target}`);
        assert(item.checklist.length >= 3);
        response = 'An independently written response.';
        assert.equal(grade(item, response).correct, null, 'Writing is not graded');
      } else {
        assert(item.answers.length && item.answers.every(a => a.trim()));
        if (item.type === 'order') assert.equal(norm(item.tokens.join(' ')), norm(item.answers[0]), 'Authored chunks reproduce the constrained answer');
        response = item.answers[0];
        assert.equal(grade(item, 'wrong answer').correct, false);
      }
      if (['order', 'choice', 'match'].includes(item.type)) {
        const order = orderedChoices(session);
        assert.deepEqual(orderedChoices(session), order, 'Shuffled choices stay stable during the exercise');
        assert.equal(new Set(order).size, order.length);
      }
      assert.equal(submit(session, response), true);
      assert.equal(submit(session, response), false, 'Repeated checking cannot count twice');
      assert.equal(advance(session), true);
    }
    assert(session.finished, 'Every round must finish');
    const result = summary(session);
    assert.equal(result.earned, result.total);
    assert.equal(result.retry.length, 0);
    points += result.total;
    assert.equal(submit(session, 'again'), false, 'Completed sets cannot accept extra answers');
  }
}
const first = bank.levels.a1[0];
const mixed = makeSession(first);
submit(mixed, 'heisse'); advance(mixed);
submit(mixed, 'wrong'); advance(mixed);
submit(mixed, '', { skipped: true }); advance(mixed);
while (!mixed.finished) { submit(mixed, activeItem(mixed).answers[0]); advance(mixed); }
assert.equal(summary(mixed).earned, 4);
assert.equal(summary(mixed).skipped, 1);
assert.deepEqual(summary(mixed).retry, [1, 2]);
const retry = makeSession(first, summary(mixed).retry);
assert.equal(activeItem(retry).answers[0], 'bin');
submit(retry, 'bin'); advance(retry); submit(retry, 'kommt'); advance(retry);
assert(retry.finished);
assert.equal(summary(retry).earned, 2);
assert.equal(summary(mixed).earned, 4, 'Review does not rewrite the first attempt');
assert.equal(grade({ type: 'fill', answers: ['größer'] }, ' GROESSER! ').correct, true);
assert.equal(grade({ type: 'fill', answers: ['den'] }, 'dem').correct, false);

const storage = new Map();
globalThis.localStorage = {
  get length() { return storage.size; },
  key: index => [...storage.keys()][index],
  getItem: key => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, value),
  removeItem: key => storage.delete(key),
};
const level = { id: 'a1', practice: [first], course: { version: 1 } };
const unfinished = makeSession(first);
submit(unfinished, 'wrong');
advance(unfinished);
unfinished.drafts[1] = { text: 'Mein Entwurf.' };
assert.equal(savePracticeProgress(level, unfinished, { missed: [0], result: summary(mixed) }), true);
const review = makeSession(first, [0]);
savePracticeProgress(level, review, { missed: [0], result: summary(mixed) });
const restored = practiceProgress(level, first);
assert.equal(restored.normal.position, 1);
assert.equal(restored.normal.drafts[1].text, 'Mein Entwurf.');
assert.equal(restored.normal.records[0].correct, false);
assert.deepEqual(restored.review.indices, [0]);
assert.deepEqual(restored.missed, [0]);
assert.equal(restored.result.earned, 4);
assert.equal(pendingPractice(level).length, 2);
assert.equal(practiceProgress(level, { ...first, items: first.items.slice(1) }).normal, null, 'A changed set cannot restore an incompatible attempt');
const checkpoint = { id: 1 };
saveCheckpointDraft(level, checkpoint, { text: '\nEntwurf: äöü', checks: [0, 2] });
assert.deepEqual(checkpointDraft(level, checkpoint), { text: '\nEntwurf: äöü', checks: [0, 2] });
clearDevicePractice({ id: 'different-user' });
assert.equal(pendingPractice(level).length, 2);
clearDevicePractice();
assert.equal(pendingPractice(level).length, 0);
assert.equal(checkpointDraft(level, checkpoint).text, '');
delete globalThis.localStorage;
console.log(`Passed: ${ids.size} sets, ${tasks} exercises, ${points} objective points, 6 self-reviewed writing tasks; finite rounds, stable choices, duplicate submissions, partial matches, skipped tasks and isolated retries.`);
console.log('Saved exercises, independent retries, content versioning and checkpoint drafts passed.');
console.log(`Audio manifest contains ${audio.clips.length} recordings. Listening-file existence is checked separately after generation.`);
