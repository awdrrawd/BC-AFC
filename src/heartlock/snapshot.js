import { clone } from './util.js';
import { r132CompleteCraft } from '../compat/r132-craft.js';

export function snapshotItem(item, groupName = item.Asset.Group.Name) {
    return {
        assetName: item.Asset.Name, groupName,
        color: item.Color == null ? undefined : clone(item.Color),
        craft: item.Craft == null ? undefined : clone(r132CompleteCraft(item.Craft, item.Asset)),
        difficulty: item.Difficulty,
        property: clone(item.Property ?? {}),
    };
}

export function restoreSnapshotProperty(item, snapshot) {
    if (!snapshot?.property || snapshot.assetName !== item.Asset.Name
        || snapshot.groupName !== item.Asset.Group.Name) return;
    const property = clone(snapshot.property);
    // Reapply the current HeartLock separately, never resurrect an old timer/key/owner.
    ValidationDeleteLock(property, false);
    delete property.Name;
    delete property.HeartLockId;
    item.Property = property;
}
