// src/utils/mockAttentionData.js
// ═══════════════════════════════════════════════════════════════════════════
// MOCK DATA GENERATOR — Synthetic User Profiles for Attention Path Validation
// ═══════════════════════════════════════════════════════════════════════════
//
// Creates synthetic weekly feature data to validate scoring logic.
// Each profile represents a distinct archetype of practitioner behavior.
//
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Synthetic User Profiles
 * Each returns a weekly feature vector matching attentionStore format
 */
export const MOCK_PROFILES = {
    /**
     * STABLE EKAGRATA — The One-Pointed Meditator
     * High duration, high completion, high alive, low interrupts, low switching
     * Should strongly score toward Ekagrata
     */
    stable_ekagrata: {
        name: 'Stable Ekagrata',
        description: 'Deep single-anchor meditator. Long, completed sessions with minimal interruption.',
        expectedPath: 'Ekagrata',
        generateWeek: (variance = 0) => ({
            session_count: 5 + Math.floor(Math.random() * 3 * variance),
            total_minutes: 90 + Math.floor(Math.random() * 30 * variance),
            duration_p50: 18 + Math.floor(Math.random() * 5 * variance),
            rhythm_score: 0.8 + Math.random() * 0.15 * variance,
            valid_week: true,
            completion_rate: 0.92 + Math.random() * 0.08 * variance,
            interrupt_rate: 0.05 + Math.random() * 0.1 * variance,
            early_exit_rate: 0.02 + Math.random() * 0.05 * variance,
            alive_rate: 0.8 + Math.random() * 0.2 * variance,
            short_session_rate: 0.05,
            within_family_switch_rate: 0.1,
            settle_share: 0.9,
            scan_share: 0.05,
            relate_share: 0.03,
            inquire_share: 0.02,
            settle_completion_rate: 0.95,
            scan_completion_rate: 0.8,
        }),
    },

    /**
     * RHYTHMIC SAHAJA — The Effortless Practitioner
     * High rhythm, low interrupt, high alive, medium duration, consistent pattern
     * Should strongly score toward Sahaja
     */
    rhythmic_sahaja: {
        name: 'Rhythmic Sahaja',
        description: 'Natural rhythm meditator. Daily practice, moderate duration, flows without interruption.',
        expectedPath: 'Sahaja',
        generateWeek: (variance = 0) => ({
            session_count: 7 + Math.floor(Math.random() * 2 * variance),
            total_minutes: 70 + Math.floor(Math.random() * 20 * variance),
            duration_p50: 10 + Math.floor(Math.random() * 3 * variance),
            rhythm_score: 0.95 + Math.random() * 0.05 * variance,
            valid_week: true,
            completion_rate: 0.85 + Math.random() * 0.1 * variance,
            interrupt_rate: 0.08 + Math.random() * 0.1 * variance,
            early_exit_rate: 0.05 + Math.random() * 0.05 * variance,
            alive_rate: 0.9 + Math.random() * 0.1 * variance,
            short_session_rate: 0.15,
            within_family_switch_rate: 0.2,
            settle_share: 0.7,
            scan_share: 0.15,
            relate_share: 0.1,
            inquire_share: 0.05,
            settle_completion_rate: 0.88,
            scan_completion_rate: 0.82,
        }),
    },

    /**
     * SCANNING VIGILANCE — The Watchful Explorer
     * High SCAN share, high switching, high alive, distributed attention
     * Should strongly score toward Vigilance
     */
    scanning_vigilance: {
        name: 'Scanning Vigilance',
        description: 'Body scan specialist. Sequential attention, explores modalities, high engagement.',
        expectedPath: 'Vigilance',
        generateWeek: (variance = 0) => ({
            session_count: 6 + Math.floor(Math.random() * 3 * variance),
            total_minutes: 60 + Math.floor(Math.random() * 20 * variance),
            duration_p50: 10 + Math.floor(Math.random() * 4 * variance),
            rhythm_score: 0.7 + Math.random() * 0.2 * variance,
            valid_week: true,
            completion_rate: 0.78 + Math.random() * 0.1 * variance,
            interrupt_rate: 0.15 + Math.random() * 0.1 * variance,
            early_exit_rate: 0.08 + Math.random() * 0.05 * variance,
            alive_rate: 0.95 + Math.random() * 0.05 * variance,
            short_session_rate: 0.12,
            within_family_switch_rate: 0.5,
            settle_share: 0.3,
            scan_share: 0.55,
            relate_share: 0.1,
            inquire_share: 0.05,
            settle_completion_rate: 0.75,
            scan_completion_rate: 0.85,
        }),
    },

    /**
     * HYBRID ALTERNATOR — The Path Flipper
     * Alternates between Ekagrata and Vigilance patterns week to week
     * Should remain in MIXED or FORMING states
     */
    hybrid_alternator: {
        name: 'Hybrid Alternator',
        description: 'Alternates between deep focus and scanning patterns. No stable commitment.',
        expectedPath: 'MIXED',
        generateWeek: (variance = 0, weekIndex = 0) => {
            const isEkagrataWeek = weekIndex % 2 === 0;
            if (isEkagrataWeek) {
                return MOCK_PROFILES.stable_ekagrata.generateWeek(variance);
            } else {
                return MOCK_PROFILES.scanning_vigilance.generateWeek(variance);
            }
        },
    },

    /**
     * PATHLESS — No Dominant Pattern
     * Evenly distributed across all metrics, no clear preference
     * Should remain in FORMING
     */
    pathless: {
        name: 'Pathless',
        description: 'Broadly explores all modalities. No dominant attentional style emerges.',
        expectedPath: 'FORMING',
        generateWeek: (variance = 0) => ({
            session_count: 4 + Math.floor(Math.random() * 2 * variance),
            total_minutes: 45 + Math.floor(Math.random() * 15 * variance),
            duration_p50: 10 + Math.floor(Math.random() * 5 * variance),
            rhythm_score: 0.5 + Math.random() * 0.3 * variance,
            valid_week: true,
            completion_rate: 0.6 + Math.random() * 0.2 * variance,
            interrupt_rate: 0.2 + Math.random() * 0.15 * variance,
            early_exit_rate: 0.15 + Math.random() * 0.1 * variance,
            alive_rate: 0.5 + Math.random() * 0.3 * variance,
            short_session_rate: 0.2,
            within_family_switch_rate: 0.35,
            settle_share: 0.35,
            scan_share: 0.3,
            relate_share: 0.2,
            inquire_share: 0.15,
            settle_completion_rate: 0.6,
            scan_completion_rate: 0.55,
        }),
    },

    /**
     * CHAOTIC BEGINNER — Unstable Metrics
     * High variance, low completion, frequent abandonment
     * Should remain in FORMING with no clear path
     */
    chaotic_beginner: {
        name: 'Chaotic Beginner',
        description: 'New practitioner with erratic patterns. Frequent abandonment, short sessions.',
        expectedPath: 'FORMING',
        generateWeek: () => ({
            session_count: 2 + Math.floor(Math.random() * 4),
            total_minutes: 15 + Math.floor(Math.random() * 20),
            duration_p50: 5 + Math.floor(Math.random() * 5),
            rhythm_score: 0.15 + Math.random() * 0.3,
            valid_week: Math.random() > 0.3, // Sometimes invalid
            completion_rate: 0.35 + Math.random() * 0.25,
            interrupt_rate: 0.4 + Math.random() * 0.2,
            early_exit_rate: 0.3 + Math.random() * 0.2,
            alive_rate: 0.3 + Math.random() * 0.4,
            short_session_rate: 0.5,
            within_family_switch_rate: 0.6,
            settle_share: 0.6 + Math.random() * 0.3,
            scan_share: 0.1 + Math.random() * 0.2,
            relate_share: 0.05,
            inquire_share: 0.05,
            settle_completion_rate: 0.4,
            scan_completion_rate: 0.3,
        }),
    },

    /**
     * LIFE DISRUPTED — Volume Shift
     * Was stable Sahaja, then 80% volume drop due to life event
     * Tests disruption gate logic
     */
    life_disrupted: {
        name: 'Life Disrupted',
        description: 'Previously stable Sahaja, then major life event causes 80% volume drop.',
        expectedPath: 'DISRUPTED',
        generateWeekSeries: (numWeeks = 12) => {
            const weeks = [];
            for (let i = 0; i < numWeeks; i++) {
                if (i < 6) {
                    // First 6 weeks: stable Sahaja
                    weeks.push({
                        ...MOCK_PROFILES.rhythmic_sahaja.generateWeek(0.2),
                        week_index: i,
                    });
                } else {
                    // After disruption: 80% volume drop
                    const baseline = MOCK_PROFILES.rhythmic_sahaja.generateWeek(0.2);
                    weeks.push({
                        ...baseline,
                        session_count: Math.max(1, Math.floor(baseline.session_count * 0.2)),
                        total_minutes: Math.max(5, Math.floor(baseline.total_minutes * 0.2)),
                        rhythm_score: baseline.rhythm_score * 0.3,
                        valid_week: Math.random() > 0.5, // Often invalid now
                        week_index: i,
                    });
                }
            }
            return weeks;
        },
    },
};

/**
 * Generate mock weekly data for a profile
 */
export function generateMockWeeklyData(profileKey, numWeeks = 12, variance = 0.3) {
    const profile = MOCK_PROFILES[profileKey];
    if (!profile) {
        throw new Error(`Unknown profile: ${profileKey}`);
    }

    // Special case for life_disrupted which has its own series generator
    if (profile.generateWeekSeries) {
        return profile.generateWeekSeries(numWeeks);
    }

    const weeks = [];
    for (let i = 0; i < numWeeks; i++) {
        const weekData = profile.generateWeek(variance, i);
        weeks.push({
            ...weekData,
            week_key: generateMockWeekKey(i),
            computed_at: Date.now() - (numWeeks - i) * 7 * 24 * 60 * 60 * 1000,
            week_index: i,
        });
    }
    return weeks;
}

/**
 * Generate a mock week key (YYYY-WXX format) going back from current week
 */
function generateMockWeekKey(weeksAgo) {
    const now = new Date();
    const pastDate = new Date(now.getTime() - weeksAgo * 7 * 24 * 60 * 60 * 1000);

    // Calculate ISO week
    const d = new Date(Date.UTC(pastDate.getFullYear(), pastDate.getMonth(), pastDate.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);

    return `${d.getUTCFullYear()}-W${weekNo.toString().padStart(2, '0')}`;
}

/**
 * Get all available profile keys
 */
export function getProfileKeys() {
    return Object.keys(MOCK_PROFILES);
}

/**
 * Get profile metadata
 */
export function getProfileMetadata(profileKey) {
    const profile = MOCK_PROFILES[profileKey];
    if (!profile) return null;
    return {
        name: profile.name,
        description: profile.description,
        expectedPath: profile.expectedPath,
    };
}
