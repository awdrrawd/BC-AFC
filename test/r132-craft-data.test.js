import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { URL } from 'node:url';
import v8 from 'node:v8';
const structuredClone = value => v8.deserialize(v8.serialize(value));

function runtime() {
    const c = vm.createContext({ structuredClone, GameVersion: 'R132Beta3',
        ExtendedItemTypeToRecord: (_asset, type) => ({ converted: type }),
        Player: { Appearance: [], AppearanceFull: [] }, InventoryGet: () => ({ Asset: { Name: 'Cuffs' } }),
        syncs: 0, updates: 0, ServerPlayerIsInChatRoom: () => true,
    });
    c.ServerPlayerAppearanceSync = () => c.syncs++;
    c.ChatRoomCharacterUpdate = () => c.updates++;
    vm.runInContext(fs.readFileSync(new URL('../src/compat/r132-craft.js', import.meta.url), 'utf8').replace(/export /g, ''), c);
    return c;
}

test('R132 completes only legacy full crafts, preserving actual partials and source data', () => {
    const c = runtime();
    const source = Object.freeze({ Name: 'Old craft', Color: 'Red', Type: 'OldType', MemberNumber: 2 });
    const fixed = c.r132CompleteCraft(source, { Name: 'Cuffs' });
    assert.equal(fixed.Partial, false); assert.equal(fixed.Item, 'Cuffs');
    assert.equal(fixed.TypeRecord.converted, 'OldType'); assert.equal(fixed.Color, 'Red');
    assert.equal(fixed.Lock, ''); assert.equal(fixed.Description, ''); assert.equal(fixed.Private, false);
    assert.equal(source.Partial, undefined); assert.equal(fixed.MemberNumber, 2);
    assert.equal(c.r132CompleteCraft(fixed), fixed);
    for (const craft of [{ Name: 'Partial', Effects: { Secure: 1 } }, { Partial: true, Item: 'Cuffs' }]) {
        assert.equal(c.r132CompleteCraft(craft), craft);
    }
    c.GameVersion = 'R133'; assert.equal(c.r132CompleteCraft(source, { Name: 'Cuffs' }), source);
});

test('unresolvable assets/types are left untouched for retry instead of fabricating a full craft', () => {
    const c = runtime(); const craft = { Color: 'Red', Type: 'OldType' };
    assert.equal(c.r132CompleteCraft(craft), craft);
    c.ExtendedItemTypeToRecord = () => { throw Error('not loaded'); };
    assert.equal(c.r132CompleteCraft(craft, { Name: 'Cuffs' }), craft);
    assert.equal(craft.Partial, undefined);
});

test('data hooks do not patch dialogs or expression queues; login migration syncs once', () => {
    const c = runtime(); const hooks = new Map();
    c.r132InstallCraftDataHooks({ hook: (name, _priority, fn) => hooks.set(name, fn) });
    assert.deepEqual([...hooks.keys()], ['ServerBundledItemToAppearanceItem', 'InventoryCraft']);
    const item = { Asset: { Name: 'Cuffs' }, Craft: { Item: 'Cuffs', Name: 'Old' } };
    hooks.get('ServerBundledItemToAppearanceItem')([], () => item);
    assert.equal(item.Craft.Partial, false);
    c.Player.Appearance = [item]; c.Player.AppearanceFull = [item];
    assert.equal(c.r132RepairPlayerCrafts(), true);
    assert.equal(c.syncs, 1); assert.equal(c.updates, 1);
    assert.equal(c.r132RepairPlayerCrafts(), false); assert.equal(c.syncs, 1);
    hooks.get('InventoryCraft')([null, c.Player, 'ItemArms', { Item: 'Cuffs', Type: 'OldType' }], args => {
        assert.equal(args[3].Partial, false); assert.equal(args[3].TypeRecord.converted, 'OldType');
    });
});
