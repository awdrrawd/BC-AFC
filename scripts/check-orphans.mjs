// 找出 src/ 底下「沒有任何檔案 import」的模組（刪功能後最常見的殘留）。
//   node scripts/check-orphans.mjs
// 入口檔（src/main.js、src/app.js）不算孤兒。
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, normalize, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

const ENTRIES = new Set(['src/main.js', 'src/app.js']);

function walk(directory, out = []) {
    for (const entry of readdirSync(directory)) {
        const path = join(directory, entry);
        if (statSync(path).isDirectory()) walk(path, out);
        else if (path.endsWith('.js')) out.push(path);
    }
    return out;
}

/** @param {Record<string,string>} files  路徑 → 內容（路徑以 / 分隔，相對專案根目錄） */
export function findOrphans(files, entries = ENTRIES) {
    const imported = new Set();
    for (const [file, text] of Object.entries(files)) {
        // 只計算「行首的 import/export 語句」與動態 import()；字串、註解內提到的 import 不算，
        // 否則測試 fixture 裡的字串會讓孤兒模組被誤判為有人使用。
        const pattern = /^[ \t]*(?:import|export)\b[^'"`;]*?['"](\.[^'"]+)['"]|\bimport\(\s*['"](\.[^'"]+)['"]\s*\)/gm;
        for (const match of text.matchAll(pattern)) {
            const specifier = match[1] ?? match[2];
            const target = normalize(join(dirname(file), specifier)).split(sep).join('/');
            imported.add(target.endsWith('.js') ? target : target + '.js');
        }
    }
    return Object.keys(files).filter(file => file.startsWith('src/') && !entries.has(file) && !imported.has(file)).sort();
}

function main() {
    const read = list => Object.fromEntries(list.map(file => [file.split(sep).join('/'), readFileSync(file, 'utf8')]));
    const files = read([...walk('src'), ...walk('test').filter(f => f.endsWith('.test.js'))]);
    const orphans = findOrphans(files);
    if (orphans.length) {
        console.error('沒有任何檔案 import 這些模組（刪除，或補上引用）：\n  - ' + orphans.join('\n  - '));
        process.exit(1);
    }
    console.log('沒有孤兒模組');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
