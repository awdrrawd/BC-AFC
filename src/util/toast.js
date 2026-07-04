// ════════════════════════════════════════
//  AFC module: toast.js
//  Toast 系統（仿 CHE：先看有沒有帶進來，沒有就動態載入）
// ════════════════════════════════════════

const TOAST_URL = "https://awdrrawd.github.io/liko-Plugin-Repository/Plugins/expand/BC_toast_system.user.js";

export function loadToastSystem() {
    return new Promise((resolve) => {
        if (typeof window.ChatRoomSendLocalStyled === 'function') { resolve(); return; }
        const script = document.createElement('script');
        script.src = TOAST_URL;
        script.onload  = () => resolve();
        script.onerror = () => {
            console.warn("🐈‍⬛ [AFC] ⚠️ Toast 系統載入失敗，將使用 console 替代");
            // 備用：讓 chatLocalNotice 擔任 toast
            window.ChatRoomSendLocalStyled = (msg) => console.log("[AFC toast]", msg);
            resolve();
        };
        document.head.appendChild(script);
    });
}

export function toast(msg, ms = 4000, color = "#7C3AED") {
    if (typeof window.ChatRoomSendLocalStyled === 'function') {
        window.ChatRoomSendLocalStyled(msg, ms, color);
    } else {
        console.log("[AFC toast]", msg);
    }
}
