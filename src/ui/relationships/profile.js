// ════════════════════════════════════════
//  AFC module: profile.js
//  Profile 頁面：拓展戀人列表面板、線上燈號、BC 原生關係燈號
// ════════════════════════════════════════

import {
    PROFILE_BTN_X, PROFILE_BTN_Y, PROFILE_BTN_W, PROFILE_BTN_H, STAGE_COLOR,
    PROFILE_PANEL_X, PROFILE_PANEL_Y, PROFILE_PANEL_W, PROFILE_PANEL_H,
} from '../../core/config.js';
import { profilePanelOpen, setProfilePanelOpen } from '../../core/state.js';
import { getPrivateSettings, getSharedSettings } from '../../core/settings.js';
import { t, stageLabel } from '../../i18n/i18n.js';
import { daysSince, formatStartDate } from '../../util/util.js';
import { isOnline } from '../../net/online.js';

// 每幀繪製時記錄各戀人條目的螢幕矩形，供其他插件（如 FCM）在上面疊按鈕/快速搜尋。
//  透過 window.Liko.AFC.getProfileLoverRegions() 對外公開（見 core-init.js）。
let _loverRegions = [];
let profilePage = 0;
let pageCharacter = null;
const PAGE_SIZE = 10;
const PAGE_BUTTON = { x: 1750, y: 180, w: 80, h: 40 };
const NEXT_PAGE_SVG = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="40" viewBox="0 0 80 40"><path d="M4 2 L76 20 L4 38 Z" fill="#E8618C" stroke="#FFB6C1" stroke-width="2" stroke-linejoin="round"/></svg>');

function currentPage(lovers) {
    const character = getCurrentViewingCharacter()?.MemberNumber ?? null;
    if (character !== pageCharacter) { pageCharacter = character; profilePage = 0; }
    profilePage = Math.min(profilePage, Math.max(0, Math.ceil(lovers.length / PAGE_SIZE) - 1));
    return profilePage;
}

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
    if (typeof InformationSheetSelection === 'undefined' || !InformationSheetSelection) return null;
    if (typeof InformationSheetSelection === 'object') return InformationSheetSelection;
    if (InformationSheetSelection === Player?.MemberNumber) return Player;
    return (typeof ChatRoomCharacter !== 'undefined' ? ChatRoomCharacter : [])
        ?.find(c => c.MemberNumber === InformationSheetSelection) ?? null;
}

function getViewingCharacterAFCLovers() {
    const character = getCurrentViewingCharacter();
    if (!character) return [];
    if (character.MemberNumber === Player?.MemberNumber) return getSharedSettings()?.lovers ?? [];
    const data = character.OnlineSharedSettings?.AFC;
    if (data?.memberNumber != null && data.memberNumber !== character.MemberNumber) return [];
    return Array.isArray(data?.lovers) ? data.lovers : [];
}

// ════════════════════════════════════════
//  DOM 呈現
//  BC 的資訊頁已改成 HTML 畫面（#information-sheet-screen）並蓋在畫布之上：
//  畫在 MainCanvas 的按鈕/面板會被蓋住且點不到，所以按鈕與面板改成 DOM 元素，
//  仍沿用 BC 2000×1000 座標（ElementPositionFixed 會依畫布縮放換算）。
// ════════════════════════════════════════

const BTN_ID = 'afc-profile-button';
const PANEL_ID = 'afc-profile-panel';
const STYLE_ID = 'afc-profile-style';
const PROFILE_CSS = `
#${BTN_ID},#${PANEL_ID},#${PANEL_ID} *{user-select:none;-webkit-user-select:none;}
/* 配色吃 LCE 主題的 CSS 變數（:root 上的 --lce-*）；沒裝主題時退回原本的白底黑字 */
#${BTN_ID}{z-index:30;box-sizing:border-box;display:flex;align-items:center;justify-content:center;margin:0;padding:0 .2em;overflow:hidden;white-space:nowrap;
  background:var(--lce-element,#fff);color:var(--lce-text,#000);border:var(--border-width,2px) solid var(--lce-accent,#000);font-weight:600;line-height:1.1;text-align:center;cursor:pointer;}
#${BTN_ID}:hover,#${BTN_ID}:focus-visible{background:var(--lce-element-hover,#ffff88);border-color:var(--lce-accent-hover,#000);}
#${PANEL_ID}{z-index:29;box-sizing:border-box;background:rgba(12,4,28,.93);border:2px solid #E8618C;border-radius:10px;color:#fff;}
#${PANEL_ID} .afc-profile-title,#${PANEL_ID} .afc-profile-empty{display:flex;align-items:center;justify-content:center;text-align:center;margin:0;}
#${PANEL_ID} .afc-profile-empty{color:#888;}
#${PANEL_ID} .afc-lover{position:relative;box-sizing:border-box;margin:0;overflow:visible;}
#${PANEL_ID} .afc-lover-name{margin:0;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;line-height:1.5;}
/* 日期行是 flex：左側文字可截斷、右側留給其他插件（如 FCM 的搜尋圖示）附加 */
#${PANEL_ID} .afc-lover-date{display:flex;align-items:center;margin:0;overflow:visible;white-space:nowrap;font-size:.85em;line-height:1.5;color:rgba(190,190,190,.75);}
#${PANEL_ID} .afc-lover-date-text{flex:0 1 auto;min-width:0;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;}
#${PANEL_ID} .afc-lover-dot{position:absolute;left:-.95em;top:50%;width:.5em;height:.5em;margin-top:-.25em;border-radius:50%;background:#444;}
#${PANEL_ID} .afc-lover-dot[data-online="1"]{background:#4CAF50;box-shadow:0 0 .5em #4CAF50;}
#${PANEL_ID} .afc-profile-next{box-sizing:border-box;margin:0;padding:0;border:0;background:none;cursor:pointer;}
#${PANEL_ID} .afc-profile-next img{display:block;width:100%;height:100%;}
#${PANEL_ID} .afc-profile-next:hover,#${PANEL_ID} .afc-profile-next:focus-visible{filter:brightness(1.25);}
/* BC 原生主人／戀人列前的線上燈號（跟著文字走） */
.afc-relation-dot{display:inline-block;flex:none;width:.5em;height:.5em;margin-right:.4em;border-radius:50%;vertical-align:.08em;background:#444;box-shadow:0 0 0 1px rgba(255,255,255,.2);user-select:none;-webkit-user-select:none;}
.afc-relation-dot[data-online="1"]{background:#4CAF50;box-shadow:0 0 .5em #4CAF50;}
#${PANEL_ID} .afc-profile-page{display:flex;align-items:center;justify-content:center;margin:0;font-size:.8em;color:#E8618C;}
`;

const domReady = () => typeof document !== 'undefined' && !!document.body;

function place(el, x, y, w, h) {
    if (typeof ElementPositionFixed === 'function') ElementPositionFixed(el, x, y, w, h);
}

// 以 BC 畫布單位設定字級（ElementPositionFixed 預設的字級會隨視窗放大，按鈕/條目容易爆框）
function setFont(el, size) {
    if (typeof ElementSetFontSize === 'function') ElementSetFontSize(el, size);
}

// 等同畫布版 DrawTextFit：內容超出可用寬度時等比例縮小字級（需已掛上 DOM 並設好寬度）
function fitFont(el, textEl = el, availW = el.clientWidth, minRatio = 0.55) {
    const w = textEl.scrollWidth;
    if (!availW || !w || w <= availW) return;
    const fs = parseFloat(getComputedStyle(el).fontSize);
    if (fs) el.style.fontSize = `${fs * Math.max(minRatio, availW / w)}px`;
}

function canvasSig() {
    const cv = typeof MainCanvas !== 'undefined' ? MainCanvas?.canvas : null;
    return cv ? `${cv.clientWidth}x${cv.clientHeight}@${cv.offsetLeft},${cv.offsetTop}` : '';
}

function ensureProfileStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const st = document.createElement('style');
    st.id = STYLE_ID;
    st.textContent = PROFILE_CSS;
    document.head.appendChild(st);
}

function div(cls, text) {
    const el = document.createElement('div');
    if (cls) el.className = cls;
    if (text != null) el.textContent = text;
    return el;
}

// 面板展開時，點到面板與按鈕以外的地方就收起（維持原本行為）
function onOutsidePointerDown(ev) {
    const target = ev.target;
    if (target?.closest?.(`#${PANEL_ID}, #${BTN_ID}`)) return;
    setProfilePanelOpen(false);
    removePanelDom();
}
let _outsideBound = false;
function bindOutsideClose(on) {
    if (on === _outsideBound || !domReady()) return;
    _outsideBound = on;
    if (on) document.addEventListener('pointerdown', onOutsidePointerDown, true);
    else document.removeEventListener('pointerdown', onOutsidePointerDown, true);
}

function removePanelDom() {
    bindOutsideClose(false);
    if (domReady()) document.getElementById(PANEL_ID)?.remove();
}

/** 移除按鈕與面板的 DOM（離開資料頁時呼叫）。 */
export function removeProfileDom() {
    removePanelDom();
    if (domReady()) document.getElementById(BTN_ID)?.remove();
}

/** 展開／收起「更多戀人」面板。 */
export function toggleProfilePanel() {
    profilePage = 0;
    _loverRegions = [];
    setProfilePanelOpen(!profilePanelOpen);
    if (!profilePanelOpen) removePanelDom();
}

/** 面板翻到下一頁（只有一頁時回傳 false）。 */
export function nextProfilePage() {
    const lovers = getViewingCharacterAFCLovers();
    if (lovers.length <= PAGE_SIZE) return false;
    profilePage = (currentPage(lovers) + 1) % Math.ceil(lovers.length / PAGE_SIZE);
    _loverRegions = [];
    return true;
}

export function drawProfileButton() {
    if (CurrentScreen !== "InformationSheet") { removeProfileDom(); return; }
    if (!domReady()) return;
    const lovers = getViewingCharacterAFCLovers();
    const label  = profilePanelOpen ? t('btnClose') : t('btnOpen', lovers.length);
    ensureProfileStyle();
    let btn = document.getElementById(BTN_ID);
    if (!btn) {
        btn = document.createElement('button');
        btn.id = BTN_ID;
        btn.type = 'button';
        btn.addEventListener('click', ev => { ev.preventDefault(); toggleProfilePanel(); });
        document.body.appendChild(btn);
    }
    const sig = `${label}|${t('panelTitle')}|${canvasSig()}`;
    if (btn.dataset.sig === sig) return;
    btn.dataset.sig = sig;
    const text = document.createElement('span');
    text.textContent = label;
    btn.replaceChildren(text);
    btn.title = t('panelTitle');
    place(btn, PROFILE_BTN_X, PROFILE_BTN_Y, PROFILE_BTN_W, PROFILE_BTN_H);
    setFont(btn, 32);
    fitFont(btn, text, btn.clientWidth * 0.9);
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
    return `${tag} ${t('daysCount', daysSince(stageStart))}`;
}

// ── 行座標（依最新 profile.txt icons + text boxes）────────
// 每個 entry: name line, dot, date line
const NAME_Y = [235, 350, 465, 580, 695];   // centerY of name text
const DATE_Y = [285, 400, 515, 630, 745];   // centerY of date text

function buildEntries(lovers, page, priv, showDot) {
    return lovers.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE).map((l, i) => {
        const col = i < 5 ? 0 : 1;
        const row = i % 5;
        const nY = NAME_Y[row], dY = DATE_Y[row];
        return {
            memberNumber: l.memberNumber, name: l.name, stage: l.stage, col, row,
            x: col === 0 ? 590 : 1210,
            y: nY - 26,
            w: col === 0 ? 540 : 490,   // 右欄限制到 1700
            h: (dY + 20) - (nY - 26),
            nameText: formatLoverNameLine(l),
            dateText: formatLoverDateLine(l, priv),
            color: STAGE_COLOR[l.stage] ?? "#FFB6C1",
            dot: showDot ? (isOnline(l.memberNumber) ? 1 : 0) : null,
        };
    });
}

function syncPanelDom(entries, total, page) {
    if (!domReady()) return;
    ensureProfileStyle();
    const pages = Math.ceil(total / PAGE_SIZE);
    const sig = [canvasSig(), page, pages, t('panelTitle'), total === 0 ? t('panelEmpty') : '',
        entries.map(e => `${e.memberNumber}|${e.nameText}|${e.dateText}|${e.color}|${e.dot}|${e.x},${e.y}`).join(';')].join('#');
    let panel = document.getElementById(PANEL_ID);
    if (panel?.dataset.sig === sig) return;
    panel?.remove();

    panel = document.createElement('div');
    panel.id = PANEL_ID;
    panel.dataset.sig = sig;
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', t('panelTitle'));
    document.body.appendChild(panel);
    place(panel, PROFILE_PANEL_X, PROFILE_PANEL_Y, PROFILE_PANEL_W, PROFILE_PANEL_H);

    const title = div('afc-profile-title', t('panelTitle'));
    panel.appendChild(title);
    place(title, PROFILE_PANEL_X, 150, PROFILE_PANEL_W, 60);
    setFont(title, 36);

    if (pages > 1) {
        const next = document.createElement('button');
        next.type = 'button';
        next.className = 'afc-profile-next';
        next.setAttribute('aria-label', t('profilePage', page + 1, pages));
        const img = document.createElement('img');
        img.src = NEXT_PAGE_SVG; img.alt = ''; img.draggable = false;
        next.appendChild(img);
        next.addEventListener('click', ev => { ev.preventDefault(); nextProfilePage(); });
        panel.appendChild(next);
        place(next, PAGE_BUTTON.x, PAGE_BUTTON.y, PAGE_BUTTON.w, PAGE_BUTTON.h);
        const label = div('afc-profile-page', t('profilePage', page + 1, pages));
        panel.appendChild(label);
        place(label, 1735, 225, 110, 40);
        setFont(label, 30);
    }

    if (total === 0) {
        const empty = div('afc-profile-empty', t('panelEmpty'));
        panel.appendChild(empty);
        place(empty, PROFILE_PANEL_X, 360, PROFILE_PANEL_W, 80);
        setFont(empty, 36);
    }

    for (const e of entries) {
        const row = div('afc-lover');
        row.dataset.memberNumber = String(e.memberNumber);
        row.dataset.col = String(e.col);
        row.dataset.row = String(e.row);
        row.style.color = e.color;
        if (e.dot != null) {
            const dot = div('afc-lover-dot');
            dot.dataset.online = String(e.dot);
            row.appendChild(dot);
        }
        const name = div('afc-lover-name', e.nameText);
        const date = div('afc-lover-date');
        const dateText = div('afc-lover-date-text', e.dateText);
        date.appendChild(dateText);
        row.append(name, date);
        panel.appendChild(row);
        place(row, e.x, e.y, e.w, e.h);
        setFont(row, 36);
        fitFont(name);
        fitFont(date, dateText);
    }
    bindOutsideClose(true);
    // 讓其他插件（如 FCM）在面板重建後附加自己的元素（例如日期行後的搜尋圖示）
    if (typeof CustomEvent === 'function') document.dispatchEvent(new CustomEvent('afc:profile-panel-rendered', { detail: { panel } }));
}

export function drawProfilePanel() {
    _loverRegions = [];
    if (!profilePanelOpen || CurrentScreen !== "InformationSheet") { removePanelDom(); return; }
    const lovers    = getViewingCharacterAFCLovers();
    const page      = currentPage(lovers);
    const priv      = getPrivateSettings();
    const isOwnProfile = getCurrentViewingCharacter()?.MemberNumber === Player.MemberNumber;
    const showDot   = isOwnProfile && (priv?.showOnlineStatus !== false);
    const entries   = buildEntries(lovers, page, priv, showDot);

    // 記錄各條目的螢幕矩形（涵蓋名稱＋日期兩行），供其他插件疊按鈕
    _loverRegions = entries.map(({ memberNumber, name, stage, col, row, x, y, w, h }) =>
        ({ memberNumber, name, stage, col, row, x, y, w, h }));
    syncPanelDom(entries, lovers.length, page);
}

// ════════════════════════════════════════
//  BC 原生關係燈號（主人／戀人名稱列前方的線上圓點）
//  資訊頁已是 HTML 畫面，列的位置會隨欄寬與換行變動，不能再用固定畫布座標；
//  改成直接把圓點放進各列的最前面（跟著文字走），並依線上狀態更新顏色。
//  列的辨識方式：名稱列內有兩個 .information-sheet-copy（名稱、會員編號）。
// ════════════════════════════════════════

const RELATION_ROW_SELECTOR = '#information-sheet-screen .information-sheet-relations-slot '
    + ':is(.information-sheet-owner, .information-sheet-entry-title)';

function relationMemberNumber(row) {
    const fields = row.querySelectorAll('.information-sheet-copy');
    if (fields.length !== 2) return 0;
    const text = fields[1].textContent.trim();
    return /^\d+$/.test(text) ? Number(text) : 0;
}

/** 在自己的資料頁，為主人／戀人列加上（或更新）線上燈號；每幀呼叫，只在狀態改變時動 DOM。 */
export function drawBCRelationDots() {
    if (!domReady()) return;
    const enabled = !!getPrivateSettings()?.showOnlineStatus;
    if (enabled) ensureProfileStyle();
    for (const row of document.querySelectorAll(RELATION_ROW_SELECTOR)) {
        let dot = row.querySelector(':scope > .afc-relation-dot');
        const member = enabled ? relationMemberNumber(row) : 0;
        if (!member) { dot?.remove(); continue; }
        if (!dot) {
            dot = document.createElement('span');
            dot.className = 'afc-relation-dot';
            dot.setAttribute('aria-hidden', 'true');
            row.prepend(dot);
        }
        const online = isOnline(member) ? '1' : '0';
        if (dot.dataset.online !== online) dot.dataset.online = online;
    }
}
