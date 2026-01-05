// src/state/pathStore.js
// Avatar Path System — Behavioral Identity Tracking
// Paths are OBSERVED from practice patterns, not assigned

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

export const PATH_SYMBOLS = {
    Soma: '◈',      // Diamond with center — embodied, solid
    Prana: '≋',     // Waves — breath, flow  
    Dhyana: '◯',    // Empty circle — stillness, void
    Drishti: '◉',   // Circle with center — eye, focus
    Jnana: '◇',     // Diamond — clarity, precision
    Samyoga: '⬡',   // Hexagon — integration, all sides
};

export const PATH_NAMES = {
    Soma: 'Body',
    Prana: 'Breath',
    Dhyana: 'Mind',
    Drishti: 'Vision',
    Jnana: 'Wisdom',
    Samyoga: 'Integration',
};

// Domain to Path mapping
const DOMAIN_TO_PATH = {
    yoga: 'Soma',
    breathing: 'Prana',
    breathwork: 'Prana',
    meditation: 'Dhyana',
    visualization: 'Drishti',
    cymatics: 'Drishti',
    wisdom: 'Jnana',
    // Sensory practices
    bodyScan: 'Soma',       // Somatic, embodied awareness
    bhakti: 'Samyoga',      // Heart integration, devotion
    vipassana: 'Dhyana',    // Mental observation, insight
    sakshi: 'Dhyana',       // Witness consciousness
};

// Timeline thresholds (in days)
const EMERGENCE_THRESHOLD_DAYS = 90;
const SHIFT_THRESHOLD_DAYS = 180;
const RESTING_THRESHOLD_DAYS = 45;
const DORMANT_THRESHOLD_DAYS = 90;
const FADING_THRESHOLD_DAYS = 180;

// Rolling window for calculation (in days)
const CALCULATION_WINDOW_DAYS = 90;

// ═══════════════════════════════════════════════════════════════════════════
// STORE
// ═══════════════════════════════════════════════════════════════════════════

export const usePathStore = create(
    persist(
        (set, get) => ({
            // === Practice Log (source for path calculation) ===
            practiceLog: [],

            // === Path State ===
            currentPath: null,
            pathStatus: 'forming',
            pathEmergenceDate: null,

            // === Shift Tracking ===
            pendingPath: null,
            pendingPathStartDate: null,

            // === Complementary Paths ===
            complementaryPaths: [],

            // === Activity Tracking ===
            firstPracticeDate: null,
            lastActiveDate: null,

            // === History ===
            pathHistory: [],

            // === Ceremony Queue ===
            pendingCeremony: null,

            // ════════════════════════════════════════════════════════════════
            // ACTIONS
            // ════════════════════════════════════════════════════════════════

            recordPractice: ({ domain, duration, timestamp = Date.now(), metadata = {} }) => {
                const state = get();
                const now = timestamp;

                const newEntry = {
                    id: crypto?.randomUUID?.() || String(now),
                    domain: normalizeDomain(domain),
                    duration,
                    timestamp: now,
                    metadata,
                };

                const isFirstEver = state.firstPracticeDate === null;

                set({
                    practiceLog: [...state.practiceLog, newEntry],
                    firstPracticeDate: isFirstEver ? now : state.firstPracticeDate,
                    lastActiveDate: now,
                });

                get().recalculatePath();
            },

            recalculatePath: () => {
                const state = get();
                const { practiceLog, firstPracticeDate, currentPath, pendingPath, pendingPathStartDate } = state;

                if (!firstPracticeDate || practiceLog.length === 0) return;

                const calculated = calculatePathFromLog(practiceLog, firstPracticeDate);

                if (calculated.status === 'forming') {
                    set({ pathStatus: 'forming', complementaryPaths: [] });
                    return;
                }

                if (currentPath === null) {
                    set({
                        currentPath: calculated.path,
                        pathStatus: 'established',
                        pathEmergenceDate: Date.now(),
                        complementaryPaths: calculated.complementary,
                        pendingPath: null,
                        pendingPathStartDate: null,
                        pathHistory: [...state.pathHistory, { date: Date.now(), fromPath: null, toPath: calculated.path, trigger: 'emergence' }],
                        pendingCeremony: { type: 'emergence', path: calculated.path, previousPath: null },
                    });
                    return;
                }

                const shiftResult = checkPathShift(calculated, { currentPath, pendingPath, pendingPathStartDate });

                if (shiftResult.canShift) {
                    set({
                        currentPath: shiftResult.path,
                        pathStatus: 'established',
                        complementaryPaths: shiftResult.complementary || [],
                        pendingPath: null,
                        pendingPathStartDate: null,
                        pathHistory: [...state.pathHistory, { date: Date.now(), fromPath: currentPath, toPath: shiftResult.path, trigger: 'shift' }],
                        pendingCeremony: { type: 'shift', path: shiftResult.path, previousPath: currentPath },
                    });
                } else if (shiftResult.pendingPath && shiftResult.pendingPath !== pendingPath) {
                    set({ pathStatus: 'shifting', pendingPath: shiftResult.pendingPath, pendingPathStartDate: Date.now(), complementaryPaths: calculated.complementary });
                } else if (shiftResult.pendingPath === null && pendingPath !== null) {
                    set({ pathStatus: 'established', pendingPath: null, pendingPathStartDate: null, complementaryPaths: calculated.complementary });
                } else {
                    set({ complementaryPaths: calculated.complementary });
                }
            },

            checkActivityStatus: () => {
                const state = get();
                if (!state.lastActiveDate) return state.pathStatus;

                const daysSinceActive = (Date.now() - state.lastActiveDate) / (24 * 60 * 60 * 1000);
                let newStatus = state.pathStatus;

                if (daysSinceActive >= FADING_THRESHOLD_DAYS) newStatus = 'fading';
                else if (daysSinceActive >= DORMANT_THRESHOLD_DAYS) newStatus = 'dormant';
                else if (daysSinceActive >= RESTING_THRESHOLD_DAYS) newStatus = 'resting';
                else if (state.currentPath && state.pathStatus !== 'shifting') newStatus = 'established';

                if (newStatus !== state.pathStatus) set({ pathStatus: newStatus });
                return newStatus;
            },

            dismissCeremony: () => set({ pendingCeremony: null }),

            getPathJourney: () => {
                const state = get();
                return state.pathHistory.map(entry => ({
                    ...entry,
                    pathName: entry.toPath ? PATH_NAMES[entry.toPath] : null,
                    symbol: entry.toPath ? PATH_SYMBOLS[entry.toPath] : null,
                    formattedDate: new Date(entry.date).toLocaleDateString(),
                }));
            },

            getFormingInfo: () => {
                const state = get();
                if (!state.firstPracticeDate) return { daysUntilEmergence: EMERGENCE_THRESHOLD_DAYS, dominantTendency: null, progress: 0 };

                const daysSinceStart = (Date.now() - state.firstPracticeDate) / (24 * 60 * 60 * 1000);
                return {
                    daysUntilEmergence: Math.max(0, Math.ceil(EMERGENCE_THRESHOLD_DAYS - daysSinceStart)),
                    dominantTendency: getDominantTendency(state.practiceLog),
                    progress: Math.min(1, daysSinceStart / EMERGENCE_THRESHOLD_DAYS),
                };
            },

            getShiftInfo: () => {
                const state = get();
                if (!state.pendingPath || !state.pendingPathStartDate) return null;

                const daysPending = (Date.now() - state.pendingPathStartDate) / (24 * 60 * 60 * 1000);
                return {
                    currentPath: state.currentPath,
                    pendingPath: state.pendingPath,
                    daysUntilShift: Math.max(0, Math.ceil(SHIFT_THRESHOLD_DAYS - daysPending)),
                    progress: Math.min(1, daysPending / SHIFT_THRESHOLD_DAYS),
                    currentPathName: PATH_NAMES[state.currentPath],
                    pendingPathName: PATH_NAMES[state.pendingPath],
                    currentSymbol: PATH_SYMBOLS[state.currentPath],
                    pendingSymbol: PATH_SYMBOLS[state.pendingPath],
                };
            },

            getPracticeDistribution: () => {
                const state = get();
                const totals = { yoga: 0, breathing: 0, meditation: 0, visualization: 0, wisdom: 0 };
                state.practiceLog.forEach(({ domain, duration }) => {
                    const key = normalizeDomainKey(domain);
                    if (totals[key] !== undefined) totals[key] += duration;
                });

                const total = Object.values(totals).reduce((a, b) => a + b, 0);
                if (total === 0) return null;

                return Object.entries(totals).map(([domain, minutes]) => ({
                    domain,
                    path: DOMAIN_TO_PATH[domain],
                    pathName: PATH_NAMES[DOMAIN_TO_PATH[domain]],
                    symbol: PATH_SYMBOLS[DOMAIN_TO_PATH[domain]],
                    minutes,
                    percentage: (minutes / total) * 100,
                }));
            },

            // Dev helpers
            _devClearCeremony: () => set({ pendingCeremony: null }),
            _devTriggerEmergence: (path) => set({ pendingCeremony: { type: 'emergence', path, previousPath: null } }),
            _devTriggerShift: (fromPath, toPath) => set({ pendingCeremony: { type: 'shift', path: toPath, previousPath: fromPath } }),
            _devReset: () => set({ practiceLog: [], currentPath: null, pathStatus: 'forming', pathEmergenceDate: null, pendingPath: null, pendingPathStartDate: null, complementaryPaths: [], firstPracticeDate: null, lastActiveDate: null, pathHistory: [], pendingCeremony: null }),
        }),
        {
            name: 'immanenceOS.path',
            version: 1,
            migrate: (persistedState) => {
                return persistedState;
            }
        }
    )
);

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

function normalizeDomain(domain) {
    const d = domain?.toLowerCase() || 'breathwork';
    if (d === 'breathwork' || d === 'breathing') return 'breathing';
    if (d === 'cymatics') return 'visualization';
    return d;
}

function normalizeDomainKey(domain) {
    const d = domain?.toLowerCase() || 'breathing';
    if (d === 'breathwork') return 'breathing';
    if (d === 'cymatics') return 'visualization';
    return d;
}

function getDominantTendency(practiceLog) {
    if (!practiceLog || practiceLog.length === 0) return null;
    const totals = { yoga: 0, breathing: 0, meditation: 0, visualization: 0, wisdom: 0 };
    practiceLog.forEach(({ domain, duration }) => {
        const key = normalizeDomainKey(domain);
        if (totals[key] !== undefined) totals[key] += duration;
    });
    const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1]);
    if (sorted[0][1] === 0) return null;
    return DOMAIN_TO_PATH[sorted[0][0]];
}

function calculatePathFromLog(practiceLog, firstPracticeDate) {
    const daysSinceStart = (Date.now() - firstPracticeDate) / (24 * 60 * 60 * 1000);

    if (daysSinceStart < EMERGENCE_THRESHOLD_DAYS) {
        return { path: null, status: 'forming', complementary: [], daysUntilEmergence: Math.ceil(EMERGENCE_THRESHOLD_DAYS - daysSinceStart) };
    }

    const windowStart = Date.now() - (CALCULATION_WINDOW_DAYS * 24 * 60 * 60 * 1000);
    const recent = practiceLog.filter(p => p.timestamp >= windowStart);

    const totals = { yoga: 0, breathing: 0, meditation: 0, visualization: 0, wisdom: 0 };
    recent.forEach(({ domain, duration }) => {
        const key = normalizeDomainKey(domain);
        if (totals[key] !== undefined) totals[key] += duration;
    });

    const total = Object.values(totals).reduce((a, b) => a + b, 0);
    if (total === 0) return { path: null, status: 'forming', complementary: [] };

    const pct = {};
    Object.keys(totals).forEach(k => pct[k] = totals[k] / total);

    // Dominant (>50%)
    const dominant = Object.entries(pct).find(([, p]) => p > 0.5);
    if (dominant) {
        const complementary = Object.entries(pct).filter(([k, p]) => k !== dominant[0] && p >= 0.2).map(([k]) => DOMAIN_TO_PATH[k]);
        return { path: DOMAIN_TO_PATH[dominant[0]], status: 'established', complementary };
    }

    // Samyoga: all ≥10%, none >45%, 4+ domains ≥15%
    const allOver10 = Object.values(pct).every(p => p >= 0.1);
    const noneOver45 = Object.values(pct).every(p => p <= 0.45);
    const fourOver15 = Object.values(pct).filter(p => p >= 0.15).length >= 4;

    if (allOver10 && noneOver45 && fourOver15) {
        return { path: 'Samyoga', status: 'established', complementary: [] };
    }

    // Default to highest
    const sorted = Object.entries(pct).sort((a, b) => b[1] - a[1]);
    const complementary = sorted.slice(1, 3).filter(([, p]) => p >= 0.2).map(([k]) => DOMAIN_TO_PATH[k]);
    return { path: DOMAIN_TO_PATH[sorted[0][0]], status: 'established', complementary };
}

function checkPathShift(calculated, state) {
    const { currentPath, pendingPath, pendingPathStartDate } = state;

    if (!currentPath) return { ...calculated, canShift: true };
    if (calculated.path === currentPath) return { ...calculated, canShift: false, pendingPath: null };

    if (pendingPath !== calculated.path) {
        return { ...calculated, actualPath: currentPath, calculatedPath: calculated.path, pendingPath: calculated.path, pendingPathStartDate: Date.now(), canShift: false, daysUntilShift: SHIFT_THRESHOLD_DAYS };
    }

    const daysPending = (Date.now() - pendingPathStartDate) / (24 * 60 * 60 * 1000);
    if (daysPending >= SHIFT_THRESHOLD_DAYS) {
        return { ...calculated, canShift: true, previousPath: currentPath };
    }

    return { ...calculated, actualPath: currentPath, calculatedPath: calculated.path, pendingPath, pendingPathStartDate, canShift: false, daysUntilShift: Math.ceil(SHIFT_THRESHOLD_DAYS - daysPending) };
}

// Export DOMAIN_TO_PATH (PATH_SYMBOLS and PATH_NAMES already exported at declaration)
export { DOMAIN_TO_PATH };
