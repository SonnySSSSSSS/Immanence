# Tutorial Authoring

Authoring guide for the Driver-backed tutorial system.

## Add A Tutorial

1. Add or update the tutorial entry in [src/tutorials/tutorialRegistry.js](../src/tutorials/tutorialRegistry.js).
2. Reuse an existing anchor if one already expresses the right UI surface.
3. Add a new anchor only when reuse would be more confusing than a new stable selector.
4. Launch it through an existing app trigger with `openTutorial(tutorialId)`.

## Step Contract

Each step should define, directly or through runtime defaults:

- `id`: stable app-owned step ID
- `title`
- `body`
- `target`: CSS selector string or `null`
- `placement`: `top`, `right`, `bottom`, `left`, or `center`
- `canSkip`
- `allowInteraction`

Optional fields:

- `media`: array of media items, currently used for images
- `waitFor`: delayed target contract
- `actions`: custom action-area buttons
- `onEnter`
- `onExit`

Example:

```js
{
  id: 'photic-intensity',
  title: 'Intensity',
  body: 'Raise brightness only until the circles are clear and comfortable.',
  target: guideStepSelector(GUIDE_STEPS.PHOTIC_INTENSITY),
  placement: 'right',
  allowInteraction: true,
  waitFor: {
    target: guideStepSelector(GUIDE_STEPS.PHOTIC_INTENSITY),
    timeoutMs: 1500,
    intervalMs: 50,
    optional: true,
  },
  media: [
    {
      id: 'photic-intensity-reference',
      kind: 'image',
      src: 'tutorial/breath and stillness/intensity 1.webp',
      alt: 'Reference image for comfortable beginner photic intensity',
      caption: 'Keep the circles readable first.',
    },
  ],
  actions: [
    {
      id: 'open-practice-photic',
      label: 'Open the full photic tutorial',
      intent: 'openTutorial',
      tutorialId: 'practice:photic',
      variant: 'secondary',
    },
  ],
}
```

## Anchoring Rules

Prefer the selector helpers in [src/tutorials/anchorIds.js](../src/tutorials/anchorIds.js):

- `tutorialSelector(anchorId)` for `data-tutorial`
- `guideStepSelector(stepId)` for `data-guide-step`

Anchor rules:

- use stable semantic names, not styling classes
- anchor the smallest reliable surface that matches the explanation
- do not point tutorials at transient text nodes or decorative wrappers
- keep one semantic anchor per concept unless the UI is intentionally duplicated

Good:

- a practice sub-mode row
- a specific config panel
- the global tutorial button

Bad:

- generated class names
- motion wrappers that may appear and disappear
- icons inside a larger interactive control when the full control is the real surface

## Media

Media is app-owned content. Driver does not know anything about it.

Current convention:

- store tutorial images under `public/tutorial/**`
- reference them with `src` values like `tutorial/breath and stillness/intensity 1.webp`
- include `alt`
- keep captions short

## Custom Actions

`actions` render in the tutorial bubble above the normal Back and Next controls.

Supported intents:

- `nextStep`
- `prevStep`
- `closeTutorial`
- `completeTutorial`
- `openTutorial`
- `openUrl`

If a new action intent is needed, add it to the app-owned schema and runtime first. Do not add ad hoc Driver popover mutations per tutorial.

## Delayed Targets

Use `waitFor` when the target is conditional or appears after a state transition.

Recommended pattern:

1. Use `onEnter` to trigger the UI state that should expose the target.
2. Point `waitFor.target` at the exact selector that should appear.
3. Keep `timeoutMs` short. Start around `1000-1500`.
4. Let the overlay fall back to a centered card if the target never appears.

Current example:

- `page:photic-beginner` intensity step in [src/tutorials/tutorialRegistry.js](../src/tutorials/tutorialRegistry.js)

## Testing Checklist

For every new or changed tutorial:

1. Launch it from the real app trigger, not by editing store state in devtools.
2. Confirm the correct tutorial ID opens.
3. Step through every anchor.
4. Confirm at least one reset path still clears completion state when required.
5. If `waitFor` is used, verify both the expected target case and the fallback centered-card case.
6. If media is used, verify the asset loads under the deployed base URL.

## Debugging Missing Targets

If a step renders centered unexpectedly:

1. Use the DevPanel tutorial picker in [src/components/dev/CoordinateHelper.jsx](../src/components/dev/CoordinateHelper.jsx).
2. Confirm the expected `data-tutorial` or `data-guide-step` exists in the live DOM.
3. Check whether the element is conditional and should use `waitFor`.
4. Check whether the tutorial is pointing at a stale selector from older UI structure.

## Maintenance Rules

- Keep tutorial IDs app-owned and stable.
- Keep Driver-specific concerns inside the adapter or overlay runtime.
- Prefer registry edits over renderer hacks.
- Remove dead selectors when UI changes, or update the tutorial in the same change.
