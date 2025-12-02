// Example state structure for mandalaStore.js
// This shows the data format expected by the Avatar component

export function getMandalaState() {
    return {
        // === EXISTING FIELDS (already in use) ===
        avgAccuracy: 0.85,              // 0-1 (85% accuracy)
        phase: "foundation",             // Current practice phase
        totalSessions: 42,               // Total number of practice sessions
        transient: {
            focus: 0.9,                    // Real-time focus metric (0-1)
            clarity: 0.8,                  // Real-time clarity metric (0-1)
            distortion: 0.1,               // Real-time distortion metric (0-1)
        },

        // === NEW FIELDS (for Option C features) ===
        weeklyConsistency: 5,            // Number of days practiced this week (0-7)
        weeklyPracticeLog: [             // Boolean array for Mon-Sun
            true,                          // Monday - practiced ✅
            true,                          // Tuesday - practiced ✅
            false,                         // Wednesday - not practiced ❌
            true,                          // Thursday - practiced ✅
            false,                         // Friday - not practiced ❌
            true,                          // Saturday - practiced ✅
            true,                          // Sunday - practiced ✅
        ],
    };
}

// === USAGE FLOW ===
// 1. Avatar component calls getMandalaState() every 2 seconds
// 2. Extracts weeklyConsistency and weeklyPracticeLog
// 3. Passes to ConsistencyAura (for glow intensity)
// 4. Passes to WeeklyBadges (for dot states)

// === VISUAL EFFECTS ===
// - weeklyConsistency controls pulsing aura brightness
//   - 0 days: subtle faint glow (opacity 0.15)
//   - 7 days: bright intense glow (opacity 0.5)
// - weeklyPracticeLog controls individual badge dots
//   - true: bright gold #fcd34d with glow effect
//   - false: muted gold rgba(253,224,71,0.2)

// === IMPLEMENTATION NOTES ===
// - Ensure weeklyPracticeLog always has exactly 7 elements
// - weeklyConsistency should match the number of 'true' values in weeklyPracticeLog
// - Reset weeklyPracticeLog every Monday (start of new week)
// - Update weeklyConsistency when a practice session completes
