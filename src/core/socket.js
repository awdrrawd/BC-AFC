// ════════════════════════════════════════
//  AFC module: socket.js
//  ServerSocket 監聽註冊 / 全部移除
// ════════════════════════════════════════

const socketListeners = [];

export function registerSocketListener(event, listener) {
    if (!socketListeners.some(l => l[1] === listener)) {
        socketListeners.push([event, listener]);
        ServerSocket.on(event, listener);
    }
}

export function unregisterAllSocketListeners() {
    for (const [event, listener] of socketListeners) ServerSocket.off(event, listener);
    socketListeners.length = 0;
}
