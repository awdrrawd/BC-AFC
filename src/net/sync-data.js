import { getSharedSettings } from '../core/settings.js';
// ════════════════════════════════════════
//  AFC module: sync-data.js
//  P2P 廣播：透過房內 Hidden 訊息即時同步 AFC 共享資料給房間內玩家
// ════════════════════════════════════════

// P2P 廣播：將 AFC 共享資料透過 Hidden 訊息傳給房間內所有玩家
export function broadcastAFCData() {
    try {
        if (typeof ServerSend !== 'function') return;
        const s = getSharedSettings();
        if (!s) return;
        ServerSend('ChatRoomChat', {
            Type: 'Hidden',
            Content: 'AFC::Sync',
            Dictionary: [{ Tag: 'AFCData', Data: {
                memberNumber: Player.MemberNumber,
                lovers:   s.lovers   ?? [],
                lockPerms: s.lockPerms ?? { enableAFCLock: true, enableOwnerLock: false },
            }}],
        });
    } catch {}
}

// 處理收到的 AFC 廣播（讓其他玩家的客戶端能即時看到你的戀人列表）
export function handleAFCSyncData(data) {
    if (data?.Content !== 'AFC::Sync') return false;
    try {
        const e = data.Dictionary?.find(d => d.Tag === 'AFCData');
        if (!e?.Data || (e.Data.memberNumber != null && e.Data.memberNumber !== data.Sender)) return true;
        // 自己的廣播不處理（防止 self-overwrite 覆蓋 Player.OnlineSharedSettings）
        if (data.Sender === Player.MemberNumber) return true;
        const sender = ChatRoomCharacter?.find(c => c.MemberNumber === data.Sender);
        if (!sender) return true;
        sender.OnlineSharedSettings = structuredClone(sender.OnlineSharedSettings ?? {});
        if (!sender.OnlineSharedSettings.AFC) sender.OnlineSharedSettings.AFC = {};
        sender.OnlineSharedSettings.AFC.memberNumber = data.Sender;
        if (Array.isArray(e.Data.lovers)) sender.OnlineSharedSettings.AFC.lovers    = structuredClone(e.Data.lovers);
        if (e.Data.lockPerms !== undefined) sender.OnlineSharedSettings.AFC.lockPerms = structuredClone(e.Data.lockPerms);
    } catch {}
    return true;
}
