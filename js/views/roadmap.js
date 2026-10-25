// A course roadmap combines objective lesson results with learner practice and feedback records.
import { gradedTasks } from '../content.js';
import { courseChecks, coursePace, isDone, lessonScore, recordCourseCheck, setCoursePace } from '../state.js';
import { esc } from '../utils.js';
import { breadcrumb, levelSwitch } from './shared.js';
import { strategiesHTML, transferHTML } from './course-support.js';
import { COURSE_SKILLS, moduleReviewed, objectiveComplete, paceGuidance, studyPlan } from '../course-plan.js';
import { jumpTo } from '../ui/scroll.js';

let level;
const skills = COURSE_SKILLS;
const reviewed = (module) => moduleReviewed(level, module);
function paceText(plan) {
  return `${plan.weeks} weeks · about ${Math.round(plan.hours / plan.weeks)} study hours per week · ${plan.dailyMinutes} minutes per study day · ${plan.hours} hours planned overall, including repeated practice, partner conversation and reviewed writing. These are planning estimates, not the duration of unique material in the app. Your saved progress carries across every pace.`;
}
function targetTiming(unit) {
  const firstDay = unit.start % 6 + 1;
  const lastDay = unit.end % 6 + 1;
  const days = firstDay === lastDay ? `Day ${firstDay}` : `Days ${firstDay}–${lastDay}`;
  return `Week ${unit.week} · ${days}`;
}
function moduleHeadingHTML(module, plan, continuationLinks = []) {
  const lessons = module.lessonIds.map(id => level.lessons.find(item => item.id === id));
  const targets = plan.units.filter(unit => unit.module.id === module.id);
  const firstWeek = targets[0].week;
  const lastWeek = targets[targets.length - 1].lastWeek;
  const timing = firstWeek === lastWeek ? `Week ${firstWeek}` : `Weeks ${firstWeek}–${lastWeek}`;
  return `<span class="course-module-number">${module.id}</span><span><b>${esc(module.title)}</b><small>${timing} · ${lessons.length} lessons · ${module.hours} hours of study and practice</small>${continuationLinks.map(link => `<small class="course-module-continue">${link}</small>`).join('')}</span><span class="course-module-status" data-module-status="${module.id}">${reviewed(module) ? 'Practice reviewed' : `${lessons.filter(isDone).length}/${lessons.length} exercises complete`}</span>`;
}
function moduleHTML(module, plan, open, continuationLinks = []) {
  const checks = courseChecks(level, module.id);
  const objective = objectiveComplete(level, module);
  const lessons = module.lessonIds.map(id => level.lessons.find(item => item.id === id));
  const topics = module.topics.map(id => level.topics.find(topic => topic.id === id)).filter(Boolean);
  const targets = plan.units.filter(unit => unit.module.id === module.id);
  return `<details class="course-module" id="course-module-${module.id}"${open ? ' open' : ''}>
    <summary>${moduleHeadingHTML(module, plan, continuationLinks)}</summary>
    <div class="course-module-body"><h3>You will be able to</h3><ul>${module.goals.map(goal => `<li>${esc(goal)}</li>`).join('')}</ul>
      <div class="course-lesson-links">${lessons.map(l => `<a href="#/${level.id}/lektion/${l.id}"><span>Lesson ${l.position} · ${targetTiming(targets.find(unit => unit.key === l.key))}</span><b>${esc(l.title)}</b><small>${isDone(l) ? `${lessonScore(l)}/${gradedTasks(l).length} objective answers correct` : 'Open lesson'}</small></a>`).join('')}</div>
      <dl class="course-skills"><div><dt>Pronunciation</dt><dd>${esc(module.pronunciation)}</dd></div>${skills.map(skill => `<div><dt>${skill[0].toUpperCase() + skill.slice(1)}</dt><dd>${esc(module[skill])}</dd></div>`).join('')}</dl>
      <h3>Vocabulary sets</h3><div class="course-topic-links">${topics.map(topic => `<a class="tlink" href="#/karten?l=${topic.key}">${esc(topic.title)}</a>`).join('')}</div>
      ${transferHTML(level, module)}
      <div class="course-checkpoint"><h3>Checkpoint</h3><p class="muted small">${targetTiming(targets.find(unit => unit.type === 'checkpoint'))}</p><p>${esc(module.checkpoint)}</p><a class="btn small ghost" href="#/${level.id}/checkpoint/${module.id}">Practise all four skills</a><p class="small">${checks.workshopScore !== undefined ? `Best checkpoint comprehension result: ${checks.workshopScore}/6.` : 'Complete six listening and reading questions, a writing task and spoken interaction.'} Aim for at least 5/6 in comprehension.</p><p class="muted small">${objective ? 'Objective lesson target reached.' : 'Aim for at least 80% in each lesson’s objective exercises; repeat and correct gaps before continuing.'} These checkboxes record your own practice and feedback.</p>
        <ul class="check-list">${skills.map(skill => `<li><label><input type="checkbox" data-course-module="${module.id}" data-course-skill="${skill}"${checks[skill] ? ' checked' : ''}>${skill === 'writing' || skill === 'speaking' ? `I practised ${skill} and reviewed my work with feedback.` : `I completed the ${skill} practice and corrected my mistakes.`}</label></li>`).join('')}</ul>
      </div>
    </div></details>`;
}

function weeksHTML(plan, openModules = new Set([1])) {
  return plan.schedule.map(week => {
    const starts = level.course.modules.filter(module => plan.units.find(unit => unit.module === module).week === week.number);
    const continuing = [...new Set(week.units.map(unit => unit.module))].filter(module => !starts.includes(module));
    const references = continuing.map(module => {
      const firstWeek = plan.units.find(unit => unit.module === module).week;
      return `<a class="tlink" href="#/${level.id}/roadmap?module=${module.id}">Continue module ${module.id} from Week ${firstWeek}</a>`;
    });
    // Continuation-only weeks share the module header layout and link back to its full dropdown.
    const continuationCards = starts.length ? '' : continuing.map((module, index) => `<div class="course-module course-module-reference"><div class="course-module-heading">${moduleHeadingHTML(module, plan, [references[index]])}</div></div>`).join('');
    return `<section aria-labelledby="course-week-${week.number}"><h3 id="course-week-${week.number}">Week ${week.number}</h3><p class="muted small" data-week-status="${week.number}">${week.units.filter(unit => unit.done).length}/${week.units.length} targets complete · Day 7: flexible review or rest</p>${continuationCards}${starts.map((module, index) => moduleHTML(module, plan, openModules.has(module.id), index === 0 ? references : [])).join('')}</section>`;
  }).join('');
}

export function render(lv) {
  level = lv;
  const course = lv.course;
  if (!course) return `${breadcrumb(lv, 'Lessons')}<h1>${lv.name} lessons</h1><p>The complete lesson guide is available for A1.</p><a class="btn" href="#/a1/roadmap">Open the A1 lessons</a>`;
  const complete = course.modules.filter(reviewed).length;
  const finalChecks = courseChecks(lv, 'final');
  const plan = studyPlan(lv);
  return `${breadcrumb(lv, 'Lessons')}
    ${levelSwitch(lv, '/roadmap', 'Choose a course level')}
    <header class="course-header"><p class="course-eyebrow">${esc(course.eyebrow || 'German A1 · From beginner to exam preparation')}</p><h1>${lv.name} lessons</h1><p class="intro">${esc(course.introduction || 'Learn useful German, practise all four skills, and prepare for the adult Goethe-Zertifikat A1: Start Deutsch 1. Work through the modules in order and use each checkpoint to decide what to review.')}</p>${course.scopeNote ? `<p class="muted small">${esc(course.scopeNote)}</p>` : ''}<div class="course-facts"><span><b>${lv.lessons.length}</b> lessons</span><span><b>${course.modules.length}</b> modules</span><span><b>4</b> language skills</span><span><b id="modules-reviewed">${complete}/${course.modules.length}</b> modules reviewed</span></div>${course.entryReview ? `<details class="course-transfer"><summary>Before you start</summary><p>${esc(course.entryReview)}</p>${lv.index > 0 ? `<a class="tlink" href="#/${['a1','a2'][lv.index - 1]}/roadmap">Review the previous level</a>` : ''}</details>` : ''}</header>
    <section class="panel course-plan"><h2>Choose your study pace</h2><label for="course-pace">Course length</label> <select id="course-pace" data-course-pace><option value="8"${coursePace(lv) === 8 ? ' selected' : ''}>8 weeks · intensive</option><option value="16"${coursePace(lv) === 16 ? ' selected' : ''}>16 weeks · regular</option><option value="24"${coursePace(lv) === 24 ? ' selected' : ''}>24 weeks · gentle</option></select><p class="muted" id="pace-summary" aria-live="polite">${paceText(plan)}</p><p class="small" id="pace-guidance">${paceGuidance(plan)}</p><ol class="course-daily">${course.dailyPlan.map(step => `<li><b>${step.minutes} min · ${esc(step.title)}</b><span>${esc(step.description)}</span></li>`).join('')}</ol></section>
    ${strategiesHTML(course)}
    <section aria-labelledby="course-path-h"><h2 id="course-path-h">All lessons and checkpoints</h2><p class="muted">Each module combines knowledge, vocabulary and practical communication. Your saved exercise progress and your practice records have different roles.</p><p class="muted small">Week numbers describe your course sequence. Start with the first unfinished target; your remaining study days begin when you next open Home. Each week uses six study days and one flexible review or rest day.</p><div id="course-weeks">${weeksHTML(plan)}</div></section>
    <section class="panel course-vocabulary"><h2>Build vocabulary you can use</h2><p>${esc(course.vocabulary.recognitionGoal)}</p><p>${esc(course.vocabulary.productionGoal)}</p><ul>${course.vocabulary.method.map(item => `<li>${esc(item)}</li>`).join('')}</ul><a class="btn small ghost" href="#/karten?l=${lv.id}">Practise ${lv.name} vocabulary</a></section>
    ${course.exam ? `<section class="panel course-exam"><h2>Prepare for the exam tasks</h2><div class="course-exam-grid"><div><b>Listening · about 20 min</b><p>Short conversations, announcements and phone messages.</p></div><div><b>Reading · 25 min</b><p>Short messages, advertisements and notices.</p></div><div><b>Writing · 20 min</b><p>Form fields and a short message covering three requested points.</p></div><div><b>Speaking · 15 min</b><p>Introduce yourself, spell and give a number, exchange questions, make requests and respond.</p></div></div><p class="small">${esc(course.exam.description)} The written sections total 65 minutes; speaking is a group task. Confirm the current rules with your exam centre.</p><a class="btn small ghost" href="#/${lv.id}/test">Take the ${lv.name} practice assessment</a></section>` : `<section class="panel course-exam"><h2>Practise with unfamiliar material</h2><p>Use the short in-app assessment to review selected skills. For a full exam rehearsal, use the official papers and recordings below and arrange feedback on writing and speaking.</p><a class="btn small ghost" href="#/${lv.id}/test">Open the ${lv.name} practice assessment</a></section>`}
    <section class="panel course-ready"><h2>Check your readiness</h2><p class="muted">Use unfamiliar practice sets. Ask a partner or tutor to review writing and speaking; a grammar score alone cannot establish exam readiness.</p><ul class="check-list">${course.readiness.map((item, i) => `<li><label><input type="checkbox" data-course-module="final" data-course-skill="check${i}"${finalChecks[`check${i}`] ? ' checked' : ''}>${esc(item)}</label></li>`).join('')}</ul></section>
    <section class="course-resources"><h2>Official practice resources</h2><p class="muted">Use the official recordings and different practice sets for realistic rehearsals. Our course content is independently written.</p><ul>${course.sources.map(source => `<li><a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.title)}</a></li>`).join('')}</ul><p class="muted small">${esc(course.assessmentNote)}</p></section>`;
}
export function onChange(e) {
  if (!level?.course) return;
  if (e.target.dataset.coursePace !== undefined) {
    const openModules = new Set([...document.querySelectorAll('.course-module[open]')].map(element => Number(element.id.replace('course-module-', ''))));
    setCoursePace(level, +e.target.value);
    const plan = studyPlan(level);
    document.getElementById('pace-summary').textContent = paceText(plan);
    document.getElementById('pace-guidance').textContent = paceGuidance(plan);
    document.getElementById('course-weeks').innerHTML = weeksHTML(plan, openModules);
  } else if (e.target.dataset.courseModule) {
    recordCourseCheck(level, e.target.dataset.courseModule, e.target.dataset.courseSkill, e.target.checked);
    const module = level.course.modules.find(m => String(m.id) === e.target.dataset.courseModule);
    if (module) {
      const status = reviewed(module) ? 'Practice reviewed' : `${module.lessonIds.filter(id => isDone(level.lessons.find(l => l.id === id))).length}/${module.lessonIds.length} exercises complete`;
      document.querySelectorAll(`[data-module-status="${module.id}"]`).forEach(element => { element.textContent = status; });
    }
    document.getElementById('modules-reviewed').textContent = `${level.course.modules.filter(reviewed).length}/${level.course.modules.length}`;
    const plan = studyPlan(level);
    plan.schedule.forEach(week => {
      document.querySelector(`[data-week-status="${week.number}"]`).textContent = `${week.units.filter(unit => unit.done).length}/${week.units.length} targets complete · Day 7: flexible review or rest`;
    });
  }
}

export function mount() {
  const params = new URLSearchParams(location.hash.split('?')[1] || '');
  const id = Number(params.get('module'));
  if (!level.course?.modules.some(module => module.id === id)) return;
  const element = document.getElementById(`course-module-${id}`);
  element.open = true;
  element.querySelector('summary').focus({ preventScroll: true });
  jumpTo(element);
}
