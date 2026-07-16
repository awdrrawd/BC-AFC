// ════════════════════════════════════════
//  AFC module: core-init.js
//  初始化（分兩階段：載入期 / 登入後）+ cleanup
//  Heart Lock 改為 bundle 內模組，直接 import 啟動（不再 URL 動態注入）。
// ════════════════════════════════════════

import { MOD_NAME, MOD_VERSION } from './config.js';
import {
    modApi, setModApi, isInitialized, setInitialized, setLastKnownLoverCount,
    setProfilePanelOpen, AFCLockAccessOn, pendingOutgoing, pendingIncoming, _pendingAcks,
} from './state.js';
import { loadToastSystem, toast } from '../util/toast.js';
import { waitFor } from '../util/util.js';
import { t, detectLang } from '../i18n/i18n.js';
import { legacyCleanupOnce, _migrateOldBackupToDB } from './legacy.js';
import { getSharedSettings, getPrivateSettings, syncLockPermsToShared } from './settings.js';
import { reconcileLocalDB } from './storage.js';
import { setupHooks } from './hooks.js';
import { setupCommands } from './commands.js';
import { registerSettingsUI } from '../ui/settings-page.js';
import { syncWithOnlineLovers } from '../net/online.js';
import { checkAutoBreakup, isAFCLover, getLoverEntry } from '../relations/lovers.js';
import { getLoverRegions, isPanelOpen, getPanelRect } from '../ui/profile.js';
import { requestRoomNamesFromLovers } from '../net/roomname.js';
import { unregisterAllSocketListeners } from './socket.js';
import { _clearAck } from '../net/beep.js';
import { initHeartLock } from '../heartlock/init.js';
import { L10N } from '../i18n/l10n.js';
import { AFC_ACTIONS } from '../i18n/strings/afc-actions.js';

export async function initialize() {
    console.log(`🐈‍⬛ [AFC] ✅ v${MOD_VERSION} loaded`);

    // ── 階段一：載入期（不需要 BC 遊戲狀態）──────────────────
    // 1. 載入 Toast 系統
    await loadToastSystem();

    // 2. 等待 bcModSdk（無超時）
    await waitFor(() =>
                  typeof bcModSdk !== 'undefined' && !!bcModSdk?.registerMod ||
                  typeof window.bcModSdk !== 'undefined' && !!window.bcModSdk?.registerMod
                 );
    const sdk = window.bcModSdk ?? bcModSdk;
    setModApi(sdk.registerMod({
        name:       MOD_NAME,
        fullName:   "Abundantia Florum ─Chromatica─",
        version:    MOD_VERSION,
        repository: "https://github.com/awdrrawd/BC-AFC",
    }));

    // 共用 L10N 引擎：註冊 AFC 事件文本 + 安裝唯一的接收端 hook
    //  （bcModSdk 已是共用模組體系，不需另外對外公開我們的 modApi）
    L10N.register('afc', AFC_ACTIONS);
    L10N.install(modApi);

    // 啟動 Heart Lock（bundle 內模組，共用 AFC 的 modApi）
    try { initHeartLock(modApi); } catch (e) { console.error("🐈‍⬛ [AFC] ❌ Heart Lock 啟動失敗:", e); }

    // 3. 等待 ServerSocket 就緒（無超時）
    await waitFor(() =>
                  typeof ServerSocket !== 'undefined' &&
                  ServerSocket !== null &&
                  typeof ServerSocket.on === 'function'
                 );

    // ── 階段二：登入後（需要 Player + 設定資料）───────────────
    ServerSocket.on("LoginResponse", () => {
        setTimeout(completeInit, 500);
    });

    // 等待 MemberNumber 存在後再嘗試（相容重載與正常登入）
    waitFor(() => typeof Player?.MemberNumber === "number").then(() => {
        completeInit();
    });
}

function completeInit() {
    if (isInitialized) return;
    if (!Player?.MemberNumber) return;
    if (!Player?.OnlineSharedSettings) return;
    if (!Player?.ExtensionSettings) return;

    try {
        // 舊版資料一次性處理（短期輔助）：依版本判別，現行格式靜默清殘留、舊資料重置+提醒
        legacyCleanupOnce();

        getSharedSettings();  // 初始化 AFC（含備份恢復）
        const priv = getPrivateSettings();

        // 確保鎖的權限已同步到 OnlineSharedSettings
        if (priv) syncLockPermsToShared(priv);
        // 初始化後設定已知戀人數量基準，並強制存備份
        const shared = Player.OnlineSharedSettings?.AFC;
        setLastKnownLoverCount(shared?.lovers?.length ?? 0);
        setupHooks();
        setupCommands();

        // 登入後才能正確取得 TranslationLanguage，ButtonText 翻譯才準確
        registerSettingsUI();

        syncWithOnlineLovers();
        checkAutoBreakup();

        // 登入比對本機 DB（資料丟失/換裝置/不一致），並向在線戀人請求房名
        _migrateOldBackupToDB();
        reconcileLocalDB();
        requestRoomNamesFromLovers();

        if (typeof modApi.onUnload === 'function') modApi.onUnload(() => cleanup());

        setInitialized(true);
        console.log(`🐈‍⬛ [AFC] ✅ v${MOD_VERSION} (${detectLang()}) 初始化完成`);

        // ── 對外 API：AFC 與 Heart Lock 合併於「同一個」window.Liko.AFC ──
        //   Heart Lock 的 API 是其下的子節點 window.Liko.AFC.heartLock（由 heartlock/init.js 掛上）。
        //   不另設 AFC_HL 之類的重複別名（內容完全相同 → 沒有意義）；也不再對外公開 modApi
        //   —— bcModSdk 本身就是共用模組體系，其他插件自行 registerMod 即可。
        window.Liko.AFC = Object.assign(window.Liko.AFC ?? {}, {
            version: MOD_VERSION,
            /** 對方是否為 AFC 拓展戀人 */
            isLover:          (num) => isAFCLover(num),
            /** 對方的戀人階段（0/1/2，若非戀人則 null）*/
            getLoverStage:    (num) => getLoverEntry(num)?.stage ?? null,
            /** 穿戴者是否允許我使用心鎖 */
            canUseHeartLock:  (ch)  => {
                const lovers = ch?.OnlineSharedSettings?.AFC?.lovers ?? [];
                const perms  = ch?.OnlineSharedSettings?.AFC?.lockPerms;
                if (!perms?.enableAFCLock) return false;
                return lovers.some(l => Number(l.memberNumber) === Number(Player.MemberNumber))
                || (Player.Lovership?.some(l => Number(l.MemberNumber) === Number(ch?.MemberNumber)) ?? false);
            },
            /** 取得戀人清單（唯讀複本，順序＝面板顯示順序）*/
            getLovers:        () => [...(getSharedSettings()?.lovers ?? [])],
            /** 我是否允許主人使用心鎖 */
            canOwnerLock:     () => getPrivateSettings()?.enableOwnerLock ?? false,
            /** 「更多戀人」面板目前是否展開中（且在角色資料頁）→ boolean */
            isProfilePanelOpen: () => isPanelOpen(),
            /** 面板容器矩形 { x, y, w, h }（BC 2000×1000 座標；模態範圍/繪製邊界）*/
            getProfilePanelRect: () => getPanelRect(),
            /** Profile「更多戀人」面板中各條目的螢幕矩形＋資料（供其他插件疊按鈕/快速搜尋；
             *  面板未展開回傳 []）：[{ memberNumber, name, stage, col, row, x, y, w, h }] */
            getProfileLoverRegions: () => getLoverRegions(),
        });

        // Toast 通知成功
        toast(t('toastLoaded'), 5000, "#C2185B");

    } catch (e) {
        console.error("🐈‍⬛ [AFC] ❌ 初始化失敗:", e);
        toast(t('toastFail'), 8000, "#e53935");
    }
}

export function cleanup() {
    unregisterAllSocketListeners();
    for (const k of Object.keys(_pendingAcks)) _clearAck(k);
    for (const k of Object.keys(pendingOutgoing)) clearTimeout(pendingOutgoing[k].timer);
    for (const k of Object.keys(pendingIncoming)) {
        clearInterval(pendingIncoming[k].timer);
        document.getElementById(pendingIncoming[k].uiId)?.remove();
    }
    AFCLockAccessOn.clear();
    setProfilePanelOpen(false);
    setInitialized(false);
    console.log("🐈‍⬛ [AFC] 🗑️ 已清理資源");
}
