// ==UserScript==
// @name         Abundantia Florum ─Chromatica─
// @name:zh      繁戀如花 ─繽紛─
// @namespace    https://github.com/awdrrawd/BC-AFC
// @version      0.7.0
// @description  拓展戀人系統（內含心形鎖）| Extended Lover System for BondageClub (bundles Heart Lock)
// @author       莉柯莉絲(Likolisu)
// @supportURL   https://github.com/awdrrawd/BC-AFC
// @include      /^https:\/\/(www\.)?bondage(projects\.elementfx|-(europe|asia))\.com\/.*/
// @icon         https://raw.githubusercontent.com/awdrrawd/liko-tool-Image-storage/refs/heads/main/Images/LOGO_2.png
// @grant        none
// @run-at       document-end
// @require      https://awdrrawd.github.io/liko-Plugin-Repository/Plugins/expand/bcmodsdk.js
// ==/UserScript==

// Thin loader: pulls the built AFC bundle (AFC + Heart Lock) from GitHub Pages and lets it run.
// Source & modules live at https://github.com/awdrrawd/BC-AFC (built by CI to /assets/main.js).
window.Liko = window.Liko ?? {};
if (window.Liko.AFC) {
    console.warn('🐈‍⬛ [AFC] ⚠️ 已載入，略過重複匯入。');
} else {
    // Reserve the flag immediately so a second loader instance bails out here.
    //window.Liko.AFC = 'loading';
    import(`https://awdrrawd.github.io/BC-AFC/assets/main.js?v=${Date.now()}`)
        .catch(e => console.error('🐈‍⬛ [AFC] 載入失敗:', e));
}
