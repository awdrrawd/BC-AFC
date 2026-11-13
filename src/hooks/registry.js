// 統一管理 bcModSdk hooks、計時器與額外清理函式。
export function createHookRegistry(modApi) {
    const disposers = new Set();
    let disposed = false;

    const add = disposer => {
        if (typeof disposer !== 'function') return disposer;
        const release = () => {
            if (!disposers.delete(release)) return;
            disposer();
        };
        disposers.add(release);
        if (disposed) {
            try { release(); } catch {}
        }
        return release;
    };

    return {
        hook: (...args) => add(modApi.hookFunction(...args)),
        interval: (callback, delay) => {
            const timer = setInterval(callback, delay);
            add(() => clearInterval(timer));
            return timer;
        },
        timeout: (callback, delay) => {
            const timer = setTimeout(() => {
                release();
                callback();
            }, delay);
            const release = add(() => clearTimeout(timer));
            return timer;
        },
        scope: () => {
            const child = createHookRegistry(modApi);
            const release = add(() => child.dispose());
            child.add(() => disposers.delete(release));
            return child;
        },
        add,
        dispose: () => {
            disposed = true;
            for (const disposer of [...disposers].reverse()) {
                try { disposer(); } catch {}
            }
        },
    };
}
