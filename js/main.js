// Entry point: load the content, restore progress, then hand over to the router.

import { loadContent } from "./content.js";
import { activeView, relayout, route } from "./router.js?v=20261113-polish1";
import { initState, resetState } from "./state.js";
import { clearDevicePractice } from "./practice-progress.js";
import { flushStudyTime, resetStudyClock, startStudyClock } from "./study-clock.js";
import { initAudio, resetAudioSpeed, speak } from "./ui/audio.js";
import { startClock } from "./ui/board.js";
import { initSpotlight } from "./ui/effects.js?v=20261113-polish1";
import { initProfileMenu, setProfileMenuSignedIn } from "./ui/profile-menu.js?v=20261113-signout1";
import { initSmoothScroll } from "./ui/scroll.js?v=20261113-polish1";
import { toast } from "./ui/toast.js";
import { esc } from "./utils.js";
import { authClient, currentUser, initAuth, onAccountChange, signInWithGoogle, signOut } from "./auth.js";
import { clearGuestEntry, enterAsGuest } from "./entry.js";
import { registerStudyWorker } from "./offline-study.js";
import { startStudyNotifications } from "./study-reminder.js";
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
  if (button?.hasAttribute("data-reset-audio-speed")) {
    resetAudioSpeed();
    toast("Playback speed reset to 1×.");
    return;
  }
  if (button?.dataset.accountAction) {
    await onAccountAction(button);
    return;
  }
  if (button && button.dataset.say !== undefined) {
    const view = activeView();
    if (view?.onAudioPlay?.(button) === false) return;
    const started = await speak(button.dataset.say, button, { voice: button.dataset.voice });
    if (activeView() === view && button.isConnected) view?.onAudioStarted?.(button, started);
    return;
  }
  activeView()?.onClick?.(e, button);
}

async function onReset() {
  if (progressStatus().blocked) return;
  const user = currentUser();
  if (user) {
    if (!confirm("Reset all progress in this account, including lessons, words and test results? This also resets the progress used by your other devices.")) return;
    flushStudyTime();
    await resetAccountProgress();
    toast("Account progress reset.");
  } else {
    if (!confirm("Reset the learning progress saved on this device? This includes lessons, reviews, and test results.")) return;
    resetStudyClock();
    resetState();
    toast("Progress reset.");
  }
  clearDevicePractice(user);
  route({ immediate: true });
}

function updateAccountUI() {
  const status = progressStatus();
  document.getElementById("save-status").textContent = `Sprachpfad. ${status.message}`;
  document.querySelectorAll("[data-sync-status]").forEach(el => { el.textContent = status.message; });
  setProfileMenuSignedIn(Boolean(currentUser()));
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
      flushStudyTime();
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
    } else if (action === "reset") {
      await onReset();
    } else if (action === "certificate") {
      button.setAttribute("aria-busy", "true");
      const user = currentUser();
      const name = user?.user_metadata?.full_name || user?.user_metadata?.name;
      const { downloadProgressCertificate } = await import('./progress-certificate.js');
      if (currentUser()?.id !== user?.id) throw new Error('Your account changed. Please download the certificate again.');
      await downloadProgressCertificate(name);
      toast("Your progress certificate is ready to download.");
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
    if (status.blocked) resetStudyClock();
    wasBlocked = status.blocked;
    updateAccountUI();
    // Do not replace an exercise while a background save is finishing.
    if (started && needsRoute) route({ immediate: true });
  });
  onAccountChange(user => {
    resetStudyClock();
    clearGuestEntry();
    connectProgress(authClient(), user);
    updateAccountUI();
    if (started) route({ immediate: true });
  });
  // Account restoration starts in the background; the router shows a loading page until ready.
  connectProgress(authClient(), currentUser());
  initAudio();
  void registerStudyWorker();
  startStudyNotifications();
  startStudyClock();
  startClock();
  initSmoothScroll();
  initSpotlight();
  initProfileMenu();
  window.addEventListener("hashchange", route);
  document.addEventListener("click", onClick);
  document.addEventListener("keydown", (e) => activeView()?.onKeydown?.(e));
  document.addEventListener("change", (e) => activeView()?.onChange?.(e));
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
