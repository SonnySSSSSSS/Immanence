# Immanence OS Avatar System Documentation

## Overview

The avatar system in Immanence OS has two independent dimensions:
1. **STAGES** — The vertical axis representing duration and consistency of participation
2. **PATHS** — The horizontal axis representing the behavioral shape of participation

Both dimensions are behavior-based. Both are honest. Neither makes claims about internal cognitive states or spiritual attainment.

---

## Philosophical Foundation

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

### Hint/Morph System

At 85%+ progress within a stage, the avatar begins to hint at the next stage:
- Color starts shifting toward next stage palette
- Morphs up to 15% toward next stage characteristics
- Creates a sense of approaching transformation

---

## DIMENSION 2: Paths (Horizontal Axis)

### What Paths Represent

Paths are **behavioral participation patterns** — the shape of how someone engages with practice over time.

**Critical reframe**: These are NOT attention quality assessments. They are pattern recognitions based on measurable behavior.

| Path | Original Concept | Actual Measurement |
|------|------------------|-------------------|
| **Ekagrata** | "Narrow, sustained focus" | **Structured committed participation** |
| **Sahaja** | "Effortless ambient presence" | **Steady rhythmic participation** |
| **Vigilance** | "Scanning, watchful attention" | **Exploratory varied participation** |

### Behavioral Signatures

**EKAGRATA PATH — Structured Commitment**
- High completion rate (completes what they start)
- Stable rhythm (shows up consistently)
- Focused repetition (sticks with practices)
- The "marathon training" pattern

**SAHAJA PATH — Natural Rhythm**
- Moderate completion (doesn't force completion)
- High rhythm score (natural cadence without rigid structure)
- Low friction (shows up regularly without pushing)
- The "walking daily" pattern

**VIGILANCE PATH — Active Exploration**
- Varied practices (explores different approaches)
- Higher interaction/switch rate
- Completes cycles but moves between modalities
- The "cross-training" pattern

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
