// ════════════════════════════════════════
//  AFC module: beep-router.js
//  Beep 解析與分派（含傳輸層 ACK 與可靠訊息冪等去重）
// ════════════════════════════════════════

import { AFC_BEEP_TYPE, BEEP, STAGE } from '../core/config.js';
import { _recentBeepKeys, AFCLockAccessOn } from '../core/state.js';
import { _sendHidden, _clearAck, sendBeep } from './beep.js';
import { t } from '../i18n/i18n.js';
import { chatLocalNotice } from '../util/util.js';
import { handleIncomingProposal, handleAccepted } from '../relations/propose.js';
import { handleIncomingRestore, handleRestoreAccepted } from '../relations/restore.js';
import { handleIncomingStageProposal, handleAcceptedStage } from '../relations/stage.js';
import { isAFCLover, updateLastSeen, removeLover } from '../relations/lovers.js';

export function parseBeep(data) {
    if (!data) return;
    // 注意：BC 原生戀人申請（BeepType:"Lovers"）改由 AccountBeep listener 直接處理
    if (data.BeepType !== AFC_BEEP_TYPE) return;

    const from     = data.MemberNumber;
    const fromName = data.MemberName ?? `#${from}`;

    // ── 傳輸層 ACK：收到對方的 ACK → 停止重送 ──────────────
    if (data.Message === BEEP.ACK_T) { _clearAck(data.AckId); return; }

    // ── 可靠訊息（帶 _mid）：先回 ACK，再冪等去重 ──────────
    if (data._mid) {
        _sendHidden(from, BEEP.ACK_T, { AckId: data._mid });
        if (_recentBeepKeys.has(data._mid)) return;   // 重複投遞：只回 ACK，不重做
        _recentBeepKeys.add(data._mid);
        if (_recentBeepKeys.size > 500) {
            // 防無限增長：清掉最舊的一半
            const arr = [..._recentBeepKeys];
            for (let i = 0; i < 250; i++) _recentBeepKeys.delete(arr[i]);
        }
    }

    switch (data.Message) {
        case BEEP.PROPOSE:
            handleIncomingProposal(from, data.SenderName ?? fromName); break;
        case BEEP.PROPOSE_ACK:
            chatLocalNotice(t('proposeAck', fromName)); break;
        case BEEP.ACCEPT:
            handleAccepted(from, data.ReceiverName ?? fromName); break;
        case BEEP.ACCEPT_ACK:
            break;
        case BEEP.RESTORE_PROPOSE:
            handleIncomingRestore(from, data.SenderName ?? fromName,
                                  data.Stage, data.StartDate, data.StageDate); break;
        case BEEP.RESTORE_ACCEPT:
            handleRestoreAccepted(from, data.ReceiverName ?? fromName,
                                  data.Stage, data.StartDate, data.StageDate); break;

        case BEEP.PROPOSE_ENGAGE:
            handleIncomingStageProposal(from, data.SenderName ?? fromName, STAGE.ENGAGED); break;
        case BEEP.PROPOSE_MARRY:
            handleIncomingStageProposal(from, data.SenderName ?? fromName, STAGE.MARRIED); break;
        case BEEP.ACCEPT_ENGAGE:
            handleAcceptedStage(from, data.ReceiverName ?? fromName, STAGE.ENGAGED); break;
        case BEEP.ACCEPT_MARRY:
            handleAcceptedStage(from, data.ReceiverName ?? fromName, STAGE.MARRIED); break;

        case BEEP.SYNC_REQUEST:
            if (isAFCLover(from)) {
                AFCLockAccessOn.add(from);
                updateLastSeen(from);
                sendBeep(from, BEEP.SYNC_GRANT, { GranterName: Player.Name });
            }
            break;
        case BEEP.SYNC_GRANT:
            if (isAFCLover(from)) {
                AFCLockAccessOn.add(from);
                updateLastSeen(from);
            }
            break;
        case BEEP.LOCK_ACCESS_OFF:
            AFCLockAccessOn.delete(from); break;
        case BEEP.BREAKUP:
            if (isAFCLover(from)) {
                removeLover(from);
                chatLocalNotice(t('breakupOther', fromName));
            }
            break;
        // 房名分享已改走 AccountBeep（見 parseAccountBeep），Hidden 不再處理 ROOM_NAME
        default:
            console.warn("🐈‍⬛ [AFC] ⚠️ 未知 Beep:", data.Message);
    }
}
