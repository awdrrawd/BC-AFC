import test from 'node:test';
import assert from 'node:assert/strict';
import { isValidGroupName, parseUnlockTime, sanitizeLockSettings } from '../src/features/heartlock/validate.js';

test('group names must be plain identifiers and never Object.prototype members', () => {
    for (const ok of ['ItemArms', 'ItemMisc', 'ItemNeckAccessories', 'ItemDevices2'])
        assert.equal(isValidGroupName(ok), true, ok);
    for (const bad of ['__proto__', 'constructor', 'toString', 'hasOwnProperty', 'valueOf', '', ' ItemArms', 'Item-Arms',
        'Item.Arms', '1Item', 'a'.repeat(65), null, undefined, 5, {}, ['ItemArms']])
        assert.equal(isValidGroupName(bad), false, String(bad));
});

test('unlock time: valid dates normalize to ISO, empty means no timer, garbage is invalid (undefined)', () => {
    assert.equal(parseUnlockTime('2030-01-01T00:00:00Z'), '2030-01-01T00:00:00.000Z');
    assert.equal(parseUnlockTime(Date.UTC(2030, 0, 1)), '2030-01-01T00:00:00.000Z');
    assert.equal(parseUnlockTime(null), null);
    assert.equal(parseUnlockTime(undefined), null);
    assert.equal(parseUnlockTime(''), null);
    for (const bad of ['garbage', {}, [], true, NaN, Infinity, 1e20]) assert.equal(parseUnlockTime(bad), undefined, String(bad));
});

test('apply-mode keeps the previous semantics: missing/invalid timer and restraint flag become off', () => {
    assert.deepEqual(sanitizeLockSettings({ note: 'hi', vibe: 'high', orgasmMode: 'edge', removeRestraints: true,
        unlockTime: '2030-01-01T00:00:00Z', owner: 999, lockId: 'x' }),
    { note: 'hi', vibe: 'high', orgasmMode: 'edge', removeRestraints: true, unlockTime: '2030-01-01T00:00:00.000Z' });
    assert.deepEqual(sanitizeLockSettings({}), { removeRestraints: false, unlockTime: null });
    assert.deepEqual(sanitizeLockSettings({ vibe: 'max', orgasmMode: 'x', removeRestraints: 'true', unlockTime: 'garbage', note: 5 }),
        { removeRestraints: false, unlockTime: null });
    assert.deepEqual(sanitizeLockSettings(null), {});
    assert.deepEqual(sanitizeLockSettings('x'), {});
});

test('update-mode only touches fields that are present AND valid, so bad input cannot corrupt a lock', () => {
    assert.deepEqual(sanitizeLockSettings({ unlockTime: 'garbage', vibe: 'max', note: {} }, { partial: true }), {});
    assert.deepEqual(sanitizeLockSettings({ unlockTime: null }, { partial: true }), { unlockTime: null });   // 明確清除計時
    assert.deepEqual(sanitizeLockSettings({ removeRestraints: false }, { partial: true }), { removeRestraints: false });
    assert.deepEqual(sanitizeLockSettings({ removeRestraints: 'yes' }, { partial: true }), {});
    assert.deepEqual(sanitizeLockSettings({ vibe: 'low' }, { partial: true }), { vibe: 'low' });
});

test('notes are capped at the configured maximum', () => {
    assert.equal(sanitizeLockSettings({ note: 'x'.repeat(10_000) }, { partial: true }).note.length, 500);
});
