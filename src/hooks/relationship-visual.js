import { STAGE_COLOR } from '../core/config.js';
import { getSharedSettings } from '../core/settings.js';
import { stageLabel } from '../i18n/i18n.js';
import { injectAFCDialogs } from '../relations/dialog.js';
import { isAFCLover } from '../relations/lovers.js';

export function installRelationshipVisualHooks(registry) {
    const { hook } = registry;
    hook('ChatRoomDrawCharacterStatusIcons', 1, (args, next) => {
        const character = args[0];
        if (!character || character.IsPlayer() || !isAFCLover(character.MemberNumber)) return next(args);
        const original = Object.getOwnPropertyDescriptor(character, 'IsLoverOfPlayer');
        try {
            character.IsLoverOfPlayer = () => true;
            return next(args);
        } finally {
            if (original) Object.defineProperty(character, 'IsLoverOfPlayer', original);
            else delete character.IsLoverOfPlayer;
        }
    });

}

export function decorateFriendList() {
        const lovers = getSharedSettings()?.lovers ?? [];
        const containerId = (typeof FriendListIDs !== 'undefined' && FriendListIDs.friendList)
            ?? 'FriendListContent';
        const rows = document.getElementById(containerId)?.getElementsByClassName('friend-list-row') ?? [];
        for (const row of rows) {
            const member = row.querySelector('.MemberNumber');
            const relation = row.querySelector('.RelationType');
            if (!member || !relation) continue;
            const lover = lovers.find(entry => Number(entry.memberNumber) === Number(member.innerText.trim()));
            if (!lover) continue;
            const label = `♥ ${stageLabel(lover.stage)}`;
            const textNode = Array.from(relation.childNodes).find(node => node.nodeType === Node.TEXT_NODE);
            if (textNode) textNode.textContent = label;
            else relation.prepend(document.createTextNode(label));
            relation.style.color = STAGE_COLOR[lover.stage] ?? '#FFB6C1';
        }
}

export function installRelationshipDialogHooks(registry) {
    const { hook } = registry;
    const injectDialogs = () => {
        try { if (CurrentCharacter) injectAFCDialogs(CurrentCharacter); } catch {}
    };
    hook('ChatRoomCharacterViewDraw', 1, (args, next) => { const result = next(args); injectDialogs(); return result; });
    hook('ChatRoomMenuDraw', 1, (args, next) => { const result = next(args); injectDialogs(); return result; });
    registry.interval(injectDialogs, 1000);
}
