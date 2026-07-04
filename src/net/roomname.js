// ════════════════════════════════════════
//  AFC module: roomname.js
//  戀人房間名稱分享（走 AccountBeep，仿 BCTweaks）
// ════════════════════════════════════════

import { AB, AFC_AB_TYPE } from '../core/config.js';
import { loversPrivateRoom } from '../core/state.js';
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

// 登入 / 重連後：向所有在線戀人請求他們的房名
export async function requestRoomNamesFromLovers() {
    await refreshOnlineFriends();
    let i = 1;
    for (const l of getSharedSettings()?.lovers ?? []) {
        if (!isOnline(l.memberNumber)) continue;
        await sleep(300 * i++);
        sendAccountBeep(l.memberNumber, AB.REQ_ROOM, false);
    }
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
    switch (data.Message) {
        case AB.ROOM_NAME:
            // 只接受戀人的房名
            if (!isAFCLover(from)) return;
            loversPrivateRoom[from] = {
                ChatRoomName:  data.ChatRoomName  ?? null,
                ChatRoomSpace: data.ChatRoomSpace ?? "X",
            };
            break;
        case AB.REQ_ROOM:
            // 對方請求我的房名：我在私人房且對方是戀人時回送
            if (isAFCLover(from) && CurrentScreen === "ChatRoom" && ChatRoomData?.Private)
                sendAccountBeep(from, AB.ROOM_NAME, true);
            break;
        case AB.DEL_ROOM:
            delete loversPrivateRoom[from];
            break;
    }
}
