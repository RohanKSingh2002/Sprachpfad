const root = new URL(self.registration.scope);
const prefix = `sprachpfad:${root.pathname}:`;
const shell = `${prefix}shell`;

self.addEventListener("install", event => event.waitUntil(self.skipWaiting()));
self.addEventListener("activate", event => event.waitUntil(self.clients.claim()));

async function audioResponse(request) {
  const lessonCaches = (await caches.keys()).filter(name => name.startsWith(`${prefix}lesson:`));
  for (const cacheName of lessonCaches) {
    const file = await caches.match(request.url, { cacheName });
    if (!file) continue;
    const range = request.headers.get("Range");
    if (!range) return file;
    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    if (!match || (!match[1] && !match[2])) break;
    const bytes = await file.arrayBuffer();
    const size = bytes.byteLength;
    const from = match[1] ? Number(match[1]) : Math.max(0, size - Number(match[2]));
    const to = match[1] && match[2] ? Math.min(size - 1, Number(match[2])) : size - 1;
    if (from > to || from >= size) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
    return new Response(bytes.slice(from, to + 1), {
      status: 206, headers: { "Content-Type": "audio/mpeg", "Accept-Ranges": "bytes",
        "Content-Range": `bytes ${from}-${to}/${size}`, "Content-Length": to - from + 1 },
    });
  }
  return fetch(request);
}

async function shellResponse(request, fallback) {
  try {
    const response = await fetch(request);
    if (response.ok || response.status < 500) return response;
    return await caches.match(fallback, { cacheName: shell }) || response;
  } catch {
    return await caches.match(fallback, { cacheName: shell }) || Response.error();
  }
}

self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== root.origin || !url.pathname.startsWith(root.pathname) ||
      request.cache === "reload" || request.headers.has("Authorization")) return;
  const path = url.pathname.slice(root.pathname.length);
  if (/^audio\/[a-z0-9]+\.mp3$/.test(path)) {
    event.respondWith(audioResponse(request));
  } else if (request.mode === "navigate" && !url.search && (path === "" || path === "index.html")) {
    event.respondWith(shellResponse(request, root.href));
  } else if (/^(css|js|data)\//.test(path) || ["audio/index.json", "app-icon.svg", "manifest.webmanifest"].includes(path)) {
    event.respondWith(shellResponse(request, request.url));
  }
});

self.addEventListener("notificationclick", event => {
  event.notification.close();
  if (event.notification.tag !== "sprachpfad-study-reminder") return;
  event.waitUntil((async () => {
    const target = new URL("#/sentences", root).href;
    const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const existing = clients.find(client => client.url.startsWith(root.href));
    if (!existing) return self.clients.openWindow(target);
    // Focus the current tab without discarding an in-progress round.
    return existing.focus();
  })());
});
