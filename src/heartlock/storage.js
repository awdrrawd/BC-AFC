// ════════════════════════════════════════
//  HeartLock module: storage.js
//  ExtensionSettings 儲存 + 本地存底 DB（localStorage）+ 啟動對帳
// ════════════════════════════════════════

import { DEFAULT_STORAGE, EXT_KEY, EXT_KEY_OLD } from './config.js';
import { clone, log } from './util.js';
import { broadcastStorage } from './net.js';
import { reapplyFromAppearance } from './lock.js';

export function ensureStorage() {
    if (!window.Player) return false;
    if (!Player.ExtensionSettings) Player.ExtensionSettings = {};
    const es = Player.ExtensionSettings;
    // 一次性搬遷：舊 key 'HeartLock' → 'AFC_HeartLock'（保留作用中的鎖設定）
    if (es[EXT_KEY_OLD] !== undefined) {
        if ((!es[EXT_KEY] || typeof es[EXT_KEY] !== 'object') && typeof es[EXT_KEY_OLD] === 'object')
            es[EXT_KEY] = es[EXT_KEY_OLD];
        delete es[EXT_KEY_OLD];
        try { ServerAccountUpdate?.QueueData?.({ ExtensionSettings: Player.ExtensionSettings }, true); } catch {}
    }
    if (!es[EXT_KEY] || typeof es[EXT_KEY] !== 'object') es[EXT_KEY] = clone(DEFAULT_STORAGE);
    if (!es[EXT_KEY].padlocks) es[EXT_KEY].padlocks = {};
    Player.HeartLock = es[EXT_KEY];
    return true;
}

export function getSetting(key) { return Player?.HeartLock?.[key] ?? DEFAULT_STORAGE[key]; }

export function getPadlockConfig(character, groupName) {
    if (!character || !groupName) return null;
    const store = character.IsPlayer() ? (Player.HeartLock?.padlocks ?? {}) : (character.HeartLock?.padlocks ?? {});
    return store[groupName] ?? null;
}

export function getOrCreateConfig(groupName) {
    if (!ensureStorage()) return null;
    const p = Player.HeartLock.padlocks;
    if (!p[groupName]) {
        p[groupName] = {
            owner: Player.MemberNumber, ownerName: Player.Nickname || Player.Name,
            lockedAt: new Date().toISOString(),
            note: '', unlockTime: null, vibe: 'off', orgasmMode: 'normal',
        };
    }
    return p[groupName];
}

export function deleteConfig(groupName) {
    if (!ensureStorage()) return;
    delete Player.HeartLock.padlocks[groupName];
    saveAndSync();
}

export function saveAndSync() {
    if (!ensureStorage()) return;
    Player.HeartLock.updatedAt = Date.now();   // 任何上鎖/解鎖/設定變動都更新時間戳
    try { if (typeof ServerPlayerExtensionSettingsSync === 'function') ServerPlayerExtensionSettingsSync(EXT_KEY); } catch {}
    _hlLsWrite();   // 同步寫一份本地存底 DB
    broadcastStorage();
}

// ── 本地存底 DB（localStorage）+ 啟動對帳 ──
function _hlLsKey() { return 'HL_DB::' + (Player?.AccountName ?? Player?.MemberNumber ?? 'anon'); }

function _hlLsWrite() {
    try {
        localStorage.setItem(_hlLsKey(), JSON.stringify({
            ts:   Player.HeartLock?.updatedAt ?? 0,
            data: clone(Player.HeartLock),
        }));
    } catch {}
}
function _hlLsRead() {
    try { const raw = localStorage.getItem(_hlLsKey()); return raw ? JSON.parse(raw) : null; } catch { return null; }
}

// 鎖狀態指紋：部位 + 鎖主 + lockId + 計時 + 設定（用於判斷兩份資料是否一致）
function _hlNormalize(s) {
    const p = s?.padlocks ?? {};
    return Object.keys(p).sort().map(gn => {
        const c = p[gn] ?? {};
        return `${gn}:${c.owner}:${c.lockId ?? ''}:${c.unlockTime ?? ''}:${c.vibe ?? ''}:${c.orgasmMode ?? ''}`;
    }).join('|');
}
function _hlStorageEqual(a, b) { return _hlNormalize(a) === _hlNormalize(b); }

function _hlAdoptDB(data) {
    if (!data || typeof data !== 'object') return;
    Player.ExtensionSettings[EXT_KEY] = clone(data);
    if (!Player.ExtensionSettings[EXT_KEY].padlocks) Player.ExtensionSettings[EXT_KEY].padlocks = {};
    Player.HeartLock = Player.ExtensionSettings[EXT_KEY];
    saveAndSync();                         // 會 bump updatedAt 並回寫 DB，使兩邊一致
    try { reapplyFromAppearance(); } catch {}
    try { CharacterRefresh?.(Player, false); ChatRoomCharacterUpdate?.(Player); } catch {}
}

export function reconcileHLStorage() {
    if (!ensureStorage()) return;
    const db = _hlLsRead();
    const serverTs    = Player.HeartLock?.updatedAt ?? 0;
    const serverLocks = Object.keys(Player.HeartLock?.padlocks ?? {}).length;

    if (!db) {
        // 本機沒有 DB（換裝置 / 初次）→ 若伺服器有資料就建立 DB，不警告
        if (serverTs > 0 || serverLocks > 0) _hlLsWrite();
        return;
    }
    const dbTs    = db.ts ?? 0;
    const dbLocks = Object.keys(db.data?.padlocks ?? {}).length;

    // 情況1：伺服器時間戳為 0/null（被初始化）但 DB 有鎖 → 全部一起壞，直接抓 DB
    if ((serverTs === 0 || serverTs == null) && dbLocks > 0) {
        log('reconcile: server updatedAt is 0/null but local DB has locks → restoring from DB');
        _hlAdoptDB(db.data);
        return;
    }
    // 情況2：伺服器時間比 DB 舊（可能在別的裝置復原過）→ 比對，不一致就採用最新（DB）
    if (serverTs < dbTs && !_hlStorageEqual(Player.HeartLock, db.data)) {
        log('reconcile: server older than DB and differs → adopting DB (newest)');
        _hlAdoptDB(db.data);
        return;
    }
    // 否則伺服器較新或相等 → 以伺服器為準，更新 DB 時間戳
    _hlLsWrite();
}
