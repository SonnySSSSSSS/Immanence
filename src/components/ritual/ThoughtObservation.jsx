import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDisplayModeStore } from '../../state/displayModeStore';

const POSITIVE_THOUGHTS = [
    "I am capable of growth",
    "This moment is full of potential",
    "I am doing my best",
    "I can handle this challenge",
    "I am learning and evolving",
    "There is beauty in this present moment",
    "I trust the process",
    "I am enough as I am"
];

const NEGATIVE_THOUGHTS = [
    "I'm not good enough",
    "This is too difficult",
    "I always mess things up",
    "Nothing ever works out",
    "I'm falling behind",
    "I should be better by now",
    "Everyone else has it figured out",
    "I'll never get this right"
];

export function ThoughtObservation({ photoUrl, onComplete }) {
    const [currentThought, setCurrentThought] = useState(null);
    const [thoughtType, setThoughtType] = useState(null);
    const [observationTime, setObservationTime] = useState(0);
    const colorScheme = useDisplayModeStore(s => s.colorScheme);
    const isLight = colorScheme === 'light';
    const timerRef = useRef(null);
    const startTimeRef = useRef(Date.now());

    // Track observation duration
    useEffect(() => {
        const interval = setInterval(() => {
            setObservationTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // Continuous random thought cycle
    useEffect(() => {
        const showRandomThought = () => {
            // Combine all thoughts and pick one randomly
            const allThoughts = [...POSITIVE_THOUGHTS, ...NEGATIVE_THOUGHTS];
            const randomIndex = Math.floor(Math.random() * allThoughts.length);
            const randomThought = allThoughts[randomIndex];
            const isPositive = randomIndex < POSITIVE_THOUGHTS.length;
            
            setThoughtType(isPositive ? 'positive' : 'negative');
            setCurrentThought(randomThought);

            // Show thought for 3-4 seconds
            const displayDuration = 3000 + Math.random() * 1000;
            
            setTimeout(() => {
                setCurrentThought(null);
                
                // Wait 8-12 seconds before next thought (10 +/- 2)
                const nextInterval = 8000 + Math.random() * 4000;
                timerRef.current = setTimeout(showRandomThought, nextInterval);
            }, displayDuration);
        };

        // Start the cycle
        showRandomThought();

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);

    const handleProceed = () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        setCurrentThought(null);
        onComplete();
    };

    // Show proceed button after 30 seconds
    const canProceed = observationTime >= 30;

    return (
        <div className="flex flex-col items-center gap-6 w-full max-w-md">
            {/* Thought Display - Above Image */}
            <div className="w-full h-20 flex items-center justify-center relative">
                <AnimatePresence mode="wait">
                    {currentThought && (
                        <motion.div
                            key={currentThought}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                            className="absolute inset-0 flex items-center justify-center px-4"
                        >
                            <p 
                                className="text-center text-base font-medium italic px-4 py-2 rounded-xl border max-w-sm"
                                style={{
                                    color: thoughtType === 'positive' 
                                        ? (isLight ? '#2E7D32' : '#66BB6A')
                                        : (isLight ? '#C62828' : '#EF5350'),
                                    backgroundColor: thoughtType === 'positive'
                                        ? (isLight ? 'rgba(46,125,50,0.08)' : 'rgba(102,187,106,0.08)')
                                        : (isLight ? 'rgba(198,40,40,0.08)' : 'rgba(239,83,80,0.08)'),
                                    borderColor: thoughtType === 'positive'
                                        ? (isLight ? 'rgba(46,125,50,0.25)' : 'rgba(102,187,106,0.25)')
                                        : (isLight ? 'rgba(198,40,40,0.25)' : 'rgba(239,83,80,0.25)')
                                }}
                            >
                                "{currentThought}"
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Photo Display */}
            <div className="relative w-full aspect-square rounded-[40px] overflow-hidden border shadow-2xl"
                style={{
                    borderColor: isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'
                }}
            >
                <img 
                    src={photoUrl} 
                    alt="Self as Observer" 
                    className="w-full h-full object-cover grayscale"
                />
            </div>

            {/* Instruction */}
            <div className="text-center px-4">
                <p className="text-sm leading-relaxed opacity-60"
                    style={{ color: isLight ? 'black' : 'white' }}
                >
                    Notice the thoughts arising. You are <em>witnessing</em> them, not becoming them.
                </p>
                {canProceed && (
                    <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-xs mt-3"
                        style={{ color: isLight ? '#A07855' : '#D4B87A' }}
                    >
                        {observationTime}s observed • Ready to proceed
                    </motion.p>
                )}
            </div>

            {/* Proceed Button */}
            <AnimatePresence>
                {canProceed && (
                    <motion.button
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={handleProceed}
                        className="group relative px-10 py-3 rounded-full border transition-all active:scale-95"
                        style={{
                            borderColor: isLight ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)',
                            color: isLight ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)'
                        }}
                    >
                        <span className="relative z-10 text-xs font-black tracking-[0.3em] uppercase">
                            Continue
                        </span>
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity rounded-full"
                            style={{ backgroundColor: isLight ? 'rgba(160,120,85,0.05)' : 'rgba(212,184,122,0.05)' }}
                        />
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Timer indicator */}
            {!canProceed && (
                <div className="text-[10px] uppercase font-bold tracking-widest opacity-30"
                    style={{ color: isLight ? 'black' : 'white' }}
                >
                    {observationTime}s
                </div>
            )}
        </div>
    );
}
