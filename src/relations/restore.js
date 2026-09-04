// ════════════════════════════════════════
//  AFC module: restore.js
//  關係恢復流程（雙方資料不對稱時補齊，並保留原始關係日期與階段）
// ════════════════════════════════════════

import { STAGE, BEEP, PROPOSE_EXPIRE_MS } from '../core/config.js';
import { pendingRestoreOut, pendingRestoreInc, AFCLockAccessOn } from '../core/state.js';
import { t } from '../i18n/i18n.js';
import { chatLocalNotice } from '../util/util.js';
import { sendBeep } from '../net/beep.js';
import { isAFCLover, getLoverEntry, updateLastSeen, upsertLover } from './lovers.js';
import { clearRequest, scheduleOutgoing, showIncoming } from './request-manager.js';

export function proposeRestore(C, quiet = false) {
    const target = C.MemberNumber;
    const iHaveC = isAFCLover(target);
    const cHasMe = C.OnlineSharedSettings?.AFC?.lovers
    ?.some(l => Number(l.memberNumber) === Number(Player.MemberNumber)) ?? false;

    let stage, startDate, stageDate;
    if (iHaveC && !cHasMe) {
        // 情況B：我有對方的記錄，傳給對方
        const myEntry = getLoverEntry(target);
        if (!myEntry) return;
        stage = myEntry.stage; startDate = myEntry.startDate; stageDate = myEntry.stageDate;
    } else if (!iHaveC && cHasMe) {
        // 情況A：對方有我的記錄，讀取後傳
        const theirEntry = C.OnlineSharedSettings?.AFC?.lovers
        ?.find(l => Number(l.memberNumber) === Number(Player.MemberNumber));
        if (!theirEntry) return;
        stage = theirEntry.stage; startDate = theirEntry.startDate; stageDate = theirEntry.stageDate;
    } else { return; }

    sendBeep(target, BEEP.RESTORE_PROPOSE, {
        SenderName: Player.Name,
        Stage:      stage     ?? STAGE.DATING,
        StartDate:  startDate ?? Date.now(),
        StageDate:  stageDate ?? Date.now(),
    });
    scheduleOutgoing(pendingRestoreOut, target, PROPOSE_EXPIRE_MS);
    if (!quiet) chatLocalNotice(t('restoreSent', C.Name));
}

export function handleIncomingRestore(senderNum, senderName, stage, startDate, stageDate) {
    if (pendingRestoreInc[senderNum]) return;
    const uiId = `el-restore-${senderNum}`;
    showIncoming({
        store: pendingRestoreInc, key: senderNum, uiId,
        title:     t('restoreTitle', senderName, senderNum),
        subText:   t('timerText', 3, '00'),
        expireMessage: null,
        onAccept: close => acceptRestore(senderNum, senderName, stage, startDate, stageDate, close),
    });
}

function acceptRestore(senderNum, senderName, stage, startDate, stageDate, close) {
    close();
    if (!isAFCLover(senderNum)) {
        // Case B：我（丟失方）收到保有方的申請，直接 addLover
        upsertLover({ memberNumber: senderNum, name: senderName, stage, startDate, stageDate });
    }
    // 無論哪個 Case，都把資料帶回給對方
    // Case A：我（保有方）已有對方，找出我記錄的對方資料，回傳讓對方 addLover
    // Case B：我剛 addLover 完畢，回傳確認
    const myEntryForSender = getLoverEntry(senderNum);
    AFCLockAccessOn.add(senderNum);
    updateLastSeen(senderNum);
    sendBeep(senderNum, BEEP.RESTORE_ACCEPT, {
        ReceiverName:      Player.Name,
        Stage:             myEntryForSender?.stage     ?? stage,
        StartDate:         myEntryForSender?.startDate ?? startDate,
        StageDate:         myEntryForSender?.stageDate ?? stageDate,
    });
    chatLocalNotice(t('restoreOK', senderName));
}

export function handleRestoreAccepted(fromNum, receiverName, stage, startDate, stageDate) {
    // 只認自己確實送出過恢復申請的接受回覆；無對應 pending 即忽略（防偽造）
    if (!pendingRestoreOut[fromNum]) return;
    clearRequest(pendingRestoreOut, fromNum);
    // Case A：我是丟失方，對方回傳資料，現在 addLover
    if (!isAFCLover(fromNum)) {
        upsertLover({ memberNumber: fromNum, name: receiverName,
                      stage: stage ?? STAGE.DATING,
                      startDate: startDate ?? Date.now(),
                      stageDate: stageDate ?? Date.now() });
    }
    AFCLockAccessOn.add(fromNum);
    updateLastSeen(fromNum);
    chatLocalNotice(t('restoreOK', receiverName));
}
