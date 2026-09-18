import { HEARTLOCK_NAME, HSLOCK_NAME } from './config.js';

// Only AFC's actual HighSecurityPadlock markers cross this compatibility path.
// Do not relax BC's property filtering for ordinary items or other plugins.
function markers(property) {
    if (property?.LockedBy !== HSLOCK_NAME
        || (property.Name !== HEARTLOCK_NAME && !(typeof property.HeartLockId === 'string' && property.HeartLockId))) return null;
    const result = { Name: HEARTLOCK_NAME };
    if (typeof property.HeartLockId === 'string') result.HeartLockId = property.HeartLockId;
    if (typeof property.LockPickSeed === 'string') result.LockPickSeed = property.LockPickSeed;
    if (typeof property.ExclusiveUnlock === 'boolean') result.ExclusiveUnlock = property.ExclusiveUnlock;
    return result;
}

export function installHeartLockPropertyHooks(hook) {
    hook('ItemPropertiesCompress', 10, (args, next) => {
        const result = next(args);
        const [item, options] = args;
        if (options?.allowLocks === false || options?.omit?.includes('LockedBy')) return result;
        const extra = markers(item?.Property);
        if (!extra || result?.LockedBy !== HSLOCK_NAME) return result;
        for (const key of options?.omit ?? []) delete extra[key];
        return { ...result, ...extra };
    });
    hook('ItemPropertiesDecompress', 10, (args, next) => {
        const result = next(args);
        const extra = markers(args[1]);
        if (extra && args[0]?.Property?.LockedBy === HSLOCK_NAME) {
            Object.assign(args[0].Property, extra);
        }
        return result;
    });
}

/** Recover markers lost by an earlier R132 save, never re-lock or replace items.
 * Requires the stored owner AND asset to match the currently equipped lock.
 * A different existing lock id is authoritative; stale config must not replace it.
 */
export function restoreHeartLockMarkers(character) {
    const store = character?.HeartLock;
    if (store?.memberNumber != null && store.memberNumber !== character.MemberNumber) return;
    for (const item of character?.Appearance ?? []) {
        const cfg = store?.padlocks?.[item.Asset?.Group?.Name];
        const p = item.Property;
        if (!cfg || typeof cfg.lockId !== 'string' || !cfg.lockId || !cfg.assetName
            || cfg.assetName !== item.Asset?.Name || p?.LockedBy !== HSLOCK_NAME
            || !Number.isSafeInteger(Number(cfg.owner)) || Number(cfg.owner) <= 0
            || Number(p.LockMemberNumber) !== Number(cfg.owner)
            || (p.HeartLockId != null && p.HeartLockId !== cfg.lockId)) continue;
        p.Name = HEARTLOCK_NAME;
        p.HeartLockId = cfg.lockId;
        p.LockPickSeed ??= '8,3,5,10,4,2,6,7,1,9,0,11';
    }
}
