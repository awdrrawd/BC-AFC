// ════════════════════════════════════════
//  AFC module: lovers.js
//  戀人資料 CRUD + 查詢 + 最後見面 + 自動解除
// ════════════════════════════════════════

import { STAGE } from '../core/config.js';
import { AFCLockAccessOn, loversPrivateRoom, setLastKnownLoverCount } from '../core/state.js';
import {
    getSharedSettings, getPrivateSettings, saveSharedSettings, _syncLoversBackup,
} from '../core/settings.js';
import { broadcastAFCData } from '../net/sync-data.js';
import { daysSince, chatLocalNotice } from '../util/util.js';
import { initiateBreakup } from './breakup.js';

export function addLover(memberNumber, name, stage = STAGE.DATING) {
    const s = getSharedSettings();
    if (!s || s.lovers.some(l => l.memberNumber === memberNumber)) return;
    s.lovers.push({
        memberNumber, name, stage,
        startDate:   Date.now(),
        stageDate:   Date.now(),
    });
    saveSharedSettings();
    _syncLoversBackup();
    broadcastAFCData();
    console.log("🐈‍⬛ [AFC] ✅ 新增戀人:", name, memberNumber);
}

export function removeLover(memberNumber) {
    const s = getSharedSettings();
    if (!s) return;
    s.lovers = s.lovers.filter(l => l.memberNumber !== memberNumber);
    AFCLockAccessOn.delete(memberNumber);
    delete loversPrivateRoom[memberNumber];
    setLastKnownLoverCount(s.lovers.length);
    saveSharedSettings();
    _syncLoversBackup();
    broadcastAFCData();
}

// 升格戀人關係階段
export function promoteStage(memberNumber, newStage) {
    const s = getSharedSettings();
    const lover = s?.lovers.find(l => l.memberNumber === memberNumber);
    if (!lover) return;
    lover.stage     = newStage;
    lover.stageDate = Date.now();
    saveSharedSettings();
    _syncLoversBackup();
}

export function getLoverEntry(memberNumber) {
    return getSharedSettings()?.lovers.find(l => l.memberNumber === memberNumber);
}

export function isAFCLover(memberNumber) {
    return getSharedSettings()?.lovers.some(l => l.memberNumber === memberNumber) ?? false;
}

export function targetHasAFC(C) { return !!(C?.OnlineSharedSettings?.AFC); }

export function isNativeLover(memberNumber) {
    return Player.Lovership?.some(l => l.MemberNumber === memberNumber) ?? false;
}

// ── 最後見面紀錄 ──
export function updateLastSeen(memberNumber) {
    const s = getSharedSettings();
    const lover = s?.lovers.find(l => l.memberNumber === memberNumber);
    if (lover) {
        lover.lastSeen = Date.now();
        saveSharedSettings();
    }
}

// ── 自動解除（超過 N 天未見面）──
export function checkAutoBreakup() {
    const priv = getPrivateSettings();
    if (!priv?.autoBreakupDays || priv.autoBreakupDays <= 0) return;
    const s = getSharedSettings();
    if (!s) return;
    const threshold = priv.autoBreakupDays;
    for (const lover of [...s.lovers]) {
        const lastSeen = lover.lastSeen ?? lover.startDate;
        if (daysSince(lastSeen) >= threshold) {
            chatLocalNotice(`與 ${lover.name} 已超過 ${threshold} 天未見面，自動解除拓展戀人關係。`);
            initiateBreakup(lover.memberNumber, lover.name);
        }
    }
}
