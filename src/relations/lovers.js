// ════════════════════════════════════════
//  AFC module: lovers.js
//  戀人資料 CRUD + 查詢 + 最後見面 + 自動解除
// ════════════════════════════════════════

import { STAGE } from '../core/config.js';
import { AFCLockAccessOn, loversPrivateRoom, setLastKnownLoverCount } from '../core/state.js';
import { getSharedSettings, saveSharedSettings } from '../core/settings.js';
import { normalizeLover, normalizeLoverList, normalizeMemberNumber, sameMemberNumber } from './lover-model.js';

function commitLovers(settings) {
    setLastKnownLoverCount(settings.lovers.length);
    saveSharedSettings();
}

export function addLover(memberNumber, name, stage = STAGE.DATING) {
    const s = getSharedSettings();
    const normalized = normalizeLover({ memberNumber, name, stage });
    if (!s || !normalized || s.lovers.some(l => sameMemberNumber(l.memberNumber, normalized.memberNumber))) return false;
    s.lovers.push(normalized);
    commitLovers(s);
    console.log("🐈‍⬛ [AFC] ✅ 新增戀人:", name, memberNumber);
    return true;
}

export function upsertLover(input) {
    const s = getSharedSettings();
    const normalized = normalizeLover(input);
    if (!s || !normalized) return null;
    const index = s.lovers.findIndex(l => sameMemberNumber(l.memberNumber, normalized.memberNumber));
    if (index >= 0) s.lovers[index] = { ...s.lovers[index], ...normalized };
    else s.lovers.push(normalized);
    commitLovers(s);
    return s.lovers[index >= 0 ? index : s.lovers.length - 1];
}

export function replaceLovers(lovers) {
    const s = getSharedSettings();
    if (!s) return [];
    s.lovers = normalizeLoverList(lovers);
    commitLovers(s);
    return s.lovers;
}

export function removeLover(memberNumber) {
    const s = getSharedSettings();
    if (!s) return;
    const normalized = normalizeMemberNumber(memberNumber);
    if (normalized === null) return;
    s.lovers = s.lovers.filter(l => !sameMemberNumber(l.memberNumber, normalized));
    AFCLockAccessOn.delete(normalized);
    delete loversPrivateRoom[normalized];
    commitLovers(s);
}

// 升格戀人關係階段（單調：只升不降，防「已結婚被降回訂婚」造成雙方不一致）
export function promoteStage(memberNumber, newStage) {
    const s = getSharedSettings();
    const lover = s?.lovers.find(l => sameMemberNumber(l.memberNumber, memberNumber));
    if (!lover) return;
    if (newStage <= (lover.stage ?? STAGE.DATING)) return;   // 不降級、同級不重設日期
    lover.stage     = newStage;
    lover.stageDate = Date.now();
    saveSharedSettings();
}

// 依對方持有的資料校正「我這邊」的關係階段與日期，收斂雙方狀態。
//   規則：關係進度優先（升格為準）→ 採對方階段與其升格日期（例：對方已結婚2天、
//   我還訂婚12天 → 我變成結婚2天）；同階段時取較早的日期（關係較久者為準）。
//   回傳是否有變更。
export function reconcileStage(memberNumber, theirStage, theirStageDate, theirStartDate) {
    const s = getSharedSettings();
    const lover = s?.lovers.find(l => sameMemberNumber(l.memberNumber, memberNumber));
    if (!lover) return false;

    const myStage = lover.stage ?? STAGE.DATING;
    let changed = false;

    if (theirStage != null && theirStage > myStage) {
        // 對方階段較高 → 升格，並採用對方該階段的日期（顯示與對方一致的天數）
        lover.stage     = theirStage;
        lover.stageDate = theirStageDate ?? lover.stageDate ?? Date.now();
        changed = true;
    } else if (theirStage != null && theirStage === myStage
               && theirStageDate && (!lover.stageDate || theirStageDate < lover.stageDate)) {
        // 同階段但對方日期較早 → 取較早者（關係較久）
        lover.stageDate = theirStageDate;
        changed = true;
    }
    // 交往起始日一律取較早者
    if (theirStartDate && (!lover.startDate || theirStartDate < lover.startDate)) {
        lover.startDate = theirStartDate;
        changed = true;
    }

    if (changed) saveSharedSettings();
    return changed;
}

export function getLoverEntry(memberNumber) {
    return getSharedSettings()?.lovers.find(l => sameMemberNumber(l.memberNumber, memberNumber));
}

export function isAFCLover(memberNumber) {
    return getSharedSettings()?.lovers.some(l => sameMemberNumber(l.memberNumber, memberNumber)) ?? false;
}

export function targetHasAFC(C) { return !!(C?.OnlineSharedSettings?.AFC); }

export function isNativeLover(memberNumber) {
    return Player.Lovership?.some(l => sameMemberNumber(l.MemberNumber, memberNumber)) ?? false;
}

// ── 最後見面紀錄 ──
export function updateLastSeen(memberNumber) {
    const s = getSharedSettings();
    const lover = s?.lovers.find(l => sameMemberNumber(l.memberNumber, memberNumber));
    if (lover) {
        lover.lastSeen = Date.now();
        saveSharedSettings();
    }
}
