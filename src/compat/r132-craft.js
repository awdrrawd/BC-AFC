// Temporary R132 data migration, based on the supplied Craft Hotfix [A].
// No DialogInventory or ExpressionQueue patches belong in this module.
const r132FullCraftKeys = [
    'Item', 'Color', 'Lock', 'ItemProperty', 'TypeRecord', 'Type',
    'DifficultyFactor', 'OverridePriority', 'Disabled',
];
const r132MigratedCrafts = new WeakSet();

export function r132CompleteCraft(craft, asset = null) {
    if (typeof GameVersion === 'string' && !/^R132(?:\D|$)/.test(GameVersion)) return craft;
    if (!craft || typeof craft !== 'object' || Array.isArray(craft)
        || craft.Partial != null || !r132FullCraftKeys.some(key => craft[key] !== undefined)) return craft;
    if (!asset && typeof CraftingAssets !== 'undefined' && typeof craft.Item === 'string') {
        const assets = CraftingAssets[craft.Item];
        if (Array.isArray(assets) && assets.length === 1) asset = assets[0];
    }
    if (typeof craft.Item !== 'string' && !asset) return craft;
    // Work on a copy so frozen/shared craft records and saved backups stay intact.
    let copy;
    try { copy = structuredClone(craft); }
    catch { return craft; }
    if (copy.TypeRecord == null && typeof copy.Type === 'string' && copy.Type !== '') {
        if (!asset || typeof ExtendedItemTypeToRecord !== 'function') return craft;
        try { copy.TypeRecord = ExtendedItemTypeToRecord(asset, copy.Type); }
        catch { return craft; } // Keep legacy identity for a later retry.
    }
    if (typeof copy.Item !== 'string') copy.Item = asset.Name;
    if (typeof copy.Color !== 'string') copy.Color = '';
    if (typeof copy.Lock !== 'string') copy.Lock = '';
    if (!copy.ItemProperty || typeof copy.ItemProperty !== 'object' || Array.isArray(copy.ItemProperty)) copy.ItemProperty = {};
    if (!copy.Effects || typeof copy.Effects !== 'object' || Array.isArray(copy.Effects)) copy.Effects = {};
    if (typeof copy.Name !== 'string') copy.Name = asset?.Description ?? 'Crafted Item';
    if (typeof copy.Description !== 'string') copy.Description = '';
    if (typeof copy.Private !== 'boolean') copy.Private = false;
    if (copy.TypeRecord === undefined) copy.TypeRecord = null;
    copy.Partial = false;
    r132MigratedCrafts.add(copy);
    return copy;
}

export function r132RepairPlayerCrafts() {
    let changed = false;
    for (const list of [Player?.Appearance, Player?.AppearanceFull]) {
        for (const item of Array.isArray(list) ? list : []) {
            if (!item?.Craft) continue;
            const craft = r132CompleteCraft(item.Craft, item.Asset);
            if (craft !== item.Craft) item.Craft = craft;
            // Also persist records completed by the bundle hook during login.
            if (r132MigratedCrafts.has(craft)) { r132MigratedCrafts.delete(craft); changed = true; }
        }
    }
    if (changed) {
        ServerPlayerAppearanceSync();
        if (typeof ServerPlayerIsInChatRoom === 'function' && ServerPlayerIsInChatRoom()) ChatRoomCharacterUpdate(Player);
    }
    return changed;
}

export function r132InstallCraftDataHooks(registry) {
    registry.hook('ServerBundledItemToAppearanceItem', 10, (args, next) => {
        const item = next(args);
        if (item?.Craft) item.Craft = r132CompleteCraft(item.Craft, item.Asset);
        return item;
    });
    registry.hook('InventoryCraft', 10, (args, next) => {
        args[3] = r132CompleteCraft(args[3], InventoryGet(args[1], args[2])?.Asset);
        return next(args);
    });
}
