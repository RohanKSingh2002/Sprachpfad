// Run with node tools/preview_voice.mjs [port] [--app].
// Set SPRACHPFAD_POCKET_PORT to a local Pocket TTS server for live German.
// Optional Azure Speech credentials are read from SPEECH_KEY and SPEECH_REGION.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { cloudVoices, pocketVoices, samples } from '../js/voice-preview-samples.js';
import { answerTeacher } from './teacher_service.mjs';

const host = '127.0.0.1';
const port = Number(process.argv.slice(2).find(arg => arg !== '--app') || 8766);
const origin = `http://${host}:${port}`;
const { SPEECH_KEY, SPEECH_REGION } = process.env;
const cloud = Boolean(SPEECH_KEY && /^[a-z0-9]+$/.test(SPEECH_REGION || ''));
const pocketPort = Number(process.env.SPRACHPFAD_POCKET_PORT);
const pocket = Number.isInteger(pocketPort) && pocketPort > 0 && pocketPort <= 65535;
const pocketBase = `http://${host}:${pocketPort}`;
const app = process.argv.includes('--app');
const teacherPort = Number(process.env.SPRACHPFAD_TEACHER_PORT);
const teacherEnabled = Number.isInteger(teacherPort) && teacherPort > 0 && teacherPort <= 65535;
const staticTypes = { html: 'text/html', css: 'text/css', js: 'text/javascript', json: 'application/json', svg: 'image/svg+xml', mp3: 'audio/mpeg', webmanifest: 'application/manifest+json' };
const assets = new Map(await Promise.all([
  ['/voice-preview.html', 'text/html; charset=utf-8'],
  ['/js/voice-preview.js', 'text/javascript; charset=utf-8'],
  ['/js/voice-preview-samples.js', 'text/javascript; charset=utf-8'],
  ['/js/german-voices.js', 'text/javascript; charset=utf-8'],
].map(async ([path, type]) => [path, { type, body: await readFile(new URL(`..${path}`, import.meta.url)) }])));

const xml = text => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

function reply(response, status, body, type = 'text/plain; charset=utf-8') {
  response.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  response.end(body);
}

async function synthesize(text, voice, signal) {
  const form = new FormData();
  form.set('text', text);
  form.set('voice_url', voice);
  const result = await fetch(`${pocketBase}/tts`, { method: 'POST', body: form, signal });
  if (!result.ok) throw new Error('Speech generation failed');
  return Buffer.from(await result.arrayBuffer());
}

function joinSpeech(clips) {
  // Pocket TTS emits a standard 44-byte WAV header followed by 24 kHz mono PCM.
  const header = Buffer.from(clips[0].subarray(0, 44));
  const silence = Buffer.alloc(9600);
  const samples = clips.flatMap((clip, index) => {
    if (clip.length < 44 || !clip.subarray(8, 36).equals(header.subarray(8, 36)) ||
        clip.toString('ascii', 36, 40) !== 'data' || (clip.length - 44) % 2 !== 0) throw new Error('Unexpected speech format');
    return index ? [silence, clip.subarray(44)] : [clip.subarray(44)];
  });
  const dataLength = samples.reduce((sum, part) => sum + part.length, 0);
  header.writeUInt32LE(dataLength + 36, 4);
  header.writeUInt32LE(dataLength, 40);
  return Buffer.concat([header, ...samples]);
}

createServer(async (request, response) => {
  if (request.headers.host !== `${host}:${port}` && request.headers.host !== `localhost:${port}`) {
    reply(response, 403, 'Use the local preview address.');
    return;
  }
  const requested = request.url.split('?')[0];
  const path = requested === '/' ? (app ? '/index.html' : '/voice-preview.html') : requested;
  const asset = assets.get(path);
  if (request.method === 'GET' && asset) { reply(response, 200, asset.body, asset.type); return; }
  if (app && request.method === 'GET' && /^\/(?:[a-zA-Z0-9_-]+\.(?:html|svg|webmanifest|js)|(?:js|css|data|audio)\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_.-]+\.(?:css|js|json|mp3|svg))$/.test(path)) {
    const body = await readFile(new URL(`..${path}`, import.meta.url)).catch(() => null);
    if (body) { reply(response, 200, body, staticTypes[path.split('.').at(-1)]); return; }
  }
  const live = app && path === '/api/german-speech';
  const teacher = app && path === '/api/teacher';
  const local = path === '/api/pocket-preview';
  if (!teacher && !live && !local && path !== '/api/voice-preview') { reply(response, 404, 'Page not found.'); return; }
  if (teacher && request.method === 'GET') {
    reply(response, 200, JSON.stringify({ available: teacherEnabled }), 'application/json');
    return;
  }
  if (!teacher && !local && request.method === 'GET') {
    const ready = pocket && await fetch(`${pocketBase}/health`, { signal: AbortSignal.timeout(1000) }).then(res => res.ok).catch(() => false);
    reply(response, 200, JSON.stringify(live ? { available: ready } : { cloud, pocket: ready }), 'application/json');
    return;
  }
  if (request.method !== 'POST' || ![origin, `http://localhost:${port}`].includes(request.headers.origin) ||
      request.headers['content-type'] !== 'application/json') {
    reply(response, 403, 'Open the local preview to play a sample.');
    return;
  }
  if (!(teacher ? teacherEnabled : local || live ? pocket : cloud)) { reply(response, 503, 'This service is not configured.'); return; }
  const controller = new AbortController();
  response.on('close', () => controller.abort());
  try {
    let input = '';
    for await (const chunk of request) {
      input += chunk;
      if (input.length > (teacher ? 12000 : live ? 8192 : 512)) { reply(response, 413, 'Request too large.'); return; }
    }
    let settings;
    try { settings = JSON.parse(input); } catch { reply(response, 400, 'Invalid request.'); return; }
    const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(teacher ? 55000 : 20000)]);
    if (teacher) {
      const result = await answerTeacher(settings, teacherPort, signal);
      reply(response, result.status, JSON.stringify(result.body), 'application/json');
      return;
    }
    if (live) {
      const lines = settings?.lines;
      if (!Array.isArray(lines) || !lines.length || lines.length > 12 || lines.some(line =>
        typeof line?.text !== 'string' || !line.text.trim() || line.text.length > 1600 || !Object.hasOwn(pocketVoices, line.voice))) {
        reply(response, 400, 'Unknown voice or invalid text.');
        return;
      }
      const clips = [];
      for (const line of lines) clips.push(await synthesize(line.text, line.voice, signal));
      reply(response, 200, joinSpeech(clips), 'audio/wav');
      return;
    }
    if (local) {
      const { id, index, voice } = settings || {};
      const line = Object.hasOwn(samples, id) && Number.isInteger(index) && samples[id].lines[index];
      if (line?.lang !== 'de' || !Object.hasOwn(pocketVoices, voice)) {
        reply(response, 400, 'Unknown German sample or voice.');
        return;
      }
      reply(response, 200, await synthesize(line.text, voice, signal), 'audio/wav');
      return;
    }
    const { id, first, second, speed } = settings || {};
    if (!Object.hasOwn(samples, id) || !Object.hasOwn(cloudVoices, first) || !Object.hasOwn(cloudVoices, second) ||
        ![1, 0.75].includes(speed) || (id === 'english' && first === 'conrad')) {
      reply(response, 400, 'Unknown sample, voice or speed.');
      return;
    }
    const voices = [cloudVoices[first], cloudVoices[second]];
    const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="de-DE">${samples[id].lines.map((line, index) => {
      const text = `<prosody rate="${speed === 1 ? '+0%' : '-25%'}">${xml(line.text)}</prosody>`;
      return `<voice name="${voices[index].id}">${line.lang === 'en' ? `<lang xml:lang="en-US">${text}</lang>` : text}</voice>`;
    }).join('')}</speak>`;
    const upstream = await fetch(`https://${SPEECH_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`, {
      method: 'POST', body: ssml, signal,
      headers: { 'Ocp-Apim-Subscription-Key': SPEECH_KEY, 'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3', 'User-Agent': 'Sprachpfad Voice Preview' },
    });
    if (!upstream.ok) { reply(response, 502, 'Azure Speech could not generate this sample.'); return; }
    reply(response, 200, Buffer.from(await upstream.arrayBuffer()), 'audio/mpeg');
  } catch {
    if (!response.destroyed) reply(response, 502, teacher ? 'Teacher unavailable.' : 'Speech preview is unavailable.');
  }
}).listen(port, host, () => console.log(`Voice preview: ${origin}/voice-preview.html (${cloud ? 'Azure and browser' : 'browser voices'})`));
