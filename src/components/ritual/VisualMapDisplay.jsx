import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const BASE = import.meta.env.BASE_URL || '/';

const PULSE_FRAMES = [
    `${BASE}assets/ritual/glow_frame_1.png`,
    `${BASE}assets/ritual/glow_frame_2.png`,
    `${BASE}assets/ritual/glow_frame_3.png`,
    `${BASE}assets/ritual/glow_frame_4.png`,
    `${BASE}assets/ritual/glow_frame_5.png`,
];

export function VisualMapDisplay({ isPulsing = false, showOverlay = false }) {
    return (
        <div className="relative w-80 h-80 flex items-center justify-center">
            {/* Base Map */}
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 2 }}
                className="absolute inset-0 z-10"
                style={{
                    backgroundImage: `url(${BASE}assets/ritual/visual_map_v1.png)`,
                    backgroundSize: 'contain',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'center',
                }}
            />

            {/* Pulse Layer */}
            <AnimatePresence>
                {isPulsing && (
                    <motion.div
                        className="absolute inset-0 z-20"
                        initial={{ opacity: 0 }}
                        animate={{ 
                            opacity: [0, 0.8, 0],
                        }}
                        transition={{ 
                            duration: 4, 
                            repeat: Infinity, 
                            ease: "easeInOut" 
                        }}
                    >
                        {/* We could use CSS animation with frames here, or just pulse the scale/opacity of a glow frame */}
                        <div 
                            className="w-full h-full"
                            style={{
                                backgroundImage: `url(${PULSE_FRAMES[4]})`,
                                backgroundSize: 'contain',
                                backgroundRepeat: 'no-repeat',
                                backgroundPosition: 'center',
                                filter: 'drop-shadow(0 0 30px var(--accent-color))'
                            }}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Scanned/Focus Ring */}
            <motion.div 
                className="absolute inset-0 z-30 border border-white/5 rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            />
        </div>
    );
}
