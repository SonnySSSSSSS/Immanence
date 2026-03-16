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
const NOTICE_ROTATIONS = ['-1.2deg', '0.9deg', '-0.65deg', '1.1deg'];

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
                className="rounded-[30px] border px-4 py-4 sm:px-5 sm:py-5"
                style={{
                    borderColor: isLight ? 'rgba(166, 132, 88, 0.18)' : 'rgba(112, 233, 242, 0.14)',
                    background: isLight
                        ? 'linear-gradient(180deg, rgba(251, 247, 240, 0.92) 0%, rgba(245, 238, 228, 0.86) 100%)'
                        : 'linear-gradient(180deg, rgba(8, 14, 22, 0.94) 0%, rgba(5, 10, 17, 0.96) 100%)',
                    boxShadow: isLight
                        ? '0 18px 38px rgba(82, 58, 30, 0.08), inset 0 1px 0 rgba(255,255,255,0.68)'
                        : '0 22px 48px rgba(0, 0, 0, 0.36), inset 0 1px 0 rgba(178, 241, 246, 0.05)',
                }}
            >
                <div className="mb-4 flex items-end justify-between gap-4">
                    <div>
                        <div
                            className="text-[10px] font-semibold uppercase tracking-[0.22em]"
                            style={{ color: isLight ? 'rgba(122, 88, 50, 0.48)' : 'rgba(182, 232, 236, 0.40)' }}
                        >
                            Posted Curricula
                        </div>
                        <div
                            className="mt-2 text-[18px] font-black uppercase tracking-[0.10em] sm:text-[22px]"
                            style={{
                                color: isLight ? 'rgba(66, 48, 28, 0.96)' : 'rgba(248, 244, 236, 0.96)',
                                textShadow: isLight
                                    ? '0 1px 0 rgba(255,255,255,0.50)'
                                    : '0 2px 12px rgba(0,0,0,0.34)',
                                lineHeight: 1.05,
                            }}
                        >
                            Choose Your Path
                        </div>
                    </div>
                    <div
                        aria-hidden="true"
                        className="hidden sm:flex items-center gap-2"
                        style={{ color: isLight ? 'rgba(132, 94, 52, 0.28)' : 'rgba(143, 216, 227, 0.24)' }}
                    >
                        <span className="h-px w-10" style={{ background: 'currentColor' }} />
                        <span className="text-[10px] uppercase tracking-[0.28em]">Notice Board</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {combinedEntries.map((entry, index) => {
                    const effectivePathId = activePath?.activePathId ?? resumablePathId;
                    const isActive = entry.isProgram ? entry.isActive : effectivePathId === entry.id;
                    const isSelected = selectedPathId === entry.id;
                    const hasActivePathMatch = effectivePathId === entry.id;
                    const isPlaceholder = entry.placeholder;
                    const contract = getPathContract(entry);
                    const durationLabel = Number.isInteger(contract.totalDays)
                        ? `${contract.totalDays} days`
                        : (typeof entry.duration === 'number' ? `${entry.duration} weeks` : `${entry.duration} · Ongoing`);
                    const cardRotation = NOTICE_ROTATIONS[index % NOTICE_ROTATIONS.length];
                    const pinColor = isLight
                        ? (isSelected ? 'rgba(145, 96, 34, 0.96)' : 'rgba(181, 122, 58, 0.92)')
                        : (isSelected ? 'rgba(255, 208, 138, 0.94)' : 'rgba(133, 221, 231, 0.88)');

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
                                className="relative rounded-[28px] border px-3 pb-5 pt-6 text-left overflow-hidden transition-all group sm:px-4 sm:pb-6 sm:pt-7"
                                style={{
                                    clipPath: PATH_CARD_CLIP,
                                    transform: `rotate(${cardRotation})`,
                                    background: isLight
                                        ? 'linear-gradient(180deg, rgba(255, 252, 246, 0.98) 0%, rgba(246, 238, 227, 0.94) 100%)'
                                        : 'linear-gradient(180deg, rgba(16, 24, 33, 0.96) 0%, rgba(10, 16, 24, 0.94) 100%)',
                                    borderColor: hasActivePathMatch
                                        ? (isLight ? 'rgba(168, 118, 56, 0.34)' : 'rgba(132, 224, 233, 0.34)')
                                        : isLight
                                            ? 'rgba(166, 128, 82, 0.18)'
                                            : 'rgba(112, 233, 242, 0.16)',
                                    borderWidth: '1px',
                                    boxShadow: isLight
                                        ? hasActivePathMatch
                                            ? '0 16px 26px rgba(110, 76, 34, 0.18), 0 0 0 1px rgba(201, 155, 92, 0.16), inset 0 1px 0 rgba(255, 255, 255, 0.88)'
                                            : '0 14px 24px rgba(86, 62, 34, 0.10), 0 0 0 1px rgba(160, 122, 78, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.76)'
                                        : hasActivePathMatch
                                            ? '0 18px 34px rgba(0, 0, 0, 0.44), 0 0 24px rgba(78, 214, 226, 0.10), inset 0 1px 0 rgba(168, 241, 248, 0.12)'
                                            : isPlaceholder
                                                ? '0 12px 22px rgba(0, 0, 0, 0.30), inset 0 1px 0 rgba(168, 241, 248, 0.03)'
                                                : '0 16px 28px rgba(0, 0, 0, 0.38), inset 0 1px 0 rgba(168, 241, 248, 0.06)',
                                    opacity: isPlaceholder ? 0.4 : 1,
                                    cursor: isPlaceholder ? 'not-allowed' : 'pointer',
                                }}
                                onMouseEnter={(e) => {
                                    if (!isPlaceholder && !isActive) {
                                        e.currentTarget.style.boxShadow = isLight
                                            ? '0 18px 30px rgba(154, 104, 44, 0.18), 0 0 0 1px rgba(196, 150, 86, 0.10), inset 0 1px 0 rgba(255, 255, 255, 0.84)'
                                            : '0 20px 34px rgba(0, 0, 0, 0.46), 0 0 22px rgba(112, 233, 242, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.10)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!isPlaceholder && !isActive) {
                                        e.currentTarget.style.boxShadow = isLight
                                            ? '0 14px 24px rgba(86, 62, 34, 0.10), 0 0 0 1px rgba(160, 122, 78, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.76)'
                                            : '0 16px 28px rgba(0, 0, 0, 0.38), inset 0 1px 0 rgba(168, 241, 248, 0.06)';
                                    }
                                }}
                            >
                            <div
                                aria-hidden="true"
                                className="absolute left-1/2 top-[10px] z-20 h-[18px] w-[18px] -translate-x-1/2 rounded-full border"
                                style={{
                                    borderColor: isLight ? 'rgba(255, 248, 240, 0.92)' : 'rgba(240, 245, 247, 0.18)',
                                    background: pinColor,
                                    boxShadow: isLight
                                        ? '0 8px 16px rgba(150, 90, 38, 0.18)'
                                        : '0 8px 14px rgba(0, 0, 0, 0.34), 0 0 10px rgba(132, 224, 233, 0.14)',
                                }}
                            />
                            <div
                                aria-hidden="true"
                                className="absolute left-1/2 top-[24px] z-10 h-[26px] w-[1px] -translate-x-1/2"
                                style={{
                                    background: isLight ? 'rgba(162, 128, 92, 0.18)' : 'rgba(132, 224, 233, 0.18)',
                                }}
                            />
                            <div
                                aria-hidden="true"
                                className="absolute inset-[6px] pointer-events-none"
                                style={{
                                    clipPath: 'polygon(12px 0, calc(100% - 12px) 0, 100% 12px, 100% calc(100% - 12px), calc(100% - 12px) 100%, 12px 100%, 0 calc(100% - 12px), 0 12px)',
                                    border: isLight
                                        ? '1px solid rgba(158, 122, 82, 0.08)'
                                        : '1px solid rgba(132, 224, 233, 0.10)',
                                    background: isLight
                                        ? 'linear-gradient(180deg, rgba(255,255,255,0.28) 0%, rgba(237,227,213,0.12) 100%)'
                                        : 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(10,16,24,0.10) 100%)',
                                }}
                            />
                            <div
                                aria-hidden="true"
                                className="absolute left-0 right-0 top-0 h-px pointer-events-none"
                                style={{
                                    background: isLight
                                        ? 'linear-gradient(90deg, rgba(214, 167, 110, 0.44) 0%, rgba(214, 167, 110, 0.10) 22%, rgba(214, 167, 110, 0.05) 82%, rgba(214, 167, 110, 0.30) 100%)'
                                        : 'linear-gradient(90deg, rgba(117, 231, 240, 0.50) 0%, rgba(117, 231, 240, 0.18) 18%, rgba(117, 231, 240, 0.08) 82%, rgba(117, 231, 240, 0.36) 100%)',
                                }}
                            />
                            <div
                                className="absolute inset-0 pointer-events-none rounded-2xl"
                                style={{
                                    background: isLight
                                        ? `
                                            radial-gradient(circle at 50% 0%, rgba(255,255,255,0.55) 0%, transparent 32%),
                                            linear-gradient(180deg, rgba(255,255,255,0.12) 0%, transparent 44%),
                                            repeating-linear-gradient(180deg, transparent 0, transparent 27px, rgba(151, 122, 90, 0.06) 28px, transparent 29px)
                                        `
                                        : `
                                            radial-gradient(circle at 50% 0%, rgba(132, 224, 233, 0.08) 0%, transparent 34%),
                                            linear-gradient(180deg, rgba(255,255,255,0.02) 0%, transparent 44%),
                                            repeating-linear-gradient(180deg, transparent 0, transparent 29px, rgba(132, 224, 233, 0.05) 30px, transparent 31px)
                                        `,
                                    opacity: 1,
                                }}
                            />

                            {!isPlaceholder && (
                                <div
                                    className="absolute inset-0 pointer-events-none rounded-2xl"
                                    style={{
                                        background: isLight
                                            ? `radial-gradient(circle at 50% 8%, ${isActive ? 'rgba(208, 165, 102, 0.22)' : 'rgba(208, 165, 102, 0.10)'} 0%, transparent 52%)`
                                            : `radial-gradient(circle at 50% 8%, ${isActive ? 'rgba(132, 224, 233, 0.18)' : 'rgba(132, 224, 233, 0.08)'} 0%, transparent 56%)`,
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
                                <div
                                    className="mb-4 flex items-start justify-between gap-3"
                                >
                                    <div
                                        className="rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em]"
                                        style={{
                                            borderColor: isLight ? 'rgba(166, 128, 82, 0.14)' : 'rgba(132, 224, 233, 0.16)',
                                            background: isLight ? 'rgba(255,255,255,0.42)' : 'rgba(255,255,255,0.04)',
                                            color: isLight ? 'rgba(122, 88, 50, 0.72)' : 'rgba(182, 232, 236, 0.68)',
                                        }}
                                    >
                                        Posted Notice
                                    </div>
                                    <div
                                        className="type-h1 transition-colors"
                                        style={{
                                            color: isLight
                                                ? (isSelected ? 'rgba(140, 100, 40, 0.9)' : 'rgba(140, 100, 40, 0.66)')
                                                : 'var(--accent-70)',
                                            lineHeight: 1,
                                        }}
                                    >
                                        {entry.glyph}
                                    </div>
                                </div>

                                <h3
                                    className="mb-2 leading-tight line-clamp-2 transition-colors"
                                    style={{
                                        fontFamily: 'var(--font-display)',
                                        fontSize: '13px',
                                        fontWeight: 600,
                                        letterSpacing: 'var(--tracking-normal)',
                                        color: isLight ? 'rgba(60, 52, 37, 0.92)' : 'rgba(253,251,245,0.94)'
                                    }}
                                >
                                    {entry.title}
                                </h3>

                                <p
                                    className="type-caption mb-3 min-h-[34px] text-[11px] leading-snug line-clamp-2 transition-colors"
                                    style={{
                                        color: isLight ? 'rgba(90, 77, 60, 0.68)' : 'rgba(253,251,245,0.68)'
                                    }}
                                >
                                    {entry.subtitle}
                                </p>

                                {!isPlaceholder && (
                                    <div className="flex items-center justify-between gap-2">
                                        <div
                                            className="type-label font-bold"
                                            style={{ color: isLight ? 'rgba(140, 100, 40, 0.76)' : 'var(--accent-50)' }}
                                        >
                                            {durationLabel}
                                        </div>
                                        <div
                                            className="text-[10px] font-semibold uppercase tracking-[0.12em]"
                                            style={{ color: isLight ? 'rgba(122, 88, 50, 0.46)' : 'rgba(182, 232, 236, 0.46)' }}
                                        >
                                            Tap to open
                                        </div>
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
            </div>

            <ThoughtDetachmentOnboarding
                isOpen={showThoughtDetachmentOnboarding}
                onClose={() => setShowThoughtDetachmentOnboarding(false)}
            />
        </div>
    );
}
