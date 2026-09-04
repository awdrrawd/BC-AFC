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
import { rebaselineCurseIfNeeded } from './bcx-compat.js';
import { onHeartLockEvent } from './events.js';

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
        try { state.operations.timerUnlocking = true; InventoryRemove?.(Player, gn, false); }
        finally { state.operations.timerUnlocking = false; }
    }
    return unlocked;
}

/** 移除自己身上指定部位的心鎖並刪除其設定。
 *  正規移除順序：先清設定(ES+DB、bump ALL)，再移除身上物品，避免移除動作誤觸還原機制。 */
export function removeLock(groupName, { removeRestraint = false } = {}) {
    if (!groupName || !ensureStorage()) return false;
    state.operations.unlocking = true;   // 抑制 integrity 還原（雙保險）
    try {
        delete Player.HeartLock.padlocks[groupName];   // 1) 先清 ES 設定
        saveAndSync();                                 //    寫入 ES+DB、bump ALL
        _unlockSelfItem(groupName, removeRestraint);   // 2) 再移除身上物品
        try { CharacterRefresh?.(Player, false); ChatRoomCharacterUpdate?.(Player); } catch {}
    } finally { state.operations.unlocking = false; }
    return true;
}

/** 清除自己身上所有心鎖與其設定（防作弊 integrity 不會還原）。回傳清除數量。
 *  同樣先清設定再移除物品。 */
export function clearAllLocks({ removeRestraints = false } = {}) {
    if (!ensureStorage()) return 0;
    state.operations.unlocking = true;
    let count = 0;
    try {
        const groups = Object.keys(Player.HeartLock.padlocks ?? {});
        Player.HeartLock.padlocks = {};   // 1) 先清全部設定
        saveAndSync();
        for (const gn of groups)          // 2) 再逐一移除身上物品
            if (_unlockSelfItem(gn, removeRestraints)) count++;
        try { CharacterRefresh?.(Player, false); ChatRoomCharacterUpdate?.(Player); } catch {}
    } finally { state.operations.unlocking = false; }
    log(`clearAllLocks: cleared ${count} lock(s)`);
    return count;
}

// ── Asset 建立 ──
export function createHeartLockAsset() {
    if (state.lifecycle.assetCreated) return true;
    if (!window.AssetFemale3DCG || !window.AssetGroupGet || !window.AssetAdd || !window.InventoryAdd) return false;
    const itemMiscDef = AssetFemale3DCG.find(g => g.Group === 'ItemMisc');
    if (!itemMiscDef) return false;
    if (itemMiscDef.Asset?.find(a => a.Name === HEARTLOCK_NAME)) { state.lifecycle.assetCreated = true; return true; }
    const group = AssetGroupGet?.('Female3DCG', 'ItemMisc');
    if (!group) { console.error('🐈‍⬛ [HeartLock] ItemMisc group not ready, will retry.'); return false; }
    const def = { AllowType: ['LockPickSeed'], Effect: [], Extended: true, IsLock: true, Name: HEARTLOCK_NAME, PickDifficulty: 20, Time: 10, Value: 70, Wear: false };
    try {
        itemMiscDef.Asset.push(def);
        // R128: AssetAdd(Group, AssetDef, ExtendedConfig, GroupDef)
        AssetAdd(group, def, null, itemMiscDef);
        if (Player?.Inventory && !Player.Inventory.some(i => i.Asset?.Name === HEARTLOCK_NAME))
            InventoryAdd(Player, HEARTLOCK_NAME, 'ItemMisc');
        state.lifecycle.assetCreated = true;
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
        if (cfg) { cfg.owner = Player.MemberNumber; cfg.ownerName = Player.Nickname || Player.Name; cfg.lockedAt = now; cfg.lockTs = Date.now(); cfg.assetName = assetName; cfg.lockId = lockId; saveAndSync(); }
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
        // owner 一律取身上物品的 LockMemberNumber；缺失(極舊鎖)則跳過，
        // 絕不把自己預設成 owner（否則原戀人會被鎖在外、無法編輯）。
        const ownerNum = item.Property.LockMemberNumber;
        if (ownerNum == null) { log('reapply: skip', gn, '— missing LockMemberNumber, refuse to self-own'); return; }
        padlocks[gn] = {
            owner: ownerNum,
            ownerName: item.Property.LockMemberName ?? '',
            lockedAt: new Date().toISOString(),
            lockTs: Date.now(),
            note: '', unlockTime: null, vibe: 'off', orgasmMode: 'normal',
            assetName: item.Asset?.Name ?? null,
            lockId: item.Property.HeartLockId ?? null,
            _fullSnapshot: {
                assetName: item.Asset?.Name, groupName: gn,
                color: item.Color ? clone(item.Color) : undefined,
                craft: item.Craft ? clone(item.Craft) : undefined,
                difficulty: item.Difficulty,
            },
        };
    });
    for (const gn of Object.keys(padlocks)) {
        try { const item = InventoryGet?.(Player, gn); if (!item) continue; if (!item?.Property?.LockedBy) deleteConfig(gn); } catch {}
    }
}

/** 舊鎖回填：身上有鎖物品但設定缺 _fullSnapshot/craft/assetName/lockId → 從當前物品補齊。
 *  於登入對帳時呼叫一次，讓舊鎖日後也能完整還原「原物品+craft+鎖」。 */
export function backfillSnapshots() {
    if (!ensureStorage()) return;
    const padlocks = Player.HeartLock.padlocks ?? {};
    let changed = false;
    for (const gn of Object.keys(padlocks)) {
        const cfg = padlocks[gn];
        if (!cfg) continue;
        const item = InventoryGet?.(Player, gn);
        if (!item?.Property) continue;
        const isHL = item.Property.Name === HEARTLOCK_NAME || !!item.Property.HeartLockId;
        if (!isHL) continue;
        const snap = cfg._fullSnapshot;
        const snapMissing = !snap || !snap.assetName || (item.Craft && !snap.craft);
        if (snapMissing) {
            cfg._fullSnapshot = {
                assetName: item.Asset?.Name, groupName: gn,
                color: item.Color ? clone(item.Color) : undefined,
                craft: item.Craft ? clone(item.Craft) : undefined,
                difficulty: item.Difficulty,
            };
            changed = true;
        }
        if (cfg.assetName == null && item.Asset?.Name) { cfg.assetName = item.Asset.Name; changed = true; }
        if (cfg.lockId == null && item.Property.HeartLockId) { cfg.lockId = item.Property.HeartLockId; changed = true; }
        if (cfg.lockTs == null) { cfg.lockTs = Date.now(); changed = true; }
    }
    if (changed) saveAndSync();
}

onHeartLockEvent('storage-restored', reapplyFromAppearance);
onHeartLockEvent('storage-backfill', backfillSnapshots);

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
    // 物品被替換成不同 asset → 視為竄改：移除入侵物品，改用 snapshot 重穿原物品(含 craft/顏色)。
    if (item && cfg.assetName && item.Asset?.Name !== cfg.assetName) {
        if (!cfg._fullSnapshot?.assetName) {
            // 無 snapshot 可重建原物品 → 至少移除入侵物品並清該部位設定（無法完整還原）
            log('restore: swapped item but no snapshot →', gn, '→ remove intruder + clear config');
            try { state.operations.restoring = true; InventoryRemove?.(Player, gn, false); } finally { state.operations.restoring = false; }
            deleteConfig(gn);
            return 'skip';
        }
        log('restore: detected item swap on', gn, '→ restoring original from snapshot');
        try { state.operations.restoring = true; InventoryRemove?.(Player, gn, false); } finally { state.operations.restoring = false; }
        item = null;   // 落入下方重穿流程
    }
    if (!item) {
        const snap = cfg._fullSnapshot;
        if (!snap?.assetName) { _markPendingRestore(gn); return 'pending'; }
        try {
            const asset = AssetGet?.(Player.AssetFamily, gn, snap.assetName);
            if (!asset) { _markPendingRestore(gn); return 'pending'; }   // Echo 等自訂物件尚未註冊
            state.operations.restoring = true;
            item = InventoryWear?.(Player, snap.assetName, gn, snap.color, asset.Difficulty, Player.MemberNumber, snap.craft);
            state.operations.restoring = false;
            if (!item) item = InventoryGet?.(Player, gn);
            if (!item) { _markPendingRestore(gn); return 'pending'; }
        } catch (e) { state.operations.restoring = false; log('restore: error', e); return 'skip'; }
    }
    // 到此 item 的 asset 應與 cfg 相符（原本相符，或已由 snapshot 重穿）
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
    // 該部位同時有 BCX 屬性詛咒時 → 重新蓋章其基準，避免 BCX 判為改動而洗版
    try { rebaselineCurseIfNeeded(gn); } catch {}
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
    if (state.operations.unlocking) return;
    const padlocks = Player.HeartLock?.padlocks ?? {};
    for (const gn of Object.keys(padlocks)) {
        const cfg = padlocks[gn];
        if (!cfg) continue;
        const item = InventoryGet?.(Player, gn);
        if (!item) continue;
        // asset 被替換也算違規（交由 restoreLockFromConfig 移除入侵物品並重穿原物品）
        const badAsset    = cfg.assetName && item.Asset?.Name !== cfg.assetName;
        const badLockedBy = item.Property?.LockedBy !== HSLOCK_NAME;
        const badName     = item.Property?.Name     !== HEARTLOCK_NAME;
        const badLockId   = cfg.lockId && item.Property?.HeartLockId !== cfg.lockId;
        if (badAsset || badLockedBy || badName || badLockId) restoreLockFromConfig(gn, cfg);
    }
    cleanupFakeLocks();
}

/** 掃描身上外觀，處理「看起來是心鎖但其實沒真的鎖住」的假鎖（例：BCX 依基準重建物品，
 *  基準帶有我們的 Name/HeartLockId 卻無法帶 LockedBy → 有鎖的樣子但沒真鎖）。
 *  依使用者原則：有設定(該鎖) → 還原成真鎖；無設定(不該有鎖) → 抹掉假貼圖。 */
export function cleanupFakeLocks() {
    if (!ensureStorage()) return;
    if (state.operations.unlocking || state.operations.restoring) return;
    const padlocks = Player.HeartLock?.padlocks ?? {};
    let changed = false;
    (Player.Appearance ?? []).forEach(item => {
        if (!item?.Property) return;
        const looksHeart = item.Property.Name === HEARTLOCK_NAME || !!item.Property.HeartLockId;
        if (!looksHeart) return;
        // 真的鎖著 → 非假鎖，交由 config 端（checkLockIntegrity/sync）處理
        if (item.Property.LockedBy === HSLOCK_NAME) return;
        const gn = item.Asset?.Group?.Name;
        if (!gn || _pendingRestore.has(gn)) return;
        const cfg = padlocks[gn];
        if (cfg) {
            // 有設定 → 應該是鎖著的 → 還原成真鎖
            if (restoreLockFromConfig(gn, cfg) === 'ok') changed = true;
        } else {
            // 無設定 → 本來就不該有鎖 → 抹掉假貼圖（Name/HeartLockId）
            cleanHeartLockProperty(Player, item);
            // 若該部位仍有 BCX 屬性詛咒，重蓋章基準使其不再含 Name，避免下次又被加回
            try { rebaselineCurseIfNeeded(gn); } catch {}
            changed = true;
            log('cleanupFakeLocks: stripped fake heart lock on', gn);
        }
    });
    if (changed) { try { CharacterRefresh?.(Player, false); ChatRoomCharacterUpdate?.(Player); } catch {} }
}
