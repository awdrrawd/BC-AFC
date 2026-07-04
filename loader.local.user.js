// ==UserScript==
// @name         Abundantia Florum ─Chromatica─ - 本地版
// @name:zh      繁戀如花 ─繽紛─ - 本地開發
// @namespace    https://github.com/awdrrawd/BC-AFC
// @version      0.7.0
// @description  AFC 本地開發載入器（從 vite preview 讀取，npm run dev，port 5175）
// @author       莉柯莉絲(Likolisu)
// @supportURL   https://github.com/awdrrawd/BC-AFC
// @include      /^https:\/\/(www\.)?bondage(projects\.elementfx|-(europe|asia))\.com\/.*/
// @icon         https://raw.githubusercontent.com/awdrrawd/liko-tool-Image-storage/refs/heads/main/Images/LOGO_2.png
// @grant        none
// @run-at       document-end
// @require      https://awdrrawd.github.io/liko-Plugin-Repository/Plugins/expand/bcmodsdk.js
// ==/UserScript==

// Local dev loader: reads the bundle from the local vite preview server.
// Run `npm run dev` (builds in watch mode + serves on port 5175), then reload BC.
// The ?v= timestamp busts the cache so every reload picks up the latest build.
window.Liko = window.Liko ?? {};
if (window.Liko.AFC) {
    console.warn('🐈‍⬛ [AFC] ⚠️ 已載入，略過重複匯入。');
} else {
    window.Liko.AFC = 'loading';
    import(`http://localhost:5175/assets/main.js?v=${Date.now()}`)
        .catch(e => console.error('🐈‍⬛ [AFC] 本地載入失敗（vite preview 有開嗎？）:', e));
}
// 在檔案目錄下開兩個命令字元  1. npm run dev     2. npx vite preview --port 5175
