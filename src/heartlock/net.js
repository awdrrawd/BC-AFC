// ════════════════════════════════════════
//  HeartLock module: net.js
//  房內 Hidden 訊息：設定同步 / 廣播 / 上鎖套用 / 遠端解鎖
// ════════════════════════════════════════

import { HEARTLOCK_NAME } from './config.js';
import { clone } from './util.js';
import { state } from './state.js';
import { sendLocalizedAction } from '../i18n/l10n.js';
import { ensureStorage, getOrCreateConfig, deleteConfig, saveAndSync } from './storage.js';
import { isMemberAllowedByMe } from './permissions.js';
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
        // 發送者必須是本人允許施鎖的關係（主人/戀人），否則拒絕認領此鎖
        if (!isMemberAllowedByMe(data.Sender)) return;
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
        const cfg = Player.HeartLock.padlocks[e.Group];
        // 只有掛鎖者（owner）本人能改鎖設定（計時/震動/高潮模式/筆記等）
        if (cfg && Number(cfg.owner) === Number(data.Sender)) { Object.assign(cfg, e.Config); saveAndSync(); }
    }
    if (data.Content === 'HeartLock::Remove') {
        const e = data.Dictionary?.find(d => d.Tag === 'HeartLock::Remove');
        if (!e || e.Target !== Player.MemberNumber) return;
        if (!ensureStorage()) return;
        const cfg = Player.HeartLock?.padlocks?.[e.Group];
        if (!cfg) return;
        // owner 本人、或本人授權解鎖的關係（主人/戀人，見解鎖分頁直接解鎖流程）才可移除
        if (Number(cfg.owner) === Number(data.Sender) || isMemberAllowedByMe(data.Sender))
            deleteConfig(e.Group);
    }
}
