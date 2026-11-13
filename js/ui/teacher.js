import { speak, stopAudio } from './audio.js';

const endpoint = new URL('../../api/teacher', import.meta.url);

export function initTeacher(getPage) {
  const root = document.getElementById('teacher');
  const find = selector => root.querySelector(selector);
  const toggle = find('[data-teacher-open]'), panel = find('.teacher-panel');
  const input = find('textarea'), send = find('[type="submit"]'), mic = find('[data-teacher-mic]');
  const scope = find('select'), context = find('.teacher-context');
  const messages = find('.teacher-messages'), status = find('.teacher-status');
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const dictation = find('[data-teacher-dictation]');
  const history = [];
  let request, recognition, speechButton, selectedPage, available = false;
  mic.hidden = !Recognition;
  dictation.closest('label').hidden = !Recognition;

  function stopVoice() {
    if (!speechButton) return;
    stopAudio();
    speechButton.textContent = 'Read aloud';
    speechButton = undefined;
  }

  function updatePage() {
    selectedPage = available ? getPage() : null;
    root.hidden = !selectedPage;
    if (!selectedPage) {
      request?.abort();
      close();
      history.length = 0;
      messages.replaceChildren();
      input.value = status.textContent = '';
      return;
    }
    const locked = selectedPage.mode === 'locked';
    context.textContent = locked ? 'Teacher help resumes when you finish the rehearsal.' :
      scope.value === 'general' ? 'General German help' : selectedPage.label;
    if (locked) { request?.abort(); stopVoice(); recognition?.abort(); }
    input.disabled = scope.disabled = dictation.disabled = locked;
    send.disabled = locked || Boolean(request);
    mic.disabled = locked;
  }

  function close() {
    panel.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
    recognition?.abort();
    stopVoice();
  }

  function append(role, text, label = '') {
    const item = document.createElement('article');
    item.className = `teacher-message teacher-${role}`;
    const meta = document.createElement('strong');
    meta.textContent = role === 'user' ? 'You' : label ? `Teacher · ${label}` : 'Teacher';
    const copy = document.createElement('p');
    copy.textContent = text;
    item.append(meta, copy);
    if (role === 'assistant') {
      const read = document.createElement('button');
      read.className = 'link-btn';
      read.type = 'button';
      read.textContent = 'Read aloud';
      read.addEventListener('click', async () => {
        updatePage();
        if (!selectedPage || selectedPage.mode === 'locked') return;
        const wasPlaying = speechButton === read;
        stopVoice();
        if (wasPlaying) return;
        speechButton = read;
        read.textContent = 'Stop reading';
        const reset = () => {
          if (speechButton !== read) return;
          speechButton = undefined;
          read.textContent = 'Read aloud';
        };
        const lang = item.dataset.language || 'en';
        const started = await speak(text, read, { language: lang, onFinish: reset });
        if (!started) reset();
      });
      item.append(read);
    }
    messages.append(item);
    messages.scrollTop = messages.scrollHeight;
    return item;
  }

  toggle.addEventListener('click', () => {
    if (!panel.hidden) { close(); return; }
    updatePage();
    panel.hidden = false;
    toggle.setAttribute('aria-expanded', 'true');
    (input.disabled ? find('[data-teacher-close]') : input).focus();
  });
  find('[data-teacher-close]').addEventListener('click', () => { close(); toggle.focus(); });
  root.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !panel.hidden) { event.stopPropagation(); close(); toggle.focus(); }
  });
  scope.addEventListener('change', updatePage);
  document.addEventListener('teacherpagechange', updatePage);
  // The active exercise or card can change without a route transition.
  const app = document.getElementById('app');
  new MutationObserver(() => { if (!panel.hidden) updatePage(); }).observe(app, { subtree: true, childList: true, attributes: true, attributeFilter: ['hidden'] });

  mic.addEventListener('click', () => {
    updatePage();
    if (mic.disabled) return;
    if (recognition) { recognition.stop(); return; }
    const recording = recognition = new Recognition();
    recording.lang = dictation.value;
    recording.onresult = event => {
      if (recognition !== recording || input.disabled) return;
      input.value = `${input.value} ${event.results[0][0].transcript}`.trim().slice(0, input.maxLength);
      input.focus();
    };
    recording.onerror = () => { status.textContent = 'Microphone transcription was unavailable. You can type your question.'; };
    recording.onend = () => { if (recognition === recording) { recognition = undefined; mic.textContent = 'Dictate'; } };
    try { recording.start(); mic.textContent = 'Stop dictation'; } catch { recording.onend(); }
  });

  find('form').addEventListener('submit', async event => {
    event.preventDefault();
    updatePage();
    const question = input.value.trim();
    if (!question || request || !selectedPage || selectedPage.mode === 'locked') return;
    recognition?.abort();
    const general = scope.value === 'general';
    const page = general ? { label: 'General German', level: selectedPage.level, mode: selectedPage.mode, text: '' } : selectedPage;
    const controller = request = new AbortController();
    const message = append('user', question);
    input.value = '';
    send.disabled = true;
    status.textContent = 'Teacher is thinking…';
    try {
      const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, page: { ...page, label: page.label.slice(0, 180), text: page.text.slice(0, 2800) },
          history: history.slice(-6).map(turn => ({ ...turn, content: turn.content.slice(0, 700) })) }),
        signal: AbortSignal.any([controller.signal, AbortSignal.timeout(60000)]) });
      if (!response.ok) throw new Error('Teacher unavailable');
      const { answer, language } = await response.json();
      if (controller.signal.aborted) { message.remove(); return; }
      if (typeof answer !== 'string' || !answer.trim()) throw new Error('Empty teacher answer');
      append('assistant', answer, page.label).dataset.language = language === 'de' ? 'de' : 'en';
      history.push({ role: 'user', content: question }, { role: 'assistant', content: answer });
      if (history.length > 12) history.splice(0, 2);
      status.textContent = '';
    } catch {
      message.remove();
      if (controller.signal.aborted) return;
      if (!input.value) input.value = question;
      status.textContent = 'The teacher is unavailable. Your question is still here so you can try again.';
    } finally {
      request = undefined;
      if (controller.signal.aborted) status.textContent = '';
      updatePage();
    }
  });
  updatePage();
  if (/^https?:$/.test(endpoint.protocol)) void fetch(endpoint, { cache: 'no-store', signal: AbortSignal.timeout(3000) })
    .then(async response => { available = response.ok && (await response.json()).available === true; updatePage(); }).catch(() => {});
}
