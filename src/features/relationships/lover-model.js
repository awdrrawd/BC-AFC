import { STAGE, STAGE_LABEL, MAX_AFC_LOVERS } from '../../core/config.js';
import { cleanText } from '../../util/text.js';

export function normalizeMemberNumber(value) {
    const memberNumber = Number(value);
    return Number.isSafeInteger(memberNumber) && memberNumber > 0 ? memberNumber : null;
}

export function sameMemberNumber(left, right) {
    const a = normalizeMemberNumber(left);
    const b = normalizeMemberNumber(right);
    return a !== null && a === b;
}

export function normalizeLover(input, defaults = {}) {
    const memberNumber = normalizeMemberNumber(input?.memberNumber);
    if (memberNumber === null) return null;
    const now = Date.now();
    const startDate = input.startDate ?? defaults.startDate ?? now;
    return {
        memberNumber,
        name: input.name ?? defaults.name ?? `#${memberNumber}`,
        stage: input.stage ?? defaults.stage ?? STAGE.DATING,
        startDate,
        stageDate: input.stageDate ?? defaults.stageDate ?? startDate,
        ...(input.lastSeen != null || defaults.lastSeen != null
            ? { lastSeen: input.lastSeen ?? defaults.lastSeen }
            : {}),
    };
}

export function normalizeLoverList(list) {
    const unique = new Map();
    for (const input of list ?? []) {
        const lover = normalizeLover(input);
        if (lover) unique.set(lover.memberNumber, lover);
    }
    return [...unique.values()];
}

// ── 對方（不可信）資料的邊界清理 ─────────────────────────────
//  P2P 廣播與 Beep payload 來自其他客戶端，型別與大小都不能假設。
//  這裡只回傳「確定合法」的欄位，不補預設日期（避免憑空捏造關係時間）。

// 只接受 number 或「非空的數字字串」。Number(null) / Number('') / Number(true) 會得到 0 或 1，
// 不能把它們當成合法的階段或時間。
function toNumber(value) {
    if (typeof value === 'number') return value;
    if (typeof value === 'string' && value.trim() !== '') return Number(value);
    return NaN;
}

/** 階段只接受 0/1/2，其餘回傳 undefined。 */
export function sanitizeStage(value) {
    const stage = toNumber(value);
    return Number.isInteger(stage) && stage in STAGE_LABEL ? stage : undefined;
}

/** 時間戳只接受有限且不晚於「現在 + 1 天」的非負數，其餘回傳 undefined。 */
export function sanitizeTimestamp(value, now = Date.now()) {
    const time = toNumber(value);
    return Number.isFinite(time) && time >= 0 && time <= now + 86400000 ? time : undefined;
}

/** 清理對方廣播的戀人清單：限制數量、型別與欄位，剔除無效條目。 */
export function sanitizePeerLovers(list) {
    if (!Array.isArray(list)) return [];
    const unique = new Map();
    for (const input of list.slice(0, MAX_AFC_LOVERS * 2)) {
        if (!input || typeof input !== 'object') continue;
        const memberNumber = normalizeMemberNumber(input.memberNumber);
        if (memberNumber === null || unique.size >= MAX_AFC_LOVERS && !unique.has(memberNumber)) continue;
        const lover = { memberNumber };
        const name = cleanText(input.name, 40);
        if (name) lover.name = name;
        const stage = sanitizeStage(input.stage);
        if (stage !== undefined) lover.stage = stage;
        for (const key of ['startDate', 'stageDate']) {
            const time = sanitizeTimestamp(input[key]);
            if (time !== undefined) lover[key] = time;
        }
        unique.set(memberNumber, lover);
    }
    return [...unique.values()];
}

/** 鎖權限只接受明確的 true，其餘一律視為 false（拒絕）。 */
export function sanitizeLockPerms(value) {
    return {
        enableAFCLock: value?.enableAFCLock === true,
        enableOwnerLock: value?.enableOwnerLock === true,
    };
}
