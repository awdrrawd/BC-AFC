# Architecture & Data

## 執行流程與責任

`src/main.js` 先建立命名空間與重複載入守衛，再動態載入 `src/app.js`。核心初始化負責登入、設定與 API；Hook registry 管理掛鉤與計時器，心鎖使用獨立 scope 管理生命週期。

完整目錄見[原始碼目錄](source-layout.md)，功能索引見[架構圖](afc-architecture.html)。新增功能規則放 `features/`、遊戲接點放 `hooks/`、畫面放 `ui/`、訊息放 `net/`、版本補丁放 `compat/`。

關係流程狀態集中於 `core/state.js` 的 `relationRuntime`；心鎖狀態集中於 `features/heartlock/state.js`，依 `lifecycle`、`timers`、`vibe`、`operations`、`panel` 分組。這些是執行期狀態，不是第二份持久資料。

`ChatRoomMessage` 由中央通道派送；`ServerSocket` 每個 event 使用同一個 dispatcher 管理訂閱者。Hook 與清理函式應透過 registry 註冊。

## 資料模型

`ExtensionSettings.AFC_Data` 保存本人戀人主資料，`ExtensionSettings.AFC` 保存私人偏好，`ExtensionSettings.AFC_HeartLock` 保存心鎖與 Craft 範本。`OnlineSharedSettings` 只發布副本，舊本機戀人備份僅作遷移讀取來源。

完整保存、恢復與刪除規則統一見[資料保存](Storage.md)；對外回傳型別見[公開 API](Public-API.md#資料型別)。

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
npm run build       # 打包到 dist/，並複製圖片與 Translation 字庫
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

執行入口以 `window.Liko.AFC` 作重複載入守衛。Vite 輸出 `dist/assets/main.js` 載入入口及 `dist/assets/app.js` 應用程式；兩個檔案必須一起發布。

---

## 相依與相容

- [bcModSdk](https://github.com/Jomshir98/bondage-club-mod-sdk) — loader 已 `@require`，其他插件自行 `registerMod` 即可（AFC **不**對外公開自己的 modApi；bcModSdk 本身即共用模組體系）。
- 座標系：BC **2000×1000** 虛擬畫布。
- 目前 R132 適配與驗收範圍見 [R132 相容性](r132-compatibility.md)。
