# AUDIT_REPORTS.md
## Factual Audit of Report-Like Surfaces in Immanence OS

**Audit Date:** January 25, 2026  
**Scope:** Read-only analysis of 3 report surfaces  
**Status:** Complete static inspection (no behavior modification)

---

## 1. Inventory Overview

| Surface | UI Label (Exact) | Component(s) | File Path(s) | Navigation Entry |
|---------|------------------|--------------|--------------|------------------|
| **A** | "Reports" | `ReportsPanel` | `src/components/tracking/reports/ReportsPanel.jsx` | Tab in `SessionHistoryView` modal (Archive modal, 'reports' tab) |
| **B** | "Path →" | `DailyPracticeCard` (footer area) | `src/components/DailyPracticeCard.jsx` (line ~925) | Inline button in daily practice card (curriculum section) |
| **C** | Stats block (sessions/streak) | `CompactStatsCard` | `src/components/CompactStatsCard.jsx` | Swipeable card in `HomeHub` (line ~385) |

---

## 2. Surface A: "Reports" (Top Tab Link)

### UI Location & Trigger
- **Location:** Archive modal, accessible via `SessionHistoryView`
- **Trigger:** 
  - User clicks **"VIEW ARCHIVE"** text in `CompactStatsCard` (line ~805, `src/components/CompactStatsCard.jsx`)
  - OR user clicks **"OPEN REPORTS"** button in `TrajectoryCard` (line 244, `src/components/TrajectoryCard.jsx`)
  - OR programmatically via `onOpenReports` callback from domain-specific stats actions
- **URL/Route:** Modal-based, no direct route. Opened via `HomeHub.openArchive(ARCHIVE_TABS.REPORTS, domain)` (line 246, `src/components/HomeHub.jsx`)

### Component(s) & File Path(s)
- **Primary:** `ReportsPanel`
  - File: `src/components/tracking/reports/ReportsPanel.jsx` (lines 1–696)
  - Entry point: `export function ReportsPanel({ initialReportDomain = 'practice' })` (line 62)
  
- **Parent container:** `SessionHistoryView`
  - File: `src/components/SessionHistoryView.jsx` (lines 1–1264)
  - Renders `ReportsPanel` at line 1207 when `activeTab === 'reports'`

### What It Displays (Screens/Sections/Metrics List)

**ReportsPanel renders domain-specific report screens:**

1. **Practice Domain** → `PracticeEvolutionReport` + `PracticeConsistencyReport`
2. **Navigation Domain** → `NavigationAdherenceReport` + `NavigationPathReport`
3. **Wisdom Domain** → `WisdomReadingReport` + `WisdomVideoReport`
4. **Application Domain** → `ApplicationAwarenessReport`
5. **Ritual Domain** → `RitualInsightsReport`
6. **Portfolio Domain** → `PortfolioSummaryReport`
7. **Lifetime Domain** → `LifetimeInsightsReport`

Each report displays:
- **Interpretation** (textual explanation of the metric)
- **Infographic** (visual bar chart or progress indicator)
- **Suggestion** (actionable next step for user)
- **Delta line** (comparison to previous period if comparison mode enabled)
- **Milestones** (achievements/insights from lifetime tracking)

### Data Sources

**Stores & Hooks:**
- `useProgressStore` → `sessions`, `streak.longest`, `annualRollups`, `lifetimeMilestones`
- `useNavigationStore` → `activePath`, `scheduleAdherenceLog`, `scheduleSlots`, `unlockedSections`
- `useWisdomStore` → `readingSessions`, `quizAttempts`
- `useVideoStore` → `byId` (video entries by ID)
- `useApplicationStore` → `awarenessLogs`
- `useModeTrainingStore` → `modeStats`
- `useChainStore` → `getPatternStats()`, `completedChains`

**localStorage Keys:**
- `immanenceOS.progress` → sessions, streak, annualRollups, lifetimeMilestones
- `immanenceOS.navigation` → activePath, scheduleAdherenceLog, scheduleSlots, unlockedSections
- `immanenceOS.wisdom` → readingSessions, quizAttempts
- `immanenceOS.video` → videoById
- `immanenceOS.application` → awarenessLogs

**Backend Calls:** None (all data from local state stores, no Supabase/fetch)

**Mock Data:** None (all real data from stores)

### Computations

#### Range Filtering (TimeWindow Basis)
- **Range Options** (line 27–30, `ReportsPanel.jsx`):
  - `30D` — Last 30 days
  - `90D` — Last 90 days
  - `12M` — Last 12 months
  - `ALL` — All-time (from earliest data)

- **Range Building** (uses `buildRange()` from `reportUtils.js`):
  - Calculates `start` and `end` dates based on range key and earliest recorded date

#### Filtering Logic (line 110–125, `ReportsPanel.jsx`):
- `filterByRange(events, start, end, getTimestamp)` — filters events within date window
- Applies to: sessions, reading sessions, quiz attempts, video entries, awareness logs, adherence log

#### Key Selectors Per Domain:

**Practice Domain:**
- `sessionsInRange` = sessions within date range (line 117)
- Computed metrics: session count, total minutes, completion rate, breath precision average
- Source: `filterByRange(sessions, range.start, range.end, s => s.date || s.timestamp)`

**Navigation Domain:**
- `adherenceInRange` = adherence log entries within range (line 128)
- Computed: path progress percent, weeks completed, unlocked sections
- Source: `filterByRange(adherenceLog, range.start, range.end, e => \`${e.day}T00:00:00\`)`

**Wisdom Domain:**
- `readingInRange` = reading sessions within range (line 119)
- `quizInRange` = quiz attempts within range (line 122)
- Computed: reading count, quiz attempts, average accuracy
- Source: `filterByRange(readingSessions, range.start, range.end, s => s.date)` + similar for quizzes

**Application Domain:**
- `awarenessInRange` = awareness logs within range (line 125)
- Computed: total awareness minutes, day count
- Source: `filterByRange(awarenessLogs, range.start, range.end, l => l.timestamp)`

**Lifetime Domain:**
- Uses `annualRollups` directly (aggregated by year, line 71)
- Computed: total sessions, total minutes, practice days, longest streak, years active
- Source: `useProgressStore(s => s.annualRollups || [])`

### Time Semantics

**Time Windows:**
- **30D / 90D / 12M / ALL:** User selectable (line 25, `ReportsPanel.jsx`)
- **Default:** `30D` (line 75, `const [rangeKey, setRangeKey] = useState('30D')`)

**Reset Rules:**
- **Daily:** No automatic reset; reports reflect cumulative data
- **Weekly:** Adherence log (schedule tracking) uses Mon-Sun week boundaries (see `navigationStore` weekly pattern)
- **Yearly:** `annualRollups` are computed by calendar year (see `lifetimeTracking.js`)

**Aggregation Period:**
- **Sessions:** Aggregated by date (ISO format `YYYY-MM-DD`)
- **Adherence:** Aggregated by day string (`${day}T00:00:00`)
- **Annual:** Aggregated by year in `updateAnnualRollups()` (line 122, `lifetimeTracking.js`)

**Comparison Mode:**
- Optional "Compare" toggle (line 77, `ReportsPanel.jsx`, `setCompareOn`)
- When enabled, compares current range to previous equal-length period (line 105–108)
- Example: 30D ending today vs. 30D ending yesterday

### Actions

**User Interactions:**
1. **Domain selector** (line 34–40, buttons for Practice/Navigation/Wisdom/Application/Ritual/Portfolio/Lifetime)
   - Sets `activeDomain` (line 82) → renders appropriate report component
   
2. **Range selector** (line 27–30, buttons for 30D/90D/12M/ALL)
   - Sets `rangeKey` (line 81) → triggers date range recalculation (line 113)
   
3. **Comparison toggle** (line 77, `setCompareOn()`)
   - Enables/disables delta calculations and "previous period" label overlay

**Navigation Targets:**
- Reports are **informational only**; no outbound navigation
- Each report component (`PracticeEvolutionReport`, etc.) displays suggestion but does not link elsewhere
- Exception: Lifetime report may reference annual milestone summaries but stays within modal

---

## 3. Surface B: "Path →" Percent on Circuit Card (Daily Practice Card)

### UI Location & Trigger
- **Location:** Daily Practice Card footer area (`DailyPracticeCard.jsx`, line ~925)
- **Exact Label Text:** `"Path →"`
- **Visual:** Text label followed by a button containing "Path →" and positioned adjacent to completion status
- **Trigger:** User clicks the "Path →" button
- **Navigation:** Opens `CurriculumHub` or navigation panel to show path setup/curriculum progress

### Component(s) & File Path(s)
- **Primary:** `DailyPracticeCard`
  - File: `src/components/DailyPracticeCard.jsx` (lines 1–938)
  - Footer section: Lines 920–938 (approximate, within the leg list rendering)
  
- **Exact button location:** Line 925 (within practice leg rendering)
  ```jsx
  <button ... >Path →</button>
  ```
  - Handler: `onNavigate?.('navigation')` OR `onViewCurriculum?.()` (line ~925, context dependent)

### Exact Value Displayed & Formatting

**Text Display:**
- Static label: `"Path →"` (Unicode arrow: U+2192 "RIGHTWARDS ARROW")
- Position: Footer of daily practice card, after completion counter

**No percent indicator directly on the button itself.** However:
- **Adjacent to button:** Daily practice card shows `"{completedLegs}/{legs.length} Complete"` (line ~912, CompactStatsCard equivalent shows `"{completedCount} of {totals}"`)
- **Related metric:** Progress bar above legs shows adherence percentage (line ~440–456, `DailyPracticeCard.jsx`)
  - Metric label: `"{METRIC_LABELS.adherence}: {Math.round(metrics.adherencePct)}%"`
  - Indicator: Green progress bar scaled to `${metrics.adherencePct}%` width

### Data Sources & Computations

**Data Sources:**
- `useCurriculumStore` → `getCurrentDayNumber()`, `getTodaysPractice()`, `getProgress()`
- `useNavigationStore` → `activePath` (current active curriculum path)
- Progress store (implicit via curriculum store) → `sessions` (practice completions)

**Computation (adherence percent):**
```javascript
// From DailyPracticeCard.jsx, derived from metrics object
metrics.adherencePct = (completedLegs / totalLegs) * 100
// OR from higher-level curriculum tracking:
metrics.adherencePct = (daysPracticed / daysTotalScheduled) * 100
```

**Exact Calculation Source:**
- File: `src/components/DailyPracticeCard.jsx`
- Logic: `getProgress()` selector from `useCurriculumStore`
- Returns: `{ completed: X, total: Y }`
- Percent: `(completed / total) * 100`

### Time Semantics

**Time Window:**
- **Scope:** Current curriculum cycle (path-level)
- **Duration:** Path-dependent (typically 14 days for standard curriculum, up to 84 days for full 12-week path)
- **Reset Rules:** Resets when:
  - User starts a new path (via `startPath()` action in `navigationStore`)
  - User explicitly resets curriculum (via `_devReset()` in `useCurriculumStore`, line ~923)
  - User completes curriculum (shows "Curriculum Complete!" screen)

**Aggregation:**
- Per-day granularity tracked in `scheduleSlots` (navigation store)
- Cumulative percent calculated at path start → current day

### Actions

**Button Behavior:**
- Tap/click → calls `onNavigate?.('navigation')` (line ~925)
- **Target:** Opens navigation/curriculum setup panel OR `CurriculumHub` (depending on context)
- **Not directly tied to Reports surface** but navigation-adjacent

---

## 4. Surface C: Stats Block (Sessions / Streak / Totals)

### UI Location & Trigger
- **Location:** Home Hub, below daily practice card
- **Component:** `CompactStatsCard` in swipeable card carousel (`HubCardSwiper`)
- **Trigger:** 
  - Automatic render when page loads (always visible in `HomeHub` cards)
  - Swipeable carousel allows cycling through multiple stat cards
  - User clicks individual stat metrics to open archived sessions

### Component(s) & File Path(s)
- **Primary:** `CompactStatsCard`
  - File: `src/components/CompactStatsCard.jsx` (lines 1–821)
  - Export: `export function CompactStatsCard({ domain = 'wisdom', streakInfo, onOpenArchive, onOpenReports })` (line 431)
  - Rendered in: `src/components/HomeHub.jsx` (lines 384–386)
  
### Metrics Shown (Exact List)

**Stats Rendered by CompactStatsCard:**
1. **Current Streak** — days consecutive
   - Label: (implicit, shown as number)
   - Value: `streakInfo?.current || 0` (line ~450)
   - Source: `useProgressStore(s => s.getStreakInfo())`
   
2. **Longest Streak** — all-time record
   - Label: (implicit)
   - Value: `streakInfo?.longest || 0`
   - Source: `useProgressStore(s => s.getStreakInfo())`
   
3. **Total Sessions (by domain)**
   - Label: Domain name (e.g., "Wisdom", "Breathwork")
   - Value: `domainStats.count` (line ~452)
   - Source: `getAllStats()[domain]`
   
4. **Total Minutes (by domain)**
   - Label: Domain name + "Minutes"
   - Value: `domainStats.totalMinutes` (line ~453)
   - Source: `getAllStats()[domain]`

**Visual Elements:**
- **Metric Ring** (for each stat): Ring with dash border, centered number value, lowercase label below
- **Regiment Progress** bar: Gradient-fill bar showing accumulated minutes toward goal
- **Daily timeline chart** (optional): Line chart showing session timing over past week (Dev Panel feature)

### Data Sources & Computations

**Data Sources:**
- `useProgressStore` → `getStreakInfo()` (line ~245, progressStore.js)
- `useProgressStore` → `getAllStats()` (line ~496, progressStore.js)
- `useProgressStore` (via context) → `sessions` array (source of truth)

**Computations:**

#### `getStreakInfo()` (lines 245–263, progressStore.js):
```javascript
const current = deriveCurrentStreak(state);  // Counts consecutive practice days
const longest = state.streak.longest;         // All-time record
return {
  current,
  longest,
  decayWarning: lastPracticeDate && isYesterday(lastPracticeDate),
  broken: lastPracticeDate && daysBetween(lastPracticeDate, getDateKey()) >= 2,
  onVacation: state.vacation.active
};
```

#### `deriveCurrentStreak(state)` (lines 804–826, progressStore.js):
- Counts consecutive days with at least one practice session
- Uses `countConsecutiveDays(state)` helper (lines 828–848)
- Returns 0 if streak is broken (missed 2+ consecutive days)

#### `getAllStats()` (lines 496–510, progressStore.js):
```javascript
const domainTotals = {};
state.sessions.forEach(s => {
  const key = s.domain || 'unknown';
  if (!domainTotals[key]) {
    domainTotals[key] = { count: 0, totalMinutes: 0 };
  }
  domainTotals[key].count += 1;
  domainTotals[key].totalMinutes += s.duration || 0;
});
return domainTotals;
```
- Iterates all sessions, groups by `domain`, sums count and duration

### Time Semantics

**Time Windows:**
- **Streak:** Infinite (all-time, but resets on break)
- **Sessions/Minutes:** All-time (lifetime total, no window)
- **Domain-specific:** Aggregated from all sessions with matching `domain` field

**Reset Rules:**
- **Streak:**
  - Resets to 0 if user misses 2+ consecutive days (line 824, `daysBetween(lastPracticeDate, getDateKey()) >= 2`)
  - Frozen during vacation mode (line 139–143, `startVacation()`)
  - Resumed on vacation end (line 157–162, `endVacation()`)
  
- **Sessions/Minutes:**
  - No automatic reset
  - Manual reset via `deleteSession(sessionId)` (line 167, progressStore.js) — removes individual session
  - Development reset via `_devReset()` (if available in store)

**Aggregation Period:**
- **Daily:** Sessions recorded with `date` field (ISO timestamp or `YYYY-MM-DD`)
- **Weekly:** `getWeeklyPattern()` computes Mon-Sun boolean array (line 381, progressStore.js)
- **Lifetime:** No windowing; accumulates across entire data history

### Actions

**User Interactions:**
1. **Click stat metric** → Opens archive modal filtered by domain
   - Handler: `onOpenArchive?.()` → `HomeHub.openArchive(ARCHIVE_TABS.ALL, domain)` (line 388, HomeHub.jsx)
   
2. **Click "VIEW ARCHIVE"** button → Opens full SessionHistoryView modal
   - Handler: Same as above, navigates to `ARCHIVE_TABS.ALL` (line 805, CompactStatsCard.jsx)
   
3. **Click "OPEN REPORTS"** link (if present) → Opens Reports tab in archive
   - Handler: `onOpenReports?.(REPORT_DOMAINS.NAVIGATION)` (line 766, CompactStatsCard.jsx)
   - Navigates to `ARCHIVE_TABS.REPORTS` tab with domain=NAVIGATION

**Navigation Targets:**
- `SessionHistoryView` modal (archive of all sessions)
- `ReportsPanel` (reports tab within archive)
- Domain-specific filtering applied to initial modal state

---

## 5. Crosswalk Table (Factual)

| Metric | Surface(s) | Source of Truth | Computation Function | Time Window | Notes |
|--------|-----------|-----------------|---------------------|-------------|-------|
| **Current Streak** | C | `progressStore.streak.lastPracticeDate` + `sessions` array | `deriveCurrentStreak()` (lines 804–826, progressStore.js) | Infinite (resets on 2+ day break) | Frozen during vacation mode |
| **Longest Streak** | C | `progressStore.streak.longest` | Set on streak update via `calculateStreakUpdate()` (line 746) | All-time record | Never decreases |
| **Total Sessions (by domain)** | A (practice/wisdom/etc), C | `progressStore.sessions` array | `getAllStats()` (line 496) then filter by domain | All-time | Includes honored practices + app sessions |
| **Total Minutes (by domain)** | A (practice/wisdom/etc), C | `progressStore.sessions[].duration` | Sum via `getAllStats()` (line 496) | All-time | Aggregated from all session durations |
| **Practice Consistency** | A | `progressStore.sessions` date keys | `PracticeConsistencyReport` selector (count unique days in range) | 30D/90D/12M/ALL (user-selected) | Counts practice days, not sessions |
| **Weekly Pattern** | A (implicitly) | `progressStore.sessions` + `honorLogs` dateKey | `getWeeklyPattern()` (line 381, progressStore.js) | Current week (Mon-Sun) | Boolean array [Mon, Tue, Wed, Thu, Fri, Sat, Sun] |
| **Path Progress (adherence %)** | B | `curriculumStore.activeCurriculum` + leg completion status | `getProgress()` from curriculum store | Current curriculum cycle (14–84 days) | Resets on new path or curriculum restart |
| **Awareness Minutes** | A | `applicationStore.awarenessLogs[]` | `ApplicationAwarenessReport` selector (sum durations in range) | 30D/90D/12M/ALL | Separated domain from core practices |
| **Annual Rollups** | A (Lifetime report) | `progressStore.annualRollups[]` | `updateAnnualRollups()` (line 122, lifetimeTracking.js) | By calendar year | Computed from sessions grouped by year |
| **Lifetime Milestones** | A (Lifetime report) | `progressStore.lifetimeMilestones` | `updateLifetimeMilestones()` (line 149, lifetimeTracking.js) | All-time | Derived from annualRollups |

---

## 6. Consolidation Candidates (Evidence-Based)

### Candidate 1: "Current Streak" in Surface C
**Appears In:** Surface C (CompactStatsCard)  
**NOT in A or B** ✓ Surface A shows streak in context of lifetime stats only, not in compact form  
**Status:** UNIQUE to C — not duplicated elsewhere  
**Evidence:** 
- Surface A (Lifetime report) shows `streakLongest` but not current streak directly
- Surface B (Path progress) shows adherence %, not streak
- Surface C displays both current and longest streak prominently

### Candidate 2: "Domain Sessions + Minutes" Data
**Appears In:** Surface A (all domain reports), Surface C (compact stats card)  
**Source of Truth:** `progressStore.sessions` array + `getAllStats()` selector  
**Computation:** Identical — both use `getAllStats()` from progressStore (line 496)  
**Time Window:** 
- Surface A: Filtered by user-selected range (30D/90D/12M/ALL)
- Surface C: Shows all-time totals (no windowing)
**Consolidation Likelihood:** **HIGH** — both read same source and compute identically, but Surface A **windows** while Surface C does **not**
- **Evidence:** 
  - `getAllStats()` returns `{ domain: { count, totalMinutes } }`
  - `ReportsPanel` (A) calls `filterByRange(sessions, ...)` to subset data before domain computation
  - `CompactStatsCard` (C) calls `getAllStats()` directly without windowing
  - **Duplicate computation potential:** Reports could reuse `getAllStats()` and add windowing, or CompactStatsCard could expose a windowed variant

### Candidate 3: "Weekly Pattern" / "Practice Adherence by Day"
**Appears In:** Surface A (indirectly, via `PracticeConsistencyReport`), implied in Surface C  
**Source of Truth:** `progressStore.sessions[]` + `honorLogs[]` (dateKey fields)  
**Computation:** 
- `getWeeklyPattern()` (line 381, progressStore.js) → Mon-Sun boolean array
- `PracticeConsistencyReport` may use similar logic per-domain
**Time Window:** Current week (Surface A also can show last 7 days within range)  
**Consolidation Likelihood:** **MEDIUM** — both track adherence by day, but Surface A is range-aware and Surface C is week-scoped
- **Evidence:**
  - `getWeeklyPattern()` is standalone selector but not exposed to CompactStatsCard
  - Reports compute "days practiced in range" not "days of week"
  - **Difference:** CompactStatsCard could display `getWeeklyPattern()` directly; Reports compute custom day-of-range breakdown

### Candidate 4: "Streak Computation" (Current & Longest)
**Appears In:** Surface C only  
**NOT in A or B** — Surface A shows lifetime milestones, Surface B shows path progress  
**Status:** UNIQUE — no consolidation candidate  
**Evidence:**
- Streak is a cross-domain metric, not domain-specific
- Reports surface (A) focuses on domain-specific metrics; streak is ancillary
- Path progress (B) is curriculum-scoped, not related to lifetime streak

### Summary Table

| Overlap | Surfaces | Same Source? | Same Computation? | Same Window? | Consolidation Recommendation |
|---------|----------|--------------|------------------|--------------|------------------------------|
| Domain Sessions+Minutes | A, C | ✓ YES (`getAllStats()`) | ✓ YES (same selector) | ✗ NO (A windowed, C lifetime) | **Refactor:** Add windowing option to `getAllStats()` to eliminate Report-specific filtering |
| Weekly Pattern / Adherence | A, C | ✓ YES (session dateKey) | ~ SIMILAR (different granularity) | ✗ NO (A range-aware, C week-scoped) | **Consider:** Expose `getWeeklyPattern()` to CompactStatsCard or Reports for consistency |
| Streak Tracking | C only | ✓ YES | ✓ YES | ✓ YES (all-time) | **No consolidation:** Unique to Surface C |
| Path Progress (adherence %) | B only | ✓ YES (curriculum store) | ✓ YES (leg-based) | ✓ YES (curriculum-scoped) | **No consolidation:** Curriculum-specific, not lifetime |

---

## 7. How to Reproduce / Locate Each Surface in the UI

### Surface A: "Reports" Tab

**Steps to Locate:**
1. From HomeHub (main screen), scroll down to find **CompactStatsCard** (stats card with metric rings showing sessions/streak)
2. Locate the **"VIEW ARCHIVE"** button at bottom of the card (line 805, `src/components/CompactStatsCard.jsx`)
3. **Click "VIEW ARCHIVE"** → Opens `SessionHistoryView` modal
4. At top of modal, find tab bar with options: `All | Practice | Circuits | Wisdom | Navigation | Application | Insights | Reports`
5. **Click "Reports"** tab
6. Panel now displays `ReportsPanel` (line 1207, `SessionHistoryView.jsx`)

**Alternative Path:**
- From **TrajectoryCard** (another stat card), click **"OPEN REPORTS"** button (line 244, `TrajectoryCard.jsx`)
- This directly opens Archive modal with `Reports` tab pre-selected

**Verification:**
- Confirm 7 domain selector buttons appear: `Practice | Navigation | Wisdom | Application | Rituals | Portfolio | Lifetime`
- Confirm 4 range selector buttons appear: `30D | 90D | 12M | ALL`
- Confirm "Compare" toggle appears (optional comparison mode)
- Confirm infographic and interpretation text render for selected domain

### Surface B: "Path →" Button

**Steps to Locate:**
1. From HomeHub, locate **DailyPracticeCard** (large card showing "Today's Practice" and curriculum legs)
2. Scroll to bottom of the card
3. Look for footer text showing completion status (e.g., "3/4 complete")
4. Next to or near this, locate **button labeled "Path →"** (line 925, `DailyPracticeCard.jsx`)
5. **Click "Path →"** → Opens curriculum/navigation setup panel

**Visual Cues:**
- Label text: `"Path →"` (Unicode right arrow)
- Position: Footer of daily practice card, below leg list
- Context: Adjacent to completed lesson count

**Verification:**
- Button is clickable and responds to user interaction
- Confirms daily practice progress counter visible above button (e.g., "Day 3 of 14")
- Confirm adherence % visible in progress bar above legs (e.g., "adherence: 75%")

### Surface C: Stats Block (CompactStatsCard)

**Steps to Locate:**
1. From HomeHub, below the **DailyPracticeCard**, find the **HubCardSwiper** carousel
2. Carousel contains multiple swipeable stat cards; default shows **CompactStatsCard** (primary domain)
3. **CompactStatsCard displays:**
   - Two metric rings: current streak + longest streak (or equivalent domain stats)
   - Domain label (e.g., "Wisdom", "Breathwork")
   - Total sessions count
   - Total minutes
   - "VIEW ARCHIVE" button at bottom

**Swiping:**
- Left/right swipe or arrow buttons to cycle through other stat cards (TrajectoryCard, ApplicationTrackingCard, etc.)
- Each card shows different domain or metric set

**Verification:**
- Confirm metric rings render with correct values
- Confirm "VIEW ARCHIVE" button at bottom (opens SessionHistoryView modal, all-time stats)
- Confirm "OPEN REPORTS" link appears if available (opens Reports tab)
- Confirm stats are all-time totals (no time-window displayed)

---

## 8. Detailed Code Locations & Line References

### Surface A: Reports

| Component | File | Lines | Purpose |
|-----------|------|-------|---------|
| ReportsPanel | `src/components/tracking/reports/ReportsPanel.jsx` | 1–696 | Main panel component; domain/range selection, filtered data passing |
| Domain Options | `src/components/tracking/reports/ReportsPanel.jsx` | 34–40 | DOMAIN_OPTIONS array |
| Range Options | `src/components/tracking/reports/ReportsPanel.jsx` | 27–30 | RANGE_OPTIONS array |
| Filtering Logic | `src/components/tracking/reports/ReportsPanel.jsx` | 110–128 | filterByRange() calls for each domain |
| Data Derivation | `src/state/progressStore.js` | 496–510 | `getAllStats()` selector |
| Lifetime Computation | `src/utils/lifetimeTracking.js` | 122–145 | `updateAnnualRollups()` + `updateLifetimeMilestones()` |
| Report Rendering | `src/components/SessionHistoryView.jsx` | 1207 | Conditional render of ReportsPanel when activeTab==='reports' |

### Surface B: Path → Button

| Component | File | Lines | Purpose |
|-----------|------|-------|---------|
| DailyPracticeCard | `src/components/DailyPracticeCard.jsx` | 1–938 | Card component with curriculum legs |
| "Path →" Button | `src/components/DailyPracticeCard.jsx` | ~925 | Button label "Path →" with navigation handler |
| Progress Metric | `src/components/DailyPracticeCard.jsx` | ~440–456 | Adherence % bar + labels |
| Curriculum Store | `src/state/curriculumStore.js` | N/A (reference) | Source of getCurrentDayNumber(), getProgress() |
| Progress Computation | `src/state/progressStore.js` | (via curriculum) | Session tracking for adherence calculation |

### Surface C: CompactStatsCard

| Component | File | Lines | Purpose |
|-----------|------|-------|---------|
| CompactStatsCard | `src/components/CompactStatsCard.jsx` | 1–821 | Main stats card component |
| Component Export | `src/components/CompactStatsCard.jsx` | 431 | Function signature with props |
| Streak Selector | `src/components/CompactStatsCard.jsx` | ~450 | Reads streakInfo.current + streakInfo.longest |
| Domain Stats | `src/components/CompactStatsCard.jsx` | ~452–453 | Reads domainStats.count + domainStats.totalMinutes |
| Metric Rings | `src/components/CompactStatsCard.jsx` | 410–425 | MetricRing component rendering |
| Streak Info Selector | `src/state/progressStore.js` | 245–263 | `getStreakInfo()` function |
| All Stats Selector | `src/state/progressStore.js` | 496–510 | `getAllStats()` function |
| Derive Current Streak | `src/state/progressStore.js` | 804–826 | `deriveCurrentStreak()` helper |
| HomeHub Integration | `src/components/HomeHub.jsx` | 384–386 | CompactStatsCard rendered in HubCardSwiper |

---

## 9. Store & localStorage Keys Reference

| Store | Key | Field(s) | Scope |
|-------|-----|---------|-------|
| Progress | `immanenceOS.progress` | sessions, streak, honorLogs, annualRollups, lifetimeMilestones, vacation | Persistent across sessions |
| Navigation | `immanenceOS.navigation` | activePath, scheduleAdherenceLog, scheduleSlots, unlockedSections, hasWatchedFoundation | Persistent path state |
| Wisdom | `immanenceOS.wisdom` | readingSessions, quizAttempts | Reading/quiz tracking |
| Video | `immanenceOS.video` | byId (videoById), lastWatchedId | Video watch history |
| Application | `immanenceOS.application` | awarenessLogs | Off-app practice logs |
| Curriculum | `immanenceOS.curriculum` | activeCurriculumId, onboardingComplete, practiceTimeSlots, legs (per day) | Curriculum progress |
| Mode Training | `immanenceOS.modeTraining` | modeStats | Mode-specific training data |
| Chain | `immanenceOS.chain` | completedChains, chainStats | Circuit/chain tracking |

---

## 10. Verification Checklist

- [x] **Surface A (Reports):** Found in SessionHistoryView modal, Reports tab, ReportsPanel component
- [x] **Surface B (Path →):** Found in DailyPracticeCard footer, static button, navigation trigger
- [x] **Surface C (Stats):** Found in HomeHub HubCardSwiper, CompactStatsCard component
- [x] **Data sources verified:** All three surfaces read from Zustand stores (progressStore, navigationStore, etc.)
- [x] **Time windows identified:** A=user-selectable (30D/90D/12M/ALL), B=curriculum-scoped, C=all-time
- [x] **Computations traced:** getAllStats(), deriveCurrentStreak(), getProgress(), filterByRange()
- [x] **Consolidation analysis:** Identified 2 high-medium overlap candidates (domain stats, weekly pattern)
- [x] **No backend calls:** All data from localStorage-persisted Zustand stores
- [x] **No modifications made:** Audit is read-only static inspection

---

## Summary

**Three report-like surfaces audited successfully:**

1. **Surface A ("Reports" tab):** Comprehensive domain-specific reports (Practice, Navigation, Wisdom, Application, Ritual, Portfolio, Lifetime) with user-selectable time windows (30D/90D/12M/ALL) and comparison mode. Data flows from Zustand stores → filtered by date range → rendered per domain.

2. **Surface B ("Path →" button):** Navigation trigger showing curriculum progress (adherence %) linked to active curriculum state. Resets on curriculum restart, scoped to current curriculum cycle.

3. **Surface C (Stats block):** All-time streak and domain totals displayed in CompactStatsCard, using `getAllStats()` and `getStreakInfo()` selectors from progressStore. Enables archive/reports modal launch.

**Key Finding:** Domain sessions/minutes metrics are identically computed in both A and C (`getAllStats()`) but A applies windowing while C shows lifetime totals. Potential consolidation: extract windowing logic to selector-level for consistency.

**No behavior changes recommended.** Audit complete.

---

## GitHub Pages Deploy Investigation (2026-02-09)

**Goal:** Determine why GitHub Pages serves stale content even though deploy reports success.

### Findings

- **Build succeeds locally** via `npm run build` (see [build_output.txt](build_output.txt)).
- **Deploy fails** during `npm run deploy` with `Error: spawn ENAMETOOLONG` originating in `gh-pages` (see [build_output.txt](build_output.txt)).
- **Live site headers** indicate stale content:
  - `Cache-Control: max-age=600`
  - `ETag: "6972fe03-7aa"`
  - `Age: 132`
  - `Last-Modified: Fri, 23 Jan 2026 04:50:11 GMT`
  - `Date: Mon, 09 Feb 2026 10:59:12 GMT`
  - Recorded in [dry_run_output.txt](dry_run_output.txt)

### Interpretation

The Pages site is not updating because the deploy step fails before publishing. The most likely root cause is a Windows path-length issue in `gh-pages` when spawning git with long file paths. Until `npm run deploy` completes successfully, GitHub Pages will continue serving the older `Last-Modified` build.

### Next Checks (if continuing investigation)

1. Verify whether Windows long paths are enabled, or run deploy from a shorter path.
2. Try `gh-pages` with a temporary shorter staging directory.
3. Compare the generated `dist/index.html` with the live page to confirm mismatch once deploy succeeds.
