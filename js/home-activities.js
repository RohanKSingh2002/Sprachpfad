// Existing course phases and vocabulary review choose the activities available today.
import { LEVELS, gradedTasks } from "./content.js";
import { addedToday, cardsToday, courseChecks, dueCount, isDone, lessonScore, NEW_PER_DAY, newWords, nextTopic, openedToday, passed, sessionLesson } from "./state.js";
import { moduleReviewed } from "./course-plan.js";

// A realistic pace: seconds per flashcard (a new word takes longer) and per kind of exercise
const CARD_SECONDS = 10;
const NEW_CARD_SECONDS = 15;
const TASK_SECONDS = { choice: 25, listen: 40, fill: 35, order: 50, write: 150 };

const minutes = (seconds) => Math.max(1, Math.round(seconds / 60));
const words = (text) => String(text).split(/\s+/).filter(Boolean).length;

/** Reading the lesson's grammar at 90 words a minute, and saying each example out loud twice. */
function grammarMinutes(lesson) {
  const text = [
    lesson.intro,
    ...lesson.rules,
    ...lesson.table.head,
    ...lesson.table.rows.flat(),
    ...lesson.examples.flatMap((e) => [e.de, e.en]),
  ];
  const reading = text.reduce((n, t) => n + words(t), 0) / 90;
  return Math.max(2, Math.ceil(reading + (lesson.examples.length * 8) / 60));
}

const exerciseMinutes = (lesson) =>
  minutes(lesson.tasks.reduce((s, t) => s + (TASK_SECONDS[t.type] || 40), 0));

/**
 * Review due words and introduce the day's vocabulary, then follow the scheduled course phase.
 * Levels without a course plan keep their short grammar-and-exercises session.
 */
export function sessionSteps(level, plan) {
  const scheduled = plan?.session;
  const lesson = plan ? scheduled?.unit.lesson : sessionLesson(level);
  const due = dueCount();
  const steps = [];
  const learned = addedToday();
  const reviewed = cardsToday() > learned;
  if (due) {
    steps.push({
      title: `Review ${due} ${due === 1 ? "word" : "words"}`,
      sub: "Due today in your review queue",
      href: "#/karten?l=due",
      min: minutes(due * CARD_SECONDS),
    });
  } else if (reviewed) {
    steps.push({
      title: "Review your words",
      sub: "Nothing left due today",
      href: "#/karten?l=due",
      done: true,
    });
  }
  const left = newWords(level).length;
  const goal = Math.min(NEW_PER_DAY, learned + left);
  if (goal && !scheduled?.rest) {
    const topic = nextTopic(level);
    const done = learned >= goal;
    steps.push({
      title: `Learn ${goal} new ${goal === 1 ? "word" : "words"}`,
      sub: done ? `${learned} met today` : `From ${topic.title}${learned ? `, ${learned} of ${goal} done` : ""}`,
      href: "#/karten?l=new",
      min: minutes((goal - Math.min(learned, goal)) * NEW_CARD_SECONDS),
      done,
    });
  } else if (!due && !reviewed) {
    steps.push({
      title: `Practise the ${level.name} words`,
      sub: "Nothing is due today",
      href: `#/karten?l=${level.id}`,
      min: minutes(10 * CARD_SECONDS),
    });
  }
  if (scheduled?.rest) {
    steps.push({
      title: "Optional review or rest",
      sub: "Revisit familiar words or take a break before the next study day",
      href: lesson ? `#/karten?l=${lesson.key}` : `#/karten?l=${level.id}`,
      min: 10,
      done: cardsToday() > 0,
    });
    return steps;
  }
  if (lesson && (!scheduled || ["all", "study"].includes(scheduled.phase))) {
    steps.push({
      title: "Study the grammar",
      sub: `Lesson ${lesson.position}: ${lesson.germanTitle}`,
      href: `#/${level.id}/lektion/${lesson.id}`,
      min: grammarMinutes(lesson),
      done: openedToday(lesson) || isDone(lesson),
    });
  }
  if (lesson && (!scheduled || ["all", "exercises"].includes(scheduled.phase))) {
    steps.push({
      title: `Answer ${lesson.tasks.length} exercises`,
      sub: `${gradedTasks(lesson).length} of them scored, on your first try`,
      href: `#/${level.id}/lektion/${lesson.id}?part=exercises`,
      min: exerciseMinutes(lesson),
      done: isDone(lesson),
    });
  }
  if (lesson && scheduled?.phase === "review") {
    steps.push({
      title: `Review lesson ${lesson.position}`,
      sub: "Revisit the examples, repeat them aloud and correct any missed exercises",
      href: `#/${level.id}/lektion/${lesson.id}`,
      min: grammarMinutes(lesson) + exerciseMinutes(lesson),
      done: openedToday(lesson),
    });
  }
  if (scheduled?.unit.type === "checkpoint") {
    const module = scheduled.unit.module;
    const checks = courseChecks(level, module.id);
    const href = `#/${level.id}/checkpoint/${module.id}`;
    module.lessonIds.map(id => level.lessons.find(item => item.id === id)).filter(item => lessonScore(item) / gradedTasks(item).length < 0.8).forEach(item => {
      steps.push({ title: `Review lesson ${item.position} exercises`, sub: "Reach 80% before completing this module's checkpoint", href: `#/${level.id}/lektion/${item.id}?part=exercises`, min: exerciseMinutes(item) });
    });
    if (["all", "comprehension"].includes(scheduled.phase) || !(checks.workshopScore >= 5)) {
      steps.push({ title: `Module ${module.id}: listen and read`, sub: "Complete the six checkpoint questions and correct your mistakes", href, min: 15, done: checks.workshopScore >= 5 });
    }
    if (["all", "production", "feedback"].includes(scheduled.phase)) {
      steps.push({ title: `Module ${module.id}: write and speak`, sub: "Complete the writing task and spoken exchange", href: `${href}?part=writing`, min: 20, done: !!checks.writing && !!checks.speaking });
      steps.push({ title: "Review feedback and record your practice", sub: `Module ${module.id} checkpoint feedback`, href: `${href}?part=feedback`, min: 10, done: moduleReviewed(level, module) });
    }
  } else if (!lesson && !passed(level)) {
    steps.push({
      title: `Take the ${level.name} mock test`,
      sub: "Listening, reading, writing and speaking",
      href: `#/${level.id}/test`,
      min: 20,
    });
  } else if (!lesson && LEVELS[level.index + 1]) {
    const after = LEVELS[level.index + 1];
    steps.push({
      title: `Start the ${after.name} line`,
      sub: `${after.lessons.length} lessons`,
      href: `#/${after.id}`,
    });
  }
  return steps;
}

