# R132Beta3 相容性修補

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
