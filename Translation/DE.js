// ════════════════════════════════════════
//  Liko - AFC 字庫 — DE（Deutsch）
//  一國一檔，含 afc（拓展戀人）與 hl（心形鎖）兩命名空間；位置式佔位 {0}{1}…
//  由 AFC 執行期 fetch 後 new Function 執行，自動註冊到共用引擎 window.Liko.__Sys_L10N__。
//  ★ 翻譯者請直接改這裡；改完 build 會複製到 public/Translation/ 部署。
// ════════════════════════════════════════
(function () {
    var Liko = (typeof window !== 'undefined') ? window.Liko : (typeof globalThis !== 'undefined' ? globalThis.Liko : null);
    var L = Liko && Liko.__Sys_L10N__;
    if (!L || !L.register) { console.error('[Liko AFC DE] L10N 引擎尚未載入'); return; }
    L.register('afc', {
    "prefButton": {
        "DE": "AFC-Einstellungen"
    },
    "notFriend": {
        "DE": "Bitte füge {0} zuerst als Freund hinzu und sende die Anfrage erneut."
    },
    "notInstalled": {
        "DE": "{0} hat das Plugin nicht installiert."
    },
    "alreadyAFC": {
        "DE": "{0} ist bereits dein erweiterter Liebhaber."
    },
    "alreadyBC": {
        "DE": "{0} ist bereits dein nativer BC-Liebhaber."
    },
    "cooldown": {
        "DE": "Bitte warte {0}s, bevor du erneut anfragst."
    },
    "proposeSent": {
        "DE": "Anfrage an {0} gesendet, 3 Min. gültig..."
    },
    "proposeExpired": {
        "DE": "Die Anfrage an {0} ist abgelaufen."
    },
    "proposeAck": {
        "DE": "{0} hat deine Anfrage erhalten."
    },
    "proposeOK": {
        "DE": "{0} hat deine Anfrage als erweiterter Liebhaber angenommen!"
    },
    "breakupSelf": {
        "DE": "Du hast die erweiterte Liebesbeziehung mit {0} beendet."
    },
    "breakupOther": {
        "DE": "{0} hat die erweiterte Liebesbeziehung mit dir beendet."
    },
    "restoreSent": {
        "DE": "Wiederherstellungsanfrage an {0} gesendet..."
    },
    "restoreOK": {
        "DE": "Erweiterte Liebesbeziehung mit {0} wiederhergestellt!"
    },
    "dRestore": {
        "DE": "(Wiederherstellung der erweiterten Liebesbeziehung anfragen.)"
    },
    "dRestoreR": {
        "DE": "(Wiederherstellungsanfrage gesendet, warte auf Antwort.)"
    },
    "stageSent": {
        "DE": "[{1}]-Anfrage an {0} gesendet, 3 Min. gültig..."
    },
    "stageExpired": {
        "DE": "Die [{1}]-Anfrage an {0} ist abgelaufen."
    },
    "stageOK": {
        "DE": "{0} hat deine [{1}]-Anfrage angenommen!"
    },
    "stageOKSelf": {
        "DE": "Du hast {0}s [{1}]-Anfrage angenommen!"
    },
    "stageDating": {
        "DE": "Beziehung"
    },
    "stageEngaged": {
        "DE": "Verlobung"
    },
    "stageMarried": {
        "DE": "Ehe"
    },
    "propTitle": {
        "DE": "♥ {0} ({1}) hat dir eine erweiterte Liebesbeziehung vorgeschlagen!"
    },
    "stageTitle": {
        "DE": "💍 {0} ({1}) hat vorgeschlagen: [{2}]!"
    },
    "bcTitle": {
        "DE": "💌 {0} ({1}) hat eine native BC-Liebhaber-Anfrage gesendet!"
    },
    "bcNote": {
        "DE": "Gehe zur Beziehungsverwaltung, um anzunehmen, oder lasse sie ablaufen."
    },
    "timerText": {
        "DE": "Automatischer Abbruch in {0}:{1}"
    },
    "okBtn": {
        "DE": "Annehmen"
    },
    "cancelBtn": {
        "DE": "Ablehnen"
    },
    "panelTitle": {
        "DE": "─── Erweiterte Liebhaber ───"
    },
    "panelEmpty": {
        "DE": "Noch keine erweiterten Liebhaber"
    },
    "btnOpen": {
        "DE": "Mehr Liebhaber ({0})"
    },
    "btnClose": {
        "DE": "▲ Schließen"
    },
    "dispTitle": {
        "DE": "──Anzeige──"
    },
    "mgmtTitle": {
        "DE": "──Liebhaber──"
    },
    "sysTitle": {
        "DE": "──System──"
    },
    "enableAFC": {
        "DE": "Erweitertes-Liebhaber-System"
    },
    "enableAFCSub": {
        "DE": "Erweiterte Liebhaber"
    },
    "elLock": {
        "DE": "Erweitertes-Liebhaber-Schloss"
    },
    "elLockSub": {
        "DE": "(In Entwicklung)"
    },
    "ownerLock": {
        "DE": "Besitzer darf AFC-Schloss nutzen"
    },
    "ownerLockSub": {
        "DE": "Wenn aktiviert, darf auch dein Besitzer das Erweitertes-Liebhaber-Schloss anlegen"
    },
    "onlineOn": {
        "DE": "Online-Anzeige  EIN"
    },
    "onlineOff": {
        "DE": "Online-Anzeige  AUS"
    },
    "onlineSub": {
        "DE": "Online-Status-Punkte im eigenen Profil anzeigen"
    },
    "dateMode": {
        "DE": "Datumsmodus"
    },
    "durMode": {
        "DE": "Dauermodus"
    },
    "dateSub": {
        "DE": "Startdatum + Tage zusammen"
    },
    "durSub": {
        "DE": "X Jahre X Monate X Tage"
    },
    "vibeMsgLabel": {
        "DE": "Vibrations-Nachricht"
    },
    "vibeMsgBcast": {
        "DE": "Broadcast"
    },
    "vibeSoundLabel": {
        "DE": "Soundeffekt"
    },
    "vibeMsgSubOn": {
        "DE": "Andere sehen die Vibrations-Nachricht alle 60s"
    },
    "vibeMsgSubOff": {
        "DE": "Nur du siehst die Vibrations-Nachricht alle 60s"
    },
    "sevenDay": {
        "DE": "Nach 7 Tagen ohne Kontakt darfst du die Beziehung einseitig beenden"
    },
    "lastSeen": {
        "DE": "zuletzt: vor {0}T"
    },
    "lastNever": {
        "DE": "zuletzt: nie"
    },
    "noLovers": {
        "DE": "Keine Liebhaber"
    },
    "breakupBtn": {
        "DE": "Trennen"
    },
    "modalTitle": {
        "DE": "Beziehung mit {0} beenden?"
    },
    "modalSub1": {
        "DE": "Es wird empfohlen, zuerst darüber zu sprechen."
    },
    "modalSub2": {
        "DE": "(Dies kann nicht rückgängig gemacht werden)"
    },
    "confirmBtn": {
        "DE": "Bestätigen"
    },
    "dPropose": {
        "DE": "(Eine erweiterte Liebhaber-Anfrage senden.)"
    },
    "dProposeR": {
        "DE": "(Anfrage gesendet, warte auf Antwort.)"
    },
    "dEngage": {
        "DE": "(Verlobung vorschlagen.)"
    },
    "dEngageR": {
        "DE": "(Verlobungsanfrage gesendet.)"
    },
    "dMarry": {
        "DE": "(Heirat vorschlagen.)"
    },
    "dMarryR": {
        "DE": "(Heiratsantrag gesendet.)"
    },
    "dBreakup": {
        "DE": "(Erweiterte Liebesbeziehung beenden.)"
    },
    "dBreakupR": {
        "DE": "(Beziehung beendet.)"
    },
    "eventDate": {
        "DE": "{0} (#{1}) und {2} (#{3}) {4}."
    },
    "evDateTxt": {
        "DE": "sind erweiterte Liebhaber geworden"
    },
    "evEngTxt": {
        "DE": "zu erweitert [{0}] hochgestuft"
    },
    "toastLoaded": {
        "DE": "🐈‍⬛ Abundantia Florum ─Chromatica─ v{0} geladen!"
    },
    "toastFail": {
        "DE": "🐈‍⬛ [AFC] Laden fehlgeschlagen. Bitte Seite neu laden."
    },
    "legacyDetected": {
        "DE": "🐈‍⬛ [AFC] Alte/inkompatible AFC-Daten wurden erkannt und auf Standard zurückgesetzt (Liebhaber-Schlösser blieben unberührt)."
    },
    "factoryTitle": {
        "DE": "Werkseinstellungen"
    },
    "factoryModalTitle": {
        "DE": "AFC auf Werkseinstellungen zurücksetzen?"
    },
    "factoryModalSub1": {
        "DE": "Dies löst ALLE Liebhaber-Beziehungen auf und zerstört ALLE Liebhaber-Schlösser."
    },
    "factoryModalSub2": {
        "DE": "Dies ist UNWIDERRUFLICH."
    },
    "factoryConfirm": {
        "DE": "Zurücksetzen bestätigen"
    },
    "factoryDone": {
        "DE": "🐈‍⬛ [AFC] AFC wurde auf Werkseinstellungen zurückgesetzt."
    },
    "restoreTitle": {
        "DE": "Liebhaber-Daten wiederherstellen"
    },
    "restoreOnline": {
        "DE": "Online-Daten"
    },
    "restoreBackup": {
        "DE": "Sicherungsdaten"
    },
    "restoreBtn": {
        "DE": "Wiederherstellen"
    },
    "restoreAllBtn": {
        "DE": "Alle diese Daten verwenden"
    },
    "restoreEmpty": {
        "DE": "(Keine Daten)"
    },
    "restoreConfirm1": {
        "DE": "Daten von {0} wiederherstellen?"
    },
    "restoreConfirmBtn": {
        "DE": "Wiederherstellung bestätigen"
    },
    "restoreConfirmAll": {
        "DE": "Alle Daten von {0} verwenden?"
    },
    "restoreOKMsg": {
        "DE": "{0} Liebhaber wiederhergestellt"
    },
    "dbMismatchLoss": {
        "DE": "Erweiterte-Liebhaber-Daten könnten verloren sein (Online-Liste ist leer, aber eine lokale Sicherung existiert). Öffne AFC-Einstellungen → Wiederherstellen, oder ignoriere es bei einem neuen Gerät."
    },
    "dbMismatchDiff": {
        "DE": "Deine Online-Liste erweiterter Liebhaber weicht von der lokalen Sicherung ab. Öffne AFC-Einstellungen → Wiederherstellen zum manuellen Abgleich; nichts wird automatisch überschrieben."
    },
    "becameLovers": {
        "DE": "{0} (#{1}) und {2} (#{3}) sind erweiterte Liebende geworden."
    },
    "upgradedEngaged": {
        "DE": "{0} (#{1}) und {2} (#{3}) haben ihre erweiterte Beziehung zur [Verlobung] hochgestuft."
    },
    "upgradedMarried": {
        "DE": "{0} (#{1}) und {2} (#{3}) haben ihre erweiterte Beziehung zur [Ehe] hochgestuft."
    }
});
    L.register('hl', {
    "tabOverview": {
        "DE": "Übersicht"
    },
    "tabNote": {
        "DE": "Notiz"
    },
    "tabTimer": {
        "DE": "Timer"
    },
    "tabControl": {
        "DE": "Kontrolle"
    },
    "tabUnlock": {
        "DE": "Entsperren"
    },
    "unlockTitle": {
        "DE": "♥ Entsperren bestätigen ♥"
    },
    "unlockWarn1": {
        "DE": "Das Entsperren löscht alle Einstellungen (Notizen, Timer, Vibration) dauerhaft."
    },
    "unlockWarn2": {
        "DE": "Bitte bestätigen, dass der Träger dem Entsperren zustimmt."
    },
    "unlockOwner": {
        "DE": "Schlossbesitzer:"
    },
    "unlockNoRight": {
        "DE": "Nur der Schlossbesitzer oder Liebhaber kann entsperren."
    },
    "unlockConfirm": {
        "DE": "Entsperren bestätigen"
    },
    "unlockCancel": {
        "DE": "Abbrechen"
    },
    "unlockPending": {
        "DE": "Entsperranfrage an den Besitzer gesendet, bitte warten…"
    },
    "noteTitle": {
        "DE": "♥ Liebesnotiz ♥"
    },
    "timerTitle": {
        "DE": "♥ Timer ♥"
    },
    "controlTitle": {
        "DE": "♥ Kontrolle ♥"
    },
    "noteHeader": {
        "DE": "♥ Notiz ♥"
    },
    "noConfig": {
        "DE": "Keine Konfiguration."
    },
    "noTimer": {
        "DE": "Kein Timer"
    },
    "noTimerSet": {
        "DE": "N/A"
    },
    "ownerOnlyEdit": {
        "DE": "Nur der Schlossbesitzer kann bearbeiten."
    },
    "ownerOnlyTimer": {
        "DE": "Nur der Schlossbesitzer kann den Timer setzen."
    },
    "ownerOnlyCtrl": {
        "DE": "Nur der Schlossbesitzer kann Einstellungen ändern."
    },
    "maxChars": {
        "DE": "max 500 Zeichen"
    },
    "editNote": {
        "DE": "✏ bearbeiten"
    },
    "setTimer": {
        "DE": "Timer setzen"
    },
    "clearTimer": {
        "DE": "Timer löschen"
    },
    "settings": {
        "DE": "⚙ Einstellungen"
    },
    "editingHint": {
        "DE": "Bearbeitung — klicken zum Ändern, dann Speichern"
    },
    "vibStrength": {
        "DE": "Vibrationsstärke"
    },
    "restriction": {
        "DE": "Einschränkung"
    },
    "remain": {
        "DE": "Verbleibend:"
    },
    "until": {
        "DE": "Bis:"
    },
    "adjust": {
        "DE": "Anpassen:"
    },
    "noNote": {
        "DE": "(Noch keine Notiz…)"
    },
    "removeRestraints": {
        "DE": "Fesselung bei Ablauf entfernen"
    },
    "removeRestraintsSub": {
        "DE": "(Entfernt auch alle gesperrten Fessel-Gegenstände)"
    },
    "lockedBy": {
        "DE": "Gesperrt durch {0}"
    },
    "memberNum": {
        "DE": "Mitglied #:"
    },
    "lockedLabel": {
        "DE": "Gesperrt:"
    },
    "vibeLabel": {
        "DE": "Vibration:"
    },
    "controlLabel": {
        "DE": "Kontrolle:"
    },
    "vibeOff": {
        "DE": "Aus"
    },
    "vibeLow": {
        "DE": "Niedrig ♥"
    },
    "vibeMid": {
        "DE": "Mittel ♥♥"
    },
    "vibeHigh": {
        "DE": "Hoch ♥♥♥"
    },
    "modeNormal": {
        "DE": "Normal"
    },
    "modeEdge": {
        "DE": "Edging ～"
    },
    "modeDeny": {
        "DE": "Verweigern ✕"
    },
    "settingsChanged": {
        "DE": "{0} hat die Einstellungen von {1}s {2} geändert."
    },
    "vibelow": {
        "DE": "{0}s {1} vibriert leise."
    },
    "vibemid": {
        "DE": "{0}s {1} vibriert."
    },
    "vibehigh": {
        "DE": "{0}s {1} vibriert heftig."
    },
    "resistEscape": {
        "DE": "{0}s {1} hat dem Fluchtversuch widerstanden."
    },
    "resistRestore": {
        "DE": "{0}s {1} hat äußere Einflüsse abgewehrt und sich wiederhergestellt."
    },
    "protectDisabled": {
        "DE": "{0}s {1}-Schutz ist vorübergehend deaktiviert. Bitte den Schlossbesitzer kontaktieren."
    },
    "pendingRestore": {
        "DE": "Das {1} von {0} kann noch nicht wiederhergestellt werden, da ein abhängiges Objekt (z. B. eine Echo-Fessel) nicht geladen ist. Neuer Versuch beim nächsten Login oder Seiten-Neuladen."
    },
    "timerExpired": {
        "DE": "Das {1} von {0} löst sich in sanftes Licht auf, als der vereinbarte Moment kommt."
    },
    "unlockDone": {
        "DE": "{0} hat {2} von {1} entsperrt."
    },
    "dbRestoreAnomaly": {
        "DE": "⚠ {0}s HeartLock-Onlinedaten gingen unerwartet verloren und wurden aus der lokalen Sicherung wiederhergestellt für: {1}. Falls du das nicht warst, wende dich bitte an den Schlossbesitzer."
    }
});
})();
