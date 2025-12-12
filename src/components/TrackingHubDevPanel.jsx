// src/components/TrackingHubDevPanel.jsx
// DEV mode panel for testing TrackingHub visualizations

import { useState } from 'react';
import { useProgressStore } from '../state/progressStore';
import { generateMockSessions, MOCK_PATTERNS } from '../utils/devDataGenerator';

export default function TrackingHubDevPanel({ onClose }) {
    const [selectedPattern, setSelectedPattern] = useState('dedicated');
    const { sessions } = useProgressStore();

    const injectMockData = (patternKey) => {
        const pattern = MOCK_PATTERNS[patternKey];
        const mockSessions = [
            ...generateMockSessions('breathwork', pattern.breathwork),
            ...generateMockSessions('visualization', pattern.visualization),
            ...generateMockSessions('wisdom', pattern.wisdom)
        ];

        // Inject into store (this will overwrite existing sessions)
        useProgressStore.setState({ sessions: mockSessions });
        console.log(`✅ Injected ${mockSessions.length} mock sessions (${pattern.label})`);
    };

    const clearMockData = () => {
        const realSessions = sessions.filter(s => !s.metadata?.mock);
        useProgressStore.setState({ sessions: realSessions });
        console.log('🗑️ Cleared all mock data');
    };

    return (
        <div
            className="fixed top-4 right-4 bg-black/90 border border-yellow-500/50 rounded-lg p-4 z-50"
            style={{
                minWidth: '300px',
                backdropFilter: 'blur(10px)',
                fontFamily: 'monospace',
            }}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-yellow-500/30">
                <span className="text-yellow-400 text-xs font-bold">📊 TRACKINGHUB DEV MODE</span>
                <button
                    onClick={onClose}
                    className="text-yellow-400/60 hover:text-yellow-400 text-sm px-2"
                >
                    ✕
                </button>
            </div>

            {/* Pattern Selection */}
            <div className="mb-3">
                <div className="text-yellow-400/70 text-[10px] mb-1">INJECT MOCK DATA:</div>
                <div className="space-y-1">
                    {Object.entries(MOCK_PATTERNS).map(([key, pattern]) => (
                        <button
                            key={key}
                            onClick={() => {
                                setSelectedPattern(key);
                                injectMockData(key);
                            }}
                            className={`
                                w-full text-left px-2 py-1 rounded text-xs
                                ${selectedPattern === key
                                    ? 'bg-yellow-500/20 text-yellow-300'
                                    : 'bg-white/5 text-yellow-400/60 hover:bg-white/10'
                                }
                            `}
                        >
                            {pattern.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Actions */}
            <div className="space-y-1">
                <button
                    onClick={clearMockData}
                    className="w-full px-2 py-1 rounded text-xs bg-red-500/20 text-red-300 hover:bg-red-500/30"
                >
                    🗑️ Clear Mock Data
                </button>
            </div>

            {/* Info */}
            <div className="mt-3 pt-2 border-t border-yellow-500/30">
                <div className="text-yellow-400/50 text-[9px]">
                    Mock sessions = last 30 days
                    <br />
                    Press <kbd className="bg-white/10 px-1 rounded">Ctrl+Shift+D</kbd> to toggle
                </div>
            </div>
        </div>
    );
}
