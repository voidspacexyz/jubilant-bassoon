// Helpers for parsing/formatting currency and numbers
// export-like functions (global scope used by app.js)

function parseCurrency(value) {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') return value;
    // remove common separators and currency symbols
    const cleaned = String(value).replace(/[^0-9.-]+/g, '');
    const n = parseFloat(cleaned);
    return isFinite(n) ? n : 0;
}

function formatCurrency(num, digits = 0) {
    const n = safeFloat(num);
    return n.toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

function clampNumber(n, min = -Infinity, max = Infinity) {
    return Math.min(Math.max(n, min), max);
}

function safeFloat(v) {
    const n = parseFloat(v);
    return isFinite(n) ? n : 0;
}
