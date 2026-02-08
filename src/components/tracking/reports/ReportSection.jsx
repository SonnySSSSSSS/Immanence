import React from 'react';

export function ReportSection({
    title,
    infographic,
    interpretation,
    suggestion,
    deltaLine,
    milestones
}) {
    return (
        <section style={{ marginBottom: '18px' }}>
            <div style={{ fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', opacity: 0.75, marginBottom: '10px' }}>
                {title}
            </div>
            <div style={{
                borderRadius: '12px',
                border: '1px solid rgba(0,0,0,0.08)',
                padding: '12px',
                background: 'rgba(0,0,0,0.02)'
            }}>
                <div style={{ width: '100%', overflowX: 'auto' }}>
                    {infographic}
                </div>
                {deltaLine && (
                    <div style={{ fontSize: '11px', opacity: 0.65, marginTop: '8px' }}>
                        {deltaLine}
                    </div>
                )}
                {milestones && milestones.length > 0 && (
                    <div style={{ marginTop: '10px', fontSize: '11px', opacity: 0.7, display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                        {milestones.map((item) => (
                            <div key={item.label}>
                                <strong>{item.label}:</strong> {item.value}
                            </div>
                        ))}
                    </div>
                )}
                <div style={{ marginTop: '10px', fontSize: '12px', lineHeight: '1.5' }}>
                    {interpretation}
                </div>
                <div style={{ marginTop: '6px', fontSize: '11px', fontStyle: 'italic', opacity: 0.8 }}>
                    Suggested adjustment: {suggestion}
                </div>
            </div>
        </section>
    );
}
