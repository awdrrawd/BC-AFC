// ════════════════════════════════════════
//  AFC module: propose.js
//  ① 申請流程（發起／接收）+ window.ChatRoomAFC* dialog 入口與 prerequisite
// ════════════════════════════════════════

import { STAGE, BEEP, PROPOSE_COOLDOWN_MS, PROPOSE_EXPIRE_MS, STAGE_PROMOTE_DAYS } from '../core/config.js';
import { _lastProposalSent, pendingOutgoing, pendingIncoming, AFCLockAccessOn } from '../core/state.js';
import { getPrivateSettings, savePrivateSettings } from '../core/settings.js';
import { chatLocalNotice, daysSince } from '../util/util.js';
import { t } from '../i18n/i18n.js';
import { sendBeep } from '../net/beep.js';
import {
    addLover, updateLastSeen, isAFCLover, isNativeLover, targetHasAFC, getLoverEntry,
} from './lovers.js';
import { initiateBreakup, broadcastEvent } from './breakup.js';
import { proposeStageUpgrade } from './stage.js';
import { proposeRestore } from './restore.js';
import { clearRequest, scheduleOutgoing, showIncoming } from './request-manager.js';

// ── Window prerequisite 函式 ──
window.ChatRoomAFCCanPropose = function () {
    const C = CurrentCharacter;
    if (!C?.MemberNumber || C.MemberNumber === Player.MemberNumber) return false;
    if (isAFCLover(C.MemberNumber)) return false;
    if (isNativeLover(C.MemberNumber)) return false;
    if (!targetHasAFC(C)) return false;
    return true;
};

window.ChatRoomAFCCanBreakup = function () {
    return !!(CurrentCharacter?.MemberNumber && isAFCLover(CurrentCharacter.MemberNumber));
};

// 訂婚條件：交往滿 STAGE_PROMOTE_DAYS 天
window.ChatRoomAFCCanProposeEngage = function () {
    if (!CurrentCharacter) return false;
    const l = getLoverEntry(CurrentCharacter.MemberNumber);
    if (!l || l.stage !== STAGE.DATING) return false;
    return daysSince(l.startDate) >= STAGE_PROMOTE_DAYS;
};

// 結婚條件：訂婚滿 STAGE_PROMOTE_DAYS 天
window.ChatRoomAFCCanProposeMarry = function () {
    if (!CurrentCharacter) return false;
    const l = getLoverEntry(CurrentCharacter.MemberNumber);
    if (!l || l.stage !== STAGE.ENGAGED) return false;
    return daysSince(l.stageDate ?? l.startDate) >= STAGE_PROMOTE_DAYS;
};

// 恢復條件：對方有我（寬鬆條件，點擊時才做完整驗證）
// 只要我還不是對方的拓展戀人就顯示（讓點擊時決定）
window.ChatRoomAFCCanRestore = function () {
    const C = CurrentCharacter;
    if (!C?.MemberNumber || C.MemberNumber === Player.MemberNumber) return false;
    if (isNativeLover(C.MemberNumber)) return false;
    if (!targetHasAFC(C)) return false;
    const iHaveC = isAFCLover(C.MemberNumber);
    const cHasMe = C.OnlineSharedSettings?.AFC?.lovers
    ?.some(l => Number(l.memberNumber) === Number(Player.MemberNumber)) ?? false;
    // 情況A：對方有我但我沒有對方 | 情況B：我有對方但對方沒有我
    return (iHaveC && !cHasMe) || (!iHaveC && cHasMe);
};

window.ChatRoomAFCRestore = function () {
    if (!CurrentCharacter) return;
    proposeRestore(CurrentCharacter);
};

window.ChatRoomAFCPropose       = function () { if (CurrentCharacter) proposeToCharacter(CurrentCharacter); };
window.ChatRoomAFCBreakup       = function () { if (CurrentCharacter) initiateBreakup(CurrentCharacter.MemberNumber, CurrentCharacter.Name); };
window.ChatRoomAFCProposeEngage = function () { if (CurrentCharacter) proposeStageUpgrade(CurrentCharacter, STAGE.ENGAGED); };
window.ChatRoomAFCProposeMarry  = function () { if (CurrentCharacter) proposeStageUpgrade(CurrentCharacter, STAGE.MARRIED); };

// ── ① 申請流程 — 發起方 ──
export function proposeToCharacter(C) {
    const target = C.MemberNumber;
    if (!Player.FriendList?.includes(target)) {
        chatLocalNotice(t('notFriend', C.Name)); return;
    }
    if (!targetHasAFC(C))      { chatLocalNotice(t('notInstalled', C.Name)); return; }
    if (isAFCLover(target))    { chatLocalNotice(t('alreadyAFC', C.Name)); return; }
    if (isNativeLover(target)){ chatLocalNotice(t('alreadyBC', C.Name)); return; }

    const priv = getPrivateSettings();
    const last = _lastProposalSent[target] ?? 0;
    if (Date.now() - last < PROPOSE_COOLDOWN_MS) {
        const sec = Math.ceil((PROPOSE_COOLDOWN_MS - (Date.now() - last)) / 1000);
        chatLocalNotice(t('cooldown', sec)); return;
    }

    sendBeep(target, BEEP.PROPOSE, { SenderName: Player.Name });

    if (priv) {
        _lastProposalSent[target] = Date.now();
        savePrivateSettings(priv);
    }

    scheduleOutgoing(pendingOutgoing, target, PROPOSE_EXPIRE_MS, () => {
        if (!isAFCLover(target)) chatLocalNotice(t('proposeExpired', C.Name));
    });
    chatLocalNotice(t('proposeSent', C.Name));
}

// ② 申請流程 — 接收方 UI
export function handleIncomingProposal(senderNum, senderName) {
    if (pendingIncoming[senderNum]) return;

    // 若已是戀人（雙向確認）則不需要再提案
    if (isAFCLover(senderNum) || isNativeLover(senderNum)) return;  // 已是戀人

    sendBeep(senderNum, BEEP.PROPOSE_ACK);

    const uiId = `el-proposal-${senderNum}`;

    showIncoming({
        store: pendingIncoming, key: senderNum, uiId,
        title:     t('propTitle', senderName, senderNum),
        subText:   t('timerText', 3, '00'),
        expireMessage: t('proposeExpired', senderName),
        onAccept:  close => acceptProposal(senderNum, senderName, close),
    });
}

export function cleanupIncomingUI(num) {
    clearRequest(pendingIncoming, num);
}

function acceptProposal(senderNum, senderName, close = () => cleanupIncomingUI(senderNum)) {
    close();
    addLover(senderNum, senderName, STAGE.DATING);
    AFCLockAccessOn.add(senderNum);
    updateLastSeen(senderNum);
    broadcastEvent('becameLovers', senderNum, senderName);
    sendBeep(senderNum, BEEP.ACCEPT, { ReceiverName: Player.Name });
}

export function handleAccepted(fromNum, receiverName) {
    // 只認自己確實送出過申請的接受回覆；無對應 pending 即視為偽造/未經請求的 ACCEPT，忽略。
    // （申請有效期 PROPOSE_EXPIRE_MS = 3 分鐘，ACCEPT 走可靠傳輸，合法回覆必在期內到達）
    if (!pendingOutgoing[fromNum]) return;
    clearRequest(pendingOutgoing, fromNum);
    if (!isAFCLover(fromNum)) {
        addLover(fromNum, receiverName, STAGE.DATING);
        AFCLockAccessOn.add(fromNum);
        updateLastSeen(fromNum);
        chatLocalNotice(t('proposeOK', receiverName));
    }
    // 回應 ACCEPT_ACK
    sendBeep(fromNum, BEEP.ACCEPT_ACK, { AckNumber: Player.MemberNumber });
}
