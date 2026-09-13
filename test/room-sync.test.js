import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { URL } from 'node:url';
import console from 'node:console';

function setup(check) {
    const timers = new Map();
    const hooks = new Map();
    let dispose;
    let resets = 0;
    let id = 0;
    const context = vm.createContext({ console,
        setTimeout: (fn, ms) => { assert.equal(ms, 5000); timers.set(++id, fn); return id; },
        clearTimeout: key => timers.delete(key),
    });
    const source = fs.readFileSync(new URL('../src/hooks/room-sync.js', import.meta.url), 'utf8')
        .replace(/^import .*;\r?\n/gm, '').replace(/export /g, '');
    vm.runInContext(source, context);
    context.installRoomSync({
        hook: (name, priority, callback) => hooks.set(name, callback),
        add: fn => { dispose = fn; },
    }, check, () => resets++);
    return { timers, get resets() { return resets; }, dispose: () => dispose(),
        login: data => hooks.get('LoginResponse')([data], () => {}),
        async tick() { const [key, fn] = timers.entries().next().value; timers.delete(key); await fn(); },
    };
}

test('waits five seconds and stops once everyone is confirmed', async () => {
    let calls = 0;
    const run = setup(() => { calls++; return true; });
    assert.equal(calls, 0);
    assert.equal(run.timers.size, 1);
    await run.tick();
    assert.equal(calls, 1);
    assert.equal(run.timers.size, 0);
});

test('unconfirmed people and failures stop after five checks', async () => {
    let calls = 0;
    const run = setup(() => { calls++; return false; });
    for (let i = 0; i < 5; i++) await run.tick();
    assert.equal(calls, 5);
    assert.equal(run.timers.size, 0);
});

test('successful relog replaces old work; failed login does not restart; unload cancels', async () => {
    let valid;
    const run = setup(active => { valid = active; return false; });
    await run.tick();
    run.login('InvalidPassword');
    assert.equal(run.resets, 1);
    run.login({Name: 'A', AccountName: 'A', ID: '42'});
    assert.equal(run.resets, 2);
    assert.equal(valid(), false);
    assert.equal(run.timers.size, 1);
    run.dispose();
    assert.equal(run.timers.size, 0);
});

test('room checks distinguish public rooms, offline, lobby replies and missing replies', async () => {
    const cache = new Map([[2, {Private: false, ChatRoomName: 'Public'}], [3, {Private: true}], [4, {}]]);
    const rooms = {1: {ChatRoomName: 'Old'}};
    const sent = [];
    const context = vm.createContext({ onlineFriendsCache: cache, loversPrivateRoom: rooms,
        refreshOnlineFriends: async () => true, getSharedSettings: () => ({lovers: [1,2,3,4].map(memberNumber => ({memberNumber}))}),
        sleep: async () => {}, isAFCLover: n => [1,2,3,4].includes(n),
        sendAccountBeep: (...args) => sent.push(args), window: {ServerPlayerIsInChatRoom: () => true},
        AB: {REQ_ROOM: 'ReqRoom', ROOM_NAME: 'RoomName', DEL_ROOM: 'DelRoom'}, AFC_AB_TYPE: 'afcBeep',
    });
    const source = fs.readFileSync(new URL('../src/net/roomname.js', import.meta.url), 'utf8')
        .replace(/^import .*;\r?\n/gm, '').replace(/export /g, '');
    vm.runInContext(source, context);
    assert.equal(await context.requestRoomNamesFromLovers(() => true), false);
    assert.equal(rooms[1], undefined);
    assert.equal(rooms[2], undefined);
    assert.deepEqual(sent.map(args => args[0]), [3,4]);
    context.parseAccountBeep({MemberNumber: 3, BeepType: 'afcBeep', Message: 'RoomName', ChatRoomName: 'Private'});
    context.parseAccountBeep({MemberNumber: 4, BeepType: 'afcBeep', Message: 'DelRoom'});
    sent.length = 0;
    assert.equal(await context.requestRoomNamesFromLovers(() => true), true);
    assert.equal(sent.length, 0);
    assert.equal(context.getLoverRoom(2).ChatRoomName, 'Public');
    assert.equal(context.getLoverRoom(3).ChatRoomName, 'Private');
    assert.equal(context.getLoverRoom(4), null);
    assert.equal(context.getLoverRoom(99), null);
    cache.set(3, { Private: false, ChatRoomName: 'New public' });
    assert.equal(context.getLoverRoom(3).ChatRoomName, 'New public');
    cache.set(3, { Private: true });
    context.resetRoomChecks();
    assert.equal(await context.requestRoomNamesFromLovers(() => true), false);
});
