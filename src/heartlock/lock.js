// ════════════════════════════════════════
//  HeartLock module: lock.js
//  Asset 建立、上鎖轉換、外觀復原、防作弊 integrity、移除 / 清除
// ════════════════════════════════════════

import { HEARTLOCK_NAME, HSLOCK_NAME } from './config.js';
import { state, _pendingRestore } from './state.js';
import { log, clone } from './util.js';
import { sendLocalizedAction } from '../i18n/l10n.js';
import {
    ensureStorage, getOrCreateConfig, deleteConfig, saveAndSync,
} from './storage.js';
import { notifyRemove } from './net.js';

// ── 解鎖輔助（直接操作 Property，繞過 InventoryUnlock hook 干擾）──
/** 解除自己身上指定部位的心鎖。回傳是否確實解了一個心鎖。 */
function _unlockSelfItem(gn, removeRestraint = false) {
    const item = InventoryGet?.(Player, gn);
    let unlocked = false;
    if (item?.Property) {
        const isHL = item.Property.Name === HEARTLOCK_NAME
            || (item.Property.LockedBy === HSLOCK_NAME && item.Property.HeartLockId);
        if (isHL) {
            if (typeof ValidationDeleteLock === 'function') ValidationDeleteLock(item.Property, false);
            delete item.Property.Name;
            delete item.Property.HeartLockId;
            const keys = Object.keys(item.Property);
            if (keys.length === 0 || (keys.length === 1 && keys[0] === 'Effect' && !item.Property.Effect?.length))
                item.Property = undefined;
            unlocked = true;
        }
    }
    if (item && removeRestraint) {
        try { state._timerUnlocking = true; InventoryRemove?.(Player, gn, false); }
        finally { state._timerUnlocking = false; }
    }
    return unlocked;
}

/** 移除自己身上指定部位的心鎖並刪除其設定。 */
export function removeLock(groupName, { removeRestraint = false } = {}) {
    if (!groupName || !ensureStorage()) return false;
    state._unlocking = true;   // 抑制 integrity 還原
    try {
        _unlockSelfItem(groupName, removeRestraint);
        delete Player.HeartLock.padlocks[groupName];
        saveAndSync();
        try { CharacterRefresh?.(Player, false); ChatRoomCharacterUpdate?.(Player); } catch {}
    } finally { state._unlocking = false; }
    return true;
}

/** 清除自己身上所有心鎖與其設定（防作弊 integrity 不會還原）。回傳清除數量。 */
export function clearAllLocks({ removeRestraints = false } = {}) {
    if (!ensureStorage()) return 0;
    state._unlocking = true;
    let count = 0;
    try {
        for (const gn of Object.keys(Player.HeartLock.padlocks ?? {}))
            if (_unlockSelfItem(gn, removeRestraints)) count++;
        Player.HeartLock.padlocks = {};
        saveAndSync();
        try { CharacterRefresh?.(Player, false); ChatRoomCharacterUpdate?.(Player); } catch {}
    } finally { state._unlocking = false; }
    log(`clearAllLocks: cleared ${count} lock(s)`);
    return count;
}

// ── Asset 建立 ──
export function createHeartLockAsset() {
    if (state.assetCreated) return true;
    if (!window.AssetFemale3DCG || !window.AssetGroupGet || !window.AssetAdd || !window.InventoryAdd) return false;
    const itemMiscDef = AssetFemale3DCG.find(g => g.Group === 'ItemMisc');
    if (!itemMiscDef) return false;
    if (itemMiscDef.Asset?.find(a => a.Name === HEARTLOCK_NAME)) { state.assetCreated = true; return true; }
    const group = AssetGroupGet?.('Female3DCG', 'ItemMisc');
    if (!group) { console.error('🐈‍⬛ [HeartLock] ItemMisc group not ready, will retry.'); return false; }
    const def = { AllowType: ['LockPickSeed'], Effect: [], Extended: true, IsLock: true, Name: HEARTLOCK_NAME, PickDifficulty: 20, Time: 10, Value: 70, Wear: false };
    try {
        itemMiscDef.Asset.push(def);
        // R128: AssetAdd(Group, AssetDef, ExtendedConfig, GroupDef)
        AssetAdd(group, def, null, itemMiscDef);
        if (Player?.Inventory && !Player.Inventory.some(i => i.Asset?.Name === HEARTLOCK_NAME))
            InventoryAdd(Player, HEARTLOCK_NAME, 'ItemMisc');
        state.assetCreated = true;
        return true;
    } catch (e) { console.error('🐈‍⬛ [HeartLock] Asset creation failed', e); return false; }
}

// ── 上鎖轉換 ──
export function convertToHeartLock(character, item, groupName) {
    if (!item?.Property) return;
    if (character.IsPlayer()) {
        const cfg = getOrCreateConfig(groupName);
        if (cfg) {
            cfg._fullSnapshot = { assetName: item.Asset?.Name, groupName, color: item.Color ? clone(item.Color) : undefined, craft: item.Craft ? clone(item.Craft) : undefined, difficulty: item.Difficulty };
        }
    }
    item.Property.Name = HEARTLOCK_NAME;
    item.Property.LockPickSeed = '8,3,5,10,4,2,6,7,1,9,0,11';
    if (character?.Ownership?.MemberNumber != null && item.Property.LockMemberNumber == null)
        item.Property.LockMemberNumber = character.Ownership.MemberNumber;
    const lockId = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36);
    const assetName = item.Asset?.Name ?? null;
    item.Property.HeartLockId = lockId;
    const now = new Date().toISOString();
    if (character.IsPlayer()) {
        const cfg = getOrCreateConfig(groupName);
        if (cfg) { cfg.owner = Player.MemberNumber; cfg.ownerName = Player.Nickname || Player.Name; cfg.lockedAt = now; cfg.assetName = assetName; cfg.lockId = lockId; saveAndSync(); }
    } else {
        try {
            ServerSend('ChatRoomChat', { Type: 'Hidden', Content: 'HeartLockApply', Dictionary: [{ Tag: 'HeartLockApply', Target: character.MemberNumber, Group: groupName, Owner: Player.MemberNumber, OwnerName: Player.Nickname || Player.Name, LockedAt: now, AssetName: assetName, LockId: lockId }] });
        } catch {}
    }
    try { if (typeof ChatRoomCharacterItemUpdate === 'function' && groupName) ChatRoomCharacterItemUpdate(character, groupName); } catch {}
}

export function reapplyFromAppearance() {
    if (!ensureStorage()) return;
    const padlocks = Player.HeartLock.padlocks;
    Player.Appearance?.forEach(item => {
        if (!item?.Property) return;
        if (item.Property.LockedBy !== HSLOCK_NAME) return;
        // 只處理確實由心鎖系統加的鎖（有 HeartLockId 或 Name=HEARTLOCK_NAME）
        const isHeartLock = item.Property.Name === HEARTLOCK_NAME || !!item.Property.HeartLockId;
        if (!isHeartLock) return;
        const gn = item.Asset?.Group?.Name;
        if (!gn || padlocks[gn]) return;
        padlocks[gn] = {
            owner: item.Property.LockMemberNumber ?? Player.MemberNumber,
            ownerName: item.Property.LockMemberName ?? '',
            lockedAt: new Date().toISOString(),
            note: '', unlockTime: null, vibe: 'off', orgasmMode: 'normal',
        };
    });
    for (const gn of Object.keys(padlocks)) {
        try { const item = InventoryGet?.(Player, gn); if (!item) continue; if (!item?.Property?.LockedBy) deleteConfig(gn); } catch {}
    }
}

export function watchForUnlock(character, groupName, item) {
    let checks = 0;
    const iv = setInterval(() => {
        checks++;
        if (!item?.Property?.LockedBy) { clearInterval(iv); notifyRemove(character, groupName); return; }
        if (checks > 20) clearInterval(iv);
    }, 500);
}

// 相依物件尚未載入而無法復原 → 暫掛該部位，發一次性提示，停止定時重試
function _markPendingRestore(gn) {
    if (!_pendingRestore.has(gn)) {
        _pendingRestore.add(gn);
        try {
            const nick = Player.Nickname || Player.Name;
            sendLocalizedAction('hl', 'pendingRestore', [nick, HEARTLOCK_NAME]);
        } catch {}
        log('restore: pending (dependent asset not loaded) for', gn);
    }
}

// 回傳：'ok' 成功復原 / 'pending' 相依物件未載入暫掛 / 'skip' 不需處理
export function restoreLockFromConfig(gn, cfg, updateUI = true) {
    let item = InventoryGet?.(Player, gn);
    if (!item) {
        const snap = cfg._fullSnapshot;
        if (!snap?.assetName) { _markPendingRestore(gn); return 'pending'; }
        try {
            const asset = AssetGet?.(Player.AssetFamily, gn, snap.assetName);
            if (!asset) { _markPendingRestore(gn); return 'pending'; }   // Echo 等自訂物件尚未註冊
            state._restoring = true;
            item = InventoryWear?.(Player, snap.assetName, gn, snap.color, asset.Difficulty, Player.MemberNumber, snap.craft);
            state._restoring = false;
            if (!item) item = InventoryGet?.(Player, gn);
            if (!item) { _markPendingRestore(gn); return 'pending'; }
        } catch (e) { state._restoring = false; log('restore: error', e); return 'skip'; }
    }
    if (cfg.assetName && item.Asset?.Name !== cfg.assetName) return 'skip';
    try {
        const hsAsset = AssetGet?.('Female3DCG', 'ItemMisc', HSLOCK_NAME);
        if (hsAsset) InventoryLock?.(Player, item, { Asset: hsAsset }, cfg.owner);
    } catch {}
    if (!item.Property) item.Property = {};
    item.Property.Name = HEARTLOCK_NAME;
    item.Property.LockPickSeed = '8,3,5,10,4,2,6,7,1,9,0,11';
    item.Property.ExclusiveUnlock = true;
    if (cfg.lockId) item.Property.HeartLockId = cfg.lockId;
    try { ValidationSanitizeProperties?.(Player, item); ValidationSanitizeLock?.(Player, item); } catch {}
    _pendingRestore.delete(gn);   // 復原成功 → 解除暫掛
    return 'ok';
}

/** 清除解鎖後殘留的自訂 Property 欄位（Name / HeartLockId）；若只剩空 Effect 則整個清掉。
 *  供 InventoryUnlock hook 與解鎖分頁共用（原先在兩處各有一份，已合併）。*/
export function cleanHeartLockProperty(C, itemOrGrp) {
    try {
        const item = (itemOrGrp && typeof itemOrGrp === 'object')
        ? itemOrGrp
        : InventoryGet?.(C, typeof itemOrGrp === 'string' ? itemOrGrp : null);
        if (!item?.Property) return;
        if (item.Property.Name === HEARTLOCK_NAME) delete item.Property.Name;
        if (item.Property.HeartLockId !== undefined) delete item.Property.HeartLockId;
        const keys = Object.keys(item.Property);
        if (keys.length === 1 && keys[0] === 'Effect' && item.Property.Effect?.length === 0)
            item.Property = undefined;
    } catch {}
}

export function checkLockIntegrity() {
    if (!ensureStorage()) return;
    if (state._unlocking) return;
    const padlocks = Player.HeartLock?.padlocks ?? {};
    for (const gn of Object.keys(padlocks)) {
        const cfg = padlocks[gn];
        if (!cfg) continue;
        const item = InventoryGet?.(Player, gn);
        if (!item) continue;
        if (cfg.assetName && item.Asset?.Name !== cfg.assetName) continue;
        const badLockedBy = item.Property?.LockedBy !== HSLOCK_NAME;
        const badName     = item.Property?.Name     !== HEARTLOCK_NAME;
        const badLockId   = cfg.lockId && item.Property?.HeartLockId !== cfg.lockId;
        if (badLockedBy || badName || badLockId) { log('Lock integrity violation on', gn, { badLockedBy, badName, badLockId }); restoreLockFromConfig(gn, cfg); }
    }
}
