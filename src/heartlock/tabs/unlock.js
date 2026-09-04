import { CC, HEARTLOCK_NAME, HEARTKEY_IMAGE } from '../config.js';
import { state } from '../state.js';
import { th as T } from '../../i18n/i18n.js';
import { hlEl, hlBtn } from '../util.js';
import { isAllowedToUnlock } from '../permissions.js';
import { notifyRemove } from '../net.js';
import { cleanHeartLockProperty } from '../lock.js';
import { sendLocalizedAction } from '../../i18n/l10n.js';
import { emitHeartLockEvent } from '../events.js';

export function hlTabUnlock(el, ch, gn, cfg) {
    const canUnl = isAllowedToUnlock(ch, cfg);
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
            notifyRemove(ch,gn); state.operations.unlocking=true; InventoryUnlock?.(ch,gn); state.operations.unlocking=false;
            cleanHeartLockProperty(ch,gn); ChatRoomCharacterUpdate?.(ch);
            try { sendLocalizedAction('hl','unlockDone',[Player.Nickname||Player.Name, ch.Nickname||ch.Name, HEARTLOCK_NAME]); } catch {}
            emitHeartLockEvent('panel-close'); DialogFocusItem=null;
        } catch { state.operations.unlocking=false; }
    },`background:${CC.danger};border-color:#FF4444;font-size:1.05em;padding:.5em 1.5em;`);
    const noBtn = hlBtn(T('unlockCancel'),false,()=>{ confirmRow.style.display='none'; unlockBtn.style.display=''; },'font-size:1.05em;padding:.5em 1.5em;');
    confirmRow.appendChild(yesBtn); confirmRow.appendChild(noBtn);
    el.appendChild(unlockBtn); el.appendChild(confirmRow);
}
