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
        MouseIn: (x, y, w, h) => x === 1750 && y === 180 && w === 80 && h === 40,
        images: [],
    });
    c.DrawImageResize = (...args) => c.images.push(args);
    c.setProfilePanelOpen = value => { c.profilePanelOpen = value; };
    vm.runInContext(fs.readFileSync(new URL('../src/ui/profile.js', import.meta.url), 'utf8')
        .replace(/^import[\s\S]*?;\r?\n/gm, '').replace(/export /g, ''), c);
    return { c, lovers };
}

test('11–20 entries render on page two; same right-facing SVG cycles back and regions stay current', () => {
    const { c } = runtime(20);
    c.drawProfilePanel();
    assert.equal(c.getLoverRegions().length, 10);
    assert.equal(c.getLoverRegions()[0].memberNumber, 10);
    assert.equal(c.handleProfileClick(), true); assert.equal(c.getLoverRegions().length, 0);
    c.drawProfilePanel();
    assert.equal(c.getLoverRegions().length, 10);
    assert.equal(c.getLoverRegions()[0].memberNumber, 20);
    assert.equal(c.getLoverRegions()[9].memberNumber, 29);
    assert.equal(new Set(c.getLoverRegions().map(r => `${r.x},${r.y}`)).size, 10);
    assert.equal(c.images[0][0], c.images[1][0]);
    assert.deepEqual(Array.from(c.images[0].slice(1)), [1750, 180, 80, 40]);
    c.handleProfileClick(); c.drawProfilePanel();
    assert.equal(c.getLoverRegions()[0].memberNumber, 10);
});

test('11-person final page, shrinking list, switching characters, and single-page hit testing', () => {
    const { c, lovers } = runtime(11);
    c.drawProfilePanel(); c.handleProfileClick(); c.drawProfilePanel();
    assert.equal(c.getLoverRegions().length, 1);
    lovers.pop(); c.drawProfilePanel();
    assert.equal(c.getLoverRegions().length, 10); assert.equal(c.handleProfileClick(), false);
    lovers.push({ memberNumber: 30 }); c.handleProfileClick();
    c.InformationSheetSelection = { MemberNumber: 2, OnlineSharedSettings: { AFC: { lovers } } };
    c.drawProfilePanel(); assert.equal(c.getLoverRegions()[0].memberNumber, 10);
});
