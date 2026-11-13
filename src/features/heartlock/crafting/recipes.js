import { ensureStorage, saveAndSync } from '../storage.js';
import { normalizeCraftLockSettings } from './settings.js';

// Native Craft serialization intentionally contains only BC-compatible fields.
// The full serialized recipe identifies its private AFC template across reorders.
export function craftLockKey(craft) {
    return CraftingSerialize({ ...craft, Lock: '' });
}

// Position of the ItemProperty field in CraftingSerialize()'s output
// (Item, "", Lock, Name, Description, Color, Private, "", "", ItemProperty, ...).
const ITEM_PROPERTY_FIELD = 9;

function blankItemProperty(key) {
    const separator = typeof CraftingSerializeFieldSep === 'string' ? CraftingSerializeFieldSep : '¶';
    const fields = key.split(separator);
    if (fields.length > ITEM_PROPERTY_FIELD) fields[ITEM_PROPERTY_FIELD] = '';
    return fields.join(separator);
}

// BC R133 compresses the ItemProperty field (R132 wrote it verbatim, so an empty
// `{}` became "{}" and is now ""). Keys that AFC stored under one BC version
// therefore differ from the other's in that single field. Ignoring it keeps
// saved templates bound across an upgrade or downgrade; unmatched templates
// would otherwise be dropped on the next craft save. Every other field still
// has to be identical, so an unrelated recipe never inherits a lock.
export function craftLockKeysMatch(stored, current) {
    if (typeof stored !== 'string' || !stored || !current) return false;
    return stored === current || blankItemProperty(stored) === blankItemProperty(current);
}

export function createCraftRecipeStore() {
    const recipes = new WeakMap();
    const bindRecipes = () => {
        if (!ensureStorage()) return;
        const slots = Player.HeartLock.craftLocks?.slots ?? {};
        for (const [index, craft] of (Player.Crafting ?? []).entries()) {
            if (!craft || recipes.has(craft)) continue;
            const entry = slots[index];
            recipes.set(craft, craft.Lock === '' && craftLockKeysMatch(entry?.key, craftLockKey(craft))
                ? normalizeCraftLockSettings(entry.settings) : null);
        }
    };
    const settingsFor = craft => {
        bindRecipes();
        if (recipes.has(craft)) return recipes.get(craft);
        // Copied inventory recipes have no slot reference. Only accept an
        // unambiguous match; an identical ordinary recipe must never gain a lock.
        const key = craftLockKey(craft);
        let settings, serialized;
        for (const item of Player.Crafting ?? []) {
            if (!item || craftLockKey(item) !== key) continue;
            const value = recipes.get(item);
            if (!value) return undefined;
            const candidate = JSON.stringify(value);
            if (settings && candidate !== serialized) return undefined;
            settings ??= value;
            serialized = candidate;
        }
        return settings;
    };
    const saveRecipes = () => {
        if (!ensureStorage() || !Array.isArray(Player.Crafting)) return;
        const templates = {};
        for (const [index, craft] of Player.Crafting.entries()) {
            if (!craft || craft.Lock !== '') continue;
            const settings = recipes.get(craft);
            if (settings) templates[index] = { key: craftLockKey(craft), settings: normalizeCraftLockSettings(settings) };
        }
        // Replace all slots so deleted recipes cannot leave settings for slot reuse.
        Player.HeartLock.craftLocks = { version: 1, slots: templates };
        saveAndSync();
    };
    return { recipes, bindRecipes, settingsFor, saveRecipes };
}
