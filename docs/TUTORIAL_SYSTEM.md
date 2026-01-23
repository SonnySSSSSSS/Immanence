# Tutorial System – Author & Test Guide (Internal)

## 1. Mental Model

The tutorial system has three layers:

* **Registry** (code): default tutorials shipped with the app.
* **Anchors** (DOM): stable `data-tutorial="id"` markers that steps can target.
* **Overrides** (in-app): JSON edits stored in localStorage that replace registry tutorials at runtime.

Playback always resolves as:
**Override → Registry → Fallback (center step)**.

---

## 2. Entry Points

### Global Tutorial Button

* Location: App header
* Anchor: `data-tutorial="global-tutorial-button"`
* Behavior: Opens tutorial based on active page / practice

Mapping examples:

* Home → `page:home`
* Practice (no active practice) → `page:practice`
* Practice (active) → `practice:{practiceId}`
* Wisdom → `page:wisdom`
* Application → `page:application`
* Navigation → `page:navigation`

---

## 3. Anchors (What Can Be Targeted)

Anchors are **required** for non-center steps.

Rules:

* Anchors must be on **real DOM elements** (`div`, `button`, etc.)
* Anchors must be **mounted on the page** when the tutorial runs
* Anchors are queried via CSS selector:

  ```js
  '[data-tutorial="anchor-id"]'
  ```

Quick check (on any page):

```js
[...document.querySelectorAll("[data-tutorial]")].map(e => e.getAttribute("data-tutorial"))
```

If an anchor is missing:

* The step will fall back to center positioning
* No highlight rectangle will appear

---

## 4. Tutorial Pick (Authoring Tool)

Location:

* DevPanel → **Tutorial Tools** → Coordinate Helper

Purpose:

* Identify which anchor you're clicking
* Generate step boilerplate automatically

Workflow:

1. Enable **Tutorial Pick**
2. Click an anchored UI element
3. Use:

   * **Copy pick JSON** (raw debug info)
   * **Copy step snippet** (ready-to-paste tutorial step)

Generated snippet format:

```js
{
  title: "TODO",
  body: "TODO",
  target: '[data-tutorial="anchor-id"]',
  placement: "top",
},
```

Placement is auto-inferred based on click position.

---

## 5. Tutorial Script Editor (In-App Designer)

Location:

* DevPanel → **Tutorial Tools** → Tutorial Script Editor

What it edits:

* Tutorial JSON for a specific `tutorialId`

Storage:

* localStorage key: `immanence.tutorial.overrides`

### Typical authoring flow

1. Select tutorialId (e.g. `page:home`)
2. Auto-loads:

   * Override if exists
   * Otherwise registry version
3. Use Tutorial Pick → copy step snippet
4. Paste into `steps` array
5. Edit `title` / `body`
6. Click **Validate JSON**
7. Click **Save Override**
8. Press global `?` → tutorial plays immediately

Override indicator:

* Tooltip title shows `(override)` when active

---

## 6. Validation Rules (What Will Fail)

A tutorial must be:

```js
{
  title: string,
  steps: array
}
```

Each step must have:

* `title: string`
* `body: string`
* `placement`: `"top" | "right" | "bottom" | "left" | "center"` (optional, default `"center"`)
* `target`: `null` or selector string

If invalid:

* Editor shows inline error
* Runtime silently falls back to registry

---

## 7. Testing Checklist (Use This)

**Anchor sanity**

* [ ] Each page shows ≥1 anchor in DOM
* [ ] Practice page shows practice-specific anchors

**Playback**

* [ ] Global ? opens tutorial on every page
* [ ] Highlight rectangle appears on anchored steps
* [ ] Center steps show no highlight

**Overrides**

* [ ] Editing text updates tutorial immediately
* [ ] `(override)` appears in title
* [ ] Clearing override restores registry text

**Regression guard**

* [ ] Navigating pages updates anchor count live
* [ ] Missing anchors do not crash tutorial

---

## 8. What This System Is (and Isn't)

It **is**:

* Stable across refactors (because anchors are explicit)
* Authorable entirely inside the app
* Page-agnostic and practice-agnostic

It **is not**:

* "Every pixel is targetable"
* Auto-magical without anchors
* Guaranteed stable if you delete anchored DOM nodes

That tradeoff is intentional and correct.

---

## 9. When You're Ready for Phase 5 (later)

Possible next upgrades:

* Step timing / auto-advance
* Soft FX (pulse, glow) per step
* "Missing anchor" warnings in editor
* Export overrides → JSON file
* Import tutorial JSON from file
* Tutorial preview mode (run without opening overlay)
* Tutorial analytics (which steps are skipped most)
* Multi-language tutorial support

---

## File Locations (Quick Reference)

* **Registry:** `src/tutorials/tutorialRegistry.js`
* **Anchor IDs:** `src/tutorials/anchorIds.js`
* **Overlay:** `src/components/tutorial/TutorialOverlay.jsx`
* **Store:** `src/state/tutorialStore.js`
* **Tutorial Pick:** `src/components/dev/CoordinateHelper.jsx`
* **Script Editor:** `src/components/dev/TutorialEditor.jsx`
* **DevPanel integration:** `src/components/DevPanel.jsx`

---

## Common Issues & Fixes

### "Anchor not found" (step shows center instead of target)

**Cause:** Element with `data-tutorial="..."` is not mounted on current page.

**Fix:**
1. Run quick check (see section 3)
2. Verify anchor is on correct page
3. Check if element is conditionally rendered

### "Tutorial doesn't update after editing"

**Cause:** Override not saved, or browser cached old version.

**Fix:**
1. Click "Validate JSON" first
2. Click "Save Override"
3. Refresh page if needed
4. Check browser console for errors

### "Tutorial plays but shows wrong text"

**Cause:** Override exists and is taking precedence.

**Fix:**
1. Open Tutorial Script Editor
2. Select the tutorialId
3. Click "Clear Override"
4. Verify registry text returns

### "DevPanel doesn't show Tutorial Tools"

**Cause:** Section is collapsed.

**Fix:**
1. Open DevPanel (Ctrl+Shift+D or 🎨 button)
2. Click "Tutorial Tools" section header to expand

---

## Storage Keys (localStorage)

* `immanence.tutorial` - Tutorial completion tracking (Set of completed tutorialIds)
* `immanence.tutorialHintSeen` - First-visit hint dismissal flag (boolean)
* `immanence.tutorial.overrides` - Override tutorials (object map: tutorialId → tutorial object)

Clear all tutorial data:
```js
localStorage.removeItem('immanence.tutorial');
localStorage.removeItem('immanence.tutorialHintSeen');
localStorage.removeItem('immanence.tutorial.overrides');
```
