// ════════════════════════════════════════
//  AFC module: reconcile.js
//  房內雙向對帳（自動補齊不對稱的戀人關係）
//    - 我有他、他沒我 → 我是資料保有方 → 自動送恢復申請（節流），對方點同意即補回
//    - 他有我、我沒他 → 我這邊丟了 → 若本地 DB 有他就直接補回（本地證據可信）；
//      否則保留現有手動恢復入口（ChatRoomAFCCanRestore）交給玩家決定
// ════════════════════════════════════════

import { STAGE } from '../core/config.js';
import { AFCLockAccessOn, pendingRestoreOut, setLastKnownLoverCount } from '../core/state.js';
import { getSharedSettings, saveSharedSettings } from '../core/settings.js';
import { broadcastAFCData } from '../net/sync-data.js';
import { _lsReadLovers } from '../core/storage.js';
import { isAFCLover, targetHasAFC, reconcileStage, updateLastSeen } from './lovers.js';
import { proposeRestore } from './restore.js';

export function reconcileWithRoom() {
    const s = getSharedSettings();
    if (!s) return;
    const dbLovers = _lsReadLovers();
    for (const C of ChatRoomCharacter ?? []) {
        if (!C?.MemberNumber || C.MemberNumber === Player.MemberNumber) continue;
        // 見面即更新最後見面（單向本地紀錄；對方有無 AFC 都算）
        if (isAFCLover(C.MemberNumber)) updateLastSeen(C.MemberNumber);
        if (!targetHasAFC(C)) continue;
        const num    = C.MemberNumber;
        const iHaveC = isAFCLover(num);
        const cHasMe = (C.OnlineSharedSettings?.AFC?.lovers ?? [])
            .some(l => Number(l.memberNumber) === Number(Player.MemberNumber));

        if (!iHaveC && cHasMe) {
            const fromDB = dbLovers.find(l => Number(l.memberNumber) === Number(num));
            if (fromDB) {
                s.lovers.push({
                    memberNumber: num, name: fromDB.name ?? C.Name,
                    stage:     fromDB.stage     ?? STAGE.DATING,
                    startDate: fromDB.startDate ?? Date.now(),
                    stageDate: fromDB.stageDate ?? fromDB.startDate ?? Date.now(),
                    lastSeen:  Date.now(),
                });
                AFCLockAccessOn.add(num);
                setLastKnownLoverCount(s.lovers.length);
                saveSharedSettings();
                broadcastAFCData();
                console.log("🐈‍⬛ [AFC] 🔧 自本地DB補回戀人:", num);
            }
            // 否則：交給 ChatRoomAFCCanRestore 的手動恢復入口
        } else if (iHaveC && !cHasMe) {
            if (!pendingRestoreOut[num]) proposeRestore(C, true);
        } else if (iHaveC && cHasMe) {
            // 雙方都有彼此 → 校正關係階段/日期，修復並防止「一方訂婚、一方結婚」的不一致。
            // 對方廣播的 lovers 內含「對方眼中的我們關係」（stage/stageDate/startDate）。
            // 兩端各自向較高階段收斂，最終一致；升格會 broadcast，另一端下次同步即同步。
            const theirEntryOfMe = (C.OnlineSharedSettings?.AFC?.lovers ?? [])
                .find(l => Number(l.memberNumber) === Number(Player.MemberNumber));
            if (theirEntryOfMe) {
                reconcileStage(num, theirEntryOfMe.stage, theirEntryOfMe.stageDate, theirEntryOfMe.startDate);
            }
        }
    }
}
