import { clone } from './util.js';
import { r132CompleteCraft } from '../compat/r132-craft.js';

export function snapshotItem(item, groupName = item.Asset.Group.Name) {
    return {
        version: 2, format: 'runtime', assetFamily: item.Asset.Group.Family,
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

// Native lock initialization resets keys and lock options. Restore them only
// from a snapshot of this exact lock; legacy/unrelated lock data stays stripped.
export function restoreSnapshotLock(item, snapshot, cfg) {
    const p = snapshot?.property;
    if (snapshot?.version !== 2 || snapshot.assetName !== item.Asset.Name
        || snapshot.groupName !== item.Asset.Group.Name || !cfg.lockId
        || p?.HeartLockId !== cfg.lockId || Number(p.LockMemberNumber) !== Number(cfg.owner)) return;
    item.Property = clone(p);
}

export function upgradeSnapshotLock(snapshot, item) {
    if (snapshot.version === 2 || !snapshot.property || !item.Property?.HeartLockId) return false;
    const unlocked = clone(item.Property);
    ValidationDeleteLock(unlocked, false);
    for (const [key, value] of Object.entries(item.Property)) {
        if (!(key in unlocked) || ['Name', 'HeartLockId', 'LockPickSeed', 'ExclusiveUnlock'].includes(key)) {
            snapshot.property[key] = clone(value);
        }
    }
    snapshot.property.Effect = [...new Set([...(snapshot.property.Effect ?? []), 'Lock'])];
    snapshot.version = 2;
    snapshot.format = 'runtime';
    snapshot.assetFamily = item.Asset.Group.Family;
    return true;
}
