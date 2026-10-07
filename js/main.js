// Entry point: load the content, restore progress, then hand over to the router.

import { loadContent } from "./content.js";
import { activeView, relayout, route } from "./router.js";
import { initState, resetState } from "./state.js";
import { initAudio, speak } from "./ui/audio.js";
import { startClock } from "./ui/board.js";
import { initSpotlight } from "./ui/effects.js";
import { initSmoothScroll } from "./ui/scroll.js";
import { toast } from "./ui/toast.js";
import { esc } from "./utils.js";

function showLoadError(error) {
  document.getElementById("app").innerHTML = `<section class="boot">
    <h1>The lessons didn't load</h1>
    <p class="muted">${esc(error.message)}. Reload the page, and if that doesn't help, check that the data folder sits next to index.html.</p>
  </section>`;
}

/** Any button with data-say reads its text aloud; everything else goes to the page on screen. */
function onClick(e) {
  const button = e.target.closest("button");
  if (button && button.dataset.say !== undefined) {
    speak(button.dataset.say, button);
    return;
  }
  activeView()?.onClick?.(e, button);
}

/** Reset needs a second tap within three seconds. */
let resetArmed = 0;
function onReset(e) {
  const button = e.currentTarget;
  if (Date.now() - resetArmed < 3000) {
    resetState();
    resetArmed = 0;
    button.textContent = "Reset progress";
    toast("Progress reset.");
    route();
    return;
  }
  resetArmed = Date.now();
  button.textContent = "Tap again to reset everything";
  setTimeout(() => {
    if (Date.now() - resetArmed >= 2900) button.textContent = "Reset progress";
  }, 3000);
}

async function start() {
  try {
    await loadContent();
  } catch (error) {
    showLoadError(error);
    return;
  }
  initState();
  initAudio();
  startClock();
  initSmoothScroll();
  initSpotlight();
  window.addEventListener("hashchange", route);
  document.addEventListener("click", onClick);
  document.addEventListener("keydown", (e) => activeView()?.onKeydown?.(e));
  document.addEventListener("change", (e) => activeView()?.onChange?.(e));
  document.getElementById("reset").addEventListener("click", onReset);
  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(relayout, 150);
  });
  route();
  document.fonts?.ready.then(relayout); // web fonts change widths and heights
}

start();
