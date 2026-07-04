// ════════════════════════════════════════
//  HeartLock module: tabs.js
//  五個分頁內容：總覽 / 筆記 / 計時器 / 控制 / 解鎖
// ════════════════════════════════════════

import { HL_PANEL_ID, CC, HEARTLOCK_NAME, HEARTKEY_IMAGE, NOTE_TA_ID, MAX_TEXT, TMR_PM } from './config.js';
import { state } from './state.js';
import { T } from './i18n.js';
import {
    hlEl, hlBtn, hlRow,
    timerRemainStr, timerDateOnlyStr, timerDateShortStr, timerDeltaStr, lockedAtStr,
} from './util.js';
import { getSetting, getPadlockConfig } from './storage.js';
import { canEdit } from './permissions.js';
import { pushConfig, sendSettingsChange, notifyRemove } from './net.js';
import { showHTMLDatePicker } from './datepicker.js';
import { renderNoteWithImages } from './note.js';
import { hlShowTab, removeHLPanel, _canUnlockHeartLock, setHlTimer } from './panel.js';
import { cleanHeartLockProperty } from './lock.js';
import { sendLocalizedAction } from '../i18n/l10n.js';

// ── Tab: 總覽（大/小螢幕自適應）──
export function hlTabOverview(el, ch, gn, cfg) {
    const panelW = document.getElementById(HL_PANEL_ID)?.offsetWidth ?? 400;
    const isSmall = panelW < 280;
    const previewSrc = getSetting('previewImage');

    if (isSmall) {
        // 小螢幕：圖片在上，資訊在下
        el.style.display = 'flex'; el.style.flexDirection = 'column'; el.style.gap = '.5em';
        if (previewSrc) {
            const img = hlEl('img', 'width:5em;height:5em;object-fit:contain;display:block;margin:0 auto;pointer-events:none;user-select:none;');
            img.src = previewSrc; img.draggable = false; img.onerror = () => { img.style.display='none'; };
            el.appendChild(img);
        }
        const info = hlEl('div', 'display:flex;flex-direction:column;gap:.1em;');
        if (cfg) {
            const remain = timerRemainStr(cfg);
            [[T('unlockOwner'),cfg.ownerName??'?',CC.acc],[T('memberNum'),String(cfg.owner??'?'),CC.text],
             [T('lockedLabel'),lockedAtStr(cfg),CC.sub],[T('remain'),remain||T('noTimer'),remain?CC.gold:CC.dim],
             [T('until'),timerDateShortStr(cfg)||'—',remain?CC.sub:CC.dim],
             [T('vibeLabel'),({off:T('vibeOff'),low:T('vibeLow'),mid:T('vibeMid'),high:T('vibeHigh')})[cfg.vibe??'off'],CC.text],
             [T('controlLabel'),({normal:T('modeNormal'),edge:T('modeEdge'),deny:T('modeDeny')})[cfg.orgasmMode??'normal'],CC.text],
            ].forEach(([l,v,vc])=>info.appendChild(hlRow(l,v,vc)));
        } else {
            info.appendChild(hlEl('div',`color:${CC.dim};text-align:center;`,T('noConfig')));
        }
        el.appendChild(info);
    } else {
        // 大螢幕：圖片左、資訊右
        const top = hlEl('div', 'display:flex;gap:1em;margin-bottom:.8em;align-items:flex-start;');
        const imgBox = hlEl('div', 'flex:0 0 40%;aspect-ratio:1;display:flex;align-items:center;justify-content:center;overflow:hidden;');
        if (previewSrc) {
            const img = hlEl('img', 'width:100%;height:100%;object-fit:contain;pointer-events:none;user-select:none;');
            img.src = previewSrc; img.draggable = false; img.onerror = () => { img.style.display='none'; };
            imgBox.appendChild(img);
        }
        top.appendChild(imgBox);
        const info = hlEl('div', 'flex:1;display:flex;flex-direction:column;gap:.1em;');
        if (!cfg) {
            info.appendChild(hlEl('div',`color:${CC.dim};text-align:center;margin-top:1em;font-size:1.1em;`,T('noConfig')));
        } else {
            const remain = timerRemainStr(cfg);
            [[T('unlockOwner'),cfg.ownerName??'?',CC.acc],[T('memberNum'),String(cfg.owner??'?'),CC.text],
             [T('lockedLabel'),lockedAtStr(cfg),CC.sub],[T('remain'),remain||T('noTimer'),remain?CC.gold:CC.dim],
             [T('until'),timerDateShortStr(cfg)||'—',remain?CC.sub:CC.dim],
             [T('vibeLabel'),({off:T('vibeOff'),low:T('vibeLow'),mid:T('vibeMid'),high:T('vibeHigh')})[cfg.vibe??'off'],CC.text],
             [T('controlLabel'),({normal:T('modeNormal'),edge:T('modeEdge'),deny:T('modeDeny')})[cfg.orgasmMode??'normal'],CC.text],
            ].forEach(([l,v,vc])=>info.appendChild(hlRow(l,v,vc)));
        }
        top.appendChild(info);
        el.appendChild(top);
    }
    // 筆記預覽（不可選取標題，可選取內容）
    el.appendChild(hlEl('div',`background:${CC.panel};color:${CC.acc};text-align:center;padding:.35em;font-weight:bold;border-radius:4px 4px 0 0;border:1px solid ${CC.border};border-bottom:none;user-select:none;`,T('noteHeader')));
    const noteBox = hlEl('div',
                         `background:${CC.panel};border:1px solid ${CC.border};border-radius:0 0 4px 4px;` +
                         `padding:.6em .8em;min-height:5em;max-height:50%;overflow-y:auto;font-size:.9em;` +
                         `color:${cfg?.note?CC.text:CC.dim};white-space:pre-wrap;word-break:break-all;line-height:1.5;user-select:text;-webkit-user-select:text;`);
    renderNoteWithImages(cfg?.note||'', noteBox);
    el.appendChild(noteBox);
}

// ── Tab: 筆記（內嵌編輯，不用 overlay）──
export function hlTabNote(el, ch, gn, cfg) {
    const editable = canEdit(ch, cfg);
    el.style.display='flex'; el.style.flexDirection='column'; el.style.gap='.6em';

    if (state.panel.noteEditing && editable) {
        // ── 編輯模式（內嵌 textarea）
        const ta = document.createElement('textarea');
        ta.id = NOTE_TA_ID;
        ta.maxLength = MAX_TEXT;
        ta.value = state.panel.noteDraft ?? cfg?.note ?? '';
        ta.style.cssText = `flex:1;min-height:8em;background:${CC.panel};color:${CC.text};border:1px solid ${CC.border};` +
            `padding:.7em;font-size:.95em;resize:none;outline:none;line-height:1.6;border-radius:4px;font-family:inherit;`;
        const counter = hlEl('div', `color:${CC.sub};font-size:.85em;`, `${ta.value.length} / ${MAX_TEXT}`);
        ta.oninput = () => { state.panel.noteDraft = ta.value; counter.textContent = `${ta.value.length} / ${MAX_TEXT}`; };
        const btnRow = hlEl('div', 'display:flex;gap:.6em;justify-content:flex-end;');
        const saveBtn = hlBtn('💾 Save', true, () => {
            pushConfig(ch, gn, { note: ta.value.slice(0, MAX_TEXT) });
            sendSettingsChange(ch, gn);
            state.panel.noteDraft = null;
            state.panel.noteEditing = false;
            hlShowTab(ch, gn, 'note');
        });
        const cancelBtn = hlBtn('✕ Cancel', false, () => {
            state.panel.noteDraft = null;
            state.panel.noteEditing = false;
            hlShowTab(ch, gn, 'note');
        });
        btnRow.appendChild(saveBtn); btnRow.appendChild(cancelBtn);
        el.appendChild(ta); el.appendChild(counter); el.appendChild(btnRow);
        ta.focus();
    } else {
        // ── 閱覽模式
        const noteBox = hlEl('div',
                             `background:${CC.panel};border:1px solid ${CC.border};border-radius:4px;` +
                             `padding:.7em 1em;flex:1;min-height:6em;overflow-y:auto;font-size:.95em;` +
                             `color:${cfg?.note?CC.text:CC.dim};white-space:pre-wrap;word-break:break-all;line-height:1.6;user-select:text;`);
        renderNoteWithImages(cfg?.note||'', noteBox);
        el.appendChild(noteBox);
        if (editable) {
            const editBtn = hlBtn(T('editNote'), true, () => {
                state.panel.noteEditing = true;
                state.panel.noteDraft = cfg?.note ?? '';
                hlShowTab(ch, gn, 'note');
            });
            editBtn.style.cssText += 'align-self:center;padding:.5em 2em;font-size:1.05em;';
            el.appendChild(editBtn);
        } else {
            el.appendChild(hlEl('p', `color:${CC.dim};text-align:center;font-size:.9em;user-select:none;`, T('ownerOnlyEdit')));
        }
    }
}

// ── Tab: 計時器 ──
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
    refresh(); setHlTimer(setInterval(refresh, 5000));
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

// ── Tab: 控制 ──
export function hlTabControl(el, ch, gn, cfg) {
    const editable   = canEdit(ch, cfg);
    const vibeLabels = { off:T('vibeOff'), low:T('vibeLow'), mid:T('vibeMid'), high:T('vibeHigh') };
    const orgLabels  = { normal:T('modeNormal'), edge:T('modeEdge'), deny:T('modeDeny') };
    let curVibe = cfg?.vibe??'off', curOrg = cfg?.orgasmMode??'normal', editing = false;
    el.style.display='flex'; el.style.flexDirection='column'; el.style.gap='.7em';
    const setVibeBtn = () => Object.keys(vibeLabels).forEach(v=>{ const b=document.getElementById(`HL-vibe-${v}`); if(b){b.style.background=v===curVibe?CC.btnA:CC.btn;b.style.opacity=editing?'1':'0.65';} });
    const setOrgBtn  = () => Object.keys(orgLabels).forEach(o =>{ const b=document.getElementById(`HL-org-${o}`);  if(b){b.style.background=o===curOrg ?CC.btnA:CC.btn;b.style.opacity=editing?'1':'0.65';} });
    el.appendChild(hlEl('div', `color:${CC.sub};font-size:1em;user-select:none;`, T('vibStrength')));
    const vibeRow = hlEl('div', 'display:flex;flex-wrap:wrap;gap:.5em;');
    Object.entries(vibeLabels).forEach(([v,label])=>{ const b=hlBtn(label,v===curVibe,()=>{ if(editing){curVibe=v;setVibeBtn();} },'font-size:1.05em;'); b.id=`HL-vibe-${v}`; b.style.opacity='0.65'; vibeRow.appendChild(b); });
    el.appendChild(vibeRow);
    el.appendChild(hlEl('div', `color:${CC.sub};font-size:1em;user-select:none;`, T('restriction')));
    const orgRow = hlEl('div', 'display:flex;flex-wrap:wrap;gap:.5em;');
    Object.entries(orgLabels).forEach(([o,label])=>{ const b=hlBtn(label,o===curOrg,()=>{ if(editing){curOrg=o;setOrgBtn();} },'font-size:1.05em;'); b.id=`HL-org-${o}`; b.style.opacity='0.65'; orgRow.appendChild(b); });
    el.appendChild(orgRow);
    if (!editable) { el.appendChild(hlEl('p',`color:${CC.dim};text-align:center;font-size:.9em;user-select:none;`,T('ownerOnlyCtrl'))); return; }
    const actRow = hlEl('div', 'display:flex;gap:.6em;justify-content:center;');
    const editBtn   = hlBtn(T('settings'),true, ()=>{ editing=true; curVibe=cfg?.vibe??'off'; curOrg=cfg?.orgasmMode??'normal'; setVibeBtn(); setOrgBtn(); editBtn.style.display='none'; saveBtn.style.display=''; cancelBtn.style.display=''; },'font-size:1.05em;padding:.5em 1.5em;');
    const saveBtn   = hlBtn('💾 Save',   true, ()=>{ pushConfig(ch,gn,{vibe:curVibe,orgasmMode:curOrg}); sendSettingsChange(ch,gn); editing=false; setVibeBtn(); setOrgBtn(); editBtn.style.display=''; saveBtn.style.display='none'; cancelBtn.style.display='none'; },'font-size:1.05em;padding:.5em 1.5em;display:none;');
    const cancelBtn = hlBtn('✕ Cancel', false,()=>{ editing=false; curVibe=cfg?.vibe??'off'; curOrg=cfg?.orgasmMode??'normal'; setVibeBtn(); setOrgBtn(); editBtn.style.display=''; saveBtn.style.display='none'; cancelBtn.style.display='none'; },'font-size:1.05em;padding:.5em 1.5em;display:none;');
    actRow.appendChild(editBtn); actRow.appendChild(saveBtn); actRow.appendChild(cancelBtn);
    el.appendChild(actRow);
}

// ── Tab: 解鎖 ──
export function hlTabUnlock(el, ch, gn, cfg) {
    const canUnl = _canUnlockHeartLock(ch, cfg);
    el.style.display='flex'; el.style.flexDirection='column'; el.style.alignItems='center'; el.style.gap='.6em';
    const img = hlEl('img', 'width:9em;height:9em;object-fit:contain;pointer-events:none;user-select:none;');
    img.src = HEARTKEY_IMAGE; img.draggable = false; img.onerror = ()=>{ img.style.display='none'; };
    el.appendChild(img);
    if (cfg) el.appendChild(hlEl('div',`color:${CC.text};font-size:.95em;text-align:center;user-select:none;`,
                                 `${T('unlockOwner')} ${cfg.ownerName??'?'} #${cfg.owner??'?'}`));
    el.appendChild(hlEl('p', `color:#FF9999;text-align:center;font-size:1em;user-select:none;`, T('unlockWarn1')));
    el.appendChild(hlEl('p', `color:${CC.sub};text-align:center;font-size:.9em;user-select:none;`, T('unlockWarn2')));
    if (!canUnl) { el.appendChild(hlEl('p',`color:${CC.dim};text-align:center;font-size:.95em;margin-top:.5em;user-select:none;`,T('unlockNoRight'))); return; }
    const unlockBtn  = hlBtn(T('unlockConfirm'),false,()=>{ unlockBtn.style.display='none'; confirmRow.style.display='flex'; },`background:${CC.danger};border-color:#FF4444;font-size:1.1em;padding:.5em 2em;`);
    const confirmRow = hlEl('div', 'display:none;gap:.6em;');
    const yesBtn = hlBtn(T('unlockConfirm'),false,()=>{
        try {
            notifyRemove(ch,gn); state._unlocking=true; InventoryUnlock?.(ch,gn); state._unlocking=false;
            cleanHeartLockProperty(ch,gn); ChatRoomCharacterUpdate?.(ch);
            try { sendLocalizedAction('hl','unlockDone',[Player.Nickname||Player.Name, ch.Nickname||ch.Name, HEARTLOCK_NAME]); } catch {}
            removeHLPanel(); DialogFocusItem=null;
        } catch { state._unlocking=false; }
    },`background:${CC.danger};border-color:#FF4444;font-size:1.05em;padding:.5em 1.5em;`);
    const noBtn = hlBtn(T('unlockCancel'),false,()=>{ confirmRow.style.display='none'; unlockBtn.style.display=''; },'font-size:1.05em;padding:.5em 1.5em;');
    confirmRow.appendChild(yesBtn); confirmRow.appendChild(noBtn);
    el.appendChild(unlockBtn); el.appendChild(confirmRow);
}
