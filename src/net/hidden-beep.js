// ════════════════════════════════════════
//  AFC module: hidden-beep.js
//  同房 Hidden「AFC::Beep」的可信解析。
//
//  Dictionary 內容完全由發送者控制。路由欄位（誰送的、誰是目標、訊息種類）
//  只能取自伺服器蓋章的 data.Sender 與經驗證的 MsgType，不能被 payload 覆蓋。
//  （舊實作把整份 Dictionary 項目展開在可信欄位之後，任何同房玩家都能在項目內
//   放入 MemberNumber 冒充他人，例如替我的戀人偽造 AFCBreakup。）
// ════════════════════════════════════════

import { AFC_BEEP_TYPE } from '../core/config.js';
import { cleanText } from '../util/text.js';

// 這些鍵屬於路由層，永遠不從 payload 讀取。
const RESERVED = new Set(['Tag', 'MsgType', 'TargetMember', 'MemberNumber', 'MemberName', 'BeepType', 'Message']);

const MAX_NAME = 40;

/** 取出對方自報的顯示名稱：只接受字串，去除控制字元並限長；否則退回 fallback。 */
export function peerName(value, fallback) {
    return cleanText(value, MAX_NAME) || fallback;
}

/**
 * 解析一則 ChatRoomMessage；若它是「給我的」AFC Beep 則回傳可交給 parseBeep 的物件。
 * @param {object} data               ChatRoomMessage 原始資料
 * @param {number} selfMemberNumber   本人的 MemberNumber
 * @returns {object|null}
 */
export function extractHiddenBeep(data, selfMemberNumber) {
    if (!data || data.Type !== 'Hidden' || data.Content !== 'AFC::Beep') return null;
    const sender = data.Sender;
    if (!Number.isSafeInteger(sender) || sender <= 0) return null;
    if (!Array.isArray(data.Dictionary)) return null;
    const entry = data.Dictionary.find(item => item?.Tag === 'AFC::Beep');
    if (!entry || typeof entry.MsgType !== 'string') return null;
    if (Number(entry.TargetMember) !== Number(selfMemberNumber)) return null;

    const payload = {};
    for (const [key, value] of Object.entries(entry)) {
        if (!RESERVED.has(key)) payload[key] = value;
    }
    return {
        ...payload,
        // 可信欄位放在最後，payload 無法覆蓋。
        MemberNumber: sender,
        MemberName: `#${sender}`,
        BeepType: AFC_BEEP_TYPE,
        Message: entry.MsgType,
    };
}
