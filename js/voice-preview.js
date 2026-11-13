import { cloudVoices, pocketVoices, samples } from './voice-preview-samples.js';

const source = document.getElementById('source');
const voiceA = document.getElementById('voice-a');
const voiceB = document.getElementById('voice-b');
const rate = document.getElementById('rate');
const stopButton = document.getElementById('stop');
const status = document.getElementById('status');
const synth = window.speechSynthesis;
const audio = new Audio();
let active;

const rankedVoices = lang => (synth?.getVoices() || [])
  .filter(voice => voice.lang.toLowerCase().split(/[-_]/)[0] === lang)
  .sort((a, b) => priority(b, lang) - priority(a, lang) || a.name.localeCompare(b.name));

function priority(voice, lang) {
  return Number(/natural|neural|premium|enhanced/i.test(voice.name)) * 4 +
    Number(voice.lang.toLowerCase().replace('_', '-') === (lang === 'de' ? 'de-de' : 'en-us')) * 2 + Number(voice.default);
}

const buttons = new Map();
for (const [id, sample] of Object.entries(samples)) {
  const row = document.createElement('div');
  row.className = 'sample';
  const copy = document.createElement('div');
  const label = document.createElement('small');
  label.textContent = sample.label;
  copy.append(label);
  const list = sample.lines.length > 1 ? copy.appendChild(document.createElement('ol')) : copy;
  for (const line of sample.lines) {
    const text = list.appendChild(document.createElement(list === copy ? 'p' : 'li'));
    text.lang = line.lang;
    text.textContent = line.text;
  }
  const button = document.createElement('button');
  button.type = 'button';
  button.dataset.sample = id;
  button.textContent = 'Play';
  button.setAttribute('aria-label', `Play ${sample.label}`);
  button.disabled = true;
  button.addEventListener('click', () => play(id));
  buttons.set(id, button);
  row.append(copy, button);
  document.getElementById('samples').append(row);
}

function refreshVoices() {
  const cloud = source.value === 'cloud';
  const pocket = source.value === 'pocket';
  const choices = cloud ? Object.entries(cloudVoices).map(([id, voice]) => [id, voice.name]) :
    pocket ? Object.entries(pocketVoices) : rankedVoices('de').map(voice => [voice.voiceURI, `${voice.name} (${voice.lang})`]);
  for (const [index, select] of [voiceA, voiceB].entries()) {
    const value = select.value;
    select.replaceChildren(...choices.map(([id, label]) => new Option(label, id)));
    select.value = choices.some(([id]) => id === value) ? value : choices[Math.min(index, choices.length - 1)]?.[0] ?? '';
    select.disabled = !choices.length;
  }
  for (const [id, button] of buttons) {
    button.disabled = id === 'english' ? (cloud ? voiceA.value === 'conrad' : !rankedVoices('en').length) : !choices.length;
  }
  if (!active) status.textContent = choices.length ? 'Choose a voice and press Play.' : 'No German browser voice is available here. Try the gallery below.';
  document.getElementById('source-note').textContent = cloud ? 'Seraphina and Florian also read the English sample.' :
    pocket ? 'German speech is generated on this computer. The English sample uses an available English browser voice.' :
      'Browser voices vary by device. The English sample uses an available English browser voice.';
}

function stop(message) {
  const previous = active;
  active = null;
  previous?.controller.abort();
  synth?.cancel();
  audio.onended = audio.onerror = null;
  audio.pause();
  audio.removeAttribute('src');
  if (previous?.url) URL.revokeObjectURL(previous.url);
  stopButton.disabled = true;
  status.textContent = message;
}

async function play(id) {
  const sample = samples[id];
  stop(`Preparing ${sample.label.toLowerCase()}…`);
  const request = { controller: new AbortController() };
  active = request;
  stopButton.disabled = false;
  const cloud = source.value === 'cloud';
  const pocket = source.value === 'pocket' && id !== 'english';
  const speed = Number(rate.value);
  const onEnd = () => { if (active === request) stop('Playback complete.'); };
  const onError = () => { if (active === request) stop('This voice could not play. Try another voice or replay the sample.'); };
  if (cloud || pocket) {
    const voices = [voiceA.value, voiceB.value];
    const playLine = async index => {
      if (active !== request) return;
      const response = await fetch(pocket ? '/api/pocket-preview' : '/api/voice-preview', {
        method: 'POST', signal: request.controller.signal, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pocket ? { id, index, voice: voices[index] } : { id, first: voices[0], second: voices[1], speed }),
      });
      if (!response.ok || !response.headers.get('Content-Type')?.startsWith('audio/')) throw new Error('Audio unavailable');
      const blob = await response.blob();
      if (active !== request) return;
      if (request.url) URL.revokeObjectURL(request.url);
      request.url = URL.createObjectURL(blob);
      audio.onended = pocket && index + 1 < sample.lines.length ? () => void playLine(index + 1).catch(onError) : onEnd;
      audio.onerror = onError;
      audio.src = request.url;
      audio.playbackRate = pocket ? Number(rate.value) : 1;
      await audio.play();
      if (active === request) status.textContent = `Playing ${sample.label.toLowerCase()}.`;
    };
    try {
      await playLine(0);
    } catch { onError(); }
    return;
  }

  const german = rankedVoices('de');
  const chosen = [voiceA.value, voiceB.value].map(id => german.find(voice => voice.voiceURI === id));
  const speak = index => {
    if (active !== request) return;
    const line = sample.lines[index];
    const voice = line.lang === 'en' ? rankedVoices('en')[0] : chosen[index];
    if (!voice) { onError(); return; }
    const utterance = new SpeechSynthesisUtterance(line.text);
    utterance.voice = voice;
    utterance.lang = voice.lang;
    utterance.rate = speed;
    utterance.onstart = () => { if (active === request) status.textContent = `Playing ${sample.label.toLowerCase()}.`; };
    utterance.onend = () => index + 1 < sample.lines.length ? speak(index + 1) : onEnd();
    utterance.onerror = onError;
    request.utterance = utterance;
    synth.speak(utterance);
  };
  speak(0);
}

stopButton.addEventListener('click', () => stop('Playback stopped.'));
source.addEventListener('change', () => { if (active) stop('Playback stopped.'); refreshVoices(); });
for (const select of [voiceA, voiceB]) select.addEventListener('change', () => {
  if (active) stop('Playback stopped.');
  refreshVoices();
});
rate.addEventListener('change', () => {
  if (active && source.value === 'pocket' && audio.hasAttribute('src')) audio.playbackRate = Number(rate.value);
  else if (active) stop('Speed updated. Press Play to hear it.');
});
synth?.addEventListener('voiceschanged', refreshVoices);
window.addEventListener('pagehide', () => { if (active) stop('Playback stopped.'); });
refreshVoices();
if (['localhost', '127.0.0.1'].includes(location.hostname)) {
  fetch('/api/voice-preview').then(response => response.json()).then(config => {
    for (const id of ['pocket', 'cloud']) {
      const option = source.querySelector(`option[value="${id}"]`);
      option.hidden = option.disabled = config[id] !== true;
    }
    if (!active && (config.pocket || (voiceA.disabled && config.cloud))) source.value = config.pocket ? 'pocket' : 'cloud';
    refreshVoices();
  }).catch(() => {});
}
