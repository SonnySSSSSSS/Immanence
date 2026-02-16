import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';

if (!globalThis.localStorage) {
  const memory = new Map();
  globalThis.localStorage = {
    getItem: (key) => (memory.has(key) ? memory.get(key) : null),
    setItem: (key, value) => {
      memory.set(key, String(value));
    },
    removeItem: (key) => {
      memory.delete(key);
    },
    clear: () => {
      memory.clear();
    },
  };
}

const { useBreathBenchmarkStore } = await import('../src/state/breathBenchmarkStore.js');

function resetBreathStore() {
  useBreathBenchmarkStore.setState({
    benchmark: null,
    lastBenchmark: null,
    benchmarkHistory: [],
    benchmarksByRunId: {},
    attemptBenchmarksByRunId: {},
    lifetimeMax: { inhale: 0, hold1: 0, exhale: 0, hold2: 0, total: 0 },
  });
}

beforeEach(() => {
  resetBreathStore();
});

test('attempt reset helper sets benchmark state to NOT_STARTED', () => {
  const runId = 'attempt-reset-1';
  useBreathBenchmarkStore.getState().resetAttemptBenchmark(runId);
  const attempt = useBreathBenchmarkStore.getState().getAttemptBenchmark(runId);
  assert.equal(attempt?.status, 'not_started');
  assert.equal(attempt?.benchmark, null);
});

test('lastBenchmark is preserved as historical record', () => {
  const first = { inhale: 4, hold1: 5, exhale: 6, hold2: 7, measuredAt: Date.now() - (2 * 24 * 60 * 60 * 1000) };
  useBreathBenchmarkStore.getState().setBenchmark(first);

  const last = useBreathBenchmarkStore.getState().lastBenchmark;
  assert.equal(last?.inhale, 4);
  assert.equal(last?.hold2, 7);
  assert.equal(useBreathBenchmarkStore.getState().benchmarkHistory.length, 1);
});

test('reuse validity gate uses recency window', () => {
  const withinWindow = { inhale: 5, hold1: 5, exhale: 5, hold2: 5, measuredAt: Date.now() - (10 * 24 * 60 * 60 * 1000) };
  useBreathBenchmarkStore.getState().setBenchmark(withinWindow);

  assert.equal(useBreathBenchmarkStore.getState().canReuseLastBenchmark(14), true);
  assert.equal(useBreathBenchmarkStore.getState().canReuseLastBenchmark(7), false);
});

test('reusing previous benchmark satisfies attempt without overwriting history', () => {
  const baseline = { inhale: 6, hold1: 7, exhale: 8, hold2: 9, measuredAt: Date.now() - (3 * 24 * 60 * 60 * 1000) };
  const store = useBreathBenchmarkStore.getState();
  store.setBenchmark(baseline);
  const historyBefore = useBreathBenchmarkStore.getState().benchmarkHistory.length;

  const runId = 'attempt-reuse-1';
  store.resetAttemptBenchmark(runId);
  store.reuseLastBenchmarkForAttempt(runId, { maxAgeDays: 14 });

  const next = useBreathBenchmarkStore.getState();
  assert.equal(next.hasBenchmarkForRun(runId), true);
  assert.equal(next.getAttemptBenchmark(runId)?.source, 'reuse');
  assert.equal(next.benchmarkHistory.length, historyBefore);
  assert.equal(next.lastBenchmark?.measuredAt, baseline.measuredAt);
});

test('fresh attempt benchmark appends history and updates lastBenchmark', () => {
  const store = useBreathBenchmarkStore.getState();
  store.setBenchmark({ inhale: 3, hold1: 3, exhale: 3, hold2: 3, measuredAt: Date.now() - (4 * 24 * 60 * 60 * 1000) });
  const historyBefore = useBreathBenchmarkStore.getState().benchmarkHistory.length;

  const runId = 'attempt-fresh-1';
  store.resetAttemptBenchmark(runId);
  store.completeAttemptBenchmark({
    runId,
    source: 'fresh',
    results: { inhale: 8, hold1: 9, exhale: 10, hold2: 11 },
  });

  const next = useBreathBenchmarkStore.getState();
  assert.equal(next.hasBenchmarkForRun(runId), true);
  assert.equal(next.lastBenchmark?.inhale, 8);
  assert.equal(next.lastBenchmark?.hold2, 11);
  assert.equal(next.benchmarkHistory.length, historyBefore + 1);
});

test('attempt benchmark completion survives simulated persist rehydrate', () => {
  const runId = 'attempt-rehydrate-1';
  const store = useBreathBenchmarkStore.getState();
  store.resetAttemptBenchmark(runId);
  store.completeAttemptBenchmark({
    runId,
    source: 'fresh',
    results: { inhale: 7, hold1: 8, exhale: 9, hold2: 10 },
  });

  const persistedSnapshot = JSON.parse(JSON.stringify(useBreathBenchmarkStore.getState()));
  resetBreathStore();
  useBreathBenchmarkStore.setState(persistedSnapshot);

  const next = useBreathBenchmarkStore.getState();
  assert.equal(next.getAttemptBenchmark(runId)?.status, 'satisfied');
  assert.equal(next.hasBenchmarkForRun(runId), true);
  assert.equal(next.getAttemptBenchmark(runId)?.benchmark?.inhale, 7);
});
