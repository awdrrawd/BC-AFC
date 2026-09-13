import { HEARTLOCK_NAME } from './config.js';

export function isHeartLock(item) {
    return !!(item?.Property?.HeartLockId || item?.Property?.Name === HEARTLOCK_NAME);
}
export function isProtected(character, group) {
    return !!character?.Appearance?.some(item => item.Asset?.Group?.Name === group && isHeartLock(item));
}
// 移除複本的心鎖資訊，絕不解開穿戴中的物品。
export function sanitizeOutfitItem(entry) {
    const copy = structuredClone(entry);
    if (!isHeartLock(copy)) return copy;
    const p = copy.Property;
    if (typeof ValidationDeleteLock === 'function') ValidationDeleteLock(p, false);
    for (const key of ['Name', 'HeartLockId', 'LockedBy', 'LockMemberNumber', 'LockMemberName', 'LockPickSeed', 'MemberNumberListKeys']) delete p[key];
    if (Array.isArray(p.Effect)) p.Effect = p.Effect.filter(effect => effect !== 'Lock');
    return copy;
}
