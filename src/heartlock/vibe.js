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
    let maxStr = 'off', any = false, totalDelta = 0;
    for (const gn of Object.keys(padlocks)) {
        const cfg = padlocks[gn];
        if (!cfg?.vibe || cfg.vibe === 'off') continue;
        const item = InventoryGet?.(Player, gn);
        if (!item?.Property || item.Property.Name !== HEARTLOCK_NAME) { delete padlocks[gn]; continue; }
        any = true;
        totalDelta += order[cfg.vibe] ?? 0;                          // 多鎖疊加（維持原本行為）
        if ((order[cfg.vibe] ?? 0) > (order[maxStr] ?? 0)) maxStr = cfg.vibe;
    }
    if (!any) return;

    // 用 BC 原生 API 推進性慾：興奮條抖動動畫 + 房間同步 + 表情/到100觸發（deny/edge 由 orgasm hook 接手）
    try {
        const vlvl = { off:0, low:2, mid:3, high:4 }[maxStr] ?? 0;
        ActivityVibratorLevel(Player, vlvl);        // 設 VibratorLevel（僅在等級改變時才更新 ChangeTime）
        // 每個 tick 主動刷新 ChangeTime：VFXAnimatedTemp（BC 預設）動畫只在 ChangeTime 後 5 秒內顯示，
        // 而我們每 5 秒才驅動一次、等級又不變 → 若不手動刷新，第一次之後 ChangeTime 凍結、動畫就熄了。
        // 設在一個 interval 之後，讓動畫在下次驅動前都維持滿格（避免 5 秒邊界的閃爍）。CommonTime 為
        // Date.now()（各端時鐘一致），同步後其他玩家也看得到連續抖動。
        if (Player.ArousalSettings.VibratorLevel > 0) Player.ArousalSettings.ChangeTime = CommonTime() + VIBE_INTERVAL_MS;
        ActivityTimerProgress(Player, totalDelta);  // 驗證/表情/到100觸發，取代直接改 Progress
        ActivityChatRoomArousalSync(Player);        // 同步給房間，別人才看得到成長與抖動
    } catch {}

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
