// ════════════════════════════════════════
//  AFC module: sync-data.js
//  P2P 廣播：透過房內 Hidden 訊息即時同步 AFC 共享資料給房間內玩家
// ════════════════════════════════════════

// P2P 廣播：將 AFC 共享資料透過 Hidden 訊息傳給房間內所有玩家
export function broadcastAFCData() {
    try {
        if (typeof ServerSend !== 'function') return;
        const s = Player.OnlineSharedSettings?.AFC;
        if (!s) return;
        ServerSend('ChatRoomChat', {
            Type: 'Hidden',
            Content: 'AFC::Sync',
            Dictionary: [{ Tag: 'AFCData', Data: {
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
        if (!e) return true;
        // 自己的廣播不處理（防止 self-overwrite 覆蓋 Player.OnlineSharedSettings）
        if (data.Sender === Player.MemberNumber) return true;
        const sender = ChatRoomCharacter?.find(c => c.MemberNumber === data.Sender);
        if (!sender) return true;
        if (!sender.OnlineSharedSettings) sender.OnlineSharedSettings = {};
        if (!sender.OnlineSharedSettings.AFC) sender.OnlineSharedSettings.AFC = {};
        if (e.Data.lovers    !== undefined) sender.OnlineSharedSettings.AFC.lovers    = e.Data.lovers;
        if (e.Data.lockPerms !== undefined) sender.OnlineSharedSettings.AFC.lockPerms = e.Data.lockPerms;
    } catch {}
    return true;
}
