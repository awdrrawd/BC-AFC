# BC-AFC Documentation

**Abundantia Florum ─Chromatica─ (AFC)** — 拓展戀人系統，內含 **Heart Lock（心形鎖）**，兩者打包為單一 bundle。

> 這些頁面是給**其他插件作者**與**維護者**看的技術文件。一般使用者請看 [README](https://github.com/awdrrawd/BC-AFC)。

## 頁面

- **[Public API](Public-API.md)** — `window.Liko.AFC`：戀人查詢、Profile 面板整合（在戀人條目上疊按鈕）、心形鎖 API。
- **[Localization Engine](Localization-Engine.md)** — 跨插件共用的翻譯引擎 `window.Liko.__Sys_i18n__` / `__Sys_L10N__`：介面字串 + 聊天訊息在地化（送英文底本、接收端各看各語言）。
- **[Architecture & Data](Architecture-and-Data.md)** — 模組結構、資料模型（OnlineSharedSettings / ExtensionSettings / localStorage）、建置與部署、Loader、聊天指令。

## 一分鐘速覽

```js
const AFC = window.Liko?.AFC;              // 對外唯一入口（含 .heartLock 子節點）
AFC?.version;                              // "0.7.0"
AFC?.isLover(123456);                      // 對方是否為我的拓展戀人
AFC?.getLovers();                          // 我的戀人清單（唯讀複本）
AFC?.isProfilePanelOpen();                 // 「更多戀人」面板是否展開中
AFC?.getProfileLoverRegions();             // 面板中各戀人條目的螢幕矩形＋資料

const L10N = window.Liko?.__Sys_L10N__;    // 共用聊天在地化引擎
L10N?.register('myplugin', { hi: { EN:'Hi {0}', ZH:'嗨 {0}' } });
L10N?.send('myplugin', 'hi', playerName);  // 發一條在地化 Action
```

## 座標系與相容性

- 所有畫面座標為 **BC 2000×1000 虛擬畫布**（與 `DrawButton` / `MouseIn` 同一套）。
- 相依：[bcModSdk](https://github.com/Jomshir98/bondage-club-mod-sdk)（loader 已 `@require`）。
- 相容 BC R100+（DOM 面板 / ElementButton）。

## 版本與來源

- 原始碼：<https://github.com/awdrrawd/BC-AFC>（`src/` 模組化，vite 打包成 `dist/assets/main.js`，CI 部署 GitHub Pages）。
- Bundle：`https://awdrrawd.github.io/BC-AFC/assets/main.js`
