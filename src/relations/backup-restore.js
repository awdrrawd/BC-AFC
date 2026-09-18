import { getSharedSettings, prepareManualLoverRecovery } from '../core/settings.js';
import { readBackupLovers } from '../core/lover-backup.js';
import { getLoverEntry, upsertLover } from './lovers.js';

function sourceLovers(source) {
    return source === 'online' ? (getSharedSettings()?.lovers ?? []) : readBackupLovers();
}

export function restoreAllLovers(source) {
    const lovers = sourceLovers(source);
    if (source === 'backup' && lovers.length && !getSharedSettings() && !prepareManualLoverRecovery()) return 0;
    let restored = 0;
    for (const lover of lovers) {
        if (!getLoverEntry(lover.memberNumber) && upsertLover(lover)) restored++;
    }
    return restored;
}

export function restoreLover(source, index) {
    const lover = sourceLovers(source)[index];
    if (!lover) return null;
    if (source === 'backup' && !getSharedSettings() && !prepareManualLoverRecovery()) return null;
    return getLoverEntry(lover.memberNumber) ?? upsertLover(lover);
}
