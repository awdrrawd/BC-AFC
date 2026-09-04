import { CC, TMR_PM } from '../config.js';
import { th as T } from '../../i18n/i18n.js';
import { hlEl, hlBtn, timerRemainStr, timerDateOnlyStr, timerDeltaStr } from '../util.js';
import { getPadlockConfig } from '../storage.js';
import { canEdit } from '../permissions.js';
import { pushConfig, sendSettingsChange } from '../net.js';
import { showHTMLDatePicker } from '../datepicker.js';
import { emitHeartLockEvent } from '../events.js';

export function hlTabTimer(el, ch, gn, cfg) {
    const editable = canEdit(ch, cfg);
    el.style.display='flex'; el.style.flexDirection='column'; el.style.gap='.6em';

    // ① 時間顯示區
    const timerBox = hlEl('div', `background:${CC.panel};border:1px solid ${CC.border};border-radius:6px;padding:.6em 1em;`);
    const topRow   = hlEl('div', 'display:flex;align-items:baseline;justify-content:center;gap:.4em;');
    const remainEl = hlEl('span', `font-size:1.8em;color:${CC.gold};font-weight:bold;user-select:none;text-align:center;`);
    const deltaEl  = hlEl('span', `color:${CC.gold};font-size:1em;user-select:none;`, '');
    topRow.appendChild(remainEl); topRow.appendChild(deltaEl);
    // 截止日期行（left: 截止: date，right: 📅 button）
    const dateRow  = hlEl('div', 'display:flex;align-items:center;justify-content:space-between;margin-top:.3em;');
    const dateLbl  = hlEl('span', `color:${CC.sub};font-size:.9em;user-select:none;`, T('until') + ':');
    const dateVal  = hlEl('span', `color:${CC.text};font-size:1.05em;font-weight:bold;user-select:none;`, '');
    const dateLeft = hlEl('div', 'display:flex;align-items:center;gap:.4em;');
    dateLeft.appendChild(dateLbl); dateLeft.appendChild(dateVal);
    dateRow.appendChild(dateLeft);
    let timerDelta = 0;
    const refresh = () => {
        const c2=getPadlockConfig(ch,gn); const rem=timerRemainStr(c2);
        remainEl.textContent=rem||T('noTimerSet'); remainEl.style.color=rem?CC.gold:CC.dim;
        dateVal.textContent=timerDateOnlyStr(c2)||'—';
    };
    if (editable) {
        const calBtn = hlBtn('📅', false, () => {
            const c2=getPadlockConfig(ch,gn); const initDate=c2?.unlockTime?new Date(c2.unlockTime):new Date(Date.now()+86400000);
            showHTMLDatePicker(d=>{ pushConfig(ch,gn,{unlockTime:d.toISOString()}); sendSettingsChange(ch,gn); timerDelta=0; deltaEl.textContent=''; refresh(); }, initDate);
        }, 'padding:.2em .5em;font-size:.9em;');
        dateRow.appendChild(calBtn);
    }
    timerBox.appendChild(topRow); timerBox.appendChild(dateRow);
    refresh(); emitHeartLockEvent('panel-set-timer', setInterval(refresh, 5000));
    el.appendChild(timerBox);

    if (!editable) { el.appendChild(hlEl('p', `color:${CC.dim};text-align:center;font-size:.9em;user-select:none;`, T('ownerOnlyTimer'))); return; }

    // ② 調整按鈕（換行不影響 Set 位置）
    el.appendChild(hlEl('div', `color:${CC.sub};font-size:1em;user-select:none;`, T('adjust') + ':'));
    const adjRow = hlEl('div', 'display:flex;flex-wrap:wrap;gap:.4em;');
    TMR_PM.forEach(b => adjRow.appendChild(hlBtn(b.l, false, ()=>{
        timerDelta+=b.dh;
        deltaEl.textContent = timerDelta ? ' ' + timerDeltaStr(timerDelta) : '';
    }, 'font-size:1em;')));
    el.appendChild(adjRow);
    // Set 按鈕固定靠右（獨立 row）
    const setRow = hlEl('div', 'display:flex;justify-content:flex-end;align-items:center;gap:.5em;');
    setRow.appendChild(deltaEl);
    setRow.appendChild(hlBtn(T('setTimer'), true, ()=>{
        if (!timerDelta) return;
        const c2=getPadlockConfig(ch,gn); const base=c2?.unlockTime?new Date(c2.unlockTime).getTime():Date.now();
        const end=base+timerDelta*3600000; if(end>Date.now()){ pushConfig(ch,gn,{unlockTime:new Date(end).toISOString()}); sendSettingsChange(ch,gn); timerDelta=0; deltaEl.textContent=''; refresh(); }
    }, 'font-size:1em;padding:.4em 1.2em;'));
    el.appendChild(setRow);

    // ③ 移除拘束（無底色，不可選取標籤）
    const c2 = getPadlockConfig(ch,gn);
    const cbW = hlEl('label', 'display:flex;align-items:flex-start;gap:.6em;cursor:pointer;padding:.2em 0;');
    const cb  = hlEl('input', 'margin-top:.2em;width:1.1em;height:1.1em;accent-color:#C2185B;cursor:pointer;flex-shrink:0;');
    cb.type='checkbox'; cb.checked=c2?.removeRestraints??false;
    cb.onchange = ()=>{ pushConfig(ch,gn,{removeRestraints:cb.checked}); sendSettingsChange(ch,gn); };
    const cbT = hlEl('div','user-select:none;');
    cbT.appendChild(hlEl('div','font-size:1.05em;',T('removeRestraints')));
    cbT.appendChild(hlEl('div',`font-size:.9em;color:${CC.dim};margin-top:.1em;`,T('removeRestraintsSub')));
    cbW.appendChild(cb); cbW.appendChild(cbT);
    el.appendChild(cbW);

    // ④ 清除計時器（置中，最下方）
    el.appendChild(hlBtn(T('clearTimer'), false, ()=>{ pushConfig(ch,gn,{unlockTime:null}); sendSettingsChange(ch,gn); timerDelta=0; deltaEl.textContent=''; refresh(); },
                         `background:${CC.danger};display:block;margin:0 auto;padding:.45em 1.5em;font-size:1em;`));
}
