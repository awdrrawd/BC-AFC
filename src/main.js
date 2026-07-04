// ════════════════════════════════════════
//  AFC entry (bundled by vite → assets/main.js)
//  Loader (loader.user.js / loader.local.user.js) dynamically imports this file.
//  Modules are grouped by area under ./<category>/:
//    core/       — config, state, socket, settings, storage, legacy, commands, hooks, core-init
//    i18n/       — i18n
//    util/       — util, toast
//    net/        — beep, beep-router, roomname, online, sync-data
//    relations/  — lovers, propose, stage, restore, reconcile, breakup, dialog
//    ui/         — proposal-ui, profile, settings-page
//    heartlock/  — 心形鎖（原獨立插件，現為 bundle 內模組，隨 AFC 一起啟動）
// ════════════════════════════════════════

import { MOD_VERSION } from './core/config.js';
import { initialize } from './core/core-init.js';

// 對外唯一入口：window.Liko.AFC（AFC + Heart Lock 合併於同一物件；loader 先設 'loading'）
//  登入完成後由 core-init 填入戀人 API，heartlock/init 把心形鎖 API 掛在其下的 .heartLock。
window.Liko = window.Liko ?? {};
window.Liko.AFC = { version: MOD_VERSION };

initialize();
