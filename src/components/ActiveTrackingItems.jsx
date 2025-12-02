// src/components/ActiveTrackingItems.jsx
import React from 'react';
import { useNavigationStore } from '../state/navigationStore.js';
import { useApplicationStore } from '../state/applicationStore.js';
import { getPathById } from '../data/navigationData.js';

// Direction symbols for gesture logging
const DIRECTION_SYMBOLS = {
    up: '↑',
    down: '↓',
    left: '←',
    right: '→'
};

export function ActiveTrackingItems() {
    const { activePath } = useNavigationStore();
    const { getWeekLogs, intention, setIntention } = useApplicationStore();
    const [isEditingIntention, setIsEditingIntention] = React.useState(false);
    const [intentionInput, setIntentionInput] = React.useState(intention || '');

    if (!activePath) return null;

    const path = getPathById(activePath.pathId);
    if (!path || !path.applicationItems || path.applicationItems.length === 0) return null;

    const weekLogs = getWeekLogs();
    const logCounts = {};
    weekLogs.forEach(log => {
        logCounts[log.category] = (logCounts[log.category] || 0) + 1;
    });

    // Map items to directions (up, left, down, right)
    const directions = ['up', 'left', 'down', 'right'];
    const trackingItems = path.applicationItems.slice(0, 4).map((item, idx) => ({
        name: item,
        direction: directions[idx],
        count: logCounts[item.toLowerCase().replace(/\s+/g, '-')] || 0
    }));

    const handleSaveIntention = () => {
        setIntention(intentionInput);
        setIsEditingIntention(false);
    };

    return (
        <div className="w-full">
            <div className="bg-[#0f0f1a] border border-[rgba(253,224,71,0.15)] rounded-3xl p-6">
                {/* Header */}
                <h2
                    className="text-sm uppercase tracking-[0.2em] text-[rgba(253,224,71,0.7)] mb-4 text-center"
                    style={{ fontFamily: 'Cinzel, serif' }}
                >
                    TRACKING THIS WEEK
                </h2>

                {/* Tracking Items Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    {trackingItems.map((item) => {
                        // Color intensity based on count (0-20+ scale)
                        const intensity = Math.min(item.count / 20, 1);
                        const goldOpacity = 0.1 + (intensity * 0.3); // 0.1 to 0.4

                        return (
                            <div
                                key={item.name}
                                className="relative rounded-xl p-4 border transition-all"
                                style={{
                                    borderColor: `rgba(253, 224, 71, ${0.15 + intensity * 0.2})`,
                                    backgroundColor: `rgba(253, 224, 71, ${goldOpacity * 0.3})`
                                }}
                            >
                                {/* Direction Symbol */}
                                <div
                                    className="text-3xl text-center mb-2"
                                    style={{ color: `rgba(253, 224, 71, ${0.6 + intensity * 0.4})` }}
                                >
                                    {DIRECTION_SYMBOLS[item.direction]}
                                </div>

                                {/* Name */}
                                <div
                                    className="text-xs text-center text-[rgba(253,251,245,0.85)] mb-2 line-clamp-2"
                                    style={{ fontFamily: 'Crimson Pro, serif' }}
                                >
                                    {item.name}
                                </div>

                                {/* Count */}
                                <div className="text-center">
                                    <span
                                        className="text-sm font-semibold"
                                        style={{ color: `rgba(253, 224, 71, ${0.7 + intensity * 0.3})` }}
                                    >
                                        {item.count}
                                    </span>
                                    <span className="text-xs text-[rgba(253,251,245,0.4)] ml-1">✓</span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Intention Statement */}
                <div className="border-t border-[rgba(253,224,71,0.1)] pt-4">
                    <div className="text-xs uppercase tracking-wider text-[rgba(253,224,71,0.6)] mb-2">
                        Intention
                    </div>

                    {isEditingIntention ? (
                        <div className="space-y-2">
                            <textarea
                                value={intentionInput}
                                onChange={(e) => setIntentionInput(e.target.value)}
                                placeholder="When I notice [pattern], I will..."
                                className="w-full bg-[rgba(253,224,71,0.05)] border border-[rgba(253,224,71,0.2)] rounded-xl px-3 py-2 text-sm text-[rgba(253,251,245,0.9)] placeholder:text-[rgba(253,251,245,0.3)] focus:outline-none focus:border-[rgba(253,224,71,0.4)] resize-none"
                                style={{ fontFamily: 'Crimson Pro, serif', fontStyle: 'italic' }}
                                rows={3}
                            />
                            <div className="flex gap-2 justify-end">
                                <button
                                    onClick={() => setIsEditingIntention(false)}
                                    className="text-xs text-[rgba(253,251,245,0.5)] hover:text-[rgba(253,251,245,0.8)] transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveIntention}
                                    className="text-xs px-3 py-1 rounded-full bg-gradient-to-br from-[#fcd34d] to-[#f59e0b] text-[#050508] font-semibold"
                                >
                                    Save
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div
                            onClick={() => setIsEditingIntention(true)}
                            className="cursor-pointer hover:bg-[rgba(253,224,71,0.05)] transition-colors rounded-xl p-3"
                        >
                            {intention ? (
                                <p
                                    className="text-sm text-[rgba(253,251,245,0.8)] italic leading-relaxed"
                                    style={{ fontFamily: 'Crimson Pro, serif' }}
                                >
                                    "{intention}"
                                </p>
                            ) : (
                                <p
                                    className="text-sm text-[rgba(253,251,245,0.4)] italic"
                                    style={{ fontFamily: 'Crimson Pro, serif' }}
                                >
                                    Click to set your intention...
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
