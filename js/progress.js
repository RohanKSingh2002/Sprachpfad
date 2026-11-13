// One editable account tab per browser; revision checks protect saves made on other devices.
// A stable write ID makes retrying an interrupted request safe.
import { browserProgress, emptyProgress, hasProgress, initState, stateSnapshot } from "./state.js";

let active = null;
const listeners = new Set();
const copy = value => JSON.parse(JSON.stringify(value));
const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const keyFor = id => `sprachpfad-account-v1:${id}`;
const importKey = id => `sprachpfad-browser-import:${id}`;
const isActive = ctx => active === ctx && !ctx.controller.signal.aborted;

export const onProgressChange = listener => { listeners.add(listener); return () => listeners.delete(listener); };
export function progressStatus() {
  return active ? { kind: active.resetting ? "loading" : active.kind,
    message: active.resetting ? "Resetting your account progress…" : active.message,
    blocked: !active.ready || !!active.resetting,
    pending: !!active.cache?.dirty, persistent: !active.storageFailed } : {
    kind: "local", message: "Progress saved on this device.", blocked: false, pending: false, persistent: true,
  };
}

function announce(ctx, kind, message) {
  if (!isActive(ctx)) return;
  ctx.kind = kind;
  ctx.message = message;
  listeners.forEach(listener => listener(progressStatus()));
}

function readCache(id) {
  try {
    const value = JSON.parse(localStorage.getItem(keyFor(id)));
    return value && Number.isSafeInteger(value.revision) && value.revision >= 0 &&
      value.state && typeof value.state === "object" ? value : null;
  } catch { return null; }
}

function persist(ctx) {
  try { localStorage.setItem(keyFor(ctx.id), JSON.stringify(ctx.cache)); ctx.storageFailed = false; }
  catch { ctx.storageFailed = true; }
}

function saved(ctx) {
  announce(ctx, "saved", "Progress saved to your account.");
}

function install(ctx) {
  if (!isActive(ctx)) return;
  ctx.ready = true;
  initState({ value: ctx.cache.state, onSave: state => {
    if (!isActive(ctx) || !ctx.ready || equal(ctx.cache.state, state)) return;
    ctx.cache.state = state;
    ctx.cache.dirty = true;
    persist(ctx);
    announce(ctx, "pending", ctx.storageFailed
      ? "Browser storage is unavailable. Keep this page open until your progress is saved."
      : "Changes are saved on this device. Waiting to sync…");
    clearTimeout(ctx.timer);
    ctx.timer = setTimeout(() => flushProgress(), 850);
  } });
  ctx.cache.state = stateSnapshot();
}

function fromRow(row) {
  return { state: row?.state || emptyProgress(), revision: row?.revision || 0, dirty: false, sent: null };
}

async function readRemote(ctx) {
  const { data, error } = await ctx.client.from("learner_progress")
    .select("state, revision, last_write_id").eq("user_id", ctx.id).maybeSingle()
    .abortSignal(ctx.controller.signal);
  if (error) throw error;
  return data || { state: emptyProgress(), revision: 0, last_write_id: null };
}

function conflict(ctx, remote) {
  ctx.remote = remote;
  ctx.ready = false;
  announce(ctx, "conflict", "Your account has a newer save from another tab or device. Choose which progress to keep.");
}

function acceptWrite(ctx, remote, sent) {
  ctx.cache.revision = remote.revision;
  ctx.cache.dirty = !equal(ctx.cache.state, sent.state);
  ctx.cache.sent = null;
  persist(ctx);
}

async function loadAccount(ctx) {
  ctx.cache = readCache(ctx.id);
  try {
    const remote = await readRemote(ctx);
    if (!isActive(ctx)) return;
    if (ctx.cache?.dirty) {
      if (ctx.cache.sent && remote.last_write_id === ctx.cache.sent.id) {
        acceptWrite(ctx, remote, ctx.cache.sent);
      } else if (remote.revision !== ctx.cache.revision) {
        conflict(ctx, remote);
        return;
      }
    } else ctx.cache = fromRow(remote);
    install(ctx);
    persist(ctx);
    if (ctx.cache.dirty) await flushProgress();
    else saved(ctx);
  } catch {
    if (!isActive(ctx)) return;
    if (ctx.cache) {
      install(ctx);
      announce(ctx, "offline", "Account sync is unavailable. You can practise using this device's saved progress.");
      ctx.timer = setTimeout(() => flushProgress({ refresh: true }), 30000);
    } else {
      announce(ctx, "unavailable", "We couldn't load your account progress. Check your connection and try again.");
    }
  }
}

/** Switch immediately, before any asynchronous work, so the previous learner's state is hidden. */
export function connectProgress(client, user) {
  if (active) {
    clearTimeout(active.timer);
    active.controller.abort();
    active.release?.();
    if (active.cache && !active.cache.dirty) {
      try { localStorage.removeItem(keyFor(active.id)); } catch { /* optional cleanup */ }
    }
  }
  active = null;
  if (!user) {
    initState();
    listeners.forEach(listener => listener(progressStatus()));
    return Promise.resolve();
  }
  const ctx = active = { id: user.id, client, controller: new AbortController(), ready: false,
    kind: "loading", message: "Loading your account progress…", cache: null, timer: null };
  initState({ value: emptyProgress(), onSave: () => {} });
  announce(ctx, "loading", ctx.message);
  // Defer out of Supabase's synchronous auth callback before calling its data API.
  return new Promise(resolve => setTimeout(() => {
    if (!isActive(ctx)) { resolve(); return; }
    if (!navigator.locks) {
      announce(ctx, "unavailable", "Account sync needs a current browser and a secure connection. Open the site over HTTPS or localhost.");
      resolve();
      return;
    }
    navigator.locks.request(`sprachpfad-progress:${ctx.id}`, { ifAvailable: true }, async lock => {
      if (!isActive(ctx)) return;
      if (!lock) {
        announce(ctx, "locked", "Your account is open in another tab. Close that tab, then try again here.");
        return;
      }
      const hold = new Promise(release => { ctx.release = release; });
      try { await loadAccount(ctx); } finally { resolve(); }
      if (isActive(ctx)) await hold;
    }).catch(() => {
      announce(ctx, "unavailable", "Account progress couldn't open. Reload the page and try again.");
    }).finally(resolve);
  }, 0));
}

export async function flushProgress({ refresh = false } = {}) {
  const ctx = active;
  if (!ctx || !ctx.ready) return false;
  if (ctx.saving) return ctx.saving;
  clearTimeout(ctx.timer);
  ctx.saving = (async () => {
    try {
      if (!ctx.cache.dirty && refresh) {
        const remote = await readRemote(ctx);
        if (!isActive(ctx)) return false;
        // Work can be recorded while the refresh request is in flight.
        if (ctx.cache.dirty && remote.revision !== ctx.cache.revision) {
          conflict(ctx, remote);
          return false;
        }
        if (!ctx.cache.dirty) { ctx.cache = fromRow(remote); install(ctx); persist(ctx); }
      }
      while (isActive(ctx) && ctx.cache.dirty) {
        if (!ctx.cache.sent) {
          ctx.cache.sent = { id: crypto.randomUUID(), revision: ctx.cache.revision, state: copy(ctx.cache.state) };
          persist(ctx);
        }
        const sent = ctx.cache.sent;
        announce(ctx, "saving", "Saving your progress…");
        const { data, error } = await ctx.client.rpc("save_learning_progress", {
          owner_id: ctx.id, expected_revision: sent.revision, progress: sent.state, write_id: sent.id,
        }).abortSignal(ctx.controller.signal);
        if (!isActive(ctx)) return false;
        if (error) throw error;
        if (!data?.ok) { conflict(ctx, data); return false; }
        acceptWrite(ctx, data, sent);
      }
      if (!isActive(ctx)) return false;
      saved(ctx);
      return true;
    } catch {
      if (isActive(ctx)) {
        announce(ctx, "offline", ctx.storageFailed
          ? "Progress hasn't synced and browser storage is unavailable. Keep this page open and retry."
          : "Progress hasn't synced yet. Your changes are saved on this device; we'll retry when connected.");
        ctx.timer = setTimeout(() => flushProgress({ refresh: true }), 30000);
      }
      return false;
    }
  })();
  try { return await ctx.saving; }
  finally { ctx.saving = null; }
}

export function retryProgress() {
  if (!active) return Promise.resolve();
  if (active.ready) return flushProgress({ refresh: true });
  if (active.kind === "conflict") return Promise.resolve();
  return connectProgress(active.client, { id: active.id });
}

export function canImportBrowserProgress() {
  if (!active?.ready || hasProgress(active.cache.state) || !hasProgress(browserProgress())) return false;
  try { return localStorage.getItem(importKey(active.id)) !== "done"; } catch { return true; }
}

export function dismissBrowserImport() {
  if (!active) return;
  try { localStorage.setItem(importKey(active.id), "done"); } catch { /* optional */ }
}

export async function importBrowserProgress() {
  if (!canImportBrowserProgress()) return false;
  const ctx = active;
  ctx.cache.state = { ...browserProgress(), profilePhoto: ctx.cache.state.profilePhoto || "" };
  ctx.cache.dirty = true;
  persist(ctx);
  install(ctx);
  dismissBrowserImport();
  return flushProgress();
}

export async function resolveProgressConflict(choice) {
  const ctx = active;
  if (!ctx || ctx.kind !== "conflict") return false;
  if (choice === "account") {
    let latest;
    try { latest = await readRemote(ctx); }
    catch { throw new Error("Couldn't load the latest account save. Your device copy is still here; please try again."); }
    if (!isActive(ctx)) return false;
    ctx.cache = fromRow(latest);
    persist(ctx);
    install(ctx);
    saved(ctx);
    return true;
  }
  ctx.cache.revision = ctx.remote.revision;
  ctx.cache.sent = null;
  ctx.cache.dirty = true;
  persist(ctx);
  install(ctx);
  return flushProgress();
}

export function downloadProgress() {
  const snapshot = active?.cache?.state || stateSnapshot();
  const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), progress: snapshot }, null, 2)],
    { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "sprachpfad-progress-backup.json";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function resetAccountProgress() {
  const ctx = active;
  if (!ctx?.ready || !navigator.onLine) throw new Error("Connect to the internet before resetting account progress.");
  if (!await flushProgress({ refresh: true }) || !isActive(ctx)) {
    throw new Error("Resolve the save issue before resetting your account progress.");
  }
  ctx.resetting = true;
  announce(ctx, "loading", "Resetting your account progress…");
  try {
    ctx.cache.state = { ...emptyProgress(), profilePhoto: ctx.cache.state.profilePhoto || "" };
    ctx.cache.dirty = true;
    persist(ctx);
    install(ctx);
    if (!await flushProgress()) throw new Error("The reset hasn't synced yet. Check the save status in your profile.");
  } finally {
    ctx.resetting = false;
    announce(ctx, ctx.kind, ctx.message);
  }
}
