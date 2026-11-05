const fs = require('node:fs');
const ts = require('typescript');
const assert = require('node:assert/strict');
const { test } = require('node:test');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText, filename);
const { createLoadingStore, loadingStore, trackRepository } = require('../src/lib/loading/index.ts');

test('concurrent operations keep loading active until the last operation finishes', () => {
  const store = createLoadingStore();
  const finishNavigation = store.begin('navigation');
  const finishAction = store.begin('action');
  assert.deepEqual(store.getSnapshot(), { pending: 2, actions: 1 });
  finishNavigation();
  assert.deepEqual(store.getSnapshot(), { pending: 1, actions: 1 });
  finishNavigation(); // Effect cleanup must be safe even after an earlier cleanup.
  assert.deepEqual(store.getSnapshot(), { pending: 1, actions: 1 });
  finishAction();
  assert.deepEqual(store.getSnapshot(), { pending: 0, actions: 0 });
});
test('subscriptions unsubscribe cleanly and snapshots are stable between operations', () => {
  const store = createLoadingStore();
  let updates = 0;
  const unsubscribe = store.subscribe(() => updates++);
  assert.equal(store.getSnapshot(), store.getSnapshot());
  const finish = store.begin();
  assert.equal(updates, 1);
  unsubscribe();
  finish();
  assert.equal(updates, 1);
  assert.deepEqual(store.getServerSnapshot(), { pending: 0, actions: 0 });
});
test('repository tracking preserves return values, method context and errors without a stuck loader', async () => {
  const repository = trackRepository({
    value: 42,
    async get() { return this.value; },
    async save() { throw new Error('Save failed'); },
    remove() { throw new Error('Sync failure'); },
  });
  assert.equal(await repository.get(), 42);
  await assert.rejects(repository.save(), /Save failed/);
  await assert.rejects(repository.remove(), /Sync failure/);
  assert.deepEqual(loadingStore.getSnapshot(), { pending: 0, actions: 0 });
});
test('slow reads and writes are tracked separately and concurrent completions do not hide each other', async () => {
  let resolveRead, resolveWrite;
  const repository = trackRepository({
    list: () => new Promise(resolve => { resolveRead = resolve; }),
    assign: () => new Promise(resolve => { resolveWrite = resolve; }),
  });
  const read = repository.list();
  const write = repository.assign();
  assert.deepEqual(loadingStore.getSnapshot(), { pending: 2, actions: 1 });
  resolveWrite('saved');
  assert.equal(await write, 'saved');
  assert.deepEqual(loadingStore.getSnapshot(), { pending: 1, actions: 0 });
  resolveRead([]);
  await read;
  assert.deepEqual(loadingStore.getSnapshot(), { pending: 0, actions: 0 });
});

test('loading is visible on the first render of a pending operation, without a display-delay timer', () => {
  const Module = require('node:module');
  const originalLoad = Module._load;
  const runtime = require('react/jsx-runtime');
  const mocks = {
    react: { useState: value => [value, () => {}], useEffect() {}, useSyncExternalStore: () => ({ pending: 1, actions: 0 }) },
    'react/jsx-runtime': runtime,
    'next/navigation': {}, 'next/link': {},
    '@/lib/loading': { loadingStore },
    '@/components/LanguageProvider': { useLanguage: () => ({ t: text => text }) },
  };
  require.extensions['.tsx'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, filename);
  let Provider;
  try {
    Module._load = function(name, ...args) { return Object.hasOwn(mocks, name) ? mocks[name] : originalLoad.call(this, name, ...args); };
    Provider = require('../src/components/LoadingProvider.tsx').LoadingProvider;
  } finally { Module._load = originalLoad; }
  const view = Provider({ children: 'Panel' });
  const status = view.props.children.find(child => child?.props?.role === 'status');
  assert.ok(status, 'The indicator must already exist before any effect or timer runs');
});

test('GvG, announcements, events, leadership, overview and character expose a loading indicator while fetching', () => {
  const Module = require('node:module');
  const originalLoad = Module._load;
  const runtime = require('react/jsx-runtime');
  const Indicator = () => null;
  const PageLoading = () => null;
  const member = { id: 'test', nickname: 'Test', guildRole: 'lider', classId: 'knight' };
  let stateIndex = 0;
  const mocks = {
    react: { useState: initial => [stateIndex++ === 0 ? member : initial, () => {}], useEffect() {}, useMemo: fn => fn(), useRef: current => ({ current }) },
    'react/jsx-runtime': runtime,
    '@/components/LoadingProvider': { useLoadingRouter: () => ({}), PageLoading, LoadingIndicator: Indicator },
    '@/components/LanguageProvider': { useLanguage: () => ({ t: text => text, formatNumber: String, locale: 'pt-BR' }) },
    '@/components/PanelTopbar': { PanelTopbar: () => null },
    '@/components/ClassIcon': { ClassIcon: () => null },
    '@/data/classes': { getClass: () => null, ROLE_COLOR: {}, CLASSES: [{ id: 'knight' }] },
    '@/data/roles': { GUILD_ROLE_INFO: {} },
    '@/data/attributes': { ATTR_FIELDS: [], ATTR_SECTIONS: [], isRequired: () => true },
    '@/lib/permissions': { canLead: () => true, canManage: () => true },
    '@/lib/session': { getSession: () => member },
    '@/lib/members': {}, '@/lib/character': {}, '@/lib/gvg': {}, '@/lib/events': {}, '@/lib/announcements': {},
    '@/lib/gvg/lineup': require('../src/lib/gvg/lineup.ts'),
    '@/lib/format': { parseNumber: () => null },
  };
  function hasIndicator(node) {
    if (!node || typeof node !== 'object') return false;
    if (node.type === Indicator || node.type === PageLoading) return true;
    return [node.props?.children].flat(Infinity).some(hasIndicator);
  }
  for (const route of ['gvg/', 'avisos/', 'eventos/', 'lideranca/', '', 'personagem/']) {
    stateIndex = 0;
    let Page;
    try {
      Module._load = function(name, ...args) { return Object.hasOwn(mocks, name) ? mocks[name] : originalLoad.call(this, name, ...args); };
      Page = require(`../src/app/painel/${route}page.tsx`).default;
    } finally { Module._load = originalLoad; }
    assert.ok(hasIndicator(Page()), `Missing loading on /painel/${route}`);
  }
});
