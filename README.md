<h1 align="center">🌸 Liko-AFC — Abundantia Florum ─Chromatica─</h1>
<h3 align="center">繁戀如花 ─繽紛─</h3>

<div align="center">

![Version](https://img.shields.io/badge/version-0.7.3-purple.svg)
![License: MIT](https://img.shields.io/badge/License-MIT-purple.svg)
![BondageClub](https://img.shields.io/badge/BondageClub-Compatible-pink.svg)
![Languages](https://img.shields.io/badge/i18n-TW%20%7C%20CN%20%7C%20EN%20%7C%20DE%20%7C%20FR%20%7C%20RU%20%7C%20UA-blue.svg)

</div>

Bondage Club UserScript：突破原生戀人數量限制，提供多名戀人、關係進展（交往 → 訂婚 → 結婚），並內建**心形鎖（Heart Lock）**。安裝 AFC 後心形鎖自動載入，無需另外安裝。  
A Bondage Club UserScript that lifts the native lover limit with multiple lovers, relationship stages (dating → engaged → married), and a bundled **Heart Lock** padlock — no separate install required.

---

## ✨ 功能 · Features

### 💕 拓展戀人 · Extended Lovers
- 獨立於原生系統的拓展戀人名單，上限 **20 人**。  
  A separate extended-lover list, capped at **20**.
- 在對話選單提出申請，對方 **3 分鐘內**確認才成立；同一對象申請冷卻 60 秒。  
  Propose from the dialogue menu; the other side has **3 minutes** to accept (60 s cooldown between proposals).
- 解除關係：對話選單與 `/afc-breakup` 可隨時解除；偏好設定頁的戀人名單中，**超過 7 天沒見面**才能單方面解除（按鈕平時為灰色）。解除時會通知對方，對方離線或沒收到時紀錄暫時不對稱，可用「關係恢復」補齊。  
  Break up any time from the dialogue menu or `/afc-breakup`; in the settings page the Break-up button unlocks only after **7 days without meeting**. The other party is notified; an asymmetric record can be repaired through Restore.

### 💍 關係進展 · Relationship Stages
- 交往滿 7 天可提訂婚，訂婚滿 7 天可提結婚，需對方線上確認。  
  Engagement after 7 days of dating, marriage after 7 days engaged; the other party must accept online.
- 各階段不同顏色標籤：交往粉紅、訂婚金色、結婚桃紅。  
  Stage colour tags: dating (pink), engaged (gold), married (rose).

### 📋 Profile 面板 · Profile Panel
- 在他人的個人資料頁展開拓展戀人列表，每頁 10 人，最多 20 人；右向三角翻頁。  
  Browse a character's extended lovers on their Profile page, 10 per page (up to 20).
- 顯示階段與交往時長／起始日期（設定中切換），可選擇顯示在線燈號。  
  Shows stage plus duration or start date, with optional online indicators.
- 提供 `window.Liko.AFC` 供其他插件在條目上疊加按鈕，見 [Public API](docs/Public-API.md)。

### 🔄 關係恢復 · Relationship Restore
一方有記錄、另一方沒有時，任一方可在對話中發起恢復，對方確認後補齊並保留原始起始日期與階段。  
When only one side holds the record, either party can request a restore; the original start date and stage are preserved.

### 🏠 戀人房名分享 · Lover Room Sharing
戀人進入私人房時，房名經 AccountBeep 分享給在線戀人，其他插件可透過 `getLoverRoom()` 取得。  
Private room names are shared with online lovers via AccountBeep and exposed through `getLoverRoom()`.

### 🔒 心形鎖 · Heart Lock（內含 · bundled）
可由拓展戀人或 BC 原生戀人上鎖／解鎖的心形掛鎖，五個分頁：**總覽 / 筆記 / 計時器 / 控制 / 解鎖**。

| 功能 | 說明 |
|---|---|
| 筆記 Note | 最多 500 字，支援圖片網址內嵌 |
| 計時器 Timer | 到期自動解鎖，可選同時移除拘束 |
| 震動 Vibe | 關 / 低 / 中 / 高，每 60 秒發送一次震動訊息 |
| 高潮控制 Orgasm | 正常 / 邊緣 / 拒絕 |
| 防脫逃 Anti-Escape | 鎖被異常移除時自動復原並廣播；短時間反覆衝突會暫停自動復原 |
| 製作品鎖 Craft Lock | 在 BC 製作介面為製作品預設心鎖參數，使用時才實際上鎖 |
| 備份復原 Recovery | 鎖遺失時由設定資料與完整快照補回，需穿戴者確認 |

詳細的資料保存與保護規則見 [docs/Storage.md](docs/Storage.md)。

### 🌐 多語系 · i18n
繁體中文、簡體中文、英文、德文、法文、俄文、烏克蘭文；聊天廣播會依接收者的語言自動改寫（[說明](docs/Localization-Engine.md)）。

---

## 📦 安裝 · Installation

| 方式 | 步驟 |
|---|---|
| **Liko PCM**（推薦） | 在 [Liko PCM](https://awdrrawd.github.io/liko-Plugin-Repository/) 插件列表啟用 AFC |
| **FUSAM**（推薦） | 安裝 [FUSAM](https://sidiousious.gitlab.io/bc-addon-loader/) → 登入 BC → 設定頁頂部 **ADD-ON** → 找到 **Liko-AFC** → 選分支 → **Save** → 重新載入 |
| **Tampermonkey / Violentmonkey** | 安裝 **[loader.user.js](https://github.com/awdrrawd/BC-AFC/raw/refs/heads/main/loader.user.js)**，載入器自動抓取 CI 發佈於 GitHub Pages 的最新版 |
| **瀏覽器控制台** | F12 → Console 貼上下方程式碼 |

```javascript
import(`https://awdrrawd.github.io/BC-AFC/assets/main.js?v=${Date.now()}`);
```

相依：[bcModSdk](https://github.com/Jomshir98/bondage-club-mod-sdk)（自動載入）。

---

## ⚙️ 設定 · Settings

BC **偏好設定 → EL Settings（拓展戀人設定）**：

| 設定 | 說明 |
|---|---|
| 拓展戀人系統 | 啟用／停用整個系統（停用時鎖權限一律關閉） |
| 拓展戀人鎖 | 允許戀人對你使用心形鎖 |
| 主人使用拓展鎖 | 允許你的主人使用心形鎖 |
| 線上狀態燈號 | Profile 頁顯示綠點 |
| 顯示模式 | 日期 / 時長 |
| 震動訊息 | 關閉 / 廣播 / 僅自己可見 |
| 震動音效 | 震動時播放音效（僅自己聽到） |

## 💬 聊天指令 · Commands

| 指令 | 說明 |
|---|---|
| `/afc-propose [會員編號]` | 向同房玩家提出申請 |
| `/afc-status` | 顯示插件狀態、戀人列表與線上戀人數 |
| `/afc-breakup [會員編號]` | 解除指定戀人關係 |
| `/afc-lastseen` | 顯示各戀人最後見面時間 |
| `/afc-debug-hidden` | 診斷：印出下一則 Hidden 訊息的欄位結構 |

---

## 🛠️ 開發 · Development

原始碼模組化於 `src/`，由 Vite 打包；推送到 `main` 後 GitHub Actions 驗證並部署到 Pages。

```bash
npm install
npm run dev        # build --watch + preview :5175，搭配 loader.local.user.js
npm run build      # 輸出 dist/（先複製 Images/ 到 public/）
npm run check      # lint + test + 孤兒模組檢查（與 CI 相同的快速部分）
npm run check:assets
npm run check:bc -- <BC 原始碼目錄>   # 檢查被 hook 的 BC 函式是否仍存在
npm run setup-hooks                   # 選用：啟用 pre-commit 檢查
```

本地開發：安裝 `loader.local.user.js`（讀 `http://localhost:5175/assets/main.js`），執行 `npm run dev` 後重整 BC。  
注意：`dist/assets/main.js`（入口）與 `app.js`（應用本體）必須一起發佈。

## 📚 文件 · Documentation

架構、資料保存、公開 API、翻譯引擎與相容性說明見 **[docs/](docs/README.md)**。

## 📄 授權 · License

MIT License © Likolisu。使用本專案程式碼時請附上來源連結或保留版權聲明。

🐾 Made with 🐾 by **Likolisu**
