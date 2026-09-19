import { GRAB_WINDOW_MS, GRAB_COOLDOWN_MS, HEARTLOCK_NAME } from './config.js';
import { sendLocalizedAction } from '../i18n/l10n.js';

let account;
let triggers = [];
let pausedUntil = 0;

export function resetProtection() {
    account = undefined;
    triggers = [];
    pausedUntil = 0;
}

export function isProtectionPaused() {
    if (account !== Player) {
        resetProtection();
        account = Player;
    }
    return Date.now() < pausedUntil;
}

// One conflict batch is one trigger, regardless of the number of affected slots.
export function recordProtectionConflict() {
    if (isProtectionPaused()) return false;
    const now = Date.now();
    triggers = triggers.filter(time => now - time < GRAB_WINDOW_MS);
    triggers.push(now);
    if (triggers.length < 4) return true;
    pausedUntil = now + GRAB_COOLDOWN_MS;
    triggers = [];
    try { sendLocalizedAction('hl', 'protectDisabled', [Player.Nickname || Player.Name, HEARTLOCK_NAME]); } catch {}
    return false;
}
