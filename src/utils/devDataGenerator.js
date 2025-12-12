// src/utils/devDataGenerator.js
// Mock data generator for testing TrackingHub visualizations

import { getDateKey } from './dateUtils.js';

/**
 * Generate sessions with a specific pattern over last 7 days
 * @param {string} domain - 'breathwork' | 'visualization' | 'wisdom'
 * @param {Array<number>} daysPattern - Array of 7 minute values [Mon, Tue, Wed, Thu, Fri, Sat, Sun]
 */
export function generateMockSessions(domain, daysPattern) {
    const sessions = [];
    const today = new Date();

    if (!daysPattern || !Array.isArray(daysPattern)) return [];

    // Generate sessions for each day
    daysPattern.forEach((minutes, dayOffset) => {
        if (minutes > 0) {
            const date = new Date(today);
            date.setDate(date.getDate() - (6 - dayOffset)); // 0 = Monday (6 days ago), 6 = Sunday (today)

            sessions.push({
                id: `mock_${domain}_${dayOffset}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                domain,
                date: date.toISOString(),
                dateKey: getDateKey(date),
                duration: minutes,
                timestamp: date.getTime(),
                metadata: {
                    subType: 'mock',
                    mock: true
                }
            });
        }
    });

    return sessions;
}

/**
 * Mock data patterns for testing different scenarios
 * Each pattern has per-domain arrays of 7 minute values [Mon-Sun]
 */
export const MOCK_PATTERNS = {
    beginner: {
        label: '🌱 Beginner (5-10 min)',
        breathwork: [5, 7, 0, 8, 10, 0, 6],
        visualization: [0, 5, 5, 0, 6, 0, 0],
        wisdom: [3, 0, 5, 5, 0, 4, 0]
    },
    dedicated: {
        label: '🔥 Dedicated (15-25 min)',
        breathwork: [15, 18, 20, 0, 22, 25, 28],
        visualization: [10, 12, 15, 18, 20, 0, 15],
        wisdom: [8, 10, 12, 0, 15, 18, 20]
    },
    intense: {
        label: '⚡ Intense (30-60 min)',
        breathwork: [30, 35, 40, 60, 45, 35, 40],
        visualization: [25, 30, 35, 45, 40, 30, 35],
        wisdom: [20, 25, 30, 40, 35, 25, 30]
    },
    burnout: {
        label: '💀 Burnout (declining)',
        breathwork: [45, 40, 30, 20, 10, 5, 0],
        visualization: [35, 30, 25, 15, 8, 0, 0],
        wisdom: [25, 20, 15, 10, 5, 0, 0]
    },
    chaotic: {
        label: '🌪️ Chaotic (inconsistent)',
        breathwork: [0, 80, 0, 0, 15, 0, 60],
        visualization: [45, 0, 0, 20, 0, 0, 35],
        wisdom: [0, 0, 60, 0, 0, 25, 0]
    }
};
