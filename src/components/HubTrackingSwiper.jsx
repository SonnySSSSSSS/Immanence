// src/components/HubTrackingSwiper.jsx
// Swipeable container for Practice Hub and Application Hub cards

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrackingHub } from './TrackingHub.jsx';
import { ApplicationTrackingCard } from './ApplicationTrackingCard.jsx';
import { useDisplayModeStore } from '../state/displayModeStore.js';

void motion;

const PAGES = [
    { id: 0, name: 'Practice Hub', component: TrackingHub },
    { id: 1, name: 'Application Hub', component: ApplicationTrackingCard }
];

export function HubTrackingSwiper({ streakInfo }) {
    const [page, setPage] = useState(0);
    const [direction, setDirection] = useState(0);
    const colorScheme = useDisplayModeStore(s => s.colorScheme);
    const isLight = colorScheme === 'light';

    const paginate = (newDirection) => {
        const newPage = page + newDirection;
        if (newPage >= 0 && newPage < PAGES.length) {
            setDirection(newDirection);
            setPage(newPage);
        }
    };

    const swipeConfidenceThreshold = 10000;
    const swipePower = (offset, velocity) => {
        return Math.abs(offset) * velocity;
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

    const CurrentPage = PAGES[page].component;

    return (
        <div className="w-full relative">
            {/* Page Indicators */}
            <div className="flex items-center justify-center gap-3 mb-12">
                {PAGES.map((p, index) => (
                    <button
                        key={p.id}
                        onClick={() => {
                            setDirection(index > page ? 1 : -1);
                            setPage(index);
                        }}
                        className="transition-all duration-300"
                        style={{
                            opacity: index === page ? 1 : 0.3,
                            transform: index === page ? 'scale(1.2)' : 'scale(1)'
                        }}
                    >
                        {/* Cymatic glyph indicators */}
                        {index === 0 ? (
                            // Practice: Concentric circles
                            <svg width="20" height="20" viewBox="0 0 20 20">
                                <circle cx="10" cy="10" r="7" fill="none"
                                    stroke={index === page ? 'var(--accent-color)' : (isLight ? 'rgba(90, 77, 60, 0.35)' : 'rgba(253,251,245,0.25)')}
                                    strokeWidth={index === page ? "1.2" : "0.8"}
                                    opacity={index === page ? 0.4 : 0.5} />
                                <circle cx="10" cy="10" r="5" fill="none"
                                    stroke={index === page ? 'var(--accent-color)' : (isLight ? 'rgba(90, 77, 60, 0.4)' : 'rgba(253,251,245,0.3)')}
                                    strokeWidth={index === page ? "1.5" : "1"}
                                    opacity={index === page ? 0.7 : 0.6} />
                                <circle cx="10" cy="10" r="2.5"
                                    fill={index === page ? 'var(--accent-color)' : (isLight ? 'rgba(90, 77, 60, 0.2)' : 'rgba(253,251,245,0.15)')}
                                    opacity={index === page ? 0.6 : 0.4} />
                            </svg>
                        ) : (
                            // Application: Triple horizontal lines (field tracking)
                            <svg width="20" height="20" viewBox="0 0 20 20">
                                <line x1="5" y1="7" x2="15" y2="7"
                                    stroke={index === page ? 'var(--accent-color)' : (isLight ? 'rgba(90, 77, 60, 0.35)' : 'rgba(253,251,245,0.25)')}
                                    strokeWidth={index === page ? "1.5" : "1"}
                                    opacity={index === page ? 1 : 0.6} />
                                <line x1="5" y1="10" x2="15" y2="10"
                                    stroke={index === page ? 'var(--accent-color)' : (isLight ? 'rgba(90, 77, 60, 0.35)' : 'rgba(253,251,245,0.25)')}
                                    strokeWidth={index === page ? "1.5" : "1"}
                                    opacity={index === page ? 1 : 0.6} />
                                <line x1="5" y1="13" x2="15" y2="13"
                                    stroke={index === page ? 'var(--accent-color)' : (isLight ? 'rgba(90, 77, 60, 0.35)' : 'rgba(253,251,245,0.25)')}
                                    strokeWidth={index === page ? "1.5" : "1"}
                                    opacity={index === page ? 1 : 0.6} />
                            </svg>
                        )}
                    </button>
                ))}
            </div>

            {/* Swipeable Container */}
            <div className="relative overflow-hidden">
                <AnimatePresence initial={false} custom={direction} mode="wait">
                    <motion.div
                        key={page}
                        custom={direction}
                        variants={variants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{
                            x: { type: "spring", stiffness: 300, damping: 30 },
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
                    >
                        <CurrentPage streakInfo={streakInfo} />
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
