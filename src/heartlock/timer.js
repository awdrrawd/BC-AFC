// ════════════════════════════════════════
//  HeartLock module: timer.js
//  計時器到期自動解鎖（可選同時移除拘束）
// ════════════════════════════════════════

import { HEARTLOCK_NAME, HSLOCK_NAME } from './config.js';
import { state } from './state.js';
import { log } from './util.js';
import { ensureStorage, deleteConfig } from './storage.js';
import { sendLocalizedAction } from '../i18n/l10n.js';

export function startTimerCheck() { setInterval(checkTimers, 60000); }

export function checkTimers() {
    if (!ensureStorage()) return;
    const now = Date.now();
    for (const gn of Object.keys(Player.HeartLock?.padlocks ?? {})) {
        const cfg = Player.HeartLock.padlocks[gn];
        if (!cfg?.unlockTime || now < new Date(cfg.unlockTime).getTime()) continue;
        try {
            const item = InventoryGet?.(Player, gn);
            const isHearLock = item?.Property?.Name === HEARTLOCK_NAME
            || (item?.Property?.LockedBy === HSLOCK_NAME && item?.Property?.HeartLockId);
            if (item && isHearLock) {
                // 若要移除拘束，只移除本次心鎖對應的物品（gn），
                // 不掃描全身，避免誤觸其他戀人的心鎖物品
                const willRemove = cfg.removeRestraints;

                log(`計時器到期 gn=${gn} removeRestraints=${cfg.removeRestraints}`);

                // 直接操作 Property，繞過 InventoryUnlock hook 的干擾
                if (item.Property) {
                    if (typeof ValidationDeleteLock === 'function')
                        ValidationDeleteLock(item.Property, false);
                    delete item.Property.Name;
                    delete item.Property.HeartLockId;
                    const keys = Object.keys(item.Property);
                    if (keys.length === 0 || (keys.length === 1 && keys[0] === 'Effect' && !item.Property.Effect?.length))
                        item.Property = undefined;
                }

                // 移除物品本身（_timerUnlocking 讓 hook 放行）
                if (willRemove) {
                    try {
                        state._timerUnlocking = true;
                        InventoryRemove?.(Player, gn, false);
                        state._timerUnlocking = false;
                    } catch { state._timerUnlocking = false; }
                }

                CharacterRefresh?.(Player, false);
                ChatRoomCharacterUpdate?.(Player);
                const nick = Player.Nickname || Player.Name;
                try { sendLocalizedAction('hl', 'timerExpired', [nick, HEARTLOCK_NAME]); } catch {}
            }
        } catch (e) { log('checkTimers error: ' + e.message); }
        deleteConfig(gn);
    }
}
