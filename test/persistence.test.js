import { getLockDraft } from '../src/features/heartlock/crafting/draft-config.js';
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

function settings(Player) {
    const c = run('../src/core/settings.js', { Player, MOD_VERSION: 'test', setLastKnownLoverCount() {},
        ServerPlayerExtensionSettingsSync() {}, ServerAccountUpdate: { QueueData() {} },
    });
    return { c };
}

function locks(current, backup, accept) {

    const Player = { AccountName: 'A', MemberNumber: 1, Appearance: [],
        ExtensionSettings: { AFC_HeartLock: current }, OnlineSharedSettings: { AFC_HeartLock: backup } };
    let questions = 0;
    const events = [];
    const c = run('../src/features/heartlock/storage.js', { Player,
        window: { Player }, confirmInAFC: async () => { questions++; return accept; },
        getLockDraft, restoreHeartLockMarkers() {}, _pendingRestore: new Set(), state: { operations: {} },
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

test('foreign heartlock data and manual restore are rejected without overwriting source', async () => {
    const current = { memberNumber: 9, padlocks: { ItemArms: { owner: 2, lockId: 'x' } } };
    const r = locks(current, null, true);
    assert.equal(r.c.ensureStorage(), false);
    assert.equal(await r.c.restoreStorageWithConsent(current), false);
    assert.equal(r.Player.ExtensionSettings.AFC_HeartLock.memberNumber, 9);
    assert.equal(r.questions(), 0);
});

test('same heartlock decision is retained across logins even when asset restoration is pending', async () => {
    for (const accept of [true, false]) {
        const r = locks({ padlocks: { ItemArms: { owner: 2, lockId: 'same', assetName: 'Cuffs' } } }, null, accept);
        await r.c.reconcileHLStorage();
        assert.equal(r.questions(), 1);
        const next = locks(structuredClone(r.Player.ExtensionSettings.AFC_HeartLock), null, accept);
        await next.c.reconcileHLStorage();
        assert.equal(next.questions(), 0);
        next.Player.HeartLock.padlocks.ItemLegs = { owner: 2, lockId: 'new', assetName: 'Rope' };
        await next.c.reconcileHLStorage();
        assert.equal(next.questions(), 1);
    }
});

test('stale heartlock replies cannot overwrite an account or a changed active lock set', async () => {
    for (const switchAccount of [true, false]) {
        const r = locks({ padlocks: { ItemArms: { owner: 2, lockId: 'same' } } }, null, true);
        let answer;
        r.c.confirmInAFC = () => new Promise(resolve => { answer = resolve; });
        const pending = r.c.reconcileHLStorage();
        if (switchAccount) r.c.Player = { MemberNumber: 3, ExtensionSettings: {} };
        else r.Player.HeartLock.padlocks = {};
        answer(true); await pending;
        assert.equal(r.events.includes('storage-recovery-approved'), false);
        assert.equal(r.c.state.operations.recoveryPending, false);
    }
});

test('profile follows BC selection and never falls back to the player', () => {
    let source = fs.readFileSync(new URL('../src/ui/relationships/profile.js', import.meta.url), 'utf8');
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

test('backup recovery adds missing lovers without deleting others or resetting dates', () => {
    const lovers = [{ memberNumber: 2, startDate: 100 }, { memberNumber: 3, startDate: 200 }];
    const c = run('../src/features/relationships/backup-restore.js', {
        getSharedSettings: () => ({ lovers }),
        readBackupLovers: () => [{ memberNumber: 2, startDate: 999 }, { memberNumber: 4, startDate: 300 }],
        getLoverEntry: num => lovers.find(l => l.memberNumber === num),
        upsertLover: lover => { lovers.push(lover); return lover; },
    });
    assert.equal(c.restoreAllLovers('backup'), 1);
    assert.equal(lovers.length, 3);
    assert.equal(lovers[0].startDate, 100);
    assert.equal(c.restoreLover('backup', 0).startDate, 100);
    c.readBackupLovers = () => [];
    assert.equal(c.restoreAllLovers('backup'), 0);
    assert.equal(lovers.length, 3);
});

test('ES is authoritative; public writes and account switching cannot change the private list', () => {
    const Player = { MemberNumber: 1, ExtensionSettings: {}, OnlineSharedSettings: { AFC: { lovers: [{ memberNumber: 2 }] } } };
    const { c } = settings(Player);
    const own = c.initializeSharedSettings();
    assert.equal(own.lovers.length, 0, 'public data is a projection, never a source');
    own.lovers.push({ memberNumber: 5 });
    c.saveSharedSettings();
    assert.equal(Player.OnlineSharedSettings.AFC.lovers[0].memberNumber, 5, 'projection follows the private list');
    Player.OnlineSharedSettings.AFC.lovers[0].memberNumber = 9;
    assert.equal(own.lovers[0].memberNumber, 5, 'public writes cannot change the private list');
    Player.MemberNumber = 3;
    assert.equal(c.initializeSharedSettings(), null);
    c.saveSharedSettings();
    assert.equal(Player.ExtensionSettings.AFC_Data.memberNumber, 1);
    c.Player = { MemberNumber: 4, ExtensionSettings: {}, OnlineSharedSettings: {} };
    assert.equal(c.initializeSharedSettings().lovers.length, 0);
});

test('getSharedSettings is a pure read; initializeSharedSettings only creates empty data and never migrates', () => {
    const synced = [];
    const player = { MemberNumber: 1, ExtensionSettings: { AFC_LoverBackup: { memberNumber: 1, lovers: [{ memberNumber: 8 }] } },
        OnlineSharedSettings: { AFC: { lovers: [{ memberNumber: 2 }] } } };
    const { c } = settings(player);
    c.ServerPlayerExtensionSettingsSync = key => synced.push(key);
    const before = JSON.stringify(player);
    for (let i = 0; i < 5; i++) assert.equal(c.getSharedSettings(), null);   // 初始化前沒有資料
    assert.equal(JSON.stringify(player), before, 'nothing was written');
    assert.deepEqual(synced, []);

    const data = c.initializeSharedSettings();
    assert.equal(data.lovers.length, 0, 'old public/backup lovers are not migrated');
    assert.equal(data.memberNumber, 1);
    assert.equal(c.getSharedSettings(), data);
    assert.deepEqual(synced, ['AFC_Data']);
    assert.deepEqual(player.OnlineSharedSettings.AFC.lovers, [{ memberNumber: 2 }], 'initialization does not touch the public projection');
    assert.equal(player.ExtensionSettings.AFC_LegacyPublic, undefined);
    for (let i = 0; i < 5; i++) c.getSharedSettings();
    assert.equal(c.initializeSharedSettings(), data, 'initialization is idempotent');
    assert.deepEqual(synced, ['AFC_Data'], 'neither reads nor repeated initialization sync');
});

test('getSharedSettings never returns another account\'s data and warns once', async () => {
    const warnings = [];
    const player = { MemberNumber: 1, ExtensionSettings: { AFC_Data: { memberNumber: 2, lovers: [{ memberNumber: 5 }] } }, OnlineSharedSettings: {} };
    const { c } = settings(player);
    c.console = { warn: (...a) => warnings.push(a), error() {}, log() {} };
    for (let i = 0; i < 4; i++) assert.equal(c.getSharedSettings(), null);
    assert.equal(c.initializeSharedSettings(), null);                         // 不覆寫
    assert.equal(player.ExtensionSettings.AFC_Data.memberNumber, 2);
    assert.equal(warnings.length, 1);
});
