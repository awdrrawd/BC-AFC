import { getLockDraft } from '../features/heartlock/crafting/draft-config.js';
// ════════════════════════════════════════
//  HeartLock module: net.js
//  房內 Hidden 訊息：設定同步 / 廣播 / 上鎖套用 / 遠端解鎖
// ════════════════════════════════════════

import { HEARTLOCK_NAME, HSLOCK_NAME } from '../features/heartlock/config.js';
import { restoreHeartLockMarkers } from '../compat/r132-heartlock.js';
import { clone } from '../features/heartlock/util.js';
import { snapshotItem } from '../features/heartlock/snapshot.js';
import { state } from '../features/heartlock/state.js';
import { sendLocalizedAction } from '../i18n/l10n.js';
import { ensureStorage, getOrCreateConfig, deleteConfig, saveAndSync, isRemovedLock, getPadlockConfig } from '../features/heartlock/storage.js';
import { isMemberAllowedByMe } from '../features/heartlock/permissions.js';
import { isValidGroupName, sanitizeLockSettings } from '../features/heartlock/validate.js';
import { rebaselineCurseIfNeeded } from '../compat/bcx-heartlock.js';
import { emitHeartLockEvent, onHeartLockEvent } from '../features/heartlock/events.js';

export function sendSettingsChange(character, groupName) {
    if (!character || getLockDraft(character) || character.IsPlayer()) return;
    try {
        const wearer = character.Nickname || character.Name;
        const self   = Player.Nickname || Player.Name;
        sendLocalizedAction('hl', 'settingsChanged', [self, wearer, HEARTLOCK_NAME]);
    } catch {}
}

// 心鎖通訊原則：
//  • 公開摘要（owner / assetName / lockId）走 OnlineSharedSettings.AFC_HeartLock，伺服器已同步給房內，
//    不需要任何查詢或廣播（見 storage.js saveAndSync / getPadlockConfig）。
//  • 私密細節（note、計時、震動、高潮模式）只在對方開啟該物品面板時，對「單一部位」1 對 1 請求，
//    穿戴者驗證請求者身分後只回給請求者本人；不再把整份鎖設定廣播給全房。
function sendHidden(target, content, entry) {
    try {
        ServerSend('ChatRoomChat', { Type: 'Hidden', Content: content, Target: target, Dictionary: [{ ...entry, Target: target }] });
    } catch {}
}

/** 掛鎖者本人，或穿戴者授權的主人／戀人，才能看到鎖的私密細節。 */
function canViewLock(sender, cfg) {
    return Number(cfg?.owner) === Number(sender) || isMemberAllowedByMe(sender);
}

/** 把「指定部位」的鎖設定只回給 target（不含完整快照）。 */
export function sendLockConfig(target, group) {
    if (!Number.isSafeInteger(target) || target <= 0 || !isValidGroupName(group) || !ensureStorage()) return;
    const cfg = Player.HeartLock?.padlocks?.[group];
    if (!cfg || !canViewLock(target, cfg)) return;
    const copy = clone(cfg);
    delete copy._fullSnapshot; delete copy.awaitingSnapshot;
    sendHidden(target, 'HeartLock::Sync', { Tag: 'HeartLock::Data',
        Data: { memberNumber: Player.MemberNumber, padlocks: { [group]: copy } } });
}

onHeartLockEvent('request-remote-data', ({ character, group }) => requestHeartLockData(character, group));

/** 開啟他人身上的心鎖面板時，請求該部位的鎖設定。 */
export function requestHeartLockData(character, group) {
    if (!character || getLockDraft(character) || character.IsPlayer() || !isValidGroupName(group)) return;
    sendHidden(character.MemberNumber, 'HeartLockRequest', { Tag: 'HeartLockRequest', Group: group });
}

export function pushConfig(character, groupName, patch) {
    const draft = getLockDraft(character);
    if (draft) { if (draft.group === groupName) draft.patch(patch); return; }
    if (character.IsPlayer()) {
        if (!ensureStorage()) return;
        const cfg = Player.HeartLock.padlocks[groupName];
        if (cfg) { Object.assign(cfg, patch); saveAndSync(); }
    } else {
        sendHidden(character.MemberNumber, 'HeartLock::Update', { Tag: 'HeartLock::Update', Group: groupName, Config: patch });
    }
}

export function notifyRemove(character, groupName, lockId) {
    if (getLockDraft(character)) return;
    lockId ??= getPadlockConfig(character, groupName)?.lockId;
    if (character.IsPlayer()) { deleteConfig(groupName, lockId); return; }
    sendHidden(character.MemberNumber, 'HeartLock::Remove', { Tag: 'HeartLock::Remove', Group: groupName, LockId: lockId });
}

export function handleHidden(data) {
    if (!data || data.Type !== 'Hidden') return;
    if (data.Content === 'HeartLockRequest') {
        const e = data.Dictionary?.find(d => d?.Tag === 'HeartLockRequest');
        // 舊版（無 Group）的整份請求不再回應：公開摘要已由 OnlineSharedSettings 提供。
        if (e?.Target === Player.MemberNumber && isValidGroupName(e.Group)) sendLockConfig(data.Sender, e.Group);
    }
    if (data.Content === 'HeartLock::Sync') {
        const e = data.Dictionary?.find(d => d?.Tag === 'HeartLock::Data');
        const s = ChatRoomCharacter?.find(c => c.MemberNumber === data.Sender);
        if (e?.Data && typeof e.Data === 'object' && s && s !== Player) {
            // 只合併「合法部位」的設定，保留其他部位已取得的資料。
            const incoming = {};
            for (const [group, cfg] of Object.entries(e.Data.padlocks && typeof e.Data.padlocks === 'object' ? e.Data.padlocks : {}))
                if (isValidGroupName(group) && cfg && typeof cfg === 'object') incoming[group] = clone(cfg);
            s.HeartLock = { memberNumber: data.Sender, padlocks: { ...(s.HeartLock?.padlocks ?? {}), ...incoming } };
            restoreHeartLockMarkers(s);
            // 只有面板正在顯示該角色的鎖時才刷新，避免無關訊息觸發不必要的重繪
            if (s.MemberNumber === state.panel.targetChar?.MemberNumber) emitHeartLockEvent('panel-refresh');
        }
    }
    if (data.Content === 'HeartLockApply') {
        const e = data.Dictionary?.find(d => d?.Tag === 'HeartLockApply');
        if (!e || e.Target !== Player.MemberNumber) return;
        if (!isValidGroupName(e.Group)) return;
        if (Number(e.Owner) !== Number(data.Sender)) return;
        // 發送者必須是本人允許施鎖的關係（主人/戀人），否則拒絕認領此鎖
        if (!isMemberAllowedByMe(data.Sender)) return;
        if (!ensureStorage() || isRemovedLock(e.Group, e.LockId)) return;
        const existing = Player.HeartLock?.padlocks?.[e.Group];
        if (existing && Number(existing.owner) !== Number(data.Sender)) return;
        const cfg = getOrCreateConfig(e.Group);
        if (!cfg) return;
        // 設定欄位統一經 sanitizeLockSettings 驗證（Apply：缺失的計時/移除拘束視為關閉）。
        if (e.Settings && typeof e.Settings === 'object') Object.assign(cfg, sanitizeLockSettings(e.Settings));
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
        sendLockConfig(data.Sender, e.Group);   // 讓掛鎖者的面板拿到最新設定
        // 若該部位有 BCX 屬性詛咒 → 待 appearance 同步反映鎖屬性後，重新蓋章 curse 基準避免洗版
        try { rebaselineCurseIfNeeded(e.Group); } catch {}
    }
    if (data.Content === 'HeartLock::Update') {
        const e = data.Dictionary?.find(d => d?.Tag === 'HeartLock::Update');
        if (!e || e.Target !== Player.MemberNumber || !isValidGroupName(e.Group)) return;
        if (!ensureStorage()) return;
        const cfg = Player.HeartLock.padlocks[e.Group];
        // 只有掛鎖者（owner）本人能改鎖設定（計時/震動/高潮模式/筆記等）
        if (cfg && Number(cfg.owner) === Number(data.Sender)) {
            Object.assign(cfg, sanitizeLockSettings(e.Config, { partial: true }));
            saveAndSync();
            sendLockConfig(data.Sender, e.Group);
        }
    }
    if (data.Content === 'HeartLock::Remove') {
        const e = data.Dictionary?.find(d => d?.Tag === 'HeartLock::Remove');
        if (!e || e.Target !== Player.MemberNumber || !isValidGroupName(e.Group)) return;
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
