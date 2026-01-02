// src/utils/entryExport.js
// Phase 4: Export utilities for circuit entries

/**
 * Trigger browser download
 */
function downloadFile(content, filename, mimeType = 'text/plain') {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Export entries as JSON file
 */
export function exportAsJSON(entries, filename = 'circuit-entries.json') {
    const jsonString = JSON.stringify(entries, null, 2);
    downloadFile(jsonString, filename, 'application/json');
}

/**
 * Export entries as CSV file
 */
export function exportAsCSV(entries, filename = 'circuit-entries.csv') {
    const header = [
        'Date',
        'Circuit Name',
        'Exercise Name',
        'Planned Duration (min)',
        'Actual Duration (min)',
        'Attention Quality',
        'Session Mode',
        'Lunar Phase',
        'Time of Day',
        'Overall Notes',
        'Exercise Notes'
    ].join(',');

    const rows = entries.flatMap(entry =>
        (entry.exercises || []).map(ex =>
            [
                entry.dateKey,
                `"${entry.circuitName}"`,
                `"${ex.exerciseName}"`,
                ex.plannedDuration || '',
                ex.actualDuration || '',
                ex.attentionQuality || '',
                entry.sessionMode,
                entry.lunarPhase || '',
                entry.timeOfDay || '',
                `"${(entry.overallAssessment?.generalNotes || '').replace(/"/g, '""')}"`,
                `"${(ex.notes || '').replace(/"/g, '""')}"`
            ].join(',')
        )
    );

    const csv = [header, ...rows].join('\n');
    downloadFile(csv, filename, 'text/csv');
}

/**
 * Get export filename with current date
 */
export function getExportFilename(format = 'json') {
    const date = new Date().toISOString().split('T')[0];
    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }).replace(/:/g, '-');
    const ext = format === 'json' ? 'json' : 'csv';
    return `immanence-circuits-${date}-${timestamp}.${ext}`;
}
