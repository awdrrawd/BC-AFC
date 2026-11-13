import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { URL } from 'node:url';
import { createHookRegistry } from '../src/hooks/registry.js';

test('registry releases hooks once and cancels timers in disposed scopes', t => {
    t.mock.timers.enable({ apis: ['setTimeout', 'setInterval'] });
    let removed = 0, fired = 0;
    const registry = createHookRegistry({ hookFunction: () => () => { removed++; } });
    const remove = registry.hook('example', 0, () => {});
    remove(); remove();
    const child = registry.scope();
    child.hook('example', 0, () => {});
    child.timeout(() => { fired++; }, 10);
    child.interval(() => { fired++; }, 10);
    child.dispose();
    registry.timeout(() => { fired++; }, 5);
    t.mock.timers.tick(10);
    assert.equal(fired, 1);
    registry.dispose(); registry.dispose();
    assert.equal(removed, 2);
    registry.scope().timeout(() => { fired++; }, 1);
    t.mock.timers.tick(10);
    assert.equal(fired, 1);
});

function profileRuntime() {
    const hooks = {};
    const c = vm.createContext({
        console: { log() {}, error() {} },
        installRelationshipVisualHooks() {}, installRelationshipDialogHooks() {}, registerSocketListener() {},
        profilePanelOpen: true, CurrentScreen: 'InformationSheet', InformationSheetSecondScreen: false,
        PROFILE_PANEL_X: 0, PROFILE_PANEL_Y: 0, PROFILE_PANEL_W: 100, PROFILE_PANEL_H: 100,
        MouseX: 50, MouseY: 60, profilePageFresh: true, Player: { MemberNumber: 1 },
        setOwnerTextY() {}, getCurrentViewingCharacter: () => null,
        drawProfileButton() {}, drawProfilePanel() {},
    });
    c.setInInfoSheet = value => { c.inInfoSheet = value; };
    vm.runInContext(fs.readFileSync(new URL('../src/hooks/index.js', import.meta.url), 'utf8')
        .replace(/^import [\s\S]*?;\r?\n/gm, '').replace(/export /g, ''), c);
    c.setupHooks({ hook: (name, _priority, fn) => { hooks[name] = fn; } });
    return { c, run: hooks.InformationSheetRun };
}

test('profile rendering restores mouse state and never repeats native rendering after an error', () => {
    const { c, run } = profileRuntime();
    let calls = 0;
    const native = () => {
        calls++;
        assert.equal(c.MouseX, -9999);
        return 'native result';
    };
    c.drawProfilePanel = () => { throw Error('AFC drawing failed'); };
    assert.equal(run([], native), 'native result');
    assert.equal(calls, 1);
    assert.equal(c.MouseX, 50);
    assert.equal(c.MouseY, 60);
    assert.equal(c.inInfoSheet, false);
    assert.throws(() => run([], () => { calls++; throw Error('native failed'); }), /native failed/);
    assert.equal(calls, 2);
    assert.equal(c.MouseX, 50);
    assert.equal(c.inInfoSheet, false);
});

test('friend decoration indexes members once and supports the default container ID', () => {
    let reads = 0;
    const lovers = [{ memberNumber: '2', stage: 1 }, { memberNumber: 2, stage: 0 }];
    Object.defineProperty(lovers[0], 'memberNumber', { get() { reads++; return '2'; } });
    const relations = Array.from({ length: 20 }, () => ({ childNodes: [{ nodeType: 3 }], style: {} }));
    const c = vm.createContext({
        getSharedSettings: () => ({ lovers }), stageLabel: stage => `stage ${stage}`,
        STAGE_COLOR: { 1: 'pink' }, Node: { TEXT_NODE: 3 },
        document: { getElementById(id) {
            assert.equal(id, 'FriendListContent');
            return { getElementsByClassName: () => relations.map(relation => ({
                querySelector: selector => selector === '.MemberNumber' ? { innerText: ' 2 ' } : relation,
            })) };
        } },
    });
    vm.runInContext(fs.readFileSync(new URL('../src/hooks/relationship-visual.js', import.meta.url), 'utf8')
        .replace(/^import [\s\S]*?;\r?\n/gm, '').replace(/export /g, ''), c);
    c.decorateFriendList();
    assert.equal(reads, 1);
    for (const relation of relations) {
        assert.ok(relation.childNodes[0].textContent.endsWith('stage 1'));
        assert.equal(relation.style.color, 'pink');
    }
});
