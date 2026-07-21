// ════════════════════════════════════════
//  Liko - AFC 字庫 — EN（English）
//  一國一檔，含 afc（拓展戀人）與 hl（心形鎖）兩命名空間；位置式佔位 {0}{1}…
//  由 AFC 執行期 fetch 後 new Function 執行，自動註冊到共用引擎 window.Liko.__Sys_L10N__。
//  ★ 翻譯者請直接改這裡；改完 build 會複製到 public/Translation/ 部署。
// ════════════════════════════════════════
(function () {
    var Liko = (typeof window !== 'undefined') ? window.Liko : (typeof globalThis !== 'undefined' ? globalThis.Liko : null);
    var L = Liko && Liko.__Sys_L10N__;
    if (!L || !L.register) { console.error('[Liko AFC EN] L10N 引擎尚未載入'); return; }
    L.register('afc', {
    "prefButton": {
        "EN": "AFC Settings"
    },
    "notFriend": {
        "EN": "Please add {0} as a friend first, then re-submit."
    },
    "notInstalled": {
        "EN": "{0} doesn't have the plugin installed."
    },
    "alreadyAFC": {
        "EN": "{0} is already your extended lover."
    },
    "alreadyBC": {
        "EN": "{0} is already your native BC lover."
    },
    "cooldown": {
        "EN": "Please wait {0}s before proposing again."
    },
    "proposeSent": {
        "EN": "Proposal sent to {0}, valid for 3 min..."
    },
    "proposeExpired": {
        "EN": "Proposal to {0} has expired."
    },
    "proposeAck": {
        "EN": "{0} received your proposal."
    },
    "proposeOK": {
        "EN": "{0} accepted your extended lover proposal!"
    },
    "breakupSelf": {
        "EN": "You ended the extended lover relationship with {0}."
    },
    "breakupOther": {
        "EN": "{0} ended the extended lover relationship with you."
    },
    "restoreSent": {
        "EN": "Relationship restore request sent to {0}..."
    },
    "restoreOK": {
        "EN": "Extended lover relationship with {0} restored!"
    },
    "dRestore": {
        "EN": "(Request to restore extended lover relationship.)"
    },
    "dRestoreR": {
        "EN": "(Restore request sent, awaiting response.)"
    },
    "stageSent": {
        "EN": "[{1}] proposal sent to {0}, valid for 3 min..."
    },
    "stageExpired": {
        "EN": "[{1}] proposal to {0} has expired."
    },
    "stageOK": {
        "EN": "{0} accepted your [{1}] proposal!"
    },
    "stageOKSelf": {
        "EN": "You accepted {0}'s [{1}] proposal!"
    },
    "stageDating": {
        "EN": "dating"
    },
    "stageEngaged": {
        "EN": "engaged"
    },
    "stageMarried": {
        "EN": "married"
    },
    "propTitle": {
        "EN": "♥ {0} ({1}) has proposed an extended lover relationship!"
    },
    "stageTitle": {
        "EN": "💍 {0} ({1}) has proposed: [{2}]!"
    },
    "bcTitle": {
        "EN": "💌 {0} ({1}) sent a BC native lover request!"
    },
    "bcNote": {
        "EN": "Go to Relationship Management to accept, or let it expire."
    },
    "timerText": {
        "EN": "Auto-cancels in {0}:{1}"
    },
    "okBtn": {
        "EN": "Accept"
    },
    "cancelBtn": {
        "EN": "Decline"
    },
    "panelTitle": {
        "EN": "─── Extended Lovers ───"
    },
    "panelEmpty": {
        "EN": "No extended lovers yet"
    },
    "btnOpen": {
        "EN": "More loves ({0})"
    },
    "btnClose": {
        "EN": "▲ Close"
    },
    "dispTitle": {
        "EN": "──Display──"
    },
    "mgmtTitle": {
        "EN": "──Lovers──"
    },
    "sysTitle": {
        "EN": "──System──"
    },
    "enableAFC": {
        "EN": "Extended Lover System"
    },
    "enableAFCSub": {
        "EN": "Extended Lovers"
    },
    "elLock": {
        "EN": "Extended Lover Lock"
    },
    "elLockSub": {
        "EN": "(Under development)"
    },
    "ownerLock": {
        "EN": "Owner can use AFC Lock"
    },
    "ownerLockSub": {
        "EN": "When enabled, your owner may also apply the Extended Lover Lock"
    },
    "onlineOn": {
        "EN": "Online indicator  ON"
    },
    "onlineOff": {
        "EN": "Online indicator  OFF"
    },
    "onlineSub": {
        "EN": "Show online status dots on your own Profile"
    },
    "dateMode": {
        "EN": "Date mode"
    },
    "durMode": {
        "EN": "Duration mode"
    },
    "dateSub": {
        "EN": "Start date + days together"
    },
    "durSub": {
        "EN": "X years X months X days"
    },
    "vibeMsgLabel": {
        "EN": "Vibe message"
    },
    "vibeMsgBcast": {
        "EN": "Broadcast"
    },
    "vibeSoundLabel": {
        "EN": "Sound effect"
    },
    "vibeMsgSubOn": {
        "EN": "Others can see the vibe message every 60s"
    },
    "vibeMsgSubOff": {
        "EN": "Only you see the vibe message every 60s"
    },
    "sevenDay": {
        "EN": "You may unilaterally end the relationship after 7 days of no contact"
    },
    "lastSeen": {
        "EN": "last: {0}d"
    },
    "lastNever": {
        "EN": "last: never"
    },
    "noLovers": {
        "EN": "No lovers"
    },
    "breakupBtn": {
        "EN": "Breakup"
    },
    "modalTitle": {
        "EN": "End relationship with {0}?"
    },
    "modalSub1": {
        "EN": "It is recommended to talk it over first."
    },
    "modalSub2": {
        "EN": "(This cannot be undone)"
    },
    "confirmBtn": {
        "EN": "Confirm"
    },
    "dPropose": {
        "EN": "(Send an extended lover proposal.)"
    },
    "dProposeR": {
        "EN": "(Proposal sent, awaiting response.)"
    },
    "dEngage": {
        "EN": "(Propose engagement.)"
    },
    "dEngageR": {
        "EN": "(Engagement proposal sent.)"
    },
    "dMarry": {
        "EN": "(Propose marriage.)"
    },
    "dMarryR": {
        "EN": "(Marriage proposal sent.)"
    },
    "dBreakup": {
        "EN": "(End extended lover relationship.)"
    },
    "dBreakupR": {
        "EN": "(Relationship ended.)"
    },
    "eventDate": {
        "EN": "{0} (#{1}) and {2} (#{3}) {4}."
    },
    "evDateTxt": {
        "EN": "became extended lovers"
    },
    "evEngTxt": {
        "EN": "upgraded to extended [{0}]"
    },
    "toastLoaded": {
        "EN": "🐈‍⬛ Abundantia Florum ─Chromatica─ v{0} loaded!"
    },
    "toastFail": {
        "EN": "🐈‍⬛ [AFC] Load failed. Please refresh the page."
    },
    "legacyDetected": {
        "EN": "🐈‍⬛ [AFC] Old/incompatible AFC data was detected and has been reset to defaults (lover locks were left untouched)."
    },
    "factoryTitle": {
        "EN": "Factory Reset"
    },
    "factoryModalTitle": {
        "EN": "Reset AFC to factory defaults?"
    },
    "factoryModalSub1": {
        "EN": "This dissolves ALL lover relationships and destroys ALL lover locks."
    },
    "factoryModalSub2": {
        "EN": "This is IRREVERSIBLE."
    },
    "factoryConfirm": {
        "EN": "Confirm Reset"
    },
    "factoryDone": {
        "EN": "🐈‍⬛ [AFC] AFC has been reset to factory defaults."
    },
    "restoreTitle": {
        "EN": "Lover Data Restore"
    },
    "restoreOnline": {
        "EN": "Online Data"
    },
    "restoreBackup": {
        "EN": "Backup Data"
    },
    "restoreBtn": {
        "EN": "Restore"
    },
    "restoreAllBtn": {
        "EN": "Use All This Data"
    },
    "restoreEmpty": {
        "EN": "(No data)"
    },
    "restoreConfirm1": {
        "EN": "Restore {0}'s data?"
    },
    "restoreConfirmBtn": {
        "EN": "Confirm Restore"
    },
    "restoreConfirmAll": {
        "EN": "Use all data from {0}?"
    },
    "restoreOKMsg": {
        "EN": "Restored {0} lover(s)"
    },
    "dbMismatchLoss": {
        "EN": "Extended-lover data may be lost (online list is empty but a local backup exists). Open AFC Settings → Restore to recover, or ignore if this is a new device."
    },
    "dbMismatchDiff": {
        "EN": "Your online extended-lover list differs from the local backup. Open AFC Settings → Restore to reconcile manually; nothing is overwritten automatically."
    },
    "becameLovers": {
        "EN": "{0} (#{1}) and {2} (#{3}) became extended lovers."
    },
    "upgradedEngaged": {
        "EN": "{0} (#{1}) and {2} (#{3}) upgraded their extended relationship to [engaged]."
    },
    "upgradedMarried": {
        "EN": "{0} (#{1}) and {2} (#{3}) upgraded their extended relationship to [married]."
    }
});
    L.register('hl', {
    "tabOverview": {
        "EN": "Overview"
    },
    "tabNote": {
        "EN": "Note"
    },
    "tabTimer": {
        "EN": "Timer"
    },
    "tabControl": {
        "EN": "Control"
    },
    "tabUnlock": {
        "EN": "Unlock"
    },
    "unlockTitle": {
        "EN": "♥ Unlock Confirm ♥"
    },
    "unlockWarn1": {
        "EN": "Unlocking will permanently delete all settings (notes, timer, vibe)."
    },
    "unlockWarn2": {
        "EN": "Please confirm that the wearer agrees to unlock."
    },
    "unlockOwner": {
        "EN": "Lock owner:"
    },
    "unlockNoRight": {
        "EN": "Only the lock owner or the wearer's lovers can unlock."
    },
    "unlockConfirm": {
        "EN": "Confirm Unlock"
    },
    "unlockCancel": {
        "EN": "Cancel"
    },
    "unlockPending": {
        "EN": "Unlock request sent to owner, please wait…"
    },
    "noteTitle": {
        "EN": "♥ Love Note ♥"
    },
    "timerTitle": {
        "EN": "♥ Timer ♥"
    },
    "controlTitle": {
        "EN": "♥ Control ♥"
    },
    "noteHeader": {
        "EN": "♥ Note ♥"
    },
    "noConfig": {
        "EN": "No configuration."
    },
    "noTimer": {
        "EN": "No timer"
    },
    "noTimerSet": {
        "EN": "N/A"
    },
    "ownerOnlyEdit": {
        "EN": "Only the lock owner can edit."
    },
    "ownerOnlyTimer": {
        "EN": "Only the lock owner can set the timer."
    },
    "ownerOnlyCtrl": {
        "EN": "Only the lock owner can change settings."
    },
    "maxChars": {
        "EN": "max 500 chars"
    },
    "editNote": {
        "EN": "✏ Edit Note"
    },
    "setTimer": {
        "EN": "Set Timer"
    },
    "clearTimer": {
        "EN": "Clear Timer"
    },
    "settings": {
        "EN": "⚙ Settings"
    },
    "editingHint": {
        "EN": "Editing — click to change, then Save"
    },
    "vibStrength": {
        "EN": "Vibration Strength"
    },
    "restriction": {
        "EN": "Restriction"
    },
    "remain": {
        "EN": "Remain:"
    },
    "until": {
        "EN": "Until:"
    },
    "adjust": {
        "EN": "Adjust:"
    },
    "noNote": {
        "EN": "(No note written yet…)"
    },
    "removeRestraints": {
        "EN": "Remove restraints on expiry"
    },
    "removeRestraintsSub": {
        "EN": "(Also removes all locked restraint items)"
    },
    "lockedBy": {
        "EN": "Locked by {0}"
    },
    "memberNum": {
        "EN": "Member #:"
    },
    "lockedLabel": {
        "EN": "Locked:"
    },
    "vibeLabel": {
        "EN": "Vibe:"
    },
    "controlLabel": {
        "EN": "Control:"
    },
    "vibeOff": {
        "EN": "Off"
    },
    "vibeLow": {
        "EN": "Low ♥"
    },
    "vibeMid": {
        "EN": "Med ♥♥"
    },
    "vibeHigh": {
        "EN": "High ♥♥♥"
    },
    "modeNormal": {
        "EN": "Normal"
    },
    "modeEdge": {
        "EN": "Edge ～"
    },
    "modeDeny": {
        "EN": "Deny ✕"
    },
    "settingsChanged": {
        "EN": "{0} changed the settings of {1}'s {2}."
    },
    "vibelow": {
        "EN": "{0}'s {1} emits a faint vibration."
    },
    "vibemid": {
        "EN": "{0}'s {1} vibrates."
    },
    "vibehigh": {
        "EN": "{0}'s {1} vibrates intensely."
    },
    "resistEscape": {
        "EN": "{0}'s {1} resisted the escape attempt."
    },
    "resistRestore": {
        "EN": "{0}'s {1} resisted external interference and restored automatically."
    },
    "protectDisabled": {
        "EN": "{0}'s {1} protection is temporarily disabled. Please contact the lock owner."
    },
    "pendingRestore": {
        "EN": "The {1} on {0} cannot be restored yet because a dependent item (e.g. an Echo restraint) has not loaded. It will retry on next login or page refresh."
    },
    "timerExpired": {
        "EN": "The {1} on {0} dissolves into a gentle shimmer as the promised moment arrives."
    },
    "unlockDone": {
        "EN": "{0} unlocked the {2} on {1}."
    }
});
})();
