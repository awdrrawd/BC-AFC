# AFC 架構總覽

互動式索引：[AFC 架構導覽](./afc-architecture.html)。持久資料見 [Storage.md](Storage.md)；對外型別見 [Public-API.md](Public-API.md#資料型別)。

## 模組邊界

| 目錄 | 責任 |
|---|---|
| `core/` | 初始化（兩階段：載入期 / 登入後）、共用狀態、設定、儲存、Socket、聊天指令 |
| `hooks/` | BC 掛鉤、registry、生命週期；`hooks/heartlock/` 負責 Craft、移除保護、圖示與高潮事件 |
| `features/relationships/` | 戀人模型、申請、階段、分手、對帳、恢復 |
| `features/heartlock/` | 鎖、權限、快照、保存、冷卻、計時、震動、防脫逃；`crafting/` 放 Craft 範本 |
| `net/` | Hidden 訊息、可靠傳輸、AccountBeep、在線狀態、房名、LIKOSHARE 同步 |
| `ui/` | Profile、設定頁、申請介面；`ui/heartlock/` 放共用面板（`tabs/`）與 Craft 編輯入口 |
| `compat/` | R132 與 BCX 相容（見 [r132-compatibility.md](r132-compatibility.md)） |
| `i18n/` | 共用翻譯引擎、聊天翻譯封裝、離線 fallback |
| `util/` | 通用工具與提示 |

放置原則：新 hook → `hooks/`；畫面 → `ui/`；功能規則 → `features/`；訊息協議 → `net/`；版本補丁 → `compat/`。

## 目錄樹

```text
src/
├── main.js / app.js           載入器（重複載入守衛）與應用入口
├── core/  hooks/  features/  ui/  net/  compat/  i18n/  util/
Translation/{afc,hl}/          七語系字庫來源（保留公開 URL）
Images/                        圖片來源，build 時複製到 public/
scripts/                       copy-assets、check-assets、check-orphans、check-bc-compat
test/                          回歸測試（fixtures/ 保存 BC 原生函式摘錄與 SHA256）
docs/                          本文件
dist/                          發佈產物（CI 部署至 Pages）
```

## Craft 心鎖分工

| 檔案 | 責任 |
|---|---|
| `features/heartlock/crafting/recipes.js` | 配方識別、槽位綁定、查找與保存 |
| `features/heartlock/crafting/settings.js` | 白名單設定、相對計時換算 |
| `features/heartlock/crafting/draft-config.js` | 把共用面板的讀寫導向本地草稿 |
| `ui/heartlock/craft-editor.js` | 原生 90×90 檢查鎖按鈕與面板入口 |
| `hooks/heartlock/crafting.js` | 原生清單可見性、狀態圖示、序列化、穿戴事件 |
| `features/heartlock/permissions.js` | 清單可見性與實際上鎖共用的權限來源 |

清單先通過原生 `DialogCanUseCraftedItem`，再檢查目標是否允許目前使用者以戀人／主人身分施加心鎖；**實際使用時再驗證一次**，避免權限在顯示後變動。範本保存規則見 [Storage.md](Storage.md#craft-範本生命週期)。

## 執行流程

`src/main.js` 建立 `window.Liko.AFC` 命名空間與重複載入守衛 → 動態載入 `src/app.js` → `core/core-init.js` 分兩階段初始化（載入期 / 登入後）。登入會清除前次的關係請求、授權與房間快取。

執行期狀態集中管理，**不是第二份持久資料**：
- 關係流程：`core/state.js` 的 `relationRuntime`
- 心鎖：`features/heartlock/state.js`，分 `lifecycle` / `timers` / `vibe` / `operations` / `panel`

`ServerSocket` 每個 event 共用一個 dispatcher。Hook 與清理函式必須經 `hooks/registry.js` 註冊；心鎖使用獨立 scope 管理生命週期。

## 通訊通道

| 通道 | 用途 |
|---|---|
| ChatRoom `Hidden` `AFC::Beep` | 同房戀人操作（申請／接受／升格／恢復／解除），頂層 `Target` 1 對 1；身分只取伺服器 `Sender`。**可靠傳輸**：關鍵訊息重送到 ACK 為止，接收端冪等去重 |
| `OnlineSharedSettings.AFC` / `.AFC_HeartLock` | 戀人清單、鎖權限、鎖公開摘要（owner / assetName / lockId）；伺服器同步給房內，讀取端免查詢 |
| `AccountBeep`（`afcBeep`） | 跨房戀人房名分享（`IsSecret:false` 讓伺服器蓋上 `ChatRoomName`）；只送得到 BC 好友，戀人恆為好友 |
| ChatRoom `Hidden` `HeartLock::*` | 心鎖套用／設定／移除／請求，皆 1 對 1 |
| ChatRoom `Action` `CUSTOM_SYSTEM_ACTION` + `Liko_L10N` | 聊天在地化廣播（見 [Localization-Engine.md](Localization-Engine.md)） |

相容舊版：舊客戶端的鎖定授權握手（`SYNC_REQUEST/GRANT`、`LOCK_ACCESS_OFF`）與 `AFC::Sync` 已移除，收到會被靜默忽略；舊版不會回應新的 `HeartLockRequest`（細節欄位空白，摘要仍正常）。

## Hook 優先序（InformationSheet）

bcModSdk：**數字大者先跑、外層**；不呼叫 `next()` 即短路整條鏈。

| priority | 誰 | 行為 |
|---|---|---|
| 10 | BCX | 接管資料頁，子頁開啟時不 `next`，底下全跳過 |
| **7** | **AFC** | 繪製戀人面板與 Profile 模態（面板矩形內遮 hover、吃點擊） |
| **8（建議）** | overlay 插件（如 FCM） | 繪製在 AFC 之上，並在 AFC 模態之前處理點擊 |
| 5 | 一般繪製 | — |

契約細節與範例見 [Public-API.md](Public-API.md#profile-面板整合)。座標系為 BC 2000×1000 虛擬畫布。

## 建置與載入

- Vite 輸出 `dist/assets/main.js`（入口）與 `dist/assets/app.js`（本體），**必須一起發佈**。
- 圖片來源 `Images/AFC-*.png`，build 時複製到 `public/`，程式經 `https://awdrrawd.github.io/BC-AFC/…` 載入（保留瀏覽器快取，且避免把 Base64 寫進心鎖設定）。
- Loader：`loader.user.js` 讀 Pages 上的正式版；`loader.local.user.js` 讀 `http://localhost:5175/assets/main.js`。
- CI 與部署見 [GitHub-Automation.md](GitHub-Automation.md)。

## 相依

[bcModSdk](https://github.com/Jomshir98/bondage-club-mod-sdk) 由 loader `@require`；AFC **不**對外公開自己的 modApi，其他插件自行 `registerMod` 即可。

## 設計原則與注意事項

這些是歷次安全審查後固定下來的規則，修改相關程式碼時必須維持：

1. **發送者身分只信伺服器蓋章的 `Sender`**：路由鍵與身分不得讀 payload；可信欄位最後寫入（`net/hidden-beep.js`）。
2. **不把對方可控字串寫進 `innerHTML`**：一律 DOM + `textContent`，名稱先經 `peerName` 過濾。ESLint `no-restricted-syntax` 強制，例外僅限內容完全自行計算的日期選擇器。
3. **時間與階段一律驗證**：計時、階段、時間戳經 `features/heartlock/validate.js`／`sanitizeStage/Timestamp`；無法解析的時間保持上鎖，不得因 `NaN` 比較而解鎖。
4. **部位名稱驗證**：`isValidGroupName` 擋掉 `__proto__`、`constructor` 等原型鏈成員。
5. **訊息 1 對 1**：`AFC::Beep` 與 `HeartLock*` 皆帶頂層 `Target`；私密細節（note、計時、震動）只在開啟面板時以 `HeartLockRequest{Group}` 請求，穿戴者驗證請求者是掛鎖者或授權關係後，只回給請求者。
6. **公開資料只是副本**：`OnlineSharedSettings` 不反向覆蓋 `ExtensionSettings` 主資料；他人身上的鎖以 `OnlineSharedSettings.AFC_HeartLock` 的公開摘要（存在與否、lockId）為權威。
7. **Hook 一律走 registry**，可整批釋放；`ChatRoomMessage` 只有一個中央 hook 派送。
8. **新增文字同步七語系**與離線 fallback，不在 UI 硬編碼「共」「天」等單位；`npm run check:assets` 檢查鍵與佔位符一致。
9. **每次改動後**：`npm run check`、`npm run build`、`npm run check:assets`。BC 改版後跑 `check:bc`（只檢查函式存在，不檢查簽名，簽名變更須對照 BC CHANGELOG）。
