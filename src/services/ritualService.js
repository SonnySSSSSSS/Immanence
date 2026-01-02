import { useProgressStore } from '../state/progressStore';
import { useJournalStore } from '../state/journalStore';
import { logPractice } from './cycleManager';

/**
 * specialized logger for the Ritual feature
 * @param {Object} ritualData - Data from ritualStore
 */
export function logRitualResult(ritualData) {
    const { id, startTime, stepData, photoUrl, selectedMemory } = ritualData;
    const endTime = Date.now();
    const durationMs = endTime - new Date(startTime).getTime();
    const durationMin = Math.max(1, Math.round(durationMs / 60000));

    // 1. Log to progressStore via general logPractice
    // This ensures consistency, streaks, and charts are updated
    logPractice({
        type: 'wisdom', // Ritual maps to wisdom domain
        duration: durationMin,
        metadata: {
            ritualId: id,
            isRitual: true,
            selectedMemory,
            photoUrl: photoUrl ? true : false, // Store flag, actual photo in journal
            stepsCompleted: 6
        },
        contributions: { wisdom: durationMin }
    });

    // 2. Trigger Journaling with pre-populated content
    const journalStore = useJournalStore.getState();
    const ritualSummary = `
### Healing Ritual Session
**Focus Memory:** ${selectedMemory || 'None selected'}
**Steps Completed:** 6/6
**Duration:** ${durationMin} minutes
    `.trim();

    journalStore.startMicroNote({
        ritualId: id,
        type: 'ritual',
        content: ritualSummary,
        photoUrl: photoUrl // Pass the captured photo to the journal entry
    });

    return { success: true };
}
