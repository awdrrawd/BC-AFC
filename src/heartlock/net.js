// ════════════════════════════════════════
//  HeartLock module: net.js
//  房內 Hidden 訊息：設定同步 / 廣播 / 上鎖套用 / 遠端解鎖
// ════════════════════════════════════════

import { HEARTLOCK_NAME } from './config.js';
import { clone, log } from './util.js';
import { state } from './state.js';
import { sendLocalizedAction } from '../i18n/l10n.js';
import { ensureStorage, getOrCreateConfig, deleteConfig, saveAndSync } from './storage.js';
import { hideNoteTA } from './note.js';
import { hlRefreshCurrentTab } from './panel.js';

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
            Dictionary: [{ Tag: 'HeartLock::Data', Data: clone(Player.HeartLock) }],
        });
    } catch {}
}

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

export function notifyRemove(character, groupName) {
    if (character.IsPlayer()) { deleteConfig(groupName); return; }
    try {
        ServerSend('ChatRoomChat', {
            Type: 'Hidden', Content: 'HeartLock::Remove',
            Dictionary: [{ Tag: 'HeartLock::Remove', Target: character.MemberNumber, Group: groupName }],
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
            if (s) {
                s.HeartLock = e.Data;
                // 只有面板正在顯示該角色的鎖時才刷新，避免無關廣播觸發不必要的重繪
                if (s.MemberNumber === state.panel.targetChar?.MemberNumber) {
                    hlRefreshCurrentTab();
                }
            }
        }
    }
    if (data.Content === 'HeartLockApply') {
        const e = data.Dictionary?.find(d => d.Tag === 'HeartLockApply');
        if (!e || e.Target !== Player.MemberNumber) return;
        if (Number(e.Owner) !== Number(data.Sender)) return;
        const existing = Player.HeartLock?.padlocks?.[e.Group];
        if (existing && Number(existing.owner) !== Number(data.Sender)) return;
        const cfg = getOrCreateConfig(e.Group);
        if (!cfg) return;
        cfg.owner = e.Owner; cfg.ownerName = e.OwnerName;
        cfg.lockedAt = e.LockedAt; cfg.assetName = e.AssetName ?? null; cfg.lockId = e.LockId ?? null;
        try {
            const item = InventoryGet?.(Player, e.Group);
            if (item) {
                cfg._fullSnapshot = { assetName: item.Asset?.Name, groupName: e.Group, color: item.Color ? clone(item.Color) : undefined, craft: item.Craft ? clone(item.Craft) : undefined, difficulty: item.Difficulty };
                if (item?.Property) item.Property.HeartLockId = e.LockId;
            }
        } catch {}
        saveAndSync();
    }
    if (data.Content === 'HeartLock::Update') {
        const e = data.Dictionary?.find(d => d.Tag === 'HeartLock::Update');
        if (!e || e.Target !== Player.MemberNumber) return;
        if (!ensureStorage()) return;
        const p = Player.HeartLock.padlocks;
        if (p[e.Group]) { Object.assign(p[e.Group], e.Config); saveAndSync(); }
    }
    if (data.Content === 'HeartLock::Remove') {
        const e = data.Dictionary?.find(d => d.Tag === 'HeartLock::Remove');
        if (!e || e.Target !== Player.MemberNumber) return;
        deleteConfig(e.Group);
    }
    // 非 owner 的 EL/BC 戀人請求解鎖
    // owner 收到後檢查 Requester 是否有權，若有則替代執行 InventoryUnlock
    if (data.Content === 'HeartLock::Unlock::Done') {
        const e = data.Dictionary?.find(d => d.Tag === 'HeartLock::Unlock::Done');
        if (!e || e.Target !== Player.MemberNumber) return;
        // 解鎖已完成，清除 pending 並關閉面板
        state.panel.unlockPending = false;
        hideNoteTA();
        state.panel.noteEditing = false;
        state.panel.ctlEditing  = false;
        DialogFocusItem = null;
    }
    if (data.Content === 'HeartLock::Unlock::Request') {
        const e = data.Dictionary?.find(d => d.Tag === 'HeartLock::Unlock::Request');
        if (!e) return;
        if (!ensureStorage()) return;
        const gn  = e.Group;
        const cfg = Player.HeartLock?.padlocks?.[gn];
        if (!cfg || Number(cfg.owner) !== Number(Player.MemberNumber)) return;
        const requester = e.Requester;
        const wearerNum = e.WearerMemberNumber;
        const wearer    = ChatRoomCharacter?.find(c => c.MemberNumber === wearerNum);
        if (!wearer) return;
        const wearerAFCLovers = wearer.OnlineSharedSettings?.AFC?.lovers ?? [];
        const isAFCLover = wearerAFCLovers.some(l => Number(l.memberNumber) === Number(requester));
        const isBCLovr   = wearer.Lovership?.some(l => Number(l.MemberNumber) === Number(requester)) ?? false;
        if (!isAFCLover && !isBCLovr) return;
        try {
            state._unlocking = true;
            InventoryUnlock?.(wearer, gn);
            state._unlocking = false;
            ChatRoomCharacterUpdate?.(wearer);
            deleteConfig(gn);
            log(`HeartLock::Unlock::Request: 已替 #${requester} 解鎖 ${gn}`);
            try {
                ServerSend('ChatRoomChat', {
                    Type: 'Hidden', Content: 'HeartLock::Unlock::Done',
                    Dictionary: [{ Tag: 'HeartLock::Unlock::Done', Target: requester, Group: gn }],
                });
            } catch {}
        } catch { state._unlocking = false; }
    }
}
