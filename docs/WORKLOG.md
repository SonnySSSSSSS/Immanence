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

## 2026-01-11 23:55 - Antigravity (Architect) - IN_PROGRESS

**Task**: PRACTICE UI OVERHAUL — Reference Design Implementation

**Status**: IN_PROGRESS (Asset Generation Completed)

**Reference**: Stitch Design `screens/9f3a3abfc6ff4002a594786213df6883`

---

## 📊 GAP ANALYSIS: Current vs. Reference

| Element                   | Current State                      | Reference Target                                       | Severity     |
| ------------------------- | ---------------------------------- | ------------------------------------------------------ | ------------ |
| **Header**                | "CIRCUIT TRAINING" button          | "ANCIENT-MODERN MEDITATION SETUP" title                | Medium       |
| **Practice Cards**        | Dark olive/brown, flat             | Slate-blue metallic, beveled, inner glow               | **Critical** |
| **Card Icons**            | Simple gold filled                 | Gold line-art with fine detail                         | High         |
| **Options Panel Frame**   | Plain dark border                  | Ornate gold Art Deco frame with corner flourishes      | **Critical** |
| **Breath Visualization**  | Trapezoidal line graph             | Flowing 3D ribbon wave (multiple parallel sine lines)  | **Critical** |
| **Phase Inputs**          | Simple number boxes                | Decorative double-border boxes, Roman numerals (I, II) | Medium       |
| **Duration Slider**       | Dark track, emerald thumb, numbers | Gold track, moon thumb, star & dot decorations         | High         |
| **Begin Practice Button** | Olive gradient, inside panel       | Solid metallic gold, separated, prominent              | High         |

---

## 🎨 REQUIRED ASSETS

### Asset 1: Slate-Blue Metallic Card Background

- **Type**: PNG (with transparency) or 9-slice
- **Dimensions**: ~120x100px base (scalable)
- **Style**: Metallic slate-blue/gray gradient, beveled edges, subtle inner shadow
- **Source**: ComfyUI generation with prompt:
  ```
  Slate blue metallic UI card, beveled edges, subtle inner glow, dark mode interface element,
  clean geometric, no text, centered, isolated on transparent background, UI asset
  ```

### Asset 2: Ornate Gold Frame for Options Panel

- **Type**: PNG (with transparency) or SVG
- **Dimensions**: ~400x500px (will be scaled)
- **Style**: Art Deco gold frame with decorative corner flourishes, fine gold lines, subtle glow
- **Source**: ComfyUI generation with prompt:
  ```
  Ornate Art Deco gold decorative frame, intricate corner flourishes, thin gold lines,
  dark transparent center, luxury UI element, baroque details, isolated on transparent background
  ```

### Asset 3: Practice Icons (8 Required)

- **Type**: SVG (hand-traced or AI-assisted)
- **Style**: Thin gold stroke (1-2px), line-art only, no fills
- **Icons Needed**:
  1. Breath Practices (wind/spiral)
  2. Ritual Library (book/pyramid)
  3. Insight Meditation (lotus/figure)
  4. Body Scan (human outline)
  5. Sound (speaker/wave)
  6. Visualization (eye/sun)
  7. Cymatics (mandala/circles)
  8. Photic Circles (concentric rings)
- **Source**: Manual SVG creation or Figma export

### Asset 4: Moon Icon for Slider Thumb

- **Type**: SVG
- **Dimensions**: 24x24px
- **Style**: Crescent moon with subtle glow
- **Source**: Manual SVG creation

### Asset 5: Decorative Stars

- **Type**: SVG
- **Dimensions**: 8x8px and 12x12px variants
- **Style**: 4-point or 6-point stars, gold fill
- **Source**: Manual SVG creation

---

## 🔧 IMPLEMENTATION PHASES

### Phase 1: Practice Card Overhaul

**Priority**: Critical
**Effort**: Medium

**Tasks**:
1.1. [x] Generate slate-blue card background asset via ComfyUI
1.2. [x] Replace current card background styling with asset-based approach
1.3. [x] Apply inner shadow and bevel effect via CSS
1.4. [x] Update hover/selected states to match reference (brighter glow on selection)
1.5. [x] Adjust card spacing to match reference grid

**Files to Modify**:

- `src/components/PracticeSection.jsx` — PracticeSelector card styling
- `public/assets/ui/` — New card background assets

**Acceptance Criteria**:

- [ ] Cards have slate-blue metallic appearance
- [ ] Selected card has gold border glow
- [ ] Hover state shows subtle brightness increase
- [ ] Cards align in 2x4 grid with consistent spacing

---

### Phase 2: Icon Refresh

**Priority**: High
**Effort**: Medium

**Tasks**:
2.1. [x] Create or source 8 line-art SVG icons matching reference style
2.2. [x] Replace current icon set in PRACTICE_REGISTRY or inline
2.3. [x] Ensure icons are gold stroke on transparent background
2.4. [x] Verify icons render correctly at multiple sizes

**Files to Modify**:

- `src/components/PracticeSection.jsx` — Icon rendering
- `src/assets/icons/practice/` — New icon SVGs (create directory if needed)

**Acceptance Criteria**:

- [ ] All 8 icons match reference line-art style
- [ ] Icons are SVG with configurable stroke color
- [ ] Icons scale cleanly from 24px to 48px

---

### Phase 3: Ornate Frame for Options Panel

**Priority**: Critical
**Effort**: High

**Tasks**:
3.1. [x] Generate ornate gold frame asset via ComfyUI
3.2. [x] Implement frame as positioned background image or border-image
3.3. [x] Ensure frame scales correctly across Hearth and Sanctuary modes
3.4. [x] Add subtle gold glow to frame edges

**Files to Modify**:

- `src/components/PracticeSection.jsx` — PracticeOptionsCard container
- `public/assets/ui/` — Frame asset

**Acceptance Criteria**:

- [ ] Options panel has ornate gold frame
- [ ] Frame corners have decorative flourishes
- [ ] Frame does not clip or distort on resize
- [ ] Inner content has appropriate padding from frame

---

### Phase 4: Breath Ribbon Visualization

**Priority**: Critical
**Effort**: High

**Tasks**:
4.1. Replace `BreathCycleGraph.jsx` with new `BreathRibbon.jsx` component
4.2. Implement flowing sine wave with 3-5 parallel lines
4.3. Add subtle animation (gentle wave motion)
4.4. Use gold gradient stroke with glow effect
4.5. Ensure wave responds to breath pattern values

**Files to Modify**:

- `src/components/BreathCycleGraph.jsx` — Replace entirely or refactor
- `src/components/BreathRibbon.jsx` — New component (create)

**Implementation Notes**:

```jsx
// Concept: Multiple offset sine waves
const numLines = 5;
const paths = [];
for (let i = 0; i < numLines; i++) {
  const yOffset = i * 4; // Vertical spacing between lines
  const phase = i * 0.1; // Slight phase offset for ribbon effect
  // Generate sine path with offset
}
```

**Acceptance Criteria**:

- [ ] Visualization shows flowing ribbon (3-5 parallel sine waves)
- [ ] Lines have gold gradient stroke
- [ ] Subtle glow effect on lines
- [ ] Wave animates smoothly (optional: responds to breath phase)

---

### Phase 5: Phase Input Styling

**Priority**: Medium
**Effort**: Low

**Tasks**:
5.1. Add decorative double-border to input boxes
5.2. Change "HOLD 1" / "HOLD 2" to "HOLD I" / "HOLD II" (Roman numerals)
5.3. Center-align labels and values
5.4. Apply gold border with subtle corner accents

**Files to Modify**:

- `src/components/PracticeSection.jsx` — Breath phase input rendering

**Acceptance Criteria**:

- [ ] Inputs have decorative double-line gold borders
- [ ] Labels use Roman numerals (I, II)
- [ ] Values are large, centered, and easily readable

---

### Phase 6: Duration Slider Redesign

**Priority**: High
**Effort**: Medium

**Tasks**:
6.1. [x] Create moon icon SVG for slider thumb
6.2. [x] Create star decoration SVGs
6.3. Replace current slider track with gold gradient + dot pattern
6.4. Position stars at track endpoints
6.5. Style thumb as moon icon with glow

**Files to Modify**:

- `src/components/SacredTimeSlider.jsx` — Complete restyle
- `src/assets/icons/` — Moon and star SVGs

**Acceptance Criteria**:

- [ ] Slider thumb is a crescent moon icon
- [ ] Track has gold gradient with dot pattern
- [ ] Decorative stars at track ends
- [ ] Selected value displays prominently (large number)

---

### Phase 7: Begin Practice Button

**Priority**: High
**Effort**: Low

**Tasks**:
7.1. [x] Move button outside/below the options panel
7.2. [x] Apply solid metallic gold gradient (not theme-dependent)
7.3. [x] Increase button prominence (larger, more padding)
7.4. [x] Add subtle metallic texture or highlight

**Files to Modify**:

- `src/components/PracticeSection.jsx` — Button positioning and styling

**Button Styling**:

```css
background: linear-gradient(180deg, #d4af37 0%, #b8962e 50%, #9a7b24 100%);
color: #1a1a1a;
font-weight: 700;
letter-spacing: 0.15em;
padding: 16px 48px;
border-radius: 4px; /* Less rounded than current */
box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3),
  inset 0 -1px 0 rgba(0, 0, 0, 0.2);
```

**Acceptance Criteria**:

- [ ] Button is solid metallic gold
- [ ] Button is separated from options panel
- [ ] Button spans full width of container
- [ ] Text is dark and highly readable

---

### Phase 8: Header Text (Optional)

**Priority**: Low
**Effort**: Low

**Tasks**:
8.1. Add "ANCIENT-MODERN MEDITATION SETUP" heading above card grid
8.2. Style with appropriate typography and spacing

**Files to Modify**:

- `src/components/PracticeSection.jsx` — Add header element

**Acceptance Criteria**:

- [ ] Header text visible above card grid
- [ ] Typography matches reference (gold, serif or display font)

---

## 📁 FILES TO MODIFY (Summary)

| File                                  | Changes                           |
| ------------------------------------- | --------------------------------- |
| `src/components/PracticeSection.jsx`  | Cards, inputs, button, layout     |
| `src/components/BreathCycleGraph.jsx` | Replace with ribbon visualization |
| `src/components/SacredTimeSlider.jsx` | Complete restyle                  |
| `src/components/BreathRibbon.jsx`     | New component (create)            |
| `public/assets/ui/`                   | Card backgrounds, frame asset     |
| `src/assets/icons/practice/`          | 8 new line-art icons              |
| `src/assets/icons/`                   | Moon, star SVGs                   |

---

## ⚠️ FILES NOT TO MODIFY

- `src/context/ThemeContext.jsx` — Theme logic should remain unchanged
- `src/theme/stageColors.js` — Stage colors should remain unchanged
- `src/App.jsx` — No changes until final version bump

---

## ✅ ACCEPTANCE CRITERIA (Final)

- [ ] Practice cards match reference: slate-blue metallic with beveled edges
- [ ] All 8 icons are gold line-art style
- [ ] Options panel has ornate gold Art Deco frame
- [ ] Breath visualization is flowing ribbon (multiple sine waves)
- [ ] Phase inputs have decorative borders and Roman numerals
- [ ] Duration slider has moon thumb, star decorations, dot track
- [ ] Begin Practice button is solid metallic gold, separated from panel
- [ ] All elements align and scale correctly in Hearth and Sanctuary modes
- [ ] `npm run build` completes with no errors
- [ ] Version bump: v3.24.0

---

## 🔄 EXECUTION ORDER

1. **Asset Generation** (Phase 1.1, 2.1, 3.1, 6.1-6.2) — Generate all required assets first
2. **Card Overhaul** (Phase 1) — Establish new visual foundation
3. **Icon Refresh** (Phase 2) — Update all practice icons
4. **Frame Implementation** (Phase 3) — Apply ornate frame to options panel
5. **Slider Redesign** (Phase 6) — Restyle duration slider
6. **Ribbon Visualization** (Phase 4) — Replace breath graph
7. **Input Styling** (Phase 5) — Apply decorative borders
8. **Button Styling** (Phase 7) — Finalize begin button
9. **Polish** (Phase 8 + testing) — Header, alignment, final verification

---

## 💬 COMMIT MESSAGE (Upon Completion)

```
feat(practice): Complete UI overhaul to match reference design

CARDS:
- Slate-blue metallic background with bevel effect
- Gold line-art icons for all 8 practice types
- Selection glow and hover states

OPTIONS PANEL:
- Ornate Art Deco gold frame with corner flourishes
- Flowing ribbon breath visualization (multi-sine wave)
- Decorative double-border phase inputs with Roman numerals

SLIDER:
- Moon icon thumb with glow
- Gold track with dot pattern
- Star decorations at endpoints

BUTTON:
- Solid metallic gold gradient
- Separated from panel, full-width
- High contrast text

Version: v3.24.0

🤖 Generated with Antigravity
```

---

## 2026-01-11 22:30 - Antigravity (Architect) - COMPLETED

**Task**: PRACTICE SECTION UI — Phase 3: Final Alignment & Precision Controls

**Status**: COMPLETED

---

## 📊 CURRENT STATE ANALYSIS (Latest User Feedback)

### Refinements Needed:

1. **Circuit Training Button**:
   - ✅ Remove the lightning bolt icon.
   - ✅ Make it shorter (reduce vertical padding).
2. **Breath Graph Animation**:
   - ✅ Dot MUST follow the trapezoidal shape accurately.
   - ✅ Timing MUST be synchronized: the dot takes the exact seconds assigned for each phase (Inhale, Hold 1, Exhale, Hold 2).
3. **Breath Controls**:
   - ✅ REMOVE the plus (+) and minus (–) buttons.
   - ✅ IMPLEMENT direct number inputs (1-60 range).
4. **Begin Practice Button**:
   - ✅ Fill the button with the current accent color (`var(--accent-primary)`).
5. **Layout Unity**:
   - ✅ All sections (Circuit, Grid, Options Panel) must have identical width and alignment.

---

## 🔧 PHASE 1: UNIFORM WIDTH & COMPONENT REFINEMENT

### Task 1.1: Define Unified Layout Container

**File**: `src/components/PracticeSection.jsx`

```javascript
const UI_MAX_WIDTH = "560px";
```

Apply this `maxWidth: UI_MAX_WIDTH` to the `Circuit Training` button container, the grid, and the options panel.

### Task 1.2: Refine Circuit Training Button

**File**: `src/components/PracticeSection.jsx`

- Remove icon.
- Reduce padding to `10px 24px`.

---

## 🔧 PHASE 2: PRECISION BREATH CONTROLS

### Task 2.1: Implement Direct Inputs

**File**: `src/components/PracticeSection.jsx` (within `PracticeOptionsCard`)

- Replace the steppers with `<input type="number" min="1" max="60" />`.
- Hide spin-buttons using CSS.
- Center text, font size `18px`.

---

## 🔧 PHASE 3: SYNCHRONIZED TRAPEZOIDAL GRAPH

### Task 3.1: Precision Animated Dot

**File**: `src/components/BreathCycleGraph.jsx`

The dot must spend exactly `inhale` seconds on the rise, `hold1` on the plateau, etc.

**Animation Logic**:

```javascript
const totalTime = inhale + hold1 + exhale + hold2;
const t1 = inhale / totalTime;
const t2 = (inhale + hold1) / totalTime;
const t3 = (inhale + hold1 + exhale) / totalTime;
const keyTimes = `0; ${t1}; ${t2}; ${t3}; 1`;
```

**Implementation**:

```javascript
<circle r="5" fill="var(--accent-primary)">
  <animateMotion
    dur={`${totalTime}s`}
    repeatCount="indefinite"
    path={path}
    keyTimes={keyTimes}
    calcMode="linear"
  />
</circle>
```

---

## 🔧 PHASE 4: ACCENT-FILLED BEGIN BUTTON

### Task 4.1: Fill Begin Practice Button

**File**: `src/components/PracticeSection.jsx`

- `background`: `var(--accent-primary)`.
- Use contrasting dark color for the label text.

---

## 🔧 PHASE 5: PARTICLE FIELD ELEVATION

### Task 5.1: Raise Particle Field

**File**: `src/components/Background.jsx` or similar.

- Increase the height of the particle source zone by 30%.

---

## ✅ ACCEPTANCE CRITERIA

### Circuit Button:

- [ ] NO icon.
- [ ] Compact height.
- [ ] Aligned perfectly with sections below.

### Breath Controls:

- [ ] NO +/– buttons.
- [ ] Direct number inputs (1-60).
- [ ] Changes reflect instantly in graph.

### Breath Graph:

- [ ] Trapezoidal shape matches durations.
- [ ] Dot follows the line exactly.
- [ ] Dot takes specified seconds for each segment.

### General:

- [ ] Begin Practice button is filled with accent color.
- [ ] All components share identical `560px` max-width.
- [ ] Particles extend 30% higher than before.
- [ ] Version bump: v3.22.0

---

## 📁 FILES TO MODIFY

- `src/components/PracticeSection.jsx`
- `src/components/BreathCycleGraph.jsx`
- `src/components/Background.jsx` (or `IndrasNet.jsx`)
- `src/App.jsx` — Version bump to v3.22.0

---

## 💬 COMMIT MESSAGE

```
feat(practice): Final precision UI alignment

- Uniform width (560px) for all components
- Direct numeric inputs (1-60) for breath phases
- Synchronized trapezoidal graph animation using keyTimes
- Refined Circuit Training button (no icon, compact)
- Accent-filled Begin Practice button
- Extended particle field height by 30%

Version: v3.22.0

🤖 Generated with Antigravity
```

---

## 🔄 PREVIOUS TASKS — OBSOLETE

## 2026-01-11 21:41 - Antigravity (Architect) - OBSOLETE

**Task**: PRACTICE SECTION UI — Phase 3: Final Alignment

**Status**: OBSOLETE (REPLACED BY 22:00 TASK)

---

## 📊 CURRENT STATE ANALYSIS (Screenshot 2026-01-11 21:41)

### What's Working:

- ✅ Circuit Training button is now full-width at top
- ✅ 2×4 grid of 8 practice cards implemented
- ✅ Basic golden styling on selected card
- ✅ Options panel has translucent background
- ✅ Begin Practice button exists

### 🔴 CRITICAL ISSUES REMAINING:

#### Issue 1: PARTICLES TOO LOW

- **Current**: Particles confined to bottom ~15% of screen
- **Target**: Particles should extend **30% higher** than current
- **Problem**: The cosmic particle field ends abruptly, creating a hard visual cutoff

#### Issue 2: BREATH GRAPH NOT CONNECTED TO INPUTS

- **Current**: Graph shows a static sine-wave pattern with fixed shape
- **Missing**: NO input controls for Inhale/Hold1/Exhale/Hold2 durations
- **Target**:
  1. Four number inputs (or steppers) for the 4 breath phases
  2. Graph shape dynamically updates based on those values
  3. Subtitle "Inhale 4 · Hold 4 · Exhale 4 · Hold 4" should reflect actual input values

#### Issue 3: INCONSISTENT COMPONENT WIDTHS

- **Current**: Circuit button, grid, and options panel have DIFFERENT widths
- **Target**: All three components should have the EXACT SAME width
- **Visual**: Creates a misaligned, unprofessional appearance

#### Issue 4: GRAPH IS SINE WAVE, NOT TRAPEZOIDAL

- **Current**: Smooth continuous sine wave (~~~)
- **Target**: 4-phase trapezoidal pattern:
  - Rise (Inhale) → Flat plateau (Hold 1) → Fall (Exhale) → Flat plateau (Hold 2)
- **Reference**: Mountain peaks with flat tops and bottoms

---

## 🔧 PHASE 1: UNIFORM WIDTH SYSTEM

### Task 1.1: Define Single Width Constant

**File**: `src/components/PracticeSection.jsx`

**Implementation**:

```javascript
// At the top of the component or in PracticeSelector
const PRACTICE_UI_WIDTH = {
  sanctuary: "560px", // Wide mode
  hearth: "100%", // Mobile fills container
  maxWidth: "560px", // Cap for all modes
  padding: "16px", // Horizontal padding
};
```

### Task 1.2: Apply Width to Circuit Button

```javascript
<div
  style={{
    width: "100%",
    maxWidth: PRACTICE_UI_WIDTH.maxWidth,
    margin: "0 auto",
    paddingLeft: PRACTICE_UI_WIDTH.padding,
    paddingRight: PRACTICE_UI_WIDTH.padding,
  }}
>
  {/* Circuit button */}
</div>
```

### Task 1.3: Apply Width to Practice Grid

```javascript
<div
  style={{
    width: "100%",
    maxWidth: PRACTICE_UI_WIDTH.maxWidth,
    margin: "0 auto",
    paddingLeft: PRACTICE_UI_WIDTH.padding,
    paddingRight: PRACTICE_UI_WIDTH.padding,
  }}
>
  {/* 2×4 grid */}
</div>
```

### Task 1.4: Apply Width to Options Panel

```javascript
<div
  style={{
    width: "100%",
    maxWidth: PRACTICE_UI_WIDTH.maxWidth,
    margin: "0 auto",
  }}
>
  {/* PracticeOptionsCard */}
</div>
```

**Verification**: Screenshot both Sanctuary and Hearth modes. All three sections should be perfectly aligned with same width.

---

## 🔧 PHASE 2: BREATH PHASE INPUT CONTROLS

### Task 2.1: Add Breath Phase State

**File**: `src/components/PracticeSection.jsx` — In `PracticeOptionsCard` or parent

```javascript
const [breathPattern, setBreathPattern] = useState({
  inhale: 4,
  hold1: 4,
  exhale: 4,
  hold2: 4,
});
```

### Task 2.2: Create Phase Input UI

**Create inline number steppers or input fields for each phase**:

```javascript
<div
  className="flex justify-center gap-6"
  style={{ marginTop: "16px", marginBottom: "16px" }}
>
  {/* Inhale */}
  <div className="flex flex-col items-center">
    <label
      style={{
        fontSize: "10px",
        letterSpacing: "0.1em",
        color: "rgba(255,255,255,0.5)",
        marginBottom: "4px",
      }}
    >
      INHALE
    </label>
    <div className="flex items-center gap-2">
      <button
        onClick={() =>
          setBreathPattern((p) => ({ ...p, inhale: Math.max(1, p.inhale - 1) }))
        }
      >
        −
      </button>
      <span
        style={{
          fontSize: "16px",
          fontWeight: 600,
          color: "#F5E6D3",
          minWidth: "24px",
          textAlign: "center",
        }}
      >
        {breathPattern.inhale}
      </span>
      <button
        onClick={() =>
          setBreathPattern((p) => ({
            ...p,
            inhale: Math.min(12, p.inhale + 1),
          }))
        }
      >
        +
      </button>
    </div>
  </div>

  {/* Hold 1 */}
  <div className="flex flex-col items-center">
    <label
      style={{
        fontSize: "10px",
        letterSpacing: "0.1em",
        color: "rgba(255,255,255,0.5)",
        marginBottom: "4px",
      }}
    >
      HOLD
    </label>
    <div className="flex items-center gap-2">
      <button
        onClick={() =>
          setBreathPattern((p) => ({ ...p, hold1: Math.max(0, p.hold1 - 1) }))
        }
      >
        −
      </button>
      <span
        style={{
          fontSize: "16px",
          fontWeight: 600,
          color: "#F5E6D3",
          minWidth: "24px",
          textAlign: "center",
        }}
      >
        {breathPattern.hold1}
      </span>
      <button
        onClick={() =>
          setBreathPattern((p) => ({ ...p, hold1: Math.min(12, p.hold1 + 1) }))
        }
      >
        +
      </button>
    </div>
  </div>

  {/* Exhale */}
  <div className="flex flex-col items-center">
    <label
      style={{
        fontSize: "10px",
        letterSpacing: "0.1em",
        color: "rgba(255,255,255,0.5)",
        marginBottom: "4px",
      }}
    >
      EXHALE
    </label>
    <div className="flex items-center gap-2">
      <button
        onClick={() =>
          setBreathPattern((p) => ({ ...p, exhale: Math.max(1, p.exhale - 1) }))
        }
      >
        −
      </button>
      <span
        style={{
          fontSize: "16px",
          fontWeight: 600,
          color: "#F5E6D3",
          minWidth: "24px",
          textAlign: "center",
        }}
      >
        {breathPattern.exhale}
      </span>
      <button
        onClick={() =>
          setBreathPattern((p) => ({
            ...p,
            exhale: Math.min(12, p.exhale + 1),
          }))
        }
      >
        +
      </button>
    </div>
  </div>

  {/* Hold 2 */}
  <div className="flex flex-col items-center">
    <label
      style={{
        fontSize: "10px",
        letterSpacing: "0.1em",
        color: "rgba(255,255,255,0.5)",
        marginBottom: "4px",
      }}
    >
      HOLD
    </label>
    <div className="flex items-center gap-2">
      <button
        onClick={() =>
          setBreathPattern((p) => ({ ...p, hold2: Math.max(0, p.hold2 - 1) }))
        }
      >
        −
      </button>
      <span
        style={{
          fontSize: "16px",
          fontWeight: 600,
          color: "#F5E6D3",
          minWidth: "24px",
          textAlign: "center",
        }}
      >
        {breathPattern.hold2}
      </span>
      <button
        onClick={() =>
          setBreathPattern((p) => ({ ...p, hold2: Math.min(12, p.hold2 + 1) }))
        }
      >
        +
      </button>
    </div>
  </div>
</div>
```

### Task 2.3: Update Subtitle to Reflect Inputs

```javascript
<div style={{ fontSize: "12px", color: "rgba(245, 230, 211, 0.55)" }}>
  Inhale {breathPattern.inhale} · Hold {breathPattern.hold1} · Exhale{" "}
  {breathPattern.exhale} · Hold {breathPattern.hold2}
</div>
```

---

## 🔧 PHASE 3: TRAPEZOIDAL BREATH GRAPH

### Task 3.1: Update BreathCycleGraph to Use Input Values

**File**: `src/components/BreathCycleGraph.jsx` (or wherever the graph is)

**The graph path MUST be calculated from the breathPattern values**:

```javascript
function BreathCycleGraph({
  inhale,
  hold1,
  exhale,
  hold2,
  width = 300,
  height = 80,
}) {
  const totalTime = inhale + hold1 + exhale + hold2;
  const cycleWidth = width;

  // Calculate segment widths proportionally
  const inhaleW = (inhale / totalTime) * cycleWidth;
  const hold1W = (hold1 / totalTime) * cycleWidth;
  const exhaleW = (exhale / totalTime) * cycleWidth;
  const hold2W = (hold2 / totalTime) * cycleWidth;

  const top = 10;
  const bottom = height - 10;

  // Build trapezoidal path
  let x = 0;
  const path = [
    `M 0 ${bottom}`, // Start at bottom-left
    `L ${inhaleW} ${top}`, // Rise (inhale)
    `L ${inhaleW + hold1W} ${top}`, // Flat at top (hold 1)
    `L ${inhaleW + hold1W + exhaleW} ${bottom}`, // Fall (exhale)
    `L ${cycleWidth} ${bottom}`, // Flat at bottom (hold 2)
  ].join(" ");

  return (
    <svg width={width} height={height} style={{ overflow: "visible" }}>
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path
        d={path}
        fill="none"
        stroke="var(--accent-primary)"
        strokeWidth="2"
        filter="url(#glow)"
        opacity="0.85"
      />
    </svg>
  );
}
```

### Task 3.2: Pass breathPattern to Graph

```javascript
<BreathCycleGraph
  inhale={breathPattern.inhale}
  hold1={breathPattern.hold1}
  exhale={breathPattern.exhale}
  hold2={breathPattern.hold2}
/>
```

**Verification**: Change Inhale from 4 to 8 — the rising slope should become WIDER. Change Hold 1 from 4 to 0 — the flat plateau at top should DISAPPEAR.

---

## 🔧 PHASE 4: PARTICLE FIELD HEIGHT

### Task 4.1: Increase Particle Field Height

**File**: Likely `src/components/Background.jsx` or `src/components/IndrasNet.jsx`

**Problem**: Particles are confined to bottom ~15% of screen.
**Target**: Particles should extend to ~45% of screen height (30% higher than current).

**Search for**:

- Canvas height constraints
- Particle Y-position bounds
- Container with limited height

**Implementation**:

```javascript
// BEFORE (example)
const particleFieldHeight = windowHeight * 0.15;

// AFTER
const particleFieldHeight = windowHeight * 0.45; // 30% higher = 0.15 + 0.30 = 0.45
```

**Or if using CSS**:

```css
/* BEFORE */
.particle-field {
  height: 15vh;
  bottom: 0;
}

/* AFTER */
.particle-field {
  height: 45vh;
  bottom: 0;
}
```

**Verification**: Particles should now extend almost halfway up the screen, creating a more immersive cosmic field.

---

## ✅ ACCEPTANCE CRITERIA

### Width Consistency:

- [ ] Circuit button, practice grid, and options panel have IDENTICAL widths
- [ ] All components perfectly left/right aligned
- [ ] No visual offset between sections

### Breath Phase Controls:

- [ ] 4 input controls visible: Inhale, Hold 1, Exhale, Hold 2
- [ ] Values can be adjusted (range: 0-12 for holds, 1-12 for inhale/exhale)
- [ ] Subtitle updates dynamically: "Inhale X · Hold X · Exhale X · Hold X"

### Breath Graph:

- [ ] Graph shape is TRAPEZOIDAL (rise → flat → fall → flat)
- [ ] Graph shape updates when input values change
- [ ] Inhale duration affects width of rising slope
- [ ] Hold durations affect width of plateaus
- [ ] NOT a smooth sine wave

### Particle Field:

- [ ] Particles extend ~30% higher than before
- [ ] Particles reach approximately 45% of screen height
- [ ] No stretching/distortion

### General:

- [ ] `npm run build` completes with no errors
- [ ] Version bump: v3.21.0

---

## 📁 FILES TO MODIFY

- `src/components/PracticeSection.jsx` — Width constants, breath phase inputs, state management
- `src/components/BreathCycleGraph.jsx` — Trapezoidal path calculation from props
- `src/components/Background.jsx` or `IndrasNet.jsx` — Particle field height
- `src/App.jsx` — Version bump to v3.21.0

---

## 💬 COMMIT MESSAGE

```
feat(practice): Phase 3 - Final alignment

WIDTH:
- Unify width of Circuit button, practice grid, and options panel
- Apply consistent maxWidth and padding across all sections

BREATH CONTROLS:
- Add 4 phase input controls (Inhale, Hold 1, Exhale, Hold 2)
- Connect inputs to breath graph shape
- Update subtitle dynamically from input values

GRAPH:
- Replace sine wave with trapezoidal 4-phase pattern
- Shape segments proportional to phase durations

PARTICLES:
- Increase particle field height by 30%

Version: v3.21.0

🤖 Generated with Antigravity
```

---

## 🔄 PREVIOUS TASKS — OBSOLETE

The following section contains previous task attempts that are now OBSOLETE.
Execute ONLY the task above dated 2026-01-11 21:41.

---

## 📊 CURRENT vs. REFERENCE GAP ANALYSIS (Updated 2026-01-11 21:12)

### Current State — Remaining Problems:

#### 🔴 CRITICAL: Particle System (Bottom of Screen)

- **Problem**: Particles stretch/distort when switching between Hearth and Sanctuary modes
- **Root Cause**: Particles are likely using percentage-based or viewport-relative sizing
- **Target**: Particles must be **uniform circles** regardless of viewport width
- **Visual Impact**: Currently looks awkward and breaks the cosmic ambiance

#### 🔴 CRITICAL: Breath Graph Visualization (Wrong Design)

- **Current**: A simple sine wave (`~~~`) that doesn't represent the 4-phase breath
- **Target**: A **4-phase trapezoidal/mountain graph** showing:
  1. **Inhale** (rising slope)
  2. **Hold 1** (plateau at top)
  3. **Exhale** (falling slope)
  4. **Hold 2** (plateau at bottom)
- **Animation**: An **animated dot** traces the shape at the speed determined by the phase durations
- **Reference shows**: 2.5-3 mountain peaks with a teal/green glowing stroke

#### 🔴 CRITICAL: Grid Layout Structure

- **Current**: 3 rows of cards with inconsistent spacing, Circuit mixed in
- **Target**:
  1. **One wide "CIRCUIT" button** spanning the full width at top
  2. **Clean 2×4 grid** of 8 equal-sized practice cards below
- **Order**: Circuit (full-width) → Row 1 (4 cards) → Row 2 (4 cards)

#### 🟡 MEDIUM: Card Transparency

- **Current**: Cards have heavy opacity, not enough cosmic background showing through
- **Target**: Cards should be more translucent (`rgba(15, 20, 25, 0.15)` instead of current darker values)
- **Reference shows**: Clear cosmic nebula visible behind the frosted glass cards

#### 🟡 MEDIUM: Options Panel Background

- **Current**: Options panel (Breath & Stillness area) is too opaque
- **Target**: Panel background should also be more translucent to show cosmic background

#### 🟢 MINOR: Duration Picker Styling

- **Current**: Slider with number input and scattered markers
- **Target**: Horizontal number array with selected value (10) prominently larger

---

### Reference Design Excellence Points:

1. **Layout**: Full-width Circuit button → 2×4 equal card grid
2. **Breath Visualization**: Trapezoidal 4-phase waveform (not sine wave)
3. **Particle Field**: Uniform circular particles, no stretching
4. **Transparency**: Cosmic nebula clearly visible through all glassmorphic elements
5. **Typography**: "BREATH & STILLNESS" with subtitle "Inhale 4 · Hold 4 · Exhale 4 · Hold 4"
6. **Button**: Full-width "BEGIN PRACTICE" pill button with golden border

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

## 🔲 PHASE 1: GRID LAYOUT RESTRUCTURE

### Task 1.1: Extract Circuit as Full-Width Button

**File**: `src/components/PracticeSection.jsx` — `PracticeSelector` function

**Change**: Remove `circuit` from PRACTICE_IDS and render it separately above the grid.

**Implementation**:

```javascript
// Before the grid, add Circuit button
<div
  className="w-full mb-4"
  style={{
    maxWidth: isSanctuary ? "580px" : "480px",
    margin: "0 auto 16px auto",
  }}
>
  <button
    onClick={() => onSelect("circuit")}
    className="w-full transition-all duration-300"
    style={{
      fontFamily: "var(--font-display)",
      fontSize: "10px",
      letterSpacing: "0.12em",
      textTransform: "uppercase",
      fontWeight: 600,
      padding: "16px 24px",
      borderRadius: "12px",
      border:
        selectedId === "circuit"
          ? "1.5px solid rgba(201, 169, 97, 0.7)"
          : "1px solid rgba(255, 255, 255, 0.08)",
      background: "rgba(15, 20, 25, 0.15)",
      backdropFilter: "blur(32px)",
      color: selectedId === "circuit" ? "#D4AF37" : "rgba(255, 255, 255, 0.6)",
      textShadow:
        selectedId === "circuit" ? "0 0 12px rgba(212, 175, 55, 0.6)" : "none",
      boxShadow:
        selectedId === "circuit"
          ? "0 0 16px rgba(212, 175, 55, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
          : "inset 0 1px 0 rgba(255, 255, 255, 0.04)",
    }}
  >
    <span style={{ fontSize: "16px", marginRight: "8px" }}>↺</span>
    CIRCUIT
  </button>
</div>
```

**Grid below**: Filter out `circuit` from PRACTICE_IDS for the 2×4 grid.

```javascript
const GRID_PRACTICE_IDS = PRACTICE_IDS.filter((id) => id !== "circuit");
// Use GRID_PRACTICE_IDS in the grid map
```

---

### Task 1.2: Create Clean 2×4 Grid (8 Practices)

**File**: `src/components/PracticeSection.jsx` — `PracticeSelector` grid

**Changes**:

```javascript
// Grid container
<div
  className="grid gap-3 justify-items-stretch"
  style={{
    gridTemplateColumns: "repeat(4, 1fr)",
    maxWidth: isSanctuary ? "580px" : "480px",
    margin: "0 auto",
    paddingLeft: "12px",
    paddingRight: "12px",
  }}
>
  {GRID_PRACTICE_IDS.map((id) => {
    /* card render */
  })}
</div>
```

**Practices in Grid** (8 total, 2 rows of 4):

1. Breath Practices
2. Ritual Library
3. Insight Meditation
4. Body Scan
5. Sound
6. Visualization
7. Cymatics
8. Photic Circles

---

### Task 1.3: Increase Card Transparency

**File**: `src/components/PracticeSection.jsx` — card button styles

**Current**:

```javascript
background: 'rgba(10, 15, 15, 0.25)',
```

**Target**:

```javascript
background: 'rgba(15, 20, 25, 0.12)', // More translucent
backdropFilter: 'blur(24px) saturate(120%)', // Lighter blur
```

**Verify**: Cosmic nebula background should be clearly visible through cards.

---

### Task 1.4: Options Panel Transparency

**File**: `src/components/PracticeSection.jsx` — `PracticeOptionsCard` container

**Current**: `.machined-panel` or inline styles with heavy opacity

**Target**:

```javascript
style={{
  background: 'rgba(10, 15, 20, 0.18)', // Very translucent
  backdropFilter: 'blur(24px)',
  border: '1px solid rgba(201, 169, 97, 0.25)',
  borderRadius: '16px',
}}
```

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

### Task 2.2: Create BreathCycleGraph Component (4-Phase Visualization)

**CRITICAL**: The current sine wave is WRONG. We need a **4-phase trapezoidal graph** with an **animated dot tracer**.

**Create New File**: `src/components/BreathCycleGraph.jsx`

**Visual Design**:

```
                    ╱‾‾‾‾‾╲                ╱‾‾‾‾‾╲
   Inhale→        ╱        ╲ Exhale→    ╱        ╲
                ╱            ╲        ╱            ╲
  ─────────────╱  Hold 1      ╲──────╱  Hold 2      ╲─────
           Start            Hold 2               End
```

**The 4 Phases** (each segment of the path):

1. **Inhale** = Rising diagonal line (duration: `inhale` seconds)
2. **Hold 1** = Horizontal plateau at top (duration: `hold1` seconds)
3. **Exhale** = Falling diagonal line (duration: `exhale` seconds)
4. **Hold 2** = Horizontal plateau at bottom (duration: `hold2` seconds)

**Component Props**:

```javascript
interface BreathCycleGraphProps {
  inhale: number; // seconds for inhale phase (e.g., 4)
  hold1: number; // seconds for hold after inhale (e.g., 4)
  exhale: number; // seconds for exhale phase (e.g., 4)
  hold2: number; // seconds for hold after exhale (e.g., 4)
  cycles: number; // how many full cycles to show (default: 2.5)
  showDot: boolean; // whether to show animated tracing dot
  isAnimating: boolean; // whether dot is currently animating
}
```

**SVG Path Calculation**:

```javascript
function generateBreathPath(
  inhale,
  hold1,
  exhale,
  hold2,
  cycles,
  width,
  height
) {
  const totalCycleTime = inhale + hold1 + exhale + hold2;
  const cycleWidth = width / cycles;

  // Calculate segment widths proportionally
  const inhaleW = (inhale / totalCycleTime) * cycleWidth;
  const hold1W = (hold1 / totalCycleTime) * cycleWidth;
  const exhaleW = (exhale / totalCycleTime) * cycleWidth;
  const hold2W = (hold2 / totalCycleTime) * cycleWidth;

  const pathSegments = [];
  let x = 0;
  const top = 10; // padding from top
  const bottom = height - 10; // padding from bottom

  for (let i = 0; i < cycles; i++) {
    // Start at bottom (hold2 position)
    if (i === 0) pathSegments.push(`M ${x} ${bottom}`);

    // Inhale: rise from bottom to top
    pathSegments.push(`L ${x + inhaleW} ${top}`);
    x += inhaleW;

    // Hold 1: horizontal at top
    pathSegments.push(`L ${x + hold1W} ${top}`);
    x += hold1W;

    // Exhale: fall from top to bottom
    pathSegments.push(`L ${x + exhaleW} ${bottom}`);
    x += exhaleW;

    // Hold 2: horizontal at bottom
    pathSegments.push(`L ${x + hold2W} ${bottom}`);
    x += hold2W;
  }

  return pathSegments.join(" ");
}
```

**Animated Dot Tracer**:

```javascript
// Use SVG <animateMotion> to trace the path
<circle r="6" fill="var(--accent-primary)">
  <animateMotion
    dur={`${totalCycleTime * cycles}s`}
    repeatCount="indefinite"
    path={breathPath}
  />
</circle>
```

**Styling**:

```javascript
// Path stroke
stroke: 'var(--accent-primary)', // Changes with avatar stage
strokeWidth: 2,
fill: 'none',
filter: 'drop-shadow(0 0 6px var(--accent-glow))',
opacity: 0.85,

// Dot
fill: 'var(--accent-primary)',
filter: 'drop-shadow(0 0 8px var(--accent-glow))',
```

**Usage in PracticeOptionsCard**:

```javascript
{
  practiceId === "breath" && (
    <BreathCycleGraph
      inhale={pattern?.inhale || 4}
      hold1={pattern?.hold1 || 4}
      exhale={pattern?.exhale || 4}
      hold2={pattern?.hold2 || 4}
      cycles={2.5}
      showDot={true}
      isAnimating={false} // Only animate during practice
    />
  );
}
```

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

## 🌟 PHASE 3: PARTICLE SYSTEM FIX

### Task 3.1: Fix Particle Stretching on Viewport Change

**Problem**: Particles at the bottom of the screen stretch/distort when switching between Hearth (narrow) and Sanctuary (wide) display modes.

**Root Cause Analysis**:
The particles are likely using one of these problematic approaches:

1. Percentage-based width/height (`width: 0.5%`)
2. Viewport units (`width: 0.5vw`)
3. Container-relative sizing that doesn't maintain aspect ratio

**Solution**: Use **fixed pixel sizes** or **aspect-ratio-locked sizing** for particles.

**File to Investigate**: Look for particle rendering in:

- `src/components/Background.jsx`
- `src/components/IndrasNet.jsx`
- `src/components/avatar/AvatarLuminousCanvas.jsx`
- Any Canvas-based particle system

**Implementation**:

```javascript
// WRONG: Viewport-relative sizing
const particleSize = viewportWidth * 0.003; // Stretches with viewport!

// CORRECT: Fixed pixel sizing
const particleSize = 4; // px - always a perfect circle

// OR: Use min() to cap the size
const particleSize = Math.min(6, viewportWidth * 0.003);
```

**CSS Approach** (if particles are DOM elements):

```css
.cosmic-particle {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  aspect-ratio: 1 / 1; /* Force circle even if one dimension is percentage */
}
```

**Canvas Approach** (if particles are canvas-drawn):

```javascript
// When drawing particles, use fixed radius
ctx.beginPath();
ctx.arc(x, y, 3, 0, Math.PI * 2); // Fixed 3px radius
ctx.fill();
```

**Verification**:

1. Open app in Sanctuary mode (wide)
2. Switch to Hearth mode (narrow)
3. Particles must remain **perfect circles** of the same apparent size
4. No stretching, squashing, or ellipses

---

### Task 3.2: Panel Container Transparency

**Current State**: `.machined-panel` class with heavy styling

**Target State**: Single refined border with subtle inner glow, more translucent

**Changes**:

```javascript
// Panel container
style={{
  background: 'rgba(10, 15, 20, 0.18)', // More translucent
  backdropFilter: 'blur(24px)',
  border: '1px solid rgba(201, 169, 97, 0.30)',
  borderRadius: '16px',
  boxShadow: `
    0 8px 32px rgba(0, 0, 0, 0.35),
    inset 0 1px 0 rgba(255, 255, 255, 0.08)
  `,
}}
```

---

## 🧹 PHASE 4: COMPONENT CLEANUP

### Task 4.1: Remove Deprecated Components

**Files to DELETE or DEPRECATE**:

- `src/components/BreathPhaseIndicator.jsx` — No longer needed (subtitle replaces it)
- `src/components/BreathPathChart.jsx` — Replace with BreathCycleGraph

### Task 4.2: Create New Components

**Files to CREATE**:

- `src/components/BreathCycleGraph.jsx` — 4-phase trapezoidal graph with animated dot tracer
- Optionally `src/components/DurationPicker.jsx` — Horizontal number picker

---

## ✅ ACCEPTANCE CRITERIA

### Layout Checklist:

- [ ] Circuit button is full-width above the practice grid
- [ ] Practice grid shows 4 cards per row (2×4 layout for 8 practices)
- [ ] All 8 practice cards are equal size
- [ ] Grid excludes Circuit (Circuit is separate button above)

### Card Styling Checklist:

- [ ] Cards are translucent (cosmic background visible through)
- [ ] Selected card has golden text glow (luminous text-shadow)
- [ ] Selected card has golden border with outer glow
- [ ] Inactive cards have subtle white border, no glow
- [ ] Icons proportional to card size

### Breath Options Panel Checklist:

- [ ] Small ✦ star icon at top (not large icon)
- [ ] Title: "BREATH & STILLNESS" in small caps
- [ ] Subtitle: "Inhale X · Hold X · Exhale X · Hold X" (no circular counters)
- [ ] **4-Phase Graph** (NOT sine wave): Trapezoidal with inhale/hold/exhale/hold phases
- [ ] Animated dot traces the breath path shape
- [ ] Graph uses `var(--accent-primary)` for color theming
- [ ] Duration picker shows selected value prominently larger
- [ ] Options panel is translucent (cosmic background visible)

### Particle System Checklist:

- [ ] Particles remain **uniform circles** in both Hearth and Sanctuary modes
- [ ] No stretching/distortion when viewport width changes
- [ ] Particles use fixed pixel sizing

### General Checklist:

- [ ] Begin Practice button is full-width pill with golden border
- [ ] Cosmic background visible through all glassmorphic elements
- [ ] Version bump: v3.20.0

### Technical Checklist:

- [ ] `npm run build` completes with no errors
- [ ] No console errors in browser
- [ ] Works at 320px (Hearth) and 1080px (Sanctuary) viewports
- [ ] Accent colors change correctly when avatar stage changes (test with DevPanel)

---

## 📁 FILES TO MODIFY

### Primary Changes:

- `src/components/PracticeSection.jsx` — Circuit button extraction, 2×4 grid, card transparency
- `src/components/SacredTimeSlider.jsx` — Restyle for horizontal picker look

### New Files:

- `src/components/BreathCycleGraph.jsx` — 4-phase trapezoidal graph with dot tracer

### Particle Fix:

- `src/components/Background.jsx` or `src/components/IndrasNet.jsx` — Fix particle sizing

### Deprecate/Remove:

- `src/components/BreathPhaseIndicator.jsx` — Remove usage
- `src/components/BreathPathChart.jsx` — Replace with BreathCycleGraph

### Style Updates:

- `src/App.css` — Add `--brand-gold`, `--brand-gold-glow`, `--brand-gold-border` CSS vars if not present
- `src/App.jsx` — Version bump to v3.20.0

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
5. **Layout Verification**:
   - Circuit button should span full width above the grid
   - 2×4 grid of 8 equal-sized practice cards below
   - Cards should be translucent (cosmic background visible)
6. **Breath Graph Verification**:
   - Select "Breath Practices"
   - Graph should show trapezoidal 4-phase pattern (NOT sine wave)
   - Pattern: flat → rise → flat → fall → repeat (2.5 cycles)
   - Animated dot should trace the path at correct speed
7. **Particle Verification**:
   - Toggle between Hearth and Sanctuary modes
   - Particles at bottom must remain circular (no stretching)
8. **Theme Verification**:
   - Open DevPanel (Ctrl+Shift+D)
   - Switch avatar stage (Seedling → Ember → Flame → Beacon → Stellar)
   - Verify: Breath graph stroke color changes with stage
   - Verify: Gold elements (borders, button text) remain constant

---

## 💬 COMMIT MESSAGE

```
feat(practice): Phase 2 UI refinement - Critical gap closure

LAYOUT:
- Extract Circuit as full-width button above grid
- Create clean 2×4 grid for 8 practice cards
- Increase card and panel transparency

BREATH VISUALIZATION:
- Create BreathCycleGraph with 4-phase trapezoidal pattern
- Add animated dot tracer following breath path
- Use theme-aware accent colors for stroke

PARTICLES:
- Fix particle stretching on viewport change
- Use fixed pixel sizing for uniform circles

STYLING:
- Golden text glow on selected cards
- Refined glassmorphism for cosmic background visibility

Version: v3.20.0

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
