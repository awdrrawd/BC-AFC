// ════════════════════════════════════════
//  HeartLock module: storage.js
//  ExtensionSettings 主資料；公開副本只輸出，不作恢復來源
// ════════════════════════════════════════

import { DEFAULT_STORAGE, HSLOCK_NAME, EXT_KEY } from './config.js';
import { clone } from './util.js';
import { th as T } from '../i18n/i18n.js';
import { emitHeartLockEvent } from './events.js';

export function ensureStorage() {
    if (!window.Player || !Number.isSafeInteger(Player.MemberNumber) || Player.MemberNumber <= 0) return false;
    if (!Player.ExtensionSettings) Player.ExtensionSettings = {};
    const es = Player.ExtensionSettings;
    if (!es[EXT_KEY] || typeof es[EXT_KEY] !== 'object') {
        es[EXT_KEY] = clone(DEFAULT_STORAGE);
    }
    if (es[EXT_KEY].memberNumber != null && es[EXT_KEY].memberNumber !== Player.MemberNumber) {
        Player.HeartLock = clone(DEFAULT_STORAGE);
        console.warn('[AFC] Refusing heartlock data owned by another account');
        return false;
    }
    es[EXT_KEY].memberNumber = Player.MemberNumber;
    if (!es[EXT_KEY].padlocks) {
        es[EXT_KEY].padlocks = {};

    }
    Player.HeartLock = es[EXT_KEY];
    return true;
}

export function getSetting(key) { return Player?.HeartLock?.[key] ?? DEFAULT_STORAGE[key]; }

export function getPadlockConfig(character, groupName) {
    if (!character || !groupName) return null;
    const store = character.IsPlayer() ? (Player.HeartLock?.padlocks ?? {}) : (character.HeartLock?.padlocks ?? {});
    return store[groupName] ?? null;
}

export function getOrCreateConfig(groupName) {
    if (!ensureStorage()) return null;
    const p = Player.HeartLock.padlocks;
    if (!p[groupName]) {
        p[groupName] = {
            owner: Player.MemberNumber, ownerName: Player.Nickname || Player.Name,
            lockedAt: new Date().toISOString(),
            note: '', unlockTime: null, vibe: 'off', orgasmMode: 'normal',
        };
    }
    return p[groupName];
}

export function deleteConfig(groupName) {
    if (!ensureStorage()) return;
    delete Player.HeartLock.padlocks[groupName];
    saveAndSync();
}

export function saveAndSync() {
    if (!ensureStorage()) return;
    Player.HeartLock.updatedAt = Date.now();   // ALL 時間戳：任何上鎖/解鎖/設定變動都更新
    try { if (typeof ServerPlayerExtensionSettingsSync === 'function') ServerPlayerExtensionSettingsSync(EXT_KEY); } catch {}
    const publicLocks = {};
    for (const [group, cfg] of Object.entries(Player.HeartLock.padlocks ?? {})) {
        publicLocks[group] = { owner: cfg.owner, assetName: cfg.assetName, lockId: cfg.lockId, lockTs: cfg.lockTs };
    }
    if (Player.OnlineSharedSettings) {
        Player.OnlineSharedSettings.AFC_HeartLock = { memberNumber: Player.MemberNumber, updatedAt: Player.HeartLock.updatedAt, padlocks: publicLocks };
        ServerAccountUpdate?.QueueData?.({ OnlineSharedSettings: Player.OnlineSharedSettings });
    }
    emitHeartLockEvent('storage-saved');
}

function adoptOnlineStorage(data) {
    if (!data || typeof data !== 'object') return;
    Player.ExtensionSettings[EXT_KEY] = clone(data);
    if (!Player.ExtensionSettings[EXT_KEY].padlocks) Player.ExtensionSettings[EXT_KEY].padlocks = {};
    Player.HeartLock = Player.ExtensionSettings[EXT_KEY];
    saveAndSync();
    emitHeartLockEvent('storage-recovery-approved');
    emitHeartLockEvent('storage-restored');
    try { CharacterRefresh?.(Player, false); ChatRoomCharacterUpdate?.(Player); } catch {}
}

// 新的空資料是合法解鎖。只選較新的備份，補回缺失鎖必須先詢問。
export function confirmLockRecovery(data) {
    if (!data || typeof data !== 'object' || !data.padlocks || Array.isArray(data.padlocks)) return null;
    if (data.memberNumber !== Player.MemberNumber) return null;
    const copy = clone(data);
    if (Object.values(copy.padlocks).some(cfg => !cfg || !Number.isSafeInteger(Number(cfg.owner)) || Number(cfg.owner) <= 0)) return null;
    const missing = Object.entries(copy.padlocks).filter(([group, cfg]) => {
        const item = Player.Appearance?.find(item => item.Asset?.Group?.Name === group);
        return !item?.Property?.HeartLockId || item.Property.HeartLockId !== cfg.lockId
            || item.Property.LockedBy !== HSLOCK_NAME || (cfg.assetName && item.Asset?.Name !== cfg.assetName);
    }).map(([group]) => group);
    if (missing.length && !window.confirm(T('confirmLockRecovery', missing.join(', ')))) return null;
    return copy;
}

export function restoreStorageWithConsent(data) {
    if (!ensureStorage()) return false;
    const approved = confirmLockRecovery(data);
    if (!approved) return false;
    adoptOnlineStorage(approved);
    return true;
}

export function reconcileHLStorage() {
    if (!ensureStorage()) return;
    const current = clone(Player.HeartLock);
    const approved = confirmLockRecovery(current);
    if (approved) {
        Player.ExtensionSettings[EXT_KEY] = approved;
        Player.HeartLock = approved;
        emitHeartLockEvent('storage-recovery-approved');
    } else {
        // Keep rejected data privately for manual inspection, outside the active lock set.
        const padlocks = Object.fromEntries(Object.entries(current.padlocks ?? {}).filter(([group, cfg]) =>
            Player.Appearance?.some(item => item.Asset?.Group?.Name === group && item.Property?.HeartLockId === cfg.lockId && item.Property?.LockedBy === HSLOCK_NAME)));
        Player.ExtensionSettings[EXT_KEY] = { ...current, declinedRecovery: current.padlocks, padlocks };
        Player.HeartLock = Player.ExtensionSettings[EXT_KEY];
    }
    emitHeartLockEvent('storage-restored');
    emitHeartLockEvent('storage-backfill');
    saveAndSync();
}
