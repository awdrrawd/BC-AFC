import { t } from '../i18n/i18n.js';

const pending = new Set();
let sequence = 0;

// Native <dialog> supplies focus trapping and modal keyboard behavior, without
// blocking the game or invoking a browser confirm/alert window.
export function confirmInAFC(message) {
    return new Promise(resolve => {
        const previousFocus = document.activeElement;
        const dialog = document.createElement('dialog');
        const title = document.createElement('h2');
        const body = document.createElement('p');
        const actions = document.createElement('div');
        const accept = document.createElement('button');
        const decline = document.createElement('button');
        title.id = `afc-confirm-title-${++sequence}`;
        title.textContent = 'AFC';
        body.textContent = message;
        dialog.setAttribute('aria-labelledby', title.id);
        dialog.style.cssText = 'box-sizing:border-box;width:min(560px,92vw);max-height:85vh;overflow:auto;background:#241421;color:#f6eef4;border:2px solid #e8618c;border-radius:16px;padding:24px;box-shadow:0 16px 64px #0009;font:16px/1.6 sans-serif';
        title.style.cssText = 'margin:0 0 12px;color:#ffaac0;font-size:22px';
        body.style.cssText = 'white-space:pre-wrap;overflow-wrap:anywhere;margin:0 0 24px';
        actions.style.cssText = 'display:flex;gap:12px;justify-content:flex-end;flex-wrap:wrap';
        accept.textContent = t('okBtn'); decline.textContent = t('cancelBtn');
        for (const button of [decline, accept]) {
            button.type = 'button';
            button.style.cssText = 'min-height:44px;padding:8px 24px;border:1px solid #e8618c;border-radius:8px;background:#442238;color:white;cursor:pointer;font:inherit';
        }
        accept.style.background = '#a91d58';
        let settled = false;
        const finish = value => {
            if (settled) return;
            settled = true;
            pending.delete(cancel);
            dialog.close(); dialog.remove();
            if (previousFocus?.isConnected) previousFocus.focus();
            resolve(value);
        };
        const cancel = () => finish(null); // logout/unload is not a declined recovery
        pending.add(cancel);
        accept.addEventListener('click', () => finish(true));
        decline.addEventListener('click', () => finish(false));
        dialog.addEventListener('cancel', event => { event.preventDefault(); finish(false); });
        dialog.addEventListener('close', () => finish(null));
        actions.append(decline, accept); dialog.append(title, body, actions);
        document.body.append(dialog);
        dialog.showModal(); decline.focus();
    });
}

export function cancelAFCConfirmations() {
    for (const cancel of [...pending]) cancel();
}
