// ════════════════════════════════════════
//  AFC module: profile.js
//  Profile 頁面：拓展戀人列表面板、線上燈號、BC 原生關係燈號
// ════════════════════════════════════════

import {
    PROFILE_BTN_X, PROFILE_BTN_Y, PROFILE_BTN_W, PROFILE_BTN_H, STAGE_COLOR,
    PROFILE_PANEL_X, PROFILE_PANEL_Y, PROFILE_PANEL_W, PROFILE_PANEL_H,
} from '../core/config.js';
import { profilePanelOpen, setProfilePanelOpen, _ownerTextY } from '../core/state.js';
import { getPrivateSettings } from '../core/settings.js';
import { t, stageLabel } from '../i18n/i18n.js';
import { daysSince, formatStartDate } from '../util/util.js';
import { isOnline } from '../net/online.js';

// 每幀繪製時記錄各戀人條目的螢幕矩形，供其他插件（如 FCM）在上面疊按鈕/快速搜尋。
//  透過 window.Liko.AFC.getProfileLoverRegions() 對外公開（見 core-init.js）。
let _loverRegions = [];

/** 「更多戀人」面板目前是否展開中（且在角色資料頁）。 */
export function isPanelOpen() {
    return profilePanelOpen && CurrentScreen === "InformationSheet";
}

/** 面板容器矩形（BC 2000×1000 座標系）。供外部插件知道模態範圍/繪製邊界。 */
export function getPanelRect() {
    return { x: PROFILE_PANEL_X, y: PROFILE_PANEL_Y, w: PROFILE_PANEL_W, h: PROFILE_PANEL_H };
}

/** 目前拓展戀人面板中各條目的位置與資料（唯讀複本）。面板未展開時回傳 []。 */
export function getLoverRegions() {
    if (!profilePanelOpen || CurrentScreen !== "InformationSheet") return [];
    return _loverRegions.map(r => ({ ...r }));
}

export function getCurrentViewingCharacter() {
    try {
        if (typeof InformationSheetCharacter !== 'undefined' && InformationSheetCharacter)
            return InformationSheetCharacter;
        if (typeof InformationSheetSelection !== 'undefined' && InformationSheetSelection) {
            if (typeof InformationSheetSelection === 'number')
                return ChatRoomCharacter?.find(c => c.MemberNumber === InformationSheetSelection) ?? Player;
            return InformationSheetSelection;
        }
    } catch (e) {}
    return Player;
}

function getViewingCharacterAFCLovers() {
    return getCurrentViewingCharacter()?.OnlineSharedSettings?.AFC?.lovers ?? [];
}

export function drawProfileButton() {
    if (CurrentScreen !== "InformationSheet") return;
    const lovers = getViewingCharacterAFCLovers();
    const label  = profilePanelOpen ? t('btnClose') : t('btnOpen', lovers.length);
    DrawButton(PROFILE_BTN_X, PROFILE_BTN_Y, PROFILE_BTN_W, PROFILE_BTN_H,
               label, "White", "", "Extended Lover List");
}

// 格式化戀人名稱行（無 #、無 stage）
function formatLoverNameLine(l) {
    return `♥ ${l.name} (${l.memberNumber})`;
}

// 格式化時間行（stage 在此顯示，使用本地化標籤）
// startDate = 整段關係起始（不變）
// stageDate = 當前階段起始（升格時更新）
function formatLoverDateLine(l, priv) {
    const tag = `[${stageLabel(l.stage)}]`;
    const stageStart = l.stageDate ?? l.startDate;
    if (priv?.displayMode === "date") {
        // 日期模式：顯示整段關係起始日
        return `${tag} ${formatStartDate(l.startDate)}`;
    }
    // 時長模式：顯示當前階段天數
    return `${tag} ${daysSince(stageStart)}天`;
}

export function drawProfilePanel() {
    _loverRegions = [];
    if (!profilePanelOpen || CurrentScreen !== "InformationSheet") return;
    const lovers    = getViewingCharacterAFCLovers();
    const priv      = getPrivateSettings();
    const isOwnProfile = getCurrentViewingCharacter()?.MemberNumber === Player.MemberNumber;

    // ── 面板座標（共用常數，見 core/config.js）──────────────────
    const PX = PROFILE_PANEL_X, PY = PROFILE_PANEL_Y, PW = PROFILE_PANEL_W, PH = PROFILE_PANEL_H;

    // 面板背景（clip 確保不被 BC dots 穿透）
    MainCanvas.save();
    MainCanvas.beginPath();
    if (MainCanvas.roundRect) MainCanvas.roundRect(PX, PY, PW, PH, 10);
    else MainCanvas.rect(PX, PY, PW, PH);
    MainCanvas.clip();
    MainCanvas.fillStyle = "rgba(12,4,28,0.93)";
    MainCanvas.fillRect(PX, PY, PW, PH);
    MainCanvas.restore();

    // 邊框（桃紅色）
    MainCanvas.save();
    MainCanvas.strokeStyle = "#E8618C";
    MainCanvas.lineWidth   = 2;
    MainCanvas.beginPath();
    if (MainCanvas.roundRect) MainCanvas.roundRect(PX, PY, PW, PH, 10);
    else MainCanvas.rect(PX, PY, PW, PH);
    MainCanvas.stroke();
    MainCanvas.restore();

    // 標題
    DrawText(t('panelTitle'), 1160, 180, "White", "");

    if (lovers.length === 0) {
        DrawText(t('panelEmpty'), 1160, 400, "#888", "");
        return;
    }

    // ── 行座標（依最新 profile.txt icons + text boxes）────────
    // 每個 entry: name line, dot, date line
    const NAME_Y = [235, 350, 465, 580, 695];   // centerY of name text
    const DATE_Y = [285, 400, 515, 630, 745];   // centerY of date text
    const DOT_Y  = [260, 375, 490, 605, 720];   // centerY of dot icon
    const DOT_R  = 6;
    const showDot = isOwnProfile && (priv?.showOnlineStatus !== false);

    function drawEntry(l, col, row) {
        const textX = col === 0 ? 590 : 1210;
        const maxW  = col === 0 ? 540 : 490;   // 右欄限制到 1700
        const dotX  = col === 0 ? 565 : 1185;
        const nY    = NAME_Y[row];
        const dY    = DATE_Y[row];
        const oY    = DOT_Y[row];
        const color = STAGE_COLOR[l.stage] ?? "#FFB6C1";

        // 燈號
        if (showDot) {
            const online = isOnline(l.memberNumber);
            MainCanvas.save();
            MainCanvas.beginPath();
            MainCanvas.arc(dotX, oY, DOT_R, 0, Math.PI * 2);
            MainCanvas.fillStyle = online ? "#4CAF50" : "#444";
            if (online) { MainCanvas.shadowColor = "#4CAF50"; MainCanvas.shadowBlur = 8; }
            MainCanvas.fill();
            MainCanvas.restore();
        }

        const prevAlign = MainCanvas.textAlign;
        MainCanvas.textAlign = "left";
        DrawTextFit(formatLoverNameLine(l), textX, nY, maxW, color);
        DrawTextFit(formatLoverDateLine(l, priv), textX, dY, maxW, "rgba(190,190,190,0.75)");
        MainCanvas.textAlign = prevAlign;

        // 記錄此條目的螢幕矩形（涵蓋名稱＋日期兩行），供外部插件疊按鈕
        _loverRegions.push({
            memberNumber: l.memberNumber, name: l.name, stage: l.stage,
            col, row,
            x: textX, y: nY - 26, w: maxW, h: (dY + 20) - (nY - 26),
        });
    }

    lovers.forEach((l, i) => {
        const col = i < 5 ? 0 : 1;
        const row = i % 5;
        if (row < NAME_Y.length) drawEntry(l, col, row);
    });
}

export function handleProfileClick() {
    if (CurrentScreen !== "InformationSheet") return;
    if (MouseIn(PROFILE_BTN_X, PROFILE_BTN_Y, PROFILE_BTN_W, PROFILE_BTN_H))
        setProfilePanelOpen(!profilePanelOpen);
}

// ════════════════════════════════════════
//  BC 原生關係燈號
//  位置依 bc.txt 設計稿（有昵稱+稱號時）：
//    主人 dot: (515, 685)；原生戀人 dots: (1165, 230/380/530/680/830)
// ════════════════════════════════════════

/**
 * 根據 BC InformationSheet.js 原始碼計算主人燈號的正確 Y 座標
 * BASE_Y = 685（bc.txt，有昵稱+稱號時）+ 25 = 710
 * 每缺一項向上移 55px（InformationSheet.js spacing = 55）
 */
function calcOwnerDotY(C) {
    const BASE_Y  = 710;
    const SPACING = 55;
    try {
        // 與 BC 原始碼相同的判斷方式
        const hasNick  = typeof CharacterNickname === 'function'
        ? C.Name !== CharacterNickname(C)
        : !!(C.Nickname && C.Nickname !== C.Name);
        const hasTitle = typeof TitleGet === 'function'
        ? TitleGet(C) !== "None"
        : !!(C.Title);
        let y = BASE_Y;
        if (!hasNick)  y -= SPACING;
        if (!hasTitle) y -= SPACING;
        return y;
    } catch {
        return BASE_Y;
    }
}

export function drawBCRelationDots(C) {
    const priv = getPrivateSettings();
    if (!priv?.showOnlineStatus) return;

    function dot(cx, cy, memberNumber) {
        if (!memberNumber) return;
        const online = isOnline(memberNumber);
        MainCanvas.save();
        MainCanvas.beginPath();
        MainCanvas.arc(cx, cy, 6, 0, Math.PI * 2);
        MainCanvas.fillStyle = online ? "#4CAF50" : "#444";
        if (online) { MainCanvas.shadowColor = "#4CAF50"; MainCanvas.shadowBlur = 8; }
        MainCanvas.fill();
        MainCanvas.restore();
    }

    if (C.Ownership?.MemberNumber) {
        const ownerY = (_ownerTextY != null ? _ownerTextY : calcOwnerDotY(C)) + 25;
        dot(515, ownerY, C.Ownership.MemberNumber);
    }

    // BC 原生戀人（最多5個）
    const loverY = [230, 380, 530, 680, 830];
    (C.Lovership ?? []).forEach((l, i) => {
        if (i < loverY.length) dot(1165, loverY[i], l.MemberNumber);
    });
}
