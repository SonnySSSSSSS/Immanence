import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function RitualStepContainer({ 
    children, 
    backgroundUrl, 
    stepNumber,
    isOverlay = false 
}) {
    return (
        <div className="relative w-full h-full min-h-[600px] flex flex-col items-center justify-center overflow-hidden bg-black text-white p-6">
            {/* Background Layer */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={backgroundUrl}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.6 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                    className="absolute inset-0 z-0"
                    style={{
                        backgroundImage: `url(${backgroundUrl})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }}
                />
            </AnimatePresence>

            {/* Content Layer */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="relative z-10 w-full max-w-2xl flex flex-col items-center gap-8"
            >
                {children}
            </motion.div>

            {/* Atmospheric Overlays */}
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black to-transparent pointer-events-none z-10" />
            <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black to-transparent pointer-events-none z-10" />
        </div>
    );
}
