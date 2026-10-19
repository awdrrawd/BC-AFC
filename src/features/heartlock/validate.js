// ════════════════════════════════════════
//  HeartLock module: validate.js
//  來自其他玩家（遠端 Hidden 訊息）的鎖設定與部位名稱驗證。
//  HeartLockApply 與 HeartLock::Update 先前各自內聯驗證、且 Update 完全不驗證；
//  這裡統一成一份規則（純函式，不依賴 BC 全域）。
// ════════════════════════════════════════

import { MAX_TEXT } from './config.js';

export const VIBE_LEVELS = ['off', 'low', 'mid', 'high'];
export const ORGASM_MODES = ['normal', 'edge', 'deny'];

/** 部位名稱：英數字，且不能是 Object.prototype 的成員（constructor / toString …）。 */
export function isValidGroupName(group) {
    return typeof group === 'string' && /^[A-Za-z][A-Za-z0-9]{0,63}$/.test(group) && !(group in Object.prototype);
}

/** 解析解鎖時間 → ISO 字串；null/undefined 代表「無計時」；無法解析回傳 undefined（無效）。 */
export function parseUnlockTime(value) {
    if (value == null || value === '') return null;
    if (typeof value !== 'string' && typeof value !== 'number') return undefined;
    const time = typeof value === 'number' ? value : Date.parse(value);
    if (!Number.isFinite(time)) return undefined;
    const date = new Date(time);
    return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

/**
 * 清理鎖設定，只回傳合法欄位。
 * @param {object} input
 * @param {{partial?: boolean}} [options]
 *   partial=false（HeartLockApply）：removeRestraints 與 unlockTime 一律輸出（缺失/無效 → false / null），
 *     與先前行為一致；其餘欄位僅在合法時輸出。
 *   partial=true（HeartLock::Update）：只輸出「輸入中存在且合法」的欄位，無效值直接丟棄、不覆寫現有設定。
 */
export function sanitizeLockSettings(input, { partial = false } = {}) {
    const out = {};
    if (!input || typeof input !== 'object') return out;
    const has = key => Object.hasOwn(input, key);

    if (typeof input.note === 'string') out.note = input.note.slice(0, MAX_TEXT);
    if (VIBE_LEVELS.includes(input.vibe)) out.vibe = input.vibe;
    if (ORGASM_MODES.includes(input.orgasmMode)) out.orgasmMode = input.orgasmMode;

    if (partial) {
        if (has('removeRestraints') && typeof input.removeRestraints === 'boolean') out.removeRestraints = input.removeRestraints;
        if (has('unlockTime')) {
            const iso = parseUnlockTime(input.unlockTime);
            if (iso !== undefined) out.unlockTime = iso;
        }
    } else {
        out.removeRestraints = input.removeRestraints === true;
        out.unlockTime = parseUnlockTime(input.unlockTime) ?? null;
    }
    return out;
}
