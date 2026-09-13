import { BEEP } from './config.js';
import { AFCLockAccessOn, setLastKnownLoverCount } from './state.js';
import { getSharedSettings, saveSharedSettings, defaultPrivate } from './settings.js';
import { sendBeep } from '../net/beep.js';
import { t } from '../i18n/i18n.js';
import { toast } from '../util/toast.js';
import { chatLocalNotice } from '../util/util.js';
import { clearAllLocks } from '../heartlock/lock.js';

// 初廠設定：解除所有戀人關係、破壞所有戀人鎖、重置設定。不可逆，僅由 UI 確認後呼叫。
export function factoryReset() {
    try {
        const lovers = (getSharedSettings()?.lovers ?? []).slice();
        // 1) 通知所有戀人解除關係（BREAKUP 讓對方也移除；LOCK_ACCESS_OFF 收回解鎖授權）
        for (const l of lovers) {
            try { sendBeep(l.memberNumber, BEEP.LOCK_ACCESS_OFF); sendBeep(l.memberNumber, BEEP.BREAKUP); } catch {}
        }
        // 2) 破壞所有戀人鎖（HeartLock，bundle 內直接呼叫）
        try { clearAllLocks(); } catch (e) { console.error("🐈‍⬛ [AFC] ❌ 破壞戀人鎖失敗:", e?.message); }
        // 3) 重置 AFC 私人 / 共享設定為預設
        delete Player.OnlineSharedSettings.AFC;
        delete Player.ExtensionSettings.AFC_Data;
        delete Player.ExtensionSettings.AFC_LoverBackup;
        ServerPlayerExtensionSettingsSync('AFC_LoverBackup');
        Player.ExtensionSettings.AFC = JSON.stringify(defaultPrivate());
        // 4) 重建預設並同步
        AFCLockAccessOn.clear();
        setLastKnownLoverCount(0);   // 解除 saveSharedSettings 的「戀人歸零」保護
        getSharedSettings();
        saveSharedSettings();
        // AFC 只同步自己的鍵；共享設定維持原本的 AccountUpdate。
        try { if (typeof ServerPlayerExtensionSettingsSync === 'function') ServerPlayerExtensionSettingsSync('AFC'); } catch {}
        try { ServerAccountUpdate?.QueueData?.({ OnlineSharedSettings: Player.OnlineSharedSettings }, true); } catch {}
        console.warn("🐈‍⬛ [AFC] ⚠️ 已執行初廠設定（戀人關係解除、所有戀人鎖破壞、設定重置）");
        try { toast(t('factoryDone'), 8000, "#e53935"); } catch {}
        try { chatLocalNotice(t('factoryDone')); } catch {}
    } catch (e) { console.error("🐈‍⬛ [AFC] ❌ 初廠設定失敗:", e?.message); }
}
