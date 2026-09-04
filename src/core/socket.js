// ════════════════════════════════════════
//  AFC module: socket.js
//  ServerSocket 監聽註冊 / 全部移除
// ════════════════════════════════════════

const socketChannels = new Map();

export function registerSocketListener(event, listener) {
    let channel = socketChannels.get(event);
    if (!channel) {
        const listeners = new Set();
        const dispatch = data => {
            for (const handler of [...listeners]) {
                try { handler(data); } catch (error) {
                    console.error(`🐈‍⬛ [AFC] ${event} listener failed:`, error);
                }
            }
        };
        channel = { listeners, dispatch };
        socketChannels.set(event, channel);
        ServerSocket.on(event, dispatch);
    }
    channel.listeners.add(listener);
    return () => {
        const current = socketChannels.get(event);
        if (!current) return;
        current.listeners.delete(listener);
        if (current.listeners.size === 0) {
            ServerSocket.off(event, current.dispatch);
            socketChannels.delete(event);
        }
    };
}

export function unregisterAllSocketListeners() {
    for (const [event, channel] of socketChannels) ServerSocket.off(event, channel.dispatch);
    socketChannels.clear();
}
