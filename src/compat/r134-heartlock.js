import { HSLOCK_NAME } from '../features/heartlock/config.js';
import { heartLockMarkers } from './heartlock-markers.js';

// BC-R134-COMPAT: R134 wires ItemPropertiesValidate into ExtendedItemInit, ValidationSanitizeProperties
// and ItemPropertiesDecompress, and each caller overwrites Item.Property with the result. Validate only
// copies fields that have a PropertyData entry, so Name / HeartLockId / ExclusiveUnlock (no entry) are
// dropped on every init or appearance sync.
//
// Put AFC's markers back, but only for a validated HighSecurityPadlock that carries them with the right
// types; never for ordinary items or other plugins' fields. Remove once BC registers these keys in
// PropertyData (`npm run check:bc` reports when that happens).
export function installHeartLockValidateHook(hook) {
    hook('ItemPropertiesValidate', 5, (args, next) => {
        const result = next(args);
        const value = result?.value;
        if (!value || typeof value !== 'object' || value.LockedBy !== HSLOCK_NAME) return result;
        const extra = heartLockMarkers(args[0]);
        if (!extra) return result;
        const omit = new Set(args[2]?.omit ?? []);
        for (const [key, data] of Object.entries(extra)) {
            // Keys BC already validated (e.g. LockPickSeed) keep BC's value.
            if (!omit.has(key) && value[key] === undefined) value[key] = data;
        }
        return result;
    });
}
