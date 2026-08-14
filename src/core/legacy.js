// ════════════════════════════════════════
//  AFC module: legacy.js
//  舊版資料一次性處理（短期輔助，未來版本將移除）
//  依 ExtensionSettings.AFC 記錄的版本判斷：
//    >= 0.6.1 → 視為現行格式（資料正確），只靜默清掉用不到的舊維護殘留，戀人鎖不動；
//    <  0.6.1 或無法解析 → 視為舊資料，不做向下兼容 → 重置 AFC 設定並提醒玩家。
//  必須在重新標記版本「之前」讀 raw 版本，否則資料一律變新就無法判別。
// ════════════════════════════════════════

import { LEGACY_OK_VER } from './config.js';
import { defaultPrivate } from './settings.js';
import { _lsRead, _lsWrite } from './storage.js';
import { t } from '../i18n/i18n.js';
import { toast } from '../util/toast.js';
import { chatLocalNotice } from '../util/util.js';

function _cmpVer(a, b) {
    const pa = String(a).split('.'), pb = String(b).split('.');
    for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
        const d = (parseInt(pa[i], 10) || 0) - (parseInt(pb[i], 10) || 0);
        if (d !== 0) return d < 0 ? -1 : 1;
    }
    return 0;
}

// 用 dot-notation 將舊 key 清成 null，避免為了 $unset 而回傳整個
// ExtensionSettings。伺服器上可能留下極小的 null 佔位，但不會重送或覆蓋其他插件。
function _clearExtensionSetting(key) {
    if (!Player.ExtensionSettings || Player.ExtensionSettings[key] === undefined) return false;
    const previous = Player.ExtensionSettings[key];
    Player.ExtensionSettings[key] = null;
    try {
        if (typeof ServerPlayerExtensionSettingsSync === 'function') ServerPlayerExtensionSettingsSync(key);
    } catch {
        Player.ExtensionSettings[key] = previous;
        return false;
    }
    delete Player.ExtensionSettings[key];
    return true;
}

export function _cleanupLegacyKeys() {
    if (Player.OnlineSharedSettings) delete Player.OnlineSharedSettings.EL;  // 隨整個 OnlineSharedSettings 送出即移除
    _clearExtensionSetting('EL');
    _clearExtensionSetting('AFC_loversBackup');
}

function notifyLegacyData() {
    console.warn(`🐈‍⬛ [AFC] ⚠️ 偵測到舊版（< ${LEGACY_OK_VER}）資料，不做向下兼容，已重置為預設`);
    try { toast(t('legacyDetected'), 12000, "#e53935"); } catch {}
    try { chatLocalNotice(t('legacyDetected')); } catch {}
}

// 在 getSharedSettings / getPrivateSettings 之前呼叫（讀 raw 版本，避免被重新標記覆蓋）
export function legacyCleanupOnce() {
    try {
        const ext = Player.ExtensionSettings;
        if (!ext) return;
        const raw = ext.AFC;
        const hasData = raw != null && raw !== '';
        let ver = null;
        if (typeof raw === 'string' && raw.startsWith('{')) {
            try { ver = JSON.parse(raw).v ?? null; } catch {}
        }
        const isCurrent = ver != null && _cmpVer(ver, LEGACY_OK_VER) >= 0;

        if (hasData && !isCurrent) {
            // 舊資料 → 不向下兼容：重置 AFC 私人 / 共享設定為預設並提醒（戀人鎖不動）
            if (Player.OnlineSharedSettings) delete Player.OnlineSharedSettings.AFC;
            ext.AFC = JSON.stringify(defaultPrivate());
            try { ServerPlayerExtensionSettingsSync?.("AFC"); } catch {}
            try { ServerAccountUpdate?.QueueData?.({ OnlineSharedSettings: Player.OnlineSharedSettings }); } catch {}
            notifyLegacyData();
        }
        // 不論新舊：清掉用不到的舊維護殘留 key（清完即不再觸發）
        _cleanupLegacyKeys();
    } catch (e) { console.error("🐈‍⬛ [AFC] ❌ 舊資料一次性處理失敗:", e?.message); }
}

// 一次性遷移：把舊版 ExtensionSettings.AFC.l 戀人備份搬進本機 DB（僅在本機 DB 為空時）
// 保護「升級當下 OnlineSharedSettings 已被清空、但舊 l 備份仍在」的邊界情況。
export function _migrateOldBackupToDB() {
    try {
        if (_lsRead()) return;   // 本機已有 DB → 不覆蓋
        const raw = Player?.ExtensionSettings?.AFC;
        if (!raw) return;
        const p   = typeof raw === 'string' ? JSON.parse(raw) : raw;
        const old = Array.isArray(p?.l) ? p.l : null;
        if (!old || !old.length) return;
        const lovers = old.map(e => Array.isArray(e) ? {
            memberNumber: e[0], name: e[1], stage: e[2] ?? 0,
            startDate: e[3], stageDate: e[4], lastSeen: e[5] ?? null,
        } : e);
        _lsWrite(lovers);
        console.log("🐈‍⬛ [AFC] 🔧 已將舊版 ExtensionSettings 戀人備份遷移到本機 DB");
    } catch {}
}
