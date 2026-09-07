import { requestRoomNamesFromLovers, resetRoomChecks } from '../net/roomname.js';

const CHECK_INTERVAL = 5000;
const MAX_CHECKS = 5;

// 登入後開始有限次補查；上一輪完成後才排下一輪，避免查詢重疊。
export function installRoomSync(registry, check = requestRoomNamesFromLovers, reset = resetRoomChecks) {
    let cancel = () => {};
    const start = () => {
        cancel();
        reset();
        let active = true;
        let attempts = 0;
        let timer;
        cancel = () => { active = false; clearTimeout(timer); };
        const run = async () => {
            attempts++;
            let complete = false;
            try { complete = await check(() => active); }
            catch (error) { console.warn('[AFC] 房間補查失敗:', error); }
            if (active && !complete && attempts < MAX_CHECKS)
                timer = setTimeout(run, CHECK_INTERVAL);
        };
        timer = setTimeout(run, CHECK_INTERVAL);
    };
    registry.hook('LoginResponse', 0, (args, next) => {
        const result = next(args);
        const data = args[0];
        if (data?.Name && data?.AccountName && data?.ID) start();
        return result;
    });
    registry.add(() => cancel());
    start();
}
