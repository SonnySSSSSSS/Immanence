// src/components/Application/MirrorSeal.jsx
// Mirror Seal - Ceremonial reveal and locking of the neutral sentence
// Transforms messy input into a "minted artifact"

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Particle component for dissolution effect
function DissolutionParticle({ delay }) {
    return (
        <motion.div
            className="absolute w-1 h-1 rounded-full bg-[var(--accent-color)]"
            initial={{
                opacity: 0.8,
                scale: 1,
                x: 0,
                y: 0,
            }}
            animate={{
                opacity: 0,
                scale: 0.3,
                x: (Math.random() - 0.5) * 200,
                y: (Math.random() - 0.5) * 100 - 50,
            }}
            transition={{
                duration: 1.5,
                delay,
                ease: 'easeOut',
            }}
            style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
            }}
        />
    );
}

// The Minted Card - Final artifact appearance
function MintedCard({ sentence, isSealed }) {
    return (
        <motion.div
            className="relative max-w-md mx-auto"
            initial={{ scale: 0.8, opacity: 0, rotateX: -20 }}
            animate={{
                scale: 1,
                opacity: 1,
                rotateX: 0,
            }}
            transition={{
                type: 'spring',
                damping: 15,
                stiffness: 100,
                delay: 0.5,
            }}
        >
            {/* Card glow */}
            <div
                className="absolute inset-0 rounded-2xl blur-xl pointer-events-none"
                style={{
                    background: 'radial-gradient(ellipse at center, rgba(255,220,120,0.2) 0%, transparent 70%)',
                    transform: 'scale(1.1)',
                }}
            />

            {/* The Card */}
            <motion.div
                className="relative rounded-2xl p-8 overflow-hidden"
                animate={{
                    boxShadow: isSealed
                        ? '0 0 40px rgba(255,220,120,0.3), 0 20px 40px rgba(0,0,0,0.5)'
                        : '0 0 20px rgba(255,220,120,0.15), 0 15px 30px rgba(0,0,0,0.4)',
                }}
                style={{
                    background: 'linear-gradient(135deg, rgba(20,18,28,0.95) 0%, rgba(10,10,18,0.98) 100%)',
                    border: '1px solid rgba(255,220,120,0.25)',
                }}
            >
                {/* Subtle pattern overlay */}
                <div
                    className="absolute inset-0 pointer-events-none opacity-10"
                    style={{
                        backgroundImage: `radial-gradient(circle at 20% 20%, rgba(255,220,120,0.1) 0%, transparent 50%)`,
                    }}
                />

                {/* Seal icon at top */}
                <motion.div
                    className="absolute top-3 right-3 text-xl"
                    animate={{
                        rotate: isSealed ? [0, 360] : 0,
                        scale: isSealed ? [1, 1.2, 1] : 1,
                    }}
                    transition={{ duration: 0.6 }}
                >
                    {isSealed ? '🔐' : '📜'}
                </motion.div>

                {/* Header */}
                <div className="text-center mb-4">
                    <div
                        className="text-[9px] uppercase tracking-[0.3em]"
                        style={{ color: 'rgba(255,220,120,0.5)' }}
                    >
                        Neutral Observation
                    </div>
                </div>

                {/* The Sentence */}
                <motion.p
                    className="text-center leading-relaxed"
                    style={{
                        fontFamily: "'Crimson Pro', serif",
                        fontSize: '18px',
                        fontWeight: 500,
                        color: 'rgba(255,255,255,0.95)',
                        lineHeight: 1.6,
                    }}
                >
                    "{sentence}"
                </motion.p>

                {/* Sealed stamp effect */}
                <AnimatePresence>
                    {isSealed && (
                        <motion.div
                            initial={{ scale: 2, opacity: 0, rotate: -30 }}
                            animate={{ scale: 1, opacity: 0.15, rotate: -15 }}
                            className="absolute bottom-4 right-4 text-6xl pointer-events-none select-none"
                        >
                            ⬡
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Timestamp */}
                <div
                    className="text-center mt-4 text-[10px]"
                    style={{ color: 'rgba(255,255,255,0.3)' }}
                >
                    Observed · {new Date().toLocaleDateString()}
                </div>
            </motion.div>
        </motion.div>
    );
}

export function MirrorSeal({
    originalSentence,
    neutralSentence,
    onLock,
    isValidating = false,
    validationResult = null,
}) {
    const [phase, setPhase] = useState('reveal'); // reveal | transforming | sealed
    const [particles, setParticles] = useState([]);
    const [isSealed, setIsSealed] = useState(false);

    // Generate particles for dissolution effect
    useEffect(() => {
        if (phase === 'transforming') {
            const newParticles = Array.from({ length: 30 }, (_, i) => ({
                id: i,
                delay: i * 0.03,
            }));
            setParticles(newParticles);

            // Transition to sealed after animation
            const timer = setTimeout(() => {
                setPhase('sealed');
            }, 1800);

            return () => clearTimeout(timer);
        }
    }, [phase]);

    const handleTransform = () => {
        setPhase('transforming');
    };

    const handleLock = () => {
        setIsSealed(true);
        // Fire the callback slightly faster to feel more responsive
        // but still allow the initial lock animation state to register
        setTimeout(() => {
            onLock?.();
        }, 400);
    };

    return (
        <div className="w-full py-8 px-4">
            {/* Phase: Original reveal */}
            <AnimatePresence mode="wait">
                {phase === 'reveal' && (
                    <motion.div
                        key="reveal"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="text-center"
                    >
                        {/* Original sentence - styled as raw/impure */}
                        <div
                            className="text-[10px] uppercase tracking-[0.2em] mb-3"
                            style={{ color: 'rgba(255,255,255,0.4)' }}
                        >
                            Your Description
                        </div>

                        <motion.p
                            className="text-lg italic max-w-md mx-auto mb-8 leading-relaxed"
                            style={{
                                fontFamily: "'Crimson Pro', serif",
                                color: 'rgba(255,255,255,0.6)',
                            }}
                        >
                            "{originalSentence}"
                        </motion.p>

                        {/* Transform button */}
                        <motion.button
                            onClick={handleTransform}
                            className="px-8 py-3 rounded-full"
                            whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(255,220,120,0.3)' }}
                            whileTap={{ scale: 0.95 }}
                            style={{
                                background: 'linear-gradient(135deg, rgba(255,220,120,0.2) 0%, rgba(255,220,120,0.1) 100%)',
                                border: '1px solid var(--accent-40)',
                                color: 'var(--accent-color)',
                                fontFamily: 'Outfit, sans-serif',
                                fontSize: '12px',
                                letterSpacing: '0.15em',
                            }}
                        >
                            ✨ DISTILL TO FACT
                        </motion.button>

                        <p
                            className="text-[10px] mt-3 italic"
                            style={{ color: 'rgba(255,255,255,0.3)' }}
                        >
                            Strip away narrative. See what remains.
                        </p>
                    </motion.div>
                )}

                {/* Phase: Transforming */}
                {phase === 'transforming' && (
                    <motion.div
                        key="transforming"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-center py-12 relative"
                    >
                        {/* Dissolution particles */}
                        <div className="absolute inset-0 overflow-hidden pointer-events-none">
                            {particles.map((p) => (
                                <DissolutionParticle key={p.id} delay={p.delay} />
                            ))}
                        </div>

                        {/* Fading text */}
                        <motion.p
                            animate={{
                                opacity: [0.6, 0.2, 0],
                                filter: ['blur(0px)', 'blur(2px)', 'blur(5px)'],
                            }}
                            transition={{ duration: 1.5 }}
                            className="text-lg italic max-w-md mx-auto"
                            style={{
                                fontFamily: "'Crimson Pro', serif",
                                color: 'rgba(255,255,255,0.6)',
                            }}
                        >
                            "{originalSentence}"
                        </motion.p>

                        {/* Status */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="text-[11px] mt-6"
                            style={{ color: 'var(--accent-50)' }}
                        >
                            Distilling...
                        </motion.div>
                    </motion.div>
                )}

                {/* Phase: Sealed card */}
                {phase === 'sealed' && (
                    <motion.div
                        key="sealed"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-6"
                    >
                        <MintedCard sentence={neutralSentence} isSealed={isSealed} />

                        {/* Validation feedback */}
                        {validationResult && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.8 }}
                                className="text-center"
                            >
                                {validationResult.clean ? (
                                    <div className="text-[11px] text-green-400/80">
                                        ✓ Clean observation - no narrative detected
                                    </div>
                                ) : (
                                    <div className="text-[11px] text-yellow-400/80">
                                        ⚠ {validationResult.message || 'Consider: is this purely factual?'}
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* Lock button */}
                        {!isSealed && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1 }}
                                className="flex justify-center"
                            >
                                <motion.button
                                    onClick={handleLock}
                                    disabled={isValidating}
                                    className="px-8 py-3 rounded-full"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    style={{
                                        background: 'linear-gradient(135deg, var(--accent-30) 0%, var(--accent-20) 100%)',
                                        border: '1px solid var(--accent-50)',
                                        color: 'var(--accent-color)',
                                        fontFamily: 'Outfit, sans-serif',
                                        fontSize: '13px',
                                        letterSpacing: '0.12em',
                                        opacity: isValidating ? 0.5 : 1,
                                    }}
                                >
                                    🔒 SEAL THIS TRUTH
                                </motion.button>
                            </motion.div>
                        )}

                        {/* Sealed confirmation */}
                        {isSealed && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center"
                            >
                                <div
                                    className="text-[12px] mb-1"
                                    style={{ color: 'var(--accent-color)' }}
                                >
                                    Mirror Locked
                                </div>
                                <div
                                    className="text-[10px] italic"
                                    style={{ color: 'rgba(255,255,255,0.4)' }}
                                >
                                    This fact now anchors your chain.
                                </div>
                            </motion.div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
