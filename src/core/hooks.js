// ════════════════════════════════════════
//  AFC module: hooks.js
//  modApi.hookFunction + ServerSocket listeners
// ════════════════════════════════════════

import {
    AFC_BEEP_TYPE, BEEP, STAGE_COLOR, PROFILE_BTN_X, PROFILE_BTN_Y, PROFILE_BTN_W, PROFILE_BTN_H,
    PROFILE_PANEL_X, PROFILE_PANEL_Y, PROFILE_PANEL_W, PROFILE_PANEL_H,
} from './config.js';
import {
    modApi, AFCLockAccessOn, loversPrivateRoom, profilePanelOpen,
    setProfilePanelOpen, setProfilePageFresh, profilePageFresh,
    setLastOnlineFetch, setOwnerTextY, setInInfoSheet, _inInfoSheet,
    currentPrivateRoomName, setCurrentPrivateRoomName,
} from './state.js';
import { getSharedSettings } from './settings.js';
import { stageLabel } from '../i18n/i18n.js';
import { registerSocketListener } from './socket.js';
import { injectAFCDialogs } from '../relations/dialog.js';
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

export function setupHooks() {
    // ── 好友清單：AFC 戀人顯示為戀人關係（優先 BCT Best Friend）──────
    modApi.hookFunction('FriendListLoadFriendList', 3, async (args, next) => {
        await next(args);   // 等 BC + BCT（priority 2）都執行完

        const lovers = getSharedSettings()?.lovers ?? [];
        if (!lovers.length) return;

        // 取得好友列表容器（相容 R128）
        const containerId = (typeof FriendListIDs !== 'undefined' && FriendListIDs.friendList)
        ?? 'FriendListContent';
        const container = document.getElementById(containerId);
        if (!container) return;

        const rows = container.getElementsByClassName('friend-list-row');
        for (let i = 0; i < rows.length; i++) {
            const memberEl = rows[i].querySelector('.MemberNumber');
            const relEl    = rows[i].querySelector('.RelationType');
            if (!memberEl || !relEl) continue;

            const num   = parseInt(memberEl.innerText.trim());
            const lover = lovers.find(l => Number(l.memberNumber) === num);
            if (!lover) continue;

            const label = `♥ ${stageLabel(lover.stage)}`;

            // 覆蓋文字節點（如 BCT 改過也會被我們蓋掉）
            const textNode = Array.from(relEl.childNodes)
            .find(n => n.nodeType === Node.TEXT_NODE);
            if (textNode) textNode.textContent = label;
            else relEl.prepend(document.createTextNode(label));

            // 套用階段顏色
            relEl.style.color = STAGE_COLOR[lover.stage] ?? '#FFB6C1';
        }
    });
    const injectNow = () => {
        try { if (CurrentCharacter) injectAFCDialogs(CurrentCharacter); } catch (e) {}
    };
    modApi.hookFunction("ChatRoomCharacterViewDraw", 1, (args, next) => { const r = next(args); injectNow(); return r; });
    modApi.hookFunction("ChatRoomMenuDraw", 1, (args, next) => { const r = next(args); injectNow(); return r; });
    setInterval(injectNow, 1000);

    // ── Profile 頁面 ────────────────────────────────────────────
    // DrawTextFit hook：攔截 BC 的主人文字，取得精確 Y 座標作為備用
    modApi.hookFunction("DrawTextFit", 0, (args, next) => {
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
    modApi.hookFunction("InformationSheetRun", 7, (args, next) => {
        // 面板展開且滑鼠落在面板範圍內 → next() 期間暫時把滑鼠座標移出畫面，
        //  讓面板底下的原生元素不觸發 hover/tooltip（面板視為模態，避免戀人資訊
        //  被底層 tooltip 遮住）。next() 後（含例外路徑）務必還原滑鼠座標。
        let _mx, _my, _masked = false;
        try {
            setOwnerTextY(null);
            setInInfoSheet(true);
            if (profilePanelOpen && CurrentScreen === "InformationSheet"
                && MouseX >= PROFILE_PANEL_X && MouseX <= PROFILE_PANEL_X + PROFILE_PANEL_W
                && MouseY >= PROFILE_PANEL_Y && MouseY <= PROFILE_PANEL_Y + PROFILE_PANEL_H) {
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
    modApi.hookFunction("InformationSheetClick", 5, (args, next) => {
        try {
            // 面板展開且點擊落在面板內（非我們的按鈕）→ 視為模態：吃掉點擊，
            //  不關閉面板、也不傳遞給底層元素（避免誤選底下的原生關係等）。
            if (profilePanelOpen && CurrentScreen === "InformationSheet"
                && MouseIn(PROFILE_PANEL_X, PROFILE_PANEL_Y, PROFILE_PANEL_W, PROFILE_PANEL_H)
                && !MouseIn(PROFILE_BTN_X, PROFILE_BTN_Y, PROFILE_BTN_W, PROFILE_BTN_H)) {
                return;   // 模態：消化點擊
            }
            // 任何非我們按鈕的點擊都關閉面板（包含點 BCX 按鈕）
            if (!MouseIn(PROFILE_BTN_X, PROFILE_BTN_Y, PROFILE_BTN_W, PROFILE_BTN_H)) {
                setProfilePanelOpen(false);
            }
            handleProfileClick();
        } catch (e) {}
        return next(args);
    });
    modApi.hookFunction("InformationSheetExit", 5, (args, next) => {
        setProfilePanelOpen(false);
        setProfilePageFresh(false);
        return next(args);
    });

    // ── 解鎖權限 ────────────────────────────────────────────────
    modApi.hookFunction("DialogCanUnlock", 5, (args, next) => {
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
        } catch (e) {}
    });

    // ── 房間同步 ────────────────────────────────────────────────
    registerSocketListener("ChatRoomSync", () => {
        setTimeout(() => {
            syncWithOnlineLovers();
            if (ChatRoomData?.Private) {
                setCurrentPrivateRoomName(ChatRoomData.Name);
                broadcastRoomNameToLovers();
            }
            // 廣播 AFC 資料給房間內玩家（EBC 等環境下伺服器同步可能失效）
            broadcastAFCData();
        }, 600);
        // 房內角色的 OnlineSharedSettings 載入後做雙向對帳，自動補齊不對稱
        setTimeout(() => { try { reconcileWithRoom(); } catch (e) {} }, 1800);
    });

    registerSocketListener("ChatRoomMessage", (data) => {
        if (handleAFCSyncData(data)) return;

        // 同房間 AFC Beep（Hidden 主要通道，跨伺服器可靠）
        if (data?.Type === "Hidden" && data?.Content === "AFC::Beep") {
            const e = data.Dictionary?.find(d => d.Tag === "AFC::Beep");
            if (e && Number(e.TargetMember) === Number(Player.MemberNumber)) {
                try {
                    parseBeep({
                        MemberNumber: data.Sender,
                        MemberName:   data.SenderName ?? `#${data.Sender}`,
                        BeepType:     AFC_BEEP_TYPE,
                        Message:      e.MsgType,
                        ...e,
                    });
                } catch (err) { console.error("🐈‍⬛ [AFC] ❌ Hidden beep 失敗:", err.message); }
            }
            return;
        }

        if (data?.Type === "RoomUpdate" && ChatRoomData?.Private) {
            if (ChatRoomData.Name !== currentPrivateRoomName) {
                setCurrentPrivateRoomName(ChatRoomData.Name);
                broadcastRoomNameToLovers();
            }
        }
    });

    // ── 好友列表：填入私人房間名 ────────────────────────────────
    modApi.hookFunction("FriendListLoadFriendList", 5, (args, next) => {
        try {
            for (const friend of args[0] ?? []) {
                if (friend.Private && friend.ChatRoomName === null && loversPrivateRoom[friend.MemberNumber]) {
                    friend.ChatRoomName  = loversPrivateRoom[friend.MemberNumber].ChatRoomName;
                    friend.ChatRoomSpace = loversPrivateRoom[friend.MemberNumber].ChatRoomSpace;
                }
            }
        } catch (e) {}
        return next(args);
    });

    // ── 離線撤銷授權 ────────────────────────────────────────────
    modApi.hookFunction("ServerDisconnect", 5, (args, next) => {
        try { for (const num of AFCLockAccessOn) sendBeep(num, BEEP.LOCK_ACCESS_OFF); } catch (e) {}
        return next(args);
    });

    // ── 離開私人房：通知戀人移除已分享的房名 ─────────────────────
    modApi.hookFunction("ChatRoomLeave", 5, (args, next) => {
        try { if (ChatRoomData?.Private) clearSharedRoomName(); } catch (e) {}
        setCurrentPrivateRoomName("");
        return next(args);
    });

    console.log("🐈‍⬛ [AFC] ✅ Hooks 設置完成");
}
