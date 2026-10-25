// Flashcards: tap to flip, swipe right (or press →) if you knew it, left (←) to see it again.
//
// Every answer feeds the review queue (state.js): a word you knew comes back after 1, 3, 7, 14 and
// then 30 days, a word you missed comes back today. The "Due today" deck is what the queue wants to
// see now, and each of its cards says why it is back. "New words" is today's ten words from the
// level's topics; once answered they join the queue too.

import { ALL_WORDS, LEVELS, LEVEL_BY_ID, SETS, WORDS, pluralText, setLabel, wordsOfLevel } from "../content.js";
import {
  addedToday,
  currentLevel,
  dueCount,
  dueWords,
  knownIn,
  NEW_PER_DAY,
  nextDue,
  nextTopic,
  rateWord,
  reviewOf,
  wordsToLearn,
} from "../state.js";
import { speakerButton } from "../ui/audio.js";
import { updateDueBadges } from "../ui/duebadge.js";
import { tilt } from "../ui/effects.js";
import { SPEAKER_ICON } from "../ui/icons.js";
import { Draggable, enter, gsap, motionOK } from "../ui/motion.js";
import { daysBetween, esc, shuffle, todayKey } from "../utils.js";
import { breadcrumb } from "./shared.js";

let scope = null; // the chosen deck, see deckScope()
let deck = []; // cards still to go
let deckWords = []; // every word in the chosen deck
let pos = 0;
let lastDrag = 0;
let deciding = false;
let focusNext = false; // give the next card keyboard focus once it's dealt
let focusDeckMenu = false; // the deck was switched from the keyboard: keep focus on the menu
let menuByPointer = false; // the deck menu was last used with a mouse or finger

// After a deck is picked with the keyboard, focus stays on the menu (its arrow keys keep working);
// after a pick with the mouse, focus goes to the page, so the arrow keys steer the cards.
document.addEventListener("pointerdown", (e) => (menuByPointer = e.target?.id === "deck"), true);
document.addEventListener("keydown", (e) => e.target?.id === "deck" && (menuByPointer = false), true);
let drag = null;
let stopTilt = null;

const unique = (words) => words.filter((w, i) => words.indexOf(w) === i);

/**
 * The deck from the URL: ?l=due, ?l=new, ?l=all, a level (?l=a2), a lesson (?l=a2-3), a topic
 * (?l=a1-food) or, from older links, an A1 lesson number (?l=3). Without one: the words due for
 * review if there are any, else the current level.
 */
function deckScope() {
  let v = new URLSearchParams(location.hash.split("?")[1] || "").get("l") || "";
  if (/^\d+$/.test(v)) v = `a1-${v}`;
  if (v === "due" || (!v && dueCount() > 0)) return { value: "due", due: true, level: null };
  if (v === "new") {
    const level = currentLevel();
    return { value: v, fresh: true, level, words: wordsToLearn(level) };
  }
  if (v === "all") return { value: v, words: ALL_WORDS, level: null };
  if (LEVEL_BY_ID[v]) return { value: v, words: wordsOfLevel(LEVEL_BY_ID[v]), level: LEVEL_BY_ID[v] };
  const set = SETS.get(v);
  if (set) return { value: v, words: unique(set.vocab.map((w) => w.de)), level: set.level, set };
  const level = currentLevel();
  return { value: level.id, words: wordsOfLevel(level), level };
}

const dueLabel = () => `Due today (${dueCount()})`;
const newLabel = () => `New words (${wordsToLearn(currentLevel()).length})`;

function deckOptions(selected) {
  const option = (value, label) =>
    `<option value="${value}"${value === selected ? " selected" : ""}>${esc(label)}</option>`;
  const groups = LEVELS.map((lv) => {
    const lessons = lv.lessons.map((l) => option(l.key, `${lv.name} lesson ${l.position}: ${l.germanTitle}`)).join("");
    const topics = lv.topics.map((t) => option(t.key, `${lv.name} topic: ${t.title}`)).join("");
    return (
      `<optgroup label="${lv.name}">${option(lv.id, `All ${lv.name} words`)}${lessons}</optgroup>` +
      (topics ? `<optgroup label="${lv.name} topics">${topics}</optgroup>` : "")
    );
  }).join("");
  return option("due", dueLabel()) + option("new", newLabel()) + option("all", "All levels") + groups;
}

function buildDeck() {
  if (scope.due) deck = dueWords().map((w) => WORDS.get(w)); // most urgent first
  else if (scope.fresh) deck = scope.words.map((w) => WORDS.get(w)); // in topic order
  else deck = shuffle(scope.words.map((w) => WORDS.get(w)));
  deckWords = deck.map((c) => c.de);
  pos = 0;
}

/** The topic a word is new from (for the "New words" deck): the first of the level's topics that has it. */
const topicOf = (word) => scope.level.topics.find((t) => t.vocab.some((w) => w.de === word));

/** Why a card is in the deck, shown on its front: { text, kind: "new" | "missed" | "seen" }, or null. */
function reason(word) {
  if (scope.fresh) return { text: `New: ${topicOf(word)?.title ?? scope.level.name}`, kind: "new" };
  if (!scope.due) return null;
  const r = reviewOf(word);
  if (!r || !r.seen) {
    if (r?.box) return { text: "Marked known before", kind: "seen" };
    const from = SETS.get(r?.from) || WORDS.get(word).from;
    return { text: `New from ${setLabel(from)}`, kind: "new" };
  }
  if (r.missed) return { text: "Missed last time", kind: "missed" };
  const days = daysBetween(r.seen, todayKey());
  return { text: days === 1 ? "Last seen yesterday" : `Last seen ${days} days ago`, kind: "seen" };
}

/** "tomorrow", "in 3 days" */
function whenDue(date) {
  const days = daysBetween(todayKey(), date);
  return days === 1 ? "tomorrow" : `in ${days} days`;
}

function intro() {
  if (scope.due) {
    return `Words come back just before you'd forget them: after 1, 3, 7, 14 and 30 days when you know them, the same day when you don't. Due now: <b class="num" id="dueNum">${deck.length}</b>.`;
  }
  if (scope.fresh) {
    return `Up to ${NEW_PER_DAY} new words a day ${scope.level.course ? "from your current module and earlier vocabulary gaps" : `from the ${scope.level.name} topics`}. Once you answer a card, the word joins your review queue. New words left today: <b class="num" id="newNum">${deck.length}</b>.`;
  }
  return `Tap the card to see the meaning. Words known in this deck: <b class="num" id="knownNum">${knownIn(deckWords)}</b> of ${deckWords.length}.`;
}

/** Every word of a topic deck (or today's new words) with its plural and example, to read or hear. */
function wordList() {
  if (!scope.set && !scope.fresh) return "";
  if (!deck.length) return "";
  const rows = deck
    .map((w) => {
      const pl = pluralText(w);
      const forms = (pl ? `<span class="pl"${w.pl.length > 2 ? ' lang="de"' : ""}>${esc(pl)}</span>` : "") + (w.forms ? `<span class="pl" lang="de">${esc(w.forms)}</span>` : "");
      const ex = w.ex
        ? `<div class="wl-ex">${speakerButton(w.ex.de)}<div><div class="de-line" lang="de">${esc(w.ex.de)}</div><div class="en-line">${esc(w.ex.en)}</div></div></div>`
        : "";
      return `<li><div class="wl-word">${speakerButton(w.de)}<div><b lang="de">${esc(w.de)}</b>${forms}</div><span class="wl-en">${esc(w.en)}</span></div>${ex}</li>`;
    })
    .join("");
  const label = scope.fresh ? "Today's new words" : `All ${deck.length} words in this topic`;
  return `<details class="word-list"><summary>${label}</summary><ul>${rows}</ul></details>`;
}

export function render() {
  scope = deckScope();
  buildDeck();
  const home = scope.level || currentLevel();
  return `
  ${breadcrumb(home, "Flashcards")}
  <div class="cards-head">
    <div><h1>Flashcards</h1><p class="muted">${intro()}</p></div>
    <label class="deck-select">Deck <select id="deck">${deckOptions(scope.value)}</select></label>
  </div>
  <div class="deck" id="deckbox"></div>
  <div class="card-actions" id="cardActions">
    <button class="btn ghost" type="button" data-again>Again</button>
    <button class="spk big" type="button" id="cardSay" data-say="" aria-label="Play audio">${SPEAKER_ICON}</button>
    <button class="btn" type="button" data-known>I knew it</button>
  </div>
  <div class="meter" aria-hidden="true"><i id="cardMeter"></i></div>
  <p class="muted center small num" id="cardCount" style="margin-top:10px"></p>
  <p class="muted center small" id="cardHint">Swipe right if you knew it, left to see it again. With the card selected, the arrow keys work too.</p>
  ${wordList()}`;
}

/** What to show when the deck is empty. */
function emptyPanel() {
  const panel = (title, text, links) =>
    `<div class="panel center"><h2 class="h3">${title}</h2><p class="center">${text}</p>${links}</div>`;
  if (scope.fresh) {
    const level = scope.level;
    const topic = nextTopic(level);
    const due = dueCount();
    const review = due ? `<a class="btn" href="#/karten?l=due">Review ${due} ${due === 1 ? "word" : "words"}</a>` : "";
    if (!topic) {
      return panel(
        level.course ? 'Module vocabulary in review' : `Every ${level.name} topic started`,
        level.course ? 'The vocabulary for your current module is in your review queue. Complete its lessons and checkpoint to bring in the next module’s words.' : `All the words from the ${level.name} topics are in your review queue.`,
        `<div class="btn-row">${review || `<a class="btn" href="#/karten?l=${level.id}">Practise all ${level.name} words</a>`}${level.course ? `<a class="btn ghost" href="#/${level.id}/roadmap">Continue your module</a>` : ''}</div>`,
      );
    }
    const more = `<a class="btn${review ? " ghost" : ""}" href="#/karten?l=${topic.key}">Keep going: ${esc(topic.title)}</a>`;
    const learned = addedToday();
    return panel(
      "That's today's new words",
      `You've met ${learned} new ${learned === 1 ? "word" : "words"} today. Tomorrow brings ten more.`,
      `<div class="btn-row">${review}${more}</div>`,
    );
  }
  if (!scope.due) {
    return panel(
      "Deck finished",
      "Every card in this deck is marked known.",
      `<button class="btn" type="button" data-reshuffle>Shuffle this deck again</button>`,
    );
  }
  const next = nextDue();
  const level = currentLevel();
  const title = deckWords.length ? "All caught up" : "Nothing due right now";
  const text = next
    ? `The next ${next.count === 1 ? "word comes" : `${next.count} words come`} back ${whenDue(next.date)}.`
    : "Finish a lesson or learn some new words, and they join the review queue.";
  return panel(title, text, `<a class="btn" href="#/karten?l=${level.id}">Practise all ${level.name} words</a>`);
}

function updateCounts() {
  const known = document.getElementById("knownNum");
  if (known) known.textContent = knownIn(deckWords);
  const due = document.getElementById("dueNum");
  if (due) due.textContent = dueCount();
  const fresh = document.getElementById("newNum");
  if (fresh) fresh.textContent = deck.length;
  const dueOption = document.querySelector('#deck option[value="due"]');
  if (dueOption) dueOption.textContent = dueLabel();
  const newOption = document.querySelector('#deck option[value="new"]');
  if (newOption) newOption.textContent = newLabel();
  updateDueBadges();
}

/** Long German words get a smaller size so they fit the card. */
function wordSize(text) {
  const longest = Math.max(...text.split(/\s+/).map((s) => s.length));
  return longest > 15 ? " xlong" : longest > 11 ? " long" : "";
}

function backFace(card) {
  const pl = pluralText(card);
  const plural = pl ? ` · <span${card.pl.length > 2 ? ' lang="de"' : ""}>${esc(pl)}</span>` : "";
  const ex = card.ex
    ? `<span class="ex"><span lang="de">${esc(card.ex.de)}</span><span class="ex-en">${esc(card.ex.en)}</span></span>`
    : "";
  const verbs = card.forms ? `<span class="verb-forms" lang="de">${esc(card.forms)}</span>` : "";
  return `<div class="face back${card.ex ? " has-ex" : ""}"><span class="word${wordSize(card.en)}">${esc(card.en)}</span><span class="forms"><span lang="de">${esc(card.de)}</span>${plural}</span>${verbs}${ex}</div>`;
}

function drawCard() {
  const box = document.getElementById("deckbox");
  if (!box) return;
  unmount();
  deciding = false;
  const actions = document.getElementById("cardActions");
  const count = document.getElementById("cardCount");
  const meter = document.getElementById("cardMeter");
  const cleared = deckWords.length ? (deckWords.length - deck.length) / deckWords.length : 1;
  meter.style.width = `${Math.round(cleared * 100)}%`;
  if (!deck.length) {
    box.className = "deck empty";
    box.innerHTML = emptyPanel();
    enter(box.firstChild, { y: 20, scale: 0.97 });
    actions.hidden = true;
    document.getElementById("cardHint").hidden = true;
    count.textContent = "";
    if (focusNext) box.querySelector("a, button")?.focus({ preventScroll: true });
    focusNext = false;
    return;
  }
  box.className = "deck";
  actions.hidden = false;
  document.getElementById("cardHint").hidden = false;
  const index = pos % deck.length;
  const card = deck[index];
  box.classList.toggle('has-verb-forms', !!card.forms);
  const why = reason(card.de);
  const badge = why ? `<span class="why is-${why.kind}">${esc(why.text)}</span>` : "";
  const hint = !scope.due && !scope.fresh && knownIn([card.de]) ? "Marked known before" : "Tap to flip";
  box.innerHTML = `<div class="flash" id="flash" tabindex="0" role="button" aria-label="${esc(card.de)}. Press Enter to flip.">
    <span class="swipe yes" aria-hidden="true">Wusste ich</span><span class="swipe no" aria-hidden="true">Nochmal</span>
    <div class="flash-inner">
      <div class="face front">${badge}<span class="word${wordSize(card.de)}" lang="de">${esc(card.de)}</span><span class="hint">${hint}</span></div>
      ${backFace(card)}
    </div></div>`;
  document.getElementById("cardSay").dataset.say = card.de;
  count.textContent = `${index + 1} of ${deck.length}`;
  const el = document.getElementById("flash");
  if (focusNext) el.focus({ preventScroll: true });
  focusNext = false;
  if (!motionOK()) return;
  // the next card is dealt off the top of the stack (opacity, not visibility: it may already have focus)
  gsap.from(el, { y: 26, scale: 0.94, rotation: -1.5, opacity: 0, duration: 0.65, ease: "expo.out" });
  stopTilt = tilt(el, { max: 6, while: () => !drag?.isDragging });
  if (!Draggable) return;
  drag = Draggable.create(el, {
    type: "x",
    onDrag() {
      gsap.set(el, { rotation: this.x / 22 });
      el.classList.toggle("lean-yes", this.x > 50);
      el.classList.toggle("lean-no", this.x < -50);
    },
    onDragEnd() {
      lastDrag = Date.now();
      el.classList.remove("lean-yes", "lean-no");
      if (this.x > 110) decide(1);
      else if (this.x < -110) decide(-1);
      else gsap.to(el, { x: 0, rotation: 0, duration: 0.4, ease: "back.out(1.7)" });
    },
  })[0];
}

function flipCard() {
  document.getElementById("flash")?.classList.toggle("flipped");
}

/**
 * dir 1: knew it (the card leaves this deck), dir -1: see it again (it stays, further back).
 * `focusCard` moves keyboard focus to the next card, e.g. after a mouse click on a button.
 */
function decide(dir, { focusCard = false } = {}) {
  const el = document.getElementById("flash");
  if (!el || deciding || !deck.length) return;
  deciding = true;
  focusNext = focusCard || document.activeElement === el;
  unmount();
  const done = () => {
    const index = pos % deck.length;
    rateWord(deck[index].de, dir > 0);
    if (dir > 0) {
      deck.splice(index, 1);
      pos = deck.length ? index % deck.length : 0;
    } else {
      pos++;
    }
    updateCounts();
    drawCard();
  };
  if (motionOK()) {
    gsap.to(el, {
      x: dir * Math.max(window.innerWidth * 0.6, 380),
      rotation: dir * 18,
      opacity: 0,
      duration: 0.28,
      ease: "power2.in",
      onComplete: done,
    });
  } else {
    done();
  }
}

/** Switching deck is animated by this page itself (see router.js). */
export const updatesInPlace = true;

export function mount(param, { sameKind } = {}) {
  drawCard();
  if (focusDeckMenu) document.getElementById("deck")?.focus({ preventScroll: true });
  focusDeckMenu = false;
  if (sameKind) return;
  enter(".crumb, .cards-head > div, .deck-select", { y: 14, stagger: 0.06 });
  enter("#cardActions > *, .meter, #cardCount, #cardHint, .word-list", { y: 10, stagger: 0.05, delay: 0.25 });
}

export function unmount() {
  if (drag) {
    drag.kill();
    drag = null;
  }
  stopTilt?.();
  stopTilt = null;
}

export function onClick(e, button) {
  if (!button) {
    if (e.target.closest("#flash") && Date.now() - lastDrag > 350) flipCard();
    return;
  }
  const d = button.dataset;
  // e.detail is 0 when a button is pressed from the keyboard: keep focus on it then
  if (d.known !== undefined) decide(1, { focusCard: e.detail > 0 });
  else if (d.again !== undefined) decide(-1, { focusCard: e.detail > 0 });
  else if (d.reshuffle !== undefined) {
    document.getElementById("app").innerHTML = render();
    mount();
  }
}

/** Arrow keys only steer the card when it, or the page itself, has focus, and never with Alt, Ctrl,
 *  Cmd or Shift held (Alt+← is the browser's Back). On a button, link or menu they belong to that
 *  control. */
const steersCard = (e) =>
  !(e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) &&
  (e.target === document.body || e.target.id === "app" || e.target.id === "flash");

export function onKeydown(e) {
  if ((e.key === "Enter" || e.key === " ") && e.target.id === "flash") {
    e.preventDefault();
    flipCard();
    return;
  }
  if ((e.key === "ArrowRight" || e.key === "ArrowLeft") && steersCard(e)) {
    e.preventDefault();
    decide(e.key === "ArrowRight" ? 1 : -1);
  }
}

export function onChange(e) {
  if (e.target.id !== "deck") return;
  focusDeckMenu = !menuByPointer;
  location.hash = `#/karten?l=${e.target.value}`;
}
