import test from 'node:test';
import assert from 'node:assert/strict';

import { getPathById } from '../src/data/navigationData.js';
import { validateBenchmarkPrerequisite, isContractComplete, getBenchmarkCtaLabel } from '../src/utils/pathActivationGuards.js';
import { validatePathActivationSelections } from '../src/utils/pathContract.js';

test('activation fails benchmark prerequisite for initiation-2 when benchmark is missing', () => {
  const path = getPathById('initiation-2');
  const result = validateBenchmarkPrerequisite({ path, hasBenchmark: false });
  assert.equal(result.ok, false);
  assert.match(String(result.error || ''), /benchmark/i);
});

test('activation succeeds when benchmark is complete and selections are valid', () => {
  const path = getPathById('initiation-2');
  const benchmarkResult = validateBenchmarkPrerequisite({ path, hasBenchmark: true });
  const selectionResult = validatePathActivationSelections(path, {
    selectedDaysOfWeek: [1, 2, 3, 4, 5, 6],
    selectedTimes: ['17:00', '21:00'],
  });

  assert.equal(benchmarkResult.ok, true);
  assert.equal(selectionResult.ok, true);
});

// --- isContractComplete ---

test('isContractComplete is false when caught up mid-program (12/24 full-contract obligations)', () => {
  assert.equal(isContractComplete({ totalObligations: 24, satisfiedObligations: 12 }), false);
});

test('isContractComplete is true when all contract obligations are satisfied', () => {
  assert.equal(isContractComplete({ totalObligations: 24, satisfiedObligations: 24 }), true);
});

test('isContractComplete is false when some obligations remain', () => {
  assert.equal(isContractComplete({ totalObligations: 24, satisfiedObligations: 20 }), false);
});

test('isContractComplete is false with zero obligations', () => {
  assert.equal(isContractComplete({ totalObligations: 0, satisfiedObligations: 0 }), false);
});

// --- getBenchmarkCtaLabel ---

test('benchmark CTA is never "Re-benchmark" when contract is not complete', () => {
  const label = getBenchmarkCtaLabel({ hasBenchmark: true, contractComplete: false });
  assert.ok(!label.toLowerCase().includes('re-benchmark'));
});

test('benchmark CTA is "Re-benchmark" only when contractComplete AND hasBenchmark', () => {
  const label = getBenchmarkCtaLabel({ hasBenchmark: true, contractComplete: true });
  assert.ok(label.toLowerCase().includes('re-benchmark'));
});

test('benchmark CTA is "Take benchmark" when no benchmark exists', () => {
  const label = getBenchmarkCtaLabel({ hasBenchmark: false, contractComplete: false });
  assert.ok(label.toLowerCase().includes('take benchmark'));
});

test('no re-benchmark even after contract complete if no benchmark exists', () => {
  const label = getBenchmarkCtaLabel({ hasBenchmark: false, contractComplete: true });
  assert.ok(!label.toLowerCase().includes('re-benchmark'));
});

