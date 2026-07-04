// ════════════════════════════════════════
//  文本資料（非引擎）：心形鎖廣播/系統訊息字串
//  註冊到共用 L10N 引擎的 'hl' 命名空間。
//  位置式佔位符：
//    2 參數（vibe* / resist* / protectDisabled / pendingRestore / timerExpired）
//      {0}=角色暱稱 {1}=鎖名
//    3 參數（settingsChanged / unlockDone）
//      settingsChanged {0}=操作者 {1}=穿戴者 {2}=鎖名
//      unlockDone      {0}=解鎖者 {1}=穿戴者 {2}=鎖名
//  語言：EN / ZH（TW/CN 共用）/ DE / FR / RU / UA（缺語言自動 fallback EN）
//  註：原 RU/UA 的 vibe/resist/protect 誤用 {2} 指鎖名（實際只傳 2 參數），
//     此處校正為 {1}，使其能正確顯示。
// ════════════════════════════════════════

export const HEARTLOCK_ACTIONS = {
    settingsChanged: {
        EN: `{0} changed the settings of {1}'s {2}.`,
        ZH: `{0}更改了{1}身上的{2}的設定。`,
        DE: `{0} hat die Einstellungen von {1}s {2} geändert.`,
        FR: `{0} a modifié les paramètres du {2} de {1}.`,
        RU: `{0} изменил(а) настройки {2} для {1}.`,
        UA: `{0} змінив(ла) налаштування {2} для {1}.`,
    },
    vibelow: {
        EN: `{0}'s {1} emits a faint vibration.`,
        ZH: `{0}身上的{1}發出輕微的震動聲`,
        DE: `{0}s {1} vibriert leise.`,
        FR: `Le {1} de {0} émet une légère vibration.`,
        RU: `{1} {0} слабо вибрирует.`,
        UA: `{1} {0} тихо вібрує.`,
    },
    vibemid: {
        EN: `{0}'s {1} vibrates.`,
        ZH: `{0}身上的{1}發出震動聲`,
        DE: `{0}s {1} vibriert.`,
        FR: `Le {1} de {0} vibre.`,
        RU: `{1} {0} вибрирует.`,
        UA: `{1} {0} вібрує.`,
    },
    vibehigh: {
        EN: `{0}'s {1} vibrates intensely.`,
        ZH: `{0}身上的{1}發出激烈的震動聲`,
        DE: `{0}s {1} vibriert heftig.`,
        FR: `Le {1} de {0} vibre intensément.`,
        RU: `{1} {0} сильно вибрирует.`,
        UA: `{1} {0} сильно вібрує.`,
    },
    resistEscape: {
        EN: `{0}'s {1} resisted the escape attempt.`,
        ZH: `{0}身上的{1}抵禦了掙脫嘗試。`,
        DE: `{0}s {1} hat dem Fluchtversuch widerstanden.`,
        FR: `Le {1} de {0} a résisté à la tentative d'évasion.`,
        RU: `{1} {0} отразил попытку побега.`,
        UA: `{1} {0} відбив спробу втечі.`,
    },
    resistRestore: {
        EN: `{0}'s {1} resisted external interference and restored automatically.`,
        ZH: `{0}身上的{1}抵禦了外部干擾，自動復原。`,
        DE: `{0}s {1} hat äußere Einflüsse abgewehrt und sich wiederhergestellt.`,
        FR: `Le {1} de {0} a résisté aux interférences et s'est restauré automatiquement.`,
        RU: `{1} {0} отразил внешнее вмешательство и автоматически восстановился.`,
        UA: `{1} {0} відбив зовнішній вплив і автоматично відновився.`,
    },
    protectDisabled: {
        EN: `{0}'s {1} protection is temporarily disabled. Please contact the lock owner.`,
        ZH: `{0}的{1}防護暫時停用，請聯繫鎖主處理衝突。`,
        DE: `{0}s {1}-Schutz ist vorübergehend deaktiviert. Bitte den Schlossbesitzer kontaktieren.`,
        FR: `La protection du {1} de {0} est temporairement désactivée. Contactez le propriétaire.`,
        RU: `Защита {1} {0} временно отключена. Обратитесь к владельцу замка.`,
        UA: `Захист {1} {0} тимчасово вимкнений. Зверніться до власника замка.`,
    },
    pendingRestore: {
        EN: `The {1} on {0} cannot be restored yet because a dependent item (e.g. an Echo restraint) has not loaded. It will retry on next login or page refresh.`,
        ZH: `{0}身上的{1}因相依物件（如 Echo 拘束）尚未載入而無法復原，將於下次登入或刷新遊戲後自動嘗試。`,
    },
    timerExpired: {
        EN: `The {1} on {0} dissolves into a gentle shimmer as the promised moment arrives.`,
        ZH: `{0}身上的{1}隨約定時刻到來，化作點點微光悄然消散。`,
        DE: `Das {1} von {0} löst sich in sanftes Licht auf, als der vereinbarte Moment kommt.`,
        FR: `Le {1} de {0} se dissout en une douce lueur à l'heure convenue.`,
        RU: `{1} {0} растворяется в мягком свете, когда наступает условленный момент.`,
        UA: `{1} {0} розчиняється у м'якому світлі, коли настає обумовлений момент.`,
    },
    unlockDone: {
        EN: `{0} unlocked the {2} on {1}.`,
        ZH: `{0}解開了{1}身上的{2}。`,
        DE: `{0} hat {2} von {1} entsperrt.`,
        FR: `{0} a déverrouillé le {2} de {1}.`,
        RU: `{0} открыл(а) {2} на {1}.`,
        UA: `{0} відкрив(ла) {2} на {1}.`,
    },
};
