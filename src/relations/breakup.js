// ════════════════════════════════════════
//  AFC module: breakup.js
//  Action 廣播 / 解除關係 / BC 原生戀人申請美化通知
// ════════════════════════════════════════

import { BEEP, STAGE } from '../core/config.js';
import { AFCLockAccessOn } from '../core/state.js';
import { chatLocalNotice } from '../util/util.js';
import { t } from '../i18n/i18n.js';
import { sendBeep } from '../net/beep.js';
import { sendLocalizedAction } from '../i18n/l10n.js';
import { isAFCLover, removeLover } from './lovers.js';

// 廣播戀人事件（在地化：發英文底本，裝插件的接收端各看各語言）。
//   kind='becameLovers'（成為拓展戀人）| 'upgraded'（升格，需帶 stage：訂婚/結婚）
//   位置參數：{0}=我名 {1}=我ID {2}=對方名 {3}=對方ID
export function broadcastEvent(kind, otherNum, otherName, stage) {
    let key = kind;
    if (kind === 'upgraded') key = stage === STAGE.MARRIED ? 'upgradedMarried' : 'upgradedEngaged';
    sendLocalizedAction('afc', key, [Player.Name, Player.MemberNumber, otherName, otherNum]);
}

export function initiateBreakup(num, name) {
    if (!isAFCLover(num)) return;
    sendBeep(num, BEEP.LOCK_ACCESS_OFF);
    sendBeep(num, BEEP.BREAKUP);
    removeLover(num);
    AFCLockAccessOn.delete(num);
    chatLocalNotice(t('breakupSelf', name ?? `#${num}`));
}

// ── BC 原生戀人申請攔截（顯示友善通知）──
//   BC 透過 AccountBeep BeepType:"Lovers" 通知接收方
//   實際同意仍需至關係管理，此處僅提供美化通知
export function handleBCLoverProposal(data) {
    const senderNum  = data.MemberNumber;
    const senderName = data.MemberName ?? `#${senderNum}`;
    const uiId = `el-bc-lover-${senderNum}`;
    if (document.getElementById(uiId)) return;

    const chatLog = document.getElementById("TextAreaChatLog");
    if (!chatLog) return;

    const el = document.createElement("div");
    el.id = uiId;
    el.style.cssText = [
        "background:rgba(80,20,120,0.18)",
        "border:1px solid #9C4AED",
        "border-radius:10px",
        "padding:14px 18px",
        "margin:10px 4px",
        "font-size:15px",
        "line-height:1.75",
        "color:#eee",
    ].join(";");
    el.innerHTML = `
        <div style="font-weight:bold;font-size:16px;margin-bottom:4px;">
            ${t('bcTitle', senderName, senderNum)}
        </div>
        <div style="font-size:13px;opacity:0.7;">
            ${t('bcNote')}
        </div>`;
    chatLog.appendChild(el);
    chatLog.scrollTop = chatLog.scrollHeight;
    // 30 秒後自動移除通知
    setTimeout(() => el?.remove(), 30000);
}
