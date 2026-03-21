# Dev Inspector Merge Parity Checklist

Use this checklist to confirm parity before deleting legacy section code.

## Scope

- Unified section is still labeled `Inspector (NEW)` in Phase 4.
- All controls from:
  - Inspector (NEW)
  - Card Styling Tuner
  - Navigation Button FX Tuner
  are accessible from the unified section.
- No storage key, payload shape, or picker behavior drift.

## Manual Parity Checks

### 1) Card styling persists after reload

- Open DevPanel and expand `Inspector (NEW)`.
- Select `Cards` target family in universal picker.
- Use picker to select a card.
- In `Card Styling Tuner` (inside unified inspector), change at least 3 distinct sliders (for example: `Tint H`, `Alpha`, `Blur`).
- Reload the app.
- Verify the same card still reflects saved styling.

Pass criteria:

- Styling values persist after reload.
- No console/runtime errors related to card tuner persistence.

### 2) Per-card reset persists after reload

- With a selected card, use `Reset Selected` in `Card Styling Tuner`.
- Reload the app.
- Verify selected-card overrides remain cleared while global behavior remains intact.

Pass criteria:

- Per-card override stays cleared after reload.
- Global settings are not unintentionally wiped.

### 3) Nav button FX persists after reload

- In `Navigation Button FX Tuner` (inside unified inspector), toggle `Nav Button Tuner: ON`.
- Change at least one text field and one slider (for example: `Border color` and `Stroke glow`).
- Reload the app.
- Verify nav button FX settings persist.

Pass criteria:

- Nav button FX values persist after reload.
- Controls still target `.im-nav-btn` styling tokens.

### 4) Inspector (NEW) unique readouts still update

- Toggle `Pick Debug` and start universal picking.
- Pick one control target, then one card target.
- Verify `Debug resolved:` updates with current mode/id.

Pass criteria:

- Readout updates live with current pick.
- No stale readout after mode switches.

### 5) Apply-to-all logic still works

- In `Card Styling Tuner`, toggle `Apply to all: ON` and adjust a card slider.
- Confirm changes apply globally.
- Toggle `Apply to all: OFF`, pick a specific card, adjust slider, confirm card-specific behavior.
- For Practice Button FX, verify `Apply to all` + selected key behavior still works.

Pass criteria:

- Global and selected behavior remain distinct and functional.
- Practice button key-scoped behavior still responds correctly.

### 6) No duplicated listeners / doubled updates

- Start/stop pick flows repeatedly across controls/cards/legacy practice button picker.
- Observe existing debug logs for duplicate events per single user action.
- Watch UI for doubled updates (duplicate overlays, repeated toggles, duplicate readout changes).

Pass criteria:

- Single action produces single logical update.
- No evidence of duplicate listeners or stacked capture handlers.

## Optional Automated Support (Minimal Only)

- Existing smoke coverage already exercises key unified inspector/picker flows:
  - `tests/smoke/universal-picker-parity.spec.ts`
  - `tests/smoke/card-picker-coverage.spec.ts`
  - `tests/smoke/pick-debug-logs.spec.ts`
- If future regressions appear, add only minimal assertions for unified inspector render/readout update in one of the above tests (no broad test expansion in this phase).

## Sign-off

- [ ] Manual checks 1-6 passed.
- [ ] Locked Universal Gate passed for this phase.
- [ ] No storage key/event/payload drift observed.
- [ ] Ready for Phase 5 cleanup and rename.
