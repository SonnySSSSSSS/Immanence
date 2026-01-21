// src/components/PathSelectionGrid.jsx
import { useState } from 'react';
import { getAllPaths } from '../data/navigationData.js';
import { useNavigationStore } from '../state/navigationStore.js';
import { useDisplayModeStore } from '../state/displayModeStore.js';
import { useCurriculumStore } from '../state/curriculumStore.js';
import { ThoughtDetachmentOnboarding } from './ThoughtDetachmentOnboarding.jsx';

export function PathSelectionGrid({ onPathSelected, selectedPathId }) {
    const allPaths = getAllPaths();
    // Show all paths (initiation and initiation-2 for testing)
    const paths = allPaths.filter(p => p.id.startsWith('initiation'));
    const { activePath, abandonPath } = useNavigationStore();
    const { onboardingComplete } = useCurriculumStore();
    const colorScheme = useDisplayModeStore(s => s.colorScheme);
    const isLight = colorScheme === 'light';

    const [showThoughtDetachmentOnboarding, setShowThoughtDetachmentOnboarding] = useState(false);

    // Define special program entries (Foundation Cycle removed)
    const programs = [
        {
            id: "program-thought-detachment",
            title: "Thought Ritual",
            subtitle: "Detach from recurring thoughts",
            glyph: "🌊",
            duration: "Daily",
            isProgram: true,
            isActive: onboardingComplete,
            onClick: () => setShowThoughtDetachmentOnboarding(true)
        }
    ];

    // Combine programs and paths
    const combinedEntries = [...programs, ...paths];

    return (
        <div className="w-full">
            <div
                className="text-[9px] uppercase tracking-[0.24em] mb-3"
                style={{ color: isLight ? 'rgba(60, 52, 37, 0.7)' : 'rgba(253,251,245,0.9)', textShadow: isLight ? 'none' : '0 1px 3px rgba(0,0,0,0.4)', fontWeight: 600 }}
            >
                Select Your Path
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {combinedEntries.map((entry) => {
                    const isActive = entry.isProgram ? entry.isActive : activePath?.pathId === entry.id;
                    const isSelected = selectedPathId === entry.id;
                    const hasActivePathMatch = activePath && activePath.pathId === entry.id;
                    const isPlaceholder = entry.placeholder;

                    return (
                        <button
                            key={entry.id}
                            onClick={() => {
                                if (entry.isProgram) {
                                    entry.onClick();
                                } else if (!isPlaceholder) {
                                    // Clear activePath if it's for a different path
                                    if (activePath && activePath.pathId !== entry.id) {
                                        abandonPath();
                                    }
                                    // Notify parent to open overlay
                                    onPathSelected?.(entry.id);
                                }
                            }}
                            disabled={isPlaceholder}
                            className="relative px-3 py-5 sm:px-4 sm:py-6 rounded-3xl border transition-all text-left overflow-hidden group"
                            style={{
                                background: isLight
                                    ? 'linear-gradient(145deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.5) 100%)'
                                    : 'linear-gradient(145deg, rgba(26, 15, 28, 0.92) 0%, rgba(21, 11, 22, 0.95) 100%)',
                                borderColor: hasActivePathMatch
                                    ? '#D4A84A'
                                    : isLight
                                        ? 'rgba(180, 140, 90, 0.15)'
                                        : 'transparent',
                                borderWidth: hasActivePathMatch ? '3px' : '1px',
                                backgroundImage: isLight
                                    ? isPlaceholder
                                        ? 'linear-gradient(145deg, rgba(255, 255, 255, 0.3), rgba(0, 0, 0, 0.02))'
                                        : isSelected
                                            ? 'linear-gradient(145deg, rgba(255, 255, 255, 0.95), rgba(212, 168, 74, 0.08))'
                                            : isActive
                                                ? 'linear-gradient(145deg, rgba(255, 255, 255, 0.95), rgba(180, 140, 90, 0.05))'
                                                : 'linear-gradient(145deg, rgba(255, 255, 255, 0.7), rgba(0, 0, 0, 0.01))'
                                    : isPlaceholder
                                        ? `linear-gradient(145deg, rgba(26, 15, 28, 0.5), rgba(21, 11, 22, 0.6)),
                                           linear-gradient(135deg, rgba(128, 128, 128, 0.2) 0%, rgba(128, 128, 128, 0.1) 50%, rgba(128, 128, 128, 0.15) 100%)`
                                        : isSelected
                                            ? `linear-gradient(145deg, rgba(26, 15, 28, 0.92), rgba(21, 11, 22, 0.95)),
                                               linear-gradient(135deg, rgba(212, 168, 74, 0.3) 0%, rgba(212, 168, 74, 0.15) 50%, rgba(212, 168, 74, 0.25) 100%)`
                                            : isActive
                                                ? `linear-gradient(145deg, rgba(26, 15, 28, 0.92), rgba(21, 11, 22, 0.95)),
                                                   linear-gradient(135deg, var(--accent-50) 0%, var(--accent-40) 50%, var(--accent-50) 100%)`
                                                : `linear-gradient(145deg, rgba(26, 15, 28, 0.92), rgba(21, 11, 22, 0.95)),
                                                   linear-gradient(135deg, var(--accent-40) 0%, rgba(138, 43, 226, 0.2) 50%, var(--accent-30) 100%)`,
                                backgroundOrigin: 'border-box',
                                backgroundClip: 'padding-box, border-box',
                                boxShadow: isLight
                                    ? hasActivePathMatch
                                        ? '0 0 30px rgba(212, 168, 74, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.8)'
                                        : '0 4px 12px rgba(0, 0, 0, 0.03), inset 0 1px 0 rgba(255, 255, 255, 0.5)'
                                    : hasActivePathMatch
                                        ? '0 0 40px rgba(212, 168, 74, 0.5), 0 0 60px rgba(212, 168, 74, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.12), inset 0 -3px 12px rgba(0, 0, 0, 0.4)'
                                        : isPlaceholder
                                            ? '0 4px 16px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.03), inset 0 -3px 12px rgba(0, 0, 0, 0.3)'
                                            : '0 8px 32px rgba(0, 0, 0, 0.6), 0 2px 8px var(--accent-10), inset 0 1px 0 rgba(255, 255, 255, 0.08), inset 0 -3px 12px rgba(0, 0, 0, 0.4)',
                                opacity: isPlaceholder ? 0.4 : 1,
                                cursor: isPlaceholder ? 'not-allowed' : 'pointer'
                            }}
                            onMouseEnter={(e) => {
                                if (!isPlaceholder && !isActive) {
                                    e.currentTarget.style.boxShadow = isLight
                                        ? '0 12px 30px rgba(180, 140, 90, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.8)'
                                        : `0 12px 40px rgba(0, 0, 0, 0.7), 0 0 30px var(--accent-20), inset 0 1px 0 rgba(255, 255, 255, 0.12), inset 0 -3px 12px rgba(0, 0, 0, 0.4)`;
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!isPlaceholder && !isActive) {
                                    e.currentTarget.style.boxShadow = isLight
                                        ? '0 4px 12px rgba(0, 0, 0, 0.03), inset 0 1px 0 rgba(255, 255, 255, 0.5)'
                                        : '0 8px 32px rgba(0, 0, 0, 0.6), 0 2px 8px var(--accent-10), inset 0 1px 0 rgba(255, 255, 255, 0.08), inset 0 -3px 12px rgba(0, 0, 0, 0.4)';
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
                                        background: `radial-gradient(circle at 50% 0%, ${isActive ? 'var(--accent-glow)20' : 'var(--accent-glow)08'} 0%, transparent 60%)`
                                    }}
                                />
                            )}

                            {/* Active indicator */}
                            {isActive && (
                                <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[var(--accent-color)] shadow-[0_0_8px_var(--accent-60)] z-10" />
                            )}

                            <div className="relative z-10">
                                {/* Glyph */}
                                <div
                                    className="text-3xl mb-3 font-bold tracking-wide transition-colors"
                                    style={{
                                        fontFamily: 'var(--font-display)',
                                        color: isLight
                                            ? (isSelected ? 'rgba(140, 100, 40, 0.9)' : 'rgba(140, 100, 40, 0.6)')
                                            : 'var(--accent-70)'
                                    }}
                                >
                                    {entry.glyph}
                                </div>

                                {/* Title */}
                                <h3
                                    className="text-sm font-bold mb-1.5 leading-tight line-clamp-2 tracking-wide transition-colors"
                                    style={{
                                        fontFamily: 'var(--font-display)',
                                        color: isLight ? 'rgba(60, 52, 37, 0.9)' : 'rgba(253,251,245,0.92)'
                                    }}
                                >
                                    {entry.title}
                                </h3>

                                {/* Subtitle */}
                                <p
                                    className="text-[11px] mb-2.5 leading-snug line-clamp-2 font-medium transition-colors"
                                    style={{
                                        fontFamily: 'var(--font-body)',
                                        fontStyle: 'italic',
                                        letterSpacing: '0.01em',
                                        color: isLight ? 'rgba(90, 77, 60, 0.6)' : 'rgba(253,251,245,0.65)'
                                    }}
                                >
                                    {entry.subtitle}
                                </p>

                                {/* Duration */}
                                {!isPlaceholder && (
                                    <div
                                        className="text-[10px] uppercase tracking-wider font-bold"
                                        style={{ color: isLight ? 'rgba(140, 100, 40, 0.7)' : 'var(--accent-50)' }}
                                    >
                                        {typeof entry.duration === 'number' ? `${entry.duration} weeks` : entry.duration}
                                    </div>
                                )}

                                {isPlaceholder && (
                                    <div
                                        className="text-[10px] uppercase tracking-wider opacity-40 font-bold"
                                        style={{ color: isLight ? 'rgba(60, 52, 37, 0.4)' : 'rgba(253,251,245,0.3)' }}
                                    >
                                        Coming soon
                                    </div>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>

            <ThoughtDetachmentOnboarding
                isOpen={showThoughtDetachmentOnboarding}
                onClose={() => setShowThoughtDetachmentOnboarding(false)}
            />
        </div>
    );
}
