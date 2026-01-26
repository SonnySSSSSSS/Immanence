# AUDIT: Streak = 0 while “Timing Precision – Last 7 Days” shows activity

This audit traces (with code evidence) why the UI can show multiple active “Timing Precision” dots but a `Current Streak` of `0`.

---

## 1) SURFACE MAP

### A) Where “Current Streak” is rendered

- Component: `CompactStatsCard`
- File: `src/components/CompactStatsCard.jsx:740`
- Render source:

```txt
 740:                         {/* Streak - RIGHT */}
 741:                         <div className="text-right">
 742:                             <span className="text-[10px] font-bold uppercase tracking-widest block" style={{ color: 'rgba(255, 255, 255, 0.9)', fontFamily: 'Inter, sans-serif' }}>Current Streak</span>
...
 759:                                 <span className="text-[32px] font-black leading-none tabular-nums" style={{ color: isLight ? config.textMain : `rgba(${baseAccent.r}, ${baseAccent.g}, ${baseAccent.b}, 0.7)` }}>
 760:                                     {streak}
 761:                                 </span>
```

- Selector/function used: `streakInfo` prop → `streak` local variable
- Store source: `useProgressStore().getStreakInfo()` is called by `HomeHub` and passed down as `streakInfo`

`HomeHub` source:

```txt
  42:   const { getStreakInfo, getDomainStats, getWeeklyPattern } = useProgressStore();
...
 164:   const streakInfo = getStreakInfo();
...
 384:             <CompactStatsCard
 387:               streakInfo={streakInfo}
```

Files:
- `src/components/HomeHub.jsx:42`
- `src/components/HomeHub.jsx:164`
- `src/components/HomeHub.jsx:384`

---

### B) Where “Timing Precision – Last 7 days” dots are rendered

- Component: `PrecisionTimeline` (inner component inside `CompactStatsCard`)
- File: `src/components/CompactStatsCard.jsx:211`
- Header text:

```txt
 211: function PrecisionTimeline({ weekOffsets, isLight, r, g, b }) {
...
 276:                 Timing Precision - Last 7 days
```

- Dot “active” predicate:

```txt
 302:                 {days.map((day, i) => {
 303:                     const data = weekOffsets[i] || { offsetMinutes: null, practiced: false };
 304:                     const slot = getVerticalPosition(data.offsetMinutes);
 305:                     const yPos = slot ? slotHeights[slot] : null;
 306:                     const isActive = data.practiced && slot !== null;
...
 332:                             {/* Data Point - Only show if active */}
 333:                             {isActive && (
```

- Selector/function used to compute `weekOffsets`:

```txt
 554:     // Get Timing Offsets for the 5-level chart
 555:     const getWeeklyTimingOffsets = useProgressStore(s => s.getWeeklyTimingOffsets);
 556:     const weekOffsets = useMemo(() => getWeeklyTimingOffsets(domain), [getWeeklyTimingOffsets, domain, sessionsCount]);
```

- Store source: `useProgressStore.getState().getWeeklyTimingOffsets(domain)` (progress store)

File:
- `src/state/progressStore.js:564`

---

## 2) STREAK COMPUTATION (EXACT)

### Source selector: `getStreakInfo`

File: `src/state/progressStore.js:245`

```txt
 245:             getStreakInfo: () => {
 246:                 const state = get();
...
 258:                 const current = deriveCurrentStreak(state);
 259:                 const { lastPracticeDate } = state.streak;
...
 261:                 return {
 262:                     current,
 263:                     longest: state.streak.longest,
 264:                     decayWarning: lastPracticeDate && isYesterday(lastPracticeDate),
 265:                     broken: lastPracticeDate && daysBetween(lastPracticeDate, getDateKey()) >= 2,
 266:                     onVacation: false
 267:                 };
 268:             },
```

### Core computation: `deriveCurrentStreak` and `countConsecutiveDays`

File: `src/state/progressStore.js:832`

```txt
 832: function deriveCurrentStreak(state) {
 833:     const { lastPracticeDate } = state.streak;
 834: 
 835:     if (!lastPracticeDate) return 0;
 836: 
 837:     const today = getDateKey();
...
 840:     if (lastPracticeDate === today) {
 841:         // Count consecutive days backwards from today
 842:         return countConsecutiveDays(state);
 843:     }
...
 846:     if (isYesterday(lastPracticeDate)) {
 847:         return countConsecutiveDays(state);
 848:     }
...
 850:     // Otherwise streak is broken
 851:     return 0;
 852: }
```

File: `src/state/progressStore.js:857`

```txt
 857: function countConsecutiveDays(state) {
 858:     // Get all unique practice dates
 859:     const allDates = new Set([
 860:         ...state.sessions.map(s => s.dateKey),
 861:         ...state.honorLogs.map(h => h.dateKey)
 862:     ]);
...
 872:     if (!allDates.has(getDateKey(current))) {
 873:         current.setDate(current.getDate() - 1);
 874:         if (!allDates.has(getDateKey(current))) {
 875:             return 0; // Neither today nor yesterday
 876:         }
 877:     }
...
 880:     while (allDates.has(getDateKey(current))) {
 881:         count++;
 882:         current.setDate(current.getDate() - 1);
 883:     }
...
 885:     return count;
 886: }
```

### Streak “qualification” conditions (from code)

For a day to count toward consecutive days:
- The day’s `dateKey` must exist in either:
  - `state.sessions.map(s => s.dateKey)` or
  - `state.honorLogs.map(h => h.dateKey)` (`src/state/progressStore.js:859`)
- There is no duration threshold and no completion/exit-type filter in `countConsecutiveDays` (it uses `dateKey` presence only).

But for the *current streak to be non-zero at all*, there is an additional **gate**:
- `state.streak.lastPracticeDate` must be set, and must be **today or yesterday** (UTC day keys via `getDateKey()`), otherwise `deriveCurrentStreak` returns `0`:
  - `if (!lastPracticeDate) return 0;` (`src/state/progressStore.js:835`)
  - `return 0;` when `lastPracticeDate` is neither today nor yesterday (`src/state/progressStore.js:850`)

### Date/time semantics (from code)

Day keying:
- `getDateKey()` uses **UTC date** (`toISOString().split('T')[0]`), not local time:

```txt
   1: export const getDateKey = (date = new Date()) => {
   2:     return date.toISOString().split('T')[0];
   3: };
```

File: `src/utils/dateUtils.js:1`

Week boundaries for the precision meter (Monday start):

```txt
  16: export const getWeekStart = (date = new Date()) => {
  17:     const d = new Date(date);
  18:     const day = d.getDay();
  19:     const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday start
  20:     return new Date(d.setDate(diff));
  21: };
```

File: `src/utils/dateUtils.js:16`

---

## 3) PRECISION METER COMPUTATION (EXACT)

### Selector: `getWeeklyTimingOffsets(domain)`

File: `src/state/progressStore.js:564`

```txt
 564:             getWeeklyTimingOffsets: (domain = 'breathwork') => {
 565:                 const state = get();
 566:                 const now = new Date();
 567:                 const weekStart = getWeekStart(now);
 568:                 weekStart.setHours(0, 0, 0, 0);
...
 570:                 const weekSessions = state.sessions.filter(s => s.domain === domain).filter(s => {
 571:                     const sDate = new Date(s.date);
 572:                     return sDate >= weekStart && sDate < new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
 573:                 });
...
 575:                 if (weekSessions.length === 0) {
 576:                     return Array.from({ length: 7 }, (_, i) => {
...
 579:                         return { dateKey: getDateKey(d), offsetMinutes: null, practiced: false };
 580:                     });
 581:                 }
...
 597:                     const daySessions = weekSessions.filter(s => s.dateKey === dateKey);
 598:                     if (daySessions.length === 0) {
 599:                         weekOffsets.push({ dateKey, offsetMinutes: null, practiced: false });
 600:                         continue;
 601:                     }
...
 607:                     weekOffsets.push({
 608:                         dateKey,
 609:                         offsetMinutes: Math.round(baseline - dayAvg),
 610:                         practiced: true
 611:                     });
 612:                 }
```

### “Active day” conditions (from code)

In `getWeeklyTimingOffsets`:
- A day is `practiced: true` if there is at least one `session` in the current week window where:
  - `session.domain === domain` (`src/state/progressStore.js:570`)
  - `new Date(session.date)` is within `[weekStart, weekStart+7d)` (`src/state/progressStore.js:571`)
  - `session.dateKey === dateKey` for that day (`src/state/progressStore.js:597`)

In `PrecisionTimeline` rendering:
- A dot renders only if: `data.practiced && slot !== null` (`src/components/CompactStatsCard.jsx:306`)
- `slot !== null` requires `offsetMinutes !== null` (`getVerticalPosition` returns null when offset is null; `src/components/CompactStatsCard.jsx:218`)

### Date/time semantics for “last 7 days” chart

Important: despite the label “Last 7 days”, the store function is explicitly “past 7 days (Mon–Sun)”:
- Week start is `getWeekStart(now)` (Monday-start) (`src/state/progressStore.js:567`)
- The session inclusion uses real `Date` comparisons (`new Date(s.date)`) against `[weekStart, weekStart+7d)` (`src/state/progressStore.js:571`)
- Day grouping uses `dateKey` equality, where `dateKey` is computed via `getDateKey()` (UTC day key) (`src/state/progressStore.js:595`)

---

## 4) DATA PATH FROM DEV PANEL (DUMMY POPULATION)

### A) “Inject mock sessions” (writes to `progressStore.sessions`, does NOT update `progressStore.streak.lastPracticeDate`)

File: `src/components/DevPanel.jsx:172`

```txt
 172:     function injectMockPattern(patternKey) {
...
 175:         const realSessions = sessions.filter(s => !s.metadata?.mock);
 176:         useProgressStore.setState({ sessions: realSessions });
...
 178:         const mockSessions = [
 179:             ...generateMockSessions('breathwork', pattern.breathwork),
 180:             ...generateMockSessions('visualization', pattern.visualization),
 181:             ...generateMockSessions('wisdom', pattern.wisdom)
 182:         ];
...
 184:         useProgressStore.setState({ 
 185:             sessions: [...realSessions, ...mockSessions]
 186:         });
```

Generator shape:

File: `src/utils/devDataGenerator.js:11`

```txt
  23:             sessions.push({
  24:                 id: `mock_${domain}_${dayOffset}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
  25:                 domain,
  26:                 date: date.toISOString(),
  27:                 dateKey: getDateKey(date),
  28:                 duration: minutes,
  29:                 timestamp: date.getTime(),
  30:                 metadata: {
  31:                     subType: 'mock',
  32:                     mock: true
  33:                 }
  34:             });
```

Observation (code-based):
- This path populates `progressStore.sessions` with valid `domain`, `date`, `dateKey`, so the precision meter can show practiced days.
- It does **not** update `progressStore.streak.lastPracticeDate`, which is required for `deriveCurrentStreak()` to be non-zero (`src/state/progressStore.js:835`).

### B) “Inject timing pattern” (also writes to `progressStore.sessions`, does NOT update `progressStore.streak.lastPracticeDate`)

File: `src/components/DevPanel.jsx:364`

```txt
 364:     function injectTimingPattern(pattern) {
...
 425:         useProgressStore.setState({ 
 426:             sessions: [...realSessions, ...newSessions]
 427:         });
```

### C) Precision Meter Dev Panel (writes to `trackingStore.devModeOverride`, not to `progressStore.sessions` or `progressStore.streak`)

File: `src/components/dev/PrecisionMeterDevPanel.jsx:12`

```txt
  12:     const setDevModeOverride = useTrackingStore(s => s.setDevModeOverride);
...
  33:     const handleApply = () => {
  34:         setDevModeOverride(mockData);
  35:     };
```

Observation:
- This affects `trackingStore` only (separate from the streak data path used by `HomeHub`/`CompactStatsCard`).

---

## 5) ROOT CAUSE (EVIDENCE-BASED)

### Chosen cause: **(a) Streak reads a different dataset than precision meter**

More precisely:
- The **precision meter dots** are driven by `progressStore.sessions` via `getWeeklyTimingOffsets` (`src/state/progressStore.js:570`).
- The **streak** is gated by `progressStore.streak.lastPracticeDate` inside `deriveCurrentStreak`:
  - `if (!lastPracticeDate) return 0;` (`src/state/progressStore.js:835`)
  - `return 0;` when `lastPracticeDate` is neither today nor yesterday (`src/state/progressStore.js:850`)

This means the app can have sessions (enough to light up dots) but still show `Current Streak = 0` when `streak.lastPracticeDate` is missing/out-of-date.

### Exact failing predicate(s)

One of these must be true for `Current Streak` to show `0`:
- `state.streak.lastPracticeDate` is falsy:
  - `if (!lastPracticeDate) return 0;` (`src/state/progressStore.js:835`)
- OR `state.streak.lastPracticeDate` is neither today nor yesterday (UTC day keys):
  - `return 0;` (`src/state/progressStore.js:850`)

### Why this happens with dev dummy injection (concrete, code-backed)

The dev injection paths write sessions but do not update `streak.lastPracticeDate`:
- `injectMockPattern` updates only `{ sessions: ... }` (`src/components/DevPanel.jsx:184`)
- `injectTimingPattern` updates only `{ sessions: ... }` (`src/components/DevPanel.jsx:425`)

Therefore, after using those dev actions:
- Precision dots can show activity (sessions exist with `domain/date/dateKey`)
- Streak can remain 0 if `progressStore.streak.lastPracticeDate` was `null` or stale before injection

---

## 6) REPRO CHECKLIST (MINIMAL)

1) In app, open Dev Panel (wherever the tracking injection controls live).
2) Use a mock injection action that writes to `progressStore.sessions`:
   - `injectMockPattern(...)` (`src/components/DevPanel.jsx:172`) or
   - `injectTimingPattern(...)` (`src/components/DevPanel.jsx:364`)
3) Observe UI:
   - “Timing Precision – Last 7 days” shows practiced days (dots) (`src/components/CompactStatsCard.jsx:302`)
   - “Current Streak” still shows `0` (`src/components/CompactStatsCard.jsx:742`)
4) Inspect data in DevTools console (to confirm the failing predicate):
   - `useProgressStore.getState().sessions.at(-1)` (should show recent sessions with `dateKey`)
   - `useProgressStore.getState().streak.lastPracticeDate` (likely `null` or not today/yesterday)

