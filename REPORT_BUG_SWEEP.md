# Bug Sweep Report (static + attempted automated checks)

Date: 2026-01-25  
Scope: pre-ship “fix now” triage (no refactors, no code changes made).

## A) Executed commands (with outputs)

Environment:
- `node -v` → `v24.12.0`
- `npm -v` → `11.6.2`

Attempted installs:
- `npm ci` → **FAIL**
  - Excerpt:
    - `npm error code EPERM`
    - `EPERM: operation not permitted, unlink '...\\node_modules\\rolldown-binding.win32-x64-msvc.node'`
  - Note: re-run with escalated permissions produced the same `EPERM` (likely file lock / AV / dev server holding the native binding).

Lint / build / typecheck / tests:
- `npm run lint` → **FAIL**
  - Excerpt: `'eslint' is not recognized as an internal or external command`
- `npm run build` → **FAIL**
  - Excerpt: `'vite' is not recognized as an internal or external command`
- `npm run typecheck` → **FAIL** (no script)
  - Excerpt: `Missing script: "typecheck"`
- `npm test` → **FAIL** (no script)
  - Excerpt: `Missing script: "test"`

Practical blocker noted during checks:
- `node_modules/.bin` is missing, and `node_modules` appears incomplete (e.g. `eslint`/`vite` binaries not present), so `npm run lint/build` cannot work until install is repaired.

## B) Top 10 “Fix now” issues

### 1) Practice sessions recorded into `sessionsV2`, but “progress” UI + streak + stats read `sessions`

- **Symptom/impact**
  - “Current Streak”/domain stats/weekly charts can stay at 0/empty even after completing practice (or show mismatched activity).
  - `updateLifetimeTracking()` can recompute rollups from an empty dataset, potentially wiping visible lifetime aggregates.
- **Code evidence**
  - Session write path records only V2:
    - `src/services/sessionRecorder.js:76-195` (writes via `recordSessionV2`)
    - `src/state/progressStore.js:91-106` (`recordSessionV2` only appends `sessionsV2`)
  - Major reads still use legacy `sessions`:
    - `src/state/progressStore.js:245-267` (`getStreakInfo` → `deriveCurrentStreak`)
    - `src/state/progressStore.js:273-323` (`getDomainStats` uses `state.sessions`)
    - `src/state/progressStore.js:564-612` (`getWeeklyTimingOffsets` uses `state.sessions`)
    - `src/state/progressStore.js:832-886` (streak counts only `sessions` + `honorLogs`)
    - `src/state/progressStore.js:761-772` (`updateLifetimeTracking` uses `state.sessions`)
  - This also matches the audit symptom: `AUDIT_STREAK_VS_PRECISION.md` (streak can be 0 while “Timing Precision” shows activity).
- **Why it matters**
  - This is a core “data not counted” regression risk: users can practice but see no progress/streak.
- **Minimal fix suggestion (no refactor)**
  - Bridge V2 → legacy reads in one place:
    - Option A: in `recordSessionV2`, also update `streak.lastPracticeDate` (and any other immediately-needed fields), and optionally push a minimal “legacy session” into `sessions` for selectors still reading it.
    - Option B: update the specific selectors used on the Home Hub (`getStreakInfo`, `getDomainStats`, `getWeeklyTimingOffsets`, `updateLifetimeTracking`) to read `sessionsV2` (and map V2 into the fields they need).
- **Verification step**
  - Complete a practice session through `recordPracticeSession()`; confirm Home Hub stats/streak update immediately without requiring DevPanel injection.

### 2) `recordPracticeSession()` always returns `null` (breaks callers expecting a session object/id)

- **Symptom/impact**
  - Callers that use the returned session (e.g. to store last session id, start journaling/micronote flows) will silently do nothing.
- **Code evidence**
  - `src/services/sessionRecorder.js:99` (`let recordedSession = null;`)
  - `src/services/sessionRecorder.js:195` (`return recordedSession;`) — no assignment ever happens.
  - Callers check the return value:
    - `src/components/PracticeSection.jsx:1003-1062` (uses `if (recordedSession) { setLastSessionId(...) ... }`)
- **Why it matters**
  - Breaks post-session UX and any downstream features that need the recorded id.
- **Minimal fix suggestion (no refactor)**
  - Set `recordedSession = normalizedSession` (or directly return `normalizedSession`) after id assignment and before store write.
- **Verification step**
  - Finish a session and confirm `recordedSession.id` exists and downstream UI/actions run.

### 3) `HomeHub` leaks `resize` listeners (remove uses a different function reference)

- **Symptom/impact**
  - Navigating away/back (or HMR) accumulates `resize` listeners; each resize triggers multiple updates/renders.
- **Code evidence**
  - `src/components/HomeHub.jsx:141-144`:
    - `addEventListener("resize", () => update("resize"))`
    - `removeEventListener("resize", () => update("resize"))` (different function instance → no removal)
- **Why it matters**
  - Performance degradation and hard-to-debug duplicated UI updates.
- **Minimal fix suggestion (no refactor)**
  - Hoist the handler to a stable reference (`const onResize = () => update("resize")`) and use it for both add/remove.
- **Verification step**
  - Navigate away/back to the hub several times; on resize, confirm only one update fires (no repeated logs/renders).

### 4) `HomeHub` registers the same `'dev-cloud-change'` listener twice

- **Symptom/impact**
  - Duplicate state updates and renders when DevPanel triggers cloud changes.
- **Code evidence**
  - `src/components/HomeHub.jsx:152-153` and `src/components/HomeHub.jsx:207-208` both add/remove `'dev-cloud-change'`.
- **Why it matters**
  - Avoidable performance overhead and potential “double-setState” edge cases.
- **Minimal fix suggestion (no refactor)**
  - Remove the duplicate effect (keep a single listener).
- **Verification step**
  - Trigger the event once; confirm `setCloudBackground` runs once.

### 5) Local date keys are parsed with `new Date("YYYY-MM-DD")` (UTC parsing) in path progress/miss calculations

- **Symptom/impact**
  - Off-by-one day metrics in some timezones (especially around midnight), affecting day index, adherence %, and “broken”/missed-day state.
- **Code evidence**
  - `src/state/navigationStore.js:411-412`:
    - `const startDay = new Date(startedAtLocalKey);`
    - `const today = new Date(todayKey);`
  - `src/state/navigationStore.js:479-480`:
    - `let currentDate = new Date(todayKey);`
    - `const startDate = new Date(startedAtLocalKey);`
- **Why it matters**
  - JS date-only string parsing is UTC; but these keys are explicitly “local timezone” keys (`getLocalDateKey`), so the math can drift by timezone offset.
- **Minimal fix suggestion (no refactor)**
  - Replace `new Date(dateKey)` with a tiny helper that constructs a local Date (`new Date(y, m-1, d)`) from the key string.
- **Verification step**
  - Start a path near local midnight; confirm `dayIndex` increments only when the local date changes.

### 6) Streak “decay/broken” logic mixes UTC day keys with local-date arithmetic

- **Symptom/impact**
  - Streak can appear broken/at risk incorrectly near timezone boundaries or DST changes.
- **Code evidence**
  - `getDateKey` is UTC (`toISOString`): `src/utils/dateUtils.js:1-3`
  - Local arithmetic used to compute “yesterday”:
    - `src/state/progressStore.js:28-32` (`new Date(); setDate(getDate()-1); getDateKey(yesterday)`)
  - `daysBetween` parses `YYYY-MM-DD` with `new Date(dateKey)` (UTC parsing) and uses millisecond math:
    - `src/state/progressStore.js:13-21`
  - Broken predicate:
    - `src/state/progressStore.js:265` (`daysBetween(lastPracticeDate, getDateKey()) >= 2`)
- **Why it matters**
  - This is the gating logic for “current streak”. Small key/zone mismatches produce highly-visible “streak reset” bugs.
- **Minimal fix suggestion (no refactor)**
  - Compute `todayKey`/`yesterdayKey` consistently from UTC day keys (derive yesterdayKey from todayKey), and compute day diffs by dateKey arithmetic (not local `setDate`).
- **Verification step**
  - With a timezone west of UTC, practice near local evening; confirm streak doesn’t flip unexpectedly at local midnight.

### 7) “Timing Precision – Last 7 days” is not “last 7 days” and mixes local week boundaries with UTC day keys

- **Symptom/impact**
  - Dots can appear under the “wrong day”, and the label can mislead users (it’s a Monday-start week window, not a rolling 7-day window).
- **Code evidence**
  - Week window uses local Monday start and Date comparisons:
    - `src/state/progressStore.js:567-573`
  - Day grouping uses `dateKey` (UTC key):
    - `src/state/progressStore.js:597-611`
- **Why it matters**
  - Any user-facing time visualization is high-trust; these inconsistencies are classic “why does the chart disagree with reality” bugs.
- **Minimal fix suggestion (no refactor)**
  - Either (A) rename UI copy to “This week (Mon–Sun)”, or (B) implement an actual rolling last-7-days window using consistent local keys.
- **Verification step**
  - Create sessions on boundary days (Sun/Mon, near midnight local); confirm dots land on expected days.

### 8) `crypto.randomUUID()` used without fallback in navigation store

- **Symptom/impact**
  - Hard crash in environments lacking `crypto.randomUUID` (older browsers, some webviews, or non-secure contexts).
- **Code evidence**
  - `src/state/navigationStore.js:55` and `src/state/navigationStore.js:511`
- **Why it matters**
  - A single missing API can break path start/restart, blocking a core flow.
- **Minimal fix suggestion (no refactor)**
  - Use the same fallback pattern used elsewhere in the repo (e.g. `crypto?.randomUUID?.() || String(Date.now())`).
- **Verification step**
  - Run in a browser without `crypto.randomUUID`; confirm `beginPath` still works.

### 9) YouTube embed initialization can race/overwrite global callback

- **Symptom/impact**
  - If multiple `VideoPlayer` instances mount while `window.YT` is still loading, `window.onYouTubeIframeAPIReady` gets overwritten and some players may never initialize.
- **Code evidence**
  - Script injection: `src/components/VideoPlayer.jsx:92-95`
  - Global callback overwrite: `src/components/VideoPlayer.jsx:114`
- **Why it matters**
  - “Video won’t load sometimes” is a high-severity UX failure and hard to reproduce.
- **Minimal fix suggestion (no refactor)**
  - Chain existing `window.onYouTubeIframeAPIReady` instead of overwriting; also add an `id` to the injected script tag and check for it before reinserting.
- **Verification step**
  - Open/close videos quickly or render two players on one screen; confirm both initialize reliably.

### 10) Production console tracing/log spam in hot paths (perf + privacy risk)

- **Symptom/impact**
  - Console noise and performance overhead in production, plus leaking internal state stacks.
- **Code evidence**
  - `src/components/HomeHub.jsx:70-75` (console.trace)
  - `src/components/HomeHub.jsx:96-127` (console.groupCollapsed/table on layout + resize)
  - `src/state/displayModeStore.js:166-169` (logs on every resize/orientation change)
- **Why it matters**
  - Pre-ship polish: consoles should be quiet unless explicitly in dev/admin mode.
- **Minimal fix suggestion (no refactor)**
  - Wrap logs behind `import.meta.env.DEV` (or a persisted admin flag).
- **Verification step**
  - Production build run: open DevTools → verify no repeated logs during normal navigation/resizing.

## C) “Fix soon” issues (lower risk)

- `src/components/FeedbackModal.jsx:30-33` unguarded `JSON.parse(localStorage.getItem(...))` can throw if storage is corrupted; wrap parse in try/catch and fall back to `[]`.
- `src/hooks/useWakeLock.js:33-39` visibility-change re-request condition checks `wakeLockRef.current !== null` (likely inverted for re-acquire after release); may fail to re-acquire after tab switching.
- `src/services/audioGuidanceService.js:133-145` fade-in interval isn’t tracked/cleared if `stop()` is called mid-fade (minor leak/edge behavior).

## D) Noise bucket (safe to ignore for ship)

- Large generated file warning (seen in existing `eslint_full_report.txt`): Babel “deoptimised styling” for `src/data/treatise.generated.js` due to size > 500KB (expected for generated content).
- `src/graveyard/**` and `src/_legacy/**` timer/RAF patterns likely not in production paths (treat as non-blocking unless referenced by routing).

