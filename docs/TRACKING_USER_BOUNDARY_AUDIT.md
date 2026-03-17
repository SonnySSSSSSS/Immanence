# Tracking User Boundary Audit

## Scope

This audit checks tracking, stats, report, archive, and export surfaces for the same class of bug already fixed in the Home Hub side panels: browser-global persisted state showing up under the wrong authenticated user.

Audited areas:

- `src/state`
- `src/reporting`
- `src/components/tracking`
- `src/components/TrackingHub.jsx`
- `src/components/SessionHistoryView.jsx`
- `src/components/ExportDataButton.jsx`
- `src/components/ExportArchiveButton.jsx`
- `src/components/ActivePathState.jsx`
- related auth/sync/hydration helpers reached by repository search evidence

Proof standard used here:

- `confirmed leak`: a visible tracking surface reads a persisted store or `localStorage` key with no active-user ownership boundary
- `ownership-safe`: the visible surface reads from a store that now carries `ownerUserId` / `activeUserId` and is rebound from auth in `App.jsx`
- `suspicious, not proven`: ownership looks incomplete or sync coverage is missing, but local code inspection does not prove a user-facing cross-account leak on the audited surfaces

## Method

I traced each visible surface back to its runtime source of truth, then checked:

1. whether the source persists client state
2. whether that persisted state carries `ownerUserId` / `activeUserId`
3. whether `App.jsx` rebinds that store on auth change
4. whether sync/hydration/export helpers explicitly include that store or key

Reference-safe ownership pattern:

- `src/state/navigationStore.js`
- `src/state/curriculumStore.js`
- `src/state/progressStore.js`
- `src/state/lunarStore.js`

Auth rebinding currently proven in `src/App.jsx`:

- `useUserModeStore.setActiveUserId` at `src/App.jsx:117`
- `useNavigationStore.setActiveUserId` at `src/App.jsx:120`
- `useCurriculumStore.setActiveUserId` at `src/App.jsx:123`
- `useProgressStore.setActiveUserId` at `src/App.jsx:125`
- `useLunarStore.setActiveUserId` at `src/App.jsx:126`

No equivalent auth rebinding was found in `src/App.jsx:727-780` for:

- `useApplicationStore`
- `useWisdomStore`
- `useVideoStore`
- `useModeTrainingStore`
- `useChainStore`
- `useCircuitJournalStore`
- `usePathStore`
- `useJournalStore`
- `useAttentionStore`

## Ownership-Safe Surfaces

| Surface | Upstream source of truth | Persistence ownership proof | Auth rebinding proof | Safety conclusion |
| --- | --- | --- | --- | --- |
| Home Hub left stats | `progressStore` via reporting selectors | `progressStore` now persists `ownerUserId` / `activeUserId`: `src/state/progressStore.js:181-215`, `src/state/progressStore.js:913-953` | `App.jsx` rebinds `progressStore` on auth change: `src/App.jsx:733`, `src/App.jsx:746`, `src/App.jsx:756`, `src/App.jsx:781` | Safe for the inspected hub-stats path |
| Home Hub right stage panel | `lunarStore` | `lunarStore` now persists `ownerUserId` / `activeUserId`: `src/state/lunarStore.js:39-67`, `src/state/lunarStore.js:380-420` | `App.jsx` rebinds `lunarStore` on auth change: `src/App.jsx:734`, `src/App.jsx:747`, `src/App.jsx:757`, `src/App.jsx:782` | Safe for the inspected right-panel stage path |
| `ActivePathState` | `navigationStore` + `progressStore` | Both stores persist `ownerUserId` / `activeUserId`: `src/state/navigationStore.js:252-283`, `src/state/progressStore.js:181-215` | `App.jsx` rebinds both stores: `src/App.jsx:731-733`, `src/App.jsx:744-746`, `src/App.jsx:754-756`, `src/App.jsx:779-781` | Safe for the inspected active-path state path |
| Practice-domain portions of `TrackingHub`, `SessionHistoryView`, and `ReportsPanel` | `progressStore` and `navigationStore` | Backing stores are auth-owned: `src/state/progressStore.js`, `src/state/navigationStore.js` | `App.jsx` rebinds both stores on auth change: `src/App.jsx:731-733`, `src/App.jsx:744-746`, `src/App.jsx:754-756`, `src/App.jsx:779-781` | Safe for the inspected practice/navigation slices only |
| `ExportDataButton` | `progressStore.exportAllData()` | The inspected export path reads only from `progressStore`: `src/components/ExportDataButton.jsx:8`, `src/components/ExportDataButton.jsx:16`, `src/components/ExportDataButton.jsx:133` | `progressStore` is rebound from auth as above | Safe for the currently inspected progress-only export path |

## Confirmed Leaks

### 1. Application heatmap and awareness reporting are browser-global, not user-owned

- Render surfaces:
  - `TrackingHub` application heatmap: `src/components/TrackingHub.jsx:651-658`
  - `SessionHistoryView` application timeline/stats: `src/components/SessionHistoryView.jsx:65-66`, `src/components/SessionHistoryView.jsx:249`, `src/components/SessionHistoryView.jsx:353-358`
  - `ReportsPanel` application reports: `src/components/tracking/reports/ReportsPanel.jsx:70`, `src/components/tracking/reports/ReportsPanel.jsx:136-137`, `src/components/tracking/reports/ReportsPanel.jsx:347-357`
- Upstream source of truth:
  - `src/state/applicationStore.js`
- Persistence proof:
  - awareness/tracker state lives in `awarenessLogs`, `trackerConfig`, and `trackerDaily`: `src/state/applicationStore.js:63-65`
  - persisted under `immanenceOS.applicationState`: `src/state/applicationStore.js:342`
- Missing ownership proof:
  - no `ownerUserId` or `activeUserId` fields exist in `applicationStore`
  - no auth rebinding exists in `App.jsx:727-780`
- Leak mechanism:
  - unowned persisted Zustand store
  - missing auth rebind
- Concrete failing case:
  - User A logs awareness entries or tracker counts on this browser.
  - User A signs out.
  - User B signs in on the same browser.
  - Actual: `TrackingHub`, `SessionHistoryView`, and `ReportsPanel` still read the persisted `applicationStore` payload.
  - Expected: User B should see only B-owned awareness logs and heatmap rows.
- Severity: High
- Recommended correction boundary: persistence and auth ownership in `applicationStore`, not UI filtering

### 2. Wisdom reading and quiz tracking are browser-global, not user-owned

- Render surfaces:
  - `SessionHistoryView`: `src/components/SessionHistoryView.jsx:46-49`, `src/components/SessionHistoryView.jsx:215-236`, `src/components/SessionHistoryView.jsx:386`
  - `ReportsPanel`: `src/components/tracking/reports/ReportsPanel.jsx:66-67`, `src/components/tracking/reports/ReportsPanel.jsx:120-125`, `src/components/tracking/reports/ReportsPanel.jsx:323-330`, `src/components/tracking/reports/ReportsPanel.jsx:452`, `src/components/tracking/reports/ReportsPanel.jsx:574`
- Upstream source of truth:
  - `src/state/wisdomStore.js`
- Persistence proof:
  - `readingSessions` and `quizAttempts` are stored in the persisted state: `src/state/wisdomStore.js:14`, `src/state/wisdomStore.js:34`, `src/state/wisdomStore.js:68`, `src/state/wisdomStore.js:165`
  - persisted under `immanenceOS.wisdom`: `src/state/wisdomStore.js:338`
- Missing ownership proof:
  - no `ownerUserId` or `activeUserId` fields in `wisdomStore`
  - no auth rebinding in `App.jsx:727-780`
- Leak mechanism:
  - unowned persisted Zustand store
  - missing auth rebind
- Concrete failing case:
  - User A completes reading sessions or quizzes.
  - User B signs in later on the same browser.
  - Actual: archive wisdom counts and wisdom reports inherit A's history.
  - Expected: B should start with empty wisdom history until B reads or quizzes.
- Severity: High
- Recommended correction boundary: persistence and auth ownership in `wisdomStore`

### 3. Video watch tracking is browser-global, not user-owned

- Render surfaces:
  - `SessionHistoryView`: `src/components/SessionHistoryView.jsx:51-53`, `src/components/SessionHistoryView.jsx:336-345`
  - `ReportsPanel`: `src/components/tracking/reports/ReportsPanel.jsx:68`, `src/components/tracking/reports/ReportsPanel.jsx:95`, `src/components/tracking/reports/ReportsPanel.jsx:127-133`
- Upstream source of truth:
  - `src/state/videoStore.js`
- Persistence proof:
  - watch state is stored in `byId`, `currentVideoId`, `lastWatchedId`: `src/state/videoStore.js:25`, `src/state/videoStore.js:35`, `src/state/videoStore.js:54-64`
  - persisted under `immanenceOS.videos`: `src/state/videoStore.js:212`
- Missing ownership proof:
  - no `ownerUserId` or `activeUserId`
  - no auth rebinding in `App.jsx:727-780`
- Leak mechanism:
  - unowned persisted Zustand store
  - missing auth rebind
- Concrete failing case:
  - User A watches instructional videos.
  - User B signs in on the same browser.
  - Actual: watch stats and "last watched" reporting still reflect A's state.
  - Expected: B should not inherit A's watch history.
- Severity: High
- Recommended correction boundary: persistence and auth ownership in `videoStore`

### 4. Mode-training exposure/session reporting is browser-global, not user-owned

- Render surfaces:
  - `SessionHistoryView`: `src/components/SessionHistoryView.jsx:68-69`, `src/components/SessionHistoryView.jsx:353-358`
  - `ReportsPanel`: `src/components/tracking/reports/ReportsPanel.jsx:75`, `src/components/tracking/reports/ReportsPanel.jsx:347-351`
- Upstream source of truth:
  - `src/state/modeTrainingStore.js`
- Persistence proof:
  - `sessions` and `modeStats` live in persisted state: `src/state/modeTrainingStore.js:24`, `src/state/modeTrainingStore.js:29`, `src/state/modeTrainingStore.js:243-245`
  - persisted under `immanence-mode-training`: `src/state/modeTrainingStore.js:291`
- Missing ownership proof:
  - no `ownerUserId` or `activeUserId`
  - no auth rebinding in `App.jsx:727-780`
- Leak mechanism:
  - unowned persisted Zustand store
  - missing auth rebind
- Concrete failing case:
  - User A runs application mode sessions.
  - User B signs in later on the same browser.
  - Actual: archive and portfolio/application reporting still show A's mode exposure counts.
  - Expected: B should see only B-owned mode-training stats.
- Severity: High
- Recommended correction boundary: persistence and auth ownership in `modeTrainingStore`

### 5. Chain pattern-review history is browser-global, not user-owned

- Render surfaces:
  - `SessionHistoryView`: `src/components/SessionHistoryView.jsx:71-72`, `src/components/SessionHistoryView.jsx:114`, `src/components/SessionHistoryView.jsx:355`
  - `ReportsPanel`: `src/components/tracking/reports/ReportsPanel.jsx:76-78`, `src/components/tracking/reports/ReportsPanel.jsx:347-351`
  - application pattern review UI also consumes it: `src/components/Application/PatternReview.jsx:49-50`
- Upstream source of truth:
  - `src/state/chainStore.js`
- Persistence proof:
  - `activeChain` and `completedChains` are persisted: `src/state/chainStore.js:84-88`, `src/state/chainStore.js:414`, `src/state/chainStore.js:491`
- Missing ownership proof:
  - no `ownerUserId` or `activeUserId`
  - no auth rebinding in `App.jsx:727-780`
- Leak mechanism:
  - unowned persisted Zustand store
  - missing auth rebind
- Concrete failing case:
  - User A completes chains.
  - User B signs in on the same browser.
  - Actual: chain counts and pattern stats still reflect A's completed chains.
  - Expected: B should not inherit A's pattern-review history.
- Severity: High
- Recommended correction boundary: persistence and auth ownership in `chainStore`

### 6. Circuit journal archive, insights, and export are browser-global, not user-owned

- Render surfaces:
  - `SessionHistoryView`: `src/components/SessionHistoryView.jsx:38`, `src/components/SessionHistoryView.jsx:75`, `src/components/SessionHistoryView.jsx:204-214`
  - `CircuitInsightsView`: `src/components/CircuitInsightsView.jsx:18`
  - `ExportArchiveButton`: `src/components/ExportArchiveButton.jsx:14`, `src/components/ExportArchiveButton.jsx:20-23`
- Upstream source of truth:
  - `src/state/circuitJournalStore.js`
- Persistence proof:
  - entries are stored in `entries`: `src/state/circuitJournalStore.js:57`
  - persisted under `circuit-journal-store`: `src/state/circuitJournalStore.js:263`
- Missing ownership proof:
  - no `ownerUserId` or `activeUserId`
  - no auth rebinding in `App.jsx:727-780`
- Leak mechanism:
  - unowned persisted Zustand store
  - missing auth rebind
- Concrete failing case:
  - User A creates circuit journal entries.
  - User B signs in on the same browser.
  - Actual: archive, insights, and archive export still include A's circuit entries.
  - Expected: B should only see and export B-owned circuit entries.
- Severity: High
- Recommended correction boundary: persistence and auth ownership in `circuitJournalStore`

### 7. Saved navigation path reports are browser-global, not user-owned

- Render surface:
  - `NavigationPathReport`: `src/components/navigation/NavigationPathReport.jsx:36-47`
- Upstream source of truth:
  - direct `localStorage` helper in `src/reporting/pathReport.js`
- Persistence proof:
  - stored under `immanenceOS.pathReports`: `src/reporting/pathReport.js:3`
  - loaded and saved with `window.localStorage`: `src/reporting/pathReport.js:19-36`
- Missing ownership proof:
  - report keys are per run only, not per user: `src/reporting/pathReport.js:12-15`
  - no auth-owned wrapper exists
- Leak mechanism:
  - direct browser-global `localStorage`
  - missing auth-owned wrapper
- Concrete failing case:
  - User A completes a path run and generates a saved path report.
  - User B signs in later on the same browser.
  - Actual: `NavigationPathReport` loads the previously saved browser-global report map.
  - Expected: B should not see A's saved run report.
- Severity: High
- Recommended correction boundary: report persistence helper, not `NavigationPathReport` rendering

## Adjacent High-Risk User-Boundary Leaks

These findings are outside the strictest reading of tracking/report/archive scope, but they are tightly adjacent and use the same broken ownership pattern. They should stay visible, but separate from the core tracking/report/archive leak list.

### 1. Path identity / journey tracking is browser-global, not user-owned

- Render surfaces:
  - Home and navigation path displays: `src/components/HomeHub.jsx:84-85`, `src/components/NavigationSection.jsx:26-27`
  - path journey and warnings: `src/components/PathJourneyLog.jsx:17-27`, `src/components/PathFormingIndicator.jsx:16-17`, `src/components/PathShiftWarning.jsx:17-18`, `src/components/PathCeremony.jsx:28-31`
- Upstream source of truth:
  - `src/state/pathStore.js`
- Persistence proof:
  - path state and history are stored in `currentPath`, `pathStatus`, `practiceLog`, `pathHistory`, `pendingCeremony`: `src/state/pathStore.js:40-63`, `src/state/pathStore.js:139-155`
  - persisted under `immanenceOS.path`: `src/state/pathStore.js:260`
- Missing ownership proof:
  - no `ownerUserId` or `activeUserId`
  - no auth rebinding in `App.jsx:727-780`
- Leak mechanism:
  - unowned persisted Zustand store
  - missing auth rebind
- Concrete failing case:
  - User A establishes or shifts a path on this browser.
  - User B signs in later on the same browser.
  - Actual: Home/navigation path surfaces can continue to reflect A's inferred path and path journey.
  - Expected: B should start from B-owned path state only.
- Severity: High
- Recommended correction boundary: persistence and auth ownership in `pathStore`

## Suspicious But Unproven Surfaces

### 1. Offline-first sync/hydration allowlist does not cover most tracking stores

- Helper layer:
  - `src/state/offlineFirstUserStateKeys.js`
  - `src/state/offlineFirstUserStateSnapshot.js`
  - `src/App.jsx:700-717`
- Proven facts:
  - sync is driven only by `OFFLINE_FIRST_USER_STATE_KEYS`: `src/App.jsx:706-715`
  - that allowlist includes `immanenceOS.progress`, `immanenceOS.navigationState`, `immanenceOS.curriculum`, `immanenceOS.path`, and a few preference keys, but does not include:
    - `immanenceOS.applicationState`
    - `immanenceOS.wisdom`
    - `immanenceOS.videos`
    - `immanence-mode-training`
    - `immanence-chains`
    - `circuit-journal-store`
    - `immanenceOS.pathReports`
    - `immanenceOS.journal`
    - `immanenceOS.attention`
- Why this is only suspicious:
  - omission from the sync allowlist proves incomplete user-state coverage, but by itself does not prove a visible cross-account leak on a given surface
- Missing proof boundary:
  - runtime validation of sign-in/sign-out behavior with remote hydration for the omitted stores

### 2. `journalStore` is persisted globally but not proven to leak on the audited tracking views

- Proof:
  - persisted under `immanenceOS.journal`: `src/state/journalStore.js:279`
  - no ownership boundary exists in the store
  - current usage found in `PracticeSection`, `PostSessionJournal`, and `ritualService`, not in the primary tracking/report/archive surfaces audited here
- Why this is only suspicious:
  - the store is clearly browser-global, but local code search did not prove a current tracking/report/archive surface that exposes another user's journal state
- Missing proof boundary:
  - user-facing runtime path from `journalStore` into an audited archive/report surface

### 3. `attentionStore` is persisted globally but no audited user-facing tracking surface was proven

- Proof:
  - persisted under `immanenceOS.attention`: `src/state/attentionStore.js:263`
  - derives weekly aggregates from `progressStore`: `src/state/attentionStore.js:120-144`
  - no ownership boundary exists in the store
- Why this is only suspicious:
  - I found the store and its persistence, but did not find a current audited report/archive UI that renders it
- Missing proof boundary:
  - a concrete visible surface in the current app that exposes `attentionStore` data cross-account

## Recommended Fix Order

1. `applicationStore`
   - Highest impact because it leaks both the `TrackingHub` application heatmap and multiple archive/report views.

2. `wisdomStore` and `videoStore`
   - These directly corrupt archive counts and portfolio/report outputs for a fresh user.

3. `circuitJournalStore`
   - This leaks archive history, insights, and exported archive content.

4. `modeTrainingStore` and `chainStore`
   - These leak application portfolio and pattern-review data in reports and archive summaries.

5. `pathReport.js`
   - Saved path reports are still in the core tracking/report/archive leak set because they are rendered report artifacts.

6. `pathStore`
   - Treat as an adjacent user-boundary fix, not part of the core tracking/report/archive leak bucket.

7. Sync/hydration allowlist follow-up
   - After store ownership fixes, expand `OFFLINE_FIRST_USER_STATE_KEYS` only for the stores that are meant to sync as user state.

8. `journalStore` and `attentionStore`
   - Audit or fix after a visible user-facing requirement is confirmed.

## Summary

Confirmed ownership-safe after the recent fixes:

- Home Hub left stats
- Home Hub right panel
- progress/navigation-driven tracking surfaces
- `ActivePathState`
- `ExportDataButton` for the currently inspected progress-only export path

Confirmed tracking/report/archive leaks still present:

- application tracking
- wisdom reading/quiz tracking
- video watch tracking
- mode-training stats
- chain history/pattern review
- circuit journal archive/export/insights
- saved navigation path reports

Adjacent high-risk user-boundary leak:

- path identity/journey tracking in `pathStore`

Suspicious but not yet proven from local code paths:

- offline-first sync omissions for several tracking stores
- `journalStore`
- `attentionStore`
