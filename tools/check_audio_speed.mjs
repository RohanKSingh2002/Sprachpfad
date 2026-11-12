// Exercise the shared slider, recorded playback and browser speech with fake media devices.
import assert from "node:assert/strict";

const listeners = new Map();
const output = {};
let player, utterance;
globalThis.document = { addEventListener: (type, listener) => listeners.set(type, listener) };
globalThis.Audio = class {
  paused = true;
  constructor() { player = this; }
  addEventListener() {}
  async play() { this.paused = false; }
  pause() { this.paused = true; }
};
globalThis.SpeechSynthesisUtterance = class {};
globalThis.speechSynthesis = {
  getVoices: () => [{ lang: "en-US", name: "Test voice" }],
  speak: value => { utterance = value; },
  cancel() {},
};
globalThis.window = { speechSynthesis };

const state = await import("../js/state.js");
const { audioSpeedControl, clipId, initAudio, speak } = await import("../js/ui/audio.js");
const recorded = "Guten Morgen.";
globalThis.fetch = async () => ({ ok: true, json: async () => ({ clips: [clipId(recorded)] }) });

let saved;
const save = value => { saved = value; };
state.initState({ value: { review: {}, sentencePreferences: { speed: 1.25 } }, onSave: save });
initAudio();
assert.match(audioSpeedControl("settings-playback-speed"), /value="1.25"/);
assert.equal(await speak(recorded), true);
assert.equal(player.playbackRate, 1.25);

const target = {
  valueAsNumber: 0.75,
  matches: selector => selector === "[data-audio-speed]",
  closest: () => ({ querySelector: () => output }),
  setAttribute: (_name, value) => { target.accessibleSpeed = value; },
};
listeners.get("input")({ type: "input", target });
assert.equal(output.textContent, "0.75×");
assert.equal(state.audioPlaybackSpeed(), 1.25);
listeners.get("change")({ type: "change", target });
assert.equal(saved.sentencePreferences.speed, 0.75);
assert.equal(target.accessibleSpeed, "0.75 times normal");
assert.equal(player.playbackRate, 0.75);

state.initState({ value: saved, onSave: save });
assert.match(audioSpeedControl("sentence-playback-speed", "Speed"), /value="0.75"/);
assert.equal(await speak("Good morning.", null, { language: "en" }), true);
assert.equal(utterance.rate, 0.75);
target.valueAsNumber = 1.5;
listeners.get("change")({ type: "change", target });
assert.match(audioSpeedControl("settings-playback-speed"), /value="1.5"/);
assert.equal(await speak(recorded), true);
assert.equal(player.playbackRate, 1.5);
console.log("Playback speed persists across both controls and applies to recordings and browser voices.");
