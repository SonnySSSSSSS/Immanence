# 1. Executive Summary
TypeScript has real but targeted leverage in this repo. The strongest leverage is in non-JSX domain logic where runtime contracts are duplicated across modules: reporting selectors/aggregators, curriculum contract math, runtime/config validation, and persisted state normalization.

A broad migration would add drag right now because the highest-churn surfaces are very large JSX modules ([src/components/PracticeSection.jsx](src/components/PracticeSection.jsx), [src/components/HomeHub.jsx](src/components/HomeHub.jsx), [src/App.jsx](src/App.jsx)) and major stores with active migration logic ([src/state/navigationStore.js](src/state/navigationStore.js), [src/state/progressStore.js](src/state/progressStore.js)).

Recommendation: pursue targeted // @ts-check plus selective .ts conversion for stable, pure modules first.

# 2. Current Typing Posture
- Repo posture: JavaScript-first, no active TypeScript source in main app code.
- Strong JSDoc presence in many logic modules (reporting, infographics, utilities, services), but no compiler-enforced contracts.
- Runtime guards are common (shape checks, fallback defaults, migration sanitizers), especially in persisted Zustand stores.
- Multiple modules encode the same business contracts with string literals and implicit object shapes.
- Worker/frontend boundary is currently low impact for TS planning because [worker/src](worker/src) is empty.

# 3. Repo-Specific Risk Categories TS Could Help With
1. Persisted state shape drift
- Evidence: repeated migrate/partialize/merge normalization in [src/state/navigationStore.js](src/state/navigationStore.js), [src/state/progressStore.js](src/state/progressStore.js), [src/state/applicationStore.js](src/state/applicationStore.js), [src/state/wisdomStore.js](src/state/wisdomStore.js), [src/state/lunarStore.js](src/state/lunarStore.js).
- TS value: typed persisted envelopes and migration return types reduce accidental omission/field rename drift.

2. Literal union drift and stringly typed state
- Evidence: posture/mode strings in [src/state/userModeStore.js](src/state/userModeStore.js), dashboard policy ranges/scopes in [src/reporting/tilePolicy.js](src/reporting/tilePolicy.js), completion statuses in [src/reporting/aggregators.js](src/reporting/aggregators.js).
- TS value: literal unions for scope/range/completion/access posture prevent invalid values from spreading.

3. Cross-module summary/result object shape drift
- Evidence: reporting outputs assembled in [src/reporting/dashboardProjection.js](src/reporting/dashboardProjection.js) and consumed via policy/selector pathways; path report envelope and report objects in [src/reporting/pathReport.js](src/reporting/pathReport.js).
- TS value: exported result types catch missing/renamed fields during refactors.

4. Contract mismatch across parallel implementations
- Evidence: time-window status logic differs between [src/services/sessionRecorder.js](src/services/sessionRecorder.js) (red threshold <= 60) and [src/services/infographics/contractObligations.js](src/services/infographics/contractObligations.js) (red threshold <= 30).
- TS value: shared typed contract model plus centralized constants/types reduce semantic divergence.

5. Nullable nested property access and defensive fallback sprawl
- Evidence: deep optional access and broad fallback handling in [src/state/offlineFirstUserStateSync.js](src/state/offlineFirstUserStateSync.js), [src/config/runtimeEnv.js](src/config/runtimeEnv.js), [src/utils/runtimeChecks.js](src/utils/runtimeChecks.js).
- TS value: explicit nullable types and narrowed checks improve correctness and readability.

6. Duplicated or parallel state contracts
- Evidence: legacy/current dual tracks such as sessions and sessionsV2 in [src/state/progressStore.js](src/state/progressStore.js), access posture and user mode mapping in [src/state/userModeStore.js](src/state/userModeStore.js), schedule compatibility paths in [src/state/navigationScheduleCompat.js](src/state/navigationScheduleCompat.js).
- TS value: discriminated unions and canonical interfaces make transitional states explicit.

# 4. Repo-Specific Areas Where TS Would Likely Not Pay Off Yet
1. Large, JSX-heavy, high-churn orchestration surfaces
- [src/components/PracticeSection.jsx](src/components/PracticeSection.jsx) (2555 lines)
- [src/components/HomeHub.jsx](src/components/HomeHub.jsx) (1737 lines)
- [src/App.jsx](src/App.jsx) (1616 lines)
- Why low payoff now: high UI churn plus dense side effects means conversion cost is high and mostly unrelated to the contract drift risks above.

2. Protected 3D/avatar surfaces with tight visual/runtime coupling
- [src/components/Avatar.jsx](src/components/Avatar.jsx)
- [src/components/MoonOrbit.jsx](src/components/MoonOrbit.jsx)
- [src/components/MoonGlowLayer.jsx](src/components/MoonGlowLayer.jsx)
- Why low payoff now: policy-protected files and sensitive rendering behavior; typing gains are secondary to visual stability risk.

3. Large persisted stores still evolving behaviorally
- [src/state/navigationStore.js](src/state/navigationStore.js)
- [src/state/progressStore.js](src/state/progressStore.js)
- [src/state/offlineFirstUserStateSync.js](src/state/offlineFirstUserStateSync.js)
- Why low payoff now: high migration and compatibility complexity; immediate conversion could stall active feature work.

# 5. Candidate Files for `// @ts-check` First
| Path | Module role | Why good candidate | Risk category improved | Estimated migration friction | Recommended first step |
|---|---|---|---|---|---|
| [src/reporting/selectSessions.js](src/reporting/selectSessions.js) | Session selection/filtering gateway | Central filter contract (scope/range/completion/runId) with synthetic honor session shaping | Literal union drift, result shape drift | Low | add // @ts-check |
| [src/reporting/dashboardProjection.js](src/reporting/dashboardProjection.js) | Dashboard metric projection builder | Produces stable summary objects consumed by UI and policy layers | Summary/result object drift | Low | add // @ts-check |
| [src/reporting/aggregators.js](src/reporting/aggregators.js) | Core reducers for metrics | Handles completion normalization and aggregation invariants | Literal union drift, status drift | Low | add // @ts-check |
| [src/reporting/familyKeyMap.js](src/reporting/familyKeyMap.js) | Canonical family mapping | String mapping table with multi-tier fallback resolution | Stringly-typed state drift | Low | add // @ts-check |
| [src/reporting/tilePolicy.js](src/reporting/tilePolicy.js) | Dashboard policy resolver | Encodes posture/scope/range decisions via literals | Literal union drift | Low | add // @ts-check |
| [src/utils/pathContract.js](src/utils/pathContract.js) | Path contract normalization/validation | Core contract object with optional numeric invariants and error returns | Config/runtime contract mismatch | Medium | add // @ts-check |
| [src/utils/scheduleSelectionConstraints.js](src/utils/scheduleSelectionConstraints.js) | Time-slot constraint normalization | Constraint object merging and validation paths | Config/runtime contract mismatch | Medium | add // @ts-check |
| [src/services/infographics/contractObligations.js](src/services/infographics/contractObligations.js) | Obligation and adherence summary model | High-value contract module with many optional inputs and derived outputs | Cross-module contract drift | Medium | add // @ts-check |
| [src/services/sessionRecorder.js](src/services/sessionRecorder.js) | Authoritative session persistence pipeline | Builds persisted session snapshots and path context contract | Cross-module contract drift, nullable access | Medium | add // @ts-check |
| [src/state/navigationScheduleCompat.js](src/state/navigationScheduleCompat.js) | Legacy schedule compatibility normalization | Handles polymorphic legacy formats and canonical schedule shape | Persisted shape drift | Medium | add // @ts-check |

# 6. Candidate Files for Early `.ts` Conversion
| Path | Module role | Why good candidate | Risk category improved | Estimated migration friction | Recommended first step |
|---|---|---|---|---|---|
| [src/utils/runtimeFailure.js](src/utils/runtimeFailure.js) | Runtime error normalization primitives | Small, pure, no JSX, clear object contracts | Config/runtime contract mismatch | Low | convert to .ts |
| [src/utils/runtimeChecks.js](src/utils/runtimeChecks.js) | Runtime check publication and auth/startup snapshots | Small pure module with well-bounded return shapes | Cross-module result shape drift | Low | convert to .ts |
| [src/config/runtimeEnv.js](src/config/runtimeEnv.js) | Runtime env parsing and validation | Central env contract surface; strong benefit from typed env model | Config/runtime contract mismatch | Low | convert to .ts |
| [src/reporting/tilePolicy.js](src/reporting/tilePolicy.js) | Policy-level union resolver | Very small pure function, ideal literal-union enforcement target | Literal union drift | Low | convert to .ts |
| [src/reporting/aggregators.js](src/reporting/aggregators.js) | Core reporting reducers | Pure deterministic reducers with stable input/output contracts | Summary/result shape drift | Low | convert to .ts |

# 7. Files/Subsystems to Defer
| Path | Why it should wait | Churn/risk reason |
|---|---|---|
| [src/components/PracticeSection.jsx](src/components/PracticeSection.jsx) | Very large orchestration component with many local states and effects | Active behavior churn and high JSX/event coupling make conversion expensive and brittle now |
| [src/components/HomeHub.jsx](src/components/HomeHub.jsx) | High fanout hub behavior with curriculum/navigation interactions | Frequent iteration surface; type conversion cost likely exceeds immediate safety gain |
| [src/App.jsx](src/App.jsx) | App shell routing/gating plus auth, preload, probes, and sync orchestration | Extremely high fanout; broad annotations needed before meaningful gains |
| [src/state/navigationStore.js](src/state/navigationStore.js) | Large persisted state + migration + compatibility logic | Current active evolution and migration complexity imply high break risk |
| [src/state/progressStore.js](src/state/progressStore.js) | Legacy/current session model coexistence and migration utilities | Transitional data model; conversion now may lock unstable contracts too early |
| [src/state/offlineFirstUserStateSync.js](src/state/offlineFirstUserStateSync.js) | Large sync engine with network/storage side effects | High runtime branching and side-effect density; better after contracts above are typed |
| [src/components/Avatar.jsx](src/components/Avatar.jsx) | Protected visual subsystem | Protected surface and visual sensitivity make this a poor first TS target |
| [src/components/MoonOrbit.jsx](src/components/MoonOrbit.jsx) | Protected visual subsystem | Protected surface with rendering behavior risk |
| [src/components/MoonGlowLayer.jsx](src/components/MoonGlowLayer.jsx) | Protected visual subsystem | Protected surface with rendering behavior risk |

# 8. Actual Bug Patterns Observed in This Repo
1. Parallel logic mismatch for the same business rule
- [src/services/sessionRecorder.js](src/services/sessionRecorder.js): getDeltaStatus marks red up to 60 minutes.
- [src/services/infographics/contractObligations.js](src/services/infographics/contractObligations.js): getDeltaStatus marks red up to 30 minutes.
- Impact: inconsistent adherence outcomes between persisted snapshot logic and reporting/rail logic.

2. Legacy completion token normalization indicates active contract drift
- [src/reporting/aggregators.js](src/reporting/aggregators.js) normalizes early_exit and earlyExit into partial.
- Impact: multiple historical completion encodings remain in circulation.

3. Explicit legacy regression guard in core store
- [src/state/progressStore.js](src/state/progressStore.js) contains a DEV assertion checking for legacy sessions field regressions.
- Impact: coexistence/transition risk is active enough to require runtime guardrails.

4. Backward-compatibility branching in schedule normalization
- [src/state/navigationScheduleCompat.js](src/state/navigationScheduleCompat.js) accepts multiple day formats and fallback pathways.
- Impact: legacy format tolerance increases shape ambiguity and refactor risk.

5. Dual contract mapping for access posture and user mode
- [src/state/userModeStore.js](src/state/userModeStore.js) maps and persists both concepts with fallback compatibility.
- Impact: string-value drift risk across app-shell and dashboard policy logic.

6. Reporting pipeline synthesizes alternate session objects
- [src/reporting/selectSessions.js](src/reporting/selectSessions.js) creates synthetic honor sessions with partial fields.
- Impact: session shape is not single-source unless explicitly typed.

# 9. Recommended Adoption Path
1. Start with contract-bearing pure logic modules via // @ts-check (no conversion): reporting selectors/projections, contract utilities, runtime env/check modules.
2. Convert only very small, pure utility modules to .ts where immediate union/shape safety is highest and friction lowest.
3. Use typed exports from those modules as the boundary contracts consumed by large JSX/store surfaces, without converting those large surfaces yet.
4. Re-evaluate large store conversion only after contract modules stabilize and drift bugs drop.

Why this path is minimal and meaningful:
- It improves refactor safety where drift already exists.
- It avoids broad tooling/churn costs in high-volatility UI files.
- It creates shared contract definitions before touching heavy orchestration layers.

# 10. Exact Files for Phase TS-1
Phase TS-1 intent: contract safety fast, lowest disruption. Prefer // @ts-check first.

- [src/reporting/selectSessions.js](src/reporting/selectSessions.js) — add // @ts-check
- [src/reporting/dashboardProjection.js](src/reporting/dashboardProjection.js) — add // @ts-check
- [src/reporting/aggregators.js](src/reporting/aggregators.js) — add // @ts-check
- [src/reporting/familyKeyMap.js](src/reporting/familyKeyMap.js) — add // @ts-check
- [src/reporting/tilePolicy.js](src/reporting/tilePolicy.js) — add // @ts-check
- [src/utils/pathContract.js](src/utils/pathContract.js) — add // @ts-check
- [src/utils/scheduleSelectionConstraints.js](src/utils/scheduleSelectionConstraints.js) — add // @ts-check
- [src/services/infographics/contractObligations.js](src/services/infographics/contractObligations.js) — add // @ts-check
- [src/services/sessionRecorder.js](src/services/sessionRecorder.js) — add // @ts-check
- [src/state/navigationScheduleCompat.js](src/state/navigationScheduleCompat.js) — add // @ts-check

# 11. Exact Files for Phase TS-2
Phase TS-2 intent: selective .ts conversion of small, stable, high-leverage modules.

- [src/utils/runtimeFailure.js](src/utils/runtimeFailure.js) — convert to .ts
- [src/utils/runtimeChecks.js](src/utils/runtimeChecks.js) — convert to .ts
- [src/config/runtimeEnv.js](src/config/runtimeEnv.js) — convert to .ts
- [src/reporting/tilePolicy.js](src/reporting/tilePolicy.js) — convert to .ts
- [src/reporting/aggregators.js](src/reporting/aggregators.js) — convert to .ts

Optional TS-2b only after TS-2 proves stable:
- [src/reporting/selectSessions.js](src/reporting/selectSessions.js) — convert to .ts
- [src/reporting/dashboardProjection.js](src/reporting/dashboardProjection.js) — convert to .ts

# 12. Stop Gates / Cases Where TS Should Wait
Pause TS rollout if any condition below is true:

1. Volatility gate
- If app shell and home/practice surfaces are in active weekly behavior churn (especially [src/App.jsx](src/App.jsx), [src/components/HomeHub.jsx](src/components/HomeHub.jsx), [src/components/PracticeSection.jsx](src/components/PracticeSection.jsx)), do not expand beyond TS-1 candidates.

2. Canonical contract ambiguity gate
- If session/adherence semantics are still split between modules (for example current threshold mismatch between [src/services/sessionRecorder.js](src/services/sessionRecorder.js) and [src/services/infographics/contractObligations.js](src/services/infographics/contractObligations.js)), resolve canonical behavior first before broader conversion.

3. Tooling drag gate
- If useful safety cannot be achieved without broad config/tooling work, keep scope at targeted // @ts-check candidates and stop there.

4. No-low-churn-candidate gate
- If the next proposed files are primarily high-churn JSX or migration-heavy stores, defer expansion and keep typed boundaries in pure modules only.

Direct recommendation: Pursue targeted `// @ts-check` plus selective `.ts` conversion.
