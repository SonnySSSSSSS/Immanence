export const getDateKey = (date = new Date()) => {
    return date.toISOString().split('T')[0];
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
