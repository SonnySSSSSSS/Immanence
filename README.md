# Immanence OS - Practice Journal System

Complete circuit training practice journal with insights, editing, and export functionality.

## Overview

Immanence OS circuit journal system captures detailed practice data across sequential exercises (circuits), stores assessments, and provides visual insights into attention quality, challenges faced, and exercise performance patterns.

### Key Features

- **Circuit Tracking**: Log multi-exercise practice sessions with per-exercise timing
- **Rich Assessments**: Capture attention quality, challenges, and detailed notes
- **Visual Insights**: Line charts (attention trends), bar charts (challenge frequency), heatmaps (exercise performance)
- **Edit & Delete**: Safely modify or remove entries with confirmations
- **Export Data**: Download as JSON or CSV for analysis
- **Dark/Light Mode**: Adaptive UI matching application theme
- **Accessibility**: ARIA labels, keyboard navigation, screen reader support
- **Error Handling**: Graceful error boundaries with user-friendly messages

## Architecture

### State Management (Zustand Stores)

- **circuitManager** - Circuit definitions and session execution tracking
- **circuitJournalStore** - Journal entries with assessments and metadata
- **progressStore** - Overall practice session logging
- **lunarStore** - Lunar phase metadata
- **displayModeStore** - UI theme preferences

### Components

#### Core Components

- `CircuitTrainer` - Select preset or custom circuits
- `CircuitJournalForm` - Capture post-circuit assessments
- `SessionHistoryView` - Archive modal with tabs (All/Circuits/Sessions/Insights)

#### Phase 3: Insights

- `CircuitInsightsView` - Three-chart visualization dashboard
  - Line chart: Attention Quality Trend
  - Bar chart: Challenge Frequency
  - Heatmap: Exercise Performance by Type

#### Phase 4: Polish

- `CircuitEntryCard` - Individual entry display with edit/delete
- `CircuitEntryEditModal` - Update assessments and notes
- `DeleteConfirmationModal` - Safe deletion with confirmation
- `ExportArchiveButton` - JSON/CSV export menu

#### Phase 5: Final Polish

- `ErrorBoundary` - Catch and display errors gracefully
- `AccessibleModal` - ARIA-compliant modal wrapper
- `LoadingIndicator` - Loading states with accessibility

### Integration Layer

- `circuitIntegration.js` - Bridges CircuitTrainer UI to Zustand stores
  - `initializeCircuitSession()` - Start circuit in store
  - `completeCircuitSession()` - End circuit, log to progressStore
  - `saveCircuitJournal()` - Save assessment from form
  - Export/query functions for archive

## Data Flow

### Circuit Completion → Journaling

```
User completes circuit
  ↓
circuitManager.completeCircuit()
  → Returns completedCircuitLog
  ↓
PostSessionJournal detects circuit
  → Routes to CircuitJournalForm
  ↓
User submits assessment
  → circuitJournalStore.createEntry()
  → circuitJournalStore.updateOverallAssessment()
  → circuitManager.linkJournalEntry()
  ↓
Entry appears in SessionHistoryView archive
```

### Data Storage

All data persists to localStorage via Zustand `persist` middleware:

- **Circuit entries**: ~0.5-2KB per entry
- **100 circuits over 6 months**: ~50-100KB total
- **localStorage limit**: 5-10MB (no concerns)

## Usage

### Starting a Circuit

```javascript
import { CircuitTrainer } from "./components/Cycle/CircuitTrainer";
import { initializeCircuitSession } from "./services/circuitIntegration";

function PracticeScreen() {
  const handleCircuitSelected = (circuit) => {
    const result = initializeCircuitSession(circuit);
    if (result.success) {
      // Navigate to practice UI with result.session
    }
  };

  return <CircuitTrainer onSelectCircuit={handleCircuitSelected} />;
}
```

### Viewing Archive & Insights

```javascript
import { SessionHistoryView } from "./components/SessionHistoryView";

function StatsCard() {
  const [showArchive, setShowArchive] = useState(false);

  return (
    <>
      <button onClick={() => setShowArchive(true)}>VIEW ARCHIVE</button>
      {showArchive && (
        <SessionHistoryView onClose={() => setShowArchive(false)} />
      )}
    </>
  );
}
```

## API Reference

### circuitManager Store

```javascript
// Create circuit definition
createCircuit({ name, description, exercises });

// Start session
beginCircuit(circuitId, sessionMode);

// Complete session
completeCircuit();

// Get all circuits
getAllCircuits();

// Get specific circuit
getCircuit(circuitId);
```

### circuitJournalStore

```javascript
// Create entry
createEntry({ circuitId, circuitName, exercises, ... })

// Update overall assessment
updateOverallAssessment(entryId, { attentionQuality, challenges, ... })

// Update exercise assessment
updateExerciseAssessment(entryId, exerciseIndex, { attentionQuality, ... })

// Get entries
getAllEntries()
getEntriesForDate(dateKey)
getCircuitHistory(circuitId)

// Edit/Delete
editEntry(entryId, updates)
deleteEntry(entryId)

// Export
exportAsJSON(entryIds?)
exportAsCSV(entryIds?)
```

### circuitIntegration Service

```javascript
// Initialize
initializeCircuitSession(circuit)

// Complete
completeCircuitSession()

// Save journal
saveCircuitJournal(completedCircuitId, assessment)

// Get data
getActiveCircuitSession()
getCircuitArchive()
getCircuitEntriesForDate(dateKey)
getCircuitHistory(circuitId)

// Export
exportCircuitData(format, entryIds?)
```

## Performance Optimizations

### Memoization (`useEntryMemoization.js`)

- `useCircuitEntriesMemo()` - Filter/sort with dependencies
- `useChallengeMemo()` - Challenge statistics
- `useAttentionTrendMemo()` - Trend calculations
- `useExerciseStatsMemo()` - Exercise performance

Prevents unnecessary recalculations on parent re-renders.

### Code Splitting

Each major feature is in its own component file:

- Phase 2: Circuit integration (323 lines)
- Phase 3: Insights visualization (486 lines)
- Phase 4: Edit/delete/export (440+ lines)
- Phase 5: Error handling, accessibility (200+ lines)

## Error Handling

### ErrorBoundary

Wraps entire app to catch React errors:

```javascript
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

Displays user-friendly error message with collapsible technical details.

### Try/Catch in Services

All integration functions return `{ success, error }` objects:

```javascript
const result = initializeCircuitSession(circuit);
if (!result.success) {
  console.error(result.error);
  showUserMessage("Failed to start circuit");
}
```

## Accessibility

### ARIA Labels

- Modals: `role="dialog"`, `aria-modal="true"`, `aria-labelledby`
- Loading states: `role="status"`, `aria-live="polite"`, `aria-busy`
- Buttons: `aria-label` for icon-only buttons

### Keyboard Navigation

- **Escape**: Close modals
- **Tab**: Navigate through form fields
- **Enter**: Submit forms
- **Space**: Toggle checkboxes/buttons

### Focus Management

- Focus trap in modals
- Focus restoration when closing
- Visible focus indicators

## Testing

### Unit Tests (Recommended)

```javascript
// Test store functions
test('createEntry creates entry with correct structure', () => {
    const entry = circuitJournalStore.getState().createEntry({...});
    expect(entry.id).toBeDefined();
    expect(entry.createdAt).toBeDefined();
});

// Test memoization
test('useCircuitEntriesMemo returns filtered entries', () => {
    const entries = useCircuitEntriesMemo(allEntries, { dateKey: '2025-01-02' });
    expect(entries).toBeSorted();
});
```

### Integration Tests (Recommended)

```javascript
// Test full flow
test("Circuit completion saves journal entry", () => {
  const session = initializeCircuitSession(circuit);
  const completed = completeCircuitSession();
  const saved = saveCircuitJournal(completed.completedLog.id, assessment);
  expect(saved.success).toBe(true);
});
```

## Browser Support

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support
- Mobile browsers: Full support with responsive design

## Storage

All data stored in localStorage under these keys:

- `circuit-manager-store`
- `circuit-journal-store`
- `progress-store`
- `lunar-store`

Clear with:

```javascript
localStorage.removeItem("circuit-journal-store");
```

## Future Enhancements

- [ ] Server-side sync (cloud backup)
- [ ] Share entries with coach/mentor
- [ ] AI-powered recommendations
- [ ] Mobile app (React Native)
- [ ] Wearable integration (heart rate, sleep)
- [ ] Social features (practice groups)

## License

Part of Immanence OS project

## Support

For issues or questions, refer to the main Immanence OS documentation.
