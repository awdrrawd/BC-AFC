import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { URL } from 'node:url';
import { r132CompleteCraft } from '../src/compat/r132-craft.js';

function runtime() {
    const c = vm.createContext({
        r132CompleteCraft,
        CommonIsObject: v => v !== null && typeof v === 'object' && !Array.isArray(v),
        CommonEntries: Object.entries, CommonKeys: Object.keys,
        CommonHas: (map, key) => map.has(key),
        CommonIsInteger: (v, min, max = Infinity) => Number.isInteger(v) && v >= min && v <= max,
        CommonClamp: (v, min, max) => Math.min(max, Math.max(min, v)),
        CraftingPropertyMap: new Map([['Secure', () => true]]),
        CraftingEffectsPrerequisite: { Secure: {} },
        CraftingEffectsDefaultMaximumStack: 4, CraftingEffectsDefaultMaximumEffects: 4,
        clone: v => JSON.parse(JSON.stringify(v)),
        HEARTLOCK_NAME: 'HeartLock', HSLOCK_NAME: 'HighSecurityPadlock',
        state: { operations: {} }, _pendingRestore: new Set(),
        onHeartLockEvent() {}, log() {}, ensureStorage: () => true, saveAndSync() {},
        ValidationDeleteLock: property => { delete property.LockedBy; delete property.LockMemberNumber; },
        rebaselineCurseIfNeeded() {}, ValidationSanitizeProperties() {}, ValidationSanitizeLock() {},
    });
    vm.runInContext(fs.readFileSync(new URL('./fixtures/r132-crafting.txt', import.meta.url), 'utf8'), c);
    for (const file of ['craft', 'snapshot', 'lock']) {
        const source = fs.readFileSync(new URL(`../src/heartlock/${file}.js`, import.meta.url), 'utf8')
            .replace(/^import [\s\S]*?;\r?\n/gm, '').replace(/export /g, '');
        vm.runInContext(source, c);
    }
    c.asset = { Name: 'Cuffs', Difficulty: 5, Group: { Name: 'ItemArms' } };
    c.snapshot = { assetName: 'Cuffs', groupName: 'ItemArms', color: ['#123456'], difficulty: 13,
        craft: { Name: 'My cuffs', Description: 'Handmade', MemberNumber: 42, MemberName: 'Crafter',
            Private: false, Effects: { Secure: 2 } } };
    c.cfg = { assetName: 'Cuffs', owner: 2, lockId: 'saved', _fullSnapshot: c.snapshot };
    c.Player = { MemberNumber: 1, AssetFamily: 'Female3DCG', Appearance: [], HeartLock: { padlocks: { ItemArms: c.cfg } } };
    c.InventoryGet = (player, group) => player.Appearance.find(i => i.Asset.Group.Name === group);
    c.AssetGet = (_family, group) => group === 'ItemArms' ? c.asset : {};
    c.InventoryWear = (player, name, group, color, difficulty, member, craft, refresh) => {
        // Both early R132 and fixed R132 are safe if we do not pass a partial craft here.
        assert.equal(craft, null); assert.equal(refresh, false); assert.equal(difficulty, 0);
        const item = { Asset: c.asset, Color: color, Difficulty: c.asset.Difficulty + difficulty };
        player.Appearance.push(item); return item;
    };
    c.InventoryRemove = player => { player.Appearance = []; };
    c.InventoryLock = (_player, item) => { item.Property = { ...item.Property, LockedBy: 'HighSecurityPadlock', LockMemberNumber: 2 }; };
    c.refreshes = 0; c.updates = 0;
    c.CharacterRefresh = () => { c.refreshes++; };
    c.ChatRoomCharacterUpdate = () => { c.updates++; };
    return c;
}

test('restore removed/swapped items with partial craft, saved difficulty and final update', () => {
    for (const swapped of [false, true]) {
        const c = runtime();
        if (swapped) c.Player.Appearance.push({ Asset: { Name: 'Other', Group: { Name: 'ItemArms' } } });
        assert.equal(c.restoreLockFromConfig('ItemArms', c.cfg), 'ok');
        const item = c.Player.Appearance[0];
        assert.equal(item.Craft.Name, 'My cuffs'); assert.equal(item.Craft.MemberNumber, 42);
        assert.equal(item.Craft.Effects.Secure, 2); assert.equal(item.Difficulty, 13);
        assert.equal(item.Property.HeartLockId, 'saved'); assert.equal(item.Color[0], '#123456');
        assert.notEqual(item.Craft, c.snapshot.craft);
        assert.equal(c.updates, 1); assert.equal(c.state.operations.restoring, false);
    }
});

test('integrity repairs missing craft once without changing color, difficulty or property', () => {
    const c = runtime(); c.restoreLockFromConfig('ItemArms', c.cfg);
    const item = c.Player.Appearance[0]; delete item.Craft;
    item.Color = ['#ffffff']; item.Difficulty = 21; item.Property.Custom = 7;
    const property = item.Property;
    c.checkLockIntegrity();
    assert.equal(item.Craft.Effects.Secure, 2); assert.equal(item.Color[0], '#ffffff');
    assert.equal(item.Difficulty, 21); assert.equal(item.Property, property);
    assert.equal(c.updates, 2);
    c.checkLockIntegrity(); assert.equal(c.updates, 2);
});

test('no recovery without matching snapshot/owner, and existing crafts remain authoritative', () => {
    const c = runtime(); c.restoreLockFromConfig('ItemArms', c.cfg);
    const item = c.Player.Appearance[0];
    item.Craft.Name = 'New craft'; c.checkLockIntegrity(); assert.equal(item.Craft.Name, 'New craft');
    delete item.Craft; item.Property.LockMemberNumber = 3;
    c.checkLockIntegrity(); assert.equal(item.Craft, undefined);
    for (const change of [{ groupName: 'ItemLegs' }, { assetName: 'Other' }, { craft: null }, { craft: 'invalid' }]) {
        assert.equal(c.restoreSnapshotCraft(item, { ...c.snapshot, ...change }), false);
        assert.equal(item.Craft, undefined);
    }
});

test('legacy craft effects migrate on a copy without applying old configuration', () => {
    const c = runtime();
    const legacy = { ...c.snapshot, craft: { ...c.snapshot.craft, Effects: {}, Property: 'Secure',
        Color: '#000000', Lock: 'Padlock', ItemProperty: { TypeRecord: { a: 1 } } } };
    const item = { Asset: c.asset, Color: ['#ffffff'], Property: { TypeRecord: { a: 2 } } };
    assert.equal(c.restoreSnapshotCraft(item, legacy), true);
    assert.equal(item.Craft.Effects.Secure, 1); assert.equal(legacy.craft.Property, 'Secure');
    assert.equal(item.Color[0], '#ffffff'); assert.equal(item.Property.TypeRecord.a, 2);
});

test('protected item snapshot rebuilds options, colors and craft after the whole item disappears', () => {
    const c = runtime();
    const original = { Asset: c.asset, Color: ['#abcdef'], Craft: c.snapshot.craft, Difficulty: 17,
        Property: { TypeRecord: { a: 2 }, Text: 'Keep me', Effect: ['Block'],
            LockedBy: 'OldLock', LockMemberNumber: 99, HeartLockId: 'old' } };
    c.cfg._fullSnapshot = c.snapshotItem(original);
    original.Property.TypeRecord.a = 9;
    c.checkLockIntegrity();
    const rebuilt = c.Player.Appearance[0];
    assert.equal(rebuilt.Property.TypeRecord.a, 2); assert.equal(rebuilt.Property.Text, 'Keep me');
    assert.equal(rebuilt.Property.LockedBy, 'HighSecurityPadlock'); assert.equal(rebuilt.Property.LockMemberNumber, 2);
    assert.equal(rebuilt.Property.HeartLockId, 'saved'); assert.equal(rebuilt.Color[0], '#abcdef');
    assert.equal(rebuilt.Difficulty, 17); assert.equal(rebuilt.Craft.Name, 'My cuffs');
});

test('missing dependent assets preserve current equipment and the saved snapshot', () => {
    const c = runtime();
    const other = { Asset: { Name: 'Other', Group: { Name: 'ItemArms' } } };
    c.Player.Appearance = [other]; c.AssetGet = () => null;
    assert.equal(c.restoreLockFromConfig('ItemArms', c.cfg), 'pending');
    assert.equal(c.Player.Appearance[0], other); assert.equal(c.cfg._fullSnapshot, c.snapshot);
});

test('backfilling old snapshots adds properties without overwriting surviving craft', () => {
    const c = runtime(); c.restoreLockFromConfig('ItemArms', c.cfg);
    const item = c.Player.Appearance[0]; delete item.Craft;
    item.Property.TypeRecord = { a: 3 };
    c.backfillSnapshots();
    assert.equal(c.snapshot.craft.Name, 'My cuffs'); assert.equal(c.snapshot.property.TypeRecord.a, 3);
    item.Property.TypeRecord.a = 4; assert.equal(c.snapshot.property.TypeRecord.a, 3);
});

test('same-asset replacement restores the protected item as well as its lock', () => {
    const c = runtime();
    c.cfg._fullSnapshot.property = { TypeRecord: { a: 2 }, Text: 'Original' };
    c.Player.Appearance = [{ Asset: c.asset, Property: { TypeRecord: { a: 0 } },
        Color: ['Default'], Difficulty: 5, Craft: { Name: 'Replacement' } }];
    c.checkLockIntegrity();
    const item = c.Player.Appearance[0];
    assert.equal(item.Property.TypeRecord.a, 2); assert.equal(item.Property.Text, 'Original');
    assert.equal(item.Color[0], '#123456'); assert.equal(item.Craft.Name, 'My cuffs');
    assert.equal(item.Difficulty, 13);
});

test('offline saved owner is restored even when native InventoryLock cannot resolve them', () => {
    const c = runtime();
    c.InventoryLock = (_player, item) => { item.Property = { ...item.Property, LockedBy: 'HighSecurityPadlock' }; };
    c.restoreLockFromConfig('ItemArms', c.cfg);
    assert.equal(c.Player.Appearance[0].Property.LockMemberNumber, 2);
});
