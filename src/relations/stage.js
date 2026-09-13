// ════════════════════════════════════════
//  AFC module: stage.js
//  ③ 升格流程（交往 → 訂婚 → 結婚）
// ════════════════════════════════════════

import { STAGE, BEEP, STAGE_LABEL, PROPOSE_EXPIRE_MS } from '../core/config.js';
import { pendingStageProp, pendingStageInc } from '../core/state.js';
import { t, stageLabel } from '../i18n/i18n.js';
import { chatLocalNotice } from '../util/util.js';
import { sendBeep } from '../net/beep.js';
import { promoteStage, getLoverEntry, isAFCLover } from './lovers.js';
import { broadcastEvent } from './breakup.js';
import { clearRequest, scheduleOutgoing, showIncoming } from './request-manager.js';

const STAGE_BEEP_PROPOSE = {
    [STAGE.ENGAGED]: BEEP.PROPOSE_ENGAGE,
    [STAGE.MARRIED]: BEEP.PROPOSE_MARRY,
};
const STAGE_BEEP_ACCEPT = {
    [STAGE.ENGAGED]: BEEP.ACCEPT_ENGAGE,
    [STAGE.MARRIED]: BEEP.ACCEPT_MARRY,
};

export function proposeStageUpgrade(C, newStage) {
    const key = `${C.MemberNumber}_${newStage}`;
    const label = stageLabel(newStage);
    if (pendingStageProp[key]) { chatLocalNotice(t('stageSent', C.Name, label)); return; }

    sendBeep(C.MemberNumber, STAGE_BEEP_PROPOSE[newStage], { SenderName: Player.Name });

    scheduleOutgoing(pendingStageProp, key, PROPOSE_EXPIRE_MS, () => {
        const current = getLoverEntry(C.MemberNumber);
        if (current?.stage !== newStage) chatLocalNotice(t('stageExpired', C.Name, label));
    });
    chatLocalNotice(t('stageSent', C.Name, label));
}

export function handleIncomingStageProposal(senderNum, senderName, newStage) {
    if (!newStage || !STAGE_LABEL[newStage]) return;

    if (!isAFCLover(senderNum)) return; // Restore a missing relationship explicitly first.

    const key   = `${senderNum}_${newStage}`;
    const uiId  = `el-stage-${senderNum}-${newStage}`;
    const label = stageLabel(newStage);
    if (pendingStageInc[key]) return;

    showIncoming({
        store: pendingStageInc, key, uiId,
        title:     t('stageTitle', senderName, senderNum, label),
        subText:   t('timerText', 3, '00'),
        expireMessage: t('stageExpired', senderName, label),
        onAccept: close => acceptStageProposal(senderNum, senderName, newStage, close),
    });
}

function acceptStageProposal(senderNum, senderName, newStage, close) {
    close();
    promoteStage(senderNum, newStage);
    sendBeep(senderNum, STAGE_BEEP_ACCEPT[newStage], { ReceiverName: Player.Name });
    // B（接受方）看到：你接受了 A 的 [訂婚] 申請
    chatLocalNotice(t('stageOKSelf', senderName, stageLabel(newStage)));
    broadcastEvent('upgraded', senderNum, senderName, newStage);
}

export function handleAcceptedStage(fromNum, receiverName, newStage) {
    const key = `${fromNum}_${newStage}`;
    // 只認自己確實送出過升格申請的接受回覆；無對應 pending 即忽略（防偽造遠端升格）
    if (!pendingStageProp[key]) return;
    clearRequest(pendingStageProp, key);
    promoteStage(fromNum, newStage);
    // A（發起方）看到：B 接受了你的 [訂婚] 申請
    chatLocalNotice(t('stageOK', receiverName, stageLabel(newStage)));
}
