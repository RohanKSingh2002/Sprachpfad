// Split-flap departure board. Like a station board, it flips from what it showed last to the new
// text: each changed cell rattles through a few letters before landing; unchanged cells stay still.

import { clockText, esc } from "../utils.js";
import { gsap, motionOK, onLeave } from "./motion.js?v=20261113-polish1";

const UPPER = "ABCDEFGHIJKLMNOPRSTUVWZÄÖÜ";
const LOWER = "abcdefghiklmnoprstuvwzäöüß";
const DIGITS = "0123456789";
const NBSP = " ";

const lastText = new Map(); // board id → text it showed last

const shown = (ch) => (ch === " " ? NBSP : esc(ch));

const cellHTML = (ch) =>
  `<span class="cell" data-c="${esc(ch)}"><span class="t"><i>${shown(ch)}</i></span><span class="b"><i>${shown(ch)}</i></span><span class="t lt"><i>${shown(ch)}</i></span><span class="b lb"><i>${shown(ch)}</i></span></span>`;

const clockHTML = () => [...clockText()].map((ch) => `<span class="clock-digit">${ch}</span>`).join("");

/**
 * @param {object} o
 * @param {string} o.id     which board this is ("home", "notfound"), so it can flip on from its last text
 * @param {string} o.text   what the board flips to (keep it to `cells` characters)
 * @param {string} o.foot   HTML for the line under the board
 * @param {string} o.label  accessible name for the whole board
 */
export function boardHTML({ id, text, foot, label, cells = 19, head = "Nächster Halt" }) {
  const from = (lastText.get(id) || "").padEnd(cells, " ").slice(0, cells);
  return `<div class="flapboard" role="group" aria-label="${esc(label)}">
    <div class="fb-head"><span>${esc(head)}</span><span class="fb-clock" aria-hidden="true">${clockHTML()}</span></div>
    <div class="fb-cq"><div class="flaps" style="--n:${cells}" aria-hidden="true" data-board="${esc(id)}" data-text="${esc(text)}">${[...from].map(cellHTML).join("")}</div></div>
    <div class="fb-foot">${foot}</div>
  </div>`;
}

function setCell(cell, ch) {
  cell.querySelectorAll("i").forEach((i) => {
    i.textContent = ch === " " ? NBSP : ch;
  });
  cell.dataset.c = ch;
}

function randomLike(ch) {
  const pool = /[0-9]/.test(ch) ? DIGITS : ch !== ch.toLowerCase() ? UPPER : LOWER;
  return pool[Math.floor(Math.random() * pool.length)];
}

function flipThrough(cell, sequence) {
  const [top, bottom, flapTop, flapBottom] = cell.children;
  const face = (ch) => (ch === " " ? NBSP : ch);
  const tl = gsap.timeline();
  sequence.forEach((next) => {
    tl.call(() => {
      const current = face(cell.dataset.c);
      top.firstChild.textContent = face(next);
      flapTop.firstChild.textContent = current;
      flapBottom.firstChild.textContent = face(next);
      bottom.firstChild.textContent = current;
      gsap.set(flapTop, { rotationX: 0 });
      gsap.set(flapBottom, { rotationX: 90 });
    })
      .to(flapTop, { rotationX: -90, duration: 0.055, ease: "power1.in" })
      .to(flapBottom, { rotationX: 0, duration: 0.055, ease: "power1.out" })
      .call(() => {
        bottom.firstChild.textContent = face(next);
        cell.dataset.c = next;
      });
  });
  return tl;
}

/** Flip every board inside `root` to its text (instantly when motion is off). */
export function runBoards(root = document, { delay = 0.15 } = {}) {
  root.querySelectorAll(".flaps").forEach((flaps) => {
    const cells = [...flaps.querySelectorAll(".cell")];
    const target = (flaps.dataset.text || "").padEnd(cells.length, " ").slice(0, cells.length);
    lastText.set(flaps.dataset.board, target);
    if (!motionOK()) {
      cells.forEach((c, i) => setCell(c, target[i]));
      return;
    }
    const master = gsap.timeline({ delay });
    let slot = 0;
    cells.forEach((cell, i) => {
      const ch = target[i];
      if (cell.dataset.c === ch) return; // already showing it
      const steps = 3 + Math.floor(Math.random() * 5);
      const sequence = Array.from({ length: steps }, () => randomLike(ch === " " ? "a" : ch));
      sequence.push(ch);
      master.add(flipThrough(cell, sequence), slot++ * 0.035 + i * 0.008);
    });
    onLeave(() => master.progress(1).kill());
  });
}

/** Keep the station clocks up to date; changed digits flip in. */
export function startClock() {
  setInterval(() => {
    const now = [...clockText()];
    document.querySelectorAll(".fb-clock").forEach((clock) => {
      [...clock.children].forEach((digit, i) => {
        if (digit.textContent === now[i]) return;
        digit.textContent = now[i];
        if (motionOK()) {
          gsap.fromTo(
            digit,
            { yPercent: -70, autoAlpha: 0 },
            { yPercent: 0, autoAlpha: 1, duration: 0.5, ease: "back.out(2.4)" },
          );
        }
      });
    });
  }, 5000);
}
