import React from 'react';
import { motion } from 'framer-motion';
import { useDisplayModeStore } from '../../state/displayModeStore';

export function SummaryView({ memory, photoUrl, onComplete }) {
    const colorScheme = useDisplayModeStore(s => s.colorScheme);
    const isLight = colorScheme === 'light';

    return (
        <div className="flex flex-col items-center gap-8 max-w-md w-full mx-auto p-4">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
            >
                <div 
                    className="inline-block px-4 py-1 rounded-full text-[10px] font-bold tracking-[0.2em] uppercase mb-4"
                    style={{
                        backgroundColor: isLight ? 'rgba(160,120,85,0.1)' : 'rgba(212,184,122,0.1)',
                        color: isLight ? '#A07855' : '#D4B87A',
                        border: isLight ? '1px solid rgba(160,120,85,0.2)' : '1px solid rgba(212,184,122,0.2)'
                    }}
                >
                    Ritual Complete
                </div>
                <h3 className="text-2xl font-display tracking-widest uppercase mb-2"
                    style={{ color: isLight ? '#4a4a4a' : 'white' }}
                >
                    Session Summary
                </h3>
            </motion.div>

            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="w-full rounded-2xl overflow-hidden border backdrop-blur-md"
                style={{
                    backgroundColor: isLight ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.03)',
                    borderColor: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.1)'
                }}
            >
                {/* Captured Photo */}
                <div className="aspect-square w-full relative group">
                    {photoUrl ? (
                        <img 
                            src={photoUrl} 
                            alt="Ritual Witness" 
                            className="w-full h-full object-cover grayscale opacity-80" 
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-black/20">
                            <span className="text-4xl opacity-20">📷</span>
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4">
                        <p className="text-[10px] uppercase tracking-widest text-white/50 mb-1">Ritual Witness</p>
                        <p className="text-xs font-display text-white/90">Captured Presence</p>
                    </div>
                </div>

                {/* Focus Memory */}
                <div className="p-6">
                    <p className="text-[10px] uppercase tracking-widest mb-3 opacity-40 font-bold"
                        style={{ color: isLight ? 'black' : 'white' }}
                    >
                        Focus Point
                    </p>
                    <p className="text-lg italic leading-relaxed"
                        style={{ color: isLight ? '#A07855' : '#D4B87A' }}
                    >
                        "{memory || "Stillness & Presence"}"
                    </p>
                </div>

                {/* Outcome Info */}
                <div className="px-6 pb-6 pt-4 border-t"
                    style={{ borderColor: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)' }}
                >
                    <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest opacity-60"
                        style={{ color: isLight ? 'black' : 'white' }}
                    >
                        <span className="flex-shrink-0">✓ Logged to Progress</span>
                        <div className="h-[1px] flex-grow bg-current opacity-20" />
                    </div>
                    <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest opacity-60 mt-2"
                        style={{ color: isLight ? 'black' : 'white' }}
                    >
                        <span className="flex-shrink-0">✓ Sealed in Journal</span>
                        <div className="h-[1px] flex-grow bg-current opacity-20" />
                    </div>
                </div>
            </motion.div>

            <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                onClick={onComplete}
                className="group relative px-12 py-4 rounded-full transition-all active:scale-95 overflow-hidden"
                style={{
                    backgroundColor: isLight ? '#A07855' : '#D4B87A',
                    color: isLight ? 'white' : 'black'
                }}
            >
                <span className="relative z-10 text-xs font-black tracking-[0.3em] uppercase">
                    Return to Hub
                </span>
                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.button>
        </div>
    );
}
