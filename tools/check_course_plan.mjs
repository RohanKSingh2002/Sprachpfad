// Run with: node tools/check_course_plan.mjs
// Uses the real course data and in-memory browser storage; never touches a learner's saved progress.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const stored = new Map();
globalThis.localStorage = { getItem: key => stored.get(key) ?? null, setItem: (key, value) => stored.set(key, value) };
globalThis.fetch = async url => ({ ok: true, json: async () => JSON.parse(await readFile(url, 'utf8')) });
globalThis.window = { matchMedia: () => ({ matches: false }) };
globalThis.Audio = class {};
const NativeDate = Date;
let now = new NativeDate(2026, 9, 7, 12).getTime();
globalThis.Date = class extends NativeDate {
  constructor(...args) { super(...(args.length ? args : [now])); }
  static now() { return now; }
};
const content = await import('../js/content.js');
await content.loadContent();
const state = await import('../js/state.js');
const { studyPlan, todayStudyPlan, moduleReviewed } = await import('../js/course-plan.js');
const { currentGuide, guidedLink, guidedWords } = await import('../js/guided-study.js');
const roadmap = await import('../js/views/roadmap.js');
const home = await import('../js/views/home.js');
const level = content.LEVEL_BY_ID.a1;
const saveKey = 'sprachpfad-v1';
const saved = () => JSON.parse(stored.get(saveKey));
const material = JSON.stringify({ modules: level.course.modules, routine: level.course.dailyPlan });
function reset(weeks = 16, data = {}) {
  now = new NativeDate(2026, 9, 7, 12).getTime();
  stored.set(saveKey, JSON.stringify({ review: {}, ...data }));
  state.initState();
  state.setCoursePace(level, weeks);
}
function day(offset) { now = new NativeDate(2026, 9, 7 + offset, 12).getTime(); }
function finishLesson(lesson) { state.recordLesson(lesson, content.gradedTasks(lesson).length); }
function finishModule(module) {
  module.lessonIds.forEach(id => finishLesson(level.lessons.find(lesson => lesson.id === id)));
  state.recordCourseCheck(level, module.id, 'workshopScore', 5);
  for (const skill of ['listening', 'reading', 'writing', 'speaking']) state.recordCourseCheck(level, module.id, skill, true);
}

for (const weeks of [8, 16, 24]) {
  reset(weeks);
  const plan = studyPlan(level);
  assert.equal(plan.schedule.length, weeks);
  assert.equal(plan.units.length, 48);
  assert.equal(new Set(plan.units.map(unit => unit.key)).size, 48);
  assert.deepEqual(plan.units.filter(unit => unit.type === 'lesson').map(unit => unit.lesson.id), level.course.lessonOrder);
  assert.equal(plan.sessions.length, weeks * 6);
  assert.equal(plan.sessions.length * plan.dailyMinutes, 144 * 60);
  assert.deepEqual(plan.units.filter(unit => unit.type === 'checkpoint').map(unit => unit.module.id), level.course.modules.map(module => module.id));
  for (const module of level.course.modules) {
    const targets = plan.units.filter(unit => unit.module === module);
    assert.deepEqual(targets.map(unit => unit.type), ['lesson', 'lesson', 'checkpoint']);
    assert.ok(targets[2].start > targets[1].end);
  }
  for (const week of plan.schedule) {
    const lessonCount = week.units.filter(unit => unit.type === 'lesson').length;
    if (weeks === 8) assert.equal(lessonCount, 4);
    if (weeks === 16) assert.equal(lessonCount, 2);
    if (weeks === 24) assert.ok(lessonCount >= 1 && lessonCount <= 2);
  }
  const html = roadmap.render(level);
  const weekCards = [...html.matchAll(/<section class="course-week" aria-labelledby="course-week-(\d+)">\s*<div class="course-week-header">\s*<h3 id="course-week-\1">Week \1<\/h3>\s*<p class="muted small" data-week-status="\1">[^<]+<\/p>\s*<\/div>([\s\S]*?)<\/section>/g)];
  assert.deepEqual(weekCards.map(([, number]) => Number(number)), plan.schedule.map(week => week.number));
  for (const [, number, modules] of weekCards) {
    assert.ok(modules.includes('class="course-module'), 'Every week card contains its module rows or continuation links.');
    assert.ok(modules.includes(`Week ${number} guidebook`) && modules.includes('data-say='), 'Every week has an audio guidebook.');
    assert.doesNotMatch(modules, /<small>Week \d+ · \d+ lessons/);
  }
  assert.equal((html.match(/id="course-module-\d+"/g) || []).length, 16);
  const dropdowns = html.match(/<details class="course-module"[\s\S]*?<\/details>/g) || [];
  const outsideDropdowns = html.replace(/<details class="course-module"[\s\S]*?<\/details>/g, '');
  const lessonCards = (html.match(/<div class="course-lesson-links">[\s\S]*?<\/div>/g) || []).join('');
  assert.ok(!outsideDropdowns.includes('class="course-lesson-links"'), 'Weekly lesson cards must only appear inside their module dropdown.');
  for (const lesson of level.lessons) {
    const link = `href="#/a1/lektion/${lesson.id}"`;
    assert.equal(lessonCards.split(link).length - 1, 1, 'Every lesson must have exactly one card.');
    assert.ok(dropdowns.some(dropdown => dropdown.includes(link)));
  }
  if (weeks === 24) {
    assert.ok(html.includes('Lesson 1 · Week 1 · Days 1–3'));
    assert.ok(html.includes('Lesson 4 · Week 3 · Days 1–3'));
    assert.ok(html.includes('Continue module 2 from Week 2'));
    assert.ok(html.includes('Weeks 2–3 · 2 lessons'), 'A module spanning two weeks still shows its full range.');
    for (let position = 1; position < level.course.modules.length; position += 2) {
      const moduleId = level.course.modules[position].id;
      const previousId = level.course.modules[position - 1].id;
      const dropdown = dropdowns.find(item => item.includes(`id="course-module-${moduleId}"`));
      const header = dropdown.split('</summary>')[0];
      assert.ok(header.includes(`hours of study and practice</small><small class="course-module-continue"><a class="tlink" href="#/a1/roadmap?module=${previousId}">`), 'Continuation links belong directly below the schedule in module headers.');
      assert.equal(html.split(`Continue module ${position} from Week`).length - 1, 1);
    }
  }
  assert.ok(html.includes('144 hours planned overall'));
}
console.log('All three paces preserve the entire sequence and allocate exactly 144 hours.');

reset(16);
assert.equal(todayStudyPlan(level).session.phase, 'study');
let html = home.render(level);
assert.ok(html.includes('Study the grammar'));
assert.ok(!html.includes('Answer 6 exercises'));
day(1);
assert.equal(todayStudyPlan(level).session.phase, 'exercises');
finishLesson(level.lessons[0]);
assert.equal(todayStudyPlan(level).session.unit.lesson.id, level.lessons[0].id, 'Finishing a daily target keeps it in today’s session.');
assert.ok(todayStudyPlan(level).session.unit.done);
day(2);
assert.equal(todayStudyPlan(level).session.unit.lesson.id, level.lessons[1].id);
assert.equal(todayStudyPlan(level).session.phase, 'study');

reset(24);
todayStudyPlan(level);
day(1);
finishLesson(level.lessons[0]);
day(2);
assert.equal(todayStudyPlan(level).session.phase, 'review', 'The gentle plan keeps its dedicated review day.');
assert.ok(home.homeActivities(level).steps.some(step => step.title === 'Review lesson 1'));
day(6);
assert.ok(todayStudyPlan(level).session.rest);
assert.ok(!home.render(level).includes('Learn 10 new words'));
console.log('Home follows study, exercise, review and flexible days without advancing a completed daily suggestion.');

reset(8);
level.lessons.slice(0, 2).forEach(finishLesson);
assert.equal(todayStudyPlan(level).session.unit.key, 'checkpoint-1');
assert.ok(home.homeActivities(level).steps.some(step => step.title === 'Module 1: listen and read'));
finishModule(level.course.modules[0]);
assert.ok(moduleReviewed(level, level.course.modules[0]));
assert.equal(todayStudyPlan(level).session.unit.key, 'checkpoint-1');
const prior = saved();
for (const weeks of [24, 16, 8]) {
  state.setCoursePace(level, weeks);
  const today = todayStudyPlan(level);
  assert.equal(today.session.unit.lesson.id, level.lessons[2].id);
  assert.deepEqual(saved().lessons, prior.lessons);
  assert.deepEqual(saved().courseChecks, prior.courseChecks);
  assert.deepEqual(saved().review, prior.review);
  assert.deepEqual(saved().known, prior.known);
  state.initState();
  assert.equal(state.coursePace(level), weeks);
  assert.equal(todayStudyPlan(level).session.unit.lesson.id, level.lessons[2].id);
}
console.log('Changing pace reschedules unfinished work and survives reload without losing scores, checkpoints or vocabulary.');

reset(16);
todayStudyPlan(level);
day(365);
assert.equal(todayStudyPlan(level).session.unit.lesson.id, level.lessons[0].id, 'Missed days must not skip unfinished material.');
reset(16);
level.lessons.slice(0, 2).forEach(finishLesson);
assert.equal(todayStudyPlan(level).session.day, 5);
day(2);
assert.equal(todayStudyPlan(level).session.day, 7, 'Resuming partway through a week preserves the rest day.');
reset();
level.course.modules.forEach(finishModule);
assert.equal(todayStudyPlan(level).session, null);
assert.ok(home.homeActivities(level).steps.some(step => step.title === 'Take the A1 mock test'));
assert.ok(studyPlan(content.LEVEL_BY_ID.a2).units.length > 0, 'A2 has its own learning path.');
assert.ok(home.homeActivities(content.LEVEL_BY_ID.a2).steps.some(step => step.title === 'Study the grammar'));
assert.equal(JSON.stringify({ modules: level.course.modules, routine: level.course.dailyPlan }), material);
console.log('Catch-up, resumed weeks, completed courses and other levels work; course material is unchanged.');

// The prominent Start action must be useful without opening the optional plan.
for (const lv of content.LEVELS) {
  reset();
  state.setLevel(lv);
  const first = lv.lessons[0];
  let activities = home.homeActivities(lv);
  assert.equal(activities.primary.href, `#/${lv.id}/lektion/${first.id}`, 'A new learner starts the first scheduled lesson.');
  const practiceId = new URLSearchParams(activities.practice.href.split('?')[1]).get('set');
  assert.ok(lv.practice.some(set => set.id === practiceId), 'Practice opens an existing set in the selected level.');
  const word = first.vocab[0].de;
  state.rateWord(word, false);
  assert.equal(home.homeActivities(lv).primary.href, '#/karten?l=due', 'A due review has priority.');
  state.rateWord(word, true);
  assert.equal(home.homeActivities(lv).primary.href, `#/${lv.id}/lektion/${first.id}`, 'Finishing review brings the course activity back.');
  state.markOpened(first);
  activities = home.homeActivities(lv);
  assert.ok(!activities.primary.done, 'Start never points to an already completed suggestion.');
  const view = home.render(lv);
  assert.equal((view.match(/data-home-start/g) || []).length, 1, 'There is exactly one main Start action.');
  assert.ok(!view.includes('home-progress') && !view.includes('ticker-track'));
}
reset();
todayStudyPlan(level);
day(1);
assert.equal(home.homeActivities(level).primary.href, `#/a1/lektion/${level.lessons[0].id}?part=exercises`);
reset(8);
level.lessons.slice(0, 2).forEach(finishLesson);
// Clear the automatic review queue in this isolated fixture to inspect the next course action.
const checkpointSave = saved();
for (const item of Object.values(checkpointSave.review)) item.due = '2099-01-01';
stored.set(saveKey, JSON.stringify(checkpointSave)); state.initState();
assert.equal(home.homeActivities(level).primary.href, '#/a1/checkpoint/1');
console.log('One-click starts cover new learners, due review, exercises and checkpoints across all levels.');

reset();
const lessonHref = `#/a1/lektion/${level.lessons[0].id}`;
const word = level.lessons[0].vocab[0].de;
const sentence = state.lessonSentence(level.lessons[0], 0);
state.rateWord(word, false);
state.setSentenceRatings([sentence.id], 1);
const guide = ['#/karten?l=due', lessonHref, '#/sentences?mode=smart'];
const homeStart = html => html.match(/data-home-start href="([^"]+)"/)?.[1].replaceAll('&amp;', '&');
html = home.render(level);
const planCard = html.match(/<section class="study-next study-plan-card"[\s\S]*?<\/section>/)?.[0];
assert.ok(planCard, 'The mixed plan is shown on Home.');
const pageLinks = planCard.match(/<nav class="study-page-links"[\s\S]*?<\/nav>/)?.[0];
assert.deepEqual([...pageLinks.matchAll(/href="([^"]+)"/g)].map(link => link[1]), ['#/roadmap', '#/karten?l=a1', '#/practice']);
assert.equal((html.match(/class="study-page-links"/g) || []).length, 1);
assert.equal(homeStart(html), undefined, 'The three page links replace the guided session start.');
assert.ok(!html.includes('Start guided session'));
assert.deepEqual(currentGuide(guidedLink(guide)), guide.slice(1));
assert.deepEqual(currentGuide(guidedLink(guide.slice(1))), guide.slice(2));
assert.deepEqual(currentGuide(guidedLink(guide.slice(2))), []);
assert.equal(currentGuide('#/karten?l=due&guide=https%3A%2F%2Fexample.com'), null);
assert.deepEqual(guidedWords(), [word]);
state.setSitePreferences({ home: 'course' });
html = home.render(level);
assert.equal(homeStart(html), lessonHref);
assert.ok(html.includes('class="study-due"'));
state.setSitePreferences({ home: 'review' });
assert.equal(homeStart(home.render(level)), '#/karten?l=due');
state.setStudyGoal('actions', 1);
html = home.render(level);
assert.ok(html.includes('Daily goal reached'));
assert.equal(homeStart(html), lessonHref);
assert.equal((html.match(/data-home-start/g) || []).length, 1);
console.log('Home puts the three study page links inside the mixed plan and preserves course-first, review-first and goal-complete states.');

const retiredTopics = ['a1-alphabet', 'a1-numbers'];
for (const key of retiredTopics) {
  assert.ok(content.SETS.has(key), 'Retired decks remain in the course material.');
  assert.equal(content.isFlashcardSet(content.SETS.get(key)), false);
  assert.ok(!roadmap.render(level).includes(`#/karten?l=${key}`));
}
const ordinaryWord = level.lessons[0].vocab[0].de;
reset(16, {
  known: ['A', 'null'],
  review: { A: { due: '2026-10-06' }, null: { due: '2026-10-06' }, eins: { due: '2026-10-08' }, [ordinaryWord]: { due: '2026-10-06' } },
  wordCues: { A: 'Remember the German sound' },
  studyPins: retiredTopics,
});
assert.deepEqual(state.dueWords(), [ordinaryWord]);
assert.equal(state.dueCount(), 1);
assert.equal(state.nextDue(), null);
assert.equal(state.knownIn(['A', 'null']), 2, 'Older saves keep their review history.');
assert.equal(state.wordCue('A'), 'Remember the German sound');
assert.deepEqual(state.pinnedStudySets(), []);
assert.ok(!content.ALL_WORDS.includes('A') && !content.ALL_WORDS.includes('zwei'));
assert.ok(content.wordsOfLevel(level).includes('die Zahl'));
for (const [word, translation] of [['wie viel', 'how much'], ['wie viele', 'how many']]) {
  assert.equal(content.WORDS.get(word).from.key, 'a1-food');
  assert.equal(content.WORDS.get(word).en, translation);
  assert.ok(content.wordsOfLevel(level).includes(word));
}
assert.ok(!state.newWords(level).includes('B'));
finishModule(level.course.modules[0]);
assert.ok(!state.newWords(level).includes('zwei'));
console.log('Retired alphabet and number decks stay out of flashcard selection and review without erasing saved history.');
