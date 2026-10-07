// A course roadmap combines objective lesson results with learner practice and feedback records.
import { gradedTasks } from '../content.js';
import { courseChecks, coursePace, isDone, lessonScore, recordCourseCheck, setCoursePace } from '../state.js';
import { esc } from '../utils.js';
import { breadcrumb } from './shared.js';

let level;
const skills = ['listening', 'reading', 'writing', 'speaking'];
function objectiveComplete(module) {
  return module.lessonIds.every(id => {
    const l = level.lessons.find(item => item.id === id);
    return isDone(l) && lessonScore(l) / gradedTasks(l).length >= 0.8;
  });
}
function reviewed(module) {
  const checks = courseChecks(level, module.id);
  return objectiveComplete(module) && checks.workshopScore >= 5 && skills.every(skill => checks[skill]);
}
function paceText() {
  const hours = level.course.coreHours + level.course.reviewHours;
  return `${coursePace(level)} weeks · about ${Math.round(hours / coursePace(level))} study hours per week · ${hours} hours planned overall. Adjust the pace after each checkpoint.`;
}
function moduleHTML(module) {
  const checks = courseChecks(level, module.id);
  const complete = reviewed(module);
  const objective = objectiveComplete(module);
  const lessons = module.lessonIds.map(id => level.lessons.find(item => item.id === id));
  const topics = module.topics.map(id => level.topics.find(topic => topic.id === id)).filter(Boolean);
  return `<details class="course-module"${module.id === 1 ? ' open' : ''}>
    <summary><span class="course-module-number">${module.id}</span><span><b>${esc(module.title)}</b><small>2 lessons · ${module.hours} hours of study and practice</small></span><span class="course-module-status" id="module-status-${module.id}">${complete ? 'Practice reviewed' : `${lessons.filter(isDone).length}/2 exercises complete`}</span></summary>
    <div class="course-module-body"><h3>You will be able to</h3><ul>${module.goals.map(goal => `<li>${esc(goal)}</li>`).join('')}</ul>
      <div class="course-lesson-links">${lessons.map(l => `<a href="#/${level.id}/lektion/${l.id}"><span>Lesson ${l.position}</span><b>${esc(l.title)}</b><small>${isDone(l) ? `${lessonScore(l)}/${gradedTasks(l).length} objective answers correct` : 'Open lesson'}</small></a>`).join('')}</div>
      <dl class="course-skills"><div><dt>Pronunciation</dt><dd>${esc(module.pronunciation)}</dd></div>${skills.map(skill => `<div><dt>${skill[0].toUpperCase() + skill.slice(1)}</dt><dd>${esc(module[skill])}</dd></div>`).join('')}</dl>
      <h3>Vocabulary sets</h3><div class="course-topic-links">${topics.map(topic => `<a class="tlink" href="#/karten?l=${topic.key}">${esc(topic.title)}</a>`).join('')}</div>
      <div class="course-checkpoint"><h3>Checkpoint</h3><p>${esc(module.checkpoint)}</p><a class="btn small ghost" href="#/${level.id}/checkpoint/${module.id}">Practise all four skills</a><p class="small">${checks.workshopScore !== undefined ? `Best checkpoint comprehension result: ${checks.workshopScore}/6.` : 'Complete six listening and reading questions, a writing task and spoken interaction.'} Aim for at least 5/6 in comprehension.</p><p class="muted small">${objective ? 'Objective lesson target reached.' : 'Aim for at least 80% in each lesson’s objective exercises; repeat and correct gaps before continuing.'} These checkboxes record your own practice and feedback.</p>
        <ul class="check-list">${skills.map(skill => `<li><label><input type="checkbox" data-course-module="${module.id}" data-course-skill="${skill}"${checks[skill] ? ' checked' : ''}>${skill === 'writing' || skill === 'speaking' ? `I practised ${skill} and reviewed my work with feedback.` : `I completed the ${skill} practice and corrected my mistakes.`}</label></li>`).join('')}</ul>
      </div>
    </div></details>`;
}
export function render(lv) {
  level = lv;
  const course = lv.course;
  if (!course) return `${breadcrumb(lv, 'Lessons')}<h1>${lv.name} lessons</h1><p>The complete lesson guide is available for A1.</p><a class="btn" href="#/a1/roadmap">Open the A1 lessons</a>`;
  const complete = course.modules.filter(reviewed).length;
  const finalChecks = courseChecks(lv, 'final');
  return `${breadcrumb(lv, 'Lessons')}
    <header class="course-header"><p class="course-eyebrow">German A1 · From beginner to exam preparation</p><h1>A1 lessons</h1><p class="intro">Learn useful German, practise all four skills, and prepare for the adult Goethe-Zertifikat A1: Start Deutsch 1. Work through the modules in order and use each checkpoint to decide what to review.</p><div class="course-facts"><span><b>32</b> lessons</span><span><b>16</b> modules</span><span><b>4</b> language skills</span><span><b id="modules-reviewed">${complete}/16</b> modules reviewed</span></div></header>
    <section class="panel course-plan"><h2>Choose your study pace</h2><label for="course-pace">Course length</label> <select id="course-pace" data-course-pace><option value="8"${coursePace(lv) === 8 ? ' selected' : ''}>8 weeks · intensive</option><option value="16"${coursePace(lv) === 16 ? ' selected' : ''}>16 weeks · regular</option><option value="24"${coursePace(lv) === 24 ? ' selected' : ''}>24 weeks · gentle</option></select><p class="muted" id="pace-summary">${paceText()}</p><p class="small">A planning estimate, not a time-to-pass promise. At the regular pace, use six one-hour daily sessions plus about three hours of weekly practice, review and partner work.</p><ol class="course-daily">${course.dailyPlan.map(step => `<li><b>${step.minutes} min · ${esc(step.title)}</b><span>${esc(step.description)}</span></li>`).join('')}</ol></section>
    <section aria-labelledby="course-path-h"><h2 id="course-path-h">All lessons and checkpoints</h2><p class="muted">Each module combines knowledge, vocabulary and practical communication. Your saved exercise progress and your practice records have different roles.</p>${course.modules.map(moduleHTML).join('')}</section>
    <section class="panel course-vocabulary"><h2>Build vocabulary you can use</h2><p>${esc(course.vocabulary.recognitionGoal)}</p><p>${esc(course.vocabulary.productionGoal)}</p><ul>${course.vocabulary.method.map(item => `<li>${esc(item)}</li>`).join('')}</ul><a class="btn small ghost" href="#/karten?l=a1">Practise A1 vocabulary</a></section>
    <section class="panel course-exam"><h2>Prepare for the exam tasks</h2><div class="course-exam-grid"><div><b>Listening · about 20 min</b><p>Short conversations, announcements and phone messages.</p></div><div><b>Reading · 25 min</b><p>Short messages, advertisements and notices.</p></div><div><b>Writing · 20 min</b><p>Form fields and a short message covering three requested points.</p></div><div><b>Speaking · 15 min</b><p>Introduce yourself, spell and give a number, exchange questions, make requests and respond.</p></div></div><p class="small">${esc(course.exam.description)} The written sections total 65 minutes; speaking is a group task. Confirm the current rules with your exam centre.</p><a class="btn small ghost" href="#/a1/test">Take the A1 practice assessment</a></section>
    <section class="panel course-ready"><h2>Check your readiness</h2><p class="muted">Use unfamiliar practice sets. Ask a partner or tutor to review writing and speaking; a grammar score alone cannot establish exam readiness.</p><ul class="check-list">${course.readiness.map((item, i) => `<li><label><input type="checkbox" data-course-module="final" data-course-skill="check${i}"${finalChecks[`check${i}`] ? ' checked' : ''}>${esc(item)}</label></li>`).join('')}</ul></section>
    <section class="course-resources"><h2>Official practice resources</h2><p class="muted">Use the official recordings and different practice sets for realistic rehearsals. Our course content is independently written.</p><ul>${course.sources.map(source => `<li><a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.title)}</a></li>`).join('')}</ul><p class="muted small">${esc(course.assessmentNote)}</p></section>`;
}
export function onChange(e) {
  if (!level?.course) return;
  if (e.target.dataset.coursePace !== undefined) {
    setCoursePace(level, +e.target.value);
    document.getElementById('pace-summary').textContent = paceText();
  } else if (e.target.dataset.courseModule) {
    recordCourseCheck(level, e.target.dataset.courseModule, e.target.dataset.courseSkill, e.target.checked);
    const module = level.course.modules.find(m => String(m.id) === e.target.dataset.courseModule);
    if (module) document.getElementById(`module-status-${module.id}`).textContent = reviewed(module) ? 'Practice reviewed' : `${module.lessonIds.filter(id => isDone(level.lessons.find(l => l.id === id))).length}/2 exercises complete`;
    document.getElementById('modules-reviewed').textContent = `${level.course.modules.filter(reviewed).length}/16`;
  }
}
