# Dev Inspector Merge Inventory

This inventory documents current behavior for:

- `Inspector (NEW)` (inline in `src/components/DevPanel.jsx`)
- `Card Styling Tuner` (`src/components/devpanel/sections/CardTunerSection.jsx`)
- `Navigation Button FX Tuner` (`src/components/devpanel/sections/NavButtonTunerSection.jsx`)

All claims include evidence with path, line range, and minimal excerpt.

## Smoke-coupled strings (current location evidence)

- Claim: DevPanel section title currently uses `Inspector (NEW)`.
  Evidence: `src/components/DevPanel.jsx:1112-1114` - `title="Inspector (NEW)"`.

- Claim: DevPanel expanded hint currently includes `Universal picker (parity phase)`.
  Evidence: `src/components/DevPanel.jsx:1122-1124` - `Universal picker (parity phase): controls + plates + cards`.

- Claim: Smoke tests currently expand this section by matching `Inspector (NEW)` and `Universal picker (parity phase)`.
  Evidence: `tests/smoke/universal-picker-parity.spec.ts:56` - `ensureSectionExpanded(page, 'Inspector (NEW)', /Universal picker \(parity phase\)/i)`.
  Evidence: `tests/smoke/card-picker-coverage.spec.ts:77` - `ensureSectionExpanded(page, 'Inspector (NEW)', /Universal picker \(parity phase\)/i)`.
  Evidence: `tests/smoke/pick-debug-logs.spec.ts:55` - `ensureSectionExpanded(page, 'Inspector (NEW)', /Universal picker \(parity phase\)/i)`.

## Inspector (NEW)

### A) Target selection

- Claim: The section supports three target families: `controls`, `card`, and `plates`.
  Evidence: `src/components/DevPanel.jsx:1126-1144` - `setUniversalPickerKind('controls')`, `setUniversalPickerKind('card')`, `setUniversalPickerKind('plates')`.

- Claim: Selection mode is driven by a single universal pick flow toggle.
  Evidence: `src/components/DevPanel.jsx:1147-1152` - `onClick={() => (universalPickMode ? handleStopUniversalPickFlow() : handleStartUniversalPickFlow())}` and `Pick Target`.

- Claim: Controls/plates selection is sourced through the universal controls capture manager and receives validated root IDs.
  Evidence: `src/components/DevPanel.jsx:747-764` - `startControlsPicking({ kind: universalPickerKind, onPick: ({ validation }) => { const resolvedId = validation?.rootId || null; } })`.

- Claim: Card selection is sourced by click capture using `findCardFromEvent` and `selectCard`.
  Evidence: `src/components/DevPanel.jsx:805-817` - `const el = findCardFromEvent(event)` and `selectCard(el)`.

- Claim: Controls selection is broadcast through a picker channel (storage + event).
  Evidence: `src/components/DevPanel.jsx:250-257` - `CONTROLS_PICK_STORAGE_KEY = "immanence.dev.controlsFxPicker"` and `emitPickerSelection(...)`.
  Evidence: `src/components/DevPanel.jsx:649-652` - `broadcastControlsPicker({ selectedId: controlsSelectedId || null })`.
  Evidence: `src/dev/pickerChannel.js:1-2` - `localStorage.setItem(storageKey, JSON.stringify(payload))`.

- Claim: Plates selection is broadcast through a picker channel (storage + event).
  Evidence: `src/components/DevPanel.jsx:785-785` - `emitPickerSelection('immanence.dev.platesFxPicker', 'immanence-plates-fx-picker', { selectedId: resolvedId })`.

- Claim: Card mode includes `apply to all` behavior.
  Evidence: `src/components/DevPanel.jsx:1227-1230` - `setCardApplyToAll(v => !v)` and `Apply to all: ON`.
  Evidence: `src/components/DevPanel.jsx:516-527` - `if (cardApplyToAll) { ... applyGlobal(next) ... } else { ... applySelected(next) ... }`.

### B) Editable parameters

- Claim: Inspector (NEW) contains picker/probe controls and debug toggles.
  Evidence: `src/components/DevPanel.jsx:1154-1179` - `Legacy pickers`, `Pick Debug`, `Probe: Targets`, `Probe: Cards`.

- Claim: For `controls`, editable parameters are delegated to `ControlsFxSection`.
  Evidence: `src/components/DevPanel.jsx:1186-1207` - `<ControlsFxSection ... controlsFxDraft ... setControlsFxPreset ... importControlsFxPresetsJson ... />`.
  Evidence: `src/components/devpanel/sections/ControlsFxSection.jsx:61-172` - controls sliders include `Thickness`, `Offset`, `Speed`, `Chaos`, `Glow`, `Blur`, `Opacity`, `Color`.

- Claim: For `plates`, editable parameters are delegated to `PlatesFxSection`.
  Evidence: `src/components/DevPanel.jsx:1209-1221` - `<PlatesFxSection ... platesFxDraft ... patchSelectedPlatePreset ... />`.
  Evidence: `src/components/devpanel/sections/PlatesFxSection.jsx:47-194` - plate controls include `Profile`, `Border Thickness`, `Speed`, `Border Opacity`, `Color Mode`, `Glow`, `Glow Opacity`, `BG Opacity`, `Sheen`, `Animate`.

- Claim: For `card`, inline controls expose 6 sliders with fixed ranges.
  Evidence: `src/components/DevPanel.jsx:1237-1243` - `Tint H (0-360)`, `Tint S (0-100)`, `Tint L (0-100)`, `Alpha (0-1)`, `Border A (0-1)`, `Blur (0-60)`.

### C) Persistence contract

- Claim: Inspector (NEW) writes/reads picker and dev-flag keys in localStorage.
  Evidence: `src/components/DevPanel.jsx:219-221` - `LEGACY_PICKERS_FLAG_KEY = "immanence.dev.pickers.legacy.enabled"`, `PICK_DEBUG_FLAG_KEY = "immanence.dev.pickers.pickDebug.enabled"`.
  Evidence: `src/components/DevPanel.jsx:250-251` - `CONTROLS_PICK_STORAGE_KEY = "immanence.dev.controlsFxPicker"`, `CONTROLS_PICK_EVENT = "immanence-controls-fx-picker"`.
  Evidence: `src/components/DevPanel.jsx:451-463` - reads/writes `PICK_DEBUG_FLAG_KEY`.
  Evidence: `src/components/DevPanel.jsx:610-623` - reads/writes `LEGACY_PICKERS_FLAG_KEY`.
  Evidence: `src/components/DevPanel.jsx:785-785` - writes plates picker payload.

- Claim: Controls preset persistence uses versioned key with v1->v2 fallback.
  Evidence: `src/dev/controlsFxPresets.js:1-4` - `PRESETS_KEY = 'immanence.dev.controlsFxPresets.v2'`, `LEGACY_PRESETS_KEY = '...v1'`, `SCHEMA_VERSION = 2`.
  Evidence: `src/dev/controlsFxPresets.js:67-72` - fallback reads legacy and `saveAll(legacy)`.
  Evidence: `src/dev/controlsFxPresets.js:83-90` - stored shape `{ version: SCHEMA_VERSION, presets: normalized }` and legacy cleanup.

- Claim: Plates preset persistence uses versioned key with v1->v2 migration.
  Evidence: `src/dev/plateFxPresets.js:1-3` - `PRESETS_V1_KEY`, `PRESETS_V2_KEY`, `SCHEMA_VERSION = 2`.
  Evidence: `src/dev/plateFxPresets.js:156-207` - `migrateV1ToV2(...)` and `writeV2(migrated, { emitEvent: false })`.

- Claim: Picker payload shapes used by Inspector (NEW).
  Evidence: `src/components/DevPanel.jsx:651-651` - controls payload `{ selectedId: controlsSelectedId || null }`.
  Evidence: `src/components/DevPanel.jsx:785-785` - plates payload `{ selectedId: resolvedId }`.
  Evidence: `src/dev/pickerChannel.js:1-2` - payload is serialized as JSON exactly as emitted.
  Example payload (`controls`):
  ```json
  { "selectedId": "homeHub:mode:navigation" }
  ```
  Example payload (`plates`):
  ```json
  { "selectedId": "homeHub:plate:mode:practice" }
  ```

- Claim: Reset semantics in Inspector (NEW)-owned persistence paths are per-target and global depending on preset module.
  Evidence: `src/dev/controlsFxPresets.js:118-130` - `resetControlsFxPreset(controlId)` and `resetAllControlsFxPresets()`.
  Evidence: `src/dev/plateFxPresets.js:265-285` - `resetPlatesFxPreset(plateId)` and `resetPlatesFxOverrides(plateId)`.

### D) Side effects

- Claim: Universal pick flow enforces one active capture system and tears down listeners/classes on stop.
  Evidence: `src/components/DevPanel.jsx:741-746` - conflict prevention disables other pickers.
  Evidence: `src/components/DevPanel.jsx:792-797` - stop cleanup calls `stopControlsPicking()` and `detachControlsCapture()`.
  Evidence: `src/components/DevPanel.jsx:820-827` - card path adds/removes `window.addEventListener('click', onClickCapture, true)`.

- Claim: Inspector toggles body/html probe classes.
  Evidence: `src/components/DevPanel.jsx:753-753` - adds `dev-plates-picker-active`.
  Evidence: `src/components/DevPanel.jsx:884-886` - toggles `dev-ui-target-probe`.

- Claim: Inspector debug instrumentation emits console logs on pick attempts.
  Evidence: `src/components/DevPanel.jsx:332-347` - `console.info('[pick-debug] ...')`.
  Evidence: `src/components/DevPanel.jsx:682-682` and `src/components/DevPanel.jsx:810-810` - `debugLogPick(...)` for legacy and universal card flows.

- Claim: Inspector exposes derived readouts (resolved mode/id and selected ID) that update from pick results.
  Evidence: `src/components/DevPanel.jsx:1182-1184` - `Debug resolved: ...`.
  Evidence: `src/components/DevPanel.jsx:1232-1234` - card `Selected: ...`.

## Card Styling Tuner

### A) Target selection

- Claim: Primary target type is card roots marked with `data-card="true"`.
  Evidence: `src/components/devpanel/sections/CardTunerSection.jsx:67-67` - `Pick a ... data-card="true" target`.

- Claim: Legacy card pick flow is explicit (`Pick Card` / `Stop Picking` / `Confirm Pick`).
  Evidence: `src/components/devpanel/sections/CardTunerSection.jsx:77-80` - `Pick Card`/`Stop Picking`.
  Evidence: `src/components/devpanel/sections/CardTunerSection.jsx:99-107` - `Confirm Pick`.

- Claim: Practice button FX target type is `data-ui="practice-button"`.
  Evidence: `src/components/devpanel/sections/CardTunerSection.jsx:177-177` - `Targets: data-ui="practice-button"`.
  Evidence: `src/components/DevPanel.jsx:681-681` - `target.closest('[data-ui="practice-button"]')`.

- Claim: Selection state is shown as selected card and selected practice button key.
  Evidence: `src/components/devpanel/sections/CardTunerSection.jsx:111-111` - card `Selected: ...`.
  Evidence: `src/components/devpanel/sections/CardTunerSection.jsx:174-174` - practice button `Selected: ...`.

- Claim: Apply-to-all behavior exists for both cards and practice buttons.
  Evidence: `src/components/devpanel/sections/CardTunerSection.jsx:87-87` - card `Apply to all: ON/OFF`.
  Evidence: `src/components/devpanel/sections/CardTunerSection.jsx:170-170` - practice button `Apply to all: ON/OFF`.

### B) Editable parameters

- Claim: Card tuning has 6 sliders with fixed ranges from UI controls.
  Evidence: `src/components/devpanel/sections/CardTunerSection.jsx:8-13` - `Tint H`, `Tint S`, `Tint L`, `Alpha`, `Border A`, `Blur` with min/max/step.

- Claim: Section exposes two FX toggles.
  Evidence: `src/components/devpanel/sections/CardTunerSection.jsx:126-132` - `FX: Selected Card Electric Border`.
  Evidence: `src/components/devpanel/sections/CardTunerSection.jsx:140-146` - `FX: Practice Button Electric Border`.

- Claim: Section exposes persistence actions for card settings.
  Evidence: `src/components/devpanel/sections/CardTunerSection.jsx:182-205` - `Save Global`, `Save Selected`, `Reset Global`, `Reset Selected`, `Clear All`.

- Claim: Slider changes write to card tuner runtime state via global-or-selected path.
  Evidence: `src/components/DevPanel.jsx:516-527` - `if (cardApplyToAll) ... applyGlobal(next) ... else ... applySelected(next)`.

### C) Persistence contract

- Claim: Card tuner global and per-card presets are persisted under fixed keys.
  Evidence: `src/dev/cardTuner.js:9-10` - `dev.cardTuner.global.v1`, `dev.cardTuner.cards.v1`.

- Claim: Card payload shape is a normalized object with 6 numeric fields.
  Evidence: `src/dev/cardTuner.js:12-19` - defaults include `cardTintH`, `cardTintS`, `cardTintL`, `cardAlpha`, `cardBorderAlpha`, `cardBlur`.
  Evidence: `src/dev/cardTuner.js:43-51` - `normalize(...)` clamps each field.
  Example payload (`global` or one card preset):
  ```json
  {
    "cardTintH": 220,
    "cardTintS": 20,
    "cardTintL": 12,
    "cardAlpha": 0.22,
    "cardBorderAlpha": 0.28,
    "cardBlur": 16
  }
  ```

- Claim: Card tuner writes CSS vars on root or selected element, not arbitrary schema objects.
  Evidence: `src/dev/cardTuner.js:30-36` - `CSS_VAR_MAP` to `--card-*`.
  Evidence: `src/dev/cardTuner.js:89-94` - `style.setProperty(...)`.
  Evidence: `src/dev/cardTuner.js:267-285` - selected writes and per-card save behavior.

- Claim: Card reset semantics include global reset, selected reset, and clear-all.
  Evidence: `src/dev/cardTuner.js:288-292` - `resetGlobal` removes global key and reapplies defaults.
  Evidence: `src/dev/cardTuner.js:294-301` - `resetSelected` clears selected style and removes selected preset entry.
  Evidence: `src/dev/cardTuner.js:305-312` - `clearAll` removes both keys and clears all card styles.

- Claim: Practice-button picker persistence contract uses fixed key/event with payload `{applyToAll, selectedKey}`.
  Evidence: `src/components/DevPanel.jsx:581-582` - `PRACTICE_BUTTON_PICK_STORAGE_KEY` and `PRACTICE_BUTTON_PICK_EVENT`.
  Evidence: `src/components/DevPanel.jsx:642-645` - broadcast object `{ applyToAll, selectedKey }`.
  Evidence: `src/components/DevPanel.jsx:596-600` - reads persisted payload.
  Evidence: `src/components/dev/PracticeButtonElectricBorderOverlay.jsx:10-11` - same key/event consumed by overlay.
  Example payload:
  ```json
  { "applyToAll": false, "selectedKey": "visual:practice-options" }
  ```

- Claim: FX enable flags in this section persist through the settings store key.
  Evidence: `src/state/settingsStore.js:6-6` - `SETTINGS_PERSIST_KEY = 'immanence-settings'`.
  Evidence: `src/state/settingsStore.js:43-46` - includes `practiceButtonFxEnabled` and `cardElectricBorderEnabled`.
  Evidence: `src/state/settingsStore.js:97-102` - setters persist via zustand `persist`.
  Evidence: `src/state/settingsStore.js:190-191` - persisted store metadata `name` and `version: 1`.

### D) Side effects

- Claim: Legacy card picker adds/removes a document click capture listener.
  Evidence: `src/dev/cardTuner.js:229-234` - `setPickMode` removes then conditionally adds `document.addEventListener('click', onPickClick, true)`.

- Claim: Practice button pick mode adds/removes a document click capture listener and suppresses underlying UI actions.
  Evidence: `src/components/DevPanel.jsx:706-709` - `document.addEventListener('click', onClickCapture, true)` and cleanup remove.
  Evidence: `src/components/DevPanel.jsx:690-693` - `event.preventDefault()`, `stopPropagation()`, `stopImmediatePropagation()`.

- Claim: Practice button pick mode enforces mutual exclusion with other picker systems.
  Evidence: `src/components/DevPanel.jsx:665-668` - `setPickMode(false)`, `setPeekMode(false)`, `setUniversalPickMode(false)`.
  Evidence: `src/components/devpanel/sections/CardTunerSection.jsx:153-157` - button-level conflict prevention before enabling practice pick.

- Claim: Section includes a keyboard-driven peek shortcut and debug readouts from DevPanel state.
  Evidence: `src/components/devpanel/sections/CardTunerSection.jsx:114-114` - `Ctrl+Alt+Shift+K`.
  Evidence: `src/components/DevPanel.jsx:499-507` - keydown handler toggles `peekMode`.

## Navigation Button FX Tuner

### A) Target selection

- Claim: Target scope is nav buttons only (`.im-nav-btn`) via nav token CSS variables.
  Evidence: `src/components/devpanel/sections/NavButtonTunerSection.jsx:30-30` - `Targets .im-nav-btn only. Uses --nav-btn-* tokens`.

- Claim: This section does not use picker selection; it is global toggle + global parameter edits.
  Evidence: `src/components/devpanel/sections/NavButtonTunerSection.jsx:39-43` - `setNavButtonTunerEnabled(!navBtnState.enabled)` and `Nav Button Tuner: ON/OFF`.
  Evidence: `src/state/navButtonTuner.js:124-131` - `setNavButtonTunerEnabled` normalizes settings, toggles class, saves storage.

- Claim: Nav probe mode is a separate UI side-effect toggle.
  Evidence: `src/components/devpanel/sections/NavButtonTunerSection.jsx:33-37` - `Nav Button Probe: ON/OFF`.
  Evidence: `src/components/DevPanel.jsx:491-495` - toggles `document.body.classList` with `dev-nav-btn-probe`.

### B) Editable parameters

- Claim: Text controls edit 3 string fields.
  Evidence: `src/components/devpanel/sections/NavButtonTunerSection.jsx:47-67` - `Border color`, `Text color`, `Background RGB`.

- Claim: Range controls edit 7 numeric fields with UI ranges.
  Evidence: `src/components/devpanel/sections/NavButtonTunerSection.jsx:69-135` - `Transparency`, `Background alpha`, `Stroke thickness`, `Stroke glow`, `Blur`, `Text glow`, `Hover intensity`.

- Claim: Each edit writes through shared handler into nav-button tuner runtime state.
  Evidence: `src/components/devpanel/sections/NavButtonTunerSection.jsx:50-134` - `onChangeNavBtnSetting('...')`.
  Evidence: `src/components/DevPanel.jsx:538-542` - `setNavBtnDraft(next); applyNavButtonSettings(next);`.

- Claim: Section includes one reset action.
  Evidence: `src/components/devpanel/sections/NavButtonTunerSection.jsx:138-145` - `Reset Nav Button FX`.

### C) Persistence contract

- Claim: Nav-button tuner persists to fixed key `dev.navButtonTuner.global.v1`.
  Evidence: `src/state/navButtonTuner.js:3-3` - `const STORAGE_KEY = 'dev.navButtonTuner.global.v1';`.
  Evidence: `src/state/navButtonTuner.js:63-73` - `localStorage.getItem`/`setItem`.

- Claim: Stored payload shape is a single normalized object including `enabled` and all `navBtn*` fields.
  Evidence: `src/state/navButtonTuner.js:5-16` - defaults define `enabled` + 10 `navBtn*` properties.
  Evidence: `src/state/navButtonTuner.js:43-56` - `normalize(...)` for all persisted fields.
  Example payload:
  ```json
  {
    "enabled": true,
    "navBtnBg": "255, 255, 255",
    "navBtnBgAlpha": 0.08,
    "navBtnBorder": "var(--accent-30)",
    "navBtnBorderWidth": 1,
    "navBtnGlow": 25,
    "navBtnTextColor": "var(--accent-color)",
    "navBtnTextGlow": 10,
    "navBtnBackdropBlur": 8,
    "navBtnOpacity": 1,
    "navBtnHoverIntensity": 0.25
  }
  ```

- Claim: Writes are CSS-var based on `document.documentElement.style`.
  Evidence: `src/state/navButtonTuner.js:22-33` - `CSS_VAR_MAP` -> `--nav-btn-*`.
  Evidence: `src/state/navButtonTuner.js:80-89` - applies all `--nav-btn-*` vars.

- Claim: Reset semantics are global-only (no per-target reset path).
  Evidence: `src/state/navButtonTuner.js:142-147` - `resetNavButtonSettings()` restores defaults while preserving `enabled`.

- Claim: Migrations/versioning are not implemented in nav-button tuner storage.
  Evidence: `src/state/navButtonTuner.js:3-3` - single key name with no versioned envelope fields.
  Evidence: `src/state/navButtonTuner.js:108-147` - direct read/normalize/write object flow.

### D) Side effects

- Claim: Enabling tuner toggles a body class and applies/removes root CSS vars.
  Evidence: `src/state/navButtonTuner.js:1-1` - `ROOT_ENABLED_CLASS = 'dev-nav-btn-tuner-enabled'`.
  Evidence: `src/state/navButtonTuner.js:111-113` - init toggles class and applies/clears vars.
  Evidence: `src/state/navButtonTuner.js:127-129` - toggle path applies/clears vars on enable state changes.

- Claim: Nav probe UI mode toggles a probe class while DevPanel is active.
  Evidence: `src/components/DevPanel.jsx:493-494` - `document.body.classList.toggle('dev-nav-btn-probe', navBtnProbeEnabled)` and cleanup remove.

- Claim: Derived live preview state is maintained via subscription and draft sync.
  Evidence: `src/components/DevPanel.jsx:483-487` - `initNavButtonTuner(); subscribeNavButtonTuner((next) => { setNavBtnState(next); setNavBtnDraft(next.settings); })`.
