#!/usr/bin/env node
// 依 check-bc-compat.mjs 的結果維護唯一一則 label=bc-compat 的追蹤 issue：
//   - 有缺失且沒有 open issue：建立。
//   - 缺失清單與上次不同：更新內文並留言；相同則不重複打擾（原本每週都會多一則相同留言）。
//   - 缺失全部消失：留言後自動關閉。
// 需要 gh CLI 與 GH_TOKEN（issues: write）、GH_REPO。
//
//   node scripts/bc-compat-issue.mjs <check 輸出的 log> <結束碼 0|1> [BC 版本]
import {readFileSync, writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';

const [logPath, status, version = 'unknown'] = process.argv.slice(2);
if (!logPath || !['0', '1'].includes(status)) {
  console.error('用法：node scripts/bc-compat-issue.mjs <log> <0|1> [BC 版本]');
  process.exit(2);
}

const gh = (...args) => execFileSync('gh', args, {encoding: 'utf8'});
const log = readFileSync(logPath, 'utf8');
// 缺失的函式名稱在 log 中是以 "  - 名稱" 逐行列出。
const missing = status === '1' ? [...log.matchAll(/^\s+- (\S+)\s*$/gm)].map(m => m[1]).sort() : [];
const sig = createHash('sha1').update(JSON.stringify(missing)).digest('hex').slice(0, 12);
const runUrl = process.env.GITHUB_RUN_ID
  ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
  : '';

const body = `<!-- bc-compat-sig:${sig} -->
每週檢查發現 ${missing.length} 個 AFC hook 目標在 BC 中找不到（BC 版本：${version}），該功能可能失效。

${missing.map(name => `- \`${name}\``).join('\n')}

<details><summary>完整輸出</summary>

\`\`\`text
${log.trim().slice(0, 40000)}
\`\`\`

</details>

> 此議題由每週檢查自動維護：缺失清單改變時更新內文並留言，全部恢復後自動關閉。${runUrl ? `\n> 最近一次執行：${runUrl}` : ''}`;

try { gh('label', 'create', 'bc-compat', '--color', 'D93F0B', '--description', 'BC 更新造成 AFC hook 失效', '--force'); } catch {}
const open = JSON.parse(gh('issue', 'list', '--label', 'bc-compat', '--state', 'open', '--json', 'number,body', '--limit', '20'));
const existing = open[0];
const tmp = `${process.env.RUNNER_TEMP ?? '.'}/bc-compat-body.md`;

if (missing.length) {
  writeFileSync(tmp, body);
  if (!existing) {
    gh('issue', 'create', '--title', 'BC 更新後部分 AFC hook 目標消失', '--label', 'bc-compat', '--body-file', tmp);
    console.log(`已建立 issue（${missing.length} 項缺失）`);
  } else if ((existing.body ?? '').includes(`bc-compat-sig:${sig}`)) {
    console.log('缺失清單與上次相同，不重複通知。');
  } else {
    gh('issue', 'edit', String(existing.number), '--body-file', tmp);
    gh('issue', 'comment', String(existing.number), '--body', `檢查結果有變動（BC 版本 ${version}，目前 ${missing.length} 項缺失），內文已更新。`);
    console.log(`已更新 issue #${existing.number}`);
  }
} else if (open.length) {
  for (const issue of open) {
    gh('issue', 'comment', String(issue.number), '--body', `BC 版本 ${version} 的所有 hook 目標都存在，自動關閉。`);
    gh('issue', 'close', String(issue.number));
    console.log(`缺失已消失，已關閉 issue #${issue.number}`);
  }
} else {
  console.log('所有 hook 目標都存在，沒有需要處理的 issue。');
}
