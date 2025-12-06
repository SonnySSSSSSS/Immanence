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
                            className={`
                relative
                px-4 py-6
                rounded-2xl
                border
                transition-all
                text-left
                ${isPlaceholder
                                    ? 'opacity-40 cursor-not-allowed border-[var(--accent-10)] bg-[rgba(253,251,245,0.01)]'
                                    : isSelected
                                        ? 'border-[var(--accent-40)] shadow-[0_0_20px_var(--accent-15)] bg-[rgba(253,251,245,0.03)]'
                                        : 'border-[var(--accent-10)] bg-[rgba(253,251,245,0.02)] hover:border-[var(--accent-20)] hover:bg-[rgba(253,251,245,0.05)]'
                                }
              `}
                        >
                            {/* Active path indicator */}
                            {isActive && (
                                <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[var(--accent-color)] shadow-[0_0_8px_var(--accent-60)]" />
                            )}

                            {/* Glyph */}
                            <div
                                className="text-3xl mb-3 text-[var(--accent-70)]"
                                style={{ fontFamily: 'Cinzel, serif' }}
                            >
                                {path.glyph}
                            </div>

                            {/* Title */}
                            <h3
                                className="text-sm font-semibold text-[rgba(253,251,245,0.92)] mb-1.5 leading-tight line-clamp-2"
                                style={{ fontFamily: 'Cinzel, serif' }}
                            >
                                {path.title}
                            </h3>

                            {/* Subtitle */}
                            <p
                                className="text-[11px] text-[rgba(253,251,245,0.65)] mb-2.5 leading-snug line-clamp-2"
                                style={{ fontFamily: 'Crimson Pro, serif', fontStyle: 'italic' }}
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
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
