// src/state/pathStore.js
// Avatar Path System — Behavioral Identity Tracking
// Paths are OBSERVED from practice patterns, not assigned

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { PATH_SYMBOLS, PATH_NAMES, LEGACY_PATH_MAP, LEGACY_PATH_LABELS } from '../data/pathDefinitions';
import { calculatePathSignals, inferPathFromLog } from '../data/pathInference';

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

export { PATH_SYMBOLS, PATH_NAMES };

// Timeline thresholds (in days)
const EMERGENCE_THRESHOLD_DAYS = 90;
const SHIFT_THRESHOLD_DAYS = 180;
const RESTING_THRESHOLD_DAYS = 45;
const DORMANT_THRESHOLD_DAYS = 90;
const FADING_THRESHOLD_DAYS = 180;

// Rolling window for calculation (in days)
const CALCULATION_WINDOW_DAYS = 90;
const MIN_SIGNAL_MINUTES = 45;

const INFERENCE_OPTIONS = {
    emergenceThresholdDays: EMERGENCE_THRESHOLD_DAYS,
    windowDays: CALCULATION_WINDOW_DAYS,
    minSignalMinutes: MIN_SIGNAL_MINUTES,
};

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
            devPreviewCeremony: null,

            // ════════════════════════════════════════════════════════════════
            // ACTIONS
            // ════════════════════════════════════════════════════════════════

            recordPractice: ({ domain, duration, timestamp = Date.now(), metadata = {}, practiceId = null, practiceMode = null }) => {
                const state = get();
                const now = timestamp;

                const normalizedMetadata = {
                    ...metadata,
                    ...(practiceId ? { practiceId } : {}),
                    ...(practiceMode ? { practiceMode } : {}),
                };

                const newEntry = {
                    id: crypto?.randomUUID?.() || String(now),
                    domain: normalizeDomain(domain),
                    duration,
                    timestamp: now,
                    metadata: normalizedMetadata,
                    practiceId: normalizedMetadata.practiceId || null,
                    practiceMode: normalizedMetadata.practiceMode || null,
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

                const calculated = inferPathFromLog(practiceLog, firstPracticeDate, INFERENCE_OPTIONS);

                if (calculated.status === 'forming' || calculated.status === 'balanced') {
                    if (!currentPath) {
                        set({
                            pathStatus: calculated.status,
                            complementaryPaths: calculated.complementary || [],
                            pendingPath: null,
                            pendingPathStartDate: null,
                        });
                        return;
                    }

                    set({
                        complementaryPaths: calculated.complementary || [],
                    });
                    return;
                }

                if (!calculated.path) {
                    set({ complementaryPaths: calculated.complementary || [] });
                    return;
                }

                if (currentPath === null) {
                    set({
                        currentPath: calculated.path,
                        pathStatus: 'established',
                        pathEmergenceDate: Date.now(),
                        complementaryPaths: calculated.complementary || [],
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
                else if (!state.currentPath && state.pathStatus === 'balanced') newStatus = 'balanced';

                if (newStatus !== state.pathStatus) set({ pathStatus: newStatus });
                return newStatus;
            },

            dismissCeremony: () => set({ pendingCeremony: null }),
            dismissDevPreview: () => set({ devPreviewCeremony: null }),

            getPathJourney: () => {
                const state = get();
                return state.pathHistory.map(entry => ({
                    ...entry,
                    pathName: entry.toPath ? PATH_NAMES[entry.toPath] : null,
                    symbol: entry.toPath ? PATH_SYMBOLS[entry.toPath] : '○',
                    legacyFromPathName: entry.legacyFromPath ? LEGACY_PATH_LABELS[entry.legacyFromPath] || entry.legacyFromPath : null,
                    legacyToPathName: entry.legacyToPath ? LEGACY_PATH_LABELS[entry.legacyToPath] || entry.legacyToPath : null,
                    formattedDate: new Date(entry.date).toLocaleDateString(),
                }));
            },

            getFormingInfo: () => {
                const state = get();
                if (!state.firstPracticeDate) return { daysUntilEmergence: EMERGENCE_THRESHOLD_DAYS, dominantTendency: null, progress: 0, signals: null, totalSignal: 0 };

                const daysSinceStart = (Date.now() - state.firstPracticeDate) / (24 * 60 * 60 * 1000);
                const signalTotals = calculatePathSignals(state.practiceLog, INFERENCE_OPTIONS);
                const dominant = getDominantTendency(signalTotals.normalized);
                return {
                    daysUntilEmergence: Math.max(0, Math.ceil(EMERGENCE_THRESHOLD_DAYS - daysSinceStart)),
                    dominantTendency: dominant,
                    progress: Math.min(1, daysSinceStart / EMERGENCE_THRESHOLD_DAYS),
                    signals: signalTotals.normalized,
                    totalSignal: signalTotals.total,
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
                const signalTotals = calculatePathSignals(state.practiceLog, INFERENCE_OPTIONS);
                if (!signalTotals.total) return null;

                return Object.entries(signalTotals.totals).map(([path, minutes]) => ({
                    path,
                    pathName: PATH_NAMES[path],
                    symbol: PATH_SYMBOLS[path],
                    minutes,
                    percentage: (minutes / signalTotals.total) * 100,
                }));
            },

            getDisplayPath: (stage) => {
                const state = get();
                const stageLower = String(stage || '').toLowerCase();
                if (stageLower === 'seedling') return null;
                if (state.pathStatus !== 'established') return null;
                return state.currentPath;
            },

            // Dev helpers
            _devClearCeremony: () => set({ pendingCeremony: null, devPreviewCeremony: null }),
            _devTriggerEmergence: (path) => set({ devPreviewCeremony: { type: 'emergence', path, previousPath: null } }),
            _devTriggerShift: (fromPath, toPath) => set({ devPreviewCeremony: { type: 'shift', path: toPath, previousPath: fromPath } }),
            _devReset: () => set({ practiceLog: [], currentPath: null, pathStatus: 'forming', pathEmergenceDate: null, pendingPath: null, pendingPathStartDate: null, complementaryPaths: [], firstPracticeDate: null, lastActiveDate: null, pathHistory: [], pendingCeremony: null, devPreviewCeremony: null }),
        }),
        {
            name: 'immanenceOS.path',
            version: 2,
            partialize: (state) => {
                const { devPreviewCeremony, ...rest } = state;
                return rest;
            },
            migrate: (persistedState, version) => {
                if (!persistedState) return persistedState;
                if (version >= 2) return persistedState;

                const mapLegacyPath = (path) => {
                    if (!path) return null;
                    return LEGACY_PATH_MAP[path] ?? path;
                };

                const nextHistory = (persistedState.pathHistory || []).map((entry) => {
                    const legacyFrom = entry.fromPath || null;
                    const legacyTo = entry.toPath || null;
                    const mappedFrom = mapLegacyPath(legacyFrom);
                    const mappedTo = mapLegacyPath(legacyTo);
                    return {
                        ...entry,
                        fromPath: mappedFrom,
                        toPath: mappedTo,
                        legacyFromPath: legacyFrom,
                        legacyToPath: legacyTo,
                    };
                });

                const mappedCurrentPath = mapLegacyPath(persistedState.currentPath);
                const mappedPendingPath = mapLegacyPath(persistedState.pendingPath);
                const nextStatus = mappedCurrentPath
                    ? persistedState.pathStatus
                    : (persistedState.currentPath === 'Samyoga' ? 'balanced' : persistedState.pathStatus);

                return {
                    ...persistedState,
                    currentPath: mappedCurrentPath,
                    pendingPath: mappedPendingPath,
                    pathStatus: nextStatus,
                    pathHistory: nextHistory,
                };
            },
        }
    )
);

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

function normalizeDomain(domain) {
    const d = domain?.toLowerCase() || 'breath';
    if (d === 'breathwork' || d === 'breathing') return 'breath';
    if (d === 'bodyscan' || d === 'body_scan') return 'bodyscan';
    return d;
}

function getDominantTendency(normalizedSignals) {
    if (!normalizedSignals) return null;
    const entries = Object.entries(normalizedSignals).sort((a, b) => b[1] - a[1]);
    if (entries.length === 0 || entries[0][1] === 0) return null;
    return entries[0][0];
}

function checkPathShift(calculated, state) {
    const { currentPath, pendingPath, pendingPathStartDate } = state;

    if (!calculated.path) {
        return { ...calculated, canShift: false, pendingPath: null };
    }

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

