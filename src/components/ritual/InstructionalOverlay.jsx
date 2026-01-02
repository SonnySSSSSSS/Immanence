import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDisplayModeStore } from '../../state/displayModeStore';

export function InstructionalOverlay({ isOpen, imageUrl, caption, onDismiss }) {
    const colorScheme = useDisplayModeStore(s => s.colorScheme);
    const isLight = colorScheme === 'light';

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[1000] flex items-center justify-center p-6 backdrop-blur-sm"
                    style={{
                        backgroundColor: isLight ? 'rgba(240,240,235,0.85)' : 'rgba(0,0,0,0.80)'
                    }}
                    onClick={onDismiss}
                >
                    <motion.div 
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="rounded-3xl overflow-hidden max-w-lg w-full shadow-2xl"
                        style={{
                            backgroundColor: isLight ? '#FFFFFF' : '#1a1a1a',
                            border: isLight ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(255,255,255,0.1)'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div 
                            className="aspect-[4/3] w-full"
                            style={{
                                backgroundImage: `url(${imageUrl})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                            }}
                        />
                        <div className="p-8 text-center">
                            <h3 
                                className="font-display text-xl mb-3 tracking-widest uppercase"
                                style={{
                                    color: isLight ? '#A07855' : '#D4B87A'
                                }}
                            >
                                Ritual Guidance
                            </h3>
                            <p 
                                className="text-sm leading-relaxed mb-6"
                                style={{
                                    color: isLight ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.7)'
                                }}
                            >
                                {caption}
                            </p>
                            <button 
                                onClick={onDismiss}
                                className="px-8 py-3 rounded-full transition-all text-sm font-bold tracking-widest uppercase"
                                style={{
                                    backgroundColor: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)',
                                    border: isLight ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(255,255,255,0.1)',
                                    color: isLight ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)';
                                }}
                            >
                                Understood
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
