const fs = require('node:fs');
const ts = require('typescript');
const assert = require('node:assert/strict');
const { test } = require('node:test');
// Load the app's TypeScript without adding a test-only runtime dependency.
require.extensions['.ts'] = (module, filename) => {
  const source = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  module._compile(source, filename);
};
const { translate, isLanguage, locales } = require('../src/lib/i18n/index.ts');
const { messages } = require('../src/lib/i18n/messages.ts');

test('every translation preserves its interpolation parameters', () => {
  const parameters = text => [...text.matchAll(/\{(\w+)\}/g)].map(m => m[1]).sort();
  for (const [key, variants] of Object.entries(messages)) {
    assert.equal(variants.length, 2, key);
    for (const value of variants) {
      assert.ok(value.trim(), key);
      assert.deepEqual(parameters(value), parameters(key), key);
    }
  }
});
test('switching languages translates navigation and returns the original Portuguese', () => {
  assert.equal(translate('en', 'Meu Personagem'), 'My Character');
  assert.equal(translate('es', 'Meu Personagem'), 'Mi personaje');
  assert.equal(translate('pt', 'Meu Personagem'), 'Meu Personagem');
});
test('nicknames and interpolation values are preserved literally', () => {
  const nickname = '$& <Orion> {nickname}';
  assert.equal(translate('en', 'Bem-vindo, {nickname}!', { nickname }), `Welcome, ${nickname}!`);
  assert.equal(translate('es', 'O nickname "Dragon" já está cadastrado.'), 'El apodo "Dragon" ya está registrado.');
});
test('known dynamic API errors are localized without modifying API values', () => {
  assert.equal(translate('en', 'Muitas tentativas. Tente novamente em 3 min.'), 'Too many attempts. Try again in 3 min.');
  assert.equal(translate('es', 'O lance precisa ser maior que 1.000 z.'), 'La puja debe ser mayor que 1.000 z.');
});
test('unknown text, prototype keys and game identifiers remain unchanged', () => {
  for (const text of ['Knight', 'Um aviso escrito pelo membro', 'constructor', '__proto__']) {
    assert.equal(translate('en', text), text);
  }
});
test('only supported persisted languages are accepted', () => {
  for (const language of ['pt', 'en', 'es']) assert.ok(isLanguage(language));
  for (const value of [null, '', 'fr', 'pt-BR', {}, '__proto__']) assert.equal(isLanguage(value), false);
  assert.equal(new Intl.NumberFormat(locales.en).format(1234.5), '1,234.5');
  assert.equal(new Intl.NumberFormat(locales.pt).format(1234.5), '1.234,5');
});
