// ════════════════════════════════════════
//  HeartLock module: init.js
//  initHeartLock(modApi)：由 AFC core-init 於 phase 1 呼叫，共用 AFC 的 modApi。
//  （原獨立版自行 registerMod；此處保留 getModApi 作為備援。）
// ════════════════════════════════════════

import { MOD_VER, MOD_NAME, EXT_KEY } from './config.js';
import { state } from './state.js';
import { log, clone, waitFor } from './util.js';
import {
    createHeartLockAsset, reapplyFromAppearance, checkLockIntegrity, removeLock, clearAllLocks,
} from './lock.js';
import { patchFunctions } from './hooks.js';
import { ensureStorage, reconcileHLStorage, saveAndSync } from './storage.js';
import { startVibeTimer } from './vibe.js';
import { startTimerCheck } from './timer.js';
import { L10N } from '../i18n/l10n.js';
import { HEARTLOCK_ACTIONS } from '../i18n/strings/heartlock-actions.js';
import { HEARTLOCK_UI } from '../i18n/strings/heartlock-ui.js';

// 把 lang→key 的翻譯表轉成引擎需要的 key→lang 格式。
//   { ZH:{ tabOverview:'總覽' }, EN:{ tabOverview:'Overview' } }
//   → { tabOverview:{ ZH:'總覽', EN:'Overview' } }
function _langKeyedToKeyLang(langKeyed) {
    const out = {};
    for (const lang of Object.keys(langKeyed || {})) {
        const block = langKeyed[lang] || {};
        for (const key of Object.keys(block)) {
            (out[key] || (out[key] = {}))[lang] = block[key];
        }
    }
    return out;
}

// 備援：若未取得共用 modApi，才自行註冊
function getModApi() {
    if (state.modApi) return state.modApi;
    if (!window.bcModSdk?.registerMod) return null;
    try {
        state.modApi = window.bcModSdk.registerMod({
            name: MOD_NAME, fullName: 'Heart Lock BC',
            version: MOD_VER, repository: 'https://github.com/awdrrawd/BC-AFC',
        });
        return state.modApi;
    } catch (e) {
        if (!window.bcModSdk.getModsInfo?.().find(m => m.name === MOD_NAME))
            console.error('🐈‍⬛ [HeartLock] registerMod failed', e);
        return null;
    }
}

export async function initHeartLock(sharedModApi) {
    if (state.initialized) return;

    // 註冊心形鎖文本到共用 L10N 引擎的 'hl' 命名空間：
    //   廣播/系統訊息（send 用）＋ 本地 UI（T()→L10N.t 用），鍵不衝突、合併一份。
    //   引擎表格結構為 key→lang（{ key: { EN, ZH, … } }）。actions 已是此格式；
    //   UI 檔為方便翻譯採 lang→key（{ ZH:{…}, EN:{…} }），註冊前先轉置。
    L10N.register('hl', HEARTLOCK_ACTIONS);
    L10N.register('hl', _langKeyedToKeyLang(HEARTLOCK_UI));

    // Phase 1：取得 modApi（優先用 AFC 傳入的共用 modApi）
    if (sharedModApi) state.modApi = sharedModApi;
    const modApi = state.modApi ?? getModApi();
    if (!modApi) { console.error('🐈‍⬛ [HeartLock] modApi unavailable.'); return; }

    // Phase 2：等玩家登入 + 遊戲資源就緒
    await waitFor(() =>
                  !!window.Player?.AccountName &&
                  !!window.AssetFemale3DCG &&
                  !!AssetGroupGet?.('Female3DCG', 'ItemMisc')
                 );

    createHeartLockAsset();
    patchFunctions(modApi);
    await waitFor(() => window.Player?.ExtensionSettings !== undefined, 30000);
    ensureStorage();
    reconcileHLStorage();   // 與本機 DB 對帳：被初始化→抓 DB；伺服器較舊且不符→採用最新
    saveAndSync();
    reapplyFromAppearance();
    startVibeTimer();
    startTimerCheck();
    setInterval(checkLockIntegrity, 3000);
    state.initialized = true;

    // 對外 API：合併進 window.Liko.AFC.heartLock（AFC 與 Heart Lock 視為一體）
    //   若 AFC 尚未建立 window.Liko.AFC，先放一個殼，core-init 之後會 Object.assign 保留 .heartLock。
    window.Liko = window.Liko ?? {};
    window.Liko.AFC = window.Liko.AFC ?? {};
    window.Liko.AFC.heartLock = {
        version:        MOD_VER,
        getStorage:     () => { ensureStorage(); return clone(Player.HeartLock); },
        getPadlocks:    () => { ensureStorage(); return clone(Player.HeartLock.padlocks ?? {}); },
        removeLock:     (gn, opts)  => removeLock(gn, opts),
        clearAllLocks:  (opts)      => clearAllLocks(opts),
        restoreStorage: (data) => {
            if (!ensureStorage() || !data || typeof data !== 'object') return false;
            Player.ExtensionSettings[EXT_KEY] = clone(data);
            if (!Player.ExtensionSettings[EXT_KEY].padlocks) Player.ExtensionSettings[EXT_KEY].padlocks = {};
            Player.HeartLock = Player.ExtensionSettings[EXT_KEY];
            saveAndSync();
            try { reapplyFromAppearance(); } catch {}
            return true;
        },
    };

    log(`🐈‍⬛ [HeartLock] v${MOD_VER} initialized.`);
}
