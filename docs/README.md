# AFC 技術文件

文件供維護者與其他插件作者使用；安裝與功能介紹見[專案 README](../README.md)。

## 閱讀入口

| 文件 | 用途 |
|---|---|
| [架構總覽](architecture.md) | 模組邊界與閱讀順序 |
| [原始碼目錄](source-layout.md) | 目前資料夾、檔案責任與 Craft 心鎖分工 |
| [架構圖](afc-architecture.html) | 可搜尋的功能與模組索引 |
| [執行流程與通訊](Architecture-and-Data.md) | 初始化、通道、Hook、建置與部署 |
| [資料保存](Storage.md) | 主資料、公開副本、恢復、快照與 Craft 範本清理 |
| [公開 API](Public-API.md) | `window.Liko.AFC`、Profile 整合與心鎖 API |
| [翻譯引擎](Localization-Engine.md) | 字庫維護、介面與聊天在地化 |
| [R132 相容性](r132-compatibility.md) | 版本修補紀錄、回歸案例與遊戲內驗收項目 |
| [GitHub 自動化](GitHub-Automation.md) | CI、Pages 與儲存庫設定 |

## 快速查詢

```js
const AFC = window.Liko?.AFC;
AFC?.version;                 // 建置版本由 package.json 注入
AFC?.isLover(123456);
AFC?.getLovers();             // 本人戀人主資料的複本
AFC?.isProfilePanelOpen();
AFC?.getProfileLoverRegions(); // 目前頁面可見條目的矩形與資料
```

畫面座標使用 BC 2000×1000 虛擬畫布。戀人上限為 20 人，Profile 每頁顯示 10 人；下一頁右向三角在第二頁再按會回第一頁，方向不變。

## 維護原則

- 目錄與責任以 `source-layout.md` 為準；持久化規則集中於 `Storage.md`。
- 版本修補及當時驗證結果放在 R132 紀錄，不當成所有版本的相容保證。
- 保留既有文件檔名與連結，避免外部引用失效。
- 修改程式後按影響範圍執行 `npm test`、`npm run lint`、`npm run build`、`npm run check:assets`。
