// Read-only legacy online backup for manual recovery.
export function readBackupLovers() {
    const es = Player?.ExtensionSettings;
    const record = es?.AFC_LoverBackup;
    if (record?.memberNumber === Player?.MemberNumber && Array.isArray(record?.lovers))
        return structuredClone(record.lovers);
    // Preserved online source also lets users recover from the earlier cancel bug manually.
    const legacy = es?.AFC_LegacyPublic;
    return Array.isArray(legacy?.lovers) &&
        (legacy.memberNumber == null || legacy.memberNumber === Player?.MemberNumber)
        ? structuredClone(legacy.lovers) : [];

}

// Legacy lover records were stored in localStorage, not HeartLock's IndexedDB.
// Read only exact current-account keys, never enumerate or use the old anon key.
export function readLegacyLocalLovers() {
    const memberNumber = Player?.MemberNumber;
    if (!Number.isSafeInteger(memberNumber) || memberNumber <= 0) return null;
    const accountName = Player?.AccountName;
    const keys = [String(memberNumber)];
    if (typeof accountName === 'string' && accountName.trim()) keys.unshift(accountName);
    const records = [];
    for (const key of keys) {
        try {
            const record = JSON.parse(localStorage.getItem('AFC_DB::' + key));
            if (!Array.isArray(record?.lovers) || !record.lovers.length) continue;
            if (record.memberNumber != null && record.memberNumber !== memberNumber) continue;
            records.push(record);
        } catch { /* Unavailable or malformed storage is not a recovery source. */ }
    }
    return records.sort((a, b) => (b.ts ?? 0) - (a.ts ?? 0))[0] ?? null;
}
