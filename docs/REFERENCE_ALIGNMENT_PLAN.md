# REFERENCE ALIGNMENT PLAN — Complete UI Redesign

**Date**: 2026-01-11
**Architect**: Claude Code
**Status**: PLANNED
**Priority**: 🔴 CRITICAL

---

## EXECUTIVE SUMMARY

Extensive visual audit comparing Reference Image vs. Current UI reveals **fundamental architectural mismatch**. The current implementation uses opaque backgrounds and teal accents, while the reference uses **cosmic glassmorphism** with golden serif typography and visible nebula layers.

**Critical Blockers Identified**:
1. Solid black side masks (z-50) blocking all background light → **REMOVE or make transparent**
2. Opaque card backgrounds hiding cosmic nebula → **Convert to rgba(0, 0, 0, 0.35) max**
3. Teal color scheme (wrong) → **Replace with warm gold (#D4A84B, #F5E6D3)**
4. Sans-serif typography → **Switch to serif-first stack (Cinzel, Playfair Display)**
5. 3×3 card grid (cramped) → **Change to 2×4 grid with generous spacing**

---

## 🔴 PHASE 1: LIGHT RESTORATION (CRITICAL)

### TASK 1.1: Remove Black Void Masks

**File**: `src/App.jsx`
**Lines**: 291-310

**Action**: DELETE or make transparent

```javascript
// OPTION A: DELETE ENTIRELY (Recommended)
// Remove lines 291-310 (both side mask divs)

// OPTION B: Make Transparent (If letterboxing needed)
background: 'transparent', // was '#000'
```

**Rationale**: These z-50 panels block all cosmic background visibility, defeating glassmorphism.

**Impact**: 🔴 CRITICAL — Enables all subsequent glass effects

---

### TASK 1.2: Make All Card Backgrounds Translucent

**Files**:
- `src/components/PracticeSection.jsx` (Practice selector cards)
- `src/styles/cardMaterial.js` (Global material system)

**Changes**:

```javascript
// Practice selector inactive cards
background: 'rgba(0, 0, 0, 0.30)', // was opaque dark green
backdropFilter: 'blur(32px)',

// Practice selector active card
background: 'rgba(0, 0, 0, 0.40)', // slightly more opaque when active

// Main practice card (Breath & Stillness container)
background: 'rgba(0, 0, 0, 0.35)',
backdropFilter: 'blur(28px)',
```

**Rationale**: Glass must be translucent to show nebula beneath.

**Impact**: 🔴 CRITICAL — Enables cosmic visibility through UI

---

## 🟠 PHASE 2: COLOR PALETTE OVERHAUL

### TASK 2.1: Replace ALL Teal Accents with Warm Gold

**Global Find & Replace**:

| Current (Teal) | New (Warm Gold) | Usage |
|----------------|-----------------|-------|
| `#00FFB8` | `#D4A84B` | Primary accent (borders, active states) |
| `#00C896` | `#F5E6D3` | Typography, subtle highlights |
| Any `teal` variants | `#C9A961` | Secondary accent |

**Files to Audit**:
- `src/theme/stageColors.js`
- `src/components/PracticeSection.jsx`
- `src/styles/cardMaterial.js`
- `src/App.css` (`:root` accent variables)

**Impact**: 🟠 MAJOR — Establishes correct visual language

---

### TASK 2.2: Update Theme Tokens

**File**: `src/context/ThemeContext.jsx` or `src/App.css`

```css
:root {
  --accent-gold: #D4A84B;
  --accent-gold-light: #F5E6D3;
  --accent-emerald: #00C896; /* Keep for active state highlights only */
  --text-warm-white: #F5E6D3;
  --border-gold: rgba(213, 168, 75, 0.6);
}
```

**Impact**: 🟠 MAJOR — Centralizes color system

---

## 🟠 PHASE 3: TYPOGRAPHY SYSTEM REBUILD

### TASK 3.1: Switch to Serif Font Stack

**File**: `src/index.css` or `src/App.css`

```css
:root {
  --font-display: 'Cinzel', 'Playfair Display', 'Georgia', serif;
  --font-ui: 'Inter', 'Outfit', sans-serif; /* Keep for UI elements */
}
```

**Apply to**:
- All card labels
- Practice card title
- Button text
- Section headings

**Impact**: 🟠 MAJOR — Matches reference aesthetic

---

### TASK 3.2: Update Card Label Typography

**File**: `src/components/PracticeSection.jsx` (PracticeSelector)

**Current**:
```javascript
<span>{p.label}</span> // "Breath & Stillness" (single line)
```

**New**:
```javascript
<div style={{
  fontFamily: 'var(--font-display)',
  fontSize: '11px',
  fontWeight: 600,
  letterSpacing: '0.15em',
  color: '#F5E6D3',
  textAlign: 'center',
  lineHeight: '1.4'
}}>
  <div>{topLine}</div>      {/* "BREATH" */}
  <div>{bottomLine}</div>   {/* "PRACTICES" */}
</div>
```

**Update PRACTICE_REGISTRY**:
```javascript
breath: {
  label: "BREATH\nPRACTICES", // Two-line format
  ...
}
```

**Impact**: 🟠 MAJOR — Matches reference layout

---

## 🟡 PHASE 4: PRACTICE CARD REFINEMENT

### TASK 4.1: Add Breath Pattern Subtitle

**File**: `src/components/PracticeSection.jsx`

**Add below title**:
```javascript
<div style={{
  fontFamily: 'var(--font-display)',
  fontSize: '12px',
  fontWeight: 400,
  letterSpacing: '0.08em',
  color: 'rgba(245, 230, 211, 0.7)',
  marginTop: '8px',
  marginBottom: '24px'
}}>
  Inhale 4 · Hold 4 · Exhale 4 · Hold 4
</div>
```

**Impact**: 🟡 MODERATE — Adds instructional clarity

---

### TASK 4.2: Simplify Line Graph Visualization

**File**: `src/components/BreathPathChart.jsx` (or wherever waveform is rendered)

**Changes**:
- Remove teal gradient fill → use transparent background
- Thin stroke (2px) in dim white `rgba(255, 255, 255, 0.3)`
- Add **single emerald glow** at peak point:
  ```javascript
  <circle
    cx={peakX}
    cy={peakY}
    r="6"
    fill="#00C896"
    filter="blur(8px)"
    opacity="0.9"
  />
  ```

**Impact**: 🟡 MODERATE — Matches reference style

---

### TASK 4.3: Refine Duration Slider

**File**: `src/components/SacredTimeSlider.jsx`

**Changes**:
- **Rail**: Thin golden line (2px) `border-bottom: 2px solid rgba(213, 168, 75, 0.4)`
- **Handle**:
  ```javascript
  <div style={{
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    background: '#00C896', // Inner emerald
    border: '2px solid #D4A84B', // Outer golden ring
    boxShadow: '0 0 12px rgba(0, 200, 150, 0.6)'
  }} />
  ```
- **Active number**: Wrap "10" in golden ring:
  ```javascript
  {isActive && (
    <div style={{
      position: 'absolute',
      width: '32px',
      height: '32px',
      border: '2px solid #D4A84B',
      borderRadius: '50%',
      boxShadow: '0 0 16px rgba(213, 168, 75, 0.5)'
    }} />
  )}
  ```

**Impact**: 🟡 MODERATE — Matches reference detail

---

## 🟡 PHASE 5: BUTTON REDESIGN

### TASK 5.1: "BEGIN PRACTICE" Button Transformation

**File**: `src/components/PracticeSection.jsx`

**Replace current button with**:
```javascript
<button
  onClick={onStart}
  style={{
    fontFamily: 'var(--font-display)',
    fontSize: '12px',
    fontWeight: 600,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: '#D4A84B', // Golden text, not white
    background: 'rgba(0, 0, 0, 0.6)',
    border: '1px solid rgba(213, 168, 75, 0.6)', // Thin golden hairline
    borderRadius: '32px', // Full capsule
    padding: '16px 48px',
    boxShadow: `
      inset 0 1px 0 rgba(255, 255, 255, 0.1),
      0 2px 8px rgba(0, 0, 0, 0.4)
    `,
    cursor: 'pointer',
    transition: 'all 300ms ease'
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.boxShadow = `
      inset 0 0 24px rgba(213, 168, 75, 0.2),
      0 4px 16px rgba(0, 0, 0, 0.5)
    `;
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.boxShadow = `
      inset 0 1px 0 rgba(255, 255, 255, 0.1),
      0 2px 8px rgba(0, 0, 0, 0.4)
    `;
  }}
>
  BEGIN PRACTICE
</button>
```

**Impact**: 🟡 MODERATE — Matches reference elegance

---

## 🟢 PHASE 6: LAYOUT RESTRUCTURING

### TASK 6.1: Convert Practice Grid from 3×3 → 2×4

**File**: `src/components/PracticeSection.jsx` (PracticeSelector)

**Current**:
```javascript
gridTemplateColumns: 'repeat(3, 1fr)',
gap: '16px'
```

**New**:
```javascript
gridTemplateColumns: 'repeat(2, 1fr)',
gap: '24px',
maxWidth: '480px' // Constrain grid width
```

**Reorder PRACTICE_IDS array** to match 2×4 layout:
```javascript
const PRACTICE_IDS_LAYOUT = [
  'breath', 'ritual',
  'cognitive_vipassana', 'somatic_vipassana',
  'visualization', 'cymatics',
  'sound', 'photic'
];
```

**Impact**: 🟢 MINOR — Improves breathing room

---

### TASK 6.2: Increase Avatar Prominence

**File**: `src/App.jsx` (SectionView component)

**Changes**:
- Avatar container: Increase from 280px → 320px diameter
- Margin adjustments for better vertical rhythm

**Impact**: 🟢 MINOR — Matches reference hierarchy

---

## 🔧 PHASE 7: BORDER & STROKE REFINEMENT

### TASK 7.1: Replace ALL Thick Borders with Hairlines

**Global rule**:
- All card borders: `1px solid rgba(213, 168, 75, 0.5)` (golden hairline)
- Remove ALL diffuse glows from borders
- Keep inner highlights only: `inset 0 1px 0 rgba(255, 255, 255, 0.08)`

**Files to update**:
- `src/components/PracticeSection.jsx` (all cards)
- `src/styles/cardMaterial.js` (border definitions)

**Impact**: 🟢 MINOR — Crisp precision

---

## 🎯 IMPLEMENTATION SEQUENCE

**Recommended execution order**:

1. ✅ **PHASE 1 (LIGHT RESTORATION)** — Without this, nothing else matters
2. ✅ **PHASE 2 (COLOR OVERHAUL)** — Establishes correct visual language
3. ✅ **PHASE 3 (TYPOGRAPHY)** — Fundamental aesthetic shift
4. ✅ **PHASE 4 (PRACTICE CARD)** — Core UX refinement
5. ✅ **PHASE 5 (BUTTON)** — Call-to-action polish
6. ✅ **PHASE 6 (LAYOUT)** — Spatial improvements
7. ✅ **PHASE 7 (BORDERS)** — Final detail pass

---

## 📊 SUCCESS CRITERIA

**Visual Verification Checklist**:

- [ ] Cosmic nebula visible through ALL card backgrounds
- [ ] Warm golden accents throughout (no teal except emerald active states)
- [ ] Serif typography on all major labels
- [ ] 2×4 card grid with generous spacing
- [ ] Hairline borders (1px) on all containers
- [ ] Two-line card labels ("BREATH" / "PRACTICES")
- [ ] Subtle breath pattern notation visible
- [ ] Line graph shows single emerald peak glow
- [ ] Duration slider has golden rail + emerald/golden handle
- [ ] "BEGIN PRACTICE" button uses golden text and thin border
- [ ] Avatar is prominent and centered
- [ ] No black void masks blocking background

---

## 🚨 CRITICAL DEPENDENCIES

**Must complete BEFORE starting**:
1. Remove or neutralize black side masks (`App.jsx` lines 291-310)
2. Verify Background component is rendering (check z-index: 0)
3. Add Cinzel or Playfair Display to font imports

**Without these**, subsequent changes will have no visible effect.

---

## 📝 VERSION INCREMENT

**Current**: v3.17.36
**Target**: v3.18.0 (major visual overhaul)

---

## 🔗 REFERENCE ASSETS

**Image 1 (Reference)**: Cosmic glassmorphism with golden serif UI
**Image 2 (Current)**: Opaque teal UI blocking nebula

**Key Visual Differences**:
- Reference shows **visible cosmic particles** through glass
- Reference uses **warm golden palette**, not teal
- Reference has **serif typography** with wide tracking
- Reference uses **2×4 grid**, not 3×3
- Reference has **thin hairline borders**, not thick glows

---

**End of Reference Alignment Plan**
