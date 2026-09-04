// ════════════════════════════════════════
//  AFC module: l10n.js — 聊天訊息在地化，改用共用引擎 window.Liko.__Sys_L10N__
//  （行為與 HSC/FCM 一致：全體共用同一個引擎實例）
//
//  引擎由同資料夾的 engine.js（BC_i18n.js 的同步副本）以 side-effect import 執行；引擎自帶
//  防重載旗標（__Sys_i18n__），所以 PCM 或同作者其他插件已先載入引擎時，這裡會自動沿用同一
//  實例、不會重建——不再有「AFC 先評估就自建另一份 L10N」的情況。
//  ⚠️ engine.js 是 BC_i18n.js 的複本，更新引擎時請與主 repo 的 Plugins/expand/BC_i18n.js 一起同步。
//
//  用法：
//    L10N.register(ns, table)    // 註冊翻譯表（見 strings/*；位置式 {0}{1}…）
//    L10N.send(ns, key, ...args) // 發一條在地化 Action（Tag: Liko_L10N）
//    localizeChatRoomMessage(data) // 由中央 ChatRoomMessage hook 呼叫
// ════════════════════════════════════════

import './engine.js';   // 執行共用引擎 IIFE：建立 window.Liko.__Sys_i18n__ / __Sys_L10N__（含防重載）

// 共用 L10N 引擎（上面的 import 已保證存在；若他人先載入則為同一實例）
export const L10N = window.Liko.__Sys_L10N__;

// ── 相容包裝（bundle 內部沿用；args 以陣列傳入）──
export function sendLocalizedAction(ns, key, args) {
    L10N.send(ns, key, ...(Array.isArray(args) ? args : args == null ? [] : [args]));
}
export function localizeChatRoomMessage(data) {
    if (typeof L10N.localize === 'function') return L10N.localize(data);
    const dict = Array.isArray(data?.Dictionary) ? data.Dictionary : null;
    const marker = dict?.find(entry => entry?.Tag === 'Liko_L10N' && entry.key);
    if (!marker) return;
    let args = [];
    try {
        const parsed = JSON.parse(marker.data ?? '[]');
        if (Array.isArray(parsed)) args = parsed;
    } catch {}
    const text = L10N.tl(L10N.lang(), marker.ns, marker.key, ...args);
    if (text == null) return;
    const custom = dict.find(entry => typeof entry?.Tag === 'string' && entry.Tag.includes('CUSTOM_SYSTEM_ACTION'));
    if (custom) custom.Text = text;
    else data.Content = text;
}
