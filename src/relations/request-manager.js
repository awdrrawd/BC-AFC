import { createProposalUI, startCountdown } from '../ui/proposal-ui.js';

export function scheduleOutgoing(store, key, duration, onExpire) {
    clearRequest(store, key);
    store[key] = {
        timer: setTimeout(() => {
            delete store[key];
            onExpire?.();
        }, duration),
    };
}

export function showIncoming({ store, key, uiId, title, subText, expireMessage, onAccept }) {
    if (store[key]) return false;
    const close = () => clearRequest(store, key, uiId);
    const element = createProposalUI({
        uiId,
        title,
        subText,
        onAccept: () => onAccept(close),
        onDecline: close,
    });
    if (!element) return false;
    const timer = startCountdown(uiId, `${uiId}-sub`, close, expireMessage);
    store[key] = { timer, uiId };
    return true;
}

export function clearRequest(store, key, fallbackUiId) {
    const request = store[key];
    if (request?.timer != null) {
        clearTimeout(request.timer);
        clearInterval(request.timer);
    }
    document.getElementById(request?.uiId ?? fallbackUiId)?.remove();
    delete store[key];
}

export function clearRequestStore(store) {
    for (const key of Object.keys(store)) clearRequest(store, key);
}
