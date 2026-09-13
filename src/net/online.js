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
import { sleep } from '../util/util.js';
import { sendBeep } from './beep.js';
import { registerSocketListener } from '../core/socket.js';

let onlineFetch = null;
let fetchPlayer = null;
let cancelFetch = null;
export function cancelOnlineFetch() {
    cancelFetch?.();
    cancelFetch = null;
    onlineFetch = null;
    fetchPlayer = null;
}

export function refreshOnlineFriends(force = false) {
    const account = Player;
    const memberNumber = Player?.MemberNumber;
    if (onlineFetch && fetchPlayer === account) return onlineFetch;
    fetchPlayer = account;
    if (!force && Date.now() - lastOnlineFetch < 30000) return Promise.resolve(true);
    const request = new Promise(resolve => {
        let unregister = () => {};
        let removeDisconnect = () => {};
        const finish = success => {
            unregister();
            removeDisconnect();
            clearTimeout(timer);
            resolve(success);
        };
        cancelFetch = () => finish(false);
        const timer = setTimeout(() => finish(false), 5000);
        const handler = (data) => {
            if (data?.Query !== "OnlineFriends") return;
            if (Player !== account || Player?.MemberNumber !== memberNumber) { finish(false); return; }
            if (!Array.isArray(data.Result)) { finish(false); return; }
            setOnlineFriendsCache(new Map((data.Result ?? []).map(f => [f.MemberNumber, f])));
            setLastOnlineFetch(Date.now());
            finish(true);
        };
        unregister = registerSocketListener("AccountQueryResult", handler);
        removeDisconnect = registerSocketListener('disconnect', () => finish(false));
        try { ServerSend("AccountQuery", { Query: "OnlineFriends" }); }
        catch { finish(false); }
    });
    const pending = request.finally(() => { if (onlineFetch === pending) onlineFetch = null; });
    onlineFetch = pending;
    return onlineFetch;
}

// 判斷某個 MemberNumber 是否在線
// 僅用兩個可靠來源：同房間角色 + OnlineFriends 查詢快取
// AFCLockAccessOn 是鎖定授權，不代表對方目前在線，不納入判斷
export function isOnline(memberNumber) {
    if (ChatRoomCharacter?.some(c => c.MemberNumber === memberNumber)) return true;
    return onlineFriendsCache.has(memberNumber);
}

export async function syncWithOnlineLovers() {
    const account = Player;
    const memberNumber = Player?.MemberNumber;
    const active = () => Player === account && Player?.MemberNumber === memberNumber;
    const shared = getSharedSettings();
    if (!shared?.lovers.length) return;

    if (!await refreshOnlineFriends() || !active()) return;
    const onlineFriends = onlineFriendsCache;

    let i = 1;
    for (const lover of shared.lovers) {
        if (onlineFriends.has(lover.memberNumber)) {
            await sleep(200 * i++);
            if (!active()) return;
            sendBeep(lover.memberNumber, BEEP.SYNC_REQUEST, { SenderName: Player.Name });
        }
    }
}
