import { URL } from 'node:url';
import console from 'node:console';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function runtime() {
    let now = 1000;
    const hooks = {};
    const c = vm.createContext({
        Date: class extends Date { static now() { return now; } },
        GRAB_WINDOW_MS: 14000, GRAB_COOLDOWN_MS: 120000,
        HEARTLOCK_NAME: 'HeartLock', HSLOCK_NAME: 'HighSecurityPadlock', EXT_KEY: 'AFC_HeartLock',
        DEFAULT_STORAGE: { padlocks: {} }, clone: value => JSON.parse(JSON.stringify(value)),
        state: { operations: {}, panel: {} }, _pendingRestore: new Set(),
        r132CompleteCraft: value => value, restoreSnapshotCraft: () => false,
        restoreHeartLockMarkers() {}, onHeartLockEvent() {}, emitHeartLockEvent() {},
        ServerAccountUpdate: { QueueData() {} }, ServerPlayerExtensionSettingsSync() {},
        CharacterRefresh() {}, ChatRoomCharacterUpdate() {}, rebaselineCurseIfNeeded() {},
        sendLocalizedAction() {}, log() {}, console, isMemberAllowedByMe: n => n === 2,
        ValidationDeleteLock: p => { delete p.LockedBy; delete p.LockMemberNumber; delete p.MemberNumberListKeys; },
        ValidationSanitizeProperties() {}, ValidationSanitizeLock() {},
        installHeartLockRemovalHook() {}, installHeartLockPropertyHooks() {}, setupOrgasmHooks() {},
        setTimeout() {}, HL_PANEL_ID: 'panel',
        InventoryGet: (ch, gn) => ch.Appearance.find(i => i.Asset.Group.Name === gn),
        AssetGet: () => ({}),
        InventoryLock: (_ch, item) => { item.Property ??= {}; item.Property.LockedBy = 'HighSecurityPadlock'; item.Property.MemberNumberListKeys = ''; },
        InventoryWear: (ch, name, gn, color) => { const item = { Asset: { Name: name, Group: { Name: gn } }, Color: color }; ch.Appearance.push(item); return item; },
        InventoryRemove: (ch, gn) => { ch.Appearance = ch.Appearance.filter(i => i.Asset.Group.Name !== gn); },
        isAllowedToUnlock: () => true,
    });
    c.Player = { MemberNumber: 1, Name: 'Wearer', IsPlayer: () => true, Appearance: [], ExtensionSettings: {}, OnlineSharedSettings: {} };
    c.window = c;
    c.ChatRoomCharacter = [c.Player];
    c.sent = [];
    c.ServerSend = (...args) => c.sent.push(args);
    for (const file of ['protection', 'storage', 'snapshot', 'lock', 'net', 'timer', 'vibe']) {
        vm.runInContext(fs.readFileSync(new URL(`../src/heartlock/${file}.js`, import.meta.url), 'utf8')
            .replace(/^import [\s\S]*?;\r?\n/gm, '').replace(/export /g, ''), c);
    }
    vm.runInContext(fs.readFileSync(new URL('../src/hooks/heartlock.js', import.meta.url), 'utf8')
        .replace(/^import [\s\S]*?;\r?\n/gm, '').replace(/export /g, ''), c);
    c.installHeartLockHooks({ hook: (name, priority, fn) => { hooks[name] = fn; }, timeout() {} });
    vm.runInContext(fs.readFileSync(new URL('./fixtures/r132-extension-settings.txt', import.meta.url), 'utf8'), c);
    c.ensureStorage();
    const item = { Asset: { Name: 'Cuffs', Group: { Name: 'ItemArms' } }, Color: ['#123456'], Difficulty: 12,
        Craft: { Name: 'Craft' }, Property: { LockedBy: 'HighSecurityPadlock', LockMemberNumber: 2,
            Name: 'HeartLock', HeartLockId: 'lock1', MemberNumberListKeys: '2,3', TypeRecord: { a: 2 }, Effect: ['Lock', 'Block'] } };
    c.Player.Appearance.push(item);
    c.Player.HeartLock.padlocks.ItemArms = { owner: 2, assetName: 'Cuffs', lockId: 'lock1', _fullSnapshot: c.snapshotItem(item) };
    return { c, hooks, item, advance: ms => { now += ms; } };
}

test('shared sliding window counts events, not slots; expires and resets for another account', () => {
    const { c, advance } = runtime();
    assert.equal(c.recordProtectionConflict(), true);
    advance(15000);
    for (let i = 0; i < 3; i++) assert.equal(c.recordProtectionConflict(), true);
    assert.equal(c.recordProtectionConflict(), false);
    advance(119999); assert.equal(c.isProtectionPaused(), true);
    advance(1); assert.equal(c.isProtectionPaused(), false);
    c.recordProtectionConflict(); c.recordProtectionConflict(); c.recordProtectionConflict(); c.recordProtectionConflict();
    c.Player = { ...c.Player }; assert.equal(c.isProtectionPaused(), false);
});

test('mixed full/single/item syncs pause on fourth batch; periodic and direct restores honor pause', () => {
    const { c, hooks } = runtime();
    const cfg = c.Player.HeartLock.padlocks.ItemArms;
    for (const event of ['ChatRoomSyncCharacter', 'ChatRoomSyncSingle', 'ChatRoomSyncItem', 'ChatRoomSyncCharacter']) {
        const data = { Character: { MemberNumber: 1 }, SourceMemberNumber: 9, Item: { Target: 1, Group: 'ItemArms' }, Source: 9 };
        hooks[event]([data], () => { c.Player.Appearance = []; });
    }
    assert.equal(c.isProtectionPaused(), true);
    c.checkLockIntegrity(); c.cleanupFakeLocks();
    assert.equal(c.restoreLockFromConfig('ItemArms', cfg), 'skip');
    assert.equal(c.Player.Appearance.length, 0);
    assert.equal(c.Player.HeartLock.padlocks.ItemArms, cfg);
    // Authorized removal must still clean storage during the pause.
    c.reconcileProtection(2);
    assert.equal(c.Player.HeartLock.padlocks.ItemArms, undefined);
});

test('deletion removes recovery copies; stale appearance and removal cannot resurrect/delete a new lock', () => {
    const { c, item } = runtime();
    const store = c.Player.HeartLock;
    store.declinedRecovery = { ItemArms: store.padlocks.ItemArms };
    store.recoveryDecisions = { ItemArms: { accepted: true } };
    c._pendingRestore.add('ItemArms');
    assert.equal(c.deleteConfig('ItemArms', 'lock1'), true);
    c.Player.ExtensionSettings.AFC_HeartLock = JSON.parse(JSON.stringify(store));
    c.ensureStorage(); c.reapplyFromAppearance();
    assert.equal(c.Player.HeartLock.padlocks.ItemArms, undefined);
    assert.equal(c.Player.HeartLock.declinedRecovery.ItemArms, undefined);
    assert.equal(c.Player.HeartLock.recoveryDecisions.ItemArms, undefined);
    assert.equal(c._pendingRestore.size, 0);
    item.Property.HeartLockId = 'lock2'; c.reapplyFromAppearance();
    assert.equal(c.deleteConfig('ItemArms', 'lock1'), false);
    assert.equal(c.Player.ExtensionSettings.AFC_HeartLock.padlocks.ItemArms.lockId, 'lock2');
});

test('unlock failure retains backup and guard; successful unlock deletes it', () => {
    const { c, hooks, item } = runtime();
    hooks.InventoryUnlock([c.Player, item], () => {});
    assert.ok(c.Player.HeartLock.padlocks.ItemArms);
    assert.throws(() => hooks.InventoryUnlock([c.Player, item], () => { throw Error('failure'); }));
    assert.equal(c.state.operations.unlocking, undefined);
    hooks.InventoryUnlock([c.Player, item], () => { delete item.Property.LockedBy; });
    assert.equal(c.Player.ExtensionSettings.AFC_HeartLock.padlocks.ItemArms, undefined);
    assert.equal(item.Property.HeartLockId, undefined);
});

test('JSON ExtensionSettings roundtrip restores full item and matching lock key settings', () => {
    const { c, item } = runtime();
    const expected = JSON.parse(JSON.stringify(item.Property));
    c.saveAndSync();
    const payload = c.sent.find(([type]) => type === 'AccountUpdate')[1];
    assert.equal(payload['ExtensionSettings.AFC_HeartLock'].padlocks.ItemArms._fullSnapshot.property.MemberNumberListKeys, '2,3');
    c.Player.ExtensionSettings = JSON.parse(JSON.stringify(c.Player.ExtensionSettings));
    c.ensureStorage(); c.Player.Appearance = [];
    c.restoreLockFromConfig('ItemArms', c.Player.HeartLock.padlocks.ItemArms);
    const restored = c.Player.Appearance[0];
    assert.equal(restored.Property.MemberNumberListKeys, expected.MemberNumberListKeys);
    assert.equal(restored.Property.TypeRecord.a, 2);
    assert.equal(restored.Color[0], '#123456'); assert.equal(restored.Difficulty, 12);
    assert.equal(c.Player.HeartLock.padlocks.ItemArms._fullSnapshot.craft.Name, 'Craft');
    c.broadcastStorage();
    assert.equal(c.sent.at(-1)[1].Dictionary[0].Data.padlocks.ItemArms._fullSnapshot, undefined);
});

test('remote apply preserves transmitted final snapshot even before appearance arrives; old messages cannot recreate removed locks', () => {
    const { c } = runtime();
    const cfg = c.Player.HeartLock.padlocks.ItemArms;
    const data = { Type: 'Hidden', Content: 'HeartLockApply', Sender: 2, Dictionary: [{ Tag: 'HeartLockApply',
        Target: 1, Group: 'ItemArms', Owner: 2, AssetName: 'Cuffs', LockId: 'lock1', Snapshot: cfg._fullSnapshot }] };
    c.Player.Appearance = []; c.Player.HeartLock.padlocks = {};
    c.handleHidden(data);
    assert.equal(c.Player.ExtensionSettings.AFC_HeartLock.padlocks.ItemArms._fullSnapshot.property.MemberNumberListKeys, '2,3');
    c.deleteConfig('ItemArms', 'lock1'); c.handleHidden(data);
    assert.equal(c.Player.HeartLock.padlocks.ItemArms, undefined);
});

test('legacy apply waits for matching appearance instead of capturing an unlocked substitute', () => {
    const { c, item } = runtime();
    c.Player.HeartLock.padlocks = {}; delete item.Property.LockedBy;
    c.handleHidden({ Type: 'Hidden', Content: 'HeartLockApply', Sender: 2, Dictionary: [{ Tag: 'HeartLockApply',
        Target: 1, Group: 'ItemArms', Owner: 2, AssetName: 'Cuffs', LockId: 'lock1' }] });
    const cfg = c.Player.HeartLock.padlocks.ItemArms;
    assert.equal(cfg._fullSnapshot, undefined); assert.equal(cfg.awaitingSnapshot, true);
    c.checkLockIntegrity(); assert.equal(item.Property.LockedBy, undefined);
    item.Property.LockedBy = 'HighSecurityPadlock'; c.reapplyFromAppearance();
    assert.equal(cfg.awaitingSnapshot, undefined);
    assert.equal(cfg._fullSnapshot.property.MemberNumberListKeys, '2,3');
});


test('many broken slots in one event count once, and healthy slots do not erase history', () => {
    const { c } = runtime();
    const template = c.Player.HeartLock.padlocks.ItemArms;
    for (const group of ['ItemLegs', 'ItemFeet', 'ItemMouth']) {
        c.Player.HeartLock.padlocks[group] = { ...template, _fullSnapshot: { ...template._fullSnapshot, groupName: group } };
    }
    c.Player.Appearance = [];
    c.reconcileProtection(9);
    assert.equal(c.isProtectionPaused(), false);
    assert.equal(c.Player.Appearance.length, 4);
    for (let i = 0; i < 3; i++) {
        c.Player.Appearance = c.Player.Appearance.filter(item => item.Asset.Group.Name !== 'ItemArms');
        c.reconcileProtection(9);
    }
    assert.equal(c.isProtectionPaused(), true);
});

test('vibration never deletes temporarily missing protection; timer removes persisted data after success', () => {
    const { c } = runtime();
    const cfg = c.Player.HeartLock.padlocks.ItemArms;
    cfg.vibe = 'high'; c.Player.ArousalSettings = {}; c.Player.Appearance = [];
    c.vibeStep(); assert.equal(c.Player.HeartLock.padlocks.ItemArms, cfg);
    c.restoreLockFromConfig('ItemArms', cfg);
    cfg.unlockTime = new Date(1).toISOString();
    c.ValidationDeleteLock = () => { throw Error('native failed'); };
    c.checkTimers(); assert.equal(c.Player.HeartLock.padlocks.ItemArms, cfg);
    c.ValidationDeleteLock = p => { delete p.LockedBy; };
    c.checkTimers(); assert.equal(c.Player.ExtensionSettings.AFC_HeartLock.padlocks.ItemArms, undefined);
});
