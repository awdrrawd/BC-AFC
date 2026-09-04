export function waitForLogin(registry) {
    if (typeof Player !== 'undefined' && Player?.MemberNumber !== undefined) return Promise.resolve();
    return new Promise(resolve => {
        const removeHook = registry.hook('LoginResponse', 0, (args, next) => {
            const result = next(args);
            queueMicrotask(() => {
                if (typeof Player === 'undefined' || Player?.MemberNumber === undefined) return;
                removeHook();
                resolve();
            });
            return result;
        });
    });
}
