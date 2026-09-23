import { createLockDraft } from '../../features/heartlock/crafting/draft-config.js';
import { openHLPanel, removeHLPanel } from './panel.js';
import { state } from '../../features/heartlock/state.js';
import { th as T } from '../../i18n/i18n.js';
import { HEARTLOCK_NAME } from '../../features/heartlock/config.js';

export function createCraftEditor(drafts) {
    let editor;
    const close = () => {
        if (editor && state.panel.targetChar === editor.character) removeHLPanel();
        editor = null;
    };
    const openEditor = () => {
        const selected = CraftingSelectedItem;
        if (selected?.Lock?.Name !== HEARTLOCK_NAME) return;
        close();
        const account = Player;
        const group = selected.Asset?.Group?.Name;
        if (!group) return;
        const context = createLockDraft(drafts.get(selected), {
            owner: account.MemberNumber, ownerName: account.Nickname || account.Name, group,
            isActive: () => editor === context && Player === account && CraftingSelectedItem === selected
                && selected.Lock?.Name === HEARTLOCK_NAME && state.panel.targetChar === context.character,
            onChange: settings => drafts.set(selected, settings),
        });
        editor = context;
        openHLPanel(context.character, group);
    };

    const updateButton = () => {
        const header = document.getElementById('crafting-screen-header');
        if (!header) return;
        let button = document.getElementById('afc-craft-inspect-lock');
        if (!button) {
            button = ElementButton.Create('afc-craft-inspect-lock', openEditor, {
                tooltip: T('craftLockTitle'), image: 'Icons/InspectLock.png', role: 'menuitem',
            });
            // BC's menu token is 90 x 90 in its 2000 x 1000 coordinate system.
            button.style.width = 'var(--menu-button-size)';
            button.style.height = 'var(--menu-button-size)';
            (document.getElementById('crafting-screen-menu') ?? header).append(button);
        }
        button.hidden = CraftingSelectedItem?.Lock?.Name !== HEARTLOCK_NAME;
        if (editor && (!editor.read() || state.panel.targetChar !== editor.character)) close();
    };
    return { close, updateButton };
}
