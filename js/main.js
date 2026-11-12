// Entry point: load the content, restore progress, then hand over to the router.

import { loadContent } from "./content.js";
import { activeView, relayout, route } from "./router.js?v=20261112-weekcards1";
import { initState, resetState } from "./state.js";
import { initAudio, speak } from "./ui/audio.js";
import { startClock } from "./ui/board.js";
import { initSpotlight } from "./ui/effects.js";
import { initSmoothScroll } from "./ui/scroll.js";
import { toast } from "./ui/toast.js";
import { esc } from "./utils.js";
import { authClient, currentUser, initAuth, onAccountChange, signInWithGoogle, signOut } from "./auth.js";
import { clearGuestEntry, enterAsGuest } from "./entry.js";
import {
  connectProgress, dismissBrowserImport, downloadProgress, flushProgress, importBrowserProgress,
  onProgressChange, progressStatus, resetAccountProgress, resolveProgressConflict, retryProgress,
} from "./progress.js";

function showLoadError(error) {
  document.getElementById("app").innerHTML = `<section class="boot">
    <h1>The lessons didn't load</h1>
    <p class="muted">${esc(error.message)}. Reload the page, and if that doesn't help, check that the data folder sits next to index.html.</p>
  </section>`;
}

/** Any button with data-say reads its text aloud; everything else goes to the page on screen. */
async function onClick(e) {
  const button = e.target.closest("button");
  if (button?.dataset.accountAction) {
    await onAccountAction(button);
    return;
  }
  if (button && button.dataset.say !== undefined) {
    const view = activeView();
    if (view?.onAudioPlay?.(button) === false) return;
    const started = await speak(button.dataset.say, button);
    if (activeView() === view && button.isConnected) view?.onAudioStarted?.(button, started);
    return;
  }
  activeView()?.onClick?.(e, button);
}

/** Reset needs a second tap within three seconds. */
let resetArmed = 0;
async function onReset(e) {
  const button = e.currentTarget;
  if (currentUser()) {
    if (!confirm("Reset all progress in this account, including lessons, words and test results? This also resets the progress used by your other devices.")) return;
    button.disabled = true;
    try { await resetAccountProgress(); toast("Account progress reset."); route(); }
    catch (error) { toast(error.message); }
    finally { button.disabled = false; }
    return;
  }
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

function updateAccountUI() {
  const user = currentUser();
  const status = progressStatus();
  document.getElementById("save-status").textContent = `Sprachpfad. ${status.message}`;
  document.getElementById("reset").hidden = status.blocked;
  document.querySelectorAll("[data-sync-status]").forEach(el => { el.textContent = status.message; });
  document.querySelectorAll('[data-nav="profile"]').forEach(link => {
    link.href = user ? "#/profile" : "#/login";
    // Preserve the mobile icon; replace only its label text.
    const label = [...link.childNodes].findLast(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim());
    if (label) label.textContent = user ? "Profile" : "Sign in";
  });
}

async function onAccountAction(button) {
  const action = button.dataset.accountAction;
  if (button.disabled) return;
  button.disabled = true;
  const errorBox = document.getElementById("account-error");
  if (errorBox) errorBox.hidden = true;
  try {
    if (action === "signin") {
      button.setAttribute("aria-busy", "true");
      await signInWithGoogle();
    } else if (action === "continue-device") {
      enterAsGuest();
      location.hash = "#/";
    } else if (action === "signout") {
      if (progressStatus().pending) await flushProgress();
      const status = progressStatus();
      if (status.pending && !confirm(status.persistent
        ? "Some progress hasn't synced yet. Its copy will stay in this browser for this account. Sign out anyway?"
        : "Some progress is only held in this tab and will be lost on sign-out. Cancel and download a backup first, or sign out anyway?")) return;
      await signOut();
      location.hash = "#/login";
    } else if (action === "retry") {
      await retryProgress();
    } else if (action === "download") {
      downloadProgress();
    } else if (action === "import") {
      await importBrowserProgress();
      route({ immediate: true });
    } else if (action === "skip-import") {
      dismissBrowserImport();
      route({ immediate: true });
    } else if (action === "use-account" || action === "use-device") {
      const choice = action === "use-account" ? "account" : "device";
      if (!confirm(choice === "account"
        ? "Replace this device's unsynced progress with the account save? Download a backup first if you need to keep both."
        : "Replace the account save with this device's progress? This affects your other devices too.")) return;
      await resolveProgressConflict(choice);
    }
  } catch (error) {
    if (errorBox?.isConnected) { errorBox.textContent = error.message; errorBox.hidden = false; }
    else toast(error.message);
  } finally {
    if (button.isConnected) { button.disabled = false; button.removeAttribute("aria-busy"); }
    updateAccountUI();
  }
}

async function start() {
  try {
    await loadContent();
  } catch (error) {
    showLoadError(error);
    return;
  }
  initState();
  await initAuth();
  if (currentUser()) clearGuestEntry();
  let started = false;
  let wasBlocked = false;
  onProgressChange(status => {
    const needsRoute = status.blocked || wasBlocked;
    wasBlocked = status.blocked;
    updateAccountUI();
    // Do not replace an exercise while a background save is finishing.
    if (started && needsRoute) route({ immediate: true });
  });
  onAccountChange(user => {
    clearGuestEntry();
    resetArmed = 0;
    document.getElementById("reset").textContent = "Reset progress";
    connectProgress(authClient(), user);
    updateAccountUI();
    if (started) route({ immediate: true });
  });
  // Account restoration starts in the background; the router shows a loading page until ready.
  connectProgress(authClient(), currentUser());
  initAudio();
  startClock();
  initSmoothScroll();
  initSpotlight();
  window.addEventListener("hashchange", route);
  document.addEventListener("click", onClick);
  document.addEventListener("keydown", (e) => activeView()?.onKeydown?.(e));
  document.addEventListener("change", (e) => activeView()?.onChange?.(e));
  document.getElementById("reset").addEventListener("click", onReset);
  window.addEventListener("online", () => retryProgress());
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && currentUser()) retryProgress();
    else if (document.visibilityState === "hidden") flushProgress();
  });
  window.addEventListener("beforeunload", e => {
    if (currentUser() && progressStatus().pending) { e.preventDefault(); e.returnValue = ""; }
  });
  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(relayout, 150);
  });
  started = true;
  updateAccountUI();
  route();
  document.fonts?.ready.then(relayout); // web fonts change widths and heights
}

start();
