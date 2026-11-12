import { sentenceReviewInfo, setSentenceRatings } from "../state.js";
import { esc } from "../utils.js";
import { toast } from "./toast.js";

export function sentenceStars(id, mode = "recall") {
  const current = sentenceReviewInfo(id, mode)?.rating || 0;
  const label = mode === "listen" ? "Shadowing" : "Recall";
  return `<span class="sentence-stars" role="group" aria-label="${label} confidence"><span class="sentence-star-mode" aria-hidden="true">${label}</span>
    ${[1, 2, 3, 4, 5].map(value => `<button type="button" class="sentence-star" data-star-id="${esc(id)}" data-star-mode="${mode}" data-star-value="${value}" aria-label="${label} rating ${value} of 5" aria-pressed="${current === value}">${value <= current ? "★" : "☆"}</button>`).join("")}
  </span>`;
}

export function applySentenceStar(button) {
  const { starId, starMode, starValue } = button.dataset;
  const rating = button.getAttribute("aria-pressed") === "true" ? 0 : Number(starValue);
  if (!setSentenceRatings([starId], rating, starMode)) return false;
  for (const control of document.querySelectorAll(`[data-star-id="${starId}"][data-star-mode="${starMode}"]`)) {
    const value = Number(control.dataset.starValue);
    control.textContent = value <= rating ? "★" : "☆";
    control.setAttribute("aria-pressed", String(value === rating));
  }
  return true;
}

export const copySentenceButton = text =>
  `<button class="link-btn" type="button" data-copy-sentence="${esc(text)}">Copy German</button>`;

export async function copySentence(text) {
  try {
    await navigator.clipboard.writeText(text);
    toast("German sentence copied.");
  } catch {
    toast("Copy is unavailable here. Select the German text to copy it.");
  }
}
