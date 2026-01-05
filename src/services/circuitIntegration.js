// src/services/circuitIntegration.js
// Phase 2 Integration: Bridge existing CircuitTrainer UI to Zustand stores
// Adapts legacy circuitManager service calls to new state management

import { useCircuitManager } from '../state/circuitManager';
import { useCircuitJournalStore } from '../state/circuitJournalStore';
import { useProgressStore } from '../state/progressStore';
import { useLunarStore } from '../state/lunarStore';

/**
 * Convert circuit UI selection to Zustand store session
 * Called when user clicks "Start Circuit" in CircuitTrainer
 * 
 * @param {Object} circuit - Circuit object from UI { id, name, exercises, totalDuration, ... }
 * @returns {Object} { success, sessionId, session }
 */
export function initializeCircuitSession(circuit) {
    try {
        // Create or update circuit definition in store (may already exist)
        const circuitManager = useCircuitManager.getState();
        
        // Check if circuit already exists
        let existingCircuit = circuitManager.getCircuit(circuit.id);
        if (!existingCircuit) {
            // Create from UI circuit definition
            existingCircuit = circuitManager.createCircuit({
                name: circuit.name,
                description: circuit.description || '',
                exercises: (circuit.exercises || []).map((ex, idx) => ({
                    id: ex.id || `ex_${circuit.id}_${idx}`,
                    name: ex.name,
                    duration: ex.duration,
                    reps: ex.reps || null,
                    targetDomain: ex.type || 'focus', // UI calls it 'type'
                    practiceType: ex.practiceType,
                    preset: ex.preset
                }))
            });
        }

        // Begin session
        const session = circuitManager.beginCircuit(circuit.id, 'guided');

        if (!session) {
            return {
                success: false,
                error: 'Failed to initialize circuit session'
            };
        }

        return {
            success: true,
            sessionId: circuit.id,
            session,
            totalDuration: existingCircuit.totalDuration,
            exercises: existingCircuit.exercises
        };
    } catch (err) {
        console.error('Error initializing circuit session:', err);
        return {
            success: false,
            error: err.message
        };
    }
}

/**
 * Complete circuit and prepare for journaling
 * Called when timer reaches end or user clicks "Finish"
 * 
 * @returns {Object} { success, completedLog, readyForJournal: true }
 */
export function completeCircuitSession() {
    try {
        const circuitManager = useCircuitManager.getState();
        
        // Complete the circuit (marks exercises as done, returns log)
        const completedLog = circuitManager.completeCircuit();

        if (!completedLog) {
            return {
                success: false,
                error: 'No active circuit to complete'
            };
        }

        // Log to progressStore for streak/tracking
        const progressStore = useProgressStore.getState();
        const lunarStore = useLunarStore.getState();

        const session = progressStore.recordSession({
            domain: 'circuit-training',
            duration: Math.round(completedLog.totalActualDuration),
            metadata: {
                circuitId: completedLog.circuitId,
                circuitName: completedLog.circuitName,
                exercises: completedLog.exercises.length,
                sessionMode: completedLog.sessionMode
            },
            instrumentation: {
                start_time: completedLog.startTime,
                end_time: completedLog.endTime,
                duration_ms: completedLog.endTime - completedLog.startTime,
                exit_type: 'completed',
                practice_family: 'circuit'
            }
        });

        // Get current lunar phase for journal metadata
        const currentPhase = lunarStore.getCurrentStage();

        // Enrich completed log with metadata
        const enrichedLog = {
            ...completedLog,
            metadata: {
                ...completedLog.metadata,
                lunarPhase: currentPhase || 'unknown'
            }
        };

        return {
            success: true,
            completedLog: enrichedLog,
            sessionId: session.id,
            readyForJournal: true
        };
    } catch (err) {
        console.error('Error completing circuit session:', err);
        return {
            success: false,
            error: err.message
        };
    }
}

/**
 * Abandon circuit without saving
 * Called when user clicks "Cancel" or navigates away
 */
export function abandonCircuitSession() {
    const circuitManager = useCircuitManager.getState();
    circuitManager.abandonCircuit();
    return { success: true };
}

/**
 * Save journal entry after circuit completion
 * Called by CircuitJournalForm.handleSubmit()
 * 
 * @param {string} completedCircuitId - ID of the completed circuit log
 * @param {Object} assessment - Overall assessment from form
 * @returns {Object} { success, journalEntryId }
 */
export function saveCircuitJournal(completedCircuitId, assessment) {
    try {
        const circuitManager = useCircuitManager.getState();
        const journalStore = useCircuitJournalStore.getState();

        // Find the completed circuit log
        const completedLog = circuitManager.completedCircuits.find(
            c => c.id === completedCircuitId
        );

        if (!completedLog) {
            return {
                success: false,
                error: 'Completed circuit not found'
            };
        }

        // Create journal entry
        const entry = journalStore.createEntry({
            circuitId: completedLog.circuitId,
            circuitName: completedLog.circuitName,
            completedCircuitId: completedLog.id,
            exercises: completedLog.exercises,
            sessionMode: completedLog.sessionMode,
            totalDuration: completedLog.totalActualDuration,
            timeOfDay: completedLog.metadata.timeOfDay,
            lunarPhase: completedLog.metadata.lunarPhase
        });

        // Update overall assessment (from form)
        journalStore.updateOverallAssessment(entry.id, assessment);

        // Link journal entry back to completed circuit
        circuitManager.linkJournalEntry(completedLog.id, entry.id);

        return {
            success: true,
            journalEntryId: entry.id,
            journalEntry: entry
        };
    } catch (err) {
        console.error('Error saving circuit journal:', err);
        return {
            success: false,
            error: err.message
        };
    }
}

/**
 * Get active circuit session info
 * Called by circuit timer UI to display progress
 * 
 * @returns {Object|null} Active session or null
 */
export function getActiveCircuitSession() {
    const circuitManager = useCircuitManager.getState();
    return circuitManager.getActiveSession();
}

/**
 * Update exercise progress during circuit
 * Called by timer UI as user progresses
 * 
 * @param {number} exerciseIndex - Which exercise in the circuit
 * @param {string} notes - Optional notes from user
 */
export function advanceCircuitExercise(exerciseIndex, notes = null) {
    try {
        const circuitManager = useCircuitManager.getState();
        const session = circuitManager.getActiveSession();

        if (!session) {
            return { success: false, error: 'No active session' };
        }

        // Move to next exercise
        if (exerciseIndex < session.exerciseStates.length) {
            circuitManager.nextExercise(notes);
            return {
                success: true,
                nextIndex: exerciseIndex + 1
            };
        }

        return {
            success: false,
            error: 'No more exercises'
        };
    } catch (err) {
        console.error('Error advancing exercise:', err);
        return { success: false, error: err.message };
    }
}

/**
 * Get circuit archive entries for display
 * Called by SessionHistoryView archive modal
 * 
 * @returns {Array} Circuit journal entries
 */
export function getCircuitArchive() {
    const journalStore = useCircuitJournalStore.getState();
    return journalStore.getAllEntries();
}

/**
 * Query circuit entries for a specific date
 * 
 * @param {string} dateKey - "YYYY-MM-DD"
 * @returns {Array} Journal entries for that date
 */
export function getCircuitEntriesForDate(dateKey) {
    const journalStore = useCircuitJournalStore.getState();
    return journalStore.getEntriesForDate(dateKey);
}

/**
 * Get all completions of a specific circuit (for insights)
 * 
 * @param {string} circuitId
 * @returns {Array} Journal entries
 */
export function getCircuitHistory(circuitId) {
    const journalStore = useCircuitJournalStore.getState();
    return journalStore.getCircuitHistory(circuitId);
}

/**
 * Export circuit data
 * Called by export button in archive
 * 
 * @param {string} format - 'json' or 'csv'
 * @param {Array} entryIds - Optional: specific entries to export
 * @returns {string} Formatted data (JSON or CSV)
 */
export function exportCircuitData(format = 'json', entryIds = null) {
    const journalStore = useCircuitJournalStore.getState();

    if (format === 'json') {
        return journalStore.exportAsJSON(entryIds);
    } else if (format === 'csv') {
        return journalStore.exportAsCSV(entryIds);
    } else {
        return null;
    }
}
