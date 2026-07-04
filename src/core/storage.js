// ════════════════════════════════════════
//  AFC module: storage.js
//  本地存底（localStorage「DB」）— 抗伺服器端資料丟失
//    以帳號區分 key；只當「保險箱」用來偵測丟失/提供還原來源，
//    OnlineSharedSettings.AFC.lovers 仍是日常活本。
//  另含 factoryReset（初廠設定）。
// ════════════════════════════════════════

import { MOD_VERSION, LS_PREFIX, BEEP } from './config.js';
import { AFCLockAccessOn, setLastKnownLoverCount } from './state.js';
import { getSharedSettings, defaultPrivate } from './settings.js';
import { sendBeep } from '../net/beep.js';
import { _cleanupLegacyKeys } from './legacy.js';
import { t } from '../i18n/i18n.js';
import { toast } from '../util/toast.js';
import { chatLocalNotice } from '../util/util.js';
import { clearAllLocks } from '../heartlock/lock.js';

function _lsKey() {
    const acct = Player?.AccountName ?? Player?.MemberNumber ?? "anon";
    return LS_PREFIX + acct;
}

export function _lsWrite(lovers) {
    try {
        localStorage.setItem(_lsKey(), JSON.stringify({
            v:  MOD_VERSION,
            ts: Date.now(),
            memberNumber: Player?.MemberNumber ?? null,
            lovers: (lovers ?? []).map(l => ({
                memberNumber: l.memberNumber, name: l.name,
                stage: l.stage ?? 0,
                startDate: l.startDate ?? null, stageDate: l.stageDate ?? null,
                lastSeen: l.lastSeen ?? null,
            })),
        }));
    } catch {}
}

export function _lsRead() {
    try {
        const raw = localStorage.getItem(_lsKey());
        return raw ? JSON.parse(raw) : null;
    } catch { return null; }
}

export function _lsReadLovers() {
    const d = _lsRead();
    return Array.isArray(d?.lovers) ? d.lovers : [];
}

// 任何合法的戀人變動（已通過 saveSharedSettings 的防呆）都同步寫一份本地存底
export function _dbSync() {
    try { _lsWrite(getSharedSettings()?.lovers ?? []); } catch {}
}

/** 還原 UI「備份資料」欄位的來源 → 本地存底 DB（取代舊的 ExtensionSettings.l 備份）*/
export function _readBackupLovers() {
    return _lsReadLovers();
}

// 比對「線上活本」與「本機 DB」的戀人集合（只看 memberNumber + stage）
function _loverSetEqual(a, b) {
    if (a.length !== b.length) return false;
    const ka = new Set(a.map(l => `${l.memberNumber}:${l.stage ?? 0}`));
    return b.every(l => ka.has(`${l.memberNumber}:${l.stage ?? 0}`));
}

// 登入時比對：依「資料丟失 / 換裝置 / 不一致 / 一致」四種情況決定通知與否（不主動還原）
export function reconcileLocalDB() {
    const oss   = getSharedSettings()?.lovers ?? [];
    const dbRec = _lsRead();
    const db    = Array.isArray(dbRec?.lovers) ? dbRec.lovers : [];
    const ossHas = oss.length > 0;
    const dbHas  = db.length  > 0;

    if (!dbHas && !ossHas) return;                       // 都空：正常
    if (!dbHas &&  ossHas) { _dbSync(); return; }        // 換裝置：本機天生空 → 靜默回填，不警告
    if ( dbHas && !ossHas) {                             // 資料丟失：線上空、本機有 → 通知
        console.warn("🐈‍⬛ [AFC] ⚠️ 偵測到線上戀人資料丟失，本機 DB 仍有備份");
        try { toast(t('dbMismatchLoss'), 14000, "#e53935"); } catch {}
        try { chatLocalNotice(t('dbMismatchLoss')); } catch {}
        return;
    }
    if (_loverSetEqual(oss, db)) { _dbSync(); return; }  // 一致：更新時間戳即可
    // 兩者都有但不一致 → 通知，讓玩家自己到復原頁決定
    console.warn("🐈‍⬛ [AFC] ⚠️ 線上戀人資料與本機 DB 不一致");
    try { toast(t('dbMismatchDiff'), 14000, "#FB8C00"); } catch {}
    try { chatLocalNotice(t('dbMismatchDiff')); } catch {}
}

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
        Player.ExtensionSettings.AFC = JSON.stringify(defaultPrivate());
        // 4) 真正刪掉舊版殘留 key（_cleanupLegacyKeys 會送整個 ExtensionSettings）
        _cleanupLegacyKeys();
        // 5) 重建預設並同步
        AFCLockAccessOn.clear();
        setLastKnownLoverCount(0);   // 解除 saveSharedSettings 的「戀人歸零」保護
        getSharedSettings();
        _dbSync();                   // 一併清空本機 DB（初廠＝手動清除）
        // 送整個 ExtensionSettings（含重置後的 AFC）+ OnlineSharedSettings
        try { ServerAccountUpdate?.QueueData?.({ ExtensionSettings: Player.ExtensionSettings, OnlineSharedSettings: Player.OnlineSharedSettings }, true); } catch {}
        console.warn("🐈‍⬛ [AFC] ⚠️ 已執行初廠設定（戀人關係解除、所有戀人鎖破壞、設定重置）");
        try { toast(t('factoryDone'), 8000, "#e53935"); } catch {}
        try { chatLocalNotice(t('factoryDone')); } catch {}
    } catch (e) { console.error("🐈‍⬛ [AFC] ❌ 初廠設定失敗:", e?.message); }
}
