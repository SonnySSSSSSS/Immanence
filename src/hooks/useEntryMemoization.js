// src/hooks/useEntryMemoization.js
// Phase 5: Optimize re-renders with memoization

import { useMemo, useCallback } from 'react';

/**
 * Memoize circuit entries with filtering/sorting
 * Prevents unnecessary recalculations on parent re-renders
 */
export function useCircuitEntriesMemo(entries, filters = {}) {
    return useMemo(() => {
        // Normalize entries if they aren't already
        let normalized = entries.map(e => {
            if (e.type) return e; // Already normalized
            
            // Determine if it's a circuit or session based on structure
            const isCircuit = !!e.circuitName;
            return {
                id: e.id,
                type: isCircuit ? 'circuit' : 'session',
                name: isCircuit ? e.circuitName : e.domain,
                dateKey: e.dateKey,
                timestamp: isCircuit ? e.timestamp : e.date,
                data: e
            };
        });

        // Filter by tab
        if (filters.activeTab && filters.activeTab !== 'all') {
            const filterType = filters.activeTab === 'circuits' ? 'circuit' : 'session';
            normalized = normalized.filter(e => e.type === filterType);
        }

        // Filter by date
        if (filters.dateKey) {
            normalized = normalized.filter(e => e.dateKey === filters.dateKey);
        }

        // Sort by date descending
        normalized.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        return normalized;
    }, [entries, filters.dateKey, filters.activeTab]);
}

/**
 * Memoize challenge statistics
 */
export function useChallengeMemo(entries) {
    return useMemo(() => {
        const counts = {};
        entries.forEach(entry => {
            if (entry.overallAssessment?.challenges) {
                entry.overallAssessment.challenges.forEach(challenge => {
                    counts[challenge] = (counts[challenge] || 0) + 1;
                });
            }
        });
        return Object.entries(counts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);
    }, [entries]);
}

/**
 * Memoize attention quality trend
 */
export function useAttentionTrendMemo(entries) {
    return useMemo(() => {
        const qualityMap = { scattered: 1, settling: 2, stable: 3, absorbed: 4 };
        return entries
            .sort((a, b) => new Date(a.dateKey) - new Date(b.dateKey))
            .map(entry => ({
                date: entry.dateKey,
                value: qualityMap[entry.overallAssessment?.attentionQuality] || 0,
                label: entry.overallAssessment?.attentionQuality
            }));
    }, [entries]);
}

/**
 * Memoize exercise performance stats
 */
export function useExerciseStatsMemo(entries) {
    return useMemo(() => {
        const exerciseMap = {};
        const qualityMap = { scattered: 1, settling: 2, stable: 3, absorbed: 4 };

        entries.forEach(entry => {
            entry.exercises?.forEach(ex => {
                const key = ex.exerciseName;
                if (!exerciseMap[key]) {
                    exerciseMap[key] = [];
                }
                exerciseMap[key].push(qualityMap[ex.attentionQuality] || 0);
            });
        });

        return Object.entries(exerciseMap)
            .map(([name, values]) => ({
                name,
                count: values.length,
                avgQuality: values.length > 0
                    ? (values.reduce((a, b) => a + b) / values.length).toFixed(2)
                    : 0
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 8);
    }, [entries]);
}

/**
 * Memoize handler functions to prevent unnecessary callback recreations
 */
export function useMemoizedHandlers(handlers) {
    return useMemo(() => {
        const memoized = {};
        Object.entries(handlers).forEach(([key, handler]) => {
            memoized[key] = handler;
        });
        return memoized;
    }, [handlers]);
}