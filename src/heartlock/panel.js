// ════════════════════════════════════════
//  HeartLock module: panel.js
//  DOM 面板（完整取代 canvas 面板）+ tab 切換
// ════════════════════════════════════════

import {
    PX, PY, PW, PH, CC, HL_PANEL_ID,
    TAB_OVERVIEW, TAB_NOTE, TAB_TIMER, TAB_CONTROL, TAB_UNLOCK,
} from './config.js';
import { state } from './state.js';
import { hlEl, dpInit } from './util.js';
import { T } from './i18n.js';
import { getPadlockConfig } from './storage.js';
import { closeNoteOverlay } from './note.js';
import { requestHeartLockData } from './net.js';
import { hlTabOverview, hlTabNote, hlTabTimer, hlTabControl, hlTabUnlock } from './tabs.js';

let _hlTimer = null;
// tabs 需要在自身 refresh interval 內設定 _hlTimer，透過此 setter 共用
export function setHlTimer(v) { _hlTimer = v; }

function _hlScaleFactor() {
    const c = document.getElementById('MainCanvas');
    return c ? c.getBoundingClientRect().width / 2000 : 1;
}
function _repositionHLPanel() {
    const sc = _hlScaleFactor();
    const c  = document.getElementById('MainCanvas');
    const r  = c?.getBoundingClientRect() ?? { left:0, top:0, width:window.innerWidth, height:window.innerHeight };
    const p  = document.getElementById(HL_PANEL_ID);
    if (p) {
        p.style.left     = (r.left + PX * sc) + 'px';
        p.style.top      = (r.top  + PY * sc) + 'px';
        p.style.width    = (PW * sc) + 'px';
        p.style.height   = (PH * sc) + 'px';
        p.style.fontSize = Math.max(13, 26 * sc) + 'px';
    }
}
export { _repositionHLPanel };

// ── 面板開關 ──
export function openHLPanel(ch, gn) {
    removeHLPanel();
    const p = state.panel;
    p.targetChar = ch; p.groupName = gn; p.tab = TAB_OVERVIEW;
    p.noteEditing = false; p.noteDraft = null;
    p.ctlEditing = false; p.unlockConfirming = false;
    dpInit(getPadlockConfig(ch, gn));
    if (ch && !ch.IsPlayer()) requestHeartLockData(ch);

    const sc = _hlScaleFactor();
    const c  = document.getElementById('MainCanvas');
    const r  = c?.getBoundingClientRect() ?? { left:0, top:0, width:window.innerWidth, height:window.innerHeight };

    const panel = hlEl('div',
                       `position:fixed;background:${CC.bg};border:2px solid ${CC.border};` +
                       `box-sizing:border-box;display:flex;flex-direction:column;z-index:9999;` +
                       `font-family:"Arial","Microsoft JhengHei","微軟正黑體",sans-serif;color:${CC.text};overflow:hidden;` +
                       `user-select:none;-webkit-user-select:none;`);
    panel.id = HL_PANEL_ID;

    // 面板頭：隱形佔位（左）+ 置中標題 + 關閉按鈕（右）
    const header = hlEl('div',
                        `background:${CC.tOff};border-bottom:2px solid ${CC.border};flex-shrink:0;` +
                        `display:grid;grid-template-columns:2em 1fr 2em;align-items:center;padding:.25em .6em;user-select:none;`);
    const titleDiv = hlEl('div',
                          `color:${CC.acc};font-weight:bold;font-size:1em;text-align:center;user-select:none;`,
                          '♥ Heart Padlock ♥');
    const closeBtn = hlEl('button',
                          `background:none;border:none;color:${CC.sub};cursor:pointer;font-size:1.2em;padding:0;user-select:none;justify-self:end;`, '✕');
    closeBtn.onclick = () => { removeHLPanel(); DialogFocusItem = null; };
    header.appendChild(hlEl('span','')); // 左佔位
    header.appendChild(titleDiv);
    header.appendChild(closeBtn);

    // Tab 列
    const tabBar = hlEl('div', `display:flex;border-bottom:2px solid ${CC.border};flex-shrink:0;background:${CC.tOff};`);
    [['overview',T('tabOverview')],['note',T('tabNote')],['timer',T('tabTimer')],['control',T('tabControl')],['unlock',T('tabUnlock')]].forEach(([id,label]) => {
        const btn = hlEl('button', '', label);
        btn.id = `HL-tab-${id}`;
        btn.style.cssText = `flex:1;padding:.45em .2em;background:none;border:none;color:${CC.sub};cursor:pointer;font-size:inherit;border-bottom:3px solid transparent;user-select:none;`;
        btn.onclick = () => hlShowTab(ch, gn, id);
        tabBar.appendChild(btn);
    });

    const content = hlEl('div', `flex:1;overflow-y:auto;padding:.7em .9em;background:${CC.bg};`);
    content.id = 'HL-content';

    panel.appendChild(header); panel.appendChild(tabBar); panel.appendChild(content);
    document.body.appendChild(panel);

    // 定位：以 BC 虛擬座標換算到實際像素
    panel.style.left     = (r.left + PX * sc) + 'px';
    panel.style.top      = (r.top  + PY * sc) + 'px';
    panel.style.width    = (PW * sc) + 'px';
    panel.style.height   = (PH * sc) + 'px';
    panel.style.fontSize = Math.max(13, 26 * sc) + 'px';

    window.addEventListener('resize', _repositionHLPanel);
    hlShowTab(ch, gn, 'overview');
}

export function removeHLPanel() {
    clearInterval(_hlTimer); _hlTimer = null;
    document.getElementById(HL_PANEL_ID)?.remove();
    closeNoteOverlay();
    window.removeEventListener('resize', _repositionHLPanel);
    state.panel.noteEditing = false; state.panel.ctlEditing = false;
    state.panel.targetChar  = null;  state.panel.groupName  = null;
}

// ── Tab 切換 ──
export function hlShowTab(ch, gn, tabId) {
    clearInterval(_hlTimer); _hlTimer = null;
    if (state.panel.noteEditing && tabId !== 'note') { closeNoteOverlay(); state.panel.noteEditing = false; }
    if (state.panel.ctlEditing  && tabId !== 'control') state.panel.ctlEditing = false;
    state.panel.tab = { overview:TAB_OVERVIEW, note:TAB_NOTE, timer:TAB_TIMER, control:TAB_CONTROL, unlock:TAB_UNLOCK }[tabId] ?? TAB_OVERVIEW;
    ['overview','note','timer','control','unlock'].forEach(id => {
        const btn = document.getElementById(`HL-tab-${id}`);
        if (!btn) return;
        const a = id === tabId;
        btn.style.color = a ? CC.text : CC.sub;    // 選中=白色，未選=灰色
        btn.style.borderBottom = `3px solid ${a ? CC.border : 'transparent'}`;
        btn.style.background   = a ? CC.tSel : 'none';
        btn.style.fontWeight   = a ? 'bold'  : 'normal';
    });
    const content = document.getElementById('HL-content');
    if (!content) return;
    // 每次切換分頁前完整重置 content 樣式（避免 unlock tab 的 flex-center 污染其他分頁）
    content.innerHTML = '';
    content.style.cssText = `flex:1;overflow-y:auto;padding:.7em .9em;background:${CC.bg};`;
    const cfg = getPadlockConfig(ch, gn);
    switch (tabId) {
        case 'overview': hlTabOverview(content, ch, gn, cfg); break;
        case 'note':     hlTabNote(content, ch, gn, cfg);     break;
        case 'timer':    hlTabTimer(content, ch, gn, cfg);    break;
        case 'control':  hlTabControl(content, ch, gn, cfg);  break;
        case 'unlock':   hlTabUnlock(content, ch, gn, cfg);   break;
    }
}

// ── 刷新當前分頁（資料更新後呼叫）──
export function hlRefreshCurrentTab() {
    const p = state.panel;
    const ch = p.targetChar, gn = p.groupName;
    if (!ch || !gn || !document.getElementById(HL_PANEL_ID)) return;
    // state.panel.tab 已經是字串 ID（'overview'/'note'/...），直接使用
    hlShowTab(ch, gn, p.tab ?? 'overview');
}

// ── 面板主函式 ──
function getGroupFromFocusItem() {
    const item = window.DialogFocusSourceItem;
    if (item?.Asset?.Group?.Name) return item.Asset.Group.Name;
    const ch = typeof CharacterGetCurrent === 'function' ? CharacterGetCurrent() : null;
    return ch?.FocusGroup?.Name ?? null;
}

export function panelLoad() {
    const ch = typeof CharacterGetCurrent === 'function' ? CharacterGetCurrent() : null;
    const gn = getGroupFromFocusItem();
    if (!ch || !gn) return;
    openHLPanel(ch, gn);
}
