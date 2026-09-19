// ════════════════════════════════════════
//  HeartLock module: net.js
//  房內 Hidden 訊息：設定同步 / 廣播 / 上鎖套用 / 遠端解鎖
// ════════════════════════════════════════

import { HEARTLOCK_NAME, HSLOCK_NAME } from './config.js';
import { restoreHeartLockMarkers } from './r132-properties.js';
import { clone } from './util.js';
import { snapshotItem } from './snapshot.js';
import { state } from './state.js';
import { sendLocalizedAction } from '../i18n/l10n.js';
import { ensureStorage, getOrCreateConfig, deleteConfig, saveAndSync, isRemovedLock } from './storage.js';
import { isMemberAllowedByMe } from './permissions.js';
import { rebaselineCurseIfNeeded } from './bcx-compat.js';
import { emitHeartLockEvent, onHeartLockEvent } from './events.js';

export function sendSettingsChange(character, groupName) {
    if (!character || character.IsPlayer()) return;
    try {
        const wearer = character.Nickname || character.Name;
        const self   = Player.Nickname || Player.Name;
        sendLocalizedAction('hl', 'settingsChanged', [self, wearer, HEARTLOCK_NAME]);
    } catch {}
}

export function broadcastStorage() {
    try {
        if (typeof ServerSend !== 'function') return;
        ServerSend('ChatRoomChat', {
            Type: 'Hidden', Content: 'HeartLock::Sync',
            Dictionary: [{ Tag: 'HeartLock::Data', Data: { memberNumber: Player.MemberNumber, padlocks: Object.fromEntries(Object.entries(Player.HeartLock?.padlocks ?? {}).map(([group, cfg]) => { const copy = clone(cfg); delete copy._fullSnapshot; delete copy.awaitingSnapshot; return [group, copy]; })) } }],
        });
    } catch {}
}

onHeartLockEvent('storage-saved', broadcastStorage);
onHeartLockEvent('request-remote-data', requestHeartLockData);

export function requestHeartLockData(character) {
    if (!character || character.IsPlayer()) return;
    try {
        ServerSend('ChatRoomChat', {
            Type: 'Hidden', Content: 'HeartLockRequest',
            Dictionary: [{ Tag: 'HeartLockRequest', Target: character.MemberNumber }],
        });
    } catch {}
}

export function pushConfig(character, groupName, patch) {
    if (character.IsPlayer()) {
        if (!ensureStorage()) return;
        const cfg = Player.HeartLock.padlocks[groupName];
        if (cfg) { Object.assign(cfg, patch); saveAndSync(); }
    } else {
        try {
            ServerSend('ChatRoomChat', {
                Type: 'Hidden', Content: 'HeartLock::Update',
                Dictionary: [{ Tag: 'HeartLock::Update', Target: character.MemberNumber, Group: groupName, Config: patch }],
            });
        } catch {}
    }
}

export function notifyRemove(character, groupName, lockId) {
    lockId ??= character.HeartLock?.padlocks?.[groupName]?.lockId;
    if (character.IsPlayer()) { deleteConfig(groupName, lockId); return; }
    try {
        ServerSend('ChatRoomChat', {
            Type: 'Hidden', Content: 'HeartLock::Remove',
            Dictionary: [{ Tag: 'HeartLock::Remove', Target: character.MemberNumber, Group: groupName, LockId: lockId }],
        });
    } catch {}
}

export function handleHidden(data) {
    if (!data || data.Type !== 'Hidden') return;
    if (data.Content === 'HeartLockRequest') {
        const e = data.Dictionary?.find(d => d.Tag === 'HeartLockRequest');
        if (e?.Target === Player.MemberNumber) broadcastStorage();
    }
    if (data.Content === 'HeartLock::Sync') {
        const e = data.Dictionary?.find(d => d.Tag === 'HeartLock::Data');
        if (e) {
            const s = ChatRoomCharacter?.find(c => c.MemberNumber === data.Sender);
            if (s && s !== Player) {
                s.HeartLock = e.Data;
                restoreHeartLockMarkers(s);
                // 只有面板正在顯示該角色的鎖時才刷新，避免無關廣播觸發不必要的重繪
                if (s.MemberNumber === state.panel.targetChar?.MemberNumber) {
                    emitHeartLockEvent('panel-refresh');
                }
            }
        }
    }
    if (data.Content === 'HeartLockApply') {
        const e = data.Dictionary?.find(d => d.Tag === 'HeartLockApply');
        if (!e || e.Target !== Player.MemberNumber) return;
        if (Number(e.Owner) !== Number(data.Sender)) return;
        // 發送者必須是本人允許施鎖的關係（主人/戀人），否則拒絕認領此鎖
        if (!isMemberAllowedByMe(data.Sender)) return;
        if (!ensureStorage() || isRemovedLock(e.Group, e.LockId)) return;
        const existing = Player.HeartLock?.padlocks?.[e.Group];
        if (existing && Number(existing.owner) !== Number(data.Sender)) return;
        const cfg = getOrCreateConfig(e.Group);
        if (!cfg) return;
        cfg.owner = e.Owner; cfg.ownerName = e.OwnerName;
        cfg.lockedAt = e.LockedAt; cfg.lockTs = Date.now(); cfg.assetName = e.AssetName ?? null; cfg.lockId = e.LockId ?? null;
        const item = InventoryGet?.(Player, e.Group);
        const supplied = e.Snapshot;
        const p = supplied?.property;
        if (supplied?.version === 2 && supplied.format === 'runtime' && supplied.groupName === e.Group
            && supplied.assetName === e.AssetName && p?.LockedBy === HSLOCK_NAME
            && p.HeartLockId === e.LockId && Number(p.LockMemberNumber) === Number(e.Owner)) {
            cfg._fullSnapshot = clone(supplied);
            delete cfg.awaitingSnapshot;
        } else if (item?.Asset?.Name === cfg.assetName && item.Property?.LockedBy === HSLOCK_NAME
            && item.Property.HeartLockId === cfg.lockId && Number(item.Property.LockMemberNumber) === Number(cfg.owner)) {
            cfg._fullSnapshot = snapshotItem(item, e.Group);
            delete cfg.awaitingSnapshot;
        } else {
            delete cfg._fullSnapshot;
            cfg.awaitingSnapshot = true;
        }
        saveAndSync();
        // 若該部位有 BCX 屬性詛咒 → 待 appearance 同步反映鎖屬性後，重新蓋章 curse 基準避免洗版
        try { rebaselineCurseIfNeeded(e.Group); } catch {}
    }
    if (data.Content === 'HeartLock::Update') {
        const e = data.Dictionary?.find(d => d.Tag === 'HeartLock::Update');
        if (!e || e.Target !== Player.MemberNumber) return;
        if (!ensureStorage()) return;
        const cfg = Player.HeartLock.padlocks[e.Group];
        // 只有掛鎖者（owner）本人能改鎖設定（計時/震動/高潮模式/筆記等）
        if (cfg && Number(cfg.owner) === Number(data.Sender)) { for (const key of ['note', 'unlockTime', 'removeRestraints', 'vibe', 'orgasmMode']) { if (Object.hasOwn(e.Config ?? {}, key)) cfg[key] = e.Config[key]; } saveAndSync(); }
    }
    if (data.Content === 'HeartLock::Remove') {
        const e = data.Dictionary?.find(d => d.Tag === 'HeartLock::Remove');
        if (!e || e.Target !== Player.MemberNumber) return;
        if (!ensureStorage()) return;
        const cfg = Player.HeartLock?.padlocks?.[e.Group];
        if (!cfg) return;
        // Legacy remove messages have no identity: wait for the actual unlock.
        if (!e.LockId && InventoryGet?.(Player, e.Group)?.Property?.LockedBy) return;
        // owner 本人、或本人授權解鎖的關係（主人/戀人，見解鎖分頁直接解鎖流程）才可移除
        if (Number(cfg.owner) === Number(data.Sender) || isMemberAllowedByMe(data.Sender))
            deleteConfig(e.Group, e.LockId);
    }
}
