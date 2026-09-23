// ════════════════════════════════════════
//  HeartLock module: permissions.js
//  上鎖 / 編輯 / 解鎖 權限判斷（讀穿戴者的 OnlineSharedSettings.AFC.lockPerms）
// ════════════════════════════════════════

import { log } from './util.js';

/**
 * 判斷 Player 是否能對 ch 上鎖。
 * 讀穿戴者 ch 的 OnlineSharedSettings（公開資料，伺服器直接提供）。
 * lockPerms 控制穿戴者允許哪些關係使用心鎖；
 * 關係從 ch.Lovership / ch.Ownership / ch.OnlineSharedSettings.AFC.lovers 判斷。
 */
export function isAllowedToLock(ch) {
    if (!ch?.MemberNumber) return false;
    const meNum     = Number(Player.MemberNumber);
    const lockPerms = ch.OnlineSharedSettings?.AFC?.lockPerms;

    // 主人（enableOwnerLock）
    if (lockPerms?.enableOwnerLock) {
        const ownerNum = ch.Ownership?.MemberNumber;
        if (ownerNum != null && Number(ownerNum) === meNum) return true;
    }

    if (!lockPerms?.enableAFCLock) {
        log(`isAllowedToLock: ❌ enableAFCLock=false (ch=${ch.MemberNumber})`);
        return false;
    }

    // 優先使用 AFC 合併 API（若已載入）
    if (typeof window.Liko?.AFC?.canUseHeartLock === 'function')
        return window.Liko.AFC.canUseHeartLock(ch);

    // Fallback：直接讀 OnlineSharedSettings
    const afcLovers = ch.OnlineSharedSettings?.AFC?.lovers ?? [];
    if (afcLovers.some(l => Number(l.memberNumber) === meNum)) return true;
    if (ch.Lovership?.some(l => Number(l.MemberNumber) === meNum)) return true;

    return false;
}

export function canEdit(wearerChar, cfg) {
    if (!wearerChar || !cfg) return false;
    if (wearerChar.IsPlayer()) return false;
    return cfg.owner === Player.MemberNumber;
}

/**
 * 判斷 Player 是否有資格解開 C 身上的 HeartLock。
 * owner 始終可解鎖；戀人需穿戴者開啟 enableAFCLock；主人需開啟 enableOwnerLock。
 */
export function isAllowedToUnlock(C, cfg) {
    if (!C || !cfg) return false;
    const meNum = Number(Player.MemberNumber);
    // 掛鎖者始終可解鎖
    if (Number(cfg.owner) === meNum) return true;
    const lockPerms = C.OnlineSharedSettings?.AFC?.lockPerms;
    // 主人（需 enableOwnerLock）
    if (lockPerms?.enableOwnerLock &&
        C.Ownership?.MemberNumber != null &&
        Number(C.Ownership.MemberNumber) === meNum) return true;
    // 戀人需 enableAFCLock
    if (!lockPerms?.enableAFCLock) return false;
    // AFC 戀人
    const afcLovers = C.OnlineSharedSettings?.AFC?.lovers ?? [];
    if (afcLovers.some(l => Number(l.memberNumber) === meNum)) return true;
    // BC 原生戀人
    if (C.Lovership?.some(l => Number(l.MemberNumber) === meNum)) return true;
    return false;
}

/**
 * 穿戴者（Player）視角：判斷 memberNumber 是否為 Player 允許施鎖/解鎖的關係
 * （主人需 enableOwnerLock；戀人需 enableAFCLock）。
 * 用於「接收端」驗證遠端鎖指令的發送者，避免同房任意人偽造 owner 身分。
 * 讀 Player 自己的設定（本地權威），不受他人 P2P 廣播污染。
 */
export function isMemberAllowedByMe(memberNumber) {
    if (memberNumber == null) return false;
    const n = Number(memberNumber);
    const lockPerms = Player.OnlineSharedSettings?.AFC?.lockPerms;
    // 主人（需 enableOwnerLock）
    if (lockPerms?.enableOwnerLock &&
        Player.Ownership?.MemberNumber != null &&
        Number(Player.Ownership.MemberNumber) === n) return true;
    // 戀人需 enableAFCLock
    if (!lockPerms?.enableAFCLock) return false;
    // AFC 戀人
    const afcLovers = Player.OnlineSharedSettings?.AFC?.lovers ?? [];
    if (afcLovers.some(l => Number(l.memberNumber) === n)) return true;
    // BC 原生戀人
    if (Player.Lovership?.some(l => Number(l.MemberNumber) === n)) return true;
    return false;
}
