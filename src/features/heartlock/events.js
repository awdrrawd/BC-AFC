// HeartLock 內部事件通道，用來維持 storage → service → UI 的單向依賴。
const listeners = new Map();

export function onHeartLockEvent(type, listener) {
    if (!listeners.has(type)) listeners.set(type, new Set());
    listeners.get(type).add(listener);
    return () => listeners.get(type)?.delete(listener);
}

export function emitHeartLockEvent(type, payload) {
    for (const listener of listeners.get(type) ?? []) {
        try { listener(payload); } catch (error) {
            console.error(`🐈‍⬛ [HeartLock] ${type} event failed:`, error);
        }
    }
}
