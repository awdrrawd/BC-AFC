// ════════════════════════════════════════
//  HeartLock module: storage.js
//  ExtensionSettings 儲存 + 本地存底 DB（localStorage）+ 啟動對帳
// ════════════════════════════════════════

import { DEFAULT_STORAGE, EXT_KEY, IDB_NAME, IDB_STORE, IDB_VER } from './config.js';
import { clone, log } from './util.js';
import { th as T } from '../i18n/i18n.js';
import { emitHeartLockEvent } from './events.js';

export function ensureStorage() {
    if (!window.Player) return false;
    if (!Player.ExtensionSettings) Player.ExtensionSettings = {};
    const es = Player.ExtensionSettings;
    let targetChanged = false;
    if (!es[EXT_KEY] || typeof es[EXT_KEY] !== 'object') {
        es[EXT_KEY] = clone(DEFAULT_STORAGE);
        targetChanged = true;
    }
    if (!es[EXT_KEY].padlocks) {
        es[EXT_KEY].padlocks = {};
        targetChanged = true;
    }
    Player.HeartLock = es[EXT_KEY];
    if (targetChanged) {
        try { if (typeof ServerPlayerExtensionSettingsSync === 'function') ServerPlayerExtensionSettingsSync(EXT_KEY); } catch {}
    }
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
    Player.HeartLock.updatedAt = Date.now();   // ALL 時間戳：任何上鎖/解鎖/設定變動都更新
    try { if (typeof ServerPlayerExtensionSettingsSync === 'function') ServerPlayerExtensionSettingsSync(EXT_KEY); } catch {}
    _hlDbWrite();   // 同步寫 localStorage + 非同步寫 IndexedDB（後手）
    emitHeartLockEvent('storage-saved');
}

// ══════════════════════════════════════════════════════════════
//  後備 DB：IndexedDB（耐用，主）+ localStorage（同步鏡像，後備）
//  DB 記錄格式：{ ts:<ALL 時間戳>, data:<clone(Player.HeartLock)> }
// ══════════════════════════════════════════════════════════════
function _hlDbKey() { return 'HL_DB::' + (Player?.AccountName ?? Player?.MemberNumber ?? 'anon'); }

// ── IndexedDB 輕量封裝（全部失敗即 no-op，退回 localStorage）──
let _idbPromise = null;
function _idbOpen() {
    if (_idbPromise) return _idbPromise;
    _idbPromise = new Promise((resolve) => {
        try {
            if (!window.indexedDB) { resolve(null); return; }
            const req = indexedDB.open(IDB_NAME, IDB_VER);
            req.onupgradeneeded = () => {
                const db = req.result;
                if (!db.objectStoreNames.contains(IDB_STORE)) db.createObjectStore(IDB_STORE);
            };
            req.onsuccess = () => resolve(req.result);
            req.onerror   = () => resolve(null);
        } catch { resolve(null); }
    });
    return _idbPromise;
}
async function _idbGet(key) {
    const db = await _idbOpen(); if (!db) return null;
    return new Promise((resolve) => {
        try {
            const r = db.transaction(IDB_STORE, 'readonly').objectStore(IDB_STORE).get(key);
            r.onsuccess = () => resolve(r.result ?? null);
            r.onerror   = () => resolve(null);
        } catch { resolve(null); }
    });
}
function _idbSet(key, val) {
    _idbOpen().then((db) => {
        if (!db) return;
        try { db.transaction(IDB_STORE, 'readwrite').objectStore(IDB_STORE).put(val, key); } catch {}
    });
}

// localStorage 同步寫（立即鏡像）；IndexedDB 非同步寫（耐用後備）
function _hlDbWrite() {
    const rec = { ts: Player.HeartLock?.updatedAt ?? 0, data: clone(Player.HeartLock) };
    try { localStorage.setItem(_hlDbKey(), JSON.stringify(rec)); } catch {}
    try { _idbSet(_hlDbKey(), rec); } catch {}
}
// 讀取後備 DB：取 IndexedDB 與 localStorage 中時間戳較新的一份
async function _hlDbRead() {
    let ls = null;
    try { const raw = localStorage.getItem(_hlDbKey()); ls = raw ? JSON.parse(raw) : null; } catch { ls = null; }
    let idb = null;
    try { idb = await _idbGet(_hlDbKey()); } catch { idb = null; }
    if (!ls) return idb;
    if (!idb) return ls;
    return (idb.ts ?? 0) >= (ls.ts ?? 0) ? idb : ls;
}

// 鎖狀態指紋：部位 + 鎖主 + lockId + ITEM 時間戳 + 計時 + 設定（判斷兩份資料是否一致）
function _hlNormalize(s) {
    const p = s?.padlocks ?? {};
    return Object.keys(p).sort().map(gn => {
        const c = p[gn] ?? {};
        return `${gn}:${c.owner}:${c.lockId ?? ''}:${c.lockTs ?? ''}:${c.unlockTime ?? ''}:${c.vibe ?? ''}:${c.orgasmMode ?? ''}`;
    }).join('|');
}
function _hlStorageEqual(a, b) { return _hlNormalize(a) === _hlNormalize(b); }

function _hlAdoptDB(data) {
    if (!data || typeof data !== 'object') return;
    Player.ExtensionSettings[EXT_KEY] = clone(data);
    if (!Player.ExtensionSettings[EXT_KEY].padlocks) Player.ExtensionSettings[EXT_KEY].padlocks = {};
    Player.HeartLock = Player.ExtensionSettings[EXT_KEY];
    saveAndSync();                         // bump ALL 並回寫 DB，使三份一致
    emitHeartLockEvent('storage-restored');
    try { CharacterRefresh?.(Player, false); ChatRoomCharacterUpdate?.(Player); } catch {}
}

// 從 DB 後手救回時,發一次「只給自己看」的本地訊息並列出受影響部位（線上資料被清才會走到）
function _notifyDbRestoreAnomaly() {
    try {
        const groups = Object.keys(Player.HeartLock?.padlocks ?? {});
        if (!groups.length) return;
        const nick = Player.Nickname || Player.Name;
        const msg = T('dbRestoreAnomaly', nick, groups.join(', '));
        if (typeof ChatRoomSendLocal === 'function') ChatRoomSendLocal(msg);
        else console.log('🐈‍⬛ [HeartLock]', msg);
    } catch {}
}

// ── 登入對帳：角色(on-body) / ExtensionSettings(ES) / DB 三存儲，以 ALL 時間戳為準 ──
export async function reconcileHLStorage() {
    if (!ensureStorage()) return;
    const db      = await _hlDbRead();
    const esTs    = Player.HeartLock?.updatedAt ?? 0;
    const esLocks = Object.keys(Player.HeartLock?.padlocks ?? {}).length;
    const dbTs    = db?.ts ?? 0;
    const dbLocks = Object.keys(db?.data?.padlocks ?? {}).length;

    let restoredFromDb = false;

    if (db) {
        // 情況1：ES 被清空(ts 0/null 或無鎖)但 DB 有鎖 → 從 DB 還原（線上資料遺失）
        if ((esTs === 0 || esTs == null || esLocks === 0) && dbLocks > 0) {
            log('reconcile: ES empty but DB has locks → restoring from DB');
            _hlAdoptDB(db.data);
            restoredFromDb = true;
        }
        // 情況4(DB 勝出)：DB 嚴格較新且內容不同 → 採用 DB（線上較舊/被回退）
        else if (dbTs > esTs && !_hlStorageEqual(Player.HeartLock, db.data)) {
            log('reconcile: DB newer than ES and differs → adopting DB');
            _hlAdoptDB(db.data);
            restoredFromDb = true;
        }
        // 否則 ES 較新或相等 → 以 ES 為準，回寫 DB
        else {
            _hlDbWrite();
        }
    } else {
        // 情況2：無 DB（換裝置 / 初次）→ 若 ES 有資料就建立 DB
        if (esTs > 0 || esLocks > 0) _hlDbWrite();
    }

    // 情況3：角色身上有鎖但設定缺失 → 依身上資料重建（owner 取 LockMemberNumber，缺則跳過）
    emitHeartLockEvent('storage-restored');
    // 舊鎖回填：身上有鎖物品但 _fullSnapshot/craft 缺漏 → 從當前物品補齊
    emitHeartLockEvent('storage-backfill');

    // 僅「從 DB 後手救回」才提示（從角色/ES 同步一律靜默）
    if (restoredFromDb) _notifyDbRestoreAnomaly();
}
