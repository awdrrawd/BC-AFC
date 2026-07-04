// ════════════════════════════════════════
//  AFC module: beep.js
//  可靠傳輸層（重送到 ACK 為止 + 接收端冪等）+ AccountBeep（跨房）
//    同房間 Hidden 走 socket.io 雖然可靠，但接收端 listener 尚未就緒 / 短暫不同房 /
//    OnlineSharedSettings 尚未同步造成驗證 race 都可能吃掉單發訊息。
//    對關鍵訊息加上「重送到 ACK 為止 + 接收端冪等去重」。
// ════════════════════════════════════════

import { RELIABLE_BEEPS, AFC_AB_TYPE } from '../core/config.js';
import { _pendingAcks, bumpMidSeq } from '../core/state.js';

const RELIABLE_INTERVAL = 2500;
const RELIABLE_MAXTRY   = 6;

function _newMid() {
    return `${Player?.MemberNumber ?? 0}-${Date.now().toString(36)}-${bumpMidSeq().toString(36)}`;
}

export function _sendHidden(target, msgType, extra = {}) {
    try {
        ServerSend("ChatRoomChat", {
            Type:    "Hidden",
            Content: "AFC::Beep",
            Dictionary: [{ Tag: "AFC::Beep", MsgType: msgType, TargetMember: target, ...extra }],
        });
    } catch {}
}

export function sendBeep(target, msgType, extra = {}) {
    if (!RELIABLE_BEEPS.has(msgType)) { _sendHidden(target, msgType, extra); return; }
    const mid     = _newMid();
    const payload = { ...extra, _mid: mid };
    _sendHidden(target, msgType, payload);
    let tries = 1;
    const timer = setInterval(() => {
        if (tries >= RELIABLE_MAXTRY) { _clearAck(mid); return; }
        tries++;
        _sendHidden(target, msgType, payload);
    }, RELIABLE_INTERVAL);
    _pendingAcks[mid] = { timer };
}

export function _clearAck(mid) {
    const p = _pendingAcks[mid];
    if (p) { clearInterval(p.timer); delete _pendingAcks[mid]; }
}

// ── AccountBeep（跨房）：戀人房名分享，仿 BCTweaks ───────────────
// IsSecret:false 時，BC 伺服器會在轉發的 beep 上自動蓋上發送者當下的
// ChatRoomName / ChatRoomSpace / Private，接收端直接讀 data.ChatRoomName。
export function sendAccountBeep(target, msg, includeRoom = false) {
    try {
        if (!Player?.FriendList?.includes(target)) return;   // 必須是好友才送得出
        ServerSend("AccountBeep", {
            MemberNumber: target,
            BeepType:     AFC_AB_TYPE,
            Message:      msg,
            IsSecret:     !includeRoom,
        });
    } catch {}
}
