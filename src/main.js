// Keep this bootstrap free of static imports so duplicate detection runs first.
window.Liko = window.Liko ?? {};

if (window.Liko.AFC) {
    console.warn('🐈‍⬛ [AFC] Already loaded, skipping duplicate init.');
} else {
    const namespace = window.Liko.AFC = {};
    import('./app.js').catch(error => {
        if (window.Liko.AFC === namespace && !namespace.version) delete window.Liko.AFC;
        console.error('🐈‍⬛ [AFC] Failed to load:', error);
    });
}
