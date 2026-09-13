import { getSharedSettings } from '../core/settings.js';
import { readBackupLovers } from '../core/lover-backup.js';
import { getLoverEntry, upsertLover } from './lovers.js';

function sourceLovers(source) {
    return source === 'online' ? (getSharedSettings()?.lovers ?? []) : readBackupLovers();
}

export function restoreAllLovers(source) {
    const lovers = sourceLovers(source);
    let restored = 0;
    for (const lover of lovers) {
        if (!getLoverEntry(lover.memberNumber) && upsertLover(lover)) restored++;
    }
    return restored;
}

export function restoreLover(source, index) {
    const lover = sourceLovers(source)[index];
    if (!lover) return null;
    return getLoverEntry(lover.memberNumber) ?? upsertLover(lover);
}
