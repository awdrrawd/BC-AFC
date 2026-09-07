// ════════════════════════════════════════
//  AFC module: roomname.js
//  戀人房間名稱分享（走 AccountBeep，仿 BCTweaks）
// ════════════════════════════════════════

import { AB, AFC_AB_TYPE } from '../core/config.js';
import { loversPrivateRoom, onlineFriendsCache } from '../core/state.js';
import { getSharedSettings } from '../core/settings.js';
import { refreshOnlineFriends, isOnline } from './online.js';
import { sendAccountBeep } from './beep.js';
import { sleep } from '../util/util.js';
import { isAFCLover } from '../relations/lovers.js';

// 進房 / 改房 / 建房後：把房名廣播給所有在線戀人
export async function broadcastRoomNameToLovers() {
    if (CurrentScreen !== "ChatRoom" || !ChatRoomData?.Private) return;
    await refreshOnlineFriends();
    let i = 1;
    for (const l of getSharedSettings()?.lovers ?? []) {
        if (!isOnline(l.memberNumber)) continue;
        await sleep(200 * i++);
        sendAccountBeep(l.memberNumber, AB.ROOM_NAME, true);
    }
}

// 只記錄本次登入已確認的狀態；舊房名快取不能當作新回覆。
const confirmedRooms = new Set();
export function resetRoomChecks() { confirmedRooms.clear(); }

export async function requestRoomNamesFromLovers(active) {
    if (!await refreshOnlineFriends(true) || !active()) return false;
    let complete = true;
    for (const l of getSharedSettings()?.lovers ?? []) {
        const num = Number(l.memberNumber);
        const friend = onlineFriendsCache.get(num);
        if (!friend) {
            // 成功取得的在線名單沒有此人：目前離線。
            delete loversPrivateRoom[num];
            confirmedRooms.delete(num);
            continue;
        }
        if (!friend.Private && friend.ChatRoomName) {
            updateSharedRoom({ ...friend, MemberNumber: num });
            continue;
        }
        if (confirmedRooms.has(num)) continue;
        complete = false;
        await sleep(300);
        if (!active()) return false;
        if (!isAFCLover(num)) continue;
        if (!window.ServerPlayerIsInChatRoom?.()) sendAccountBeep(num, AB.DEL_ROOM, false);
        sendAccountBeep(num, AB.REQ_ROOM, true);
    }
    return complete;
}

function updateSharedRoom(data) {
    if (typeof data.ChatRoomName === 'string' && data.ChatRoomName.length > 0) {
        confirmedRooms.add(data.MemberNumber);
        loversPrivateRoom[data.MemberNumber] = {
            ChatRoomName: data.ChatRoomName,
            ChatRoomSpace: data.ChatRoomSpace ?? 'X',
        };
    }
    // 缺少欄位的舊版 ReqRoom 不代表離房；清除只走明確的 DEL_ROOM。
}

// 離開私人房：通知戀人移除已分享的房名
export function clearSharedRoomName() {
    for (const l of getSharedSettings()?.lovers ?? [])
        sendAccountBeep(l.memberNumber, AB.DEL_ROOM, false);
}

// AccountBeep 解析（跨房房名分享專用；vanilla BC 對此 BeepType 靜默忽略）
export function parseAccountBeep(data) {
    if (!data || typeof data !== "object" || Array.isArray(data)) return;
    if (data.BeepType !== AFC_AB_TYPE) return;
    if (typeof data.MemberNumber !== "number") return;
    const from = data.MemberNumber;
    if (!isAFCLover(from)) return;
    switch (data.Message) {
        case AB.ROOM_NAME:
            updateSharedRoom(data);
            break;
        case AB.REQ_ROOM:
            updateSharedRoom(data);
            if (window.ServerPlayerIsInChatRoom?.())
                sendAccountBeep(from, AB.ROOM_NAME, true);
            else
                sendAccountBeep(from, AB.DEL_ROOM, false);
            break;
        case AB.DEL_ROOM:
            confirmedRooms.add(from);
            delete loversPrivateRoom[from];
            break;
    }
}
