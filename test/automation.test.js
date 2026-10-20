import test from 'node:test';
import assert from 'node:assert/strict';
import { extractHookTargets, findMissing } from '../scripts/check-bc-compat.mjs';
import { findOrphans } from '../scripts/check-orphans.mjs';

test('hook targets are extracted from literals, quote styles, namespaced names and loop lists', () => {
    const source = `
        hook("ChatRoomMessage", 5, a);
        hook('DialogCanUnlock', 5, b);
        modApi.hookFunction('ElementButton.CreateForAsset', 1, c);
        for (const event of ['ChatRoomSyncCharacter', 'ChatRoomSyncSingle']) {
            hook(event, 1, d);
        }
        // hook(variable, 1, e) is not a literal and must not be reported
        hook(variable, 1, e);`;
    assert.deepEqual(extractHookTargets([source]), [
        'ChatRoomMessage', 'ChatRoomSyncCharacter', 'ChatRoomSyncSingle', 'DialogCanUnlock', 'ElementButton.CreateForAsset',
    ]);
});

test('missing BC functions are reported; functions, variables, namespaces and generated item functions are found', () => {
    const bc = `
        function ChatRoomMessage(data) {}
        var DialogCanUnlock = function () {};
        const ElementButton = {
            CreateForAsset: function CreateForAsset(a) {},
        };
        function InventoryItemMiscHighSecurityPadlockDrawHook(data, original) {}
    `;
    assert.deepEqual(findMissing([
        'ChatRoomMessage', 'DialogCanUnlock', 'ElementButton.CreateForAsset', 'InventoryItemMiscHighSecurityPadlockDraw',
    ], bc), []);
    assert.deepEqual(findMissing(['ChatRoomMessageRenamed', 'ElementButton.Gone', 'ChatRoomMessag'], bc),
        ['ChatRoomMessageRenamed', 'ElementButton.Gone', 'ChatRoomMessag']);
});

test('a module nobody imports is an orphan; entries, extensionless and relative imports are resolved', () => {
    const files = {
        'src/main.js': "import './app.js';",
        'src/app.js': "import { a } from './core/a.js'; import('./lazy/b.js');",
        'src/core/a.js': "import { c } from '../util/c';",
        'src/util/c.js': 'export const c = 1;',
        'src/lazy/b.js': 'export const b = 1;',
        'src/net/legacy-feed.js': "export function legacyFeed() {}",
        'test/x.test.js': "import { c } from '../src/util/c.js';",
    };
    assert.deepEqual(findOrphans(files), ['src/net/legacy-feed.js']);
    files['test/y.test.js'] = "import '../src/net/legacy-feed.js';";
    assert.deepEqual(findOrphans(files), [], 'a module used only by a test is not an orphan');
});

test('an import that only appears inside a string or comment does not keep a module alive', () => {
    const files = {
        'src/main.js': "import './app.js';",
        'src/app.js': "// import './old.js'\nconst note = \"import './old.js'\";\nexport const x = 1;",
        'src/old.js': 'export const old = 1;',
        'test/fixture.test.js': "const fixture = \"import '../src/old.js';\";",
    };
    assert.deepEqual(findOrphans(files), ['src/old.js']);
});

test('multi-line, re-export and side-effect imports all count as real imports', () => {
    const files = {
        'src/main.js': "import {\n  a,\n  b,\n} from './a.js';\nexport * from './b.js';\nexport { c } from './c.js';\nimport './d.js';",
        'src/a.js': '', 'src/b.js': '', 'src/c.js': '', 'src/d.js': '', 'src/e.js': '',
    };
    assert.deepEqual(findOrphans(files), ['src/e.js']);
});
