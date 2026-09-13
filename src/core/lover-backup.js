// Read-only legacy ONLINE backup. Never read browser storage or auto-restore it.
export function readBackupLovers() {
    const record = Player?.ExtensionSettings?.AFC_LoverBackup;
    return record?.memberNumber === Player?.MemberNumber && Array.isArray(record?.lovers)
        ? structuredClone(record.lovers) : [];
}
