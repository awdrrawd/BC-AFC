# 原始碼目錄與維護分工

```text
src/
├── main.js / app.js           載入器與應用入口
├── core/                     初始化、共用設定、Socket、指令
├── hooks/                    遊戲 hook、registry 與生命週期
│   └── heartlock/            Craft、移除保護、圖示與高潮事件
├── features/
│   ├── heartlock/            鎖、權限、快照、保存、冷卻、計時
│   │   └── crafting/         settings、recipes、draft-config
│   └── relationships/        戀人模型、申請、階段、對帳、還原
├── ui/
│   ├── heartlock/            面板、Craft 編輯入口、日期、DOM 工具
│   │   └── tabs/             概覽、筆記、計時、控制、解鎖
│   └── relationships/        資料頁與申請介面
├── net/                      房間訊息與同步，包含 heartlock.js
├── compat/                   R132 Craft／心鎖屬性、BCX 相容
├── i18n/                     共用翻譯引擎、聊天翻譯、離線後備
└── util/                     通用工具與提示

Translation/{afc,hl}/         七語系來源，保留公開 URL
Images/                      圖片來源
scripts/                     資源複製與檢查
test/                        回歸測試（fixtures/ 保存原生函式摘錄）
docs/                        架構與相容性紀錄
public/                      建置前複製資源
dist/                        發布產物
```

## Craft 心鎖

- `features/heartlock/crafting/recipes.js` 統一配方識別、槽位綁定、查找及保存。
- `features/heartlock/crafting/settings.js` 限制可保存參數，換算相對計時。
- `features/heartlock/crafting/draft-config.js` 將共用面板讀寫導向本地草稿。
- `ui/heartlock/craft-editor.js` 維護原生 90×90 檢查按鈕及共用面板入口。
- `hooks/heartlock/crafting.js` 連接原生清單可見性、狀態圖示、序列化與穿戴事件。
- `features/heartlock/permissions.js` 是清單可見性與實際上鎖的共用權限來源。

清單先通過原生 `DialogCanUseCraftedItem`，再檢查目標角色是否允許目前使用者以戀人／主人關係施加心鎖。實際使用時再次驗證，避免顯示清單後權限變動。

## 保存與部署

目錄重組保留 `ExtensionSettings.AFC_HeartLock` 中 padlocks、craftLocks、快照與移除紀錄的格式，不需要資料搬遷。私人範本不當成已穿戴的鎖；普通製作品不套用心鎖權限。

新增 hook 放 hooks，UI 放 ui，功能規則放 features，訊息協議放 net，版本補丁放 compat。共用翻譯仍集中於 i18n；翻譯 JSON 與發布資源保留既有位置。

驗證：`npm test`、`npm run lint`、`npm run build`、`npm run check:assets`。

Craft 刪除、槽位重用與空 `craftLocks` 容器的保存規則見[資料保存](Storage.md#craft-範本生命週期)。
