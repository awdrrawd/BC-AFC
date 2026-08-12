// ════════════════════════════════════════
//  AFC module: i18n.js  （薄轉接層，不含引擎、不含文本）
//  UI 字串走共用 L10N 引擎（window.Liko.__Sys_L10N__）；文本改為「執行期 fetch」：
//    根目錄 Translation/<LANG>.js（一國一檔，同時註冊 afc + hl 兩命名空間、{0} 佔位）。
//    翻譯者只需改 Translation/<LANG>.js，build 會複製到 public/ 部署，免動程式。
//    載入前/離線時用內建後備 src/i18n/fallback.js（TW+EN）；fetch 到的完整字庫會覆蓋後備。
//    t(key, ...args)：等同 L10N.tl(detectLang(), 'afc', key, ...args)。
//  多國語系：EN / TW / CN / DE / FR / RU / UA，每次呼叫動態偵測語系。
// ════════════════════════════════════════

import { L10N } from './l10n.js';

// 支援語系（缺翻譯的 key 由引擎自動 fallback：TW/CN 互退→EN；其餘→EN）
export const SUPPORTED_LANGS = ['TW', 'CN', 'EN', 'DE', 'FR', 'RU', 'UA'];

// 執行期 fetch 的語言檔（一國一檔，含 afc + hl 兩命名空間）
const T_LANGS = ['EN', 'TW', 'CN', 'DE', 'FR', 'RU', 'UA'];

// 依 bundle（/assets/main.js）位置解析出 Pages 根目錄的資源網址（GitHub Pages 部署）。
function assetUrl(path) {
    try {
        const url = new URL(import.meta.url);
        url.pathname = url.pathname.replace(/\/assets\/[^/]+$/, '/' + String(path).replace(/^\//, ''));
        url.search = '';
        return url.toString();
    } catch { return String(path); }
}

// 抓「目前語言 + EN 後備」（CN 再加 TW）的字庫檔並註冊到共用引擎；每檔同時註冊 afc + hl。
//  引擎依 URL 去重、自帶時間戳破快取；fetch 失敗時沿用內建後備（fallback.js）。
export async function ensureAfcI18n() {
    try {
        const eng = window.Liko?.__Sys_L10N__;
        if (!eng?.ensure) return;
        const urlMap = {};
        for (const c of T_LANGS) urlMap[c] = assetUrl('Translation/' + c + '.js');
        await eng.ensure('afc', urlMap, detectLang());
    } catch (e) { console.warn('🐈‍⬛ [AFC] 翻譯載入失敗，改用內建後備:', e.message); }
}

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


// 唯一取字路徑：AFC 偵測語言 + 引擎解析/佔位（{0}{1}…），缺 key 退回 key 本身。
//  afc / hl 皆走這裡，兩者只差命名空間 → 真正共用同一套語言偵測與後備行為。
export function tns(ns, key, ...args) {
    const out = L10N.tl(detectLang(), ns, key, ...args);
    if (out == null) { console.warn("🐈‍⬛ [AFC] missing i18n key:", `${ns}/${key}`); return key; }
    return out;
}

export function t(key, ...args) { return tns('afc', key, ...args); }

/** 取得戀人階段的本地化標籤（數字 0/1/2） */
export function stageLabel(stage) {
    const map = { 0: 'stageDating', 1: 'stageEngaged', 2: 'stageMarried' };
    return t(map[stage] ?? 'stageDating');
}
