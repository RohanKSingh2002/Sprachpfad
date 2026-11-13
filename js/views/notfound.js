// Page for unknown addresses: "Zug fällt aus" is what German stations announce for a cancelled train.

import { boardHTML, runBoards } from "../ui/board.js";
import { enter, splitReveal } from "../ui/motion.js?v=20261113-polish1";

export function render() {
  const board = boardHTML({
    id: "notfound",
    text: "Zug fällt aus",
    foot: "<span>This page doesn't exist</span><span></span>",
    label: "Zug fällt aus: train cancelled",
    cells: 13,
    head: "Aktuelle Meldung",
  });
  return `<section class="notfound">
    ${board}
    <h1>This stop isn't on the line</h1>
    <p class="muted">Zug fällt aus is what German stations announce when a train is cancelled. Head back to the lessons and pick another stop.</p>
    <a class="btn" href="#/">Back to lessons</a>
  </section>`;
}

export function mount() {
  runBoards(document, { delay: 0.3 });
  enter(".notfound .flapboard", { y: 10, scale: 0.99, duration: 0.5 });
  splitReveal(document.querySelector(".notfound h1"), { delay: 0.15 });
  enter(".notfound .muted, .notfound .btn", { y: 8, delay: 0.08, stagger: 0.04 });
}
