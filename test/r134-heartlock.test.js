import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { URL } from 'node:url';
import { HEARTLOCK_NAME, HSLOCK_NAME } from '../src/features/heartlock/config.js';
import { HEARTLOCK_PROPERTY_KEYS } from '../src/compat/heartlock-markers.js';
import { installHeartLockValidateHook } from '../src/compat/r134-heartlock.js';

// BC R134 started calling ItemPropertiesValidate from ExtendedItemInit, ValidationSanitizeProperties and
// ItemPropertiesDecompress, each of which overwrites Item.Property with the result. The native function only
// copies keys that have a PropertyData entry. This runs the real R134 function text against a PropertyData
// stub that registers only what BC R134 registers for padlocks (not Name / HeartLockId / ExclusiveUnlock).

const entry = () => ({ validate: (value) => ({ status: 'ok', value }) });

function r134Runtime() {
    const context = vm.createContext({
        CommonIsObject: value => value != null && typeof value === 'object' && !Array.isArray(value),
        CommonEntries: Object.entries,
        CommonAssign: Object.assign,
        CommonMax: Math.max,
        CommonObjectFlip: object => Object.fromEntries(Object.entries(object).map(([k, v]) => [v, k])),
        ItemPropertiesValidationStatus: { ok: 0, error: 1, criticalError: 2 },
        AppearanceItem: { fromAsset: (asset, options) => ({ Asset: asset, Property: options.property }) },
        ItemPropertiesGetBundleProperties: () => ({ extendedOptions: [] }),
        PropertyData: Object.fromEntries(['LockedBy', 'LockPickSeed', 'LockMemberNumber', 'LockMemberName', 'MemberNumberListKeys', 'TranslationX']
            .map(key => [key, entry()])),
    });
    vm.runInContext(fs.readFileSync(new URL('./fixtures/r134-validate.txt', import.meta.url), 'utf8'), context);
    return context;
}

function hooked() {
    const context = r134Runtime();
    const registered = [];
    installHeartLockValidateHook((name, priority, callback) => {
        registered.push([name, priority]);
        const original = context[name];
        context[name] = (...args) => callback(args, values => original(...values));
    });
    return { context, registered };
}

const asset = { Name: 'Cuffs', Group: { Name: 'ItemArms' } };
const heartLock = () => ({ LockedBy: HSLOCK_NAME, LockMemberNumber: 2, Name: HEARTLOCK_NAME, HeartLockId: 'lock-1',
    LockPickSeed: '8,3,5', ExclusiveUnlock: true, MemberNumberListKeys: '2', UnknownPluginField: 42 });

test('R134 native validation drops the Heart Lock markers (the regression this hook exists for)', () => {
    const { value } = r134Runtime().ItemPropertiesValidate(heartLock(), asset, {});
    for (const key of ['Name', 'HeartLockId', 'ExclusiveUnlock']) assert.equal(value[key], undefined, key);
    assert.equal(value.LockedBy, HSLOCK_NAME);
    assert.equal(value.LockPickSeed, '8,3,5');
});

test('the hook is registered and restores only the AFC markers on a validated HighSecurityPadlock', () => {
    const { context, registered } = hooked();
    assert.ok(registered.some(([name, priority]) => name === 'ItemPropertiesValidate' && Number.isFinite(priority)));
    const source = heartLock();
    const { value, status } = context.ItemPropertiesValidate(source, asset, {});
    assert.equal(status, 'ok');
    assert.equal(value.Name, HEARTLOCK_NAME);
    assert.equal(value.HeartLockId, 'lock-1');
    assert.equal(value.ExclusiveUnlock, true);
    assert.equal(value.LockPickSeed, '8,3,5');
    assert.equal(value.UnknownPluginField, undefined, 'other plugins\' fields stay filtered');
    assert.notEqual(value, source, 'validation still returns a fresh object');
    assert.equal(source.HeartLockId, 'lock-1');
});

test('init and sanitize overwrite Item.Property repeatedly; markers survive every pass', () => {
    const { context } = hooked();
    const item = { Asset: asset, Property: heartLock() };
    for (let pass = 0; pass < 3; pass++) item.Property = context.ItemPropertiesValidate(item.Property, item.Asset, {}).value;
    for (const key of HEARTLOCK_PROPERTY_KEYS) assert.notEqual(item.Property[key], undefined, key);
});

test('BC-validated values win; omit and wrong types are respected', () => {
    const { context } = hooked();
    context.PropertyData.LockPickSeed = { validate: () => ({ status: 'ok', value: 'bc-value' }) };
    assert.equal(context.ItemPropertiesValidate(heartLock(), asset, {}).value.LockPickSeed, 'bc-value');

    const omitted = context.ItemPropertiesValidate(heartLock(), asset, { omit: ['HeartLockId', 'ExclusiveUnlock'] }).value;
    assert.equal(omitted.HeartLockId, undefined);
    assert.equal(omitted.ExclusiveUnlock, undefined);
    assert.equal(omitted.Name, HEARTLOCK_NAME);

    const bad = context.ItemPropertiesValidate({ ...heartLock(), HeartLockId: 7, ExclusiveUnlock: 'yes' }, asset, {}).value;
    assert.equal(bad.HeartLockId, undefined);
    assert.equal(bad.ExclusiveUnlock, undefined);
});

test('nothing is restored for ordinary items, other locks, unmarked padlocks or invalid input', () => {
    const { context } = hooked();
    const cases = [
        { LockedBy: HSLOCK_NAME, LockMemberNumber: 2, LockPickSeed: 'x' },                          // ordinary HighSecurityPadlock
        { Name: HEARTLOCK_NAME, HeartLockId: 'lock-1' },                                            // no lock at all
        { LockedBy: 'ExclusivePadlock', Name: HEARTLOCK_NAME, HeartLockId: 'lock-1' },              // some other lock
        { LockedBy: HSLOCK_NAME, Name: 'Other Padlock', ExclusiveUnlock: true },                    // lookalike without an id
    ];
    for (const properties of cases) {
        const { value } = context.ItemPropertiesValidate(properties, asset, {});
        for (const key of ['Name', 'HeartLockId', 'ExclusiveUnlock']) assert.equal(value[key], undefined, JSON.stringify(properties));
    }
    for (const bad of [undefined, null, 'x', 5, []]) assert.doesNotThrow(() => context.ItemPropertiesValidate(bad, asset));
});
