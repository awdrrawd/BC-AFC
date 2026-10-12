import { getSharedSettings } from '../../core/settings.js';
// ════════════════════════════════════════
//  HeartLock module: vibe.js
//  震動：每 5 秒推進興奮值，每 60 秒發一次震動訊息（含音效）
// ════════════════════════════════════════

import { HEARTLOCK_NAME, VIBE_INTERVAL_MS, VIBE_MSG_CYCLE } from './config.js';
import { state } from './state.js';
import { th as T } from '../../i18n/i18n.js';
import { ensureStorage } from './storage.js';
import { sendLocalizedAction } from '../../i18n/l10n.js';

export function startVibeTimer() {
    if (state.timers.vibe) return;
    state.timers.vibe = setInterval(vibeStep, VIBE_INTERVAL_MS);
}

// 高潮讀條／高潮進行中：BC 原生 Timer.js 在 OrgasmTimer > 0 時完全不推進興奮值（只等計時器走完）。
// 這裡必須對齊，否則興奮值已是 100 時，每次 ActivityTimerProgress 都會再呼叫 ActivityOrgasmPrepare，
// 把 OrgasmTimer 重設成 now+5s、OrgasmStage 打回 0。震動週期 VIBE_INTERVAL_MS 剛好也是 5s，
// 讀條永遠在走完前被重設 → 不抵抗也不會高潮的「無限讀條」。
export const isOrgasmInProgress = (arousal) => typeof arousal?.OrgasmTimer === 'number' && arousal.OrgasmTimer > 0;

export function vibeStep() {
    if (!window.Player?.ArousalSettings || !ensureStorage()) return;
    const padlocks = Player.HeartLock?.padlocks ?? {};
    const order = { off:0, low:1, mid:2, high:3 };
    let maxStr = 'off', any = false, totalDelta = 0;
    for (const gn of Object.keys(padlocks)) {
        const cfg = padlocks[gn];
        if (!cfg?.vibe || cfg.vibe === 'off') continue;
        const item = InventoryGet?.(Player, gn);
        if (!item?.Property || item.Property.Name !== HEARTLOCK_NAME
            || (cfg.lockId && item.Property.HeartLockId !== cfg.lockId)) continue;
        any = true;
        totalDelta += order[cfg.vibe] ?? 0;                          // 多鎖疊加（維持原本行為）
        if ((order[cfg.vibe] ?? 0) > (order[maxStr] ?? 0)) maxStr = cfg.vibe;
    }
    if (!any) return;

    // 用 BC 原生 API 推進性慾：成長 + 連續抖動動畫 + 房間同步（deny/edge 由 orgasm hook 接手）
    try {
        const vlvl = { off:0, low:2, mid:3, high:4 }[maxStr] ?? 0;
        // 每個 5 秒週期內的抖動時間：弱 1s、中 3s、強 = 整個週期(+1s 讓下次驅動前不中斷)＝連續
        const animMs = { low:1000, mid:3000, high:VIBE_INTERVAL_MS + 1000 }[maxStr] ?? 0;
        // 興奮成長（驗證/表情/到100觸發）；高潮讀條／高潮進行中不推進，交還給 BC 原生計時器走完
        if (!isOrgasmInProgress(Player.ArousalSettings)) ActivityTimerProgress(Player, totalDelta);
        if (vlvl > 0 && animMs > 0) startVibeAnim(vlvl, animMs); // 抖動動畫（HSC 手法，見下）
        ActivityChatRoomArousalSync(Player);                   // 同步給房間（其他玩家依其可見度設定看到）
    } catch {}

    // 震動音效（只有自己聽到）
    if (getSharedSettings()?.enableVibeSound ?? true) {
        try { AudioPlaySoundEffect("VibrationShort"); } catch {}
    }

    state.vibe.cycle = (state.vibe.cycle + 1) % VIBE_MSG_CYCLE;
    if (state.vibe.cycle === 0) {
        const mode = getSharedSettings()?.vibeMsgMode ?? 'broadcast';
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

// ────────────────────────────────────────
//  連續抖動動畫（HSC 手法）
//  BC 的更新迴圈／興奮衰退會不斷把 VibratorLevel 歸零，若只在 vibeStep（每 5 秒）寫一次，
//  DrawArousalGlow 的抖動幅度很快就衰退 → 看起來只抖一下（約 0.5 秒）。
//  解法：震動期間用一個 ~100ms 的快迴圈持續補寫 VibratorLevel + ChangeTime，讓抖動幅度維持滿格＝連續。
//  這是本地視覺效果；跨房間仍靠 vibeStep 每 5 秒的 ActivityChatRoomArousalSync 快照（且受對方可見度設定影響）。
// ────────────────────────────────────────
export function startVibeAnim(level, durationMs) {
    if (!window.Player?.ArousalSettings) return;
    state.vibe.animationUntil = Date.now() + durationMs;   // 期間再觸發只延長，不重疊計時器
    state.vibe.animationLevel = level;
    if (state.timers.vibeAnimation) return;
    const tick = () => {
        if (!window.Player?.ArousalSettings || Date.now() >= state.vibe.animationUntil) {
            if (window.Player?.ArousalSettings) Player.ArousalSettings.VibratorLevel = 0;  // 交還給 BC 依實際玩具重算
            clearInterval(state.timers.vibeAnimation); state.timers.vibeAnimation = null;
            return;
        }
        Player.ArousalSettings.VibratorLevel = state.vibe.animationLevel;
        Player.ArousalSettings.ChangeTime = (typeof CommonTime === 'function') ? CommonTime() : Date.now();
    };
    tick();
    state.timers.vibeAnimation = setInterval(tick, 100);
}
