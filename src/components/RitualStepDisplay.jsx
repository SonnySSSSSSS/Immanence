import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const RitualStepDisplay = ({ step, stepIndex, totalSteps, isPaused, isLight = false }) => {
    // Construct simplified image path that works with the public folder structure
    // If the step provides a full path like 'rituals/standing-meditation/step-1.png', use it
    // Otherwise fallback or handle appropriately. 
    // Using import.meta.env.BASE_URL is critical for GitHub Pages.

    const imagePath = step.image
        ? `${import.meta.env.BASE_URL}${step.image}`
        : null;

    return (
        <div className="w-full h-full flex flex-col md:flex-row gap-4 p-4 relative overflow-visible">
            {/* Image Section - Left/Top */}
            <div className="flex-1 flex items-center justify-center relative min-h-[40vh] md:min-h-full">
                <AnimatePresence mode="wait">
                    {imagePath ? (
                        <motion.img
                            key={step.id}
                            src={imagePath}
                            alt={step.name}
                            className="w-full h-full object-contain rounded-xl"
                            style={{
                                maskImage: isLight ? 'radial-gradient(circle at center, black 70%, transparent 100%)' : 'none',
                                WebkitMaskImage: isLight ? 'radial-gradient(circle at center, black 70%, transparent 100%)' : 'none',
                            }}
                            initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
                            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                            exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                        />
                    ) : step.content ? (
                        <motion.div
                            key={step.id}
                            className={`flex items-center justify-center text-center p-8 w-full h-full`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                        >
                            <span 
                                className={`text-[clamp(1.5rem,5vw,3rem)] font-serif italic ${isLight ? 'text-[#5A4D3C]' : 'text-white/90'} leading-snug`}
                                style={{ maxWidth: '90%' }}
                            >
                                "{step.content}"
                            </span>
                        </motion.div>
                    ) : null}
                </AnimatePresence>

                {/* Pause Overlay Indicator */}
                {isPaused && (
                    <div className="absolute top-4 right-4 bg-black/60 px-3 py-1 rounded-full border border-white/20 backdrop-blur-md z-20">
                        <span className="text-xs font-mono text-white/70">PAUSED</span>
                    </div>
                )}
            </div>

            {/* Instructions Section - Right/Bottom */}
            <div className={`flex-1 flex flex-col gap-4 ${isLight ? 'bg-white/40' : 'bg-black/60'} backdrop-blur-md p-6 rounded-2xl border ${isLight ? 'border-[#5A4D3C]/10' : 'border-white/10'} shadow-xl md:min-w-[400px] max-h-[60vh] md:max-h-full overflow-y-auto`}>
                {/* Header */}
                <div className={`flex justify-between items-baseline border-b ${isLight ? 'border-[#5A4D3C]/10' : 'border-white/10'} pb-3`}>
                    <h3 className="text-2xl font-light text-[var(--accent-primary)] font-h1">
                        {step.name}
                    </h3>
                    <span className={`text-sm ${isLight ? 'text-[#5A4D3C]/60' : 'text-[var(--accent-muted)]'} font-mono`}>
                        Step {stepIndex + 1} / {totalSteps}
                    </span>
                </div>

                {/* Main Instruction */}
                <div className="space-y-4">
                    <p className={`text-base ${isLight ? 'text-[#3D3425]' : 'text-white/90'} leading-relaxed font-body`}>
                        {step.instruction}
                    </p>

                    {/* Sensory Cues */}
                    {step.sensoryCues && step.sensoryCues.length > 0 && (
                        <div className={`space-y-3 pt-4 border-t ${isLight ? 'border-[#5A4D3C]/10' : 'border-white/10'}`}>
                            <span className="text-xs uppercase tracking-widest text-[var(--accent-secondary)] font-mono opacity-80">
                                Sensory Cues
                            </span>
                            <ul className="space-y-2">
                                {step.sensoryCues.map((cue, idx) => (
                                    <motion.li
                                        key={idx}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.15 + 0.3 }}
                                        className={`text-sm ${isLight ? 'text-[#5A4D3C]/75' : 'text-white/75'} flex items-start gap-2`}
                                    >
                                        <span className="text-[var(--accent-primary)] mt-0.5">•</span>
                                        <span>{cue}</span>
                                    </motion.li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RitualStepDisplay;
