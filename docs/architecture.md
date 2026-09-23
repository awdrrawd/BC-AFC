# AFC 架構與功能分支圖

互動式架構圖：[開啟 AFC 功能分支圖](./afc-architecture.html)

依功能分類搜尋執行流程、模組責任與檔案索引。

## 模組邊界

- `core/`：初始化、共用狀態、設定、儲存與 Socket。
- `hooks/`：BC 掛鉤、registry 與生命週期。
- `features/relationships/`：戀人資料與交往、訂婚、結婚、分手、恢復流程。
- `net/`：BEEP、在線狀態、房間與 LIKOSHARE 同步。
- `ui/`：Profile、設定頁與申請介面。
- `features/heartlock/`：權限、快照、保存、Craft 範本、計時、震動與防脫逃。
- `ui/heartlock/`：共用心鎖面板與 Craft 編輯入口。
- `compat/`：R132 與 BCX 相容處理。
- `i18n/`：共用翻譯引擎、fallback 與字庫載入。

## 目前程式碼目錄

目前目錄與 Craft 心鎖分工見 [原始碼結構](source-layout.md)。

持久資料以[資料保存](Storage.md)為準；執行流程與通訊見[架構與資料](Architecture-and-Data.md)。所有文件入口見[文件索引](README.md)。
