import { clone } from './util.js';
import { r132CompleteCraft } from '../compat/r132-craft.js';

// Restore missing protected-item metadata without reapplying craft defaults.
// Existing Craft can be present even when the native dialog fails to display it.
export function restoreSnapshotCraft(item, snapshot) {
    if (!item?.Asset || item.Craft || !snapshot?.craft || snapshot.assetName !== item.Asset.Name
        || snapshot.groupName !== item.Asset.Group?.Name) return false;
    const craft = r132CompleteCraft(clone(snapshot.craft), item.Asset);
    if (typeof CraftingValidate !== 'function'
        || !CraftingValidate(craft, item.Asset, true, false, true)) return false;
    item.Craft = craft;
    return true;
}
