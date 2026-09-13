# GitHub 自動化設定

PR 與 main push 執行 Quality checks：npm ci、lint、test、build、check:assets。只有 main 通過後部署 Pages。Dependabot 每週檢查 npm 與 Actions，不自動合併。

手動設定：
1. 將變更推送並合併到 main。
2. Settings → Pages → Build and deployment → Source 選 GitHub Actions。
3. 首次檢查執行後，Settings → Rules → Rulesets 為 main 啟用 Require a pull request before merging 與 Require status checks to pass，選 Quality checks。個人維護不必要求其他人審核。
4. 確認 Actions 允許官方 actions/*；若 github-pages environment 限制分支，允許 main。

不需要 PAT 或額外 Secrets，工作流程使用 GitHub 內建 token。Dependabot 設定合併到預設分支後生效。未增加自動版本號或自動 Release，避免每次提交就產生發布；現有 main Pages 發布方式維持。
