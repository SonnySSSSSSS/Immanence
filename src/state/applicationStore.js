// src/state/applicationStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { addDaysToDateKey, getLocalDateKey } from '../utils/dateUtils.js';

const TRACKER_MAX_ITEMS = 4;
const TRACKER_T_REF = 12;

const clampNonNegative = (value) => Math.max(0, Number(value) || 0);

const clampUnit = (value) => Math.min(1, Math.max(0, value));

function normalizeUserId(userId) {
    if (typeof userId !== 'string') return null;
    const trimmed = userId.trim();
    return trimmed || null;
}

const normalizeLabel = (label) => String(label || '').trim();

const makeTrackerId = (label) => {
    const slug = normalizeLabel(label)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'item';
    const suffix = globalThis.crypto?.randomUUID?.().slice(0, 8) || String(Date.now()).slice(-8);
    return `${slug}-${suffix}`;
};

const normalizeTrackerItems = (items = [], { keepOrder = false } = {}) => {
    if (!Array.isArray(items)) return [];
    const seen = new Set();
    const normalized = [];
    for (const raw of items) {
        if (normalized.length >= TRACKER_MAX_ITEMS) break;
        const label = normalizeLabel(raw?.label);
        if (!label) continue;
        const id = normalizeLabel(raw?.id) || makeTrackerId(label);
        if (!id || seen.has(id)) continue;
        seen.add(id);
        normalized.push({
            id,
            label,
            order: keepOrder && Number.isInteger(raw?.order) ? raw.order : normalized.length,
        });
    }
    return normalized.map((item, index) => ({ ...item, order: index }));
};

export const migrateApplicationStateV2 = (persistedState) => {
    const next = persistedState || {};
    return {
        ...next,
        trackerConfig: {
            items: normalizeTrackerItems(next?.trackerConfig?.items || []),
        },
        trackerDaily: {
            byDate: next?.trackerDaily?.byDate && typeof next.trackerDaily.byDate === 'object'
                ? next.trackerDaily.byDate
                : {},
        },
    };
};

function buildInitialApplicationState() {
    return {
        awarenessLogs: [],
        trackerConfig: { items: [] },
        trackerDaily: { byDate: {} },
        intention: null,
        sigilLegend: {
            dismissed: false,
            autoOpenCount: 0,
        },
    };
}

export const useApplicationStore = create(
    persist(
        (set, get) => ({
            ownerUserId: null,
            activeUserId: null,
            ...buildInitialApplicationState(),

            setActiveUserId: (userId) => {
                const normalizedUserId = normalizeUserId(userId);
                set((state) => {
                    if (!normalizedUserId) {
                        return { activeUserId: null };
                    }

                    if (state.ownerUserId === normalizedUserId) {
                        return { activeUserId: normalizedUserId };
                    }

                    return {
                        ...buildInitialApplicationState(),
                        ownerUserId: normalizedUserId,
                        activeUserId: normalizedUserId,
                    };
                });
            },

            resetForIdentityBoundary: (userId = null) => {
                const normalizedUserId = normalizeUserId(userId);
                set({
                    ...buildInitialApplicationState(),
                    ownerUserId: normalizedUserId,
                    activeUserId: normalizedUserId,
                });
            },

            // Add a new awareness log
            logAwareness: (category, pathId) => {
                const newLog = {
                    id: Date.now().toString(),
                    timestamp: new Date().toISOString(),
                    category,
                    note: null,
                    respondedDifferently: null,
                    pathId
                };

                set((state) => ({
                    awarenessLogs: [newLog, ...state.awarenessLogs]
                }));

                return newLog.id;
            },

            // Update a log with note/reflection
            updateLog: (logId, updates) => {
                set((state) => ({
                    awarenessLogs: state.awarenessLogs.map(log =>
                        log.id === logId ? { ...log, ...updates } : log
                    )
                }));
            },

            // Get today's logs
            getTodayLogs: () => {
                const state = get();
                const today = new Date().toDateString();
                return state.awarenessLogs.filter(log =>
                    new Date(log.timestamp).toDateString() === today
                );
            },

            // Get this week's logs
            getWeekLogs: () => {
                const state = get();
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);

                return state.awarenessLogs.filter(log =>
                    new Date(log.timestamp) >= weekAgo
                );
            },

            // Get stats for a time period
            getStats: (days = 7) => {
                const state = get();
                const cutoff = new Date();
                cutoff.setDate(cutoff.getDate() - days);

                const logs = state.awarenessLogs.filter(log =>
                    new Date(log.timestamp) >= cutoff
                );

                const byCategory = {};
                let respondedDifferently = 0;

                logs.forEach(log => {
                    byCategory[log.category] = (byCategory[log.category] || 0) + 1;
                    if (log.respondedDifferently === true) {
                        respondedDifferently++;
                    }
                });

                return {
                    total: logs.length,
                    byCategory,
                    respondedDifferently,
                    respondedDifferentlyPercent: logs.length > 0
                        ? Math.round((respondedDifferently / logs.length) * 100)
                        : 0
                };
            },

            /**
             * Get raw awareness logs (for reports)
             */
            getAwarenessLogs: () => {
                return get().awarenessLogs;
            },

            shouldAutoOpenSigilLegend: () => {
                const state = get();
                const dismissed = Boolean(state?.sigilLegend?.dismissed);
                const autoOpenCount = Number(state?.sigilLegend?.autoOpenCount) || 0;
                return !dismissed && autoOpenCount < 2;
            },

            markSigilLegendAutoOpened: () => {
                set((state) => {
                    const prev = state?.sigilLegend || { dismissed: false, autoOpenCount: 0 };
                    const nextCount = Math.min(2, (Number(prev.autoOpenCount) || 0) + 1);
                    return {
                        sigilLegend: {
                            dismissed: Boolean(prev.dismissed),
                            autoOpenCount: nextCount,
                        },
                    };
                });
            },

            setSigilLegendDismissed: (dismissed = true) => {
                set((state) => {
                    const prev = state?.sigilLegend || { dismissed: false, autoOpenCount: 0 };
                    return {
                        sigilLegend: {
                            dismissed: Boolean(dismissed),
                            autoOpenCount: Number(prev.autoOpenCount) || 0,
                        },
                    };
                });
            },

            // Internal-only bulk setter (tests/backfill/migration tooling).
            setTrackerItems: (items = []) => {
                set((state) => ({
                    ...state,
                    trackerConfig: {
                        items: normalizeTrackerItems(items),
                    }
                }));
            },

            addTrackerItem: (label) => {
                const cleanLabel = normalizeLabel(label);
                if (!cleanLabel) return null;
                const state = get();
                const existing = state.trackerConfig?.items || [];
                if (existing.length >= TRACKER_MAX_ITEMS) return null;
                const item = {
                    id: makeTrackerId(cleanLabel),
                    label: cleanLabel,
                    order: existing.length,
                };
                set({
                    trackerConfig: {
                        items: [...existing, item],
                    }
                });
                return item;
            },

            updateTrackerItemLabel: (itemId, label) => {
                const cleanLabel = normalizeLabel(label);
                if (!itemId || !cleanLabel) return false;
                const state = get();
                const items = state.trackerConfig?.items || [];
                const exists = items.some((item) => item.id === itemId);
                if (!exists) return false;
                set({
                    trackerConfig: {
                        items: items.map((item) => item.id === itemId ? { ...item, label: cleanLabel } : item),
                    }
                });
                return true;
            },

            reorderTrackerItems: (nextOrderedIds = []) => {
                const state = get();
                const items = state.trackerConfig?.items || [];
                if (!Array.isArray(nextOrderedIds) || nextOrderedIds.length !== items.length) return false;
                const deduped = [...new Set(nextOrderedIds)];
                if (deduped.length !== items.length) return false;
                const itemMap = new Map(items.map((item) => [item.id, item]));
                if (!deduped.every((id) => itemMap.has(id))) return false;
                const reordered = deduped.map((id, index) => ({
                    ...itemMap.get(id),
                    order: index,
                }));
                set({
                    trackerConfig: {
                        items: reordered,
                    }
                });
                return true;
            },

            removeTrackerItem: (itemId) => {
                if (!itemId) return false;
                const state = get();
                const items = state.trackerConfig?.items || [];
                const filtered = items.filter((item) => item.id !== itemId).map((item, index) => ({
                    ...item,
                    order: index,
                }));
                if (filtered.length === items.length) return false;
                set({
                    trackerConfig: {
                        items: filtered,
                    }
                });
                return true;
            },

            logTrackerCount: ({ dateKey, itemId, reactedDelta = 0, choseDelta = 0 } = {}) => {
                const state = get();
                const items = state.trackerConfig?.items || [];
                if (!itemId || !items.some((item) => item.id === itemId)) return false;

                const dayKey = normalizeLabel(dateKey) || getLocalDateKey(new Date());
                if (!dayKey) return false;

                const byDate = state.trackerDaily?.byDate || {};
                const dayMap = { ...(byDate[dayKey] || {}) };
                const current = dayMap[itemId] || { reacted: 0, chose: 0 };
                const nextReacted = clampNonNegative(current.reacted + reactedDelta);
                const nextChose = clampNonNegative(current.chose + choseDelta);

                if (nextReacted === 0 && nextChose === 0) {
                    delete dayMap[itemId];
                } else {
                    dayMap[itemId] = {
                        reacted: nextReacted,
                        chose: nextChose,
                    };
                }

                const nextByDate = { ...byDate };
                if (Object.keys(dayMap).length === 0) {
                    delete nextByDate[dayKey];
                } else {
                    nextByDate[dayKey] = dayMap;
                }

                set({
                    trackerDaily: {
                        byDate: nextByDate,
                    }
                });
                return true;
            },

            getTrackerRange: ({ startDateKey, endDateKey } = {}) => {
                const state = get();
                const items = [...(state.trackerConfig?.items || [])]
                    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
                const byDate = state.trackerDaily?.byDate || {};

                if (!startDateKey || !endDateKey || startDateKey > endDateKey) {
                    return { dates: [], rows: [], maxTotal: 0, tRef: TRACKER_T_REF };
                }

                const dates = [];
                let cursor = startDateKey;
                let guard = 0;
                while (cursor && cursor <= endDateKey && guard < 1000) {
                    dates.push(cursor);
                    cursor = addDaysToDateKey(cursor, 1);
                    guard += 1;
                }

                let maxTotal = 0;
                const rows = items.map((item) => {
                    const cells = dates.map((dateKey) => {
                        const source = byDate?.[dateKey]?.[item.id] || { reacted: 0, chose: 0 };
                        const reacted = clampNonNegative(source.reacted);
                        const chose = clampNonNegative(source.chose);
                        const total = reacted + chose;
                        if (total > maxTotal) maxTotal = total;
                        const dominance = total > 0 ? chose / total : 0;
                        const intensity = total === 0
                            ? 0
                            : clampUnit(Math.log1p(total) / Math.log1p(TRACKER_T_REF));
                        return {
                            dateKey,
                            reacted,
                            chose,
                            total,
                            dominance,
                            intensity,
                        };
                    });
                    return {
                        itemId: item.id,
                        label: item.label,
                        cells,
                    };
                });

                return {
                    dates,
                    rows,
                    maxTotal,
                    tRef: TRACKER_T_REF,
                };
            },

            // Intention statement
            intention: null,
            setIntention: (text) => set({ intention: text }),

            // Clear old logs (optional cleanup)
            clearOldLogs: (daysToKeep = 90) => {
                const cutoff = new Date();
                cutoff.setDate(cutoff.getDate() - daysToKeep);

                set((state) => ({
                    awarenessLogs: state.awarenessLogs.filter(log =>
                        new Date(log.timestamp) >= cutoff
                    )
                }));
            }
        }),
        {
            name: 'immanenceOS.applicationState',
            version: 4,
            partialize: (state) => ({
                ownerUserId: normalizeUserId(state.ownerUserId),
                awarenessLogs: Array.isArray(state.awarenessLogs) ? state.awarenessLogs : [],
                trackerConfig: {
                    items: normalizeTrackerItems(state.trackerConfig?.items || [], { keepOrder: true }),
                },
                trackerDaily: {
                    byDate: state.trackerDaily?.byDate && typeof state.trackerDaily.byDate === 'object'
                        ? state.trackerDaily.byDate
                        : {},
                },
                intention: state.intention ?? null,
                sigilLegend: {
                    dismissed: Boolean(state?.sigilLegend?.dismissed),
                    autoOpenCount: Math.max(0, Math.min(2, Number(state?.sigilLegend?.autoOpenCount) || 0)),
                },
            }),
            migrate: (persistedState, version) => {
                const migratedBase = version == null || version < 2
                    ? migrateApplicationStateV2(persistedState)
                    : (persistedState || {});
                const next = migrateApplicationStateV2(migratedBase);
                return {
                    ...buildInitialApplicationState(),
                    ...next,
                    ownerUserId: normalizeUserId(next.ownerUserId),
                    trackerConfig: {
                        items: normalizeTrackerItems(next?.trackerConfig?.items || [], { keepOrder: true }),
                    },
                    trackerDaily: {
                        byDate: next?.trackerDaily?.byDate && typeof next.trackerDaily.byDate === 'object'
                            ? next.trackerDaily.byDate
                            : {},
                    },
                    intention: next.intention ?? null,
                    sigilLegend: {
                        dismissed: Boolean(next?.sigilLegend?.dismissed),
                        autoOpenCount: Math.max(0, Math.min(2, Number(next?.sigilLegend?.autoOpenCount) || 0)),
                    },
                };
            },
            merge: (persistedState, currentState) => ({
                ...currentState,
                ...buildInitialApplicationState(),
                ...(persistedState || {}),
                ownerUserId: normalizeUserId(persistedState?.ownerUserId),
                activeUserId: null,
                trackerConfig: {
                    items: normalizeTrackerItems(persistedState?.trackerConfig?.items || [], { keepOrder: true }),
                },
                trackerDaily: {
                    byDate: persistedState?.trackerDaily?.byDate && typeof persistedState.trackerDaily.byDate === 'object'
                        ? persistedState.trackerDaily.byDate
                        : {},
                },
                sigilLegend: {
                    dismissed: Boolean(persistedState?.sigilLegend?.dismissed),
                    autoOpenCount: Math.max(0, Math.min(2, Number(persistedState?.sigilLegend?.autoOpenCount) || 0)),
                },
            }),
        }
    )
);
