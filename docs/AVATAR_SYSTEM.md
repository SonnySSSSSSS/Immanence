# Immanence OS Avatar System Documentation

## Overview

The avatar system in Immanence OS has two independent dimensions:
1. **STAGES** — The vertical axis representing duration and consistency of participation
2. **PATHS** — The horizontal axis representing the behavioral shape of participation

Both dimensions are behavior-based. Both are honest. Neither makes claims about internal cognitive states or spiritual attainment.

---

## Philosophical Foundation

### The Five-Layer Stack
The Avatar is constructed as a temporal composite of five distinct visual layers, ordered by depth (back to front):
0. **Luminous Field** (`AvatarLuminousCanvas.jsx`): Sacred geometry, particles, and atmospheric nebula.
1. **Breathing Aura**: Dynamic glow syncing with practice breath patterns.
2. **Rune Ring**: Rotating outer glyph circle (Clockwise, 62.4s period).
3. **Inner Sigil Core**: The central stage/path-aware PNG (Counter-clockwise, 249.6s period - 25% speed).
4. **Metrics/Labels**: UI text and path identifiers.

### Core Principle: "Existence as Participation"

The avatar doesn't represent "your level of enlightenment." It represents **your practice participation over time**.

The phone cannot measure attention quality. It can only measure **participation**. And participation patterns over months *are* meaningful—they're just not cognitive assessments.

This is the key philosophical reframe that makes the system honest:

> "Perhaps all we can do is show people their behavior, not their abilities... the avatar system is a measurement of engagement, not status... it's a path, not a state."

### What This Means Practically

- The app literally measures participation and reflects it back
- Not as judgment, not as ranking, but as recognition: "This is how you've been showing up"
- The internal transformation happens through the participation
- The app doesn't need to measure the transformation—it measures the participation that creates the transformation
- Users can verify the pattern: "Yes, I do complete everything" or "Yes, I do vary my practices a lot"

---

## DIMENSION 1: Stages (Vertical Axis)

### What Stages Represent

Stages represent **time + consistency of participation**:
- Seedling → Ember = you're building consistency
- Ember → Flame = your pattern is stabilizing
- Flame → Beacon = you've sustained participation for months
- Beacon → Stellar = you've maintained this for a year+

### Scoring Formula

```javascript
stageScore = (normalizedSessions × 0.35) + (avgAccuracy × 0.65)

// Where:
normalizedSessions = Math.min(totalSessions, 150) / 150
avgAccuracy = lifetime average accuracy (0..1)
```

**Consistency matters more** — avgAccuracy (65% weight) represents how well someone follows through, while sessions (35% weight) represents raw volume.

### The Five Stages

| Stage | Score Range | Color | Visual Character |
|-------|-------------|-------|------------------|
| **SEEDLING** | 0.00 - 0.15 | Cool indigo/blue | Faint, soft glow, slow pulse, fragile and nascent |
| **EMBER** | 0.15 - 0.35 | Warm amber/orange | Medium glow, faster pulse, awakening |
| **FLAME** | 0.35 - 0.55 | Bright white-gold | Sharper geometry, deliberate pulse, purpose |
| **BEACON** | 0.55 - 0.80 | Cyan/crystalline | Multi-color halo, faceted edges, precision |
| **STELLAR** | 0.80 - 1.00 | Iridescent purple | Fractal spirals, cosmic complexity, transcendence |

### Visual Design Philosophy

Each stage is not about "more rings" — it's about **transformation of existing structure**:
- SEEDLING: 6-7 rings, simple, soft
- EMBER: 5-6 rings, warming
- FLAME: 4-5 rings, sharpening
- BEACON: 3-4 rings, faceted/crystalline
- STELLAR: 2-3 rings that dissolve into spiral/fractal geometry

The progression is about **capacity building** — as you practice more, your consciousness becomes more refined, coherent, capable of holding greater complexity and nuance.

### Stage Color Palette

```javascript
SEEDLING: {
  primary: '#818cf8',      // Indigo
  secondary: '#6366f1',
  glow: 'rgba(129, 140, 248, 0.4)'
}

EMBER: {
  primary: '#fb923c',      // Orange  
  secondary: '#f97316',
  glow: 'rgba(251, 146, 60, 0.4)'
}

FLAME: {
  primary: '#fcd34d',      // Gold
  secondary: '#f59e0b',
  glow: 'rgba(252, 211, 77, 0.4)'
}

BEACON: {
  primary: '#22d3ee',      // Cyan
  secondary: '#06b6d4',
  glow: 'rgba(34, 211, 238, 0.4)'
}

STELLAR: {
  primary: '#a78bfa',      // Violet
  secondary: '#8b5cf6',
  glow: 'rgba(167, 139, 250, 0.4)'
}
```

### Stage Transition Animation

When crossing a stage threshold:
1. Pulse outward from center (bright, brief)
2. Rotation surge (rings spin faster momentarily)
3. Both happen together over ~1.5 seconds

### Harmonic Rotation
The avatar uses **counter-rotation** to create visual depth and a "locked center" effect:
- **Outer Rune Ring**: 62.4s clockwise.
- **Inner Sigil Core**: 249.6s counter-clockwise.
- The 1:4 ratio (25%) ensures the core remains anchored even while in motion.

### Hint/Morph System

At 85%+ progress within a stage, the avatar begins to hint at the next stage:
- Color starts shifting toward next stage palette
- Morphs up to 15% toward next stage characteristics
- Creates a sense of approaching transformation

---

## DIMENSION 2: Paths (Horizontal Axis)

### What Paths Represent

Paths are **behavioral participation patterns** — the shape of how someone engages with practice over time.
The avatar system uses 6 canonical paths, all available at all stages. There is no hierarchy or "better" path.

| Path | Geometry Family | Participation Mode |
|------|-----------------|-------------------|
| **DHYANA** | Precision | Structured, single-pointed commitment. |
| **PRANA** | Flowing | Directional, vital, circulatory participation. |
| **DRISHTI** | Faceted | Multi-faceted, analytical, orienting gaze. |
| **JNANA** | Precision | Clarity-focused, high-contrast participation. |
| **SOMA** | Flowing | Restorative, enveloping, soft presence. |
| **SAMYOGA** | Integrated | Balanced, harmonized, non-biased engagement. |

---

## DIMENSION 3: Attention Vectors (Internal/Energy Axis)

### What Vectors Represent

Attention Vectors modulate the **internal energy behavior** of the jewel. They represent micro-patterns in participation pace and rhythm variance.

| Vector | Metaphor | Visual Expression |
|--------|----------|-------------------|
| **EKAGRATA** | Stable | Steady internal glow, perfectly periodic pulse, coherence. |
| **SAHAJA** | Natural | Breathing glow, soft undulations, organic modulation. |
| **VIGILANCE** | Scanning | Scintillating light, angular searching, jittered energy. |

> **Crucial constraint**: Vectors affect only light behavior (pulse/jitter/glow), never structure or silhouette. If the vector is identifiable via grayscale silhouette, it fails validation.

### None of These Are Better

They're just different ways of participating in practice over time. And they probably DO correlate with attention qualities—but the app isn't claiming to measure those. It's measuring what's measurable: how people show up.

### Technical Architecture

```
Events → Weekly Features → Probabilistic Inference → Hysteresis Commit
```

**Atomic Events:**
- Session start/end
- Completion vs. abandonment
- Interruption patterns
- Practice switching

**Weekly Aggregated Features:**
- Duration patterns
- Completion rate
- Switch rate between practices
- Rhythm score (consistency of timing)
- Fragmentation (scattered vs. focused sessions)
- Alive rate (active engagement vs. passive timer-running)

**Sliding Windows:**
- 2 weeks (short-term noise filter)
- 6 weeks (mid-term pattern)
- 12 weeks (long-term commitment)

**Commitment Logic:**
- 3 months minimum before committing to a path
- Similar duration required to switch paths
- "Weather" (temporary variations) don't trigger changes
- Hysteresis prevents oscillation at boundaries

### Path State Machine

```
FORMING → MIXED → TRANSITIONING → COMMITTED → DORMANT
```

- **FORMING**: New user, insufficient data
- **MIXED**: Behavior shows multiple patterns, no dominant
- **TRANSITIONING**: Moving between paths (requires ~3 months)
- **COMMITTED**: Stable pattern for 3+ months
- **DORMANT**: Extended absence, confidence decaying

### Safeguards

1. **Volume Gate**: Minimum 4 sessions/week averaged to infer path
2. **Absence Decay**: Confidence decays exponentially during breaks (half-life: 4 weeks)
3. **Mixed State**: If distance to two paths <20% for 8+ weeks, acknowledge as mixed
4. **No Oscillation**: Hysteresis prevents rapid path flipping

---

## How Stages and Paths Combine

Someone's avatar reflects BOTH dimensions:

> "Someone at Beacon + Sahaja has shown up steadily for 6 months with natural rhythm. That's real. The app can measure it and reflect it back. Whether their internal attention is 'effortless' is between them and their practice—but the behavioral pattern is verifiable."

The **stage** shows duration/consistency.
The **path** shows the shape of that participation.

Both are behavior-based. Both are honest. Both are meaningful.

---

## Design Principles

### What We're NOT Doing

❌ No surveys, questionnaires, or personality typing
❌ No "you are X" identity claims
❌ No gamification, badges, or achievement framing
❌ No black-box ML that cannot be debugged
❌ No claims about attention quality or spiritual attainment

### What We ARE Doing

✅ Showing people their behavior, not their abilities
✅ Making participation visible through honest reflection
✅ Supporting hysteresis, decay, and mixed/forming states
✅ Remaining interpretable to developers and ethically legible to users
✅ Respecting that "planets don't lie in their rotation"

### The Philosophical Win

"Existence as participation" — the app literally measures participation and reflects it back. Not as judgment, not as ranking, but as recognition: "This is how you've been showing up."

That's more honest than any app claiming to measure attention quality. And it's more useful because users can verify it.

---

## Implementation Notes

### Data Sources

```javascript
// From mandalaStore:
totalSessions     // Lifetime session count
avgAccuracy       // Lifetime average accuracy (0..1)
weeklyConsistency // Sessions this week mapped to 0..1

// From practice events:
sessionDuration
completionStatus
practiceType
timestamps
interruptionPatterns
switchingBehavior
```

### Stage Calculation

```javascript
function calculateStageInfo(sessions, accuracy) {
  const normalizedSessions = Math.min(sessions, 150) / 150;
  const stageScore = (normalizedSessions * 0.35) + (accuracy * 0.65);
  const clamped = Math.max(0, Math.min(1, stageScore));

  // Find current stage
  for (let i = 0; i < STAGES.length; i++) {
    const [minScore, maxScore] = STAGES[i].range;
    if (clamped >= minScore && clamped < maxScore) {
      return { currentStage: i, stageProgress: (clamped - minScore) / (maxScore - minScore) };
    }
  }
  
  return { currentStage: STAGES.length - 1, stageProgress: 1 };
}
```

### Key Timeline

- **STELLAR** should be achievable at ~150 sessions with 95%+ accuracy
- Path commitment requires ~3 months of consistent pattern
- Path transition requires similar duration
- "Weather" (short-term variations) should not trigger changes

---

## Future Considerations

### Open Questions

1. **Can someone be on multiple paths simultaneously?**
   - Current spec: Aggregate across all practices, infer one dominant pattern
   - Alternative: Path-per-practice-family if users show different patterns for different practice types
   - This is a future problem visible in actual user data

2. **Session-level attention metrics**
   - Breath timing variance, mid-session rhythm stability, correction patterns
   - Could add texture to path inference
   - Currently unmeasured

### Validation Tests

When user data exists:
- Cluster actual feature vectors (not predefined centroids)
- See if 3 clusters emerge naturally or if you get 2, 4, or a continuum
- Ask users: "Does this path label resonate with how your attention feels in practice?"
- If yes: validate the model
- If no: adjust framing to match what's actually measured

---

## Summary

The avatar system is an honest reflection of participation:

**STAGES** = How long and how consistently you've practiced
**PATHS** = The shape of how you engage with practice

Both are verifiable. Both are meaningful. Neither claims to know what's happening inside your mind.

The internal transformation happens through the participation. The app measures the participation that creates the transformation.

> "The practice IS the path. Showing up consistently changes you regardless of what your 'attention quality' is on any given day. The app just reflects that participation back."

---

---

# AVATAR MATRIX EXPLORATION PLAYBOOK

This section defines the rigorous exploration methodology for generating avatar visual variations across the three-dimensional matrix: **Stage × Path × Attention Vector**.

## Critical Constraint: Separation of Concerns

The avatar matrix is **not a creative exploration**. It is a **measurement instrument design**. Each axis must remain independent and visually isolated to prevent ontological collapse.

### Axis Constraint Table (IMMUTABLE)

This table governs the entire exploration. **If a generated asset violates this table, it is invalid.**

| Axis | Allowed to Change | Forbidden to Change |
|------|-------------------|---------------------|
| **Stage** | Ring count, refinement, palette, material coherence | Pose, symmetry, gesture |
| **Path (Mode)** | Geometry deformation (Precision, Flowing, Faceted), expression style | Color palette, base ring count from stage |
| **Attention Vector** | Glow dynamics, pulse, jitter, diffusion, internal energy behavior | Geometry, pose, palette, structure |

### Locked Axis Definitions

#### STAGE (Vertical Axis)
**What it is:** Scalar function of time × consistency.
**Visual Controls:** Ring count, color palette, material refinement.
**Answers only:** *"How much capacity has been built over time?"*

---

#### PATH (Horizontal Axis)
**What it is:** Behavioral participation modes (Dhyana, Prana, Drishti, Jnana, Soma, Samyoga).
**Visual Controls:** One of 3 Geometry Families (Precision, Flowing, Faceted) + Path-specific expression.
**Answers only:** *"What is the mode of participation?"*

---

#### ATTENTION VECTOR (Internal Axis)
**What it is:** Attentional orientation (Ekagrata, Sahaja, Vigilance).
**Visual Controls:** Internal light behavior only.
**Answers only:** *"What is the flavor of attention within the path?"*

---

## Exploration Methodology: Orthogonal Passes

**Do NOT explore all 5×3×N combinations at once.** That is how meaning collapses.

Instead, explore in **orthogonal passes**, each answering a specific validation question.

---

### PASS 1 — Stage Baseline Lock (No Path, No Vector)

**Goal:** Verify that **Stages alone** communicate increasing duration/consistency without implying superiority or enlightenment.

**Method:**
- Fix Path = neutral (perfect symmetry, no deformation)
- Fix Vector = neutral (steady glow, no jitter)
- Generate: 5 Stages × multiple seeds

**Evaluation Question:**
> "If I showed only these five avatars, would a user intuitively read 'time + consistency'?"

**Pass Criteria:**
- Stellar must feel *refined*, not merely flashy
- Progression must read as capacity-building, not aesthetic escalation
- No stage should implicitly suggest moral or spiritual superiority

---

### PASS 2 — Path Expression Within a Fixed Stage

**Goal:** Verify that **Paths are legible as behavioral shapes**, independent of progress.

**Method:**
- Fix Stage = FLAME (middle, most readable)
- Fix Vector = neutral
- Vary Path: Ekagrata / Sahaja / Vigilance
- Generate multiple seeds per path

**Evaluation Question:**
> "Do these feel like different *ways of showing up*, not different levels?"

**Pass Criteria:**
- If Ekagrata looks "better" than Vigilance, the system is lying
- Paths must be distinguishable by geometry/symmetry alone
- Color palette must remain identical across all paths

---

### PASS 3 — Attention Vector Texture Isolation

**Goal:** Ensure vectors read as *energy behavior*, not personality or virtue.

**Method:**
- Fix Stage = FLAME
- Fix Path = Ekagrata (most structurally stable)
- Vary Attention Vector (e.g., stable / jittered / diffused)

**Evaluation Question:**
> "Does the structure remain identical while the *energy* changes?"

**Pass Criteria:**
- If geometry shifts, the vector is leaking into Path
- Only light dynamics, pulse, and glow should vary
- No structural deformation allowed

---

### PASS 4 — Path × Vector Interaction (Within One Stage)

**Goal:** Test whether vectors *modulate* paths without redefining them.

**Method:**
- Fix Stage = FLAME
- Cross all combinations:
  - Ekagrata × {stable, jittered, diffused}
  - Sahaja × {stable, jittered, diffused}
  - Vigilance × {stable, jittered, diffused}

**Evaluation Question:**
> "Can I still identify the Path even when the energy texture changes?"

**Pass Criteria:**
- Path identity must remain legible across all vectors
- If not, vectors are overpowering shape

---

### PASS 5 — Vertical Consistency Check (Stage Integrity)

**Goal:** Ensure Stage progression remains legible *across all Paths*.

**Method:**
- Pick one Path (e.g., Sahaja)
- Pick one Vector (neutral)
- Generate all 5 Stages

**Evaluation Question:**
> "Does vertical progression read as capacity-building, not aesthetic escalation?"

**Pass Criteria:**
- Stage identity must be preserved across paths
- If Sahaja + Stellar feels fundamentally different from Ekagrata + Stellar, the stage axis is compromised

---

## Prompting Strategy (Z-Image-Turbo Aligned)

### Mandatory Prompt Structure

Each prompt must declare axes **explicitly and separately**:

```
STAGE: Beacon
(controls ring refinement, color palette, material coherence)

PATH: Vigilance
(controls geometry deformation and mass distribution only)

ATTENTION VECTOR: High temporal variance
(controls light jitter and pulse behavior only)

CONSTRAINTS:
- Do not alter geometry based on attention vector
- Do not alter color palette based on path
- SVG-aligned circular rune geometry
- Non-anthropomorphic
- No spiritual symbols
```

This is not verbosity — **it's guardrails**.

---

### Batching Strategy (5070 Ti / Z-Turbo)

Use the GPU for **breadth, not polish**:
- Low steps (6–10)
- CFG conservative (1.0–1.5)
- Many seeds (10+ per combination)
- Fast discard workflow

**You are mapping a phase space, not generating finals.**

---

## Gallery Organization & Curation

### Folder Structure (Immutable)

```
/AvatarMatrix/Sanskrit_Matrix
  /Stage (Seedling, Ember, Flame, Beacon, Stellar)
    /Path (Dhyana, Prana, Drishti, Jnana, Soma, Samyoga)
      /Vector (Ekagrata, Sahaja, Vigilance)
        /stage_vector_path_seed000.png
        /stage_vector_path_seed000.json
```

**Each pass is its own epistemic experiment. Do not mix.**

---

### Metadata Tags (Minimum Required)

For each generated asset:
- `stage` (SEEDLING | EMBER | FLAME | BEACON | STELLAR)
- `path` (Ekagrata | Sahaja | Vigilance | Neutral)
- `attentionVector` (Stable | Jittered | Diffused | Neutral)
- `passNumber` (1 | 2 | 3 | 4 | 5)
- `promptHash` (SHA-256 of full prompt)
- `axisIntegrity` (PASS | FAIL) — Does it violate constraint table?
- `resonance` (1–5) — Gut aesthetic appeal
- `confusionRisk` (YES | NO) — Could users misread this?

**Only assets that pass Axis Integrity are eligible for production.**

---

## What This Gives You

✅ A matrix you can **reason about**, not just feel  
✅ A defensible philosophical position if challenged  
✅ A scalable system when real user data arrives  
✅ Protection against the biggest failure mode: **aesthetic inflation**

**You're not designing avatars. You're designing a measurement instrument that happens to be visible.**

---

---

# NEUTRAL BASELINE SPECIFICATIONS

To execute the orthogonal passes correctly, we must define **precise neutral states** for Path and Attention Vector. These serve as the "zero point" against which variations are measured.

## NEUTRAL PATH SPECIFICATION

**Name:** `Path.Neutral`

**Purpose:** A geometrically balanced, symmetry-pure form that does NOT express any behavioral signature.

### Visual Characteristics

| Property | Specification |
|----------|---------------|
| **Symmetry** | Perfect radial symmetry (n-fold, typically 6 or 8) |
| **Deformation** | Zero. All rings are perfect circles. |
| **Mass Distribution** | Evenly distributed across all rings |
| **Tilt/Pose** | Flat, face-on, no perspective tilt |
| **Fragmentation** | None. Rings are continuous, unbroken |
| **Flow Direction** | None. No implied motion or directionality |

### Prompt Fragment (Neutral Path)

```
Geometry: Perfect radial symmetry, no deformation, no tilt, no fragmentation.
All rings are perfect circles, evenly spaced, face-on view.
No implied motion or directionality in the geometry.
```

### What Neutral Path IS NOT

❌ Not "balanced" in a zen sense — it's geometrically neutral  
❌ Not a fourth path — it's the absence of path expression  
❌ Not the "default" for users — it's a calibration tool  

---

## NEUTRAL ATTENTION VECTOR SPECIFICATION

**Name:** `AttentionVector.Neutral`

**Purpose:** A steady, stable energy state that does NOT express temporal texture or micro-pattern variance.

### Visual Characteristics

| Property | Specification |
|----------|---------------|
| **Pulse Rate** | Steady 1 Hz (60 BPM) |
| **Pulse Amplitude** | 10% opacity variation (80% → 90% → 80%) |
| **Jitter** | None. No randomness in timing or position. |
| **Diffusion** | Minimal. Crisp edges, no soft bloom. |
| **Light Source** | Single, coherent, centered |
| **Temporal Noise** | Zero. Perfectly periodic. |

### Prompt Fragment (Neutral Vector)

```
Light Behavior: Steady 1 Hz pulse, 10% opacity variation (80%–90%).
No jitter, no randomness, no diffusion blur.
Crisp edges, coherent light source, perfectly periodic.
```

### What Neutral Vector IS NOT

❌ Not "calm" or "meditative" — it's metronomic  
❌ Not a desirable end state — it's a measurement baseline  
❌ Not emotionally neutral — it's temporally stable  

---

## COMBINED NEUTRAL BASELINE

When both Path and Vector are neutral, the avatar should read as:

> **"A geometrically pure, metronomically stable form that expresses only Stage."**

This is the foundation for **Pass 1: Stage Baseline Lock**.

### Full Neutral Baseline Prompt Template

```
STAGE: [STAGE_NAME]
(controls ring count, refinement, color palette, material coherence)

PATH: Neutral
Geometry: Perfect radial symmetry, no deformation, no tilt, no fragmentation.
All rings are perfect circles, evenly spaced, face-on view.
No implied motion or directionality in the geometry.

ATTENTION VECTOR: Neutral
Light Behavior: Steady 1 Hz pulse, 10% opacity variation (80%–90%).
No jitter, no randomness, no diffusion blur.
Crisp edges, coherent light source, perfectly periodic.

CONSTRAINTS:
- SVG-aligned circular rune geometry
- Non-anthropomorphic
- No spiritual symbols (lotus, OM, chakra, etc.)
- No text or inscriptions
- Stage-appropriate color palette only
```

---

## PATH VARIATION SPECIFICATIONS

Once neutral is established, we can define deviations for each path.

### Ekagrata (Structured Commitment)

**Geometry Signature:**
- **Symmetry:** High (6-fold or 8-fold)
- **Deformation:** Minimal. Rings may thicken/thin but remain circular.
- **Mass Distribution:** Concentrated toward center or outer edge (structured focus)
- **Tilt/Pose:** Slight front-tilt (implies "leaning in")
- **Fragmentation:** None. Continuous rings (commitment = completion)
- **Flow Direction:** Inward or outward radial flow

**Prompt Fragment:**
```
PATH: Ekagrata (Structured Commitment)
Geometry: High symmetry (6–8 fold), minimal deformation.
Rings may vary in thickness but remain circular.
Mass concentrated toward center or outer edge.
Slight front-tilt. No fragmentation. Inward radial flow.
```

---

### Sahaja (Steady Rhythmic Participation)

**Geometry Signature:**
- **Symmetry:** Medium (4-fold or organic wave patterns)
- **Deformation:** Gentle undulation, flowing curves
- **Mass Distribution:** Evenly distributed with gentle wave modulation
- **Tilt/Pose:** Level, no tilt (natural equilibrium)
- **Fragmentation:** None. Continuous but flowing.
- **Flow Direction:** Circular, tangential (suggests orbit, not thrust)

**Prompt Fragment:**
```
PATH: Sahaja (Steady Rhythmic Participation)
Geometry: Medium symmetry (4-fold or organic wave).
Gentle undulating curves, flowing deformation.
Mass evenly distributed with wave modulation.
Level pose, no tilt. Circular/tangential flow.
```

---

### Vigilance (Exploratory Varied Participation)

**Geometry Signature:**
- **Symmetry:** Low or asymmetric (2-fold or scattered)
- **Deformation:** Irregular, varied thickness and gaps
- **Mass Distribution:** Scattered, clustered in multiple regions
- **Tilt/Pose:** Variable, multi-angle (implies scanning)
- **Fragmentation:** Partial. Rings may have gaps or breaks (exploration = incompletion)
- **Flow Direction:** Multi-directional, scanning pattern

**Prompt Fragment:**
```
PATH: Vigilance (Exploratory Varied Participation)
Geometry: Low symmetry (2-fold or asymmetric).
Irregular deformation, varied thickness, partial gaps.
Mass scattered across multiple regions.
Variable tilt/angle. Multi-directional flow, scanning pattern.
```

---

## ATTENTION VECTOR VARIATION SPECIFICATIONS

### Stable (Low Temporal Variance)

**Already defined as Neutral.** Use Neutral Vector spec.

---

### Jittered (High Temporal Variance)

**Energy Signature:**
- **Pulse Rate:** Irregular, 0.5–2 Hz with randomness
- **Pulse Amplitude:** 20–40% opacity variation (random peaks)
- **Jitter:** Visible positional/rotational jitter (±2–5 degrees)
- **Diffusion:** Medium. Slight bloom around edges.
- **Light Source:** Slightly fragmented, multiple micro-sources
- **Temporal Noise:** High. Unpredictable timing.

**Prompt Fragment:**
```
ATTENTION VECTOR: Jittered (High Temporal Variance)
Light Behavior: Irregular pulse 0.5–2 Hz, 20–40% opacity variation.
Visible positional jitter (±2–5 degrees rotation).
Medium diffusion, slight bloom. Fragmented light sources.
High temporal noise, unpredictable timing.
```

---

### Diffused (Interruption/Fragmentation)

**Energy Signature:**
- **Pulse Rate:** Slow, 0.3–0.5 Hz
- **Pulse Amplitude:** 30–50% opacity variation (deep fades)
- **Jitter:** None. Smooth but diffused.
- **Diffusion:** High. Soft bloom, blurred edges.
- **Light Source:** Distributed, no clear center
- **Temporal Noise:** Low frequency, gentle drift

**Prompt Fragment:**
```
ATTENTION VECTOR: Diffused (Interruption/Fragmentation)
Light Behavior: Slow pulse 0.3–0.5 Hz, 30–50% opacity variation.
No jitter, but high diffusion with soft bloom.
Blurred edges, distributed light source with no clear center.
Low-frequency gentle drift.
```

---

## Usage in Batch Generation

When generating assets, use these specifications as **modular prompt fragments**.

### Example: FLAME + Ekagrata + Jittered

```
STAGE: FLAME
Ring count: 4–5 rings
Color palette: #fcd34d (Gold), #f59e0b (Amber)
Material: Sharpening geometry, deliberate pulse

PATH: Ekagrata (Structured Commitment)
Geometry: High symmetry (6–8 fold), minimal deformation.
Rings may vary in thickness but remain circular.
Mass concentrated toward center. Slight front-tilt.
No fragmentation. Inward radial flow.

ATTENTION VECTOR: Jittered (High Temporal Variance)
Light Behavior: Irregular pulse 0.5–2 Hz, 20–40% opacity variation.
Visible positional jitter (±2–5 degrees rotation).
Medium diffusion, slight bloom. Fragmented light sources.

CONSTRAINTS:
- Do not alter geometry based on attention vector
- Do not alter color palette based on path
- SVG-aligned circular rune geometry
- Non-anthropomorphic
- No spiritual symbols
```

---

## Validation Checklist

For each generated asset, verify:

✅ **Stage Integrity:** Does color palette match stage spec?  
✅ **Path Integrity:** Does geometry match path signature?  
✅ **Vector Integrity:** Does light behavior match vector spec?  
✅ **Axis Separation:** Are forbidden changes absent?  
✅ **Legibility:** Can you identify stage/path/vector independently?  

If any check fails, the asset is **invalid** and must be discarded.

---

## End of Neutral Baseline Specifications
