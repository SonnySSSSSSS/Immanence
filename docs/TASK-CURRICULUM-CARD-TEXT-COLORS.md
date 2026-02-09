# TASK: Curriculum Card Text Color Hierarchy Refinement

## Goal
Refine text colors on the DailyPracticeCard (dark mode) to establish a clear 4-tier typographic hierarchy via color opacity, decouple infrastructure labels from the accent hue, and reduce visual weight of disabled/locked states.

## Rationale (Visual Critic Analysis)
Currently nearly every text element uses `#fdfbf5` differentiated only by font size or blunt `opacity-*` classes. This makes the hierarchy flat. The accent color is shared between the "14-Day Precision Window" label and time values, creating hue competition. Disabled button text reads as nearly-active.

## Allowlist (files to modify)
- `src/components/DailyPracticeCard.jsx`
- `src/components/infographics/CurriculumPrecisionRail.jsx`
- `src/App.jsx` (patch version bump only)

## Denylist
- All other files
- Light-mode colors (no changes to `isLight` branches)
- Layout, spacing, font sizes, font weights — NO structural changes
- Protected files (Avatar.jsx, MoonOrbit.jsx, MoonGlowLayer.jsx)

## Changes

### 1. "TODAY'S PRACTICE" label (DailyPracticeCard.jsx ~line 814)
**Current:** `rgba(253,251,245,0.45)`
**New:** `var(--accent-60)`
**Why:** Promotes to accent "you are here" marker. Orients the user in the card hierarchy with brand color.

### 2. "14-DAY PRECISION WINDOW" label (CurriculumPrecisionRail.jsx ~line 160)
**Current (dark):** `var(--accent-60)`
**New (dark):** `var(--accent-40)`
**Why:** Stays in accent family but quieter than "TODAY'S PRACTICE" — creates a 2-tier accent hierarchy.

### 3. Date labels ("Feb 10") in leg cards (DailyPracticeCard.jsx ~line 879)
**Current:** `color: '#fdfbf5'` + className `opacity-70`
**New:** Remove `opacity-70` from className; set inline `color: 'rgba(253,251,245,0.55)'`
**Why:** Replace blunt element-wide opacity with intentional color value. Dates become clearly tertiary metadata.

### 4. Time values ("09:00") in leg cards (DailyPracticeCard.jsx ~line 895)
**Current:** `color: 'var(--accent-color)', opacity: 0.75`
**New:** `color: 'var(--accent-color)'` (remove `opacity: 0.75`)
**Why:** Time is key navigational data. Full accent makes it crisp and purposeful.

### 5. "NOT YET" / disabled button text (DailyPracticeCard.jsx ~line 990)
**Current:** `color: '#fdfbf5'` (when `isOutsideWindow`)
**New:** `color: 'rgba(253,251,245,0.50)'` (when `isOutsideWindow`)
**Why:** Disabled state should recede further from actionable content.

### 6. Leg number circles — non-done state (DailyPracticeCard.jsx ~line 875)
**Current:** `color: '#fdfbf5'` (when `!isDone`)
**New:** `color: 'var(--accent-60)'` (when `!isDone`)
**Why:** Accent-tinted waypoints. Numerals become navigational anchors in the brand color.

### 7. Duration "min" label (DailyPracticeCard.jsx ~line 1659)
**Current:** `color: 'var(--accent-color)', opacity: 0.7`
**New:** `color: 'var(--accent-color)'` (remove opacity)
**Why:** Consistent with time value treatment — full accent for temporal data.

## Resulting Hierarchy (dark mode)
| Tier | Element | Color |
|------|---------|-------|
| 1 — Title | "Initiation Path" | `#fdfbf5` (100%) |
| 2 — Content | Practice labels | `#fdfbf5` |
| 2a — Accent anchors | Time, duration, "TODAY'S PRACTICE", leg numbers | `var(--accent-color)` / `var(--accent-60)` |
| 3 — Infrastructure | "14-DAY PRECISION WINDOW" | `var(--accent-40)` |
| 4 — Metadata / Disabled | Dates, "NOT YET" buttons, descriptions | `rgba(253,251,245,0.50–0.55)` |

## Constraints
- Dark-mode only — do not touch `isLight` ternary branches
- All changes are `color` CSS value only — no layout, spacing, size, or weight changes
- Preserve existing hover/transition behaviors
- No new CSS classes or variables

## Verification Steps
1. `npm run lint` — passes with no new errors
2. `npm run dev` — visual smoke test in dark mode
3. Compare before/after: "TODAY'S PRACTICE" label more legible
4. Confirm "NOT YET" buttons clearly recede vs active "Start" buttons
5. Confirm time values ("09:00") are crisper/sharper than before
6. Confirm "14-DAY PRECISION WINDOW" no longer shares accent hue
7. Light mode unchanged

## Commit Message
```
fix(ui): refine curriculum card text color hierarchy (dark mode)

- Lift "TODAY'S PRACTICE" label from 0.45→0.60 opacity
- Decouple precision rail label from accent hue
- Sharpen time values (remove opacity filter)
- Dim disabled buttons and leg numbers for clearer affordance
- v3.27.149
```

## Version Bump
`v3.27.148` → `v3.27.149` in `src/App.jsx` line 545
