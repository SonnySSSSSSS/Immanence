import React, { useState, useRef, useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';

export function PresenceSigil({ onLongPress, onTap, stage = 'flame' }) {
    const [isPressing, setIsPressing] = useState(false);
    const timerRef = useRef(null);
    const controls = useAnimation();

    // Handle long press logic
    const handlePointerDown = () => {
        setIsPressing(true);
        controls.start({
            scale: 0.8,
            opacity: 0.8,
            transition: { duration: 0.5, ease: "easeOut" }
        });

        timerRef.current = setTimeout(() => {
            if (onLongPress) onLongPress();
            setIsPressing(false);
        }, 600); // Threshold for long press
    };

    const handlePointerUp = () => {
        if (isPressing) {
            if (timerRef.current) clearTimeout(timerRef.current);
            setIsPressing(false);
            controls.start({
                scale: 1,
                opacity: 1,
                transition: { type: 'spring', stiffness: 300, damping: 20 }
            });
            if (onTap) onTap();
        }
    };

    const handlePointerCancel = () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        setIsPressing(false);
        controls.start({ scale: 1, opacity: 1 });
    };

    return (
        <div
            className="fixed top-0 left-1/2 -translate-x-1/2 z-[3000] flex flex-col items-center"
            style={{ top: 'env(safe-area-inset-top, 0px)' }}
        >
            <motion.div
                animate={controls}
                onPointerDown={handlePointerDown}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerCancel}
                className="relative w-12 h-12 flex items-center justify-center cursor-pointer select-none touch-none"
            >
                {/* Glow Sphere */}
                <div className="absolute inset-0 rounded-full bg-amber-500/20 blur-md animate-pulse" />

                {/* The Sigil Core (Simplified Avatar-like ring) */}
                <div
                    className="relative w-6 h-6 rounded-full border border-amber-500/60 flex items-center justify-center"
                    style={{
                        boxShadow: '0 0 10px var(--accent-color)',
                        borderColor: 'var(--accent-color)'
                    }}
                >
                    <div className="w-1.5 h-1.5 rounded-full bg-white shadow-lg" />
                </div>

                {/* Progress Ring during press */}
                {isPressing && (
                    <svg className="absolute inset-0 w-full h-full -rotate-90">
                        <motion.circle
                            cx="24"
                            cy="24"
                            r="10"
                            stroke="var(--accent-color)"
                            strokeWidth="2"
                            fill="transparent"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 0.6, ease: "linear" }}
                        />
                    </svg>
                )}
            </motion.div>
        </div>
    );
}
