export function validateBenchmarkPrerequisite({
  path = null,
  hasBenchmark = false,
  benchmarkStateValid = true,
  benchmarkStateError = null,
} = {}) {
  const requiresBenchmark = Boolean(path?.showBreathBenchmark);
  if (!requiresBenchmark) {
    return { ok: true, error: null, warning: null };
  }

  // Fail-safe: unreadable/corrupt benchmark state should not block training start.
  if (benchmarkStateValid === false) {
    return {
      ok: true,
      error: null,
      warning: 'benchmark_state_unreadable',
      detail: benchmarkStateError || null,
    };
  }

  if (!hasBenchmark) {
    return { ok: false, error: 'Complete the breathing benchmark first.', warning: null };
  }

  return { ok: true, error: null, warning: null };
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
