// ════════════════════════════════════════
//  Liko - AFC 字庫 — FR（Français）
//  一國一檔，含 afc（拓展戀人）與 hl（心形鎖）兩命名空間；位置式佔位 {0}{1}…
//  由 AFC 執行期 fetch 後 new Function 執行，自動註冊到共用引擎 window.Liko.__Sys_L10N__。
//  ★ 翻譯者請直接改這裡；改完 build 會複製到 public/Translation/ 部署。
// ════════════════════════════════════════
(function () {
    var Liko = (typeof window !== 'undefined') ? window.Liko : (typeof globalThis !== 'undefined' ? globalThis.Liko : null);
    var L = Liko && Liko.__Sys_L10N__;
    if (!L || !L.register) { console.error('[Liko AFC FR] L10N 引擎尚未載入'); return; }
    L.register('afc', {
    "prefButton": {
        "FR": "Paramètres AFC"
    },
    "notFriend": {
        "FR": "Ajoutez d'abord {0} comme ami, puis renvoyez la demande."
    },
    "notInstalled": {
        "FR": "{0} n'a pas installé le plugin."
    },
    "alreadyAFC": {
        "FR": "{0} est déjà votre amant étendu."
    },
    "alreadyBC": {
        "FR": "{0} est déjà votre amant BC natif."
    },
    "cooldown": {
        "FR": "Veuillez attendre {0}s avant de redemander."
    },
    "proposeSent": {
        "FR": "Demande envoyée à {0}, valable 3 min..."
    },
    "proposeExpired": {
        "FR": "La demande à {0} a expiré."
    },
    "proposeAck": {
        "FR": "{0} a reçu votre demande."
    },
    "proposeOK": {
        "FR": "{0} a accepté votre demande d'amant étendu !"
    },
    "breakupSelf": {
        "FR": "Vous avez mis fin à la relation d'amant étendu avec {0}."
    },
    "breakupOther": {
        "FR": "{0} a mis fin à la relation d'amant étendu avec vous."
    },
    "restoreSent": {
        "FR": "Demande de restauration de la relation envoyée à {0}..."
    },
    "restoreOK": {
        "FR": "Relation d'amant étendu avec {0} restaurée !"
    },
    "dRestore": {
        "FR": "(Demander la restauration de la relation d'amant étendu.)"
    },
    "dRestoreR": {
        "FR": "(Demande de restauration envoyée, en attente de réponse.)"
    },
    "stageSent": {
        "FR": "Demande [{1}] envoyée à {0}, valable 3 min..."
    },
    "stageExpired": {
        "FR": "La demande [{1}] à {0} a expiré."
    },
    "stageOK": {
        "FR": "{0} a accepté votre demande [{1}] !"
    },
    "stageOKSelf": {
        "FR": "Vous avez accepté la demande [{1}] de {0} !"
    },
    "stageDating": {
        "FR": "en couple"
    },
    "stageEngaged": {
        "FR": "fiançailles"
    },
    "stageMarried": {
        "FR": "mariage"
    },
    "propTitle": {
        "FR": "♥ {0} ({1}) vous propose une relation d'amant étendu !"
    },
    "stageTitle": {
        "FR": "💍 {0} ({1}) a proposé : [{2}] !"
    },
    "bcTitle": {
        "FR": "💌 {0} ({1}) a envoyé une demande d'amant BC natif !"
    },
    "bcNote": {
        "FR": "Allez dans Gestion des relations pour accepter, ou laissez expirer."
    },
    "timerText": {
        "FR": "Annulation auto dans {0}:{1}"
    },
    "okBtn": {
        "FR": "Accepter"
    },
    "cancelBtn": {
        "FR": "Refuser"
    },
    "panelTitle": {
        "FR": "─── Amants étendus ───"
    },
    "panelEmpty": {
        "FR": "Aucun amant étendu"
    },
    "btnOpen": {
        "FR": "Plus d'amants ({0})"
    },
    "btnClose": {
        "FR": "▲ Fermer"
    },
    "dispTitle": {
        "FR": "──Affichage──"
    },
    "mgmtTitle": {
        "FR": "──Amants──"
    },
    "sysTitle": {
        "FR": "──Système──"
    },
    "enableAFC": {
        "FR": "Système d'amants étendus"
    },
    "enableAFCSub": {
        "FR": "Amants étendus"
    },
    "elLock": {
        "FR": "Verrou d'amant étendu"
    },
    "elLockSub": {
        "FR": "(En développement)"
    },
    "ownerLock": {
        "FR": "Le propriétaire peut utiliser le verrou AFC"
    },
    "ownerLockSub": {
        "FR": "Si activé, votre propriétaire peut aussi appliquer le verrou d'amant étendu"
    },
    "onlineOn": {
        "FR": "Indicateur en ligne  ON"
    },
    "onlineOff": {
        "FR": "Indicateur en ligne  OFF"
    },
    "onlineSub": {
        "FR": "Afficher les points de statut en ligne sur votre profil"
    },
    "dateMode": {
        "FR": "Mode date"
    },
    "durMode": {
        "FR": "Mode durée"
    },
    "dateSub": {
        "FR": "Date de début + jours ensemble"
    },
    "durSub": {
        "FR": "X ans X mois X jours"
    },
    "vibeMsgLabel": {
        "FR": "Message de vibration"
    },
    "vibeMsgBcast": {
        "FR": "Diffusion"
    },
    "vibeSoundLabel": {
        "FR": "Effet sonore"
    },
    "vibeMsgSubOn": {
        "FR": "Les autres voient le message de vibration toutes les 60s"
    },
    "vibeMsgSubOff": {
        "FR": "Vous seul voyez le message de vibration toutes les 60s"
    },
    "sevenDay": {
        "FR": "Après 7 jours sans contact, vous pouvez rompre unilatéralement la relation"
    },
    "lastSeen": {
        "FR": "dernier : il y a {0}j"
    },
    "lastNever": {
        "FR": "dernier : jamais"
    },
    "noLovers": {
        "FR": "Aucun amant"
    },
    "breakupBtn": {
        "FR": "Rompre"
    },
    "modalTitle": {
        "FR": "Rompre la relation avec {0} ?"
    },
    "modalSub1": {
        "FR": "Il est recommandé d'en discuter d'abord."
    },
    "modalSub2": {
        "FR": "(Action irréversible)"
    },
    "confirmBtn": {
        "FR": "Confirmer"
    },
    "dPropose": {
        "FR": "(Envoyer une demande d'amant étendu.)"
    },
    "dProposeR": {
        "FR": "(Demande envoyée, en attente de réponse.)"
    },
    "dEngage": {
        "FR": "(Proposer les fiançailles.)"
    },
    "dEngageR": {
        "FR": "(Demande de fiançailles envoyée.)"
    },
    "dMarry": {
        "FR": "(Proposer le mariage.)"
    },
    "dMarryR": {
        "FR": "(Demande en mariage envoyée.)"
    },
    "dBreakup": {
        "FR": "(Rompre la relation d'amant étendu.)"
    },
    "dBreakupR": {
        "FR": "(Relation rompue.)"
    },
    "eventDate": {
        "FR": "{0} (#{1}) et {2} (#{3}) {4}."
    },
    "evDateTxt": {
        "FR": "sont devenus amants étendus"
    },
    "evEngTxt": {
        "FR": "ont évolué vers étendu [{0}]"
    },
    "toastLoaded": {
        "FR": "🐈‍⬛ Abundantia Florum ─Chromatica─ v{0} chargé !"
    },
    "toastFail": {
        "FR": "🐈‍⬛ [AFC] Échec du chargement. Veuillez rafraîchir la page."
    },
    "legacyDetected": {
        "FR": "🐈‍⬛ [AFC] Des données AFC anciennes/incompatibles ont été détectées et réinitialisées (les verrous d'amant sont intacts)."
    },
    "factoryTitle": {
        "FR": "Réinit. usine"
    },
    "factoryModalTitle": {
        "FR": "Réinitialiser AFC aux réglages d'usine ?"
    },
    "factoryModalSub1": {
        "FR": "Ceci dissout TOUTES les relations d'amants et détruit TOUS les verrous d'amant."
    },
    "factoryModalSub2": {
        "FR": "Ceci est IRRÉVERSIBLE."
    },
    "factoryConfirm": {
        "FR": "Confirmer la réinit."
    },
    "factoryDone": {
        "FR": "🐈‍⬛ [AFC] AFC a été réinitialisé aux réglages d'usine."
    },
    "restoreTitle": {
        "FR": "Restauration des données d'amant"
    },
    "restoreOnline": {
        "FR": "Données en ligne"
    },
    "restoreBackup": {
        "FR": "Données de sauvegarde"
    },
    "restoreBtn": {
        "FR": "Restaurer"
    },
    "restoreAllBtn": {
        "FR": "Utiliser toutes ces données"
    },
    "restoreEmpty": {
        "FR": "(Aucune donnée)"
    },
    "restoreConfirm1": {
        "FR": "Restaurer les données de {0} ?"
    },
    "restoreConfirmBtn": {
        "FR": "Confirmer la restauration"
    },
    "restoreConfirmAll": {
        "FR": "Utiliser toutes les données de {0} ?"
    },
    "restoreOKMsg": {
        "FR": "{0} amant(s) restauré(s)"
    },
    "dbMismatchLoss": {
        "FR": "Les données d'amants étendus pourraient être perdues (la liste en ligne est vide mais une sauvegarde locale existe). Ouvrez Paramètres AFC → Restaurer pour récupérer, ou ignorez si c'est un nouvel appareil."
    },
    "dbMismatchDiff": {
        "FR": "Votre liste d'amants étendus en ligne diffère de la sauvegarde locale. Ouvrez Paramètres AFC → Restaurer pour concilier manuellement ; rien n'est écrasé automatiquement."
    },
    "becameLovers": {
        "FR": "{0} (#{1}) et {2} (#{3}) sont devenus amants étendus."
    },
    "upgradedEngaged": {
        "FR": "{0} (#{1}) et {2} (#{3}) ont fait évoluer leur relation étendue vers les [fiançailles]."
    },
    "upgradedMarried": {
        "FR": "{0} (#{1}) et {2} (#{3}) ont fait évoluer leur relation étendue vers le [mariage]."
    }
});
    L.register('hl', {
    "tabOverview": {
        "FR": "Aperçu"
    },
    "tabNote": {
        "FR": "Note"
    },
    "tabTimer": {
        "FR": "Minuterie"
    },
    "tabControl": {
        "FR": "Contrôle"
    },
    "tabUnlock": {
        "FR": "Déverrouiller"
    },
    "unlockTitle": {
        "FR": "♥ Confirmer le déverrouillage ♥"
    },
    "unlockWarn1": {
        "FR": "Le déverrouillage supprimera définitivement tous les paramètres."
    },
    "unlockWarn2": {
        "FR": "Confirmez que le porteur accepte de déverrouiller."
    },
    "unlockOwner": {
        "FR": "Propriétaire :"
    },
    "unlockNoRight": {
        "FR": "Seul le propriétaire ou les amants peuvent déverrouiller."
    },
    "unlockConfirm": {
        "FR": "Confirmer"
    },
    "unlockCancel": {
        "FR": "Annuler"
    },
    "unlockPending": {
        "FR": "Demande de déverrouillage envoyée au propriétaire, veuillez patienter…"
    },
    "noteTitle": {
        "FR": "♥ Note d'amour ♥"
    },
    "timerTitle": {
        "FR": "♥ Minuterie ♥"
    },
    "controlTitle": {
        "FR": "♥ Contrôle ♥"
    },
    "noteHeader": {
        "FR": "♥ Note ♥"
    },
    "noConfig": {
        "FR": "Aucune configuration."
    },
    "noTimer": {
        "FR": "Pas de minuterie"
    },
    "noTimerSet": {
        "FR": "N/A"
    },
    "ownerOnlyEdit": {
        "FR": "Seul le propriétaire peut modifier."
    },
    "ownerOnlyTimer": {
        "FR": "Seul le propriétaire peut définir la minuterie."
    },
    "ownerOnlyCtrl": {
        "FR": "Seul le propriétaire peut modifier les paramètres."
    },
    "maxChars": {
        "FR": "max 500 caractères"
    },
    "editNote": {
        "FR": "✏ Modifier"
    },
    "setTimer": {
        "FR": "Définir minuterie"
    },
    "clearTimer": {
        "FR": "Effacer minuterie"
    },
    "settings": {
        "FR": "⚙ Paramètres"
    },
    "editingHint": {
        "FR": "Édition — cliquer pour modifier, puis Sauvegarder"
    },
    "vibStrength": {
        "FR": "Intensité de vibration"
    },
    "restriction": {
        "FR": "Restriction"
    },
    "remain": {
        "FR": "Restant :"
    },
    "until": {
        "FR": "Jusqu'à :"
    },
    "adjust": {
        "FR": "Ajuster :"
    },
    "noNote": {
        "FR": "(Pas encore de note…)"
    },
    "removeRestraints": {
        "FR": "Retirer les entraves à l'expiration"
    },
    "removeRestraintsSub": {
        "FR": "(Retire aussi tous les objets d'entrave verrouillés)"
    },
    "lockedBy": {
        "FR": "Verrouillé par {0}"
    },
    "memberNum": {
        "FR": "Membre n° :"
    },
    "lockedLabel": {
        "FR": "Verrouillé :"
    },
    "vibeLabel": {
        "FR": "Vibration :"
    },
    "controlLabel": {
        "FR": "Contrôle :"
    },
    "vibeOff": {
        "FR": "Désactivé"
    },
    "vibeLow": {
        "FR": "Faible ♥"
    },
    "vibeMid": {
        "FR": "Moyen ♥♥"
    },
    "vibeHigh": {
        "FR": "Fort ♥♥♥"
    },
    "modeNormal": {
        "FR": "Normal"
    },
    "modeEdge": {
        "FR": "Edging ～"
    },
    "modeDeny": {
        "FR": "Refuser ✕"
    },
    "settingsChanged": {
        "FR": "{0} a modifié les paramètres du {2} de {1}."
    },
    "vibelow": {
        "FR": "Le {1} de {0} émet une légère vibration."
    },
    "vibemid": {
        "FR": "Le {1} de {0} vibre."
    },
    "vibehigh": {
        "FR": "Le {1} de {0} vibre intensément."
    },
    "resistEscape": {
        "FR": "Le {1} de {0} a résisté à la tentative d'évasion."
    },
    "resistRestore": {
        "FR": "Le {1} de {0} a résisté aux interférences et s'est restauré automatiquement."
    },
    "protectDisabled": {
        "FR": "La protection du {1} de {0} est temporairement désactivée. Contactez le propriétaire."
    },
    "pendingRestore": {
        "FR": "Le {1} de {0} ne peut pas encore être restauré car un objet dépendant (p. ex. une entrave Echo) n'est pas chargé. Nouvelle tentative à la prochaine connexion ou au rafraîchissement."
    },
    "timerExpired": {
        "FR": "Le {1} de {0} se dissout en une douce lueur à l'heure convenue."
    },
    "unlockDone": {
        "FR": "{0} a déverrouillé le {2} de {1}."
    },
    "dbRestoreAnomaly": {
        "FR": "⚠ Les données en ligne du HeartLock de {0} ont été anormalement perdues et restaurées depuis la sauvegarde locale pour : {1}. Si ce n'était pas vous, veuillez vérifier avec le propriétaire du verrou."
    }
});
})();
