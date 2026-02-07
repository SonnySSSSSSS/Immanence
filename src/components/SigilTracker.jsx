import React, { useState, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useSigilStore } from '../state/sigilStore';
import { useDisplayModeStore } from '../state/displayModeStore.js';

export function SigilTracker({ isOpen, onClose }) {
    const [currentPath, setCurrentPath] = useState([]);
    const [isDrawing, setIsDrawing] = useState(false);
    const [intention, setIntention] = useState('');
    const svgRef = useRef(null);
    const addSigil = useSigilStore(state => state.addSigil);
    const colorScheme = useDisplayModeStore(s => s.colorScheme);
    const isLight = colorScheme === 'light';

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
                className="sigil-tracker-modal fixed inset-0 z-[4000] flex flex-col items-center justify-center p-6 sm:p-12 overflow-hidden"
                style={{
                    background: isLight
                        ? 'linear-gradient(180deg, #F5F0E6 0%, #EDE5D8 100%)'
                        : 'black'
                }}
            >
                {/* Organic texture layer (only for light mode) */}
                {isLight && (
                    <svg className="absolute inset-0 w-full h-full opacity-[0.04] pointer-events-none" style={{ mixBlendMode: 'multiply' }}>
                        <filter id="sigil-organic-noise">
                            <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch" />
                        </filter>
                        <rect width="100%" height="100%" filter="url(#sigil-organic-noise)" />
                    </svg>
                )}
                {/* Sacred Geometry Background (Faint) */}
                <div className="absolute inset-0 pointer-events-none opacity-10">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--accent-color)_0%,transparent_70%)] blur-3xl" />
                </div>

                {/* Toolbar */}
                <div className="relative w-full max-w-lg mb-8 flex justify-between items-center z-10">
                    <button
                        onClick={onClose}
                        className="transition-all duration-300 uppercase tracking-[0.2em] text-xs hover:opacity-100"
                        style={{ color: isLight ? 'rgba(60, 45, 35, 0.5)' : 'rgba(100, 116, 139, 1)' }}
                    >
                        Abandon
                    </button>
                    <div className="text-center">
                        <h2
                            className="font-display tracking-[0.3em] uppercase text-sm"
                            style={{
                                color: isLight ? 'var(--light-accent)' : 'rgba(253, 230, 138, 0.8)',
                                textShadow: isLight ? '0 1px 2px rgba(180, 120, 40, 0.15)' : 'none'
                            }}
                        >
                            Trace Intent
                        </h2>
                    </div>
                    <button
                        onClick={handleClear}
                        className="transition-all duration-300 uppercase tracking-[0.2em] text-xs hover:opacity-100"
                        style={{ color: isLight ? 'rgba(60, 45, 35, 0.5)' : 'rgba(100, 116, 139, 1)' }}
                    >
                        Clear
                    </button>
                </div>

                {/* Drawing Area */}
                <div
                    className="relative w-full max-w-lg aspect-square rounded-[2rem] overflow-hidden transition-all duration-500"
                    style={{
                        background: isLight ? '#FDFBF5' : '#050508',
                        border: isLight ? '2px solid rgba(160, 120, 80, 0.3)' : '1px solid rgba(245, 158, 11, 0.1)',
                        boxShadow: isLight
                            ? '0 8px 24px rgba(120, 90, 60, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.5)'
                            : '0 0 50px rgba(0,0,0,0.5)'
                    }}
                >
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
                        onPointerLeave={handlePointerUp}
                        onPointerCancel={handlePointerUp}
                    >
                        {currentPath.length > 1 && (
                            <polyline
                                points={currentPath.map(p => `${p.x},${p.y}`).join(' ')}
                                fill="none"
                                stroke={isLight ? 'rgba(180, 120, 40, 0.8)' : 'rgba(255, 220, 120, 0.8)'}
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                style={{
                                    filter: `drop-shadow(0 0 6px ${isLight ? 'rgba(180, 120, 40, 0.4)' : 'rgba(255, 220, 120, 0.4)'})`,
                                    opacity: 0.9
                                }}
                            />
                        )}
                    </svg>

                    {/* Prompt Empty State */}
                    {currentPath.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <p
                                className="font-serif italic text-sm tracking-wide"
                                style={{
                                    color: isLight ? 'rgba(60, 45, 35, 0.35)' : '#334155',
                                    opacity: isLight ? 1 : 0.4
                                }}
                            >
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
                        className="w-full bg-transparent py-3 px-2 text-center focus:outline-none transition-colors font-serif italic tracking-wide"
                        style={{
                            borderBottom: `1px solid ${isLight ? 'rgba(160, 120, 80, 0.35)' : 'rgba(245, 158, 11, 0.2)'}`,
                            color: isLight ? '#3D3425' : 'rgba(254, 243, 199, 1)',
                            '--placeholder-color': isLight ? 'rgba(60, 45, 35, 0.35)' : 'rgba(51, 65, 85, 1)'
                        }}
                    />
                    <style>{`
                        input::placeholder { color: var(--placeholder-color) !important; }
                    `}</style>
                </div>

                {/* Seal Button */}
                <div className="relative w-full max-w-lg mt-12 flex justify-center z-10">
                    <button
                        onClick={handleSeal}
                        disabled={currentPath.length < 2}
                        className={`
                            px-12 py-4 rounded-full border transition-all duration-700 uppercase tracking-[0.4em] text-xs font-semibold
                            ${currentPath.length > 1
                                ? (isLight
                                    ? 'border-amber-700/60 bg-amber-700/8 text-amber-900 shadow-[0_5px_15px_rgba(180,120,40,0.2)] hover:bg-amber-700/12 hover:shadow-[0_8px_20px_rgba(180,120,40,0.25)]'
                                    : 'border-amber-500 bg-amber-500/10 text-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:bg-amber-500/15')
                                : (isLight
                                    ? 'border-black/10 text-black/25 grayscale cursor-not-allowed'
                                    : 'border-slate-800 text-slate-700 grayscale cursor-not-allowed')}
                        `}
                    >
                        Seal Trace
                    </button>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
