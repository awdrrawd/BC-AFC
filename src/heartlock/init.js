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

    // 心形鎖文本（'hl' 命名空間）已由 AFC core-init 的 registerFallback()（內建後備）
    //  與 ensureAfcI18n()（執行期 fetch 根目錄 Translation/<LANG>.js）一併註冊，這裡不再重複註冊。

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
    await reconcileHLStorage();   // 與後備 DB(IndexedDB+localStorage)對帳：四情境 + 舊鎖回填
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
