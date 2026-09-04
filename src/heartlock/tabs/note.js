import { CC, NOTE_TA_ID, MAX_TEXT } from '../config.js';
import { state } from '../state.js';
import { th as T } from '../../i18n/i18n.js';
import { hlEl, hlBtn } from '../util.js';
import { canEdit } from '../permissions.js';
import { pushConfig, sendSettingsChange } from '../net.js';
import { renderNoteWithImages } from '../note.js';
import { emitHeartLockEvent } from '../events.js';
const showTab=(character,groupName,tabId)=>emitHeartLockEvent('panel-show-tab',{character,groupName,tabId});

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
            showTab(ch, gn, 'note');
        });
        const cancelBtn = hlBtn('✕ Cancel', false, () => {
            state.panel.noteDraft = null;
            state.panel.noteEditing = false;
            showTab(ch, gn, 'note');
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
                showTab(ch, gn, 'note');
            });
            editBtn.style.cssText += 'align-self:center;padding:.5em 2em;font-size:1.05em;';
            el.appendChild(editBtn);
        } else {
            el.appendChild(hlEl('p', `color:${CC.dim};text-align:center;font-size:.9em;user-select:none;`, T('ownerOnlyEdit')));
        }
    }
}
