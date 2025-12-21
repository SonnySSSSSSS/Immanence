import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSigilStore } from '../state/sigilStore';

export function SigilTracker({ isOpen, onClose, stage = 'flame' }) {
    const [currentPath, setCurrentPath] = useState([]);
    const [isDrawing, setIsDrawing] = useState(false);
    const [intention, setIntention] = useState('');
    const svgRef = useRef(null);
    const addSigil = useSigilStore(state => state.addSigil);

    const handlePointerDown = (e) => {
        setIsDrawing(true);
        const point = getPoint(e);
        setCurrentPath([point]);
    };

    const handlePointerMove = (e) => {
        if (!isDrawing) return;
        const point = getPoint(e);
        setCurrentPath(prev => [...prev, point]);
    };

    const handlePointerUp = () => {
        setIsDrawing(false);
    };

    const getPoint = (e) => {
        const rect = svgRef.current.getBoundingClientRect();
        return {
            x: (e.clientX || e.touches?.[0]?.clientX) - rect.left,
            y: (e.clientY || e.touches?.[0]?.clientY) - rect.top
        };
    };

    const handleSeal = () => {
        if (currentPath.length < 2) return;

        // Construct SVG path string
        const d = currentPath.reduce((acc, point, i) => {
            return acc + (i === 0 ? `M ${point.x} ${point.y}` : ` L ${point.x} ${point.y}`);
        }, '');

        addSigil(d, intention);
        setCurrentPath([]);
        setIntention('');

        // Auto-close logic for quick entry
        const isTraceRoute = window.location.pathname.endsWith('/trace') || window.location.pathname.endsWith('/trace/');

        if (isTraceRoute) {
            setTimeout(() => {
                window.close();
                setTimeout(() => {
                    window.location.href = 'about:blank';
                }, 100);
            }, 1000); // 1s delay to see the seal success
        } else {
            onClose();
        }
    };

    const handleClear = () => {
        setCurrentPath([]);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[4000] bg-black flex flex-col items-center justify-center p-6 sm:p-12 overflow-hidden"
            >
                {/* Sacred Geometry Background (Faint) */}
                <div className="absolute inset-0 pointer-events-none opacity-10">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--accent-color)_0%,transparent_70%)] blur-3xl" />
                </div>

                {/* Toolbar */}
                <div className="relative w-full max-w-lg mb-8 flex justify-between items-center z-10">
                    <button
                        onClick={onClose}
                        className="text-slate-500 hover:text-white transition-colors uppercase tracking-[0.2em] text-xs"
                    >
                        Abandon
                    </button>
                    <div className="text-center">
                        <h2 className="text-amber-200/80 font-display tracking-[0.3em] uppercase text-sm">Trace Intent</h2>
                    </div>
                    <button
                        onClick={handleClear}
                        className="text-slate-500 hover:text-white transition-colors uppercase tracking-[0.2em] text-xs"
                    >
                        Clear
                    </button>
                </div>

                {/* Drawing Area */}
                <div className="relative w-full max-w-lg aspect-square bg-[#050508] border border-amber-500/10 rounded-[2rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden">
                    <svg
                        ref={svgRef}
                        className="w-full h-full touch-none"
                        style={{
                            touchAction: 'none',
                            overscrollBehavior: 'none'
                        }}
                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                    >
                        {currentPath.length > 1 && (
                            <polyline
                                points={currentPath.map(p => `${p.x},${p.y}`).join(' ')}
                                fill="none"
                                stroke="var(--accent-color)"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                style={{
                                    filter: 'drop-shadow(0 0 5px var(--accent-color))',
                                    opacity: 0.8
                                }}
                            />
                        )}
                    </svg>

                    {/* Prompt Empty State */}
                    {currentPath.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <p className="text-slate-700 font-serif italic text-sm tracking-wide">
                                Draw a symbol of your current will
                            </p>
                        </div>
                    )}
                </div>

                {/* Intention Input */}
                <div className="relative w-full max-w-lg mt-8 z-10">
                    <input
                        type="text"
                        placeholder="Name your intention (optional)"
                        value={intention}
                        onChange={(e) => setIntention(e.target.value)}
                        className="w-full bg-transparent border-b border-amber-500/20 py-3 px-2 text-center text-amber-100 placeholder:text-slate-700 focus:outline-none focus:border-amber-500/50 transition-colors font-serif italic tracking-wide"
                    />
                </div>

                {/* Seal Button */}
                <div className="relative w-full max-w-lg mt-12 flex justify-center z-10">
                    <button
                        onClick={handleSeal}
                        disabled={currentPath.length < 2}
                        className={`
              px-12 py-4 rounded-full border transition-all duration-700 uppercase tracking-[0.4em] text-xs
              ${currentPath.length > 1
                                ? 'border-amber-500 bg-amber-500/10 text-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
                                : 'border-slate-800 text-slate-700 grayscale cursor-not-allowed'}
            `}
                    >
                        Seal Trace
                    </button>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
