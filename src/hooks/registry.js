// 統一管理 bcModSdk hooks、計時器與額外清理函式。
export function createHookRegistry(modApi) {
    const disposers = [];
    let disposed = false;

    const add = disposer => {
        if (typeof disposer !== 'function') return disposer;
        if (disposed) {
            try { disposer(); } catch {}
        } else {
            disposers.push(disposer);
        }
        return disposer;
    };

    return {
        hook: (...args) => add(modApi.hookFunction(...args)),
        interval: (callback, delay) => {
            const timer = setInterval(callback, delay);
            add(() => clearInterval(timer));
            return timer;
        },
        timeout: (callback, delay) => {
            const timer = setTimeout(callback, delay);
            add(() => clearTimeout(timer));
            return timer;
        },
        scope: () => {
            const child = createHookRegistry(modApi);
            add(() => child.dispose());
            return child;
        },
        add,
        dispose: () => {
            disposed = true;
            for (const disposer of disposers.splice(0).reverse()) {
                try { disposer(); } catch {}
            }
        },
    };
}
