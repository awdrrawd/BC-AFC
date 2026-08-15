// ==UserScript==
// @name         本地測試 - AFC
// @namespace    https://github.com/awdrrawd/BC-AFC
// @version      0.1
// @description  AFC 本地開發載入器
// @author       莉柯莉絲(Likolisu)
// @supportURL   https://github.com/awdrrawd/BC-AFC
// @include      /^https:\/\/(www\.)?bondage(projects\.elementfx|-(europe|asia))\.com\/.*/
// @icon         https://raw.githubusercontent.com/awdrrawd/liko-tool-Image-storage/refs/heads/main/Images/LOGO_2.png
// @grant        none
// @run-at       document-end
// @require      https://awdrrawd.github.io/liko-Plugin-Repository/Plugins/expand/bcmodsdk.js
// ==/UserScript==

window.Liko = window.Liko ?? {};
if (window.Liko.AFC) {
    console.warn('🐈‍⬛ [AFC] ⚠️ 已載入，略過重複匯入。');
} else {
    import(`http://localhost:5175/assets/main.js?v=${Date.now()}`)
        .catch(e => console.error('🐈‍⬛ [AFC] 本地載入失敗（vite preview 有開嗎？）:', e));
}
