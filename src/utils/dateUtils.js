export const getDateKey = (date = new Date()) => {
    return date.toISOString().split('T')[0];
};

/**
 * Parse a UTC date key (YYYY-MM-DD) into a UTC midnight timestamp (ms).
 * This keeps all streak/date-key arithmetic in UTC to avoid local timezone drift.
 */
export const parseDateKeyToUtcMs = (dateKey) => {
    if (!dateKey || typeof dateKey !== 'string') return NaN;
    const [y, m, d] = dateKey.split('-').map(Number);
    if (!y || !m || !d) return NaN;
    return Date.UTC(y, m - 1, d);
};

/**
 * Add N days to a UTC date key and return a new UTC date key.
 */
export const addDaysToDateKey = (dateKey, deltaDays = 0) => {
    const baseMs = parseDateKeyToUtcMs(dateKey);
    if (Number.isNaN(baseMs)) return null;
    const next = new Date(baseMs + (deltaDays * 24 * 60 * 60 * 1000));
    return getDateKey(next);
};

/**
 * Absolute day difference between two UTC date keys.
 */
export const diffDateKeysInDays = (dateKey1, dateKey2) => {
    const d1 = parseDateKeyToUtcMs(dateKey1);
    const d2 = parseDateKeyToUtcMs(dateKey2);
    if (Number.isNaN(d1) || Number.isNaN(d2)) return Infinity;
    return Math.abs(Math.round((d2 - d1) / (1000 * 60 * 60 * 24)));
};

/**
 * Get local date key (YYYY-MM-DD) in local timezone, not UTC
 * Critical for timezone-aware session grouping
 */
export const getLocalDateKey = (date = new Date()) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

export const getWeekStart = (date = new Date()) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday start
    return new Date(d.setDate(diff));
};
