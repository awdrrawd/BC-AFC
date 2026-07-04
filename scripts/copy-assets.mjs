// Stage self-hosted assets into public/ (which vite deploys to Pages root):
//   Images/*.png -> public/    (AFC 設定圖示 + 心形鎖圖片)
// Edit the sources in Images/; build refreshes public/. Deployed images are then
// served at https://awdrrawd.github.io/BC-AFC/<name>.png
import { copyFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));

function copyInto(srcDir, dstDir, filter) {
  const from = root + srcDir;
  if (!existsSync(from)) { console.warn(`🐈‍⬛ [AFC] ⚠️ 找不到 ${srcDir}，略過`); return; }
  mkdirSync(root + dstDir, { recursive: true });
  let n = 0;
  for (const name of readdirSync(from)) {
    if (filter && !filter(name)) continue;
    copyFileSync(from + name, root + dstDir + name);
    n++;
  }
  console.log(`🐈‍⬛ [AFC] ${srcDir} -> ${dstDir} (${n} 檔)`);
}

mkdirSync(root + 'public', { recursive: true });
copyInto('Images/', 'public/', n => /\.png$/i.test(n));
