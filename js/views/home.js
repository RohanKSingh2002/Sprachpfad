// Home presents today's study suggestions and direct links to the study pages.
import { LEVELS, FAQ } from "../content.js";
import { dailyGoalProgress, dueCount, lessonSentenceProgress, sitePreferences, smartReviewPlan, nextLesson, openedToday, pinnedStudySets, recentStudyLessons } from "../state.js";
import { ARROW_ICON } from "../ui/icons.js";
import { esc } from "../utils.js";
import { todayStudyPlan } from "../course-plan.js";
import { sessionSteps } from "../home-activities.js";
import { pendingPractice } from "../practice-progress.js";
import { GUIDED_SENTENCE_LIMIT, guidedWords } from "../guided-study.js";

export const updatesInPlace = true;
const ICONS = {
  lesson: '<path d="M4 4h6a3 3 0 0 1 3 3v14a4 4 0 0 0-4-3H4V4Zm9 3a3 3 0 0 1 3-3h5v14h-5a3 3 0 0 0-3 3"/>',
  cards: '<rect x="7" y="5" width="13" height="16" rx="2"/><path d="m4 17-2-12a2 2 0 0 1 2-2l9-1M11 10h5m-5 4h3"/>',
  practice: '<path d="m5 14 9-10 5 5-9 10-6 1 1-6Zm7-8 5 5M4 23h17"/>',
};
const icon = kind => `<svg viewBox="0 0 26 26" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[kind]}</svg>`;

/** Choose an existing finite practice set; the current lesson keeps the choice stable. */
function practiceChoice(level, lesson) {
  const saved = pendingPractice(level)[0]?.session;
  if (saved) return {
    title: saved.set.title, href: `#/${level.id}/practice?set=${encodeURIComponent(saved.set.id)}${saved.review ? "&review=1" : ""}`,
    resume: saved.position + 1, total: saved.indices.length,
  };
  const bank = (level.practice || []).filter(set => set.skill !== "writing" && set.items.length);
  if (!bank.length) return { title: `${level.name} practice`, href: `#/${level.id}/practice`, min: 6 };
  const set = bank[Math.min(bank.length - 1, Math.floor(((lesson?.position || 1) - 1) / 2))];
  return { title: set.title, href: `#/${level.id}/practice?set=${encodeURIComponent(set.id)}`, min: set.minutes };
}

/** Prioritise due review, then scheduled course work; no choice is required to start. */
export function homeActivities(level) {
  const plan = todayStudyPlan(level);
  const steps = sessionSteps(level, plan);
  const open = steps.filter(step => !step.done);
  const lesson = plan?.session?.unit.lesson || nextLesson(level);
  const practice = practiceChoice(level, lesson);
  const { home, cardMissed } = sitePreferences();
  const dueWordsStep = open.find(step => step.href === "#/karten?l=due");
  const words = !cardMissed || guidedWords().length ? dueWordsStep : null;
  const course = open.find(step => !step.href.startsWith("#/karten"));
  const review = smartReviewPlan();
  const sentences = (home === "review" || !course) && review.due
    ? { title: "Review due sentences", href: "#/sentences?mode=smart", sub: "Practise the sentences due today, then try a few new ones.", min: 5 } : null;
  const primary = (home === "course" ? course || words || sentences : words || sentences || course)
    || open.find(step => step !== dueWordsStep)
    || { ...practice, sub: "Today's suggested activities are done. Try a short practice set if you feel like more." };
  return { plan, steps, primary, lesson, practice, course, review, home };
}

function presentation(step, level) {
  if (step.resume) return { kind: "practice", label: `${level.name} workbook`, title: step.title,
    description: `Exercise ${step.resume} of ${step.total} · Saved on this device`, action: `Resume exercise ${step.resume}` };
  if (step.href === "#/sentences?mode=smart") return { kind: "practice", label: "Sentence review", title: step.title, description: step.sub, action: "Start Smart Review" };
  const lessonId = step.href.match(/\/lektion\/(\d+)/)?.[1];
  const lesson = level.lessons.find(item => item.id === Number(lessonId));
  if (step.href.startsWith("#/karten")) {
    const review = step.href.includes("l=due");
    return { kind: "cards", label: review ? "Word review" : "Flashcards", title: step.title,
      description: review ? `${dueCount()} words are ready for another look. Recall the meaning, then flip to check.` : step.sub,
      action: review ? "Start word review" : "Start flashcards" };
  }
  if (lesson) {
    const exercises = step.href.includes("part=exercises");
    return { kind: "lesson", label: `${level.name} · Lesson ${lesson.position}`, title: lesson.title,
      description: exercises ? "Put the lesson into practice with its exercises."
        : step.title.startsWith("Review") ? "Revisit the examples and give the exercises another try."
        : "Study the grammar, learn the words and read the examples.",
      action: exercises ? "Open lesson exercises" : step.title.startsWith("Review") ? "Review lesson" : openedToday(lesson) ? "Continue lesson" : "Start lesson" };
  }
  if (step.href.includes("/checkpoint/")) return { kind: "practice", label: "Course practice", title: step.title, description: step.sub,
    action: step.href.includes("part=feedback") ? "Open checkpoint feedback" : step.href.includes("part=writing") ? "Open writing task" : "Start checkpoint" };
  if (step.href.endsWith("/test")) return { kind: "practice", label: `${level.name} · Mock test`, title: step.title, description: step.sub, action: "Start mock test" };
  if (LEVELS.some(item => step.href === `#/${item.id}`)) return { kind: "lesson", label: "Your next level", title: step.title, description: "A new chapter is ready when you are.", action: "Continue learning" };
  return { kind: "practice", label: "Extra practice", title: step.title, description: step.sub || "Work through a short practice set.", action: "Start practice" };
}

function suggestedSteps({ home, course, review }, level) {
  if (home !== "mix" || !course?.href.includes("/lektion/")) return [];
  const words = guidedWords().length;
  const sentences = review.due ? Math.min(review.items.length, GUIDED_SENTENCE_LIMIT) : 0;
  if (!words && !sentences) return [];
  return [
    ...(words ? [{ title: "Word review", detail: `${words} ${words === 1 ? "word" : "words"}`, min: Math.ceil(words / 6), href: "#/karten?l=due" }] : []),
    { ...course, title: presentation(course, level).title, detail: course.href.includes("part=exercises") ? "Lesson exercises" : "Lesson study" },
    ...(sentences ? [{ title: "Sentence review", detail: `${sentences} sentences`, min: Math.ceil(sentences / 4), href: "#/sentences?mode=smart" }] : []),
  ];
}

function dailyGoal(goals, complete) {
  const labels = { minutes: "study minutes", actions: "practice actions", repetitions: "audio repetitions" };
  const fraction = Math.min(1, Math.max(...goals.map(goal => goal.value / goal.target)));
  return `<section class="study-goal${complete ? " study-goal-complete" : ""}" aria-labelledby="daily-goal-title">
    <div class="study-goal-summary"><h2 id="daily-goal-title">${complete ? "Daily goal reached" : "Daily goal"}</h2>
    <p class="small">${goals.map(({ unit, target, value }) => `${value} of ${target} ${labels[unit]}`).join(" or ")}</p></div>
    <progress value="${fraction}" max="1" aria-label="Daily study goal"></progress>
  </section>`;
}

function studyPageLinks(level) {
  return `<nav class="study-page-links" aria-label="Study pages">
    <a class="btn" href="#/roadmap"><span>Lessons</span>${ARROW_ICON}</a>
    <a class="btn" href="#/karten?l=${level.id}"><span>Flashcards</span>${ARROW_ICON}</a>
    <a class="btn" href="#/practice"><span>Exercises</span>${ARROW_ICON}</a>
  </nav>`;
}

function studyPlanCard(steps, links) {
  const minutes = steps.reduce((total, step) => total + step.min, 0);
  return `<section class="study-next study-plan-card" aria-labelledby="study-next-title">
    <p class="study-next-label">Study plan</p><h2 id="study-next-title">About ${minutes} minutes of German</h2>
    <ol class="study-plan-steps">${steps.map(({ title, detail, min }, index) =>
      `<li><span class="study-step-number" aria-hidden="true">${index + 1}</span><div><b>${esc(title)}</b><small>${esc(detail)} · ${min} min</small></div></li>`
    ).join("")}</ol>
    ${links}
  </section>`;
}

const startLink = (href, label) => `<a class="btn study-start" data-home-start href="${esc(href)}">${esc(label)}${ARROW_ICON}</a>`;

function singleCard(step, level, links, optional = false) {
  const view = presentation(step, level);
  return `<section class="study-next study-single${optional ? " study-optional" : ""}" aria-labelledby="study-next-title">
    <div class="study-next-meta"><div class="study-next-type"><span class="study-next-icon">${icon(view.kind)}</span><span>${optional ? "If you want to keep going" : esc(view.label)}</span></div>
      ${step.min && !optional ? `<span>About ${esc(step.min)} min</span>` : ""}</div>
    <div class="study-next-copy"><h2 id="study-next-title">${esc(view.title)}</h2><p class="study-next-description">${esc(optional ? view.label : view.description)}</p></div>
    ${startLink(step.href, optional && view.kind === "lesson" && !step.href.includes("part=exercises") && step.href.includes("/lektion/") ? "Continue lesson" : view.action)}
    ${links}
  </section>`;
}

function recentLessons(lessons) {
  if (!lessons.length) return "";
  return `<details class="study-help"><summary>Recent lessons</summary><ul>${lessons.map(lesson => {
    const { opened, seen, total, next } = lessonSentenceProgress(lesson);
    const percent = total ? Math.round(seen / total * 100) : 0;
    const date = opened ? new Date(opened).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "";
    return `<li><a href="#/${lesson.level.id}/lektion/${lesson.id}">${safeStudyTitle(lesson)}</a>
      ${date || total ? `<span class="small muted"> · ${date ? esc(date) : ""}${date && total ? " · " : ""}${total ? `${percent}% of sentences practised` : ""}</span>` : ""}
      ${total ? `<a class="tlink small" href="#/sentences?lesson=${lesson.key}&amp;resume">${seen && seen < total ? `Continue from sentence ${next + 1}` : seen ? "Review sentences" : "Start sentence practice"}</a>` : ""}</li>`;
  }).join("")}</ul></details>`;
}

function studyLinks(title, sets) {
  if (!sets.length) return "";
  return `<details class="study-help"><summary>${title}</summary><ul>${sets.map(set => {
    const href = set.kind === "topic" ? `#/karten?l=${set.key}` : `#/${set.level.id}/lektion/${set.id}`;
    return `<li><a href="${esc(href)}">${safeStudyTitle(set)}</a></li>`;
  }).join("")}</ul></details>`;
}

const safeStudyTitle = set => `${esc(set.level.name)} · ${esc(set.title)}`;

export function render(level) {
  const activities = homeActivities(level);
  const { plan, primary, course, review, home } = activities;
  const goals = dailyGoalProgress();
  const complete = goals.some(goal => goal.value >= goal.target);
  const lesson = nextLesson(level);
  const optional = course || (lesson ? { title: lesson.title, href: `#/${level.id}/lektion/${lesson.id}` } : null);
  const suggestions = complete ? [] : suggestedSteps(activities, level);
  const activeSteps = complete ? (optional ? [optional] : []) : suggestions.length ? suggestions : [primary];
  const activePaths = new Set(activeSteps.map(({ href }) => href.includes("/lektion/") ? href.split("?")[0] : href));
  const unused = set => !activePaths.has(set.kind === "topic" ? `#/karten?l=${set.key}` : `#/${set.level.id}/lektion/${set.id}`);
  const recent = recentStudyLessons().filter(unused);
  const favorites = pinnedStudySets().filter(set => unused(set) && !recent.includes(set));
  const goal = dailyGoal(goals, complete);
  const words = dueCount();
  const dueCounts = [words ? `${words} ${words === 1 ? "word" : "words"}` : "", review.due ? `${review.due} ${review.due === 1 ? "sentence" : "sentences"}` : ""].filter(Boolean);
  const due = home === "course" && course && dueCounts.length
    ? `<div class="study-due"><b>Due today</b><p class="small muted">${dueCounts.join(" · ")}</p></div>` : "";
  const links = studyPageLinks(level);
  return `<div class="study-home">
    <header class="study-home-header"><h1>Today</h1><span class="study-level">${esc(level.name)}${plan?.session ? ` · Week ${plan.session.week}` : ""}</span></header>
    ${complete ? goal + (optional ? singleCard(optional, level, links, true) : links) :
      (suggestions.length ? studyPlanCard(suggestions, links) : singleCard(primary, level, links)) + `<div class="study-status">${goal}${due}</div>`}
    <div class="study-more">
      ${recentLessons(recent)}
      ${studyLinks("Favorites", favorites)}
      <details class="study-help"><summary>Study settings</summary><ul><li><a href="#/settings?section=goal">Change goal</a></li><li><a href="#/settings?section=review">Review settings</a></li></ul></details>
      <details class="study-help"><summary>Questions about studying</summary><dl>${FAQ.map(item => `<dt>${esc(item.question)}</dt><dd>${esc(item.answer)}</dd>`).join("")}</dl></details>
    </div>
  </div>`;
}
