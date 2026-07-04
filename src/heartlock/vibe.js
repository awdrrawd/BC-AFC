// ════════════════════════════════════════
//  HeartLock module: vibe.js
//  震動：每 5 秒推進興奮值，每 60 秒發一次震動訊息（含音效）
// ════════════════════════════════════════

import { HEARTLOCK_NAME, VIBE_INTERVAL_MS, VIBE_MSG_CYCLE } from './config.js';
import { state } from './state.js';
import { T } from './i18n.js';
import { ensureStorage } from './storage.js';
import { sendLocalizedAction } from '../i18n/l10n.js';

export function startVibeTimer() {
    if (state.vibeTimer) return;
    state.vibeTimer = setInterval(vibeStep, VIBE_INTERVAL_MS);
}

export function vibeStep() {
    if (!window.Player?.ArousalSettings || !ensureStorage()) return;
    const padlocks = Player.HeartLock?.padlocks ?? {};
    const order = { off:0, low:1, mid:2, high:3 };
    let maxStr = 'off', any = false;
    for (const gn of Object.keys(padlocks)) {
        const cfg = padlocks[gn];
        if (!cfg?.vibe || cfg.vibe === 'off') continue;
        const item = InventoryGet?.(Player, gn);
        if (!item?.Property || item.Property.Name !== HEARTLOCK_NAME) { delete padlocks[gn]; continue; }
        any = true;
        Player.ArousalSettings.Progress = Math.min(100, (Player.ArousalSettings.Progress ?? 0) + ({ off:0,low:1,mid:2,high:3 }[cfg.vibe] ?? 0));
        if ((order[cfg.vibe] ?? 0) > (order[maxStr] ?? 0)) maxStr = cfg.vibe;
    }
    if (!any) return;

    // 震動音效（只有自己聽到）
    if (Player.OnlineSharedSettings?.AFC?.enableVibeSound ?? true) {
        try { AudioPlaySoundEffect("VibrationShort"); } catch {}
    }

    state.vibeCycle = (state.vibeCycle + 1) % VIBE_MSG_CYCLE;
    if (state.vibeCycle === 0) {
        const mode = Player.OnlineSharedSettings?.AFC?.vibeMsgMode ?? 'broadcast';
        if (mode !== 'off') {
            const nick = Player.Nickname || Player.Name;
            const msg = { low: T('vibelow', nick, HEARTLOCK_NAME), mid: T('vibemid', nick, HEARTLOCK_NAME), high: T('vibehigh', nick, HEARTLOCK_NAME) }[maxStr];
            if (msg) {
                try {
                    if (mode === 'broadcast') {
                        // 在地化廣播：發英文底本，接收端各看各語言
                        sendLocalizedAction('hl', 'vibe' + maxStr, [nick, HEARTLOCK_NAME]);
                    } else {
                        // 'local' — 只有自己看到
                        ChatRoomSendLocal(msg);
                    }
                } catch {}
            }
        }
    }
}
