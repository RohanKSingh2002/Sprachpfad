// Supported practice for a course module: objective comprehension and reviewed production.
import { courseChecks, logPractice, recordCourseCheck, recordCourseChecks } from '../state.js';
import { COURSE_SKILLS } from '../course-plan.js';
import { wordCount } from '../practice-engine.js';
import { checkpointDraft, saveCheckpointDraft } from '../practice-progress.js';
import { speakerButton } from '../ui/audio.js';
import { jumpTo } from '../ui/scroll.js?v=20261113-polish1';
import { esc, shuffle } from '../utils.js';
import { breadcrumb } from './shared.js';
import { transferHTML } from './course-support.js';

let level, module, pack;
let answers = {};
const writingChecks = ['I covered every requested point.', 'My sentences communicate the intended meaning.', 'I checked verbs, articles, capitals and punctuation.', 'I reviewed a correction with a tutor or proficient speaker.'];
function questions(items, section) {
  const lang = pack.questionLanguage === 'de' ? ' lang="de"' : '';
  return items.map((item, i) => `<div class="task"><div class="kind">${i + 1}. ${section === 'L' ? 'Listening' : 'Reading'}</div><div class="q"${lang}>${esc(item.question)}</div><div class="opts">${shuffle(item.options.map((option,k)=>({option,k}))).map(({option,k}) => `<button class="opt" type="button"${lang} data-workshop-answer="${section}${i}" data-k="${k}">${esc(option)}</button>`).join('')}</div><div id="workshop-fb-${section}${i}" aria-live="polite"></div></div>`).join('');
}
export function render(param) {
  level = param.level;
  module = param.module;
  pack = module.workshop;
  answers = {};
  const moduleNumber = level.course.modules.indexOf(module) + 1;
  const checks = courseChecks(level, module.id);
  const previous = checks.workshopScore;
  const draft = checkpointDraft(level, module);
  const saveLines = (part, label) => `<a class="tlink" href="#/sentences?checkpoint=${level.id}-${module.id}&amp;part=${part}">${label}</a>`;
  return `${breadcrumb(level, `Module ${moduleNumber} practice`)}<header class="course-header"><p class="course-eyebrow">${level.name} · Module ${moduleNumber} checkpoint</p><h1>${esc(module.title)}</h1><p class="intro">Complete the module’s lessons first. Attempt these original practice tasks before revealing the models, then use feedback to review the gaps. Use invented details in personal-data tasks.</p><a class="tlink" href="#/${level.id}/roadmap">Back to your learning roadmap</a></header>
    <section class="panel"><h2>1. Listen for meaning</h2><p class="muted">Listen without a transcript and answer all three questions. You can replay this supported practice.</p><div class="row">${speakerButton(pack.listening.audioText, 'Play checkpoint listening text')}</div>${questions(pack.listening.questions,'L')}<details><summary>Transcript · open after your attempt</summary><p class="reading" lang="de">${esc(pack.listening.audioText)}</p>${saveLines('listening', 'Import transcript sentences')}</details></section>
    <section class="panel"><h2>2. Read for meaning</h2>${pack.glossary?.length ? `<details><summary>Vocabulary help</summary><ul>${pack.glossary.map(w=>`<li><span lang="de">${esc(w.de)}</span> — ${esc(w.en)}</li>`).join('')}</ul></details>` : ''}<div class="reading" lang="de">${esc(pack.reading.text)}</div>${questions(pack.reading.questions,'R')}${saveLines('reading', 'Import reading sentences')}</section>
    <section class="panel" id="workshop-part-writing"><h2>3. Write a practical response</h2><p>${esc(pack.writing.task)}</p><label for="workshop-writing" class="muted small">Aim for about ${pack.writing.wordGoal} words. Clear task completion matters more than an exact count.</label><textarea id="workshop-writing" aria-describedby="workshop-wordcount workshop-draft-status" maxlength="6000" placeholder="Schreib auf Deutsch…" data-lenis-prevent>
${esc(draft.text)}</textarea><p class="muted small"><span id="workshop-wordcount">${wordCount(draft.text)} words</span> · <span id="workshop-draft-status">${draft.text ? 'Draft saved on this device' : 'Your draft saves on this device as you type'}</span></p><ul class="check-list">${writingChecks.map((text, index)=>`<li><label><input type="checkbox" data-workshop-writing-check="${index}"${draft.checks.includes(index) ? ' checked' : ''}>${esc(text)}</label></li>`).join('')}</ul><button class="btn small ghost" type="button" data-workshop-model="writing">Show a model</button><div id="workshop-model-writing"></div></section>
    <section class="panel"><h2>4. Speak and interact</h2><p>${esc(pack.speaking.task)}</p><p class="muted">Try this with a partner. Change the details, switch roles, and ask one follow-up question. Ask whether your intended meaning was clear.</p><button class="btn small ghost" type="button" data-workshop-model="speaking">Show a sample exchange</button><div id="workshop-model-speaking"></div></section>
    ${transferHTML(level, module)}
    <section class="panel" id="workshop-part-feedback"><h2>Record checkpoint feedback</h2><div id="workshop-score" aria-live="polite"><p>Answer the six comprehension questions. Aim for at least 5/6, then review writing and speaking with feedback.${previous !== undefined ? ` Your saved best comprehension result is ${previous}/6.` : ''}</p></div>
      <p class="muted small">Use these checks to record your practice and feedback on the course roadmap.</p>
      <ul class="check-list">${COURSE_SKILLS.map(skill => `<li><label><input type="checkbox" data-workshop-skill="${skill}"${checks[skill] ? ' checked' : ''}>I practised ${skill} and reviewed my work.</label></li>`).join('')}</ul>
      <button class="btn small" type="button" data-save-workshop-feedback>Save checkpoint feedback</button>
      <p id="workshop-feedback-status" role="status"></p>
      <a class="tlink" href="#/${level.id}/roadmap?module=${module.id}">View this module on the roadmap</a>
    </section>`;
}
export function onClick(e, button) {
  if (!button || !pack) return;
  const d = button.dataset;
  if (d.saveWorkshopFeedback !== undefined) {
    const changes = Object.fromEntries([...document.querySelectorAll('[data-workshop-skill]')].map(box => [box.dataset.workshopSkill, box.checked]));
    recordCourseChecks(level, module.id, changes);
    document.getElementById('workshop-feedback-status').textContent = 'Checkpoint feedback recorded on your roadmap.';
  } else if (d.workshopAnswer !== undefined) {
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
    document.getElementById(`workshop-model-${d.workshopModel}`).innerHTML = `<div class="fb info"><p lang="de" style="white-space:pre-line">${esc(section.modelAnswer)}</p>${speakerButton(section.modelAnswer)}</div>`;
  }
}
function persistDraft() {
  const text = document.getElementById('workshop-writing').value;
  const checks = [...document.querySelectorAll('[data-workshop-writing-check]:checked')].map(box => Number(box.dataset.workshopWritingCheck));
  const saved = saveCheckpointDraft(level, module, { text, checks });
  const words = wordCount(text);
  document.getElementById('workshop-wordcount').textContent = `${words} word${words === 1 ? '' : 's'}`;
  document.getElementById('workshop-draft-status').textContent = saved ? 'Draft saved on this device' : 'Draft could not be saved on this device';
}

export function mount() {
  document.getElementById('workshop-writing').addEventListener('input', persistDraft);
  const part = new URLSearchParams(location.hash.split('?')[1]).get('part');
  if (part === 'writing' || part === 'feedback') jumpTo(document.getElementById(`workshop-part-${part}`));
}
export function onChange(e) {
  if ('workshopWritingCheck' in e.target.dataset) persistDraft();
  if ('workshopSkill' in e.target.dataset) document.getElementById('workshop-feedback-status').textContent = 'Save to record these changes.';
}
