import { removeLock } from './lock.js';
// ════════════════════════════════════════
//  HeartLock module: timer.js
//  計時器到期自動解鎖（可選同時移除拘束）
// ════════════════════════════════════════

import { HEARTLOCK_NAME } from './config.js';
import { state } from './state.js';
import { log } from './util.js';
import { ensureStorage } from './storage.js';
import { sendLocalizedAction } from '../i18n/l10n.js';

export function startTimerCheck() {
    if (!state.timers.unlockCheck) state.timers.unlockCheck = setInterval(checkTimers, 60000);
}

export function checkTimers() {
    if (!ensureStorage()) return;
    const now = Date.now();
    for (const gn of Object.keys(Player.HeartLock?.padlocks ?? {})) {
        const cfg = Player.HeartLock.padlocks[gn];
        if (!cfg?.unlockTime || now < new Date(cfg.unlockTime).getTime()) continue;
        try {
            if (removeLock(gn, { removeRestraint: !!cfg.removeRestraints })) {
                try { sendLocalizedAction('hl', 'timerExpired', [Player.Nickname || Player.Name, HEARTLOCK_NAME]); } catch {}
            }
        } catch (e) { log('checkTimers error: ' + e.message); }
    }
}
