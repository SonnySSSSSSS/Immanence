# Critical Flows (Do Not Break)

Goal: a checklist of the highest-risk user journeys across app boot + HomeHub + Practice + Navigation + persisted Zustand stores.

---

## 1) App Boot → HomeHub Renders (No Crash)
- **Entry point (route/screen):** `src/main.jsx` `getRoute()` → default `'app'` (any path except `/trace` and dev `/__playground`)
- **Exact render path (files/components):** `src/main.jsx:RootComponent` → `src/App.jsx:AppWithBoundary` → `src/components/ErrorBoundary.jsx:ErrorBoundary` → `src/components/auth/AuthGate.jsx:AuthGate` → `src/context/ThemeContext.jsx:ThemeProvider` → `src/App.jsx:App` → `src/components/HomeHub.jsx:HomeHub`
- **Stores touched:** `useDisplayModeStore`, `useTutorialStore`, (inside `HomeHub`) `useProgressStore`, `useLunarStore`, `useAvatarV3State`, `usePathStore`, `useCurriculumStore`, `useNavigationStore`, `useUiStore`
- **Success UI:** Home hub renders with a visible “Today’s Practice” card (or “START SETUP”) and hub navigation buttons (Practice/Wisdom/Application/Navigation).
- **Common breakpoints:**
  - Persisted store migration/hydration throws (e.g., malformed `immanenceOS.navigationState` / `immanenceOS.curriculum` payloads).
  - `localStorage` access throws (privacy mode) during default view / hydration checks.
  - Store getters called from `getState()` are missing or not functions (e.g., schedule getters used by `HomeHub`).

## 2) Hub → Section Navigation (Practice/Wisdom/Application/Navigation)
- **Entry point (route/screen):** `HomeHub` mode buttons (`SimpleModeButton`) or other hub UI calling `onSelectSection`
- **Exact render path (files/components):** `src/components/HomeHub.jsx:HomeHub` → `src/App.jsx:handleSectionSelect` → `src/App.jsx:SectionView` → one of:
  - `src/components/PracticeSection.jsx:PracticeSection`
  - `src/components/WisdomSection.jsx:WisdomSection` (lazy-loaded)
  - `src/components/ApplicationSection.jsx:ApplicationSection` (lazy-loaded)
  - `src/components/NavigationSection.jsx:NavigationSection`
- **Stores touched:** `useDisplayModeStore`, plus section-specific stores (see flows below)
- **Success UI:** Selecting a section shows its main surface (no blank screen), and returning to hub (`activeSection === null`) restores the HomeHub view.
- **Common breakpoints:**
  - Lazy-loaded sections fail to resolve (bundle split/import errors) causing Suspense fallback to stick.
  - Section transitions accidentally unmount/remount stateful session trees (practice) causing resets mid-session.

## 3) Navigation View Selector Modal (Paths ⇄ Compass)
- **Entry point (route/screen):** `Navigation` section → click the selector button (“◇ Paths” / “◈ Compass”)
- **Exact render path (files/components):** `src/components/NavigationSection.jsx:NavigationSection` → `src/components/NavigationSelectionModal.jsx:NavigationSelectionModal`
- **Stores touched:** none (local UI state only: `showCodex`, `navModalOpen`)
- **Success UI:** A modal titled “Navigation” appears with two options (“◇ Paths”, “◈ Compass”); selecting one closes the modal and switches the rendered view (`PathSelectionGrid` vs `CodexChamber`).
- **Common breakpoints:**
  - Click propagation closes the modal before selection is applied.
  - Escape-key listener not attached/detached correctly (modal becomes “stuck” or leaks handlers).

## 4) Begin an Initiation Path → Enforce Time-Slot Rule UI
- **Entry point (route/screen):** `Navigation` → Paths view → select **Initiation Path** (id: `initiation`) from the grid
- **Exact render path (files/components):** `src/components/NavigationSection.jsx:NavigationSection` → `src/components/PathSelectionGrid.jsx:PathSelectionGrid` → (portal overlay) `src/components/PathOverviewPanel.jsx:PathOverviewPanel` → `src/components/schedule/PracticeTimesPicker.jsx:PracticeTimesPicker` → `src/state/navigationStore.js:beginPath`
- **Stores touched:** `useNavigationStore` (sets `activePath`, persists), `useCurriculumStore` (authors canonical `practiceTimeSlots`), `useDisplayModeStore`, `useBreathBenchmarkStore`, `useUiStore` (content launch context from path)
- **Success UI:** With the Initiation Path selected, the schedule picker requires **exactly 2** slots; if violated, the UI shows: **“Please select exactly 2 time slots to begin this path.”** (from `src/utils/scheduleSelectionConstraints.js`), and “BEGIN THIS PATH” is effectively blocked (`aria-disabled` / error).
- **Common breakpoints:**
  - Schedule constraints not enforced (wrong count allowed) due to missing `scheduleSelection` normalization or stale derived state.
  - Times not normalized (`HH:mm`) causing validation to behave unexpectedly across migrations.
  - `crypto.randomUUID()` unavailable → `beginPath()` fails to generate `runId` in some environments.

## 5) Begin Path → Active Path State Renders + Persists
- **Entry point (route/screen):** `PathOverviewPanel` → click “BEGIN THIS PATH” with valid slots selected
- **Exact render path (files/components):** `src/components/PathOverviewPanel.jsx:handleBegin` → `src/state/navigationStore.js:beginPath` → back to `src/components/NavigationSection.jsx` → `src/components/ActivePathState.jsx:ActivePathState` + `src/components/navigation/NavigationPathReport.jsx:NavigationPathReport`
- **Stores touched:** `useNavigationStore` (`activePath`, `scheduleAdherenceLog` later), `useCurriculumStore` (`practiceTimeSlots`)
- **Success UI:** Navigation section shows an “Active Path” block with progress UI; on reload, the active path remains.
- **Common breakpoints:**
  - Persist partialization/migration accidentally drops required `activePath.schedule.selectedTimes`.
  - Overlay state (selected/overlay path) rehydrates and auto-opens (should remain local-only).

## 6) HomeHub Daily Practice Card → Start Slot (Window Gating + Launch Context)
- **Entry point (route/screen):** HomeHub → “Today’s Practice” card → click a slot action (e.g., “Start”)
- **Exact render path (files/components):** `src/components/HomeHub.jsx:handleStartPractice` → `src/state/uiStore.js:setPracticeLaunchContext` → `src/App.jsx:handleSectionSelect('practice')` → `src/components/PracticeSection.jsx:PracticeSection` (consumes launch context)
- **Stores touched:** `useUiStore` (`practiceLaunchContext`), `useNavigationStore` (active path + schedule metrics), `useCurriculumStore` (today’s legs/slots), `useProgressStore` (sessions history), `useBreathBenchmarkStore`
- **Success UI:** Slot buttons correctly reflect gating states (“Not Yet” / “Missed” / “Benchmark Required” / “Start”) and clicking an actionable slot transitions into Practice with the correct launch context.
- **Common breakpoints:**
  - Window gating logic flips due to timezone/date-key mistakes (slot shows “Missed” when it shouldn’t).
  - Launch context is set but not consumed/cleared correctly, causing wrong practice to start or stale params to apply.

## 7) Practice Session → Complete → “SESSION COMPLETE” Summary Visible
- **Entry point (route/screen):** Practice section → start a session (either via DailyPracticeCard launch or PracticeOptionsCard “Start”)
- **Exact render path (files/components):** `src/components/PracticeSection.jsx:PracticeSection` → `src/components/practice/PracticeOptionsCard.jsx:PracticeOptionsCard` → session surface (varies by practice: `BreathingRing`, `SensorySession`, `VisualizationCanvas`, etc.) → stop/complete handler → `src/components/practice/SessionSummaryModal.jsx:SessionSummaryModal`
- **Stores touched:** `useCurriculumStore` (active practice session/leg completion), `useProgressStore` (session history), `useNavigationStore` (schedule adherence logging), `useTempoAudioStore` / `useTempoSync*` (audio/timing), `useJournalStore`, `useSessionOverrideStore`
- **Success UI:** After completion, a modal shows **“SESSION COMPLETE”** with practice + duration stats and a Continue/next-step path.
- **Common breakpoints:**
  - Completion path doesn’t set `sessionSummary` / `showSummary` → user returns to menu without confirmation.
  - Practice tree unmount/remount during transitions resets session state mid-run (regression risk called out in `SectionView` comment).
  - Audio/tempo sessions not stopped/ended, leaving background audio or timers running after completion.

## 8) Reload → Persisted State Rehydrates Without Auto-Opening Overlays
- **Entry point (route/screen):** Browser reload after starting a path and/or completing sessions
- **Exact render path (files/components):** Zustand `persist()` rehydrate → `src/state/navigationStore.js` `onRehydrateStorage` + migrations → `src/state/curriculumStore.js` migrations → `src/components/HomeHub.jsx:HomeHub` + `src/components/NavigationSection.jsx:NavigationSection`
- **Stores touched:** persisted keys: `immanenceOS.navigationState` (`useNavigationStore`), `immanenceOS.curriculum` (`useCurriculumStore`) + other persisted stores as applicable (e.g., `useProgressStore`)
- **Success UI:** After reload, HomeHub and Navigation show the expected persisted state (active path + schedule), and no selection/overlay modal is auto-opened.
- **Common breakpoints:**
  - Migration drops/renames fields (legacy `activePath` keys) resulting in missing schedule times or crashes.
  - Rehydrate ordering causes schedule slots to be empty until a later render (HomeHub uses both curriculum + navigation schedule sources).

---

## Manual Smoke Checklist (2 minutes)
- Hard reload the app (`Ctrl+Shift+R`) and confirm the HomeHub renders (see “Today’s Practice” / “START SETUP”).
- Click **Navigation** from the hub and confirm the selector button (“◇ Paths” / “◈ Compass”) is visible.
- Click the selector button, choose **◇ Paths**, and confirm the modal closes.
- In the path grid, select **Initiation Path** and confirm the overlay opens with “Step 2: Select Time Slots”.
- Select **only 1** time slot and click **BEGIN THIS PATH**; confirm the error text “Please select exactly 2 time slots to begin this path.” appears.
- Select a **second** time slot and click **BEGIN THIS PATH**; confirm “Active Path” UI appears in Navigation.
- Return to HomeHub and confirm “Today’s Practice” shows slot actions (e.g., “Not Yet”/“Start” depending on window).
- Start any **actionable** practice (from Today’s Practice or Practice section), then immediately end/complete it; confirm **“SESSION COMPLETE”** appears.
- Reload the page and confirm the active path state persists and no path overlay/modal auto-opens.
- Open the hub **Session History** overlay and confirm it opens and closes without crashing.
