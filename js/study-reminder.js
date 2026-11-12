import { dayKey } from "./utils.js";
import { registerStudyWorker } from "./offline-study.js";

const TIME = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
const REMINDER_KEY = "sprachpfad-study-notification";
export const REMINDER_DAYS = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
let timer, checking = false;

function validDays(days) {
  return Array.isArray(days) ? REMINDER_DAYS.filter(day => days.includes(day)) : [];
}

export function studyNotification() {
  try {
    const setting = JSON.parse(localStorage.getItem(REMINDER_KEY));
    if (TIME.test(setting?.time)) return { ...setting, days: validDays(setting.days || REMINDER_DAYS), paused: setting.paused === true };
  } catch { /* Storage can be disabled. */ }
  return { time: "18:00", enabled: false, last: "", days: [...REMINDER_DAYS], paused: false };
}

function storeNotification(setting) {
  localStorage.setItem(REMINDER_KEY, JSON.stringify(setting));
}

export async function setStudyNotification(time, enabled, days = REMINDER_DAYS) {
  if (!TIME.test(time)) throw new Error("Choose a time for the reminder.");
  const activeDays = validDays(days);
  if (enabled && !activeDays.length) throw new Error("Choose at least one reminder day.");
  if (enabled) {
    if (!globalThis.Notification) throw new Error("This browser doesn't offer site notifications. You can use a calendar reminder.");
    const permission = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
    if (permission !== "granted") throw new Error("Allow notifications in your browser to enable this reminder.");
    if (!await registerStudyWorker()) throw new Error("This browser couldn't enable site notifications.");
  }
  const now = new Date();
  const localTime = now.toTimeString().slice(0, 5);
  const previous = studyNotification();
  storeNotification({ time, enabled, days: activeDays.length ? activeDays : previous.days, paused: enabled && previous.paused,
    last: localTime >= time ? dayKey(now) : previous.last });
  scheduleStudyNotification();
}

export function setReminderPaused(paused) {
  const setting = studyNotification();
  if (!setting.enabled) return;
  storeNotification({ ...setting, paused: paused === true });
  scheduleStudyNotification();
}

async function sendIfDue() {
  const setting = studyNotification();
  const now = new Date();
  const date = dayKey(now);
  const day = REMINDER_DAYS[now.getDay()];
  if (!setting.enabled || setting.paused || !setting.days.includes(day) || globalThis.Notification?.permission !== "granted" || setting.last === date ||
      now.toTimeString().slice(0, 5) < setting.time) return;
  const registration = await registerStudyWorker();
  if (!registration) return;
  const current = studyNotification();
  if (!current.enabled || current.paused || !current.days.includes(day) || current.time !== setting.time || current.last === date) return;
  storeNotification({ ...current, last: date });
  try {
    await registration.showNotification("Time to practise German", {
      body: "Open Sprachpfad for your daily sentence practice.",
      icon: new URL("../app-icon.svg", import.meta.url).href,
      tag: "sprachpfad-study-reminder",
    });
  } catch {
    const latest = studyNotification();
    if (latest.time === current.time && latest.last === date) storeNotification(current);
  }
}

function scheduleStudyNotification() {
  clearTimeout(timer);
  const { enabled, paused } = studyNotification();
  if (!enabled || paused) return;
  timer = setTimeout(() => void checkStudyNotification(), 15000);
}

async function checkStudyNotification() {
  if (checking || !studyNotification().enabled) return;
  checking = true;
  try {
    if (navigator.locks) await navigator.locks.request(REMINDER_KEY, sendIfDue);
    else await sendIfDue();
  } catch { /* A notification failure should never interrupt practice. */ }
  finally {
    checking = false;
    scheduleStudyNotification();
  }
}

export function startStudyNotifications() {
  void checkStudyNotification();
  window.addEventListener("focus", checkStudyNotification);
  window.addEventListener("storage", event => {
    if (event.key === REMINDER_KEY) scheduleStudyNotification();
  });
}

export function studyReminderCalendar(time, now = new Date(), days = REMINDER_DAYS) {
  if (!TIME.test(time)) return "";
  const activeDays = validDays(days);
  if (!activeDays.length) return "";
  const [hour, minute] = time.split(":").map(Number);
  const start = new Date(now);
  start.setHours(hour, minute, 0, 0);
  if (start <= now) start.setDate(start.getDate() + 1);
  while (!activeDays.includes(REMINDER_DAYS[start.getDay()])) start.setDate(start.getDate() + 1);
  const date = dayKey(start).replaceAll("-", "");
  const stamp = now.toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");
  const uid = globalThis.crypto?.randomUUID?.() || `${now.getTime()}-${Math.random().toString(36).slice(2)}`;
  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Sprachpfad//Study Reminder//EN", "BEGIN:VEVENT",
    `UID:${uid}@sprachpfad`, `DTSTAMP:${stamp}`, `DTSTART:${date}T${time.replace(":", "")}00`, "DURATION:PT5M",
    activeDays.length === 7 ? "RRULE:FREQ=DAILY" : `RRULE:FREQ=WEEKLY;BYDAY=${activeDays.join(",")}`, "SUMMARY:Practise German with Sprachpfad", "URL:https://sprachpfad-learn-deutsch.pages.dev/", "BEGIN:VALARM", "ACTION:DISPLAY",
    "TRIGGER:PT0M", "DESCRIPTION:Time for German practice", "END:VALARM", "END:VEVENT", "END:VCALENDAR", ""].join("\r\n");
}
