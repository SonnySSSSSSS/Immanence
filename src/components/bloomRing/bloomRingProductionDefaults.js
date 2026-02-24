// src/components/bloomRing/bloomRingProductionDefaults.js
// Canonical production params for the bloom ring renderer.
// Matches the "Soft" preset from BloomRingLab — conservative, no god rays,
// clean bloom. breathSpeed is computed per-component from the
// active breath pattern total; all other fields are stable defaults.

export const PRODUCTION_RING_DEFAULTS = {
  bloomStrength:       1.2,
  bloomRadius:         0.60,
  bloomThreshold:      0.50,
  streakStrength:      0.0,
  streakThreshold:     0.85,
  streakLength:        0.65,
  rayEnabled:          false,
  rayExposure:         0.10,
  rayWeight:           0.4,
  rayDecay:            0.93,
  raySamples:          40,
  rayDensity:          0.5,
  rayClampMax:         0.6,
  raySunY:             0.45,
  raySunZ:            -2.0,
  raySunRadius:        0.10,
  occluderEnabled:     false,
  occluderPattern:    'cross',
  occluderScale:       1.2,
  occluderDepthOffset: -1.5,
  debugOccluders:      false,
  trailEnabled:        true,
  trailIntensity:      0.95,
  trailLength:         42,
  trailSpread:         0.05,
  trailSpeed:          0.4,
  trailSparkle:        0.08,
  metalRingRadius:     1.0,
  metalRingTube:       0.03,
  metalRingRadialSegs: 16,
  metalRingTubularSegs: 128,
  metalRingMetalness:  1.0,
  metalRingRoughness:  0.05,
  metalRingClearcoat:  0.35,
  metalRingClearcoatRoughness: 0.12,
  causticsIntensity:   1.25,
  causticsSpeed:       0.72,
  holdRadianceIntensity: 3.0,
};

// Neutral stage accent — Beacon cyan.
// Replace with a live stage-store lookup when stage wiring is added.
export const PRODUCTION_ACCENT = '#22d3ee';
