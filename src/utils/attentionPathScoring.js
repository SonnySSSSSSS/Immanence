// src/utils/attentionPathScoring.js
// ═══════════════════════════════════════════════════════════════════════════
// ATTENTION PATH SCORING — Centroids, Weights, and Softmax Calculation
// ═══════════════════════════════════════════════════════════════════════════
//
// Calculates path probabilities from weekly feature vectors.
// Uses weighted centroid distance with softmax normalization.
//
// Paths:
//   - Ekagrata: One-pointed focus (high duration, high completion, low switch)
//   - Sahaja: Natural rhythm (high rhythm, daily practice, effortless)
//   - Vigilance: Watchful awareness (high SCAN, high alive, distributed)
//
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Path Centroids
 * Ideal feature values for each path (normalized 0-1 where applicable)
 */
export const PATH_CENTROIDS = {
    Ekagrata: {
        duration_p50: 18,           // Long sessions (target: 18 min)
        completion_rate: 0.95,      // Very high completion
        interrupt_rate: 0.05,       // Very low interruption
        alive_rate: 0.85,           // High engagement
        rhythm_score: 0.75,         // Good but not essential
        within_family_switch_rate: 0.1, // Low switching
        settle_share: 0.85,         // Strongly SETTLE oriented
        scan_share: 0.08,           // Low SCAN
    },
    Sahaja: {
        duration_p50: 10,           // Moderate sessions
        completion_rate: 0.85,      // High completion
        interrupt_rate: 0.10,       // Low interruption
        alive_rate: 0.90,           // Very high engagement
        rhythm_score: 0.95,         // Essential: daily rhythm
        within_family_switch_rate: 0.2, // Some natural flow
        settle_share: 0.70,         // Mostly SETTLE
        scan_share: 0.15,           // Some SCAN
    },
    Vigilance: {
        duration_p50: 10,           // Moderate sessions
        completion_rate: 0.75,      // Lower completion (watchful exit)
        interrupt_rate: 0.15,       // Some interruption (checking)
        alive_rate: 0.95,           // Very high engagement
        rhythm_score: 0.65,         // Less essential
        within_family_switch_rate: 0.5, // High switching (exploring)
        settle_share: 0.35,         // Lower SETTLE
        scan_share: 0.50,           // High SCAN share
    },
};

/**
 * Feature Weights
 * Importance of each feature in path scoring (sum should be ~1.0)
 */
export const FEATURE_WEIGHTS = {
    duration_p50: 0.12,
    completion_rate: 0.18,
    interrupt_rate: 0.10,
    alive_rate: 0.15,
    rhythm_score: 0.15,
    within_family_switch_rate: 0.10,
    settle_share: 0.10,
    scan_share: 0.10,
};

/**
 * Feature Normalization Ranges
 * [min, max] for scaling features to 0-1
 */
const FEATURE_RANGES = {
    duration_p50: [3, 25],      // 3-25 minutes
    completion_rate: [0, 1],
    interrupt_rate: [0, 0.6],
    alive_rate: [0, 2],         // signals per minute
    rhythm_score: [0, 1],
    within_family_switch_rate: [0, 1],
    settle_share: [0, 1],
    scan_share: [0, 1],
};

/**
 * Normalize a feature value to 0-1 range
 */
function normalizeFeature(name, value) {
    const [min, max] = FEATURE_RANGES[name] || [0, 1];
    return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

/**
 * Calculate weighted distance between feature vector and centroid
 */
function weightedDistance(features, centroid) {
    let distance = 0;
    for (const [featureName, weight] of Object.entries(FEATURE_WEIGHTS)) {
        const featureValue = normalizeFeature(featureName, features[featureName] ?? 0);
        const centroidValue = normalizeFeature(featureName, centroid[featureName] ?? 0);

        // Squared difference, weighted
        const diff = featureValue - centroidValue;
        distance += weight * (diff * diff);
    }
    return Math.sqrt(distance);
}

/**
 * Softmax function for converting distances to probabilities
 */
function softmax(scores, temperature = 1.0) {
    // Higher temperature = more uniform distribution
    // Lower temperature = more peaked toward max
    const expScores = scores.map(s => Math.exp(s / temperature));
    const sum = expScores.reduce((a, b) => a + b, 0);
    return expScores.map(e => e / sum);
}

/**
 * Calculate path probabilities from feature vector
 * Returns object with path names as keys and probabilities as values
 */
export function calculatePathProbabilities(features, temperature = 0.3) {
    const paths = Object.keys(PATH_CENTROIDS);

    // Calculate distances (lower = better match)
    const distances = paths.map(path => ({
        path,
        distance: weightedDistance(features, PATH_CENTROIDS[path]),
    }));

    // Convert distances to similarities (invert for softmax)
    // Using negative distance so higher = better
    const similarities = distances.map(d => -d.distance);

    // Apply softmax
    const probs = softmax(similarities, temperature);

    // Build result object
    const result = {};
    for (let i = 0; i < paths.length; i++) {
        result[paths[i]] = probs[i];
    }

    // Add metadata
    result._distances = {};
    for (const d of distances) {
        result._distances[d.path] = d.distance;
    }

    return result;
}

/**
 * Get the dominant path if any probability exceeds threshold
 */
export function getDominantPath(probabilities, threshold = 0.55) {
    const paths = ['Ekagrata', 'Sahaja', 'Vigilance'];
    let maxProb = 0;
    let maxPath = null;

    for (const path of paths) {
        if (probabilities[path] > maxProb) {
            maxProb = probabilities[path];
            maxPath = path;
        }
    }

    if (maxProb >= threshold) {
        return { path: maxPath, probability: maxProb, status: 'COMMITTED' };
    }

    // Check for mixed state (two paths close)
    const sorted = paths
        .map(p => ({ path: p, prob: probabilities[p] }))
        .sort((a, b) => b.prob - a.prob);

    const gap = sorted[0].prob - sorted[1].prob;
    if (gap < 0.15 && sorted[0].prob >= 0.4) {
        return {
            path: `${sorted[0].path}/${sorted[1].path}`,
            probability: sorted[0].prob,
            status: 'MIXED',
        };
    }

    return { path: null, probability: maxProb, status: 'FORMING' };
}

/**
 * Gate Checks — Additional conditions beyond scoring
 */
export const GATE_CHECKS = {
    /**
     * Minimum valid weeks required
     */
    minValidWeeks: (validWeekCount) => validWeekCount >= 4,

    /**
     * Stability check: path probability consistent for N weeks
     */
    stabilityCheck: (weeklyProbabilities, path, minWeeks = 3) => {
        if (weeklyProbabilities.length < minWeeks) return false;
        const recent = weeklyProbabilities.slice(-minWeeks);
        return recent.every(probs => probs[path] >= 0.45);
    },

    /**
     * Volume disruption check: >60% volume drop from baseline
     */
    volumeDisruptionCheck: (currentVolume, baselineVolume) => {
        if (baselineVolume === 0) return false;
        const ratio = currentVolume / baselineVolume;
        return ratio < 0.4; // More than 60% drop
    },
};

/**
 * Determine overall path state from scoring and gates
 */
export function determinePathState(features, validWeekCount, weeklyProbabilities = []) {
    // Gate 1: Minimum valid weeks
    if (!GATE_CHECKS.minValidWeeks(validWeekCount)) {
        return {
            state: 'FORMING',
            path: null,
            reason: `Insufficient data (${validWeekCount}/4 valid weeks)`,
            probabilities: null,
        };
    }

    // Calculate probabilities
    const probs = calculatePathProbabilities(features);
    const dominant = getDominantPath(probs);

    // Gate 2: Stability check for commitment
    if (dominant.status === 'COMMITTED' && weeklyProbabilities.length >= 3) {
        const isStable = GATE_CHECKS.stabilityCheck(weeklyProbabilities, dominant.path);
        if (!isStable) {
            return {
                state: 'EMERGING',
                path: dominant.path,
                probability: dominant.probability,
                reason: 'Pattern detected but not yet stable',
                probabilities: probs,
            };
        }
    }

    return {
        state: dominant.status,
        path: dominant.path,
        probability: dominant.probability,
        reason: dominant.status === 'COMMITTED'
            ? `Strong ${dominant.path} pattern`
            : dominant.status === 'MIXED'
                ? 'Mixed attentional profile'
                : 'No clear pattern yet',
        probabilities: probs,
    };
}
