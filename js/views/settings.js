import { currentUser } from "../auth.js";
import { SETS } from "../content.js";
import { progressStatus } from "../progress.js";
import {
  sentencePreferences, setSentencePreferences, setSitePreferences, setStudyGoal, sitePreferences, smartReviewPlan, studyGoal,
  SENTENCE_MODES, SMART_REVIEW_SIZES, SMART_REVIEW_SOURCES, STUDY_GOAL_LIMITS,
} from "../state.js";
import { setReminderPaused, setStudyNotification, studyNotification, studyReminderCalendar } from "../study-reminder.js";
import { offlineLessons, offlineSize, removeOfflineLesson } from "../offline-study.js";
import { localInstruction, prepareStudyLanguage, refreshInterface, STUDY_LANGUAGES } from "../study-language.js";
import { audioSpeedControl, stopAudio } from "../ui/audio.js";
import { applyDisplayPreferences } from "../ui/motion.js";
import { initSmoothScroll } from "../ui/scroll.js";
import { esc } from "../utils.js";

const SECTIONS = {
  audio: ["Audio & display", "M3 9h4l5-4v14l-5-4H3z M16 9a4 4 0 010 6 M19 6a8 8 0 010 12", audioDisplay],
  study: ["Study plan", "M4 6h16v14H4z M4 10h16 M8 3v6 M16 3v6 M8 15l2 2 5-5", studyPanel],
  language: ["Language", "M2 18l5-12 5 12 M4 14h6 M13 7h8 M17 4v3 M20 7c0 5-3 8-7 10 M14 10c1 3 3 5 6 7", languagePanel],
  reminders: ["Reminders", "M5 16l2-4V9a5 5 0 0110 0v3l2 4z M10 20h4", reminderPanel],
  downloads: ["Downloads", "M12 3v12m-5-5 5 5 5-5 M4 16v5h16v-5", downloadsPanel],
  account: ["Account & data", "M12 4a4 4 0 100 8 4 4 0 000-8z M4 21a8 8 0 0116 0", accountPanel],
};
const DAYS = [["MO", "Mon", "Monday"], ["TU", "Tue", "Tuesday"], ["WE", "Wed", "Wednesday"],
  ["TH", "Thu", "Thursday"], ["FR", "Fri", "Friday"], ["SA", "Sat", "Saturday"], ["SU", "Sun", "Sunday"]];
const sectionParam = () => new URLSearchParams(location.hash.split("?")[1] || "").get("section");
const currentSection = () => ["goal", "review"].includes(sectionParam()) ? "study" : Object.hasOwn(SECTIONS, sectionParam()) ? sectionParam() : "audio";
const option = (value, label, selected) =>
  `<option value="${esc(value)}"${value === selected ? " selected" : ""}>${esc(label)}</option>`;
const selectOptions = (choices, selected) => Object.entries(choices).map(([value, label]) => option(value, label, selected)).join("");
const sectionIcon = path => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${path}"/></svg>`;
const switchInput = (id, checked, label) => `<label class="setting-switch-label"><input class="setting-switch" type="checkbox" id="${id}"${checked ? " checked" : ""}><span>${label}</span></label>`;

function segments(name, selected, options) {
  return `<div class="setting-segments">${Object.entries(options).map(([value, label]) =>
    `<label><input type="radio" name="${name}" value="${value}"${selected === value ? " checked" : ""}><span>${label}</span></label>`).join("")}</div>`;
}

function audioDisplay() {
  const { text, motion } = sitePreferences();
  const { textSize, translation, feedback } = sentencePreferences();
  return `<section class="settings-panel" aria-labelledby="settings-audio-heading">
      <h2 id="settings-audio-heading">Audio playback</h2>
      <p class="muted">Lessons, flashcards, sentence practice and mock tests use this speed.</p>
      ${audioSpeedControl("settings-playback-speed")}
      <div class="settings-audio-scale" aria-hidden="true"><span>0.5×</span><span>1×</span><span>2×</span></div>
      <div class="settings-actions">
        <button class="btn small" type="button" data-say="Wie schreibt man Ihren Namen?">${sectionIcon("M8 4l12 8-12 8z")}<span>Play sample</span></button>
        <button class="btn small ghost" type="button" data-reset-audio-speed>Reset to 1×</button>
      </div>
    </section>
    <section class="settings-panel settings-display" aria-labelledby="settings-display-heading">
      <h2 id="settings-display-heading">Display &amp; accessibility</h2>
      <fieldset class="setting-row"><legend class="sr">Appearance</legend>
        <div><strong>Appearance</strong><p>Choose a theme for the whole site.</p></div>
        ${segments("theme", window.sprachpfadTheme.current(), { light: "Light", dark: "Dark", auto: "Device" })}
      </fieldset>
      <fieldset class="setting-row"><legend class="sr">App text size</legend>
        <div><strong>App text size</strong><p>Adjust menus and instructional text.</p></div>
        ${segments("app-text", text, { normal: "Normal", large: "Large", extra: "Extra large" })}
      </fieldset>
      <fieldset class="setting-row"><legend class="sr">Motion</legend>
        <div><strong>Motion</strong><p>Choose how much the interface animates.</p></div>
        ${segments("app-motion", motion, { device: "Device", reduced: "Reduced", full: "Full" })}
      </fieldset>
      <p class="settings-note" id="theme-save-note" role="status"></p>
    </section>
    <details class="settings-panel settings-sentence-defaults" open>
      <summary>Sentence practice defaults</summary>
      <fieldset class="setting-row"><legend class="sr">Sentence text size</legend><strong>Sentence text size</strong>
        ${segments("sentence-size", textSize, { small: "A−", normal: "A", large: "A+", largest: "A++" })}
      </fieldset>
      <div class="settings-study-controls setting-row">
        ${switchInput("settings-sentence-translation", translation !== false, "Show translations")}
        <label>Rating guidance<select id="settings-rating-guidance">${selectOptions({ first: "First 3 ratings", always: "Always", off: "Off" }, feedback)}</select></label>
      </div>
    </details>`;
}

function studyPanel() {
  const { home, reviewMode } = sitePreferences();
  const { unit, target, repetitions } = studyGoal();
  const { smartSize, smartSource } = sentencePreferences();
  return `<div class="settings-panel settings-plan" id="settings-study">
    <p class="muted">Choose what to do first and what goes into your daily review.</p>
    <div class="settings-fields">
      <label>Home starts with<select id="settings-home-mode">${selectOptions({
        mix: "Mix course progress and due review", course: "Continue the course", review: "Prioritize due review",
      }, home)}</select></label>
      <label>Daily goal<select id="study-goal-unit">${selectOptions({ actions: "Practice actions", minutes: "Study minutes",
        repetitions: "Audio repetitions", either: "Minutes or audio repetitions" }, unit)}</select></label>
      <div class="settings-field-pair">
        <label><span id="study-goal-target-label">${unit === "either" ? "Study minutes" : "Daily target"}</span><input type="number" id="study-goal-target" min="1" max="${STUDY_GOAL_LIMITS[unit === "either" ? "minutes" : unit]}" value="${target}"></label>
        <label id="study-goal-repetition-label"${unit === "either" ? "" : " hidden"}>Audio repetitions<input type="number" id="study-goal-repetitions" min="1" max="${STUDY_GOAL_LIMITS.repetitions}" value="${repetitions || 150}"></label>
      </div>
      <button class="btn small ghost" type="button" data-save-study-goal>Save goal</button>
      <p class="settings-note" id="study-goal-note" role="status">With a combined goal, either target completes the day.</p>
      <hr>
      <div class="settings-field-pair">
        <label>Smart Review source<select id="smart-review-source">${selectOptions(SMART_REVIEW_SOURCES, smartSource)}</select></label>
        <label>New + due daily batch<select id="smart-review-size">${SMART_REVIEW_SIZES.map(size => option(size, `${size} sentences`, smartSize)).join("")}</select></label>
      </div>
      <label>Default review mode<select id="settings-review-mode">${selectOptions(SENTENCE_MODES, reviewMode)}</select></label>
      <button class="btn small ghost" type="button" data-save-smart-review>Save review settings</button>
      <p class="settings-note" id="smart-review-note" role="status"></p>
    </div>
  </div>`;
}

function languagePanel() {
  return `<div class="settings-panel" id="settings-language">
    <p class="muted">German remains the language you are learning.</p>
    <div class="settings-fields">
      <label>App language<select id="settings-app-language">${selectOptions(STUDY_LANGUAGES, sitePreferences().appLanguage)}</select></label>
      <label>Translation and prompt language<select id="study-language">${selectOptions(STUDY_LANGUAGES, sentencePreferences().language)}</select></label>
      <p class="small muted">Translated prompts use an on-device pack where available.</p>
      <button class="btn small ghost" type="button" data-save-study-language>Save prompt language</button>
      <p class="settings-note" id="study-language-note" role="status"></p>
    </div>
  </div>`;
}

function reminderPanel() {
  const { time, enabled, days, paused } = studyNotification();
  return `<div class="settings-panel" id="settings-reminders">
    <p class="muted">Browser notifications work while Sprachpfad is open. Use your calendar for alerts when it is closed.</p>
    <div class="settings-fields">
      <fieldset class="setting-days"><legend>Study days</legend>
        <div>${DAYS.map(([code, short, full]) => `<label><input name="reminder-day" type="checkbox" value="${code}"${days.includes(code) ? " checked" : ""} aria-label="${full}"><span>${short}</span></label>`).join("")}</div>
      </fieldset>
      <label>Reminder time<input type="time" id="study-reminder-time" value="${time}"></label>
      ${switchInput("study-notifications-enabled", enabled, "Browser notification")}
      <div class="settings-actions">
        <button class="btn small" type="button" data-save-study-notification>Save reminder</button>
        <button class="btn small ghost" type="button" data-pause-reminder${enabled ? "" : " disabled"}>${paused ? "Resume reminders" : "Pause reminders"}</button>
        <button class="btn small ghost" type="button" data-download-study-reminder>Download calendar reminder</button>
      </div>
      <p class="settings-note" id="study-reminder-note" role="status">${paused ? "Browser reminders are paused." : ""}</p>
    </div>
  </div>`;
}

function downloadsPanel() {
  return `<section class="settings-panel" id="settings-downloads" aria-labelledby="offline-lessons-heading">
    <h2 id="offline-lessons-heading">Downloaded lessons</h2>
    <p class="muted" id="offline-lesson-summary">Checking this device for downloads…</p>
    <div class="settings-fields"><label>Search downloaded lessons<input id="offline-lesson-search" type="search" placeholder="Search by title or level"></label></div>
    <ul id="offline-lesson-list" class="settings-downloads"></ul>
    <p class="settings-note" id="offline-lesson-note" role="status"></p>
    <a class="tlink" href="#/roadmap">Browse lessons to download</a>
  </section>`;
}

function accountPanel() {
  const user = currentUser();
  const status = progressStatus();
  return `<div class="settings-panel" id="settings-account">
    <p class="muted">Manage the progress saved on your account or this device.</p>
    <div class="settings-sync"><span data-sync-status role="status">${esc(status.message)}</span>
      ${user ? '<button class="btn small ghost" type="button" data-account-action="retry">Sync now</button>' : ""}</div>
    <div class="settings-actions">
      <button class="btn small ghost" type="button" data-account-action="download">Download backup</button>
      ${user ? '<button class="btn small ghost" type="button" data-account-action="signout">Sign out</button>' : '<a class="btn small ghost" href="#/login">Sign in</a>'}
    </div>
    <div class="setting-row settings-danger"><div><strong>Reset learning progress</strong><p>Requires confirmation.</p></div>
      <button class="btn small ghost" type="button" data-account-action="reset"${status.blocked ? " disabled" : ""}>Reset progress</button></div>
    <p id="account-error" class="account-error" role="alert" hidden></p>
  </div>`;
}

export const updatesInPlace = true;
export function render() {
  const section = currentSection();
  const [title, , renderPanel] = SECTIONS[section];
  return `<section class="settings-page" aria-labelledby="settings-title">
    <nav class="settings-sidebar" aria-label="Settings sections"><span>Settings</span>
      ${Object.entries(SECTIONS).map(([key, [label, icon]]) =>
        `<a href="#/settings?section=${key}"${section === key ? ' aria-current="page"' : ""}>${sectionIcon(icon)}<span>${esc(label)}</span></a>`).join("")}</nav>
    <div class="settings-content">
      <header class="settings-header"><h1 id="settings-title" tabindex="-1">${esc(title)}</h1></header>
      <label class="settings-jump">Jump to a section<select id="settings-section">${Object.entries(SECTIONS).map(([key, [label]]) => option(key, label, section)).join("")}</select></label>
      ${renderPanel()}
    </div>
  </section>`;
}

let downloads = [];
let pickedSection = false;

function syncTheme() {
  document.querySelectorAll('input[name="theme"]').forEach(input => {
    input.checked = input.value === window.sprachpfadTheme.current();
  });
}

function paintDownloads() {
  const list = document.getElementById("offline-lesson-list");
  if (!list) return;
  const query = document.getElementById("offline-lesson-search").value.trim().toLocaleLowerCase();
  const results = downloads.filter(({ lesson }) => `${lesson.level.name} ${lesson.title} ${lesson.germanTitle}`.toLocaleLowerCase().includes(query));
  list.innerHTML = results.map(({ lesson, bytes }) => `<li><span class="settings-level">${esc(lesson.level.name)}</span>
    <a href="#/${lesson.level.id}/lektion/${lesson.id}">${esc(lesson.title)}</a><span class="small muted">${offlineSize(bytes)}</span>
    <button class="btn small ghost" type="button" data-remove-download="${esc(lesson.key)}" aria-label="Remove download for ${esc(lesson.title)}">Remove</button></li>`).join("")
    || `<li class="muted">${query ? "No downloads match your search." : "No offline lessons yet."}</li>`;
}

async function showDownloads() {
  const summary = document.getElementById("offline-lesson-summary");
  if (!summary) return;
  try {
    const saved = await offlineLessons();
    if (!summary.isConnected) return;
    downloads = saved.map(({ key, bytes }) => ({ lesson: SETS.get(key), bytes })).filter(row => row.lesson?.kind === "lesson");
    const total = downloads.reduce((sum, { bytes }) => sum + bytes, 0);
    summary.textContent = `${downloads.length} ${downloads.length === 1 ? "lesson" : "lessons"} · ${offlineSize(total)} of audio on this device`;
    paintDownloads();
  } catch { summary.textContent = "Offline storage is unavailable in this browser."; }
}

function onInput(event) {
  if (event.target.id === "offline-lesson-search") paintDownloads();
}

export function mount() {
  window.addEventListener("themechange", syncTheme);
  document.addEventListener("input", onInput);
  const deepLinkFocus = { goal: "study-goal-unit", review: "smart-review-source" }[sectionParam()];
  const focus = pickedSection ? "settings-section" : deepLinkFocus || "settings-title";
  pickedSection = false;
  document.getElementById(focus)?.focus({ preventScroll: focus !== deepLinkFocus });
  void showDownloads();
}

export function unmount() {
  window.removeEventListener("themechange", syncTheme);
  document.removeEventListener("input", onInput);
  stopAudio();
}

export function onChange(event) {
  const { id, name, value, checked } = event.target;
  if (id === "settings-section") {
    pickedSection = true;
    location.hash = `#/settings?section=${value}`;
  } else if (name === "theme") {
    const saved = window.sprachpfadTheme.set(value);
    document.getElementById("theme-save-note").textContent = saved ? "Appearance saved on this device." : "Appearance changed for this visit.";
  } else if (name === "app-text" || name === "app-motion") {
    setSitePreferences({ [name === "app-text" ? "text" : "motion"]: value });
    applyDisplayPreferences();
    initSmoothScroll();
  } else if (name === "sentence-size") setSentencePreferences({ textSize: value });
  else if (id === "settings-sentence-translation") setSentencePreferences({ translation: checked });
  else if (id === "settings-rating-guidance") setSentencePreferences({ feedback: value });
  else if (id === "settings-home-mode") setSitePreferences({ home: value });
  else if (id === "settings-review-mode") setSitePreferences({ reviewMode: value });
  else if (id === "settings-app-language") {
    setSitePreferences({ appLanguage: value });
    document.documentElement.lang = value;
    refreshInterface(document.querySelector("header.nav"));
    refreshInterface(document.getElementById("app"));
  } else if (id === "study-goal-unit") {
    const target = document.getElementById("study-goal-target");
    const primary = value === "either" ? "minutes" : value;
    target.max = STUDY_GOAL_LIMITS[primary];
    target.value = { minutes: 5, actions: 10, repetitions: 150 }[primary];
    document.getElementById("study-goal-target-label").textContent = value === "either" ? "Study minutes" : "Daily target";
    document.getElementById("study-goal-repetition-label").hidden = value !== "either";
  }
}

const reminderDays = () => [...document.querySelectorAll('[name="reminder-day"]:checked')].map(input => input.value);

export async function onClick(_event, button) {
  if (!button) return;
  const data = button.dataset;
  if (data.removeDownload) {
    const lesson = SETS.get(data.removeDownload);
    const note = document.getElementById("offline-lesson-note");
    if (!lesson) return;
    button.disabled = true;
    try {
      await removeOfflineLesson(lesson.key);
      note.textContent = `Removed the download for ${lesson.title}.`;
      await showDownloads();
    } catch (error) { note.textContent = error.message; }
    finally { button.disabled = false; }
  } else if (data.saveStudyGoal !== undefined) {
    const unit = document.getElementById("study-goal-unit").value;
    const target = document.getElementById("study-goal-target");
    const repetition = document.getElementById("study-goal-repetitions");
    const saved = setStudyGoal(unit, target.valueAsNumber, repetition.valueAsNumber);
    document.getElementById("study-goal-note").textContent = saved ? "Daily goal saved." : "Enter whole numbers within the allowed range.";
    if (!saved) (target.validity.valid && unit === "either" ? repetition : target).focus();
  } else if (data.saveSmartReview !== undefined) {
    const smartSource = document.getElementById("smart-review-source").value;
    const smartSize = Number(document.getElementById("smart-review-size").value);
    setSentencePreferences({ smartSource, smartSize });
    const { due, fresh, size } = smartReviewPlan();
    document.getElementById("smart-review-note").textContent = `Saved. ${due} due and ${fresh} new sentences are ready today.${size > smartSize ? " The smaller batch starts tomorrow." : ""}`;
  } else if (data.saveStudyLanguage !== undefined) {
    const field = document.getElementById("study-language");
    const note = document.getElementById("study-language-note");
    const language = field.value;
    button.disabled = field.disabled = true;
    setSentencePreferences({ language });
    note.textContent = language === "en" ? "Prompts use English." : "Preparing the on-device language pack…";
    const ready = await prepareStudyLanguage(language, true);
    if (language !== "en") note.textContent = ready ? "Saved. Prompts use the selected language." : "Saved. This browser uses English until the selected language pack is available.";
    button.disabled = field.disabled = false;
  } else if (data.saveStudyNotification !== undefined || data.pauseReminder !== undefined || data.downloadStudyReminder !== undefined) {
    await changeReminder(button);
  }
}

async function changeReminder(button) {
  const data = button.dataset;
  const time = document.getElementById("study-reminder-time").value;
  const note = document.getElementById("study-reminder-note");
  if (data.downloadStudyReminder !== undefined) {
    const file = studyReminderCalendar(time, new Date(), reminderDays());
    if (!file) { note.textContent = "Choose a time and at least one day for the reminder."; return; }
    const url = URL.createObjectURL(new Blob([file], { type: "text/calendar;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "sprachpfad-study-reminder.ics";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    note.textContent = "Open the downloaded file in your calendar to add the reminder.";
    return;
  }
  const checkbox = document.getElementById("study-notifications-enabled");
  const pause = document.querySelector("[data-pause-reminder]");
  button.disabled = true;
  try {
    if (data.pauseReminder !== undefined) setReminderPaused(!studyNotification().paused);
    else await setStudyNotification(time, checkbox.checked, reminderDays());
    const reminder = studyNotification();
    pause.textContent = localInstruction(reminder.paused ? "Resume reminders" : "Pause reminders");
    note.textContent = reminder.paused ? "Browser reminders are paused." : reminder.enabled ? "Browser reminder saved on this device." : "Browser reminders are off.";
  } catch (error) {
    checkbox.checked = studyNotification().enabled;
    note.textContent = error.message;
  } finally {
    button.disabled = false;
    pause.disabled = !studyNotification().enabled;
  }
}
