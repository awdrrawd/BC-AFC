// ════════════════════════════════════════
//  HeartLock module: config.js
//  常數 + 版面座標 + 配色。圖片改由 BC-AFC 自架（GitHub Pages）。
// ════════════════════════════════════════

export const MOD_VER = '2.6.0';

export const HEARTLOCK_NAME   = 'Heart Padlock';
export const HSLOCK_NAME      = 'HighSecurityPadlock';
export const MOD_NAME         = 'HeartLockBC';
export const EXT_KEY          = 'AFC_HeartLock';
export const EXT_KEY_OLD      = 'HeartLock';   // 舊 key，搬遷後刪除（短期輔助，未來移除）
export const HEARTKEY_IMAGE   = 'https://awdrrawd.github.io/BC-AFC/AFC-Heart_Key.png';
export const HEARTLOCK_IMAGE  = 'https://awdrrawd.github.io/BC-AFC/AFC-Heart_Lock.png';
export const VIBE_INTERVAL_MS = 5000;
export const MAX_TEXT         = 500; //note最大字數
export const VIBE_MSG_CYCLE   = 12;  // 12 × 5s = 60 秒發一次震動訊息

export const PX = 1110; export const PY  = 15;
export const PW = 870;  export const PH  = 950;
export const TAB_H = 60; export const TAB_W = 161;  // 5 tabs × 161 ≈ 808px = (CLOSE_X - PX)
export const CX = PX + 20; export const CY = PY + TAB_H + 10;
export const CW = PW - 40; export const CH = PH - TAB_H - 10;
export const TAB_OVERVIEW = 'overview';
export const TAB_NOTE     = 'note';
export const TAB_TIMER    = 'timer';
export const TAB_CONTROL  = 'control';
export const TAB_UNLOCK   = 'unlock';
export const TABS = [TAB_OVERVIEW, TAB_NOTE, TAB_TIMER, TAB_CONTROL, TAB_UNLOCK];

export const CC = {
    bg: '#0f0008', panel: '#1a0010', border: '#8B1A4A', acc: '#CC2266',
    tSel: '#8B1A4A', tOff: '#280a1c', text: '#FFFFFF', sub: '#CC99BB',
    dim: '#555555', gold: '#FFCC66', btn: '#280a1c', btnA: '#8B1A4A', danger: '#5a0a0a',
};

export const CLOSE_X = PX + PW - 62;  // 右邊對齊 PX+PW，x=1908
export const CLOSE_Y = PY + 2;         // y=132（JSON 確認值）
export const CLOSE_W = 62;             // w=62（JSON 確認值）
export const CLOSE_H = 62;             // h=62（JSON 確認值）

export const TOP_H = Math.floor(CH * 3 / 7);
export const BOT_H = CH - TOP_H - 8;
export const TOP_Y = CY;
export const BOT_Y = CY + TOP_H + 8;

export const IMG_COL = Math.floor(CW * 3 / 7);
export const IMG_X   = PX + 4;
export const IMG_Y   = TOP_Y + 4;
export const IMG_W   = IMG_COL - 22;
export const IMG_H   = TOP_H - 8;

export const INFO_COL = Math.floor(CW * 2 / 7);
export const LBL_X    = CX + IMG_COL - 17;
export const VAL_X    = CX + IMG_COL + INFO_COL - 51;
export const ROW_H    = 34; export const ROW_GAP = 6;
export const ROWS_TOP = TOP_Y + 57;

export const NOTE_PREV_X = CX; export const NOTE_PREV_Y = BOT_Y;
export const NOTE_PREV_W = CW; export const NOTE_PREV_H = BOT_H - 4;
export const NOTE_HDR_H  = 28;

export const NOTE_TITLE_Y  = CY + 28;
export const NOTE_BOX_Y    = CY + 58;  export const NOTE_BOX_H = 420;
export const NOTE_TA_ID    = 'HeartLockNoteTA';
export const NOTE_OVERLAY_ID = 'HeartLockNoteOverlay';
export const NOTE_BTN_Y    = NOTE_BOX_Y + NOTE_BOX_H + 14;
export const NOTE_BTN_H    = 54;
export const NOTE_BTN_W    = 200;
export const NOTE_SAVE_X   = CX + CW - NOTE_BTN_W;
export const NOTE_CANCEL_X = CX + CW - NOTE_BTN_W * 2 - 16;

export const TMR_TITLE_Y = CY + 28;
export const TMR_ROW_H   = 44;
export const TMR_GAP     = 10;
export const TMR_REM_Y   = CY + 56;
export const TMR_DDAT_Y  = TMR_REM_Y + TMR_ROW_H + TMR_GAP;
export const TMR_VAL_X   = CX + 170;
export const TMR_CAL_W   = 52;
export const TMR_CAL_X   = CX + CW - TMR_CAL_W;
export const TMR_ADJ_Y   = TMR_DDAT_Y + TMR_ROW_H + TMR_GAP;
export const TMR_DISP_Y  = TMR_ADJ_Y + 26;
export const TMR_DISP_H  = 52;
export const TMR_PM_BTN_W = 110;
export const TMR_PM_GAP   = 5;
export const TMR_PM_TOTAL = 6 * TMR_PM_BTN_W + 5 * TMR_PM_GAP;
export const TMR_PM_X0    = CX + CW - TMR_PM_TOTAL;
export const TMR_PM = [
    { l:'-7d', dx:0, dh:-7*24 }, { l:'-1d', dx:1, dh:-24 },
    { l:'-1h', dx:2, dh:-1    }, { l:'+1h', dx:3, dh:1   },
    { l:'+1d', dx:4, dh:24    }, { l:'+7d', dx:5, dh:7*24 },
];
export const TMR_ACT_Y   = TMR_DISP_Y + TMR_DISP_H + TMR_GAP;
export const TMR_ACT_H   = 52;
export const TMR_ACT_W   = 190;
export const TMR_ACT_GAP = 16;
export const TMR_SET_X   = PX + PW/2 - TMR_ACT_W - TMR_ACT_GAP/2;
export const TMR_CLR_X   = PX + PW/2 + TMR_ACT_GAP/2;

export const CTL_TITLE_Y    = CY + 28;
export const CTL_VIBE_LBL_Y = CY + 58;
export const CTL_VIBE_BTN_Y = CTL_VIBE_LBL_Y + 28; export const CTL_VIBE_BTN_H = 54;
export const CTL_ORG_LBL_Y  = CTL_VIBE_BTN_Y + CTL_VIBE_BTN_H + 32;
export const CTL_ORG_BTN_Y  = CTL_ORG_LBL_Y  + 28; export const CTL_ORG_BTN_H  = 54;
export const CTL_SAVE_Y     = CTL_ORG_BTN_Y   + CTL_ORG_BTN_H + 30;
export const CTL_SAVE_H     = 54;
export const CTL_SAVE_W     = 200;
export const CTL_SAVE_X     = CX + CW - CTL_SAVE_W;
export const CTL_CANCEL_W   = 200;
export const CTL_CANCEL_X   = CX + CW - CTL_SAVE_W - CTL_CANCEL_W - 16;

export const CTL_VIBE_OPTS = [{ v:'off',l:'Off' },{ v:'low',l:'♥ Low' },{ v:'mid',l:'♥♥ Med' },{ v:'high',l:'♥♥♥ High' }];
export const CTL_ORG_OPTS  = [{ o:'normal',l:'Normal' },{ o:'edge',l:'Edge ～' },{ o:'deny',l:'Deny ✕' }];

export const GRAB_WINDOW_MS   = 14000;
export const GRAB_COOLDOWN_MS = 120000;

// 預設 storage（previewImage 指向自架心鎖圖）
export const DEFAULT_STORAGE = { debug: false, previewImage: HEARTLOCK_IMAGE, padlocks: {}, updatedAt: 0 };

// DOM 面板容器 id（panel 與 tabs 共用）
export const HL_PANEL_ID = 'HeartLockDOMPanel';
