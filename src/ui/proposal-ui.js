// ════════════════════════════════════════
//  AFC module: proposal-ui.js
//  提案 UI 建立輔助（聊天框內嵌，或 EBC 沙盒環境懸浮）+ 倒數計時
// ════════════════════════════════════════

import { PROPOSE_EXPIRE_MS } from '../core/config.js';
import { t } from '../i18n/i18n.js';
import { chatLocalNotice } from '../util/util.js';

export function createProposalUI({ uiId, title, subText, onAccept, onDecline }) {
    if (document.getElementById(uiId)) return null;

    // 優先附加到聊天框（標準 BC），EBC 沙盒環境可能找不到，退回 document.body
    let container = document.getElementById("TextAreaChatLog");
    const isFloating = !container;
    if (isFloating) container = document.body;
    if (!container) return null;

    const el = document.createElement("div");
    el.id = uiId;
    if (isFloating) {
        // EBC / 沙盒環境：用懸浮樣式確保可見
        el.style.cssText = [
            "position:fixed",
            "bottom:120px",
            "left:50%",
            "transform:translateX(-50%)",
            "z-index:99999",
            "max-width:600px",
            "width:90vw",
            "background:rgba(60,10,30,0.97)",
            "border:2px solid #E8618C",
            "border-radius:10px",
            "padding:14px 18px",
            "font-size:1em",
            "line-height:1.6",
            "color:#eee",
            "box-shadow:0 4px 24px rgba(0,0,0,0.7)",
        ].join(";");
    } else {
        el.style.cssText = [
            "background:rgba(60,10,30,0.93)",
            "border:2px solid #E8618C",
            "border-radius:8px",
            "padding:10px 14px 10px",
            "margin:6px 4px",
            "font-size:1em",
            "line-height:1.5",
            "color:#eee",
        ].join(";");
    }
    el.innerHTML = `
        <div style="font-weight:bold;font-size:1.05em;margin-bottom:7px;">${title}</div>
        <div style="display:flex;align-items:center;gap:10px;">
            <button id="${uiId}-ok" style="padding:4px 18px;background:#C2185B;color:#fff;border:none;border-radius:5px;cursor:pointer;font-size:0.95em;white-space:nowrap;">${t('okBtn')}</button>
            <button id="${uiId}-no" style="padding:4px 14px;background:transparent;color:#bbb;border:1px solid #555;border-radius:5px;cursor:pointer;font-size:0.95em;white-space:nowrap;">${t('cancelBtn')}</button>
            <span id="${uiId}-sub" style="font-size:0.88em;opacity:0.6;">${subText}</span>
        </div>`;

    container.appendChild(el);
    if (!isFloating) container.scrollTop = container.scrollHeight;
    document.getElementById(`${uiId}-ok`)?.addEventListener('click', onAccept);
    document.getElementById(`${uiId}-no`)?.addEventListener('click', onDecline);
    return el;
}

// expireMsg: 過期時顯示的系統提示
export function startCountdown(uiId, subId, onExpire, expireMsg) {
    const start = Date.now();
    const iv = setInterval(() => {
        const left = PROPOSE_EXPIRE_MS - (Date.now() - start);
        if (left <= 0) {
            clearInterval(iv);
            onExpire();
            if (expireMsg) chatLocalNotice(expireMsg);
            return;
        }
        const m = Math.floor(left / 60000);
        const s = String(Math.floor((left % 60000) / 1000)).padStart(2, '0');
        const tEl = document.getElementById(subId);
        if (tEl) tEl.textContent = t('timerText', m, s);
    }, 1000);
    return iv;
}
