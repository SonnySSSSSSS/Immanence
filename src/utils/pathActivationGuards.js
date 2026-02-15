export function validateBenchmarkPrerequisite({ path = null, hasBenchmark = false } = {}) {
  if (path?.showBreathBenchmark && !hasBenchmark) {
    return { ok: false, error: 'Complete the breathing benchmark first.' };
  }
  return { ok: true, error: null };
}

/**
 * Contract complete when every obligation in the full contract is satisfied.
 * totalObligations must represent the entire contract (not "so far").
 */
export function isContractComplete({ totalObligations, satisfiedObligations }) {
  if (!totalObligations || totalObligations <= 0) return false;
  return satisfiedObligations >= totalObligations;
}

/**
 * Benchmark CTA label based on contract completion and benchmark state.
 */
export function getBenchmarkCtaLabel({ hasBenchmark, contractComplete }) {
  if (contractComplete && hasBenchmark) return 'Re-benchmark';
  if (hasBenchmark) return 'Benchmark complete';
  return 'Take benchmark';
}

