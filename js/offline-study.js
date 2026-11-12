import { clipId } from "./ui/audio.js";

const root = new URL("../", import.meta.url);
const prefix = `sprachpfad:${root.pathname}:`;
const shellName = `${prefix}shell`;
const lessonName = key => `${prefix}lesson:${key}`;
let worker;

export function registerStudyWorker() {
  if (!navigator.serviceWorker || !globalThis.caches) return Promise.resolve(null);
  worker ??= navigator.serviceWorker.register(new URL("study-worker.js", root))
    .then(registration => {
      if (registration.active) return registration;
      return navigator.serviceWorker.ready;
    }).catch(() => {
      worker = null;
      return null;
    });
  return worker;
}

const markerFor = key => new URL(`offline-lesson/${key}`, root);

async function cachedAudioSize(cache, files) {
  const sizes = await Promise.all(files.map(async file => {
    const response = await cache.match(file);
    if (!response) return 0;
    const length = response.headers.get("content-length");
    return length && Number.isFinite(Number(length)) ? Number(length) : (await response.blob()).size;
  }));
  return sizes.reduce((total, size) => total + size, 0);
}

export async function offlineLessonInfo(key) {
  if (!globalThis.caches) return null;
  const marker = await caches.match(markerFor(key), { cacheName: lessonName(key) });
  if (!marker) return null;
  try {
    const { bytes } = await marker.json();
    if (Number.isFinite(bytes)) return { key, bytes };
  } catch { /* Older downloads only stored a build version. */ }
  const cache = await caches.open(lessonName(key));
  const files = (await cache.keys()).filter(file => file.url.endsWith(".mp3"));
  return { key, bytes: await cachedAudioSize(cache, files) };
}

export async function offlineLessons() {
  if (!globalThis.caches) return [];
  const names = await caches.keys();
  const saved = names.filter(name => name.startsWith(`${prefix}lesson:`));
  const complete = await Promise.all(saved.map(name => offlineLessonInfo(name.slice(`${prefix}lesson:`.length))));
  return complete.filter(Boolean);
}

export function offlineSize(bytes) {
  return bytes >= 1000000 ? `${(bytes / 1000000).toFixed(1)} MB` : `${Math.ceil(bytes / 1000)} KB`;
}

function recordedLessonAssets(lesson, clips) {
  const assets = new Set();
  const seen = new Set([lesson.level]);
  function collect(value) {
    if (typeof value === "string") {
      const id = clipId(value);
      if (clips.has(id)) assets.add(`audio/${id}.mp3`);
    } else if (value && typeof value === "object" && !seen.has(value)) {
      seen.add(value);
      Object.values(value).forEach(collect);
    }
  }
  collect(lesson);
  return [...assets];
}

const request = path => new Request(new URL(path, root), { cache: "reload" });

function offlineWrite(action) {
  return navigator.locks ? navigator.locks.request(`${prefix}offline-write`, action) : action();
}

export function downloadOfflineLesson(lesson) {
  return offlineWrite(() => cacheOfflineLesson(lesson));
}

async function cacheOfflineLesson(lesson) {
  if (!await registerStudyWorker()) throw new Error("Offline downloads require a browser that supports offline storage.");
  const manifest = await fetch(request("offline-assets.json"));
  if (!manifest.ok || !manifest.headers.get("content-type")?.includes("json")) {
    throw new Error("Offline lesson downloads are available in the packaged website.");
  }
  const { version, assets } = await manifest.json();
  const shell = await caches.open(shellName);
  const metadata = new URL("offline-version", root);
  if (await (await shell.match(metadata))?.text() !== version) {
    await shell.addAll(assets.map(request));
    await shell.put(metadata, new Response(version));
  }

  const index = await shell.match(new URL("audio/index.json", root));
  const audio = recordedLessonAssets(lesson, new Set((await index.json()).clips));
  const cache = await caches.open(lessonName(lesson.key));
  const missing = (await Promise.all(audio.map(async path => await cache.match(new URL(path, root)) ? "" : path))).filter(Boolean);
  if (missing.length) await cache.addAll(missing.map(request));
  const bytes = await cachedAudioSize(cache, audio.map(path => new URL(path, root)));
  await cache.put(markerFor(lesson.key), new Response(JSON.stringify({ version, bytes })));
  return audio.length;
}

export function removeOfflineLesson(key) {
  return offlineWrite(() => caches.delete(lessonName(key)));
}
