// ════════════════════════════════════════
//  AFC module: dialog.js
//  在角色關係子選單注入 AFC 對話選項（申請 / 恢復 / 訂婚 / 求婚 / 解除）
// ════════════════════════════════════════

import { t } from '../../i18n/i18n.js';

const AFC_MARKER = "__AFC__";

function makeDialog(option, result, fn, marker) {
    return {
        Stage:       "RelationshipSubmenu",
        NextStage:   "0",
        Function:    fn,
        Option:      option,
        Result:      result,
        [AFC_MARKER]: marker,
    };
}

// 已注入的選項簽章（依 dialog 陣列身分記錄）。ChatRoomCharacterViewDraw / ChatRoomMenuDraw 每幀
// 都會呼叫注入；沒有變化時直接略過，避免每幀 splice 陣列、重建物件與重查翻譯。
const injected = new WeakMap();   // dialog array -> { signature, entries }

function wantedOptions() {
    const w = window;
    return [
        w.ChatRoomAFCCanPropose?.()        && ['propose', 'dPropose', 'dProposeR', 'ChatRoomAFCPropose()'],
        w.ChatRoomAFCCanRestore?.()        && ['restore', 'dRestore', 'dRestoreR', 'ChatRoomAFCRestore()'],
        w.ChatRoomAFCCanProposeEngage?.()  && ['engage',  'dEngage',  'dEngageR',  'ChatRoomAFCProposeEngage()'],
        w.ChatRoomAFCCanProposeMarry?.()   && ['marry',   'dMarry',   'dMarryR',   'ChatRoomAFCProposeMarry()'],
        w.ChatRoomAFCCanBreakup?.()        && ['breakup', 'dBreakup', 'dBreakupR', 'ChatRoomAFCBreakup()'],
    ].filter(Boolean);
}

export function injectAFCDialogs(C) {
    if (!C) return;
    const dialog = C.Dialog;
    if (!Array.isArray(dialog) || dialog.length === 0) return;

    const wanted = wantedOptions();
    // 語言也算簽章的一部分：換語言後文字要更新。
    const signature = `${t('dPropose')}|${wanted.map(option => option[0]).join(',')}`;
    const previous = injected.get(dialog);
    if (previous && previous.signature === signature
        && previous.entries.every(entry => dialog.includes(entry))) return;

    for (let i = dialog.length - 1; i >= 0; i--)
        if (dialog[i]?.[AFC_MARKER]) dialog.splice(i, 1);

    const backIndex = dialog.findIndex(d =>
                                       d?.Stage === "RelationshipSubmenu" && d?.NextStage === "10"
                                      );
    if (backIndex === -1) { injected.delete(dialog); return; }

    const entries = wanted.map(([marker, option, result, fn]) => makeDialog(t(option), t(result), fn, marker));
    injected.set(dialog, { signature, entries });
    if (entries.length) dialog.splice(backIndex, 0, ...entries);
}
