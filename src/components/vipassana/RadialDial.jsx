// src/components/vipassana/RadialDial.jsx
// Category selection dial for thought classification

import React, { useEffect, useRef, useState } from 'react';
import { THOUGHT_CATEGORIES } from '../../data/vipassanaThemes';

const DIAL_SEGMENTS = [
    { id: 'future', angle: -45 },
    { id: 'past', angle: 45 },
    { id: 'evaluating', angle: 135 },
    { id: 'body', angle: -135 },
];

export function RadialDial({
    x,
    y,
    isVisible,
    onSelect,
    onDismiss,
    autoDismissMs = 1200,
}) {
    const [hoveredSegment, setHoveredSegment] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const dialRef = useRef(null);
    const dismissTimer = useRef(null);

    // Auto-dismiss after timeout
    useEffect(() => {
        if (isVisible) {
            dismissTimer.current = setTimeout(() => {
                onDismiss?.();
            }, autoDismissMs);

            return () => {
                if (dismissTimer.current) {
                    clearTimeout(dismissTimer.current);
                }
            };
        }
    }, [isVisible, autoDismissMs, onDismiss]);

    // Handle pointer movement for slide-to-select
    const handlePointerMove = (e) => {
        if (!dialRef.current) return;

        const rect = dialRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const dx = e.clientX - centerX;
        const dy = e.clientY - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Check if within dial area
        if (distance < 30) {
            setHoveredSegment(null);
            return;
        }

        // Calculate angle and find segment
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);

        for (const segment of DIAL_SEGMENTS) {
            const diff = Math.abs(angle - segment.angle);
            if (diff < 45 || diff > 315) {
                setHoveredSegment(segment.id);
                return;
            }
        }
        setHoveredSegment(null);
    };

    const handlePointerUp = () => {
        if (hoveredSegment) {
            onSelect?.(hoveredSegment);
        } else {
            onDismiss?.();
        }
        setIsDragging(false);
    };

    const handleSegmentClick = (categoryId) => {
        onSelect?.(categoryId);
    };

    if (!isVisible) return null;

    return (
        <div
            ref={dialRef}
            className="fixed pointer-events-auto"
            style={{
                left: x,
                top: y,
                transform: 'translate(-50%, -50%)',
                zIndex: 100,
            }}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
        >
            {/* Background blur - larger and stronger */}
            <div
                className="absolute inset-0 rounded-full"
                style={{
                    width: '150px',
                    height: '150px',
                    left: '-75px',
                    top: '-75px',
                    background: 'radial-gradient(circle, rgba(0, 0, 0, 0.6) 0%, rgba(0, 0, 0, 0.4) 70%, transparent 100%)',
                    backdropFilter: 'blur(12px)',
                    animation: 'dialFadeIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}
            />

            {/* Category segments with staggered animation */}
            {DIAL_SEGMENTS.map((segment, index) => {
                const category = THOUGHT_CATEGORIES[segment.id];
                const isHovered = hoveredSegment === segment.id;
                const rad = (segment.angle * Math.PI) / 180;
                const segmentX = Math.cos(rad) * 45;
                const segmentY = Math.sin(rad) * 45;

                return (
                    <button
                        key={segment.id}
                        className="absolute flex flex-col items-center justify-center rounded-full transition-all"
                        style={{
                            left: segmentX,
                            top: segmentY,
                            transform: `translate(-50%, -50%) scale(${isHovered ? 1.1 : 1})`,
                            width: '42px',
                            height: '42px',
                            background: isHovered
                                ? `linear-gradient(135deg, ${category.color}, rgba(0,0,0,0.3))`
                                : 'rgba(255, 255, 255, 0.1)',
                            border: `2px solid ${isHovered ? category.tint : 'rgba(255, 255, 255, 0.2)'}`,
                            opacity: isHovered ? 1 : 0.85,
                            boxShadow: isHovered ? `0 0 20px ${category.tint}` : 'none',
                            animation: `segmentEntry 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) ${index * 0.05}s backwards`,
                        }}
                        onClick={() => handleSegmentClick(segment.id)}
                    >
                        <span
                            className="text-[11px] font-medium uppercase tracking-wider"
                            style={{
                                color: isHovered ? '#fff' : 'rgba(255, 255, 255, 0.75)',
                                textShadow: isHovered ? '0 2px 4px rgba(0,0,0,0.5)' : 'none',
                            }}
                        >
                            {category.label}
                        </span>
                    </button>
                );
            })}

            {/* Center indicator */}
            <div
                className="absolute rounded-full pointer-events-none"
                style={{
                    width: '20px',
                    height: '20px',
                    left: '-10px',
                    top: '-10px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                }}
            />

            <style>{`
        @keyframes dialFadeIn {
          from { opacity: 0; transform: scale(0.7); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes segmentEntry {
          from { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
          to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
      `}</style>
        </div>
    );
}

export default RadialDial;
