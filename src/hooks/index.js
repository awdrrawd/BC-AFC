// ════════════════════════════════════════
//  AFC hooks 與共用訊息通道入口
// ════════════════════════════════════════

import {
    AFC_BEEP_TYPE, BEEP, PROFILE_BTN_X, PROFILE_BTN_Y, PROFILE_BTN_W, PROFILE_BTN_H,
    PROFILE_PANEL_X, PROFILE_PANEL_Y, PROFILE_PANEL_W, PROFILE_PANEL_H,
} from '../core/config.js';
import {
    AFCLockAccessOn, loversPrivateRoom, profilePanelOpen,
    setProfilePanelOpen, setProfilePageFresh, profilePageFresh,
    setLastOnlineFetch, setOwnerTextY, setInInfoSheet, _inInfoSheet,
    currentPrivateRoomName, setCurrentPrivateRoomName,
} from '../core/state.js';
import { registerSocketListener } from '../core/socket.js';
import {
    getCurrentViewingCharacter, drawProfileButton, drawProfilePanel,
    drawBCRelationDots, handleProfileClick,
} from '../ui/profile.js';
import { refreshOnlineFriends, syncWithOnlineLovers } from '../net/online.js';
import { sendBeep } from '../net/beep.js';
import { parseBeep } from '../net/beep-router.js';
import { parseAccountBeep, broadcastRoomNameToLovers, clearSharedRoomName } from '../net/roomname.js';
import { broadcastAFCData, handleAFCSyncData } from '../net/sync-data.js';
import { handleBCLoverProposal } from '../relations/breakup.js';
import { reconcileWithRoom } from '../relations/reconcile.js';
import { installRelationshipVisualHooks, installRelationshipDialogHooks, decorateFriendList } from './relationship-visual.js';
import { handleHidden } from '../heartlock/net.js';
import { state as heartLockState } from '../heartlock/state.js';
import { localizeChatRoomMessage } from '../i18n/l10n.js';
import { HL_PANEL_ID } from '../heartlock/config.js';
import { removeHLPanel } from '../heartlock/panel.js';
import { ensureStorage as ensureHeartLockStorage } from '../heartlock/storage.js';
import { dispatchChatRoomMessage } from './chat-message-channel.js';

export function setupHooks(registry) {
    const { hook } = registry;
    installRelationshipVisualHooks(registry);
    installRelationshipDialogHooks(registry);

    // ── Profile 頁面 ────────────────────────────────────────────
    // DrawTextFit hook：攔截 BC 的主人文字，取得精確 Y 座標作為備用
    hook("DrawTextFit", 0, (args, next) => {
        if (_inInfoSheet) {
            const text = String(args[0] ?? "");
            const y    = args[2];
            if (typeof y === 'number' && y > 400) {
                const C = getCurrentViewingCharacter();
                const ownerNum = C?.Ownership?.MemberNumber;
                if (ownerNum && text.includes(String(ownerNum))) {
                    setOwnerTextY(y);
                }
            }
        }
        return next(args);
    });

    // 優先序刻意 < 10：接管角色資料頁的工具（如 BCX gui.ts）會用 priority 10 hook
    // InformationSheetRun，子頁開啟時直接 return（不呼叫 next）→ 短路整條 hook 鏈。
    // 我們掛在較低優先序，一旦有工具接管畫面就自然被跳過、不繪製 → 自動隱藏，
    // 完全不需依賴任何第三方工具的 API（如 bcx.inBcxSubscreen）。原生第二層畫面
    // 則另以 InformationSheetSecondScreen 判斷。
    hook("InformationSheetRun", 7, (args, next) => {
        // 面板展開且滑鼠落在「面板矩形內」→ next() 期間把滑鼠移出畫面，讓面板「後方」
        //  priority < 7 的原生關係文字等不觸發 hover/tooltip（避免戀人資訊被底層 tooltip
        //  遮住）。只作用在面板範圍內：面板外（角色、右側按鈕等）hover 一切照常。
        //  我們自己的面板/按鈕在 next() 後（滑鼠已還原）才畫，不受影響；FCM 疊在戀人
        //  條目上的按鈕請掛 priority > 7（本 hook 之外、滑鼠已還原）→ 正常可互動。
        //  next() 後（含例外路徑）務必還原滑鼠座標。
        const _panelModal = profilePanelOpen && CurrentScreen === "InformationSheet"
            && !(typeof InformationSheetSecondScreen !== 'undefined' && InformationSheetSecondScreen)
            && MouseX >= PROFILE_PANEL_X && MouseX <= PROFILE_PANEL_X + PROFILE_PANEL_W
            && MouseY >= PROFILE_PANEL_Y && MouseY <= PROFILE_PANEL_Y + PROFILE_PANEL_H;
        let _mx, _my, _masked = false;
        try {
            setOwnerTextY(null);
            setInInfoSheet(true);
            if (_panelModal) {
                _mx = MouseX; _my = MouseY; MouseX = -9999; MouseY = -9999; _masked = true;
            }
            const r = next(args);
            if (_masked) { MouseX = _mx; MouseY = _my; _masked = false; }
            setInInfoSheet(false);

            if (CurrentScreen !== "InformationSheet") return r;
            if (typeof InformationSheetSecondScreen !== 'undefined' && InformationSheetSecondScreen) {
                setProfilePanelOpen(false);
                return r;
            }

            if (!profilePageFresh) {
                setProfilePageFresh(true);
                setLastOnlineFetch(0);
                refreshOnlineFriends().catch(() => {});
            }

            const C = getCurrentViewingCharacter();
            if (C?.MemberNumber === Player.MemberNumber) drawBCRelationDots(C);
            drawProfileButton();
            drawProfilePanel();
            return r;
        } catch (e) {
            if (_masked) { MouseX = _mx; MouseY = _my; }
            setInInfoSheet(false);
            console.error("🐈‍⬛ [AFC] ❌ InformationSheetRun:", e.message);
            return next(args);
        }
    });
    // 優先序 7（＞ FCM 主按鈕的 5）：面板展開時，落在「面板矩形內」的點擊由本 hook
    //  吃掉（不呼叫 next）→ 點不到面板後方的原生關係等；面板外（角色、右側按鈕、
    //  FCM 主按鈕等）照常傳遞。FCM 疊在戀人條目上的按鈕請掛 priority > 7，會在本
    //  hook 之前處理 → 正常可點。
    hook("InformationSheetClick", 7, (args, next) => {
        try {
            const panelModal = profilePanelOpen && CurrentScreen === "InformationSheet"
                && !(typeof InformationSheetSecondScreen !== 'undefined' && InformationSheetSecondScreen);
            if (panelModal
                && MouseIn(PROFILE_PANEL_X, PROFILE_PANEL_Y, PROFILE_PANEL_W, PROFILE_PANEL_H)
                && !MouseIn(PROFILE_BTN_X, PROFILE_BTN_Y, PROFILE_BTN_W, PROFILE_BTN_H)) {
                return;   // 面板區塊內：消化點擊，不傳遞給後方元素
            }
            // 面板外的點擊（非我們的按鈕）→ 收起面板（維持原本行為），但仍照常傳遞。
            if (!MouseIn(PROFILE_BTN_X, PROFILE_BTN_Y, PROFILE_BTN_W, PROFILE_BTN_H)) {
                setProfilePanelOpen(false);
            }
            handleProfileClick();
        } catch {}
        return next(args);
    });
    hook("InformationSheetExit", 10, (args, next) => {
        if (document.getElementById(HL_PANEL_ID)) { removeHLPanel(); return; }
        setProfilePanelOpen(false);
        setProfilePageFresh(false);
        return next(args);
    });

    // ── 解鎖權限 ────────────────────────────────────────────────
    hook("DialogCanUnlock", 5, (args, next) => {
        try {
            const C = args[0], item = args[1];
            if (!C || !item?.Property) return next(args);
            const lb = item.Property.LockedBy;
            if (lb === "AFCLoveLock" || lb === "AFCTimerLock")
                return C.ID !== 0 && AFCLockAccessOn.has(C.MemberNumber);
        } catch (e) { console.error("🐈‍⬛ [AFC] ❌ DialogCanUnlock:", e.message); }
        return next(args);
    });

    // ── AccountBeep（跨房房名分享 + BC 原生戀人申請美化通知）──────
    registerSocketListener("AccountBeep", (data) => {
        try {
            if (data?.BeepType === "Lovers") { handleBCLoverProposal(data); return; }
            parseAccountBeep(data);
        } catch {}
    });

    // ── 房間同步 ────────────────────────────────────────────────
    hook("ChatRoomSync", 0, (args, next) => {
        const result = next(args);
        setTimeout(() => {
            ensureHeartLockStorage();
            syncWithOnlineLovers();
            if (ChatRoomData?.Private) {
                setCurrentPrivateRoomName(ChatRoomData.Name);
                broadcastRoomNameToLovers();
            }
            // 廣播 AFC 資料給房間內玩家（EBC 等環境下伺服器同步可能失效）
            broadcastAFCData();
        }, 600);
        // 房內角色的 OnlineSharedSettings 載入後做雙向對帳，自動補齊不對稱
        setTimeout(() => { try { reconcileWithRoom(); } catch {} }, 1800);
        return result;
    });

    // ChatRoomMessage 只 hook 一次；各功能在這個入口依序處理。
    hook("ChatRoomMessage", 5, (args, next) => {
        const data = args[0];
        heartLockState.operations.serverSync = true;
        try {
            localizeChatRoomMessage(data);
            handleHidden(data);
            handleAFCSyncData(data);
            dispatchChatRoomMessage(data);

            // 同房間 AFC Beep（Hidden 主要通道，跨伺服器可靠）
            if (data?.Type === "Hidden" && data?.Content === "AFC::Beep") {
                const e = data.Dictionary?.find(d => d.Tag === "AFC::Beep");
                if (e && Number(e.TargetMember) === Number(Player.MemberNumber)) {
                    parseBeep({
                        MemberNumber: data.Sender,
                        MemberName:   data.SenderName ?? `#${data.Sender}`,
                        BeepType:     AFC_BEEP_TYPE,
                        Message:      e.MsgType,
                        ...e,
                    });
                }
            }

            if (data?.Type === "RoomUpdate" && ChatRoomData?.Private
                && ChatRoomData.Name !== currentPrivateRoomName) {
                    setCurrentPrivateRoomName(ChatRoomData.Name);
                    broadcastRoomNameToLovers();
            }
        } catch (error) {
            console.error("🐈‍⬛ [AFC] ChatRoomMessage handler failed:", error);
        } finally {
            heartLockState.operations.serverSync = false;
        }
        return next(args);
    });

    // ── 好友列表：填入私人房間名 ────────────────────────────────
    hook("FriendListLoadFriendList", 5, async (args, next) => {
        try {
            for (const friend of args[0] ?? []) {
                // 私人房時伺服器可能回傳 ChatRoomName 為 null 或省略（undefined）→ 一律以 falsy 判斷
                if (friend.Private && !friend.ChatRoomName && loversPrivateRoom[friend.MemberNumber]) {
                    friend.ChatRoomName  = loversPrivateRoom[friend.MemberNumber].ChatRoomName;
                    friend.ChatRoomSpace = loversPrivateRoom[friend.MemberNumber].ChatRoomSpace;
                }
            }
        } catch {}
        const result = await next(args);
        decorateFriendList();
        return result;
    });

    // ── 離線撤銷授權 ────────────────────────────────────────────
    hook("ServerDisconnect", 5, (args, next) => {
        try { for (const num of AFCLockAccessOn) sendBeep(num, BEEP.LOCK_ACCESS_OFF); } catch {}
        return next(args);
    });

    // ── 離開私人房：通知戀人移除已分享的房名 ─────────────────────
    hook("ChatRoomLeave", 5, (args, next) => {
        try { if (ChatRoomData?.Private) clearSharedRoomName(); } catch {}
        setCurrentPrivateRoomName("");
        return next(args);
    });

    console.log("🐈‍⬛ [AFC] ✅ Hooks 設置完成");
}
