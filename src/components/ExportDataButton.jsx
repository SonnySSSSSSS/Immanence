// src/components/ExportDataButton.jsx
// Export all progress data as JSON

import React, { useState } from 'react';
import { useProgressStore } from '../state/progressStore.js';

export function ExportDataButton({ variant = 'button' }) {
    const { exportAllData } = useProgressStore();
    const [showSuccess, setShowSuccess] = useState(false);
    const [exporting, setExporting] = useState(false);

    const handleExport = async () => {
        setExporting(true);

        try {
            const data = exportAllData();

            // Format the JSON nicely
            const jsonString = JSON.stringify(data, null, 2);

            // Create blob and download
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `immanence-progress-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 2000);
        } catch (e) {
            console.error('Export failed:', e);
            alert('Export failed. Check console for details.');
        } finally {
            setExporting(false);
        }
    };

    // Copy to clipboard variant
    const handleCopy = async () => {
        try {
            const data = exportAllData();
            const jsonString = JSON.stringify(data, null, 2);
            await navigator.clipboard.writeText(jsonString);
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 2000);
        } catch (e) {
            console.error('Copy failed:', e);
        }
    };

    if (variant === 'icon') {
        return (
            <button
                onClick={handleExport}
                disabled={exporting}
                className="p-2 rounded-lg transition-all hover:bg-[rgba(253,251,245,0.1)]"
                style={{ color: 'rgba(253,251,245,0.6)' }}
                title="Export progress data"
            >
                {showSuccess ? '✓' : exporting ? '...' : '📤'}
            </button>
        );
    }

    if (variant === 'link') {
        return (
            <button
                onClick={handleExport}
                disabled={exporting}
                className="text-[10px] underline transition-all hover:text-white"
                style={{ color: 'rgba(253,251,245,0.5)' }}
            >
                {showSuccess ? 'Downloaded!' : exporting ? 'Exporting...' : 'Export data'}
            </button>
        );
    }

    return (
        <div className="space-y-2">
            <button
                onClick={handleExport}
                disabled={exporting}
                className="w-full py-2.5 rounded-lg text-[11px] font-medium transition-all flex items-center justify-center gap-2"
                style={{
                    background: showSuccess ? 'rgba(34,197,94,0.2)' : 'rgba(253,251,245,0.08)',
                    border: `1px solid ${showSuccess ? 'rgba(34,197,94,0.4)' : 'rgba(253,251,245,0.15)'}`,
                    color: showSuccess ? '#22c55e' : 'rgba(253,251,245,0.8)',
                    fontFamily: 'var(--font-display)',
                    fontWeight: 600,
                    letterSpacing: 'var(--tracking-mythic)',
                }}
            >
                {showSuccess ? (
                    <>✓ Downloaded</>
                ) : exporting ? (
                    <>Exporting...</>
                ) : (
                    <>📤 Export Progress Data</>
                )}
            </button>

            <button
                onClick={handleCopy}
                className="w-full py-2 rounded-lg text-[10px] transition-all"
                style={{
                    background: 'transparent',
                    border: '1px solid rgba(253,251,245,0.1)',
                    color: 'rgba(253,251,245,0.5)'
                }}
            >
                📋 Copy to Clipboard
            </button>

            <p className="text-[9px] text-[rgba(253,251,245,0.4)] text-center">
                Exports sessions, honor logs, streak data, and preferences as JSON
            </p>
        </div>
    );
}

/**
 * Data preview component showing what would be exported
 */
export function ExportDataPreview() {
    const { exportAllData } = useProgressStore();
    const [showPreview, setShowPreview] = useState(false);

    const data = exportAllData();

    return (
        <div>
            <button
                onClick={() => setShowPreview(!showPreview)}
                className="text-[10px] text-[rgba(253,251,245,0.5)] underline"
            >
                {showPreview ? 'Hide preview' : 'Preview export data'}
            </button>

            {showPreview && (
                <div
                    className="mt-2 p-3 rounded-lg text-[9px] font-mono overflow-auto max-h-40"
                    style={{
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid rgba(253,251,245,0.1)',
                        color: 'rgba(253,251,245,0.6)'
                    }}
                >
                    <div>Sessions: {data.sessions.length}</div>
                    <div>Honor Logs: {data.honorLogs.length}</div>
                    <div>Last Practice: {data.streak.lastPracticeDate || 'None'}</div>
                    <div>Longest Streak: {data.streak.longest} days</div>
                    <div>Vacation: {data.vacation.active ? 'Active' : 'Off'}</div>
                </div>
            )}
        </div>
    );
}
