const subscribers = new Set();

export function subscribeChatRoomMessage(handler) {
    subscribers.add(handler);
    return () => subscribers.delete(handler);
}

export function dispatchChatRoomMessage(data) {
    for (const handler of [...subscribers]) {
        try { handler(data); } catch (error) {
            console.error('🐈‍⬛ [AFC] ChatRoomMessage subscriber failed:', error);
        }
    }
}

export function clearChatRoomMessageSubscribers() {
    subscribers.clear();
}
