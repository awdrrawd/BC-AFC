import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { URL } from 'node:url';
import * as config from '../src/core/config.js';

// 最小假 DOM：依選擇器裡的 class 比對列；選擇器若要求 .information-sheet-relations-slot，只回傳在該容器內的列
function fakeRow(cls, member, { inSlot = false } = {}) {
    const children = [];
    const row = {
        cls, inSlot, children,
        querySelectorAll: () => (member == null ? [{ textContent: 'Name' }] : [{ textContent: 'Name' }, { textContent: String(member) }]),
        querySelector: () => children.find(c => c.className === 'afc-relation-dot') ?? null,
        prepend(el) { children.unshift(el); el.parent = row; },
    };
    return row;
}
function fakeDot() { return { className: '', dataset: {}, setAttribute() {}, remove() { this.removed = true; } }; }

function runtime(rows, online) {
    const document = {
        body: {}, head: { appendChild() {} },
        getElementById: () => ({}),
        createElement: () => fakeDot(),
        querySelectorAll(selector) {
            const wantsSlot = selector.includes('information-sheet-relations-slot');
            const classes = selector.match(/\.information-sheet-(?:owner|lover|entry-title)/g) ?? [];
            return rows.filter(r => classes.includes(`.${r.cls}`) && (!wantsSlot || r.inSlot));
        },
    };
    const c = vm.createContext({ ...config, document, getPrivateSettings: () => ({ showOnlineStatus: true }), isOnline: n => online.has(n) });
    vm.runInContext(fs.readFileSync(new URL('../src/ui/relationships/profile.js', import.meta.url), 'utf8')
        .replace(/^import[\s\S]*?;\r?\n/gm, '').replace(/export /g, ''), c);
    return c;
}

test('owner and lover rows on one\'s own sheet (no relations-slot wrapper) get the online light', () => {
    const owner = fakeRow('information-sheet-owner', 100);
    const lover = fakeRow('information-sheet-lover', 200);
    const offline = fakeRow('information-sheet-lover', 300);
    runtime([owner, lover, offline], new Set([100, 200])).drawBCRelationDots();
    assert.equal(owner.children[0].dataset.online, '1');
    assert.equal(lover.children[0].dataset.online, '1');
    assert.equal(offline.children[0].dataset.online, '0');
});

test('legacy entry-title rows still work, and rows without a member number (NPC) get no light', () => {
    const legacy = fakeRow('information-sheet-entry-title', 42, { inSlot: true });
    const npc = fakeRow('information-sheet-lover', null);
    runtime([legacy, npc], new Set([42])).drawBCRelationDots();
    assert.equal(legacy.children[0].dataset.online, '1');
    assert.equal(npc.children.length, 0);
});
