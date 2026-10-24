# AFC 資料保存

- `ExtensionSettings.AFC_Data`：本人戀人與共享偏好的唯一主資料，含 `memberNumber` 帳號識別。
- `ExtensionSettings.AFC`：私人偏好設定。
- `ExtensionSettings.AFC_HeartLock`：心鎖完整設定、筆記與衣物快照，含帳號識別。
- `OnlineSharedSettings`：只發布供他人讀取的副本；心鎖只公開識別資料，不公開筆記與快照。公開副本不會反向覆蓋主資料。

## 初始化與讀寫規則

- `getSharedSettings()` 是**純讀取**：只回傳目前帳號的 `AFC_Data`，不寫入、不同步、不建立；不存在或不屬於目前帳號時回傳 `null`。
- 登入後 `initializeSharedSettings()` 是**唯一**初始化入口：`AFC_Data` 不存在就建立空主資料並同步，已存在原樣使用；屬於其他帳號或已損壞的資料**絕不覆寫**。
- 不再自動遷移舊來源（`OnlineSharedSettings.AFC`、`AFC_LoverBackup`、localStorage `AFC_DB::*`），也不詢問復原。舊版已保存的 `AFC_LoverBackup` / `AFC_LegacyPublic` 仍可由設定頁手動復原（唯讀來源）。
- 登入會清除前次的關係請求、授權與房間快取；未完成的線上查詢與鎖初始化會檢查帳號；角色面板只使用 BC 正在查看的角色。

## 關係資料的刪除與復原

- 清除關係**只**由明確解除（本人解除、收到對方解除通知）或確認出廠重置執行，不因離線或同步缺漏刪除。出廠重置清除活躍關係與舊線上戀人備份，不刪除瀏覽器資料。
- 備份復原只補回缺少的戀人，保留現有關係與日期；空備份不會清空清單。
- 戀人上限 `MAX_AFC_LOVERS = 20`：發送、接收、按下接受、收到接受回覆、關係復原與資料寫入皆檢查；等待回覆的申請會預留名額；更新既有關係不占新名額。既有已超額的主檔不自動刪人，只阻止新增並分頁顯示。
- `Liko.AFC.getLovers()` 回傳主資料的深複本。心鎖 `getStorage()` 可手動匯出完整資料；沒有自動本機備份。

## 心鎖復原規則

- 心鎖只有 `ExtensionSettings` 作為復原來源。補回缺失鎖須經穿戴者在 AFC 自訂確認視窗同意。
- 拒絕後，待復原設定移到私人 `declinedRecovery`，完整性檢查不再重新上鎖；實際仍穿戴的心鎖持續受保護。
- `recoveryDecisions` 依鎖身分保存選擇，同一把鎖不重複詢問；等待資產載入不會讓已同意的復原再詢問。
- `heartLock.restoreStorage(data)` 只接受含本人 `memberNumber` 的資料，同樣經確認流程，回傳 `Promise<boolean>`。

## 限制

線上保存依賴 BC 的同步機制，**無法保證**離線寫入，或同帳號多裝置同時修改時不互相覆蓋。既有污染不會被自動判定或刪除，須由本人核對。

## 心鎖資料樹

```text
ExtensionSettings.AFC_HeartLock
├── memberNumber / updatedAt       帳號與更新時間
├── padlocks[group]                已穿戴心鎖的完整設定
│   └── _fullSnapshot              version: 2、format: runtime 的完整物品快照
├── craftLocks                     version: 1 的私人製作品範本
│   └── slots[index]               配方識別 key 與白名單 settings
├── declinedRecovery[group]        拒絕復原的設定
├── recoveryDecisions[group]       同一把鎖的復原選擇
└── removedLocks[group]            已合法移除的 lockId，阻擋延遲舊資料
```

`padlocks` 快照保存資產、部位、角色資產族、完整 Property、Craft、Color 與 Difficulty。完成上鎖及最終顏色處理後才擷取；遠端套用同時傳送鎖設定與快照。私人 ExtensionSettings 保存完整 JSON，**不要**改存會省略欄位的 appearance bundle（原因見 [r132-compatibility.md](r132-compatibility.md#1-屬性壓縮)）。

合法解除成功後清除該部位的鎖設定、快照、拒絕復原資料、復原選擇與待復原狀態；保留已移除 lockId，避免延遲訊息把舊鎖復活。同步重建物品時的暫時移除不視為合法解鎖。

登入補回缺失鎖使用 AFC 自訂確認視窗。`recoveryDecisions` 依鎖身分保存選擇，同一把鎖不反覆詢問；手動 `restoreStorage` 是獨立確認流程。

## Craft 範本生命週期

原生 Craft 的 `Lock` 保存空字串；心鎖設定另存在 `craftLocks.slots[index]`：

```js
{
  key: CraftingSerialize({ ...craft, Lock: '' }),
  settings: { note, vibe, orgasmMode, durationMinutes, removeRestraints }
}
```

- 原生製作確認並保存時，依目前 Craft 清單重建槽位紀錄，再同步 `ExtensionSettings.AFC_HeartLock`。
- 刪除製作品或改成普通鎖，清除該筆範本；最後一筆刪除仍保留 `{ version: 1, slots: {} }`。
- 清理後同一格建立新製作品，即使原生內容完全相同，也不能繼承刪除前的鎖參數。其他槽位與身上 `padlocks` 保留。
- 排序時跟隨製作品物件移動；重新登入時以槽位及配方識別核對。相同配方可有不同設定，無法確定身分的複本不猜測設定。
- 編輯面板只修改本地草稿；取消不改已保存範本。計時保存相對分鐘數，使用成功時才換算到期時間。
- Craft 清單先通過原生可用性，再檢查目標的心鎖戀人／主人權限；實際使用再次驗證。

原生 Craft 匯出不包含私人範本。完整心鎖資料可透過 `heartLock.getStorage()` 匯出，手動恢復需符合帳號識別及確認流程。
