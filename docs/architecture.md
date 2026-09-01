# AFC 架構與功能分支圖

互動式架構圖：[開啟 AFC 功能分支圖](./afc-architecture.html)

左側依功能分類選擇，右側顯示「功能 → 模組責任 → 實際檔案」束狀關係。點擊節點可查看完整路徑。

## 模組邊界

- `core/`：初始化、狀態、設定、儲存、Socket 與 BC hooks。
- `relations/`：戀人資料與交往、訂婚、結婚、分手、恢復流程。
- `net/`：BEEP、在線狀態、房間與 LIKOSHARE 同步。
- `ui/`：Profile、設定頁與申請介面。
- `heartlock/`：內建 Heart Lock 的面板、權限、計時、震動及防脫逃功能。
- `i18n/`：共用翻譯引擎、fallback 與字庫載入。

