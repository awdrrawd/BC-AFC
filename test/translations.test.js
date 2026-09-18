import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { URL } from 'node:url';

const langs = ['TW', 'CN', 'EN', 'DE', 'FR', 'RU', 'UA'];
const readTable = (ns, lang) => JSON.parse(fs.readFileSync(new URL(`../Translation/${ns}/${lang}.json`, import.meta.url), 'utf8'));
const placeholders = text => [...new Set(text.match(/\{\d+\}/g) ?? [])].sort();

test('all seven AFC/HeartLock locales have matching keys and substitution placeholders', () => {
    for (const ns of ['afc', 'hl']) {
        const en = readTable(ns, 'EN');
        for (const lang of langs) {
            const table = readTable(ns, lang);
            assert.deepEqual(Object.keys(table).sort(), Object.keys(en).sort(), `${ns}/${lang}`);
            for (const key of Object.keys(en)) {
                assert.ok(table[key].trim(), `${lang}/${key}`);
                assert.deepEqual(placeholders(table[key]), placeholders(en[key]), `${lang}/${key}`);
            }
        }
    }
});

test('date and duration formats use the selected language instead of hardcoded Chinese units', () => {
    for (const lang of langs) {
        const table = readTable('afc', lang);
        const c = vm.createContext({ t: (key, ...args) => table[key].replace(/\{(\d+)\}/g, (_, i) => args[i]) });
        vm.runInContext(fs.readFileSync(new URL('../src/util/util.js', import.meta.url), 'utf8')
            .replace(/^import .*;\r?\n/gm, '').replace(/export /g, ''), c);
        const date = c.formatStartDate(Date.now() - 12 * 86400000);
        const duration = c.formatDuration(400 * 86400000);
        assert.ok(date.includes(table.totalDays.replace('{0}', '12')));
        if (lang !== 'TW' && lang !== 'CN') assert.doesNotMatch(date + duration, /[\u3400-\u9fff]/);
    }
});
