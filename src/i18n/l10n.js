// ════════════════════════════════════════
//  L10N 引擎（工具，不含文本）+ 公開 API window.Liko.L10N
//  概念（比照 BC-HSC）：送出 Action 時 Text 放「英文底本」（沒裝插件者看到英文），
//  Dictionary 夾帶 { Tag:'Liko_L10N', ns, key, data }。接收端 hook ChatRoomMessage，
//  偵測到標記就用「自己的語言」重寫 Text 後再顯示（含自己發的）。
//
//  ── 跨插件共用 ──
//  引擎掛在 window.Liko.L10N，多個插件各自：
//    window.Liko.L10N.register(ns, table)   // 註冊自己的翻譯表（見 strings/*）
//    window.Liko.L10N.send(ns, key, ...args) // 發一條在地化 Action
//    window.Liko.L10N.t(ns, key, ...args)    // 取目前語言字串
//  第一個載入者建立引擎並安裝唯一的 ChatRoomMessage hook；其餘沿用同一實例。
//
//  文本格式：table[key] = { EN, ZH?, TW?, CN?, DE?, FR?, RU?, UA? }，位置式 {0}{1}…
//  語言解析：目前語言 → （TW/CN 再退 ZH）→ EN → 表中任一。
// ════════════════════════════════════════

const L10N_TAG   = 'Liko_L10N';
const CUSTOM_TAG = 'CUSTOM_SYSTEM_ACTION';
const ENGINE_VER = '1.0';

// 引擎自帶語言偵測（不依賴其他模組，維持可獨立共用）
function engineLang() {
    let code = '';
    if (typeof TranslationLanguage !== 'undefined' && TranslationLanguage) {
        code = String(TranslationLanguage).toUpperCase();
    } else {
        const nav = (typeof navigator !== 'undefined' ? navigator.language : '') || '';
        const n = nav.toLowerCase();
        if (n.startsWith('zh-tw') || n.startsWith('zh-hant')) code = 'TW';
        else if (n.startsWith('zh')) code = 'CN';
        else code = n.slice(0, 2).toUpperCase();
    }
    if (['TW', 'CN', 'DE', 'FR', 'RU', 'UA'].includes(code)) return code;
    return 'EN';
}

function makeEngine() {
    const store = {};          // ns -> { key: { EN, ZH?, TW?, ... } }
    let installed = false;

    function register(ns, table) {
        if (!ns || !table) return;
        store[ns] = Object.assign(store[ns] || {}, table);
    }
    function has(ns, key) { return !!store[ns]?.[key]; }

    function tl(lang, ns, key, ...args) {
        const e = store[ns]?.[key];
        if (!e) return null;
        let s = e[lang];
        if (s == null && (lang === 'TW' || lang === 'CN')) s = e.ZH;
        if (s == null) s = e.EN;
        if (s == null) s = Object.values(e)[0];
        if (s == null) return null;
        args.forEach((a, i) => { s = s.split(`{${i}}`).join(a == null ? '' : String(a)); });
        return s;
    }
    function t(ns, key, ...args) { return tl(engineLang(), ns, key, ...args); }

    function send(ns, key, ...args) {
        try {
            if (typeof ServerSend !== 'function') return;
            const base = tl('EN', ns, key, ...args);
            if (base == null) return;
            ServerSend('ChatRoomChat', {
                Type: 'Action',
                Content: CUSTOM_TAG,
                Dictionary: [
                    { Tag: `MISSING TEXT IN "Interface.csv": ${CUSTOM_TAG}`, Text: base },
                    { Tag: L10N_TAG, ns, key: String(key), data: JSON.stringify(args) },
                ],
            });
        } catch (e) {}
    }

    function install(modApi) {
        if (installed || !modApi) return;
        installed = true;
        try {
            modApi.hookFunction('ChatRoomMessage', 5, (a, next) => {
                const data = a[0];
                try {
                    const dict = data && Array.isArray(data.Dictionary) ? data.Dictionary : null;
                    const d = dict && dict.find(x => x && x.Tag === L10N_TAG && x.key);
                    if (d) {
                        let arr = [];
                        try { const p = JSON.parse(d.data ?? '[]'); if (Array.isArray(p)) arr = p; } catch {}
                        const local = tl(engineLang(), d.ns, d.key, ...arr);
                        if (local != null) {
                            const custom = dict.find(x => x && typeof x.Tag === 'string' && x.Tag.includes(CUSTOM_TAG));
                            if (custom) custom.Text = local;
                            else data.Content = local;
                        }
                    }
                } catch (e) {}
                return next(a);
            });
        } catch (e) {
            console.warn('🐈‍⬛ [L10N] hook 失敗:', e.message);
        }
    }

    return { version: ENGINE_VER, register, has, t, tl, send, install, lang: engineLang };
}

// 取得共用引擎：已存在（其他插件先載入）就沿用，否則建立並掛上 window.Liko.L10N
if (typeof window !== 'undefined') {
    window.Liko = window.Liko ?? {};
}
export const L10N = (typeof window !== 'undefined' && window.Liko?.L10N && typeof window.Liko.L10N.register === 'function')
    ? window.Liko.L10N
    : (window.Liko.L10N = makeEngine());

// ── 相容包裝（bundle 內部沿用；args 以陣列傳入）──
export function sendLocalizedAction(ns, key, args) {
    L10N.send(ns, key, ...(Array.isArray(args) ? args : args == null ? [] : [args]));
}
export function installL10n(modApi) { L10N.install(modApi); }
