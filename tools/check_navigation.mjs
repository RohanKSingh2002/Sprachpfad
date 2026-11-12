// Exercise the real auth return logic without contacting an account service.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const authSource = (await readFile(new URL('../js/auth.js', import.meta.url), 'utf8'))
  .replace(/^import .*;\r?\n/m, '').replaceAll('export ', '');
function fixture(href, user = { id: 'test-user' }) {
  const storage = new Map();
  const calls = {};
  const auth = {
    getSession: async () => ({ data: { session: user ? { user } : null } }),
    exchangeCodeForSession: async () => ({}),
    onAuthStateChange: () => {},
    signInWithOAuth: async options => { calls.signin = options; return {}; },
    signOut: async options => { calls.signout = options; return {}; },
  };
  const sessionStorage = { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) };
  const context = vm.createContext({
    SUPABASE_URL: 'https://example.invalid', SUPABASE_PUBLISHABLE_KEY: 'test',
    URL, AbortController, setTimeout, clearTimeout,
    fetch: async () => ({ ok: true, json: async () => ({ external: { google: true } }) }),
    location: { href }, navigator: { onLine: true }, sessionStorage, localStorage: sessionStorage,
    history: { replaceState: (_, __, url) => { calls.returnUrl = url; } },
    supabase: { createClient: () => ({ auth }) },
  });
  vm.runInContext(authSource, context);
  return { context, calls, storage, run: code => vm.runInContext(code, context) };
}
const start = fixture('https://example.invalid/#/login');
await start.run('initAuth()');
await start.run('signInWithGoogle()');
assert.equal(start.storage.get('sprachpfad-signin-return'), '#/');
assert.equal(start.calls.signin.options.redirectTo, 'https://example.invalid/');
const callback = fixture('https://example.invalid/?code=test&state=test');
await callback.run('initAuth()');
assert.equal(callback.calls.returnUrl, '/#/', 'A successful callback lands on Home and removes auth parameters');
await callback.run('signOut()');
assert.equal(callback.calls.signout.scope, 'local', 'Sign-out stays limited to this device');
assert.equal(callback.run('currentUser()'), null);
const failed = fixture('https://example.invalid/?code=test', null);
await failed.run('initAuth()');
assert.equal(failed.calls.returnUrl, '/#/login', 'A missing account returns to sign-in');
console.log('Google return to Home, callback cleanup and local sign-out checks passed using a fake auth client.');
