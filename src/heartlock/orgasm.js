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
        // edge：對齊 BC 原生 IsEdged()，封頂 95、永不高潮
        if (mode === 'edge') { if (Player.ArousalSettings?.Progress != null) Player.ArousalSettings.Progress = 95; return; }
        // deny：委派原生（BCX 手法）——暫時戴上 DenialMode + RuinOrgasms，讓 BC 跑完整的高潮失敗流程
        //       （房間同步、失敗訊息、意志力全部原生處理），跑完立即還原 Effect 不外洩
        if (mode === 'deny') {
            const backup = Player.Effect;
            try {
                Player.Effect = (Array.isArray(backup) ? backup : []).concat('DenialMode', 'RuinOrgasms');
                next(args);
            } finally {
                Player.Effect = backup;
            }
            return;
        }
        return next(args);
    });
    modApi.hookFunction('ActivityOrgasmStart', 11, (args, next) => {
        if (!args[0]?.IsPlayer?.()) return next(args);
        // edge 原生不會設 OrgasmTimer，理論上不會走到這；保險起見再封頂一次
        if (getMode() === 'edge') { if (Player.ArousalSettings?.Progress != null) Player.ArousalSettings.Progress = 95; return; }
        // deny 交由原生 ruined 流程（ActivityOrgasmRuined 已在 Prepare 設定），此處不攔截
        return next(args);
    });
}
