// src/components/PathSelectionGrid.jsx
import React from 'react';
import { getAllPaths } from '../data/navigationData.js';
import { useNavigationStore } from '../state/navigationStore.js';
import { useDisplayModeStore } from '../state/displayModeStore.js';
import { useCycleStore } from '../state/cycleStore.js';
import { useCurriculumStore } from '../state/curriculumStore.js';
import { CycleChoiceModal } from './Cycle/CycleChoiceModal.jsx';
import { ThoughtDetachmentOnboarding } from './ThoughtDetachmentOnboarding.jsx';
import { CurriculumOnboarding } from './CurriculumOnboarding.jsx';
import { useState } from 'react';

export function PathSelectionGrid() {
    const allPaths = getAllPaths();
    // PILOT: Only show Initiation Path
    const paths = allPaths.filter(p => p.id === 'initiation');
    const { selectedPathId, setSelectedPath, activePath } = useNavigationStore();
    const { currentCycle } = useCycleStore();
    const { onboardingComplete, shouldShowOnboarding } = useCurriculumStore();
    const colorScheme = useDisplayModeStore(s => s.colorScheme);
    const isLight = colorScheme === 'light';
    
    // Auto-select Initiation Path on mount
    React.useEffect(() => {
      if (!selectedPathId && paths.length > 0) {
        setSelectedPath('initiation');
      }
    }, [selectedPathId, setSelectedPath, paths.length]);

    const [showCycleChoice, setShowCycleChoice] = useState(false);
    const [showThoughtDetachmentOnboarding, setShowThoughtDetachmentOnboarding] = useState(false);
    const [showFoundationOnboarding, setShowFoundationOnboarding] = useState(false);

    // Define special program entries
    const programs = [
        {
            id: "program-foundation",
            title: "Foundation Cycle",
            subtitle: "14-day consistency ritual",
            glyph: "🌱",
            duration: "14 days",
            isProgram: true,
            isActive: !!currentCycle,
            onClick: () => {
                // Show onboarding if not completed, otherwise show cycle choice
                if (!onboardingComplete || shouldShowOnboarding()) {
                    setShowFoundationOnboarding(true);
                } else if (!currentCycle) {
                    setShowCycleChoice(true);
                }
            }
        },
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
                style={{ color: isLight ? 'rgba(90, 77, 60, 0.5)' : 'rgba(253,251,245,0.5)' }}
            >
                Select Your Path
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {combinedEntries.map((entry) => {
                    const isSelected = selectedPathId === entry.id;
                    const isActive = entry.isProgram ? entry.isActive : activePath?.pathId === entry.id;
                    const isPlaceholder = entry.placeholder;

                    return (
                        <button
                            key={entry.id}
                            onClick={() => {
                                if (entry.isProgram) {
                                    entry.onClick();
                                } else if (!isPlaceholder) {
                                    setSelectedPath(entry.id);
                                }
                            }}
                            disabled={isPlaceholder}
                            className="relative px-3 py-5 sm:px-4 sm:py-6 rounded-3xl border transition-all text-left overflow-hidden group"
                            style={{
                                background: isLight
                                    ? 'linear-gradient(145deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.5) 100%)'
                                    : 'linear-gradient(145deg, rgba(26, 15, 28, 0.92) 0%, rgba(21, 11, 22, 0.95) 100%)',
                                borderColor: isLight
                                    ? (isSelected ? 'rgba(180, 140, 90, 0.6)' : 'rgba(180, 140, 90, 0.15)')
                                    : 'transparent',
                                backgroundImage: isLight
                                    ? isPlaceholder
                                        ? 'linear-gradient(145deg, rgba(255, 255, 255, 0.3), rgba(0, 0, 0, 0.02))'
                                        : isSelected
                                            ? 'linear-gradient(145deg, rgba(255, 255, 255, 0.95), rgba(180, 140, 90, 0.05))'
                                            : 'linear-gradient(145deg, rgba(255, 255, 255, 0.7), rgba(0, 0, 0, 0.01))'
                                    : isPlaceholder
                                        ? `linear-gradient(145deg, rgba(26, 15, 28, 0.5), rgba(21, 11, 22, 0.6)),
                                           linear-gradient(135deg, rgba(128, 128, 128, 0.2) 0%, rgba(128, 128, 128, 0.1) 50%, rgba(128, 128, 128, 0.15) 100%)`
                                        : isSelected
                                            ? `linear-gradient(145deg, rgba(26, 15, 28, 0.92), rgba(21, 11, 22, 0.95)),
                                               linear-gradient(135deg, var(--accent-50) 0%, var(--accent-40) 50%, var(--accent-50) 100%)`
                                            : `linear-gradient(145deg, rgba(26, 15, 28, 0.92), rgba(21, 11, 22, 0.95)),
                                               linear-gradient(135deg, var(--accent-40) 0%, rgba(138, 43, 226, 0.2) 50%, var(--accent-30) 100%)`,
                                backgroundOrigin: 'border-box',
                                backgroundClip: 'padding-box, border-box',
                                boxShadow: isLight
                                    ? isSelected
                                        ? '0 12px 30px rgba(180, 140, 90, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.8)'
                                        : '0 4px 12px rgba(0, 0, 0, 0.03), inset 0 1px 0 rgba(255, 255, 255, 0.5)'
                                    : isPlaceholder
                                        ? '0 4px 16px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.03), inset 0 -3px 12px rgba(0, 0, 0, 0.3)'
                                        : isSelected
                                            ? `0 12px 40px rgba(0, 0, 0, 0.7), 0 0 30px var(--accent-25), 0 0 60px var(--accent-10), inset 0 1px 0 rgba(255, 255, 255, 0.12), inset 0 -3px 12px rgba(0, 0, 0, 0.4)`
                                            : '0 8px 32px rgba(0, 0, 0, 0.6), 0 2px 8px var(--accent-10), inset 0 1px 0 rgba(255, 255, 255, 0.08), inset 0 -3px 12px rgba(0, 0, 0, 0.4)',
                                opacity: isPlaceholder ? 0.4 : 1,
                                cursor: isPlaceholder ? 'not-allowed' : 'pointer'
                            }}
                            onMouseEnter={(e) => {
                                if (!isPlaceholder && !isSelected) {
                                    e.currentTarget.style.boxShadow = isLight
                                        ? '0 12px 30px rgba(180, 140, 90, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.8)'
                                        : `0 12px 40px rgba(0, 0, 0, 0.7), 0 0 30px var(--accent-20), inset 0 1px 0 rgba(255, 255, 255, 0.12), inset 0 -3px 12px rgba(0, 0, 0, 0.4)`;
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!isPlaceholder && !isSelected) {
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
                                        background: `radial-gradient(circle at 50% 0%, ${isSelected ? 'var(--accent-glow)20' : 'var(--accent-glow)08'} 0%, transparent 60%)`
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

            <CycleChoiceModal
                isOpen={showCycleChoice}
                onClose={() => setShowCycleChoice(false)}
                cycleType="foundation"
            />

            {/* Foundation Cycle Onboarding - Shows program explanation and time selection */}
            {showFoundationOnboarding && (
                <CurriculumOnboarding
                    onDismiss={() => setShowFoundationOnboarding(false)}
                    onComplete={() => {
                        setShowFoundationOnboarding(false);
                        // After onboarding, show cycle choice to start the program
                        setShowCycleChoice(true);
                    }}
                />
            )}

            <ThoughtDetachmentOnboarding
                isOpen={showThoughtDetachmentOnboarding}
                onClose={() => setShowThoughtDetachmentOnboarding(false)}
            />
        </div>
    );
}
