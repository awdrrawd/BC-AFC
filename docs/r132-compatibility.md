# R132Beta3 相容性修補

## 最新調整：Craft 僅補資料、戀人分頁與上限

使用者提供的 `BC R132 Craft Hotfix v0.2` 將 Craft 問題分成資料遷移、dialog 傳參與 ExpressionQueue 三部分。本專案只採用資料補齊；「dialog 看不到 Craft」不能據此認定物品的 Craft 已遺失。

- 可移除的相容模組集中在 `src/compat/r132-craft.js`，函式均以 `r132` 開頭。僅 R132（含 Beta）補齊具有完整 Craft 專屬欄位、但缺少 `Partial` 標記的舊資料，轉換舊 `Type`，補上 `Partial: false` 與必要預設欄位。既有完整 Craft、明確精簡 Craft 與真正只含精簡欄位的 Craft 不改動。
- 僅掛資料入口 `ServerBundledItemToAppearanceItem` 與 `InventoryCraft`，不加入 dialog Craft 傳參修補，也不加入 ExpressionQueue 補丁。登入掃描 `Appearance`／`AppearanceFull`；有補齊才同步。心鎖保存／復原 Craft 時共用資料補齊函式，保留原本保護道具的功能。
- 戀人面板每頁 10 人；在 BC 座標 `(1750, 180)` 顯示 `80 × 40` 的右向 SVG 三角，第二頁再按回第一頁，方向不變。外部插件取得的條目矩形只包含目前頁面。
- 統一新增上限為 `MAX_AFC_LOVERS = 20`。發送、接收、按下接受、收到接受回覆、關係復原及資料寫入皆檢查；等待回覆的發出申請預留名額，防止同時接受超額。失敗不授予鎖權限或發送成功訊息。更新已存在的關係不占新名額。
- 新遷移最多啟用 20 筆，完整舊來源保留作手動復原；既有已超額主檔不自動刪人，阻止新增並分頁顯示舊資料。
- 移除日期／時長的硬編碼「共、天、年、個月」，補齊七語的相關格式、頁碼及上限提示，以及前輪缺少的登入復原翻譯。檢查 AFC 與 HeartLock 七份語言表的鍵與佔位符一致。診斷指令中仍有既有中文說明，本輪未做整套指令文字重寫。

驗證：52 項測試、lint、build；另以實際 profile 模組在本機 Canvas 預覽，確認 1–10／11–20 顯示、固定右向三角點擊循環與英文日期不含中文單位。實際伺服器／其他插件整合仍需遊戲內驗收。尚未推送或部署。

## 2026-09-18：Craft 還原修補

依使用者提供的本機上游鏡像複查。GitGud commits 網頁本次無法讀取，未宣稱已核對遠端最新 HEAD。

- R132 #6561 將穿戴中的 Craft 改為精簡資料；#6653 補上 `InventoryWear` 對完整／精簡 Craft 的支援。本機鏡像已包含後者，因此不能把所有 Craft 遺失都歸因於目前上游 `InventoryWear`。AFC 舊路徑仍依賴各版本的穿戴行為，而且無法修復「同款物品、鎖完整、Craft 已消失」的狀態。
- AFC 重穿時不再將精簡 Craft 交給 `InventoryWear`；改用 BC 原生 `CraftingValidate(..., partial=true)` 驗證快照副本，再還原製作者、名稱、說明及 Effects。相容舊 `Property` 效果轉換，不重套製作時的顏色、鎖或選項。
- 原本把資產基礎難度當作額外難度傳入，且未使用已保存的 `snapshot.difficulty`；現在穿戴額外難度為 0，再還原保存值。
- 完整性檢查可補回同款物品缺失的 Craft，要求既有心鎖識別、掛鎖者及快照槽位／資產相符；不覆寫現有 Craft，也不影響沒有心鎖設定的一般物品。修復後刷新並同步。
- 重穿使用 `Refresh=false`，完成 Craft 與心鎖後再依 `updateUI` 刷新，避免先送出尚未完成還原的普通物品。

新增 `test/craft-restore.test.js`，使用本機 R132 原生 Craft 驗證函式與驗證表摘錄（`test/fixtures/r132-crafting.txt`，附來源 SHA256），涵蓋移除／換物後重穿、同款物品補回、重複檢查、既有 Craft、不符來源及舊 Craft 轉換。物品穿戴和伺服器更新使用測試替身。

限制：快照本來就沒有 Craft 時無法復原。若沒有心鎖的一般衣物也全部掉 Craft，尚需遊戲內重現與其他插件／同步來源排查。仍須驗收重新登入、換房及 BCX 共存。

驗證：30/30 自動測試通過，lint 通過；建置結果見本次交付。

## 2026-09-18 追加：登入視窗與完整道具保護

- 登入復原改用 AFC 自訂 `<dialog>`，不再呼叫 `window.confirm`。支援鍵盤焦點、Escape 取消、文字安全插入、換帳號／卸載時關閉，非同步回覆會檢查帳號及資料是否仍相符。
- 戀人備份取消原本只記在 WeakSet，重登即失效；現在以帳號與備份內容保存選擇至 `AFC_LoverRecovery`。備份識別不使用補上的目前時間，避免缺日期的舊備份每次變成新資料。取消不建立空戀人主檔，仍保留手動復原來源。
- 心鎖復原選擇存於私人設定 `recoveryDecisions`，同一把鎖的確認／取消不重問；登入先補回可確認的 R132 心鎖標記。等待資產載入不會使已同意的復原再次詢問。`heartLock.restoreStorage()` 現在回傳 `Promise<boolean>`。
- 快照統一保存道具資產、槽位、Craft、顏色、難度與完整 `Property`。移除、換成其他資產或同款道具重新穿戴而失去原鎖時，重建受保護道具的設定再套回目前心鎖。鎖仍完整時不回滾正常的款式／顏色調整。
- 舊快照只在目前物品與原鎖一致時補齊缺失的 `Property`，不覆蓋尚存的 Craft。已消失、也未保存的舊設定無法追溯。
- 完整性檢查也涵蓋整件物品消失；資產缺失時保留現有物品及原快照。原生 `InventoryLock` 無法從房內找到離線掛鎖者時，從已驗證設定補回 owner；物品與鎖完成後才同步。

驗證：40/40 自動測試、lint、正式建置及 diff whitespace 檢查通過。瀏覽器實測自訂視窗外觀、同意、Escape 取消與焦點返回；預覽頁為 `test/fixtures/confirmation-preview.html`（以 Vite 開發伺服器開啟）。更新 `dist/assets/app.js`，尚未推送／部署。遊戲伺服器往返與 BCX 共存仍需實機驗收。

日期：2026-09-16。分支：`fix/r132`。依本機 Bondage-College-Mirror-bondageclub R132Beta3 原始碼修正，尚未宣告正式 R132 或未安裝 AFC 的玩家端已完整相容。

## 已修改

### 心鎖屬性壓縮與還原

R132 的 `ItemPropertiesCompress` 會丟棄 AFC 的 `Name`、`HeartLockId`、`LockPickSeed`、`ExclusiveUnlock`。心鎖實際使用 `HighSecurityPadlock`，僅登記獨立 HeartLock 資產不能解決此問題。

`src/heartlock/r132-properties.js` 對壓縮／解壓縮加上限定於心鎖的適配：僅保留以上四個型別正確的欄位，不放寬一般物品或其他插件屬性的白名單。遵守 `allowLocks: false` 與 `omit`，不將心鎖資料帶入排除鎖的匯出。原生鎖本身仍交給 BC 處理。

針對已經遺失識別欄位的舊存檔，角色刷新、既有外觀對帳與 Hidden 心鎖資料到達後，可從既有設定補回標記；必須符合帳號、物品、掛鎖者與 lockId 檢查。沒有設定、物品已解鎖、資產／掛鎖者不符或已有不同 lockId 時不補回，不穿戴、不重新上鎖、不覆蓋不同物品。此程序只還原可確認的識別資料，不猜測已遺失的自訂值。

### 單項、批次及相依物品移除

舊 hook 只處理 `InventoryRemove(C, group)`，未涵蓋 R132 的槽位陣列、直接 `InventoryRemoveItems` 與 `Item[]` 回傳契約。

`src/heartlock/removal.js` 改在共同入口 `InventoryRemoveItems` 檢查，原生 `InventoryRemove` 仍負責轉換單一／多個槽位。混合批次保留可移除項目，阻擋時回傳空陣列；涵蓋 `RemoveItemOnRemove` 相依項目、型別條件及呼叫端覆寫。設定清理／通知只針對實際移除項目執行一次。計時到期與既有復原流程維持原來的放行語意。

原生 `ChatRoomSafewordRelease` 呼叫期間另有受限的放行旗標，`CharacterReleaseTotal` 不會復原心鎖；移除後仍清理設定，呼叫失敗也會解除旗標，避免新的共同入口攔截擋住原生釋放。

## 驗證

- `test/r132.test.js` 使用 `test/fixtures/r132-runtime.txt` 中的真實 R132Beta3 壓縮、解壓縮、移除函式；函式摘錄附來源與 SHA256，資產 lookup／角色依賴由測試替身提供。
- 驗證獨立發送／接收 VM、extended 初始化、普通鎖、排除鎖／欄位、既有設定復原條件、批次與直接移除、相依移除、重複通知及計時／復原放行。
- 執行 `npm test`、`npm run lint`、`npm run build`。

本輪結果：26/26 測試通過，lint 無錯誤／警告，正式建置通過；已更新追蹤中的 `dist/assets/app.js`。

## 尚需遊戲內驗收

1. 兩位均載入此分支的 R132 玩家：上鎖、面板、圖示、換房、重新登入、設定及計時到期。
2. 批次換裝、相依物件移除、授權解除、原生安全退出及與 BCX 屬性詛咒共存。
3. 已被早期 R132 壓縮過的帳號資料：只有來源可確認時補回，不把一般 HighSecurityPadlock 認成心鎖。
4. 未安裝 AFC／舊版 AFC 的對端可能再次丟棄自訂資料；不能用 VM 測試取代伺服器與混合版本驗收。

本分支沒有推送或部署正式版本。FCM／HSC 的盤點屬跨專案摘要，不放入 AEE 文件。


## 2026-09-19：冷卻、完整保存與移除清理

- 完整角色、單一角色、單件物品同步與定時完整性檢查共用滑動視窗：14 秒內第 4 次衝突暫停自動復原 120 秒。同批多個部位只算一次；正常部位不會清掉其他部位的紀錄，登出與換帳號會重設。既有解鎖權限仍有效；冷卻期間合法移除仍會清理資料。
- 解鎖 hook、解鎖面板與計時到期都在確認解除成功後才刪除設定。刪除包括 active snapshot、declinedRecovery、recoveryDecisions 與待復原狀態；只保留已移除 lockId，阻止延遲的舊外觀或 Apply 訊息再次認領。舊 lockId 的刪除通知不能刪掉新鎖。
- 修正外觀重讀與震動計時器在物品短暫消失時擅自刪除設定。移除輪詢不再觀察過期的 item 參照。
- `_fullSnapshot` 使用 `version: 2, format: "runtime"`，保存 asset/group/family、完整 Property、Craft、Color、Difficulty。必須在完成心鎖標記後擷取；還原同一 lockId/owner 時保留原生鑰匙名單及鎖選項。可確認的舊快照會從目前同一把鎖補齊鎖資料；已經遺失且未保存的歷史欄位無法憑空復原。
- 新版遠端 Apply 隨附完成上鎖的快照，避免 Hidden 與外觀事件順序不同而保存了舊物品。舊版 Apply 沒有快照時等待匹配的實體鎖，不從未上鎖的替代品建立備份。
- 已檢查本機 R132 `ServerPlayerExtensionSettingsSync`：直接傳送指定 ExtensionSettings 值，不呼叫 `ItemPropertiesCompress`。因此私人備份維持完整普通 JSON，不能改存會省略預設值與自訂欄位的 appearance bundle。房內設定廣播不再包含完整快照與復原歷史；R132 `omit` 支援 Set 等 Iterable。
- 測試更新本機 R132 壓縮／解壓縮函式摘錄與 SHA256，新增原生 ExtensionSettings 同步摘錄及生命週期回歸案例。VM 測試不代表已完成實際伺服器登入、斷線與雙客戶端驗收。
