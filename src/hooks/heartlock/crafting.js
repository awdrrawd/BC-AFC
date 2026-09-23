import { createCraftEditor } from '../../ui/heartlock/craft-editor.js';
import { HEARTLOCK_NAME, HSLOCK_NAME } from '../../features/heartlock/config.js';
import { createCraftRecipeStore } from '../../features/heartlock/crafting/recipes.js';
import { isAllowedToLock } from '../../features/heartlock/permissions.js';
import { convertToHeartLock } from '../../features/heartlock/lock.js';
import { normalizeCraftLockSettings, craftLockConfig } from '../../features/heartlock/crafting/settings.js';

export function installCraftingHeartLock(registry) {
    const drafts = new WeakMap();
    const { recipes, bindRecipes, settingsFor, saveRecipes } = createCraftRecipeStore();
    const { close, updateButton } = createCraftEditor(drafts);
    bindRecipes();
    registry.hook('DialogCanUseCraftedItem', 5, (args, next) => {
        if (!next(args)) return false;
        const [target, craft] = args;
        if (craft?.Lock !== '' || craft.Partial === true || !settingsFor(craft)) return true;
        return isAllowedToLock(target);
    });
    // BC reads Craft.Lock for unworn recipe icons, but our compatible recipe
    // stores that field empty. Use the same template lookup as actual crafting;
    // the existing HeartLock icon renderer also supplies the native tooltip.
    registry.hook('DialogGetLockIcon', 5, (args, next) => {
        const icons = next(args) ?? [];
        const [item, isWorn] = args;
        if (isWorn || icons.length || item?.Property?.LockedBy
            || item?.Craft?.Partial !== false || item.Craft.Lock !== '') return icons;
        return settingsFor(item.Craft) ? [...icons, HEARTLOCK_NAME] : icons;
    });
    registry.hook('CraftingShowScreen', 5, (args, next) => { bindRecipes(); return next(args); });
    registry.hook('CraftingLoadServer', 0, (args, next) => { const result = next(args); bindRecipes(); return result; });

    // The native recipe stores no lock; AFC applies its template after crafting.
    // This also avoids login validation stripping locks absent from native inventory.
    if (!CraftingLockList.includes(HEARTLOCK_NAME)) CraftingLockList.push(HEARTLOCK_NAME);
    registry.add(() => {
        const index = CraftingLockList.indexOf(HEARTLOCK_NAME);
        if (index >= 0) CraftingLockList.splice(index, 1);
        document.getElementById('afc-craft-inspect-lock')?.remove();
        close();
    });
    registry.hook('CraftingConvertItemToSelected', 5, (args, next) => {
        const selected = next(args);
        const settings = args[0]?.Lock === '' ? settingsFor(args[0]) : undefined;
        if (settings) {
            selected.Lock = AssetGet(Player.AssetFamily, 'ItemMisc', HEARTLOCK_NAME);
            drafts.set(selected, normalizeCraftLockSettings(settings));
        }
        return selected;
    });
    registry.hook('CraftingConvertSelectedToItem', 5, (args, next) => {
        const craft = next(args);
        if (args[0]?.Lock?.Name === HEARTLOCK_NAME) {
            craft.Lock = '';
            recipes.set(craft, normalizeCraftLockSettings(drafts.get(args[0])));
        } else recipes.set(craft, null); // Explicitly switching to an ordinary lock removes the template.
        return craft;
    });
    registry.hook('CraftingSaveServer', 5, (args, next) => {
        const result = next(args);
        saveRecipes();
        return result;
    });

    registry.hook('CraftingRun', 0, (args, next) => { const result = next(args); updateButton(); return result; });
    registry.hook('CraftingExit', 5, (args, next) => { close(); return next(args); });

    let wearing;
    registry.hook('InventoryWear', 5, (args, next) => {
        const previous = wearing;
        const [target, , group, , , member, craft] = args;
        const operation = { target, group, settings: craft && member === Player.MemberNumber ? settingsFor(craft) : null };
        wearing = operation;
        try {
            const result = next(args);
            // InventoryWear may restore an explicit color after InventoryCraft.
            // Capture the final item, not the intermediate crafting color.
            if (operation.item && InventoryGet(target, group) === operation.item) {
                convertToHeartLock(target, operation.item, group, craftLockConfig(operation.settings));
            }
            return result;
        } finally { wearing = previous; }
    });

    registry.hook('InventoryCraft', 5, (args, next) => {
        const [source, target, group, craft, refresh, preconfigure = true] = args;
        if (!craft || craft.Lock !== '' || craft.Partial === true || !preconfigure) return next(args);
        // Preview characters never acquire a real persisted lock or emit room messages.
        if (!source?.IsPlayer?.() || !Number.isSafeInteger(target?.MemberNumber) || target.MemberNumber <= 0) return next(args);
        const activeWear = wearing?.target === target && wearing.group === group ? wearing : null;
        const settings = activeWear ? activeWear.settings : settingsFor(craft);
        if (!settings) return next(args);
        const itemBefore = InventoryGet(target, group);
        const allowed = isAllowedToLock(target) && !itemBefore?.Property?.LockedBy;
        const copy = { ...craft, Lock: '' };
        const result = next([source, target, group, copy, false, preconfigure, args[6]]);
        const item = InventoryGet(target, group);
        if (allowed && item?.Craft === copy && !item.Property?.LockedBy) {
            InventoryLock(target, item, HSLOCK_NAME, source, false);
        }
        if (allowed && item?.Craft === copy && item?.Property?.LockedBy === HSLOCK_NAME && Number(item.Property.LockMemberNumber) === Number(Player.MemberNumber)) {
            if (activeWear) activeWear.item = item;
            else convertToHeartLock(target, item, group, craftLockConfig(settings));
        }
        if (refresh) CharacterRefresh(target, true);
        return result;
    });
}
