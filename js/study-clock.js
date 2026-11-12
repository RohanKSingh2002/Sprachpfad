import { logStudySeconds } from "./state.js";
import { dayKey } from "./utils.js";

const IDLE_MS = 2 * 60 * 1000;
const SAVE_MS = 15000;
let started = false;
let studying = false;
let foreground = false;
let cursor = 0;
let activeUntil = 0;
const pending = new Map();

function sample(now) {
  const end = Math.min(now, activeUntil);
  if (studying && foreground && end > cursor) {
    const day = dayKey(new Date(cursor));
    const midnight = new Date(cursor);
    midnight.setHours(24, 0, 0, 0);
    const firstEnd = Math.min(end, midnight.getTime());
    pending.set(day, (pending.get(day) || 0) + firstEnd - cursor);
    if (end > firstEnd) {
      const next = dayKey(new Date(end));
      pending.set(next, (pending.get(next) || 0) + end - firstEnd);
    }
  }
  cursor = now;
}

export function flushStudyTime() {
  if (!started) return;
  sample(Date.now());
  for (const [day, milliseconds] of pending) {
    const seconds = Math.floor(milliseconds / 1000);
    if (day === dayKey(new Date()) && milliseconds % 1000) pending.set(day, milliseconds % 1000);
    else pending.delete(day);
    if (seconds) logStudySeconds(day, seconds);
  }
}

export function resetStudyClock() {
  pending.clear();
  studying = false;
  activeUntil = 0;
  cursor = Date.now();
}

export function setStudyView(value) {
  if (!started) return;
  flushStudyTime();
  studying = value;
  activeUntil = cursor + IDLE_MS;
}

export function noteStudyActivity() {
  if (!started) return;
  sample(Date.now());
  activeUntil = cursor + IDLE_MS;
}

export function startStudyClock() {
  if (started) return;
  started = true;
  cursor = Date.now();
  foreground = document.visibilityState === "visible" && document.hasFocus();
  const visibility = () => {
    flushStudyTime();
    const visible = document.visibilityState === "visible" && document.hasFocus();
    if (visible && !foreground) activeUntil = cursor + IDLE_MS;
    foreground = visible;
  };
  document.addEventListener("visibilitychange", visibility);
  document.addEventListener("pointerdown", noteStudyActivity, { passive: true });
  document.addEventListener("keydown", noteStudyActivity);
  document.addEventListener("wheel", noteStudyActivity, { passive: true });
  window.addEventListener("focus", visibility);
  window.addEventListener("blur", visibility);
  window.addEventListener("pagehide", flushStudyTime);
  setInterval(flushStudyTime, SAVE_MS);
}
