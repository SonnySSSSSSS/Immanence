// src/components/AwarenessCompass.jsx
// Awareness Compass - Swipe-based somatic logging interface
// Replaces the "Quick Log" box with an interactive compass rose

import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigationStore } from '../state/navigationStore.js';
import { useApplicationStore } from '../state/applicationStore.js';
import { getPathById } from '../data/navigationData.js';

// Direction mapping
const DIRECTIONS = {
    north: { label: 'Notice the tension', angle: 90, color: '#FF6B35' },      // Orange - alertness
    south: { label: 'Embodied presence', angle: 270, color: '#4ECDC4' },      // Teal - grounding
    east: { label: 'Observe the pattern', angle: 0, color: '#9B5DE5' },       // Purple - perception
    west: { label: 'Question the story', angle: 180, color: '#F7DC6F' },      // Gold - inquiry
};

// Convert angle from touch to direction
function getDirectionFromAngle(angle) {
    // Normalize to 0-360
    angle = ((angle % 360) + 360) % 360;

    if (angle >= 45 && angle < 135) return 'north';
    if (angle >= 135 && angle < 225) return 'west';
    if (angle >= 225 && angle < 315) return 'south';
    return 'east';
}

export function AwarenessCompass() {
    const { activePath } = useNavigationStore();
    const { logAwareness, getWeekLogs, intention, setIntention } = useApplicationStore();

    const [isEditingIntention, setIsEditingIntention] = useState(false);
    const [intentionInput, setIntentionInput] = useState(intention || '');

    const [activeDirection, setActiveDirection] = useState(null);
    const [flareColor, setFlareColor] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });

    const compassRef = useRef(null);
    const centerRef = useRef({ x: 0, y: 0 });
    const touchStart = useRef({ x: 0, y: 0 });

    if (!activePath) return null;

    const path = getPathById(activePath.pathId);
    if (!path || !path.applicationItems || path.applicationItems.length === 0) return null;

    // Get log counts for the week
    const weekLogs = getWeekLogs();
    const logCounts = {};
    weekLogs.forEach(log => {
        logCounts[log.category] = (logCounts[log.category] || 0) + 1;
    });

    // Map path items to directions
    const trackingItems = {
        north: { name: path.applicationItems[0] || DIRECTIONS.north.label, count: logCounts[path.applicationItems[0]?.toLowerCase().replace(/\s+/g, '-')] || 0 },
        west: { name: path.applicationItems[1] || DIRECTIONS.west.label, count: logCounts[path.applicationItems[1]?.toLowerCase().replace(/\s+/g, '-')] || 0 },
        south: { name: path.applicationItems[2] || DIRECTIONS.south.label, count: logCounts[path.applicationItems[2]?.toLowerCase().replace(/\s+/g, '-')] || 0 },
        east: { name: path.applicationItems[3] || DIRECTIONS.east.label, count: logCounts[path.applicationItems[3]?.toLowerCase().replace(/\s+/g, '-')] || 0 },
    };

    const handleLog = useCallback((direction) => {
        if (!direction) return;

        const categoryId = trackingItems[direction].name.toLowerCase().replace(/\s+/g, '-');
        logAwareness(categoryId, activePath.pathId);

        // Visual feedback - flare
        setFlareColor(DIRECTIONS[direction].color);
        setActiveDirection(direction);

        // Clear after animation
        setTimeout(() => {
            setFlareColor(null);
            setActiveDirection(null);
        }, 800);
    }, [logAwareness, activePath?.pathId, trackingItems]);

    const handleDragStart = (e) => {
        if (!compassRef.current) return;

        const rect = compassRef.current.getBoundingClientRect();
        centerRef.current = {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
        };

        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        touchStart.current = { x: clientX, y: clientY };
        setIsDragging(true);
        setDragPosition({ x: 0, y: 0 });
    };

    const handleDragMove = (e) => {
        if (!isDragging) return;

        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        const dx = clientX - centerRef.current.x;
        const dy = clientY - centerRef.current.y;

        // Clamp to max radius
        const maxRadius = 60;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const clampedDistance = Math.min(distance, maxRadius);
        const angle = Math.atan2(dy, dx);

        setDragPosition({
            x: Math.cos(angle) * clampedDistance,
            y: Math.sin(angle) * clampedDistance
        });

        // Preview direction
        if (distance > 20) {
            const previewAngle = Math.atan2(-dy, dx) * (180 / Math.PI);
            const dir = getDirectionFromAngle(previewAngle);
            if (dir !== activeDirection) {
                setActiveDirection(dir);
            }
        } else {
            setActiveDirection(null);
        }
    };

    const handleDragEnd = (e) => {
        if (!isDragging) return;

        const clientX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
        const clientY = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;

        const dx = clientX - centerRef.current.x;
        const dy = clientY - centerRef.current.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Require minimum distance for logging
        if (distance > 40) {
            const angle = Math.atan2(-dy, dx) * (180 / Math.PI);
            const direction = getDirectionFromAngle(angle);
            handleLog(direction);
        }

        setIsDragging(false);
        setDragPosition({ x: 0, y: 0 });
    };

    return (
        <div className="w-full max-w-sm mx-auto">
            {/* Compass Container */}
            <div
                ref={compassRef}
                className="relative aspect-square"
                onMouseDown={handleDragStart}
                onMouseMove={handleDragMove}
                onMouseUp={handleDragEnd}
                onMouseLeave={() => isDragging && handleDragEnd({ clientX: 0, clientY: 0 })}
                onTouchStart={handleDragStart}
                onTouchMove={handleDragMove}
                onTouchEnd={handleDragEnd}
                style={{ touchAction: 'none', cursor: 'grab' }}
            >
                {/* Background Compass Image */}
                <img
                    src={`${import.meta.env.BASE_URL}ui/awareness-compass.png`}
                    alt=""
                    className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                    style={{ opacity: 0.8 }}
                />

                {/* Direction Flare Effect */}
                <AnimatePresence>
                    {flareColor && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 0.6, scale: 1.5 }}
                            exit={{ opacity: 0, scale: 2 }}
                            transition={{ duration: 0.6, ease: 'easeOut' }}
                            className="absolute inset-0 rounded-full pointer-events-none"
                            style={{
                                background: `radial-gradient(circle, ${flareColor}40 0%, transparent 70%)`,
                            }}
                        />
                    )}
                </AnimatePresence>

                {/* Direction Labels - N/S/E/W with fixed positioning for symmetry */}
                <div className="absolute inset-0 pointer-events-none">
                    {/* North - centered at top */}
                    <motion.div
                        className="absolute top-4 left-1/2 -translate-x-1/2 w-24 text-center"
                        animate={{
                            scale: activeDirection === 'north' ? 1.15 : 1,
                            color: activeDirection === 'north' ? DIRECTIONS.north.color : 'rgba(253,251,245,0.7)'
                        }}
                    >
                        <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'rgba(253,251,245,0.5)' }}>
                            ▲ {trackingItems.north.count > 0 && <span className="ml-1 opacity-70">({trackingItems.north.count})</span>}
                        </div>
                        <div className="text-[11px] leading-tight" style={{ fontFamily: 'Crimson Pro, serif' }}>
                            {trackingItems.north.name}
                        </div>
                    </motion.div>

                    {/* South - centered at bottom */}
                    <motion.div
                        className="absolute bottom-4 left-1/2 -translate-x-1/2 w-24 text-center"
                        animate={{
                            scale: activeDirection === 'south' ? 1.15 : 1,
                            color: activeDirection === 'south' ? DIRECTIONS.south.color : 'rgba(253,251,245,0.7)'
                        }}
                    >
                        <div className="text-[11px] leading-tight mb-1" style={{ fontFamily: 'Crimson Pro, serif' }}>
                            {trackingItems.south.name}
                        </div>
                        <div className="text-[10px] uppercase tracking-wider" style={{ color: 'rgba(253,251,245,0.5)' }}>
                            ▼ {trackingItems.south.count > 0 && <span className="ml-1 opacity-70">({trackingItems.south.count})</span>}
                        </div>
                    </motion.div>

                    {/* West - centered at left */}
                    <motion.div
                        className="absolute left-1 top-1/2 -translate-y-1/2 w-20 text-center"
                        animate={{
                            scale: activeDirection === 'west' ? 1.15 : 1,
                            color: activeDirection === 'west' ? DIRECTIONS.west.color : 'rgba(253,251,245,0.7)'
                        }}
                    >
                        <div className="text-[10px] mb-0.5" style={{ color: 'rgba(253,251,245,0.5)' }}>
                            ◀ {trackingItems.west.count > 0 && <span className="ml-0.5 opacity-70">({trackingItems.west.count})</span>}
                        </div>
                        <div className="text-[11px] leading-tight" style={{ fontFamily: 'Crimson Pro, serif' }}>
                            {trackingItems.west.name}
                        </div>
                    </motion.div>

                    {/* East - centered at right */}
                    <motion.div
                        className="absolute right-1 top-1/2 -translate-y-1/2 w-20 text-center"
                        animate={{
                            scale: activeDirection === 'east' ? 1.15 : 1,
                            color: activeDirection === 'east' ? DIRECTIONS.east.color : 'rgba(253,251,245,0.7)'
                        }}
                    >
                        <div className="text-[11px] leading-tight" style={{ fontFamily: 'Crimson Pro, serif' }}>
                            {trackingItems.east.name}
                        </div>
                        <div className="text-[10px] mt-0.5" style={{ color: 'rgba(253,251,245,0.5)' }}>
                            {trackingItems.east.count > 0 && <span className="mr-0.5 opacity-70">({trackingItems.east.count})</span>} ▶
                        </div>
                    </motion.div>
                </div>

                {/* Center Drag Node */}
                <motion.div
                    className="absolute top-1/2 left-1/2 w-8 h-8 rounded-full cursor-grab active:cursor-grabbing"
                    style={{
                        background: 'radial-gradient(circle, rgba(255,220,120,0.4) 0%, rgba(255,220,120,0.1) 60%, transparent 100%)',
                        boxShadow: isDragging
                            ? '0 0 20px rgba(255,220,120,0.5)'
                            : '0 0 10px rgba(255,220,120,0.3)',
                        x: -16 + dragPosition.x,
                        y: -16 + dragPosition.y,
                    }}
                    animate={{
                        scale: isDragging ? 1.2 : 1,
                    }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                />
            </div>

            {/* Intention Statement */}
            <div className="mt-8 pt-4 border-t border-white/5 max-w-[280px] mx-auto">
                <div className="text-[9px] uppercase tracking-[0.2em] text-white/30 mb-2 text-center">
                    Current Intention
                </div>

                {isEditingIntention ? (
                    <div className="space-y-3">
                        <textarea
                            autoFocus
                            value={intentionInput}
                            onChange={(e) => setIntentionInput(e.target.value)}
                            placeholder="When I notice [pattern], I will..."
                            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white/90 placeholder:text-white/20 focus:outline-none focus:border-white/20 resize-none text-center transition-all shadow-inner"
                            style={{ fontFamily: 'Crimson Pro, serif', fontStyle: 'italic' }}
                            rows={3}
                        />
                        <div className="flex justify-center gap-4">
                            <button
                                onClick={() => {
                                    setIntentionInput(intention || '');
                                    setIsEditingIntention(false);
                                }}
                                className="text-[10px] uppercase tracking-widest text-white/30 hover:text-white/60 transition-colors"
                                style={{ fontFamily: 'Cinzel, serif' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    setIntention(intentionInput);
                                    setIsEditingIntention(false);
                                }}
                                className="text-[10px] uppercase tracking-widest text-[#050508] bg-white/80 hover:bg-white px-4 py-1 rounded-full transition-all"
                                style={{ fontFamily: 'Cinzel, serif' }}
                            >
                                Seal
                            </button>
                        </div>
                    </div>
                ) : (
                    <div
                        onClick={() => setIsEditingIntention(true)}
                        className="cursor-pointer group"
                    >
                        <div className="relative py-2 px-4 rounded-2xl transition-all group-hover:bg-white/[0.02]">
                            {intention ? (
                                <p
                                    className="text-[13px] text-center text-white/70 italic leading-relaxed"
                                    style={{ fontFamily: 'Crimson Pro, serif' }}
                                >
                                    "{intention}"
                                </p>
                            ) : (
                                <p
                                    className="text-xs text-center text-white/20 italic"
                                    style={{ fontFamily: 'Crimson Pro, serif' }}
                                >
                                    Tap to define your intention...
                                </p>
                            )}

                            {/* Decorative line mapping */}
                            <div className="flex justify-center mt-3 scale-x-50 opacity-20 group-hover:opacity-40 transition-opacity">
                                <div className="h-px w-16 bg-gradient-to-r from-transparent via-white to-transparent" />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
