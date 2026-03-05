# Persistence Audit

Date: 2026-03-05  
Scope: `src/state`, `src/components`, `src/hooks`  
Method: repository grep of `persist(`, `name:`, and `localStorage.getItem/setItem/removeItem`

## Coverage Summary

| Metric | Count |
|---|---:|
| Persisted Zustand keys (`persist` middleware) | 27 |
| Persisted Zustand keys with explicit `version` | 22 |
| Persisted Zustand keys with explicit `migrate` | 10 |
| Direct/local key literals or key families | 30 |
| Total tracked persistence entries in this audit | 57 |
| Offline-first allowlist keys (`OFFLINE_FIRST_USER_STATE_KEYS`) | 9 |

## Key Inventory

### A) Persist Middleware Keys (Zustand)

| Key | Owner file | Domain | Version | Migrate | Read/write surfaces |
|---|---|---|---:|---|---|
| `immanenceOS.applicationState` | `src/state/applicationStore.js` | Application logs/intention | 2 | Yes | Application section + reports |
| `immanence-avatar-presets` | `src/state/avatarPresetStore.js` | Avatar preset transforms | 1 | No | Avatar V3 + DevPanel avatar tuner |
| `immanenceOS.attention` | `src/state/attentionStore.js` | Attention aggregates | 1 | No | Home/reporting selectors |
| `immanence-breath-benchmark` | `src/state/breathBenchmarkStore.js` | Benchmark gate/results | 3 | Yes | Path activation + practice launch gating |
| `immanence-awareness-scene` | `src/state/awarenessSceneStore.js` | Awareness scene mode | - | No | Awareness practice renderer |
| `immanence-dev-panel` | `src/state/devPanelStore.js` | Dev-only tuning state | 2 | Yes | DevPanel |
| `immanenceOS.cycles` | `src/state/cycleStore.js` | Cycle progression/checkpoints | 1 | No | Cycle UI + projections |
| `immanenceOS.curriculum` | `src/state/curriculumStore.js` | Program/day/leg state | 4 | Yes | Home hub daily card + practice completion |
| `circuit-manager` | `src/state/circuitManager.js` | Circuit definitions/runtime config | 1 | No | Circuit configuration/run |
| `circuit-journal-store` | `src/state/circuitJournalStore.js` | Circuit notes/journal | 1 | No | Circuit journal views |
| `immanence-chains` | `src/state/chainStore.js` | Four Modes chain progression | 1 | No | Four Modes surfaces |
| `immanenceOS.journal` | `src/state/journalStore.js` | Session notes/micro-notes | 1 | No | Post-session journal |
| `immanence-lunar` | `src/state/lunarStore.js` | Lunar progression | 1 | Yes | Home/progression surfaces |
| `immanence-settings` | `src/state/settingsStore.js` | App settings + photic config | 1 | No | Global settings and many consumers |
| `ritual-storage` | `src/state/ritualStore.js` | Ritual state | - | No | Ritual flows |
| `immanenceOS.path` | `src/state/pathStore.js` | Path inference state | 2 | Yes | Avatar/path identity + reports |
| `immanenceOS.navigationState` | `src/state/navigationStore.js` | Active path, schedule, adherence | 8 | Yes | Navigation + Home daily schedule |
| `immanence-mode-training` | `src/state/modeTrainingStore.js` | Mode training progression | 1 | No | Mode training panels |
| `immanenceOS.progress` | `src/state/progressStore.js` | Canonical session history | 1 | Yes | Home, reports, progression |
| `immanenceOS.sigils` | `src/state/sigilStore.js` | Sigil state | - | No | Sigil features |
| `immanence-training` | `src/state/trainingStore.js` | Training meta state | 1 | No | Training surfaces |
| `tempo-sync-store` | `src/state/tempoSyncStore.js` | Tempo sync settings | - | No | Breath tempo sync |
| `immanenceOS.tracking` | `src/state/trackingStore.js` | Tracking/reporting cache state | 1 | No | Tracking reports |
| `immanence.tutorial` | `src/state/tutorialStore.js` | Tutorial completion state | - | No | Tutorial overlay/opening logic |
| `immanence-user-mode` | `src/state/userModeStore.js` | Student/explorer mode | - | No | Boot and navigation gating |
| `immanenceOS.videos` | `src/state/videoStore.js` | Video progress | 1 | Yes | Wisdom videos |
| `immanenceOS.wisdom` | `src/state/wisdomStore.js` | Wisdom reading/bookmarks stats | 1 | Yes | Wisdom section |

### B) Direct LocalStorage Keys and Key Families

| Key or family | Owner file(s) | Notes |
|---|---|---|
| `immanence_sessions_v1` | `src/state/practiceStore.js`, `src/state/progressStore.js` | Legacy session list key still read/written in practice store and read during migration paths |
| `immanence_practice_prefs_v2` | `src/state/practiceStore.js` | Current practice preferences key |
| `immanence_practice_prefs_v1` | `src/state/practiceStore.js` | Legacy read fallback only |
| `immanence_mandala_v1` | `src/state/mandalaStore.js` | Direct store outside Zustand persist |
| `immanenceOS.colorScheme` | `src/state/displayModeStore.js` | Direct display-mode preference |
| `immanenceOS.stageAssetStyle` | `src/state/displayModeStore.js` | Direct stage asset style preference |
| `dev.navButtonTuner.global.v1` | `src/state/navButtonTuner.js` | Dev tuner global settings |
| `immanence-device-id` | `src/state/offlineFirstUserStateSync.js` | Offline sync identity |
| `immanence-sync-outbox-v1` | `src/state/offlineFirstUserStateSync.js` | Offline sync queue |
| `immanence-sync-last-enqueued-hash-v1` | `src/state/offlineFirstUserStateSync.js` | Dedup hash checkpoint |
| `immanence-sync-last-pushed-hash-v1` | `src/state/offlineFirstUserStateSync.js` | Push checkpoint |
| `immanence-sync-last-applied-remote-at-v1` | `src/state/offlineFirstUserStateSync.js` | Last remote apply checkpoint |
| `immanence.tutorial.admin` | `src/state/tutorialStore.js`, `src/components/DevPanel.jsx` | Admin toggle flag |
| `immanence.tutorial.overrides` | `src/components/tutorial/TutorialOverlay.jsx`, `src/components/dev/TutorialEditor.jsx` | Tutorial content overrides |
| `immanence.tutorial.inspect` | `src/components/tutorial/TutorialOverlay.jsx` | Tutorial inspect mode |
| `immanence.tutorialHintSeen` | `src/components/practice/PracticeMenuHeader.jsx` | One-time hint suppression |
| `immanence.dev.pickers.legacy.enabled` | `src/components/DevPanel.jsx` | Dev picker legacy mode |
| `immanence.dev.pickers.pickDebug.enabled` | `src/components/DevPanel.jsx` | Dev picker debug logging toggle |
| `immanence.dev.controlsFxPicker` | `src/components/DevPanel.jsx`, `src/components/dev/SelectedControlElectricBorderOverlay.jsx` | Dev controls picker selection |
| `immanence.dev.practiceButtonFxPicker` | `src/components/DevPanel.jsx`, `src/components/dev/PracticeButtonElectricBorderOverlay.jsx` | Dev practice-button picker selection |
| `immanence.dev.platesFxPicker` | `src/components/DevPanel.jsx`, `src/components/dev/SelectedPlateOverlay.jsx` | Dev plate picker selection |
| `immanenceOS.pilotFeedback` | `src/components/FeedbackModal.jsx` | Pilot-only feedback collection |
| `immanence_install_dismissed` | `src/components/InstallPrompt.jsx` | PWA prompt dismissal |
| `immanenceOS.rituals.defaultRitualId` | `src/components/PracticeSection.jsx`, `src/components/practice/PracticeMenu.jsx` | Ritual default quick-start preference |
| `immanenceOS.rituals.lastRitualId` | `src/components/RitualSession.jsx` | Last completed ritual marker |
| `immanenceOS.rituals.lastRitualAt` | `src/components/RitualSession.jsx` | Last completed ritual timestamp |
| `treatise_progress_${chapter.id}` | `src/components/WisdomSection.jsx` | Per-chapter scroll position key family |
| `debug:<flag>` | `src/components/debug/debugFlags.js` | Dynamic debug key family |
| `immanenceOS.*` | `src/components/SettingsPanel.jsx` | Wildcard wipe behavior for reset routine |
| `immanenceOS.accountNamePrompt.v1.${userId}` | `src/components/auth/AuthGate.jsx` | Key generator present; usage path should be validated for active writes |

## Overlap Matrix

| Concept | Current stores/keys involved | Risk | Authoritative owner (target) |
|---|---|---|---|
| Session completion event history | `immanenceOS.progress`, `immanence_sessions_v1`, `immanenceOS.tracking` | Duplicate writes and drift between “legacy list” and canonical history | `progressStore` (`immanenceOS.progress`) |
| Schedule adherence and launch windows | `immanenceOS.navigationState`, `immanenceOS.curriculum`, `immanenceOS.progress` | Boundary bugs on day/slot interpretation | `navigationStore` for adherence and slot windows; `curriculumStore` for day/leg contract state |
| Practice launch/run identity | `immanenceOS.navigationState`, `immanenceOS.curriculum`, UI launch context (ephemeral) | Stale run metadata causes wrong launch binding | `navigationStore` for persisted run/path ids; `uiStore` only ephemeral handoff |
| Benchmark gating | `immanence-breath-benchmark`, `immanenceOS.navigationState`, `immanenceOS.curriculum` | Hard-blocks on malformed benchmark state | `breathBenchmarkStore` for benchmark truth; consumers must fail-open to non-blocking path |
| Ritual defaults and ritual completion markers | `ritual-storage`, `immanenceOS.rituals.defaultRitualId`, `immanenceOS.rituals.lastRitual*` | Split ownership between store and ad-hoc keys | `ritualStore` |
| Tutorial state and override modes | `immanence.tutorial`, `immanence.tutorial.admin`, `immanence.tutorial.overrides`, `immanence.tutorial.inspect`, `immanence.tutorialHintSeen` | Mixed prod/dev/tutorial state in scattered keys | `tutorialStore` for user tutorial state; dev-only keys isolated and namespaced |

## Authoritative Owner Decisions

| Concept | Authoritative owner | Non-owner responsibilities |
|---|---|---|
| Completed session record | `progressStore` | `trackingStore` derives/reporting only; legacy session key read-only migration path |
| Daily slot adherence | `navigationStore` | `curriculumStore` consumes result for gating/expectations, does not duplicate adherence log |
| Day/leg completion | `curriculumStore` | `navigationStore` does not own leg completion state |
| Benchmark result | `breathBenchmarkStore` | Other stores/components read-only consumers |
| Ritual preference and ritual last-run markers | `ritualStore` | UI components should not write ad-hoc ritual keys directly |
| Tutorial completion state | `tutorialStore` | Dev overrides remain explicitly dev-scoped |

## Orphan / Legacy / Fragile Entries

| Entry | Current status | Audit note |
|---|---|---|
| `immanence_practice_prefs_v1` | Legacy read fallback | Keep migration-only; do not write |
| `immanence_sessions_v1` | Legacy + still written in practice store paths | High-priority consolidation with canonical progress spine |
| `immanenceOS.pilotFeedback` | Pilot-scoped | Decide retention policy before release |
| `immanence-dev-panel` and `immanence.dev.*` keys | Dev-only | Ensure hard production guardrails remain active |
| `debug:<flag>` family | Dynamic, unbounded | Safe for dev, should be excluded from user-state sync/backup |
| `treatise_progress_${chapter.id}` | Dynamic per chapter | Potential growth/orphan accumulation over long usage |
| `immanenceOS.*` wildcard reset behavior | Broad delete family | Can wipe more than intended as key surface expands |
| `immanenceOS.accountNamePrompt.v1.${userId}` | Key template present | Verify active usage and add explicit lifecycle policy |

## Remediation Plan

### P0

| Priority | Action | Outcome |
|---|---|---|
| P0 | Freeze canonical owner contract for overlapping concepts (table above) in architecture docs | Eliminates ambiguous ownership during bugfixes |
| P0 | Stop expanding legacy session key usage (`immanence_sessions_v1`) and define migration-off timeline to `immanenceOS.progress` | Removes duplicate session truth |
| P0 | Add automated key-inventory check in CI (docs drift detector vs grep output) | Prevents undocumented keys from creeping in |

### P1

| Priority | Action | Outcome |
|---|---|---|
| P1 | Consolidate ritual-related ad-hoc keys into `ritualStore` contract | Reduces scattered writes in components |
| P1 | Normalize tutorial key surface (`immanence.tutorial*`) into documented prod vs dev groups | Cleaner lifecycle and safer resets |
| P1 | Replace broad `immanenceOS.*` reset with explicit allowlist delete | Prevents accidental data loss |

### P2

| Priority | Action | Outcome |
|---|---|---|
| P2 | Unify naming conventions for non-`immanenceOS.*` keys (`tempo-sync-store`, `ritual-storage`, `circuit-*`) | Improves discoverability and tooling |
| P2 | Add retention policy for dynamic key families (`treatise_progress_*`, `debug:*`) | Limits unbounded localStorage growth |
| P2 | Align offline-first allowlist with current canonical owner set and dev-key exclusions | Safer backup/sync semantics |

## Verification Command Set

```bash
rg -n "persist\\(|name:\\s*['\"]|localStorage\\.(getItem|setItem|removeItem)" src/state src/components src/hooks
rg -n "Key Inventory|Overlap Matrix|Authoritative Owner|Orphan|Remediation Plan|Coverage Summary" docs/PERSISTENCE_AUDIT.md
```

