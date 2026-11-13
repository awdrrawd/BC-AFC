import { installCraftingHeartLock } from '../../hooks/heartlock/crafting.js';
import { resetProtection } from './protection.js';
import { isHeartLock, isProtected, sanitizeOutfitItem } from './outfit-api.js';
// Heart Lock is initialized and disposed through the AFC hook registry.

import { MOD_VER } from './config.js';
import { state } from './state.js';
import { log, clone, waitFor } from './util.js';
import {
    createHeartLockAsset, reapplyFromAppearance, checkLockIntegrity, removeLock, clearAllLocks,
} from './lock.js';
import { installHeartLockHooks } from '../../hooks/heartlock/index.js';
import { ensureStorage, reconcileHLStorage, saveAndSync, restoreStorageWithConsent } from './storage.js';
import { startVibeTimer } from './vibe.js';
import { startTimerCheck } from './timer.js';
import { removeHLPanel } from '../../ui/heartlock/panel.js';
import { _pendingRestore } from './state.js';

let disposeHooks = null;
let initializationGeneration = 0;

export async function initHeartLock(hookRegistry) {
    if (state.lifecycle.initialized) return;
    const generation = ++initializationGeneration;
    const memberNumber = Player?.MemberNumber;
    const active = () => generation === initializationGeneration && Player?.MemberNumber === memberNumber;

    // 心形鎖文本（'hl' 命名空間）已由 AFC core-init 的 registerFallback()（內建後備）
    //  與 ensureAfcI18n()（執行期 fetch Translation/hl/<LANG>.json）一併註冊，這裡不再重複註冊。

    // AFC 核心已確認登入，這裡只等待遊戲資源就緒
    await waitFor(() =>
                  !!window.AssetFemale3DCG &&
                  !!AssetGroupGet?.('Female3DCG', 'ItemMisc')
                 );

    if (!active()) return;
    createHeartLockAsset();
    const scopedHooks = hookRegistry.scope();
    disposeHooks = () => scopedHooks.dispose();
    installHeartLockHooks(scopedHooks);
    await waitFor(() => window.Player?.ExtensionSettings !== undefined, 30000);
    if (!active() || !ensureStorage()) return;
    installCraftingHeartLock(scopedHooks);
    await reconcileHLStorage();
    if (!active()) return;
    saveAndSync();
    reapplyFromAppearance();
    startVibeTimer();
    startTimerCheck();
    state.timers.integrity = setInterval(checkLockIntegrity, 3000);
    state.lifecycle.initialized = true;

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
        isHeartLock,
        isProtected,
        sanitizeOutfitItem,
        restoreStorage: restoreStorageWithConsent,
    };

    log(`✅ v${MOD_VER} loaded.`);
}

export function cleanupHeartLock() {
    initializationGeneration++;
    disposeHooks?.();
    disposeHooks = null;
    clearInterval(state.timers.vibe);
    clearInterval(state.timers.vibeAnimation);
    clearInterval(state.timers.unlockCheck);
    clearInterval(state.timers.integrity);
    state.timers.vibe = null;
    state.timers.vibeAnimation = null;
    state.timers.unlockCheck = null;
    state.timers.integrity = null;
    state.vibe.cycle = 0;
    _pendingRestore.clear();
    resetProtection();
    removeHLPanel();
    state.lifecycle.initialized = false;
}
