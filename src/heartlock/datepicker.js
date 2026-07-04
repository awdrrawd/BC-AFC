// ════════════════════════════════════════
//  HeartLock module: datepicker.js
//  HTML 日期選擇器（計時器 tab 用）
// ════════════════════════════════════════

import { TMR_VAL_X, TMR_DDAT_Y, TMR_ROW_H } from './config.js';
import { getBCScreenPos } from './util.js';

export function showHTMLDatePicker(onConfirm, initDate) {
    document.getElementById('HL_DatePicker')?.remove();
    const picker = document.createElement('div');
    picker.id = 'HL_DatePicker';
    const _pos = getBCScreenPos(TMR_VAL_X, TMR_DDAT_Y + TMR_ROW_H + 4);
    picker.style.cssText = `position:fixed;left:${_pos.left}px;top:${_pos.top}px;width:290px;background:#1a0010;border:2px solid #8B1A4A;border-radius:8px;padding:12px;z-index:999999;color:#fff;font-family:Arial,sans-serif;box-shadow:0 4px 24px #000a;`;
    let date = initDate ? new Date(initDate) : new Date(Date.now() + 86400000);
    const selStyle = `background:#280a1c;color:#fff;border:1px solid #8B1A4A;border-radius:4px;padding:3px 5px;font-size:13px;`;
    function genOptions(min, max, selected) {
        let h = '';
        for (let i = min; i <= max; i++)
            h += `<option value="${i}"${i===selected?' selected':''}>${String(i).padStart(2,'0')}</option>`;
        return h;
    }
    function genYearOpts(cur) {
        let h = '';
        for (let i = cur-2; i <= cur+5; i++)
            h += `<option value="${i}"${i===cur?' selected':''}>${i}</option>`;
        return h;
    }
    function render() {
        const y = date.getFullYear(), m = date.getMonth();
        const first = new Date(y, m, 1).getDay();
        const days  = new Date(y, m+1, 0).getDate();
        const prev  = new Date(y, m, 0).getDate();
        let dayCells = '';
        for (let i = 0; i < 42; i++) {
            let d, off = 0;
            if (i < first)              { d = prev - first + i + 1; off = -1; }
            else if (i >= first + days) { d = i - first - days + 1; off =  1; }
            else                        { d = i - first + 1; }
            const isOther = off !== 0, isSelected = !isOther && d === date.getDate();
            dayCells += `<div data-d="${d}" data-off="${off}" style="text-align:center;padding:3px 2px;cursor:pointer;border-radius:3px;font-size:12px;background:${isSelected?'#8B1A4A':'#280a1c'};color:${isOther?'#554':'#fff'};">${d}</div>`;
        }
        picker.innerHTML = `
            <div style="display:flex;gap:6px;margin-bottom:8px;align-items:center;">
                <select id="hl_y" style="${selStyle}">${genYearOpts(y)}</select>
                <span style="color:#CC99BB">/</span>
                <select id="hl_m" style="${selStyle}">${genOptions(1,12,m+1)}</select>
            </div>
            <div style="display:grid;grid-template-columns:repeat(7,1fr);text-align:center;color:#CC99BB;font-size:11px;margin-bottom:3px;">
                ${['Su','Mo','Tu','We','Th','Fr','Sa'].map(d=>`<div>${d}</div>`).join('')}
            </div>
            <div id="hl_days" style="display:grid;grid-template-columns:repeat(7,1fr);gap:3px;margin-bottom:10px;">${dayCells}</div>
            <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px;">
                <span style="color:#CC99BB;font-size:13px;">🕐</span>
                <select id="hl_h" style="${selStyle}">${genOptions(0,23,date.getHours())}</select>
                <span style="color:#CC99BB">:</span>
                <select id="hl_min" style="${selStyle}">${genOptions(0,59,date.getMinutes())}</select>
            </div>
            <div style="display:flex;gap:8px;">
                <button id="hl_ok" style="flex:1;background:#8B1A4A;color:#fff;border:none;border-radius:4px;padding:7px;cursor:pointer;font-size:13px;">✔ Confirm</button>
                <button id="hl_cancel" style="flex:1;background:#280a1c;color:#CC99BB;border:1px solid #8B1A4A;border-radius:4px;padding:7px;cursor:pointer;font-size:13px;">✕ Cancel</button>
            </div>`;
        picker.querySelector('#hl_y').onchange  = e => { date.setFullYear(+e.target.value); render(); };
        picker.querySelector('#hl_m').onchange  = e => { date.setMonth(+e.target.value-1);  render(); };
        picker.querySelector('#hl_days').onclick = e => {
            const cell = e.target.closest('[data-d]');
            if (!cell) return;
            date.setMonth(date.getMonth() + +cell.dataset.off);
            date.setDate(+cell.dataset.d);
            render();
        };
        picker.querySelector('#hl_ok').onclick = () => {
            date.setHours(+picker.querySelector('#hl_h').value, +picker.querySelector('#hl_min').value, 0, 0);
            if (date.getTime() > Date.now()) { onConfirm(date); }
            picker.remove();
        };
        picker.querySelector('#hl_cancel').onclick = () => picker.remove();
    }
    document.body.appendChild(picker);
    render();
    setTimeout(() => {
        document.addEventListener('mousedown', function close(e) {
            if (!picker.contains(e.target)) { picker.remove(); document.removeEventListener('mousedown', close); }
        });
    }, 0);
}
