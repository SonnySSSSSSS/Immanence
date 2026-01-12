# Tracking Specification

## Immanence OS – Canonical Tracking Model

### Purpose

This document defines what is tracked, what is not tracked, and how tracking data is interpreted across Practice, Wisdom, Navigation, and Application domains.

The goals of tracking are:

- To give users clear, meaningful feedback over time
- To show capacity, consistency, and integration, not gamified noise
- To maintain one authoritative data spine
- To avoid duplicate or misleading metrics

### Core Principles (Non-Negotiable)

**Single write spine**
All completed-session tracking flows through `recordPracticeSession`.

**Raw events are stored; insight is derived**
Long-term totals, averages, trends, badges, and “improvement” are never persisted.

**Each practice is tracked independently**
Sound ≠ Visualization ≠ Cymatics ≠ Photic.
Grouping is UI-only.

**Application tracks behavior, not time**
No duration metrics for application modes.

**Short-term vs long-term is explicit**

- Short-term = raw events (sessions, checks, durations)
- Long-term = derived trends and aggregates

**If a metric cannot be explained in one sentence, it is not tracked**

### Universal Tracking Dimensions

Every tracked item must map to one or more of these dimensions:

- **Engagement** – did it happen?
- **Capacity** – can the user sustain more?
- **Quality** – how stable or effective was it?
- **Integration** – does it carry into life or other domains?

If a metric does not serve one of these, it is excluded.

---

### Domain Specifications

#### PRACTICE DOMAIN

**Breathing**

- **Stored (per session)**
  - duration
  - accuracy
  - exitType
  - timestamp / day
- **Derived**
  - total sessions
  - total time spent
  - rolling average accuracy (7 / 30 / 90 days)
  - duration trend (capacity growth)
  - stability trend (abort / early exit rate)

**Insight Meditation**

- **Stored**
  - duration
  - thoughtCounts:
    - planning
    - remembering
    - judging
    - fantasizing
  - exitType
  - timestamp / day
- **Derived**
  - total sessions
  - total time spent
  - thought-type distribution over time
  - dominant thought pattern trend

**Body Scanning**

- **Stored**
  - duration
  - scanType (enum)
  - exitType
  - timestamp / day
- **Derived**
  - sessions per scanType
  - total time per scanType
  - scanType preference trend

**Sound Practice**

- **Stored**
  - duration
  - soundType (optional enum)
  - exitType
  - timestamp / day
- **Derived**
  - total sessions
  - total time spent
  - usage frequency trend

**Visualization Practice**

- **Stored**
  - duration
  - visualizationType (optional enum)
  - exitType
  - timestamp / day
- **Derived**
  - total sessions
  - total time spent
  - visualization preference trend

**Cymatics**

- **Stored**
  - duration
  - cymaticsPattern (optional enum)
  - exitType
  - timestamp / day
- **Derived**
  - total sessions
  - total time spent
  - pattern usage frequency

**Photic Circles**

- **Stored**
  - duration
  - preset / frequency (optional)
  - exitType
  - timestamp / day
- **Derived**
  - total sessions
  - total time spent
  - regularity trend

---

#### RITUAL DOMAIN

**Ritual Library**

- **Stored**
  - ritualId
  - duration
  - timestamp / day
- **Derived**
  - times each ritual performed
  - total time per ritual
  - ritual return frequency

---

#### WISDOM DOMAIN

**Videos**

- **Stored**
  - videoId
  - timeWatched
  - completed (boolean)
  - timestamp / day
- **Derived**
  - videos watched
  - total time spent
  - completion rate

**Treatise**

- **Stored**
  - chapterId
  - timeSpent
  - completed (boolean)
  - timestamp / day
- **Derived**
  - chapters completed
  - total reading time
  - completion percentage
  - badge unlocks (pure derived logic)

---

#### NAVIGATION DOMAIN

**Paths**

- **Stored**
  - pathId
  - completed (boolean)
  - completionDate
- **Derived**
  - paths completed
  - average time per path

**Path Schedule Adherence (Time Precision)**

- **Goal**: Track how early/late the user practices relative to path-defined scheduled practice times (up to 3 per day).
- **Stored (raw events)**
  - scheduledSlotId (or time slot index 1–3)
  - scheduledTime (local time-of-day)
  - actualStartTime (timestamp)
  - deltaMinutes (actualStart - scheduled, negative=early, positive=late)
  - day (YYYY-MM-DD)
  - pathId
  - completion flag (optional: practicedWithinWindow)
- **Derived**
  - adherenceRate (within window) over 7/30/90 days
  - averageDeltaMinutes (signed) and absoluteDeltaMinutes
  - distribution by slot (morning/midday/evening)
  - streaks of on-time adherence (optional derived)
- **Rules**
  - This is NAVIGATION-domain tracking (scheduled intent), not practice-domain tracking.
  - It must not change practice session counts.
  - It should be derived by matching path schedule slots to actual practice session start times.

---

#### APPLICATION DOMAIN

**Mode Usage (Mirror, Prism, Wave, Sword)**

- **Stored**
  - modeId (enum)
  - completed (boolean)
  - timestamp / day
- **Derived**
  - usage count per mode
  - completion rate per mode
  - mode balance distribution
- _No duration tracked. Application measures decisions and response quality, not time tolerance._

**Habit / Quality Tracking**

- **Stored**
  - qualityId (enum)
  - checked (boolean)
  - timestamp / day
- **Derived**
  - total checks per quality
  - daily consistency
  - streaks
  - long-term adherence trend

---

### Short-Term vs Long-Term

**Short-Term (stored)**

- session events
- durations
- categorical counts
- timestamps
- completion flags
- raw delta events

**Long-Term (derived only)**

- totals
- averages
- trends
- streaks
- achievements
- badges

---

### Explicit Exclusions

The following are not tracked or stored:

- “Improvement” as a persisted field
- Composite scores that merge multiple domains
- Mastery levels
- Gamified XP systems
- Time spent in application modes

---

### Authoritative Data Spine

- **Write entry:** `recordPracticeSession`
- **Primary store:** `progressStore`
- **Derived selectors:** `progressStore` selectors (trajectory, timing offsets, aggregates)
- **Dev-only store:** `trackingStore` (not authoritative)

---

### Enforcement Rule

Any new tracking feature must answer:

1. Which domain?
2. Which dimension?
3. Stored or derived?
4. Short-term or long-term?
5. Why it matters to the user?

If any answer is unclear, the feature is rejected or revised.

**End of Specification**
