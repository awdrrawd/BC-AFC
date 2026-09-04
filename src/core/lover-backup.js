// 戀人資料的本機備份 repository。此層只負責序列化，不讀取共享設定。
import { MOD_VERSION, LS_PREFIX } from './config.js';

function backupKey() {
    const account = Player?.AccountName ?? Player?.MemberNumber ?? 'anon';
    return LS_PREFIX + account;
}

export function writeLoverBackup(lovers) {
    try {
        localStorage.setItem(backupKey(), JSON.stringify({
            v: MOD_VERSION,
            ts: Date.now(),
            memberNumber: Player?.MemberNumber ?? null,
            lovers: (lovers ?? []).map(lover => ({
                memberNumber: Number(lover.memberNumber),
                name: lover.name,
                stage: lover.stage ?? 0,
                startDate: lover.startDate ?? null,
                stageDate: lover.stageDate ?? null,
                lastSeen: lover.lastSeen ?? null,
            })),
        }));
    } catch {}
}

export function readLoverBackup() {
    try {
        const raw = localStorage.getItem(backupKey());
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

export function readBackupLovers() {
    const record = readLoverBackup();
    return Array.isArray(record?.lovers) ? record.lovers : [];
}
