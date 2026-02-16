// src/utils/lifetimeTracking.js
// Lifetime tracking aggregation utilities (reuses reportUtils patterns)

import { bucketByTime } from '../components/tracking/reports/reportUtils.js';

/**
 * Extract year from date string or Date object
 */
export const getYear = (date) => {
    const d = new Date(date);
    return d.getFullYear();
};

/**
 * Aggregate sessions into annual rollup
 * @param {Array} sessions - All sessions for a specific year
 * @param {number} year - Target year
 * @returns {Object} Annual rollup structure
 */
export const aggregateAnnualRollup = (sessions, year) => {
    if (!sessions || sessions.length === 0) {
        return {
            year,
            totalSessions: 0,
            totalMinutes: 0,
            practiceDays: 0,
            longestStreak: 0,
            domainBreakdown: {},
            monthlyBreakdown: [],
            avgSessionDuration: 0,
            consistencyRate: 0
        };
    }

    // Total counts
    const totalSessions = sessions.length;
    const totalMinutes = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
    const avgSessionDuration = totalSessions > 0 ? Math.round(totalMinutes / totalSessions) : 0;

    // Domain breakdown
    const domainBreakdown = {};
    sessions.forEach(s => {
        const domain = s.domain || 'unknown';
        domainBreakdown[domain] = (domainBreakdown[domain] || 0) + 1;
    });

    // Practice days (unique dates)
    const uniqueDates = new Set(sessions.map(s => {
        const d = new Date(s.date);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }));
    const practiceDays = uniqueDates.size;

    // Consistency rate (practice days / days in year)
    const daysInYear = isLeapYear(year) ? 366 : 365;
    const consistencyRate = practiceDays / daysInYear;

    // Monthly breakdown (reuse bucketByTime)
    const monthlyBuckets = bucketByTime(sessions, 'month', (s) => s.date);
    const monthlyBreakdown = monthlyBuckets.map(bucket => ({
        month: new Date(bucket.start).getMonth() + 1,
        sessions: bucket.items.length,
        minutes: bucket.items.reduce((sum, s) => sum + (s.duration || 0), 0)
    }));

    // Longest streak calculation (requires sorting by date)
    const sortedDates = Array.from(uniqueDates).sort();
    const longestStreak = calculateLongestStreak(sortedDates);

    return {
        year,
        totalSessions,
        totalMinutes,
        practiceDays,
        longestStreak,
        domainBreakdown,
        monthlyBreakdown,
        avgSessionDuration,
        consistencyRate: Math.round(consistencyRate * 100) / 100
    };
};

/**
 * Calculate longest streak from sorted date array
 */
const calculateLongestStreak = (sortedDates) => {
    if (sortedDates.length === 0) return 0;

    let longest = 1;
    let current = 1;

    for (let i = 1; i < sortedDates.length; i++) {
        const prevDate = new Date(sortedDates[i - 1]);
        const currDate = new Date(sortedDates[i]);
        const diffDays = Math.floor((currDate - prevDate) / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
            current++;
            longest = Math.max(longest, current);
        } else if (diffDays > 1) {
            current = 1;
        }
        // If diffDays === 0 (same day, multiple sessions), don't reset
    }

    return longest;
};

/**
 * Check if year is leap year
 */
const isLeapYear = (year) => {
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
};

/**
 * Update annual rollups for all years based on current sessions
 * @param {Array} sessions - All sessions
 * @param {Array} existingRollups - Current annual rollups
 * @returns {Array} Updated annual rollups
 */
export const updateAnnualRollups = (sessions) => {
    if (!sessions || sessions.length === 0) return [];

    // Group sessions by year
    const sessionsByYear = {};
    sessions.forEach(s => {
        const year = getYear(s.date);
        if (!sessionsByYear[year]) {
            sessionsByYear[year] = [];
        }
        sessionsByYear[year].push(s);
    });

    // Generate rollup for each year
    const rollups = Object.keys(sessionsByYear)
        .map(year => aggregateAnnualRollup(sessionsByYear[year], parseInt(year)))
        .sort((a, b) => a.year - b.year);

    return rollups;
};

/**
 * Update lifetime milestones from annual rollups
 * @param {Array} annualRollups - Annual rollup data
 * @param {Array} allSessions - All sessions (for first session date)
 * @returns {Object} Lifetime milestones
 */
export const updateLifetimeMilestones = (annualRollups, allSessions) => {
    if (!annualRollups || annualRollups.length === 0) {
        return {
            totalSessions: 0,
            totalMinutes: 0,
            practiceDays: 0,
            longestStreak: 0,
            memberSince: null,
            yearsActive: 0,
            favoriteDomain: null,
            totalRituals: 0
        };
    }

    // Aggregate totals
    const totalSessions = annualRollups.reduce((sum, r) => sum + r.totalSessions, 0);
    const totalMinutes = annualRollups.reduce((sum, r) => sum + r.totalMinutes, 0);
    const practiceDays = annualRollups.reduce((sum, r) => sum + r.practiceDays, 0);
    const longestStreak = Math.max(...annualRollups.map(r => r.longestStreak));
    const yearsActive = annualRollups.length;

    // Member since (earliest session)
    const sortedSessions = [...allSessions].sort((a, b) => new Date(a.date) - new Date(b.date));
    const memberSince = sortedSessions.length > 0 ? sortedSessions[0].date : null;

    // Favorite domain (aggregate across all years)
    const allDomains = {};
    annualRollups.forEach(r => {
        Object.entries(r.domainBreakdown).forEach(([domain, count]) => {
            allDomains[domain] = (allDomains[domain] || 0) + count;
        });
    });
    const favoriteDomain = Object.keys(allDomains).length > 0
        ? Object.keys(allDomains).reduce((a, b) => allDomains[a] > allDomains[b] ? a : b)
        : null;

    // Total rituals (count sessions with domain === 'ritual')
    const totalRituals = allSessions.filter(s => s.domain === 'ritual').length;

    return {
        totalSessions,
        totalMinutes,
        practiceDays,
        longestStreak,
        memberSince,
        yearsActive,
        favoriteDomain,
        totalRituals
    };
};

/**
 * Add update actions to progressStore
 * @param {Function} set - Zustand set function
 * @param {Function} get - Zustand get function
 */
export const createLifetimeTrackingActions = (set, get) => ({
    /**
     * Recompute all annual rollups and lifetime milestones
     * Called after session recording or on first load (migration)
     */
    updateLifetimeTracking: () => {
        const state = get();
        const sessions = state.sessions || [];
        
        // Recompute annual rollups
        const annualRollups = updateAnnualRollups(sessions);
        
        // Recompute lifetime milestones
        const lifetimeMilestones = updateLifetimeMilestones(annualRollups, sessions);
        
        set({ annualRollups, lifetimeMilestones });
    }
});
