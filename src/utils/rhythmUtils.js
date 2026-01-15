// src/utils/rhythmUtils.js
// Rhythm pulsing utilities for breath practice visual FX
// Adds synchronized cadence to visual animations based on breath cycle duration

/**
 * Calculate rhythm frequency based on total cycle duration
 * Implements continuous inverse scaling with clamped boundaries
 * 
 * @param {number} cycleDurationSeconds - Total breath cycle duration (inhale + holds + exhale)
 * @returns {number} Frequency in Hz (oscillations per second)
 * 
 * Formula: freq = 1 / cycleDuration, clamped to [0.25Hz, 1Hz]
 * - Short cycles (1-4s): 1.0Hz (faster pulse)
 * - Medium cycles (5-10s): 0.5-0.2Hz (moderate pulse)
 * - Long cycles (11-40s): 0.25Hz (slow pulse)
 * - Very long cycles (40-60s): 0.25Hz floor (prevents disappearance)
 */
export function calculateRhythmFrequency(cycleDurationSeconds) {
  if (!cycleDurationSeconds || cycleDurationSeconds <= 0) {
    return 0.5; // Safe default
  }
  
  // Continuous inverse relationship
  const baseFrequency = 1 / cycleDurationSeconds;
  
  // Clamp to min/max boundaries
  const MIN_FREQUENCY = 0.25; // One pulse every 4s (floor for long cycles)
  const MAX_FREQUENCY = 1.0;  // One pulse per second (ceiling for short cycles)
  
  return Math.max(MIN_FREQUENCY, Math.min(MAX_FREQUENCY, baseFrequency));
}

/**
 * Generate sine-wave oscillation for modulation
 * Used to layer rhythmic pulsing on top of phase-based animations
 * 
 * @param {number} time - Current time in seconds (e.g., performance.now() / 1000)
 * @param {number} frequency - Frequency in Hz
 * @param {number} amplitude - Amplitude range, typically 0-1
 * @param {number} phase - Optional phase offset in radians (0 = start at zero)
 * @returns {number} Oscillation value in range [-amplitude, +amplitude]
 */
export function rhythmOscillation(time, frequency, amplitude = 1.0, phase = 0) {
  if (!time || frequency <= 0) {
    return 0;
  }
  
  // 2π * frequency * time + phase
  const angle = 2 * Math.PI * frequency * time + phase;
  return Math.sin(angle) * amplitude;
}

/**
 * Apply rhythm modulation to a base animation value
 * Gate-aware: can reduce modulation during hold phases
 * 
 * @param {number} baseValue - Base animation value (scale, glow blur, etc.)
 * @param {number} rhythmOscillationValue - Result from rhythmOscillation()
 * @param {string} phase - Current breath phase ('inhale'|'hold'|'exhale'|'rest')
 * @param {object} options - Configuration
 * @param {number} options.maxAmplitude - Maximum modulation amplitude (default 0.08)
 * @param {number} options.holdGateFactor - Gate reduction during holds (0-1, default 0.35)
 * @returns {number} Modulated value
 * 
 * Example: For scale of 1.1, oscillation of 0.05:
 *   - Inhale: 1.1 * (1 + 0.05 * 0.08) = 1.1 * 1.004 ✓ Smooth layer
 *   - Hold: 1.1 * (1 + 0.05 * 0.08 * 0.35) = 1.1 * 1.0014 ✓ Subtle
 */
export function applyRhythmModulation(baseValue, rhythmOscillationValue, phase = 'rest', options = {}) {
  const {
    maxAmplitude = 0.08,
    holdGateFactor = 0.35
  } = options;
  
  // Determine gate factor based on phase
  const isHoldPhase = phase === 'hold' || phase === 'rest';
  const gateAmount = isHoldPhase ? holdGateFactor : 1.0;
  
  // Apply modulation: value * (1 + rhythm * gate)
  const modulation = 1 + (rhythmOscillationValue * maxAmplitude * gateAmount);
  return baseValue * modulation;
}

/**
 * Convert rhythm frequency to tempo/BPM (for reference/debugging)
 * 
 * @param {number} frequency - Frequency in Hz
 * @returns {number} Tempo in beats per minute
 */
export function frequencyToBPM(frequency) {
  return frequency * 60;
}

/**
 * Utility to check if rhythm is currently in "strong" phase (for visual intensity)
 * Returns 1.0 during active phases, holdGateFactor during holds
 * 
 * @param {string} phase - Current breath phase
 * @param {number} holdGateFactor - Gate factor for holds (default 0.35)
 * @returns {number} Gate intensity (0-1)
 */
export function getRhythmGateForPhase(phase = 'rest', holdGateFactor = 0.35) {
  const isHoldPhase = phase === 'hold' || phase === 'rest';
  return isHoldPhase ? holdGateFactor : 1.0;
}
