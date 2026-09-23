import { normalizeCraftLockSettings, craftLockConfig } from './settings.js';

// Local-only adapters for the existing lock panel. Never register these as room
// characters or persist them as worn padlocks.
const drafts = new WeakMap();
export const getLockDraft = character => drafts.get(character);

export function createLockDraft(settings, { owner, ownerName, group, isActive, onChange }) {
    const character = { IsPlayer: () => false };
    let value = normalizeCraftLockSettings(settings);
    const cfg = { owner, ownerName };
    const context = {
        character, group,
        read() {
            if (!isActive()) return null;
            Object.assign(cfg, craftLockConfig(value));
            return cfg;
        },
        patch(patch) {
            if (!isActive()) return;
            const next = { ...value, ...patch };
            if (Object.hasOwn(patch, 'unlockTime')) {
                const time = Date.parse(patch.unlockTime);
                next.durationMinutes = Number.isFinite(time) ? Math.max(0, Math.round((time - Date.now()) / 60000)) : 0;
            }
            value = normalizeCraftLockSettings(next);
            context.read();
            onChange({ ...value });
        },
    };
    drafts.set(character, context);
    return context;
}
