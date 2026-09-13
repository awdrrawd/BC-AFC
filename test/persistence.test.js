import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { URL } from 'node:url';
import v8 from 'node:v8';
const structuredClone = value => v8.deserialize(v8.serialize(value));

function run(path, globals) {
    const source = fs.readFileSync(new URL(path, import.meta.url), 'utf8')
        .replace(/^import .*;\r?\n/gm, '').replace(/export /g, '');
    const context = vm.createContext({ structuredClone, console: { warn() {} }, ...globals });
    vm.runInContext(source, context);
    return context;
}
test('legacy backup reads are account scoped and never use browser storage', () => {
    const Player = { MemberNumber: 1, ExtensionSettings: { AFC_LoverBackup: { memberNumber: 1, lovers: [{ memberNumber: 2 }] } } };
    const c = run('../src/core/lover-backup.js', { Player });
    assert.equal(c.readBackupLovers().length, 1);
    Player.MemberNumber = 3;
    assert.equal(c.readBackupLovers().length, 0);
});

function settings(Player, accept = true) {
    let questions = 0;
    const c = run('../src/core/settings.js', { Player, MOD_VERSION: 'test',
        normalizeLoverList: list => structuredClone(list), setLastKnownLoverCount() {},
        window: { confirm() { questions++; return accept; } },
        ServerPlayerExtensionSettingsSync() {}, ServerAccountUpdate: { QueueData() {} }, broadcastAFCData() {},
    });
    return { c, questions: () => questions };
}

test('ES is authoritative; public writes and account switching cannot change the private list', () => {
    const Player = { MemberNumber: 1, ExtensionSettings: {}, OnlineSharedSettings: { AFC: { lovers: [{ memberNumber: 2 }] } } };
    const { c, questions } = settings(Player);
    const own = c.getSharedSettings();
    assert.equal(questions(), 1);
    c.saveSharedSettings();
    Player.OnlineSharedSettings.AFC.lovers[0].memberNumber = 9;
    assert.equal(own.lovers[0].memberNumber, 2);
    Player.MemberNumber = 3;
    assert.equal(c.getSharedSettings(), null);
    c.saveSharedSettings();
    assert.equal(Player.ExtensionSettings.AFC_Data.memberNumber, 1);
    c.Player = { MemberNumber: 4, ExtensionSettings: {}, OnlineSharedSettings: {} };
    assert.equal(c.getSharedSettings().lovers.length, 0);
});

test('declining legacy migration preserves source but does not adopt its lovers', () => {
    const Player = { MemberNumber: 1, ExtensionSettings: {}, OnlineSharedSettings: { AFC: { lovers: [{ memberNumber: 2 }] } } };
    const { c, questions } = settings(Player, false);
    assert.equal(c.getSharedSettings().lovers.length, 0);
    c.getSharedSettings();
    assert.equal(questions(), 1);
    assert.equal(Player.ExtensionSettings.AFC_LegacyPublic.lovers.length, 1);
});

function locks(current, backup, accept) {

    const Player = { AccountName: 'A', MemberNumber: 1, Appearance: [],
        ExtensionSettings: { AFC_HeartLock: current }, OnlineSharedSettings: { AFC_HeartLock: backup } };
    let questions = 0;
    const events = [];
    const c = run('../src/heartlock/storage.js', { Player,
        window: { Player, confirm: () => { questions++; return accept; } },
        DEFAULT_STORAGE: { padlocks: {}, updatedAt: 0 }, HSLOCK_NAME: 'HighSecurityPadlock', EXT_KEY: 'AFC_HeartLock',
        clone: structuredClone, T: key => key, emitHeartLockEvent: event => events.push(event),
        ServerPlayerExtensionSettingsSync() {}, ServerAccountUpdate: { QueueData() {} },
    });
    return { c, Player, events, questions: () => questions };
}

test('newer empty lock state wins over an old locked backup without asking', async () => {
    const r = locks({ updatedAt: 20, padlocks: {} }, { updatedAt: 10, padlocks: { ItemArms: { owner: 2, lockId: 'old' } } }, true);
    await r.c.reconcileHLStorage();
    assert.equal(Object.keys(r.Player.HeartLock.padlocks).length, 0);
    assert.equal(r.questions(), 0);
});

test('declined missing lock cannot reach automatic recovery; public mirror omits notes', async () => {
    const candidate = { updatedAt: 20, padlocks: { ItemArms: { owner: 2, lockId: 'a', note: 'private' } } };
    const r = locks(candidate, null, false);
    await r.c.reconcileHLStorage();
    assert.equal(r.questions(), 1);
    assert.equal(Object.keys(r.Player.HeartLock.padlocks).length, 0);
    assert.equal(r.events.includes('storage-recovery-approved'), false);
    const accepted = locks(structuredClone(candidate), null, true);
    await accepted.c.reconcileHLStorage();
    assert.equal(accepted.Player.HeartLock.padlocks.ItemArms.note, 'private');
    assert.equal(accepted.Player.OnlineSharedSettings.AFC_HeartLock.padlocks.ItemArms.note, undefined);
});

test('public state cannot overwrite a private note; existing real locks do not prompt', async () => {
    const r = locks({ updatedAt: 10, padlocks: { ItemArms: { owner: 2, lockId: 'a', note: 'old' } } },
        { updatedAt: 20, padlocks: { ItemArms: { owner: 2, lockId: 'a', note: 'new' } } }, false);
    r.Player.Appearance.push({ Asset: { Group: { Name: 'ItemArms' } }, Property: { HeartLockId: 'a', LockedBy: 'HighSecurityPadlock' } });
    await r.c.reconcileHLStorage();
    assert.equal(r.Player.HeartLock.padlocks.ItemArms.note, 'old');
    assert.equal(r.questions(), 0);
});

test('foreign heartlock data and manual restore are rejected without overwriting source', () => {
    const current = { memberNumber: 9, padlocks: { ItemArms: { owner: 2, lockId: 'x' } } };
    const r = locks(current, null, true);
    assert.equal(r.c.ensureStorage(), false);
    assert.equal(r.c.restoreStorageWithConsent(current), false);
    assert.equal(r.Player.ExtensionSettings.AFC_HeartLock.memberNumber, 9);
    assert.equal(r.questions(), 0);
});

test('profile follows BC selection and never falls back to the player', () => {
    let source = fs.readFileSync(new URL('../src/ui/profile.js', import.meta.url), 'utf8');
    source = source.slice(source.indexOf('export function getCurrentViewingCharacter()'), source.indexOf('export function drawProfileButton'))
        .replace(/export /g, '');
    const Player = { MemberNumber: 1 };
    const target = { MemberNumber: 2, OnlineSharedSettings: { AFC: { lovers: [{ memberNumber: 3 }] } } };
    const c = vm.createContext({ Player, InformationSheetCharacter: Player, InformationSheetSelection: target, getSharedSettings: () => ({ lovers: [{ memberNumber: 99 }] }) });
    vm.runInContext(source, c);
    assert.equal(c.getCurrentViewingCharacter(), target);
    assert.equal(c.getViewingCharacterAFCLovers()[0].memberNumber, 3);
    c.InformationSheetSelection = 777;
    assert.equal(c.getCurrentViewingCharacter(), null);
    assert.equal(c.getViewingCharacterAFCLovers().length, 0);
});

test('late online query from a previous account cannot update the new account cache', async () => {
    const handlers = new Map();
    let updates = 0;
    const c = vm.createContext({ Player: { MemberNumber: 1 }, lastOnlineFetch: 0,
        setTimeout: () => 1, clearTimeout() {}, ServerSend() {},
        registerSocketListener: (event, fn) => { handlers.set(event, fn); return () => {}; },
        setOnlineFriendsCache() { updates++; }, setLastOnlineFetch() {},
    });
    const source = fs.readFileSync(new URL('../src/net/online.js', import.meta.url), 'utf8')
        .replace(/^import[\s\S]*?;\r?\n/gm, '').replace(/export /g, '');
    vm.runInContext(source, c);
    const pending = c.refreshOnlineFriends(true);
    c.Player = { MemberNumber: 2 };
    handlers.get('AccountQueryResult')({ Query: 'OnlineFriends', Result: [{ MemberNumber: 3 }] });
    assert.equal(await pending, false);
    assert.equal(updates, 0);
});
