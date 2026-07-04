// ════════════════════════════════════════
//  HeartLock module: util.js
//  通用工具 + 時間格式化 + DOM 建構輔助（hlEl / hlBtn / hlRow）
// ════════════════════════════════════════

import { state } from './state.js';

export function log(...a) { console.log('🐈‍⬛ [HeartLock]', ...a); }
export function clone(v)  { return JSON.parse(JSON.stringify(v)); }
export function wait(ms)  { return new Promise(r => setTimeout(r, ms)); }
export async function waitFor(fn, timeout = 0, interval = 100) {
    const start = Date.now();
    while (true) {
        try { if (fn()) return true; } catch {}
        if (timeout > 0 && Date.now() - start > timeout) return false;
        await wait(interval);
    }
}

export function getBCScreenPos(bcX, bcY) {
    const canvas = document.getElementById('MainCanvas') || document.querySelector('canvas');
    if (!canvas) return { left: window.innerWidth * 0.7, top: window.innerHeight * 0.6, scaleX: 1, scaleY: 1 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = rect.width / 2000, scaleY = rect.height / 1000;
    return { left: rect.left + bcX * scaleX, top: rect.top + bcY * scaleY, scaleX, scaleY };
}

export function timerRemainStr(cfg) {
    if (!cfg?.unlockTime) return null;
    const rem = Math.max(0, new Date(cfg.unlockTime).getTime() - Date.now());
    if (rem === 0) return 'Expired';
    const totalSec = Math.floor(rem / 1000);
    if (totalSec < 60) return '< 1 minute';
    const totalMin = Math.floor(totalSec / 60);
    if (totalMin < 60) return `${totalMin} min`;
    const h = Math.floor(totalMin / 60);
    if (h < 24) return `${h}h ${totalMin % 60}m`;
    const d = Math.floor(h / 24);
    return `${d}d ${h % 24}h`;
}

export function timerDateOnlyStr(cfg) {
    if (!cfg?.unlockTime) return null;
    const d = new Date(cfg.unlockTime);
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}/${pad(d.getMonth()+1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function timerDateShortStr(cfg) {
    if (!cfg?.unlockTime) return null;
    const d = new Date(cfg.unlockTime);
    const pad = n => String(n).padStart(2, '0');
    return `${pad(d.getMonth()+1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function timerDeltaStr(hours) {
    if (!hours) return '';
    const sign = hours > 0 ? '+' : '-';
    const h = Math.abs(hours);
    if (h < 24) return `(${sign}${h}h)`;
    const d = Math.floor(h / 24), rh = h % 24;
    return rh ? `(${sign}${d}d ${rh}h)` : `(${sign}${d}d)`;
}

export function lockedAtStr(cfg) {
    if (!cfg?.lockedAt) return '—';
    const d = new Date(cfg.lockedAt);
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}/${pad(d.getMonth()+1)}/${pad(d.getDate())}`;
}

export function dpInit(cfg) {
    state.panel._dpInitDate = cfg?.unlockTime ? new Date(cfg.unlockTime) : new Date(Date.now() + 86400000);
}

// ── DOM 建構輔助 ──
export function hlEl(tag, css, ...children) {
    const el = document.createElement(tag);
    if (css) el.style.cssText = css;
    for (const c of children) {
        if (c == null) continue;
        el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    }
    return el;
}
export function hlBtn(label, primary, onClick, extra = '') {
    const bg  = primary ? '#C2185B' : '#2a0020';
    const btn = hlEl('button',
                     `background:${bg};color:#fff;border:1px solid #C2185B;padding:8px 18px;` +
                     `cursor:pointer;font-size:14px;border-radius:3px;${extra}`, label);
    if (onClick) btn.onclick = onClick;
    return btn;
}
export function hlRow(label, value, color = '#fff') {
    const row = hlEl('div',
                     'display:flex;justify-content:space-between;align-items:center;' +
                     'padding:7px 0;border-bottom:1px solid #2a0020;font-size:14px;');
    row.appendChild(hlEl('span', 'color:#888;flex-shrink:0;', label));
    const v = hlEl('span', `color:${color};text-align:right;`, value);
    row.appendChild(v);
    return row;
}
