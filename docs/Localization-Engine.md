# Localization Engine（共用翻譯引擎）

AFC 使用一套**跨插件共用**的翻譯引擎（`src/i18n/engine.js`，即 `BC_i18n.js` 的同步副本）。第一個載入的插件建立引擎並掛在 `window.Liko` 底下（帶防重載旗標 `__Sys_i18n__`），之後所有插件沿用**同一個實例**——HSC / FCM / AFC 因此行為一致、不會各自建一份。

引擎提供兩個獨立但同源的 API：

| 全域 | 用途 |
|---|---|
| `window.Liko.__Sys_i18n__` | **介面字串**（只有自己看到的 UI，如設定頁、面板標籤） |
| `window.Liko.__Sys_L10N__` | **聊天訊息在地化**（送出英文底本 + 標記，接收端各看各語言） |

支援語言鍵：`EN` / `TW` / `CN` / `ZH`(繁簡通用) / `DE` / `FR` / `RU` / `UA`。查表 fallback：目前語言 →（CJK 再退另一中文 / `ZH`）→ `EN`。

字串採**位置式佔位符** `{0} {1} …`。

---

## `window.Liko.__Sys_L10N__` — 聊天訊息在地化

「送出的 Action 一律是英文底本（沒裝插件的人看到英文），裝了同引擎的接收端會依**自己**的語言即時重寫顯示（含自己發的）。」

### API

| 方法 | 說明 |
|---|---|
| `register(ns, table)` | 註冊命名空間 `ns` 的翻譯表（見下方格式） |
| `send(ns, key, ...args)` | 發一條在地化 Action（Type=Action，Content=`CUSTOM_SYSTEM_ACTION`） |
| `t(ns, key, ...args)` | 以**目前語言**取字串 |
| `tl(lang, ns, key, ...args)` | 以**指定語言**取字串 |
| `has(ns, key)` | 是否有此鍵 |
| `lang()` | 目前顯示語言（`'TW'`/`'EN'`/…） |
| `localize(data)` | 解析並本地化一筆 `ChatRoomMessage`；由插件的中央訊息 hook 呼叫 |
| `install(modApi)` | 舊呼叫介面，現為空操作；保留以免共用引擎的其他使用者發生錯誤 |
| `loadScript(url)` / `loadLangs(ns, urlMap, lang)` / `ensure(ns, spec, lang)` | 從外部檔載入字庫（見 [外部字庫](#外部字庫)） |

### 翻譯表格式（key → 語言）

```js
const MY_ACTIONS = {
  greet:   { EN: '{0} waves at {1}.', ZH: '{0} 向 {1} 揮手。', DE: '{0} winkt {1} zu.' },
  arrived: { EN: '{0} has arrived.',  ZH: '{0} 來了。' },
};
```

### 用法

```js
const L10N = window.Liko?.__Sys_L10N__;
L10N.register('myplugin', MY_ACTIONS);
L10N.localize(data);                     // 由插件唯一的 ChatRoomMessage hook 呼叫

// 發一條在地化 Action：別人看英文底本，裝引擎者看自己語言
L10N.send('myplugin', 'greet', Player.Name, targetName);

// 純取字串（本地顯示用）
const s = L10N.t('myplugin', 'arrived', Player.Name);
```

### 線路格式（interop 參考）

`send()` 送出的封包：

```js
{
  Type: 'Action',
  Content: 'CUSTOM_SYSTEM_ACTION',
  Dictionary: [
    { Tag: 'MISSING TEXT IN "Interface.csv": CUSTOM_SYSTEM_ACTION', Text: <英文底本> },
    { Tag: 'Liko_L10N', ns: <ns>, key: <key>, data: JSON.stringify([...args]) },
  ],
}
```

接收端的中央 hook 呼叫 `localize(data)`；它偵測 `Tag === 'Liko_L10N'`，用 `tl(lang, ns, key, ...JSON.parse(data))` 重寫那筆 `CUSTOM_SYSTEM_ACTION` 的 `Text`。沒裝引擎的客戶端不處理 → 看到英文底本。

### AFC / Heart Lock 已註冊的命名空間

| ns | 內容 |
|---|---|
| `afc` | 戀人事件（成為拓展戀人、升格訂婚/結婚） |
| `hl` | 心形鎖廣播/系統訊息 **與** 心形鎖 UI 字串 |

（其他插件請用**自己**的 ns，避免衝突。）

---

## `window.Liko.__Sys_i18n__` — 介面字串

只給自己看的 UI 字串（設定頁、面板等），不經聊天。

| 方法 | 說明 |
|---|---|
| `register(ns, strings)` | 註冊（格式同上：key → 語言） |
| `t(ns, key, vars, forceLang)` | 取字串。`vars` 可為位置陣列或 `{name:...}`；`forceLang` 讓有自訂語言選單的插件指定語言而不污染他人 |
| `has(ns, key)` | 是否有此鍵 |
| `detectLang()` | 目前遊戲語言 |
| `loadScript` / `loadLangs` / `ensure` | 外部字庫載入 |

```js
const I18N = window.Liko?.__Sys_i18n__;
I18N.register('myplugin', { title: { EN:'Settings', ZH:'設定' } });
const label = I18N.t('myplugin', 'title');           // 依遊戲語言
const deLabel = I18N.t('myplugin', 'title', null, 'DE'); // 指定德文
```

---

## 外部字庫

翻譯量大時可把字串放獨立檔、runtime 載入（避免塞在 bundle 內）：

```js
// 單一合併檔（檔內自行呼叫 register）
I18N.ensure('myplugin', 'https://.../myplugin-i18n.js');

// 或依語言分檔（.js/.json）
I18N.loadLangs('myplugin', {
  EN: 'https://.../en.json',
  TW: 'https://.../tw.json',
}, currentLang);
```

> `src/i18n/engine.js` 是 canonical `BC_i18n.js` 的部署副本；唯一來源為主 repo 的 `Plugins/expand/BC_i18n.js`，更新時必須以原檔完整覆蓋，不在 AFC 內單獨修改。
