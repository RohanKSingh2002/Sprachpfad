import { isSentenceFavorite, sentenceReviewInfo } from "./state.js";
import { todayKey } from "./utils.js";

export function selectSentenceBatch(items, { search = "", filter = "all", order = "original", from = 1, to = 0, mode = "recall" } = {}) {
  const terms = search.toLocaleLowerCase().split(",").map(term => term.trim()).filter(Boolean);
  const range = /^([1-5])(?:-([1-5]))?$/.exec(filter);
  const date = todayKey();
  const eligible = items.filter(item => {
    const text = `${item.de}\n${item.en}`.toLocaleLowerCase();
    if (terms.length && !terms.some(term => text.includes(term))) return false;
    if (filter === "favorites") return isSentenceFavorite(item.id);
    const review = sentenceReviewInfo(item.id, mode);
    if (filter === "unrated") return !review?.rating;
    if (filter === "due") return Boolean(review?.due <= date);
    return filter === "all" || (range && review?.rating >= Number(range[1]) && review?.rating <= Number(range[2] || range[1]));
  });
  if (order !== "original") {
    const rating = item => sentenceReviewInfo(item.id, mode)?.rating;
    eligible.sort((a, b) => {
      const left = rating(a), right = rating(b);
      if (left === undefined || right === undefined) return Number(left === undefined) - Number(right === undefined);
      return order === "easiest" ? right - left : left - right;
    });
  }
  return eligible.slice(Math.max(0, from - 1), to || undefined);
}

export function waitBetweenLines(seconds, signal) {
  if (signal.aborted || !seconds) return Promise.resolve();
  return new Promise(resolve => {
    function done() {
      clearTimeout(timer);
      signal.removeEventListener("abort", done);
      resolve();
    }
    const timer = setTimeout(done, seconds * 1000);
    signal.addEventListener("abort", done, { once: true });
  });
}
