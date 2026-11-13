export const samples = {
  word: { label: 'Single word', lines: [{ lang: 'de', text: 'der Schlüssel' }] },
  sentence: { label: 'Lesson phrase', lines: [{ lang: 'de', text: 'Wie schreibt man Ihren Namen?' }] },
  vowels: { label: 'Pronunciation', lines: [{ lang: 'de', text: 'Miete. Mitte. Stadt. Staat.' }] },
  dialogue: { label: 'At a café', lines: [
    { lang: 'de', text: 'Guten Tag. Was möchten Sie?' },
    { lang: 'de', text: 'Ich möchte einen Kaffee und ein Brötchen.' },
  ] },
  english: { label: 'English explanation', lines: [{ lang: 'en', text: 'Use the polite form when you speak to someone you don’t know.' }] },
};

export const cloudVoices = {
  seraphina: { name: 'Seraphina', id: 'de-DE-SeraphinaMultilingualNeural' },
  florian: { name: 'Florian', id: 'de-DE-FlorianMultilingualNeural' },
  conrad: { name: 'Conrad', id: 'de-DE-ConradNeural' },
};

export { GERMAN_VOICES as pocketVoices } from './german-voices.js';
