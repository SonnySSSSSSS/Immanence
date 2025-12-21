// src/components/PathSelectionGrid.jsx
import React from 'react';
import { getAllPaths } from '../data/navigationData.js';
import { useNavigationStore } from '../state/navigationStore.js';

export function PathSelectionGrid() {
    const paths = getAllPaths();
    const { selectedPathId, setSelectedPath, activePath } = useNavigationStore();

    return (
        <div className="w-full">
            <div className="text-[9px] uppercase tracking-[0.24em] text-[rgba(253,251,245,0.5)] mb-3">
                Select Your Path
            </div>

            <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                {paths.map((path) => {
                    const isSelected = selectedPathId === path.id;
                    const isActive = activePath?.pathId === path.id;
                    const isPlaceholder = path.placeholder;

                    return (
                        <button
                            key={path.id}
                            onClick={() => !isPlaceholder && setSelectedPath(path.id)}
                            disabled={isPlaceholder}
                            className="relative px-4 py-6 rounded-2xl border transition-all text-left overflow-hidden"
                            style={{
                                background: 'linear-gradient(145deg, rgba(26, 15, 28, 0.92) 0%, rgba(21, 11, 22, 0.95) 100%)',
                                border: '1px solid transparent',
                                backgroundImage: isPlaceholder
                                    ? `linear-gradient(145deg, rgba(26, 15, 28, 0.5), rgba(21, 11, 22, 0.6)),
                                       linear-gradient(135deg, rgba(128, 128, 128, 0.2) 0%, rgba(128, 128, 128, 0.1) 50%, rgba(128, 128, 128, 0.15) 100%)`
                                    : isSelected
                                        ? `linear-gradient(145deg, rgba(26, 15, 28, 0.92), rgba(21, 11, 22, 0.95)),
                                           linear-gradient(135deg, var(--accent-50) 0%, var(--accent-40) 50%, var(--accent-50) 100%)`
                                        : `linear-gradient(145deg, rgba(26, 15, 28, 0.92), rgba(21, 11, 22, 0.95)),
                                           linear-gradient(135deg, var(--accent-40) 0%, rgba(138, 43, 226, 0.2) 50%, var(--accent-30) 100%)`,
                                backgroundOrigin: 'border-box',
                                backgroundClip: 'padding-box, border-box',
                                boxShadow: isPlaceholder
                                    ? '0 4px 16px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.03), inset 0 -3px 12px rgba(0, 0, 0, 0.3)'
                                    : isSelected
                                        ? `0 12px 40px rgba(0, 0, 0, 0.7), 0 0 30px var(--accent-25), 0 0 60px var(--accent-10), inset 0 1px 0 rgba(255, 255, 255, 0.12), inset 0 -3px 12px rgba(0, 0, 0, 0.4)`
                                        : '0 8px 32px rgba(0, 0, 0, 0.6), 0 2px 8px var(--accent-10), inset 0 1px 0 rgba(255, 255, 255, 0.08), inset 0 -3px 12px rgba(0, 0, 0, 0.4)',
                                opacity: isPlaceholder ? 0.4 : 1,
                                cursor: isPlaceholder ? 'not-allowed' : 'pointer'
                            }}
                            onMouseEnter={(e) => {
                                if (!isPlaceholder && !isSelected) {
                                    e.currentTarget.style.boxShadow = `0 12px 40px rgba(0, 0, 0, 0.7), 0 0 30px var(--accent-20), inset 0 1px 0 rgba(255, 255, 255, 0.12), inset 0 -3px 12px rgba(0, 0, 0, 0.4)`;
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!isPlaceholder && !isSelected) {
                                    e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.6), 0 2px 8px var(--accent-10), inset 0 1px 0 rgba(255, 255, 255, 0.08), inset 0 -3px 12px rgba(0, 0, 0, 0.4)';
                                }
                            }}
                        >
                            {/* Volcanic glass texture overlay */}
                            <div
                                className="absolute inset-0 pointer-events-none rounded-2xl"
                                style={{
                                    background: `
                                        radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.02) 0%, transparent 50%),
                                        repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(0, 0, 0, 0.015) 3px, rgba(0, 0, 0, 0.015) 6px)
                                    `,
                                    opacity: 0.7
                                }}
                            />

                            {/* Inner glow */}
                            {!isPlaceholder && (
                                <div
                                    className="absolute inset-0 pointer-events-none rounded-2xl"
                                    style={{
                                        background: `radial-gradient(circle at 50% 0%, ${isSelected ? 'var(--accent-glow)20' : 'var(--accent-glow)08'} 0%, transparent 60%)`
                                    }}
                                />
                            )}

                            {/* Active path indicator */}
                            {isActive && (
                                <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[var(--accent-color)] shadow-[0_0_8px_var(--accent-60)] z-10" />
                            )}

                            <div className="relative z-10">
                                {/* Glyph */}
                                <div
                                    className="text-3xl mb-3 text-[var(--accent-70)] font-bold tracking-wide"
                                    style={{ fontFamily: 'var(--font-display)' }}
                                >
                                    {path.glyph}
                                </div>

                                {/* Title */}
                                <h3
                                    className="text-sm font-bold text-[rgba(253,251,245,0.92)] mb-1.5 leading-tight line-clamp-2 tracking-wide"
                                    style={{ fontFamily: 'var(--font-display)' }}
                                >
                                    {path.title}
                                </h3>

                                {/* Subtitle */}
                                <p
                                    className="text-[11px] text-[rgba(253,251,245,0.65)] mb-2.5 leading-snug line-clamp-2 font-medium"
                                    style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', letterSpacing: '0.01em' }}
                                >
                                    {path.subtitle}
                                </p>

                                {/* Duration */}
                                {!isPlaceholder && (
                                    <div className="text-[10px] text-[var(--accent-50)] uppercase tracking-wider">
                                        {path.duration} weeks
                                    </div>
                                )}

                                {isPlaceholder && (
                                    <div className="text-[10px] text-[rgba(253,251,245,0.3)] uppercase tracking-wider">
                                        Coming soon
                                    </div>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
