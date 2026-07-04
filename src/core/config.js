// ════════════════════════════════════════
//  AFC module: config.js
//  常數：版本、Beep 通道、關係階段、顏色、冷卻、Profile 按鈕座標
//  版本號由 package.json 經 vite define 注入（見 vite.config.js）
// ════════════════════════════════════════

export const MOD_NAME    = "AbundantiaFlorumChromatica";
export const MOD_VERSION = (typeof __AFC_VERSION__ !== 'undefined' && __AFC_VERSION__) || "0.7.0";
export const AFC_BEEP_TYPE = "AFC::Beep";
// AccountBeep 跨房通道（vanilla BC 對非空/非 Leash 的 BeepType 靜默忽略 → 不彈通知）
export const AFC_AB_TYPE   = "afcBeep";

export const BEEP = {
    PROPOSE:          "AFCPropose",
    PROPOSE_ACK:      "AFCProposeAck",
    ACCEPT:           "AFCAccept",
    ACCEPT_ACK:       "AFCAcceptAck",
    RESTORE_PROPOSE:  "AFCRestorePropose",   // 資料恢復申請
    RESTORE_ACCEPT:   "AFCRestoreAccept",    // 資料恢復確認
    PROPOSE_ENGAGE:   "AFCProposeEngage",
    ACCEPT_ENGAGE:    "AFCAcceptEngage",
    PROPOSE_MARRY:    "AFCProposeMarry",
    ACCEPT_MARRY:     "AFCAcceptMarry",
    SYNC_REQUEST:     "AFCSyncRequest",
    SYNC_GRANT:       "AFCSyncGrant",
    LOCK_ACCESS_OFF:  "AFCLockAccessOff",
    BREAKUP:          "AFCBreakup",
    ROOM_NAME:        "AFCRoomName",
    ACK_T:            "AFCAckT",        // 傳輸層 ACK（與語意 ACK 區分）
};

// 需要可靠送達（重送到 ACK 為止 + 接收端冪等）的訊息
export const RELIABLE_BEEPS = new Set([
    BEEP.PROPOSE, BEEP.ACCEPT,
    BEEP.RESTORE_PROPOSE, BEEP.RESTORE_ACCEPT,
    BEEP.PROPOSE_ENGAGE, BEEP.ACCEPT_ENGAGE,
    BEEP.PROPOSE_MARRY,  BEEP.ACCEPT_MARRY,
    BEEP.BREAKUP,
]);

// AccountBeep（跨房）訊息：只用於戀人房名分享
export const AB = {
    ROOM_NAME: "RoomName",   // 帶房名（IsSecret:false → 伺服器蓋上 ChatRoomName）
    REQ_ROOM:  "ReqRoom",    // 請求對方回送房名
    DEL_ROOM:  "DelRoom",    // 通知對方移除已分享的房名
};

export const STAGE = { DATING: 0, ENGAGED: 1, MARRIED: 2 };

// 英文標籤（STAGE_LABEL 用於向後相容驗證）
export const STAGE_LABEL = { 0: "dating", 1: "engaged", 2: "married" };

export const STAGE_COLOR = {
    [STAGE.DATING]:  "#FFB6C1",
    [STAGE.ENGAGED]: "#FFD700",
    [STAGE.MARRIED]: "#FF69B4",
};

export const PROPOSE_COOLDOWN_MS = 60  * 1000;
export const PROPOSE_EXPIRE_MS   = 3   * 60 * 1000;
export const STAGE_PROMOTE_DAYS  = 7;

// Profile 按鈕（依 profile.txt "More loves" 按鈕座標）
export const PROFILE_BTN_X = 1020;
export const PROFILE_BTN_Y = 100;
export const PROFILE_BTN_W = 165;
export const PROFILE_BTN_H = 50;

// 拓展戀人面板矩形（展開後的容器；裁切為 1170 寬避免蓋到 nav 按鈕 x=1715）
export const PROFILE_PANEL_X = 540;
export const PROFILE_PANEL_Y = 150;
export const PROFILE_PANEL_W = 1170;
export const PROFILE_PANEL_H = 640;

// 舊版資料判別門檻（短期輔助）
export const LEGACY_OK_VER = '0.6.1';

// localStorage 本地存底前綴
export const LS_PREFIX = "AFC_DB::";

// 自架圖片（BC-AFC 倉庫，raw 直連，推送即生效）
export const AFC_SETTINGS_IMAGE = "https://raw.githubusercontent.com/awdrrawd/BC-AFC/main/Images/AFC-ICON.png";
