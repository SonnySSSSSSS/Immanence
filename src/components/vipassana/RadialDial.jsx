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
            {/* Background blur */}
            <div
                className="absolute inset-0 rounded-full"
                style={{
                    width: '140px',
                    height: '140px',
                    left: '-70px',
                    top: '-70px',
                    background: 'rgba(0, 0, 0, 0.4)',
                    backdropFilter: 'blur(8px)',
                    animation: 'dialFadeIn 0.2s ease-out',
                }}
            />

            {/* Category segments */}
            {DIAL_SEGMENTS.map((segment) => {
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
                            transform: 'translate(-50%, -50%)',
                            width: '48px',
                            height: '48px',
                            background: isHovered
                                ? category.color
                                : 'rgba(255, 255, 255, 0.08)',
                            border: `1px solid ${isHovered ? category.tint : 'rgba(255, 255, 255, 0.15)'}`,
                            opacity: isHovered ? 1 : 0.8,
                        }}
                        onClick={() => handleSegmentClick(segment.id)}
                    >
                        <span
                            className="text-[10px] uppercase tracking-wider"
                            style={{
                                color: isHovered ? '#fff' : 'rgba(255, 255, 255, 0.7)',
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
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
        </div>
    );
}

export default RadialDial;
