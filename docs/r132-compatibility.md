# BC R132 / R134 / BCX 相容處理

依 R132Beta3 原始碼調整，分支 `fix/r132`；R134 的屬性驗證見第 9 節（分支 `fix/r134`，依 R134 鏡像原始碼，changelog 記錄到 #6974 / `5169f4a`）。這份文件描述**目前的相容機制與限制**；各項是否已在實際伺服器通過，見 [verification.md](verification.md)。BC 改版後函式是否仍存在由每週的 `bc-compat` 工作流程檢查（見 [GitHub-Automation.md](GitHub-Automation.md)）。

## 相容模組

| 檔案 | 目的 | 可否移除 |
|---|---|---|
| `compat/r132-heartlock.js` | 心鎖屬性在 R132 壓縮／解壓縮時不遺失 | 僅在 BC 不再壓縮屬性時 |
| `compat/r134-heartlock.js` | R134 的 `ItemPropertiesValidate` 不刪心鎖標記（第 9 節） | `PropertyData` 登記 `Name`／`HeartLockId`／`ExclusiveUnlock` 後（`npm run check:bc` 會回報） |
| `compat/heartlock-markers.js` | R132／R134 共用：AFC 標記欄位清單與型別檢查 | 否 |
| `compat/r132-craft.js` | 補齊舊 Craft 資料的 `Partial` 標記 | 是（函式皆以 `r132` 開頭，集中於此檔） |
| `compat/bcx-heartlock.js` | 與 BCX 詛咒共存 | 否 |
| `hooks/heartlock/removal.js` | R132 移除入口的心鎖保護 | 否 |

## 主要技術處理

### 1. 屬性壓縮
R132 的 `ItemPropertiesCompress` 會丟棄 `Name`、`HeartLockId`、`LockPickSeed`、`ExclusiveUnlock`；心鎖實際使用 `HighSecurityPadlock`，只登記獨立資產無法解決。

- `r132-heartlock.js` 僅保留這四個欄位（型別正確才保留），**不放寬**一般物品或其他插件屬性的白名單，並遵守 `allowLocks:false` 與 `omit`。
- 已遺失識別欄位的舊存檔：於角色刷新、外觀對帳、Hidden 資料到達後補回標記，條件為帳號、物品、掛鎖者、lockId 全部相符。沒有設定、已解鎖、資產／掛鎖者不符、已有不同 lockId 時**不補回、不重新上鎖、不覆蓋**；不猜測已遺失的自訂值。
- 私人備份維持完整 JSON：R132 `ServerPlayerExtensionSettingsSync` 直接傳送 ExtensionSettings，不經壓縮；**不要**改存會省略預設值的 appearance bundle。房內設定廣播不含完整快照與復原歷史。

### 2. 物品移除
R132 的移除契約是槽位陣列、`InventoryRemoveItems` 與 `Item[]` 回傳。

- 保護改在共同入口 `InventoryRemoveItems`；原生 `InventoryRemove` 負責轉換單一／多個槽位。
- 混合批次保留可移除項目，被阻擋時回傳空陣列；涵蓋 `RemoveItemOnRemove` 相依項目、型別條件與呼叫端覆寫。設定清理與通知只對實際移除項目執行一次。
- 計時到期與復原流程維持放行。`ChatRoomSafewordRelease` 呼叫期間有受限放行旗標（失敗也會解除），`CharacterReleaseTotal` 不會復原心鎖；移除後仍清理設定。

### 3. Craft 還原
R132 將穿戴中的 Craft 改為精簡資料（#6561），#6653 補上 `InventoryWear` 的完整／精簡支援。

- 重穿時**不**把精簡 Craft 交給 `InventoryWear`；改用原生 `CraftingValidate(..., partial=true)` 驗證快照副本，再還原製作者、名稱、說明與 Effects（不重套製作時的顏色、鎖或選項）。
- 穿戴額外難度傳 0，再還原 `snapshot.difficulty`。
- 完整性檢查可補回「同款物品缺失的 Craft」，要求既有心鎖識別、掛鎖者、快照槽位／資產相符；不覆寫現有 Craft、不影響無心鎖物品。
- 重穿使用 `Refresh=false`，Craft 與心鎖完成後才依 `updateUI` 刷新，避免先送出未完成的普通物品。
- `r132-craft.js` 只補資料（掛 `ServerBundledItemToAppearanceItem`、`InventoryCraft`），**不**做 dialog 傳參或 ExpressionQueue 修補；「dialog 看不到 Craft」不能據此判定 Craft 已遺失。

### 4. 完整快照
`_fullSnapshot`（`version: 2, format: "runtime"`）保存 asset / group / family、完整 Property、Craft、Color、Difficulty。**必須在心鎖標記與最終顏色處理完成後擷取**。遠端 Apply 隨附完成上鎖的快照；舊版 Apply 沒有快照時，等待匹配的實體鎖，不從未上鎖的替代品建立備份。還原同一 lockId／owner 時保留原生鑰匙名單與鎖選項。

### 5. 衝突冷卻與合法移除
完整角色、單一角色、單件物品同步與定時完整性檢查共用滑動視窗：**14 秒內第 4 次衝突，暫停自動復原 120 秒**（`GRAB_WINDOW_MS` / `GRAB_COOLDOWN_MS`）。同批多個部位只算一次；登出與換帳號重設；冷卻期間合法移除仍會清理資料。

解除成功才刪設定（含快照、拒絕復原、復原選擇、待復原狀態），並保留已移除 lockId 阻擋延遲的舊訊息。**同步重建物品時的暫時移除不是合法解鎖**；外觀重讀與震動計時器不得因物品短暫消失而刪設定。

### 6. 原生替換與重複部位
原生 `CharacterAppearanceSetItem` 會先移除再 append 新物品。若 AFC 阻擋移除步驟，同一 group 會出現重複物品，導致 `DirectedGraph` 報 `componentGraph.adjacencyList[v] is not iterable`。

- 伺服器同步讓 BC 完成原生替換，再由 AFC 對帳；本地未授權替換在進入原生替換**之前**拒絕，不做半套替換。
- 清理既有重複部位僅限保存的 AFC asset／owner／lockId 能明確識別保留項目時；不碰其他插件物品，不修改或略過 Graph 循環檢查。

### 7. Craft 心鎖範本
原生 Craft 的 `Lock` 存空字串，心鎖設定另存 `ExtensionSettings.AFC_HeartLock.craftLocks`，因此未安裝插件、未購買 `HighSecurityPadlock` 時白名單不會清掉自訂鎖。普通 Craft 匯出不含這份設定，匯入到另一帳號需重新設定。保存與清理規則見 [Storage.md](Storage.md#craft-範本生命週期)；成功套用 Craft 後才建立實體心鎖，已有鎖不覆蓋，預覽與 `PreConfigureItem=false` 不產生真鎖。

### 8. BCX 共存
上鎖或還原後重新蓋章 BCX 的 curse 基準，避免心鎖額外 Property（`Name` / `HeartLockId` / `ExclusiveUnlock`）被 BCX `curseTick` 判為改動而反覆還原洗版。無 BCX 時所有呼叫為 no-op。

### 9. R134 屬性驗證（`ItemPropertiesValidate`）
R133 的 `ItemPropertiesValidate` 沒有任何呼叫者；R134 把它接進 `ExtendedItemInit`、`ValidationSanitizeProperties`（每次收到外觀資料）與 `ItemPropertiesDecompress` 的 `initExtendedItem:false` 分支，並且**每一處都用回傳值覆寫 `Item.Property`**。驗證只複製 `PropertyData` 有條目的欄位，沒條目的直接略過（原始碼有 `TODO: Consider bumping this to a (critical) error once PropertyData is complete`）。

AFC 寫在 `HighSecurityPadlock` 上的欄位中，`Name`、`HeartLockId`、`ExclusiveUnlock` 沒有條目（`LockPickSeed`、`LockMemberNumber` 等有）。沒有處理時，標記會在開啟物品、穿上、收到外觀時消失，造成：完整性檢查把心鎖判成損壞並（來源為掛鎖者時）刪設定、`restoreLockFromConfig` 剛寫入標記就被緊接的 `ValidationSanitizeProperties` 清掉、`Property.Name` 判斷失效使震動與高潮控制停擺、登入時反覆跳出復原確認。

- `r134-heartlock.js` 掛 `ItemPropertiesValidate`（優先序 5）：驗證完成後，**僅當**結果的 `LockedBy` 是 `HighSecurityPadlock` 且來源帶有型別正確的 AFC 標記時，才補回缺少的欄位；BC 已驗證的欄位（如 `LockPickSeed`）維持 BC 的值，`omit` 選項照常遵守，一般物品與其他插件的欄位仍被過濾。
- 不改欄位存放位置：標記必須隨外觀同步給對端，且 `restoreHeartLockMarkers`、BCX 基準蓋章（第 8 節）都依賴它。
- `npm run check:bc <BC 原始碼目錄>` 會列出 AFC 欄位是否已被 `PropertyData` 登記；全部登記後可移除這個 hook。

其餘 R133→R134 項目逐項核對、**AFC 不受影響**：`ItemPropertiesUnion`／`Difference`、`PropertyUnion`／`Difference`、`Property.Type` 遷移（`r132-craft.js` 自己用 `ExtendedItemTypeToRecord`，該函式仍在）、`ModularItem*`、`AssetParseDefaultColor`、`DrawingLeft/Top`、DynamicDraw callback，AFC 皆未使用；所有 hook 目標都存在；`MouseX/MouseY` 全域仍在，`MouseIn` 讀的就是它，`hooks/index.js` 的遮罩手法不受 #6883 影響。`ItemPropertiesCompress` 的 `allowLocks` / `omit` 選項在 R134 同名。

## 已知限制

- 快照本來就沒有 Craft 時無法復原；已遺失且未保存的歷史欄位無法追溯。
- 「無心鎖的一般衣物也全部掉 Craft」尚無法歸因，需遊戲內重現並排除其他插件／同步來源。
- 對端未安裝 AFC 或為舊版時，自訂資料可能再次被丟棄；VM 測試無法取代混合版本驗收。
- R134 的壓縮格式（逐圖層數值改為字串）與 `ItemPropertiesCompress` 本體在 R134 的行為只靠讀碼與選項名稱核對，尚無像 R132 那樣的原生函式測試。
- 本文件不代表所有 BC 版本的相容保證。

## 測試

`test/r132.test.js`、`craft-lock.test.js`、`craft-restore.test.js`、`craft-key-upgrade.test.js`、`r132-craft-data.test.js` 使用 `test/fixtures/` 內的 R132 原生函式摘錄（附來源 SHA256）；物品穿戴與伺服器更新為測試替身。更新 BC 版本時須同步更新摘錄與 SHA256。`r134-heartlock.test.js` 直接執行 R134 的 `ItemPropertiesValidate` 原文（`fixtures/r134-validate.txt`，附 SHA256），`PropertyData` 為只含必要條目的替身。
