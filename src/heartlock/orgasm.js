// ════════════════════════════════════════
//  HeartLock module: orgasm.js
//  高潮攔截（normal / edge / deny）
// ════════════════════════════════════════

import { HEARTLOCK_NAME } from './config.js';
import { ensureStorage } from './storage.js';

export function setupOrgasmHook(modApi) {
    const getMode = () => {
        if (!ensureStorage()) return 'normal';
        let mode = 'normal';
        for (const gn of Object.keys(Player.HeartLock?.padlocks ?? {})) {
            const cfg = Player.HeartLock.padlocks[gn];
            if (!cfg?.orgasmMode || cfg.orgasmMode === 'normal') continue;
            const item = InventoryGet?.(Player, gn);
            if (!item?.Property || item.Property.Name !== HEARTLOCK_NAME) continue;
            if (cfg.orgasmMode === 'deny') { mode = 'deny'; break; }
            if (cfg.orgasmMode === 'edge') mode = 'edge';
        }
        return mode;
    };
    modApi.hookFunction('ActivityOrgasmPrepare', 11, (args, next) => {
        if (!args[0]?.IsPlayer?.()) return next(args);
        const mode = getMode();
        if (mode === 'deny') { if (Player.ArousalSettings?.Progress != null) Player.ArousalSettings.Progress = 0; return; }
        if (mode === 'edge') { if (Player.ArousalSettings?.Progress != null) Player.ArousalSettings.Progress = 99; return; }
        return next(args);
    });
    modApi.hookFunction('ActivityOrgasmStart', 11, (args, next) => {
        if (!args[0]?.IsPlayer?.()) return next(args);
        const mode = getMode();
        if (mode === 'deny' || mode === 'edge') { if (Player.ArousalSettings?.Progress != null) Player.ArousalSettings.Progress = mode === 'deny' ? 0 : 99; return; }
        return next(args);
    });
}
