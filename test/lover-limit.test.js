import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { URL } from 'node:url';
import * as config from '../src/core/config.js';
import * as model from '../src/relations/lover-model.js';

function runtime(count) {
    const settings = { lovers: Array.from({ length: count }, (_, i) => ({ memberNumber: i + 10, name: `L${i}`, startDate: 1 })) };
    const c = vm.createContext({ ...config, ...model, settings, window: {},
        Player: { MemberNumber: 1, Name: 'Self', FriendList: [99, 100], Lovership: [] },
        getSharedSettings: () => settings, saveSharedSettings() {}, setLastKnownLoverCount() {},
        pendingOutgoing: {}, pendingRestoreOut: {}, pendingIncoming: {}, pendingRestoreInc: {},
        _lastProposalSent: {}, AFCLockAccessOn: new Set(), loversPrivateRoom: {},
        getPrivateSettings: () => ({}), savePrivateSettings() {}, console: { log() {} },
        t: (key, ...args) => `${key}:${args}`, notices: [], messages: [], prompts: [],
        daysSince: () => 10, broadcastEvent() {},
        clearRequest: (store, key) => { delete store[key]; },
        scheduleOutgoing: (store, key) => { store[key] = {}; },
    });
    c.chatLocalNotice = text => c.notices.push(text);
    c.sendBeep = (...args) => c.messages.push(args);
    c.showIncoming = options => c.prompts.push(options);
    for (const name of ['lovers', 'propose', 'restore']) {
        const source = fs.readFileSync(new URL(`../src/relations/${name}.js`, import.meta.url), 'utf8')
            .replace(/^import[\s\S]*?;\r?\n/gm, '').replace(/export /g, '');
        vm.runInContext(source, c);
    }
    return c;
}

test('20th lover succeeds, 21st is rejected by every mutation entry; existing updates still work', () => {
    const c = runtime(19);
    assert.equal(c.addLover(99, 'Last'), true);
    assert.equal(c.addLover(100, 'Overflow'), false);
    assert.equal(c.upsertLover({ memberNumber: 100 }), null);
    assert.equal(c.upsertLover({ memberNumber: 99, name: 'Updated' }).name, 'Updated');
    c.replaceLovers([...c.settings.lovers, { memberNumber: 100 }]);
    assert.equal(c.settings.lovers.length, 20);
});

test('outgoing requests reserve the last slot and final acceptance consumes it once', () => {
    const c = runtime(19);
    const target = number => ({ MemberNumber: number, Name: 'Target', OnlineSharedSettings: { AFC: { lovers: [] } } });
    c.proposeToCharacter(target(99));
    c.proposeToCharacter(target(100));
    assert.equal(c.messages.filter(m => m[1] === config.BEEP.PROPOSE).length, 1);
    assert.equal(c.addLover(100, 'Incoming'), false);
    c.handleAccepted(99, 'Target');
    assert.equal(c.settings.lovers.length, 20);
    assert.equal(c.AFCLockAccessOn.has(99), true);
    c.handleAccepted(100, 'Unsolicited');
    assert.equal(c.settings.lovers.length, 20);
});

test('receiver rechecks capacity on click and does not grant lock access or send false success', () => {
    const c = runtime(19);
    c.handleIncomingProposal(99, 'First'); c.handleIncomingProposal(100, 'Second');
    assert.equal(c.prompts.length, 2);
    c.prompts[0].onAccept(() => {}); c.prompts[1].onAccept(() => {});
    assert.equal(c.settings.lovers.length, 20);
    assert.equal(c.messages.filter(m => m[1] === config.BEEP.ACCEPT).length, 1);
    assert.equal(c.AFCLockAccessOn.has(100), false);
    c.handleIncomingProposal(101, 'Full'); assert.equal(c.prompts.length, 2);
});

test('sender checks target capacity; restore cannot bypass the local cap', () => {
    const c = runtime(20);
    c.proposeToCharacter({ MemberNumber: 99, Name: 'Target' });
    c.handleIncomingRestore(99, 'Target', 0, 1, 1);
    c.pendingRestoreOut[99] = {};
    c.handleRestoreAccepted(99, 'Target', 0, 1, 1);
    assert.equal(c.settings.lovers.length, 20); assert.equal(c.AFCLockAccessOn.has(99), false);
    assert.equal(c.messages.length, 0); assert.equal(c.prompts.length, 0);
    const d = runtime(0);
    d.proposeToCharacter({ MemberNumber: 99, Name: 'Full target', OnlineSharedSettings: { AFC: {
        lovers: Array.from({ length: 20 }, (_, i) => ({ memberNumber: i + 200 })),
    } } });
    assert.equal(d.messages.length, 0);
});
