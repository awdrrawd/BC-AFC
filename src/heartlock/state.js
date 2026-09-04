// ════════════════════════════════════════
//  HeartLock module: state.js
//  全域執行期狀態（單一物件，跨模組共用同一參照 → 直接改屬性即可）
// ════════════════════════════════════════

import { TAB_OVERVIEW } from './config.js';

export const state = {
    lifecycle: { initialized: false, assetCreated: false, modApi: null },
    timers: { vibe: null, vibeAnimation: null, unlockCheck: null, integrity: null },
    vibe: { cycle: 0, animationUntil: 0, animationLevel: 0 },
    operations: {
        lastRestoreMessage: 0,
        restoring: false,
        unlocking: false,
        applyingLock: false,
        serverSync: false,
        sendingResist: false,
        timerUnlocking: false,
    },
    panel: {
        tab: TAB_OVERVIEW, targetChar: null, groupName: null,
        timerInput: 0, noteEditing: false, ctlEditing: false, noteDraft: null,
        ctlVibe: 'off', ctlOrg: 'normal',
        dpYear: 2026, dpMonth: 1, dpDay: 1, dpHour: 0, dpMin: 0,
    },
};

export const grabStateChar   = { count: 0, firstTriggerTime: Date.now(), state: false };
export const grabStateSingle = { count: 0, firstTriggerTime: Date.now(), state: false };

// 因相依物件（如 Echo 拘束）尚未載入而無法復原的部位 → 暫掛，下次登入/刷新再試
export const _pendingRestore = new Set();
