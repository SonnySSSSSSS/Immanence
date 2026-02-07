// =========================================================================
// trackingStore.js - DEV-ONLY PRECISION METER MOCK INJECTION
// =========================================================================
// This store exists SOLELY to inject mock timing-offset data for
// PrecisionMeterDevPanel testing. It is COMPLETELY ISOLATED from
// production tracking.
//
// AUTHORITATIVE TRACKING: progressStore.js (immutable, persistent)
//
// DO NOT:
// - Record sessions here
// - Compute stats here
// - Store any production data
// - Sync with progressStore
// =========================================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useTrackingStore = create(
    persist(
        (set, get) => ({
            // ===================================================================
            // DEV MODE OVERRIDE (for testing precision meter in DevPanel)
            // ===================================================================
            devModeOverride: null,
            /*
            Array of 7 objects (Mon-Sun):
            [
                { practiced: boolean, offsetMinutes: number },
                { practiced: true, offsetMinutes: -5 },   // 5 min early
                { practiced: true, offsetMinutes: 10 },   // 10 min late
                ...
            ]
            */

            // Set mock data for precision meter testing
            setDevModeOverride: (mockData) => {
                set({ devModeOverride: mockData });
            },

            // Clear mock data, revert to real (empty) data
            clearDevModeOverride: () => {
                set({ devModeOverride: null });
            },

            // Get weekly timing offsets
            // Returns mock data if devModeOverride is active; else empty array
            getWeeklyTimingOffsets: () => {
                const state = get();

                // Return mock if override is active
                if (state.devModeOverride) {
                    return state.devModeOverride;
                }

                // No real data source in this store (use progressStore instead)
                // Return empty array to avoid errors
                return [];
            },
        }),
        {
            name: 'immanenceOS.tracking',
            version: 1,
        }
    )
);
