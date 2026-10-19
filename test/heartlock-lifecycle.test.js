import { createLockDraft, getLockDraft } from '../src/features/heartlock/crafting/draft-config.js';
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
        getLockDraft, repairHeartLockDuplicates() {},
        Date: class extends Date { static now() { return now; } },
        GRAB_WINDOW_MS: 14000, GRAB_COOLDOWN_MS: 120000, MAX_TEXT: 500,
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
    for (const file of ['protection', 'validate', 'storage', 'snapshot', 'lock', 'net', 'timer', 'vibe']) {
        vm.runInContext(fs.readFileSync(new URL(file === 'net' ? '../src/net/heartlock.js' : `../src/features/heartlock/${file}.js`, import.meta.url), 'utf8')
            .replace(/^import [\s\S]*?;\r?\n/gm, '').replace(/export /g, ''), c);
    }
    vm.runInContext(fs.readFileSync(new URL('../src/hooks/heartlock/index.js', import.meta.url), 'utf8')
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
    c.sendLockConfig(2, 'ItemArms');
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


test('remote crafted lock receives its settings together with the complete snapshot', () => {
    const { c } = runtime();
    const snapshot = c.Player.HeartLock.padlocks.ItemArms._fullSnapshot;
    c.handleHidden({ Type: 'Hidden', Content: 'HeartLockApply', Sender: 2, Dictionary: [{ Tag: 'HeartLockApply',
        Target: 1, Group: 'ItemArms', Owner: 2, AssetName: 'Cuffs', LockId: 'lock1', Snapshot: snapshot,
        Settings: { note: 'Craft note', vibe: 'high', orgasmMode: 'edge', removeRestraints: true,
            unlockTime: '2030-01-01T00:00:00.000Z', owner: 999, lockId: 'injected' } }] });
    const cfg = c.Player.ExtensionSettings.AFC_HeartLock.padlocks.ItemArms;
    assert.equal(cfg.note, 'Craft note'); assert.equal(cfg.vibe, 'high'); assert.equal(cfg.orgasmMode, 'edge');
    assert.equal(cfg.removeRestraints, true); assert.equal(cfg.unlockTime, '2030-01-01T00:00:00.000Z');
    assert.equal(cfg.owner, 2); assert.equal(cfg.lockId, 'lock1');
    assert.equal(cfg._fullSnapshot.property.MemberNumberListKeys, '2,3');
});


test('shared panel routes draft edits locally, never through worn-lock storage or room messages', () => {
    const { c } = runtime();
    const original = JSON.stringify(c.Player.ExtensionSettings);
    let active = true, settings;
    const draft = createLockDraft({ durationMinutes: 60 }, {
        owner: 1, ownerName: 'Self', group: 'ItemArms', isActive: () => active,
        onChange: value => { settings = value; },
    });
    assert.equal(c.getPadlockConfig(draft.character, 'ItemArms').owner, 1);
    c.pushConfig(draft.character, 'ItemArms', { note: 'Draft', vibe: 'high' });
    c.sendSettingsChange(draft.character, 'ItemArms'); c.requestHeartLockData(draft.character);
    c.notifyRemove(draft.character, 'ItemArms');
    assert.equal(settings.note, 'Draft'); assert.equal(settings.vibe, 'high'); assert.equal(settings.durationMinutes, 60);
    c.pushConfig(draft.character, 'ItemArms', { unlockTime: new Date(Date.now() + 7200000).toISOString() });
    assert.equal(settings.durationMinutes, 120);
    c.pushConfig(draft.character, 'ItemArms', { unlockTime: null }); assert.equal(settings.durationMinutes, 0);
    active = false;
    c.pushConfig(draft.character, 'ItemArms', { note: 'Stale callback' });
    assert.equal(settings.note, 'Draft'); assert.equal(c.getPadlockConfig(draft.character, 'ItemArms'), null);
    assert.equal(c.sent.length, 0); assert.equal(JSON.stringify(c.Player.ExtensionSettings), original);
});

test('vibration never advances arousal while an orgasm timer is running (no endless orgasm bar)', () => {
    const { c } = runtime();
    const progress = [];
    c.ActivityTimerProgress = (_player, delta) => progress.push(delta);
    c.ActivityChatRoomArousalSync = () => {};
    c.getSharedSettings = () => ({ enableVibeSound: false, vibeMsgMode: 'off' });
    c.VIBE_MSG_CYCLE = 12; c.VIBE_INTERVAL_MS = 5000;
    c.state.vibe = { cycle: 0, animationUntil: 0, animationLevel: 0 };
    c.state.timers = { vibe: null, vibeAnimation: null };
    c.setInterval = () => 1;
    c.clearInterval = () => {};
    c.Player.HeartLock.padlocks.ItemArms.vibe = 'high';
    c.Player.Appearance[0].Property.HeartLockId = 'lock1';
    c.Player.ArousalSettings = { Progress: 100, OrgasmTimer: 0, OrgasmStage: 0 };

    c.vibeStep();                                   // no orgasm yet → vibration still builds arousal
    assert.deepEqual(progress, [3]);

    c.Player.ArousalSettings.OrgasmTimer = 6000;    // orgasm bar running (stage 0/1) or orgasm in progress (stage 2)
    c.vibeStep(); c.vibeStep();
    assert.deepEqual(progress, [3], 'vibeStep must not re-trigger ActivityOrgasmPrepare and reset the bar');

    c.Player.ArousalSettings.OrgasmTimer = 1;       // expired but not yet processed by BC Timer.js → still hands-off
    c.vibeStep();
    assert.deepEqual(progress, [3]);

    c.Player.ArousalSettings.OrgasmTimer = 0;       // BC finished the orgasm → vibration resumes
    c.vibeStep();
    assert.deepEqual(progress, [3, 3]);
});

test('orgasm hook ignores a repeated ActivityOrgasmPrepare while the orgasm bar is running', () => {
    const hooks = {};
    const c = vm.createContext({ HEARTLOCK_NAME: 'HeartLock', ensureStorage: () => true, InventoryGet: () => null });
    vm.runInContext(fs.readFileSync(new URL('../src/hooks/heartlock/orgasm.js', import.meta.url), 'utf8')
        .replace(/^import [\s\S]*?;\r?\n/gm, '').replace(/export /g, ''), c);
    c.setupOrgasmHooks((name, _priority, fn) => { hooks[name] = fn; });
    const player = c.Player = { IsPlayer: () => true, Effect: [], HeartLock: { padlocks: {} },
        ArousalSettings: { Progress: 100, OrgasmTimer: 9000, OrgasmStage: 1 } };
    let natives = 0;
    const next = () => { natives++; };

    hooks.ActivityOrgasmPrepare([player], next);
    assert.equal(natives, 0, 'native Prepare would reset OrgasmTimer to now+5s and OrgasmStage to 0');
    assert.equal(player.ArousalSettings.OrgasmStage, 1);

    player.ArousalSettings.OrgasmTimer = 0;
    hooks.ActivityOrgasmPrepare([player], next);
    assert.equal(natives, 1, 'a fresh orgasm still goes through the native flow');
});

test('an unparseable unlock time keeps the lock closed instead of opening it (fail-closed timer)', () => {
    const { c } = runtime();
    const cfg = c.Player.HeartLock.padlocks.ItemArms;
    for (const bad of ['garbage', 'NaN', {}, true]) {
        cfg.unlockTime = bad;
        c.checkTimers();
        assert.equal(c.Player.HeartLock.padlocks.ItemArms, cfg, `lock survives unlockTime=${JSON.stringify(bad)}`);
        assert.equal(c.Player.Appearance[0].Property.LockedBy, 'HighSecurityPadlock');
    }
    cfg.unlockTime = new Date(1).toISOString();   // 過期的合法時間仍會解鎖
    c.checkTimers();
    assert.equal(c.Player.ExtensionSettings.AFC_HeartLock.padlocks.ItemArms, undefined);
});

test('remote Update/Apply/Remove validate group and values; only the owner may change a lock', () => {
    const { c } = runtime();
    const cfg = c.Player.HeartLock.padlocks.ItemArms;
    const send = (Content, extra, sender = 2) => c.handleHidden({ Type: 'Hidden', Content, Sender: sender,
        Dictionary: [{ Tag: Content, Target: 1, Group: 'ItemArms', ...extra }] });

    // owner 傳來的垃圾值被丟棄，不會污染鎖
    send('HeartLock::Update', { Config: { unlockTime: 'garbage', vibe: 'max', note: 'x'.repeat(5000), removeRestraints: 'yes' } });
    assert.equal(cfg.unlockTime ?? null, null);
    assert.equal(cfg.vibe ?? 'off', 'off');
    assert.equal(cfg.note.length, 500);
    assert.equal('removeRestraints' in cfg ? cfg.removeRestraints : false, false);

    // 合法值照常套用，且可明確清除計時
    send('HeartLock::Update', { Config: { unlockTime: '2030-01-01T00:00:00Z', vibe: 'mid' } });
    assert.equal(cfg.unlockTime, '2030-01-01T00:00:00.000Z'); assert.equal(cfg.vibe, 'mid');
    send('HeartLock::Update', { Config: { unlockTime: null } });
    assert.equal(cfg.unlockTime, null);

    // 非 owner 的更新一律無效
    send('HeartLock::Update', { Config: { vibe: 'high' } }, 3);
    assert.equal(cfg.vibe, 'mid');

    // 原型鏈部位名稱不會被處理
    for (const group of ['__proto__', 'constructor', 'toString']) {
        send('HeartLock::Update', { Group: group, Config: { vibe: 'high' } });
        send('HeartLock::Remove', { Group: group });
        send('HeartLockApply', { Group: group, Owner: 2, AssetName: 'x', LockId: 'l' });
    }
    assert.equal(Object.prototype.vibe, undefined);
    assert.equal(c.Player.HeartLock.padlocks.ItemArms, cfg);
    assert.equal(Object.keys(c.Player.HeartLock.padlocks).length, 1);
});

test('lock details are sent 1:1, per group, and only to the owner or an authorized relation', () => {
    const { c } = runtime();
    const cfg = c.Player.HeartLock.padlocks.ItemArms;
    cfg.note = 'private note';
    c.sent.length = 0;
    const request = (sender, group = 'ItemArms') => c.handleHidden({ Type: 'Hidden', Content: 'HeartLockRequest', Sender: sender,
        Dictionary: [{ Tag: 'HeartLockRequest', Target: 1, Group: group }] });

    request(2);                                   // 掛鎖者
    assert.equal(c.sent.length, 1);
    const [event, message] = c.sent[0];
    assert.equal(event, 'ChatRoomChat');
    assert.equal(message.Target, 2, 'top-level Target: server delivers to the requester only');
    assert.equal(message.Content, 'HeartLock::Sync');
    assert.deepEqual(Object.keys(message.Dictionary[0].Data.padlocks), ['ItemArms']);
    assert.equal(message.Dictionary[0].Data.padlocks.ItemArms.note, 'private note');
    assert.equal(message.Dictionary[0].Data.padlocks.ItemArms._fullSnapshot, undefined);

    c.sent.length = 0;
    request(3);                                   // 無權限的路人
    request(2, '__proto__'); request(2, 'ItemLegs');   // 非法／不存在的部位
    assert.equal(c.sent.length, 0);
});

test('saving lock storage never broadcasts the lock configuration to the room', () => {
    const { c } = runtime();
    c.sent.length = 0;
    c.saveAndSync();
    assert.equal(c.sent.filter(([, m]) => m?.Content === 'HeartLock::Sync').length, 0);
});

test('requests and remote edits are addressed to the wearer only', () => {
    const { c } = runtime();
    const wearer = { MemberNumber: 7, IsPlayer: () => false };
    c.sent.length = 0;
    c.requestHeartLockData(wearer, 'ItemArms');
    c.pushConfig(wearer, 'ItemArms', { vibe: 'low' });
    c.notifyRemove(wearer, 'ItemArms', 'lock1');
    assert.equal(c.sent.length, 3);
    for (const [, m] of c.sent) assert.equal(m.Target, 7);
    c.sent.length = 0;
    c.requestHeartLockData(wearer, '__proto__');
    assert.equal(c.sent.length, 0);
});

test('received lock details merge per group and only for the requester-visible character', () => {
    const { c } = runtime();
    const other = { MemberNumber: 5, IsPlayer: () => false, HeartLock: { padlocks: { ItemLegs: { owner: 1, lockId: 'a' } } } };
    c.ChatRoomCharacter.push(other);
    c.handleHidden({ Type: 'Hidden', Content: 'HeartLock::Sync', Sender: 5, Dictionary: [{ Tag: 'HeartLock::Data',
        Data: { padlocks: { ItemArms: { owner: 1, lockId: 'b', note: 'n' }, __proto__x: 1, constructor: { owner: 9 }, ItemFeet: 'bad' } } }] });
    assert.deepEqual(Object.keys(other.HeartLock.padlocks).sort(), ['ItemArms', 'ItemLegs']);
    assert.equal(other.HeartLock.padlocks.ItemArms.note, 'n');
    assert.equal(other.HeartLock.memberNumber, 5);
});

test('for other characters the published OnlineSharedSettings summary is authoritative', () => {
    const { c } = runtime();
    const other = { MemberNumber: 5, IsPlayer: () => false,
        OnlineSharedSettings: { AFC_HeartLock: { padlocks: { ItemArms: { owner: 2, assetName: 'Cuffs', lockId: 'b' } } } },
        HeartLock: { padlocks: { ItemArms: { owner: 2, lockId: 'b', note: 'detail' }, ItemLegs: { owner: 2, lockId: 'z', note: 'stale' } } } };
    assert.equal(c.getPadlockConfig(other, 'ItemArms').note, 'detail');           // 摘要與細節 lockId 相符
    assert.equal(c.getPadlockConfig(other, 'ItemLegs'), null);                    // 摘要已無此鎖 → 已解開
    other.OnlineSharedSettings.AFC_HeartLock.padlocks.ItemArms.lockId = 'new';
    const summary = c.getPadlockConfig(other, 'ItemArms');
    assert.equal(summary.owner, 2); assert.equal(summary.note, undefined);         // 細節過期 → 只用摘要
    summary.owner = 99;
    assert.equal(other.OnlineSharedSettings.AFC_HeartLock.padlocks.ItemArms.owner, 2, 'summary is a copy');
    delete other.OnlineSharedSettings.AFC_HeartLock;                               // 舊版對方沿用舊行為
    assert.equal(c.getPadlockConfig(other, 'ItemLegs').note, 'stale');
});
