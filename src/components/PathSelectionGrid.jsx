// src/components/PathSelectionGrid.jsx
import { useState } from 'react';
import { getAllPaths } from '../data/navigationData.js';
import { useNavigationStore } from '../state/navigationStore.js';
import { useDisplayModeStore } from '../state/displayModeStore.js';
import { getResumableNavigationPathId, useCurriculumStore } from '../state/curriculumStore.js';
import { ThoughtDetachmentOnboarding } from './ThoughtDetachmentOnboarding.jsx';
import { getPathContract } from '../utils/pathContract.js';

const PATH_CARD_CHAMFER = '16px';
const PATH_CARD_CLIP = `polygon(${PATH_CARD_CHAMFER} 0, calc(100% - ${PATH_CARD_CHAMFER}) 0, 100% ${PATH_CARD_CHAMFER}, 100% calc(100% - ${PATH_CARD_CHAMFER}), calc(100% - ${PATH_CARD_CHAMFER}) 100%, ${PATH_CARD_CHAMFER} 100%, 0 calc(100% - ${PATH_CARD_CHAMFER}), 0 ${PATH_CARD_CHAMFER})`;

export function PathSelectionGrid({ onPathSelected, selectedPathId }) {
    const allPaths = getAllPaths();
    const paths = allPaths.filter((p) => p.id === 'initiation');
    const activePath = useNavigationStore((state) => state.activePath);
    const abandonPath = useNavigationStore((state) => state.abandonPath);
    const beginPathForCurriculum = useNavigationStore((state) => state.beginPathForCurriculum);
    const restoreCurriculumPath = useNavigationStore((state) => state.restoreCurriculumPath);
    const setSelectedPath = useNavigationStore((state) => state.setSelectedPath);
    const activeCurriculumId = useCurriculumStore((state) => state.activeCurriculumId);
    const onboardingComplete = useCurriculumStore((state) => state.onboardingComplete);
    const resumablePathId = useCurriculumStore(getResumableNavigationPathId);
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
        <div className="w-full" data-testid="path-grid-root">
            <div
                className="type-label mb-3"
                style={{ color: isLight ? 'rgba(60, 52, 37, 0.7)' : 'rgba(253,251,245,0.9)', textShadow: isLight ? 'none' : '0 1px 3px rgba(0,0,0,0.4)' }}
            >
                Select Your Path
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {combinedEntries.map((entry) => {
                    const effectivePathId = activePath?.activePathId ?? resumablePathId;
                    const isActive = entry.isProgram ? entry.isActive : effectivePathId === entry.id;
                    const isSelected = selectedPathId === entry.id;
                    const hasActivePathMatch = effectivePathId === entry.id;
                    const isPlaceholder = entry.placeholder;
                    const contract = getPathContract(entry);
                    const durationLabel = Number.isInteger(contract.totalDays)
                        ? `${contract.totalDays} days`
                        : (typeof entry.duration === 'number' ? `${entry.duration} weeks` : `${entry.duration} · Ongoing`);

                    return (
                        <div key={entry.id} className="flex flex-col gap-2">
                            <button
                                data-testid={!entry.isProgram ? `path-card-${entry.id}` : undefined}
                                data-card="true"
                                data-card-id={`${entry.isProgram ? 'program' : 'path'}:${entry.id}`}
                                onClick={() => {
                                    if (entry.isProgram) {
                                        entry.onClick();
                                    } else if (!isPlaceholder) {
                                        setSelectedPath(entry.id);
                                        // Clear activePath if it's for a different path
                                        if (activePath && activePath.activePathId !== entry.id) {
                                            abandonPath();
                                        }
                                        if (!activePath && resumablePathId === entry.id) {
                                            const result = beginPathForCurriculum(activeCurriculumId || 'ritual-initiation-14-v2');
                                            if (result?.ok === false) {
                                                onPathSelected?.(entry.id);
                                                return;
                                            }
                                        }
                                        // Notify parent to open overlay
                                        onPathSelected?.(entry.id);
                                    }
                                }}
                                disabled={isPlaceholder}
                                className="relative px-3 py-5 sm:px-4 sm:py-6 rounded-3xl border transition-all text-left overflow-hidden group"
                                style={{
                                    clipPath: PATH_CARD_CLIP,
                                    background: isLight
                                        ? 'linear-gradient(145deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.5) 100%)'
                                        : 'linear-gradient(180deg, rgba(7, 16, 24, 0.95) 0%, rgba(4, 10, 18, 0.92) 100%)',
                                    borderColor: hasActivePathMatch
                                        ? 'rgba(128, 230, 238, 0.42)'
                                        : isLight
                                            ? 'rgba(180, 140, 90, 0.15)'
                                            : 'rgba(112, 233, 242, 0.16)',
                                    borderWidth: '1px',
                                    backgroundImage: isLight
                                        ? isPlaceholder
                                            ? 'linear-gradient(145deg, rgba(255, 255, 255, 0.3), rgba(0, 0, 0, 0.02))'
                                            : isSelected
                                                ? 'linear-gradient(145deg, rgba(255, 255, 255, 0.95), rgba(212, 168, 74, 0.08))'
                                                : isActive
                                                    ? 'linear-gradient(145deg, rgba(255, 255, 255, 0.95), rgba(180, 140, 90, 0.05))'
                                                    : 'linear-gradient(145deg, rgba(255, 255, 255, 0.7), rgba(0, 0, 0, 0.01))'
                                        : isPlaceholder
                                            ? 'linear-gradient(180deg, rgba(7, 16, 24, 0.64), rgba(4, 10, 18, 0.72))'
                                            : isSelected
                                                ? 'linear-gradient(180deg, rgba(9, 20, 30, 0.96), rgba(5, 12, 19, 0.94))'
                                                : isActive
                                                    ? 'linear-gradient(180deg, rgba(8, 18, 28, 0.95), rgba(5, 11, 18, 0.93))'
                                                    : 'linear-gradient(180deg, rgba(7, 16, 24, 0.95), rgba(4, 10, 18, 0.92))',
                                    boxShadow: isLight
                                        ? hasActivePathMatch
                                            ? '0 0 30px rgba(212, 168, 74, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.8)'
                                            : '0 4px 12px rgba(0, 0, 0, 0.03), inset 0 1px 0 rgba(255, 255, 255, 0.5)'
                                        : hasActivePathMatch
                                            ? '0 0 22px rgba(78, 214, 226, 0.12), inset 0 1px 0 rgba(168, 241, 248, 0.10), inset 0 -6px 18px rgba(0, 0, 0, 0.30)'
                                            : isPlaceholder
                                                ? '0 4px 16px rgba(0, 0, 0, 0.32), inset 0 1px 0 rgba(168, 241, 248, 0.03), inset 0 -3px 12px rgba(0, 0, 0, 0.3)'
                                                : '0 12px 24px rgba(0, 0, 0, 0.34), inset 0 1px 0 rgba(168, 241, 248, 0.06), inset 0 -6px 18px rgba(0, 0, 0, 0.30)',
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
                            <div
                                aria-hidden="true"
                                className="absolute inset-[6px] pointer-events-none"
                                style={{
                                    clipPath: 'polygon(10px 0, calc(100% - 10px) 0, 100% 10px, 100% calc(100% - 10px), calc(100% - 10px) 100%, 10px 100%, 0 calc(100% - 10px), 0 10px)',
                                    border: '1px solid rgba(101, 211, 224, 0.10)',
                                    background: 'linear-gradient(180deg, rgba(8, 16, 24, 0.18) 0%, rgba(6, 12, 19, 0.06) 100%)',
                                }}
                            />
                            <div
                                aria-hidden="true"
                                className="absolute left-0 right-0 top-0 h-px pointer-events-none"
                                style={{
                                    background: 'linear-gradient(90deg, rgba(117, 231, 240, 0.64) 0%, rgba(117, 231, 240, 0.22) 18%, rgba(117, 231, 240, 0.1) 82%, rgba(117, 231, 240, 0.44) 100%)',
                                }}
                            />
                            <div aria-hidden="true" className="absolute top-[8px] left-[8px] h-[12px] w-[12px] pointer-events-none" style={{ borderTop: '1px solid rgba(117, 231, 240, 0.42)', borderLeft: '1px solid rgba(117, 231, 240, 0.42)' }} />
                            <div aria-hidden="true" className="absolute top-[8px] right-[8px] h-[12px] w-[12px] pointer-events-none" style={{ borderTop: '1px solid rgba(117, 231, 240, 0.42)', borderRight: '1px solid rgba(117, 231, 240, 0.42)' }} />
                            {/* Volcanic glass texture overlay */}
                            <div
                                className="absolute inset-0 pointer-events-none rounded-2xl"
                                style={{
                                    background: `
                                        radial-gradient(circle at 24% 18%, rgba(78, 214, 226, 0.05) 0%, transparent 42%),
                                        linear-gradient(180deg, rgba(8, 16, 24, 0.08) 0%, transparent 100%)
                                    `,
                                    opacity: 0.9
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
                                <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
                                    <span style={{ fontFamily: 'var(--font-display)', fontSize: '7px', fontWeight: 600, letterSpacing: '0.1em', color: entry.isProgram ? 'rgba(253,251,245,0.4)' : 'var(--accent-color)', textTransform: 'uppercase' }}>{entry.isProgram ? 'Ongoing' : 'Active'}</span>
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: entry.isProgram ? 'rgba(253,251,245,0.25)' : 'var(--accent-color)', boxShadow: entry.isProgram ? 'none' : '0 0 8px var(--accent-60)' }} />
                                </div>
                            )}

                            <div className="relative z-10">
                                {/* Glyph */}
                                <div
                                    className="type-h1 mb-3 transition-colors"
                                    style={{
                                        color: isLight
                                            ? (isSelected ? 'rgba(140, 100, 40, 0.9)' : 'rgba(140, 100, 40, 0.6)')
                                            : 'var(--accent-70)'
                                    }}
                                >
                                    {entry.glyph}
                                </div>

                                {/* Title */}
                                <h3
                                    className="mb-1.5 leading-tight line-clamp-2 transition-colors"
                                    style={{
                                        fontFamily: 'var(--font-display)',
                                        fontSize: '13px',
                                        fontWeight: 600,
                                        letterSpacing: 'var(--tracking-normal)',
                                        color: isLight ? 'rgba(60, 52, 37, 0.9)' : 'rgba(253,251,245,0.92)'
                                    }}
                                >
                                    {entry.title}
                                </h3>

                                {/* Subtitle */}
                                <p
                                    className="type-caption text-[11px] mb-2.5 leading-snug line-clamp-2 italic transition-colors"
                                    style={{
                                        color: isLight ? 'rgba(90, 77, 60, 0.6)' : 'rgba(253,251,245,0.65)'
                                    }}
                                >
                                    {entry.subtitle}
                                </p>

                                {/* Duration */}
                                {!isPlaceholder && (
                                    <div
                                        className="type-label font-bold"
                                        style={{ color: isLight ? 'rgba(140, 100, 40, 0.7)' : 'var(--accent-50)' }}
                                    >
                                        {durationLabel}
                                    </div>
                                )}

                                {isPlaceholder && (
                                    <div
                                        className="type-label opacity-40 font-bold"
                                        style={{ color: isLight ? 'rgba(60, 52, 37, 0.4)' : 'rgba(253,251,245,0.3)' }}
                                    >
                                        Coming soon
                                    </div>
                                )}
                            </div>
                            </button>
                        </div>
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
