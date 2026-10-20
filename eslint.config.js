import js from '@eslint/js';
import globals from 'globals';

// Bondage Club runtime globals that AFC / Heart Lock read/hook. Listed as read-only so the
// `no-undef` rule can catch genuinely missing cross-module imports of our own symbols
// (Rollup silently treats those as globals otherwise).
const bcGlobals = [
  'Player', 'ChatRoomCharacter', 'ChatRoomData', 'CurrentScreen', 'CurrentCharacter',
  'CurrentModule', 'TranslationLanguage', 'CharacterNickname', 'TitleGet',
  'ServerSocket', 'ServerSend', 'ServerAccountUpdate', 'ServerPlayerExtensionSettingsSync',
  'ChatRoomSendLocal', 'ChatRoomSendChat', 'ChatRoomSendEmote',
  'MainCanvas', 'DrawButton', 'DrawText', 'DrawTextFit', 'DrawTextWrap', 'DrawCheckbox',
  'DrawImage', 'DrawImageResize', 'DrawImageEx', 'DrawRect', 'DrawEmptyRect', 'DrawCircle',
  'DrawBackNextButton', 'MouseIn', 'MouseX', 'MouseY',
  'PreferenceRegisterExtensionSetting', 'PreferenceExit', 'PreferenceScreen',
  'CommandCombine', 'CommandExecute', 'LZString', 'bcModSdk',
  'InformationSheetRun', 'InformationSheetClick', 'InformationSheetExit',
  'InformationSheetCharacter', 'InformationSheetSelection', 'InformationSheetSecondScreen',
  'ElementCreateInput', 'ElementValue', 'ElementRemove', 'ElementPosition',
  'GameVersion', 'Localization', 'AssetGroup', 'Asset', 'AssetGroupGet', 'InventoryGet',
  'DialogCanUnlock', 'TextGet', 'ActivitySetArousal', 'OrgasmStage',
  'ActivityVibratorLevel', 'ActivityTimerProgress', 'ActivityChatRoomArousalSync',
  'CharacterRefresh', 'CharacterLoadCanvas', 'CharacterSetFacialExpression',
  'FriendListIDs', 'FriendListLoadFriendList', 'ChatRoomCharacterViewDraw', 'ChatRoomMenuDraw',
  'ChatRoomLeave', 'ChatRoomRun', 'Commands', 'CurrentTime', 'CommonTime', 'CommonGetFont',
  // Heart Lock 用到的 BC runtime 函式
  'AssetFemale3DCG', 'AssetAdd', 'AssetGet', 'ChatRoomCharacterUpdate', 'ChatRoomCharacterItemUpdate',
  'InventoryAdd', 'InventoryWear', 'InventoryLock', 'InventoryUnlock', 'InventoryRemove', 'CraftingValidate',
  'ElementButton', 'InventoryRemoveItems', 'AssetGetRemoveOnItemRemoveDiff',
  'CraftingSerialize', 'CraftingSerializeFieldSep', 'CraftingLockList', 'CraftingSelectedItem',
  'CraftingAssets', 'ExtendedItemTypeToRecord', 'ServerPlayerAppearanceSync', 'ServerPlayerIsInChatRoom',
  'InventoryBlockedOrLimited', 'ValidationDeleteLock', 'ValidationSanitizeProperties',
  'ValidationSanitizeLock', 'AudioPlaySoundEffect', 'CharacterGetCurrent',
  'ElementCreateTextArea', 'ElementPositionFixed', 'DialogMenuMode', 'DialogMenuButton',
  'DialogFocusSourceItem', 'DrawRect',
];

// BC 全域中可被指派（我們的程式會寫入）的變數
const bcWritableGlobals = ['DialogFocusItem', 'MouseX', 'MouseY'];

export default [
  { ignores: ['dist/**', 'node_modules/**', 'legacy/**', 'public/**', 'loader.user.js', 'loader.local.user.js', 'scripts/**', 'vite.config.js', 'eslint.config.js'] },
  js.configs.recommended,
  {
    files: ['src/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...Object.fromEntries(bcGlobals.map(g => [g, 'readonly'])),
        ...Object.fromEntries(bcWritableGlobals.map(g => [g, 'writable'])),
        __AFC_VERSION__: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': ['warn', { args: 'none', varsIgnorePattern: '^_' }],
      'no-empty': 'off',
      'no-cond-assign': 'off',
      // 對方玩家的名稱、備註等資料不可信；寫入 HTML 一律改用 textContent / DOM 節點。
      // （曾因 innerHTML 插入對方自報的名稱造成 HTML 注入。）
      // 清空容器（innerHTML = ''）允許；其餘動態 HTML 需以 eslint-disable 註明為何安全。
      'no-restricted-syntax': ['error',
        { selector: "AssignmentExpression[left.property.name=/^(innerHTML|outerHTML)$/][right.type!='Literal']",
          message: '不要把動態內容寫入 innerHTML/outerHTML；使用 textContent 或 createElement。' },
        { selector: "CallExpression[callee.property.name=/^(insertAdjacentHTML|write|writeln)$/]",
          message: '不要使用 insertAdjacentHTML / document.write 寫入動態內容。' },
      ],
    },
  },
];
