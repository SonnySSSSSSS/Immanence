# Repository Refactor Candidates (High-Leverage, Low-Risk)

## 1. Executive Shortlist (Top Candidates)

### 1) DevPanel Monolith + Repeated Section Logic
- Why it matters: `DevPanel.jsx` is the highest-risk refactor surface in dev tooling due to extreme size, repeated hook guards, and duplicated control blocks. The file is also the most churned dev file in recent commits, increasing merge/conflict and regression risk.
- Evidence:
  - Monolith size/complexity: `src/components/DevPanel.jsx` (~3253 LOC), `useState(` x49, `useEffect(` x24, `<RangeControl` x37.
  - Repeated gate guard (18 occurrences): `src/components/DevPanel.jsx:313`, `src/components/DevPanel.jsx:445`, `src/components/DevPanel.jsx:460`, `src/components/DevPanel.jsx:472`, `src/components/DevPanel.jsx:487`, `src/components/DevPanel.jsx:493`, `src/components/DevPanel.jsx:509`, `src/components/DevPanel.jsx:610`, `src/components/DevPanel.jsx:624`, `src/components/DevPanel.jsx:636`, `src/components/DevPanel.jsx:646`, `src/components/DevPanel.jsx:657`, `src/components/DevPanel.jsx:666`, `src/components/DevPanel.jsx:672`, `src/components/DevPanel.jsx:678`, `src/components/DevPanel.jsx:863`, `src/components/DevPanel.jsx:891`, `src/components/DevPanel.jsx:900`.
  - Direct duplicate control cluster:
    - `src/components/DevPanel.jsx:1651-1656`
    - `src/components/DevPanel.jsx:1730-1735`
  - Churn: 48 touches in last ~50 commits (`git log -n 50 -- src/components/DevPanel.jsx`).
- Key excerpts:
```jsx
// src/components/DevPanel.jsx:313
if (!isOpen || !devtoolsEnabled) return undefined;
```
```jsx
// src/components/DevPanel.jsx:1651-1656 (repeated at 1730-1735)
<RangeControl label="Tint H" ... />
<RangeControl label="Tint S" ... />
<RangeControl label="Tint L" ... />
<RangeControl label="Alpha" ... />
<RangeControl label="Border A" ... />
<RangeControl label="Blur" ... />
```
- Risk level: High (many stateful effects + high churn + duplicated tuning paths).
- Estimated refactor size: L.
- Refactor shape: Extract `DevPanel` feature slices + shared section/hook modules (`useDevPanelGate`, `usePickerSync`, section components by domain).
- Safe first probe: Add dev-only console tag in each extracted section mount path (e.g., `[devpanel-section] controlsFx mounted`) to confirm render routing parity before moving logic.

### 2) Picker/Capture Event Channel Duplicated Across DevPanel + Overlays
- Why it matters: Picker state transport (`localStorage` + `CustomEvent`) is reimplemented in multiple places with similar but separate wiring. This raises drift risk for selection payload shape, event naming, and hydration behavior.
- Evidence:
  - DevPanel broadcast wiring:
    - `src/components/DevPanel.jsx:256-271` (`controls`)
    - `src/components/DevPanel.jsx:592-607` (`practice button`)
    - `src/components/DevPanel.jsx:801-802` (`plates`)
  - Overlay duplication (`readPickConfig` + `PICK_EVENT` listener):
    - `src/components/dev/SelectedControlElectricBorderOverlay.jsx:32-43`, `src/components/dev/SelectedControlElectricBorderOverlay.jsx:126-127`
    - `src/components/dev/SelectedPlateOverlay.jsx:114-125`, `src/components/dev/SelectedPlateOverlay.jsx:208-209`
    - `src/components/dev/PracticeButtonElectricBorderOverlay.jsx:42-58`, `src/components/dev/PracticeButtonElectricBorderOverlay.jsx:138-139`
  - Raw duplication counts: `readPickConfig` appears 3 times; `window.addEventListener(PICK_EVENT` appears 3 times.
  - Churn signals on same feature lane (last commits): `3fd6a69`, `cd53883`, `8d3c770`, `3bd6313` (universal picker / deterministic capture fixes).
- Key excerpts:
```jsx
// src/components/DevPanel.jsx:259-267
const broadcastControlsPicker = useCallback((next) => {
  window.localStorage.setItem(CONTROLS_PICK_STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent(CONTROLS_PICK_EVENT, { detail: next }));
}, []);
```
```jsx
// src/components/dev/SelectedPlateOverlay.jsx:114-121
function readPickConfig() {
  const raw = window.localStorage.getItem(PICK_STORAGE_KEY);
  const parsed = JSON.parse(raw);
  return { selectedId: typeof parsed?.selectedId === "string" ? parsed.selectedId : null };
}
```
- Risk level: High (cross-module drift can silently desync picker overlays from source-of-truth selection).
- Estimated refactor size: M.
- Refactor shape: Introduce shared picker channel utility (`src/dev/pickerChannel.js`) + typed payload normalizers + shared hook (`usePickerSelectionChannel`).
- Safe first probe: Add no-op payload version field (`schemaVersion`) to emitted detail and log mismatches in dev only.

### 3) Environment Gate Divergence (DEV Build vs Devtools Unlock)
- Why it matters: Some modules gate on `import.meta.env.DEV`, others on `isDevtoolsEnabled()`, and others use mixed `import.meta`/`process.env` logic. In production builds with devtools unlock, behavior can become partial and silently inconsistent.
- Evidence:
  - Canonical devtools gate: `src/dev/uiDevtoolsGate.js:54-56`.
  - Divergent gate in tuner: `src/dev/navButtonTuner.js:35-37` (strict `import.meta.env.DEV`).
  - Different gate in related tuner: `src/dev/cardTuner.js:39-41` (`isDevtoolsEnabled()`).
  - Overlay inconsistency:
    - `src/components/dev/SelectedCardElectricBorderOverlay.jsx:86`, `src/components/dev/SelectedCardElectricBorderOverlay.jsx:159` (`import.meta.env.DEV`)
    - `src/components/dev/SelectedControlElectricBorderOverlay.jsx:90`, `src/components/dev/SelectedControlElectricBorderOverlay.jsx:249` (`isDevtoolsEnabled()`).
  - Store-level gate divergence:
    - `src/state/progressStore.js:15-16` (`import.meta` OR `process.env.NODE_ENV`)
    - `src/state/navigationStore.js:84` (`import.meta.env.DEV` only).
- Key excerpts:
```js
// src/dev/uiDevtoolsGate.js:54-56
export function isDevtoolsEnabled() {
  if (isDevBuild()) return true;
  return hasDevtoolsQueryFlag() && isDevtoolsUnlocked();
}
```
```js
// src/dev/navButtonTuner.js:35-37
function hasDom() {
  return typeof window !== 'undefined' && typeof document !== 'undefined' && import.meta.env.DEV;
}
```
- Risk level: High (silent no-op behavior under non-DEV but unlocked flows).
- Estimated refactor size: M.
- Refactor shape: Centralize gate policy in a single runtime guard module and consume everywhere (`isDevtoolsEnabled`, `isDevBuild`, `isUnsafeDevBypassAllowed`).
- Safe first probe: Add dev-only one-time warning tags when module gate source differs from central gate (`[dev-gate-mismatch]`).

### 4) Duplicate `navButtonTuner` Modules in Different Folders
- Why it matters: Two near-identical modules exist (`src/dev/` and `src/state/`) with slight divergence. This is direct drift debt and creates import-path ambiguity.
- Evidence:
  - Near duplicate bodies:
    - `src/dev/navButtonTuner.js:1-150`
    - `src/state/navButtonTuner.js:1-160`
  - Divergence point: `src/state/navButtonTuner.js:151-159` exports `setNavBtnVar` / `resetNavBtnDefaults`; `src/dev/navButtonTuner.js` omits these.
  - Usage currently resolves to state version: `src/components/DevPanel.jsx:75-81` imports from `../state/navButtonTuner.js`.
  - Churn: each file touched in recent history (1 each in last ~50), but duplicate remains.
- Key excerpts:
```js
// src/state/navButtonTuner.js:151-158
export function setNavBtnVar(name, value) { ... }
export function resetNavBtnDefaults() {
  resetNavButtonSettings();
}
```
- Risk level: Medium-High (future edits can land in wrong module and never execute).
- Estimated refactor size: S.
- Refactor shape: Consolidate into one canonical module + optional compatibility re-export shim.
- Safe first probe: Add non-functional file-level marker comments (`// canonical navButtonTuner`) and temporary dev warning if non-canonical module is imported.

### 5) Persisted Store Strategy Fragmentation (Middleware Persist + Manual LocalStorage)
- Why it matters: State persistence is split between many `persist(...)` stores and several manual `localStorage` implementations, with duplicated parse/merge/error handling. Migration and hydration behaviors can diverge.
- Evidence:
  - `persist(` used across 26 store modules (`src/state/*`).
  - Manual persistence stores:
    - `src/state/displayModeStore.js:26-35`, `src/state/displayModeStore.js:96-100`, `src/state/displayModeStore.js:122-126`
    - `src/state/practiceStore.js:114-121`, `src/state/practiceStore.js:124-127`, `src/state/practiceStore.js:188-193`
    - `src/state/mandalaStore.js:101-108`, `src/state/mandalaStore.js:133-136`
  - Complex persisted configs in core stores:
    - `src/state/navigationStore.js:781-789`
    - `src/state/progressStore.js:877-883`
    - `src/state/devPanelStore.js:422-427`
  - Churn concentration on persisted core stores:
    - `src/state/navigationStore.js`: 27 touches / last ~50
    - `src/state/progressStore.js`: 17
    - `src/state/practiceStore.js`: 10
- Key excerpts:
```js
// src/state/displayModeStore.js:27-33
try {
  const stored = localStorage.getItem('immanenceOS.displayMode');
  ...
} catch {
  // localStorage not available
}
```
```js
// src/state/practiceStore.js:114-120
export function loadSessions() {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}
```
- Risk level: Medium-High (inconsistent migration/error handling across user-critical state).
- Estimated refactor size: L.
- Refactor shape: Introduce shared persistence adapter (`safeStorage`, schema helpers) and store creation helper for common persist config.
- Safe first probe: Add dev-only hydration checksum logs per store (`[persist-hydration] key/version/hash`).

### 6) Preset Persistence Engines Are Parallel but Separate (`controlsFx` vs `platesFx`)
- Why it matters: Both modules implement versioned preset parsing, migration, storage write, and event dispatch with similar responsibilities but independent logic paths.
- Evidence:
  - Controls engine:
    - `src/dev/controlsFxPresets.js:50-63` (`parseStorageValue`)
    - `src/dev/controlsFxPresets.js:65-75` (`loadAll`)
    - `src/dev/controlsFxPresets.js:78-95` (`saveAll` + event)
  - Plates engine:
    - `src/dev/plateFxPresets.js:118-137` (`parseStorageMap`)
    - `src/dev/plateFxPresets.js:166-185` (`writeV2` + event)
    - `src/dev/plateFxPresets.js:188-208` (`loadAll` + migration)
  - DevPanel preset action UI tightly coupled to controls path:
    - `src/components/DevPanel.jsx:1369-1438` (reset/export/import/reset-all controls preset block).
  - Churn present in feature lane (`controlsFxPresets` touched 2 times, `plateFxPresets` 1 time in last ~50).
- Key excerpts:
```js
// src/dev/controlsFxPresets.js:82-88
window.localStorage.setItem(PRESETS_KEY, JSON.stringify({
  version: SCHEMA_VERSION,
  presets: normalized,
}));
```
```js
// src/dev/plateFxPresets.js:170-175
window.localStorage.setItem(PRESETS_V2_KEY, JSON.stringify({
  version: SCHEMA_VERSION,
  presets: normalized,
}));
```
- Risk level: Medium (schema drift and migration inconsistency over time).
- Estimated refactor size: M.
- Refactor shape: Shared preset storage core (`createPresetStore({ key, schema, normalize, migrate })`).
- Safe first probe: Add no-op `schemaId` string to both exported snapshots and warn on mismatch in dev UI only.

### 7) Core State Monoliths (`navigationStore`, `progressStore`) with High Churn
- Why it matters: Two largest persisted stores carry heavy migration and business logic; both are high-churn and central to user progression correctness.
- Evidence:
  - Size/churn:
    - `src/state/navigationStore.js` (~920 LOC, 27 touches / last ~50)
    - `src/state/progressStore.js` (~1070 LOC, 17 touches / last ~50)
  - Complex migration and partialization in navigation:
    - `src/state/navigationStore.js:781-805`
  - Progress store dev-compat + migration branch:
    - `src/state/progressStore.js:14-16`, `src/state/progressStore.js:877-883`
  - Recent commit lane centers on contract/path/attempt persistence (`bfc016b`, `bbf47d9`, `19a6a2d`, `2990b03`, `a15f8c3`).
- Key excerpts:
```js
// src/state/navigationStore.js:781-789
name: 'immanenceOS.navigationState',
version: 8,
partialize: (state) => { ... },
migrate: (persistedState) => { ... },
```
- Risk level: High (regressions here affect path progression, attempt state, and persistence integrity).
- Estimated refactor size: L.
- Refactor shape: Split domain slices with a stable contract layer (`pathContractSlice`, `attemptSlice`, `hydrationSlice`) under one persisted facade.
- Safe first probe: Add non-behavioral state-shape fingerprint logging post-hydration (`[nav-store-shape-v8]`).

---

## 2. Deep Dives (Top 3)

## Deep Dive A — `DevPanel` Monolith Decomposition
### Current structure
- `src/components/DevPanel.jsx`
- In-file sections:
  - avatar, avatar composite tuner, inspector, controls FX, plates FX, card tuner, nav button tuner, curriculum, tracking, reporting, tutorial tools, bloom lab, data
- In-file primitives:
  - `Section` (`src/components/DevPanel.jsx:3164`)
  - `DevButton` (`src/components/DevPanel.jsx:3188`)
  - `RangeControl` (`src/components/DevPanel.jsx:3199`)
  - `TextControl` (`src/components/DevPanel.jsx:3221`)
  - `DestructiveButton` (`src/components/DevPanel.jsx:3239`)

### Redundancy map
- Repeated guard idiom (`if (!isOpen || !devtoolsEnabled) return undefined;`) across 18 `useEffect` blocks.
- Duplicated card tuning slider stack at `src/components/DevPanel.jsx:1651-1656` and `src/components/DevPanel.jsx:1730-1735`.
- Repeated reset/copy/export action cluster patterns:
  - controls presets (`src/components/DevPanel.jsx:1369-1438`)
  - avatar composite copy/reset (`src/components/DevPanel.jsx:2933-2960`)

### Proposed target structure
- `src/components/devpanel/DevPanelRoot.jsx`
- `src/components/devpanel/hooks/useDevPanelGate.js`
- `src/components/devpanel/hooks/usePickerSync.js`
- `src/components/devpanel/sections/ControlsFxSection.jsx`
- `src/components/devpanel/sections/PlatesFxSection.jsx`
- `src/components/devpanel/sections/CardTunerSection.jsx`
- `src/components/devpanel/sections/NavButtonTunerSection.jsx`
- `src/components/devpanel/sections/AvatarCompositeSection.jsx`
- `src/components/devpanel/ui/Section.jsx`
- `src/components/devpanel/ui/RangeControl.jsx`

### Migration plan (behavior-preserving)
1. Extract UI primitives (`Section`, `RangeControl`, `TextControl`, `DevButton`) with identical props and classes.
2. Extract pure render sections one-by-one with prop passthrough only.
3. Extract duplicated gate logic into `useDevPanelGate` and swap internals without changing effect dependencies.
4. Extract duplicate slider clusters into a single render helper used in both call sites.
5. Keep state ownership in root until section extraction stabilizes.
6. Run smoke tests + manual panel parity checklist before any internal state relocation.

### Regression risks
- Hook dependency drift after extraction.
- Section mount/unmount order changing side effects.
- Shortcut/picker listeners attaching twice or not detaching.

### Testing checklist
- Existing:
  - `tests/smoke/critical-flows.spec.ts`
  - `tests/smoke/universal-picker-parity.spec.ts`
  - `tests/smoke/card-picker-coverage.spec.ts`
  - `tests/smoke/pick-debug-logs.spec.ts`
- Manual smoke:
  - Open/close DevPanel repeatedly; confirm listeners detach.
  - Toggle each section and verify state persistence behavior unchanged.
  - Verify card picker, controls picker, plates picker, and practice-button picker parity.

## Deep Dive B — Picker/Capture Contract Consolidation
### Current structure
- Producer logic inside `src/components/DevPanel.jsx`:
  - controls picker broadcast (`src/components/DevPanel.jsx:256-271`)
  - practice button picker broadcast (`src/components/DevPanel.jsx:592-607`)
  - plates picker direct write/dispatch (`src/components/DevPanel.jsx:801-802`)
- Consumers:
  - `src/components/dev/SelectedControlElectricBorderOverlay.jsx`
  - `src/components/dev/SelectedPlateOverlay.jsx`
  - `src/components/dev/PracticeButtonElectricBorderOverlay.jsx`

### Redundancy map
- `readPickConfig()` duplicated 3x with similar `localStorage` parse/shape normalization.
- `PICK_EVENT` subscribe/unsubscribe duplicated 3x.
- Payload shapes differ (`selectedId` vs `selectedKey` + `applyToAll`) without shared schema helpers.

### Proposed target structure
- `src/dev/pickerChannel.js`
- `src/dev/pickerSchemas.js`
- `src/dev/hooks/usePickerSelectionChannel.js`
- `src/components/dev/overlays/useOverlayPickerConfig.js`

### Migration plan (behavior-preserving)
1. Introduce pure schema normalizers for each picker payload (no call-site changes).
2. Introduce shared `emitPickerSelection` and `readPickerSelection` wrappers.
3. Replace DevPanel producer internals with shared wrappers.
4. Replace each overlay `readPickConfig`/listener with shared hook.
5. Keep existing storage keys/event names unchanged.
6. Verify picker parity tests and manual interactions.

### Regression risks
- Event name/key mismatch in one path.
- Payload normalization differences affecting selected target resolution.
- Overlay update timing changes (scheduleScan path).

### Testing checklist
- Existing:
  - `tests/smoke/universal-picker-parity.spec.ts`
  - `tests/smoke/pick-debug-logs.spec.ts`
  - `tests/smoke/card-picker-coverage.spec.ts`
- Manual smoke:
  - Pick control, plate, and practice button; reload; confirm restoration.
  - Toggle legacy/new picker modes and verify no swallowed clicks.

## Deep Dive C — Gate Policy Unification (DEV vs Devtools Unlock)
### Current structure
- Gate policy source: `src/dev/uiDevtoolsGate.js`.
- Mixed usage:
  - `isDevtoolsEnabled()` in controls/plate/card tuner paths.
  - `import.meta.env.DEV` in nav button tuner and selected card overlay.
  - mixed `import.meta` + `process.env` compatibility in `progressStore`.

### Redundancy map
- Repeated ad-hoc `hasDom()` + gate checks.
- Non-equivalent definitions of "dev allowed" across modules.
- Module-level no-op behavior can diverge under production unlock path.

### Proposed target structure
- `src/dev/runtimeGate.js`
- `src/dev/runtimeGate.test.js` (or existing test lane equivalent)
- Replace call-sites in:
  - `src/dev/navButtonTuner.js`
  - `src/dev/cardTuner.js`
  - `src/components/dev/SelectedCardElectricBorderOverlay.jsx`
  - `src/state/progressStore.js`
  - `src/state/navigationStore.js`

### Migration plan (behavior-preserving)
1. Add central pure gate helpers with explicit semantics (`isDevBuild`, `isDevtoolsEnabled`, `isDevGuardedFeatureEnabled`).
2. Add non-behavioral telemetry warnings for mismatched old/new gate outcomes.
3. Replace gate checks in one module at a time, preserving existing fallback logic.
4. Remove duplicate ad-hoc gate helpers only after parity verification.
5. Keep all storage keys/query flags unchanged.
6. Run smoke tests in DEV and production-like preview with unlock flag.

### Regression risks
- Accidentally broadening feature exposure in production.
- Accidentally disabling valid DEV diagnostics.
- SSR/non-browser checks changing execution flow.

### Testing checklist
- Existing:
  - `tests/smoke/critical-flows.spec.ts`
  - `tests/smoke/universal-picker-parity.spec.ts`
- Manual smoke:
  - DEV build: all dev overlays/tuners operate as before.
  - Production-like build with `?devtools=1` + unlock key: expected gated features still work consistently.

---

## 3. Appendix (Raw Evidence)

### A) Largest/Most Complex Files (Focused)

| Path | Approx LOC | Notes |
|---|---:|---|
| `src/components/DevPanel.jsx` | 3253 | Primary dev tooling monolith; highest churn |
| `src/components/PracticeSection.jsx` | 2650 | Large runtime core component |
| `src/components/DailyPracticeCard.jsx` | 1926 | High UI complexity |
| `src/components/WisdomSection.jsx` | 1877 | Large feature surface |
| `src/components/HomeHub.jsx` | 1167 | Central navigation UI |
| `src/state/progressStore.js` | 1070 | Core persisted state, high churn |
| `src/components/TempoSyncPanel.jsx` | 1016 | Complex interaction panel |
| `src/components/dev/BloomRingCanvas.jsx` | 936 | Large dev visualization component |
| `src/state/navigationStore.js` | 920 | Core persisted state, highest store churn |
| `src/App.jsx` | 908 | App shell + dev gate integration |
| `src/components/debug/ShadowScanOverlay.jsx` | 769 | Large debug overlay |
| `src/components/dev/BloomRingLab.jsx` | 759 | Dev lab component, churned |
| `src/state/curriculumStore.js` | 609 | Persisted logic-heavy store |
| `src/state/devPanelStore.js` | 440 | Dev panel persisted store |
| `src/dev/uiControlsCaptureManager.js` | 362 | Capture/picker event manager |
| `src/dev/cardTuner.js` | 345 | Tuner with persistence + pick logic |
| `src/dev/controlsFxPresets.js` | 175 | Versioned preset persistence |
| `src/state/navButtonTuner.js` | 160 | Canonical nav tuner impl |
| `src/dev/navButtonTuner.js` | 150 | Duplicate nav tuner impl |
| `src/components/dev/PrecisionMeterDevPanel.jsx` | 162 | Separate dev panel UI implementation |

### B) Near-Duplicate Components/Modules

| Pair / Group | Evidence | Divergence |
|---|---|---|
| `src/state/navButtonTuner.js` vs `src/dev/navButtonTuner.js` | Both share near-identical `ROOT_ENABLED_CLASS`, `STORAGE_KEY`, defaults, load/save/apply lifecycle (`1-150`) | State version adds `setNavBtnVar`/`resetNavBtnDefaults` (`151-159`) |
| `src/components/dev/SelectedControlElectricBorderOverlay.jsx` + `src/components/dev/SelectedPlateOverlay.jsx` + `src/components/dev/PracticeButtonElectricBorderOverlay.jsx` | All define `PICK_STORAGE_KEY`, `PICK_EVENT`, `readPickConfig`, and event listener wiring (`readPickConfig`: lines `32`, `114`, `42`; add listener: `126`, `208`, `138`) | Payload fields differ (`selectedId` vs `selectedKey/applyToAll`) |
| `src/dev/controlsFxPresets.js` vs `src/dev/plateFxPresets.js` | Both implement parse -> load -> migrate/version -> persist -> dispatch event paths | Different schema functions and migration policies |
| Card tuning slider groups in `DevPanel` | Identical 6-line `RangeControl` stack at `src/components/DevPanel.jsx:1651-1656` and `src/components/DevPanel.jsx:1730-1735` | Context wrappers differ, control rows identical |
| Action clusters in `DevPanel` sections | Reset/copy/export blocks repeated at `src/components/DevPanel.jsx:1369-1438`, `src/components/DevPanel.jsx:2933-2960`, `src/components/DevPanel.jsx:3002-3118` | Targets differ; UI patterns/structure repeated |

### C) Environment Gate Inventory

| File | Line(s) | Gate Condition |
|---|---|---|
| `src/dev/uiDevtoolsGate.js` | `54-56` | `isDevBuild() || (queryFlag && unlocked)` |
| `src/components/DevPanel.jsx` | `173-174` | `isDevBuild` + `isDevtoolsEnabled()` both present |
| `src/components/DevPanel.jsx` | `274` | direct `if (!import.meta.env.DEV) return;` |
| `src/dev/cardTuner.js` | `40` | `... && isDevtoolsEnabled()` |
| `src/dev/navButtonTuner.js` | `36` | `... && import.meta.env.DEV` |
| `src/state/navButtonTuner.js` | `36` | `... && import.meta.env.DEV` |
| `src/components/dev/SelectedCardElectricBorderOverlay.jsx` | `86`, `159` | `import.meta.env.DEV` checks |
| `src/components/dev/SelectedControlElectricBorderOverlay.jsx` | `90`, `249` | `isDevtoolsEnabled()` checks |
| `src/state/progressStore.js` | `15-16` | `import.meta.env.DEV || process.env.NODE_ENV !== 'production'` |
| `src/state/navigationStore.js` | `84` | `Boolean(import.meta?.env?.DEV)` |

### D) Raw Grep-Style Findings

```text
# Repeated DevPanel gate guard
src/components/DevPanel.jsx:313: if (!isOpen || !devtoolsEnabled) return undefined;
src/components/DevPanel.jsx:445: if (!isOpen || !devtoolsEnabled) return undefined;
src/components/DevPanel.jsx:460: if (!isOpen || !devtoolsEnabled) return undefined;
... (18 total occurrences)
```

```text
# Duplicate card tuning control cluster in DevPanel
src/components/DevPanel.jsx:1651: <RangeControl label="Tint H" ... />
src/components/DevPanel.jsx:1652: <RangeControl label="Tint S" ... />
src/components/DevPanel.jsx:1653: <RangeControl label="Tint L" ... />
src/components/DevPanel.jsx:1654: <RangeControl label="Alpha" ... />
src/components/DevPanel.jsx:1655: <RangeControl label="Border A" ... />
src/components/DevPanel.jsx:1656: <RangeControl label="Blur" ... />

src/components/DevPanel.jsx:1730: <RangeControl label="Tint H" ... />
src/components/DevPanel.jsx:1731: <RangeControl label="Tint S" ... />
src/components/DevPanel.jsx:1732: <RangeControl label="Tint L" ... />
src/components/DevPanel.jsx:1733: <RangeControl label="Alpha" ... />
src/components/DevPanel.jsx:1734: <RangeControl label="Border A" ... />
src/components/DevPanel.jsx:1735: <RangeControl label="Blur" ... />
```

```text
# Picker config/read + listener duplication
readPickConfig_count  3
src/components/dev/SelectedPlateOverlay.jsx:114:function readPickConfig() {
src/components/dev/SelectedControlElectricBorderOverlay.jsx:32:function readPickConfig() {
src/components/dev/PracticeButtonElectricBorderOverlay.jsx:42:function readPickConfig() {

pick_event_listener_count  3
src/components/dev/PracticeButtonElectricBorderOverlay.jsx:138:window.addEventListener(PICK_EVENT, onPickUpdate);
src/components/dev/SelectedControlElectricBorderOverlay.jsx:126:window.addEventListener(PICK_EVENT, onPickUpdate);
src/components/dev/SelectedPlateOverlay.jsx:208:window.addEventListener(PICK_EVENT, onPickUpdate);
```

```text
# Duplicate localStorage helpers across tuners
src/state/navButtonTuner.js:60:function loadJson(key, fallback) {
src/state/navButtonTuner.js:70:function saveJson(key, value) {
src/dev/cardTuner.js:60:function loadJson(key, fallback) {
src/dev/cardTuner.js:70:function saveJson(key, value) {
src/dev/navButtonTuner.js:60:function loadJson(key, fallback) {
src/dev/navButtonTuner.js:70:function saveJson(key, value) {
```

```text
# Churn counts (last ~50 commits)
48  src/components/DevPanel.jsx
27  src/state/navigationStore.js
17  src/state/progressStore.js
10  src/state/practiceStore.js
4   src/dev/cardTuner.js
4   src/state/displayModeStore.js
3   src/components/dev/SelectedControlElectricBorderOverlay.jsx
3   src/components/dev/PracticeButtonElectricBorderOverlay.jsx
2   src/dev/uiControlsCaptureManager.js
2   src/dev/controlsFxPresets.js
1   src/components/dev/SelectedPlateOverlay.jsx
1   src/state/navButtonTuner.js
1   src/dev/navButtonTuner.js
```

```text
# Recent commit lane (devpanel/picker)
dae8e7f avatar  created for other stages
4e1dd5a fixed dev panel not appearing in github pages
3fd6a69 fix: universal picker resolves controls + plates reliably (no devpanel swallow, deterministic root scan)
02aedc2 phase B: per-control surface glow/blur/opacity + preset export/import (UTC-driven)
4870e9e phase B: per-control electric border presets (UTC-driven, persisted by data-ui-id)
e1daddb phase B: selected control electric border FX (UTC-driven, persisted)
cd53883 phase A: UTC contract, deterministic controls picker, validator, capture manager, devtools gate
8d3c770 devpanel: deterministic universal picker (nav-pill + card), debug probes, smoke tests
3bd6313 Fix Dev Panel Card Picker
```
