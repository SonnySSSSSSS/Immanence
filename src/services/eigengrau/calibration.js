const STORAGE_KEY = 'immanenceOS.eigengrau.calibration.v1';
const RETENTION_DAYS = 35;

export const EIGENGRAU_RESULTS = Object.freeze({
  STRONG_OVERLAP: 'strong_overlap',
  NEAR_SHIFT: 'near_shift',
  NO_CLEAR_OVERLAP: 'no_clear_overlap',
  NO_MARKED_EVENT: 'no_marked_event',
});

export const EIGENGRAU_SESSION_TYPES = Object.freeze({
  CALIBRATION: 'calibration',
  PRACTICE: 'practice',
});

export const EIGENGRAU_STAGE_THRESHOLDS = Object.freeze({
  1: Object.freeze({ targetReliability: 0.7, falsePositiveCeiling: 0.35, minTrials: 18 }),
  2: Object.freeze({ targetReliability: 0.8, falsePositiveCeiling: 0.25, minTrials: 22 }),
  3: Object.freeze({ targetReliability: 0.9, falsePositiveCeiling: 0.15, minTrials: 28 }),
});

function toValidDate(value) {
  const d = value ? new Date(value) : null;
  return d && Number.isFinite(d.getTime()) ? d : null;
}

function loadRaw() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveRaw(entries) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // Ignore quota/storage failures; calibration should fail soft.
  }
}

function prune(entries, now = new Date()) {
  const cutoff = now.getTime() - RETENTION_DAYS * 24 * 60 * 60 * 1000;
  return entries.filter((entry) => {
    const ts = toValidDate(entry?.ts);
    return ts && ts.getTime() >= cutoff;
  });
}

export function recordCalibrationTrial(trial) {
  if (!trial || typeof trial !== 'object') return null;
  const now = new Date();
  const next = {
    ts: trial.ts || now.toISOString(),
    stage: Number.isInteger(Number(trial.stage)) ? Number(trial.stage) : 1,
    result: typeof trial.result === 'string' ? trial.result : EIGENGRAU_RESULTS.NO_CLEAR_OVERLAP,
    eventType: typeof trial.eventType === 'string' ? trial.eventType : 'unknown',
    hadEvent: trial.hadEvent !== false,
  };

  const existing = prune(loadRaw(), now);
  existing.push(next);
  saveRaw(existing);
  return next;
}

export function getCalibrationTrials({ stage = null, days = 14, now = new Date() } = {}) {
  const all = prune(loadRaw(), now);
  const cutoff = now.getTime() - Math.max(1, Number(days) || 14) * 24 * 60 * 60 * 1000;

  return all.filter((entry) => {
    const ts = toValidDate(entry?.ts);
    if (!ts || ts.getTime() < cutoff) return false;
    if (stage == null) return true;
    return Number(entry.stage) === Number(stage);
  });
}

export function computeCalibrationStats({ stage = 1, days = 14, now = new Date() } = {}) {
  const trials = getCalibrationTrials({ stage, days, now });
  const totalTrials = trials.length;

  const strong = trials.filter((t) => t.result === EIGENGRAU_RESULTS.STRONG_OVERLAP).length;
  const near = trials.filter((t) => t.result === EIGENGRAU_RESULTS.NEAR_SHIFT).length;
  const misses = trials.filter((t) => t.result === EIGENGRAU_RESULTS.NO_MARKED_EVENT).length;
  const falsePositives = trials.filter((t) => t.result === EIGENGRAU_RESULTS.NO_CLEAR_OVERLAP).length;

  const reliability = totalTrials > 0 ? (strong + near) / totalTrials : 0;
  const falsePositiveRate = totalTrials > 0 ? falsePositives / totalTrials : 0;

  const thresholds = EIGENGRAU_STAGE_THRESHOLDS[Number(stage)] || EIGENGRAU_STAGE_THRESHOLDS[1];
  const hasVolume = totalTrials >= thresholds.minTrials;
  const pass =
    hasVolume
    && reliability >= thresholds.targetReliability
    && falsePositiveRate <= thresholds.falsePositiveCeiling;

  return {
    stage: Number(stage) || 1,
    days,
    totalTrials,
    strong,
    near,
    misses,
    falsePositives,
    reliability,
    falsePositiveRate,
    hasVolume,
    pass,
    thresholds,
  };
}

export function formatCalibrationSignal(result) {
  switch (result) {
    case EIGENGRAU_RESULTS.STRONG_OVERLAP:
      return 'strong overlap';
    case EIGENGRAU_RESULTS.NEAR_SHIFT:
      return 'near the shift';
    case EIGENGRAU_RESULTS.NO_MARKED_EVENT:
      return 'no marked event';
    case EIGENGRAU_RESULTS.NO_CLEAR_OVERLAP:
    default:
      return 'no clear overlap';
  }
}
