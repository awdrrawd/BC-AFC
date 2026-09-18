// ════════════════════════════════════════
//  HeartLock module: storage.js
//  ExtensionSettings 主資料；公開副本只輸出，不作恢復來源
// ════════════════════════════════════════

import { DEFAULT_STORAGE, HSLOCK_NAME, EXT_KEY } from './config.js';
import { clone } from './util.js';
import { th as T } from '../i18n/i18n.js';
import { emitHeartLockEvent } from './events.js';
import { confirmInAFC } from '../ui/confirmation.js';
import { restoreHeartLockMarkers } from './r132-properties.js';
import { state } from './state.js';

const reconciliations = new WeakMap();

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
export async function confirmLockRecovery(data, { remember = false } = {}) {
    if (!data || typeof data !== 'object' || !data.padlocks || Array.isArray(data.padlocks)) return null;
    if (data.memberNumber !== Player.MemberNumber) return null;
    const copy = clone(data);
    if (Object.values(copy.padlocks).some(cfg => !cfg || !Number.isSafeInteger(Number(cfg.owner)) || Number(cfg.owner) <= 0)) return null;
    const account = Player;
    const es = Player.ExtensionSettings;
    const original = JSON.stringify(es[EXT_KEY]?.padlocks);
    const missing = Object.entries(copy.padlocks).filter(([group, cfg]) => {
        const item = Player.Appearance?.find(item => item.Asset?.Group?.Name === group);
        return !item?.Property?.HeartLockId || item.Property.HeartLockId !== cfg.lockId
            || item.Property.LockedBy !== HSLOCK_NAME || (cfg.assetName && item.Asset?.Name !== cfg.assetName);
    });
    const key = cfg => JSON.stringify([cfg.lockId, Number(cfg.owner), cfg.assetName ?? cfg._fullSnapshot?.assetName]);
    const decisions = remember ? (copy.recoveryDecisions ?? {}) : {};
    const undecided = missing.filter(([group, cfg]) => decisions[group]?.key !== key(cfg));
    if (undecided.length) {
        const accepted = await confirmInAFC(T('confirmLockRecovery', undecided.map(([group]) => group).join(', ')));
        if (accepted == null || Player !== account || Player.ExtensionSettings !== es
            || Player.MemberNumber !== copy.memberNumber || JSON.stringify(es[EXT_KEY]?.padlocks) !== original) return null;
        if (!remember && !accepted) return null;
        for (const [group, cfg] of undecided) decisions[group] = { key: key(cfg), accepted };
    }
    for (const [group, cfg] of missing) {
        if (decisions[group]?.accepted === false) {
            copy.declinedRecovery ??= {};
            copy.declinedRecovery[group] = cfg;
            delete copy.padlocks[group];
        }
    }
    if (remember) copy.recoveryDecisions = decisions;
    return copy;
}

export async function restoreStorageWithConsent(data) {
    if (!ensureStorage()) return false;
    const account = Player;
    const es = Player.ExtensionSettings;
    const approved = await confirmLockRecovery(data);
    if (!approved || Player !== account || Player.ExtensionSettings !== es) return false;
    adoptOnlineStorage(approved);
    return true;
}

export function reconcileHLStorage() {
    const es = Player?.ExtensionSettings;
    if (!es) return Promise.resolve();
    if (reconciliations.has(es)) return reconciliations.get(es);
    const pending = reconcileCurrentLocks().finally(() => reconciliations.delete(es));
    reconciliations.set(es, pending);
    return pending;
}

async function reconcileCurrentLocks() {
    if (!ensureStorage()) return;
    const account = Player;
    const es = Player.ExtensionSettings;
    // R132 can discard only the custom markers while the same native lock remains.
    restoreHeartLockMarkers(Player);
    const current = clone(Player.HeartLock);
    const token = {};
    state.operations.recoveryPending = token;
    let approved;
    try { approved = await confirmLockRecovery(current, { remember: true }); }
    finally { if (state.operations.recoveryPending === token) state.operations.recoveryPending = false; }
    if (Player !== account || Player.ExtensionSettings !== es || Player.MemberNumber !== current.memberNumber) return;
    if (approved) {
        Player.ExtensionSettings[EXT_KEY] = approved;
        Player.HeartLock = approved;
        if (Object.keys(approved.padlocks).length) emitHeartLockEvent('storage-recovery-approved');
    } else return;
    emitHeartLockEvent('storage-restored');
    emitHeartLockEvent('storage-backfill');
    saveAndSync();
}
