// src/components/VisualizationTest.jsx
// Temporary test component to verify VisualizationCanvas rendering
// DELETE THIS FILE after testing

import React, { useState } from 'react';
import { VisualizationCanvas } from './VisualizationCanvas.jsx';

export function VisualizationTest() {
    const [geometry, setGeometry] = useState('enso');
    const [isVisible, setIsVisible] = useState(true);

    if (!isVisible) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: '#0a0a12',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
        }}>
            {/* Close button */}
            <button
                onClick={() => setIsVisible(false)}
                style={{
                    position: 'absolute',
                    top: '20px',
                    right: '20px',
                    padding: '10px 20px',
                    background: 'rgba(255,70,70,0.8)',
                    border: 'none',
                    borderRadius: '20px',
                    color: 'white',
                    cursor: 'pointer',
                    fontFamily: 'Cinzel, serif',
                }}
            >
                CLOSE TEST
            </button>

            {/* Geometry selector */}
            <div style={{
                position: 'absolute',
                top: '20px',
                left: '20px',
                display: 'flex',
                gap: '10px',
            }}>
                {['enso', 'circle', 'triangle', 'square'].map((g) => (
                    <button
                        key={g}
                        onClick={() => setGeometry(g)}
                        style={{
                            padding: '8px 16px',
                            background: geometry === g
                                ? 'linear-gradient(to bottom right, var(--accent-color), var(--accent-secondary))'
                                : 'rgba(255,255,255,0.1)',
                            border: `1px solid ${geometry === g ? 'var(--accent-color)' : 'rgba(255,255,255,0.2)'}`,
                            borderRadius: '15px',
                            color: geometry === g ? '#050508' : 'white',
                            cursor: 'pointer',
                            fontFamily: 'Cinzel, serif',
                            fontSize: '12px',
                        }}
                    >
                        {g.toUpperCase()}
                    </button>
                ))}
            </div>

            {/* Canvas */}
            <div style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}>
                <VisualizationCanvas
                    geometry={geometry}
                    fadeInDuration={2.5}
                    displayDuration={5}
                    fadeOutDuration={2.5}
                    voidDuration={5}
                    onCycleComplete={(cycle) => console.log(`Cycle ${cycle} complete`)}
                />
            </div>

            {/* Instructions */}
            <div style={{
                position: 'absolute',
                bottom: '40px',
                textAlign: 'center',
                color: 'rgba(255,255,255,0.5)',
                fontFamily: 'Crimson Pro, serif',
                fontSize: '14px',
            }}>
                <div>Watch the geometry draw itself (fadeIn), stay visible (display),</div>
                <div>fade away (fadeOut), then see "VISUALIZE" prompt (void).</div>
                <div style={{ marginTop: '10px', fontSize: '12px', color: 'var(--accent-60)' }}>
                    Cycle duration: 15 seconds
                </div>
            </div>
        </div>
    );
}
