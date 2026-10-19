// ════════════════════════════════════════
//  AFC module: text.js
//  不可信文字的共用清理（純函式，不依賴 BC 全域）
// ════════════════════════════════════════

/** 移除 C0 控制字元與 DEL（不使用 regex，避免 no-control-regex 與可讀性問題）。 */
export function stripControl(value) {
    let out = '';
    for (const ch of String(value)) {
        const code = ch.codePointAt(0);
        if (code >= 0x20 && code !== 0x7f) out += ch;
    }
    return out;
}

/** 不可信字串 → 去控制字元、trim、限長；非字串回傳 undefined。 */
export function cleanText(value, maxLength) {
    return typeof value === 'string' ? stripControl(value).trim().slice(0, maxLength) : undefined;
}
