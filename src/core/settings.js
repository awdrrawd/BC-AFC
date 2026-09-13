// ════════════════════════════════════════
//  AFC module: settings.js
//  設定讀寫：OnlineSharedSettings.AFC（共享）+ ExtensionSettings.AFC（私人）
// ════════════════════════════════════════

import { MOD_VERSION } from './config.js';
import { setLastKnownLoverCount } from './state.js';
import { normalizeLoverList } from '../relations/lover-model.js';
import { readLegacyLocalLovers } from './lover-backup.js';
import { broadcastAFCData } from '../net/sync-data.js';

const deferredMigrations = new WeakSet();

// Own data is authoritative in ExtensionSettings. Public data is only a projection.
export function getSharedSettings() {
    const memberNumber = Player?.MemberNumber;
    const es = Player?.ExtensionSettings;
    if (!Number.isSafeInteger(memberNumber) || memberNumber <= 0 || !es) return null;
    if (es.AFC_Data) {
        if (es.AFC_Data.memberNumber !== memberNumber || !Array.isArray(es.AFC_Data.lovers)) {
            console.warn('[AFC] Refusing AFC data with invalid account ownership');
            return null;
        }
        return es.AFC_Data;
    }
    const old = Player.OnlineSharedSettings?.AFC;
    if (old && !es.AFC_LegacyPublic) {
        es.AFC_LegacyPublic = structuredClone(old);
        ServerPlayerExtensionSettingsSync('AFC_LegacyPublic');
    }
    if (deferredMigrations.has(es)) return null;
    const valid = record => Array.isArray(record?.lovers) &&
        (record.memberNumber == null || record.memberNumber === memberNumber);
    // On first migration, current online data wins over every backup.
    if (old?.memberNumber != null && old.memberNumber !== memberNumber) {
        console.warn('[AFC] Refusing public data owned by another account');
        return null;
    }
    let source = valid(old) && old.lovers.length ? old : null;
    if (!source) {
        const backup = es.AFC_LoverBackup;
        source = valid(backup) && backup.memberNumber === memberNumber && backup.lovers.length ? backup : null;
        if (!source) source = readLegacyLocalLovers();
        if (source?.lovers?.length && !window.confirm(
            `AFC: Restore backup lovers for account #${memberNumber}?\n` +
            source.lovers.map(l => `${l.name ?? ''} (#${l.memberNumber})`).join('\n')
        )) {
            // Cancel is a deferred migration, never an empty committed list.
            deferredMigrations.add(es);
            return null;
        }
    }
    es.AFC_Data = {
        memberNumber,
        lovers: normalizeLoverList(Array.isArray(source?.lovers) ? source.lovers : []),
        lockPerms: { enableAFCLock: true, enableOwnerLock: false },
        vibeMsgMode: old?.vibeMsgMode ?? 'broadcast',
        enableVibeSound: old?.enableVibeSound ?? true,
    };
    ServerPlayerExtensionSettingsSync('AFC_Data');
    return es.AFC_Data;
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
