import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { URL } from 'node:url';
import { HEARTLOCK_NAME, HSLOCK_NAME } from '../src/heartlock/config.js';
import { installHeartLockPropertyHooks, restoreHeartLockMarkers } from '../src/heartlock/r132-properties.js';

function nativeRuntime() {
    const context = vm.createContext({
        CommonKeys: Object.keys, CommonIsArray: Array.isArray,
        CommonFindMap: (list, callback) => list.map(callback).find(x => x !== undefined),
        CommonObjectIsSubset: (a, b) => Object.entries(a).every(([k, v]) => b[k] === v),
        CharacterRefresh() {}, BlindFlashQueue: false,
        InventoryGet: (c, group) => c.Appearance.find(i => i.Asset.Group.Name === group),
        NoArchItemDataLookup: { ItemMiscHighSecurityPadlock: { baselineProperty: { MemberNumberListKeys: '' } } },
        ExtendedItemGatherOptions: () => [{ ParentData: { baselineProperty: { TypeRecord: {} } } }],
        ItemPropertiesDummy: {},
        CommonArrayConcatDedupe: (a, b) => a.push(...b.filter(x => !a.includes(x))),
        // Model an extended initializer replacing state; the hook must restore markers afterwards.
        ExtendedItemInit: (_c, item) => { item.Property = { LockedBy: item.Property.LockedBy }; },
    });
    vm.runInContext(fs.readFileSync(new URL('./fixtures/r132-runtime.txt', import.meta.url), 'utf8'), context);
    const hook = (name, _priority, callback) => {
        const original = context[name];
        assert.equal(typeof original, 'function', name);
        context[name] = (...args) => callback(args, values => original(...values));
    };
    return { context, hook };
}

const property = () => ({ LockedBy: HSLOCK_NAME, LockMemberNumber: 2, Name: HEARTLOCK_NAME,
    HeartLockId: 'lock-1', LockPickSeed: '8,3,5', ExclusiveUnlock: true, MemberNumberListKeys: '2', UnknownPluginField: 42 });

test('native R132 compression drops markers; AFC round-trips across separate runtimes', () => {
    const sender = nativeRuntime(), receiver = nativeRuntime();
    const item = { Asset: { Extended: false, Group: { HasExpression: () => false } }, Property: property() };
    assert.equal(sender.context.ItemPropertiesCompress(item).HeartLockId, undefined);
    installHeartLockPropertyHooks(sender.hook); installHeartLockPropertyHooks(receiver.hook);
    const packed = JSON.parse(JSON.stringify(sender.context.ItemPropertiesCompress(item)));
    assert.equal(packed.UnknownPluginField, undefined);
    for (const extended of [false, true]) {
        const target = { Asset: { Extended: extended, Group: { HasExpression: () => false } }, Property: {} };
        const restored = receiver.context.ItemPropertiesDecompress(target, packed);
        assert.equal(restored, target.Property);
        for (const key of ['Name', 'HeartLockId', 'LockPickSeed', 'ExclusiveUnlock']) assert.equal(restored[key], item.Property[key]);
    }
});

test('compression honors omissions, no-lock exports, and ordinary padlocks', () => {
    const { context, hook } = nativeRuntime(); installHeartLockPropertyHooks(hook);
    const item = { Asset: { Extended: false, Group: { HasExpression: () => false } }, Property: property() };
    assert.equal(context.ItemPropertiesCompress(item, { allowLocks: false }), undefined);
    assert.equal(context.ItemPropertiesCompress(item, { omit: ['HeartLockId'] }).HeartLockId, undefined);
    assert.equal(context.ItemPropertiesCompress(item, { omit: ['LockedBy'] }).Name, undefined);
    assert.equal(context.ItemPropertiesCompress(item, { omit: new Set(['LockedBy']) }).Name, undefined);
    item.Property = { LockedBy: HSLOCK_NAME, UnknownPluginField: 42, LockPickSeed: 'ordinary' };
    const packed = context.ItemPropertiesCompress(item);
    assert.equal(packed.Name, undefined); assert.equal(packed.LockPickSeed, undefined);
});

test('recovery only restores markers for matching saved locks, never equips or relocks', () => {
    const item = { Asset: { Name: 'Cuffs', Group: { Name: 'ItemArms' } }, Property: { LockedBy: HSLOCK_NAME, LockMemberNumber: 2 } };
    const cfg = { owner: 2, assetName: 'Cuffs', lockId: 'saved' };
    const c = { MemberNumber: 1, Appearance: [item], HeartLock: { memberNumber: 1, padlocks: { ItemArms: cfg } } };
    restoreHeartLockMarkers(c); assert.equal(item.Property.HeartLockId, 'saved');
    for (const changes of [{ LockedBy: undefined }, { LockMemberNumber: 3 }, { HeartLockId: 'different' }]) {
        item.Property = { LockedBy: HSLOCK_NAME, LockMemberNumber: 2, ...changes };
        restoreHeartLockMarkers(c); assert.equal(item.Property.Name, undefined);
    }
    item.Property = { LockedBy: HSLOCK_NAME, LockMemberNumber: 2 }; cfg.assetName = 'Other';
    restoreHeartLockMarkers(c); assert.equal(item.Property.Name, undefined);
    cfg.assetName = 'Cuffs'; c.HeartLock.memberNumber = 99;
    restoreHeartLockMarkers(c); assert.equal(item.Property.Name, undefined);
});

function removalRuntime() {
    const { context, hook } = nativeRuntime();
    const notices = [], configs = new Map();
    Object.assign(context, { HEARTLOCK_NAME, Player: { MemberNumber: 1 },
        state: { operations: {} }, setTimeout: () => 1, sendLocalizedAction() {},
        isAllowedToUnlock: (_c, cfg) => Number(cfg.owner) === 1,
        getPadlockConfig: (_c, group) => configs.get(group),
        notifyRemove: (_c, group) => notices.push(group),
        ChatRoomSafewordRelease: () => {
            if (context.failSafety) throw new Error('native failure');
            return context.InventoryRemoveItems(context.Player, [...context.Player.Appearance]);
        },
    });
    const source = fs.readFileSync(new URL('../src/heartlock/removal.js', import.meta.url), 'utf8')
        .replace(/^import .*;\r?\n/gm, '').replace(/export /g, '');
    vm.runInContext(source, context); context.installHeartLockRemovalHook(hook);
    const item = (group, owner) => {
        const i = { Asset: { Name: group, Group: { Name: group }, RemoveItemOnRemove: [] }, Property: {} };
        if (owner) { i.Property.Name = HEARTLOCK_NAME; configs.set(group, { owner }); }
        return i;
    };
    return { context, notices, item };
}

test('R132 group arrays, direct items and dependencies filter only blocked removals', () => {
    const { context: c, notices, item } = removalRuntime();
    const protectedItem = item('ItemArms', 2), owned = item('ItemLegs', 1), plain = item('Cloth');
    const character = { Appearance: [protectedItem, owned, plain], IsPlayer: () => true };
    const removed = c.InventoryRemove(character, ['ItemArms', 'ItemLegs', 'Cloth'], false);
    assert.deepEqual(Array.from(removed), [owned, plain]); assert.deepEqual(notices, ['ItemLegs']);
    assert.deepEqual(Array.from(c.InventoryRemoveItems(character, protectedItem)), []);
    const root = item('Suit'); root.Asset.RemoveItemOnRemove = [{ Group: 'ItemArms' }];
    character.Appearance.push(root);
    assert.deepEqual(Array.from(c.InventoryRemoveItems(character, root)), []);
    assert.ok(character.Appearance.includes(root));
    // Explicit empty dependency override must still allow the root itself.
    assert.deepEqual(Array.from(c.InventoryRemoveItems(character, root, { removeItemOnRemove: [] })), [root]);
});

test('authorized cascading removals notify once; timer/restoration bypass remains intact', () => {
    const { context: c, notices, item } = removalRuntime();
    const owned = item('ItemLegs', 1), root = item('Suit');
    root.Asset.RemoveItemOnRemove = [{ Group: 'ItemLegs' }];
    const character = { Appearance: [root, owned], IsPlayer: () => false };
    assert.deepEqual(Array.from(c.InventoryRemoveItems(character, [root, owned, owned])), [root, owned]);
    assert.deepEqual(notices, ['ItemLegs']);
    for (const flag of ['restoring', 'timerUnlocking']) {
        const locked = item('ItemArms', 2); character.Appearance = [locked];
        c.state.operations[flag] = true;
        assert.deepEqual(Array.from(c.InventoryRemove(character, 'ItemArms')), [locked]);
        c.state.operations[flag] = false;
    }
    assert.deepEqual(notices, ['ItemLegs']);
});

test('native safeword release removes protected locks and restores guard after errors', () => {
    const { context: c, notices, item } = removalRuntime();
    const locked = item('ItemArms', 2);
    c.Player.Appearance = [locked]; c.Player.IsPlayer = () => true;
    assert.deepEqual(Array.from(c.ChatRoomSafewordRelease()), [locked]);
    assert.deepEqual(notices, ['ItemArms']);
    c.Player.Appearance = [locked]; c.failSafety = true;
    assert.throws(() => c.ChatRoomSafewordRelease(), /native failure/);
    assert.deepEqual(Array.from(c.InventoryRemoveItems(c.Player, locked)), []);
});
