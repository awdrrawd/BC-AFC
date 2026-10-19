// 手動復原用的唯讀備份來源（過去版本保存的 AFC_LoverBackup / AFC_LegacyPublic）。
// 不再自動遷移；只有使用者在設定頁主動復原時才會讀取。
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
