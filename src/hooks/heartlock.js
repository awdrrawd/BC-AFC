import { installHeartLockRemovalHook } from '../heartlock/removal.js';
import { installHeartLockPropertyHooks, restoreHeartLockMarkers } from '../heartlock/r132-properties.js';
// ════════════════════════════════════════
//  HeartLock 的遊戲函式 hooks（由中央 registry 安裝）
// ════════════════════════════════════════

import { HEARTLOCK_NAME, HSLOCK_NAME, HL_PANEL_ID } from '../heartlock/config.js';
import { state } from '../heartlock/state.js';
import { th as T } from '../i18n/i18n.js';
import { ensureStorage, getPadlockConfig, getSetting } from '../heartlock/storage.js';
import { convertToHeartLock, reapplyFromAppearance, reconcileProtection, cleanHeartLockProperty } from '../heartlock/lock.js';
import { notifyRemove } from '../heartlock/net.js';
import { isAllowedToLock, isAllowedToUnlock } from '../heartlock/permissions.js';
import { removeHLPanel, _repositionHLPanel, panelLoad } from '../heartlock/panel.js';
import { setupOrgasmHooks } from './orgasm.js';
import { isProtectionPaused } from '../heartlock/protection.js';

export function installHeartLockHooks(registry) {
    const { hook } = registry;

    // 返回鍵：優先關閉 HeartLock 面板，第二次才退出 BC dialog
    hook('DialogLeave', 10, (args, next) => {
        if (document.getElementById(HL_PANEL_ID)) { removeHLPanel(); return; }
        return next(args);
    });
    // InformationSheet 縮放時重新定位面板
    hook('InformationSheetResize', 0, (args, next) => {
        const r = next(args); _repositionHLPanel(); return r;
    });
    installHeartLockRemovalHook(hook);
    installHeartLockPropertyHooks(hook);

    // ── 有插件的人都能看到此鎖，但上鎖時才做權限檢查 ──
    hook('DialogInventoryAdd', 10, (args, next) => {
        const C    = args[0];
        const item = args[1];
        if (item?.Asset?.Name !== HEARTLOCK_NAME) return next(args);
        if (DialogMenuMode === 'permissions') return next(args);
        if (C.ID === 0) return;           // 穿戴者自己不顯示
        if (!isAllowedToLock(C)) return;  // 無權限者不顯示
        return next(args);
    });

    // ── 上鎖 ──
    hook('DialogLockingClick', 2, (args, next) => {
        const cl = args[0], ch = args[1], item = args[2];
        if (cl?.Asset?.Name !== HEARTLOCK_NAME) return next(args);
        if (DialogMenuMode === 'permissions') return next(args);
        if (typeof InventoryBlockedOrLimited === 'function' && InventoryBlockedOrLimited(ch, cl)) return next(args);

        // 只有被允許的關係才能上鎖
        if (!isAllowedToLock(ch)) return;

        const hsAsset = AssetGet?.('Female3DCG', 'ItemMisc', HSLOCK_NAME);
        if (!hsAsset) return next(args);
        const fg = ch?.FocusGroup?.Name, ori = cl.Asset;
        // 設旗標，供 ServerSend hook 識別此次是 HeartLock 上鎖
        state.operations.applyingLock = true;
        try { cl.Asset = hsAsset; next(args); }
        finally { cl.Asset = ori; state.operations.applyingLock = false; }
        if (item?.Property?.LockedBy === HSLOCK_NAME) convertToHeartLock(ch, item, fg);
    });

    // ── ServerSend：ActionAddLock 修正 ──
    hook('ServerSend', 0, (args, next) => {
        if (args[0] === 'ChatRoomChat') {
            const d = args[1];
            if (d?.Content === 'ActionAddLock' && Array.isArray(d.Dictionary) && state.operations.applyingLock) {
                d.Dictionary.forEach(e => {
                    if (e.AssetName === HSLOCK_NAME) e.AssetName = HEARTLOCK_NAME;
                    if (e.Tag === 'NextAsset' && e.Text === HSLOCK_NAME) e.Text = HEARTLOCK_NAME;
                });
            }
        }
        return next(args);
    });

    // ── 面板 Hooks ──
    hook('InventoryItemMiscHighSecurityPadlockLoad', 11, (args, next) => {
        if (window.DialogFocusSourceItem?.Property?.Name !== HEARTLOCK_NAME) return next(args);
        next(args);
        // DOM 面板已存在 → 同步觸發的重載，不重設狀態
        if (document.getElementById(HL_PANEL_ID)) return;
        panelLoad();
    });
    hook('InventoryItemMiscHighSecurityPadlockDraw', 11, (args, next) => {
        if (window.DialogFocusSourceItem?.Property?.Name !== HEARTLOCK_NAME) return next(args);
        // DOM 面板已接管所有 UI，canvas 層不繪製
    });
    hook('InventoryItemMiscHighSecurityPadlockClick', 11, (args, next) => {
        if (window.DialogFocusSourceItem?.Property?.Name !== HEARTLOCK_NAME) {
            try { return next(args); } catch { return; }
        }
        // DOM 面板已接管所有點擊事件
    });
    hook('DialogLeaveFocusItem', 10, (args, next) => {
        const isHL = window.DialogFocusSourceItem?.Property?.Name === HEARTLOCK_NAME;
        if (isHL && state.operations.serverSync) return;
        if (isHL) removeHLPanel();
        return next(args);
    });

    // ── CharacterRefresh ──
    hook('CharacterRefresh', 0, (args, next) => {
        if (args[0]?.IsPlayer?.()) ensureStorage();
        restoreHeartLockMarkers(args[0]);
        const result = next(args);
        if (args[0]?.IsPlayer?.()) {
            const account = Player;
            registry.timeout(() => { if (Player === account) reapplyFromAppearance(); }, 300);
        }
        return result;
    });

    // ── 圖片替換 ──
    hook('DrawImageResize', 0, (args, next) => {
        if (typeof args[0] === 'string' && args[0].includes(`ItemMisc/Preview/${HEARTLOCK_NAME}.png`)) args[0] = getSetting('previewImage');
        return next(args);
    });
    try { hook('DrawImage', 0, (args, next) => { if (typeof args[0] === 'string' && args[0].includes(`ItemMisc/Preview/${HEARTLOCK_NAME}.png`)) args[0] = getSetting('previewImage'); return next(args); }); } catch {}
    hook('ElementButton.CreateForAsset', 0, (args, next) => {
        args[4] ??= {};
        const asset = ('Asset' in args[1]) ? args[1].Asset : args[1];
        if (asset?.Name === HEARTLOCK_NAME) args[4].image = getSetting('previewImage');
        return next(args);
    });
    // ── 狀態列圖示 ──
    hook('DialogGetLockIcon', 2, (args, next) => {
        const item = args[0], icons = next(args) || [];
        if (item?.Property?.Name === HEARTLOCK_NAME) {
            const idx = icons.indexOf(HSLOCK_NAME);
            if (idx !== -1) icons.splice(idx, 1, HEARTLOCK_NAME);
            else if (!icons.includes(HEARTLOCK_NAME)) icons.push(HEARTLOCK_NAME);
        }
        return icons;
    });

    // ── 鎖圖示 tooltip ──
    try { hook('InterfaceTextGet', 2, (args, next) => { const key = String(args[0] ?? ''); if (key === HEARTLOCK_NAME) return T('lockedBy', HEARTLOCK_NAME); return next(args); }); } catch {}
    try {
        // 訂製特性頁與圖示重載直接呼叫 _ParseIcons，不會經過 Create。
        hook('ElementButton._ParseIcons', 11, (args, next) => {
            if (Array.isArray(args[1])) {
                args[1] = args[1].map(icon => {
                    if (icon === HEARTLOCK_NAME) return { name: HEARTLOCK_NAME, iconSrc: getSetting('previewImage'), tooltipText: T('lockedBy', HEARTLOCK_NAME) };
                    if (typeof icon === 'object' && icon?.name === HEARTLOCK_NAME) return { ...icon, iconSrc: getSetting('previewImage'), tooltipText: icon.tooltipText ?? T('lockedBy', HEARTLOCK_NAME) };
                    return icon;
                });
            }
            return next(args);
        });
    } catch {}

    // ── PickLock 隱藏 ──
    hook('DialogMenuButtonBuild', 0, (args, next) => {
        next(args);
        const C = args[0], gn = C?.FocusGroup?.Name;
        const item = gn ? InventoryGet?.(C, gn) : null;
        if (item?.Property?.Name === HEARTLOCK_NAME) {
            for (let i = DialogMenuButton.length - 1; i >= 0; i--)
                if (typeof DialogMenuButton[i] === 'string' && DialogMenuButton[i].startsWith('PickLock')) DialogMenuButton.splice(i, 1);
        }
    });

    // Only discard recovery data after the native unlock actually succeeds.
    hook('InventoryUnlock', 10, (args, next) => {
        const [character, target] = args;
        const item = typeof target === 'object' ? target : InventoryGet?.(character, target);
        const group = item?.Asset?.Group?.Name;
        const cfg = getPadlockConfig(character, group);
        const lockId = item?.Property?.HeartLockId;
        const heart = item?.Property?.Name === HEARTLOCK_NAME;
        if (heart && cfg && !state.operations.timerUnlocking && !state.operations.unlocking
            && !isAllowedToUnlock(character, cfg)) return;
        const previous = state.operations.unlocking;
        state.operations.unlocking = true;
        try {
            const result = next(args);
            if (heart && !item?.Property?.LockedBy) {
                cleanHeartLockProperty(character, item);
                if (cfg) notifyRemove(character, group, lockId);
            }
            return result;
        } finally { state.operations.unlocking = previous; }
    });

    for (const event of ['ChatRoomSyncCharacter', 'ChatRoomSyncSingle', 'ChatRoomSyncItem',
        'ChatRoomSyncMemberJoin', 'ChatRoomSyncMemberLeave']) {
        hook(event, 1, (args, next) => {
            const previous = state.operations.serverSync;
            state.operations.serverSync = true;
            let result;
            try { result = next(args); }
            finally { state.operations.serverSync = previous; }
            const data = args[0];
            const target = event === 'ChatRoomSyncItem' ? data?.Item?.Target : data?.Character?.MemberNumber;
            if (target === Player.MemberNumber) {
                reapplyFromAppearance();
                reconcileProtection(event === 'ChatRoomSyncItem' ? data?.Source : data?.SourceMemberNumber,
                    event === 'ChatRoomSyncItem' ? data?.Item?.Group : undefined);
            }
            return result;
        });
    }

    // ── CharacterReleaseTotal 攔截 ──
    hook('CharacterReleaseTotal', 10, (args, next) => {
        if (state.operations.safewordRelease || isProtectionPaused()) return next(args);
        const C = args[0];
        if (!C?.Appearance) return next(args);
        const snapshots = [];
        C.Appearance.forEach(item => {
            if (item?.Property?.Name !== HEARTLOCK_NAME) return;
            const gn = item.Asset?.Group?.Name, cfg = getPadlockConfig(C, gn);
            if (!cfg) return;
            snapshots.push({ gn, prop: JSON.parse(JSON.stringify(item.Property)) });
        });
        const result = next(args);
        snapshots.forEach(({ gn, prop }) => {
            const item = C.Appearance?.find(i => i.Asset?.Group?.Name === gn);
            if (item) Object.assign(item.Property ?? (item.Property = {}), prop);
        });
        if (snapshots.length > 0 && C.IsPlayer?.()) { try { ChatRoomCharacterUpdate?.(C); } catch {} }
        return result;
    });

    setupOrgasmHooks(hook);
}
