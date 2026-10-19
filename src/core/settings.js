// ════════════════════════════════════════
//  AFC module: settings.js
//  設定讀寫：OnlineSharedSettings.AFC（共享）+ ExtensionSettings.AFC（私人）
// ════════════════════════════════════════

import { MOD_VERSION } from './config.js';
import { setLastKnownLoverCount } from './state.js';

const warnedOwnership = new WeakSet();     // 同一份壞資料只警告一次（getter 會被頻繁呼叫）

function currentAccount() {
    const memberNumber = Player?.MemberNumber;
    const es = Player?.ExtensionSettings;
    return Number.isSafeInteger(memberNumber) && memberNumber > 0 && es ? { memberNumber, es } : null;
}

/**
 * 讀取「我自己」的 AFC 主資料（ExtensionSettings.AFC_Data）。
 *
 * 純讀取：不寫入、不同步、不建立資料、不彈視窗。資料尚未建立（登入初始化前）
 * 或不屬於目前帳號時回傳 null。公開資料（OnlineSharedSettings.AFC）只是投影，不是來源。
 */
export function getSharedSettings() {
    const account = currentAccount();
    const data = account?.es.AFC_Data;
    if (!data) return null;
    if (data.memberNumber !== account.memberNumber || !Array.isArray(data.lovers)) {
        if (!warnedOwnership.has(account.es)) {
            warnedOwnership.add(account.es);
            console.warn('[AFC] Refusing AFC data with invalid account ownership');
        }
        return null;
    }
    return data;
}

/**
 * 登入後唯一的初始化入口：AFC_Data 不存在時建立空的主資料並同步。
 * 已存在的資料原樣回傳；屬於其他帳號或已損壞的資料絕不覆寫（回傳 null）。
 */
export function initializeSharedSettings() {
    const account = currentAccount();
    if (!account) return null;
    const existing = getSharedSettings();
    if (existing) return existing;
    if (account.es.AFC_Data) return null;
    account.es.AFC_Data = {
        memberNumber: account.memberNumber,
        lovers: [],
        lockPerms: { enableAFCLock: true, enableOwnerLock: false },
        vibeMsgMode: 'broadcast',
        enableVibeSound: true,
    };
    ServerPlayerExtensionSettingsSync('AFC_Data');
    return account.es.AFC_Data;
}

/*
 * AFC 私人設定緊湊格式（v2）
 * cfg 陣列位置：
 *   [0] displayMode     0=duration, 1=date
 *   [1] showOnlineStatus
 *   [2] enableAFC
 *   [3] enableAFCLock
 *   [4] enableOwnerLock
 *   [5] allowTimerExtension
 *   [6] allowSelfUnlock
 *
 * 戀人主資料存放於 ExtensionSettings.AFC_Data。
 */
export function defaultPrivate() {
    return { v: MOD_VERSION, cfg: [0, 1, 1, 1, 0, 1, 0] };
}

function _unpackPrivate(p) {
    const c = p.cfg ?? [0, 1, 1, 1, 0, 1, 0];
    return {
        version:         p.v   ?? MOD_VERSION,
        displayMode:     c[0]  ? 'date' : 'duration',
        showOnlineStatus:!!c[1],
        enableAFC:        c[2]  !== 0 && c[2] !== false,
        enableAFCLock:    !!c[3],
        enableOwnerLock: !!c[4],
        lockSettings:    { allowTimerExtension: c[5] !== 0 && c[5] !== false, allowSelfUnlock: !!c[6] },
    };
}

// ExtensionSettings.AFC 只保存私人設定；戀人主資料存放於 AFC_Data。
function _packPrivate(s) {
    return {
        v:   MOD_VERSION,
        cfg: [
            s.displayMode === 'date' ? 1 : 0,
            s.showOnlineStatus ? 1 : 0,
            s.enableAFC        ? 1 : 0,
            s.enableAFCLock    ? 1 : 0,
            s.enableOwnerLock ? 1 : 0,
            s.lockSettings?.allowTimerExtension ? 1 : 0,
            s.lockSettings?.allowSelfUnlock     ? 1 : 0,
        ],
    };
}

export function getPrivateSettings() {
    if (!Player?.ExtensionSettings) return null;
    const raw = Player.ExtensionSettings.AFC;
    if (!raw) {
        const def = defaultPrivate();
        Player.ExtensionSettings.AFC = JSON.stringify(def);
        if (typeof ServerPlayerExtensionSettingsSync === 'function')
            ServerPlayerExtensionSettingsSync("AFC");
        return _unpackPrivate(def);
    }
    try {
        return _unpackPrivate(JSON.parse(raw));
    } catch (e) {
        console.error("🐈‍⬛ [AFC] ❌ 解析私人設定失敗:", e.message);
        return _unpackPrivate(defaultPrivate());
    }
}

export function savePrivateSettings(settings) {
    try {
        Player.ExtensionSettings.AFC = JSON.stringify(_packPrivate(settings));
        if (typeof ServerPlayerExtensionSettingsSync === 'function')
            ServerPlayerExtensionSettingsSync("AFC");
    } catch (e) { console.error("🐈‍⬛ [AFC] ❌ 儲存私人設定失敗:", e.message); }
}

export function saveSharedSettings() {
    const afc = getSharedSettings();
    if (!afc) return;
    setLastKnownLoverCount(afc.lovers.length);
    ServerPlayerExtensionSettingsSync('AFC_Data');
    if (Player.OnlineSharedSettings) {
        Player.OnlineSharedSettings.AFC = structuredClone(afc);
        ServerAccountUpdate?.QueueData?.({ OnlineSharedSettings: Player.OnlineSharedSettings });
    }
}

// 將鎖的權限從私人設定同步到共享設定（讓對方插件讀取）
// 當 enableAFC = false 時，共享的鎖權限一律為 false
export function syncLockPermsToShared(priv) {
    const s = getSharedSettings();
    if (!s) return;
    const afcActive = priv.enableAFC ?? true;
    s.lockPerms = {
        enableAFCLock:    afcActive && (priv.enableAFCLock    ?? true),
        enableOwnerLock: afcActive && (priv.enableOwnerLock ?? false),
    };
    saveSharedSettings();
}
