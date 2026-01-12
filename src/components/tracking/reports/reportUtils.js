const DAY_MS = 24 * 60 * 60 * 1000;

const pad = (value) => String(value).padStart(2, '0');

export const formatDateKey = (date) => {
    const d = new Date(date);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const getWeekStart = (date) => {
    const d = new Date(date);
    const day = d.getDay(); // 0 Sun .. 6 Sat
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
};

export const getMonthStart = (date) => {
    const d = new Date(date);
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
};

export const getYearStart = (date) => {
    const d = new Date(date);
    d.setMonth(0, 1);
    d.setHours(0, 0, 0, 0);
    return d;
};

export const rangeToBucketKind = (rangeDays, eventCount = 0) => {
    if (rangeDays <= 90) {
        return eventCount > 500 ? 'week' : 'day';
    }
    if (rangeDays <= 365) return 'week';
    return 'month';
};

export const getRangeDays = (startDate, endDate) => {
    if (!startDate || !endDate) return 0;
    const diff = Math.max(0, endDate.getTime() - startDate.getTime());
    return Math.max(1, Math.ceil(diff / DAY_MS) + 1);
};

export const bucketByTime = (events, bucketKind, getTimestamp) => {
    const buckets = new Map();

    events.forEach((event) => {
        const raw = getTimestamp(event);
        if (!raw) return;
        const date = new Date(raw);
        if (Number.isNaN(date.getTime())) return;

        let bucketStart = date;
        if (bucketKind === 'day') {
            bucketStart = new Date(date);
            bucketStart.setHours(0, 0, 0, 0);
        } else if (bucketKind === 'week') {
            bucketStart = getWeekStart(date);
        } else if (bucketKind === 'month') {
            bucketStart = getMonthStart(date);
        } else if (bucketKind === 'year') {
            bucketStart = getYearStart(date);
        }

        const key = bucketKind === 'month'
            ? `${bucketStart.getFullYear()}-${pad(bucketStart.getMonth() + 1)}`
            : bucketKind === 'year'
                ? `${bucketStart.getFullYear()}`
                : formatDateKey(bucketStart);

        if (!buckets.has(key)) {
            buckets.set(key, { key, start: bucketStart, items: [] });
        }
        buckets.get(key).items.push(event);
    });

    return Array.from(buckets.values()).sort((a, b) => a.start - b.start);
};

export const summarizeByYear = (events, getTimestamp) => {
    return bucketByTime(events, 'year', getTimestamp).map((bucket) => ({
        key: bucket.key,
        count: bucket.items.length
    }));
};

export const formatRangeLabel = (rangeKey, startDate, endDate) => {
    if (rangeKey === 'ALL') return 'All time';
    if (rangeKey === '12M') return 'Last 12 months';
    if (rangeKey === '90D') return 'Last 90 days';
    if (rangeKey === '30D') return 'Last 30 days';
    if (!startDate || !endDate) return '';
    return `${formatDateKey(startDate)} to ${formatDateKey(endDate)}`;
};

export const buildRange = (rangeKey, earliestDate, nowDate = new Date()) => {
    const end = new Date(nowDate);
    end.setHours(23, 59, 59, 999);

    if (rangeKey === 'ALL' && earliestDate) {
        const start = new Date(earliestDate);
        start.setHours(0, 0, 0, 0);
        return { start, end };
    }

    const days = rangeKey === '30D' ? 30 : rangeKey === '90D' ? 90 : 365;
    const start = new Date(end);
    start.setDate(start.getDate() - (days - 1));
    start.setHours(0, 0, 0, 0);
    return { start, end };
};
