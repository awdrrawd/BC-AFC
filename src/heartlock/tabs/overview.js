import { HL_PANEL_ID, CC } from '../config.js';
import { th as T } from '../../i18n/i18n.js';
import { hlEl, hlRow, timerRemainStr, timerDateShortStr, lockedAtStr } from '../util.js';
import { getSetting } from '../storage.js';
import { renderNoteWithImages } from '../note.js';

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
