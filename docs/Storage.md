# AFC 資料保存

- `ExtensionSettings.AFC_Data`：本人戀人與共享偏好的唯一主資料，含 `memberNumber` 帳號識別。
- `ExtensionSettings.AFC`：私人偏好設定。
- `ExtensionSettings.AFC_HeartLock`：心鎖完整設定、筆記與衣物快照，含帳號識別。
- `OnlineSharedSettings`：只發布供他人讀取的副本；心鎖只公開識別資料，不公開筆記與快照。公開副本不會反向覆蓋主資料。

首次搬移優先直接採用 `OnlineSharedSettings.AFC` 的非空戀人清單，不詢問、不以備份取代。線上清單為空時，才考慮帳號相符的舊 `AFC_LoverBackup` 及 localStorage `AFC_DB::帳號`／`AFC_DB::會員編號`。備份恢復需確認；取消不建立空的主資料；選擇依帳號及備份內容記錄於 `AFC_LoverRecovery`，同一份備份不會每次登入重問。已有合法 `AFC_Data` 仍為主資料，不會因正常解除所有戀人而復活舊備份。

舊本機來源僅讀取，不寫入或刪除；不讀取匿名 key 或其他帳號資料。舊 IndexedDB 是心鎖資料庫，不是戀人資料來源。帳號標記不符的資料拒絕使用。搬移前的公開來源保存於 `AFC_LegacyPublic`；先前誤按取消的使用者可從設定頁「舊版線上備份」手動恢復該保留來源，不自動覆蓋後續操作。

登入會清除前次的關係請求、授權與房間快取；未完成的線上查詢與鎖初始化會檢查帳號。角色面板只使用 BC 正在查看的角色。

心鎖只有 ExtensionSettings 作為恢復來源。補回缺失鎖仍須穿戴者確認；拒絕後把待恢復設定移出活躍鎖清單，保留於私人 `declinedRecovery`，防止完整性檢查重新上鎖。實際仍穿戴的心鎖持續受保護。`heartLock.restoreStorage` 只接受包含本人 `memberNumber` 的資料，並同樣經過恢復確認。

`Liko.AFC.getLovers()` 介面維持不變，回傳主資料的複本。心鎖 `getStorage()` 可手動取得完整匯出資料；本次沒有新增自動本機備份。語言引擎仍可讀取 BC 自己的語言偏好，與帳號關係資料無關。出廠重置會清除活躍關係及舊線上戀人備份，不刪除瀏覽器資料。

線上保存仍透過 BC 的同步機制，不能保證離線寫入或同帳號多裝置同時修改時不互相覆蓋。既有污染不會被自動判定或刪除，須由本人核對。

清除關係只由明確解除操作（本人解除、收到對方解除通知）或確認出廠重置執行，不因離線或同步缺漏刪除。備份恢復僅補回缺少的戀人，保留現有關係與日期；空備份不會清空清單。


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

`padlocks` 快照保存資產、部位、角色資產族、完整 Property、Craft、Color 與 Difficulty。完成上鎖及最終顏色處理後才擷取；遠端套用同時傳送鎖設定與快照。R132 的物品壓縮適配限於外觀傳輸，私人 ExtensionSettings 仍保存完整 JSON，不改存會省略欄位的 appearance bundle。

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
