// ════════════════════════════════════════
//  AFC application (loaded by main.js and bundled by vite → assets/main.js)
//  Loader (loader.user.js / loader.local.user.js) dynamically imports this file.
//  Modules are grouped by area under ./<category>/:
//    core/       — config, state, socket, settings, storage, commands, hooks, core-init
//    i18n/       — i18n
//    util/       — util, toast
//    net/        — beep, beep-router, roomname, online, sync-data
//    features/   — relationship workflows and HeartLock behavior
//    ui/         — proposal-ui, profile, settings-page
//    hooks/      — BC integration hooks
//    compat/     — R132 and BCX interoperability
// ════════════════════════════════════════

import { MOD_VERSION } from './core/config.js';
import { initialize } from './core/core-init.js';

// main.js has already claimed this object before any dependency executes.
Object.assign(window.Liko.AFC, { version: MOD_VERSION });
initialize();
