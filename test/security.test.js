import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { URL } from 'node:url';
import console from 'node:console';
import { extractHiddenBeep, peerName } from '../src/net/hidden-beep.js';
import {
    sanitizePeerLovers, sanitizeLockPerms, sanitizeStage, sanitizeTimestamp,
} from '../src/features/relationships/lover-model.js';

const ME = 1000;
const beep = (sender, entry, extra = {}) => ({
    Type: 'Hidden', Content: 'AFC::Beep', Sender: sender,
    Dictionary: [{ Tag: 'AFC::Beep', MsgType: 'AFCBreakup', TargetMember: ME, ...entry }], ...extra,
});

// ── 身份偽造 ────────────────────────────────────────────────

test('a forged MemberNumber/MemberName/BeepType/Message inside the payload cannot override the server-stamped sender', () => {
    const result = extractHiddenBeep(beep(666, {
        MemberNumber: 123, MemberName: 'Victim', BeepType: 'x', Message: 'AFCAccept', SenderName: 'Mallory',
    }), ME);
    assert.equal(result.MemberNumber, 666);          // 伺服器蓋章的 Sender，而不是 123
    assert.equal(result.MemberName, '#666');
    assert.equal(result.BeepType, 'AFC::Beep');
    assert.equal(result.Message, 'AFCBreakup');       // MsgType，而不是 payload 的 Message
    assert.equal(result.SenderName, 'Mallory');       // 一般 payload 欄位仍然保留
});

test('reliable-transport fields survive; routing fields are stripped from the payload', () => {
    const result = extractHiddenBeep(beep(7, { _mid: '7-abc-1', AckId: 'z', TargetMember: ME }), ME);
    assert.equal(result._mid, '7-abc-1');
    assert.equal(result.AckId, 'z');
    assert.equal(result.Tag, undefined);
    assert.equal(result.TargetMember, undefined);
    assert.equal(result.MsgType, undefined);
});

test('beeps for someone else, malformed senders and malformed dictionaries are ignored', () => {
    assert.equal(extractHiddenBeep(beep(7, { TargetMember: 2000 }), ME), null);
    assert.equal(extractHiddenBeep(beep('7', {}), ME), null);
    assert.equal(extractHiddenBeep(beep(-1, {}), ME), null);
    assert.equal(extractHiddenBeep(beep(7, { MsgType: 42 }), ME), null);
    assert.equal(extractHiddenBeep({ ...beep(7, {}), Type: 'Chat' }, ME), null);
    assert.equal(extractHiddenBeep({ ...beep(7, {}), Dictionary: 'x' }, ME), null);
    assert.equal(extractHiddenBeep({ ...beep(7, {}), Dictionary: [null, undefined, 3] }, ME), null);
    assert.equal(extractHiddenBeep(null, ME), null);
});

test('self-reported names are text only: type-checked, control characters removed, length capped', () => {
    assert.equal(peerName('Alice', '#1'), 'Alice');
    assert.equal(peerName(undefined, '#1'), '#1');
    assert.equal(peerName({ toString: () => 'x' }, '#1'), '#1');
    assert.equal(peerName('  \u0000\u001fBo\u007fb  ', '#1'), 'Bob');
    assert.equal(peerName('   ', '#1'), '#1');
    assert.equal(peerName('a'.repeat(500), '#1').length, 40);
});

// ── 對方資料邊界 ───────────────────────────────────────────

test('peer lover lists are bounded, typed and never invent dates', () => {
    const now = Date.now();
    const result = sanitizePeerLovers([
        null, 5, 'x', [], { memberNumber: 'abc' }, { memberNumber: -3 },
        { memberNumber: '42', name: 'Eve\u0000\u0001', stage: 9, startDate: 'soon', stageDate: now + 10 * 86400000 },
        { memberNumber: 43, name: 7, stage: '2', startDate: 100, stageDate: 200 },
        { memberNumber: 43, name: 'dup' },
    ]);
    assert.deepEqual(result, [
        { memberNumber: 42, name: 'Eve' },
        { memberNumber: 43, name: 'dup', stage: 2, startDate: 100, stageDate: 200 },
    ].map((lover, i) => i === 1 ? { memberNumber: 43, name: 'dup' } : lover));
    // 沒有 Date.now() 被填入
    assert.equal('startDate' in result[0], false);
    assert.equal('stage' in result[0], false);
});

test('peer lover list is capped at MAX_AFC_LOVERS and non-arrays become empty', () => {
    const many = Array.from({ length: 500 }, (_, i) => ({ memberNumber: i + 1 }));
    assert.equal(sanitizePeerLovers(many).length, 20);
    assert.deepEqual(sanitizePeerLovers('not an array'), []);
    assert.deepEqual(sanitizePeerLovers(undefined), []);
});

test('lock permissions only accept an explicit true', () => {
    assert.deepEqual(sanitizeLockPerms({ enableAFCLock: 'yes', enableOwnerLock: 1 }), { enableAFCLock: false, enableOwnerLock: false });
    assert.deepEqual(sanitizeLockPerms({ enableAFCLock: true }), { enableAFCLock: true, enableOwnerLock: false });
    assert.deepEqual(sanitizeLockPerms(null), { enableAFCLock: false, enableOwnerLock: false });
});

test('stage and timestamp sanitizers', () => {
    assert.equal(sanitizeStage(0), 0);
    assert.equal(sanitizeStage('2'), 2);
    for (const bad of [3, -1, 1.5, 'x', '', ' ', null, undefined, NaN, true, false, [], {}]) assert.equal(sanitizeStage(bad), undefined);
    assert.equal(sanitizeTimestamp(0, 10), 0);
    assert.equal(sanitizeTimestamp(10, 10), 10);
    for (const bad of [-1, NaN, Infinity, 'x', '', null, undefined, true, [], 10 + 86400001]) assert.equal(sanitizeTimestamp(bad, 10), undefined);
});

function syncContext(sender, characters) {
    const context = vm.createContext({
        console, structuredClone: globalThis.structuredClone,
        Player: { MemberNumber: ME }, ChatRoomCharacter: characters,
        ServerSend() {}, getSharedSettings: () => null, sanitizePeerLovers, sanitizeLockPerms,
    });
    vm.runInContext(fs.readFileSync(new URL('../src/net/sync-data.js', import.meta.url), 'utf8')
        .replace(/^import .*;\r?\n/gm, '').replace(/export /g, ''), context);
    return context;
}

test('P2P AFC::Sync data is sanitized before it is written onto the sender', () => {
    const sender = { MemberNumber: 5, OnlineSharedSettings: {} };
    const c = syncContext(5, [sender]);
    c.handleAFCSyncData({ Content: 'AFC::Sync', Sender: 5, Dictionary: [null, { Tag: 'AFCData', Data: {
        memberNumber: 5, lovers: [null, { memberNumber: 9, stage: 77 }, 'x'], lockPerms: { enableAFCLock: 'true', enableOwnerLock: true },
    } }] });
    assert.deepEqual(sender.OnlineSharedSettings.AFC.lovers, [{ memberNumber: 9 }]);
    assert.deepEqual(sender.OnlineSharedSettings.AFC.lockPerms, { enableAFCLock: false, enableOwnerLock: true });
});

test('P2P AFC::Sync rejects a sender claiming to be someone else, self-broadcasts and non-objects', () => {
    const sender = { MemberNumber: 5, OnlineSharedSettings: {} };
    const c = syncContext(5, [sender]);
    c.handleAFCSyncData({ Content: 'AFC::Sync', Sender: 5, Dictionary: [{ Tag: 'AFCData', Data: { memberNumber: 6, lovers: [{ memberNumber: 9 }] } }] });
    c.handleAFCSyncData({ Content: 'AFC::Sync', Sender: 5, Dictionary: [{ Tag: 'AFCData', Data: 'string' }] });
    c.handleAFCSyncData({ Content: 'AFC::Sync', Sender: ME, Dictionary: [{ Tag: 'AFCData', Data: { lovers: [{ memberNumber: 9 }] } }] });
    assert.deepEqual(sender.OnlineSharedSettings, {});
});

// ── HTML 注入 ──────────────────────────────────────────────

// 最小假 DOM：任何對 innerHTML 的寫入都視為失敗。
function fakeDocument() {
    const byId = new Map();
    const make = tag => {
        const el = {
            tag, children: [], style: {}, listeners: {}, _text: '', id: '',
            append(...nodes) { this.children.push(...nodes); },
            appendChild(node) { this.children.push(node); return node; },
            addEventListener(type, fn) { this.listeners[type] = fn; },
            remove() { byId.delete(this.id); },
            get textContent() { return this._text; },
            set textContent(v) { this._text = String(v); },
            get innerHTML() { return ''; },
            set innerHTML(_) { throw new Error('innerHTML must not be used for untrusted text'); },
        };
        return el;
    };
    const body = make('body');
    const doc = {
        body, createElement: make,
        getElementById: id => byId.get(id) ?? null,
        register: el => byId.set(el.id, el),
    };
    return doc;
}

function proposalContext() {
    const document = fakeDocument();
    const context = vm.createContext({
        console, document, PROPOSE_EXPIRE_MS: 180000, t: key => key, chatLocalNotice() {},
        setInterval() { return 1; }, clearInterval() {},
    });
    vm.runInContext(fs.readFileSync(new URL('../src/ui/relationships/proposal.js', import.meta.url), 'utf8')
        .replace(/^import .*;\r?\n/gm, '').replace(/export /g, ''), context);
    return { context, document };
}

test('proposal UI renders an attacker-controlled name as text, never as HTML', () => {
    const { context, document } = proposalContext();
    const payload = '<img src=x onerror=alert(1)>';
    let accepted = 0;
    const el = context.createProposalUI({ uiId: 'u1', title: `♥ ${payload} (1)`, subText: payload,
        onAccept: () => accepted++, onDecline() {} });
    assert.ok(el, 'UI is created without touching innerHTML');
    const [heading, row] = el.children;
    assert.equal(heading.textContent, `♥ ${payload} (1)`);
    const [ok, no, sub] = row.children;
    assert.equal(sub.textContent, payload);
    assert.equal(ok.id, 'u1-ok'); assert.equal(no.id, 'u1-no'); assert.equal(sub.id, 'u1-sub');
    ok.listeners.click();
    assert.equal(accepted, 1);
    assert.equal(document.body.children.includes(el), true);
});

// ── 對話選項注入 ───────────────────────────────────────────

function dialogContext(flags) {
    const context = vm.createContext({ console, t: key => key, window: null });
    context.window = Object.assign(context, {
        ChatRoomAFCCanPropose: () => flags.propose, ChatRoomAFCCanRestore: () => flags.restore,
        ChatRoomAFCCanProposeEngage: () => false, ChatRoomAFCCanProposeMarry: () => false,
        ChatRoomAFCCanBreakup: () => flags.breakup,
    });
    vm.runInContext(fs.readFileSync(new URL('../src/features/relationships/dialog.js', import.meta.url), 'utf8')
        .replace(/^import .*;\r?\n/gm, '').replace(/export /g, ''), context);
    return context;
}

const menu = () => [
    { Stage: 'RelationshipSubmenu', NextStage: '0' },
    { Stage: 'RelationshipSubmenu', NextStage: '10' },
    { Stage: 'Other' },
];

test('dialog injection is idempotent: unchanged state does not mutate the array every frame', () => {
    const flags = { propose: true, restore: false, breakup: false };
    const c = dialogContext(flags);
    const C = { Dialog: menu() };
    c.injectAFCDialogs(C);
    const afc = () => C.Dialog.filter(d => d.__AFC__);
    assert.deepEqual(afc().map(d => d.__AFC__), ['propose']);
    const first = afc()[0];
    const length = C.Dialog.length;
    for (let i = 0; i < 100; i++) c.injectAFCDialogs(C);
    assert.equal(afc()[0], first, 'same entry object is kept');
    assert.equal(C.Dialog.length, length);
});

test('dialog injection follows state changes and recovers if the game rebuilt the array', () => {
    const flags = { propose: true, restore: false, breakup: false };
    const c = dialogContext(flags);
    const C = { Dialog: menu() };
    c.injectAFCDialogs(C);
    flags.propose = false; flags.breakup = true;
    c.injectAFCDialogs(C);
    assert.deepEqual(C.Dialog.filter(d => d.__AFC__).map(d => d.__AFC__), ['breakup']);
    // 注入位置在「Back」之前
    assert.equal(C.Dialog.findIndex(d => d.__AFC__) < C.Dialog.findIndex(d => d.NextStage === '10'), true);
    // 遊戲重建 Dialog 陣列
    C.Dialog = menu();
    c.injectAFCDialogs(C);
    assert.deepEqual(C.Dialog.filter(d => d.__AFC__).map(d => d.__AFC__), ['breakup']);
    // 被外部移除也會補回
    C.Dialog = C.Dialog.filter(d => !d.__AFC__);
    c.injectAFCDialogs(C);
    assert.equal(C.Dialog.filter(d => d.__AFC__).length, 1);
});
