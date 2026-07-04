// ════════════════════════════════════════
//  AFC module: dialog.js
//  在角色關係子選單注入 AFC 對話選項（申請 / 恢復 / 訂婚 / 求婚 / 解除）
// ════════════════════════════════════════

import { t } from '../i18n/i18n.js';

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

export function injectAFCDialogs(C) {
    if (!C) return;
    const dialog = C.Dialog;
    if (!Array.isArray(dialog) || dialog.length === 0) return;

    for (let i = dialog.length - 1; i >= 0; i--)
        if (dialog[i]?.[AFC_MARKER]) dialog.splice(i, 1);

    const backIndex = dialog.findIndex(d =>
                                       d?.Stage === "RelationshipSubmenu" && d?.NextStage === "10"
                                      );
    if (backIndex === -1) return;

    const toInsert = [];
    if (window.ChatRoomAFCCanPropose?.())
        toInsert.push(makeDialog(t('dPropose'), t('dProposeR'), "ChatRoomAFCPropose()", "propose"));
    if (window.ChatRoomAFCCanRestore?.())
        toInsert.push(makeDialog(t('dRestore'), t('dRestoreR'), "ChatRoomAFCRestore()", "restore"));
    if (window.ChatRoomAFCCanProposeEngage?.())
        toInsert.push(makeDialog(t('dEngage'), t('dEngageR'), "ChatRoomAFCProposeEngage()", "engage"));
    if (window.ChatRoomAFCCanProposeMarry?.())
        toInsert.push(makeDialog(t('dMarry'), t('dMarryR'), "ChatRoomAFCProposeMarry()", "marry"));
    if (window.ChatRoomAFCCanBreakup?.())
        toInsert.push(makeDialog(t('dBreakup'), t('dBreakupR'), "ChatRoomAFCBreakup()", "breakup"));

    if (toInsert.length === 0) return;
    dialog.splice(backIndex, 0, ...toInsert);
}
