// src/utils/chladniMath.js
// Chladni plate mathematics for cymatics visualization

/**
 * Compute the amplitude at a given (x, y) position for a Chladni mode.
 * The value oscillates between -1 and 1.
 * Particles settle where amplitude is near zero (nodal lines).
 * 
 * @param {number} x - X coordinate (0 to width)
 * @param {number} y - Y coordinate (0 to height)
 * @param {number} n - Mode number for x direction (integer)
 * @param {number} m - Mode number for y direction (integer)
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 * @returns {number} Amplitude value between -1 and 1
 */
export function getChladniAmplitude(x, y, n, m, width, height) {
    // Normalize coordinates to -1 to 1
    const nx = (x / width) * 2 - 1;
    const ny = (y / height) * 2 - 1;

    // Chladni equation: Z = cos(nπx)cos(mπy) - cos(mπx)cos(nπy)
    return Math.cos(n * Math.PI * nx) * Math.cos(m * Math.PI * ny)
        - Math.cos(m * Math.PI * nx) * Math.cos(n * Math.PI * ny);
}

/**
 * Compute amplitude for a chord (multiple frequencies/modes).
 * This creates interference patterns by summing multiple Chladni modes.
 * 
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {Array<{n: number, m: number, weight: number}>} modes - Array of modes with weights
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 * @returns {number} Combined amplitude value
 */
export function getChordAmplitude(x, y, modes, width, height) {
    if (!modes || modes.length === 0) return 0;

    let total = 0;
    for (const { n, m, weight = 1 } of modes) {
        total += getChladniAmplitude(x, y, n, m, width, height) * weight;
    }

    // Average to keep in -1 to 1 range
    return total / modes.length;
}

/**
 * Get the gradient (direction of steepest change) at a position.
 * Particles use this to find their way to nodal lines.
 * 
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {number} n - Mode number for x
 * @param {number} m - Mode number for y
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 * @param {number} delta - Step size for gradient calculation
 * @returns {{x: number, y: number}} Gradient vector
 */
export function getAmplitudeGradient(x, y, n, m, width, height, delta = 1) {
    const amp = Math.abs(getChladniAmplitude(x, y, n, m, width, height));
    const ampX = Math.abs(getChladniAmplitude(x + delta, y, n, m, width, height));
    const ampY = Math.abs(getChladniAmplitude(x, y + delta, n, m, width, height));

    return {
        x: ampX - amp,
        y: ampY - amp
    };
}

/**
 * Apply frequency drift to mode numbers.
 * This simulates micro-variations in frequency that cause the pattern to breathe.
 * 
 * @param {number} baseN - Base mode number for x
 * @param {number} baseM - Base mode number for y
 * @param {number} time - Current time in seconds
 * @param {number} driftAmount - How much to drift (0.1 = ±10%)
 * @param {number} driftRate - How fast to oscillate in Hz (0.2 = 5 second cycle)
 * @returns {{n: number, m: number}} Drifted mode numbers
 */
export function applyDrift(baseN, baseM, time, driftAmount = 0.1, driftRate = 0.2) {
    const effectiveN = baseN + Math.sin(time * driftRate * Math.PI * 2) * driftAmount;
    const effectiveM = baseM + Math.cos(time * driftRate * Math.PI * 2) * driftAmount;

    return { n: effectiveN, m: effectiveM };
}

/**
 * Map a frequency (Hz) to Chladni mode numbers (n, m).
 * Higher frequencies generally map to higher mode numbers.
 * This is an approximate mapping for aesthetic purposes.
 * 
 * @param {number} frequency - Frequency in Hz
 * @returns {{n: number, m: number}} Mode numbers
 */
export function frequencyToModes(frequency) {
    // Empirical mapping: higher frequency = more complex patterns
    // These are aesthetic choices, not strict physics

    // Base scaling: f = 100Hz → (2,3), f = 1000Hz → (10,13)
    const scale = Math.log(frequency / 100) / Math.log(10);
    const n = Math.floor(2 + scale * 4);
    const m = Math.floor(3 + scale * 5);

    return { n: Math.max(2, n), m: Math.max(3, m) };
}

/**
 * Calculate interval ratio from root frequency.
 * 
 * @param {string} intervalName - Name of interval (e.g., 'M3', 'P5')
 * @returns {number} Frequency ratio
 */
export function getIntervalRatio(intervalName) {
    const ratios = {
        'root': 1.0,      // 1:1
        'm2': 16 / 15,      // Minor second
        'M2': 9 / 8,        // Major second
        'm3': 6 / 5,        // Minor third
        'M3': 5 / 4,        // Major third
        'P4': 4 / 3,        // Perfect fourth
        'TT': 7 / 5,        // Tritone (approximate)
        'P5': 3 / 2,        // Perfect fifth
        'm6': 8 / 5,        // Minor sixth
        'M6': 5 / 3,        // Major sixth
        'm7': 9 / 5,        // Minor seventh
        'M7': 15 / 8,       // Major seventh
        'Oct': 2.0        // Octave
    };

    return ratios[intervalName] || 1.0;
}

/**
 * Get preset chord intervals.
 * 
 * @param {string} chordType - Type of chord ('major', 'minor', etc.)
 * @returns {Array<string>} Array of interval names
 */
export function getChordIntervals(chordType) {
    const chords = {
        'major': ['root', 'M3', 'P5'],
        'minor': ['root', 'm3', 'P5'],
        'diminished': ['root', 'm3', 'TT'],
        'augmented': ['root', 'M3', 'm6'],
        'power': ['root', 'P5'],
        'sus2': ['root', 'M2', 'P5'],
        'sus4': ['root', 'P4', 'P5'],
        'major7': ['root', 'M3', 'P5', 'M7'],
        'minor7': ['root', 'm3', 'P5', 'm7']
    };

    return chords[chordType] || ['root'];
}
