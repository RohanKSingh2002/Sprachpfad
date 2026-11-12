import { dueWords, reviewOf, sitePreferences } from "./state.js";
import { ARROW_ICON } from "./ui/icons.js";
import { esc } from "./utils.js";

export const GUIDED_SENTENCE_LIMIT = 12;
export function guidedWords() {
  const { cardMissed } = sitePreferences();
  return dueWords().filter(word => !cardMissed || reviewOf(word)?.missed).slice(0, 8);
}

const allowedStep = /^#\/(?:karten\?l=due|sentences\?mode=smart|(?:a1|a2|b1)\/lektion\/\d{1,3}(?:\?part=exercises)?)$/;

/** Carry the remaining activities in the local hash so reloading a step keeps its continuation. */
export function guidedLink([href, ...remaining]) {
  return `${href}${href.includes("?") ? "&" : "?"}guide=${encodeURIComponent(remaining.join("|"))}`;
}

export function currentGuide(hash = globalThis.location?.hash || "") {
  const [route, query = ""] = hash.split("?");
  const params = new URLSearchParams(query);
  const tail = params.get("guide");
  if (tail === null) return null;
  params.delete("guide");
  const step = `${route}${params.size ? `?${params}` : ""}`;
  const remaining = tail ? tail.split("|") : [];
  return remaining.length <= 2 && [step, ...remaining].every(href => allowedStep.test(href)) ? remaining : null;
}

export function guidedContinue(remaining) {
  const next = remaining[0];
  const label = next?.startsWith("#/sentences") ? "Continue to sentence review" :
    next ? "Continue to lesson" : "Finish guided session";
  return `<a class="btn" data-guide-next href="${esc(next ? guidedLink(remaining) : "#/")}">${label}${ARROW_ICON}</a>`;
}
