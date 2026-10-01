// The number of words due for review, on the Flashcards links in the top bar and the mobile dock.

import { dueCount } from "../state.js";

export function updateDueBadges() {
  const due = dueCount();
  document.querySelectorAll('a[data-nav="karten"]').forEach((link) => {
    let badge = link.querySelector(".due-badge");
    if (!due) {
      badge?.remove();
      return;
    }
    if (!badge) {
      badge = document.createElement("span");
      badge.className = "due-badge";
      link.append(badge);
    }
    badge.innerHTML = `<span aria-hidden="true">${due > 99 ? "99+" : due}</span><span class="sr">, ${due} ${due === 1 ? "word" : "words"} due</span>`;
  });
}
