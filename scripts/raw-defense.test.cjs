const fs = require('node:fs');
const ts = require('typescript');
const assert = require('node:assert/strict');
const { test } = require('node:test');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText, filename);
const { calculateRawDefense, parseDefenseInput, restoreCalculator } = require('../src/lib/raw-defense.ts');

test('reference screenshot calculations match when rounded to two decimals', () => {
  for (const [equipment, percent, expected] of [[3908, 32.46, 2950.32], [3257, 28.92, 2526.37], [930, 19.2, 780.2], [11500, 44, 7986.11], [2639, 24, 2128.23]]) {
    assert.equal(Number(calculateRawDefense(equipment, percent).raw.toFixed(2)), expected);
  }
});
test('zero bonuses and defense are valid; missing or invalid inputs never become zero silently', () => {
  assert.equal(calculateRawDefense(1200, 0).raw, 1200);
  assert.equal(calculateRawDefense(0, 50).raw, 0);
  for (const value of ['', ' ', '-1', 'NaN', 'Infinity', '1e3', '3.908,00', '12abc']) assert.equal(parseDefenseInput(value), null);
  for (const [text, expected] of [['32,46', 32.46], ['32.46', 32.46], ['0', 0], ['.5', .5]]) assert.equal(parseDefenseInput(text), expected);
  assert.equal(parseDefenseInput('32,46%', true), 32.46);
  assert.equal(parseDefenseInput('3908%'), null);
});
test('Ignore comparison preserves the signed gap without inventing a damage reduction percentage', () => {
  assert.equal(calculateRawDefense(1440, 44, 800).gap, 200);
  assert.equal(calculateRawDefense(1440, 44, 1000).gap, 0);
  assert.equal(calculateRawDefense(1440, 44, 1200).gap, -200);
  assert.equal(calculateRawDefense(1440, 44).gap, null);
  for (const bad of [-1, Infinity, NaN]) {
    assert.throws(() => calculateRawDefense(bad, 0));
    assert.throws(() => calculateRawDefense(1, bad));
    assert.throws(() => calculateRawDefense(1, 0, bad));
  }
});
test('saved calculations restore only expected string fields and never share mutable defaults', () => {
  assert.deepEqual(restoreCalculator({ physical: { equipment: '3908', bonus: 32.46 }, magical: 'bad' }), {
    physical: { equipment: '3908', bonus: '', ignore: '' }, magical: { equipment: '', bonus: '', ignore: '' },
  });
  const first = restoreCalculator(null);
  first.physical.equipment = '123';
  assert.equal(restoreCalculator(null).physical.equipment, '');
});
