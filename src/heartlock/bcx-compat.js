// ════════════════════════════════════════
//  HeartLock module: bcx-compat.js
//  與 BCX 詛咒共存：上鎖/還原後重新蓋章 BCX 的 curse 基準,
//  避免我們鎖多加的 Property(Name / HeartLockId / ExclusiveUnlock)
//  被 BCX curseTick 判為改動而反覆還原並洗版。
//  普通 BC 鎖只加 LockedBy / LockMemberNumber(皆在 BCX 忽略清單),故無此問題。
// ════════════════════════════════════════

import { MOD_NAME } from './config.js';
import { log } from './util.js';

let _api = null;
let _apiTried = false;

// 取得 BCX 對外 ModAPI(名稱需對齊我們向 bcModSdk 註冊的 MOD_NAME)。
// 無 BCX / 尚未載入 → 回傳 null(所有呼叫皆 no-op,不影響無 BCX 使用者)。
function getBcxApi() {
    if (_api) return _api;
    // 每次都重試(BCX 可能較晚載入),但失敗時不噴錯。
    try {
        const api = window.bcx?.getModApi?.(MOD_NAME);
        if (api) { _api = api; }
        else if (!_apiTried) { _apiTried = true; }
        return _api;
    } catch { return null; }
}

/** 該部位是否有「會強制屬性」的 BCX 詛咒(curseProperty=true 才會洗版)。 */
export function bcxCursePropertyActive(groupName) {
    if (!groupName) return false;
    const api = getBcxApi();
    if (!api?.getCurseInfo) return false;
    try {
        const info = api.getCurseInfo(groupName);
        return !!(info && info.active && info.curseProperty);
    } catch { return false; }
}

/**
 * 重新蓋章 BCX 對該部位的 curse 基準,使基準包含我們當前(已上鎖)的 Property。
 * 只在該部位確有「屬性詛咒」時呼叫;target 為自己(Player)→ 自我權限。
 * BCX ConditionsSetCondition 對既有 condition 只替換 .data,
 * 保留 active/timer/timerRemove/requirements/addedBy,不會清掉對方詛咒的條件。
 */
export function rebaselineCurseIfNeeded(groupName) {
    if (!bcxCursePropertyActive(groupName)) return;
    const api = getBcxApi();
    if (!api?.sendQuery) return;
    try {
        Promise.resolve(
            api.sendQuery('curseItem', { Group: groupName, curseProperties: true }, 'Player'),
        ).then(
            () => log('bcx: rebaselined curse for', groupName),
            () => {},
        );
    } catch { /* no-op */ }
}
