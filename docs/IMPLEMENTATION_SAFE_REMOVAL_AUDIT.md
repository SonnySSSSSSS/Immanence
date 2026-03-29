# 1. Executive Summary

This report revalidates the earlier audit from code only. No product code was edited. Documentation was not used as source of truth.

The main implementation-safety result is narrower than the earlier audit:

- Safe Phase 1 removal candidates, based on importer proof, are:
  - `src/components/ApplicationSelectionModal.jsx`
  - `src/components/ModeDetail.jsx`
  - `src/components/dev/LLMTestPanel.jsx`
  - `src/state/historyStore.js`
- `src/state/trainingStore.js` is no longer a safe Phase 1 deletion candidate because it still owns persisted key `immanence-training`. Even though no live importer was found, it has persisted-state impact and therefore fails the stricter Phase 1 bar.

Key code-backed conclusions:

- Student/explorer mode is a live protected runtime surface. It is implemented through `src/state/userModeStore.js` and consumed by `src/App.jsx`, `src/components/HomeHub.jsx`, `src/components/SideNavigation.jsx`, `src/components/DailyPracticeCard.jsx`, `src/components/PracticeSection.jsx`, `src/reporting/tilePolicy.js`, `src/components/homeHubLogic.js`, offline-first sync, and smoke tests.
- The protected persisted contract surfaces are:
  - `immanence-user-mode`
  - `modeByUserId`
  - `hasCompletedAccessChoiceByUserId`
  - `accessPostureByUserId`
- Four Modes is no longer on the live `ApplicationSection` shell path, but it is still structurally live through archive/reporting and persisted stores.
- LLM invocation is effectively dev-only today. Repo-wide caller search found only `src/components/dev/LLMTestPanel.jsx` calling `src/services/llmService.js`.
- No `Ollama` or `ollama` references were found in the repo.

Why this matters for later implementation:

- A later removal task can safely start only from files proven to have:
  - zero live importers
  - no dynamic import / lazy-load evidence
  - no persisted-state impact
  - no unresolved adjacency risk to student/explorer mode
- Anything below that bar is either later-phase work or a stop gate.

# 2. TypeScript Risk/Benefit Assessment

## Current codebase posture

Evidence from the repo:

- Main app shell is still JS/JSX-only.
- `eslint.config.js` targets `**/*.{js,jsx}` only.
- There is no root app `tsconfig.json`.
- TypeScript already exists in these isolated areas:
  - `tests/playwright.config.ts`
  - `tests/smoke/*.spec.ts`
  - `tools/mcp-comfyui-proxy/src/*.ts`
  - `public/polygon shape/src/*.tsx`
- The repo already carries `@types/react` and `@types/react-dom` in `package.json`.
- Many logic files already use JSDoc-style comments, but the app is not running `// @ts-check` or root `checkJs`.

## Actual bug patterns TS would likely catch here

TypeScript or `// @ts-check` would be most useful against these repo-specific patterns:

- Persisted object-shape drift:
  - `src/state/userModeStore.js`
  - `src/state/chainStore.js`
  - `src/state/modeTrainingStore.js`
  - `src/state/settingsStore.js`
- Literal union drift and invalid state strings:
  - `student` / `explorer`
  - `guided` / `full`
  - `mirror` / `prism` / `wave` / `sword`
- Cross-module summary shape mismatch:
  - `src/components/sessionHistoryViewLogic.js`
  - `src/components/SessionHistoryView.jsx`
  - `src/components/tracking/reports/ReportsPanel.jsx`
  - `src/components/tracking/infographics/ApplicationDashboardHeader.jsx`
- Nullable nested access and implicit optional contracts:
  - `activePath`
  - `practiceLaunchContext`
  - `selfKnowledgeProfile.bigFive`
  - runtime env values in `src/config/runtimeEnv.js`
- Runtime contract mismatch between frontend LLM client and worker:
  - `src/services/llmService.js`
  - `src/config/runtimeEnv.js`
  - `src/utils/runtimeChecks.js`
  - `src/utils/runtimeFailure.js`
  - `worker/src/index.js`

## Why not full TS now

A full migration now would create more churn than risk reduction because the highest-fanout files are also the least stable and most JSX-heavy:

- `src/App.jsx`
- `src/components/HomeHub.jsx`
- `src/components/PracticeSection.jsx`
- `src/components/DailyPracticeCard.jsx`
- `src/components/SessionHistoryView.jsx`
- `src/components/SigilSealingArea.jsx`

Those files combine:

- heavy JSX
- many store selectors
- implicit object shapes
- active product churn
- cross-store coupling

Converting those first would force large annotation work before the lower-level contracts are stabilized.

## Why `// @ts-check` + JSDoc first

For this repo, `// @ts-check` + JSDoc is the best first move because:

- the repo already uses JSDoc heavily in logic modules
- it catches shape and union mistakes without forcing JSX conversion
- it reduces risk in low-churn modules before touching the shell
- it fits the current tooling posture better than immediate `.tsx` conversion

## Strongest arguments for TS here

- Many persisted contracts.
- Many literal state unions.
- Several pure selector/summary/config modules with implicit shapes.
- Existing TS islands already prove the toolchain can coexist with JS.

## Strongest arguments against full migration now

- No root app TS config today.
- No TS-aware lint path for app sources today.
- The most important runtime files are also the least conversion-friendly.
- Large UI files would produce migration drag before yielding proportionate safety gains.

# 3. TypeScript Migration Recommendation

Recommended path:

1. Add root TypeScript tooling only.
2. Turn on `// @ts-check` and JSDoc in low-churn JS modules first.
3. Convert pure or near-pure modules to `.ts` after those checks are clean.
4. Delay large JSX shell components until after LLM/Four Modes cleanup stabilizes contracts.

Best first candidates:

- `src/state/userModeStore.js`
- `src/config/runtimeEnv.js`
- `src/utils/runtimeChecks.js`
- `src/utils/runtimeFailure.js`
- `src/config/appMeta.js`
- `src/reporting/tilePolicy.js`
- `src/components/homeHubLogic.js`
- `src/state/offlineFirstUserStateKeys.js`
- `src/data/fourModes.js`
- `src/state/practiceConfig.js`

Poor first candidates:

- `src/App.jsx`
- `src/components/HomeHub.jsx`
- `src/components/PracticeSection.jsx`
- `src/components/DailyPracticeCard.jsx`
- `src/components/SessionHistoryView.jsx`
- `src/components/SigilSealingArea.jsx`

Minimum viable TS adoption path for this repo:

- Root `tsconfig.json` with `allowJs`, `checkJs`, `noEmit`
- `tsc --noEmit` in CI or local verification
- JSDoc typedefs for persisted payloads and selector inputs
- selective `.ts` conversion for config/runtime/pure logic before UI shell conversion

# 4. Inventory: LLM References

| exact repo-relative path | symbol/component/store/function | short description | classification | removal difficulty | risk if removed blindly |
|---|---|---|---|---|---|
| `.env.example` | `VITE_LLM_PROXY_URL` | Declares frontend env var for proxy URL | dev-only tooling | low | Env/setup docs drift |
| `src/config/runtimeEnv.js` | `runtimeEnv.llmProxyUrl`, `getLlmRuntimeVerification`, `requireLlmProxyUrl` | Frontend runtime config and guard for LLM calls | business-logic coupling | medium | Breaks runtime LLM config checks if client code remains |
| `src/utils/runtimeChecks.js` | `getLlmConfigCheck`, `createLlmVerification`, `publishRuntimeCheck` | Publishes LLM runtime verification state | business-logic coupling | medium | Leaves runtime diagnostics inconsistent |
| `src/utils/runtimeFailure.js` | `RuntimeFailureCode.LLM_*` | Defines LLM-specific failure codes and normalization | business-logic coupling | low | Callers break or drift if partially removed |
| `src/config/appMeta.js` | `LLM_CLIENT_VERSION` | Centralized outbound header version for LLM requests | text-only mention, business-logic coupling | low | Header assembly breaks in `llmService` |
| `src/services/llmService.js` | `sendToLLM`, `sendToLLMForJSON`, `checkLLMAvailability`, `validateMirrorEntry`, `evaluatePrismInterpretations`, `evaluateWaveCoherence`, `validateSwordCommitment` | Central LLM client and Four Modes prompt wrappers | business-logic coupling | medium | Breaks all current and future LLM callers |
| `src/components/dev/LLMTestPanel.jsx` | `LLMTestPanel` | Dev-only UI for LLM connection and Mirror validation | dev-only tooling, UI-visible behavior | low | Very low current runtime risk if truly unmounted |
| `src/state/settingsStore.js` | `llmModel`, `setLlmModel` | Persists LLM model preference in `immanence-settings` | persisted state / localStorage coupling | low | Leaves stale persisted subfield without migration |
| `worker/src/index.js` | worker `fetch` handler | Cloudflare Worker proxy to Gemini with CORS and rate limits | dev-only tooling, business-logic coupling | medium | Frontend LLM calls fail if client remains |
| `worker/wrangler.toml` | worker deployment config | Configures `immanence-llm-proxy` worker and KV binding | dev-only tooling | low | Deployment/config drift |

Ollama audit result:

- No `Ollama` references found.
- No `ollama` references found.

Current caller proof for LLM invocation:

- Repo-wide caller search for `sendToLLM(`, `checkLLMAvailability(`, `validateMirrorEntry(`, `evaluatePrismInterpretations(`, `evaluateWaveCoherence(`, and `validateSwordCommitment(` found only:
  - `src/components/dev/LLMTestPanel.jsx`

# 5. Inventory: Four Modes References

| exact repo-relative path | symbol/component/store/function | short description | classification | removal difficulty | risk if removed blindly |
|---|---|---|---|---|---|
| `src/data/fourModes.js` | `FOUR_MODES`, `FOUR_MODES_BY_ID`, `MODE_SEQUENCE`, `CHAIN_STATES`, `ACTION_TYPES` | Canonical Four Modes metadata and enums | business-logic coupling | high | Breaks stores and practice components |
| `src/state/chainStore.js` | `useChainStore` | Persists chain lifecycle and completed chain stats in `immanence-chains` | persisted state / localStorage coupling, business-logic coupling | high | Breaks chain progression, archive, reporting |
| `src/state/modeTrainingStore.js` | `useModeTrainingStore`, `PRACTICE_STATES` | Persists mode training sessions/stats in `immanence-mode-training` | persisted state / localStorage coupling, business-logic coupling | high | Breaks reports/archive and training flows |
| `src/state/practiceConfig.js` | `PRACTICE_DEFINITIONS`, `MODE_CHECK_OPTIONS` | Shared Four Modes practice configuration | business-logic coupling | medium | Breaks training orchestration and practice UIs |
| `src/components/Application/ModeTraining.jsx` | `ModeTraining` | Orchestrates mode sessions, transitions, and Harmony | UI-visible behavior, business-logic coupling | high | Breaks any active Four Modes entry flow |
| `src/components/Application/practices/MirrorObservation.jsx` | `MirrorObservation` | Live chain practice for Mirror observation and locking | UI-visible behavior, business-logic coupling | high | Breaks chain start and Mirror data capture |
| `src/components/Application/practices/PrismSeparation.jsx` | `PrismSeparation` | Live chain practice for evidence-vs-interpretation classification | UI-visible behavior, business-logic coupling | high | Breaks Prism progression |
| `src/components/Application/practices/WaveRide.jsx` | `WaveRide` | Live chain practice for Wave intensity/capacity flow | UI-visible behavior, business-logic coupling | high | Breaks Wave progression |
| `src/components/Application/practices/SwordCommitment.jsx` | `SwordCommitment` | Live chain practice for final commitment and chain completion | UI-visible behavior, business-logic coupling | high | Breaks chain completion |
| `src/components/Application/practices/MirrorStillness.jsx` | `MirrorStillness` | Additional mode-training practice still tied to `modeTrainingStore` | business-logic coupling | medium | Partial cleanup leaves dangling practice coverage |
| `src/components/Application/practices/PrismReframing.jsx` | `PrismReframing` | Additional mode-training practice still tied to `modeTrainingStore` | business-logic coupling | medium | Same risk as above |
| `src/components/Application/practices/ResonatorChambering.jsx` | `ResonatorChambering` | Additional mode-training practice still tied to `modeTrainingStore` | business-logic coupling | medium | Same risk as above |
| `src/components/Application/practices/SwordCompression.jsx` | `SwordCompression` | Additional mode-training practice still tied to `modeTrainingStore` | business-logic coupling | medium | Same risk as above |
| `src/components/Application/PatternReview.jsx` | `PatternReview` | Renders aggregate chain analytics from `chainStore` | UI-visible behavior | medium | Breaks pattern review if still reachable |
| `src/components/ModeDetail.jsx` | `ModeDetail` | Standalone Four Modes detail page and entry into `ModeTraining` | UI-visible behavior | low | Low only if importer proof remains zero |
| `src/components/ApplicationSelectionModal.jsx` | `ApplicationSelectionModal` | Standalone modal choosing Tracking vs Four Modes | UI-visible behavior | low | Low only if importer proof remains zero |
| `src/state/trainingStore.js` | `useTrainingStore` | Legacy duplicate mode-training store persisting `immanence-training` | persisted state / localStorage coupling, business-logic coupling | medium | Deleting it without a later cleanup plan leaves persisted residue |
| `src/state/historyStore.js` | `useHistoryStore` | Legacy undo/redo history store for modes | business-logic coupling | low | Low only if importer proof remains zero |
| `src/components/SessionHistoryView.jsx` | `useModeTrainingStore`, `useChainStore` | Archive modal still consumes Four Modes stats and chains | UI-visible behavior, business-logic coupling | high | Removing stores first will break archive/reporting |
| `src/components/sessionHistoryViewLogic.js` | `buildApplicationSummary` | Forwards Four Modes summary data into archive summary payload | business-logic coupling | medium | Leaves broken summary shape if consumers stay |
| `src/components/tracking/infographics/ApplicationDashboardHeader.jsx` | `ApplicationDashboardHeader` | Displays Mode Training, Chains, and per-mode counts | UI-visible behavior | medium | Application header breaks if Four Modes stats disappear first |
| `src/components/tracking/reports/ReportsPanel.jsx` | `applicationData.modeStats`, `chainStats`, `completedChainsCount` | Reports panel still consumes Four Modes state | UI-visible behavior, business-logic coupling | high | Reports break if stores are removed first |

# 6. Inventory: Student/Explorer Mode References (protective audit only)

| exact repo-relative path | symbol/component/store/function | short description | classification | removal difficulty | risk if removed blindly |
|---|---|---|---|---|---|
| `src/state/userModeStore.js` | `useUserModeStore`, `setActiveUserId`, `setAccessPosture`, `setUserMode`, `resetUserMode`, `hasChosenUserMode` | Canonical persistence and resolution of student/explorer and guided/full | persisted state / localStorage coupling, routing / gating coupling | high | Breaks boot, gating, per-user mode contract |
| `src/App.jsx` | `handleSectionSelect`, `needsSetup`, `practiceLaunchContext` gates | Guided/student route gating for `navigation` and `practice` | routing / gating coupling, onboarding coupling | high | Student shell can route incorrectly or get stuck |
| `src/components/HomeHub.jsx` | section button rendering, posture pill | Student hides Wisdom/Application; guided/full toggle is exposed here | UI-visible behavior, routing / gating coupling | high | Student shell behavior changes immediately |
| `src/components/SideNavigation.jsx` | `if (userMode === 'student') return null` | Removes side navigation for student | UI-visible behavior, routing / gating coupling | medium | Student gets wrong nav chrome |
| `src/components/DailyPracticeCard.jsx` | `accessPosture`, `practiceLaunchContext`, `shouldBypassScheduleGateForExplorerBreath` | Guided/full affects launch and schedule bypass logic | routing / gating coupling, selector/computed-value coupling, UI-visible behavior | high | Guided scheduling and explorer bypass can fail |
| `src/components/PracticeSection.jsx` | `allowedPracticeIds` derivation | Guided users are restricted to active-path allowed practices | routing / gating coupling, selector/computed-value coupling | high | Guided users can reach unrestricted practices |
| `src/reporting/tilePolicy.js` | `getHomeDashboardPolicy` | Dashboard policy changes by access posture | selector/computed-value coupling | medium | Dashboard scope/range silently changes |
| `src/components/homeHubLogic.js` | `getHomeHubDashboardState` | Applies posture-aware dashboard policy to HomeHub | selector/computed-value coupling | medium | Hub tiles drift from intended student/explorer experience |
| `src/state/offlineFirstUserStateKeys.js` | `OFFLINE_FIRST_USER_STATE_KEYS` | Protects `immanence-user-mode` in offline-first bundle | persisted state / localStorage coupling | medium | Sync/apply can drop user mode state |
| `src/state/offlineFirstUserStateSync.js` | `bestEffortRehydrateAfterApply()` | Rehydrates `userModeStore` after synced state apply | persisted state / localStorage coupling | medium | Post-sync shell can resolve with stale mode data |
| `tests/smoke/critical-flows.spec.ts` | `forceAuthenticatedUserMode`, `startFromCleanState` | Seeds and asserts protected user-mode persisted contract | dev-only tooling | medium | Regressions can slip past smoke coverage |
| `tests/smoke/card-picker-coverage.spec.ts` | seeded `immanence-user-mode` | Smoke boot harness depends on explorer/full shell state | dev-only tooling | low | Test boot harness drifts |
| `tests/smoke/pick-debug-logs.spec.ts` | seeded `immanence-user-mode` | Smoke boot harness depends on explorer/full shell state | dev-only tooling | low | Test boot harness drifts |
| `tests/smoke/universal-picker-parity.spec.ts` | seeded `immanence-user-mode` | Smoke boot harness depends on explorer/full shell state | dev-only tooling | low | Test boot harness drifts |

# 7. Protected Student/Explorer Surface Table

| exact repo-relative path | symbol/component/store/function | why protected | classification | adjacent removal risk | forbidden touch note |
|---|---|---|---|---|---|
| `src/state/userModeStore.js` | `useUserModeStore` and persisted maps | This is the source of truth for student/explorer plus guided/full resolution | persisted state / localStorage coupling | Any adjacent cleanup can break the protected persisted contract | Do not remove or rename `immanence-user-mode`, `modeByUserId`, `hasCompletedAccessChoiceByUserId`, or `accessPostureByUserId` |
| `src/App.jsx` | `handleSectionSelect` | Live route gating for guided/student behavior | routing / gating coupling | Four Modes cleanup nearby can accidentally loosen or bypass shell gates | Do not change guided/student gating logic in the same task as Four Modes removal |
| `src/App.jsx` | `needsSetup` handling | Student flow depends on setup-first navigation behavior | onboarding coupling | Adjacent navigation cleanup can break student onboarding flow | Do not alter setup gating during removal work |
| `src/components/HomeHub.jsx` | student-only button set | Student sees only Practice and Navigation here | UI-visible behavior | Adjacent home-shell cleanup can expose removed sections to student | Do not touch student button branching in removal tasks |
| `src/components/HomeHub.jsx` | posture pill `setAccessPosture` | Guided/full selection is written here and persisted via `userModeStore` | persisted state / localStorage coupling | Adjacent UI changes can silently corrupt mode persistence | Do not touch the posture pill in Four Modes/LLM removal work |
| `src/components/SideNavigation.jsx` | `if (userMode === 'student') return null` | Student shell suppression of side navigation is explicit here | routing / gating coupling | Visual shell cleanup can unintentionally re-enable student navigation chrome | Do not alter student null-return behavior |
| `src/components/DailyPracticeCard.jsx` | `shouldBypassScheduleGateForExplorerBreath` | Explorer/full has a special practice-launch bypass | selector/computed-value coupling | Adjacent practice cleanup can break explorer-specific launch behavior | Do not fold this into Four Modes cleanup |
| `src/components/DailyPracticeCard.jsx` | `practiceLaunchContext` handling | Practice launches depend on this context for guided users | routing / gating coupling | Removing nearby practice concepts can block student or explorer launch transitions | Do not change launch-context behavior in the same task |
| `src/components/PracticeSection.jsx` | `allowedPracticeIds` | Guided posture is enforced here against active path | selector/computed-value coupling | Practice inventory cleanup can accidentally remove guided restrictions | Do not touch posture-based practice restriction logic |
| `src/reporting/tilePolicy.js` | `getHomeDashboardPolicy` | Student/explorer affects dashboard range and primary metrics | selector/computed-value coupling | Reporting cleanup can silently flatten guided/full differences | Do not simplify posture-aware policy during Four Modes removal |
| `src/components/homeHubLogic.js` | `getHomeHubDashboardState` | HomeHub depends on posture-aware dashboard policy | selector/computed-value coupling | Adjacent dashboard/report cleanup can alter protected behavior | Do not change posture feed-through in removal work |
| `src/state/offlineFirstUserStateKeys.js` | `OFFLINE_FIRST_USER_STATE_KEYS` | Offline-first sync explicitly preserves protected key `immanence-user-mode` | persisted state / localStorage coupling | Persistence cleanup can drop protected user mode state | Do not remove `immanence-user-mode` from the allowlist |
| `src/state/offlineFirstUserStateSync.js` | `bestEffortRehydrateAfterApply()` import of `userModeStore.js` | Protected mode state is rehydrated after sync apply | persisted state / localStorage coupling | Sync cleanup can leave mode resolution stale after state apply | Do not remove `userModeStore` rehydrate path |
| `tests/smoke/critical-flows.spec.ts` | localStorage assertions | This test explicitly proves the protected persisted contract | UI-visible behavior | Adjacent cleanup can break the only automated contract proof | Do not update or delete this protection in the same task |

# 8. Inventory: Architecture Couplings and Removal Risk

## Structural couplings

| exact repo-relative path | symbol/component/store/function | short description | classification | removal difficulty | risk if removed blindly |
|---|---|---|---|---|---|
| `src/components/ApplicationSection.jsx` | `ApplicationSection` | Live Application shell now renders `SigilSealingArea` and `ApplicationTrackingCard`, not Four Modes UI | routing / gating coupling | low | This is why some Four Modes files are removable earlier than stores |
| `src/components/SessionHistoryView.jsx` | Application archive tab | Four Modes survives in archive/reporting even though main Application shell no longer exposes it | UI-visible behavior, business-logic coupling | high | Store removal before archive decoupling will break runtime |
| `src/components/tracking/reports/ReportsPanel.jsx` | Application reports domain | Reports still consume Four Modes stats/chains | UI-visible behavior, business-logic coupling | high | Report generation breaks if stores disappear first |
| `src/components/tracking/infographics/ApplicationDashboardHeader.jsx` | Application dashboard header | Application dashboard still renders Mode Training and Chains metrics | UI-visible behavior | medium | Header breaks or renders nonsense if summary shape is not updated first |
| `src/components/wisdom/SelfKnowledgeView.jsx` | `Wave Function` copy | Wisdom self-knowledge is positioned as Four Modes support | UI-visible behavior | medium | Leaves misleading product copy after Four Modes removal |
| `src/components/wisdom/BigFiveAssessment.jsx` | `Wave Function Setup` copy | Assessment completion text still promises Four Modes guidance | UI-visible behavior | medium | Same copy inconsistency risk |
| `src/state/wisdomStore.js` | `selfKnowledgeProfile` | Self-knowledge persistence is independent, but current UX copy is not | persisted state / localStorage coupling | medium | Need a later product decision: keep-and-rename or remove |
| `src/state/settingsStore.js` | `llmModel` in `immanence-settings` | LLM residue is persisted even though no production caller was found | persisted state / localStorage coupling | low | Later cleanup needs a settings migration or explicit residue decision |
| `src/state/trainingStore.js` | `immanence-training` | Legacy mode-training store is not imported, but it still owns persisted storage | persisted state / localStorage coupling | medium | Safe code deletion still requires later storage cleanup plan |

## Cosmetic-only mentions and grep hazards

These are not evidence of Four Modes structure by themselves and must not be auto-grouped into removal:

| exact repo-relative path | symbol/component/store/function | short description | classification | removal difficulty | risk if removed blindly |
|---|---|---|---|---|---|
| `src/components/BreathWaveVisualization.jsx` | `BreathWaveVisualization` | Unrelated breath UI using the term `wave` | text-only mention, UI-visible behavior | low | Grep-based `wave` deletion would damage breath UI |
| `src/components/FlowingWave.jsx` | `FlowingWave` | Unrelated decorative wave component | text-only mention, UI-visible behavior | low | Same grep hazard |
| `src/components/TrackingHub.jsx` | `CYMATIC_GLYPHS` comments | Uses Mirror/Wave/Sword metaphor labels for domain icons, not Four Modes runtime wiring | text-only mention | low | Same grep hazard |
| `src/App.jsx` | rainbow/prism changelog comments | Uses `prism` in unrelated graphics comments | text-only mention | low | Same grep hazard |

# 9. Persistence Migration Matrix

| storage key | owning store/module | concept | current status | migration action | risk if mishandled |
|---|---|---|---|---|---|
| `immanence-user-mode` | `src/state/userModeStore.js` | student/explorer mode plus guided/full posture | preserve | leave intact | Breaks boot, section gating, and protected persisted contract if changed |
| `immanence-user-mode` | `src/state/userModeStore.js` | nested protected fields: `modeByUserId`, `hasCompletedAccessChoiceByUserId`, `accessPostureByUserId` | preserve | leave intact | Breaks per-user mode resolution and smoke-test assumptions |
| `immanence-mode-training` | `src/state/modeTrainingStore.js` | Four Modes mode-training sessions and stats | remove later | explicit cleanup later | Still consumed by archive/reporting surfaces today |
| `immanence-chains` | `src/state/chainStore.js` | Four Modes chain progression and pattern stats | remove later | explicit cleanup later | Still consumed by archive/reporting surfaces today |
| `immanence-settings` | `src/state/settingsStore.js` | LLM model preference via `llmModel` subfield | stale residue only | add migration later | Leaves dead persisted config if LLM is removed without store cleanup |
| `immanence-training` | `src/state/trainingStore.js` | legacy mode-training store | stale residue only | explicit cleanup later | No live importer found, but deleting store file without later cleanup leaves orphaned persisted data |

# 10. Proposed Removal Plan

## Safe removal sequence

1. Phase 1: remove only importer-proven, non-persisted, non-protected dead files.
2. Phase 2: remove LLM frontend/backend plumbing after Phase 1 and after deciding how to handle `llmModel` in `immanence-settings`.
3. Phase 3: decouple archive/reporting from Four Modes stores before touching those stores.
4. Phase 4: remove Four Modes stores and practice surfaces after archive/reporting no longer consume them.
5. Phase 5: clean up Wisdom copy and only then do downstream docs cleanup.

## Phase 1 proof table

The following files meet the current Phase 1 safety bar.

| exact repo-relative path | file type / role | live importer count | exact importer paths, or explicit “none found” | dynamic import check result | route / lazy-load check result | persisted-state impact | UI-visible impact | business-logic impact | recommended phase | confidence |
|---|---|---:|---|---|---|---|---|---|---|---|
| `src/components/ApplicationSelectionModal.jsx` | dormant UI component | 0 | none found; repo-wide basename/path search found only the file itself | no `import()` or `lazy()` reference to this basename/path found in `src/**` or tests | no route, path-based router, or lazy-load reference found in `src/main.jsx`, `src/App.jsx`, or `src/pages/**` | none found | component itself is UI, but no mounted importer was found | none found in current runtime graph | Phase 1 | high |
| `src/components/ModeDetail.jsx` | dormant UI component | 0 | none found; repo-wide basename/path search found only the file itself | no `import()` or `lazy()` reference to this basename/path found in `src/**` or tests | no route, path-based router, or lazy-load reference found in `src/main.jsx`, `src/App.jsx`, or `src/pages/**` | none found | component itself is UI, but no mounted importer was found | imports Four Modes helpers internally, but no live importer into this file was found | Phase 1 | high |
| `src/components/dev/LLMTestPanel.jsx` | dormant dev-only UI component | 0 | none found; repo-wide basename/path search found only the file itself | no `import()` or `lazy()` reference to this basename/path found in `src/**` or tests | no route or lazy-load reference found in the live shell | none found | dev-only UI if mounted, but no mounted importer was found | current LLM caller surface is confined to this file; deleting this file does not remove runtime business logic from the live shell | Phase 1 | high |
| `src/state/historyStore.js` | dormant utility store | 0 | none found; repo-wide basename/path search found only the file itself | no `import()` reference to this basename/path found in `src/**` or tests | not used in route or lazy-load paths | none found | none found | none found in current runtime graph | Phase 1 | high |

## Revalidated prior candidate now excluded from Phase 1

| exact repo-relative path | file type / role | live importer count | exact importer paths, or explicit “none found” | dynamic import check result | route / lazy-load check result | persisted-state impact | UI-visible impact | business-logic impact | recommended phase | confidence |
|---|---|---:|---|---|---|---|---|---|---|---|
| `src/state/trainingStore.js` | legacy persisted store | 0 | none found; repo-wide basename/path search found only the file itself | no `import()` reference to this basename/path found in `src/**` or tests | not used in route or lazy-load paths | owns persisted key `immanence-training` | none found | low current runtime impact, but persisted-store ownership still exists | Not Phase 1; later only with explicit cleanup plan | high |

## Not safe for Phase 1

These are structurally live or unresolved for Phase 1:

- `src/services/llmService.js`
  - not Phase 1 because it is still a real business-logic module and later removal should follow explicit LLM cleanup sequencing
- `src/state/modeTrainingStore.js`
  - not Phase 1 because archive/reporting still consumes it
- `src/state/chainStore.js`
  - not Phase 1 because archive/reporting still consumes it
- `src/components/SessionHistoryView.jsx`
  - not Phase 1 because it still consumes Four Modes stores
- `src/components/tracking/reports/ReportsPanel.jsx`
  - not Phase 1 because it still consumes Four Modes stores
- `src/components/tracking/infographics/ApplicationDashboardHeader.jsx`
  - not Phase 1 because it still consumes Four Modes summary output

# 11. Proposed TS Adoption Plan

1. Tooling phase only:
   - add root app TypeScript config
   - add `tsc --noEmit`
   - extend lint coverage to `.ts` / `.tsx`

2. `// @ts-check` + JSDoc first:
   - `src/config/runtimeEnv.js`
   - `src/utils/runtimeChecks.js`
   - `src/utils/runtimeFailure.js`
   - `src/config/appMeta.js`
   - `src/reporting/tilePolicy.js`
   - `src/components/homeHubLogic.js`
   - `src/state/offlineFirstUserStateKeys.js`
   - `src/state/userModeStore.js`

3. Early `.ts` conversion after checks are clean:
   - `src/config/runtimeEnv.ts`
   - `src/utils/runtimeChecks.ts`
   - `src/utils/runtimeFailure.ts`
   - `src/config/appMeta.ts`
   - `src/reporting/tilePolicy.ts`
   - `src/components/homeHubLogic.ts`
   - `src/state/offlineFirstUserStateKeys.ts`
   - `src/data/fourModes.ts`
   - `src/state/practiceConfig.ts`

4. Later store conversion only after product-scope stabilization:
   - `src/state/userModeStore.js`
   - `src/state/settingsStore.js`
   - and only later, if still relevant:
     - `src/state/chainStore.js`
     - `src/state/modeTrainingStore.js`

5. Defer these high-churn UI files:
   - `src/App.jsx`
   - `src/components/HomeHub.jsx`
   - `src/components/PracticeSection.jsx`
   - `src/components/DailyPracticeCard.jsx`
   - `src/components/SessionHistoryView.jsx`
   - `src/components/SigilSealingArea.jsx`

# 12. Exact Files to Change for Phase 1

Safe Phase 1 code-removal candidates, based on current evidence:

- `src/components/ApplicationSelectionModal.jsx`
- `src/components/ModeDetail.jsx`
- `src/components/dev/LLMTestPanel.jsx`
- `src/state/historyStore.js`

Explicitly excluded from Phase 1 despite zero importer count:

- `src/state/trainingStore.js`
  - excluded because it still owns persisted key `immanence-training`

Protected non-removal surfaces that must remain out of scope:

- `src/state/userModeStore.js`
- `src/App.jsx`
- `src/components/HomeHub.jsx`
- `src/components/SideNavigation.jsx`
- `src/components/DailyPracticeCard.jsx`
- `src/components/PracticeSection.jsx`
- `src/reporting/tilePolicy.js`
- `src/components/homeHubLogic.js`
- `src/state/offlineFirstUserStateKeys.js`
- `src/state/offlineFirstUserStateSync.js`

# 13. Open Questions / Stop Gates

Stop gates for later implementation work:

- Stop if multiple conflicting live implementations of student/explorer logic are discovered at implementation time.
  - Current audit found one live runtime source of truth: `src/state/userModeStore.js`.
- Stop if any proposed removal target later shows unresolved dynamic import or route usage.
  - Current Phase 1 recommendations are only high-confidence zero-importer files.
- Stop if any Four Modes state/store is still consumed by archive/reporting surfaces.
  - Current live consumers include:
    - `src/components/SessionHistoryView.jsx`
    - `src/components/sessionHistoryViewLogic.js`
    - `src/components/tracking/infographics/ApplicationDashboardHeader.jsx`
    - `src/components/tracking/reports/ReportsPanel.jsx`
- Stop if any persisted key is removed without a defined later migration action.
  - Current keys needing later handling:
    - `immanence-mode-training`
    - `immanence-chains`
    - `immanence-settings` (`llmModel` subfield)
    - `immanence-training`
- Stop if any coupling between Four Modes cleanup and student/explorer mode becomes ambiguous.
  - Protected adjacency surfaces are listed in Sections 6 and 7 and must be treated as out of removal scope.
- Stop if any orphan claim is below high confidence.
  - This report only recommends Phase 1 deletion for high-confidence zero-importer files.
- Stop if implementation tries to touch the protected persisted contract:
  - `immanence-user-mode`
  - `modeByUserId`
  - `hasCompletedAccessChoiceByUserId`
  - `accessPostureByUserId`
- Stop if removal is attempted by term search alone.
  - `wave`, `mirror`, `prism`, and `sword` are grep hazards and are reused in unrelated features.
