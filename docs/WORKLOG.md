# Immanence OS — Worklog

## Development Protocol: Architect-Builder Split

This worklog documents all development tasks using a formal Architect-Builder workflow:

- **Claude Code (ARCHITECT)**: Plans implementations, researches codebase, writes task specifications into this worklog. STRICTLY PROHIBITED from modifying `/src` or application code.
- **IDE Agent / VS Code (BUILDER)**: Reads tasks from this worklog, executes code changes, tests implementations, and records completion with timestamps and commit hashes.

### Task Format for IDE Execution

Each task must follow this structure:

```
## YYYY-MM-DD HH:MM - [AGENT] - [STATUS]

**Task**: [Clear description of what to implement]

**Acceptance Criteria**:
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Version bump: v3.X.X

**Files to Modify**:
- `path/to/file1.jsx` — Specific change description
- `path/to/file2.js` — Specific change description

**Files NOT to Modify**: [List any protected files or out-of-scope areas]

**Constraints**: [Any architectural or style constraints]

**Verification Steps**:
1. Run `npm run build` — should complete with no errors
2. [Any other verification commands or manual checks]

**Commit Message**: [Git commit message - concise, action-oriented]

---
```

### Task Status Lifecycle

- **PENDING**: Task written, awaiting builder assignment
- **IN_PROGRESS**: Builder actively working on task
- **BLOCKED**: Builder encountered issue requiring architect clarification
- **COMPLETED**: Builder finished, verified, and committed changes

---

## 2026-01-11 20:49 - Antigravity (Architect) - PENDING

**Task**: PRACTICE SECTION UI COMPLETE REBUILD — From Scratch to Reference Design

**Status**: PENDING (URGENT - REPLACES ALL PREVIOUS UI PLANS)

**CRITICAL NOTE**: All previous UI transformation plans are OBSOLETE. This is a COMPLETE REBUILD from scratch to match the reference design exactly. The builder should treat this as starting fresh on the PracticeSection UI.

---

## 📊 REFERENCE IMAGE ANALYSIS

### Image 1 (Current State) — Problems Identified:

1. **Grid Layout Wrong**: 2-column layout with unequal card sizes (first card larger)
2. **Cards Inconsistent**: Heavy green-tinted glassmorphism clashing with background
3. **Options Panel Cluttered**:
   - 4 circular phase counters with "INHALE", "HOLD 1", "EXHALE", "HOLD 2" labels
   - Complex multi-segment breath path chart
   - Yellow/gold timeline with scattered dot markers
4. **Visual Hierarchy Confused**: Too many competing elements
5. **Missing Light FX**: No subtle glows, no ambient lighting effects

### Image 2 (Target State) — Excellence Points:

1. **Perfect 4×2 Grid**: 8 equal-sized cards in 2 rows of 4
2. **Subtle Glassmorphism**: Cards respect the cosmic background, don't overwhelm it
3. **Minimal Options Panel**:
   - Small gold 4-pointed star icon at top
   - "BREATH & STILLNESS" title in elegant small caps
   - Simple subtitle: "Inhale 4 · Hold 4 · Exhale 4 · Hold 4" (no counters)
   - Clean SVG wave/mountain visualization with teal glow
   - Horizontal duration picker with selected value (10) prominently large
   - Full-width "BEGIN PRACTICE" pill button
4. **Proportional Icons**: Icons sized relative to card dimensions (~28-32px in ~120px card)
5. **Golden Text Glow**: Selected card label has golden luminous text-shadow
6. **Lighting FX**: Subtle ambient glows on active elements, specular highlights

---

## 🎨 COLOR SYSTEM — DUAL-COLOR ARCHITECTURE

### Fixed Colors (Never Change with Theme):

| Token                 | Value                     | Usage                                                                |
| --------------------- | ------------------------- | -------------------------------------------------------------------- |
| `--brand-gold`        | `#D4AF37`                 | Begin Practice button border, selected text glow, decorative accents |
| `--brand-gold-glow`   | `rgba(212, 175, 55, 0.5)` | Text shadows, button glows                                           |
| `--brand-gold-border` | `rgba(201, 169, 97, 0.6)` | Active card borders, panel outlines                                  |
| `--parchment-cream`   | `#F5E6D3`                 | Icon color when selected, highlight text                             |

### Dynamic Colors (Change with Avatar Stage via `--accent-*` CSS vars):

| Token                   | Usage                                    |
| ----------------------- | ---------------------------------------- |
| `var(--accent-primary)` | Breath wave stroke, active state accents |
| `var(--accent-glow)`    | Wave SVG glow filter                     |
| `var(--accent-40)`      | Subtle background tints                  |
| `var(--text-accent)`    | Secondary highlighted text               |

### Color Application Rules:

1. **Selected Card**: Gold border (`--brand-gold-border`), gold text glow (`--brand-gold-glow`)
2. **Inactive Cards**: White/8% border, no glow
3. **Breath Wave SVG**: Stroke uses `var(--accent-primary)`, glow filter uses `var(--accent-glow)`
4. **Begin Practice Button**: Gold border (`--brand-gold-border`), gold text (`--brand-gold`)
5. **Icons**: Inactive = `rgba(255, 255, 255, 0.4)`, Active = `#D4AF37` (brand gold)

### Stage-to-Accent Color Mapping (from AVATAR_SYSTEM.md):

The `--accent-*` CSS variables are set by `ThemeContext.jsx` based on the current avatar stage:

| Stage        | `--accent-primary`      | `--accent-glow`            | Notes                    |
| ------------ | ----------------------- | -------------------------- | ------------------------ |
| **SEEDLING** | `#D4AF37` (Gold)        | `rgba(212, 175, 55, 0.4)`  | Warm gold, matches brand |
| **EMBER**    | `#f97316` (Orange)      | `rgba(249, 115, 22, 0.4)`  | Warm, awakening          |
| **FLAME**    | `#fcd34d` (Yellow-Gold) | `rgba(252, 211, 77, 0.4)`  | Bright, purposeful       |
| **BEACON**   | `#22d3ee` (Cyan)        | `rgba(34, 211, 238, 0.4)`  | Crystalline, precision   |
| **STELLAR**  | `#a78bfa` (Violet)      | `rgba(167, 139, 250, 0.4)` | Iridescent, cosmic       |

**Critical Rule**: The breath wave SVG and other accent-colored elements must use `var(--accent-primary)` NOT hardcoded colors, so they automatically transition when user's avatar stage changes.

**Gold Remains Constant**: Brand gold (`#D4AF37`, `#C9A961`) is used for buttons, borders, and selected text glow — these do NOT change with stage. Only the accent (wave stroke, secondary highlights) changes.

---

## 🔲 PHASE 1: PRACTICE GRID CARDS REBUILD

### Task 1.1: Create Equal-Size Grid Layout

**File**: `src/components/PracticeSection.jsx` — `PracticeSelector` function

**Current State**:

```javascript
gridTemplateColumns: 'repeat(2, 1fr)',
maxWidth: isSanctuary ? '520px' : '440px',
```

**Target State**:

```javascript
gridTemplateColumns: 'repeat(4, 1fr)',
maxWidth: isSanctuary ? '580px' : '480px',
gap: '16px',
```

**Changes**:

1. Grid columns: `repeat(2, 1fr)` → `repeat(4, 1fr)` (4 cards per row)
2. Reduce card min-height for denser grid
3. Add `aspect-ratio: 1 / 1.1` for consistent proportions

---

### Task 1.2: Proportional Icon Sizing

**Current State**: Icons have fixed `fontSize: '28px'`

**Target State**: Icons should be ~24% of card height

**Changes**:

```javascript
// Icon container
fontSize: isSanctuary ? '28px' : '24px',
marginBottom: '8px',
```

**Icon Proportionality Rule**:

- Card height ~105px → Icon ~24px
- Card height ~120px → Icon ~28px

---

### Task 1.3: Golden Glow on Selected Text

**Current State**: Active card just has accent color text, no glow

**Target State**: Selected card label has luminous golden text-shadow

**Changes** (in card button style):

```javascript
// When isActive
color: '#D4AF37',
textShadow: isActive
  ? '0 0 12px rgba(212, 175, 55, 0.6), 0 0 24px rgba(212, 175, 55, 0.3)'
  : 'none',
```

---

### Task 1.4: Card Border Lighting FX

**Current State**:

```javascript
border: isActive ? '1.5px solid #C9A961' : '1px solid rgba(255, 255, 255, 0.12)',
boxShadow: isActive ? '0 0 24px rgba(201, 169, 97, 0.5)...' : 'inset 0 1px 0...',
```

**Target State**: More refined lighting

**Changes**:

```javascript
// Active state
border: '1.5px solid rgba(201, 169, 97, 0.7)',
boxShadow: `
  0 0 16px rgba(212, 175, 55, 0.4),
  0 0 32px rgba(212, 175, 55, 0.15),
  inset 0 1px 0 rgba(255, 255, 255, 0.2)
`,

// Inactive state
border: '1px solid rgba(255, 255, 255, 0.08)',
boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.04)',
```

---

### Task 1.5: Card Background Refinement

**Current State**:

```javascript
background: 'rgba(10, 15, 15, 0.25)',
backdropFilter: 'blur(40px) saturate(150%)',
```

**Target State**: Slightly more transparent to show cosmic background

**Changes**:

```javascript
background: 'rgba(15, 20, 25, 0.2)',
backdropFilter: 'blur(32px) saturate(140%)',
WebkitBackdropFilter: 'blur(32px) saturate(140%)',
```

---

## 🎴 PHASE 2: PRACTICE OPTIONS CARD REBUILD

### Task 2.1: Simplified Header

**Current State**: Large icon (5xl), title, sometimes subtitle

**Target State**: Small decorative star, elegant title, inline subtitle

**Changes** in `PracticeOptionsCard`:

```javascript
// Header section
<div
  className="flex flex-col items-center text-center"
  style={{ marginTop: "20px", marginBottom: "16px" }}
>
  {/* Small decorative star */}
  <div
    style={{
      fontSize: "18px",
      color: "#D4AF37",
      textShadow: "0 0 8px rgba(212, 175, 55, 0.5)",
      marginBottom: "16px",
    }}
  >
    ✦
  </div>

  {/* Title with proper typography */}
  <h2
    style={{
      fontFamily: "var(--font-display)",
      fontSize: "16px",
      fontWeight: 600,
      letterSpacing: "0.12em",
      textTransform: "uppercase",
      color: "#F5E6D3",
      marginBottom: "8px",
    }}
  >
    {p.label}
  </h2>

  {/* Inline subtitle for breath */}
  {practiceId === "breath" && (
    <div
      style={{
        fontFamily: "var(--font-body)",
        fontSize: "12px",
        fontWeight: 400,
        letterSpacing: "0.04em",
        color: "rgba(245, 230, 211, 0.55)",
      }}
    >
      Inhale {pattern?.inhale || 4} · Hold {pattern?.hold1 || 4} · Exhale{" "}
      {pattern?.exhale || 4} · Hold {pattern?.hold2 || 4}
    </div>
  )}
</div>
```

---

### Task 2.2: Replace BreathPhaseIndicator + BreathPathChart

**Current State**:

- `BreathPhaseIndicator` = 4 circular counters with labels
- `BreathPathChart` = Multi-segment chart with phase labels

**Target State**:

- Remove `BreathPhaseIndicator` entirely
- Replace `BreathPathChart` with new `BreathWaveVisualization` component

**Create New File**: `src/components/BreathWaveVisualization.jsx`

```javascript
// Simple SVG wave with accent-colored stroke and glow
// 3 peaks representing breath cycles
// Stroke color: var(--accent-primary)
// Glow: filter with var(--accent-glow)
// Subtle gradient from center outward
```

**SVG Specifications**:

- Width: 100% of container
- Height: 80-100px
- Stroke: 2px, `var(--accent-primary)`
- Filter: `drop-shadow(0 0 6px var(--accent-glow))`
- Path: Smooth bezier curves forming 2.5-3 wave peaks
- Opacity: 0.8 for subtle integration

---

### Task 2.3: Replace SacredTimeSlider with Horizontal Picker

**Current State**: Linear track with golden rail and dots

**Target State**: Horizontal number picker where selected value is larger and centered

**Create New Component**: `DurationPicker.jsx` or modify `SacredTimeSlider.jsx`

**Visual Specifications**:

```
←  5 — 7 — 10 — [10] — 25 — 30 — 45 →
           small  LARGE  small
```

- Selected value: `fontSize: '32px'`, `fontWeight: 700`, `color: '#F5E6D3'`
- Adjacent values: `fontSize: '14px'`, `opacity: 0.5`
- Far values: `fontSize: '12px'`, `opacity: 0.3`
- Left/right of selected: Glowing dot indicator using `var(--accent-primary)`

---

### Task 2.4: Begin Practice Button Restyling

**Current State**:

```javascript
background: 'rgba(0, 0, 0, 0.4)',
border: '1.5px solid #C9A961',
color: '#D4AF37',
```

**Target State**: Full-width pill with refined lighting

**Changes**:

```javascript
<button
  style={{
    width: "100%",
    maxWidth: "280px",
    fontFamily: "var(--font-display)",
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    padding: "14px 32px",
    borderRadius: "32px",
    background: "rgba(0, 0, 0, 0.35)",
    backdropFilter: "blur(16px)",
    border: "1.5px solid rgba(201, 169, 97, 0.6)",
    color: "#D4AF37",
    boxShadow: `
      0 0 20px rgba(201, 169, 97, 0.25),
      0 4px 16px rgba(0, 0, 0, 0.4),
      inset 0 1px 0 rgba(255, 255, 255, 0.15)
    `,
    transition: "all 200ms ease",
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.boxShadow = `
      0 0 32px rgba(201, 169, 97, 0.4),
      0 4px 20px rgba(0, 0, 0, 0.5),
      inset 0 1px 0 rgba(255, 255, 255, 0.25)
    `;
    e.currentTarget.style.borderColor = "rgba(212, 175, 55, 0.8)";
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.boxShadow = `
      0 0 20px rgba(201, 169, 97, 0.25),
      0 4px 16px rgba(0, 0, 0, 0.4),
      inset 0 1px 0 rgba(255, 255, 255, 0.15)
    `;
    e.currentTarget.style.borderColor = "rgba(201, 169, 97, 0.6)";
  }}
>
  Begin Practice
</button>
```

---

## 📦 PHASE 3: OPTIONS PANEL CONTAINER

### Task 3.1: Panel Border & Background

**Current State**: `.machined-panel` class with heavy styling

**Target State**: Single refined border with subtle inner glow

**Changes**:

```javascript
// Panel container
style={{
  background: 'rgba(10, 15, 20, 0.25)',
  backdropFilter: 'blur(24px)',
  border: '1px solid rgba(201, 169, 97, 0.35)',
  borderRadius: '16px',
  boxShadow: `
    0 8px 32px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.1)
  `,
}}
```

---

## 🧹 PHASE 4: COMPONENT CLEANUP

### Task 4.1: Remove Deprecated Components

**Files to DELETE or DEPRECATE**:

- `src/components/BreathPhaseIndicator.jsx` — No longer needed (subtitle replaces it)
- Keep `src/components/BreathPathChart.jsx` but mark as deprecated

### Task 4.2: Create New Components

**Files to CREATE**:

- `src/components/BreathWaveVisualization.jsx` — Clean SVG wave
- Optionally `src/components/DurationPicker.jsx` — Horizontal number picker

---

## ✅ ACCEPTANCE CRITERIA

### Visual Checklist:

- [ ] Practice grid shows 4 cards per row (4×2 layout for 8 practices)
- [ ] All cards are equal size with consistent aspect ratio
- [ ] Icons are proportional to card size (~24% of height)
- [ ] Selected card has golden text glow (luminous text-shadow)
- [ ] Selected card has golden border with outer glow
- [ ] Inactive cards have subtle white border, no glow
- [ ] Options panel has small ✦ star icon at top
- [ ] Title uses elegant small caps typography
- [ ] Subtitle shows "Inhale X · Hold X · Exhale X · Hold X" (no counter circles)
- [ ] Breath visualization is a clean wave SVG with accent-colored glow
- [ ] Duration picker shows selected value larger/prominent
- [ ] Begin Practice button is full-width pill with golden border
- [ ] Cosmic background visible through all glassmorphic elements
- [ ] Version bump: v3.19.0

### Technical Checklist:

- [ ] `npm run build` completes with no errors
- [ ] No console errors in browser
- [ ] Works at 320px (Hearth) and 1080px (Sanctuary) viewports
- [ ] Accent colors change correctly when avatar stage changes (test with DevPanel)

---

## 📁 FILES TO MODIFY

### Primary Changes:

- `src/components/PracticeSection.jsx` — Complete rebuild of PracticeSelector and PracticeOptionsCard
- `src/components/SacredTimeSlider.jsx` — Restyle for horizontal picker look

### New Files:

- `src/components/BreathWaveVisualization.jsx` — New SVG wave component

### Deprecate/Remove:

- `src/components/BreathPhaseIndicator.jsx` — Remove usage
- `src/components/BreathPathChart.jsx` — Replace with BreathWaveVisualization

### Style Updates:

- `src/App.css` — Add `--brand-gold`, `--brand-gold-glow`, `--brand-gold-border` CSS vars if not present
- `src/App.jsx` — Version bump to v3.19.0

---

## 🚫 FILES NOT TO MODIFY

- `src/components/Avatar.jsx` — PROTECTED
- `src/components/avatar/*` — Avatar system is frozen
- `src/state/*` — No state changes needed
- `src/theme/stageColors.js` — Accent colors already correct

---

## 🔧 CONSTRAINTS

1. **Use CSS Variables**: All accent colors must use `var(--accent-*)` tokens, not hardcoded values
2. **Gold is Constant**: Brand gold (`#D4AF37`, `#C9A961`) never changes with stage
3. **No Heavy Blurs**: Keep backdrop-filter ≤ 32px
4. **Proportional Sizing**: Icons, text, and spacing must scale with container
5. **Lighting FX Required**: Every active/selected state must have glow effects
6. **Single-line Edits**: Builder should make incremental changes, verify each step

---

## 📋 VERIFICATION STEPS

1. `npm run build` — Must complete with no errors
2. `npm run dev` — Start dev server
3. Open http://localhost:5175/Immanence/
4. Navigate to Practice section
5. **Visual Verification**:
   - Screenshot at 1080px width
   - Compare against reference Image 2
   - Check: 4×2 grid, golden glows, proportional icons, wave visualization
6. **Theme Verification**:
   - Open DevPanel (Ctrl+Shift+D)
   - Switch avatar stage (Seedling → Ember → Flame → Beacon → Stellar)
   - Verify: Wave SVG stroke color changes, accent colors transition smoothly
   - Verify: Gold elements (borders, button text) remain constant

---

## 💬 COMMIT MESSAGE

```
feat(practice): Complete UI rebuild matching reference design

- Implement 4×2 equal-size card grid for practice selector
- Add golden text glow on selected cards with lighting FX
- Make icons proportional to card dimensions
- Replace breath phase counters with inline subtitle
- Create BreathWaveVisualization SVG with accent-colored glow
- Restyle duration picker with prominent selected value
- Refine Begin Practice button with golden border and glow
- Ensure accent colors are theme-aware (change with avatar stage)
- Maintain constant brand-gold for borders and buttons

Version: v3.19.0

🤖 Generated with Antigravity
```

---

## 2026-01-11 - Claude Code (Architect) - OBSOLETE (DO NOT EXECUTE)

**Task**: ~~SOMA AESTHETIC OVERHAUL~~ - Practice Section UI Refinement

**Status**: ~~ARCHITECTURAL PLANNING~~ **OBSOLETE - REPLACED BY REFERENCE ALIGNMENT PLAN**

**Objective**: Transform PracticeSection UI from current soft/glowing aesthetic to precision-machined, glass-capsule design language matching the Soma reference image.

---

### GAP ANALYSIS: Current vs. Soma Reference

#### 1. MATERIALITY GAP

**Current State:**

- Practice selector buttons: `backdropFilter: 'blur(12px)'`
- Cards using `plateauMaterial`: `blur(24px)` with soft `rgba` borders
- Begin Practice button: Heavy gradient glow (`boxShadow: 0 0 48px`)
- Inconsistent border weights (1-2px variable)

**Soma Target:**

- **20px+ backdrop blur** for true frosted-glass depth
- **1px hairline borders** throughout (non-negotiable)
- **Machined precision**: Hard edges, vector paths, no soft glows
- **Glass capsule containers**: Defined frames with crisp separations

**Required Changes:**

- Increase `backdropFilter` from 12-24px → **28-32px** globally
- Standardize all borders to **exactly 1px**
- Remove all glow-based `boxShadow` values
- Replace with structural shadows only (depth, not luminance)

---

#### 2. TYPOGRAPHY & SPACING GAP

**Current State:**

- `letterSpacing: '0.02em'` (too tight)
- Font weights: Mix of 700 (too heavy for display)
- Inconsistent capitalization handling
- Labels lack geometric precision

**Soma Target:**

- **Letter spacing: -0.05em to 0.08em** (wider, breathable)
- **Font family: Montserrat or Inter** (geometric sans-serif)
- **Weight: 500-600** for labels, **700 only for emphasis**
- **Uppercase labels**: Small-caps-like rendering (10-11px, tracked out)

**Required Changes:**

- Update `fontFamily` to `'Montserrat, Inter, Outfit, sans-serif'`
- Adjust `letterSpacing` to `'0.08em'` for uppercase labels
- Reduce `fontWeight` from 700 → 600 for non-emphasized text
- Verify `textTransform: 'uppercase'` consistently applied

---

#### 3. BEGIN PRACTICE BUTTON GAP (CRITICAL)

**Current State (PracticeSection.jsx:360-380):**

```javascript
background: `linear-gradient(180deg, ${tokens.accent} 0%, ${tokens.accent}DD 100%)`,
boxShadow: `0 0 48px ${accent}90, 0 0 28px ${accent}70, 0 8px 24px rgba(0,0,0,0.6)`,
```

- **Problem**: Diffuse glow, gradient fill, lacks solidity
- **Visual effect**: Floaty, soft, "magic button" aesthetic
- **Missing**: High-specular reflection, geometric precision

**Soma Target:**

- **Solid emerald light-source**: `#00A382` (flat fill, no gradient)
- **High-specular glow**: Single tight halo (8-16px radius max)
- **Machined button**: Crisp 1px border, subtle inner highlight
- **Hover state**: Brightness shift, NOT scale transform

**Required Changes:**

```javascript
// REPLACE gradient with solid fill
background: '#00A382',

// REPLACE multi-layer glow with single specular highlight
boxShadow: `
  0 0 24px rgba(0, 163, 130, 0.6),        // Tight specular
  0 4px 16px rgba(0, 0, 0, 0.4),           // Depth shadow
  inset 0 1px 0 rgba(255, 255, 255, 0.25)  // Top highlight
`,

// ADD crisp border
border: '1px solid rgba(255, 255, 255, 0.3)',

// MODIFY hover (remove scale, add brightness)
// Current: hover:scale-105 active:scale-95
// Target: filter: brightness(1.15) on hover
```

---

#### 4. PRACTICE SELECTOR CARDS GAP

**Current State (PracticeSection.jsx:145-200):**

- Active border: `2px solid ${tokens.accent}`
- Inactive opacity: 0.7
- Hover transform: `translateY(-2px)`
- Background blur: 12px

**Soma Target:**

- **All borders: 1px** (active uses accent color, inactive uses white/10%)
- **Inactive opacity: 0.85** (less dramatic dimming)
- **No Y-axis movement** (stability over animation)
- **Background blur: 28px** (deeper glass effect)

**Required Changes:**

```javascript
// Active border
border: `1px solid ${tokens.accent}`,

// Inactive border
border: '1px solid rgba(255, 255, 255, 0.1)',

// Backdrop blur
backdropFilter: 'blur(28px)',
WebkitBackdropFilter: 'blur(28px)',

// Remove translateY on hover
// DELETE: e.currentTarget.style.transform = 'translateY(-2px)';

// Adjust inactive opacity
opacity: isActive ? 1 : 0.85,
```

---

#### 5. CONTAINER & LAYOUT PRECISION

**Current State:**

- Mixed padding values (12px, 16px, 20px, 24px)
- Inconsistent gap spacing in grids
- Border radius varies (10px, 12px, 16px)

**Soma Target:**

- **8px grid system**: All spacing in multiples of 8 (8, 16, 24, 32)
- **Border radius: 12px** universally (except special cases)
- **Grid gaps: 16px** (consistent breathing room)

**Required Changes:**

- Audit all `padding`, `margin`, `gap` values
- Round to nearest multiple of 8
- Standardize `borderRadius: '12px'`

---

### IMPLEMENTATION PLAN (Builder-Ready Tasks)

---

#### TASK 1: Update Global Card Material System

**File**: `src/styles/cardMaterial.js`

**Changes:**

1. Update `plateauMaterial.backdropFilter` from `'blur(24px)'` → `'blur(32px)'`
2. Update `plateauMaterialElevated.backdropFilter` from `'blur(28px)'` → `'blur(36px)'`
3. Verify all `boxShadow` values use **depth shadows only**, no accent glows
4. Update `plateauMaterialLight.backdropFilter` from `'blur(8px)'` → `'blur(20px)'`

**Definition of Done:**

- All material variants use 20px+ blur
- No `boxShadow` contains accent color variables
- Light mode has comparable blur depth to dark mode

---

#### TASK 2: Refine Practice Selector Cards

**File**: `src/components/PracticeSection.jsx`

**Target Lines**: 145-200 (PracticeSelector component)

**Changes:**

1. **Line 174**: Change `border: isActive ? '2px solid...'` → `border: isActive ? '1px solid...'`
2. **Line 174**: Change inactive border from `1px solid ${inactiveBorder}` → keep at 1px
3. **Line 179**: Update `backdropFilter: 'blur(12px)'` → `'blur(28px)'`
4. **Line 181**: Change `opacity: isActive ? 1 : inactiveOpacity` where `inactiveOpacity = 0.7` → `0.85`
5. **Line 166**: Add `fontFamily: 'Montserrat, Inter, Outfit, sans-serif'`
6. **Line 168**: Change `letterSpacing: '0.02em'` → `'0.08em'`
7. **Line 170**: Change `fontWeight: 700` → `600`
8. **Lines 192**: REMOVE `e.currentTarget.style.transform = 'translateY(-2px)'`
9. **Lines 200**: REMOVE `e.currentTarget.style.transform = 'translateY(0)'`

**Definition of Done:**

- All selector cards have exactly 1px borders
- Active cards glow with accent color via border only
- Inactive cards at 85% opacity with 28px blur
- No vertical movement on hover
- Typography uses Montserrat with 0.08em tracking

---

#### TASK 3: Transform Begin Practice Button

**File**: `src/components/PracticeSection.jsx`

**Target Lines**: 360-380

**Changes:**

1. **Line 364**: REPLACE `background: linear-gradient(180deg, ${tokens.accent}...)`
   WITH `background: '#00A382'`
2. **Line 367**: REPLACE multi-layer boxShadow with:
   ```javascript
   boxShadow: `
     0 0 24px rgba(0, 163, 130, 0.6),
     0 4px 16px rgba(0, 0, 0, 0.4),
     inset 0 1px 0 rgba(255, 255, 255, 0.25)
   `;
   ```
3. **Line 372**: ADD `border: '1px solid rgba(255, 255, 255, 0.3)'`
4. **Line 366**: Change `fontFamily` → `'Montserrat, Inter, Outfit, sans-serif'`
5. **Line 370**: Change `letterSpacing: '0.02em'` → `'0.05em'`
6. **Line 362**: MODIFY hover behavior:
   - Remove `hover:scale-105 active:scale-95` classes
   - Add inline hover handler with `filter: brightness(1.15)`

**Hover Handler Addition (after line 362):**

```javascript
onMouseEnter={(e) => {
  e.currentTarget.style.filter = 'brightness(1.15)';
}}
onMouseLeave={(e) => {
  e.currentTarget.style.filter = 'brightness(1)';
}}
```

**Definition of Done:**

- Button uses solid `#00A382` fill (no gradient)
- Glow is tight and specular (24px max radius)
- 1px white border with inner highlight
- Hover brightens, does not scale
- Typography uses Montserrat with wider tracking

---

#### TASK 4: Standardize Spacing & Border Radius

**File**: `src/components/PracticeSection.jsx`

**Scope**: Entire file

**Changes:**

1. Audit all `padding` values, round to multiples of 8:
   - `padding: '20px 12px'` → `'24px 16px'`
   - `padding: '16px 10px'` → `'16px 8px'`
2. Audit all `margin` values, round to multiples of 8:
   - `marginBottom: '28px'` → `'24px'` or `'32px'`
3. Standardize all `borderRadius` to `'12px'` (except Begin Practice button: `'10px'` → `'12px'`)
4. Grid gaps: Verify all `gap-4` (16px) or adjust to 16px inline

**Definition of Done:**

- All padding/margin in multiples of 8
- All border radius = 12px (universally)
- Grid gaps = 16px consistently

---

#### TASK 5: Typography Audit & Geometric Font Stack

**File**: `src/components/PracticeSection.jsx`

**Scope**: All text elements

**Changes:**

1. Replace all `fontFamily: 'Inter, Outfit, sans-serif'` with:
   `'Montserrat, Inter, Outfit, sans-serif'`
2. Verify `letterSpacing` on uppercase labels = `'0.08em'` minimum
3. Reduce `fontWeight: 700` to `600` for non-button text
4. Ensure `textTransform: 'uppercase'` on all section labels

**Definition of Done:**

- Montserrat is first in font stack
- All uppercase labels have 0.08em+ tracking
- Weight 700 only on "Begin Practice" button
- Visual hierarchy clear through weight + spacing

---

#### TASK 6: Remove Soft Glow from Inactive States

**File**: `src/components/PracticeSection.jsx`

**Target**: Lines 138-144 (inactive glow definitions)

**Changes:**

1. **Line 138-140**: Update `inactiveGlow` to remove diffuse shadows:
   ```javascript
   // Dark mode
   const inactiveGlow = isLight
     ? "0 2px 8px rgba(60, 50, 35, 0.08)"
     : "0 4px 12px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)";
   ```
2. **Line 141-144**: Update `hoverGlow` to structural only:
   ```javascript
   const hoverGlow = isLight
     ? "0 4px 12px rgba(60, 50, 35, 0.12)"
     : "0 6px 16px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.08)";
   ```

**Definition of Done:**

- Inactive shadows suggest depth, not luminance
- No soft outer glow on cards
- Inner highlights remain for glass effect

---

#### TASK 7: Sacred Duration Slider Label Refinement

**File**: `src/components/PracticeSection.jsx`

**Target**: Line 346

**Changes:**

1. **Line 346**: Update label styling:
   ```javascript
   className="uppercase text-center"
   style={{
     color: tokens.text,
     marginBottom: practiceId === 'breath' ? '16px' : '24px',
     letterSpacing: '0.1em',    // Was 0.3em (too wide)
     fontSize: '10px',
     fontWeight: 600,            // Was implicit
     fontFamily: 'Montserrat, Inter, Outfit, sans-serif',
     opacity: 0.6                // Was 0.5 (too dim)
   }}
   ```

**Definition of Done:**

- Label uses Montserrat font
- Tracking reduced from 0.3em → 0.1em (more readable)
- Opacity increased to 0.6 (better legibility)
- Font weight explicitly set to 600

---

#### TASK 8: Verification & Cross-Browser Testing

**Scope**: Visual regression check

**Steps:**

1. Build production bundle: `npm run build`
2. Preview: `npm run preview`
3. Test viewports:
   - **320px mobile** (minimum width)
   - **1080px desktop** (Hearth mode)
   - **1366px desktop** (Sanctuary mode)
4. Verify in browsers:
   - Chrome/Edge (Chromium)
   - Firefox
   - Safari (if available)

**Verification Checklist:**

- [ ] Practice selector cards have 1px borders (not 2px)
- [ ] Backdrop blur is visually deeper (28-32px range)
- [ ] Begin Practice button is solid emerald, not gradient
- [ ] Button glow is tight and specular (not diffuse)
- [ ] No vertical movement on card hover
- [ ] Typography is crisp with wider tracking
- [ ] All spacing multiples of 8px
- [ ] Border radius = 12px throughout
- [ ] Light mode has comparable blur depth

**Definition of Done:**

- All checklist items verified
- Screenshots captured at 320px, 1080px, 1366px
- No regressions in practice session UX

---

### VERSION INCREMENT

**File**: `src/App.jsx`

**Current Version**: v3.16.7
**New Version**: v3.17.0 (minor bump for UI overhaul)

**Change Location**: Line ~369

**Before:**

```javascript
const VERSION = "v3.16.7";
```

**After:**

```javascript
const VERSION = "v3.17.0";
```

---

### DESIGN TOKENS REFERENCE

For Builder context, the target aesthetic uses these values:

**Colors:**

- Emerald CTA: `#00A382`
- Glass border (dark): `rgba(255, 255, 255, 0.1)`
- Glass border (light): `rgba(60, 50, 35, 0.15)`
- Inner highlight: `rgba(255, 255, 255, 0.25)`

**Blur:**

- Standard cards: `28px`
- Elevated cards: `36px`
- Light mode minimum: `20px`

**Typography:**

- Font stack: `Montserrat, Inter, Outfit, sans-serif`
- Label tracking: `0.08em` (uppercase)
- Body tracking: `0.02em - 0.05em`
- Weight: 600 (labels), 700 (CTA only)

**Spacing Grid:**

- Base unit: `8px`
- Valid values: 8, 16, 24, 32, 40, 48, 56, 64

**Borders:**

- Standard: `1px solid`
- No exceptions (was previously 2px on active states)

---

### PHILOSOPHICAL ALIGNMENT CHECK

This overhaul aligns with the **Immanence OS design philosophy**:

✅ **"High-tech HUD over cosmic chaos"** - Precision UI, not soft/mystical
✅ **"Machined, not magic"** - Glass and metal, not glowing orbs
✅ **"One dominant visual anchor"** - Begin Practice button as emerald light-source
✅ **"Local quiet zones"** - Glass capsules with defined boundaries
✅ **"Compressed luminance"** - Lifted blacks, capped highlights, structural shadows

The current "soft glow" aesthetic contradicts the instrument-like precision required for contemplative practice. This overhaul restores visual authority.

---

## 2026-01-09 11:45 - Gemini - COMPLETED

**Task**: Implement Final Avatar Container+Core Layering Spec

**Files Modified**:

- `src/components/avatar/OrbCore.jsx`: Major refactor of layer order (Frame moved to top Z:10, Core Assembly at Z:5).
- `src/App.jsx`: Version bump v3.16.7.
- `docs/AVATAR_CONTAINER_CORE_SPEC.md`: Created formal specification.

**Changes**:

- **Layering**: Implemented strict Bottom-up order: Background -> Shadow -> Core (Masked) -> Glass -> Frame.
- **Visuals**:
  - Frame is now the topmost "Container" (opacity/blend modes unaffected, just Z-sorting).
  - Core is masked by a `div` simulating `avatar_container_mask`.
  - Glass (Lens+Highlight) sits _inside_ the core assembly but _above_ the core asset.
- **Instrument Ring**: Moved to Z:6 (between Core and Frame) for depth.
- **Spec**: Formalized the immutable Container vs. Swappable Core architecture.

**Version**: v3.16.7

**Status**: COMPLETED

---

## 2026-01-09 11:35 - Gemini - COMPLETED

**Task**: Fix Missing Avatar Gem Asset (Light Mode)

**Files Modified**:

- `src/components/avatar/StaticSigilCore.jsx`: Added logic to resolve correct `gemSrc` URL (using `stage_path_attention` format) and pass it to `OrbCore`.
- `src/App.jsx`: Version bump v3.16.6.

**Changes**:

- **Asset Resolution**: `OrbCore` was previously receiving no `gemSrc`, defaulting to empty glass container. Now it correctly calculates the jewel asset path (e.g., `seedling_soma_ekagrata.png`).
- **Defaulting**: Defaults to `dhyana_ekagrata` (Symmetric) when in "Core" mode or no path is selected.
- **Visual Fix**: This ensures the generated Jewel Authority assets actually appear inside the orb vessel.

**Version**: v3.16.6

**Status**: COMPLETED

---

## 2026-01-09 11:15 - Gemini - COMPLETED

**Task**: Boost Avatar Visibility (Correction)

**Files Modified**:

- `src/components/avatar/OrbCore.jsx`: Increased axis intensity, switched to 'overlay' blend, widened mask, aggressively reduced lens opacity.
- `src/App.css`: Updated `axis-breathe` to oscillate 0.4->0.8 opacity + scale pulse.
- `src/App.jsx`: Version bump v3.16.5.

**Changes**:

- **Axis Visibility**: Switched from `screen` to `overlay`, increased opacity range (0.4-0.8), widened mask to 80%.
- **Fog Removal**: Reduced Optical Lens opacity to 0.15 (was 0.4) and Shadow to 0.3 (was 0.4).
- **Motion**: Added slight `scaleX` breathing to the axis animation for organic feel.

**Version**: v3.16.5

**Status**: COMPLETED

---

## 2026-01-09 11:05 - Gemini - COMPLETED

**Task**: Refine Avatar Orb Polishing (Axis, Motion, Clarity)

**Files Modified**:

- `src/components/avatar/OrbCore.jsx`: Added internal axis, slow breathing motion, reduced lens opacity.
- `src/App.css`: Added `axis-breathe` and `breathingPulse` keyframes.
- `src/App.jsx`: Version bump to v3.16.4.

**Changes**:

- **Internal Axis**: Added a vertical spine with gradient and mask (Step 1).
- **Motion**: Added `axis-breathe` animation (10s cycle) to the axis (Step 2).
- **Clarity**: Reduced transparency of Optical Lens (0.8 -> 0.4) and Shadow (0.6 -> 0.4) to remove "misty" look (Step 3).
- **Scalability**: Added configuration logic for axis type/intensity/pulse to `variantProps`.

**Version**: v3.16.4

**Status**: COMPLETED

**Notes**:

- `breathingPulse` was missing from `App.css` but used in `AvatarContainer.jsx`, so I added it to ensure consistency.
- The axis is parameterized for future variants (e.g., horizontal, radial).

---

## 2026-01-08 — Light Mode Avatar System Implementation

### Summary

Implemented complete light mode orb-based avatar system with crossfade animation, replacing the sigil-based rendering for light mode while preserving dark mode functionality.

### Asset Generation

- **Generated via ComfyUI MCP**: Created new avatar assets with parchment-compatible aesthetic
  - Orb loop frames (8 generated, 4 kept): `orb_loop_light_0003–0006.png`
  - Particle frames (8 generated, 3 kept): `orb_particles_light_0003–0005.png`
  - Frame ring: `avatar_frame_light.png`
  - Instrument ring: `avatar_instrument_light.png`
  - Glow layer: `orb_glow_light.png`
- **Asset Processing**: Created Python scripts for transparency processing and composite verification
  - `tools/bulk_process_transparency.py`: Batch converts black backgrounds to alpha
  - `tools/verify_composite.py`: Generates test composites for validation
  - `tools/final_composite_test.py`: Creates final 320×320 and 96×96 test renders
- **Asset Pruning**: Removed rejected frames based on style criteria
  - Discarded orb frames 0001–0002 (too cloudy/dull), 0007–0008 (too dark/murky)
  - Discarded particle frames 0001–0002, 0006–0008 (too visible/distracting)
  - Deleted all preview assets (parchment background versions)

### Component Implementation

- **Created `src/components/avatar/OrbCore.jsx`**:
  - Crossfade animation system for orb loop (4 frames, 14s cycle)
  - Particle layer with offset timing (3 frames, 21s cycle, 2s offset)
  - Instrument ring with 120s CSS rotation
  - Static glow layer with reduced opacity
  - Reduced mode support for Sakshi/Vipassana practices
  - Circular clipping wrapper to eliminate transparency artifacts
- **Modified `src/components/avatar/StaticSigilCore.jsx`**:
  - Added conditional rendering: OrbCore for light mode, sigil for dark mode
  - Imported and integrated OrbCore component
- **Modified `src/components/vipassana/MiniAvatar.jsx`**:
  - Updated to use reduced OrbCore (96×96) for light mode
  - Preserved simple circle design for dark mode
- **Modified `src/components/Avatar.css`**:
  - Added `@keyframes instrumentRotate` for instrument ring animation

### Animation Specifications

**Full Mode:**

- Orb loop: 4-frame crossfade, 14s total (3.5s/frame), 1000ms ease-in-out fade
- Particles: 3-frame crossfade, 21s total (7s/frame), 1200ms ease-in-out fade, 2s offset, opacity 0.22
- Instrument ring: 120s linear rotation, opacity 0.18
- Glow: Static, opacity 0.18, 96% scale, positioned behind orb (z-index: 1)

**Reduced Mode (Sakshi/Vipassana):**

- Orb loop only (same 4 frames)
- Frame ring only
- No instrument ring, particles, or glow

### Critical Fixes Applied

1. **Circular Clipping Wrapper**: Added `border-radius: 50%` + `overflow: hidden` wrapper around all orb layers to eliminate checkerboard transparency artifacts
2. **Glow Repositioning**: Moved glow behind orb (z-index: 1 vs orb z-index: 2), reduced opacity from 0.35 → 0.18, scaled to 96%
3. **Orb Sizing**: Reduced orb diameter from 235px → 228px (7px reduction) to maintain 12px gap with frame ring

### Proportions (320×320 container)

- Frame outer: 302px (94.375%)
- Instrument ring: 270px (84.375%)
- Orb diameter: 228px (71.25%)
- Gap (orb ↔ frame): ~12px

### Performance Guardrails

- Opacity and transform only (no layout-affecting properties)
- CSS-based animations (React state only for frame swapping)
- No blur animations
- Pauses during practice (`isPracticing === true`)
- Total animated layers: 3 (orb loop, particles, instrument ring)

### Style Compliance

- **Aesthetic**: Parchment-compatible, contemplative, refined, instrument-like
- **Mood**: Calm, ancient, intentional
- **Surface language**: Ceramic, stone, glass, ink, patina
- **Lighting**: Soft ambient, no hard rim glow
- **Color saturation**: Restrained, earthy, mineral-based (muted teal/jade tones)

### Photic Circles UI Cleanup

- **Removed instruction text**: Deleted "Tap to exit • Drag to adjust spacing" overlay text
- **Pure black background**: Changed from `rgba(0, 0, 0, 0.95)` to `#000000` for clean interface

### Documentation

- **Created `docs/AVATAR_ANIMATION_IMPLEMENTATION.md`**: Comprehensive documentation of animation system, asset specifications, layer stack, and performance guardrails
- **Updated `docs/ARCHITECTURE.md`**: (Pending) Add Avatar System section documenting dual-mode rendering

### Files Modified

**New:**

- `src/components/avatar/OrbCore.jsx`
- `tools/bulk_process_transparency.py`
- `tools/verify_composite.py`
- `tools/final_composite_test.py`
- `docs/AVATAR_ANIMATION_IMPLEMENTATION.md`

**Modified:**

- `src/components/avatar/StaticSigilCore.jsx`
- `src/components/vipassana/MiniAvatar.jsx`
- `src/components/Avatar.css`
- `src/components/PhoticCirclesOverlay.jsx`

**Assets:**

- `public/assets/avatar_v2/` (11 production assets + 3 test composites)

### Validation Results

✅ No checkerboard artifacts  
✅ Orb feels seated, not pressed against frame  
✅ Glow barely noticeable unless staring  
✅ At rest, avatar feels still  
✅ Motion only noticeable after ~5 seconds  
✅ At 96×96, motion barely detectable  
✅ Reads as calm, intentional, expensive

### Next Steps

- Monitor performance on mobile devices
- Consider adding subtle particle opacity variation for organic feel
- Evaluate user feedback on animation timing

---

## 2026-01-08 Photic Circles UI Cleanup

### Changes

- **Removed instruction text**: Deleted "Tap to exit Drag to adjust spacing" overlay text for clean interface
- **Pure black background**: Changed from `rgba(0, 0, 0, 0.95)` to `#000000`
- **Updated z-index**: Changed from 1000 to 2000 for proper layering

### Master Optical System

- **Generated 3 Museum-Grade Assets**:
  - `optical_lens.png`: Circular convex crystal glass with realistic refraction.
  - `optical_highlight.png`: Asymmetrical specular catch-lights.
  - `optical_shadow.png`: Radial inner shadow for depth illusion.
- **Implemented Layered Optical Stack**:
  - Added new depth-suggesting shadow mask (z-index 2).
  - Added refraction-simulating lens overlay (z-index 3).
  - Added surface catch-light highlights (z-index 4).
  - Result: Gem cores now feel seated behind curved crystal glass, satisfying the "museum-grade" constraint.

### Files Modified

- `src/components/PhoticCirclesOverlay.jsx`

### Result

- Clean, distraction-free interface during photic entrainment
- Tap-to-exit and drag-to-adjust functionality preserved (unlabeled)
- Pure black background eliminates any visual artifacts

## 2026-01-08 — Jewel Authority Asset Generation (Unit Test)

### Summary

Generated the first set of "Jewel Authority" assets for the SEEDLING stage using the new AVATAR_JEWEL_SPEC. These assets focus on the jewel itself as the continuous object, without external frames or sigils, following the topological deformation rules.

### Assets Generated (Seedling Stage)

- **SEEDLING_DHYANA_EKAGRATA**: Precision deformation, steady internal glow. [Indigo]
- **SEEDLING_PRANA_SAHAJA**: Flowing deformation, breathing glow. [Indigo]
- **SEEDLING_DRISHTI_VIGILANCE**: Faceted deformation, scanning light. [Indigo]

### Process

1. **Prompt Engineering**: Applied the new template-based prompt logic from `AVATAR_JEWEL_SPEC.md`.
2. **Generation**: Used ComfyUI MCP to generate 1024x1024 raw images on pure black backgrounds.
3. **Transparency Processing**: Updated `tools/bulk_process_transparency.py` to target the `public/avatars/` directory and processed raw outputs into production-ready transparent PNGs.

### Validation Checklist

- [x] **Jewel Authority**: Recognizably the "Seedling" material; feels manufactured; single continuous object.
- [x] **Path Deformation**: Dhyana (Symmetric), Prana (Flowing), Drishti (Faceted) clearly distinguishable.
- [x] **Negative Compliance**: No mandalas, sigils, symbols, or text detected.
- [x] **Technical**: 512x512 (processed), Correct Alpha channel, Black-to-Alpha conversion successful.

### Files Created

- `public/avatars/seedling_dhyana_ekagrata.png`
- `public/avatars/seedling_prana_sahaja.png`
- `public/avatars/seedling_drishti_vigilance.png`

## 2026-01-08 — Jewel Authority Matrix (15 Assets Audit)

### Summary

Successfully expanded the Jewel Authority unit test to a full 15-asset matrix covering all 5 Stages (Seedling, Ember, Flame, Beacon, Stellar) and all 3 major Path/Vector combinations.

### Assets Generated

- **Seedling (Indigo)**: Dhyana/Ekagrata, Prana/Sahaja, Drishti/Vigilance
- **Ember (Orange)**: Prana/Ekagrata, Prana/Sahaja, Prana/Vigilance
- **Flame (Gold)**: Dhyana/Ekagrata, Dhyana/Sahaja, Dhyana/Vigilance
- **Beacon (Cyan)**: Drishti/Ekagrata, Drishti/Sahaja, Drishti/Vigilance
- **Stellar (Violet)**: Jnana/Ekagrata, Jnana/Sahaja, Jnana/Vigilance

### Findings

- **Visual Consistency**: All assets adhere to the "Single Continuous Jewel" principle. No external UI halos, frames, or text.
- **Stage Topology**:
  - **Dhyana/Jnana**: Precision facets and clean symmetry.
  - **Prana**: Organic, flowing "liquid crystal" topology.
  - **Drishti**: Analytical, multi-lensed cuts.
- **Integration**: The `VerificationGallery` component was fixed to correctly map these assets into the `OrbCore` vessel frames for visual audit.
- **Transparency**: All 15 assets were bulk-processed from black backgrounds to transparent PNGs using the `bulk_process_transparency.py` tool.

## 2026-01-08 — Jewel Authority: Path Coverage Complete (30 Assets)

### Summary

Generated the missing Path variations (using the EKAGRATA vector) for all 5 Stages. This completes the 30-asset baseline required to lock the system's geometry.

### Assets Generated

- **Full Ekagrata Matrix (30 Assets)**: 5 Stages × 6 Paths (Soma, Prana, Dhyana, Drishti, Jnana, Sakshi).

### 🔒 GEOMETRY LOCKED

- **Topology Finalized**: Each Path now has a canonical deformation logic that scales from Seedling to Stellar.
- **Ceiling Verified**: `Stellar Jnana Ekagrata` confirmed as the complexity ceiling. No generated asset surpasses its level of detail or "prestige."
- **Immutable Logic**: Deformation is now frozen. Future assets (Sahaja/Vigilance) will only vary internal light behavior and physics, keeping the base geometry identical.

### Next Steps

- Proceed to **Vector Expansion** (60 remaining assets).
- Generate Sahaja (Flowing) and Vigilance (Faceted/Dynamic) light behaviors for the locked geometries.

### Next Steps

- Integrate asset selection logic into production `OrbCore`.
- Generate the full 90-asset set (18 variants per stage).
- Capture regression anchors for final sign-off.
