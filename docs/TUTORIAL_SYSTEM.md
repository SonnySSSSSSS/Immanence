# Tutorial System

Current tutorial architecture for `immanence-os`, refreshed on 2026-03-17.

## Ownership Split

The tutorial system is intentionally divided into app-owned logic and library-owned presentation.

App-owned:

- tutorial identity and semantic IDs in [src/tutorials/tutorialRegistry.js](../src/tutorials/tutorialRegistry.js)
- neutral tutorial schema normalization in [src/tutorials/tutorialSchema.js](../src/tutorials/tutorialSchema.js)
- persisted progress and launch state in [src/state/tutorialStore.js](../src/state/tutorialStore.js)
- override loading, target waiting, and storage keys in [src/tutorials/tutorialRuntime.js](../src/tutorials/tutorialRuntime.js)
- anchor IDs and selector helpers in [src/tutorials/anchorIds.js](../src/tutorials/anchorIds.js)

Driver-owned:

- overlay positioning
- spotlight rendering
- popover placement
- overlay dismissal mechanics

The boundary is [src/tutorials/driverAdapter.js](../src/tutorials/driverAdapter.js). Driver only receives the current normalized step and never becomes the source of truth for tutorial IDs, step order, completion state, or authoring data.

## Runtime Flow

1. A page or practice launch point calls `openTutorial(tutorialId)` from [src/state/tutorialStore.js](../src/state/tutorialStore.js).
2. [src/components/tutorial/TutorialOverlay.jsx](../src/components/tutorial/TutorialOverlay.jsx) reads the active `tutorialId` and `stepIndex`.
3. The overlay resolves the app-owned tutorial definition through [src/tutorials/tutorialRuntime.js](../src/tutorials/tutorialRuntime.js).
4. The runtime merges any local override on top of the registry definition, then normalizes the result through [src/tutorials/tutorialSchema.js](../src/tutorials/tutorialSchema.js).
5. The overlay waits for the step target when `waitFor` is configured.
6. [src/tutorials/driverAdapter.js](../src/tutorials/driverAdapter.js) converts the current step into a single Driver.js highlight call.
7. Navigation, completion, and persistence continue to flow through the app store, not through Driver.

This is a single-renderer system. The legacy overlay DOM path is removed. `TutorialOverlay` is now only a Driver-backed runtime wrapper.

## Schema Contract

The normalized step contract is:

- `id`
- `target`
- `title`
- `body`
- `placement`
- `media`
- `canSkip`
- `allowInteraction`
- `waitFor`
- `actions`
- optional `onEnter`
- optional `onExit`

The tutorial object also supports optional `onOpen` and `onClose` lifecycle hooks when a whole tutorial needs setup or teardown.

Important rule:

- registry authors may omit some fields in source definitions, but the runtime always normalizes to the full contract before rendering

## Storage And Overrides

Tutorial data currently uses these local storage keys:

- `immanence.tutorial` for persisted completion state
- `immanence.tutorial.overrides` for local registry overrides
- `immanence.tutorial.admin` for admin edit mode
- `immanence.tutorial.inspect` for overlay inspection mode
- `immanence.tutorialHintSeen` for practice tutorial hint dismissal

Settings reset now clears these keys in addition to the main `immanenceOS.*` storage bucket.

## Dynamic Targets

Use `waitFor` when a step target may appear after a state change, deferred render, or conditional mount.

Current reference implementation:

- `page:photic-beginner` in [src/tutorials/tutorialRegistry.js](../src/tutorials/tutorialRegistry.js)

That guide uses step lifecycle hooks to move the highlighted guide state in [src/components/PhoticControlPanel.jsx](../src/components/PhoticControlPanel.jsx), and the intensity step waits for the dynamic anchor before Driver attaches.

## Dev Surfaces

The maintained dev tools are:

- [src/components/dev/TutorialEditor.jsx](../src/components/dev/TutorialEditor.jsx) for local JSON overrides
- [src/components/dev/CoordinateHelper.jsx](../src/components/dev/CoordinateHelper.jsx) for anchor picking
- tutorial admin mode in `localStorage.immanence.tutorial.admin`

These tools now understand both `data-tutorial` anchors and `data-guide-step` anchors.
