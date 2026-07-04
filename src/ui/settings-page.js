// ════════════════════════════════════════
//  AFC module: settings-page.js
//  AFC 擴展設定頁面（仿 EchoCache 風格）+ 偏好設定頁註冊
// ════════════════════════════════════════

import { MOD_VERSION, AFC_SETTINGS_IMAGE } from '../core/config.js';
import {
    getPrivateSettings, getSharedSettings, savePrivateSettings,
    saveSharedSettings, syncLockPermsToShared, _syncLoversBackup,
} from '../core/settings.js';
import { factoryReset, _readBackupLovers } from '../core/storage.js';
import { initiateBreakup } from '../relations/breakup.js';
import { t, stageLabel, detectLang } from '../i18n/i18n.js';
import { daysSince, chatLocalNotice } from '../util/util.js';

export const AFCSettingsUI = (() => {
    // ── 座標（依 setting.txt 設計稿）──────────────────────────
    // BC canvas: 2000 × 1000

    // 右欄戀人列表
    const R_ROW_X   = 1000;   // 文字起始 X
    const R_ROW_W   = 750;    // 文字寬度
    const R_START_Y = 240;    // 第一行 Y
    const R_ROW_H   = 70;     // 行高（310-240=70）
    const R_MAX     = 7;      // 最多顯示行數（超過需卷軸）
    const R_BTN_X   = 1780;   // 解除按鈕 X
    const R_BTN_W   = 110;    // 解除按鈕寬
    const R_BTN_H   = 40;     // 解除按鈕高
    const SCROLL_W  = 40;     // 卷軸按鈕寬
    const SCROLL_H  = 35;     // 卷軸按鈕高

    // 左欄
    const CB_X = 270, CB_SZ = 60;
    const LBL_X = 350;

    let _breakupModal  = null;
    let _factoryModal  = false;
    let _scrollOffset  = 0;
    let _showRestoreUI = false;

    function load() { _breakupModal = null; _factoryModal = false; _scrollOffset = 0; _showRestoreUI = false; }

    // ── run()：每幀繪製 ────────────────────────────────────────
    function run() {
        const priv   = getPrivateSettings();
        const lovers = getSharedSettings()?.lovers ?? [];
        if (!priv) return;

        // 返回按鈕（setting.txt: x=1815 y=75 w=90 h=90）
        DrawButton(1815, 75, 90, 90, "", "White", "Icons/Exit.png", "返回");
        // 復原按鈕（與 Exit 按鈕相同樣式，無底色）
        DrawButton(1710, 75, 90, 90, "", "", "Icons/Reset.png", t('restoreTitle'));
        // 初廠設定按鈕（復原左側）
        DrawButton(1605, 75, 90, 90, "", "", "Icons/Magic.png", t('factoryTitle'));

        // 標題（centerX=1000, y=90-150）
        DrawText("Abundantia Florum ─Chromatica─", 1000, 120, "Black", "Gray");
        DrawText(`v${MOD_VERSION}`, 1338, 137, "Gray", "");

        // ── 左欄 ──────────────────────────────────────────────

        DrawText(t('sysTitle'), 560, 200, "Black", "Gray");

        // enableAFC（y=240）
        DrawCheckbox(CB_X, 240, CB_SZ, CB_SZ, "", priv.enableAFC ?? true);
        _lbl(t('enableAFC'), LBL_X, 270, 400, "Black", 30);

        // enableAFCLock（y=315）
        const afcLockOn = priv.enableAFCLock ?? true;
        DrawCheckbox(CB_X, 315, CB_SZ, CB_SZ, "", afcLockOn);
        _lbl(t('elLock'), LBL_X, 345, 400, "Black", 30);

        // enableOwnerLock（y=390）— 只有 enableAFCLock 開啟時才能操作
        const ownerLockEnabled = afcLockOn;
        DrawCheckbox(CB_X, 390, CB_SZ, CB_SZ, "", priv.enableOwnerLock ?? false);
        _lbl(t('ownerLock'), LBL_X, 420, 400, ownerLockEnabled ? "Black" : "#999", 30);
        if (!ownerLockEnabled) {
            // 灰色遮罩：只蓋 checkbox，文字保持可見但顏色已灰化
            MainCanvas.save();
            MainCanvas.fillStyle = "rgba(0,0,0,0.45)";
            MainCanvas.fillRect(CB_X, 390, CB_SZ, CB_SZ);
            MainCanvas.restore();
        }

        DrawText(t('dispTitle'), 560, 495, "Black", "Gray");

        // showOnlineStatus（y=535）
        DrawCheckbox(CB_X, 535, CB_SZ, CB_SZ, "", priv.showOnlineStatus ?? true);
        _lbl(priv.showOnlineStatus ? t('onlineOn') : t('onlineOff'), LBL_X, 565, 400, "Black", 16);
        _lbl(t('onlineSub'), LBL_X, 615, 600, "#666", 20);

        // displayMode（y=650）
        const isDate = priv.displayMode === "date";
        DrawCheckbox(CB_X, 650, CB_SZ, CB_SZ, "", isDate);
        _lbl(isDate ? t('dateMode') : t('durMode'), LBL_X, 680, 400, "Black", 30);
        _lbl(isDate ? t('dateSub') : t('durSub'), LBL_X, 730, 600, "#666", 20);

        // vibeMsgMode — 兩個 checkbox：震動信息 + 廣播
        // vibeMsgMode: 'off'=兩個都關, 'broadcast'=兩個都開, 'local'=震動開廣播關
        const vibeMsgMode  = Player.OnlineSharedSettings?.AFC?.vibeMsgMode ?? 'broadcast';
        const vibeOn       = vibeMsgMode !== 'off';
        const broadcastOn  = vibeMsgMode === 'broadcast';

        // 震動信息 checkbox（y=765）
        DrawCheckbox(CB_X, 765, CB_SZ, CB_SZ, "", vibeOn);
        _lbl(t('vibeMsgLabel'), LBL_X, 795, 250, "Black", 28);

        // 廣播 checkbox（inline，x=580）— 只有震動信息開啟時才可點
        const BCAST_CB_X = 570;
        DrawCheckbox(BCAST_CB_X, 765, CB_SZ, CB_SZ, "", broadcastOn);
        _lbl(t('vibeMsgBcast'), BCAST_CB_X + CB_SZ + 10, 795, 150, vibeOn ? "Black" : "#999", 28);
        if (!vibeOn) {
            MainCanvas.save();
            MainCanvas.fillStyle = "rgba(0,0,0,0.45)";
            MainCanvas.fillRect(BCAST_CB_X, 765, CB_SZ, CB_SZ);
            MainCanvas.restore();
        }

        // 震動音效 checkbox（inline，x=800）— 獨立開關，僅本人聽到
        const SOUND_CB_X = 800;
        const soundOn = Player.OnlineSharedSettings?.AFC?.enableVibeSound ?? true;
        DrawCheckbox(SOUND_CB_X, 765, CB_SZ, CB_SZ, "", soundOn);
        _lbl(t('vibeSoundLabel'), SOUND_CB_X + CB_SZ + 10, 795, 180, "Black", 28);

        // 說明文字
        const vibeSub = vibeOn ? (broadcastOn ? t('vibeMsgSubOn') : t('vibeMsgSubOff')) : t('vibeMsgSubOff');
        _lbl(vibeSub, LBL_X, 848, 700, "#666", 18);

        // ── 右欄 ──────────────────────────────────────────────

        DrawText(t('mgmtTitle'), 1450, 200, "Black", "Gray");

        const total      = lovers.length;
        const needScroll = total > R_MAX;
        // 有卷軸時整體下移10px留邊框
        const shiftY     = needScroll ? 10 : 0;
        // lastSeen now in lover.lastSeen

        if (total === 0) {
            const p = MainCanvas.textAlign; MainCanvas.textAlign = "center";
            DrawText(t('noLovers'), 1450, R_START_Y + shiftY + 40, "#888", "Black");
            MainCanvas.textAlign = p;
        } else {
            if (needScroll) {
                // 上卷按鈕（緊貼第一行上方）
                const upY = R_START_Y + shiftY - SCROLL_H - 2;
                DrawButton(R_BTN_X, upY, SCROLL_W, SCROLL_H,
                           "▲", _scrollOffset > 0 ? "White" : "#333", "");
                // 下卷按鈕（緊貼最後行下方）
                const downY = R_START_Y + shiftY + R_MAX * R_ROW_H + 2;
                DrawButton(R_BTN_X, downY, SCROLL_W, SCROLL_H,
                           "▼", _scrollOffset + R_MAX < total ? "White" : "#333", "");
            }

            const visEnd = Math.min(total, _scrollOffset + R_MAX);
            for (let i = _scrollOffset; i < visEnd; i++) {
                const l    = lovers[i];
                const rowY = R_START_Y + shiftY + (i - _scrollOffset) * R_ROW_H;
                const ts   = l.lastSeen;
                const days = ts ? daysSince(ts) : 0;
                const warn = ts && days >= 7;

                _lbl(
                    `${stageLabel(l.stage)}  ${l.name} (${l.memberNumber})  ${ts ? t('lastSeen', days) : t('lastNever')}`,
                    R_ROW_X, rowY + R_BTN_H / 2,
                    R_ROW_W, warn ? "#CC0000" : "Black", 24
                );

                const canBreakup = warn;
                const btnColor   = canBreakup ? "#8B1A2E" : "#444444";
                DrawButton(R_BTN_X, rowY,
                           R_BTN_W, R_BTN_H, t('breakupBtn'), btnColor, "",
                           canBreakup ? t('breakupBtn') : t('sevenDay'));
            }
        }

        // 底部說明（中文一行）
        const noteY = R_START_Y + shiftY + R_MAX * R_ROW_H + (needScroll ? SCROLL_H + 10 : 0) + 30;
        if (noteY < 960) {
            const p = MainCanvas.textAlign; MainCanvas.textAlign = "center";
            DrawTextFit(t('sevenDay'), 1450, noteY, 700, "#555");
            MainCanvas.textAlign = p;
        }

        // ── 解除確認彈窗 ──────────────────────────────────────
        if (_breakupModal) _drawBreakupModal(_breakupModal);
        if (_factoryModal) _drawFactoryModal();
        if (_showRestoreUI) _drawRestoreUI();
    }

    // ── 解除確認彈窗（畫布 Modal）────────────────────────────
    function _drawBreakupModal({ name }) {
        // 半透明遮罩
        MainCanvas.save();
        MainCanvas.fillStyle = "rgba(0,0,0,0.72)";
        MainCanvas.fillRect(0, 0, 2000, 1000);

        // 對話框本體（置中）
        const bw = 860, bh = 300;
        const bx = (2000 - bw) / 2, by = (1000 - bh) / 2;
        MainCanvas.fillStyle   = "rgba(30,8,20,0.98)";
        MainCanvas.strokeStyle = "#E8618C";
        MainCanvas.lineWidth   = 3;
        MainCanvas.beginPath();
        if (MainCanvas.roundRect) MainCanvas.roundRect(bx, by, bw, bh, 14);
        else MainCanvas.rect(bx, by, bw, bh);
        MainCanvas.fill();
        MainCanvas.stroke();
        MainCanvas.restore();

        // 文字
        DrawText(t('modalTitle', name), 1000, by + 80, "White", "Black");
        DrawText(t('modalSub1'), 1000, by + 140, "#ddd", "Black");
        DrawText(t('modalSub2'), 1000, by + 190, "#FF9999", "Black");

        DrawButton(bx + 120, by + bh - 80, 260, 55, t('confirmBtn'), "#9a1a1a", "");
        DrawButton(bx + bw - 380, by + bh - 80, 260, 55, t('cancelBtn'), "White", "");
    }

    // ── 初廠設定確認彈窗 ──────────────────────────────────────
    const FRM = { bw: 900, bh: 320 };
    function _frmRect() {
        return { bx: (2000 - FRM.bw) / 2, by: (1000 - FRM.bh) / 2, bw: FRM.bw, bh: FRM.bh };
    }
    function _drawFactoryModal() {
        const { bx, by, bw, bh } = _frmRect();
        MainCanvas.save();
        MainCanvas.fillStyle = "rgba(0,0,0,0.72)";
        MainCanvas.fillRect(0, 0, 2000, 1000);
        MainCanvas.fillStyle   = "rgba(30,8,20,0.98)";
        MainCanvas.strokeStyle = "#E8618C";
        MainCanvas.lineWidth   = 3;
        MainCanvas.beginPath();
        if (MainCanvas.roundRect) MainCanvas.roundRect(bx, by, bw, bh, 14);
        else MainCanvas.rect(bx, by, bw, bh);
        MainCanvas.fill();
        MainCanvas.stroke();
        MainCanvas.restore();

        DrawText(t('factoryModalTitle'), 1000, by + 80,  "White",   "Black");
        DrawText(t('factoryModalSub1'),  1000, by + 145, "#ddd",    "Black");
        DrawText(t('factoryModalSub2'),  1000, by + 200, "#FF6666", "Black");

        DrawButton(bx + 120,      by + bh - 80, 280, 55, t('factoryConfirm'), "#9a1a1a", "");
        DrawButton(bx + bw - 400, by + bh - 80, 280, 55, t('cancelBtn'),      "White",   "");
    }

    let _restoreScrollL = 0;
    let _restoreScrollR = 0;
    let _restoreConfirm = null;

    const RUI = {
        bx: 150, by: 70, bw: 1700, bh: 900,
        rowH: 66, visRows: 8,
        colLX: 170, colRX: 1050, colW: 780,
        hdrY: 145, listY: 185,
        allBtnY: 70 + 900 - 75,
        allBtnW: 400, allBtnH: 52,
        sbW: 48, sbH: 38,
        rBtnW: 130, rBtnH: 42,
        // ✕ 在框框內右上角
        closeX: 150 + 1700 - 70, closeY: 70 + 10, closeS: 58,
    };

    function _drawRestoreUI() {
        const onL = getSharedSettings()?.lovers ?? [];
        const onR = _readBackupLovers();

        MainCanvas.save();
        MainCanvas.fillStyle = "rgba(0,0,0,0.82)";
        MainCanvas.fillRect(0, 0, 2000, 1000);
        MainCanvas.fillStyle = "rgba(16,4,28,0.98)";
        MainCanvas.strokeStyle = "#E8618C";
        MainCanvas.lineWidth = 3;
        MainCanvas.beginPath();
        if (MainCanvas.roundRect) MainCanvas.roundRect(RUI.bx, RUI.by, RUI.bw, RUI.bh, 14);
        else MainCanvas.rect(RUI.bx, RUI.by, RUI.bw, RUI.bh);
        MainCanvas.fill(); MainCanvas.stroke();
        MainCanvas.restore();

        DrawText(t('restoreTitle'), RUI.bx + RUI.bw/2, RUI.by + 48, "White", "transparent");
        DrawButton(RUI.closeX, RUI.closeY, RUI.closeS, RUI.closeS, "✕", "White", "");

        // 分隔線
        MainCanvas.save();
        MainCanvas.strokeStyle = "#333";
        MainCanvas.lineWidth = 1;
        MainCanvas.beginPath();
        MainCanvas.moveTo(RUI.bx + RUI.bw/2, RUI.by + 90);
        MainCanvas.lineTo(RUI.bx + RUI.bw/2, RUI.by + RUI.bh - 95);
        MainCanvas.stroke();
        MainCanvas.restore();

        // 欄標題置中
        DrawText(t('restoreOnline'), RUI.colLX + RUI.colW/2, RUI.hdrY, "#E8618C", "transparent");
        DrawText(t('restoreBackup'), RUI.colRX + RUI.colW/2, RUI.hdrY, "#7CB9E8", "transparent");

        _drawRestoreColumn(onL, RUI.colLX, _restoreScrollL, "#FFAAC0");
        _drawRestoreColumn(onR, RUI.colRX, _restoreScrollR, "#90CAF9");

        // 全部使用此資料按鈕（在框內底部）
        const allLX = RUI.colLX + RUI.colW/2 - RUI.allBtnW/2;
        const allRX = RUI.colRX + RUI.colW/2 - RUI.allBtnW/2;
        DrawButton(allLX, RUI.allBtnY, RUI.allBtnW, RUI.allBtnH, t('restoreAllBtn'), "#1A3A6A", "");
        DrawButton(allRX, RUI.allBtnY, RUI.allBtnW, RUI.allBtnH, t('restoreAllBtn'), "#1A3A6A", "");

        if (_restoreConfirm) _drawRestoreConfirm();
    }

    function _drawRestoreColumn(lovers, colX, scroll, nameColor) {
        if (!lovers.length) {
            _lbl(t('restoreEmpty'), colX, RUI.listY + 28, RUI.colW, "#666");
            return;
        }
        const total = lovers.length;
        const needScroll = total > RUI.visRows;
        if (needScroll) {
            DrawButton(colX + RUI.colW - RUI.sbW - 2, RUI.listY - RUI.sbH - 2, RUI.sbW, RUI.sbH, "▲", scroll > 0 ? "White" : "#333", "");
            DrawButton(colX + RUI.colW - RUI.sbW - 2, RUI.listY + RUI.visRows * RUI.rowH + 2, RUI.sbW, RUI.sbH, "▼", scroll + RUI.visRows < total ? "White" : "#333", "");
        }
        const end = Math.min(total, scroll + RUI.visRows);
        for (let i = scroll; i < end; i++) {
            const l = lovers[i];
            const ry = RUI.listY + (i - scroll) * RUI.rowH;
            const sLabel = stageLabel(l.stage);
            const days = daysSince(l.stageDate ?? l.startDate);
            // 名字 + 階段 + 天數 全在同一行，靠左
            const _lang = detectLang();
            const rowText = `♥ ${l.name}  (#${l.memberNumber})  [${sLabel}]  ${days}${(_lang==='TW'||_lang==='CN')?'天':'d'}`;
            _lbl(rowText, colX, ry + RUI.rowH/2, RUI.colW - RUI.rBtnW - 14, nameColor, 22);
            DrawButton(colX + RUI.colW - RUI.rBtnW - 6, ry + (RUI.rowH - RUI.rBtnH)/2, RUI.rBtnW, RUI.rBtnH, t('restoreBtn'), "#8B1A2E", "");
        }
    }

    function _drawRestoreConfirm() {
        const cw = 700, ch = 200, cx = (2000-cw)/2, cy = (1000-ch)/2;
        MainCanvas.save();
        MainCanvas.fillStyle = "rgba(0,0,0,0.6)";
        MainCanvas.fillRect(0, 0, 2000, 1000);
        MainCanvas.fillStyle = "rgba(20,6,35,0.99)";
        MainCanvas.strokeStyle = "#E8618C";
        MainCanvas.lineWidth = 3;
        MainCanvas.beginPath();
        if (MainCanvas.roundRect) MainCanvas.roundRect(cx, cy, cw, ch, 12);
        else MainCanvas.rect(cx, cy, cw, ch);
        MainCanvas.fill(); MainCanvas.stroke();
        MainCanvas.restore();
        const msg = _restoreConfirm.idx === -1
        ? t('restoreConfirmAll', t(_restoreConfirm.source==='online'?'restoreOnline':'restoreBackup'))
        : t('restoreConfirm1', _restoreConfirm.name);
        DrawTextFit(msg, 1000, cy + 74, cw - 40, "White", "transparent");
        // 使用正確的 i18n key（確認復原，非確認解除）
        DrawButton(cx + 50,      cy + ch - 64, 240, 50, t('restoreConfirmBtn'), "#9a1a1a", "");
        DrawButton(cx + cw - 290, cy + ch - 64, 240, 50, t('cancelBtn'),        "White",   "");
    }

    function _clickRestoreUI() {
        if (_restoreConfirm) {
            const cw = 700, ch = 200, cx = (2000-cw)/2, cy = (1000-ch)/2;
            if (MouseIn(cx + 50, cy + ch - 64, 240, 50)) { _doRestore(_restoreConfirm); _restoreConfirm = null; }
            else if (MouseIn(cx + cw - 290, cy + ch - 64, 240, 50)) { _restoreConfirm = null; }
            return;
        }
        if (MouseIn(RUI.closeX, RUI.closeY, RUI.closeS, RUI.closeS)) {
            _showRestoreUI = false; _restoreScrollL = 0; _restoreScrollR = 0; return;
        }
        const onL = getSharedSettings()?.lovers ?? [];
        const onR = _readBackupLovers();
        const allLX = RUI.colLX + RUI.colW/2 - RUI.allBtnW/2;
        const allRX = RUI.colRX + RUI.colW/2 - RUI.allBtnW/2;
        if (MouseIn(allLX, RUI.allBtnY, RUI.allBtnW, RUI.allBtnH)) { _restoreConfirm = { source:'online', idx:-1, name:'' }; return; }
        if (MouseIn(allRX, RUI.allBtnY, RUI.allBtnW, RUI.allBtnH)) { _restoreConfirm = { source:'backup', idx:-1, name:'' }; return; }
        _clickRestoreColumn(onL, RUI.colLX, 'online', _restoreScrollL,
                            ()=>{ _restoreScrollL=Math.max(0,_restoreScrollL-1); },
                            ()=>{ if(_restoreScrollL+RUI.visRows<onL.length)_restoreScrollL++; });
        _clickRestoreColumn(onR, RUI.colRX, 'backup', _restoreScrollR,
                            ()=>{ _restoreScrollR=Math.max(0,_restoreScrollR-1); },
                            ()=>{ if(_restoreScrollR+RUI.visRows<onR.length)_restoreScrollR++; });
    }

    function _clickRestoreColumn(lovers, colX, source, scroll, onUp, onDown) {
        const total = lovers.length;
        if (total > RUI.visRows) {
            if (MouseIn(colX+RUI.colW-RUI.sbW-2, RUI.listY-RUI.sbH-2, RUI.sbW, RUI.sbH)) { onUp(); return; }
            if (MouseIn(colX+RUI.colW-RUI.sbW-2, RUI.listY+RUI.visRows*RUI.rowH+2, RUI.sbW, RUI.sbH)) { onDown(); return; }
        }
        const end = Math.min(total, scroll + RUI.visRows);
        for (let i = scroll; i < end; i++) {
            const l = lovers[i];
            const ry = RUI.listY + (i - scroll) * RUI.rowH;
            if (MouseIn(colX+RUI.colW-RUI.rBtnW-6, ry+(RUI.rowH-RUI.rBtnH)/2, RUI.rBtnW, RUI.rBtnH)) {
                _restoreConfirm = { source, idx: i, name: l.name }; return;
            }
        }
    }

    function _doRestore({ source, idx }) {
        const onL = getSharedSettings()?.lovers ?? [];
        const onR = _readBackupLovers();
        const srcLovers = source === 'online' ? onL : onR;
        const s = getSharedSettings();
        if (!s) return;

        if (idx === -1) {
            // 全部使用
            s.lovers = [...srcLovers];
            saveSharedSettings();
            _syncLoversBackup();
            chatLocalNotice(t('restoreOKMsg', srcLovers.length));
        } else {
            // 單筆復原
            const entry = srcLovers[idx];
            if (!entry) return;
            const existing = s.lovers.findIndex(l => l.memberNumber === entry.memberNumber);
            if (existing >= 0) s.lovers[existing] = { ...entry };
            else s.lovers.push({ ...entry });
            saveSharedSettings();
            _syncLoversBackup();
            chatLocalNotice(t('restoreOKMsg', 1));
        }
    }

    // ── click()：滑鼠點擊 ─────────────────────────────────────
    function click() {
        // 復原 UI 優先處理
        if (_showRestoreUI) { _clickRestoreUI(); return; }

        // 彈窗優先處理
        if (_breakupModal) {
            const bw = 860, bh = 300;
            const bx = (2000 - bw) / 2, by = (1000 - bh) / 2;
            if (MouseIn(bx + 120, by + bh - 80, 260, 55)) {
                const { memberNumber, name } = _breakupModal;
                _breakupModal = null;
                initiateBreakup(memberNumber, name);
                return;
            }
            if (MouseIn(bx + bw - 380, by + bh - 80, 260, 55)) {
                _breakupModal = null;
                return;
            }
            return;  // 彈窗開著時攔截所有其他點擊
        }

        // 初廠設定確認彈窗
        if (_factoryModal) {
            const { bx, by, bw, bh } = _frmRect();
            if (MouseIn(bx + 120, by + bh - 80, 280, 55)) {
                _factoryModal = false;
                factoryReset();
                return;
            }
            if (MouseIn(bx + bw - 400, by + bh - 80, 280, 55)) {
                _factoryModal = false;
                return;
            }
            return;  // 彈窗開著時攔截所有其他點擊
        }

        if (MouseIn(1815, 75, 90, 90)) {
            if (typeof PreferenceExit === "function") PreferenceExit();
            return;
        }
        if (MouseIn(1710, 75, 90, 90)) { _showRestoreUI = true; return; }
        if (MouseIn(1605, 75, 90, 90)) { _factoryModal = true; return; }

        const priv   = getPrivateSettings();
        const lovers = getSharedSettings()?.lovers ?? [];
        if (!priv) return;

        // 左欄 checkbox
        if (MouseIn(CB_X, 240, CB_SZ, CB_SZ)) {
            priv.enableAFC = !(priv.enableAFC ?? true);
            savePrivateSettings(priv);
            syncLockPermsToShared(priv);
            return;
        }
        // enableAFCLock — 現在可以勾選
        if (MouseIn(CB_X, 315, CB_SZ, CB_SZ)) {
            priv.enableAFCLock = !(priv.enableAFCLock ?? true);
            // 關閉 AFCLock 時一併關閉 ownerLock
            if (!priv.enableAFCLock) priv.enableOwnerLock = false;
            savePrivateSettings(priv);
            syncLockPermsToShared(priv);
            return;
        }
        // enableOwnerLock — 只有 enableAFCLock 開啟時才響應
        if (MouseIn(CB_X, 390, CB_SZ, CB_SZ) && (priv.enableAFCLock ?? true)) {
            priv.enableOwnerLock = !(priv.enableOwnerLock ?? false);
            savePrivateSettings(priv);
            syncLockPermsToShared(priv);
            return;
        }
        if (MouseIn(CB_X, 535, CB_SZ, CB_SZ)) {
            priv.showOnlineStatus = !(priv.showOnlineStatus ?? true);
            savePrivateSettings(priv); return;
        }
        if (MouseIn(CB_X, 650, CB_SZ, CB_SZ)) {
            priv.displayMode = priv.displayMode === "date" ? "duration" : "date";
            savePrivateSettings(priv); return;
        }
        // 震動信息 checkbox（y=765）
        if (MouseIn(CB_X, 765, CB_SZ, CB_SZ)) {
            const s = getSharedSettings();
            if (s) {
                const vibeOn = s.vibeMsgMode !== 'off';
                // 關→開（預設廣播），開→關
                s.vibeMsgMode = vibeOn ? 'off' : 'broadcast';
                saveSharedSettings();
            }
            return;
        }
        // 廣播 checkbox（x=570, y=765）— 只有 vibeOn 才響應
        if (MouseIn(570, 765, CB_SZ, CB_SZ)) {
            const s = getSharedSettings();
            if (s && s.vibeMsgMode !== 'off') {
                s.vibeMsgMode = s.vibeMsgMode === 'broadcast' ? 'local' : 'broadcast';
                saveSharedSettings();
            }
            return;
        }
        // 震動音效 checkbox（x=800, y=765）
        if (MouseIn(800, 765, CB_SZ, CB_SZ)) {
            const s = getSharedSettings();
            if (s) { s.enableVibeSound = !(s.enableVibeSound ?? true); saveSharedSettings(); }
            return;
        }

        // 右欄卷軸
        const total      = lovers.length;
        const needScroll = total > R_MAX;
        const shiftY     = needScroll ? 10 : 0;

        if (needScroll) {
            const upY   = R_START_Y + shiftY - SCROLL_H - 2;
            const downY = R_START_Y + shiftY + R_MAX * R_ROW_H + 2;
            if (MouseIn(R_BTN_X, upY, SCROLL_W, SCROLL_H) && _scrollOffset > 0) {
                _scrollOffset--; return;
            }
            if (MouseIn(R_BTN_X, downY, SCROLL_W, SCROLL_H) && _scrollOffset + R_MAX < total) {
                _scrollOffset++; return;
            }
        }

        // 解除按鈕 → 開啟彈窗（只有超過7天才響應）
        const visEnd = Math.min(total, _scrollOffset + R_MAX);
        // lastSeen now in lover.lastSeen
        for (let i = _scrollOffset; i < visEnd; i++) {
            const l    = lovers[i];
            const rowY = R_START_Y + shiftY + (i - _scrollOffset) * R_ROW_H;
            if (MouseIn(R_BTN_X, rowY, R_BTN_W, R_BTN_H)) {
                const ts  = l.lastSeen;          // ← 改這裡
                const ok  = ts && daysSince(ts) >= 7;
                if (ok) _breakupModal = { memberNumber: l.memberNumber, name: l.name };
                return;
            }
        }
    }

    // 繪製輔助：左對齊文字
    function _lbl(text, x, y, maxW, color, size) {
        const p = MainCanvas.textAlign;
        MainCanvas.textAlign = "left";
        if (size) {
            const prevFont = MainCanvas.font;
            MainCanvas.font = MainCanvas.font.replace(/\d+px/, `${Math.round(size * 1.2)}px`);
            DrawTextFit(text, x, y, maxW, color);
            MainCanvas.font = prevFont;
        } else {
            DrawTextFit(text, x, y, maxW, color);
        }
        MainCanvas.textAlign = p;
    }

    function unload() { _breakupModal = null; _factoryModal = false; }

    return { load, run, click, unload, exit: () => { _breakupModal = null; _factoryModal = false; _scrollOffset = 0; } };
})();

export function registerSettingsUI() {
    if (typeof PreferenceRegisterExtensionSetting !== "function") return;
    // ButtonText 在登入後呼叫，此時 TranslationLanguage 已設定，t() 能正確翻譯
    const _lang = detectLang();
    const btnText = (_lang === 'TW' || _lang === 'CN') ? "拓展戀人設定" : "AFC Settings";
    PreferenceRegisterExtensionSetting({
        Identifier: "AFC",
        ButtonText:  btnText,
        Image:       AFC_SETTINGS_IMAGE,
        load:   () => AFCSettingsUI.load(),
        run:    () => AFCSettingsUI.run(),
        click:  () => AFCSettingsUI.click(),
        unload: () => AFCSettingsUI.unload(),
        exit:   () => AFCSettingsUI.exit(),
    });
    console.log(`🐈‍⬛ [AFC] ✅ 擴展設定頁面已注冊 (${btnText})`);
}
