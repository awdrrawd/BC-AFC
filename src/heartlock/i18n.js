// ════════════════════════════════════════
//  HeartLock module: i18n.js  （薄轉接層，不含引擎也不含文本）
//  心形鎖是 AFC 底下的工具，翻譯行為必須與 AFC 一致 → 不再自帶語言偵測/查表引擎，
//  一律委派共用的 L10N 引擎（window.Liko.L10N）。
//    文本：根目錄 Translation/<LANG>.js（含 afc + hl 兩命名空間；執行期由 AFC fetch）。
//    由 AFC core-init 的 registerFallback()（TW+EN 後備）＋ ensureAfcI18n()（fetch）註冊到 'hl'。
//  T(key, ...args)：等同 L10N.t('hl', key, ...args)（7 語 EN/TW/CN/DE/FR/RU/UA、{0} 佔位）。
// ════════════════════════════════════════

import { L10N } from '../i18n/l10n.js';

export function T(key, ...args) {
    return L10N.t('hl', key, ...args);
}
