# Practice Journal: Implementation Roadmap

## CRITICAL CONSTRAINT

**React Portal Architecture**: SessionHistoryView MUST use `ReactDOM.createPortal(..., document.body)` to render outside HomeHub's stacking context. Any future updates to SessionHistoryView must preserve this pattern or the modal will be clipped by HubCardSwiper's Framer Motion transforms.

---

## Phase 1: Core Capture & Archive âœ… COMPLETE

- Session logging to journalStore
- CompactStatsCard â†’ SessionHistoryView modal flow
- Debug archive viewer with portal-based rendering

**Delivered**: Simple session capture with timestamp, attention quality, and challenge tags.

---

## Phase 2: Circuit Integration (READY FOR HANDOFF)

### Objective

Enable journaling for entire practice "Circuits" (sequences of exercises) rather than just single sessions.

### Key Files

- `journalStore.js` - Add circuit-aware logging schema
- `PostSessionJournal.jsx` - Modify form to capture circuit metadata
- `circuitManager.js` - Reference completed circuit in journal entry

### Implementation Approach

#### 2.1 journalStore.js Schema Update

Current: Single session entry with exercise metadata
Target: Entry structure supporting both single sessions and circuit sequences

```javascript
// NEW: Circuit Entry Type
{
  id: uuid(),
  timestamp: ISO8601,
  type: 'circuit', // or 'session'
  circuit: {
    name: string,
    exercises: [
      { id, name, duration, reps, attentionQuality, notes },
      // ... more exercises
    ],
    totalDuration: number,
    completionTime: ISO8601,
  },
  journalEntry: {
    attentionQuality: 1-5,
    challenges: [tag, tag, ...],
    notes: string,
  },
  metadata: {
    lunarPhase: string, // Phase 4 enhancement
    sessionMode: 'guided|freestyle',
  }
}
```

#### 2.2 PostSessionJournal.jsx Changes

- Detect if journaling for circuit vs single session
- Display circuit exercise list in review section
- Allow per-exercise notes (optional enhancement)
- Capture overall circuit assessment

#### 2.3 circuitManager.js Integration

- Hook into circuit completion event
- Pass circuit data structure to PostSessionJournal
- Ensure journal entry references circuit ID for data linkage

### Testing Checklist

- [ ] Complete a circuit, verify journal entry captures all exercises
- [ ] Archive displays circuit entries distinctly from session entries
- [ ] Each exercise in circuit is retrievable from journal entry
- [ ] Lunar phase metadata captured (Phase 4 prep)

---

## Phase 3: Visual Insights & Trends (DESIGN READY)

### Objective

Transform raw logs into actionable visualizations within the Archive.

### Key Files

- `SessionHistoryView.jsx` - Add "Insights" tab
- `progressStore.js` - Query aggregated journal data
- NEW: `ArchiveCharts.jsx` - Chart components

### Visualizations

1. **Attention Quality Over Time** (Line Chart)

   - X-axis: Time (week/month)
   - Y-axis: Average attention quality (1-5)
   - Shows trend and consistency

2. **Challenge Tag Frequency** (Bar Chart)

   - Most common obstacles reported
   - Helps identify patterns

3. **Circuit vs Session Breakdown** (Pie Chart)

   - Proportion of journaling in circuits vs solo sessions

4. **Streak Visualization**
   - Calendar heatmap of journaling consistency

### Implementation Strategy

- Use existing charting library (Recharts recommended for Tailwind compatibility)
- Create filterable views (date range, practice type)
- Cache aggregated data in progressStore to avoid recomputation

---

## Phase 4: Polish & Refinement (FUTURE)

### Editing

- Add "Edit" button to archive entries
- Modal form with same fields as PostSessionJournal
- Timestamp updated entry with "edited" flag

### Export

- JSON: Full data structure with circuit details
- CSV: Flattened for spreadsheet analysis
- Button placement: Archive header next to filters

### Context Metadata

- **Lunar Phase**: Auto-capture from useLunarStore
- **Time of Day**: Extract from timestamp (morning/afternoon/evening)
- **Practice Domain**: Link to breathwork, meditation, ritual, etc.
- **Device**: Detect mobile vs desktop (useful for practice insights)

---

## Data Linkage Strategy

### Journal â†’ Circuit â†’ Exercise Traceability

```
journalStore.entries[id]
  â”œâ”€ circuit.id â†’ circuitManager.circuits[id]
  â”‚   â””â”€ exercises[i].id â†’ exerciseLibrary.exercises[id]
  â””â”€ metadata.lunarPhase â†’ useLunarStore.getCurrentStage()
```

This enables:

- Filtering archive by circuit type
- Drilling down into specific exercises
- Correlating practice patterns with lunar cycles

---

## Storage Considerations

- journalStore entries grow with each practice
- Archive queries (Phase 3) may need pagination for large datasets
- Consider localStorage limitations (typically 5-10MB)
- Plan for future cloud sync capability

---

## UI/UX Notes

- Archive modal remains Portal-based (CRITICAL)
- Tabs for "Journal Entries" â†’ "Insights" â†’ "Export"
- Maintain dark-mode aesthetic from current debug version
- Circuit entries should show exercise list collapsed/expandable
