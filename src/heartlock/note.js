// ════════════════════════════════════════
//  HeartLock module: note.js
//  筆記編輯區清理 + 筆記內圖片 URL 解析嵌入
//  （筆記 textarea 本身由 tabs.js 的 hlTabNote 就地建立於 DOM 面板內）
// ════════════════════════════════════════

import { NOTE_OVERLAY_ID, CC } from './config.js';
import { th as T } from '../i18n/i18n.js';
import { hlEl } from './util.js';

export function closeNoteOverlay() {
    document.getElementById(NOTE_OVERLAY_ID)?.remove();
}

// ── 筆記圖片解析 ──
export function renderNoteWithImages(text, container) {
    if (!text) { container.textContent = T('noNote'); container.style.color = CC.dim; return; }
    const IMG_RE = /https?:\/\/\S+\.(?:jpg|jpeg|png|gif|webp|avif|svg)(?:\?[^\s]*)?/gi;
    let last = 0, m; IMG_RE.lastIndex = 0;
    while ((m = IMG_RE.exec(text)) !== null) {
        if (m.index > last) container.appendChild(document.createTextNode(text.slice(last, m.index)));
        const url = m[0];
        const wrap = hlEl('span', 'display:inline;');
        const aLink = hlEl('a', `color:${CC.acc};word-break:break-all;`, url);
        aLink.href = url; aLink.target = '_blank';
        const embedBtn = hlEl('button',
                              `background:none;border:1px solid ${CC.border};color:${CC.acc};cursor:pointer;font-size:.85em;padding:.1em .4em;margin-left:.3em;border-radius:3px;`,
                              '(載入圖片)');
        embedBtn.onclick = () => {
            const img = document.createElement('img');
            img.src = url; img.style.cssText = 'max-width:100%;display:block;margin:.4em 0;border-radius:4px;';
            img.onerror = () => { img.alt = '(無法載入)'; };
            wrap.innerHTML = ''; wrap.appendChild(img);
        };
        wrap.appendChild(aLink); wrap.appendChild(embedBtn);
        container.appendChild(wrap);
        last = m.index + url.length;
    }
    if (last < text.length) container.appendChild(document.createTextNode(text.slice(last)));
}
