// Original workbook-style practice sets. Learning activity uses the existing account calendar.
import { logPractice } from '../state.js';
import { enter, motionOK, splitReveal } from '../ui/motion.js?v=20261113-polish1';
import { speakerButton, stopAudio } from '../ui/audio.js';
import { esc } from '../utils.js';
import { breadcrumb, levelSwitch } from './shared.js';
import { SKILLS, FORMAT, makeSession, itemIndex, activeItem, orderedChoices, submit, advance, summary, wordCount } from '../practice-engine.js';
import { pendingPractice, practiceProgress, savePracticeProgress } from '../practice-progress.js';
import { refreshInterface } from '../study-language.js';

let level, session = null, filter = 'all', search = '', message = '';
let progress, tab, savedOnDevice;
const tabs = [['sets', 'Practice sets'], ['progress', 'In progress'], ['missed', 'Missed exercises']];
const paragraphs = text => String(text || '').split('\n\n').map(p => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`).join('');
const currentRecord = () => session.records[itemIndex(session)];
const draft = () => session.drafts[itemIndex(session)] ||= { text: '', choice: null, pairs: {}, tokens: [], reviewed: false, checks: [] };
const sets = () => level.practice || [];

function header() {
  return `${breadcrumb(level, 'Practice')}<div class="page-head"><h1>${esc(level.name)} practice</h1>${levelSwitch(level, '/practice', 'Choose a practice level')}</div>
    <p class="muted practice-intro">Make the language yours. Work through a short set, understand each answer, then revisit what needs another try.</p><p><a class="btn small ghost" href="#/sentences">Build a sentence collection</a></p>`;
}
function library() {
  const pending = pendingPractice(level, set => progress.get(set.id));
  const missed = sets().filter(set => progress.get(set.id).missed.length);
  return `<div class="study-tabs" role="group" aria-label="Exercise library">${tabs.map(([id, label]) =>
    `<button class="btn small ghost" type="button" data-practice-tab="${id}" aria-pressed="${tab === id}">${label}</button>`).join('')}</div>
    ${tab !== 'missed' ? continueCards(tab === 'progress' ? pending : pending.slice(0, 1)) : ''}
    ${tab === 'sets' ? practiceSets() : tab === 'missed' ? missedSets(missed) : pending.length ? '' :
      '<section class="panel"><h2>No unfinished sets</h2><p>Your current exercise will appear here once you start a set.</p></section>'}`;
}

function continueCards(pending) {
  return pending.map(({ session: attempt }) => `<section class="panel practice-resume">
    <div><p class="practice-eyebrow">CONTINUE YOUR ${attempt.review ? 'REVIEW' : 'SET'}</p><h2>${esc(attempt.set.title)}</h2>
      <p class="small muted">Exercise ${attempt.position + 1} of ${attempt.indices.length} · ${FORMAT[activeItem(attempt).type]} · ${savedOnDevice ? 'Progress saved on this device' : 'Progress available while this page stays open'}</p></div>
    <button class="btn small" type="button" data-set="${attempt.set.id}"${attempt.review ? ' data-missed' : ''}>Continue</button>
  </section>`).join('');
}

function missedSets(setsWithMisses) {
  return `<section aria-labelledby="missed-heading"><h2 id="missed-heading">Review missed exercises</h2><p class="muted">Incorrect or skipped exercises appear here by set. A correct retry removes the exercise from this list.</p>
    ${setsWithMisses.map(set => {
      const { missed, review } = progress.get(set.id);
      return `<article class="panel practice-missed"><h3>${esc(set.title)}</h3><ul>${missed.map(index => `<li>${esc(set.items[index].prompt)}</li>`).join('')}</ul>
        <button class="btn small" type="button" data-set="${set.id}" data-missed>${review && !review.finished ? 'Continue review' : `Review ${missed.length} ${missed.length === 1 ? 'exercise' : 'exercises'}`}</button></article>`;
    }).join('') || '<p>No missed exercises to review.</p>'}</section>`;
}

function practiceSets() {
  const list = sets().filter(s => (filter === 'all' || s.skill === filter) && `${s.title} ${s.focus} ${s.description}`.toLowerCase().includes(search.toLowerCase().trim()));
  return `<section class="practice-overview" aria-label="Practice library introduction"><div><p class="practice-eyebrow">YOUR PRACTICE WORKBOOK</p><h2>One focus. A little more confidence.</h2><p>Original texts, everyday situations and useful grammar. Choose your next small step.</p></div><div class="practice-library-count"><strong>${sets().length}</strong><span>focused sets<br>across five skills</span></div></section>
    <div class="practice-tools"><div class="practice-filters" role="group" aria-label="Filter practice by skill"><button type="button" data-filter="all" aria-pressed="${filter === 'all'}">All sets</button>${Object.entries(SKILLS).map(([key, label]) => `<button type="button" data-filter="${key}" aria-pressed="${filter === key}">${label}</button>`).join('')}</div><label class="practice-search">Find a topic<input type="search" id="practice-search" value="${esc(search)}" placeholder="e.g. articles, requests, messages"></label></div>
    <p class="practice-list-count" role="status">${list.length} ${list.length === 1 ? 'set' : 'sets'}${filter !== 'all' ? ` · ${SKILLS[filter]}` : ''}</p>
    <div class="practice-library">${list.map((s) => {
      const { normal: pending, result } = progress.get(s.id);
      return `<article class="practice-set"><div class="practice-set-meta"><span>${SKILLS[s.skill]}</span><span>${s.minutes} min</span></div><h2>${esc(s.title)}</h2><p class="practice-focus">${esc(s.focus)}</p><p>${esc(s.description)}</p><div class="practice-set-bottom"><span class="small muted">${s.items.length} exercises${s.skill === 'writing' ? ' · self-review' : ''}</span><button class="btn small${pending && !pending.finished ? '' : ' ghost'}" type="button" data-set="${s.id}">${pending && !pending.finished ? 'Continue set' : result ? 'Practise again' : 'Start set'}<span class="sr">: ${esc(s.title)}</span></button></div>${result ? `<p class="practice-set-result">Last first attempt: ${result.total ? `${result.earned}/${result.total} points` : `${result.reviewed} writing tasks reviewed`}${result.skipped ? ` · ${result.skipped} skipped` : ''}</p>` : ''}</article>`;
    }).join('') || '<div class="practice-card"><h2>No matching sets</h2><p>Try another topic or choose All sets.</p><button type="button" class="btn small ghost" data-clear-search>Clear filters</button></div>'}</div>
    <p class="small muted practice-note">Checked exercises count toward your practice calendar. Drafts, set results and missed exercises are stored on this device. Writing uses self-review.</p>`;
}
function stimulus() {
  const set = session.set;
  if (!set.passage && !set.audioText) return '';
  return `<aside class="practice-source"><p class="practice-eyebrow">${set.audioText ? 'LISTEN & NOTICE' : 'READ & NOTICE'}</p><h2>${esc(set.passageTitle || 'Your text')}</h2>${set.audioText ? `<div class="practice-listen">${speakerButton(set.audioText, 'Play the practice recording')}<span>Listen to the recording<br><small>Replay whenever you need.</small></span></div><details><summary>Show transcript / practise by reading</summary><div class="practice-passage" lang="de">${paragraphs(set.audioText)}</div></details>` : `<div class="practice-passage" lang="de">${paragraphs(set.passage)}</div>`}${set.wordBank ? `<p class="practice-word-bank"><b>Word bank</b><br><span lang="de">${esc(set.wordBank.join(' · '))}</span></p>` : ''}</aside>`;
}
function answerControls(item, record) {
  const d = draft(), disabled = record ? ' disabled' : '';
  if (item.type === 'choice') return `<fieldset class="practice-choices"${disabled}><legend class="sr">Choose one answer</legend>${orderedChoices(session).map((i) => `<label class="practice-choice${record && i === item.answer ? ' is-answer' : ''}"><input type="radio" name="practice-choice" value="${i}"${d.choice === i ? ' checked' : ''}><span lang="de">${esc(item.options[i])}</span></label>`).join('')}</fieldset>`;
  if (item.type === 'match') return `<p class="small muted">Choose one ending for each line. Each ending belongs to one line.</p><div class="practice-match">${item.pairs.map((pair, i) => `<label class="practice-match-row"><span lang="de">${esc(pair.left)}</span><select data-pair="${i}" aria-label="Match for ${esc(pair.left)}"${disabled}><option value="">Choose a match…</option>${orderedChoices(session).map(j => `<option value="${j}"${String(d.pairs[i]) === String(j) ? ' selected' : ''}>${esc(item.pairs[j].right)}</option>`).join('')}</select></label>`).join('')}</div>`;
  if (item.type === 'order') return `<p class="small muted">Tap chunks to build the sentence. Tap a placed chunk to remove it.</p><div class="practice-built" aria-label="Your sentence" lang="de">${d.tokens.map((i, pos) => `<button type="button" class="practice-chunk" data-remove-token="${pos}"${disabled} aria-label="Remove ${esc(item.tokens[i])}">${esc(item.tokens[i])}</button>`).join('') || '<span class="muted">Your sentence will appear here.</span>'}</div><div class="practice-chunks" aria-label="Available chunks" lang="de">${orderedChoices(session).map(i => `<button type="button" class="practice-chunk" data-token="${i}"${record || d.tokens.includes(i) ? ' disabled' : ''}>${esc(item.tokens[i])}</button>`).join('')}</div><button class="practice-text-button" type="button" data-clear-tokens${disabled}>Clear sentence</button>`;
  if (item.type === 'write') return `<label class="practice-input-label" for="practice-response">Your message in German <span class="muted">· aim for ${item.target[0]}–${item.target[1]} words</span></label><textarea class="practice-writing" id="practice-response" lang="de" maxlength="6000" rows="8"${disabled}>
${esc(d.text)}</textarea><p class="small muted" id="practice-word-count">${wordCount(d.text)} words · a guide, not an automatic grade</p>${d.reviewed || record ? `<section class="practice-model"><h3 tabindex="-1">One possible response</h3><div lang="de">${paragraphs(item.model)}</div><p class="small muted">${esc(item.explanation)}</p><h3>${record ? 'Your self-review' : 'Review and revise your message'}</h3><p class="small muted">${record ? 'Your reviewed draft is shown above.' : 'Tick what your message covers. You can still edit your text above.'} Unticked points show what to improve next.</p>${item.checklist.map((point, i) => `<label class="practice-review-check"><input type="checkbox" data-review-point="${i}"${d.checks.includes(i) ? ' checked' : ''}${disabled}>${esc(point)}</label>`).join('')}</section>` : `<div class="practice-writing-brief"><h3>Include these points</h3><ul>${item.checklist.map(point => `<li>${esc(point)}</li>`).join('')}</ul></div>`}`;
  return `<label class="practice-input-label" for="practice-response">Your answer in German</label><input class="fill practice-fill" id="practice-response" lang="de" autocomplete="off" autocapitalize="off" spellcheck="false" maxlength="300" value="${esc(d.text)}"${disabled}><p class="small muted">You can type ä/ö/ü/ß or ae/oe/ue/ss. Capitalisation and final punctuation do not affect the score.</p>`;
}
function modelAnswer(item) {
  if (item.type === 'choice') return item.options[item.answer];
  if (item.type === 'write') return item.model;
  if (item.type === 'match') return item.pairs.map(p => `${p.left} → ${p.right}`).join('\n');
  return item.answers.join(' / ');
}
function feedback(item, record) {
  if (!record) return '';
  if (item.type === 'write' && !record.skipped) return `<div class="fb info"><b>Self-review recorded.</b> ${draft().checks.length} of ${item.checklist.length} points ticked. This is writing practice, not a language grade.</div>`;
  return `<div class="fb ${record.correct ? 'ok' : 'info'}"><p><b>${record.skipped ? 'Skipped — keep this for review.' : record.correct ? 'Richtig! Well done.' : 'Not quite — here is what to notice.'}</b>${item.type === 'match' ? ` ${record.earned}/${record.total} matches correct.` : ''}</p>${!record.correct || item.type === 'match' ? `<p class="practice-correction" lang="de">${esc(modelAnswer(item)).replace(/\n/g, '<br>')}</p>` : ''}<p>${esc(item.explanation)}</p></div>`;
}
function round() {
  if (session.finished) return completed();
  const item = activeItem(session), record = currentRecord(), count = Object.keys(session.records).length;
  return `<div class="practice-round-top"><button type="button" class="practice-text-button" data-library>← All practice sets</button><span>${session.review ? 'Mistake review' : 'First attempt'} · ${session.position + 1} of ${session.indices.length}</span></div><p id="practice-device-status" class="small muted"></p><div class="practice-round-heading"><p class="practice-eyebrow">${SKILLS[session.set.skill]} · ${esc(session.set.focus)}</p><h2>${esc(session.set.title)}</h2><p>${esc(session.set.instruction || session.set.description)}</p><progress max="${session.indices.length}" value="${count}" aria-label="Exercises completed">${count}/${session.indices.length}</progress></div>
    <div class="practice-workspace${session.set.passage || session.set.audioText ? ' has-source' : ''}">${stimulus()}<section class="practice-card" aria-label="Current exercise"><p class="practice-eyebrow">EXERCISE ${session.position + 1} · ${FORMAT[item.type]}</p><h3 class="practice-prompt" tabindex="-1" id="practice-prompt">${esc(item.prompt)}</h3>${answerControls(item, record)}${item.hint && !record ? `<details class="practice-hint"><summary>Need a hint?</summary><p>${esc(item.hint)}</p></details>` : ''}<div class="practice-feedback" aria-live="polite">${message ? `<p class="practice-validation" role="alert">${esc(message)}</p>` : ''}${feedback(item, record)}</div><div class="practice-actions">${record ? `<button class="btn" type="button" data-next>${session.position + 1 === session.indices.length ? 'See results' : 'Next exercise'}</button>` : `<button class="btn" type="button" data-check>${item.type === 'write' ? draft().reviewed ? 'Finish self-review' : 'Compare with a model' : 'Check answer'}</button><button class="btn ghost small" type="button" data-skip>Skip for now</button>`}</div></section></div>`;
}
function completed() {
  const result = summary(session);
  return `<button type="button" class="practice-text-button" data-library>← All practice sets</button><section class="practice-finish" tabindex="-1"><p class="practice-eyebrow">${session.review ? 'REVIEW COMPLETE' : 'SET COMPLETE'}</p><h2>${esc(session.set.title)}</h2><div class="practice-result-number">${result.total ? `${result.earned}<span> / ${result.total}</span>` : result.reviewed}<small>${result.total ? 'points on this attempt' : 'writing tasks self-reviewed'}</small></div><p>${result.retry.length ? 'A few things to revisit. Read the explanations below, then try those exercises again.' : 'You have worked through this set. Choose another focus when you are ready.'}</p><p class="small muted">${result.skipped} skipped${result.reviewed ? ` · ${result.reviewed} self-reviewed` : ''}. Review attempts do not replace your first-attempt result.</p><div class="practice-actions">${result.retry.length ? '<button type="button" class="btn" data-retry>Practise missed exercises</button>' : ''}<button type="button" class="btn ghost" data-restart>Repeat the whole set</button><button type="button" class="btn ghost" data-library>Choose another set</button></div></section><section class="practice-review"><h2>Your answer review</h2>${session.indices.map(index => {
    const item = session.set.items[index], r = session.records[index];
    const response = r.skipped ? 'Skipped' : item.type === 'choice' ? item.options[r.response] : item.type === 'match' ? item.pairs.map((p, i) => `${p.left} → ${item.pairs[Number(r.response[i])]?.right || '—'}`).join('\n') : r.response;
    return `<details${r.correct === false ? ' open' : ''}><summary>${esc(item.prompt)} <span>${r.skipped ? 'Skipped' : r.correct === null ? 'Self-reviewed' : `${r.earned}/${r.total}`}</span></summary><p><b>Your response</b></p><p class="practice-review-response" lang="de">${esc(response)}</p><p><b>${item.type === 'write' ? 'One possible model' : 'Answer'}</b></p><p class="practice-review-response" lang="de">${esc(modelAnswer(item))}</p><p>${esc(item.explanation)}</p></details>`;
  }).join('')}</section>`;
}
function paint(focus = '') {
  const stage = document.getElementById('practice-stage');
  if (!stage) return;
  stopAudio();
  stage.innerHTML = session ? round() : library();
  if (session) persist();
  refreshInterface(stage);
  if (focus) stage.querySelector(focus)?.focus({ preventScroll: true });
}
function captureDraft() {
  if (!session || session.finished || currentRecord()) return;
  const d = draft(), input = document.getElementById('practice-response');
  if (input) d.text = input.value;
  const chosen = document.querySelector('[name="practice-choice"]:checked');
  if (chosen) d.choice = Number(chosen.value);
  document.querySelectorAll('[data-pair]').forEach(el => { d.pairs[el.dataset.pair] = el.value; });
  d.checks = [...document.querySelectorAll('[data-review-point]:checked')].map(el => Number(el.dataset.reviewPoint));
  persist();
}

function persist(answered = false) {
  const data = progress.get(session.set.id);
  const slot = session.review ? 'review' : 'normal';
  data[slot] = session;
  data[`${slot}Updated`] = Date.now();
  if (answered) {
    const index = itemIndex(session);
    data.missed = data.missed.filter(value => value !== index);
    if (currentRecord().correct === false) data.missed.push(index);
    data.missed.sort((a, b) => a - b);
  }
  if (session.finished && !session.review) data.result = summary(session);
  savedOnDevice = savePracticeProgress(level, session, data, answered);
  const status = document.getElementById('practice-device-status');
  if (status) status.textContent = savedOnDevice ? 'Progress saved on this device' : 'Progress could not be saved on this device';
}

function updateAddress() {
  const query = new URLSearchParams();
  if (tab !== 'sets') query.set('tab', tab);
  if (session) {
    query.set('set', session.set.id);
    if (session.review) query.set('review', '1');
  }
  const suffix = query.toString();
  history.replaceState(null, '', `#/${level.id}/practice${suffix ? `?${suffix}` : ''}`);
}

function openSet(set, review = false, indices) {
  const data = progress.get(set.id);
  const saved = review ? data.review : data.normal;
  const targets = indices || data.missed;
  if (saved && !saved.finished) session = saved;
  else if (review && !targets.length) return;
  else {
    session = makeSession(set, review ? targets : undefined);
    session.review = review;
  }
  message = '';
  updateAddress();
  paint('#practice-prompt');
  document.getElementById('practice-stage')?.scrollIntoView({ block: 'start' });
}
function check() {
  if (!session || session.finished || currentRecord()) return;
  captureDraft();
  const item = activeItem(session), d = draft();
  const response = item.type === 'choice' ? d.choice : item.type === 'match' ? { ...d.pairs } : item.type === 'order' ? d.tokens.map(i => item.tokens[i]).join(' ') : d.text.trim();
  const missing = item.type === 'choice' ? response === null : item.type === 'match' ? item.pairs.some((_, i) => !Object.hasOwn(response, i) || response[i] === '') : item.type === 'order' ? d.tokens.length !== item.tokens.length : !response;
  if (missing) { message = item.type === 'match' ? 'Choose a match for every line before checking.' : item.type === 'order' ? 'Use every chunk before checking the sentence.' : 'Add your answer first, or choose Skip for now.'; paint('#practice-response, .practice-choice input, .practice-chunk, select'); return; }
  message = '';
  if (item.type === 'write' && !d.reviewed) { d.reviewed = true; paint('.practice-model h3'); return; }
  if (submit(session, response)) { persist(true); logPractice(); }
  paint('[data-next]');
}
export function render(lv) {
  level = lv; session = null; filter = 'all'; search = ''; message = ''; savedOnDevice = true;
  progress = new Map(sets().map(set => [set.id, practiceProgress(level, set)]));
  const params = new URLSearchParams(location.hash.split('?')[1] || '');
  tab = tabs.some(([id]) => id === params.get('tab')) ? params.get('tab') : 'sets';
  const selectedId = params.get('set');
  const selected = sets().find(set => set.id === selectedId);
  if (selected) {
    const data = progress.get(selected.id);
    session = params.has('review') ? data.review : data.normal || makeSession(selected);
  }
  return `${header()}<div id="practice-stage">${session ? round() : library()}</div>`;
}
export function onClick(e, button) {
  if (!button) return;
  const data = button.dataset;
  if (data.practiceTab) { tab = data.practiceTab; updateAddress(); paint(`[data-practice-tab="${tab}"]`); return; }
  if (data.filter !== undefined) { filter = data.filter; paint(`[data-filter="${filter}"]`); return; }
  if (data.clearSearch !== undefined) { search = ''; filter = 'all'; paint('#practice-search'); return; }
  if (data.set) {
    const selected = sets().find(s => s.id === data.set);
    if (!selected) return;
    openSet(selected, data.missed !== undefined);
    return;
  }
  if (!session) return;
  if (data.library !== undefined) { captureDraft(); session = null; message = ''; updateAddress(); paint('[data-practice-tab][aria-pressed="true"]'); return; }
  if (data.restart !== undefined || data.retry !== undefined) {
    openSet(session.set, data.retry !== undefined, summary(session).retry);
    return;
  }
  if (session.finished) return;
  if (data.next !== undefined) {
    if (!advance(session)) return;
    message = ''; paint(session.finished ? '.practice-finish' : '#practice-prompt'); return;
  }
  if (currentRecord()) return;
  if (data.check !== undefined) { check(); return; }
  if (data.skip !== undefined) { captureDraft(); submit(session, '', { skipped: true }); persist(true); message = ''; paint('[data-next]'); return; }
  if (data.token !== undefined || data.removeToken !== undefined || data.clearTokens !== undefined) {
    const d = draft();
    if (data.token !== undefined && !d.tokens.includes(Number(data.token))) d.tokens.push(Number(data.token));
    if (data.removeToken !== undefined) d.tokens.splice(Number(data.removeToken), 1);
    if (data.clearTokens !== undefined) d.tokens = [];
    message = ''; paint('.practice-chunks button:not(:disabled), [data-check]');
  }
}
export function onKeydown(e) {
  if (e.key === 'Enter' && e.target.id === 'practice-response' && e.target.tagName !== 'TEXTAREA') { e.preventDefault(); check(); }
}
export function onChange() { captureDraft(); }
function onInput(e) {
  if (e.target.id === 'practice-search') {
    const position = e.target.selectionStart; search = e.target.value; paint('#practice-search');
    try { document.getElementById('practice-search')?.setSelectionRange(position, position); } catch {}
  } else if (e.target.id === 'practice-response') {
    captureDraft(); const count = document.getElementById('practice-word-count');
    if (count) count.textContent = `${wordCount(e.target.value)} words · a guide, not an automatic grade`;
  }
}
export function mount(lv, { sameKind } = {}) {
  level = lv; document.addEventListener('input', onInput);
  if (session) persist();
  if (!motionOK()) return;
  if (sameKind) enter('.page-head h1, .practice-overview', { y: 8, duration: 0.42 });
  else splitReveal(document.querySelector('.page-head h1'), { duration: 0.62 });
}
export function unmount() { document.removeEventListener('input', onInput); stopAudio(); }
export const updatesInPlace = true;
