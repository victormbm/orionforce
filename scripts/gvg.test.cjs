const fs = require('node:fs');
const ts = require('typescript');
const assert = require('node:assert/strict');
const { test } = require('node:test');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText, filename);
const { PARTY_SIZE, PARTY_COUNT, TEAM_SIZE, PARTIES, isAssignment, normalizeAssignments, moveMember } = require('../src/lib/gvg/lineup.ts');

test('each team supports exactly eight parties of five', () => {
  assert.equal(PARTY_SIZE, 5);
  assert.equal(PARTY_COUNT, 8);
  assert.equal(TEAM_SIZE, 40);
  let lineup = {};
  for (const group of ['elite', 'secundaria']) {
    for (const party of PARTIES) {
      for (let slot = 0; slot < 5; slot++) lineup = moveMember(lineup, `${group}-${party}-${slot}`, { group, party });
      assert.throws(() => moveMember(lineup, 'extra', { group, party }), /5 jogadores/);
    }
  }
  assert.equal(Object.keys(lineup).length, 80);
});
test('a player can stay in a full party and move across parties without duplication', () => {
  let lineup = {};
  for (let i = 0; i < 5; i++) lineup = moveMember(lineup, String(i), { group: 'elite', party: 1 });
  lineup = moveMember(lineup, '0', { group: 'elite', party: 1 });
  const original = lineup;
  lineup = moveMember(lineup, '0', { group: 'secundaria', party: 8 });
  assert.equal(Object.keys(lineup).length, 5);
  assert.deepEqual(original['0'], { group: 'elite', party: 1 });
  assert.deepEqual(lineup['0'], { group: 'secundaria', party: 8 });
  assert.equal(Object.keys(moveMember(lineup, '0', null)).length, 4);
});
test('invalid destinations cannot be persisted', () => {
  for (const party of [0, 9, -1, 1.5, '1', null, undefined]) {
    assert.equal(isAssignment({ group: 'elite', party }), false);
    assert.throws(() => moveMember({}, 'member', { group: 'elite', party }), /inválido/);
  }
  assert.equal(isAssignment({ group: 'unknown', party: 1 }), false);
});
test('legacy teams are distributed deterministically without losing players', () => {
  const raw = Object.fromEntries(Array.from({ length: 40 }, (_, i) => [`m${String(i).padStart(2, '0')}`, 'elite']));
  const lineup = normalizeAssignments(raw);
  assert.equal(Object.keys(lineup).length, 40);
  for (const party of PARTIES) assert.equal(Object.values(lineup).filter(a => a.party === party).length, 5);
  assert.deepEqual(normalizeAssignments(Object.fromEntries(Object.entries(raw).reverse())), lineup);
  assert.deepEqual(normalizeAssignments(lineup), lineup);
});
test('existing explicit parties are preserved when migrating mixed legacy data', () => {
  const raw = { one: { group: 'elite', party: 8 }, two: 'elite', invalid: { group: 'elite', party: 9 } };
  const lineup = normalizeAssignments(raw);
  assert.deepEqual(lineup.one, raw.one);
  assert.deepEqual(lineup.two, { group: 'elite', party: 1 });
  assert.equal(lineup.invalid, undefined);
});

test('clearing a party releases its players and preserves all other parties and teams', () => {
  const { clearParty } = require('../src/lib/gvg/lineup.ts');
  const original = {
    a: { group: 'elite', party: 1 }, b: { group: 'elite', party: 1 },
    c: { group: 'elite', party: 2 }, d: { group: 'secundaria', party: 1 },
  };
  const cleared = clearParty(original, { group: 'elite', party: 1 });
  assert.deepEqual(cleared, { c: original.c, d: original.d });
  assert.equal(Object.keys(original).length, 4);
  assert.deepEqual(clearParty(cleared, { group: 'elite', party: 1 }), cleared);
  assert.throws(() => clearParty(original, { group: 'elite', party: 0 }), /inválido/);
});

test('dragging an assigned player back to Available persists removal, without waiting for a rerender', async () => {
  const Module = require('node:module');
  const originalLoad = Module._load;
  const member = { id: 'test-member', nickname: 'Test', classId: 'knight', guildRole: 'lider', status: 'aprovado' };
  const states = [member, [member], {}, { [member.id]: { group: 'elite', party: 1 } }, false, '', false, null, null, { elite: 0, secundaria: 0 }];
  const updates = {};
  let index = 0;
  const calls = [];
  const mockReact = {
    useEffect() {},
    useRef(current) { return { current }; },
    useState() {
      const stateIndex = index++;
      return [states[stateIndex], next => { updates[stateIndex] = typeof next === 'function' ? next(states[stateIndex]) : next; }];
    },
  };
  const mocks = {
    react: mockReact,
    'react/jsx-runtime': require('react/jsx-runtime'),
    'next/navigation': { useRouter: () => ({ replace() {} }) },
    '@/components/LoadingProvider': { useLoadingRouter: () => ({ replace() {} }) },
    '@/components/ClassIcon': { ClassIcon: () => null },
    '@/components/PanelTopbar': { PanelTopbar: () => null },
    '@/components/LanguageProvider': { useLanguage: () => ({ t: (s, values) => s.replace(/\{(\w+)\}/g, (m, key) => values?.[key] ?? m), formatNumber: String }) },
    '@/data/classes': { getClass: () => null, ROLE_COLOR: {} },
    '@/lib/character': { characterRepo: {} },
    '@/lib/gvg': { gvgRepo: { assign: async (...args) => calls.push(args), getAssignments: async () => ({}) } },
    '@/lib/gvg/lineup': require('../src/lib/gvg/lineup.ts'),
    '@/lib/members': { membersRepo: {} },
    '@/lib/permissions': { canLead: () => true },
    '@/lib/session': { getSession: () => member },
  };
  require.extensions['.tsx'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, filename);
  let Page;
  try {
    Module._load = function(request, ...args) { return Object.hasOwn(mocks, request) ? mocks[request] : originalLoad.call(this, request, ...args); };
    Page = require('../src/app/painel/gvg/page.tsx').default;
  } finally { Module._load = originalLoad; }
  const tree = Page();
  function find(node, predicate) {
    if (!node || typeof node !== 'object') return null;
    if (predicate(node)) return node;
    return [node.props?.children].flat(Infinity).map(child => find(child, predicate)).find(Boolean);
  }
  const player = find(tree, n => n.props?.draggable === true);
  const available = find(tree, n => n.type === 'aside');
  assert.ok(available.props.className.includes('of-gvg-available'));
  const event = { dataTransfer: { setData() {}, getData: () => member.id }, preventDefault() {}, stopPropagation() {} };
  player.props.onDragStart(event);
  available.props.onDragOver(event);
  available.props.onDrop(event);
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(calls, [[member.id, null]]);
  assert.deepEqual(updates[3], {});
  assert.equal(find(tree, n => n.type === 'button' && n.props.children === 'Limpar escalação'), undefined);
  assert.ok(find(tree, n => n.type === 'button' && n.props['aria-label'] === 'Limpar Grupo 1 de Elite'));
});
