# AFC 技術文件

供維護者與其他插件作者使用；安裝與功能介紹見[專案 README](../README.md)。

## 文件索引

| 文件 | 用途 |
|---|---|
| [architecture.md](architecture.md) | 模組邊界、目錄樹、執行流程、通訊通道、Hook 優先序、建置與 Loader、**設計原則與注意事項** |
| [Storage.md](Storage.md) | 主資料、公開副本、復原、快照、Craft 範本生命週期 |
| [Public-API.md](Public-API.md) | `window.Liko.AFC`、Profile 面板整合、心鎖與服裝工具 API |
| [Localization-Engine.md](Localization-Engine.md) | 共用翻譯引擎、字庫維護、聊天在地化 |
| [r132-compatibility.md](r132-compatibility.md) | R132／BCX 相容機制、限制、測試依據 |
| [verification.md](verification.md) | **待辦**：尚需遊戲內驗收的項目 |
| [GitHub-Automation.md](GitHub-Automation.md) | CI、Pages、BC 相容檢查、本機檢查指令 |
| [afc-architecture.html](afc-architecture.html) | 可搜尋、可篩選的互動式架構導覽 |

## 快速查詢

```js
const AFC = window.Liko?.AFC;
AFC?.version;                  // 由 package.json 注入
AFC?.isLover(123456);
AFC?.getLovers();              // 本人戀人主資料的深複本
AFC?.isProfilePanelOpen();
AFC?.getProfileLoverRegions(); // 目前頁面可見條目的矩形與資料
```

座標為 BC 2000×1000 虛擬畫布。戀人上限 20 人，Profile 每頁 10 人。

## 維護原則

- 文件只描述**現況**：已完成的修補不留流水帳；進行中的驗證項目放 `verification.md`，完成即刪。
- 持久化規則只寫在 `Storage.md`，其他文件用連結引用，避免多處不一致。
- 版本補丁的相容機制寫在 `r132-compatibility.md`，不當成所有 BC 版本的相容保證。
- 不在文件中寫測試數量或部署狀態（會過期）；以 CI 為準。
- 刪除或改名文件前，先搜尋全專案（含 README、`afc-architecture.html`）的連結。
- 修改程式後：`npm run check`、`npm run build`、`npm run check:assets`。
