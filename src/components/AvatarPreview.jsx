// src/components/AvatarPreview.jsx
// Debug panel to preview all 30 Stage × Path avatar combinations

import React, { useEffect } from 'react';
import { IconStyleToggle } from '../icons/Icon.jsx';

export const STAGES = ['Seedling', 'Ember', 'Flame', 'Beacon', 'Stellar'];
export const PATHS = ['Soma', 'Prana', 'Dhyana', 'Drishti', 'Jnana', 'Samyoga'];

// Stage colors for glow effect
export const STAGE_COLORS = {
    Seedling: '#4ade80',
    Ember: '#f97316',
    Flame: '#fcd34d',
    Beacon: '#22d3ee',
    Stellar: '#a78bfa',
};

export function AvatarPreview({
    onClose,
    stage,
    path,
    showCore,
    onStageChange,
    onPathChange,
    onShowCoreChange
}) {
    const stageColor = STAGE_COLORS[stage];

    // File path: /avatars/Stage-Path.png or /avatars/stage-core.png
    const imagePath = showCore
        ? `${import.meta.env.BASE_URL}avatars/${stage.toLowerCase()}-core.png`
        : `${import.meta.env.BASE_URL}avatars/${stage}-${path}.png`;

    const stageIndex = STAGES.indexOf(stage);
    const pathIndex = PATHS.indexOf(path);

    const handlePrevStage = () => onStageChange(STAGES[(stageIndex - 1 + STAGES.length) % STAGES.length]);
    const handleNextStage = () => onStageChange(STAGES[(stageIndex + 1) % STAGES.length]);
    const handlePrevPath = () => onPathChange(PATHS[(pathIndex - 1 + PATHS.length) % PATHS.length]);
    const handleNextPath = () => onPathChange(PATHS[(pathIndex + 1) % PATHS.length]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'ArrowLeft') handlePrevStage();
            else if (e.key === 'ArrowRight') handleNextStage();
            else if (e.key === 'ArrowUp') { e.preventDefault(); handlePrevPath(); }
            else if (e.key === 'ArrowDown') { e.preventDefault(); handleNextPath(); }
            else if (e.key === 'c' || e.key === 'C') onShowCoreChange(!showCore);
            else if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    });

    return (
        <div className="fixed inset-0 z-[200] bg-black/95 flex flex-col items-center justify-center p-4">
            {/* Close button */}
            <button
                onClick={onClose}
                className="absolute top-4 right-4 text-white/60 hover:text-white text-2xl w-10 h-10 flex items-center justify-center"
            >
                ✕
            </button>

            {/* Title */}
            <div className="text-center mb-6">
                <h2
                    className="text-2xl font-medium tracking-wide"
                    style={{ fontFamily: 'Cinzel, Georgia, serif', color: stageColor }}
                >
                    {stage} · {showCore ? 'Core' : path}
                </h2>
                <p className="text-sm text-white/50 mt-1">
                    {stageIndex * (PATHS.length + 1) + (showCore ? 0 : pathIndex + 1) + 1} of {STAGES.length * (PATHS.length + 1)}
                </p>
                <p className="text-xs text-white/30 mt-1 font-mono">{imagePath}</p>
            </div>

            {/* Avatar Preview */}
            <div
                className="relative w-80 h-80 rounded-full flex items-center justify-center"
                style={{
                    background: `radial-gradient(circle, ${stageColor}20 0%, transparent 70%)`,
                    boxShadow: `0 0 60px ${stageColor}30`,
                }}
            >
                <img
                    src={imagePath}
                    alt={`${stage} ${path}`}
                    className="w-64 h-64 object-cover rounded-full"
                    style={{
                        mixBlendMode: 'screen',
                        filter: 'brightness(1.1)',
                    }}
                    onError={(e) => {
                        e.target.style.opacity = 0.3;
                        e.target.alt = 'Missing image';
                    }}
                />
            </div>

            {/* Controls */}
            <div className="mt-8 flex flex-col gap-4 items-center">
                {/* Stage controls */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={handlePrevStage}
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition"
                    >
                        ← Stage
                    </button>
                    <span className="text-white/70 w-24 text-center">{stage}</span>
                    <button
                        onClick={handleNextStage}
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition"
                    >
                        Stage →
                    </button>
                </div>

                {/* Path controls */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={handlePrevPath}
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition"
                        disabled={showCore}
                        style={{ opacity: showCore ? 0.3 : 1 }}
                    >
                        ← Path
                    </button>
                    <span className="text-white/70 w-24 text-center">{showCore ? 'Core' : path}</span>
                    <button
                        onClick={handleNextPath}
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition"
                        disabled={showCore}
                        style={{ opacity: showCore ? 0.3 : 1 }}
                    >
                        Path →
                    </button>
                </div>

                {/* Core toggle */}
                <button
                    onClick={() => onShowCoreChange(!showCore)}
                    className={`px-6 py-2 rounded-lg transition ${showCore ? 'bg-amber-600 text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'
                        }`}
                >
                    {showCore ? 'Showing Core' : 'Show Core Only'}
                </button>

                {/* Icon style toggle */}
                <div className="mt-4 p-3 bg-white/5 rounded-lg">
                    <IconStyleToggle />
                </div>

                {/* Info */}
                <p className="text-xs text-white/30 mt-4">
                    Arrow keys: ← → Stage | ↑ ↓ Path | C = Toggle Core | Esc = Close
                </p>
                <p className="text-xs text-amber-400/60 mt-1">
                    Selection applies to all avatars in the app
                </p>
            </div>
        </div>
    );
}
