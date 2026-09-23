import { MAX_TEXT } from '../config.js';

export function normalizeCraftLockSettings(value = {}) {
    return {
        note: typeof value.note === 'string' ? value.note.slice(0, MAX_TEXT) : '',
        vibe: ['off', 'low', 'mid', 'high'].includes(value.vibe) ? value.vibe : 'off',
        orgasmMode: ['normal', 'edge', 'deny'].includes(value.orgasmMode) ? value.orgasmMode : 'normal',
        durationMinutes: Number.isFinite(Number(value.durationMinutes)) ? Math.max(0, Math.min(525600, Number(value.durationMinutes))) : 0,
        removeRestraints: value.removeRestraints === true,
    };
}

export function craftLockConfig(value, now = Date.now()) {
    const { durationMinutes, ...settings } = normalizeCraftLockSettings(value);
    return { ...settings, unlockTime: durationMinutes > 0 ? new Date(now + durationMinutes * 60000).toISOString() : null };
}
