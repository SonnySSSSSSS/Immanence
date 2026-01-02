import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRitualStore } from '../../state/ritualStore';

const BASE = import.meta.env.BASE_URL || '/';

const MOCK_MEMORIES = [
    "A moment of pure gratitude in the morning sun.",
    "The feeling of accomplishment after a long day.",
    "A difficult conversation that led to growth.",
    "The peaceful silence of a forest path.",
    "A shared laugh with a dear friend."
];

export function MemorySelector({ onSelect }) {
    const { setSelectedMemory } = useRitualStore();
    const [isSpinning, setIsSpinning] = useState(false);
    const [result, setResult] = useState(null);

    const handleSelect = () => {
        setIsSpinning(true);
        setResult(null);
        
        // Mock spinning animation duration
        setTimeout(() => {
            const randomMemory = MOCK_MEMORIES[Math.floor(Math.random() * MOCK_MEMORIES.length)];
            setResult(randomMemory);
            setSelectedMemory(randomMemory);
            setIsSpinning(false);
            onSelect && onSelect(randomMemory);
        }, 3000);
    };

    return (
        <div className="flex flex-col items-center gap-8">
            <div className="relative w-32 h-32 flex items-center justify-center">
                <motion.div
                    animate={isSpinning ? { rotate: 360 * 5 } : { rotate: 0 }}
                    transition={isSpinning ? { duration: 3, ease: "easeInOut" } : { duration: 0.5 }}
                    className="w-full h-full rounded-full"
                    style={{
                        backgroundImage: `url(${BASE}assets/ritual/random_icon_v1.png)`,
                        backgroundSize: 'contain',
                        backgroundRepeat: 'no-repeat',
                        filter: isSpinning ? 'drop-shadow(0 0 20px var(--accent-color)) saturate(2)' : 'none'
                    }}
                />
                <AnimatePresence>
                    {isSpinning && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1.2 }}
                            exit={{ opacity: 0 }}
                            className="absolute -inset-4 border-2 border-gold/30 rounded-full animate-ping"
                        />
                    )}
                </AnimatePresence>
            </div>

            <AnimatePresence mode="wait">
                {result ? (
                    <motion.div
                        key="result"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-6 bg-white/5 border border-white/10 rounded-2xl max-w-sm"
                    >
                        <p className="text-gold text-xs uppercase tracking-widest mb-2 font-bold">Selected Memory</p>
                        <p className="text-white italic text-lg leading-relaxed">"{result}"</p>
                    </motion.div>
                ) : (
                    <motion.button
                        key="button"
                        onClick={handleSelect}
                        disabled={isSpinning}
                        className={`px-8 py-3 rounded-full border border-white/20 hover:border-gold/50 transition-all ${isSpinning ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <span className="text-xs font-bold tracking-widest uppercase text-white/70">
                            {isSpinning ? "Selecting..." : "Reveal Memory"}
                        </span>
                    </motion.button>
                )}
            </AnimatePresence>
        </div>
    );
}
