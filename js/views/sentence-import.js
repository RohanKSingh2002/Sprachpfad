import { importSentencePairs } from "../state.js";
import { esc } from "../utils.js";
import { audioVoices, playAudioLine } from "../ui/audio.js";

export function sentenceImport(collections, seed = "") {
  return `<details class="panel sentence-import"${seed ? " open" : ""}>
    <summary>Import sentences</summary>
    <p>Paste German or English text to split it into sentences, or paste one German and English pair per line, separated by a tab. Review the pairs before saving.</p>
    <form data-sentence-import-draft>
      <label>Input format<select name="format"><option value="de">German text</option><option value="en">English text</option><option value="pairs">German and English pairs</option></select></label>
      <label>Text to import<textarea name="source" rows="5" maxlength="20000" required data-lenis-prevent>${esc(seed)}</textarea></label>
      <button class="btn small" type="submit">Preview sentences</button>
    </form>
    <p class="small" data-import-status role="status"></p>
    <form data-sentence-import-review hidden>
      <h3 tabindex="-1">Review your pairs</h3>
      <p class="small muted">Complete both languages and correct any split or translation before saving.</p>
      <div data-import-rows></div>
      <div class="sentence-actions"><button class="btn small ghost" type="button" data-import-translate hidden>Draft missing translations</button></div>
      <div class="sentence-review-controls">
        <label>German playback voice<select name="voice"><option value="">Automatic</option></select></label>
        <button class="btn small ghost" type="button" data-preview-import-voice>Preview voice</button>
      </div>
      <label>Save to<select name="collection"><option value="">New collection</option>${collections.map(item => `<option value="${esc(item.id)}">${esc(item.name)}</option>`).join("")}</select></label>
      <label>New collection name<input name="collectionName" maxlength="60" value="Imported sentences"></label>
      <button class="btn small" type="submit">Save reviewed pairs</button>
    </form>
  </details>`;
}

export function parseSentenceImport(text, format) {
  if (typeof text !== "string" || text.length > 20000 || !["de", "en", "pairs"].includes(format)) {
    return { error: "Choose a format and enter up to 20,000 characters." };
  }
  const lines = text.trim().split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  let pairs;
  if (format === "pairs") {
    const columns = lines.map(line => line.split("\t").map(part => part.trim()));
    if (columns.some(row => row.length !== 2 || !row.every(Boolean))) {
      return { error: "Each line needs a German sentence, a tab, and an English translation." };
    }
    pairs = columns.map(([de, en]) => ({ de, en }));
  } else {
    const segmenter = typeof Intl.Segmenter === "function" ? new Intl.Segmenter(format, { granularity: "sentence" }) : null;
    const sentences = lines.flatMap(line => segmenter ? [...segmenter.segment(line)].map(item => item.segment) : line.split(/(?<=[.!?])\s+/u));
    pairs = sentences.map(sentence => ({ de: "", en: "", [format]: sentence.trim() })).filter(pair => pair[format]);
  }
  if (!pairs.length || pairs.length > 40) return { error: "Preview between 1 and 40 sentences at a time." };
  if (pairs.some(({ de, en }) => de.length > 500 || en.length > 500)) return { error: "Split lines longer than 500 characters before importing." };
  return { pairs };
}

function reviewRow(pair, index) {
  return `<fieldset data-import-row><legend>Sentence ${index + 1}</legend>
    <label>German<textarea name="de" maxlength="500" rows="2" lang="de" required>${esc(pair.de)}</textarea></label>
    <label>English<textarea name="en" maxlength="500" rows="2" lang="en" required>${esc(pair.en)}</textarea></label>
    <button class="link-btn" type="button" data-drop-import-row>Remove row</button>
  </fieldset>`;
}

export function mountSentenceImport(root, onSaved) {
  const controller = new AbortController();
  const { signal } = controller;
  function updateVoices() {
    const field = root.querySelector('[data-sentence-import-review] [name="voice"]');
    if (!field) return;
    const voices = audioVoices();
    const selection = field.value;
    field.innerHTML = `<option value="">Automatic</option>${voices.map(voice =>
      `<option value="${esc(voice.voiceURI)}">${esc(voice.name)} · ${esc(voice.lang)}</option>`).join("")}`;
    if (voices.some(voice => voice.voiceURI === selection)) field.value = selection;
  }
  globalThis.speechSynthesis?.addEventListener?.("voiceschanged", updateVoices, { signal });
  root.addEventListener("submit", event => {
    const form = event.target;
    const panel = form.closest(".sentence-import");
    if (!panel) return;
    event.preventDefault();
    const status = panel.querySelector("[data-import-status]");
    const values = new FormData(form);
    if (form.matches("[data-sentence-import-draft]")) {
      const format = values.get("format");
      const draft = parseSentenceImport(values.get("source"), format);
      const review = panel.querySelector("[data-sentence-import-review]");
      if (draft.error) { review.hidden = true; status.textContent = draft.error; return; }
      review.querySelector("[data-import-rows]").innerHTML = draft.pairs.map(reviewRow).join("");
      updateVoices();
      const translate = review.querySelector("[data-import-translate]");
      translate.hidden = format === "pairs" || !globalThis.Translator?.create;
      translate.dataset.sourceLanguage = format;
      review.hidden = false;
      status.textContent = `${draft.pairs.length} ${draft.pairs.length === 1 ? "sentence" : "sentences"} ready for review.`;
      review.querySelector("h3").focus();
    } else {
      const pairs = [...form.querySelectorAll("[data-import-row]")].map(row => ({
        de: row.querySelector('[name="de"]').value, en: row.querySelector('[name="en"]').value,
      }));
      const result = importSentencePairs(values.get("collection"), pairs, values.get("collectionName"), values.get("voice"));
      if (result.error) { status.textContent = result.error; status.scrollIntoView({ block: "nearest" }); }
      else onSaved(result);
    }
  }, { signal });

  root.addEventListener("change", event => {
    const field = event.target;
    if (field.name !== "collection" || !field.form?.matches("[data-sentence-import-review]")) return;
    field.form.elements.collectionName.closest("label").hidden = Boolean(field.value);
  }, { signal });

  root.addEventListener("click", async event => {
    const button = event.target.closest("button");
    if (!button?.closest(".sentence-import")) return;
    if (button.hasAttribute("data-preview-import-voice")) {
      const text = [...button.form.querySelectorAll('[name="de"]')].find(field => field.value.trim())?.value || "Hallo, ich lerne Deutsch.";
      button.disabled = true;
      await playAudioLine(text.trim(), button, { voice: button.form.elements.voice.value });
      if (button.isConnected) button.disabled = false;
      return;
    }
    if (button.hasAttribute("data-drop-import-row")) {
      const row = button.closest("[data-import-row]");
      const form = button.form;
      const next = row.nextElementSibling || row.previousElementSibling;
      row.remove();
      (next?.querySelector("textarea") || form?.querySelector('[name="collection"]'))?.focus();
      return;
    }
    if (!button.hasAttribute("data-import-translate") || button.disabled) return;
    const sourceLanguage = button.dataset.sourceLanguage;
    const targetLanguage = sourceLanguage === "de" ? "en" : "de";
    const form = button.form;
    const rows = [...form.querySelectorAll("[data-import-row]")];
    const status = button.closest(".sentence-import").querySelector("[data-import-status]");
    button.disabled = true;
    status.textContent = "Preparing the browser translator. The first use may download a language pack.";
    let translator;
    try {
      translator = await globalThis.Translator.create({ sourceLanguage, targetLanguage, signal });
      for (const row of rows) {
        if (signal.aborted || !form.isConnected) return;
        if (!row.isConnected) continue;
        const source = row.querySelector(`[name="${sourceLanguage}"]`);
        const target = row.querySelector(`[name="${targetLanguage}"]`);
        if (!source.value.trim() || target.value.trim()) continue;
        const original = source.value;
        const text = await translator.translate(original, { signal });
        if (row.isConnected && source.value === original && !target.value.trim()) target.value = text.trim().slice(0, 500);
      }
      if (rows.some(row => row.isConnected)) status.textContent = "Draft translations are ready to check and edit.";
    } catch {
      if (!signal.aborted) status.textContent = "Translation is unavailable here. Enter the missing translations in the preview.";
    } finally {
      translator?.destroy();
      button.disabled = false;
    }
  }, { signal });
  return () => controller.abort();
}
