import { ensureStorage, saveAndSync } from '../storage.js';
import { normalizeCraftLockSettings } from './settings.js';

// Native Craft serialization intentionally contains only BC-compatible fields.
// The full serialized recipe identifies its private AFC template across reorders.
export function craftLockKey(craft) {
    return CraftingSerialize({ ...craft, Lock: '' });
}

export function createCraftRecipeStore() {
    const recipes = new WeakMap();
    const bindRecipes = () => {
        if (!ensureStorage()) return;
        const slots = Player.HeartLock.craftLocks?.slots ?? {};
        for (const [index, craft] of (Player.Crafting ?? []).entries()) {
            if (!craft || recipes.has(craft)) continue;
            const entry = slots[index];
            recipes.set(craft, craft.Lock === '' && entry?.key === craftLockKey(craft)
                ? normalizeCraftLockSettings(entry.settings) : null);
        }
    };
    const settingsFor = craft => {
        bindRecipes();
        if (recipes.has(craft)) return recipes.get(craft);
        // Copied inventory recipes have no slot reference. Only accept an
        // unambiguous match; an identical ordinary recipe must never gain a lock.
        const key = craftLockKey(craft);
        const matches = (Player.Crafting ?? []).filter(item => item && craftLockKey(item) === key);
        if (!matches.length) return undefined;
        const settings = matches.map(item => recipes.get(item));
        if (settings.some(value => !value || JSON.stringify(value) !== JSON.stringify(settings[0]))) return undefined;
        return settings[0];
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
