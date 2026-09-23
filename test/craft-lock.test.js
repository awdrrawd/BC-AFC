import { createLockDraft, getLockDraft } from '../src/features/heartlock/crafting/draft-config.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import { URL } from 'node:url';
import { normalizeCraftLockSettings, craftLockConfig } from '../src/features/heartlock/crafting/settings.js';

function runtime(store = {}) {
    const nodes = [];
    const createElement = tag => {
        const node = { tag, children: [], style: {}, append(...children) { this.children.push(...children); },
            setAttribute(key, value) { this[key] = value; }, addEventListener() {}, showModal() { this.open = true; },
            remove() { nodes.splice(nodes.indexOf(this), 1); this.removed = true; } };
        nodes.push(node); return node;
    };
    const document = { createElement, body: createElement('body'), getElementById: id => nodes.find(n => n.id === id) };
    const header = createElement('header'); header.id = 'crafting-screen-header';
    const asset = { Name: 'Cuffs', AllowLock: true, Group: { Name: 'ItemArms' } };
    const c = vm.createContext({ document, normalizeCraftLockSettings, craftLockConfig, createLockDraft,
        state: { panel: {} },
        HEARTLOCK_NAME: 'Heart Padlock', HSLOCK_NAME: 'HighSecurityPadlock', MAX_TEXT: 500,
        CraftingLockList: ['', 'HighSecurityPadlock'], CraftingSelectedItem: null,
        CraftingAssets: { Cuffs: [asset] }, CommonCloneDeep: v => JSON.parse(JSON.stringify(v)), CommonJSONParse: JSON.parse,
        InventoryAvailable: () => true, AssetGet: (_f, _g, name) => ({ Name: name }),
        T: key => key, ensureStorage: () => true,
        Player: { MemberNumber: 1, AssetFamily: 'Female3DCG', Crafting: [], HeartLock: store },
        InventoryLock: (_ch, item) => { item.Property = { LockedBy: 'HighSecurityPadlock', LockMemberNumber: 1 }; },
        InventoryGet: ch => ch.item, isAllowedToLock: ch => ch.allowed,
        CharacterRefresh() {},
    });
    vm.runInContext(fs.readFileSync(new URL('./fixtures/r132-craft-lock.txt', import.meta.url), 'utf8'), c);
    const hooks = {}, disposers = [];
    c.openHLPanel = (character, group) => { c.state.panel.targetChar = character; c.opened = { character, group }; };
    c.removeHLPanel = () => { c.state.panel.targetChar = null; };
    c.ElementButton = { Create: (id, onclick, options) => {
        const button = createElement('button'); button.id = id; button.onclick = onclick;
        button.nativeOptions = options; const image = createElement('img'); image.src = options.image; button.append(image); return button;
    } };
    c.saves = 0; c.saveAndSync = () => c.saves++;
    c.applied = []; c.convertToHeartLock = (...args) => c.applied.push(args);
    vm.runInContext(fs.readFileSync(new URL('../src/features/heartlock/crafting/recipes.js', import.meta.url), 'utf8')
        .replace(/^import .*;\r?\n/gm, '').replace(/export /g, ''), c);
    vm.runInContext(fs.readFileSync(new URL('../src/ui/heartlock/craft-editor.js', import.meta.url), 'utf8')
        .replace(/^import .*;\r?\n/gm, '').replace(/export /g, ''), c);
    vm.runInContext(fs.readFileSync(new URL('../src/hooks/heartlock/crafting.js', import.meta.url), 'utf8')
        .replace(/^import .*;\r?\n/gm, '').replace(/export /g, ''), c);
    c.installCraftingHeartLock({ hook: (name, priority, fn) => { hooks[name] = fn; }, add: fn => disposers.push(fn) });
    const call = (name, args, next = values => c[name]?.(...values)) => hooks[name](args, next);
    const selected = () => ({ Asset: asset, Lock: { Name: 'Heart Padlock' }, Name: 'My cuffs', Description: '',
        Color: 'Default', Effects: {}, ItemProperty: {}, TypeRecord: null, Private: false });
    const edit = (value = '60') => {
        call('CraftingRun', [], () => {});
        document.getElementById('afc-craft-inspect-lock').onclick();
        assert.equal(c.opened.group, 'ItemArms');
        getLockDraft(c.opened.character).patch({ note: 'Craft note', vibe: 'high',
            unlockTime: new Date(Date.now() + Number(value) * 60000).toISOString() });
    };
    return { c, call, selected, edit, document, dispose: () => disposers.forEach(fn => fn()) };
}

test('custom lock is selectable and inspect button edits a draft without saving until native confirmation', () => {
    const { c, call, selected, edit, document, dispose } = runtime();
    assert.ok(c.CraftingLockList.includes('Heart Padlock'));
    c.CraftingSelectedItem = selected(); edit();
    const button = document.getElementById('afc-craft-inspect-lock');
    assert.equal(button.hidden, false);
    assert.equal(button.style.width, 'var(--menu-button-size)'); assert.equal(button.style.height, 'var(--menu-button-size)');
    assert.equal(button.nativeOptions.tooltip, 'craftLockTitle'); assert.equal(button.children[0].src, 'Icons/InspectLock.png');
    assert.equal(c.saves, 0);
    const recipe = call('CraftingConvertSelectedToItem', [c.CraftingSelectedItem]);
    assert.equal(recipe.Lock, '');
    c.Player.Crafting = [recipe]; call('CraftingSaveServer', [], () => {});
    const settings = c.Player.HeartLock.craftLocks.slots[0].settings;
    assert.equal(settings.durationMinutes, 60); assert.equal(settings.note, 'Craft note'); assert.equal(settings.vibe, 'high');
    c.CraftingSelectedItem.Lock = null; call('CraftingRun', [], () => {}); assert.equal(button.hidden, true);
    dispose(); assert.equal(document.getElementById(button.id), undefined);
    assert.equal(c.CraftingLockList.includes('Heart Padlock'), false);
});

test('native serialization and fresh runtime preserve template; reorder keeps it, deleting recipe clears it', () => {
    const first = runtime(); first.c.CraftingSelectedItem = first.selected(); first.edit();
    const recipe = first.call('CraftingConvertSelectedToItem', [first.c.CraftingSelectedItem]);
    first.c.Player.Crafting = [recipe]; first.call('CraftingSaveServer', [], () => {});
    const fresh = runtime(JSON.parse(JSON.stringify(first.c.Player.HeartLock)));
    const loaded = fresh.c.CraftingDeserialize(first.c.CraftingSerialize(recipe));
    fresh.c.Player.Crafting = [loaded]; fresh.call('CraftingShowScreen', [], () => {});
    const selected = fresh.call('CraftingConvertItemToSelected', [loaded]);
    assert.equal(selected.Lock.Name, 'Heart Padlock');
    fresh.c.Player.Crafting = [null, loaded]; fresh.call('CraftingSaveServer', [], () => {});
    assert.equal(Object.values(fresh.c.Player.HeartLock.craftLocks.slots)[0].settings.durationMinutes, 60);
    fresh.c.Player.Crafting = []; fresh.call('CraftingSaveServer', [], () => {});
    assert.equal(Object.keys(fresh.c.Player.HeartLock.craftLocks.slots).length, 0);
});

test('deleting native craft slots clears their settings and slot reuse cannot inherit them', () => {
    const { c, call, selected } = runtime({ padlocks: { ItemArms: { lockId: 'worn-lock' } } });
    const first = call('CraftingConvertSelectedToItem', [selected()]);
    const second = call('CraftingConvertSelectedToItem', [{ ...selected(), Name: 'Other cuffs' }]);
    c.Player.Crafting = [first, second];
    call('CraftingSaveServer', [], () => {});
    const remaining = JSON.stringify(c.Player.HeartLock.craftLocks.slots[1]);
    const worn = JSON.stringify(c.Player.HeartLock.padlocks);
    let persisted;
    c.saveAndSync = () => { persisted = JSON.parse(JSON.stringify(c.Player.HeartLock)); };

    // Native slot deletion leaves a null entry, preserving the other slot indices.
    c.Player.Crafting[0] = null;
    call('CraftingSaveServer', [], () => {});
    assert.deepEqual(Object.keys(persisted.craftLocks.slots), ['1']);
    assert.equal(JSON.stringify(persisted.craftLocks.slots[1]), remaining);
    // Reuse the deleted slot with an identical native recipe in the same session.
    c.Player.Crafting[0] = c.CraftingDeserialize(c.CraftingSerialize(first));
    call('CraftingShowScreen', [], () => {});
    assert.equal(call('CraftingConvertItemToSelected', [c.Player.Crafting[0]]).Lock, null);
    call('CraftingSaveServer', [], () => {});
    assert.deepEqual(Object.keys(persisted.craftLocks.slots), ['1']);
    c.Player.Crafting[1] = null;
    call('CraftingSaveServer', [], () => {});
    assert.deepEqual(persisted.craftLocks, { version: 1, slots: {} });
    assert.equal(JSON.stringify(persisted.padlocks), worn);

    const fresh = runtime(persisted);
    fresh.c.Player.Crafting = [fresh.c.CraftingDeserialize(c.CraftingSerialize(first))];
    fresh.call('CraftingShowScreen', [], () => {});
    assert.equal(fresh.call('CraftingConvertItemToSelected', [fresh.c.Player.Crafting[0]]).Lock, null);
});

test('switching to ordinary padlock removes its template, canceled edits never change saved recipe', () => {
    const { c, call, selected } = runtime(); c.CraftingSelectedItem = selected();
    let recipe = call('CraftingConvertSelectedToItem', [c.CraftingSelectedItem]);
    c.Player.Crafting = [recipe]; call('CraftingSaveServer', [], () => {});
    const saved = JSON.stringify(c.Player.HeartLock);
    const draft = call('CraftingConvertItemToSelected', [recipe]); draft.Lock = null;
    call('CraftingConvertSelectedToItem', [draft]); call('CraftingExit', [], () => {});
    assert.equal(JSON.stringify(c.Player.HeartLock), saved);
    draft.Lock = { Name: 'HighSecurityPadlock' };
    recipe = call('CraftingConvertSelectedToItem', [draft]); c.Player.Crafting = [recipe];
    call('CraftingSaveServer', [], () => {});
    assert.equal(Object.keys(c.Player.HeartLock.craftLocks.slots).length, 0);
});

test('use applies parameters after native craft completes; preview, no reconfigure and ordinary recipes stay native', () => {
    const { c, call, selected, edit } = runtime(); c.CraftingSelectedItem = selected(); edit();
    const recipe = call('CraftingConvertSelectedToItem', [c.CraftingSelectedItem]);
    const source = { IsPlayer: () => true };
    const target = { MemberNumber: 2, allowed: true, item: { Property: {} } };
    call('InventoryCraft', [source, target, 'ItemArms', recipe, true], args => {
        assert.equal(args[4], false); target.item.Property = {};
        target.item.Craft = args[3];
    });
    assert.equal(c.applied.length, 1);
    assert.equal(c.applied[0][3].note, 'Craft note'); assert.equal(c.applied[0][3].vibe, 'high');
    assert.ok(Date.parse(c.applied[0][3].unlockTime) > Date.now());
    for (const args of [[source, { MemberNumber: -1 }, 'ItemArms', recipe, false],
        [source, target, 'ItemArms', recipe, true, false],
        [source, target, 'ItemArms', { ...recipe, Name: 'Ordinary' }, true]]) {
        call('InventoryCraft', args, values => assert.equal(values, args));
    }
    assert.equal(c.applied.length, 1);
});

test('permission denial and existing lock cannot be bypassed by a crafting template', () => {
    const { c, call, selected } = runtime();
    const recipe = call('CraftingConvertSelectedToItem', [selected()]);
    for (const target of [{ MemberNumber: 2, allowed: false, item: { Property: {} } },
        { MemberNumber: 2, allowed: true, item: { Property: { LockedBy: 'OtherLock' } } }]) {
        call('InventoryCraft', [{ IsPlayer: () => true }, target, 'ItemArms', recipe, false], args => assert.equal(args[3].Lock, ''));
    }
    assert.equal(c.applied.length, 0);
    assert.equal(recipe.Lock, '');
});

test('template data is bounded and cannot inject ownership or lock identity; duration starts at use', () => {
    const settings = normalizeCraftLockSettings({ note: 'x'.repeat(800), owner: 999, lockId: 'bad', durationMinutes: Infinity, vibe: 'bad' });
    assert.equal(settings.note.length, 500); assert.equal(settings.owner, undefined); assert.equal(settings.lockId, undefined);
    assert.equal(settings.durationMinutes, 0); assert.equal(settings.vibe, 'off');
    assert.equal(craftLockConfig({ durationMinutes: 60 }, 1000).unlockTime, new Date(3601000).toISOString());
});


test('identical recipes retain independent slot settings and ambiguous copies stay ordinary', () => {
    const first = runtime();
    first.c.CraftingSelectedItem = first.selected(); first.edit('60');
    const a = first.call('CraftingConvertSelectedToItem', [first.c.CraftingSelectedItem]);
    first.c.CraftingSelectedItem = first.selected(); first.edit('120');
    const b = first.call('CraftingConvertSelectedToItem', [first.c.CraftingSelectedItem]);
    first.c.Player.Crafting = [a, b]; first.call('CraftingSaveServer', [], () => {});
    assert.equal(first.c.Player.HeartLock.craftLocks.slots[0].settings.durationMinutes, 60);
    assert.equal(first.c.Player.HeartLock.craftLocks.slots[1].settings.durationMinutes, 120);
    first.c.Player.Crafting = [b, a]; first.call('CraftingSaveServer', [], () => {});
    assert.equal(first.c.Player.HeartLock.craftLocks.slots[0].settings.durationMinutes, 120);
    const copied = JSON.parse(JSON.stringify(a));
    const args = [{ IsPlayer: () => true }, { MemberNumber: 2, allowed: true }, 'ItemArms', copied, true];
    first.call('InventoryCraft', args, values => assert.equal(values, args));
    assert.equal(first.c.applied.length, 0);
});

test('failed native craft validation never adds a lock', () => {
    const { c, call, selected } = runtime();
    const craft = call('CraftingConvertSelectedToItem', [selected()]);
    const target = { MemberNumber: 2, allowed: true, item: { Property: {} } };
    call('InventoryCraft', [{ IsPlayer: () => true }, target, 'ItemArms', craft, false], () => {});
    assert.equal(c.applied.length, 0);
    assert.equal(target.item.Property.LockedBy, undefined);
});


test('InventoryWear preserves template across the native clone and captures the final explicit color', () => {
    const { c, call, selected, edit } = runtime(); c.CraftingSelectedItem = selected(); edit();
    const craft = call('CraftingConvertSelectedToItem', [c.CraftingSelectedItem]);
    const target = { MemberNumber: 2, allowed: true, item: { Property: {} } };
    call('InventoryWear', [target, 'Cuffs', 'ItemArms', '#ffffff', 0, 1, craft, false], () => {
        call('InventoryCraft', [{ IsPlayer: () => true }, target, 'ItemArms', JSON.parse(JSON.stringify(craft)), false], args => {
            target.item.Craft = args[3]; target.item.Color = '#000000';
        });
        assert.equal(c.applied.length, 0);
        target.item.Color = '#ffffff';
        return target.item;
    });
    assert.equal(c.applied.length, 1); assert.equal(c.applied[0][1].Color, '#ffffff');
    assert.equal(c.applied[0][3].note, 'Craft note');
});


test('unworn craft template shows HeartLock status without changing serialized craft or worn state', () => {
    const { c, call, selected } = runtime();
    const craft = call('CraftingConvertSelectedToItem', [selected()]);
    c.Player.Crafting = [craft]; call('CraftingSaveServer', [], () => {});
    const original = JSON.stringify(craft);
    for (const recipe of [craft, JSON.parse(original)]) {
        const icons = call('DialogGetLockIcon', [{ Craft: recipe }, false], () => []);
        assert.deepEqual(Array.from(icons), ['Heart Padlock']);
    }
    assert.equal(JSON.stringify(craft), original);
    assert.equal(craft.Lock, '');
    for (const [item, worn] of [[{ Craft: craft }, true], [{ Craft: { ...craft, Partial: true } }, false],
        [{ Craft: { ...craft, Name: 'Ordinary' } }, false], [{}, false]]) {
        assert.equal(call('DialogGetLockIcon', [item, worn], () => []).length, 0);
    }
    const actual = ['MetalPadlock'];
    assert.equal(call('DialogGetLockIcon', [{ Craft: craft, Property: { LockedBy: 'MetalPadlock' } }, false], () => actual), actual);
    const heart = ['Heart Padlock'];
    assert.equal(call('DialogGetLockIcon', [{ Craft: craft }, false], () => heart), heart);
});


test('craft list applies target lock permissions after native owner/lover restrictions', () => {
    const { call, selected } = runtime();
    const craft = call('CraftingConvertSelectedToItem', [selected()]);
    for (const allowed of [true, false, true]) {
        assert.equal(call('DialogCanUseCraftedItem', [{ allowed }, craft, {}], () => true), allowed);
    }
    assert.equal(call('DialogCanUseCraftedItem', [{ allowed: true }, craft, {}], () => false), false);
    assert.equal(call('DialogCanUseCraftedItem', [{ allowed: false }, { ...craft, Name: 'Ordinary' }, {}], () => true), true);
});


test('craft visibility follows actual AFC lover, native lover and owner opt-ins for each target', () => {
    const { c, call, selected } = runtime();
    c.window = c; c.log = () => {};
    vm.runInContext(fs.readFileSync(new URL('../src/features/heartlock/permissions.js', import.meta.url), 'utf8')
        .replace(/^import .*;\r?\n/gm, '').replace(/export /g, ''), c);
    const craft = call('CraftingConvertSelectedToItem', [selected()]);
    const target = { MemberNumber: 2, OnlineSharedSettings: { AFC: { lockPerms: { enableAFCLock: true }, lovers: [{ memberNumber: 1 }] } } };
    const visible = () => call('DialogCanUseCraftedItem', [target, craft, {}], () => true);
    assert.equal(visible(), true);
    target.OnlineSharedSettings.AFC.lockPerms.enableAFCLock = false; assert.equal(visible(), false);
    target.OnlineSharedSettings.AFC.lovers = []; target.Lovership = [{ MemberNumber: 1 }];
    target.OnlineSharedSettings.AFC.lockPerms.enableAFCLock = true; assert.equal(visible(), true);
    target.Lovership = []; assert.equal(visible(), false);
    target.Ownership = { MemberNumber: 1 }; target.OnlineSharedSettings.AFC.lockPerms.enableOwnerLock = true;
    assert.equal(visible(), true);
    target.OnlineSharedSettings.AFC.lockPerms.enableOwnerLock = false; assert.equal(visible(), false);
});
