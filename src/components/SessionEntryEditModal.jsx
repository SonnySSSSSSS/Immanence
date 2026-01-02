// src/components/SessionEntryEditModal.jsx
// Phase 4: Edit existing single session journal entry

import React, { useState } from 'react';
import { useProgressStore } from '../state/progressStore';
import { useDisplayModeStore } from '../state/displayModeStore';

const ATTENTION_QUALITIES = ['scattered', 'settling', 'stable', 'absorbed'];
const CHALLENGE_TAGS = ['physical', 'attention', 'emotional', 'consistency', 'technique'];

export function SessionEntryEditModal({ sessionId, onClose, onSave }) {
    const session = useProgressStore(s => s.sessions.find(s => s.id === sessionId));
    const { updateSession } = useProgressStore();
    const colorScheme = useDisplayModeStore(s => s.colorScheme);
    const isLight = colorScheme === 'light';

    const [quality, setQuality] = useState(session?.journal?.attentionQuality || '');
    const [note, setNote] = useState(session?.journal?.technicalNote || '');
    const [resistance, setResistance] = useState(session?.journal?.resistanceFlag || false);
    const [challenge, setChallenge] = useState(session?.journal?.challengeTag || '');

    if (!session) return null;

    const bgColor = isLight ? 'rgba(245, 240, 230, 0.98)' : 'rgba(10, 15, 25, 0.98)';
    const textColor = isLight ? 'rgba(35, 20, 10, 0.95)' : 'rgba(253, 251, 245, 0.95)';
    const accentColor = isLight ? 'rgba(180, 120, 40, 0.9)' : 'var(--accent-color)';
    const borderColor = isLight ? 'rgba(180, 120, 40, 0.15)' : 'rgba(255, 255, 255, 0.1)';

    const handleSave = () => {
        updateSession(sessionId, {
            journal: {
                ...session.journal,
                attentionQuality: quality,
                technicalNote: note,
                resistanceFlag: resistance,
                challengeTag: challenge,
                editedAt: Date.now()
            }
        });
        onSave?.();
        onClose();
    };

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999999,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
        }} onClick={onClose}>
            <div style={{
                backgroundColor: bgColor,
                color: textColor,
                borderRadius: '16px',
                maxWidth: '500px',
                width: '100%',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)',
                border: `1px solid ${borderColor}`,
                maxHeight: '90vh',
                overflowY: 'auto'
            }} onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div style={{
                    padding: '20px',
                    borderBottom: `1px solid ${borderColor}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>
                        Edit Journal: {session.domain}
                    </h2>
                    <button onClick={onClose} style={{
                        padding: '8px 12px',
                        backgroundColor: 'rgba(239, 68, 68, 0.2)',
                        border: 'none',
                        borderRadius: '6px',
                        color: '#ef4444',
                        cursor: 'pointer',
                        fontSize: '16px',
                        fontWeight: 'bold'
                    }}>✕</button>
                </div>

                {/* Content */}
                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Attention Quality */}
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '8px', opacity: 0.7, textTransform: 'uppercase' }}>
                            Attention Quality
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                            {ATTENTION_QUALITIES.map(q => (
                                <button key={q} onClick={() => setQuality(q)} style={{
                                    padding: '12px 4px',
                                    backgroundColor: quality === q ? accentColor : borderColor,
                                    border: 'none',
                                    borderRadius: '6px',
                                    color: quality === q ? (isLight ? '#000' : '#fff') : textColor,
                                    cursor: 'pointer',
                                    fontSize: '11px',
                                    fontWeight: '600',
                                    textTransform: 'capitalize'
                                }}>
                                    {q}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Resistance & Challenge */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '8px', opacity: 0.7, textTransform: 'uppercase' }}>
                                Resistance?
                            </label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                <button onClick={() => setResistance(true)} style={{
                                    padding: '8px',
                                    backgroundColor: resistance ? '#f97316' : borderColor,
                                    borderRadius: '6px',
                                    border: 'none',
                                    color: '#fff',
                                    fontSize: '11px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer'
                                }}>Yes</button>
                                <button onClick={() => setResistance(false)} style={{
                                    padding: '8px',
                                    backgroundColor: !resistance ? accentColor : borderColor,
                                    borderRadius: '6px',
                                    border: 'none',
                                    color: '#fff',
                                    fontSize: '11px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer'
                                }}>No</button>
                            </div>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '8px', opacity: 0.7, textTransform: 'uppercase' }}>
                                Challenge Tag
                            </label>
                            <select 
                                value={challenge || ''} 
                                onChange={(e) => setChallenge(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    borderRadius: '6px',
                                    border: `1px solid ${borderColor}`,
                                    backgroundColor: isLight ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.2)',
                                    color: textColor,
                                    fontSize: '12px'
                                }}
                            >
                                <option value="">None</option>
                                {CHALLENGE_TAGS.map(t => (
                                    <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Note */}
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '8px', opacity: 0.7, textTransform: 'uppercase' }}>
                            Technical Notes
                        </label>
                        <textarea 
                            value={note} 
                            onChange={(e) => setNote(e.target.value)} 
                            maxLength={300} 
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '6px',
                                border: `1px solid ${borderColor}`,
                                backgroundColor: isLight ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)',
                                color: textColor,
                                fontSize: '13px',
                                fontFamily: 'inherit',
                                resize: 'vertical',
                                minHeight: '80px'
                            }} 
                            placeholder="Describe your focus, posture, or insights..." 
                        />
                        <div style={{ fontSize: '11px', opacity: 0.5, marginTop: '4px', textAlign: 'right' }}>
                            {note.length}/300
                        </div>
                    </div>

                    <div style={{ fontSize: '11px', opacity: 0.5, borderTop: `1px solid ${borderColor}`, paddingTop: '12px' }}>
                        Session: {new Date(session.date).toLocaleDateString()} {new Date(session.date).toLocaleTimeString()}
                    </div>
                </div>

                {/* Footer */}
                <div style={{
                    padding: '16px',
                    borderTop: `1px solid ${borderColor}`,
                    display: 'flex',
                    gap: '12px',
                    justifyContent: 'flex-end'
                }}>
                    <button onClick={onClose} style={{
                        padding: '10px 20px',
                        backgroundColor: 'transparent',
                        border: `1px solid ${borderColor}`,
                        borderRadius: '6px',
                        color: textColor,
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '600'
                    }}>
                        Cancel
                    </button>
                    <button onClick={handleSave} style={{
                        padding: '10px 20px',
                        backgroundColor: accentColor,
                        border: 'none',
                        borderRadius: '6px',
                        color: isLight ? '#000' : '#fff',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '600'
                    }}>
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
}

export default SessionEntryEditModal;
