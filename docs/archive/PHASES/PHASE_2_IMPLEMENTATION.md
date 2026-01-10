# Phase 2 Implementation Guide: Circuit Integration

## Overview
Phase 2 extends the practice journal to support entire circuits (sequences of exercises) rather than just single sessions. This enables tracking of complex multi-exercise practices and detailed per-exercise assessments.

---

## New Files Delivered

### 1. `src/state/circuitManager.js`
**Purpose**: Manages circuit definitions, active sessions, and completion history

**Key Exports**:
- `useCircuitManager` - Zustand store for circuit state

**Core Functionality**:
```javascript
// Create a new circuit template
const circuit = useCircuitManager.getState().createCircuit({
    name: 'Morning Vitality',
    description: 'Complete breathwork flow',
    exercises: [
        { name: 'Box Breath', duration: 5, reps: 20 },
        { name: 'Extended Exhale', duration: 5, reps: 15 },
        { name: 'Retention Hold', duration: 3, reps: 10 }
    ]
});

// Begin practicing a circuit
const session = useCircuitManager.getState().beginCircuit(circuit.id, 'guided');

// Progress through exercises
useCircuitManager.getState().startExercise(0);
// ... user practices ...
useCircuitManager.getState().nextExercise('Felt good today');

// Complete the circuit
const completedLog = useCircuitManager.getState().completeCircuit();
```

**Data Structure**:
```javascript
// Circuit (template)
{
    id: string,
    name: string,
    description: string,
    exercises: [
        { id, name, duration, reps, targetDomain },
        ...
    ],
    totalDuration: number,
    createdAt: timestamp
}

// CompletedCircuit (history)
{
    id: string,
    circuitId: string,
    circuitName: string,
    completionTime: ISO8601,
    dateKey: "YYYY-MM-DD",
    exercises: [
        {
            exerciseId: string,
            exerciseName: string,
            plannedDuration: number,
            actualDuration: number,
            notes: string
        }
    ],
    totalActualDuration: number,
    sessionMode: 'guided' | 'freestyle',
    metadata: { lunarPhase, timeOfDay },
    journalId: string // Links to circuit journal entry
}
```

---

### 2. `src/state/circuitJournalStore.js`
**Purpose**: Captures per-exercise and overall assessments for completed circuits

**Key Exports**:
- `useCircuitJournalStore` - Zustand store for circuit journal entries

**Core Functionality**:
```javascript
// Create journal entry after circuit completion
const entry = useCircuitJournalStore.getState().createEntry({
    circuitId: circuit.id,
    circuitName: 'Morning Vitality',
    completedCircuitId: completedLog.id,
    exercises: completedLog.exercises,
    sessionMode: 'guided',
    totalDuration: 13,
    timeOfDay: '06:30'
});

// Fill in per-exercise assessments (can be done step-by-step)
useCircuitJournalStore.getState().updateExerciseAssessment(
    entry.id,
    0, // exerciseIndex
    {
        attentionQuality: 'stable',
        notes: 'Counted breaths more easily',
        challenges: ['breath-control']
    }
);

// Fill in overall assessment
useCircuitJournalStore.getState().updateOverallAssessment(
    entry.id,
    {
        attentionQuality: 'absorbed',
        resistanceFlag: false,
        challenges: [],
        generalNotes: 'Morning sessions consistently better quality'
    }
);
```

**Data Structure**:
```javascript
{
    id: string,
    circuitId: string,
    circuitName: string,
    completedCircuitId: string,
    dateKey: "YYYY-MM-DD",
    timestamp: ISO8601,
    exercises: [
        {
            exerciseId: string,
            exerciseName: string,
            plannedDuration: number,
            actualDuration: number,
            attentionQuality: string,
            notes: string,
            challenges: [string]
        }
    ],
    overallAssessment: {
        attentionQuality: string,
        resistanceFlag: boolean,
        challenges: [string],
        generalNotes: string
    },
    sessionMode: string,
    lunarPhase: string | null,
    timeOfDay: string,
    totalDuration: number,
    createdAt: timestamp,
    editedAt: null | timestamp
}
```

---

## Integration Points

### PostSessionJournal.jsx Changes Needed

The PostSessionJournal component needs to detect whether it's journaling for a circuit or single session:

```javascript
import { useCircuitManager } from '../state/circuitManager';
import { useCircuitJournalStore } from '../state/circuitJournalStore';

export function PostSessionJournal() {
    const activeSession = useCircuitManager(s => s.activeSession);
    const isCircuit = activeSession !== null;
    
    if (isCircuit) {
        // Show circuit-specific form with exercise list
        return <CircuitJournalForm completedLog={completedLog} />;
    } else {
        // Show single session form (current behavior)
        return <SingleSessionJournalForm sessionId={sessionId} />;
    }
}
```

### Circuit Completion Flow

```
User finishes circuit
    â†“
circuitManager.completeCircuit() 
    â†“
Returns: completedCircuitLog { id, exercises, totalDuration, ... }
    â†“
Trigger PostSessionJournal modal (existing flow)
    â†“
User fills in:
    - Per-exercise attention quality + notes
    - Overall assessment
    - Challenge tags
    â†“
circuitJournalStore.createEntry() 
    â†“
circuitManager.linkJournalEntry(completedCircuitId, journalId)
```

---

## SessionHistoryView.jsx Enhancement

The Archive modal needs to distinguish between circuit and session entries:

```javascript
export function SessionHistoryView({ onClose }) {
    const circuitEntries = useCircuitJournalStore(s => s.getAllEntries());
    const sessionEntries = useProgressStore(s => s.sessions.filter(s => s.journal));
    
    return ReactDOM.createPortal(
        <div className="archive-modal">
            {/* Tabs: Journal Entries | Insights (Phase 3) | Export (Phase 4) */}
            <div className="entries-tab">
                {circuitEntries.map(entry => (
                    <CircuitEntryCard key={entry.id} entry={entry} />
                ))}
                {sessionEntries.map(entry => (
                    <SessionEntryCard key={entry.id} entry={entry} />
                ))}
            </div>
        </div>,
        document.body
    );
}
```

---

## Data Linkage

The three systems are now linked:

```
circuitManager.completedCircuits[id]
    â†“
    â”œâ”€ exercises[] â†’ Link to exercise library
    â”œâ”€ circuitId â†’ Link to circuit template
    â””â”€ journalId â†’ Link to circuitJournalStore.entries[journalId]
            â†“
            â””â”€ metadata.lunarPhase â†’ useLunarStore.getCurrentStage()
```

This enables:
1. Filtering archive by circuit vs session
2. Drilling down into specific exercises within a circuit
3. Tracking how performance varies across different circuits
4. Correlating circuit difficulty with lunar phases (Phase 4)

---

## Testing Checklist for Phase 2

### Circuit Manager
- [ ] Create a circuit with 3+ exercises
- [ ] Begin circuit session (verify activeSession state)
- [ ] Progress through exercises (verify currentExerciseIndex, timing)
- [ ] Complete circuit (verify total duration calculation)
- [ ] Retrieve circuit history (verify all completions logged)

### Circuit Journal
- [ ] Create entry for completed circuit
- [ ] Update per-exercise assessments individually
- [ ] Update overall assessment
- [ ] Verify exercise count matches completed log
- [ ] Query entries by date (verify filtering)

### Integration
- [ ] Complete circuit â†’ triggers journal capture flow
- [ ] Journal entry saves with reference to completed circuit ID
- [ ] Archive displays circuit entries with expandable exercise list
- [ ] Can link back from archive entry to circuit definition

### Data Integrity
- [ ] Circuit duration calculations (planned vs actual)
- [ ] Timestamp consistency across stores
- [ ] UUID generation for new entries
- [ ] Persistence across page reloads

---

## Future Enhancements (Phase 3+)

### Phase 3: Visualizations
- Bar chart: "Most Challenging Exercises in Circuits"
- Line chart: "Circuit Duration vs Time" (showing efficiency)
- Heatmap: "Exercise Performance by Circuit Type"

### Phase 4: Editing & Export
- Edit entry button with modal form
- Export as JSON (includes per-exercise data)
- Export as CSV (flattened for spreadsheet analysis)
- Auto-tag with lunar phase at completion time

---

## Critical Preservation Rules

âœ… **SessionHistoryView MUST remain as React Portal**
- Any updates to the archive modal must use `ReactDOM.createPortal(..., document.body)`
- Never move it back into HomeHub's component tree
- The portal escape is essential for modal visibility

âœ… **circuitManager and circuitJournalStore must remain independent**
- These are separate concerns (execution vs reflection)
- They link via IDs, not direct references
- Allows swapping either system without breaking the other

---

## Next Steps for Implementation

1. **Create circuit library UI** - Component to define circuits (Phase 2 UI task)
2. **Create circuit practice UI** - Timer/progress interface for active circuit (Phase 2 UI task)
3. **Create CircuitEntryCard** - Archive display for circuit journal entries (Phase 2 UI task)
4. **Modify PostSessionJournal** - Add circuit-aware form logic (Phase 2 integration)
5. **Update SessionHistoryView** - Show circuit entries in archive (Phase 2 integration)
