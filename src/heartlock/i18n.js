// ════════════════════════════════════════
//  HeartLock module: i18n.js  （薄轉接層，不含引擎也不含文本）
//  心形鎖是 AFC 底下的工具，翻譯行為必須與 AFC 一致 → 不再自帶語言偵測/查表引擎，
//  一律委派共用的 L10N 引擎（window.Liko.L10N）。
//    文本：src/i18n/strings/heartlock-ui.js（UI）＋ heartlock-actions.js（廣播）
//    由 heartlock/init.js 一併註冊到共用引擎的 'hl' 命名空間。
//  T(key, ...args)：等同 L10N.t('hl', key, ...args)（7 語、TW/CN 退 ZH、{0} 佔位）。
// ════════════════════════════════════════

import { L10N } from '../i18n/l10n.js';

export function T(key, ...args) {
    return L10N.t('hl', key, ...args);
}
