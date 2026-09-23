// ════════════════════════════════════════
//  HeartLock module: util.js
//  執行期通用工具
// ════════════════════════════════════════


export function log(...a) { console.log('🐈‍⬛ [HeartLock]', ...a); }
export function clone(v)  { return JSON.parse(JSON.stringify(v)); }
export function wait(ms)  { return new Promise(r => setTimeout(r, ms)); }
export async function waitFor(fn, timeout = 0, interval = 100) {
    const start = Date.now();
    while (true) {
        try { if (fn()) return true; } catch {}
        if (timeout > 0 && Date.now() - start > timeout) return false;
        await wait(interval);
    }
}

