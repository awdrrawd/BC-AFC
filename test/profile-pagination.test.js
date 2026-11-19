import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { URL } from 'node:url';
import * as config from '../src/core/config.js';

function runtime(count) {
    const lovers = Array.from({ length: count }, (_, i) => ({ memberNumber: i + 10, name: `L${i}`, stage: 0, startDate: 1 }));
    const c = vm.createContext({ ...config, Player: { MemberNumber: 1 },
        InformationSheetSelection: { MemberNumber: 1 }, CurrentScreen: 'InformationSheet', profilePanelOpen: true,
        getSharedSettings: () => ({ lovers }), getPrivateSettings: () => ({ showOnlineStatus: false }),
        t: (k, ...a) => `${k}:${a}`, stageLabel: () => 'dating', daysSince: () => 12,
        DrawText() {}, DrawTextFit() {}, DrawButton() {},
        MainCanvas: { save() {}, restore() {}, beginPath() {}, rect() {}, clip() {}, fillRect() {}, stroke() {} },
    });
    c.setProfilePanelOpen = value => { c.profilePanelOpen = value; };
    vm.runInContext(fs.readFileSync(new URL('../src/ui/relationships/profile.js', import.meta.url), 'utf8')
        .replace(/^import[\s\S]*?;\r?\n/gm, '').replace(/export /g, ''), c);
    return { c, lovers };
}

test('11–20 entries render on page two; paging cycles back and regions stay current', () => {
    const { c } = runtime(20);
    c.drawProfilePanel();
    assert.equal(c.getLoverRegions().length, 10);
    assert.equal(c.getLoverRegions()[0].memberNumber, 10);
    assert.equal(c.nextProfilePage(), true); assert.equal(c.getLoverRegions().length, 0);
    c.drawProfilePanel();
    assert.equal(c.getLoverRegions().length, 10);
    assert.equal(c.getLoverRegions()[0].memberNumber, 20);
    assert.equal(c.getLoverRegions()[9].memberNumber, 29);
    assert.equal(new Set(c.getLoverRegions().map(r => `${r.x},${r.y}`)).size, 10);
    c.nextProfilePage(); c.drawProfilePanel();
    assert.equal(c.getLoverRegions()[0].memberNumber, 10);
});

test('11-person final page, shrinking list, switching characters, and single-page hit testing', () => {
    const { c, lovers } = runtime(11);
    c.drawProfilePanel(); c.nextProfilePage(); c.drawProfilePanel();
    assert.equal(c.getLoverRegions().length, 1);
    lovers.pop(); c.drawProfilePanel();
    assert.equal(c.getLoverRegions().length, 10); assert.equal(c.nextProfilePage(), false);
    lovers.push({ memberNumber: 30 }); c.nextProfilePage();
    c.InformationSheetSelection = { MemberNumber: 2, OnlineSharedSettings: { AFC: { lovers } } };
    c.drawProfilePanel(); assert.equal(c.getLoverRegions()[0].memberNumber, 10);
});
