// ════════════════════════════════════════
//  HeartLock module: hooks.js
//  patchFunctions：所有 modApi.hookFunction 註冊
// ════════════════════════════════════════

import { HEARTLOCK_NAME, HSLOCK_NAME, HL_PANEL_ID, GRAB_WINDOW_MS, GRAB_COOLDOWN_MS } from './config.js';
import { state, grabStateChar, grabStateSingle, _pendingRestore } from './state.js';
import { log } from './util.js';
import { T } from './i18n.js';
import { ensureStorage, getPadlockConfig, deleteConfig, getSetting } from './storage.js';
import { restoreLockFromConfig, convertToHeartLock, watchForUnlock, reapplyFromAppearance, cleanHeartLockProperty } from './lock.js';
import { notifyRemove, handleHidden } from './net.js';
import { isAllowedToLock, isAllowedToUnlock } from './permissions.js';
import { removeHLPanel, _repositionHLPanel, panelLoad } from './panel.js';
import { setupOrgasmHook } from './orgasm.js';
import { sendLocalizedAction } from '../i18n/l10n.js';

export function patchFunctions(modApi) {

    // 返回鍵：優先關閉 HeartLock 面板，第二次才退出 BC dialog
    modApi.hookFunction('DialogLeave', 10, (args, next) => {
        if (document.getElementById(HL_PANEL_ID)) { removeHLPanel(); return; }
        return next(args);
    });
    modApi.hookFunction('InformationSheetExit', 10, (args, next) => {
        if (document.getElementById(HL_PANEL_ID)) { removeHLPanel(); return; }
        return next(args);
    });

    // InformationSheet 縮放時重新定位面板
    modApi.hookFunction('InformationSheetResize', 0, (args, next) => {
        const r = next(args); _repositionHLPanel(); return r;
    });
    modApi.hookFunction('InventoryRemove', 0, (args, next) => {
        const C = args[0], grp = args[1];
        if (state._restoring) return next(args);
        // 計時器到期移除：穿戴者自己移除，直接放行
        if (state._timerUnlocking) return next(args);
        if (!C?.IsPlayer?.()) {
            const item = InventoryGet?.(C, grp);
            if (item?.Property?.Name === HEARTLOCK_NAME) {
                const cfg2 = getPadlockConfig(C, grp);
                if (cfg2) { if (Number(cfg2.owner) !== Number(Player.MemberNumber)) { return; } notifyRemove(C, grp); }
            }
            return next(args);
        }
        const item = InventoryGet?.(Player, grp);
        if (item?.Property?.Name === HEARTLOCK_NAME) {
            const cfg2 = getPadlockConfig(Player, grp);
            if (cfg2) {
                if (Number(cfg2.owner) !== Number(Player.MemberNumber)) {
                    log('InventoryRemove blocked — not owner');                        if (!state._sendingResist) {
                        state._sendingResist = true;
                        setTimeout(() => {
                            try { sendLocalizedAction('hl', 'resistEscape', [Player.Nickname || Player.Name, HEARTLOCK_NAME]); } catch {}
                            state._sendingResist = false;
                        }, 300);
                    }
                    return;
                }
                deleteConfig(grp);
            }
        }
        if (state._inServerSync) return next(args);
        return next(args);
    });

    // ── 有插件的人都能看到此鎖，但上鎖時才做權限檢查 ──
    modApi.hookFunction('DialogInventoryAdd', 10, (args, next) => {
        const C    = args[0];
        const item = args[1];
        if (item?.Asset?.Name !== HEARTLOCK_NAME) return next(args);
        if (DialogMenuMode === 'permissions') return next(args);
        if (C.ID === 0) return;           // 穿戴者自己不顯示
        if (!isAllowedToLock(C)) return;  // 無權限者不顯示
        return next(args);
    });

    // ── 上鎖 ──
    modApi.hookFunction('DialogLockingClick', 2, (args, next) => {
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
        state._applyingHeartLock = true;
        cl.Asset = hsAsset; next(args); cl.Asset = ori;
        state._applyingHeartLock = false;
        if (item?.Property) { convertToHeartLock(ch, item, fg); if (fg) watchForUnlock(ch, fg, item); }
    });

    // ── ServerSend：ActionAddLock 修正 ──
    modApi.hookFunction('ServerSend', 0, (args, next) => {
        if (args[0] === 'ChatRoomChat') {
            const d = args[1];
            if (d?.Content === 'ActionAddLock' && Array.isArray(d.Dictionary) && state._applyingHeartLock) {
                d.Dictionary.forEach(e => {
                    if (e.AssetName === HSLOCK_NAME) e.AssetName = HEARTLOCK_NAME;
                    if (e.Tag === 'NextAsset' && e.Text === HSLOCK_NAME) e.Text = HEARTLOCK_NAME;
                });
            }
        }
        return next(args);
    });

    // ── 面板 Hooks ──
    modApi.hookFunction('InventoryItemMiscHighSecurityPadlockLoad', 11, (args, next) => {
        if (window.DialogFocusSourceItem?.Property?.Name !== HEARTLOCK_NAME) return next(args);
        next(args);
        // DOM 面板已存在 → 同步觸發的重載，不重設狀態
        if (document.getElementById(HL_PANEL_ID)) return;
        panelLoad();
    });
    modApi.hookFunction('InventoryItemMiscHighSecurityPadlockDraw', 11, (args, next) => {
        if (window.DialogFocusSourceItem?.Property?.Name !== HEARTLOCK_NAME) return next(args);
        // DOM 面板已接管所有 UI，canvas 層不繪製
    });
    modApi.hookFunction('InventoryItemMiscHighSecurityPadlockClick', 11, (args, next) => {
        if (window.DialogFocusSourceItem?.Property?.Name !== HEARTLOCK_NAME) {
            try { return next(args); } catch { return; }
        }
        // DOM 面板已接管所有點擊事件
    });
    modApi.hookFunction('DialogLeaveFocusItem', 10, (args, next) => {
        const isHL = window.DialogFocusSourceItem?.Property?.Name === HEARTLOCK_NAME;
        if (isHL && state._inServerSync) return;
        if (isHL) removeHLPanel();
        return next(args);
    });

    // ── 封包（hidden message）──
    modApi.hookFunction('ChatRoomMessage', 0, (args, next) => {
        state._inServerSync = true; handleHidden(args[0]);
        const result = next(args); state._inServerSync = false;
        return result;
    });

    // ── ChatRoomSync / CharacterRefresh ──
    modApi.hookFunction('ChatRoomSync', 0, (args, next) => {
        const result = next(args); setTimeout(() => ensureStorage(), 500); return result;
    });
    modApi.hookFunction('CharacterRefresh', 0, (args, next) => {
        const result = next(args);
        if (args[0]?.IsPlayer?.()) setTimeout(() => { ensureStorage(); reapplyFromAppearance(); }, 300);
        return result;
    });

    // ── 圖片替換 ──
    modApi.hookFunction('DrawImageResize', 0, (args, next) => {
        if (typeof args[0] === 'string' && args[0].includes(`ItemMisc/Preview/${HEARTLOCK_NAME}.png`)) args[0] = getSetting('previewImage');
        return next(args);
    });
    try { modApi.hookFunction('DrawImage', 0, (args, next) => { if (typeof args[0] === 'string' && args[0].includes(`ItemMisc/Preview/${HEARTLOCK_NAME}.png`)) args[0] = getSetting('previewImage'); return next(args); }); } catch {}
    modApi.hookFunction('ElementButton.CreateForAsset', 0, (args, next) => {
        args[4] ??= {};
        const asset = ('Asset' in args[1]) ? args[1].Asset : args[1];
        if (asset?.Name === HEARTLOCK_NAME) args[4].image = getSetting('previewImage');
        return next(args);
    });
    try {
        modApi.hookFunction('ElementButton.Create', 0, (args, next) => {
            const opts = args[2];
            if (opts?.icons && Array.isArray(opts.icons)) {
                opts.icons = opts.icons.map(icon => {
                    if (icon === HEARTLOCK_NAME) return { name: HEARTLOCK_NAME, iconSrc: getSetting('previewImage') };
                    if (typeof icon === 'object' && icon?.name === HEARTLOCK_NAME) return { ...icon, iconSrc: getSetting('previewImage') };
                    return icon;
                });
            }
            return next(args);
        });
    } catch {}

    // ── 狀態列圖示 ──
    modApi.hookFunction('DialogGetLockIcon', 2, (args, next) => {
        const item = args[0], icons = next(args) || [];
        if (item?.Property?.Name === HEARTLOCK_NAME) {
            const idx = icons.indexOf(HSLOCK_NAME);
            if (idx !== -1) icons.splice(idx, 1, HEARTLOCK_NAME);
            else if (!icons.includes(HEARTLOCK_NAME)) icons.push(HEARTLOCK_NAME);
        }
        return icons;
    });

    // ── 鎖圖示 tooltip ──
    try { modApi.hookFunction('InterfaceTextGet', 2, (args, next) => { const key = String(args[0] ?? ''); if (key === HEARTLOCK_NAME) return T('lockedBy', HEARTLOCK_NAME); return next(args); }); } catch {}
    try {
        modApi.hookFunction('ElementButton.Create', 11, (args, next) => {
            const result = next(args);
            setTimeout(() => { try { document.querySelectorAll(`[id$="icon-li-${HEARTLOCK_NAME}"]`).forEach(li => { if (!li.textContent?.trim()) li.textContent = T('lockedBy', HEARTLOCK_NAME); }); } catch {} }, 0);
            return result;
        });
    } catch {}

    // ── PickLock 隱藏 ──
    modApi.hookFunction('DialogMenuButtonBuild', 0, (args, next) => {
        next(args);
        const C = args[0], gn = C?.FocusGroup?.Name;
        const item = gn ? InventoryGet?.(C, gn) : null;
        if (item?.Property?.Name === HEARTLOCK_NAME) {
            for (let i = DialogMenuButton.length - 1; i >= 0; i--)
                if (typeof DialogMenuButton[i] === 'string' && DialogMenuButton[i].startsWith('PickLock')) DialogMenuButton.splice(i, 1);
        }
    });

    // ── InventoryUnlock 攔截 ──
    modApi.hookFunction('InventoryUnlock', 10, (args, next) => {
        if (state._timerUnlocking || state._unlocking) {
            state._unlocking = true; const r = next(args); state._unlocking = false;
            cleanHeartLockProperty(args[0], args[1]);
            return r;
        }
        const C = args[0], itemOrGrp = args[1];
        const item = (itemOrGrp && typeof itemOrGrp === 'object')
        ? itemOrGrp
        : InventoryGet?.(C, typeof itemOrGrp === 'string' ? itemOrGrp : null);
        if (item?.Property?.Name !== HEARTLOCK_NAME) {
            state._unlocking = true; const r = next(args); state._unlocking = false; return r;
        }
        const gn  = item.Asset?.Group?.Name;
        const cfg = getPadlockConfig(C, gn);
        if (cfg && !isAllowedToUnlock(C, cfg)) return;
        // 先通知穿戴者清除 config（避免 ChatRoomSyncCharacter 觸發復原）
        if (cfg) notifyRemove(C, gn);
        state._unlocking = true; const r = next(args); state._unlocking = false;
        cleanHeartLockProperty(C, itemOrGrp);
        return r;
    });

    // ── ChatRoomSyncItem ──
    modApi.hookFunction('ChatRoomSyncItem', 0, (args, next) => {
        state._inServerSync = true;
        const data = args[0], grp = data?.Item?.Group, src = data?.Source;
        if (grp && src && ensureStorage()) {
            const cfg2 = Player.HeartLock?.padlocks?.[grp];
            if (cfg2 && Number(src) === Number(cfg2.owner) && !data?.Item?.Name) { deleteConfig(grp); }
        }
        const result = next(args); state._inServerSync = false;
        return result;
    });

    // 成員進出房間也需要保護，攔截 DialogLeaveFocusItem
    for (const evt of ['ChatRoomSyncMemberJoin', 'ChatRoomSyncMemberLeave']) {
        modApi.hookFunction(evt, 1, (args, next) => {
            state._inServerSync = true;
            const result = next(args);
            state._inServerSync = false;
            return result;
        });
    }

    // ── ChatRoomSyncCharacter ──
    modApi.hookFunction('ChatRoomSyncCharacter', 1, (args, next) => {
        const data = args[0];
        state._inServerSync = true; const result = next(args); state._inServerSync = false;
        if (data?.Character?.MemberNumber !== Player.MemberNumber) return result;
        if (!ensureStorage() || grabStateChar.state) return result;
        const sourceMember = data?.SourceMemberNumber;
        const padlocks = Player.HeartLock?.padlocks ?? {};
        let anyRestored = false;
        for (const gn of Object.keys(padlocks)) {
            const cfg = padlocks[gn], item = InventoryGet?.(Player, gn);
            const broken = !item || item.Property?.Name !== HEARTLOCK_NAME || item.Property?.LockedBy !== HSLOCK_NAME;
            if (broken) {
                // 相依物件未載入而暫掛的部位：不重試、不計入防作弊、不洗版
                if (_pendingRestore.has(gn)) continue;
                if (sourceMember != null && Number(sourceMember) === Number(cfg.owner)) { deleteConfig(gn); continue; }
                if (sourceMember != null && Number(sourceMember) === Player.MemberNumber && Number(cfg.owner) === Player.MemberNumber) { deleteConfig(gn); continue; }
                if (sourceMember != null) {
                    const isELUnlocker = Player.OnlineSharedSettings?.AFC?.lovers
                    ?.some(l => Number(l.memberNumber) === Number(sourceMember)) ?? false;
                    const isBCUnlocker = Player.Lovership
                    ?.some(l => Number(l.MemberNumber) === Number(sourceMember)) ?? false;
                    if (isELUnlocker || isBCUnlocker) { deleteConfig(gn); continue; }
                }
                grabStateChar.count++;
                if (grabStateChar.count === 1) grabStateChar.firstTriggerTime = Date.now();
                if (grabStateChar.count > 3 && Date.now() - grabStateChar.firstTriggerTime < GRAB_WINDOW_MS) {
                    grabStateChar.state = true; grabStateChar.count = 0;
                    try { sendLocalizedAction('hl', 'protectDisabled', [Player.Nickname || Player.Name, HEARTLOCK_NAME]); } catch {}
                    setTimeout(() => { grabStateChar.state = false; grabStateChar.count = 0; }, GRAB_COOLDOWN_MS);
                    return result;
                }
                // 若正在編輯此物品的筆記，只修資料，不動 UI 狀態
                const editingThis = state.panel.noteEditing && gn === state.panel.groupName;
                if (restoreLockFromConfig(gn, cfg, !editingThis) === 'ok') anyRestored = true;
            } else { grabStateChar.count = 0; }
        }
        if (anyRestored) {
            setTimeout(() => {
                try { ChatRoomCharacterUpdate?.(Player); } catch {}
                const now = Date.now();
                if (now - state._lastRestoreMsg > 2000) {
                    state._lastRestoreMsg = now;
                    try { sendLocalizedAction('hl', 'resistRestore', [Player.Nickname || Player.Name, HEARTLOCK_NAME]); } catch {}
                }
            }, 300);
        }
        return result;
    });

    // ── ChatRoomSyncSingle ──
    modApi.hookFunction('ChatRoomSyncSingle', 1, (args, next) => {
        const data = args[0];
        state._inServerSync = true;
        const result = next(args);
        state._inServerSync = false;
        if (data?.Character?.MemberNumber !== Player.MemberNumber) return result;
        if (!ensureStorage() || grabStateSingle.state) return result;
        const sourceMember = data?.SourceMemberNumber;
        const padlocks = Player.HeartLock?.padlocks ?? {};
        let anyRestored = false;
        for (const gn of Object.keys(padlocks)) {
            const cfg = padlocks[gn], item = InventoryGet?.(Player, gn);
            const broken = !item || item.Property?.Name !== HEARTLOCK_NAME || item.Property?.LockedBy !== HSLOCK_NAME;
            if (broken) {
                if (_pendingRestore.has(gn)) continue;
                if (sourceMember != null && Number(sourceMember) === Number(cfg.owner)) { deleteConfig(gn); continue; }
                if (sourceMember != null && Number(sourceMember) === Player.MemberNumber && Number(cfg.owner) === Player.MemberNumber) { deleteConfig(gn); continue; }
                // 授權解鎖者（EL 戀人 / BC 戀人）
                if (sourceMember != null) {
                    const isELUnlocker = Player.OnlineSharedSettings?.AFC?.lovers
                    ?.some(l => Number(l.memberNumber) === Number(sourceMember)) ?? false;
                    const isBCUnlocker = Player.Lovership
                    ?.some(l => Number(l.MemberNumber) === Number(sourceMember)) ?? false;
                    if (isELUnlocker || isBCUnlocker) { deleteConfig(gn); continue; }
                }
                grabStateSingle.count++;
                if (grabStateSingle.count === 1) grabStateSingle.firstTriggerTime = Date.now();
                if (grabStateSingle.count > 3 && Date.now() - grabStateSingle.firstTriggerTime < GRAB_WINDOW_MS) {
                    grabStateSingle.state = true; grabStateSingle.count = 0;
                    try { sendLocalizedAction('hl', 'protectDisabled', [Player.Nickname || Player.Name, HEARTLOCK_NAME]); } catch {}
                    setTimeout(() => { grabStateSingle.state = false; grabStateSingle.count = 0; }, GRAB_COOLDOWN_MS);
                    return result;
                }
                const editingThis2 = state.panel.noteEditing && gn === state.panel.groupName;
                if (restoreLockFromConfig(gn, cfg, !editingThis2) === 'ok') anyRestored = true;
            } else { grabStateSingle.count = 0; }
        }
        if (anyRestored) {
            setTimeout(() => {
                try { ChatRoomCharacterUpdate?.(Player); } catch {}
                const now = Date.now();
                if (now - state._lastRestoreMsg > 2000) {
                    state._lastRestoreMsg = now;
                    try { sendLocalizedAction('hl', 'resistRestore', [Player.Nickname || Player.Name, HEARTLOCK_NAME]); } catch {}
                }
            }, 300);
        }
        return result;
    });

    // ── CharacterReleaseTotal 攔截 ──
    modApi.hookFunction('CharacterReleaseTotal', 10, (args, next) => {
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

    setupOrgasmHook(modApi);
}
