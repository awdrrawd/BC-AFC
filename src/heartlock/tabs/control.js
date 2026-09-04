import { CC } from '../config.js';
import { th as T } from '../../i18n/i18n.js';
import { hlEl, hlBtn } from '../util.js';
import { canEdit } from '../permissions.js';
import { pushConfig, sendSettingsChange } from '../net.js';

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
