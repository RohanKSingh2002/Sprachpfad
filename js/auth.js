import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "./config.js";

let client = null;
let account = null;
let message = "";
let googleEnabled = null;
const listeners = new Set();
const RETURN_KEY = "sprachpfad-signin-return";

export const authClient = () => client;
export const currentUser = () => account;
export const authMessage = () => message;
export const googleAvailable = () => googleEnabled;
export const onAccountChange = (listener) => { listeners.add(listener); return () => listeners.delete(listener); };

function setAccount(user) {
  const changed = account?.id !== user?.id;
  account = user || null;
  if (changed) listeners.forEach(listener => listener(account));
}

/** Bound requests so a lost connection does not leave the account screen waiting forever. */
async function request(input, options = {}) {
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (options.signal?.aborted) abort();
  options.signal?.addEventListener("abort", abort, { once: true });
  const timer = setTimeout(abort, 12000);
  try { return await fetch(input, { ...options, signal: controller.signal }); }
  finally { clearTimeout(timer); options.signal?.removeEventListener("abort", abort); }
}

async function checkGoogle() {
  try {
    const response = await request(`${SUPABASE_URL}/auth/v1/settings`, {
      headers: { apikey: SUPABASE_PUBLISHABLE_KEY },
    });
    if (response.ok) googleEnabled = (await response.json()).external?.google === true;
  } catch { /* The sign-in screen offers a retry when the connection returns. */ }
}

function cleanCallback(url) {
  ["code", "error", "error_code", "error_description", "state"].forEach(key => url.searchParams.delete(key));
  // Never leave provider error details or authorization codes in the address/history.
  if (url.hash.includes("error=")) url.hash = "#/login";
  history.replaceState(null, "", url.pathname + url.search + url.hash);
}

export async function initAuth() {
  const url = new URL(location.href);
  const callback = url.searchParams.has("code") || url.searchParams.has("error") || url.hash.includes("error=");
  try {
    if (!globalThis.supabase?.createClient) throw new Error("client unavailable");
    client = globalThis.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: { flowType: "pkce", detectSessionInUrl: false, persistSession: true, autoRefreshToken: true },
      global: { fetch: request },
    });
    const providerCheck = checkGoogle();
    if (url.searchParams.has("error") || url.hash.includes("error=")) {
      message = "Sign-in wasn't completed. You can try again whenever you're ready.";
    } else if (url.searchParams.has("code")) {
      const { error } = await client.auth.exchangeCodeForSession(url.searchParams.get("code"));
      if (error) message = "This sign-in link has expired or was opened in a different browser. Please try again.";
    }
    const { data, error } = await client.auth.getSession();
    if (error) message = "We couldn't restore your sign-in. Please try signing in again.";
    setAccount(data?.session?.user);
    // No asynchronous Supabase calls inside this callback: they can wait on its auth lock.
    client.auth.onAuthStateChange((_event, session) => setAccount(session?.user));
    await providerCheck;
    if (callback) {
      let next = "#/";
      try { next = sessionStorage.getItem(RETURN_KEY) || next; sessionStorage.removeItem(RETURN_KEY); } catch { /* optional */ }
      url.hash = account && /^#\/[a-z0-9/?=&%-]*$/i.test(next) ? next : "#/login";
    }
  } catch {
    message = "Sign-in couldn't connect. Your progress on this device is still available.";
    if (callback) url.hash = "#/login";
  } finally {
    if (callback) cleanCallback(url);
  }
}

export async function signInWithGoogle() {
  message = "";
  if (!client) throw new Error("Sign-in couldn't load. Reload the page and try again.");
  if (!navigator.onLine) throw new Error("Connect to the internet to sign in with Google.");
  try {
    localStorage.setItem("sprachpfad-storage-check", "1");
    localStorage.removeItem("sprachpfad-storage-check");
  } catch {
    throw new Error("Allow storage for this website before signing in. Your browser needs it to complete the Google return safely.");
  }
  // Refresh this flag so enabling Google in the dashboard works without another deployment.
  await checkGoogle();
  if (googleEnabled === false) throw new Error("Google sign-in is being set up. You can keep practising on this device for now.");
  const redirect = new URL(location.href);
  redirect.search = "";
  redirect.hash = "";
  try { sessionStorage.setItem(RETURN_KEY, "#/"); } catch { /* Home is also the fallback. */ }
  const { error } = await client.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: redirect.href, queryParams: { prompt: "select_account" } },
  });
  if (error) throw new Error("Google sign-in couldn't start. Please try again.");
}

export async function signOut() {
  if (!client) return;
  const { error } = await client.auth.signOut({ scope: "local" });
  if (error) throw new Error("Sign-out couldn't finish. Check your connection and try again.");
  setAccount(null);
}
