// ════════════════════════════════════════
//  Liko - AFC 字庫 — CN（简体中文）
//  一國一檔，含 afc（拓展戀人）與 hl（心形鎖）兩命名空間；位置式佔位 {0}{1}…
//  由 AFC 執行期 fetch 後 new Function 執行，自動註冊到共用引擎 window.Liko.__Sys_L10N__。
//  ★ 翻譯者請直接改這裡；改完 build 會複製到 public/Translation/ 部署。
// ════════════════════════════════════════
(function () {
    var Liko = (typeof window !== 'undefined') ? window.Liko : (typeof globalThis !== 'undefined' ? globalThis.Liko : null);
    var L = Liko && Liko.__Sys_L10N__;
    if (!L || !L.register) { console.error('[Liko AFC CN] L10N 引擎尚未載入'); return; }
    L.register('afc', {
    "prefButton": {
        "CN": "拓展恋人设置"
    },
    "notFriend": {
        "CN": "请先添加 {0} 为好友后重新提交申请。"
    },
    "notInstalled": {
        "CN": "{0} 尚未安装插件，无法申请。"
    },
    "alreadyAFC": {
        "CN": "{0} 已是你的拓展恋人。"
    },
    "alreadyBC": {
        "CN": "{0} 已是你的原生恋人，不需要 AFC 申请。"
    },
    "cooldown": {
        "CN": "请等待 {0} 秒后再申请。"
    },
    "proposeSent": {
        "CN": "已向 {0} 发送拓展恋人申请，3 分钟内有效..."
    },
    "proposeExpired": {
        "CN": "向 {0} 的申请已过期。"
    },
    "proposeAck": {
        "CN": "{0} 已收到你的申请。"
    },
    "proposeOK": {
        "CN": "{0} 接受了你的拓展恋人申请！"
    },
    "breakupSelf": {
        "CN": "你解除了与 {0} 的拓展恋人关系。"
    },
    "breakupOther": {
        "CN": "{0} 解除了与你的拓展恋人关系。"
    },
    "restoreSent": {
        "CN": "已向 {0} 发送关系恢复申请..."
    },
    "restoreOK": {
        "CN": "已与 {0} 恢复拓展恋人关系！"
    },
    "dRestore": {
        "CN": "(申请恢复拓展恋人关系。)"
    },
    "dRestoreR": {
        "CN": "(恢复申请已发送，请等待对方回应。)"
    },
    "stageSent": {
        "CN": "已向 {0} 发送 [{1}] 申请，3 分钟内有效..."
    },
    "stageExpired": {
        "CN": "向 {0} 的 [{1}] 申请已过期。"
    },
    "stageOK": {
        "CN": "{0} 接受了你的 [{1}] 申请！"
    },
    "stageOKSelf": {
        "CN": "你接受了 {0} 的 [{1}] 申请！"
    },
    "stageDating": {
        "CN": "交往"
    },
    "stageEngaged": {
        "CN": "订婚"
    },
    "stageMarried": {
        "CN": "结婚"
    },
    "propTitle": {
        "CN": "♥ {0} ({1}) 向你提出了拓展恋人申请！"
    },
    "stageTitle": {
        "CN": "💍 {0} ({1}) 向你提出了拓展恋人【{2}】申请！"
    },
    "bcTitle": {
        "CN": "💌 {0} ({1}) 向你提出了 BC 原生恋人申请！"
    },
    "bcNote": {
        "CN": "请前往【关系管理】确认申请，或等待申请自动过期。"
    },
    "timerText": {
        "CN": "剩余 {0}:{1} 后自动取消"
    },
    "okBtn": {
        "CN": "同意"
    },
    "cancelBtn": {
        "CN": "取消"
    },
    "panelTitle": {
        "CN": "─── 拓展恋人 ───"
    },
    "panelEmpty": {
        "CN": "尚无拓展恋人"
    },
    "btnOpen": {
        "CN": "更多恋人 ({0})"
    },
    "btnClose": {
        "CN": "▲ 收起"
    },
    "dispTitle": {
        "CN": "──显示设置──"
    },
    "mgmtTitle": {
        "CN": "──恋人管理──"
    },
    "sysTitle": {
        "CN": "──系统设置──"
    },
    "enableAFC": {
        "CN": "拓展恋人系统"
    },
    "enableAFCSub": {
        "CN": "拓展恋人"
    },
    "elLock": {
        "CN": "拓展恋人锁"
    },
    "elLockSub": {
        "CN": "（开发中，尚未完成）"
    },
    "ownerLock": {
        "CN": "主人使用拓展锁"
    },
    "ownerLockSub": {
        "CN": "启用后，你的主人也可以使用拓展恋人锁"
    },
    "onlineOn": {
        "CN": "在线状态灯号 开启"
    },
    "onlineOff": {
        "CN": "在线状态灯号 关闭"
    },
    "onlineSub": {
        "CN": "在自己的 Profile 显示恋人是否在线（绿点）"
    },
    "dateMode": {
        "CN": "日期模式"
    },
    "durMode": {
        "CN": "时长模式"
    },
    "dateSub": {
        "CN": "起始日期＋已交往天数"
    },
    "durSub": {
        "CN": "交往 X年X个月X天"
    },
    "vibeMsgLabel": {
        "CN": "震动信息"
    },
    "vibeMsgBcast": {
        "CN": "广播"
    },
    "vibeSoundLabel": {
        "CN": "震动音效"
    },
    "vibeMsgSubOn": {
        "CN": "别人看的到，每60秒发送一次震动信息"
    },
    "vibeMsgSubOff": {
        "CN": "仅自己看的到，每60秒发送一次震动信息"
    },
    "sevenDay": {
        "CN": "超过7天没见面时，可以单方面解除关系"
    },
    "lastSeen": {
        "CN": "最后：{0}天前"
    },
    "lastNever": {
        "CN": "最后：从未记录"
    },
    "noLovers": {
        "CN": "暂无恋人资料"
    },
    "breakupBtn": {
        "CN": "解除关系"
    },
    "modalTitle": {
        "CN": "解除与 {0} 的拓展恋人关系？"
    },
    "modalSub1": {
        "CN": "建议与对方再谈谈看"
    },
    "modalSub2": {
        "CN": "（此操作不可逆）"
    },
    "confirmBtn": {
        "CN": "确认解除"
    },
    "dPropose": {
        "CN": "(提出拓展恋人申请。)"
    },
    "dProposeR": {
        "CN": "(申请已发送，请等待对方回应。)"
    },
    "dEngage": {
        "CN": "(向此人求订婚。)"
    },
    "dEngageR": {
        "CN": "(订婚申请已发送，请等待对方回应。)"
    },
    "dMarry": {
        "CN": "(向此人求婚。)"
    },
    "dMarryR": {
        "CN": "(求婚申请已发送，请等待对方回应。)"
    },
    "dBreakup": {
        "CN": "(解除拓展恋人关系。)"
    },
    "dBreakupR": {
        "CN": "(已解除拓展恋人关系。)"
    },
    "eventDate": {
        "CN": "{0} (#{1}) 与 {2} (#{3}) {4}。"
    },
    "evDateTxt": {
        "CN": "结为拓展恋人"
    },
    "evEngTxt": {
        "CN": "升格为拓展 [{0}]"
    },
    "toastLoaded": {
        "CN": "🐈‍⬛ Abundantia Florum ─Chromatica─ v{0} 加载完成！"
    },
    "toastFail": {
        "CN": "🐈‍⬛ [AFC] 加载失败，请刷新页面。"
    },
    "legacyDetected": {
        "CN": "🐈‍⬛ [AFC] 检测到不兼容的旧版 AFC 数据，已重置为默认（恋人锁未受影响）。"
    },
    "factoryTitle": {
        "CN": "恢复出厂设置"
    },
    "factoryModalTitle": {
        "CN": "将 AFC 恢复出厂设置？"
    },
    "factoryModalSub1": {
        "CN": "这会解除所有恋人关系、并破坏所有恋人锁。"
    },
    "factoryModalSub2": {
        "CN": "此操作不可逆。"
    },
    "factoryConfirm": {
        "CN": "确认重置"
    },
    "factoryDone": {
        "CN": "🐈‍⬛ [AFC] AFC 已恢复出厂设置。"
    },
    "restoreTitle": {
        "CN": "恋人数据恢复"
    },
    "restoreOnline": {
        "CN": "在线数据"
    },
    "restoreBackup": {
        "CN": "备份数据"
    },
    "restoreBtn": {
        "CN": "恢复"
    },
    "restoreAllBtn": {
        "CN": "全部使用此数据"
    },
    "restoreEmpty": {
        "CN": "（无数据）"
    },
    "restoreConfirm1": {
        "CN": "确认恢复 {0} 的数据？"
    },
    "restoreConfirmBtn": {
        "CN": "确认恢复"
    },
    "restoreConfirmAll": {
        "CN": "确认使用 {0} 的全部数据？"
    },
    "restoreOKMsg": {
        "CN": "已恢复 {0} 条恋人数据"
    },
    "dbMismatchLoss": {
        "CN": "检测到拓展恋人数据可能丢失（在线数据为空，但本机存有备份）。请至「拓展恋人设置 → 恢复」确认要还原，或忽略（若这是新设备）。"
    },
    "dbMismatchDiff": {
        "CN": "检测到在线拓展恋人数据与本机备份不一致。请至「拓展恋人设置 → 恢复」自行确认，系统不会自动覆盖任何一方。"
    },
    "becameLovers": {
        "CN": "{0} (#{1}) 与 {2} (#{3}) 结为拓展恋人。"
    },
    "upgradedEngaged": {
        "CN": "{0} (#{1}) 与 {2} (#{3}) 升格为拓展 [订婚]。"
    },
    "upgradedMarried": {
        "CN": "{0} (#{1}) 与 {2} (#{3}) 升格为拓展 [结婚]。"
    }
});
    L.register('hl', {
    "tabOverview": {
        "CN": "总览"
    },
    "tabNote": {
        "CN": "笔记"
    },
    "tabTimer": {
        "CN": "计时器"
    },
    "tabControl": {
        "CN": "控制"
    },
    "tabUnlock": {
        "CN": "解锁"
    },
    "unlockTitle": {
        "CN": "♥ 解锁确认 ♥"
    },
    "unlockWarn1": {
        "CN": "解锁后，所有设置（笔记、计时器、震动设置）将永久删除，"
    },
    "unlockWarn2": {
        "CN": "请确认对方同意解开此锁。"
    },
    "unlockOwner": {
        "CN": "锁主："
    },
    "unlockNoRight": {
        "CN": "只有锁主或与穿戴者的恋人才能解锁。"
    },
    "unlockConfirm": {
        "CN": "确认解锁"
    },
    "unlockCancel": {
        "CN": "取消"
    },
    "unlockPending": {
        "CN": "已发送解锁请求给锁主，请等待…"
    },
    "noteTitle": {
        "CN": "♥ 爱情笔记 ♥"
    },
    "timerTitle": {
        "CN": "♥ 计时器 ♥"
    },
    "controlTitle": {
        "CN": "♥ 控制 ♥"
    },
    "noteHeader": {
        "CN": "♥ 笔记 ♥"
    },
    "noConfig": {
        "CN": "尚无设置。"
    },
    "noTimer": {
        "CN": "无计时器"
    },
    "noTimerSet": {
        "CN": "N/A"
    },
    "ownerOnlyEdit": {
        "CN": "只有锁主可以编辑。"
    },
    "ownerOnlyTimer": {
        "CN": "只有锁主可以设置计时器。"
    },
    "ownerOnlyCtrl": {
        "CN": "只有锁主可以更改设置。"
    },
    "maxChars": {
        "CN": "最多 500 字"
    },
    "editNote": {
        "CN": "✏ 编辑笔记"
    },
    "setTimer": {
        "CN": "设置计时器"
    },
    "clearTimer": {
        "CN": "清除计时器"
    },
    "settings": {
        "CN": "⚙ 设置"
    },
    "editingHint": {
        "CN": "编辑中 — 点击修改，再保存"
    },
    "vibStrength": {
        "CN": "震动强度"
    },
    "restriction": {
        "CN": "限制"
    },
    "remain": {
        "CN": "剩余："
    },
    "until": {
        "CN": "截止："
    },
    "adjust": {
        "CN": "调整："
    },
    "noNote": {
        "CN": "（尚未撰写笔记…）"
    },
    "removeRestraints": {
        "CN": "时间到时移除拘束"
    },
    "removeRestraintsSub": {
        "CN": "(同时移除所有被锁住的拘束物品)"
    },
    "lockedBy": {
        "CN": "被{0}锁住了"
    },
    "memberNum": {
        "CN": "成员编号："
    },
    "lockedLabel": {
        "CN": "锁定："
    },
    "vibeLabel": {
        "CN": "震动："
    },
    "controlLabel": {
        "CN": "高潮控制："
    },
    "vibeOff": {
        "CN": "关闭"
    },
    "vibeLow": {
        "CN": "低 ♥"
    },
    "vibeMid": {
        "CN": "中 ♥♥"
    },
    "vibeHigh": {
        "CN": "高 ♥♥♥"
    },
    "modeNormal": {
        "CN": "正常"
    },
    "modeEdge": {
        "CN": "边缘 ～"
    },
    "modeDeny": {
        "CN": "拒绝 ✕"
    },
    "settingsChanged": {
        "CN": "{0}更改了{1}身上的{2}的设置。"
    },
    "vibelow": {
        "CN": "{0}身上的{1}发出轻微的震动声"
    },
    "vibemid": {
        "CN": "{0}身上的{1}发出震动声"
    },
    "vibehigh": {
        "CN": "{0}身上的{1}发出激烈的震动声"
    },
    "resistEscape": {
        "CN": "{0}身上的{1}抵御了挣脱尝试。"
    },
    "resistRestore": {
        "CN": "{0}身上的{1}抵御了外部干扰，自动复原。"
    },
    "protectDisabled": {
        "CN": "{0}的{1}防护暂时停用，请联系锁主处理冲突。"
    },
    "pendingRestore": {
        "CN": "{0}身上的{1}因依赖物件（如 Echo 拘束）尚未加载而无法复原，将于下次登录或刷新游戏后自动尝试。"
    },
    "timerExpired": {
        "CN": "{0}身上的{1}随约定时刻到来，化作点点微光悄然消散。"
    },
    "unlockDone": {
        "CN": "{0}解开了{1}身上的{2}。"
    }
});
})();
