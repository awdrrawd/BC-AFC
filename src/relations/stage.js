// ════════════════════════════════════════
//  AFC module: stage.js
//  ③ 升格流程（交往 → 訂婚 → 結婚）
// ════════════════════════════════════════

import { STAGE, BEEP, STAGE_LABEL, PROPOSE_EXPIRE_MS } from '../core/config.js';
import { pendingStageProp, pendingStageInc, setLastKnownLoverCount } from '../core/state.js';
import { getSharedSettings, saveSharedSettings } from '../core/settings.js';
import { t, stageLabel } from '../i18n/i18n.js';
import { chatLocalNotice } from '../util/util.js';
import { sendBeep } from '../net/beep.js';
import { promoteStage, getLoverEntry, isAFCLover } from './lovers.js';
import { broadcastEvent } from './breakup.js';
import { _lsReadLovers } from '../core/storage.js';
import { createProposalUI, startCountdown } from '../ui/proposal-ui.js';

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

    pendingStageProp[key] = {
        timer: setTimeout(() => {
            delete pendingStageProp[key];
            // 若對方已接受（stage 已升格），不顯示逾時訊息
            const current = getLoverEntry(C.MemberNumber);
            if (current?.stage !== newStage) chatLocalNotice(t('stageExpired', C.Name, label));
        }, PROPOSE_EXPIRE_MS),
    };
    chatLocalNotice(t('stageSent', C.Name, label));
}

export function handleIncomingStageProposal(senderNum, senderName, newStage) {
    if (!newStage || !STAGE_LABEL[newStage]) return;

    // 雙向驗證：自己有對方 OR 對方有自己（容許單方面資料丟失）
    const senderChar = ChatRoomCharacter?.find(c => c.MemberNumber === senderNum);
    const senderHasMe = senderChar?.OnlineSharedSettings?.AFC?.lovers
    ?.some(l => Number(l.memberNumber) === Number(Player.MemberNumber)) ?? false;

    // 我這邊沒有對方紀錄時：先嘗試從本機 DB 補回基礎關係，否則升格會無效
    if (!isAFCLover(senderNum)) {
        const fromDB = _lsReadLovers().find(l => Number(l.memberNumber) === Number(senderNum));
        if (fromDB) {
            const s = getSharedSettings();
            if (s && !s.lovers.some(l => Number(l.memberNumber) === Number(senderNum))) {
                s.lovers.push({
                    memberNumber: senderNum, name: fromDB.name ?? senderName,
                    stage:     fromDB.stage     ?? STAGE.DATING,
                    startDate: fromDB.startDate ?? Date.now(),
                    stageDate: fromDB.stageDate ?? fromDB.startDate ?? Date.now(),
                    lastSeen:  Date.now(),
                });
                setLastKnownLoverCount(s.lovers.length);
                saveSharedSettings();
            }
        } else if (!senderHasMe) {
            return;   // 我沒有、DB 沒有、對方也沒列我 → 無從升格
        }
    }

    const key   = `${senderNum}_${newStage}`;
    const uiId  = `el-stage-${senderNum}-${newStage}`;
    const label = stageLabel(newStage);
    if (pendingStageInc[key]) return;

    const el = createProposalUI({
        uiId,
        title:     t('stageTitle', senderName, senderNum, label),
        subText:   t('timerText', 3, '00'),
        onAccept:  () => acceptStageProposal(senderNum, senderName, newStage, key, uiId),
        onDecline: () => cleanupStageUI(key, uiId),
    });
    if (!el) return;

    const iv = startCountdown(uiId, `${uiId}-sub`, () => cleanupStageUI(key, uiId),
                              t('stageExpired', senderName, label));
    pendingStageInc[key] = { timer: iv, uiId };
}

function acceptStageProposal(senderNum, senderName, newStage, key, uiId) {
    cleanupStageUI(key, uiId);
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
    clearTimeout(pendingStageProp[key].timer);
    delete pendingStageProp[key];
    promoteStage(fromNum, newStage);
    // A（發起方）看到：B 接受了你的 [訂婚] 申請
    chatLocalNotice(t('stageOK', receiverName, stageLabel(newStage)));
}

function cleanupStageUI(key, uiId) {
    const p = pendingStageInc[key];
    if (p) { clearInterval(p.timer); delete pendingStageInc[key]; }
    document.getElementById(uiId)?.remove();
}
