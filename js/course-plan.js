// Arrange existing course targets into weeks and study days. Content and saved results stay in place.
import { gradedTasks } from "./content.js";
import { courseChecks, courseDay, coursePace, coursePlanStart, isDone, lessonScore } from "./state.js";
import { daysBetween, todayKey } from "./utils.js";

export const COURSE_SKILLS = ["listening", "reading", "writing", "speaking"];

export function objectiveComplete(level, module) {
  return module.lessonIds.every((id) => {
    const lesson = level.lessons.find((item) => item.id === id);
    return isDone(lesson) && lessonScore(lesson) / gradedTasks(lesson).length >= 0.8;
  });
}

export function moduleReviewed(level, module) {
  const checks = courseChecks(level, module.id);
  return objectiveComplete(level, module) && checks.workshopScore >= 5 && COURSE_SKILLS.every((skill) => checks[skill]);
}

/** Every module keeps its two lessons followed by its checkpoint, at all three paces. */
export function studyPlan(level) {
  if (!level.course) return null;
  const weeks = coursePace(level);
  const units = level.course.modules.flatMap((module) => [
    ...module.lessonIds.map((id) => {
      const lesson = level.lessons.find((item) => item.id === id);
      return { key: lesson.key, type: "lesson", module, lesson, done: isDone(lesson) };
    }),
    { key: `checkpoint-${module.id}`, type: "checkpoint", module, done: moduleReviewed(level, module) },
  ]);
  const totalDays = weeks * 6;
  const sessions = [];
  const schedule = Array.from({ length: weeks }, (_, index) => ({ number: index + 1, units: [] }));
  units.forEach((unit, index) => {
    unit.index = index;
    unit.start = Math.floor(index * totalDays / units.length);
    unit.end = Math.floor((index + 1) * totalDays / units.length) - 1;
    unit.week = Math.floor(unit.start / 6) + 1;
    unit.lastWeek = Math.floor(unit.end / 6) + 1;
    const parts = unit.end - unit.start + 1;
    const phases = unit.type === "lesson"
      ? parts === 1 ? ["all"] : parts === 2 ? ["study", "exercises"] : ["study", "exercises", "review"]
      : parts === 1 ? ["all"] : parts === 2 ? ["comprehension", "feedback"] : ["comprehension", "production", "feedback"];
    for (let day = unit.start; day <= unit.end; day++) {
      sessions.push({ unit, phase: phases[Math.min(day - unit.start, phases.length - 1)], index: day,
        week: Math.floor(day / 6) + 1, day: day % 6 + 1 });
    }
    for (let week = unit.week; week <= unit.lastWeek; week++) schedule[week - 1].units.push(unit);
  });
  const hours = level.course.coreHours + level.course.reviewHours;
  return { weeks, units, sessions, schedule, hours, dailyMinutes: Math.round(hours * 60 / totalDays) };
}

export function paceGuidance(plan) {
  const lessons = plan.units.filter(unit => unit.type === 'lesson').length;
  const checkpoints = plan.units.length - lessons;
  const structure = `Spread ${lessons} lessons and ${checkpoints} checkpoints across ${plan.weeks} weeks. Follow the day ranges below: study and exercises come before each checkpoint, with longer plans allowing more repeated practice and feedback.`;
  const routine = plan.dailyMinutes === 60 ? 'Use the 60-minute routine below once per study day.'
    : plan.dailyMinutes < 60 ? `The routine below is a 60-minute example. Shorten its blocks proportionally for your ${plan.dailyMinutes}-minute study day, while keeping all four skills in your weekly practice.`
      : `Use the 60-minute routine below, then spread another ${plan.dailyMinutes - 60} minutes across extra listening, conversation, reviewed writing and recall.`;
  return `${structure} Plan six study days and one flexible review or rest day per week. ${routine}`;
}

/** Dates choose a study phase; unfinished earlier targets remain first so missed days do not skip work. */
export function todayStudyPlan(level) {
  const plan = studyPlan(level);
  if (!plan) return null;
  const pending = plan.units.find((unit) => !unit.done);
  if (!pending) return { ...plan, session: null };
  const anchor = coursePlanStart(level, pending.key);
  const first = plan.units.find((unit) => unit.key === anchor.firstTarget) || pending;
  const elapsed = Math.max(0, daysBetween(anchor.date, todayKey()));
  const offset = first.start % 6;
  const calendarDays = elapsed + offset;
  const studyDays = Math.floor(calendarDays / 7) * 6 + Math.min(calendarDays % 7, 6) - offset;
  const rest = calendarDays % 7 === 6;
  const scheduled = plan.sessions[Math.min(first.start + studyDays - (rest ? 1 : 0), plan.sessions.length - 1)];
  let target = scheduled;
  if (pending.index < scheduled.unit.index) {
    // Use the full target when catching up, including any missing lesson or checkpoint work.
    target = { ...plan.sessions[pending.end], phase: "all" };
  } else if (scheduled.unit.done && scheduled.phase !== "review") {
    target = plan.sessions[pending.start];
  }
  if (rest) {
    const review = [...plan.units].reverse().find((unit) => unit.type === "lesson" && unit.done && unit.index < pending.index);
    target = { ...target, unit: review || pending, phase: "review", day: 7 };
  }
  const saved = courseDay(level, { key: target.unit.key, phase: target.phase, week: target.week, day: target.day, rest });
  const unit = plan.units.find((item) => item.key === saved.key) || pending;
  return { ...plan, session: { ...saved, unit } };
}
