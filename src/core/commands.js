// ════════════════════════════════════════
//  AFC module: commands.js
//  /afc-* 診斷與操作指令
// ════════════════════════════════════════

import { isInitialized, AFCLockAccessOn } from './state.js';
import { getSharedSettings, getPrivateSettings } from './settings.js';
import { waitFor, daysSince, formatDuration, chatLocalNotice } from '../util/util.js';
import { isAFCLover } from '../relations/lovers.js';
import { initiateBreakup } from '../relations/breakup.js';
import { proposeToCharacter } from '../relations/propose.js';

export async function setupCommands() {
    await waitFor(() => !!window.Commands);
    CommandCombine([
        {
            Tag: "afc-debug-hidden",
            Description: "診斷：下一條 Hidden 訊息的欄位結構",
            Action: () => {
                const handler = (data) => {
                    if (data?.Type !== 'Hidden') return;
                    chatLocalNotice(`Hidden 欄位: ${Object.keys(data).join(', ')}`);
                    chatLocalNotice(`Sender=${data.Sender}, SenderMemberNumber=${data.SenderMemberNumber}, Content=${data.Content}`);
                    ServerSocket.off('ChatRoomMessage', handler);
                };
                ServerSocket.on('ChatRoomMessage', handler);
                chatLocalNotice('等待下一條 Hidden 訊息...');
            }
        },
        {
            Tag: "afc-propose",
            Description: "[MemberNumber] 向指定玩家提出拓展戀人申請",
            Action: (text) => {
                const num = parseInt(text.trim().split(/\s+/)[0]);
                if (isNaN(num)) { chatLocalNotice("用法：/afc-propose [MemberNumber]"); return; }
                const C = ChatRoomCharacter?.find(c => c.MemberNumber === num);
                if (!C) { chatLocalNotice("找不到該玩家，確認對方在同一房間"); return; }
                proposeToCharacter(C);
            }
        },
        {
            Tag: "afc-status",
            Description: "顯示目前 AFC 插件狀態與戀人列表",
            Action: () => {
                const lovers = getSharedSettings()?.lovers ?? [];
                chatLocalNotice(`已初始化=${isInitialized} | 戀人=${lovers.length} | 線上=${AFCLockAccessOn.size}`);
                for (const l of lovers)
                    chatLocalNotice(`  ♥ ${l.name} (#${l.memberNumber}) | ${l.stage} | ${formatDuration(Date.now() - l.startDate)}`);
            }
        },
        {
            Tag: "afc-breakup",
            Description: "[MemberNumber] 解除指定拓展戀人關係",
            Action: (text) => {
                const num = parseInt(text.trim().split(/\s+/)[0]);
                if (isNaN(num) || !isAFCLover(num)) { chatLocalNotice("對方不是你的拓展戀人"); return; }
                const entry = getSharedSettings()?.lovers.find(l => l.memberNumber === num);
                initiateBreakup(num, entry?.name);
            }
        },
        {
            Tag: "afc-lastseen",
            Description: "顯示所有戀人的最後見面時間",
            Action: () => {
                const priv   = getPrivateSettings();
                const lovers = getSharedSettings()?.lovers ?? [];
                if (lovers.length === 0) { chatLocalNotice("暫無戀人資料"); return; }
                for (const l of lovers) {
                    const ts  = priv?.lastSeen?.[l.memberNumber];
                    const str = ts ? `${daysSince(ts)} 天前` : "從未記錄";
                    chatLocalNotice(`${l.name}: 最後見面 ${str}`);
                }
            }
        },
    ]);
}
