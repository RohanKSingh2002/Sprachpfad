// German audio. Every German line on the site is recorded as an MP3 in audio/ by a natural German
// voice (made with tools/make_audio.py), so it sounds the same in every browser, even offline.
// A line without a recording falls back to the browser's best German voice, never an English one.

import { esc } from "../utils.js";
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

let germanVoice = null;

// The most natural voices browsers offer, best first
const NATURAL = [
  [/natural|neural/i, 40], // Microsoft Edge's online voices
  [/premium|enhanced/i, 30], // Apple's downloadable voices
  [/google/i, 25], // Chrome's online voice
];

/** Prefer the most natural German voice the browser has; anything that isn't German scores -1. */
function voiceScore(v) {
  if (!/^de([-_]|$)/i.test(v.lang)) return -1;
  const bonus = NATURAL.find(([pattern]) => pattern.test(v.name))?.[1] || 0;
  return (/^de[-_]DE/i.test(v.lang) ? 10 : 5) + bonus;
}

function pickVoice() {
  let best = null;
  for (const v of speechSynthesis.getVoices()) {
    if (voiceScore(v) >= 0 && (!best || voiceScore(v) > voiceScore(best))) best = v;
  }
  germanVoice = best;
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

async function speakWithVoice(text, button, request) {
  if (!("speechSynthesis" in window)) {
    toast("Audio isn't available in this browser.");
    return false;
  }
  await voicesReady();
  if (request !== playbackRequest) return false;
  pickVoice();
  if (!germanVoice) {
    toast("No German voice for this line in this browser. Add German in your system's speech settings.");
    return false;
  }
  const u = new SpeechSynthesisUtterance(text);
  u.voice = germanVoice;
  u.lang = germanVoice.lang;
  u.rate = 0.9;
  u.onstart = () => markPlaying(button);
  u.onend = u.onerror = () => {
    if (playing === button) markPlaying(null);
  };
  speechSynthesis.speak(u);
  return true;
}

/* ---------- playing recordings ---------- */

// One audio element, reused: phones only let a page play sound on an element a tap has started.
const player = new Audio();
let owner = null; // button whose recording is in the player
let playing = null; // button showing the "playing" ring
let playbackRequest = 0;

function markPlaying(button) {
  playing?.classList.remove("is-playing");
  playing = button;
  button?.classList.add("is-playing");
}

function stop() {
  if (!player.paused) player.pause();
  if ("speechSynthesis" in window) speechSynthesis.cancel();
  markPlaying(null);
}

export function initAudio() {
  loadClips();
  if ("speechSynthesis" in window) {
    pickVoice();
    speechSynthesis.onvoiceschanged = pickVoice;
  }
  player.addEventListener("ended", () => {
    if (playing === owner) markPlaying(null);
  });
}

/** Read German text aloud; the button that asked (if any) shows a pulsing ring while it plays. */
export async function speak(text, button = null) {
  if (!text || !text.trim()) return false;
  stop();
  const request = ++playbackRequest;
  const id = clipId(text);
  if (clips && !clips.has(id)) {
    return speakWithVoice(text, button, request);
  }
  owner = button;
  markPlaying(button);
  player.src = new URL(`${id}.mp3`, AUDIO_DIR).href;
  try {
    await player.play();
    return true;
  } catch (err) {
    if (err.name === "AbortError" || owner !== button) return false; // another line started
    // the recording is missing or can't be played here: use the browser's German voice instead
    if (playing === button) markPlaying(null);
    return speakWithVoice(text, button, request);
  }
}

/** Round speaker button; any button with data-say is played by the click handler in main.js. */
export const speakerButton = (text, label = `Play audio: ${text}`) =>
  `<button class="spk" type="button" data-say="${esc(text)}" aria-label="${esc(label)}">${SPEAKER_ICON}</button>`;
