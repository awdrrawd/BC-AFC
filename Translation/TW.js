// ════════════════════════════════════════
//  Liko - AFC 字庫 — TW（繁體中文）
//  一國一檔，含 afc（拓展戀人）與 hl（心形鎖）兩命名空間；位置式佔位 {0}{1}…
//  由 AFC 執行期 fetch 後 new Function 執行，自動註冊到共用引擎 window.Liko.__Sys_L10N__。
//  ★ 翻譯者請直接改這裡；改完 build 會複製到 public/Translation/ 部署。
// ════════════════════════════════════════
(function () {
    var Liko = (typeof window !== 'undefined') ? window.Liko : (typeof globalThis !== 'undefined' ? globalThis.Liko : null);
    var L = Liko && Liko.__Sys_L10N__;
    if (!L || !L.register) { console.error('[Liko AFC TW] L10N 引擎尚未載入'); return; }
    L.register('afc', {
    "prefButton": {
        "TW": "拓展戀人設定"
    },
    "notFriend": {
        "TW": "請先添加 {0} 為好友後重新提交申請。"
    },
    "notInstalled": {
        "TW": "{0} 尚未安裝插件，無法申請。"
    },
    "alreadyAFC": {
        "TW": "{0} 已是你的拓展戀人。"
    },
    "alreadyBC": {
        "TW": "{0} 已是你的原生戀人，不需要 AFC 申請。"
    },
    "cooldown": {
        "TW": "請等待 {0} 秒後再申請。"
    },
    "proposeSent": {
        "TW": "已向 {0} 發送拓展戀人申請，3 分鐘內有效..."
    },
    "proposeExpired": {
        "TW": "向 {0} 的申請已過期。"
    },
    "proposeAck": {
        "TW": "{0} 已收到你的申請。"
    },
    "proposeOK": {
        "TW": "{0} 接受了你的拓展戀人申請！"
    },
    "breakupSelf": {
        "TW": "你解除了與 {0} 的拓展戀人關係。"
    },
    "breakupOther": {
        "TW": "{0} 解除了與你的拓展戀人關係。"
    },
    "restoreSent": {
        "TW": "已向 {0} 發送關係恢復申請..."
    },
    "restoreOK": {
        "TW": "已與 {0} 恢復拓展戀人關係！"
    },
    "dRestore": {
        "TW": "(申請恢復拓展戀人關係。)"
    },
    "dRestoreR": {
        "TW": "(恢復申請已發送，請等待對方回應。)"
    },
    "stageSent": {
        "TW": "已向 {0} 發送 [{1}] 申請，3 分鐘內有效..."
    },
    "stageExpired": {
        "TW": "向 {0} 的 [{1}] 申請已過期。"
    },
    "stageOK": {
        "TW": "{0} 接受了你的 [{1}] 申請！"
    },
    "stageOKSelf": {
        "TW": "你接受了 {0} 的 [{1}] 申請！"
    },
    "stageDating": {
        "TW": "交往"
    },
    "stageEngaged": {
        "TW": "訂婚"
    },
    "stageMarried": {
        "TW": "結婚"
    },
    "propTitle": {
        "TW": "♥ {0} ({1}) 向你提出了拓展戀人申請！"
    },
    "stageTitle": {
        "TW": "💍 {0} ({1}) 向你提出了拓展戀人【{2}】申請！"
    },
    "bcTitle": {
        "TW": "💌 {0} ({1}) 向你提出了 BC 原生戀人申請！"
    },
    "bcNote": {
        "TW": "請前往【關係管理】確認申請，或等待申請自動過期。"
    },
    "timerText": {
        "TW": "剩餘 {0}:{1} 後自動取消"
    },
    "okBtn": {
        "TW": "同意"
    },
    "cancelBtn": {
        "TW": "取消"
    },
    "panelTitle": {
        "TW": "─── 拓展戀人 ───"
    },
    "panelEmpty": {
        "TW": "尚無拓展戀人"
    },
    "btnOpen": {
        "TW": "更多戀人 ({0})"
    },
    "btnClose": {
        "TW": "▲ 收起"
    },
    "dispTitle": {
        "TW": "──顯示設定──"
    },
    "mgmtTitle": {
        "TW": "──戀人管理──"
    },
    "sysTitle": {
        "TW": "──系統設定──"
    },
    "enableAFC": {
        "TW": "拓展戀人系統"
    },
    "enableAFCSub": {
        "TW": "拓展戀人"
    },
    "elLock": {
        "TW": "拓展戀人鎖"
    },
    "elLockSub": {
        "TW": "（開發中，尚未完成）"
    },
    "ownerLock": {
        "TW": "主人使用拓展鎖"
    },
    "ownerLockSub": {
        "TW": "啟用後，你的主人也可以使用拓展戀人鎖"
    },
    "onlineOn": {
        "TW": "線上狀態燈號 開啟"
    },
    "onlineOff": {
        "TW": "線上狀態燈號 關閉"
    },
    "onlineSub": {
        "TW": "在自己的 Profile 顯示戀人是否在線（綠點）"
    },
    "dateMode": {
        "TW": "日期模式"
    },
    "durMode": {
        "TW": "時長模式"
    },
    "dateSub": {
        "TW": "起始日期＋已交往天數"
    },
    "durSub": {
        "TW": "交往 X年X個月X天"
    },
    "vibeMsgLabel": {
        "TW": "震動信息"
    },
    "vibeMsgBcast": {
        "TW": "廣播"
    },
    "vibeSoundLabel": {
        "TW": "震動音效"
    },
    "vibeMsgSubOn": {
        "TW": "別人看的到，每60秒發送一次震動信息"
    },
    "vibeMsgSubOff": {
        "TW": "僅自己看的到，每60秒發送一次震動信息"
    },
    "sevenDay": {
        "TW": "超過7天沒見面時，可以單方面解除關係"
    },
    "lastSeen": {
        "TW": "最後：{0}天前"
    },
    "lastNever": {
        "TW": "最後：從未記錄"
    },
    "noLovers": {
        "TW": "暫無戀人資料"
    },
    "breakupBtn": {
        "TW": "解除關係"
    },
    "modalTitle": {
        "TW": "解除與 {0} 的拓展戀人關係？"
    },
    "modalSub1": {
        "TW": "建議與對方再談談看"
    },
    "modalSub2": {
        "TW": "（此操作不可逆）"
    },
    "confirmBtn": {
        "TW": "確認解除"
    },
    "dPropose": {
        "TW": "(提出拓展戀人申請。)"
    },
    "dProposeR": {
        "TW": "(申請已發送，請等待對方回應。)"
    },
    "dEngage": {
        "TW": "(向此人求訂婚。)"
    },
    "dEngageR": {
        "TW": "(訂婚申請已發送，請等待對方回應。)"
    },
    "dMarry": {
        "TW": "(向此人求婚。)"
    },
    "dMarryR": {
        "TW": "(求婚申請已發送，請等待對方回應。)"
    },
    "dBreakup": {
        "TW": "(解除拓展戀人關係。)"
    },
    "dBreakupR": {
        "TW": "(已解除拓展戀人關係。)"
    },
    "eventDate": {
        "TW": "{0} (#{1}) 與 {2} (#{3}) {4}。"
    },
    "evDateTxt": {
        "TW": "結為拓展戀人"
    },
    "evEngTxt": {
        "TW": "升格為拓展 [{0}]"
    },
    "toastLoaded": {
        "TW": "🐈‍⬛ Abundantia Florum ─Chromatica─ v{0} 載入完成！"
    },
    "toastFail": {
        "TW": "🐈‍⬛ [AFC] 載入失敗，請重新整理頁面。"
    },
    "legacyDetected": {
        "TW": "🐈‍⬛ [AFC] 偵測到不相容的舊版 AFC 資料，已重置為預設（戀人鎖未受影響）。"
    },
    "factoryTitle": {
        "TW": "初廠設定"
    },
    "factoryModalTitle": {
        "TW": "將 AFC 回復初廠設定？"
    },
    "factoryModalSub1": {
        "TW": "這會解除所有戀人關係、並破壞所有戀人鎖。"
    },
    "factoryModalSub2": {
        "TW": "此操作不可逆。"
    },
    "factoryConfirm": {
        "TW": "確認重置"
    },
    "factoryDone": {
        "TW": "🐈‍⬛ [AFC] AFC 已回復初廠設定。"
    },
    "restoreTitle": {
        "TW": "戀人資料復原"
    },
    "restoreOnline": {
        "TW": "線上資料"
    },
    "restoreBackup": {
        "TW": "備份資料"
    },
    "restoreBtn": {
        "TW": "復原"
    },
    "restoreAllBtn": {
        "TW": "全部使用此資料"
    },
    "restoreEmpty": {
        "TW": "（無資料）"
    },
    "restoreConfirm1": {
        "TW": "確認復原 {0} 的資料？"
    },
    "restoreConfirmBtn": {
        "TW": "確認復原"
    },
    "restoreConfirmAll": {
        "TW": "確認使用 {0} 的全部資料？"
    },
    "restoreOKMsg": {
        "TW": "已復原 {0} 筆戀人資料"
    },
    "dbMismatchLoss": {
        "TW": "偵測到拓展戀人資料可能丟失（線上資料為空，但本機存有備份）。請至「拓展戀人設定 → 復原」確認要還原，或忽略（若這是新裝置）。"
    },
    "dbMismatchDiff": {
        "TW": "偵測到線上拓展戀人資料與本機備份不一致。請至「拓展戀人設定 → 復原」自行確認，系統不會自動覆蓋任何一方。"
    },
    "becameLovers": {
        "TW": "{0} (#{1}) 與 {2} (#{3}) 結為拓展戀人。"
    },
    "upgradedEngaged": {
        "TW": "{0} (#{1}) 與 {2} (#{3}) 升格為拓展 [訂婚]。"
    },
    "upgradedMarried": {
        "TW": "{0} (#{1}) 與 {2} (#{3}) 升格為拓展 [結婚]。"
    }
});
    L.register('hl', {
    "tabOverview": {
        "TW": "總覽"
    },
    "tabNote": {
        "TW": "筆記"
    },
    "tabTimer": {
        "TW": "計時器"
    },
    "tabControl": {
        "TW": "控制"
    },
    "tabUnlock": {
        "TW": "解鎖"
    },
    "unlockTitle": {
        "TW": "♥ 解鎖確認 ♥"
    },
    "unlockWarn1": {
        "TW": "解鎖後，所有設定（筆記、計時器、震動設定）將永久刪除，"
    },
    "unlockWarn2": {
        "TW": "請確認對方同意解開此鎖。"
    },
    "unlockOwner": {
        "TW": "鎖主："
    },
    "unlockNoRight": {
        "TW": "只有鎖主或與穿戴者的戀人才能解鎖。"
    },
    "unlockConfirm": {
        "TW": "確認解鎖"
    },
    "unlockCancel": {
        "TW": "取消"
    },
    "unlockPending": {
        "TW": "已發送解鎖請求給鎖主，請等待…"
    },
    "noteTitle": {
        "TW": "♥ 愛情筆記 ♥"
    },
    "timerTitle": {
        "TW": "♥ 計時器 ♥"
    },
    "controlTitle": {
        "TW": "♥ 控制 ♥"
    },
    "noteHeader": {
        "TW": "♥ 筆記 ♥"
    },
    "noConfig": {
        "TW": "尚無設定。"
    },
    "noTimer": {
        "TW": "無計時器"
    },
    "noTimerSet": {
        "TW": "N/A"
    },
    "ownerOnlyEdit": {
        "TW": "只有鎖主可以編輯。"
    },
    "ownerOnlyTimer": {
        "TW": "只有鎖主可以設置計時器。"
    },
    "ownerOnlyCtrl": {
        "TW": "只有鎖主可以更改設定。"
    },
    "maxChars": {
        "TW": "最多 500 字"
    },
    "editNote": {
        "TW": "✏ 編輯筆記"
    },
    "setTimer": {
        "TW": "設置計時器"
    },
    "clearTimer": {
        "TW": "清除計時器"
    },
    "settings": {
        "TW": "⚙ 設定"
    },
    "editingHint": {
        "TW": "編輯中 — 點擊修改，再儲存"
    },
    "vibStrength": {
        "TW": "震動強度"
    },
    "restriction": {
        "TW": "限制"
    },
    "remain": {
        "TW": "剩餘："
    },
    "until": {
        "TW": "截止："
    },
    "adjust": {
        "TW": "調整："
    },
    "noNote": {
        "TW": "（尚未撰寫筆記…）"
    },
    "removeRestraints": {
        "TW": "時間到時移除拘束"
    },
    "removeRestraintsSub": {
        "TW": "(同時移除所有被鎖住的拘束物品)"
    },
    "lockedBy": {
        "TW": "被{0}鎖住了"
    },
    "memberNum": {
        "TW": "成員編號："
    },
    "lockedLabel": {
        "TW": "鎖定："
    },
    "vibeLabel": {
        "TW": "震動："
    },
    "controlLabel": {
        "TW": "高潮控制："
    },
    "vibeOff": {
        "TW": "關閉"
    },
    "vibeLow": {
        "TW": "低 ♥"
    },
    "vibeMid": {
        "TW": "中 ♥♥"
    },
    "vibeHigh": {
        "TW": "高 ♥♥♥"
    },
    "modeNormal": {
        "TW": "正常"
    },
    "modeEdge": {
        "TW": "邊緣 ～"
    },
    "modeDeny": {
        "TW": "拒絕 ✕"
    },
    "settingsChanged": {
        "TW": "{0}更改了{1}身上的{2}的設定。"
    },
    "vibelow": {
        "TW": "{0}身上的{1}發出輕微的震動聲"
    },
    "vibemid": {
        "TW": "{0}身上的{1}發出震動聲"
    },
    "vibehigh": {
        "TW": "{0}身上的{1}發出激烈的震動聲"
    },
    "resistEscape": {
        "TW": "{0}身上的{1}抵禦了掙脫嘗試。"
    },
    "resistRestore": {
        "TW": "{0}身上的{1}抵禦了外部干擾，自動復原。"
    },
    "protectDisabled": {
        "TW": "{0}的{1}防護暫時停用，請聯繫鎖主處理衝突。"
    },
    "pendingRestore": {
        "TW": "{0}身上的{1}因相依物件（如 Echo 拘束）尚未載入而無法復原，將於下次登入或刷新遊戲後自動嘗試。"
    },
    "timerExpired": {
        "TW": "{0}身上的{1}隨約定時刻到來，化作點點微光悄然消散。"
    },
    "unlockDone": {
        "TW": "{0}解開了{1}身上的{2}。"
    }
});
})();
