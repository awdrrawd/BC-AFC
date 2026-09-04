// ════════════════════════════════════════
//  AFC i18n 內建後備（TW + EN）— 自動產生，請勿手改。
//  真正的翻譯來源在根目錄 Translation/<namespace>/<LANG>.json（執行期 fetch，載入後會覆蓋此後備）。
//  作用：Translation 尚未載入或 fetch 失敗（離線）時，UI 不會顯示 raw key。
// ════════════════════════════════════════
import { L10N } from './l10n.js';

const AFC_FALLBACK = {
    "prefButton": {
        "TW": "拓展戀人設定",
        "EN": "AFC Settings"
    },
    "notFriend": {
        "TW": "請先添加 {0} 為好友後重新提交申請。",
        "EN": "Please add {0} as a friend first, then re-submit."
    },
    "notInstalled": {
        "TW": "{0} 尚未安裝插件，無法申請。",
        "EN": "{0} doesn't have the plugin installed."
    },
    "alreadyAFC": {
        "TW": "{0} 已是你的拓展戀人。",
        "EN": "{0} is already your extended lover."
    },
    "alreadyBC": {
        "TW": "{0} 已是你的原生戀人，不需要 AFC 申請。",
        "EN": "{0} is already your native BC lover."
    },
    "cooldown": {
        "TW": "請等待 {0} 秒後再申請。",
        "EN": "Please wait {0}s before proposing again."
    },
    "proposeSent": {
        "TW": "已向 {0} 發送拓展戀人申請，3 分鐘內有效...",
        "EN": "Proposal sent to {0}, valid for 3 min..."
    },
    "proposeExpired": {
        "TW": "向 {0} 的申請已過期。",
        "EN": "Proposal to {0} has expired."
    },
    "proposeAck": {
        "TW": "{0} 已收到你的申請。",
        "EN": "{0} received your proposal."
    },
    "proposeOK": {
        "TW": "{0} 接受了你的拓展戀人申請！",
        "EN": "{0} accepted your extended lover proposal!"
    },
    "breakupSelf": {
        "TW": "你解除了與 {0} 的拓展戀人關係。",
        "EN": "You ended the extended lover relationship with {0}."
    },
    "breakupOther": {
        "TW": "{0} 解除了與你的拓展戀人關係。",
        "EN": "{0} ended the extended lover relationship with you."
    },
    "restoreSent": {
        "TW": "已向 {0} 發送關係恢復申請...",
        "EN": "Relationship restore request sent to {0}..."
    },
    "restoreOK": {
        "TW": "已與 {0} 恢復拓展戀人關係！",
        "EN": "Extended lover relationship with {0} restored!"
    },
    "dRestore": {
        "TW": "(申請恢復拓展戀人關係。)",
        "EN": "(Request to restore extended lover relationship.)"
    },
    "dRestoreR": {
        "TW": "(恢復申請已發送，請等待對方回應。)",
        "EN": "(Restore request sent, awaiting response.)"
    },
    "stageSent": {
        "TW": "已向 {0} 發送 [{1}] 申請，3 分鐘內有效...",
        "EN": "[{1}] proposal sent to {0}, valid for 3 min..."
    },
    "stageExpired": {
        "TW": "向 {0} 的 [{1}] 申請已過期。",
        "EN": "[{1}] proposal to {0} has expired."
    },
    "stageOK": {
        "TW": "{0} 接受了你的 [{1}] 申請！",
        "EN": "{0} accepted your [{1}] proposal!"
    },
    "stageOKSelf": {
        "TW": "你接受了 {0} 的 [{1}] 申請！",
        "EN": "You accepted {0}'s [{1}] proposal!"
    },
    "stageDating": {
        "TW": "交往",
        "EN": "dating"
    },
    "stageEngaged": {
        "TW": "訂婚",
        "EN": "engaged"
    },
    "stageMarried": {
        "TW": "結婚",
        "EN": "married"
    },
    "propTitle": {
        "TW": "♥ {0} ({1}) 向你提出了拓展戀人申請！",
        "EN": "♥ {0} ({1}) has proposed an extended lover relationship!"
    },
    "stageTitle": {
        "TW": "💍 {0} ({1}) 向你提出了拓展戀人【{2}】申請！",
        "EN": "💍 {0} ({1}) has proposed: [{2}]!"
    },
    "bcTitle": {
        "TW": "💌 {0} ({1}) 向你提出了 BC 原生戀人申請！",
        "EN": "💌 {0} ({1}) sent a BC native lover request!"
    },
    "bcNote": {
        "TW": "請前往【關係管理】確認申請，或等待申請自動過期。",
        "EN": "Go to Relationship Management to accept, or let it expire."
    },
    "timerText": {
        "TW": "剩餘 {0}:{1} 後自動取消",
        "EN": "Auto-cancels in {0}:{1}"
    },
    "okBtn": {
        "TW": "同意",
        "EN": "Accept"
    },
    "cancelBtn": {
        "TW": "取消",
        "EN": "Decline"
    },
    "panelTitle": {
        "TW": "─── 拓展戀人 ───",
        "EN": "─── Extended Lovers ───"
    },
    "panelEmpty": {
        "TW": "尚無拓展戀人",
        "EN": "No extended lovers yet"
    },
    "btnOpen": {
        "TW": "更多戀人 ({0})",
        "EN": "More loves ({0})"
    },
    "btnClose": {
        "TW": "▲ 收起",
        "EN": "▲ Close"
    },
    "dispTitle": {
        "TW": "──顯示設定──",
        "EN": "──Display──"
    },
    "mgmtTitle": {
        "TW": "──戀人管理──",
        "EN": "──Lovers──"
    },
    "sysTitle": {
        "TW": "──系統設定──",
        "EN": "──System──"
    },
    "enableAFC": {
        "TW": "拓展戀人系統",
        "EN": "Extended Lover System"
    },
    "enableAFCSub": {
        "TW": "拓展戀人",
        "EN": "Extended Lovers"
    },
    "elLock": {
        "TW": "拓展戀人鎖",
        "EN": "Extended Lover Lock"
    },
    "elLockSub": {
        "TW": "（開發中，尚未完成）",
        "EN": "(Under development)"
    },
    "ownerLock": {
        "TW": "主人使用拓展鎖",
        "EN": "Owner can use AFC Lock"
    },
    "ownerLockSub": {
        "TW": "啟用後，你的主人也可以使用拓展戀人鎖",
        "EN": "When enabled, your owner may also apply the Extended Lover Lock"
    },
    "onlineOn": {
        "TW": "線上狀態燈號 開啟",
        "EN": "Online indicator  ON"
    },
    "onlineOff": {
        "TW": "線上狀態燈號 關閉",
        "EN": "Online indicator  OFF"
    },
    "onlineSub": {
        "TW": "在自己的 Profile 顯示戀人是否在線（綠點）",
        "EN": "Show online status dots on your own Profile"
    },
    "dateMode": {
        "TW": "日期模式",
        "EN": "Date mode"
    },
    "durMode": {
        "TW": "時長模式",
        "EN": "Duration mode"
    },
    "dateSub": {
        "TW": "起始日期＋已交往天數",
        "EN": "Start date + days together"
    },
    "durSub": {
        "TW": "交往 X年X個月X天",
        "EN": "X years X months X days"
    },
    "vibeMsgLabel": {
        "TW": "震動信息",
        "EN": "Vibe message"
    },
    "vibeMsgBcast": {
        "TW": "廣播",
        "EN": "Broadcast"
    },
    "vibeSoundLabel": {
        "TW": "震動音效",
        "EN": "Sound effect"
    },
    "vibeMsgSubOn": {
        "TW": "別人看的到，每60秒發送一次震動信息",
        "EN": "Others can see the vibe message every 60s"
    },
    "vibeMsgSubOff": {
        "TW": "僅自己看的到，每60秒發送一次震動信息",
        "EN": "Only you see the vibe message every 60s"
    },
    "sevenDay": {
        "TW": "超過7天沒見面時，可以單方面解除關係",
        "EN": "You may unilaterally end the relationship after 7 days of no contact"
    },
    "lastSeen": {
        "TW": "最後：{0}天前",
        "EN": "last: {0}d"
    },
    "lastNever": {
        "TW": "最後：從未記錄",
        "EN": "last: never"
    },
    "noLovers": {
        "TW": "暫無戀人資料",
        "EN": "No lovers"
    },
    "breakupBtn": {
        "TW": "解除關係",
        "EN": "Breakup"
    },
    "modalTitle": {
        "TW": "解除與 {0} 的拓展戀人關係？",
        "EN": "End relationship with {0}?"
    },
    "modalSub1": {
        "TW": "建議與對方再談談看",
        "EN": "It is recommended to talk it over first."
    },
    "modalSub2": {
        "TW": "（此操作不可逆）",
        "EN": "(This cannot be undone)"
    },
    "confirmBtn": {
        "TW": "確認解除",
        "EN": "Confirm"
    },
    "dPropose": {
        "TW": "(提出拓展戀人申請。)",
        "EN": "(Send an extended lover proposal.)"
    },
    "dProposeR": {
        "TW": "(申請已發送，請等待對方回應。)",
        "EN": "(Proposal sent, awaiting response.)"
    },
    "dEngage": {
        "TW": "(向此人求訂婚。)",
        "EN": "(Propose engagement.)"
    },
    "dEngageR": {
        "TW": "(訂婚申請已發送，請等待對方回應。)",
        "EN": "(Engagement proposal sent.)"
    },
    "dMarry": {
        "TW": "(向此人求婚。)",
        "EN": "(Propose marriage.)"
    },
    "dMarryR": {
        "TW": "(求婚申請已發送，請等待對方回應。)",
        "EN": "(Marriage proposal sent.)"
    },
    "dBreakup": {
        "TW": "(解除拓展戀人關係。)",
        "EN": "(End extended lover relationship.)"
    },
    "dBreakupR": {
        "TW": "(已解除拓展戀人關係。)",
        "EN": "(Relationship ended.)"
    },
    "eventDate": {
        "TW": "{0} (#{1}) 與 {2} (#{3}) {4}。",
        "EN": "{0} (#{1}) and {2} (#{3}) {4}."
    },
    "evDateTxt": {
        "TW": "結為拓展戀人",
        "EN": "became extended lovers"
    },
    "evEngTxt": {
        "TW": "升格為拓展 [{0}]",
        "EN": "upgraded to extended [{0}]"
    },
    "toastLoaded": {
        "TW": "🐈‍⬛ Abundantia Florum ─Chromatica─ v{0} 載入完成！",
        "EN": "🐈‍⬛ Abundantia Florum ─Chromatica─ v{0} loaded!"
    },
    "toastFail": {
        "TW": "🐈‍⬛ [AFC] 載入失敗，請重新整理頁面。",
        "EN": "🐈‍⬛ [AFC] Load failed. Please refresh the page."
    },
    "factoryTitle": {
        "TW": "初廠設定",
        "EN": "Factory Reset"
    },
    "factoryModalTitle": {
        "TW": "將 AFC 回復初廠設定？",
        "EN": "Reset AFC to factory defaults?"
    },
    "factoryModalSub1": {
        "TW": "這會解除所有戀人關係、並破壞所有戀人鎖。",
        "EN": "This dissolves ALL lover relationships and destroys ALL lover locks."
    },
    "factoryModalSub2": {
        "TW": "此操作不可逆。",
        "EN": "This is IRREVERSIBLE."
    },
    "factoryConfirm": {
        "TW": "確認重置",
        "EN": "Confirm Reset"
    },
    "factoryDone": {
        "TW": "🐈‍⬛ [AFC] AFC 已回復初廠設定。",
        "EN": "🐈‍⬛ [AFC] AFC has been reset to factory defaults."
    },
    "restoreTitle": {
        "TW": "戀人資料復原",
        "EN": "Lover Data Restore"
    },
    "restoreOnline": {
        "TW": "線上資料",
        "EN": "Online Data"
    },
    "restoreBackup": {
        "TW": "備份資料",
        "EN": "Backup Data"
    },
    "restoreBtn": {
        "TW": "復原",
        "EN": "Restore"
    },
    "restoreAllBtn": {
        "TW": "全部使用此資料",
        "EN": "Use All This Data"
    },
    "restoreEmpty": {
        "TW": "（無資料）",
        "EN": "(No data)"
    },
    "restoreConfirm1": {
        "TW": "確認復原 {0} 的資料？",
        "EN": "Restore {0}'s data?"
    },
    "restoreConfirmBtn": {
        "TW": "確認復原",
        "EN": "Confirm Restore"
    },
    "restoreConfirmAll": {
        "TW": "確認使用 {0} 的全部資料？",
        "EN": "Use all data from {0}?"
    },
    "restoreOKMsg": {
        "TW": "已復原 {0} 筆戀人資料",
        "EN": "Restored {0} lover(s)"
    },
    "dbMismatchLoss": {
        "TW": "偵測到拓展戀人資料可能丟失（線上資料為空，但本機存有備份）。請至「拓展戀人設定 → 復原」確認要還原，或忽略（若這是新裝置）。",
        "EN": "Extended-lover data may be lost (online list is empty but a local backup exists). Open AFC Settings → Restore to recover, or ignore if this is a new device."
    },
    "dbMismatchDiff": {
        "TW": "偵測到線上拓展戀人資料與本機備份不一致。請至「拓展戀人設定 → 復原」自行確認，系統不會自動覆蓋任何一方。",
        "EN": "Your online extended-lover list differs from the local backup. Open AFC Settings → Restore to reconcile manually; nothing is overwritten automatically."
    },
    "becameLovers": {
        "TW": "{0} (#{1}) 與 {2} (#{3}) 結為拓展戀人。",
        "EN": "{0} (#{1}) and {2} (#{3}) became extended lovers."
    },
    "upgradedEngaged": {
        "TW": "{0} (#{1}) 與 {2} (#{3}) 升格為拓展 [訂婚]。",
        "EN": "{0} (#{1}) and {2} (#{3}) upgraded their extended relationship to [engaged]."
    },
    "upgradedMarried": {
        "TW": "{0} (#{1}) 與 {2} (#{3}) 升格為拓展 [結婚]。",
        "EN": "{0} (#{1}) and {2} (#{3}) upgraded their extended relationship to [married]."
    }
};
const HL_FALLBACK = {
    "tabOverview": {
        "TW": "總覽",
        "EN": "Overview"
    },
    "tabNote": {
        "TW": "筆記",
        "EN": "Note"
    },
    "tabTimer": {
        "TW": "計時器",
        "EN": "Timer"
    },
    "tabControl": {
        "TW": "控制",
        "EN": "Control"
    },
    "tabUnlock": {
        "TW": "解鎖",
        "EN": "Unlock"
    },
    "unlockTitle": {
        "TW": "♥ 解鎖確認 ♥",
        "EN": "♥ Unlock Confirm ♥"
    },
    "unlockWarn1": {
        "TW": "解鎖後，所有設定（筆記、計時器、震動設定）將永久刪除，",
        "EN": "Unlocking will permanently delete all settings (notes, timer, vibe)."
    },
    "unlockWarn2": {
        "TW": "請確認對方同意解開此鎖。",
        "EN": "Please confirm that the wearer agrees to unlock."
    },
    "unlockOwner": {
        "TW": "鎖主：",
        "EN": "Lock owner:"
    },
    "unlockNoRight": {
        "TW": "只有鎖主或與穿戴者的戀人才能解鎖。",
        "EN": "Only the lock owner or the wearer's lovers can unlock."
    },
    "unlockConfirm": {
        "TW": "確認解鎖",
        "EN": "Confirm Unlock"
    },
    "unlockCancel": {
        "TW": "取消",
        "EN": "Cancel"
    },
    "noteTitle": {
        "TW": "♥ 愛情筆記 ♥",
        "EN": "♥ Love Note ♥"
    },
    "timerTitle": {
        "TW": "♥ 計時器 ♥",
        "EN": "♥ Timer ♥"
    },
    "controlTitle": {
        "TW": "♥ 控制 ♥",
        "EN": "♥ Control ♥"
    },
    "noteHeader": {
        "TW": "♥ 筆記 ♥",
        "EN": "♥ Note ♥"
    },
    "noConfig": {
        "TW": "尚無設定。",
        "EN": "No configuration."
    },
    "noTimer": {
        "TW": "無計時器",
        "EN": "No timer"
    },
    "noTimerSet": {
        "TW": "N/A",
        "EN": "N/A"
    },
    "ownerOnlyEdit": {
        "TW": "只有鎖主可以編輯。",
        "EN": "Only the lock owner can edit."
    },
    "ownerOnlyTimer": {
        "TW": "只有鎖主可以設置計時器。",
        "EN": "Only the lock owner can set the timer."
    },
    "ownerOnlyCtrl": {
        "TW": "只有鎖主可以更改設定。",
        "EN": "Only the lock owner can change settings."
    },
    "maxChars": {
        "TW": "最多 500 字",
        "EN": "max 500 chars"
    },
    "editNote": {
        "TW": "✏ 編輯筆記",
        "EN": "✏ Edit Note"
    },
    "setTimer": {
        "TW": "設置計時器",
        "EN": "Set Timer"
    },
    "clearTimer": {
        "TW": "清除計時器",
        "EN": "Clear Timer"
    },
    "settings": {
        "TW": "⚙ 設定",
        "EN": "⚙ Settings"
    },
    "editingHint": {
        "TW": "編輯中 — 點擊修改，再儲存",
        "EN": "Editing — click to change, then Save"
    },
    "vibStrength": {
        "TW": "震動強度",
        "EN": "Vibration Strength"
    },
    "restriction": {
        "TW": "限制",
        "EN": "Restriction"
    },
    "remain": {
        "TW": "剩餘：",
        "EN": "Remain:"
    },
    "until": {
        "TW": "截止：",
        "EN": "Until:"
    },
    "adjust": {
        "TW": "調整：",
        "EN": "Adjust:"
    },
    "noNote": {
        "TW": "（尚未撰寫筆記…）",
        "EN": "(No note written yet…)"
    },
    "removeRestraints": {
        "TW": "時間到時移除拘束",
        "EN": "Remove restraints on expiry"
    },
    "removeRestraintsSub": {
        "TW": "(同時移除所有被鎖住的拘束物品)",
        "EN": "(Also removes all locked restraint items)"
    },
    "lockedBy": {
        "TW": "被{0}鎖住了",
        "EN": "Locked by {0}"
    },
    "memberNum": {
        "TW": "成員編號：",
        "EN": "Member #:"
    },
    "lockedLabel": {
        "TW": "鎖定：",
        "EN": "Locked:"
    },
    "vibeLabel": {
        "TW": "震動：",
        "EN": "Vibe:"
    },
    "controlLabel": {
        "TW": "高潮控制：",
        "EN": "Control:"
    },
    "vibeOff": {
        "TW": "關閉",
        "EN": "Off"
    },
    "vibeLow": {
        "TW": "低 ♥",
        "EN": "Low ♥"
    },
    "vibeMid": {
        "TW": "中 ♥♥",
        "EN": "Med ♥♥"
    },
    "vibeHigh": {
        "TW": "高 ♥♥♥",
        "EN": "High ♥♥♥"
    },
    "modeNormal": {
        "TW": "正常",
        "EN": "Normal"
    },
    "modeEdge": {
        "TW": "邊緣 ～",
        "EN": "Edge ～"
    },
    "modeDeny": {
        "TW": "拒絕 ✕",
        "EN": "Deny ✕"
    },
    "settingsChanged": {
        "TW": "{0}更改了{1}身上的{2}的設定。",
        "EN": "{0} changed the settings of {1}'s {2}."
    },
    "vibelow": {
        "TW": "{0}身上的{1}發出輕微的震動聲",
        "EN": "{0}'s {1} emits a faint vibration."
    },
    "vibemid": {
        "TW": "{0}身上的{1}發出震動聲",
        "EN": "{0}'s {1} vibrates."
    },
    "vibehigh": {
        "TW": "{0}身上的{1}發出激烈的震動聲",
        "EN": "{0}'s {1} vibrates intensely."
    },
    "resistEscape": {
        "TW": "{0}身上的{1}抵禦了掙脫嘗試。",
        "EN": "{0}'s {1} resisted the escape attempt."
    },
    "resistRestore": {
        "TW": "{0}身上的{1}抵禦了外部干擾，自動復原。",
        "EN": "{0}'s {1} resisted external interference and restored automatically."
    },
    "protectDisabled": {
        "TW": "{0}的{1}防護暫時停用，請聯繫鎖主處理衝突。",
        "EN": "{0}'s {1} protection is temporarily disabled. Please contact the lock owner."
    },
    "pendingRestore": {
        "TW": "{0}身上的{1}因相依物件（如 Echo 拘束）尚未載入而無法復原，將於下次登入或刷新遊戲後自動嘗試。",
        "EN": "The {1} on {0} cannot be restored yet because a dependent item (e.g. an Echo restraint) has not loaded. It will retry on next login or page refresh."
    },
    "timerExpired": {
        "TW": "{0}身上的{1}隨約定時刻到來，化作點點微光悄然消散。",
        "EN": "The {1} on {0} dissolves into a gentle shimmer as the promised moment arrives."
    },
    "unlockDone": {
        "TW": "{0}解開了{1}身上的{2}。",
        "EN": "{0} unlocked the {2} on {1}."
    },
    "dbRestoreAnomaly": {
        "TW": "⚠ {0}的心鎖線上資料異常遺失，已由本機後備還原以下部位：{1}。若非你本人操作，請與鎖主確認。",
        "EN": "⚠ {0}'s HeartLock online data was abnormally lost and has been restored from the local backup for: {1}. If this was not you, please check with the lock owner."
    }
};

export function registerFallback() {
    L10N.register('afc', AFC_FALLBACK);
    L10N.register('hl', HL_FALLBACK);
}
