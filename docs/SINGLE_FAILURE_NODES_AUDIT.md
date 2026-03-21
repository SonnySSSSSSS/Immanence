# Single-Failure Nodes Audit

Date: 2026-03-05  
Scope: runtime-proof audit for high-risk nodes where one defect can block training.

Policy target for all nodes:

`if system state invalid -> still allow practice start (safe fallback + warning/log)`

---

## Node 1: PracticeSection launch logic

- failing behavior:
  stale or malformed `practiceLaunchContext` can drive wrong practice config or prevent intended launch handoff.
- source of truth:
  `src/state/uiStore.js` (`practiceLaunchContext`, `setPracticeLaunchContext`, `clearPracticeLaunchContext`) and `src/components/PracticeSection.jsx` launch-context consume effect.
- concrete failing case:
  input/state:
  `practiceLaunchContext = { source: "dailySchedule", practiceId: "unknown_mode", durationMin: "abc", overrides: "bad-shape" }`
  actual output:
  context is consumed in `PracticeSection` effect; invalid fields can produce partial patching and unexpected run setup.
  expected output:
  invalid context is discarded, launch context cleared, and user lands in safe default practice menu (`breath`, default duration) without blockage.
- correction boundary:
  predicate + transformation boundary at context normalization before applying overrides in `PracticeSection` consume effect.
- fail-safe predicate:
  if `practiceLaunchContext` is missing required shape or references unknown practice id, then `clearPracticeLaunchContext()` and continue with default launch (`practiceId='breath'`, default duration, no overrides).

---

## Node 2: Benchmark gating

- failing behavior:
  benchmark state corruption can hard-block path activation and therefore block training entry.
- source of truth:
  `src/utils/pathActivationGuards.js` (`validateBenchmarkPrerequisite`) called by `src/state/navigationStore.js` (`beginPath`) and path activation flows.
- concrete failing case:
  input/state:
  `path.showBreathBenchmark = true`, `hasBenchmark = false` because benchmark snapshot for run was lost/corrupt.
  actual output:
  `validateBenchmarkPrerequisite` returns `{ ok: false }` and `beginPath` exits early.
  expected output:
  user can still begin training in safe mode with benchmark status marked unknown and non-blocking warning.
- correction boundary:
  gating predicate boundary in benchmark prerequisite validation.
- fail-safe predicate:
  if benchmark state is missing/corrupt/unreadable, return `ok: true` with `warning: benchmark_unknown` and allow path/practice start.

---

## Node 3: Curriculum day calculation

- failing behavior:
  invalid or malformed `curriculumStartDate` can produce invalid day-number outputs and destabilize schedule/day-dependent UI.
- source of truth:
  `src/state/curriculumStore.js` (`getCurrentDayNumber`).
- concrete failing case:
  input/state:
  `curriculumStartDate = "not-a-date"`.
  actual output:
  `new Date("not-a-date")` yields invalid date; downstream math can produce non-finite day values and break day lookups.
  expected output:
  day resolution safely falls back to day `1`, and training remains startable.
- correction boundary:
  transformation boundary in day-number derivation (`startDate -> elapsedDays -> currentDay`).
- fail-safe predicate:
  if parsed start date or elapsed day math is non-finite, return day `1` (or nearest valid day), never block practice entry.

---

## Node 4: runId session logic

- failing behavior:
  missing/invalid `runId` can break run-scoped reporting and can block/restart path flows in environments without full crypto APIs.
- source of truth:
  `src/state/navigationStore.js` (`beginPath`, `restartPath`) and `src/services/sessionRecorder.js` path-context assertions.
- concrete failing case:
  input/state:
  runtime where `crypto.randomUUID` is unavailable; `restartPath()` calls `crypto.randomUUID()` directly.
  actual output:
  `restartPath` can throw, preventing path restart and blocking expected next training run.
  expected output:
  restart still succeeds using deterministic fallback run id and keeps training unblocked.
- correction boundary:
  persistence boundary where run identity is created and propagated (`navigationStore -> sessionRecorder pathContext`).
- fail-safe predicate:
  if UUID generation fails or yields invalid id, create fallback run id (`run_<timestamp>_<random>`) and continue start/restart flow.

---

## Node 5: Navigation contract validation

- failing behavior:
  invalid path contract data can hard-fail activation checks and block all starts for the affected path.
- source of truth:
  `src/utils/pathContract.js` (`validatePathActivationSelections`) and `src/utils/scheduleSelectionConstraints.js` (`validateSelectedTimes`), called from `src/state/navigationStore.js` (`beginPath`) and `src/components/PathOverviewPanel.jsx`.
- concrete failing case:
  input/state:
  path contract resolves to `requiredLegsPerDay = 3`, `maxLegsPerDay = 2` (inconsistent contract payload/migration state).
  actual output:
  `validatePathActivationSelections` returns `{ ok: false, error: "Path contract is invalid..." }`; begin is blocked.
  expected output:
  contract is normalized to safe defaults and training start remains available.
- correction boundary:
  predicate + contract-normalization boundary in path activation validation.
- fail-safe predicate:
  if contract invariants fail (`required > max`, invalid counts), clamp/normalize to safe min-max schedule and allow start with warning.

---

## Implementation Predicates (for Phase 4B)

| Node | Exact predicate to implement |
|---|---|
| PracticeSection launch logic | `if !ctx || invalidPracticeId(ctx.practiceId) || invalidOverridesShape(ctx) -> clear ctx; use default launch` |
| Benchmark gating | `if benchmarkStateUnreadable || benchmarkMissingDueToCorruption -> ok + warning` |
| Curriculum day calculation | `if !isFinite(parsedStartMs) || !isFinite(daysDiff) -> return 1` |
| runId session logic | `if !isString(runId) || runId.length===0 -> runId = fallbackRunId()` |
| Navigation contract validation | `if contractInvariantBroken -> normalizeContractSafe(contract) and continue` |

---

## Verification Notes

- This file is the runtime-proof gate for Phase 4A only.
- No behavior changes are included in this phase.
- Implementation should proceed as atomic fixes in Phase 4B+ after human pass/fail.
