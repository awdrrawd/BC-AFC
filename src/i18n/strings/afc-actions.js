// ════════════════════════════════════════
//  文本資料（非引擎）：AFC 廣播事件字串
//  註冊到共用 L10N 引擎的 'afc' 命名空間。
//  佔位符為位置式 {0}{1}{2}{3}：{0}=發起者名 {1}=發起者ID {2}=對方名 {3}=對方ID
//  語言：EN / TW / CN / DE / FR / RU / UA（缺語言自動 fallback EN）
// ════════════════════════════════════════

export const AFC_ACTIONS = {
    becameLovers: {
        EN: `{0} (#{1}) and {2} (#{3}) became extended lovers.`,
        TW: `{0} (#{1}) 與 {2} (#{3}) 結為拓展戀人。`,
        CN: `{0} (#{1}) 与 {2} (#{3}) 结为拓展恋人。`,
        DE: `{0} (#{1}) und {2} (#{3}) sind erweiterte Liebende geworden.`,
        FR: `{0} (#{1}) et {2} (#{3}) sont devenus amants étendus.`,
        RU: `{0} (#{1}) и {2} (#{3}) стали расширенными возлюбленными.`,
        UA: `{0} (#{1}) та {2} (#{3}) стали розширеними коханими.`,
    },
    upgradedEngaged: {
        EN: `{0} (#{1}) and {2} (#{3}) upgraded their extended relationship to [engaged].`,
        TW: `{0} (#{1}) 與 {2} (#{3}) 升格為拓展 [訂婚]。`,
        CN: `{0} (#{1}) 与 {2} (#{3}) 升格为拓展 [订婚]。`,
        DE: `{0} (#{1}) und {2} (#{3}) haben ihre erweiterte Beziehung zur [Verlobung] hochgestuft.`,
        FR: `{0} (#{1}) et {2} (#{3}) ont fait évoluer leur relation étendue vers les [fiançailles].`,
        RU: `{0} (#{1}) и {2} (#{3}) повысили свои расширенные отношения до [помолвки].`,
        UA: `{0} (#{1}) та {2} (#{3}) підвищили свої розширені стосунки до [заручин].`,
    },
    upgradedMarried: {
        EN: `{0} (#{1}) and {2} (#{3}) upgraded their extended relationship to [married].`,
        TW: `{0} (#{1}) 與 {2} (#{3}) 升格為拓展 [結婚]。`,
        CN: `{0} (#{1}) 与 {2} (#{3}) 升格为拓展 [结婚]。`,
        DE: `{0} (#{1}) und {2} (#{3}) haben ihre erweiterte Beziehung zur [Ehe] hochgestuft.`,
        FR: `{0} (#{1}) et {2} (#{3}) ont fait évoluer leur relation étendue vers le [mariage].`,
        RU: `{0} (#{1}) и {2} (#{3}) повысили свои расширенные отношения до [брака].`,
        UA: `{0} (#{1}) та {2} (#{3}) підвищили свої розширені стосунки до [шлюбу].`,
    },
};
