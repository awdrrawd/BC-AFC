# Public API — `window.Liko.AFC`

AFC 與 Heart Lock 合併於**同一個**物件 `window.Liko.AFC`（心形鎖 API 在其下的 `.heartLock` 子節點）。登入完成後才會填齊，請以 optional chaining 存取：

```js
const AFC = window.Liko?.AFC;
if (AFC?.isLover) { /* 已就緒 */ }
```

> **就緒時機**：`window.Liko.AFC` 在 loader 期就有 `{ version }`；戀人 API 於 `LoginResponse` 後才掛上。要在遊戲流程中呼叫（如 InformationSheet hook 內）通常已就緒。

---

## 目錄

- [戀人查詢](#戀人查詢)
- [Profile 面板整合（重點）](#profile-面板整合)
- [心形鎖 `window.Liko.AFC.heartLock`](#心形鎖-api)
- [資料型別](#資料型別)

---

## 戀人查詢

| 方法 | 回傳 | 說明 |
|---|---|---|
| `version` | `string` | AFC 版本，如 `"0.7.0"` |
| `isLover(memberNumber)` | `boolean` | 對方是否為**我**的拓展戀人 |
| `getLoverStage(memberNumber)` | `0 \| 1 \| 2 \| null` | 戀人階段（見 [Stage](#stage-階段)）；非戀人為 `null` |
| `getLovers()` | `Lover[]` | 我的戀人清單（**唯讀複本**，順序＝面板顯示順序） |
| `canUseHeartLock(character)` | `boolean` | 我是否有資格對 `character`（BC Character 物件）上心形鎖 |
| `canOwnerLock()` | `boolean` | 我是否允許「主人」對我使用心形鎖 |

```js
if (window.Liko?.AFC?.isLover(C.MemberNumber)) { /* … */ }
const stage = window.Liko?.AFC?.getLoverStage(C.MemberNumber); // 0/1/2/null
```

> 要查**別人**有沒有某位戀人，直接讀對方公開資料：`C.OnlineSharedSettings?.AFC?.lovers`（見 [資料型別](#資料型別)）。`isLover` / `getLovers` 只反映**自己**的清單。

---

## Profile 面板整合

在角色資料頁（InformationSheet）點「更多戀人」會展開拓展戀人面板。其他插件（如 FCM）可在**每個戀人條目上疊自己的按鈕**（例如快速搜尋）。

| 方法 | 回傳 | 說明 |
|---|---|---|
| `isProfilePanelOpen()` | `boolean` | 面板**是否展開中**（且在 InformationSheet）。用這個判定要不要畫 |
| `getProfileLoverRegions()` | `LoverRegion[]` | 各戀人條目的**螢幕矩形＋資料**；面板未展開回 `[]`。`.length` = 可見條目數 |
| `getProfilePanelRect()` | `{x,y,w,h}` | 面板容器矩形（模態範圍／繪製邊界） |

`LoverRegion`：
```ts
{
  memberNumber: number,   // 該戀人的會員編號
  name: string,
  stage: 0 | 1 | 2,
  col: 0 | 1,             // 左欄 / 右欄
  row: 0 | 1 | 2 | 3 | 4, // 欄內第幾列
  x: number, y: number,   // BC 2000×1000 座標，涵蓋「名稱＋日期」兩行
  w: number, h: number,
}
```

### ⚠️ 優先序契約（務必遵守）

AFC 的面板繪製與**模態**掛在 `InformationSheetRun` / `InformationSheetClick` 的 **priority 7**：面板展開時，落在面板矩形內、priority < 7 的元素都被「遮罩 hover ＋ 吃掉點擊」。

你的 overlay 要掛 **priority > 7（例如 8）**，才能：
- **繪製**在 AFC 面板**之上**，且此時滑鼠已還原 → hover 正常；
- **點擊**在 AFC 模態 consume **之前**處理 → 你的按鈕點得到，其餘照樣被擋。

（參考：BCX 用 priority 10 接管整個資料頁；AFC=7；建議 overlay 插件用 8。）

### 完整範例（FCM 式快速搜尋按鈕）

```js
const AFC = window.Liko?.AFC;

modApi.hookFunction('InformationSheetRun', 8, (args, next) => {
    const r = next(args);                       // 先讓 AFC(7) 畫完面板、填好 regions
    if (AFC?.isProfilePanelOpen?.()) {
        for (const e of AFC.getProfileLoverRegions()) {
            const bx = e.x + e.w - 40, by = e.y + (e.h - 36) / 2;
            DrawButton(bx, by, 36, 36, '', 'White', myIconSrc, 'Search');
        }
    }
    return r;
});

modApi.hookFunction('InformationSheetClick', 8, (args, next) => {
    if (AFC?.isProfilePanelOpen?.()) {
        for (const e of AFC.getProfileLoverRegions()) {
            const bx = e.x + e.w - 40, by = e.y + (e.h - 36) / 2;
            if (MouseIn(bx, by, 36, 36)) { openPeopleSearch(e.memberNumber); return; } // 消化
        }
    }
    return next(args);                          // 沒點到 → 交回，AFC 模態接手
});
```

> `getProfileLoverRegions()` 每幀由 AFC 面板繪製時更新。priority 8 的 overlay 在 AFC 之後（post-next）讀取，拿到的是**當幀**的 regions。

---

## 心形鎖 API

`window.Liko.AFC.heartLock`（原 `window.Liko.HeartLock`，已合併於此）：

| 方法 | 回傳 | 說明 |
|---|---|---|
| `version` | `string` | 心形鎖版本，如 `"2.6.0"` |
| `getStorage()` | `object` | 玩家心形鎖完整儲存的**複本** |
| `getPadlocks()` | `object` | `padlocks` map 的複本：`{ [groupName]: PadlockConfig }` |
| `removeLock(groupName, { removeRestraint? })` | `boolean` | 解除自己身上指定部位的心形鎖（防作弊 integrity 不會還原） |
| `clearAllLocks({ removeRestraints? })` | `number` | 清除自己**所有**心形鎖，回傳清除數量 |
| `restoreStorage(data)` | `boolean` | 以外部資料還原心形鎖儲存（進階／備份用） |

```js
window.Liko?.AFC?.heartLock?.clearAllLocks();          // 清掉自己所有心鎖
window.Liko?.AFC?.heartLock?.removeLock('ItemNeck');   // 解特定部位
```

`PadlockConfig`（每個上鎖部位）：
```ts
{
  owner: number, ownerName: string,
  lockedAt: string,           // ISO 時間
  note: string,               // 愛情筆記（最多 500 字，支援圖片 URL 內嵌）
  unlockTime: string | null,  // 計時器到期（ISO），null=無
  vibe: 'off'|'low'|'mid'|'high',
  orgasmMode: 'normal'|'edge'|'deny',
  removeRestraints?: boolean,  // 計時器到期時是否移除拘束
  assetName?: string, lockId?: string,
}
```

---

## 資料型別

### Stage 階段

| 值 | 含義 |
|---|---|
| `0` | 交往 / dating |
| `1` | 訂婚 / engaged |
| `2` | 結婚 / married |

### Lover

```ts
{
  memberNumber: number,
  name: string,
  stage: 0 | 1 | 2,
  startDate: number,          // 關係起始（ms epoch，不變）
  stageDate: number,          // 當前階段起始（ms epoch，升格時更新）
  lastSeen?: number | null,   // 最後見面（ms epoch）
}
```

### 對方的公開資料 `Character.OnlineSharedSettings.AFC`

任何房內角色都可讀（伺服器提供的公開資料）：

```ts
{
  lovers: Lover[],
  lockPerms: { enableAFCLock: boolean, enableOwnerLock: boolean },
  vibeMsgMode: 'off' | 'broadcast' | 'local',
  enableVibeSound: boolean,
}
```

判斷「對方是否把某人列為戀人」：
```js
const isLoverOfC = (C, memberNumber) =>
  (C.OnlineSharedSettings?.AFC?.lovers ?? [])
    .some(l => Number(l.memberNumber) === Number(memberNumber));
```
