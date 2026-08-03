// ════════════════════════════════════════
//  AFC module: state.js
//  跨模組共用的執行期可變狀態。
//  const 的 Set/物件直接匯出參照（多模組共用同一參照）；
//  會被「重新賦值」的原始值採 `export let` + setter（比照 BC-HSC 的 config.js）。
// ════════════════════════════════════════

// ── bcModSdk mod api（由 core-init 於註冊後 setModApi 設定）──
export let modApi = null;
export function setModApi(v) { modApi = v; }

export let isInitialized = false;
export function setInitialized(v) { isInitialized = v; }

// ── 授權 / 申請 / 房間狀態（const 容器，直接共用參照）──
export const AFCLockAccessOn   = new Set();
export const pendingOutgoing   = {};   // AFC 戀人申請（發起方）
export const pendingIncoming   = {};   // AFC 戀人申請（接收方 UI）
export const pendingStageProp  = {};   // 升格申請（發起方）
export const pendingStageInc   = {};   // 升格申請（接收方 UI）
export const loversPrivateRoom = {};
export const pendingRestoreOut = {};
export const pendingRestoreInc = {};

export let currentPrivateRoomName = "";
export function setCurrentPrivateRoomName(v) { currentPrivateRoomName = v; }

export let profilePanelOpen = false;
export function setProfilePanelOpen(v) { profilePanelOpen = v; }

// Beep 去重 Set（防止 AccountBeep + ChatRoom relay 重複觸發）
export const _recentBeepKeys = new Set();

export let profilePageFresh = false;  // 每次進入 Profile 頁面時強制刷新一次線上狀態
export function setProfilePageFresh(v) { profilePageFresh = v; }

// memberNumber -> 好友紀錄 { ChatRoomName, ChatRoomSpace, Private, ... }（.has 語意同 Set）
export let onlineFriendsCache = new Map();
export function setOnlineFriendsCache(v) { onlineFriendsCache = v; }

export let lastOnlineFetch = 0;
export function setLastOnlineFetch(v) { lastOnlineFetch = v; }

// lastProposalSent：只需 runtime 保存，不需寫入 ExtensionSettings
// 頁面重整後冷卻自然重置，這是正確行為
export const _lastProposalSent = {};

// 可靠傳輸層
export const _pendingAcks = {};   // mid -> { timer }
export let _midSeq = 0;
export function bumpMidSeq() { return _midSeq++; }

// 上一次已知的戀人數量（防止異常覆蓋）
export let _lastKnownLoverCount = -1;
export function setLastKnownLoverCount(v) { _lastKnownLoverCount = v; }

// Profile 主人燈號 Y 座標（由 DrawTextFit hook 攔截更新）
export let _ownerTextY  = null;
export function setOwnerTextY(v) { _ownerTextY = v; }
export let _inInfoSheet = false;
export function setInInfoSheet(v) { _inInfoSheet = v; }
