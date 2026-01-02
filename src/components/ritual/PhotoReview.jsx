import React from 'react';
import { motion } from 'framer-motion';
import { useRitualStore } from '../../state/ritualStore';

export function PhotoReview({ onProceed }) {
    const { photoUrl, selectedMemory } = useRitualStore();

    if (!photoUrl) return null;

    return (
        <div className="flex flex-col items-center gap-8">
            <div className="relative w-full max-w-sm aspect-square rounded-[40px] overflow-hidden border border-gold/20 shadow-[0_0_30px_rgba(212,184,122,0.15)]">
                <img src={photoUrl} className="w-full h-full object-cover" alt="Witness Snapshot" />
                <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black to-transparent">
                    <p className="text-gold text-[10px] uppercase tracking-widest font-bold mb-1 opacity-80">
                        Witness Perspective
                    </p>
                    <p className="text-white text-xs italic opacity-90">
                        Captured during the Sacred Ritual
                    </p>
                </div>
            </div>

            {selectedMemory && (
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 bg-white/5 border border-white/10 rounded-2xl max-w-sm text-center"
                >
                    <p className="text-gold text-[10px] uppercase tracking-widest mb-2 font-bold opacity-60">Held Memory</p>
                    <p className="text-white/80 italic text-sm italic">"{selectedMemory}"</p>
                </motion.div>
            )}

            <button
                onClick={onProceed}
                className="px-10 py-3 rounded-full bg-gold text-black font-bold tracking-widest uppercase hover:bg-gold/80 transition-all active:scale-95"
            >
                Confirm & Seal
            </button>
        </div>
    );
}
