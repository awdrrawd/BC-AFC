import { HEARTLOCK_NAME, HSLOCK_NAME } from '../features/heartlock/config.js';

// R132 and R134 compatibility both need to recognise AFC's Heart Lock markers on a HighSecurityPadlock.

/** Item.Property keys AFC writes onto a HighSecurityPadlock to mark it as a Heart Lock.
 *  scripts/check-bc-compat.mjs compares them with BC's PropertyData. */
export const HEARTLOCK_PROPERTY_KEYS = ['Name', 'HeartLockId', 'LockPickSeed', 'ExclusiveUnlock'];

// Only AFC's actual HighSecurityPadlock markers cross this compatibility path.
// Do not relax BC's property filtering for ordinary items or other plugins.
export function heartLockMarkers(property) {
    if (property?.LockedBy !== HSLOCK_NAME
        || (property.Name !== HEARTLOCK_NAME && !(typeof property.HeartLockId === 'string' && property.HeartLockId))) return null;
    const result = { Name: HEARTLOCK_NAME };
    if (typeof property.HeartLockId === 'string') result.HeartLockId = property.HeartLockId;
    if (typeof property.LockPickSeed === 'string') result.LockPickSeed = property.LockPickSeed;
    if (typeof property.ExclusiveUnlock === 'boolean') result.ExclusiveUnlock = property.ExclusiveUnlock;
    return result;
}
