# Architecture & Data

## 專案結構

原始碼模組化於 `src/`，由 **vite** 打包成單一 ES-module bundle `dist/assets/main.js`，推送到 `main` 後 GitHub Actions 自動部署到 Pages。薄 loader 以動態 `import()` 載入 bundle。

```
src/
├─ main.js                進入點：建立 window.Liko.AFC，呼叫 initialize()
├─ core/
│  ├─ config.js           常數：版本、Beep 通道、階段、顏色、Profile 座標、圖片 URL
│  ├─ state.js            關係流程的統一 runtime data tree
│  ├─ socket.js           每個 ServerSocket event 的唯一 dispatcher
│  ├─ settings.js         OnlineSharedSettings.AFC（共享）+ ExtensionSettings.AFC（私人）
│  ├─ lover-backup.js     戀人資料本機備份 repository（不依賴共享設定）
│  ├─ storage.js          localStorage「DB」保險箱 + factoryReset
│  ├─ commands.js         /afc-* 聊天指令
│  └─ core-init.js        初始化（載入期/登入後兩階段）+ 對外 API + 啟動 Heart Lock
├─ hooks/                 所有 bcModSdk hook 的唯一存放處
│  ├─ registry.js         hook / interval / timeout 的註冊與卸載生命週期
│  ├─ index.js            AFC hook 與共用通道 dispatcher
│  ├─ chat-message-channel.js  ChatRoomMessage 內部訂閱派送
│  ├─ relationship-visual.js  戀人圖示、好友列表與對話 UI
│  ├─ heartlock.js        HeartLock 遊戲函式 hook
│  ├─ orgasm.js           HeartLock 高潮控制 hook
│  └─ lifecycle.js        登入階段的一次性 hook
├─ i18n/
│  ├─ engine.js           canonical BC_i18n.js 的部署副本（→ window.Liko.__Sys_i18n__/__Sys_L10N__）
│  ├─ i18n.js             AFC 本地 UI 翻譯（薄封裝）
│  ├─ l10n.js             聊天在地化（薄封裝共用引擎）
│  └─ strings/            文本資料（非引擎）：afc-ui / afc-actions / heartlock-ui / heartlock-actions
├─ util/                  util（通用）、toast
├─ net/                   beep（可靠傳輸）、beep-router、roomname、online、sync-data
├─ relations/             戀人 model/service、共用 request manager、提案/升格/恢復流程
├─ ui/                    proposal-ui、profile（面板/燈號/regions）、settings-page（偏好設定頁）
└─ heartlock/             心形鎖（原獨立插件，現為 bundle 內模組）：
                          config/state/util/datepicker/storage/permissions/lock/
                          events/net/vibe/timer/note/panel/init；tabs/ 每頁一個模組
```

**引擎 vs 文本分離**：`i18n/engine.js`、`l10n.js`、`i18n.js` 是工具；所有翻譯字串在 `i18n/strings/`。HeartLock 透過中央 `i18n.js` 的 `hl` namespace 取字串，不另設一套 I18N。維護翻譯只改 `strings/`。

**Hook 與通道**：所有 bcModSdk hook 實作集中於 `src/hooks/`，並共用同一個 registry。相同遊戲函式只有一個 AFC hook，再由內部呼叫各功能處理器；目前已合併 `ChatRoomMessage`、`ChatRoomSync`、`InformationSheetExit`、`FriendListLoadFriendList` 與 `ElementButton.Create`。L10N 不再自行安裝 `ChatRoomMessage` hook，而由中央入口呼叫。`ServerSocket` 也以每個 event 一個 dispatcher 管理所有訂閱者。

**Runtime data tree**：關係請求、冷卻、ACK、房間狀態集中於 `core/state.js` 的 `relationRuntime`；HeartLock 則依 `lifecycle`、`timers`、`vibe`、`operations`、`panel` 分組。具名 export 僅是指向同一份資料的引用，供既有模組逐步採用，沒有建立第二份狀態。

---

## 資料模型 / 持久化

AFC 的資料刻意分散在多處以抗伺服器端清空：

| 位置 | 內容 | 說明 |
|---|---|---|
| `Player.OnlineSharedSettings.AFC` | `lovers` / `lockPerms` / `vibeMsgMode` / `enableVibeSound` | **公開**共享資料（房內其他玩家/插件讀得到）。戀人清單的「活本」 |
| `Player.ExtensionSettings.AFC` | 私人設定（緊湊格式 `{v, cfg[]}`） | 只有自己，顯示模式/開關等 |
| `localStorage["AFC_DB::<帳號>"]` | 戀人清單備份 | 保險箱：偵測丟失/提供還原來源，抗 ExtensionSettings 被清空 |
| `Player.ExtensionSettings.AFC_HeartLock` | 心形鎖 `padlocks` map | 心形鎖上鎖狀態 |
| `localStorage["HL_DB::<帳號>"]` | 心形鎖備份 + 時間戳 | 對帳：伺服器被初始化時從 DB 還原 |

型別細節見 **[Public API → 資料型別](Public-API.md#資料型別)**。

---

## 網路 / 通訊

| 通道 | 用途 |
|---|---|
| ChatRoom `Hidden` `AFC::Beep` | 同房間戀人操作（申請/接受/升格/恢復/解除/同步授權）。**可靠傳輸層**：關鍵訊息重送到 ACK 為止 + 接收端冪等去重 |
| ChatRoom `Hidden` `AFC::Sync` | 廣播自己的戀人資料給房內玩家（EBC 等伺服器同步失效時的容錯） |
| `AccountBeep`（BeepType `afcBeep`） | 跨房**戀人房名分享**（仿 BCTweaks；IsSecret:false 讓伺服器蓋上 ChatRoomName） |
| ChatRoom `Hidden` `HeartLock::*` | 心形鎖套用/設定/移除/遠端解鎖 |
| ChatRoom `Action` `CUSTOM_SYSTEM_ACTION` + `Liko_L10N` 標記 | 在地化廣播（見 [Localization Engine](Localization-Engine.md)） |

---

## Hook 優先序參考

`InformationSheet` 這類多插件會搶著畫的畫面，優先序決定繪製/點擊順序（bcModSdk：**數字大者先跑、外層**；不呼叫 `next()` 即短路整條鏈）。

| priority | 誰 | 行為 |
|---|---|---|
| 10 | BCX（接管資料頁） | 子頁開啟時 `return`（不 next）→ 短路，底下都被跳過 |
| **7** | **AFC** | 繪製戀人面板 + Profile 模態（面板矩形內遮 hover / 吃點擊） |
| **> 7（建議 8）** | overlay 插件（如 FCM 疊在戀人條目上的按鈕） | 在 AFC 之上繪製、在 AFC 模態之前處理點擊 |
| 5 | FCM 主按鈕等 | 一般繪製 |

詳見 **[Public API → 優先序契約](Public-API.md#profile-面板整合)**。

---

## 聊天指令

| 指令 | 說明 |
|---|---|
| `/afc-propose [MemberNumber]` | 向同房玩家提出拓展戀人申請 |
| `/afc-status` | 顯示插件狀態與戀人列表 |
| `/afc-breakup [MemberNumber]` | 解除指定拓展戀人關係 |
| `/afc-lastseen` | 顯示所有戀人的最後見面時間 |
| `/afc-debug-hidden` | 診斷：印出下一條 Hidden 訊息的欄位結構 |

---

## 建置與部署

```bash
npm install
npm run build       # 打包到 dist/（prebuild 會由 copy-assets 把 Images/ → public/）
npm run lint        # eslint
npm run dev         # vite build --watch + preview :5175（配 loader.local.user.js 本地開發）
```

- **CI**：push `main` → `.github/workflows/deploy.yml` → build + 部署 GitHub Pages。
- **Bundle**：`https://awdrrawd.github.io/BC-AFC/assets/main.js`
- **圖片**：來源保存在 `Images/AFC-*.png`，build 複製至 `public/`，程式透過 `https://awdrrawd.github.io/BC-AFC/…` 載入。維持獨立檔案可使用瀏覽器快取，也避免把 Base64 圖片寫入 HeartLock 設定。

### Loader

| 檔 | 載入來源 | 用途 |
|---|---|---|
| `loader.user.js` | `awdrrawd.github.io/BC-AFC/assets/main.js` | 正式：Tampermonkey/FUSAM/PCM |
| `loader.local.user.js` | `http://localhost:5175/assets/main.js` | 本地開發（配 `npm run dev`） |

兩者都以 `window.Liko.AFC` 作重複載入守衛（先設 `'loading'`），並 `@require` bcModSdk。

---

## 相依與相容

- [bcModSdk](https://github.com/Jomshir98/bondage-club-mod-sdk) — loader 已 `@require`，其他插件自行 `registerMod` 即可（AFC **不**對外公開自己的 modApi；bcModSdk 本身即共用模組體系）。
- 座標系：BC **2000×1000** 虛擬畫布。
- BC R100+（DOM 面板 / ElementButton）。
