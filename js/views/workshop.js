// Supported practice for a course module: objective comprehension and reviewed production.
import { courseChecks, logPractice, recordCourseCheck } from '../state.js';
import { speakerButton } from '../ui/audio.js';
import { esc } from '../utils.js';
import { breadcrumb } from './shared.js';

let level, module, pack;
let answers = {};
const writingChecks = ['I covered every requested point.', 'My sentences communicate the intended meaning.', 'I checked verbs, articles, capitals and punctuation.', 'I reviewed a correction with a tutor or proficient speaker.'];
function questions(items, section) {
  return items.map((item, i) => `<div class="task"><div class="kind">${i + 1}. ${section === 'L' ? 'Listening' : 'Reading'}</div><div class="q">${esc(item.question)}</div><div class="opts">${item.options.map((option, k) => `<button class="opt" type="button" data-workshop-answer="${section}${i}" data-k="${k}">${esc(option)}</button>`).join('')}</div><div id="workshop-fb-${section}${i}" aria-live="polite"></div></div>`).join('');
}
export function render(param) {
  level = param.level;
  module = param.module;
  pack = module.workshop;
  answers = {};
  const previous = courseChecks(level, module.id).workshopScore;
  return `${breadcrumb(level, `Module ${module.id} practice`)}<header class="course-header"><p class="course-eyebrow">A1 · Module ${module.id} checkpoint</p><h1>${esc(module.title)}</h1><p class="intro">Complete both lessons first. Attempt these original practice tasks before revealing the models, then use feedback to review the gaps.</p><a class="tlink" href="#/a1/roadmap">Back to your learning roadmap</a></header>
    <section class="panel"><h2>1. Listen for meaning</h2><p class="muted">Listen without a transcript and answer all three questions. You can replay this supported practice.</p><div class="row">${speakerButton(pack.listening.audioText)}</div>${questions(pack.listening.questions,'L')}<details><summary>Transcript · open after your attempt</summary><p class="reading" lang="de">${esc(pack.listening.audioText)}</p></details></section>
    <section class="panel"><h2>2. Read for meaning</h2><div class="reading" lang="de">${esc(pack.reading.text)}</div>${questions(pack.reading.questions,'R')}</section>
    <section class="panel"><h2>3. Write a practical response</h2><p>${esc(pack.writing.task)}</p><label for="workshop-writing" class="muted small">Aim for about ${pack.writing.wordGoal} words. Clear task completion matters more than an exact count.</label><textarea id="workshop-writing" aria-describedby="workshop-wordcount" placeholder="Schreib auf Deutsch…" data-lenis-prevent></textarea><p class="muted small" id="workshop-wordcount" aria-live="polite">0 words</p><ul class="check-list">${writingChecks.map(text=>`<li><label><input type="checkbox">${esc(text)}</label></li>`).join('')}</ul><button class="btn small ghost" type="button" data-workshop-model="writing">Show a model</button><div id="workshop-model-writing"></div></section>
    <section class="panel"><h2>4. Speak and interact</h2><p>${esc(pack.speaking.task)}</p><p class="muted">Try this with a partner. Change the details, switch roles, and ask one follow-up question. Ask whether your intended meaning was clear.</p><button class="btn small ghost" type="button" data-workshop-model="speaking">Show a sample exchange</button><div id="workshop-model-speaking"></div></section>
    <section class="panel"><h2>Your checkpoint</h2><div id="workshop-score" aria-live="polite"><p>Answer the six comprehension questions. Aim for at least 5/6, then review writing and speaking with feedback.${previous !== undefined ? ` Your saved best comprehension result is ${previous}/6.` : ''}</p></div><p class="muted small">The comprehension result is saved separately from lesson results. Writing and speaking are not automatically assessed.</p><a class="btn small" href="#/a1/roadmap">Record your practice and feedback on the roadmap</a></section>`;
}
export function onClick(e, button) {
  if (!button || !pack) return;
  const d = button.dataset;
  if (d.workshopAnswer !== undefined) {
    const key = d.workshopAnswer;
    if (key in answers) return;
    const section = key[0] === 'L' ? pack.listening : pack.reading;
    const item = section.questions[+key.slice(1)];
    const correct = +d.k === item.answer;
    answers[key] = correct;
    logPractice();
    button.parentElement.querySelectorAll('button').forEach(option => {
      option.disabled = true;
      if (+option.dataset.k === item.answer) option.classList.add('right');
    });
    if (!correct) button.classList.add('wrong');
    document.getElementById(`workshop-fb-${key}`).innerHTML = `<div class="fb ${correct ? 'ok' : 'no'}">${correct ? 'Correct.' : `Correct answer: ${esc(item.options[item.answer])}.`} Evidence: <span lang="de">${esc(item.evidence)}</span></div>`;
    if (Object.keys(answers).length === 6) {
      const score = Object.values(answers).filter(Boolean).length;
      recordCourseCheck(level, module.id, 'workshopScore', Math.max(score, courseChecks(level, module.id).workshopScore || 0));
      document.getElementById('workshop-score').innerHTML = `<div class="fb ${score >= 5 ? 'ok' : 'info'}"><b>${score}/6 comprehension answers correct.</b> ${score >= 5 ? 'Now complete your writing and spoken interaction with feedback.' : 'Review the missed details, then attempt the workshop again.'}</div>`;
    }
  } else if (d.workshopModel !== undefined) {
    const section = pack[d.workshopModel];
    document.getElementById(`workshop-model-${d.workshopModel}`).innerHTML = `<div class="fb info"><p lang="de">${esc(section.modelAnswer)}</p>${speakerButton(section.modelAnswer)}</div>`;
  }
}
export function onKeydown(e) {
  if (e.target.id === 'workshop-writing') requestAnimationFrame(() => {
    const words = e.target.value.trim().split(/\s+/).filter(Boolean).length;
    document.getElementById('workshop-wordcount').textContent = `${words} word${words === 1 ? '' : 's'}`;
  });
}
export function onChange(e) {
  if (e.target.id === 'workshop-writing') onKeydown(e);
}
