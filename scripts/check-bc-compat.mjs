// 檢查 AFC 所 hook 的 Bondage Club 函式，在指定的 BC 原始碼中是否仍然存在。
//
//   node scripts/check-bc-compat.mjs <BC 原始碼目錄>
//
// BC 改名或移除函式時，bcModSdk 在執行期才會丟錯；這支腳本把問題提前到 CI。
// 只檢查「存在」，不檢查簽名；簽名變更仍需看 BC 的 CHANGELOG。
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const escape = name => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** 從 AFC 原始碼取出所有被 hook 的函式名稱（字串常值與 `for (const x of [...]) hook(x` 迴圈）。 */
export function extractHookTargets(sources) {
    const targets = new Set();
    for (const text of sources) {
        for (const match of text.matchAll(/\bhook(?:Function)?\(\s*(['"`])([A-Za-z_][\w.]*)\1/g)) targets.add(match[2]);
        for (const match of text.matchAll(/for\s*\(\s*const\s+(\w+)\s+of\s+\[([^\]]*)\]\s*\)\s*\{?\s*(?:try\s*\{\s*)?hook\(\s*\1\b/g))
            for (const name of match[2].matchAll(/(['"`])([A-Za-z_][\w.]*)\1/g)) targets.add(name[2]);
    }
    return [...targets].sort();
}

/** 回傳在 BC 原始碼文字中找不到的名稱。支援 `Name` 與 `Namespace.method`。 */
export function findMissing(names, bcText) {
    return names.filter(name => {
        const method = name.includes('.') ? name.split('.').pop() : null;
        const n = escape(method ?? name);
        const patterns = method
            ? [`\\b${n}\\s*:\\s*function\\b`, `\\bfunction\\s+${n}\\b`, `\\bstatic\\s+(?:async\\s+)?${n}\\s*\\(`, `^\\s*${n}\\s*\\(.*\\)\\s*\\{`]
            : [`\\bfunction\\s+${n}\\s*\\(`, `\\b(?:var|let|const|class)\\s+${n}\\b`, `^\\s*${n}\\s*=`,
                // 擴充物品（如 HighSecurityPadlock）的 Load/Draw/Click 由 BC 在執行期以
                // globalThis[...] 產生（Scripts/ExtendedItem.js），原始碼中只有 `${名稱}Hook` 版本。
                `\\bfunction\\s+${n}Hook\\s*\\(`];
        return !patterns.some(pattern => new RegExp(pattern, 'm').test(bcText));
    });
}

function walk(directory, out = []) {
    for (const entry of readdirSync(directory)) {
        if (entry === 'node_modules' || entry === 'Tests' || entry.startsWith('.')) continue;
        const path = join(directory, entry);
        if (statSync(path).isDirectory()) walk(path, out);
        else if (path.endsWith('.js')) out.push(path);
    }
    return out;
}

function main() {
    const bcDir = process.argv[2];
    if (!bcDir) { console.error('用法: node scripts/check-bc-compat.mjs <BC 原始碼目錄>'); process.exit(2); }
    const ours = walk('src').map(file => readFileSync(file, 'utf8'));
    const theirs = ['Scripts', 'Screens'].flatMap(dir => { try { return walk(join(bcDir, dir)); } catch { return []; } });
    if (!theirs.length) { console.error(`在 ${bcDir} 找不到 BC 的 Scripts/ 或 Screens/ 目錄`); process.exit(2); }
    const targets = extractHookTargets(ours);
    const missing = findMissing(targets, theirs.map(file => readFileSync(file, 'utf8')).join('\n'));
    console.log(`BC 原始碼檔案 ${theirs.length} 個；AFC hook 目標 ${targets.length} 個`);
    if (missing.length) {
        console.error(`\n以下 ${missing.length} 個 hook 目標在 BC 中找不到：\n  - ${missing.join('\n  - ')}`);
        process.exit(1);
    }
    console.log('所有 hook 目標都存在');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
