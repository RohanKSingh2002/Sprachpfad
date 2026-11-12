import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../js/theme-init.js', import.meta.url), 'utf8');
function browser(saved, blocked = false) {
  const handlers = new Map();
  const state = { saved, meta: '', events: 0 };
  const document = {
    documentElement: { dataset: {} },
    querySelector: () => ({ setAttribute: (_, value) => { state.meta = value; } }),
  };
  const window = {
    dispatchEvent: () => { state.events++; },
    addEventListener: (name, handler) => handlers.set(name, handler),
  };
  const localStorage = {
    getItem: () => { if (blocked) throw Error('Blocked'); return state.saved; },
    setItem: (_, value) => { if (blocked) throw Error('Blocked'); state.saved = value; },
  };
  vm.runInNewContext(source, { window, document, localStorage, Event });
  return { theme: window.sprachpfadTheme, state, handlers, document };
}
for (const invalid of [null, undefined, '', 'system', '<script>']) {
  assert.equal(browser(invalid).theme.current(), 'light', 'New or invalid preferences use original light');
}
const first = browser();
assert.equal(first.theme.set('dark'), true);
assert.equal(first.state.meta, '#09090b');
assert.equal(browser(first.state.saved).theme.current(), 'dark', 'Dark survives a new page load');
first.theme.set('light');
assert.equal(browser(first.state.saved).theme.current(), 'light', 'Light survives a new page load');
first.handlers.get('storage')({ key: 'sprachpfad.theme', newValue: 'dark' });
assert.equal(first.theme.current(), 'dark', 'Another tab can update the theme');
first.handlers.get('storage')({ key: 'unrelated', newValue: 'light' });
assert.equal(first.theme.current(), 'dark', 'Other storage keys do not change appearance');
first.handlers.get('storage')({ key: null, newValue: null });
assert.equal(first.theme.current(), 'light', 'Cleared preferences restore the default');
const privateBrowser = browser(null, true);
assert.equal(privateBrowser.theme.set('dark'), false, 'Storage failures are reported');
assert.equal(privateBrowser.theme.current(), 'dark', 'The chosen theme still works without storage');
assert.equal(privateBrowser.document.documentElement.dataset.theme, 'dark');
console.log('Theme defaults, persistence, cross-tab changes and storage failure checks passed.');
