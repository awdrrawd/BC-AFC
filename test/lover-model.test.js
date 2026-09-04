import test from 'node:test';
import assert from 'node:assert/strict';
import {
    normalizeLover, normalizeLoverList, normalizeMemberNumber, sameMemberNumber,
} from '../src/relations/lover-model.js';

test('normalizes valid member numbers and rejects invalid identifiers', () => {
    assert.equal(normalizeMemberNumber('42'), 42);
    assert.equal(normalizeMemberNumber(42), 42);
    assert.equal(normalizeMemberNumber(0), null);
    assert.equal(normalizeMemberNumber('unknown'), null);
    assert.equal(sameMemberNumber('42', 42), true);
});

test('fills relationship dates consistently', () => {
    const lover = normalizeLover({ memberNumber: '42', name: 'Alice', startDate: 100 });
    assert.deepEqual(lover, {
        memberNumber: 42,
        name: 'Alice',
        stage: 0,
        startDate: 100,
        stageDate: 100,
    });
});

test('deduplicates normalized lover lists by member number', () => {
    const lovers = normalizeLoverList([
        { memberNumber: '42', name: 'Old', startDate: 1 },
        { memberNumber: 42, name: 'Current', startDate: 2 },
        { memberNumber: null, name: 'Invalid' },
    ]);
    assert.equal(lovers.length, 1);
    assert.equal(lovers[0].name, 'Current');
    assert.equal(lovers[0].memberNumber, 42);
});
