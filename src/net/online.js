// ════════════════════════════════════════
//  AFC module: online.js
//  線上狀態查詢 + 上線同步握手
// ════════════════════════════════════════

import { BEEP } from '../core/config.js';
import {
    onlineFriendsCache, setOnlineFriendsCache,
    lastOnlineFetch, setLastOnlineFetch,
} from '../core/state.js';
import { getSharedSettings } from '../core/settings.js';
import { sleep, waitFor } from '../util/util.js';
import { sendBeep } from './beep.js';

export async function refreshOnlineFriends() {
    if (Date.now() - lastOnlineFetch < 30000) return;  // 節流 30 秒
    setLastOnlineFetch(Date.now());
    return new Promise(resolve => {
        let resolved = false;
        const timer = setTimeout(() => { if (!resolved) { resolved = true; resolve(); } }, 5000);
        const handler = (data) => {
            if (data?.Query !== "OnlineFriends") return;
            ServerSocket.off("AccountQueryResult", handler);
            clearTimeout(timer);
            setOnlineFriendsCache(new Set(data.Result?.map(f => f.MemberNumber) ?? []));
            setLastOnlineFetch(Date.now());
            if (!resolved) { resolved = true; resolve(); }
        };
        ServerSocket.on("AccountQueryResult", handler);
        ServerSend("AccountQuery", { Query: "OnlineFriends" });
    });
}

// 判斷某個 MemberNumber 是否在線
// 僅用兩個可靠來源：同房間角色 + OnlineFriends 查詢快取
// AFCLockAccessOn 是鎖定授權，不代表對方目前在線，不納入判斷
export function isOnline(memberNumber) {
    if (ChatRoomCharacter?.some(c => c.MemberNumber === memberNumber)) return true;
    return onlineFriendsCache.has(memberNumber);
}

export async function syncWithOnlineLovers() {
    const shared = getSharedSettings();
    if (!shared?.lovers.length) return;

    let onlineFriends = null;
    const handler = (data) => {
        if (data?.Query === "OnlineFriends")
            onlineFriends = new Set(data.Result?.map(f => f.MemberNumber) ?? []);
    };
    ServerSocket.on("AccountQueryResult", handler);
    ServerSend("AccountQuery", { Query: "OnlineFriends" });
    await waitFor(() => onlineFriends !== null, 5000);
    ServerSocket.off("AccountQueryResult", handler);
    if (!onlineFriends) return;

    setOnlineFriendsCache(onlineFriends);
    setLastOnlineFetch(Date.now());

    let i = 1;
    for (const lover of shared.lovers) {
        if (onlineFriends.has(lover.memberNumber)) {
            await sleep(200 * i++);
            sendBeep(lover.memberNumber, BEEP.SYNC_REQUEST, { SenderName: Player.Name });
        }
    }
}
