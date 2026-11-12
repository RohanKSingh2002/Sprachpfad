// German audio. Every German line on the site is recorded as an MP3 in audio/ by a natural German
// voice (made with tools/make_audio.py), so it sounds the same in every browser, even offline.
// Lines without recordings use a browser voice in the requested language.

import { esc } from "../utils.js";
import { AUDIO_SPEED_RANGE, audioPlaybackSpeed, setSentencePreferences } from "../state.js";
import { SPEAKER_ICON } from "./icons.js";
import { toast } from "./toast.js";

const AUDIO_DIR = new URL("../../audio/", import.meta.url);

/** File name of a line's recording: the cyrb53 hash of the text in base 36 (as in tools/make_audio.py). */
export function clipId(text) {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < text.length; i++) {
    const ch = text.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}

let clips = null; // ids of the recorded lines (audio/index.json); null while it loads

async function loadClips() {
  try {
    const res = await fetch(new URL("index.json", AUDIO_DIR));
    clips = new Set(res.ok ? (await res.json()).clips : []);
  } catch (e) {
    clips = new Set();
  }
}

/* ---------- the browser's own voice, only as a fallback ---------- */

// The most natural voices browsers offer, best first
const NATURAL = [
  [/natural|neural/i, 40], // Microsoft Edge's online voices
  [/premium|enhanced/i, 30], // Apple's downloadable voices
  [/google/i, 25], // Chrome's online voice
];

/** Prefer a natural browser voice in the requested language. */
function voiceScore(v, language) {
  if (v.lang.toLowerCase().split(/[-_]/)[0] !== language) return -1;
  const bonus = NATURAL.find(([pattern]) => pattern.test(v.name))?.[1] || 0;
  return (/^(de[-_]DE|en[-_]US)$/i.test(v.lang) ? 10 : 5) + bonus;
}

function pickVoice(language) {
  let best = null;
  for (const v of speechSynthesis.getVoices()) {
    if (voiceScore(v, language) >= 0 && (!best || voiceScore(v, language) > voiceScore(best, language))) best = v;
  }
  return best;
}

export function audioVoices(language = "de") {
  return globalThis.speechSynthesis?.getVoices().filter(voice => voiceScore(voice, language) >= 0) || [];
}

/** Voices load asynchronously in some browsers: wait for them briefly the first time. */
function voicesReady() {
  if (speechSynthesis.getVoices().length) return Promise.resolve();
  return new Promise((done) => {
    const finish = () => {
      speechSynthesis.removeEventListener?.("voiceschanged", finish);
      done();
    };
    speechSynthesis.addEventListener?.("voiceschanged", finish);
    setTimeout(finish, 1500);
  });
}

async function speakWithVoice(text, button, request, rate, language, voiceURI) {
  if (!("speechSynthesis" in window)) {
    toast("Audio isn't available in this browser.");
    return false;
  }
  await voicesReady();
  if (request !== playbackRequest) return false;
  const voice = audioVoices(language).find(voice => voice.voiceURI === voiceURI) || pickVoice(language);
  if (!voice) {
    toast(`No ${new Intl.DisplayNames(["en"], { type: "language" }).of(language)} voice is available in this browser.`);
    return false;
  }
  const u = new SpeechSynthesisUtterance(text);
  u.voice = voice;
  u.lang = voice.lang;
  u.rate = rate;
  u.onstart = () => { if (request === playbackRequest) markPlaying(button); };
  u.onend = () => finish(request, true);
  u.onerror = () => finish(request, false);
  speechSynthesis.speak(u);
  return true;
}

/* ---------- playing recordings ---------- */

// One audio element, reused: phones only let a page play sound on an element a tap has started.
const player = new Audio();
let playing = null; // button showing the "playing" ring
let playbackRequest = 0;
let completion = null;
let recording = 0;

function finish(request, played) {
  if (request !== playbackRequest) return;
  recording = 0;
  markPlaying(null);
  const notify = completion;
  completion = null;
  notify?.(played);
}

function markPlaying(button) {
  playing?.classList.remove("is-playing");
  playing = button;
  button?.classList.add("is-playing");
}

function stop() {
  recording = 0;
  const notify = completion;
  completion = null;
  notify?.(false);
  if (!player.paused) player.pause();
  if ("speechSynthesis" in window) speechSynthesis.cancel();
  markPlaying(null);
}

/** Cancel the current recording and any pending voice fallback when a practice exercise changes. */
export function stopAudio() {
  playbackRequest++;
  stop();
}

export function initAudio() {
  loadClips();
  if ("speechSynthesis" in window) speechSynthesis.getVoices();
  player.addEventListener("ended", () => {
    if (recording && player.ended) finish(recording, true);
  });
  player.addEventListener("error", () => {
    if (recording && player.error) finish(recording, false);
  });
  document.addEventListener("input", onSpeedControl);
  document.addEventListener("change", onSpeedControl);
}

export function audioSpeedControl(id, label = "Playback speed") {
  const speed = audioPlaybackSpeed();
  const { min, max, step } = AUDIO_SPEED_RANGE;
  return `<label class="audio-speed-control"><span>${esc(label)} <output for="${esc(id)}">${speed}×</output></span>
    <input type="range" id="${esc(id)}" data-audio-speed min="${min}" max="${max}" step="${step}" value="${speed}" aria-valuetext="${speed} times normal"></label>`;
}

function onSpeedControl(event) {
  const control = event.target;
  if (!control.matches?.("[data-audio-speed]")) return;
  let speed = control.valueAsNumber;
  if (event.type === "change") {
    speed = applySpeed(speed);
    control.value = speed;
  }
  control.closest("label").querySelector("output").textContent = `${speed}×`;
  control.setAttribute("aria-valuetext", `${speed} times normal`);
}

function applySpeed(speed) {
  if (speed !== audioPlaybackSpeed()) setSentencePreferences({ speed });
  const saved = audioPlaybackSpeed();
  if (!player.paused) player.playbackRate = saved;
  document.querySelectorAll?.("[data-current-audio-speed]").forEach(element => { element.textContent = `${saved}×`; });
  return saved;
}

export function resetAudioSpeed() {
  applySpeed(1);
  document.querySelectorAll("[data-audio-speed]").forEach(control => {
    control.value = 1;
    onSpeedControl({ target: control, type: "input" });
  });
}

const MEDIA_ACTIONS = ["play", "pause", "stop", "nexttrack", "previoustrack"];
export function setMediaControls(track = null, controls = {}) {
  const media = navigator.mediaSession;
  if (!media) return;
  if (typeof MediaMetadata === "function") media.metadata = track ? new MediaMetadata(track) : null;
  media.playbackState = track ? "playing" : "none";
  for (const action of MEDIA_ACTIONS) {
    try { media.setActionHandler(action, controls[action] || null); }
    catch { /* The device may expose only some actions. */ }
  }
}

/** Read German text aloud; the button that asked (if any) shows a pulsing ring while it plays. */
export async function speak(text, button = null, { language = "de", voice, onFinish } = {}) {
  if (!text || !text.trim()) return false;
  const request = ++playbackRequest;
  stop();
  completion = onFinish;
  const rate = audioPlaybackSpeed();
  const id = clipId(text);
  if (language !== "de" || voice || (clips && !clips.has(id))) return speakWithVoice(text, button, request, rate, language, voice);
  markPlaying(button);
  player.src = new URL(`${id}.mp3`, AUDIO_DIR).href;
  player.playbackRate = rate;
  try {
    await player.play();
    if (request !== playbackRequest) return false;
    recording = request;
    return true;
  } catch (err) {
    if (err.name === "AbortError" || request !== playbackRequest) return false; // another line started
    // the recording is missing or can't be played here: use the browser's German voice instead
    if (playing === button) markPlaying(null);
    return speakWithVoice(text, button, request, rate, language, voice);
  }
}

/** Resolve after the line ends, or with false if playback fails or is stopped. */
export function playAudioLine(text, button, options) {
  return new Promise(resolve => {
    speak(text, button, { ...options, onFinish: resolve }).then(started => {
      if (!started) resolve(false);
    }, () => resolve(false));
  });
}

/** Round speaker button; any button with data-say is played by the click handler in main.js. */
export const speakerButton = (text, label = `Play audio: ${text}`, voice) =>
  `<button class="spk" type="button" data-say="${esc(text)}"${voice ? ` data-voice="${esc(voice)}"` : ""} aria-label="${esc(label)}">${SPEAKER_ICON}</button>`;
