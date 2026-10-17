import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import { URL } from 'node:url';
import { normalizeCraftLockSettings } from '../src/features/heartlock/crafting/settings.js';

// BC R133 changed CraftingSerialize(): the ItemProperty field now goes through
// ItemPropertiesCompress, so an empty `{}` becomes "" instead of "{}". AFC stores
// that serialized string as the key of each craft-lock template, so templates
// saved under R132 must still bind (and survive the next save) under R133.

const ASSET = { Name: 'Cuffs', AllowLock: true, Group: { Name: 'ItemArms' } };

// Behaviour of R133's CraftingSerialize, with its ItemProperty compression
// modelled as "drop empty/undefined values, return nothing when empty".
function r133Serialize(c) {
    // `const` in the fixture is not a property of the context object, so read it from inside the VM.
    const separator = vm.runInContext('CraftingSerializeFieldSep', c);
    return craft => {
        const asset = c.CraftingAssets[craft.Item]?.[0];
        if (!asset) return '';
        const kept = Object.fromEntries(Object.entries(craft.ItemProperty ?? {}).filter(([, v]) => v !== undefined && v !== null));
        const property = Object.keys(kept).length ? kept : undefined;
        return [
            craft.Item, '', craft.Lock ?? '', (craft.Name ?? '').substring(0, 30), (craft.Description ?? '').substring(0, 200),
            craft.Color ?? '', craft.Private ? 'T' : '', '', '',
            property == null ? '' : JSON.stringify(property),
            craft.TypeRecord == null ? '' : JSON.stringify(craft.TypeRecord),
            !craft.DifficultyFactor ? '' : craft.DifficultyFactor.toString(),
            craft.Effects == null ? '' : JSON.stringify(craft.Effects),
        ].join(separator);
    };
}

function session(store, crafts, bcVersion) {
    const c = vm.createContext({
        normalizeCraftLockSettings, ensureStorage: () => true, saveAndSync() { c.saved++; }, saved: 0,
        CraftingAssets: { Cuffs: [ASSET] },
        Player: { MemberNumber: 1, Crafting: crafts, HeartLock: store },
    });
    vm.runInContext(fs.readFileSync(new URL('./fixtures/r132-craft-lock.txt', import.meta.url), 'utf8'), c);
    if (bcVersion === 'R133') c.CraftingSerialize = r133Serialize(c);
    vm.runInContext(fs.readFileSync(new URL('../src/features/heartlock/crafting/recipes.js', import.meta.url), 'utf8')
        .replace(/^import .*;\r?\n/gm, '').replace(/export /g, ''), c);
    return { c, recipes: vm.runInContext('createCraftRecipeStore()', c) };
}

const craft = (extra = {}) => ({ Item: 'Cuffs', Lock: '', Name: 'My cuffs', Description: 'note', Color: '#112233',
    Private: false, ItemProperty: {}, TypeRecord: null, DifficultyFactor: 0, Effects: [], ...extra });
const settings = { note: 'Craft note', vibe: 'high' };

function saveTemplateUnder(version, crafts) {
    const store = {};
    const { recipes } = session(store, crafts, version);
    recipes.bindRecipes();
    recipes.recipes.set(crafts[0], normalizeCraftLockSettings(settings));
    recipes.saveRecipes();
    return store;
}

test('the two BC versions really do serialize an empty ItemProperty differently', () => {
    const r132 = session({}, [craft()], 'R132').c.CraftingSerialize(craft());
    const r133 = session({}, [craft()], 'R133').c.CraftingSerialize(craft());
    assert.notEqual(r132, r133);
    assert.equal(r132.split('¶')[9], '{}');
    assert.equal(r133.split('¶')[9], '');
});

test('a template saved under R132 still binds and survives a save under R133', () => {
    const store = saveTemplateUnder('R132', [craft()]);
    const savedKey = store.craftLocks.slots[0].key;
    assert.equal(savedKey.split('¶')[9], '{}');

    const { c, recipes } = session(store, [craft()], 'R133');
    assert.deepEqual(recipes.settingsFor(c.Player.Crafting[0])?.note, 'Craft note');

    recipes.saveRecipes();
    assert.equal(Object.keys(store.craftLocks.slots).length, 1, 'template must not be wiped');
    assert.equal(store.craftLocks.slots[0].settings.note, 'Craft note');
});

test('a template saved under R133 still binds under R132 (downgrade or mixed use)', () => {
    const store = saveTemplateUnder('R133', [craft()]);
    const { c, recipes } = session(store, [craft()], 'R132');
    assert.equal(recipes.settingsFor(c.Player.Crafting[0])?.note, 'Craft note');
    recipes.saveRecipes();
    assert.equal(Object.keys(store.craftLocks.slots).length, 1);
});

test('a non-empty ItemProperty recipe also keeps its template across versions', () => {
    const withProperty = () => craft({ ItemProperty: { OverridePriority: 5, Opacity: null } });
    const store = saveTemplateUnder('R132', [withProperty()]);
    const { c, recipes } = session(store, [withProperty()], 'R133');
    assert.equal(recipes.settingsFor(c.Player.Crafting[0])?.note, 'Craft note');
});

test('only the ItemProperty field is tolerated: any other difference still unbinds the template', () => {
    for (const changed of [{ Name: 'Other cuffs' }, { Description: 'different' }, { Color: '#ffffff' },
        { Private: true }, { Item: 'Cuffs', DifficultyFactor: 3 }, { TypeRecord: { typed: 1 } }, { Effects: ['Block'] }]) {
        const store = saveTemplateUnder('R132', [craft()]);
        const { c, recipes } = session(store, [craft(changed)], 'R133');
        assert.equal(recipes.settingsFor(c.Player.Crafting[0]), null, JSON.stringify(changed));
    }
});

test('a recipe that already carries a lock never gains a template, and unknown assets never match', () => {
    const store = saveTemplateUnder('R132', [craft()]);
    const locked = session(store, [craft({ Lock: 'HighSecurityPadlock' })], 'R133');
    assert.equal(locked.recipes.settingsFor(locked.c.Player.Crafting[0]), null);

    const unknown = session(store, [craft({ Item: 'NoSuchAsset' })], 'R133');
    assert.equal(unknown.c.CraftingSerialize(unknown.c.Player.Crafting[0]), '');
    assert.equal(unknown.recipes.settingsFor(unknown.c.Player.Crafting[0]), null);
});

test('craftLockKeysMatch handles empty and malformed keys', () => {
    const { c } = session({}, [], 'R133');
    const match = vm.runInContext('craftLockKeysMatch', c);
    assert.equal(match('', ''), false);
    assert.equal(match(undefined, 'a'), false);
    assert.equal(match('a', ''), false);
    assert.equal(match('Cuffs', 'Cuffs'), true);
    assert.equal(match('a¶b', 'a¶b'), true);
    assert.equal(match('a¶b', 'a¶c'), false);
});
