// ════════════════════════════════════════
//  AFC module: util.js
//  通用小工具
// ════════════════════════════════════════

export function chatLocalNotice(text) { ChatRoomSendLocal(`[AFC] ${text}`); }
export function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// timeout=0 表示無限等待，不超時
export function waitFor(condition, timeout = 0) {
    const start = Date.now();
    return new Promise(resolve => {
        const check = () => {
            if (condition()) { resolve(true); return; }
            if (timeout > 0 && Date.now() - start > timeout) { resolve(false); return; }
            setTimeout(check, 200);
        };
        check();
    });
}

export function daysSince(ts) {
    return Math.floor((Date.now() - (ts ?? Date.now())) / 86400000);
}

// 格式化持續時間：「交往 1年2個月15天」
export function formatDuration(ms) {
    const totalDays = Math.floor(ms / 86400000);
    const years     = Math.floor(totalDays / 365);
    const months    = Math.floor((totalDays % 365) / 30);
    const remDays   = totalDays - years * 365 - months * 30;
    let s = "交往";
    if (years  > 0) s += `${years}年`;
    if (months > 0) s += `${months}個月`;
    if (years === 0 && months === 0) s += `${totalDays}天`;
    else if (remDays > 0) s += `${remDays}天`;
    return s;
}

// 格式化起始日：「2025/03/23 (共395天)」
export function formatStartDate(ts) {
    const d = new Date(ts);
    const yy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yy}/${mm}/${dd} (共${daysSince(ts)}天)`;
}
