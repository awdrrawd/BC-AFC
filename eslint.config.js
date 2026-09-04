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
  'InventoryAdd', 'InventoryWear', 'InventoryLock', 'InventoryUnlock', 'InventoryRemove',
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
    },
  },
];
