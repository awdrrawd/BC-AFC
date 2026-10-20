# GitHub 自動化設定

## 現有流程

| 工作流程 | 觸發 | 內容 |
|---|---|---|
| `deploy.yml` Validate and deploy | PR、push main | `npm ci` → lint → test → **check:orphans** → build → check:assets；main 通過後部署 Pages |
| `bc-compat.yml` BC compatibility | 每週一、手動 | 對 BC 原始碼檢查所有被 hook 的函式是否還存在；失敗時自動開（或更新）一則 `bc-compat` issue |
| `codeql.yml` CodeQL | PR、push main、每週三 | 靜態安全分析（HTML 注入、原型污染等） |
| Dependabot | 每週 | npm 與 Actions 更新，不自動合併 |

不需要 PAT 或額外 Secrets，工作流程使用 GitHub 內建 token。未增加自動版本號或自動 Release，避免每次提交就產生發布。

## 一次性手動設定

1. 將變更合併到 main。
2. Settings → Pages → Source 選 **GitHub Actions**。
3. 首次檢查執行後，Settings → Rules → Rulesets 為 main 啟用 *Require a pull request before merging* 與 *Require status checks to pass*，選 **Quality checks**（可再加 **Analyze JavaScript**）。個人維護不必要求其他人審核。
4. 確認 Actions 允許官方 `actions/*` 與 `github/codeql-action/*`；若 github-pages environment 限制分支，允許 main。
5. **BC 相容性檢查**：Settings → Secrets and variables → Actions → *Variables* 新增
   - `BC_REPO_URL`（必填）：Bondage Club 原始碼的 git 網址，需可匿名 clone。
   - `BC_REF`（選填）：要檢查的分支或標籤，例如 `R134`；留空則用預設分支。
   
   設定後到 Actions → BC compatibility → Run workflow 手動跑一次確認。
6. 程式碼掃描：Settings → Code security → 確認 *Code scanning* 已啟用（公開倉庫免費）。

## 本機檢查

| 指令 | 作用 |
|---|---|
| `npm run check` | lint + 測試 + 孤兒模組檢查（與 CI 相同的快速部分） |
| `npm run check:orphans` | 找出沒有任何檔案 import 的 `src/` 模組（刪功能後的殘留） |
| `npm run check:bc -- <BC 原始碼目錄>` | 本機對一份 BC 原始碼做相容性檢查 |
| `npm run setup-hooks` | **選用**：啟用提交前檢查（`.githooks/pre-commit` 會跑 `npm run check`）。停用：`git config --unset core.hooksPath` |

## 它們各自擋住什麼

- **`no-restricted-syntax`（ESLint）**：禁止把動態內容寫入 `innerHTML` / `outerHTML` / `insertAdjacentHTML` / `document.write`。清空容器（`innerHTML = ''`）允許；確實安全的動態 HTML 必須用 `eslint-disable-next-line` 並寫明理由（目前只有日期選擇器，內容全是自行計算的數字）。
- **`check:orphans`**：被刪除功能留下、沒人引用的檔案。
- **`check:bc`**：BC 改名或移除被 hook 的函式。只檢查「存在」，不檢查簽名；簽名變更仍需對照 BC 的 CHANGELOG。擴充物品（如 HighSecurityPadlock）的 `Load/Draw/Click` 由 BC 在執行期產生，檢查器以其 `…Hook` 版本判定。
- **CodeQL**：ESLint 抓不到的資料流型問題。

## 刻意沒有加的

- 自動合併 Dependabot、自動 Release／版本號：維持手動，避免誤發布。
- husky 等 hook 套件：改用 git 內建 `core.hooksPath`，不增加依賴。
- 遊戲內端對端測試：需要登入帳號與 BC 環境，無法在 CI 穩定執行；1 對 1 訊息與 `OnlineSharedSettings` 同步仍需手動在遊戲中驗證。
