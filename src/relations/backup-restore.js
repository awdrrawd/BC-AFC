import { getSharedSettings } from '../core/settings.js';
import { readBackupLovers } from '../core/lover-backup.js';
import { replaceLovers, upsertLover } from './lovers.js';

function sourceLovers(source) {
    return source === 'online' ? (getSharedSettings()?.lovers ?? []) : readBackupLovers();
}

export function restoreAllLovers(source) {
    const lovers = sourceLovers(source);
    replaceLovers(lovers);
    return lovers.length;
}

export function restoreLover(source, index) {
    const lover = sourceLovers(source)[index];
    return lover ? upsertLover(lover) : null;
}
