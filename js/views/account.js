import { authMessage, currentUser, googleAvailable } from "../auth.js";
import { canImportBrowserProgress, progressStatus } from "../progress.js";
import { esc } from "../utils.js";
import { enter, motionOK } from "../ui/motion.js";

const GOOGLE = `<svg viewBox="0 0 48 48" width="20" height="20" aria-hidden="true"><path fill="#4285F4" d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5.2h6.6c3.9-3.6 6.1-8.8 6.1-15.1Z"/><path fill="#34A853" d="M24 44c5.5 0 10.1-1.8 13.5-4.9l-6.6-5.2c-1.8 1.2-4.1 1.9-6.9 1.9-5.3 0-9.8-3.6-11.4-8.4H5.8v5.3A20.4 20.4 0 0 0 24 44Z"/><path fill="#FBBC05" d="M12.6 27.4a12.2 12.2 0 0 1 0-7.8v-5.3H5.8a20.1 20.1 0 0 0 0 18.4l6.8-5.3Z"/><path fill="#EA4335" d="M24 11.2c3 0 5.6 1 7.7 3l5.8-5.8A19.4 19.4 0 0 0 24 3 20.4 20.4 0 0 0 5.8 14.3l6.8 5.3C14.2 14.8 18.7 11.2 24 11.2Z"/></svg>`;

function saveStatus() {
  const status = progressStatus();
  return `<p class="account-save" data-sync-status role="status">${esc(status.message)}</p>`;
}

export function profileAccount() {
  const user = currentUser();
  if (!user) return `<section class="account-strip" aria-label="Save your progress">
    <div><h2>Make your progress feel at home.</h2><p class="muted">Sign in to keep your learning together across devices.</p></div>
    <a class="btn small" href="#/login">Sign in with Google</a>
  </section><p class="profile-save-note">You're practising on this device. Your existing progress stays here until you choose to add it to an account.</p>
  <div class="account-sync-row"><button class="link-btn" data-account-action="certificate">Download progress certificate (PDF)</button></div>`;
  const name = String(user.user_metadata?.full_name || user.user_metadata?.name || "Your account");
  return `<section class="account-strip" aria-label="Your account">
    <div class="account-identity"><span class="account-initial" aria-hidden="true">${esc(Array.from(name)[0])}</span>
      <div><h2>${esc(name)}</h2><p class="muted">${esc(user.email || "Signed in with Google")}</p></div></div>
    <a class="btn small ghost" href="#/settings">Settings</a>
  </section>
  <div class="account-sync-row">${saveStatus()}<button class="link-btn" data-account-action="retry">Sync now</button><button class="link-btn" data-account-action="certificate">Download progress certificate (PDF)</button></div>
  ${canImportBrowserProgress() ? `<section class="account-import" aria-labelledby="import-title">
    <h2 id="import-title">Already been practising here?</h2><p>Add this browser's existing progress to your empty account, or start fresh. Your browser's original copy is kept.</p>
    <div class="account-actions"><button class="btn small" data-account-action="import">Use this browser's progress</button><button class="btn small ghost" data-account-action="skip-import">Start fresh</button></div>
  </section>` : ""}`;
}

export function render(mode = "login") {
  if (mode === "status") return renderStatus();
  const message = authMessage();
  return `<section class="login-page" aria-labelledby="login-title">
    <div class="logo login-brand"><i aria-hidden="true"></i><span>Sprachpfad</span></div>
    <div class="login-card"><h1 id="login-title">Welcome to Sprachpfad</h1><p class="muted">Practise German A1–B1 with lessons, listening, flashcards and mock tests. Sign in to keep your learning with you.</p>
      <button class="google-signin" type="button" data-account-action="signin">${GOOGLE}<span>Continue with Google</span></button>
      <p class="login-note">New here? Your first Google sign-in creates your account.</p>
      <p id="account-error" class="account-error" role="alert"${message ? "" : " hidden"}>${esc(message)}</p>
      ${googleAvailable() === false ? '<p class="account-setup-note">Google sign-in is being set up. You can keep practising on this device in the meantime.</p>' : ""}
      <div class="login-divider" aria-hidden="true">or</div>
      <button class="login-continue" type="button" data-account-action="continue-device">Continue on this device <span aria-hidden="true">→</span></button>
      <p class="login-note">Your progress stays in this browser.</p>
    </div>
    <nav class="site-information login-information" aria-label="Site information"><a href="about.html">About</a><a href="privacy.html">Privacy policy</a><a href="terms.html">Terms of use</a></nav>
  </section>`;
}

function renderStatus() {
  const status = progressStatus();
  const conflict = status.kind === "conflict";
  const loading = status.kind === "loading";
  return `<section class="account-notice" aria-labelledby="account-title" aria-busy="${loading}">
    <p class="profile-eyebrow">Your account</p><h1 id="account-title">${loading ? "Getting your progress ready" : conflict ? "Two saves. Your choice." : "Let's reconnect your progress"}</h1>
    <p class="muted" role="status">${esc(status.message)}</p>
    ${conflict ? `<p>Keeping one copy replaces the other. Download this device's copy first if you want a backup.</p>
      <div class="account-actions"><button class="btn" data-account-action="use-account">Use account progress</button><button class="btn ghost" data-account-action="use-device">Use this device's progress</button></div>
      <button class="link-btn" data-account-action="download">Download this device's copy</button>`
    : !loading ? '<button class="btn" data-account-action="retry">Try again</button>' : '<span class="account-loading" aria-hidden="true"></span>'}
    <p id="account-error" class="account-error" role="alert" hidden></p>
    <a class="link-btn account-notice-signout" href="#/settings">Open Settings</a>
  </section>`;
}

export function mount() {
  if (motionOK()) enter(".login-brand, .login-card, .account-notice", { y: 12, duration: 0.55, stagger: 0.08 });
}
