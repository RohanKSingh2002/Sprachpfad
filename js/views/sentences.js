// Sentence collections and practice rounds.
import { LEVELS, LEVEL_BY_ID, SETS } from "../content.js";
import {
  createSentenceCollection, deleteSentenceCollection, dueSentences, isSentenceFavorite, lessonSentence, logPractice, moveSavedSentence,
  hasShadowedSentence, lessonSentenceProgress, logSentenceActivity, rateSentence, removeSavedSentence, renameSentenceCollection, savedSentenceCollections,
  LESSON_SENTENCE_COLLECTION, saveSentenceBatch, saveSentenceToCollection, sentencePreferences, setSentencePreferences, setSentenceBatchRatings,
  currentLevel, toggleSentenceCollectionPin,
  audioPlaybackSpeed, sitePreferences, smartReviewPlan, toggleSentenceFavorite, updateSavedSentence, SENTENCE_INTERVALS, SENTENCE_MODES, SENTENCE_REPEATS, SENTENCE_ROUND_SIZES, SENTENCE_SOURCES,
} from "../state.js";
import { selectSentenceBatch, waitBetweenLines } from "../sentence-practice.js";
import { noteStudyActivity } from "../study-clock.js";
import { audioSpeedControl, playAudioLine, setMediaControls, speakerButton, stopAudio } from "../ui/audio.js";
import { enter, motionOK, splitReveal } from "../ui/motion.js?v=20261113-polish1";
import { scrollToTop } from "../ui/scroll.js?v=20261113-polish1";
import { toast } from "../ui/toast.js";
import { esc, norm, shuffle } from "../utils.js";
import { mountSentenceImport, sentenceImport } from "./sentence-import.js";
import { applySentenceStar, copySentence, copySentenceButton, sentenceStars } from "../ui/sentence-controls.js";
import { localInstruction, promptFor, refreshInterface, refreshSentencePrompts } from "../study-language.js";
import { currentGuide, guidedContinue, GUIDED_SENTENCE_LIMIT } from "../guided-study.js";

let session = null;
let guide = null;
let editing = null;
let selectedCollection = "";
let importSeed = "", unmountImport, listening;
let batch = {};
let batchSource = "", checkedIds = null, bulkRating = "", undoRatings = null;
let libraryTab, collectionSearch, collectionSort, openCollection;
const tabs = [["review", "Review"], ["browse", "Browse"], ["collections", "Collections"]];
let playbackSettingsOpen = false;

const safeValue = value => esc(String(value || ""));
const MODE_INSTRUCTIONS = {
  recall: "Recall the German from its English prompt, then reveal it and rate your recall.",
  listen: "Listen to each sentence and repeat it aloud. Show the German text when you need it.",
  build: "Put the German words in order, then compare your answer with the model.",
};
const ratingMode = () => sentencePreferences().mode === "listen" ? "listen" : "recall";
const filteredBatch = items => selectSentenceBatch(items, { ...batch, mode: ratingMode() });
const allExamples = lesson => (lesson?.examples || []).map((_, index) => lessonSentence(lesson, index)).filter(Boolean);
const textSizeClass = () => `sentence-size-${sentencePreferences().textSize}`;
const translationText = item => `<span data-study-prompt="${safeValue(item.en)}" lang="en">${safeValue(item.en)}</span>`;

function sentenceTranslation(item) {
  return `<details class="sentence-translation"${sentencePreferences().translation !== false ? " open" : ""}>
    <summary>${localInstruction("Translation")}</summary>${translationText(item)}</details>`;
}

function header() {
  return `<header class="sentence-page-head"><p class="practice-eyebrow">YOUR GERMAN SENTENCES</p><h1>Sentence practice</h1><p class="muted">Recall, listen to, or rebuild sentences from your lessons and collections.</p></header>`;
}

function editForm(collectionId, item) {
  if (!editing || editing.collectionId !== collectionId || editing.cardId !== item.id) return "";
  return `<div class="sentence-edit-form" role="group" aria-label="Edit saved sentence">
    <label>English prompt<input id="sentence-edit-en" maxlength="500" value="${safeValue(item.en)}"></label>
    <label>German sentence<textarea id="sentence-edit-de" maxlength="500" rows="2" lang="de">${safeValue(item.de)}</textarea></label>
    <div class="sentence-actions"><button class="btn small" type="button" data-save-sentence-edit="${safeValue(item.id)}">Save changes</button><button class="btn small ghost" type="button" data-cancel-sentence-edit>Cancel</button></div>
  </div>`;
}

function favoriteButton(id) {
  const saved = isSentenceFavorite(id);
  return `<button class="link-btn" type="button" data-sentence-favorite="${safeValue(id)}" aria-pressed="${saved}">${saved ? "★ Favorited" : "☆ Favorite"}</button>`;
}

function collectionCard(collection) {
  const isOpen = openCollection === collection.id;
  const items = isOpen ? collection.sentences.map((item, index) => `<article class="saved-sentence">
    <div class="saved-sentence-copy"><div class="saved-sentence-answer"><span lang="de">${safeValue(item.de)}</span>${speakerButton(item.de, "Play German sentence", item.voice)}</div>${sentenceTranslation(item)}${item.origin ? `<p class="small muted">${safeValue(item.origin)}</p>` : ""}</div>
    <div class="sentence-actions">${sentenceStars(item.id, ratingMode())}${favoriteButton(item.id)}${copySentenceButton(item.de)}
      <button class="link-btn" type="button" data-move-sentence="${safeValue(item.id)}" data-collection="${safeValue(collection.id)}" data-direction="-1"${index ? "" : " disabled"}>Move up</button>
      <button class="link-btn" type="button" data-move-sentence="${safeValue(item.id)}" data-collection="${safeValue(collection.id)}" data-direction="1"${index + 1 < collection.sentences.length ? "" : " disabled"}>Move down</button>
      <button class="link-btn" type="button" data-edit-sentence="${safeValue(item.id)}" data-collection="${safeValue(collection.id)}">Edit</button><button class="link-btn" type="button" data-remove-sentence="${safeValue(item.id)}" data-collection="${safeValue(collection.id)}">Remove</button></div>
    ${editForm(collection.id, item)}
  </article>`).join("") : "";
  return `<article class="sentence-collection panel">
    <div class="sentence-collection-head"><div><h3>${safeValue(collection.name)}</h3><p class="small muted">${collection.sentences.length} ${collection.sentences.length === 1 ? "sentence" : "sentences"}${collection.pinned ? " · Pinned" : ""}</p></div>
      <div class="sentence-actions"><button class="btn small" type="button" data-open-collection="${safeValue(collection.id)}" aria-expanded="${isOpen}">${isOpen ? "Close" : "Open"}</button>
      <button class="link-btn" type="button" data-pin-collection="${safeValue(collection.id)}" aria-pressed="${Boolean(collection.pinned)}">${collection.pinned ? "Unpin" : "Pin"}</button>
      <button class="link-btn" type="button" data-export-collection="${safeValue(collection.id)}"${collection.sentences.length ? "" : " disabled"}>Export TSV</button></div>
    </div>
    ${isOpen ? `<div class="sentence-actions"><button class="btn small ghost" type="button" data-study-collection="${safeValue(collection.id)}"${collection.sentences.length ? "" : " disabled"}>Practise collection</button><button class="link-btn" type="button" data-rename-collection="${safeValue(collection.id)}">Rename</button><button class="link-btn" type="button" data-delete-collection="${safeValue(collection.id)}">Delete</button></div>
    <div class="sentence-rename" id="rename-${safeValue(collection.id)}" hidden><label>Collection name<input maxlength="60" value="${safeValue(collection.name)}"></label><button class="btn small" type="button" data-save-collection-name="${safeValue(collection.id)}">Save name</button></div>
    <div class="saved-sentence-list ${textSizeClass()}">${items || `<p class="small muted">Add a sentence from a lesson or write one below.</p>`}</div>` : ""}
  </article>`;
}

function reviewSummary() {
  const { size, mode } = sentencePreferences();
  const due = dueSentences().length;
  const count = Math.min(size, due);
  return {
    due,
    title: due ? `${due} ${due === 1 ? "sentence is" : "sentences are"} due` : "No sentences due",
    help: due ? localInstruction(MODE_INSTRUCTIONS[mode]) : "Try another source or filter, practise a lesson, or save a sentence.",
    action: due ? `Practise ${count} ${count === 1 ? "sentence" : "sentences"}` : "Start review",
  };
}

function syncReviewSummary() {
  const start = document.querySelector("[data-study-due]");
  if (!start) return;
  const { due, title, help, action } = reviewSummary();
  document.getElementById("sentence-review-title").textContent = title;
  document.getElementById("sentence-review-help").textContent = help;
  start.textContent = action;
  start.disabled = !due;
}

function reviewBanner() {
  const { size, source, mode } = sentencePreferences();
  const { due, title, help, action } = reviewSummary();
  const modeOptions = Object.entries(SENTENCE_MODES).map(([value, label]) =>
    `<option value="${value}"${value === mode ? " selected" : ""}>${label}</option>`).join("");
  const sourceOptions = Object.entries(SENTENCE_SOURCES).map(([value, label]) =>
    `<option value="${value}"${value === source ? " selected" : ""}>${label}</option>`).join("");
  const sizeOptions = SENTENCE_ROUND_SIZES.map(value =>
    `<option value="${value}"${value === size ? " selected" : ""}>${value} sentences</option>`).join("");
  return `<section class="sentence-review-banner" aria-labelledby="sentence-review-title">
    <div><p class="practice-eyebrow">SPACED SENTENCE REVIEW</p><h2 id="sentence-review-title" aria-live="polite">${title}</h2>
    <p id="sentence-review-help">${help}</p></div>
    <div class="sentence-review-controls">
      <label>Practice mode<select id="sentence-review-mode">${modeOptions}</select></label>
      <label>Review source<select id="sentence-review-source">${sourceOptions}</select></label>
      <label>Round size<select id="sentence-review-size">${sizeOptions}</select></label>
      <button class="btn" type="button" data-study-due${due ? "" : " disabled"}>${action}</button>
      <a class="tlink small" href="#/settings?section=review">Daily Smart Review settings</a>
    </div>
  </section>`;
}

function options(choices, selected) {
  return choices.map(([value, label]) => `<option value="${value}"${value === selected ? " selected" : ""}>${label}</option>`).join("");
}

const practiceModeControl = () => `<label>Practice mode<select id="sentence-review-mode">${options(Object.entries(SENTENCE_MODES), sentencePreferences().mode)}</select></label>`;

function practiceTools() {
  const stars = [1, 2, 3, 4, 5];
  const ranges = stars.flatMap(low => stars.filter(high => high > low).map(high => [`${low}-${high}`, `${low}–${high} stars`]));
  const statuses = [["all", "All"], ["due", "Due"], ["unrated", "Unrated"], ["favorites", "Favorites"],
    ...stars.map(value => [String(value), `Exactly ${value} ★`]), ...ranges];
  const orders = [["original", "Original order"], ["easiest", "Easiest first"], ["hardest", "Hardest first"]];
  const lessons = LEVELS.map(level => `<optgroup label="${safeValue(level.name)}">${level.lessons.filter(lesson => lesson.examples?.length)
    .map(lesson => `<option value="${lesson.key}"${lesson.key === batchSource ? " selected" : ""}>${safeValue(lesson.title)}</option>`).join("")}</optgroup>`).join("");
  const collections = savedSentenceCollections();
  const sources = collections.length ? `<optgroup label="Collections">${collections.map(item =>
    `<option value="${safeValue(item.id)}"${item.id === batchSource ? " selected" : ""}>${safeValue(item.name)}</option>`).join("")}</optgroup>` : "";
  const { textSize, translation, feedback } = sentencePreferences();
  return `<section class="panel sentence-tool-panel" aria-labelledby="sentence-browse-heading"><h2 id="sentence-browse-heading">Browse sentences</h2>
    <div class="sentence-review-controls"><label>Source<select id="sentence-lesson-source"><option value="">Choose a source</option>${lessons}${sources}</select></label>${practiceModeControl()}</div>
    <p class="small muted">The range applies to the matching sentences in the selected order.</p>
    <div class="sentence-review-controls">
      <label>Search sentences<input id="sentence-batch-search" data-batch="search" type="search" maxlength="120" placeholder="Separate terms with commas" value="${safeValue(batch.search)}"></label>
      <label>Filter<select id="sentence-batch-filter" data-batch="filter">${options(statuses, batch.filter)}</select></label>
      <label>Order<select id="sentence-batch-order" data-batch="order">${options(orders, batch.order)}</select></label>
      <label>From<input id="sentence-batch-from" data-batch="from" type="number" min="1" step="1" value="${batch.from || 1}"></label>
      <label>To<input id="sentence-batch-to" data-batch="to" type="number" min="1" step="1" value="${batch.to || ""}" placeholder="Last"></label>
      <div class="sentence-actions" aria-label="Quick range">${[0, 10, 20].map(size => `<button class="btn small ghost" type="button" data-quick-range="${size}">${size || "All"}</button>`).join("")}</div>
      <label>Sentence text size<select id="sentence-text-size">${options([["small", "A−"], ["normal", "A"], ["large", "A+"], ["largest", "A++"]], textSize)}</select></label>
      <label class="sentence-check"><input id="sentence-show-translation" type="checkbox"${translation !== false ? " checked" : ""}> Show translations</label>
      <label>Rating feedback<select id="sentence-rating-feedback">${options([["first", "First 3"], ["always", "Always"], ["off", "Off"]], feedback)}</select></label>
    </div>
    <div id="sentence-batch-preview">${batchPreview()}</div>
  </section>`;
}

function practiceGuide() {
  return `<details class="panel sentence-tool-panel"><summary>How to practise sentences</summary><ol>
    <li>Listen to the German and repeat it aloud at a comfortable speed.</li>
    <li>Build the sentence from words to notice its structure.</li>
    <li>Try saying or writing the German from the English prompt in Active recall.</li>
    <li>Reveal the model and rate how well you recalled it. Difficult sentences return sooner.</li>
  </ol><button type="button" class="btn small ghost" data-practice-tour>Try the guided round</button></details>`;
}

function sourceBatch() {
  const lesson = SETS.get(batchSource);
  if (lesson?.examples) return { items: filteredBatch(allExamples(lesson)), label: lesson.title };
  const collection = savedSentenceCollections().find(group => group.id === batchSource);
  return { items: filteredBatch(collection?.sentences || []), label: collection?.name || "" };
}

function batchSelection(items) {
  return checkedIds ? items.filter(item => checkedIds.has(item.id)) : items;
}

function batchPreview() {
  const undo = undoRatings ? '<div class="sentence-actions"><p class="small" role="status">Batch ratings updated.</p><button class="link-btn" type="button" data-undo-ratings>Undo</button></div>' : "";
  if (!batchSource) return undo;
  const { items } = sourceBatch();
  if (!items.length) return `${undo}<p class="small muted">No sentences match these filters.</p>`;
  const selection = batchSelection(items);
  const selected = new Set(selection.map(item => item.id));
  const disabled = selection.length ? "" : " disabled";
  const collections = savedSentenceCollections();
  const destinations = [[LESSON_SENTENCE_COLLECTION, "Lesson sentences"], ...collections
    .filter(item => item.id !== LESSON_SENTENCE_COLLECTION).map(item => [safeValue(item.id), safeValue(item.name)])];
  return `${undo}<div class="sentence-batch-bar">
    <div class="sentence-actions">
      <strong role="status">${selection.length} of ${items.length} selected</strong>
      <button class="link-btn" type="button" data-toggle-selection>${selection.length === items.length ? "Clear selection" : "Select all"}</button>
      <button class="btn small" type="button" data-study-lesson${disabled}>Practise</button>
      <button class="btn small ghost" type="button" data-play-selection${disabled}>Play</button>
      <button class="link-btn" type="button" data-challenge-batch${disabled}>Scored Challenge</button>
    </div>
    <div class="sentence-review-controls sentence-batch-actions">
      <label>Save to<select id="sentence-batch-destination">${options(destinations, safeValue(selectedCollection))}</select></label>
      <button class="btn small ghost" type="button" data-save-batch${disabled}>Save</button>
      <label>${ratingMode() === "listen" ? "Shadowing" : "Recall"} rating<select id="sentence-bulk-rating">${options([["", "Choose a rating"], ...[1, 2, 3, 4, 5].map(value => [String(value), `${value} ★`]), ["0", "Clear ratings"]], bulkRating)}</select></label>
      <button class="btn small ghost" type="button" data-rate-batch${disabled}>Rate</button>
    </div></div>
    <ol class="sentence-preview-list ${textSizeClass()}">${items.map((item, index) => `<li class="${checkedIds && selected.has(item.id) ? "sentence-row-selected" : ""}">
      <div class="sentence-preview-copy"><input type="checkbox" data-select-row="${index}"${selected.has(item.id) ? " checked" : ""} aria-label="Select sentence ${index + 1}"><div><b lang="de" class="sentence-preview-text">${safeValue(item.de)}</b>${sentenceTranslation(item)}</div></div>
      <div class="sentence-actions">
      ${speakerButton(item.de, "Play German sentence", item.voice)}${favoriteButton(item.id)}${copySentenceButton(item.de)}${sentenceStars(item.id, ratingMode())}</div>
    </li>`).join("")}</ol>`;
}

function refreshBatchPreview(focus) {
  const preview = document.getElementById("sentence-batch-preview");
  if (!preview) return;
  preview.innerHTML = batchPreview();
  if (focus) preview.querySelector(focus)?.focus({ preventScroll: true });
  refreshInterface(preview);
  refreshSentencePrompts(preview);
}

function library() {
  const navigation = `<div class="study-tabs" role="group" aria-label="Sentence practice library">${tabs.map(([id, label]) =>
    `<button class="btn small ghost" type="button" data-sentence-tab="${id}" aria-pressed="${id === libraryTab}">${label}</button>`).join("")}</div>`;
  return `${header()}${navigation}${libraryTab === "browse" ? practiceTools() : libraryTab === "collections" ? collectionsPage() : reviewPage()}`;
}

function reviewPage() {
  const { items, completed, total } = smartReviewPlan();
  return `${reviewBanner()}
    <section class="panel"><h2>Today's Smart Review</h2>
      <p class="muted">${total ? `${completed} of ${total} sentences complete today.` : "Choose a review source in Settings to build a daily round."}</p>
      <div class="sentence-actions"><button class="btn small" type="button" data-daily-review${items.length ? "" : " disabled"}>Start Smart Review</button>
        <button class="btn small ghost" type="button" data-daily-challenge${items.length ? "" : " disabled"}>Try Challenge</button></div>
    </section>${practiceGuide()}`;
}

function collectionList(collections = savedSentenceCollections()) {
  const query = collectionSearch.trim().toLocaleLowerCase();
  const matching = collections.filter(item => item.name.toLocaleLowerCase().includes(query))
    .sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)) ||
      (collectionSort === "size" ? b.sentences.length - a.sentences.length : 0) || a.name.localeCompare(b.name));
  return matching.map(collectionCard).join("") || `<div class="panel sentence-empty"><h3>${query ? "No matching collections" : "No collections yet"}</h3><p>${query ? "Try another search." : "Create one here or save a lesson example."}</p></div>`;
}

function refreshCollections(focus) {
  const list = document.getElementById("sentence-collection-list");
  if (!list) return;
  list.innerHTML = collectionList();
  refreshInterface(list);
  refreshSentencePrompts(list);
  if (focus) list.querySelector(focus)?.focus({ preventScroll: true });
}

function exportCollection(id) {
  const collection = savedSentenceCollections().find(item => item.id === id);
  if (!collection?.sentences.length) return;
  const cell = text => text.replace(/[\t\r\n]+/g, " ");
  const tsv = collection.sentences.map(({ de, en }) => `${cell(de)}\t${cell(en)}`).join("\n");
  const url = URL.createObjectURL(new Blob([tsv], { type: "text/tab-separated-values;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `${collection.name.replace(/[^\p{L}\p{N}_ -]/gu, "").trim() || "sentences"}.tsv`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function collectionsPage() {
  const collections = savedSentenceCollections();
  const selected = collections.find(item => item.id === selectedCollection)?.id ?? collections[0]?.id;
  return `<section class="sentence-collections" aria-labelledby="sentence-collections-title">
    <div class="sentence-section-heading"><h2 id="sentence-collections-title">Your collections</h2><a class="tlink" href="#/practice">Open practice workbook</a></div>
    <div class="sentence-review-controls">
      <label>Search collections<input id="sentence-collection-search" type="search" value="${safeValue(collectionSearch)}"></label>
      <label>Sort<select id="sentence-collection-sort">${options([["name", "Name"], ["size", "Most sentences"]], collectionSort)}</select></label>
      ${practiceModeControl()}
    </div>
    ${sentenceImport(collections, importSeed)}
    <details class="panel sentence-create-panel"${openCollection && selected === openCollection && !collections.find(item => item.id === selected)?.sentences.length ? " open" : ""}><summary>Create a collection or add a sentence</summary>
    <div class="sentence-create-grid">
      <div class="panel sentence-form-panel"><h2>Create a collection</h2><p class="small muted">Group sentences by topic, situation, or what you want to remember.</p><label for="new-sentence-collection">Collection name</label><div class="sentence-form-row"><input id="new-sentence-collection" maxlength="60" placeholder="e.g. At the doctor"><button class="btn small" type="button" data-create-collection>Create</button></div></div>
      <div class="panel sentence-form-panel"><h2>Add your own sentence</h2><p class="small muted">Write an English prompt and its German version. When signed in, your collections sync with your progress.</p>
        ${collections.length ? `<label for="sentence-add-collection">Collection</label><select id="sentence-add-collection">${collections.map(collection => `<option value="${safeValue(collection.id)}"${collection.id === selected ? " selected" : ""}>${safeValue(collection.name)}</option>`).join("")}</select>
          <label for="sentence-add-en">English prompt</label><input id="sentence-add-en" maxlength="500" placeholder="What do you want to say?">
          <label for="sentence-add-de">German sentence</label><textarea id="sentence-add-de" maxlength="500" rows="2" lang="de" placeholder="Write the German sentence"></textarea><button class="btn small" type="button" data-add-sentence>Add sentence</button>`
          : `<p class="small muted">Create a collection first, then add a sentence here.</p>`}
      </div>
    </div></details>
    <div id="sentence-collection-list">${collectionList(collections)}</div>
  </section>`;
}

function modelAnswer(item, actions) {
  return `<div id="sentence-reveal" class="sentence-reveal"><p id="sentence-model" lang="de" tabindex="-1">${safeValue(item.de)}</p>
    ${speakerButton(item.de, "Listen to the German sentence", item.voice)}${actions}</div>`;
}

function recallExercise(item) {
  const ratings = [[1, "Again"], [2, "Hard"], [3, "Good"], [4, "Easy"], [5, "Mastered"]];
  const { feedback } = sentencePreferences();
  const explain = feedback === "always" || (feedback === "first" && session.practised.length < 3);
  return `<label class="sentence-answer-input" for="sentence-answer">${localInstruction("Try saying or writing your answer before revealing it")}<textarea id="sentence-answer" lang="de" maxlength="500" rows="3" data-lenis-prevent>${safeValue(session.draft)}</textarea></label>
    <button class="btn" type="button" data-reveal-sentence aria-expanded="${session.revealed}" aria-controls="sentence-reveal">${localInstruction(session.revealed ? "Hide answer" : "Reveal German")}</button>
    ${session.revealed ? `<div id="sentence-reveal" class="sentence-reveal"><p id="sentence-model" lang="de" tabindex="-1">${safeValue(item.de)}</p>
      ${playbackControls(true)}
      <div class="sentence-rating"><p>${localInstruction("How well did you know it?")}</p>
      <div class="sentence-rating-options">${ratings.map(([rating, label]) => `<button class="btn small${rating === 1 ? " ghost" : ""}" type="button" data-rate-sentence="${rating}">${localInstruction(label)} <span class="sr">, ${rating}</span>
      ${session.tour ? "" : `<small>${SENTENCE_INTERVALS[rating - 1] ? `In ${SENTENCE_INTERVALS[rating - 1]} ${rating === 2 ? "day" : "days"}` : "Today"}</small>`}</button>`).join("")}</div>
      ${explain ? `<p class="small muted">Again comes back today. Stronger ratings wait longer.</p>` : ""}</div></div>` : `<div id="sentence-reveal" hidden></div>`}`;
}

function playbackControls(recall = false) {
  const { repeats, pause, languagePause, paired, pairEveryRepeat, autoplay, loop, translation } = sentencePreferences();
  return `<div class="sentence-playback-block">
    <div class="sentence-audio-tools">
      <button class="btn small" type="button" data-play-shadowing aria-label="Play sentence"${listening ? " disabled" : ""}>${localInstruction("Play")}</button>
      <button class="btn small ghost" type="button" data-open-playback aria-controls="sentence-playback-options" aria-expanded="${playbackSettingsOpen}">Audio <span data-current-audio-speed>${audioPlaybackSpeed()}×</span></button>
      <button class="btn small ghost" type="button" data-stop-listening${listening ? "" : " disabled"}>Stop playback</button>
      ${recall ? "" : `<button class="link-btn" type="button" data-toggle-transcript aria-controls="sentence-transcript" aria-expanded="false">${localInstruction("Show German text")}</button>`}
    </div>
    <div class="sentence-playback-quick" role="group" aria-label="Quick playback settings">
      ${recall ? "" : `<label class="sentence-check"><input type="checkbox" id="sentence-round-translation"${translation !== false ? " checked" : ""}> ${localInstruction("Show translations")}</label>`}
      <label class="sentence-check"><input type="checkbox" data-playback="paired"${paired ? " checked" : ""}> Dual audio</label>
    </div>
    <div class="sentence-playback" id="sentence-playback-options"${playbackSettingsOpen ? "" : " hidden"}><div class="sentence-review-controls">
      ${audioSpeedControl("sentence-playback-speed", "Speed")}
      <label>Repeats<select data-playback="repeats">${options(SENTENCE_REPEATS.map(value => [value, value]), repeats)}</select></label>
      <label>Pause between repeats and sentences (s)<input type="number" data-playback="pause" min="0" max="10" step="0.5" value="${pause}"></label>
      <label>Translation-to-German gap (s)<input type="number" data-playback="languagePause" min="0" max="10" step="0.5" value="${languagePause}"${paired ? "" : " disabled"}></label>
      <label class="sentence-check"><input type="checkbox" data-playback="pairEveryRepeat"${pairEveryRepeat ? " checked" : ""}${paired ? "" : " disabled"}> Translate before every repeat</label>
      ${recall ? "" : `
      <label class="sentence-check"><input type="checkbox" data-playback="autoplay"${autoplay ? " checked" : ""}> Auto-advance through round</label>
      <label>Loop<select data-playback="loop">${options([["off", "Off"], ["sentence", "This sentence"], ["batch", "Whole batch"]], loop)}</select></label>`}
    </div><p class="small muted">Speed applies across Sprachpfad. The other settings apply the next time you start this player. Translations and any explicitly selected browser voice use your browser’s speech service.</p></div>
    <p class="small muted" id="sentence-playback-status" role="status"></p></div>`;
}

function listenExercise(item) {
  return `<p>${localInstruction(MODE_INSTRUCTIONS.listen)}</p>
    ${playbackControls()}
    <p class="sentence-transcript" id="sentence-transcript" lang="de" hidden>${safeValue(item.de)}</p>
    ${session.tour ? "" : `<div class="sentence-rating"><p>${localInstruction("How well did you know it?")}</p>${sentenceStars(item.id, "listen")}
    <p id="sentence-listen-feedback" class="small muted" role="status"></p></div>`}
    <div class="sentence-round-actions"><button class="btn ghost" type="button" data-skip-sentence>${localInstruction("Skip")}</button>
    <button class="btn" type="button" data-practised-sentence>${localInstruction("Next sentence")}</button></div>`;
}

function buildExercise(item) {
  const { words, order, placed, feedback } = session.builder;
  if (session.revealed) return `${feedback ? `<p role="status">${feedback}</p>` : ""}${modelAnswer(item,
    `<div class="sentence-rating"><button class="btn" type="button" data-practised-sentence>${localInstruction("Next sentence")}</button></div>` )}`;
  const tile = (index, placedTile) => `<button class="practice-chunk" type="button"
    ${placedTile ? `data-remove-word="${index}" aria-label="Remove ${safeValue(words[index])}"`
      : `data-build-word="${index}"${placed.includes(index) ? " disabled" : ""}`}>${safeValue(words[index])}</button>`;
  return `<p>${localInstruction("Choose the words in order. Select a word in your answer to move it back.")}</p>
    <div class="practice-built" aria-label="Your sentence" lang="de">${placed.length ? placed.map(index => tile(index, true)).join("") : `<span lang="en" class="muted">Your sentence goes here</span>`}</div>
    <div class="practice-chunks" aria-label="Available words" lang="de">${order.map(index => tile(index, false)).join("")}</div>
    <div class="sentence-actions sentence-build-actions">
      <button class="btn" type="button" data-check-build${placed.length === words.length ? "" : " disabled"}>${localInstruction("Check order")}</button>
      <button class="link-btn" type="button" data-clear-build${placed.length ? "" : " disabled"}>${localInstruction("Clear")}</button>
      <button class="link-btn" type="button" data-reveal-build>${localInstruction("Reveal model")}</button>
    </div>
    ${feedback ? `<p id="sentence-build-feedback" class="sentence-build-feedback" role="status" tabindex="-1">${feedback}</p>` : ""}`;
}

function roundSummary() {
  const { practised, items, mode } = session;
  const count = practised.length;
  const skipped = items.length - count;
  if (session.tour) return `<section class="sentence-session-done"><h1 id="sentence-focus-title" tabindex="-1">Walkthrough complete</h1>
    <p>You’ve listened, recalled, and rebuilt a sentence. Your practice ratings and daily review were untouched.</p>
    <button class="btn" type="button" data-back-to-library>Back to sentence practice</button></section>`;
  if (guide) return `<section class="sentence-session-done"><h1 id="sentence-focus-title" tabindex="-1">Sentence review complete</h1>
    <p>You practised ${count} ${count === 1 ? "sentence" : "sentences"}${skipped ? ` and skipped ${skipped}` : ""}.</p>${guidedContinue(guide)}</section>`;
  return `<section class="sentence-session-done"><p class="practice-eyebrow">ROUND COMPLETE</p><h1 id="sentence-focus-title" tabindex="-1">Round complete</h1>
    <p>You practised ${count} ${count === 1 ? "sentence" : "sentences"}${skipped ? ` and skipped ${skipped}` : ""}.</p>
    ${session.challenge ? `<p class="sentence-round-points">Challenge score <strong>${session.points} / ${items.length * 10}</strong></p>` : ""}
    ${mode !== "recall" && count ? `<p>Recall these sentences to rate how well you remember them and schedule the next review.</p>` : ""}
    <div class="sentence-actions">
      ${mode !== "recall" && count ? `<button class="btn" type="button" data-recall-round>Recall these sentences</button>` : ""}
      <button class="btn ghost" type="button" data-back-to-library>${backLabel()}</button>
    </div>
  </section>`;
}

function backLabel() {
  if (guide) return "Back to Home";
  if (session.tour) return "Exit walkthrough";
  return localInstruction(session.lessonBack ? "Back to lesson" : libraryTab === "collections" ? "Back to collections" : libraryTab === "browse" ? "Back to browse" : "Back to review");
}

export function teacherContext() {
  const item = session?.items[session.index];
  if (!item) return null;
  const hidden = session.mode !== 'listen' && !session.revealed;
  return { label: `Sentence practice · ${session.index + 1}`, mode: hidden ? 'hint' : 'study',
    text: [!hidden && item.de, item.en].filter(Boolean).join('\n') };
}

function focusSession() {
  const item = session.items[session.index];
  if (!item) return roundSummary();
  const exercise = { recall: recallExercise, listen: listenExercise, build: buildExercise }[session.mode];
  const progress = session.index + 1;
  return `<section class="sentence-focus ${textSizeClass()}" aria-labelledby="sentence-focus-title">
    <div class="sentence-session-top"><button class="link-btn" type="button" data-back-to-library>${backLabel()}</button><span>${safeValue(session.label)} · ${session.tour ? `Step ${session.tour} of 3` : `${progress} of ${session.items.length}`}</span>${session.tour ? "" : favoriteButton(item.id)}</div>
    <progress max="${session.items.length}" value="${session.index}" aria-label="Sentence practice progress"></progress>
    <p class="practice-eyebrow">${session.challenge ? `Challenge · ${session.points} points` : localInstruction(SENTENCE_MODES[session.mode])}</p>
    <h1 id="sentence-focus-title" class="sentence-focus-prompt" tabindex="-1">${session.mode === "listen" && sentencePreferences().translation === false ? localInstruction("Listen to the sentence") : translationText(item)}</h1>
    ${session.mode === "listen" && sentencePreferences().translation === false ? sentenceTranslation(item) : ""}
    ${session.mode === "recall" && !session.tour && !session.revealed && !hasShadowedSentence(item.id) ? `<p class="small muted">New to this sentence? <button class="link-btn" type="button" data-shadow-first>Listen to this batch first</button></p>` : ""}
    ${exercise(item)}
    ${session.mode === "listen" ? "" : `<button class="link-btn sentence-skip" type="button" data-skip-sentence>${localInstruction("Skip sentence")}</button>`}
  </section>`;
}

function paint(focus = "") {
  const app = document.getElementById("app");
  if (!app) return;
  app.innerHTML = session ? focusSession() : library();
  refreshInterface(app);
  refreshSentencePrompts(app);
  if (focus) app.querySelector(focus)?.focus({ preventScroll: true });
}

function prepareSentence(round) {
  round.revealed = false;
  round.draft = "";
  round.builder = null;
  const item = round.items[round.index];
  if (round.mode !== "build" || !item) return;
  const words = item.de.trim().split(/\s+/u);
  const order = shuffle(words.map((_, index) => index));
  if (order.every((index, position) => words[index] === words[position])) {
    const different = words.findIndex(word => word !== words[0]);
    if (different !== -1) [order[0], order[different]] = [order[different], order[0]];
  }
  round.builder = { words, order, placed: [], feedback: "", attempts: 0, points: 0 };
}

function makeSession(items, label, mode = sentencePreferences().mode) {
  if (!items.length) return null;
  const round = { items: [...items], label, mode, index: 0, practised: [] };
  prepareSentence(round);
  return round;
}

const dueSession = () => makeSession(dueSentences().slice(0, sentencePreferences().size), "Due sentences");

function dailySession(challenge = false, limit) {
  const { items } = smartReviewPlan(!challenge);
  const round = makeSession(items.slice(0, limit), challenge ? "Daily Challenge" : "Today's Smart Review", challenge ? "build" : sitePreferences().reviewMode);
  if (round) Object.assign(round, { smart: !challenge, challenge, points: 0, reviewBack: true });
  return round;
}

function begin(next) {
  if (!next) return;
  stopListening();
  session = next;
  scrollToTop();
  paint("#sentence-focus-title");
}

function advanceRound(practised, fromPlayback = false, loopBatch = false) {
  if (!fromPlayback) stopListening();
  const item = session.items[session.index];
  if (session.tour && session.tour < 3) {
    session.mode = session.tour++ === 1 ? "recall" : "build";
  } else {
    if (practised && !session.tour) {
      if (!session.practised.includes(item)) session.practised.push(item);
      logSentenceActivity(item, session.mode, { smart: session.smart });
      const points = session.challenge ? session.builder.points : 0;
      if (points) {
        session.points += points;
        logSentenceActivity(item, "challenge", { points });
      }
    }
    session.index++;
    if (loopBatch && session.index === session.items.length) session.index = 0;
  }
  prepareSentence(session);
  paint("#sentence-focus-title");
  scrollToTop();
}

function returnToLibrary() {
  stopListening();
  const destination = session?.lessonBack || (session?.reviewBack ? "#/" : null);
  session = null;
  editing = null;
  if (destination) location.hash = destination;
  else {
    if (new URLSearchParams(location.hash.split("?")[1]).has("mode")) history.replaceState(null, "", "#/sentences");
    paint('[data-sentence-tab][aria-pressed="true"]');
    scrollToTop();
  }
}

function syncPlaybackControls(message = "") {
  const play = document.querySelector("[data-play-shadowing]");
  const stop = document.querySelector("[data-stop-listening]");
  const status = document.getElementById("sentence-playback-status");
  if (play) play.disabled = Boolean(listening);
  if (stop) stop.disabled = !listening;
  if (status) status.textContent = message;
}

function stopListening(keepMedia = false) {
  listening?.abort();
  listening = null;
  stopAudio();
  if (keepMedia && navigator.mediaSession) navigator.mediaSession.playbackState = "paused";
  else setMediaControls();
  syncPlaybackControls();
}

async function playListeningRound() {
  if (listening) return;
  const control = listening = new AbortController();
  const round = session;
  const { repeats, pause, languagePause, paired, pairEveryRepeat, autoplay, loop } = sentencePreferences();
  const recall = round.mode === "recall";
  const batchLoop = !recall && !round.tour && loop === "batch";
  const singleLoop = !recall && !round.tour && loop === "sentence";
  const auto = !recall && !round.tour && (autoplay || batchLoop || round.playSelection);
  const moveTrack = step => {
    if (recall || session !== round) return;
    stopListening();
    const next = round.index + step;
    round.index = batchLoop ? (next + round.items.length) % round.items.length : Math.min(round.items.length, Math.max(0, next));
    prepareSentence(round);
    paint();
    if (round.items[round.index]) void playListeningRound();
  };
  let message = "";
  try {
    while (!control.signal.aborted && session === round) {
      const item = round.items[round.index];
      if (!item) break;
      const button = document.querySelector("[data-play-shadowing]");
      const prompt = promptFor(item.en);
      if (!round.tour) setMediaControls({ title: item.de, artist: "Sprachpfad", album: round.label }, {
        play: () => { if (session === round) void playListeningRound(); },
        pause: () => stopListening(true), stop: () => stopListening(),
        ...(recall ? {} : { nexttrack: () => moveTrack(1), previoustrack: () => moveTrack(-1) }),
      });
      let played = false;
      for (let repeat = 1; repeat <= repeats && !control.signal.aborted; repeat++) {
        if (paired && (repeat === 1 || pairEveryRepeat)) {
          syncPlaybackControls("Translation audio");
          const heard = await playAudioLine(prompt.text, button, { language: prompt.language });
          if (heard) await waitBetweenLines(languagePause, control.signal);
          if (control.signal.aborted) return;
        }
        syncPlaybackControls(`German audio ${repeat} of ${repeats}`);
        const started = performance.now();
        played = await playAudioLine(item.de, button, { voice: item.voice });
        if (!played) break;
        if (!round.tour) logSentenceActivity(item, null, { repetitions: 1, seconds: (performance.now() - started) / 1000 });
        noteStudyActivity();
        if (repeat < repeats || auto || singleLoop) {
          syncPlaybackControls("Repeat the German aloud");
          await waitBetweenLines(pause, control.signal);
        }
      }
      if (control.signal.aborted || session !== round) return;
      if (!played) { message = "German audio is unavailable for this sentence. You can still show the German text."; break; }
      if (singleLoop) continue;
      if (!auto || round.tour) { message = "Playback complete. Repeat aloud or play it again."; break; }
      if (!round.practised.includes(item)) logPractice();
      advanceRound(true, true, batchLoop);
    }
  } finally {
    if (listening === control) {
      listening = null;
      setMediaControls();
      syncPlaybackControls(message);
    }
  }
}

function updateFavorite(button) {
  const id = button.dataset.sentenceFavorite;
  const favorite = toggleSentenceFavorite(id);
  for (const control of document.querySelectorAll(`[data-sentence-favorite="${id}"]`)) {
    control.setAttribute("aria-pressed", String(favorite));
    control.textContent = favorite ? "★ Favorited" : "☆ Favorite";
  }
}

function changeBuilder(data, item) {
  const builder = session.builder;
  if (!builder || session.revealed) return;
  if (data.buildWord !== undefined) {
    const index = Number(data.buildWord);
    if (!builder.order.includes(index) || builder.placed.includes(index)) return;
    builder.placed.push(index);
    builder.feedback = "";
    paint("[data-build-word]:not(:disabled), [data-check-build]:not(:disabled)");
  } else if (data.removeWord !== undefined) {
    const index = Number(data.removeWord);
    builder.placed = builder.placed.filter(placed => placed !== index);
    builder.feedback = "";
    paint(`[data-build-word="${index}"]`);
  } else if (data.clearBuild !== undefined) {
    builder.placed = [];
    builder.feedback = "";
    paint("[data-build-word]");
  } else if (data.revealBuild !== undefined) {
    builder.feedback = "";
    session.revealed = true;
    paint("#sentence-model");
  } else if (data.checkBuild !== undefined && builder.placed.length === builder.words.length) {
    const response = builder.placed.map(index => builder.words[index]).join(" ");
    session.revealed = norm(response) === norm(item.de);
    if (session.revealed && session.challenge) builder.points = builder.attempts ? 5 : 10;
    builder.attempts++;
    builder.feedback = session.revealed ? "That matches the model." : "The order differs from the model. Move some words and try again.";
    paint(session.revealed ? "#sentence-model" : "#sentence-build-feedback");
  }
}

function onRoundClick(button) {
  const data = button.dataset;
  const item = session.items[session.index];
  if (data.backToLibrary !== undefined) { returnToLibrary(); return; }
  if (data.recallRound !== undefined && !item) {
    const next = makeSession(session.practised, session.label, "recall");
    if (next) Object.assign(next, { smart: session.followupSmart, lessonBack: session.lessonBack, reviewBack: session.reviewBack });
    begin(next);
    return;
  }
  if (!item) return;
  if (data.starId) {
    if (applySentenceStar(button)) {
      const feedback = document.getElementById("sentence-listen-feedback");
      const setting = sentencePreferences().feedback;
      session.ratingNotes ??= new Set();
      if (feedback && (setting === "always" || (setting === "first" && (session.ratingNotes.size < 3 || session.ratingNotes.has(item.id))))) {
        session.ratingNotes.add(item.id);
        feedback.textContent = "Shadowing confidence is saved separately from your Recall rating.";
      }
    }
    return;
  }
  if (data.sentenceFavorite) { updateFavorite(button); return; }
  if (data.skipSentence !== undefined) { advanceRound(false); return; }
  if (data.playShadowing !== undefined) { void playListeningRound(); return; }
  if (data.openPlayback !== undefined) {
    const options = document.getElementById("sentence-playback-options");
    playbackSettingsOpen = options.hidden;
    options.hidden = !playbackSettingsOpen;
    button.setAttribute("aria-expanded", String(playbackSettingsOpen));
    if (playbackSettingsOpen) document.getElementById("sentence-playback-speed")?.focus();
    return;
  }
  if (data.stopListening !== undefined) {
    stopListening();
    document.querySelector("[data-play-shadowing]")?.focus();
    return;
  }

  if (session.mode === "recall") {
    if (data.shadowFirst !== undefined) {
      const next = makeSession(session.items.slice(session.index), session.label, "listen");
      Object.assign(next, { followupSmart: session.smart, lessonBack: session.lessonBack, reviewBack: session.reviewBack });
      begin(next);
    } else if (data.revealSentence !== undefined) {
      session.revealed = !session.revealed;
      if (!session.revealed) stopListening();
      paint(session.revealed ? "#sentence-model" : "[data-reveal-sentence]");
    } else if (data.rateSentence && session.revealed) {
      if (session.tour || rateSentence(item.id, Number(data.rateSentence))) advanceRound(true);
      else {
        returnToLibrary();
        toast("That sentence is no longer in your review queue.");
      }
    }
    return;
  }

  if (data.practisedSentence !== undefined && (session.mode === "listen" || session.revealed)) {
    if (!session.tour) logPractice();
    advanceRound(true);
  } else if (session.mode === "build") {
    changeBuilder(data, item);
  } else if (data.toggleTranscript !== undefined) {
    const transcript = document.getElementById("sentence-transcript");
    transcript.hidden = !transcript.hidden;
    button.setAttribute("aria-expanded", String(!transcript.hidden));
    button.textContent = localInstruction(transcript.hidden ? "Show German text" : "Hide German text");
  }
}

export function render() {
  session = null;
  guide = currentGuide();
  editing = null;
  selectedCollection = "";
  batch = {};
  batchSource = "";
  checkedIds = null;
  bulkRating = "";
  undoRatings = null;
  collectionSearch = "";
  collectionSort = "name";
  openCollection = "";
  playbackSettingsOpen = false;
  const params = new URLSearchParams(location.hash.split("?")[1] || "");
  const checkpoint = params.get("checkpoint")?.match(/^(a1|a2|b1)-(\d+)$/);
  const workshop = checkpoint && LEVEL_BY_ID[checkpoint[1]]?.course?.modules.find(item => item.id === Number(checkpoint[2]))?.workshop;
  const part = params.get("part");
  importSeed = part === "reading" ? workshop?.reading?.text || "" : part === "listening" ? workshop?.listening?.audioText || "" : "";
  if (params.get("mode") === "due") session = dueSession();
  if (params.get("mode") === "smart") session = dailySession(false, guide ? GUIDED_SENTENCE_LIMIT : undefined);
  if (params.get("mode") === "challenge") session = dailySession(true);
  const lesson = SETS.get(params.get("lesson"));
  const tab = params.get("tab");
  libraryTab = importSeed ? "collections" : tabs.some(([id]) => id === tab) ? tab : lesson?.examples ? "browse" : "review";
  if (libraryTab === "browse" && !lesson?.examples) batchSource = currentLevel().lessons.find(item => item.examples?.length)?.key || "";
  if (lesson?.examples) {
    batchSource = lesson.key;
    if (params.has("start")) {
      session = makeSession(allExamples(lesson), lesson.title);
      if (session) session.lessonBack = `#/${lesson.level.id}/lektion/${lesson.id}?part=examples`;
    }
    if (params.has("resume")) {
      const { next, seenIndices } = lessonSentenceProgress(lesson);
      const remaining = lesson.examples.map((_, offset) => (next + offset) % lesson.examples.length)
        .filter(index => !seenIndices.includes(index)).map(index => lessonSentence(lesson, index)).filter(Boolean);
      session = makeSession(remaining.length ? remaining : allExamples(lesson), lesson.title);
    }
  }
  if (session) return focusSession();
  if (guide) return `<section class="sentence-session-done"><h1 id="sentence-focus-title" tabindex="-1">Sentence review is up to date</h1>${guidedContinue(guide)}</section>`;
  return library();
}

export function onClick(_event, button) {
  if (!button) return;
  if (session) { onRoundClick(button); return; }
  const data = button.dataset;
  if (data.sentenceTab) {
    libraryTab = data.sentenceTab;
    if (libraryTab === "browse" && !batchSource) batchSource = currentLevel().lessons.find(lesson => lesson.examples?.length)?.key || "";
    history.replaceState(null, "", libraryTab === "review" ? "#/sentences" : `#/sentences?tab=${libraryTab}`);
    paint(`[data-sentence-tab="${libraryTab}"]`);
    return;
  }
  if (data.dailyReview !== undefined || data.dailyChallenge !== undefined) {
    const round = dailySession(data.dailyChallenge !== undefined);
    if (round) { round.reviewBack = false; begin(round); }
    return;
  }
  if (data.openCollection) {
    openCollection = openCollection === data.openCollection ? "" : data.openCollection;
    editing = null;
    refreshCollections(`[data-open-collection="${data.openCollection}"]`);
    return;
  }
  if (data.pinCollection) {
    toggleSentenceCollectionPin(data.pinCollection);
    refreshCollections(`[data-pin-collection="${data.pinCollection}"]`);
    return;
  }
  if (data.exportCollection) { exportCollection(data.exportCollection); return; }
  if (data.copySentence) { void copySentence(data.copySentence); return; }
  if (data.starId) {
    if (applySentenceStar(button)) {
      syncReviewSummary();
      if ((batch.filter && !["all", "favorites"].includes(batch.filter)) || (batch.order && batch.order !== "original")) {
        refreshBatchPreview();
      }
    }
    return;
  }
  if (data.practiceTour !== undefined) {
    const sample = { id: "tour", de: "Ich lerne Deutsch.", en: "I am learning German." };
    const tour = makeSession([sample], "Guided practice", "listen");
    tour.tour = 1;
    begin(tour);
    return;
  }
  if (data.toggleSelection !== undefined) {
    const { items } = sourceBatch();
    checkedIds = batchSelection(items).length === items.length ? new Set() : null;
    refreshBatchPreview("[data-toggle-selection]");
    return;
  }
  if (data.undoRatings !== undefined && undoRatings) {
    const restored = undoRatings();
    undoRatings = null;
    refreshBatchPreview("[data-rate-batch]");
    toast(restored ? `Restored ${restored} ${restored === 1 ? "rating" : "ratings"}.` : "The ratings have changed since that batch.");
    return;
  }
  if (data.quickRange !== undefined) {
    batch.from = 1;
    batch.to = Number(data.quickRange);
    document.getElementById("sentence-batch-from").value = 1;
    document.getElementById("sentence-batch-to").value = batch.to || "";
    checkedIds = null;
    refreshBatchPreview();
    syncReviewSummary();
    return;
  }
  if (data.createCollection !== undefined) {
    const field = document.getElementById("new-sentence-collection");
    const id = createSentenceCollection(field?.value || "");
    if (!id) { field?.focus(); return; }
    selectedCollection = id;
    openCollection = id;
    collectionSearch = "";
    paint();
    document.querySelector(".sentence-create-panel").open = true;
    document.getElementById("sentence-add-en")?.focus({ preventScroll: true });
    return;
  }
  if (data.addSentence !== undefined) {
    const collectionId = document.getElementById("sentence-add-collection")?.value;
    const en = document.getElementById("sentence-add-en")?.value;
    const de = document.getElementById("sentence-add-de")?.value;
    if (!collectionId || !en?.trim() || !de?.trim()) { toast("Add both the English prompt and German sentence."); return; }
    const result = saveSentenceToCollection(collectionId, { en, de });
    if (!result) { toast("Add both the English prompt and German sentence."); return; }
    if (result.limit) { toast("Your collections have reached the 200 sentence limit. Remove a sentence before adding another."); return; }
    selectedCollection = collectionId;
    openCollection = collectionId;
    paint("#sentence-add-en");
    document.querySelector(".sentence-create-panel").open = true;
    document.getElementById("sentence-add-en").focus({ preventScroll: true });
    toast("Sentence added to your collection and review queue.");
    return;
  }
  if (data.studyDue !== undefined) { begin(dueSession()); return; }
  if (data.sentenceFavorite) {
    updateFavorite(button);
    if (batch.filter === "favorites") refreshBatchPreview("[data-toggle-selection]");
    syncReviewSummary();
    return;
  }
  if (data.moveSentence) {
    const direction = Number(data.direction);
    if (moveSavedSentence(data.collection, data.moveSentence, direction)) {
      paint(`[data-collection="${data.collection}"][data-move-sentence="${data.moveSentence}"]:not(:disabled)`);
    }
    return;
  }
  if (data.studyLesson !== undefined || data.playSelection !== undefined || data.challengeBatch !== undefined) {
    const { items, label } = sourceBatch();
    const play = data.playSelection !== undefined, challenge = data.challengeBatch !== undefined;
    const round = makeSession(batchSelection(items), label, play ? "listen" : challenge ? "build" : sentencePreferences().mode);
    if (!round) return;
    Object.assign(round, { challenge, points: 0, playSelection: play });
    begin(round);
    if (play) void playListeningRound();
    return;
  }
  if (data.saveBatch !== undefined || data.rateBatch !== undefined) {
    const selection = batchSelection(sourceBatch().items);
    if (data.saveBatch !== undefined) {
      selectedCollection = document.getElementById("sentence-batch-destination").value;
      const result = saveSentenceBatch(selectedCollection, selection);
      if (result.limit) { toast("This selection would exceed the 200 sentence collection limit."); return; }
      if (result.added) paint("[data-save-batch]");
      toast(result.added ? `${result.added} sentences saved.` : "These sentences are already in that collection.");
    } else {
      const field = document.getElementById("sentence-bulk-rating");
      if (!field.value) { field.focus(); return; }
      const rating = Number(field.value);
      const undo = setSentenceBatchRatings(selection.map(item => item.id), rating, ratingMode());
      if (undo) {
        undoRatings = undo;
        refreshBatchPreview("[data-undo-ratings]");
      } else toast("Those ratings are already set.");
    }
    return;
  }
  if (data.studyCollection) {
    const collection = savedSentenceCollections().find(item => item.id === data.studyCollection);
    if (collection) {
      const round = makeSession(collection.sentences, collection.name);
      if (round) begin(round);
      else toast("No sentences in this collection match those filters.");
    }
    return;
  }
  if (data.renameCollection) {
    const field = document.getElementById(`rename-${data.renameCollection}`);
    if (field) { field.hidden = !field.hidden; field.querySelector("input")?.focus({ preventScroll: true }); }
    return;
  }
  if (data.saveCollectionName) {
    const field = document.getElementById(`rename-${data.saveCollectionName}`);
    const name = field?.querySelector("input")?.value;
    if (!renameSentenceCollection(data.saveCollectionName, name)) { field?.querySelector("input")?.focus(); return; }
    paint(); toast("Collection name updated."); return;
  }
  if (data.deleteCollection) {
    const collection = savedSentenceCollections().find(item => item.id === data.deleteCollection);
    if (collection && confirm(`Delete “${collection.name}” and its saved sentences?`)) {
      deleteSentenceCollection(collection.id); editing = null; paint(); toast("Collection deleted.");
    }
    return;
  }
  if (data.editSentence) {
    editing = { collectionId: data.collection, cardId: data.editSentence };
    paint("#sentence-edit-en"); return;
  }
  if (data.cancelSentenceEdit !== undefined) { editing = null; paint(); return; }
  if (data.saveSentenceEdit) {
    const ok = updateSavedSentence(editing?.collectionId, data.saveSentenceEdit, {
      en: document.getElementById("sentence-edit-en")?.value,
      de: document.getElementById("sentence-edit-de")?.value,
    });
    if (!ok) { toast("Both sentence fields are required."); return; }
    editing = null; paint(); toast("Sentence updated."); return;
  }
  if (data.removeSentence) {
    if (confirm("Remove this sentence from the collection?")) {
      removeSavedSentence(data.collection, data.removeSentence); editing = null; paint();
    }
    return;
  }
}

export function onChange(event) {
  const { id, value, checked, dataset } = event.target;
  if (id === "sentence-bulk-rating") bulkRating = value;
  if (id === "sentence-batch-destination") selectedCollection = value;
  if (id === "sentence-collection-sort") { collectionSort = value; refreshCollections(); return; }
  if (dataset.selectRow !== undefined) {
    const { items } = sourceBatch();
    const item = items[Number(dataset.selectRow)];
    if (!item) return;
    checkedIds ??= new Set(items.map(row => row.id));
    if (checked) checkedIds.add(item.id);
    else checkedIds.delete(item.id);
    refreshBatchPreview(`[data-select-row="${dataset.selectRow}"]`);
    return;
  }
  if (id === "sentence-round-translation") {
    setSentencePreferences({ translation: checked });
    const transcriptOpen = document.getElementById("sentence-transcript")?.hidden === false;
    paint("#sentence-round-translation");
    if (transcriptOpen) document.querySelector("[data-toggle-transcript]")?.click();
    syncPlaybackControls();
    return;
  }
  if (id === "sentence-add-collection") selectedCollection = value;
  if (dataset?.playback) {
    const key = dataset.playback;
    const changes = { [key]: event.target.type === "checkbox" ? checked : key === "loop" ? value : event.target.valueAsNumber ?? Number(value) };
    setSentencePreferences(changes);
    const pref = sentencePreferences();
    if (event.target.type === "number") event.target.value = pref[key];
    if (key === "paired") document.querySelectorAll('[data-playback="languagePause"], [data-playback="pairEveryRepeat"]').forEach(control => { control.disabled = !checked; });
    return;
  }
  if (id === "sentence-text-size" || id === "sentence-show-translation" || id === "sentence-rating-feedback") {
    const previousSize = textSizeClass();
    if (id === "sentence-text-size") setSentencePreferences({ textSize: value });
    if (id === "sentence-show-translation") setSentencePreferences({ translation: checked });
    if (id === "sentence-rating-feedback") setSentencePreferences({ feedback: value });
    if (id === "sentence-text-size") document.querySelectorAll(`.${previousSize}`).forEach(element => element.classList.replace(previousSize, textSizeClass()));
    if (id === "sentence-show-translation") document.querySelectorAll(".sentence-translation").forEach(element => { element.open = checked; });
    return;
  }
  if (id === "sentence-lesson-source") {
    batchSource = value;
    checkedIds = null;
    refreshBatchPreview();
    return;
  }
  if (dataset?.batch) {
    const field = dataset.batch;
    batch[field] = field === "from" || field === "to" ? Math.max(0, Math.floor(Number(value) || 0)) : value;
    checkedIds = null;
    refreshBatchPreview();
    syncReviewSummary();
    return;
  }
  if (id === "sentence-review-source") setSentencePreferences({ source: value });
  else if (id === "sentence-review-size") setSentencePreferences({ size: Number(value) });
  else if (id === "sentence-review-mode") {
    setSentencePreferences({ mode: value });
    checkedIds = null;
    bulkRating = "";
    document.querySelectorAll(".saved-sentence .sentence-stars").forEach(row => {
      row.outerHTML = sentenceStars(row.querySelector("[data-star-id]").dataset.starId, ratingMode());
    });
    refreshBatchPreview();
  }
  else return;
  syncReviewSummary();
  toast("Sentence review settings saved.");
}

function onInput(event) {
  if (event.target.id === "sentence-answer" && session) session.draft = event.target.value;
  if (event.target.id === "sentence-batch-search") onChange(event);
  if (event.target.id === "sentence-collection-search") { collectionSearch = event.target.value; refreshCollections(); }
}

export function mount() {
  document.addEventListener("input", onInput);
  refreshSentencePrompts(document.getElementById("app"));
  unmountImport = mountSentenceImport(document.getElementById("app"), ({ id, added }) => {
    selectedCollection = id;
    openCollection = id;
    collectionSearch = "";
    importSeed = "";
    paint(`[data-open-collection="${id}"]`);
    toast(`${added} ${added === 1 ? "sentence" : "sentences"} added to the collection.`);
  });
  const title = document.getElementById("sentence-focus-title");
  title?.focus({ preventScroll: true });
  if (!motionOK()) return;
  if (document.querySelector(".sentence-page-head, .sentence-review-banner")) enter(".sentence-page-head, .sentence-review-banner", { y: 8, duration: 0.42 });
  if (title && sentencePreferences().language === "en") splitReveal(title, { duration: 0.58 });
}

export function unmount() {
  document.removeEventListener("input", onInput);
  unmountImport?.();
  stopListening();
}
