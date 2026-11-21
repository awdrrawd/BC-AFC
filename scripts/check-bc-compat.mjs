// 檢查 AFC 所 hook 的 Bondage Club 函式，在指定的 BC 原始碼中是否仍然存在。
//
//   node scripts/check-bc-compat.mjs <BC 原始碼目錄>
//
// BC 改名或移除函式時，bcModSdk 在執行期才會丟錯；這支腳本把問題提前到 CI。
// 只檢查「存在」，不檢查簽名；簽名變更仍需看 BC 的 CHANGELOG。
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { HEARTLOCK_PROPERTY_KEYS } from '../src/compat/heartlock-markers.js';

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

/** 取出 BC `PropertyData` 已登記的欄位名稱（`new PropertyDataEntry(` 與 `PropertyDataEntry.copyFrom(` 兩種寫法；
 *  `Key: undefined` 只是佔位，不算登記）。R134 起 ItemPropertiesValidate 只保留有登記的欄位。找不到這張表時回傳 null。 */
export function extractPropertyDataKeys(bcText) {
    const start = bcText.search(/\b(?:var|let|const)\s+PropertyData\s*=\s*\{/);
    if (start < 0) return null;
    const end = bcText.indexOf('\n};', start);
    const body = bcText.slice(start, end < 0 ? undefined : end);
    return new Set([...body.matchAll(/^\t([A-Za-z_]\w*):\s*(?:new\s+PropertyDataEntry\(|PropertyDataEntry\.\w+\()/gm)].map(match => match[1]));
}

/** 把 AFC 寫入 Item.Property 的欄位依「BC 是否已登記」分成兩組。 */
export function classifyProperties(ownedKeys, registeredKeys) {
    return {
        registered: ownedKeys.filter(key => registeredKeys.has(key)),
        unregistered: ownedKeys.filter(key => !registeredKeys.has(key)),
    };
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

// 僅供參考、不影響缺失判定：bc-compat-issue.mjs 只認 "  - 名稱" 的缺失清單，所以這裡改用 "·" 當項目符號。
function reportProperties(bcText) {
    const registeredKeys = extractPropertyDataKeys(bcText);
    if (!registeredKeys) { console.error('找不到 BC 的 PropertyData；檢查腳本需要更新'); process.exit(2); }
    const { registered, unregistered } = classifyProperties(HEARTLOCK_PROPERTY_KEYS, registeredKeys);
    console.log(`PropertyData 已登記 ${registeredKeys.size} 個欄位`);
    if (unregistered.length) {
        console.log(`  · AFC 欄位尚未登記（由 compat/r134-heartlock.js 的 ItemPropertiesValidate 補丁保留）：${unregistered.join(', ')}`);
    } else {
        console.log('  · AFC 欄位全部已登記：可移除 compat/r134-heartlock.js 的 ItemPropertiesValidate 補丁');
    }
    if (registered.length) console.log(`  · AFC 欄位已由 BC 登記：${registered.join(', ')}`);
}

function main() {
    const bcDir = process.argv[2];
    if (!bcDir) { console.error('用法: node scripts/check-bc-compat.mjs <BC 原始碼目錄>'); process.exit(2); }
    const ours = walk('src').map(file => readFileSync(file, 'utf8'));
    const theirs = ['Scripts', 'Screens'].flatMap(dir => { try { return walk(join(bcDir, dir)); } catch { return []; } });
    if (!theirs.length) { console.error(`在 ${bcDir} 找不到 BC 的 Scripts/ 或 Screens/ 目錄`); process.exit(2); }
    const targets = extractHookTargets(ours);
    const bcText = theirs.map(file => readFileSync(file, 'utf8')).join('\n');
    const missing = findMissing(targets, bcText);
    console.log(`BC 原始碼檔案 ${theirs.length} 個；AFC hook 目標 ${targets.length} 個`);
    reportProperties(bcText);
    if (missing.length) {
        console.error(`\n以下 ${missing.length} 個 hook 目標在 BC 中找不到：\n  - ${missing.join('\n  - ')}`);
        process.exit(1);
    }
    console.log('所有 hook 目標都存在');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
