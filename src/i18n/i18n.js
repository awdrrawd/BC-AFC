// ════════════════════════════════════════
//  AFC module: i18n.js
//  多國語系（EN / TW / CN），每次呼叫動態偵測語系
// ════════════════════════════════════════

import { AFC_UI } from './strings/afc-ui.js';

// 支援語系（缺翻譯的 key 會自動 fallback 到 EN；見下方 _S 與 t()）
export const SUPPORTED_LANGS = ['TW', 'CN', 'EN', 'DE', 'FR', 'RU', 'UA'];

// 每次呼叫時才偵測語系，避免模組載入時 TranslationLanguage 尚未設定
export function detectLang() {
    let code = '';
    if (typeof TranslationLanguage !== 'undefined' && TranslationLanguage) {
        code = String(TranslationLanguage).toUpperCase();
    } else {
        // 回退：瀏覽器語系
        const nav = (navigator.language || '').toLowerCase();
        if (nav.startsWith('zh-tw') || nav.startsWith('zh-hant')) code = 'TW';
        else if (nav.startsWith('zh')) code = 'CN';
        else code = nav.slice(0, 2).toUpperCase();
    }
    if (code === 'TW') return 'TW';
    if (code === 'CN') return 'CN';
    if (code === 'DE' || code === 'FR' || code === 'RU' || code === 'UA') return code;
    return 'EN';
}


export function t(key, ...args) {
    const lang = detectLang();
    const dict = AFC_UI[lang] ?? AFC_UI.EN;
    const fn   = dict[key] ?? AFC_UI.EN[key];
    if (!fn) { console.warn("🐈‍⬛ [AFC] missing i18n key:", key); return key; }
    return typeof fn === 'function' ? fn(...args) : fn;
}

/** 取得戀人階段的本地化標籤（數字 0/1/2） */
export function stageLabel(stage) {
    const map = { 0: 'stageDating', 1: 'stageEngaged', 2: 'stageMarried' };
    return t(map[stage] ?? 'stageDating');
}
