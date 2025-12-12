export const getDateKey = (date = new Date()) => {
    return date.toISOString().split('T')[0];
};

export const getWeekStart = (date = new Date()) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday start
    return new Date(d.setDate(diff));
};
