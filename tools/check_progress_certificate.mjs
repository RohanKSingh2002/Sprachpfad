// Real content with isolated in-memory progress. No learner account or browser save is changed.
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import PDFLib from '../js/vendor/pdf-lib-1.17.1.js';

globalThis.fetch = async url => ({ ok: true, json: async () => JSON.parse(await readFile(url, 'utf8')) });
globalThis.localStorage = { getItem: () => null, setItem: () => {} };
const content = await import('../js/content.js');
await content.loadContent();
const state = await import('../js/state.js');
const { certificateSummary, createCertificatePDF } = await import('../js/progress-certificate.js');
const issuedAt = new Date(2026, 9, 28, 12);
const output = new URL('../hosting/verification/certificates/', import.meta.url);
await mkdir(output, { recursive: true });

async function save(summary, filename) {
  const bytes = await createCertificatePDF(summary, PDFLib);
  const doc = await PDFLib.PDFDocument.load(bytes);
  assert(doc.getPageCount() >= 1);
  for (const page of doc.getPages()) {
    assert.equal(page.getWidth(), 595.28);
    assert.equal(page.getHeight(), 841.89);
  }
  await writeFile(new URL(filename, output), bytes);
  return doc.getPageCount();
}

state.initState({ value: state.emptyProgress() });
const empty = certificateSummary('', issuedAt);
assert.equal(empty.name, 'Sprachpfad learner');
assert.equal(empty.lessons, 0); assert.equal(empty.words, 0); assert.equal(empty.answers, 0);
assert.equal(await save(empty, 'empty.pdf'), 1);

const a1 = content.LEVEL_BY_ID.a1;
const partial = state.emptyProgress();
partial.known = content.ALL_WORDS.slice(0, 10);
partial.lessons[a1.lessons[0].key] = { done: true, score: 0 };
partial.lessons[a1.lessons[1].key] = { done: false, score: 4 };
partial.lessons['a1-9999'] = { done: true, score: 100 };
partial.days = { '2026-10-26': 10, '2026-10-27': 0, '2026-10-28': 4, '2099-01-01': 900 };
partial.tests.a1 = { best: a1.test.total, date: +issuedAt, version: (a1.test.version || 1) + 1 };
partial.courseChecks[`a1-v${a1.course.version}-1`] = { listening: true, workshopScore: 4 };
state.initState({ value: partial });
const before = JSON.stringify(state.stateSnapshot());
const summary = certificateSummary('Zoë Müller', issuedAt);
assert.equal(summary.lessons, 1); assert.equal(summary.words, 10);
assert.equal(summary.activeDays, 2); assert.equal(summary.answers, 14);
assert.equal(summary.levels[0].test, null, 'Old/different assessment versions must not be presented as current results');
assert.equal(summary.levels[0].reviewed, 0, 'Partial checkpoint activity must not be labelled complete');
assert.equal(summary.levels[0].lessons[0].title, a1.lessons[0].germanTitle);
assert.equal(await save(summary, 'partial.pdf'), 2);
assert.equal(JSON.stringify(state.stateSnapshot()), before, 'Export must not modify saved progress');

const full = state.emptyProgress();
full.known = [...content.ALL_WORDS]; full.days = { '2026-10-28': 1600 };
for (const level of content.LEVELS) {
  for (const lesson of level.lessons) full.lessons[lesson.key] = { done: true, score: content.gradedTasks(lesson).length };
  for (const module of level.course.modules) full.courseChecks[`${level.id}-v${level.course.version}-${module.id}`] = {
    workshopScore: 6, listening: true, reading: true, writing: true, speaking: true,
  };
  full.tests[level.id] = { best: level.test.total, date: +issuedAt, version: level.test.version || 1 };
}
state.initState({ value: full });
const complete = certificateSummary('Alexandra Müller', issuedAt);
assert.equal(complete.lessons, content.ALL_LESSONS.length);
assert.equal(complete.words, content.ALL_WORDS.length);
assert(complete.levels.every(level => level.reviewed === level.checkpoints.length && level.test.passed));
const pages = await save(complete, 'complete.pdf');
assert(pages > 2, 'A full learning inventory must paginate instead of being cut off');
const longName = certificateSummary('Alexandra '.repeat(18), issuedAt);
await save(longName, 'long-name.pdf');
console.log(`Passed: empty, partial and fully completed progress; correct totals, version-aware tests, checkpoint criteria, no state mutation, PDF parsing and ${pages}-page complete inventory.`);
