<h1 align="center">🌸 Liko-ACF — Abundantia Florum ─Chromatica─</h1>
<h3 align="center">繁戀如花 ─繽紛─</h3>

<div align="center">

![Version](https://img.shields.io/badge/version-0.6.1-purple.svg)
![License: MIT](https://img.shields.io/badge/License-MIT-purple.svg)
![BondageClub](https://img.shields.io/badge/BondageClub-Compatible-pink.svg)
![EN](https://img.shields.io/badge/EN-✔️-blue.svg)
![ZH](https://img.shields.io/badge/ZH-✔️-pink.svg)

</div>

一個 BondageClub UserScript 插件，拓展原生戀人系統，支援多名戀人、關係進展（交往→訂婚→結婚）以及心形鎖拓展。  
A BondageClub UserScript plugin extending the native lover system — multiple lovers, relationship stages (dating → engaged → married), and a Heart Padlock extension.

> 本插件內含 **BC Heart Lock Extension（心形鎖拓展）**，安裝 ACF 後心形鎖功能會自動載入，無需另行安裝。  
> This plugin includes the **BC Heart Lock Extension**. It loads automatically with ACF — no separate install needed.

---

## ✨ 功能 · Features

**💕 拓展戀人系統 · Extended Lover System**

突破 BC 原生戀人數量限制，建立獨立的拓展戀人名單。  
Bypass BC's native lover limit with a separate extended lover list.

在對話選單中直接提出申請，雙方確認後成立關係，3 分鐘內有效。  
Propose directly from the dialogue menu. Confirmed by both parties within 3 minutes.

支援單方面解除關係（超過 7 天未見面時可不通知對方）。  
One-sided breakup is allowed after 7 days of no contact.

---

**💍 關係進展 · Relationship Stages**

交往滿 7 天後可提出訂婚，訂婚滿 7 天後可提求婚，對方需線上確認。  
After 7 days of dating, propose engagement; after 7 days engaged, propose marriage. The other party must accept online.

各階段顯示不同顏色標籤（交往 粉紅、訂婚 金色、結婚 桃紅）。  
Each stage displays a different color tag (dating: pink, engaged: gold, married: rose).

---

**📋 Profile 面板 · Profile Panel**

在對方的個人資料頁面，可查看其拓展戀人列表（最多 10 人，左右各 5 人）。  
View a character's extended lover list on their Profile page (up to 10 entries).

顯示關係階段、交往天數或起始日期（可在設定中切換顯示模式）。  
Shows relationship stage, days together, or start date (configurable in settings).

可選擇在自己的 Profile 頁面顯示在線狀態燈號（綠點）。  
Optionally show online status indicators (green dot) on your own Profile page.

---

**🔄 關係恢復 · Relationship Restore**

當雙方資料不對稱（一方有記錄、一方沒有）時，可在對話中發起恢復申請。  
When relationship data is asymmetric (one side has the record, the other doesn't), either party can initiate a restore request.

對方確認後自動補齊資料，並同步原始關係日期與階段。  
Data is synced back automatically after confirmation, preserving the original start date and stage.

---

**📡 LIKOSHARE 資料同步 · Data Sync**

上線後自動向在線的拓展戀人發送握手同步，確認解鎖授權與房間資訊。  
Automatically syncs with online extended lovers on login to confirm lock access and room info.

透過房間內 Hidden 訊息廣播，讓房間內其他玩家即時看到你的戀人資料。  
Broadcasts data via room Hidden messages for real-time visibility by others in the room.

---

**🔒 BC Heart Lock Extension（內含）· Heart Padlock (Bundled)**

一款心形掛鎖，可由拓展戀人或 BC 原生戀人上鎖與解鎖。  
A heart-shaped padlock that can be locked and unlocked by extended lovers or BC native lovers.

五個標籤面板（總覽 / 筆記 / 計時器 / 控制 / 解鎖），全功能 DOM 介面。  
Five-tab panel (Overview / Note / Timer / Control / Unlock) with a full DOM interface.

- **筆記 Note** — 最多 500 字的愛情筆記，支援圖片網址嵌入。  
  Up to 500-character love note with image URL embedding.
- **計時器 Timer** — 設定解鎖截止時間，到期自動解鎖，可選同時移除拘束。  
  Set an unlock deadline; auto-unlocks on expiry, optionally removing restraints.
- **震動控制 Vibe** — 低 / 中 / 高三段強度，每 60 秒廣播一次震動訊息。  
  Three vibration levels; broadcasts a vibe message every 60 seconds.
- **高潮控制 Orgasm Control** — 正常 / 邊緣 / 拒絕三種模式。  
  Normal / Edge / Deny modes.
- **防脫逃保護 Anti-Escape** — 鎖被異常移除時自動復原，並發送廣播訊息。  
  Automatically restores if the lock is removed abnormally, with a broadcast message.

支援多語言：繁體中文、簡體中文、英文、德文、法文、俄文、烏克蘭文。  
Multilingual: Traditional Chinese, Simplified Chinese, English, German, French, Russian, Ukrainian.

---

## 📦 安裝方式 · Installation

> 安裝 ACF 後，心形鎖拓展（Heart Lock Extension）會**自動載入**，無需另行安裝。  
> After installing ACF, the Heart Lock Extension **loads automatically** — no separate install needed.

### 🧩 透過 PCM 管理器（推薦） · Via PCM Manager (Recommended)

若你已安裝 [Liko PCM](https://awdrrawd.github.io/liko-Plugin-Repository/)，可在插件列表中直接啟用 ACF，無需單獨安裝。  
If you have [Liko PCM](https://awdrrawd.github.io/liko-Plugin-Repository/) installed, enable ACF directly from the plugin list.

---

### 🔌 透過 FUSAM（推薦） · Via FUSAM (Recommended)

1. 安裝 FUSAM（若尚未安裝）：https://sidiousious.gitlab.io/bc-addon-loader/  
   Install FUSAM if you don't have it yet: https://sidiousious.gitlab.io/bc-addon-loader/

2. 登入 BondageClub 後，前往主設定頁面點擊頂部的 **ADD-ON**。  
   After logging in, click **ADD-ON** at the top of the main settings page.

3. 在列表中找到 **Liko-ACF**，選擇版本後點擊 **Save**。  
   Find **Liko-ACF** in the list, select your preferred branch, and click **Save**.

4. 重新載入 BC。  
   Reload BondageClub.

---

### 🐵 直接安裝 · Direct installation
Tampermonkey / Violentmonkey

點擊以下連結直接安裝：  
Click the link below to install:

👉 **[Install Liko-ACF.user.js](https://github.com/awdrrawd/liko-Plugin-Repository/raw/refs/heads/main/Plugins/Liko-ACF.user.js)**

---

### 🔖 書籤安裝 · Bookmarklet

建立新書籤，將以下程式碼貼入網址欄，在 BC 頁面點擊書籤即可載入：  
Create a new bookmark, paste the code below as the URL, then click it on the BondageClub page:

```javascript
javascript:(function(){
  var s=document.createElement('script');
  s.src="https://github.com/awdrrawd/liko-Plugin-Repository/raw/refs/heads/main/Plugins/Liko-ACF.user.js?"+Date.now();
  s.type="text/javascript";
  s.crossOrigin="anonymous";
  document.head.appendChild(s);
})();
```

---

### 💻 瀏覽器控制台 · Browser Console

開啟 F12，在 Console 分頁貼上以下程式碼：  
Open F12 DevTools and paste the following into the Console tab:

```javascript
import(`https://github.com/awdrrawd/liko-Plugin-Repository/raw/refs/heads/main/Plugins/Liko-ACF.user.js?v=${(Date.now()/10000).toFixed(0)}`);
```

---

## ⚙️ 設定 · Settings

在 BC 偏好設定頁面中找到 **拓展戀人設定 / EL Settings** 進入設定頁面：  
Go to BC Preferences and find **EL Settings** to open the settings page:

| 設定 Setting | 說明 Description |
|---|---|
| 拓展戀人系統 Extended Lover System | 啟用 / 停用整個拓展戀人系統 Enable/disable the EL system |
| 拓展戀人鎖 EL Lock | 允許戀人使用心形鎖 Allow lovers to use Heart Padlock |
| 主人使用拓展鎖 Owner Lock | 允許你的主人也使用心形鎖 Allow your owner to use Heart Padlock |
| 線上狀態燈號 Online Indicator | 在 Profile 頁面顯示綠點 Show green dots on Profile page |
| 顯示模式 Display Mode | 日期模式 / 時長模式切換 Toggle date vs duration display |
| 震動信息 Vibe Message | 開啟 / 廣播 / 僅自己可見 On / Broadcast / Local only |
| 震動音效 Vibe Sound | 震動時播放音效（僅自己聽到）Play sound on vibe (local only) |

---

## 🔧 相依 · Dependencies

- [bcModSdk](https://github.com/Jomshir98/bondage-club-mod-sdk) — 自動載入，無需手動安裝。Auto-loaded, no manual install needed.

---

## 📄 授權 · License

MIT License © Likolisu

使用本插件的程式碼時，請附上來源連結或保留版權聲明。  
When using code from this project, please include a link to the source or retain the copyright notice.

---

🐾 Made with 🐾 by **Likolisu**
