// src/components/PathSelectionGrid.jsx
import { useState, useRef } from 'react';
import { getAllPaths } from '../data/navigationData.js';
import { useNavigationStore } from '../state/navigationStore.js';
import { useDisplayModeStore } from '../state/displayModeStore.js';
import { getResumableNavigationPathId, useCurriculumStore } from '../state/curriculumStore.js';
import { ThoughtDetachmentOnboarding } from './ThoughtDetachmentOnboarding.jsx';
import { getPathContract } from '../utils/pathContract.js';

const PATH_CARD_CHAMFER = '10px';
const PATH_CARD_CLIP = `polygon(${PATH_CARD_CHAMFER} 0, calc(100% - ${PATH_CARD_CHAMFER}) 0, 100% ${PATH_CARD_CHAMFER}, 100% calc(100% - ${PATH_CARD_CHAMFER}), calc(100% - ${PATH_CARD_CHAMFER}) 100%, ${PATH_CARD_CHAMFER} 100%, 0 calc(100% - ${PATH_CARD_CHAMFER}), 0 ${PATH_CARD_CHAMFER})`;
const NOTICE_ROTATIONS = ['-1.2deg', '0.9deg', '-0.65deg', '1.1deg', '-0.8deg'];
const SWIPE_THRESHOLD = 48;

// Stage definitions — ordered seedling → stellar
const STAGE_SECTIONS = [
    { id: 'seedling', label: 'Seedling', glyph: '🌱', accentDark: 'rgba(110, 210, 150, 0.88)', accentLight: 'rgba(45, 130, 78, 0.85)' },
    { id: 'ember',    label: 'Ember',    glyph: '🔥', accentDark: 'rgba(225, 162, 72, 0.92)',  accentLight: 'rgba(175, 95, 25, 0.85)' },
    { id: 'flame',    label: 'Flame',    glyph: '🕯',  accentDark: 'rgba(220, 108, 68, 0.90)',  accentLight: 'rgba(180, 62, 35, 0.85)' },
    { id: 'beacon',   label: 'Beacon',   glyph: '◈',  accentDark: 'rgba(130, 222, 234, 0.90)', accentLight: 'rgba(30, 135, 160, 0.85)' },
    { id: 'stellar',  label: 'Stellar',  glyph: '✦',  accentDark: 'rgba(185, 148, 232, 0.90)', accentLight: 'rgba(115, 72, 195, 0.82)' },
];

const SLIDE_IN_LEFT = `
@keyframes slideInFromLeft {
  from { opacity: 0; transform: translateX(-28px); }
  to   { opacity: 1; transform: translateX(0); }
}`;
const SLIDE_IN_RIGHT = `
@keyframes slideInFromRight {
  from { opacity: 0; transform: translateX(28px); }
  to   { opacity: 1; transform: translateX(0); }
}`;

export function PathSelectionGrid({ onPathSelected, selectedPathId }) {
    const allPaths = getAllPaths();
    const activePath = useNavigationStore((state) => state.activePath);
    const abandonPath = useNavigationStore((state) => state.abandonPath);
    const beginPathForCurriculum = useNavigationStore((state) => state.beginPathForCurriculum);
    const setSelectedPath = useNavigationStore((state) => state.setSelectedPath);
    const activeCurriculumId = useCurriculumStore((state) => state.activeCurriculumId);
    const onboardingComplete = useCurriculumStore((state) => state.onboardingComplete);
    const resumablePathId = useCurriculumStore(getResumableNavigationPathId);
    const colorScheme = useDisplayModeStore(s => s.colorScheme);
    const isLight = colorScheme === 'light';

    const [activeStageIndex, setActiveStageIndex] = useState(0);
    const [slideDir, setSlideDir] = useState('right'); // 'left' | 'right'
    const [showThoughtDetachmentOnboarding, setShowThoughtDetachmentOnboarding] = useState(false);
    const touchStartX = useRef(null);
    const pointerStartX = useRef(null);

    const programs = [
        {
            id: "program-thought-detachment",
            stage: 'ember',
            title: "Thought Ritual",
            subtitle: "Detach from recurring thoughts",
            glyph: "🌊",
            duration: "Daily",
            isProgram: true,
            isActive: onboardingComplete,
            onClick: () => setShowThoughtDetachmentOnboarding(true),
        },
    ];

    const paths = allPaths
        .filter((p) => p.id === 'initiation')
        .map((p) => ({ ...p, stage: 'seedling' }));

    const allEntries = [...programs, ...paths];

    const goToStage = (index) => {
        if (index === activeStageIndex) return;
        setSlideDir(index > activeStageIndex ? 'left' : 'right');
        setActiveStageIndex(index);
    };

    // Touch swipe
    const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
    const handleTouchEnd = (e) => {
        if (touchStartX.current === null) return;
        const delta = e.changedTouches[0].clientX - touchStartX.current;
        touchStartX.current = null;
        if (delta < -SWIPE_THRESHOLD && activeStageIndex < STAGE_SECTIONS.length - 1) goToStage(activeStageIndex + 1);
        else if (delta > SWIPE_THRESHOLD && activeStageIndex > 0) goToStage(activeStageIndex - 1);
    };

    // Pointer drag (desktop)
    const handlePointerDown = (e) => { pointerStartX.current = e.clientX; };
    const handlePointerUp = (e) => {
        if (pointerStartX.current === null) return;
        const delta = e.clientX - pointerStartX.current;
        pointerStartX.current = null;
        if (Math.abs(delta) < 8) return; // treat as click
        if (delta < -SWIPE_THRESHOLD && activeStageIndex < STAGE_SECTIONS.length - 1) goToStage(activeStageIndex + 1);
        else if (delta > SWIPE_THRESHOLD && activeStageIndex > 0) goToStage(activeStageIndex - 1);
    };

    const activeStage = STAGE_SECTIONS[activeStageIndex];
    const stageAccent = isLight ? activeStage.accentLight : activeStage.accentDark;
    const stageEntries = allEntries.filter((e) => (e.stage || 'seedling') === activeStage.id);

    const cornerColor = isLight ? 'rgba(59, 144, 156, 0.56)' : 'rgba(117, 231, 240, 0.62)';

    return (
        <div className="w-full" data-testid="path-grid-root">
            <style>{SLIDE_IN_LEFT}{SLIDE_IN_RIGHT}</style>
            <div
                className="relative overflow-hidden border"
                data-card="true"
                data-card-id="pathGrid"
                style={{
                    clipPath: 'polygon(20px 0, calc(100% - 20px) 0, 100% 20px, 100% calc(100% - 20px), calc(100% - 20px) 100%, 20px 100%, 0 calc(100% - 20px), 0 20px)',
                    background: isLight
                        ? 'linear-gradient(180deg, rgba(228, 244, 248, 0.88) 0%, rgba(210, 235, 240, 0.72) 100%)'
                        : 'linear-gradient(180deg, rgba(7, 16, 24, 0.96) 0%, rgba(4, 10, 18, 0.94) 100%)',
                    borderColor: isLight ? 'rgba(97, 177, 190, 0.34)' : 'rgba(112, 233, 242, 0.22)',
                    boxShadow: isLight
                        ? 'inset 0 1px 0 rgba(255,255,255,0.62), inset 0 -10px 24px rgba(18,40,52,0.08), 0 18px 38px rgba(30, 60, 70, 0.10)'
                        : '0 22px 48px rgba(0, 0, 0, 0.38), 0 0 16px rgba(78, 214, 226, 0.06), inset 0 1px 0 rgba(168, 241, 248, 0.08), inset 0 -14px 24px rgba(0,0,0,0.42)',
                }}
            >
                {/* Arwes inner plate */}
                <div aria-hidden="true" className="absolute inset-[9px] pointer-events-none" style={{
                    clipPath: 'polygon(14px 0, calc(100% - 14px) 0, 100% 14px, 100% calc(100% - 14px), calc(100% - 14px) 100%, 14px 100%, 0 calc(100% - 14px), 0 14px)',
                    background: isLight
                        ? 'linear-gradient(180deg, rgba(242, 250, 252, 0.56) 0%, rgba(219, 238, 242, 0.28) 100%)'
                        : 'linear-gradient(180deg, rgba(8, 16, 24, 0.58) 0%, rgba(10, 20, 29, 0.46) 46%, rgba(4, 10, 17, 0.62) 100%)',
                    border: `1px solid ${isLight ? 'rgba(91, 165, 177, 0.20)' : 'rgba(101, 211, 224, 0.14)'}`,
                }} />
                {/* Arwes top scan line */}
                <div aria-hidden="true" className="absolute left-0 right-0 top-0 h-px pointer-events-none" style={{
                    background: isLight
                        ? 'linear-gradient(90deg, rgba(59, 144, 156, 0.44) 0%, rgba(59, 144, 156, 0.16) 18%, rgba(59, 144, 156, 0.08) 82%, rgba(59, 144, 156, 0.32) 100%)'
                        : 'linear-gradient(90deg, rgba(117, 231, 240, 0.64) 0%, rgba(117, 231, 240, 0.22) 18%, rgba(117, 231, 240, 0.10) 82%, rgba(117, 231, 240, 0.44) 100%)',
                    boxShadow: isLight ? 'none' : '0 0 10px rgba(87, 222, 236, 0.20)',
                }} />
                {/* Arwes corner brackets */}
                <div aria-hidden="true" className="absolute top-[12px] left-[12px] h-[14px] w-[14px] pointer-events-none" style={{ borderTop: '1px solid', borderLeft: '1px solid', borderColor: cornerColor }} />
                <div aria-hidden="true" className="absolute top-[12px] right-[12px] h-[14px] w-[14px] pointer-events-none" style={{ borderTop: '1px solid', borderRight: '1px solid', borderColor: cornerColor }} />
                <div aria-hidden="true" className="absolute bottom-[12px] left-[12px] h-[14px] w-[14px] pointer-events-none" style={{ borderBottom: '1px solid', borderLeft: '1px solid', borderColor: cornerColor }} />
                <div aria-hidden="true" className="absolute bottom-[12px] right-[12px] h-[14px] w-[14px] pointer-events-none" style={{ borderBottom: '1px solid', borderRight: '1px solid', borderColor: cornerColor }} />

                {/* Content */}
                <div className="relative z-10 px-4 py-4 sm:px-5 sm:py-5">
                {/* Header row: heading + dots */}
                <div className="mb-4 flex items-start justify-between gap-3">
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
                                textShadow: isLight ? '0 1px 0 rgba(255,255,255,0.50)' : '0 2px 12px rgba(0,0,0,0.34)',
                                lineHeight: 1.05,
                            }}
                        >
                            Choose Your Program
                        </div>
                    </div>

                    {/* Stage indicator dots */}
                    <div className="flex items-center gap-[7px] pt-1" style={{ flexShrink: 0 }}>
                        {STAGE_SECTIONS.map((s, i) => {
                            const dotAccent = isLight ? s.accentLight : s.accentDark;
                            const isActive = i === activeStageIndex;
                            return (
                                <button
                                    key={s.id}
                                    aria-label={`Go to ${s.label}`}
                                    onClick={() => goToStage(i)}
                                    style={{
                                        width: isActive ? '10px' : '7px',
                                        height: isActive ? '10px' : '7px',
                                        borderRadius: '50%',
                                        background: dotAccent.replace(/[\d.]+\)$/, isActive ? '1)' : '0.28)'),
                                        boxShadow: isActive ? `0 0 8px ${dotAccent.replace(/[\d.]+\)$/, '0.60)')}` : 'none',
                                        transition: 'all 0.22s ease',
                                        flexShrink: 0,
                                        padding: 0,
                                        border: 'none',
                                        cursor: 'pointer',
                                    }}
                                />
                            );
                        })}
                    </div>
                </div>

                {/* Active stage label — swipeable content area */}
                <div
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                    onPointerDown={handlePointerDown}
                    onPointerUp={handlePointerUp}
                    style={{ touchAction: 'pan-y', userSelect: 'none' }}
                >
                    {/* Stage label — arwes chamfered strip */}
                    <div
                        key={`label-${activeStageIndex}`}
                        className="relative mb-3 inline-flex items-center gap-2 overflow-hidden border px-4 py-2"
                        style={{
                            clipPath: 'polygon(8px 0, calc(100% - 8px) 0, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0 calc(100% - 8px), 0 8px)',
                            background: isLight
                                ? 'linear-gradient(180deg, rgba(228, 244, 248, 0.82) 0%, rgba(210, 235, 240, 0.66) 100%)'
                                : 'linear-gradient(180deg, rgba(7, 16, 24, 0.94) 0%, rgba(4, 10, 18, 0.90) 100%)',
                            borderColor: stageAccent.replace(/[\d.]+\)$/, '0.40)'),
                            boxShadow: isLight ? 'none' : `0 0 12px ${stageAccent.replace(/[\d.]+\)$/, '0.12)')}`,
                            animation: `${slideDir === 'left' ? 'slideInFromRight' : 'slideInFromLeft'} 0.22s ease`,
                        }}
                    >
                        {/* scan line */}
                        <div aria-hidden="true" className="absolute left-0 right-0 top-0 h-px pointer-events-none"
                            style={{ background: `linear-gradient(90deg, transparent, ${stageAccent.replace(/[\d.]+\)$/, '0.60)')}, transparent)` }}
                        />
                        <span style={{ fontSize: '12px', lineHeight: 1 }}>{activeStage.glyph}</span>
                        <span className="text-[11px] font-bold uppercase tracking-[0.20em]" style={{ color: stageAccent }}>
                            {activeStage.label}
                        </span>
                    </div>

                    {/* Program cards for this stage */}
                    <div
                        key={`cards-${activeStageIndex}`}
                        className="grid grid-cols-2 gap-3"
                        style={{
                            animation: `${slideDir === 'left' ? 'slideInFromRight' : 'slideInFromLeft'} 0.25s ease`,
                        }}
                    >
                        {stageEntries.map((entry, cardIndex) => {
                            const effectivePathId = activePath?.activePathId ?? resumablePathId;
                            const isActive = entry.isProgram ? entry.isActive : effectivePathId === entry.id;
                            const isSelected = selectedPathId === entry.id;
                            const hasActivePathMatch = effectivePathId === entry.id;
                            const isPlaceholder = entry.placeholder;
                            const contract = getPathContract(entry);
                            const durationLabel = Number.isInteger(contract.totalDays)
                                ? `${contract.totalDays} days`
                                : (typeof entry.duration === 'number'
                                    ? `${entry.duration} weeks`
                                    : `${entry.duration} · Ongoing`);

                            return (
                                <button
                                    key={entry.id}
                                    data-testid={!entry.isProgram ? `path-card-${entry.id}` : undefined}
                                    data-card="true"
                                    data-card-id={`${entry.isProgram ? 'program' : 'path'}:${entry.id}`}
                                    onClick={() => {
                                        if (entry.isProgram) {
                                            entry.onClick();
                                        } else if (!isPlaceholder) {
                                            setSelectedPath(entry.id);
                                            if (activePath && activePath.activePathId !== entry.id) abandonPath();
                                            if (!activePath && resumablePathId === entry.id) {
                                                const result = beginPathForCurriculum(activeCurriculumId || 'ritual-initiation-14-v2');
                                                if (result?.ok === false) { onPathSelected?.(entry.id); return; }
                                            }
                                            onPathSelected?.(entry.id);
                                        }
                                    }}
                                    disabled={isPlaceholder}
                                    className="relative border px-3 py-4 text-left overflow-hidden transition-all"
                                    style={{
                                        clipPath: PATH_CARD_CLIP,
                                        background: isLight
                                            ? 'linear-gradient(180deg, rgba(228, 244, 248, 0.86) 0%, rgba(210, 235, 240, 0.70) 100%)'
                                            : 'linear-gradient(180deg, rgba(7, 16, 24, 0.97) 0%, rgba(4, 10, 18, 0.95) 100%)',
                                        borderColor: hasActivePathMatch
                                            ? stageAccent.replace(/[\d.]+\)$/, '0.50)')
                                            : stageAccent.replace(/[\d.]+\)$/, '0.22)'),
                                        borderWidth: '1px',
                                        boxShadow: isLight
                                            ? `0 8px 20px rgba(18, 40, 52, 0.10), inset 0 1px 0 rgba(255,255,255,0.60)`
                                            : `0 12px 28px rgba(0,0,0,0.44), 0 0 ${hasActivePathMatch ? '18px' : '8px'} ${stageAccent.replace(/[\d.]+\)$/, hasActivePathMatch ? '0.16)' : '0.06)')}, inset 0 1px 0 rgba(168, 241, 248, 0.07)`,
                                        opacity: isPlaceholder ? 0.38 : 1,
                                        cursor: isPlaceholder ? 'not-allowed' : 'pointer',
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!isPlaceholder) {
                                            e.currentTarget.style.boxShadow = isLight
                                                ? `0 12px 26px rgba(18, 40, 52, 0.14), inset 0 1px 0 rgba(255,255,255,0.70)`
                                                : `0 14px 32px rgba(0,0,0,0.50), 0 0 20px ${stageAccent.replace(/[\d.]+\)$/, '0.18)')}, inset 0 1px 0 rgba(168, 241, 248, 0.10)`;
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!isPlaceholder) {
                                            e.currentTarget.style.boxShadow = isLight
                                                ? `0 8px 20px rgba(18, 40, 52, 0.10), inset 0 1px 0 rgba(255,255,255,0.60)`
                                                : `0 12px 28px rgba(0,0,0,0.44), 0 0 8px ${stageAccent.replace(/[\d.]+\)$/, '0.06)')}, inset 0 1px 0 rgba(168, 241, 248, 0.07)`;
                                        }
                                    }}
                                >
                                    {/* Arwes inner plate */}
                                    <div aria-hidden="true" className="absolute inset-[5px] pointer-events-none" style={{
                                        clipPath: 'polygon(7px 0, calc(100% - 7px) 0, 100% 7px, 100% calc(100% - 7px), calc(100% - 7px) 100%, 7px 100%, 0 calc(100% - 7px), 0 7px)',
                                        background: isLight
                                            ? 'linear-gradient(180deg, rgba(242, 250, 252, 0.50) 0%, rgba(219, 238, 242, 0.22) 100%)'
                                            : 'linear-gradient(180deg, rgba(8, 18, 27, 0.56) 0%, rgba(5, 12, 20, 0.44) 100%)',
                                        border: `1px solid ${stageAccent.replace(/[\d.]+\)$/, '0.12)')}`,
                                    }} />
                                    {/* Arwes top scan line */}
                                    <div aria-hidden="true" className="absolute left-0 right-0 top-0 h-px pointer-events-none" style={{
                                        background: `linear-gradient(90deg, transparent 0%, ${stageAccent.replace(/[\d.]+\)$/, '0.70)')} 30%, ${stageAccent.replace(/[\d.]+\)$/, '0.20)')} 70%, transparent 100%)`,
                                        boxShadow: isLight ? 'none' : `0 0 8px ${stageAccent.replace(/[\d.]+\)$/, '0.22)')}`,
                                    }} />
                                    {/* Arwes corner brackets */}
                                    <div aria-hidden="true" className="absolute top-[8px] left-[8px] h-[10px] w-[10px] pointer-events-none" style={{ borderTop: '1px solid', borderLeft: '1px solid', borderColor: stageAccent.replace(/[\d.]+\)$/, '0.55)') }} />
                                    <div aria-hidden="true" className="absolute top-[8px] right-[8px] h-[10px] w-[10px] pointer-events-none" style={{ borderTop: '1px solid', borderRight: '1px solid', borderColor: stageAccent.replace(/[\d.]+\)$/, '0.55)') }} />
                                    <div aria-hidden="true" className="absolute bottom-[8px] left-[8px] h-[10px] w-[10px] pointer-events-none" style={{ borderBottom: '1px solid', borderLeft: '1px solid', borderColor: stageAccent.replace(/[\d.]+\)$/, '0.55)') }} />
                                    <div aria-hidden="true" className="absolute bottom-[8px] right-[8px] h-[10px] w-[10px] pointer-events-none" style={{ borderBottom: '1px solid', borderRight: '1px solid', borderColor: stageAccent.replace(/[\d.]+\)$/, '0.55)') }} />
                                    {/* Active indicator */}
                                    {isActive && (
                                        <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
                                            <span style={{ fontFamily: 'var(--font-display)', fontSize: '7px', fontWeight: 600, letterSpacing: '0.1em', color: entry.isProgram ? 'rgba(253,251,245,0.4)' : stageAccent, textTransform: 'uppercase' }}>
                                                {entry.isProgram ? 'Ongoing' : 'Active'}
                                            </span>
                                            <div className="w-2.5 h-2.5 rounded-full" style={{ background: entry.isProgram ? 'rgba(253,251,245,0.25)' : stageAccent }} />
                                        </div>
                                    )}
                                    {/* Content */}
                                    <div className="relative z-10">
                                        <div className="mb-3 flex justify-end">
                                            <div className="type-h1 transition-colors" style={{ color: stageAccent, lineHeight: 1 }}>{entry.glyph}</div>
                                        </div>
                                        <h3 className="mb-2 leading-tight transition-colors"
                                            style={{ fontFamily: 'var(--font-display)', fontSize: '13px', fontWeight: 600, letterSpacing: 'var(--tracking-normal)', color: isLight ? 'rgba(60, 52, 37, 0.92)' : 'rgba(253,251,245,0.94)', overflowWrap: 'break-word' }}
                                        >
                                            {entry.title}
                                        </h3>
                                        <p className="type-caption mb-3 text-[11px] leading-snug line-clamp-2 transition-colors"
                                            style={{ color: isLight ? 'rgba(90, 77, 60, 0.68)' : 'rgba(253,251,245,0.68)' }}
                                        >
                                            {entry.subtitle}
                                        </p>
                                        {!isPlaceholder && (
                                            <div className="flex flex-col gap-1">
                                                <div className="type-label font-bold" style={{ color: stageAccent.replace(/[\d.]+\)$/, '0.76)') }}>{durationLabel}</div>
                                                <div className="text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ color: isLight ? 'rgba(122, 88, 50, 0.54)' : 'rgba(182, 232, 236, 0.54)' }}>Tap to open</div>
                                            </div>
                                        )}
                                    </div>
                                </button>
                            );
                        })}

                        {/* Empty stage placeholder — arwes housing */}
                        {stageEntries.length === 0 && (
                            <div className="relative col-span-2 overflow-hidden border py-12"
                                style={{
                                    clipPath: PATH_CARD_CLIP,
                                    background: isLight
                                        ? 'linear-gradient(180deg, rgba(228, 244, 248, 0.60) 0%, rgba(210, 235, 240, 0.44) 100%)'
                                        : 'linear-gradient(180deg, rgba(7, 16, 24, 0.86) 0%, rgba(4, 10, 18, 0.80) 100%)',
                                    borderColor: stageAccent.replace(/[\d.]+\)$/, '0.18)'),
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                                }}
                            >
                                <div aria-hidden="true" className="absolute inset-[5px] pointer-events-none" style={{ clipPath: 'polygon(7px 0, calc(100% - 7px) 0, 100% 7px, 100% calc(100% - 7px), calc(100% - 7px) 100%, 7px 100%, 0 calc(100% - 7px), 0 7px)', border: `1px solid ${stageAccent.replace(/[\d.]+\)$/, '0.10)')}` }} />
                                <div aria-hidden="true" className="absolute left-0 right-0 top-0 h-px pointer-events-none" style={{ background: `linear-gradient(90deg, transparent, ${stageAccent.replace(/[\d.]+\)$/, '0.40)')}, transparent)` }} />
                                <div aria-hidden="true" className="absolute top-[8px] left-[8px] h-[10px] w-[10px] pointer-events-none" style={{ borderTop: '1px solid', borderLeft: '1px solid', borderColor: stageAccent.replace(/[\d.]+\)$/, '0.36)') }} />
                                <div aria-hidden="true" className="absolute top-[8px] right-[8px] h-[10px] w-[10px] pointer-events-none" style={{ borderTop: '1px solid', borderRight: '1px solid', borderColor: stageAccent.replace(/[\d.]+\)$/, '0.36)') }} />
                                <div aria-hidden="true" className="absolute bottom-[8px] left-[8px] h-[10px] w-[10px] pointer-events-none" style={{ borderBottom: '1px solid', borderLeft: '1px solid', borderColor: stageAccent.replace(/[\d.]+\)$/, '0.36)') }} />
                                <div aria-hidden="true" className="absolute bottom-[8px] right-[8px] h-[10px] w-[10px] pointer-events-none" style={{ borderBottom: '1px solid', borderRight: '1px solid', borderColor: stageAccent.replace(/[\d.]+\)$/, '0.36)') }} />
                                <span className="relative z-10" style={{ fontSize: '22px', opacity: 0.24 }}>{activeStage.glyph}</span>
                                <span className="relative z-10 text-[9px] uppercase tracking-[0.22em] font-semibold" style={{ color: stageAccent.replace(/[\d.]+\)$/, '0.32)') }}>
                                    Programs coming
                                </span>
                            </div>
                        )}
                    </div>
                </div>
                </div>{/* end z-10 content */}
            </div>

            <ThoughtDetachmentOnboarding
                isOpen={showThoughtDetachmentOnboarding}
                onClose={() => setShowThoughtDetachmentOnboarding(false)}
            />
        </div>
    );
}
