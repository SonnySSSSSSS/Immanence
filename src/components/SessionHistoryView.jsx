// src/components/SessionHistoryView.jsx
// Phase 2/3/4 Updated: Archive modal with Insights, Export, and Full CRUD
// Maintains React Portal to escape stacking context

import React, { useState, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { useProgressStore } from '../state/progressStore.js';
import { useCircuitJournalStore } from '../state/circuitJournalStore.js';
import { useDisplayModeStore } from '../state/displayModeStore.js';
import { CircuitEntryCard } from './CircuitEntryCard.jsx';
import { CircuitInsightsView } from './CircuitInsightsView.jsx';
import { SessionEntryEditModal } from './SessionEntryEditModal.jsx';
import { DeleteConfirmationModal } from './DeleteConfirmationModal.jsx';
import { ExportArchiveButton } from './ExportArchiveButton.jsx';
import { useCircuitEntriesMemo } from '../hooks/useEntryMemoization';

export function SessionHistoryView({ onClose }) {
    const colorScheme = useDisplayModeStore(s => s.colorScheme);
    const isLight = colorScheme === 'light';
    
    // Get the store methods as references (not calling them to avoid new array on every render)
    const getAllCircuitEntries = useCircuitJournalStore(s => s.getAllEntries);
    const getSessionsWithJournal = useProgressStore(s => s.getSessionsWithJournal);
    const { deleteSession } = useProgressStore();

    // Memoize the entries to prevent infinite re-renders
    const circuitEntries = useMemo(() => getAllCircuitEntries?.() || [], [getAllCircuitEntries]);
    const sessionEntries = useMemo(() => getSessionsWithJournal?.() || [], [getSessionsWithJournal]);

    const [activeTab, setActiveTab] = useState('all');
    const [filterDate, setFilterDate] = useState(null);
    
    // Edit/Delete state for single sessions
    const [editingSessionId, setEditingSessionId] = useState(null);
    const [deletingSessionId, setDeletingSessionId] = useState(null);

    // Use memoized filtering instead of manual useMemo
    const allEntries = useCircuitEntriesMemo(
        [...circuitEntries, ...sessionEntries],
        { dateKey: filterDate, activeTab }
    );

    const bgColor = isLight ? 'rgba(245, 240, 230, 0.98)' : 'rgba(10, 15, 25, 0.98)';
    const textColor = isLight ? 'rgba(35, 20, 10, 0.95)' : 'rgba(253, 251, 245, 0.95)';
    const accentColor = isLight ? 'rgba(180, 120, 40, 0.9)' : 'var(--accent-color)';
    const borderColor = isLight ? 'rgba(180, 120, 40, 0.15)' : 'rgba(255, 255, 255, 0.1)';

    const formatDate = (dateKey) => {
        if (!dateKey) return 'Unknown';
        const d = new Date(dateKey + 'T00:00:00');
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const handleDeleteSession = () => {
        if (deletingSessionId) {
            deleteSession(deletingSessionId);
            setDeletingSessionId(null);
        }
    };

    return ReactDOM.createPortal(
        <div
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 999999,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '16px'
            }}
            onClick={onClose}
        >
            <div
                style={{
                    backgroundColor: bgColor,
                    color: textColor,
                    borderRadius: '16px',
                    maxWidth: '700px',
                    width: '100%',
                    maxHeight: '90vh',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)',
                    border: `1px solid ${borderColor}`,
                    overflow: 'hidden'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div
                    style={{
                        padding: '20px',
                        borderBottom: `1px solid ${borderColor}`,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}
                >
                    <div>
                        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>Practice Archive</h1>
                        <p style={{ margin: '4px 0 0 0', fontSize: '12px', opacity: 0.5 }}>Insights and history of your sessions</p>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <ExportArchiveButton />
                        <button
                            onClick={onClose}
                            style={{
                                padding: '8px 12px',
                                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                                border: 'none',
                                borderRadius: '6px',
                                color: '#ef4444',
                                cursor: 'pointer',
                                fontSize: '16px',
                                fontWeight: 'bold'
                            }}
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: '0',
                        padding: '8px',
                        borderBottom: `1px solid ${borderColor}`,
                        backgroundColor: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)'
                    }}
                >
                    {['all', 'circuits', 'sessions', 'insights'].map(tab => {
                        const count = tab === 'all' ? allEntries.length : 
                                      tab === 'circuits' ? circuitEntries.length : 
                                      tab === 'sessions' ? sessionEntries.length : '';
                        return (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                style={{
                                    padding: '10px 4px',
                                    backgroundColor: activeTab === tab ? accentColor : 'transparent',
                                    border: 'none',
                                    borderRadius: '6px',
                                    color: activeTab === tab ? (isLight ? '#000' : '#fff') : textColor,
                                    cursor: 'pointer',
                                    fontSize: '12px',
                                    fontWeight: 'bold',
                                    textTransform: 'capitalize',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                {tab} {count !== '' ? `(${count})` : ''}
                            </button>
                        );
                    })}
                </div>

                {/* Filter Row */}
                {activeTab !== 'insights' && (
                    <div style={{ padding: '12px', borderBottom: `1px solid ${borderColor}`, display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <span style={{ fontSize: '11px', opacity: 0.5, textTransform: 'uppercase', fontWeight: 'bold' }}>Filter:</span>
                        <input
                            type="date"
                            value={filterDate || ''}
                            onChange={(e) => setFilterDate(e.target.value || null)}
                            style={{
                                flex: 1,
                                padding: '8px',
                                borderRadius: '6px',
                                border: `1px solid ${borderColor}`,
                                backgroundColor: isLight ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.2)',
                                color: textColor,
                                fontSize: '12px',
                                fontFamily: 'inherit'
                            }}
                        />
                        {filterDate && (
                            <button 
                                onClick={() => setFilterDate(null)}
                                style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                                Clear
                            </button>
                        )}
                    </div>
                )}

                {/* Content Area */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
                    {activeTab === 'insights' ? (
                        <CircuitInsightsView />
                    ) : allEntries.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '60px 20px', opacity: 0.4 }}>
                            <div style={{ fontSize: '48px', marginBottom: '16px' }}>ðŸ“™</div>
                            <p style={{ margin: 0, fontSize: '16px', fontWeight: '500' }}>
                                No {activeTab === 'all' ? 'practice records' : activeTab} found
                            </p>
                            <p style={{ margin: '8px 0 0 0', fontSize: '12px' }}>
                                Complete a session or circuit to see it in your archive.
                            </p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {allEntries.map((entry) => (
                                entry.type === 'circuit' ? (
                                    <CircuitEntryCard key={entry.id} entry={entry.data} />
                                ) : (
                                    <div key={entry.id} style={{ 
                                        background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)', 
                                        border: `1px solid ${borderColor}`, 
                                        borderRadius: '12px', 
                                        padding: '16px',
                                        transition: 'transform 0.2s ease'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'flex-start' }}>
                                            <div>
                                                <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 'bold', textTransform: 'capitalize' }}>
                                                    {entry.data.domain} Session
                                                </h3>
                                                <div style={{ fontSize: '12px', opacity: 0.6 }}>
                                                    {formatDate(entry.dateKey)}
                                                    {entry.data.journal?.editedAt && <span> (edited)</span>}
                                                </div>
                                            </div>
                                            <div style={{
                                                padding: '6px 12px',
                                                backgroundColor: `${accentColor}15`,
                                                borderRadius: '6px',
                                                fontSize: '14px',
                                                fontWeight: 'bold',
                                                color: accentColor
                                            }}>
                                                {Math.round(entry.data.duration)}m
                                            </div>
                                        </div>
                                        
                                        {entry.data.journal && (
                                            <div style={{ marginBottom: '12px' }}>
                                                <div style={{ 
                                                    display: 'inline-block',
                                                    padding: '4px 10px',
                                                    fontSize: '11px',
                                                    borderRadius: '4px',
                                                    backgroundColor: entry.data.journal.attentionQuality === 'absorbed' ? 'rgba(16, 185, 129, 0.2)' :
                                                                    entry.data.journal.attentionQuality === 'stable' ? 'rgba(59, 130, 246, 0.2)' :
                                                                    entry.data.journal.attentionQuality === 'settling' ? 'rgba(249, 115, 22, 0.2)' :
                                                                    'rgba(239, 68, 68, 0.2)',
                                                    color: entry.data.journal.attentionQuality === 'absorbed' ? '#10b981' :
                                                           entry.data.journal.attentionQuality === 'stable' ? '#3b82f6' :
                                                           entry.data.journal.attentionQuality === 'settling' ? '#f97316' :
                                                           '#ef4444',
                                                    marginBottom: '8px',
                                                    fontWeight: 'bold',
                                                    textTransform: 'capitalize',
                                                    border: '1px solid currentColor'
                                                }}>
                                                    {entry.data.journal.attentionQuality}
                                                </div>
                                                {entry.data.journal.technicalNote && (
                                                    <p style={{ 
                                                        margin: 0, 
                                                        fontSize: '13px', 
                                                        opacity: 0.8, 
                                                        lineHeight: '1.5',
                                                        padding: '10px',
                                                        backgroundColor: 'rgba(0,0,0,0.05)',
                                                        borderRadius: '6px'
                                                    }}>
                                                        {entry.data.journal.technicalNote}
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        <div style={{ display: 'flex', gap: '8px', paddingTop: '12px', borderTop: `1px solid ${borderColor}` }}>
                                            {(() => {
                                                const entryTime = new Date(entry.timestamp);
                                                const now = new Date();
                                                const hoursDiff = (now - entryTime) / (1000 * 60 * 60);
                                                const isEditable = hoursDiff < 24;

                                                return isEditable ? (
                                                    <button
                                                        onClick={() => setEditingSessionId(entry.id)}
                                                        style={{
                                                            flex: 1,
                                                            padding: '8px',
                                                            backgroundColor: `${accentColor}10`,
                                                            border: `1px solid ${accentColor}`,
                                                            borderRadius: '6px',
                                                            color: accentColor,
                                                            cursor: 'pointer',
                                                            fontSize: '12px',
                                                            fontWeight: 'bold'
                                                        }}
                                                    >
                                                        Edit
                                                    </button>
                                                ) : (
                                                    <button
                                                        disabled
                                                        style={{
                                                            flex: 1,
                                                            padding: '8px',
                                                            backgroundColor: borderColor,
                                                            border: `1px solid ${borderColor}`,
                                                            borderRadius: '6px',
                                                            color: textColor,
                                                            cursor: 'not-allowed',
                                                            fontSize: '12px',
                                                            fontWeight: 'bold',
                                                            opacity: 0.4
                                                        }}
                                                    >
                                                        Edit (expired)
                                                    </button>
                                                );
                                            })()}
                                            <button
                                                onClick={() => setDeletingSessionId(entry.id)}
                                                style={{
                                                    flex: 1,
                                                    padding: '8px',
                                                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                                    border: '1px solid rgba(239, 68, 68, 0.4)',
                                                    borderRadius: '6px',
                                                    color: '#ef4444',
                                                    cursor: 'pointer',
                                                    fontSize: '12px',
                                                    fontWeight: 'bold',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                )
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{ padding: '12px 20px', borderTop: `1px solid ${borderColor}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)' }}>
                    <div style={{ fontSize: '11px', opacity: 0.5 }}>
                        <strong>{circuitEntries.length}</strong> circuits • <strong>{sessionEntries.length}</strong> sessions
                    </div>
                    <div style={{ fontSize: '11px', opacity: 0.5 }}>
                        Immanence OS Practice Journal v1.4
                    </div>
                </div>
            </div>

            {/* Modals */}
            {editingSessionId && (
                <SessionEntryEditModal 
                    sessionId={editingSessionId} 
                    onClose={() => setEditingSessionId(null)} 
                />
            )}
            
            {deletingSessionId && (
                <DeleteConfirmationModal 
                    title="Delete Session"
                    message="Are you sure you want to delete this session? This will also affect your streak if it was your only practice."
                    onConfirm={handleDeleteSession}
                    onCancel={() => setDeletingSessionId(null)}
                />
            )}
        </div>,
        document.body
    );
}

export default SessionHistoryView;
