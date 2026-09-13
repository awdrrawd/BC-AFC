import { readFileSync, readdirSync, statSync } from 'node:fs';
import assert from 'node:assert/strict';
const read = path => JSON.parse(readFileSync(path, 'utf8'));
for (const namespace of ['afc', 'hl']) {
  const base = read('Translation/' + namespace + '/EN.json');
  for (const language of ['EN', 'TW', 'CN', 'DE', 'FR', 'RU', 'UA']) {
    const path = 'Translation/' + namespace + '/' + language + '.json';
    const data = read(path);
    assert.deepEqual(Object.keys(data).sort(), Object.keys(base).sort(), path + ': translation keys differ');
    for (const [key, value] of Object.entries(data)) {
      assert.equal(typeof value, 'string', path + ': ' + key);
    }
    assert.deepEqual(read('dist/' + path), data, path + ': build copy differs');
  }
}
for (const name of readdirSync('Images').filter(n => n.endsWith('.png'))) {
  assert.ok(readFileSync('Images/' + name).equals(readFileSync('dist/' + name)), name + ': build copy differs');
}
for (const path of ['dist/assets/main.js', 'dist/assets/app.js']) assert.ok(statSync(path).size > 0);
console.log('Translations and build assets verified');
