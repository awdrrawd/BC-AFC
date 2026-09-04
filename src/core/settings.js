// ════════════════════════════════════════
//  AFC module: settings.js
//  設定讀寫：OnlineSharedSettings.AFC（共享）+ ExtensionSettings.AFC（私人）
// ════════════════════════════════════════

import { MOD_VERSION } from './config.js';
import { _lastKnownLoverCount, setLastKnownLoverCount } from './state.js';
import { writeLoverBackup } from './lover-backup.js';
import { broadcastAFCData } from '../net/sync-data.js';

export function getSharedSettings() {
    if (!Player?.OnlineSharedSettings) return null;
    if (!Player.OnlineSharedSettings.AFC)
        Player.OnlineSharedSettings.AFC = {
            lovers: [],
            lockPerms:    { enableAFCLock: true, enableOwnerLock: false },
            vibeMsgMode:  'broadcast',
            enableVibeSound: true,
        };
    if (!Player.OnlineSharedSettings.AFC.lockPerms)
        Player.OnlineSharedSettings.AFC.lockPerms = { enableAFCLock: true, enableOwnerLock: false };
    if (Player.OnlineSharedSettings.AFC.enableVibeSound === undefined)
        Player.OnlineSharedSettings.AFC.enableVibeSound = true;

    return Player.OnlineSharedSettings.AFC;
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
 * lp  = lastProposalSent { [memberNumber]: timestamp }
 * l   = lovers 備份（緊湊陣列，與 OnlineSharedSettings 同步）
 *        每筆：[memberNumber, name, stage(0/1/2), startDate, stageDate, lastSeen]
 */
export function defaultPrivate() {
    return { v: MOD_VERSION, cfg: [0, 1, 1, 1, 0, 1, 0], l: [] };
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

// ExtensionSettings.AFC 只保存私人設定；戀人備份存放於本機備份 repository。
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
    try {
        const afc = Player.OnlineSharedSettings?.AFC;
        if (!afc) return;
        const currentCount = afc.lovers?.length ?? 0;
        // 偵測「有戀人 → 突然變 0」的異常，跳過儲存
        if (_lastKnownLoverCount > 0 && currentCount === 0) {
            console.warn(`🐈‍⬛ [AFC] ⚠️ 偵測到戀人資料異常清空（${_lastKnownLoverCount} → 0），跳過儲存`);
            return;
        }
        setLastKnownLoverCount(currentCount);
        ServerAccountUpdate?.QueueData?.({ OnlineSharedSettings: Player.OnlineSharedSettings });
        // 通過防呆後，同步寫一份本地存底 DB
        writeLoverBackup(afc.lovers);
    } catch (e) { console.error("🐈‍⬛ [AFC] ❌ 儲存共享設定失敗:", e.message); }
    // 同時廣播給房間內玩家
    broadcastAFCData();
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
