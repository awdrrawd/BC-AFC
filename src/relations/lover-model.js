import { STAGE } from '../core/config.js';

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
