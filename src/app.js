// ════════════════════════════════════════
//  AFC application (loaded by main.js and bundled by vite → assets/main.js)
//  Loader (loader.user.js / loader.local.user.js) dynamically imports this file.
//  Modules are grouped by area under ./<category>/:
//    core/       — config, state, socket, settings, storage, commands, hooks, core-init
//    i18n/       — i18n
//    util/       — util, toast
//    net/        — beep, beep-router, roomname, online, sync-data
//    relations/  — lovers, propose, stage, restore, reconcile, breakup, dialog
//    ui/         — proposal-ui, profile, settings-page
//    heartlock/  — 心形鎖（原獨立插件，現為 bundle 內模組，隨 AFC 一起啟動）
// ════════════════════════════════════════

import { MOD_VERSION } from './core/config.js';
import { initialize } from './core/core-init.js';

// main.js has already claimed this object before any dependency executes.
Object.assign(window.Liko.AFC, { version: MOD_VERSION });
initialize();
