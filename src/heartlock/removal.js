import { isAllowedToUnlock } from './permissions.js';
import { HEARTLOCK_NAME } from './config.js';
import { state } from './state.js';
import { getPadlockConfig } from './storage.js';
import { notifyRemove } from './net.js';
import { sendLocalizedAction } from '../i18n/l10n.js';

// Mirrors BC's dependency selection, including explicit root overrides. Block a
// root if removing it would also remove a protected HeartLock dependency.
function removalClosure(character, item, override, result = new Set()) {
    if (result.has(item)) return result;
    result.add(item);
    for (const rule of override ?? item.Asset?.RemoveItemOnRemove ?? []) {
        const child = character.Appearance.find(i => i.Asset?.Group?.Name === rule.Group);
        if (!child || (rule.Name && child.Asset.Name !== rule.Name)
            || (rule.TypeRecord && Object.entries(rule.TypeRecord).some(([k, v]) => child.Property?.TypeRecord?.[k] !== v))) continue;
        removalClosure(character, child, undefined, result);
    }
    return result;
}

export function installHeartLockRemovalHook(hook) {
    // The native release action must still be able to remove every restraint.
    // Scope the bypass to its synchronous call and keep normal removal cleanup.
    hook('ChatRoomSafewordRelease', 10, (args, next) => {
        const previous = state.operations.safewordRelease;
        state.operations.safewordRelease = true;
        try { return next(args); }
        finally { state.operations.safewordRelease = previous; }
    });
    // InventoryRemove (one group or many) delegates here in R132. Checking only
    // this common entry avoids duplicate notifications and covers direct calls.
    hook('InventoryRemoveItems', 0, (args, next) => {
        if (state.operations.restoring || state.operations.timerUnlocking) return next(args);
        const [character, input, options] = args;
        const requested = Array.isArray(input) ? input : [input];
        const configs = new Map();
        let blocked = false;
        const allowed = requested.filter(item => {
            if (!character?.Appearance?.includes(item)) return true;
            let permitted = true;
            for (const candidate of removalClosure(character, item, options?.removeItemOnRemove)) {
                if (candidate.Property?.Name !== HEARTLOCK_NAME) continue;
                const group = candidate.Asset.Group.Name;
                const cfg = getPadlockConfig(character, group);
                if (!cfg) continue;
                configs.set(candidate, { group, lockId: cfg.lockId });
                if (!isAllowedToUnlock(character, cfg)
                    && !(state.operations.safewordRelease && character.IsPlayer?.())) permitted = false;
            }
            if (!permitted) blocked = true;
            return permitted;
        });
        if (blocked && character?.IsPlayer?.() && !state.operations.sendingResist) {
            state.operations.sendingResist = true;
            setTimeout(() => {
                try { sendLocalizedAction('hl', 'resistEscape', [Player.Nickname || Player.Name, HEARTLOCK_NAME]); }
                finally { state.operations.sendingResist = false; }
            }, 300);
        }
        if (!allowed.length) return [];
        const removed = next([character, allowed, options]);
        for (const item of new Set(removed)) {
            if (configs.has(item)) notifyRemove(character, configs.get(item).group, configs.get(item).lockId);
        }
        return removed;
    });
}
