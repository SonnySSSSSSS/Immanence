// src/components/HubCardSwiper.jsx
// Swipeable container for Home Hub cards with smooth transitions

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDisplayModeStore } from '../state/displayModeStore.js';

void motion;

const swipeConfidenceThreshold = 10000;
const swipePower = (offset, velocity) => {
    return Math.abs(offset) * velocity;
};

export function HubCardSwiper({ cards }) {
    const [[page, direction], setPage] = useState([0, 0]);
    const colorScheme = useDisplayModeStore(s => s.colorScheme);
    const isLight = colorScheme === 'light';
    const displayMode = useDisplayModeStore(s => s.viewportMode);
    const isSanctuary = displayMode === 'sanctuary';
    
    const cardMaxWidth = isSanctuary ? '656px' : 'min(430px, 94vw)';

    const cardIndex = ((page % cards.length) + cards.length) % cards.length;

    const paginate = (newDirection) => {
        setPage([page + newDirection, newDirection]);
    };

    const variants = {
        enter: (direction) => ({
            x: direction > 0 ? 1000 : -1000,
            opacity: 0
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1
        },
        exit: (direction) => ({
            zIndex: 0,
            x: direction < 0 ? 1000 : -1000,
            opacity: 0
        })
    };

    return (
        <div className="relative w-full transition-all duration-700" style={{ maxWidth: cardMaxWidth, margin: '0 auto' }}>
            {/* Dot Indicators - Moved above card */}
            {cards.length > 1 && (
                <div className="flex justify-center items-center gap-2 mb-3">
                    {cards.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => {
                                const newDirection = index > cardIndex ? 1 : -1;
                                setPage([index, newDirection]);
                            }}
                            className="w-2 h-2 rounded-full transition-all duration-300"
                            style={{
                                background: index === cardIndex
                                    ? (isLight ? 'rgba(180, 120, 40, 0.9)' : 'var(--accent-color)')
                                    : (isLight ? 'rgba(180, 120, 40, 0.2)' : 'rgba(253, 251, 245, 0.2)'),
                                boxShadow: index === cardIndex
                                    ? `0 0 8px ${isLight ? 'rgba(180, 120, 40, 0.4)' : 'var(--accent-glow)'}`
                                    : 'none',
                                transform: index === cardIndex ? 'scale(1.3)' : 'scale(1)',
                                cursor: 'pointer'
                            }}
                            aria-label={`Go to card ${index + 1}`}
                        />
                    ))}
                </div>
            )}

            {/* Swipeable Card Container - Tightened for symmetry */}
            <div className="relative overflow-visible" style={{ minHeight: isSanctuary ? '420px' : '400px' }}>
                <AnimatePresence initial={false} custom={direction} mode="wait">
                    <motion.div
                        key={page}
                        custom={direction}
                        variants={variants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{
                            x: { type: 'spring', stiffness: 300, damping: 30 },
                            opacity: { duration: 0.2 }
                        }}
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={1}
                        onDragEnd={(e, { offset, velocity }) => {
                            const swipe = swipePower(offset.x, velocity.x);

                            if (swipe < -swipeConfidenceThreshold) {
                                paginate(1);
                            } else if (swipe > swipeConfidenceThreshold) {
                                paginate(-1);
                            }
                        }}
                        className="absolute w-full"
                    >
                        {cards[cardIndex]}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Swipe Hint (subtle, fades after first interaction) */}
            {page === 0 && cards.length > 1 && (
                <motion.div
                    initial={{ opacity: 0.5 }}
                    animate={{ opacity: 0 }}
                    transition={{ delay: 3, duration: 1 }}
                    className="absolute bottom-20 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-[0.2em] pointer-events-none"
                    style={{
                        color: isLight ? 'rgba(100, 80, 60, 0.4)' : 'rgba(253, 251, 245, 0.3)',
                        fontFamily: 'var(--font-display)',
                        fontWeight: 600
                    }}
                >
                    ← Swipe →
                </motion.div>
            )}
        </div>
    );
}

export default HubCardSwiper;
