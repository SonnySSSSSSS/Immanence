// src/components/QuickLogGesturePad.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useNavigationStore } from '../state/navigationStore.js';
import { useApplicationStore } from '../state/applicationStore.js';
import { getPathById } from '../data/navigationData.js';

const DIRECTION_ANGLES = {
    up: { min: 45, max: 135 },
    right: { min: 315, max: 45 },
    down: { min: 225, max: 315 },
    left: { min: 135, max: 225 }
};

export function QuickLogGesturePad() {
    const { activePath } = useNavigationStore();
    const { logAwareness } = useApplicationStore();
    const [ripple, setRipple] = useState(null);
    const [justLogged, setJustLogged] = useState(null);
    const padRef = useRef(null);
    const touchStart = useRef({ x: 0, y: 0 });

    if (!activePath) return null;

    const path = getPathById(activePath.pathId);
    if (!path || !path.applicationItems || path.applicationItems.length === 0) return null;

    const trackingItems = {
        up: path.applicationItems[0] || '',
        left: path.applicationItems[1] || '',
        down: path.applicationItems[2] || '',
        right: path.applicationItems[3] || ''
    };

    const handleLog = (direction, x, y) => {
        const category = trackingItems[direction];
        if (!category) return;

        // Convert to normalized category ID
        const categoryId = category.toLowerCase().replace(/\s+/g, '-');

        // Log it
        logAwareness(categoryId, activePath.pathId);

        // Visual feedback
        setRipple({ x, y, direction });
        setJustLogged(direction);

        // Clear feedback
        setTimeout(() => setRipple(null), 600);
        setTimeout(() => setJustLogged(null), 1000);
    };

    const getDirectionFromAngle = (angle) => {
        // Normalize angle to 0-360
        angle = ((angle % 360) + 360) % 360;

        if (angle >= 45 && angle < 135) return 'up';
        if (angle >= 135 && angle < 225) return 'left';
        if (angle >= 225 && angle < 315) return 'down';
        // 315-360 and 0-45
        return 'right';
    };

    const handleTouchStart = (e) => {
        const touch = e.touches[0];
        touchStart.current = { x: touch.clientX, y: touch.clientY };
    };

    const handleTouchEnd = (e) => {
        const touch = e.changedTouches[0];
        const dx = touch.clientX - touchStart.current.x;
        const dy = touch.clientY - touchStart.current.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Require minimum swipe distance
        if (distance > 30) {
            const angle = Math.atan2(-dy, dx) * (180 / Math.PI);
            const direction = getDirectionFromAngle(angle);
            handleLog(direction, touch.clientX, touch.clientY);
        }
    };

    const handleClick = (e) => {
        if (!padRef.current) return;

        const rect = padRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const dx = e.clientX - centerX;
        const dy = e.clientY - centerY;

        const angle = Math.atan2(-dy, dx) * (180 / Math.PI);
        const direction = getDirectionFromAngle(angle);

        handleLog(direction, e.clientX, e.clientY);
    };

    return (
        <div className="w-full">
            <div className="bg-[#0f0f1a] border border-[var(--accent-15)] rounded-3xl p-8 relative overflow-hidden">
                {/* Subtle gradient */}
                <div
                    className="absolute inset-0 pointer-events-none rounded-3xl"
                    style={{
                        background: 'radial-gradient(circle at top, rgba(255,220,120,0.05), transparent 60%)',
                    }}
                />

                {/* Header */}
                <h3
                    className="application-card-label text-[var(--accent-70)] mb-4 text-center relative z-10 font-bold tracking-[0.25em]"
                    style={{ fontFamily: 'var(--font-display)' }}
                >
                    QUICK LOG
                </h3>

                {/* Gesture Pad */}
                <div className="relative z-10">
                    <div
                        ref={padRef}
                        onClick={handleClick}
                        onTouchStart={handleTouchStart}
                        onTouchEnd={handleTouchEnd}
                        className="relative aspect-square max-w-sm mx-auto rounded-2xl border-2 bg-[var(--accent-10)] cursor-pointer select-none overflow-hidden"
                        style={{
                            borderColor: 'var(--accent-20)',
                            boxShadow: 'inset 0 0 24px rgba(255,220,120,0.08)',
                            touchAction: 'none'
                        }}
                    >
                        {/* Center Dot - Larger */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[var(--accent-50)]" />

                        {/* Axis Dots - N/S/E/W */}
                        <div className="quicklog-axis-dot absolute top-4 left-1/2 -translate-x-1/2" />
                        <div className="quicklog-axis-dot absolute bottom-4 left-1/2 -translate-x-1/2" />
                        <div className="quicklog-axis-dot absolute left-4 top-1/2 -translate-y-1/2" />
                        <div className="quicklog-axis-dot absolute right-4 top-1/2 -translate-y-1/2" />

                        {/* Direction Labels */}
                        <div className="absolute top-8 left-1/2 -translate-x-1/2">
                            <div
                                className={`text-sm text-center transition-all max-w-[100px] ${justLogged === 'up' ? 'text-[var(--accent-color)] scale-110' : 'text-[var(--accent-70)]'
                                    }`}
                                style={{ fontFamily: 'var(--font-body)', letterSpacing: '0.01em', fontWeight: 500 }}
                            >
                                <div className="text-xl mb-0.5">↑</div>
                                <div className="text-[11px] line-clamp-2 leading-tight">{trackingItems.up}</div>
                            </div>
                        </div>

                        <div className="absolute left-6 top-1/2 -translate-y-1/2">
                            <div
                                className={`text-sm text-left transition-all max-w-[100px] ${justLogged === 'left' ? 'text-[var(--accent-color)] scale-110' : 'text-[var(--accent-70)]'
                                    }`}
                                style={{ fontFamily: 'var(--font-body)', letterSpacing: '0.01em', fontWeight: 500 }}
                            >
                                <div className="flex items-center gap-1">
                                    <span className="text-xl flex-shrink-0">←</span>
                                    <span className="text-[11px] line-clamp-2 leading-tight">{trackingItems.left}</span>
                                </div>
                            </div>
                        </div>

                        <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
                            <div
                                className={`text-sm text-center transition-all max-w-[100px] ${justLogged === 'down' ? 'text-[var(--accent-color)] scale-110' : 'text-[var(--accent-70)]'
                                    }`}
                                style={{ fontFamily: 'var(--font-body)', letterSpacing: '0.01em', fontWeight: 500 }}
                            >
                                <div className="text-[11px] line-clamp-2 leading-tight mb-0.5">{trackingItems.down}</div>
                                <div className="text-xl">↓</div>
                            </div>
                        </div>

                        <div className="absolute right-6 top-1/2 -translate-y-1/2">
                            <div
                                className={`text-sm text-right transition-all max-w-[100px] ${justLogged === 'right' ? 'text-[var(--accent-color)] scale-110' : 'text-[var(--accent-70)]'
                                    }`}
                                style={{ fontFamily: 'var(--font-body)', letterSpacing: '0.01em', fontWeight: 500 }}
                            >
                                <div className="flex items-center gap-1 justify-end">
                                    <span className="text-[11px] line-clamp-2 leading-tight text-right">{trackingItems.right}</span>
                                    <span className="text-xl flex-shrink-0">→</span>
                                </div>
                            </div>
                        </div>

                        {/* Ripple Effect */}
                        {ripple && (
                            <div
                                className="absolute w-20 h-20 rounded-full border-2 border-[var(--accent-color)] pointer-events-none"
                                style={{
                                    left: ripple.x - padRef.current.getBoundingClientRect().left - 40,
                                    top: ripple.y - padRef.current.getBoundingClientRect().top - 40,
                                    animation: 'ripple 600ms ease-out forwards'
                                }}
                            />
                        )}
                    </div>

                    {/* Instruction */}
                    <p
                        className="text-xs text-center text-[rgba(253,251,245,0.5)] mt-4"
                        style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontWeight: 500, letterSpacing: '0.01em' }}
                    >
                        Tap direction or swipe
                    </p>
                </div>
            </div>

            <style>{`
        @keyframes ripple {
          0% {
            transform: scale(0);
            opacity: 1;
          }
          100% {
            transform: scale(3);
            opacity: 0;
          }
        }
      `}</style>
        </div>
    );
}
