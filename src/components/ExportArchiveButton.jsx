// src/components/ExportArchiveButton.jsx
// Phase 4: Export all or selected entries

import React, { useState } from 'react';
import { useCircuitJournalStore } from '../state/circuitJournalStore';
import { useDisplayModeStore } from '../state/displayModeStore';
import { exportAsJSON, exportAsCSV, getExportFilename } from '../utils/entryExport';
import { LoadingIndicator } from './LoadingIndicator';

import { useProgressStore } from '../state/progressStore';

export function ExportArchiveButton({ entries: customEntries }) {
    const circuitEntries = useCircuitJournalStore(s => s.getAllEntries());
    const sessionEntries = useProgressStore(s => s.getSessionsWithJournal());
    
    // Use custom entries if provided, otherwise combine both stores
    const entries = customEntries || [...circuitEntries, ...sessionEntries];
    const colorScheme = useDisplayModeStore(s => s.colorScheme);
    const isLight = colorScheme === 'light';
    const [showMenu, setShowMenu] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    const accentColor = isLight ? 'rgba(180, 120, 40, 0.9)' : 'var(--accent-color)';
    const borderColor = isLight ? 'rgba(180, 120, 40, 0.15)' : 'rgba(255, 255, 255, 0.1)';
    const bgColor = isLight ? 'rgba(245, 240, 230, 0.95)' : 'rgba(10, 15, 25, 0.95)';
    const textColor = isLight ? 'rgba(35, 20, 10, 0.95)' : 'rgba(253, 251, 245, 0.95)';

    const handleExportJSON = async () => {
        setIsExporting(true);
        try {
            exportAsJSON(entries, getExportFilename('json'));
        } finally {
            setIsExporting(false);
            setShowMenu(false);
        }
    };

    const handleExportCSV = async () => {
        setIsExporting(true);
        try {
            exportAsCSV(entries, getExportFilename('csv'));
        } finally {
            setIsExporting(false);
            setShowMenu(false);
        }
    };

    if (entries.length === 0) return null;
    if (isExporting) return <LoadingIndicator message="Exporting..." size="small" />;

    return (
        <div style={{ position: 'relative', display: 'inline-block' }}>
            <button
                onClick={() => setShowMenu(!showMenu)}
                style={{
                    padding: '8px 12px',
                    backgroundColor: `${accentColor}20`,
                    border: `1px solid ${accentColor}`,
                    borderRadius: '6px',
                    color: accentColor,
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '600'
                }}
            >
                â¬‡ Export ({entries.length})
            </button>

            {showMenu && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '8px',
                    backgroundColor: bgColor,
                    border: `1px solid ${borderColor}`,
                    borderRadius: '6px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    zIndex: 1000,
                    minWidth: '150px'
                }}>
                    <button
                        onClick={handleExportJSON}
                        style={{
                            width: '100%',
                            padding: '12px',
                            backgroundColor: 'transparent',
                            border: 'none',
                            borderBottom: `1px solid ${borderColor}`,
                            color: textColor,
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: '600',
                            textAlign: 'left'
                        }}
                    >
                        ðŸ“„ Export as JSON
                    </button>
                    <button
                        onClick={handleExportCSV}
                        style={{
                            width: '100%',
                            padding: '12px',
                            backgroundColor: 'transparent',
                            border: 'none',
                            color: textColor,
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: '600',
                            textAlign: 'left'
                        }}
                    >
                        ðŸ“Š Export as CSV
                    </button>
                </div>
            )}
        </div>
    );
}

export default ExportArchiveButton;
