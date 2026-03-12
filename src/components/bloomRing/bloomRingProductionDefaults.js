// src/components/bloomRing/bloomRingProductionDefaults.js
// Canonical production params for the bloom ring renderer.
// Conservative baseline for the live production path. breathSpeed is computed
// per-component from the active breath pattern total; all other fields are
// stable defaults.

export const PRODUCTION_RING_DEFAULTS = {
  bloomStrength:       1.2,
  bloomRadius:         0.60,
  bloomThreshold:      0.50,
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
};
