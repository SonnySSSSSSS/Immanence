// src/components/SigilSealingArea.jsx
// Deterministic 3-stroke sigil logging surface for Application section.

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useApplicationStore } from '../state/applicationStore.js';
import { useNavigationStore } from '../state/navigationStore.js';
import { useDisplayModeStore } from '../state/displayModeStore.js';

const MIN_STROKE_DISPLACEMENT = 24;
const OUTCOME_VERTICAL_DY_THRESHOLD = 18;

const ORIENTATION_BUCKETS = {
    vertical: [65, 115],
    horizontalLow: [0, 25],
    horizontalHigh: [155, 180],
    diagonalLow: [20, 70],
    diagonalHigh: [110, 160],
};

const FALLBACK_SLOT_LABELS = ['Habit 1', 'Habit 2', 'Habit 3', 'Habit 4'];
const SIGIL_SLOT_PATTERNS = ['Vertical + /', 'Vertical + \\', 'Horizontal + /', 'Horizontal + \\'];
const SIGIL_TUTORIAL_SOURCES = [
    `${import.meta.env.BASE_URL}video/sigil-tutorial.mp4`,
    `${import.meta.env.BASE_URL}media/sigil-tutorial.mp4`,
];

function normalizeAngleToOrientationDegrees(dx, dy) {
    const raw = (Math.atan2(-dy, dx) * 180) / Math.PI;
    const abs = Math.abs(raw);
    return abs > 180 ? 360 - abs : abs;
}

function isWithinRange(value, range) {
    return value >= range[0] && value <= range[1];
}

function classifyOrientation(angleDeg) {
    if (isWithinRange(angleDeg, ORIENTATION_BUCKETS.vertical)) return 'vertical';
    if (isWithinRange(angleDeg, ORIENTATION_BUCKETS.horizontalLow) || isWithinRange(angleDeg, ORIENTATION_BUCKETS.horizontalHigh)) return 'horizontal';
    if (isWithinRange(angleDeg, ORIENTATION_BUCKETS.diagonalLow) || isWithinRange(angleDeg, ORIENTATION_BUCKETS.diagonalHigh)) return 'diagonal';
    return null;
}

function getStrokeVector(stroke) {
    if (!Array.isArray(stroke) || stroke.length < 2) return null;
    const start = stroke[0];
    const end = stroke[stroke.length - 1];
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const displacement = Math.hypot(dx, dy);
    if (displacement < MIN_STROKE_DISPLACEMENT) {
        return null;
    }
    return {
        start,
        end,
        dx,
        dy,
        displacement,
        angleDeg: normalizeAngleToOrientationDegrees(dx, dy),
    };
}

function decodeSigil(strokes) {
    if (!Array.isArray(strokes) || strokes.length !== 3) {
        return { ok: false, reason: 'Please draw exactly 3 strokes.' };
    }

    const line1 = getStrokeVector(strokes[0]);
    const line2 = getStrokeVector(strokes[1]);
    const line3 = getStrokeVector(strokes[2]);

    if (!line1 || !line2 || !line3) {
        return { ok: false, reason: `Each stroke needs at least ${MIN_STROKE_DISPLACEMENT}px of movement.` };
    }

    const line1Orientation = classifyOrientation(line1.angleDeg);
    if (!line1Orientation || (line1Orientation !== 'vertical' && line1Orientation !== 'horizontal')) {
        return { ok: false, reason: 'Line 1 must be vertical or horizontal.' };
    }

    const line2Orientation = classifyOrientation(line2.angleDeg);
    if (line2Orientation !== 'diagonal') {
        return { ok: false, reason: 'Line 2 must be a diagonal slash.' };
    }
    // Screen coordinates: +y is downward. Slash '/' => dx*dy < 0, '\\' => dx*dy > 0.
    const line2Product = line2.dx * line2.dy;
    if (line2Product === 0) {
        return { ok: false, reason: 'Line 2 slash is ambiguous. Try a clearer diagonal.' };
    }
    const slashType = line2Product < 0 ? 'rising' : 'falling';

    const line3Orientation = classifyOrientation(line3.angleDeg);
    if (line3Orientation !== 'vertical') {
        return { ok: false, reason: 'Line 3 must be vertical.' };
    }
    // Line 3 must pass both displacement threshold and signed vertical threshold.
    let outcome = null;
    if (line3.dy <= -OUTCOME_VERTICAL_DY_THRESHOLD) outcome = 'choice';
    if (line3.dy >= OUTCOME_VERTICAL_DY_THRESHOLD) outcome = 'reaction';
    if (!outcome) {
        return { ok: false, reason: 'Line 3 must clearly move up or down.' };
    }

    const slotIndex = line1Orientation === 'vertical'
        ? (slashType === 'rising' ? 0 : 1)
        : (slashType === 'rising' ? 2 : 3);

    return {
        ok: true,
        slotIndex,
        outcome,
        line1Orientation,
        slashType,
    };
}

function buildLegendMapping(items) {
    const labels = [...FALLBACK_SLOT_LABELS];
    for (let i = 0; i < 4; i += 1) {
        if (items[i]?.label) labels[i] = items[i].label;
    }

    return [
        { key: 'slot-1', pattern: 'Vertical + /', label: labels[0] },
        { key: 'slot-2', pattern: 'Vertical + \\', label: labels[1] },
        { key: 'slot-3', pattern: 'Horizontal + /', label: labels[2] },
        { key: 'slot-4', pattern: 'Horizontal + \\', label: labels[3] },
    ];
}

export function SigilSealingArea() {
    const {
        logAwareness,
        logTrackerCount,
        trackerConfig,
        setTrackerItems,
        intention,
        setIntention,
        markSigilLegendAutoOpened,
        setSigilLegendDismissed,
        sigilLegend,
    } = useApplicationStore();

    const { activePath } = useNavigationStore();
    const colorScheme = useDisplayModeStore((s) => s.colorScheme);
    const isLight = colorScheme === 'light';

    const shouldAutoOpenLegendOnMount = !sigilLegend?.dismissed
        && (Number(sigilLegend?.autoOpenCount) || 0) < 2;

    const [strokes, setStrokes] = useState([]);
    const [currentStroke, setCurrentStroke] = useState([]);
    const [isDrawing, setIsDrawing] = useState(false);
    const [feedback, setFeedback] = useState(null);
    const [isLegendOpen, setIsLegendOpen] = useState(() => shouldAutoOpenLegendOnMount);
    const [dontAutoOpenAgain, setDontAutoOpenAgain] = useState(false);
    const [isAssignmentOpen, setIsAssignmentOpen] = useState(false);
    const [assignmentDrafts, setAssignmentDrafts] = useState(['', '', '', '']);
    const [isTutorialOpen, setIsTutorialOpen] = useState(false);

    const svgRef = useRef(null);
    const feedbackTimerRef = useRef(null);

    const [isEditingIntention, setIsEditingIntention] = useState(false);
    const [intentionInput, setIntentionInput] = useState(intention || '');

    const trackerItems = useMemo(
        () => [...(trackerConfig?.items || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
        [trackerConfig?.items]
    );
    const legendRows = useMemo(() => buildLegendMapping(trackerItems), [trackerItems]);

    const getDraftsFromTrackerItems = () => [0, 1, 2, 3].map((slotIndex) => trackerItems[slotIndex]?.label || '');

    useEffect(() => {
        if (shouldAutoOpenLegendOnMount) {
            markSigilLegendAutoOpened?.();
        }
    }, [markSigilLegendAutoOpened, shouldAutoOpenLegendOnMount]);

    useEffect(() => {
        if (!isLegendOpen) return undefined;
        const onKeyDown = (e) => {
            if (e.key === 'Escape') {
                setIsLegendOpen(false);
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [isLegendOpen]);

    useEffect(() => {
        return () => {
            if (feedbackTimerRef.current) {
                clearTimeout(feedbackTimerRef.current);
            }
        };
    }, []);

    const clearFeedbackSoon = () => {
        if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
        feedbackTimerRef.current = setTimeout(() => {
            setFeedback(null);
        }, 1800);
    };

    const getPoint = (e) => {
        if (!svgRef.current) return { x: 0, y: 0 };
        const rect = svgRef.current.getBoundingClientRect();
        const clientX = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
        const clientY = e.clientY ?? e.touches?.[0]?.clientY ?? 0;
        return {
            x: clientX - rect.left,
            y: clientY - rect.top,
        };
    };

    const resetStrokes = () => {
        setStrokes([]);
        setCurrentStroke([]);
        setIsDrawing(false);
    };

    const applyDecode = (nextStrokes) => {
        const decoded = decodeSigil(nextStrokes);
        if (!decoded.ok) {
            setFeedback({ type: 'error', text: decoded.reason });
            clearFeedbackSoon();
            resetStrokes();
            return;
        }

        const targetItem = trackerItems[decoded.slotIndex];
        if (!targetItem) {
            setFeedback({ type: 'error', text: 'Assign up to 4 habits to unlock all sigils.' });
            clearFeedbackSoon();
            resetStrokes();
            return;
        }

        const logOk = logTrackerCount({
            itemId: targetItem.id,
            reactedDelta: decoded.outcome === 'reaction' ? 1 : 0,
            choseDelta: decoded.outcome === 'choice' ? 1 : 0,
        });

        if (!logOk) {
            setFeedback({ type: 'error', text: 'Unable to log this sigil right now.' });
            clearFeedbackSoon();
            resetStrokes();
            return;
        }

        logAwareness('sigil-logged', activePath?.activePathId || activePath?.pathId || null);

        const outcomeLabel = decoded.outcome === 'choice' ? 'Choice' : 'Reaction';
        setFeedback({
            type: 'success',
            text: `Logged: ${targetItem.label} + ${outcomeLabel}`,
        });
        clearFeedbackSoon();
        resetStrokes();
    };

    const handlePointerDown = (e) => {
        if (strokes.length >= 3) setStrokes([]);
        setFeedback(null);
        const point = getPoint(e);
        setIsDrawing(true);
        setCurrentStroke([point]);
    };

    const handlePointerMove = (e) => {
        if (!isDrawing) return;
        const point = getPoint(e);
        setCurrentStroke((prev) => [...prev, point]);
    };

    const handlePointerUp = () => {
        if (!isDrawing) return;
        setIsDrawing(false);
        if (currentStroke.length < 2) {
            setCurrentStroke([]);
            return;
        }

        const nextStrokes = [...strokes, currentStroke];
        setCurrentStroke([]);
        setStrokes(nextStrokes);

        if (nextStrokes.length === 3) {
            applyDecode(nextStrokes);
        }
    };

    const handleClear = () => {
        resetStrokes();
        setFeedback(null);
    };

    const handleLegendDismiss = () => {
        if (dontAutoOpenAgain) {
            setSigilLegendDismissed?.(true);
        }
        setIsLegendOpen(false);
    };

    const handleSaveAssignments = () => {
        const nextItems = assignmentDrafts
            .map((label, idx) => {
                const cleanLabel = String(label || '').trim();
                if (!cleanLabel) return null;
                return {
                    id: trackerItems[idx]?.id,
                    label: cleanLabel,
                    order: idx,
                };
            })
            .filter(Boolean);

        setTrackerItems(nextItems);
        setFeedback({ type: 'success', text: 'Sigil habit assignments saved.' });
        clearFeedbackSoon();
        setIsAssignmentOpen(false);
    };

    const feedbackIsSuccess = feedback?.type === 'success';

    return (
        <div className="w-full max-w-2xl mx-auto space-y-4">
            <div className="text-center px-4">
                <div
                    className="text-[11px] uppercase tracking-[0.3em] mb-1"
                    style={{
                        color: isLight ? 'rgba(100, 80, 60, 0.6)' : 'rgba(253, 251, 245, 0.5)',
                        fontFamily: 'var(--font-display)',
                        fontWeight: 600,
                    }}
                >
                    Sigil Sealing
                </div>
                <p
                    className="text-[13px] italic leading-relaxed max-w-md mx-auto"
                    style={{
                        color: isLight ? 'rgba(60, 45, 35, 0.7)' : 'rgba(253, 251, 245, 0.6)',
                        fontFamily: 'var(--font-body)',
                        letterSpacing: '0.01em',
                    }}
                >
                    Draw 3 lines: 1-2 pick the habit, line 3 marks reaction or choice.
                </p>
                <div className="mt-2">
                    <div className="grid grid-cols-3 gap-2 max-w-md mx-auto">
                        <button
                            type="button"
                            onClick={() => {
                                setIsAssignmentOpen((open) => {
                                    if (open) return false;
                                    setAssignmentDrafts(getDraftsFromTrackerItems());
                                    return true;
                                });
                            }}
                            className="px-3 py-1.5 rounded-full text-[9px] uppercase transition-colors"
                            style={{
                                fontFamily: 'var(--font-display)',
                                fontWeight: 700,
                                letterSpacing: 'var(--tracking-mythic)',
                                border: '1px solid var(--accent-20)',
                                background: 'transparent',
                                color: isLight ? 'rgba(90, 77, 60, 0.78)' : 'rgba(253, 251, 245, 0.85)',
                                textShadow: isLight ? 'none' : '0 1px 3px rgba(0,0,0,0.8)',
                            }}
                        >
                            Assign Habits
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setDontAutoOpenAgain(false);
                                setIsLegendOpen(true);
                            }}
                            className="px-3 py-1.5 rounded-full text-[9px] uppercase transition-colors"
                            style={{
                                fontFamily: 'var(--font-display)',
                                fontWeight: 700,
                                letterSpacing: 'var(--tracking-mythic)',
                                border: '1px solid var(--accent-20)',
                                background: 'transparent',
                                color: isLight ? 'rgba(90, 77, 60, 0.78)' : 'rgba(253, 251, 245, 0.85)',
                                textShadow: isLight ? 'none' : '0 1px 3px rgba(0,0,0,0.8)',
                            }}
                        >
                            Sigil Legend
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsTutorialOpen(true)}
                            className="px-3 py-1.5 rounded-full text-[9px] uppercase transition-colors"
                            style={{
                                fontFamily: 'var(--font-display)',
                                fontWeight: 700,
                                letterSpacing: 'var(--tracking-mythic)',
                                border: '1px solid var(--accent-20)',
                                background: 'transparent',
                                color: isLight ? 'rgba(90, 77, 60, 0.78)' : 'rgba(253, 251, 245, 0.85)',
                                textShadow: isLight ? 'none' : '0 1px 3px rgba(0,0,0,0.8)',
                            }}
                        >
                            Tutorial
                        </button>
                    </div>
                </div>
            </div>

            {isAssignmentOpen && (
                <div
                    className="max-w-md mx-auto rounded-2xl p-4"
                    style={{
                        background: isLight ? 'rgba(255, 250, 240, 0.74)' : 'rgba(10, 15, 25, 0.62)',
                        border: `1px solid ${isLight ? 'rgba(90, 120, 170, 0.25)' : 'rgba(140, 185, 245, 0.2)'}`,
                    }}
                >
                    <div
                        className="text-[10px] uppercase tracking-[0.18em] mb-3"
                        style={{ color: isLight ? 'rgba(50, 70, 100, 0.9)' : 'rgba(215, 232, 255, 0.88)' }}
                    >
                        Assign Habits To Sigils
                    </div>
                    <div className="space-y-2">
                        {[0, 1, 2, 3].map((slotIndex) => (
                            <div key={`assign-${slotIndex}`} className="grid grid-cols-[118px_1fr] gap-2 items-center">
                                <div
                                    className="text-[10px] uppercase tracking-[0.12em]"
                                    style={{ color: isLight ? 'rgba(70, 84, 110, 0.82)' : 'rgba(220, 234, 255, 0.74)' }}
                                >
                                    {SIGIL_SLOT_PATTERNS[slotIndex]}
                                </div>
                                <input
                                    type="text"
                                    value={assignmentDrafts[slotIndex] || ''}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setAssignmentDrafts((prev) => {
                                            const next = [...prev];
                                            next[slotIndex] = value;
                                            return next;
                                        });
                                    }}
                                    placeholder={FALLBACK_SLOT_LABELS[slotIndex]}
                                    className="rounded-lg px-3 py-2 text-[11px] outline-none"
                                    style={{
                                        background: isLight ? 'rgba(255,255,255,0.84)' : 'rgba(5, 8, 14, 0.72)',
                                        border: isLight ? '1px solid rgba(90, 120, 170, 0.2)' : '1px solid rgba(140, 185, 245, 0.18)',
                                        color: isLight ? 'rgba(45, 56, 77, 0.95)' : 'rgba(245, 249, 255, 0.92)',
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                    <div className="mt-3 flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => setIsAssignmentOpen(false)}
                            className="px-3 py-1.5 rounded text-[10px] uppercase tracking-[0.15em]"
                            style={{
                                background: isLight ? 'rgba(70, 85, 110, 0.1)' : 'rgba(210, 225, 248, 0.1)',
                                color: isLight ? 'rgba(50, 70, 100, 0.82)' : 'rgba(220, 234, 255, 0.82)',
                            }}
                        >
                            Close
                        </button>
                        <button
                            type="button"
                            onClick={handleSaveAssignments}
                            className="px-3 py-1.5 rounded text-[10px] uppercase tracking-[0.15em]"
                            style={{
                                background: isLight ? 'rgba(53, 145, 92, 0.86)' : 'rgba(72, 207, 139, 0.86)',
                                color: isLight ? '#ffffff' : '#06110b',
                            }}
                        >
                            Save
                        </button>
                    </div>
                </div>
            )}

            <div
                className="relative w-full aspect-[4/3] max-w-md mx-auto rounded-[2rem] overflow-hidden border-2 shadow-2xl"
                data-card="true"
                data-card-id="sigilSealingCanvas"
                style={{
                    background: isLight
                        ? 'linear-gradient(135deg, rgba(255, 250, 240, 0.95), rgba(248, 244, 235, 0.9))'
                        : 'linear-gradient(135deg, rgba(10, 5, 15, 0.95), rgba(5, 5, 8, 0.98))',
                    borderColor: isLight ? 'rgba(180, 120, 40, 0.3)' : 'rgba(255, 220, 120, 0.15)',
                    boxShadow: isLight
                        ? '0 12px 40px rgba(100, 80, 50, 0.15), inset 0 2px 6px rgba(255, 255, 255, 0.4)'
                        : '0 20px 60px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.03)',
                }}
            >
                <div
                    className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5"
                    style={{
                        backgroundImage: 'radial-gradient(circle, rgba(255, 220, 120, 0.1) 1px, transparent 1px)',
                        backgroundSize: '20px 20px',
                    }}
                />

                {feedbackIsSuccess && (
                    <div
                        className="absolute inset-0 rounded-[2rem] pointer-events-none"
                        style={{
                            background: 'radial-gradient(circle, rgba(255, 220, 120, 0.28) 0%, transparent 72%)',
                        }}
                    />
                )}

                <svg
                    ref={svgRef}
                    className="w-full h-full touch-none cursor-crosshair"
                    style={{ touchAction: 'none', overscrollBehavior: 'none' }}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerLeave={() => isDrawing && handlePointerUp()}
                    onPointerCancel={() => isDrawing && handlePointerUp()}
                >
                    {strokes.map((stroke, strokeIdx) => (
                        <polyline
                            key={`stroke-${strokeIdx}`}
                            points={stroke.map((p) => `${p.x},${p.y}`).join(' ')}
                            fill="none"
                            stroke={isLight ? 'rgba(180, 120, 40, 0.72)' : 'rgba(255, 220, 120, 0.72)'}
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            style={{
                                filter: `drop-shadow(0 0 6px ${isLight ? 'rgba(180, 120, 40, 0.3)' : 'rgba(255, 220, 120, 0.35)'})`,
                            }}
                        />
                    ))}

                    {currentStroke.length > 1 && (
                        <polyline
                            points={currentStroke.map((p) => `${p.x},${p.y}`).join(' ')}
                            fill="none"
                            stroke={isLight ? 'rgba(180, 120, 40, 0.95)' : 'rgba(255, 220, 120, 0.92)'}
                            strokeWidth="3.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            style={{
                                filter: `drop-shadow(0 0 6px ${isLight ? 'rgba(180, 120, 40, 0.45)' : 'rgba(255, 220, 120, 0.45)'})`,
                            }}
                        />
                    )}
                </svg>

                {strokes.length === 0 && currentStroke.length === 0 && !feedback && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-8">
                        <div className="text-[96px] mb-4 opacity-10" style={{ filter: 'blur(1px)' }}>
                            ⟨⟩
                        </div>
                        <p
                            className="text-[12px] italic text-center"
                            style={{
                                color: isLight ? 'rgba(100, 80, 60, 0.55)' : 'rgba(253, 251, 245, 0.45)',
                                fontFamily: 'var(--font-body)',
                            }}
                        >
                            Draw 3 strokes
                        </p>
                    </div>
                )}

                {feedback && (
                    <div className="absolute bottom-4 left-4 right-4 pointer-events-none">
                        <div
                            className="px-3 py-2 rounded-xl text-[11px] text-center"
                            style={{
                                background: feedback.type === 'success'
                                    ? (isLight ? 'rgba(53, 145, 92, 0.14)' : 'rgba(72, 207, 139, 0.2)')
                                    : (isLight ? 'rgba(168, 78, 46, 0.13)' : 'rgba(241, 120, 95, 0.2)'),
                                border: `1px solid ${feedback.type === 'success'
                                    ? (isLight ? 'rgba(53, 145, 92, 0.35)' : 'rgba(72, 207, 139, 0.35)')
                                    : (isLight ? 'rgba(168, 78, 46, 0.32)' : 'rgba(241, 120, 95, 0.35)')}`,
                                color: feedback.type === 'success'
                                    ? (isLight ? 'rgba(42, 95, 63, 0.95)' : 'rgba(212, 255, 231, 0.95)')
                                    : (isLight ? 'rgba(120, 55, 31, 0.95)' : 'rgba(255, 226, 221, 0.95)'),
                            }}
                        >
                            {feedback.text}
                        </div>
                    </div>
                )}

                <button
                    onClick={handleClear}
                    className="absolute top-4 right-4 px-3 py-1.5 rounded-full text-[9px] uppercase tracking-wider transition-all"
                    style={{
                        background: isLight ? 'rgba(255, 250, 240, 0.9)' : 'rgba(10, 5, 15, 0.8)',
                        color: isLight ? 'rgba(100, 80, 60, 0.6)' : 'rgba(253, 251, 245, 0.4)',
                        border: `1px solid ${isLight ? 'rgba(180, 120, 40, 0.2)' : 'rgba(255, 220, 120, 0.1)'}`,
                        fontFamily: 'var(--font-display)',
                    }}
                >
                    Clear
                </button>
            </div>

            <div className="max-w-md mx-auto px-4">
                <div
                    className="rounded-2xl px-5 py-4 transition-all duration-300"
                    style={{
                        background: isLight
                            ? 'linear-gradient(135deg, rgba(255, 250, 240, 0.6), rgba(248, 244, 235, 0.5))'
                            : 'rgba(10, 15, 25, 0.5)',
                        border: `1px solid ${isLight ? 'rgba(180, 140, 90, 0.25)' : 'rgba(255, 255, 255, 0.08)'}`,
                        boxShadow: isLight
                            ? 'inset 0 2px 6px rgba(0, 0, 0, 0.04)'
                            : 'inset 0 2px 6px rgba(0, 0, 0, 0.4)',
                    }}
                >
                    <div
                        className="text-[9px] uppercase tracking-[0.2em] mb-3 text-center"
                        style={{ color: isLight ? 'rgba(100, 80, 60, 0.75)' : 'rgba(253, 251, 245, 0.7)' }}
                    >
                        Current Intention
                    </div>

                    {isEditingIntention ? (
                        <div className="space-y-3">
                            <textarea
                                autoFocus
                                value={intentionInput}
                                onChange={(e) => setIntentionInput(e.target.value)}
                                placeholder="When I notice [pattern], I will..."
                                className="w-full border rounded-2xl px-4 py-3 text-sm placeholder:italic focus:outline-none resize-none text-center transition-all"
                                style={{
                                    background: isLight ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.2)',
                                    borderColor: isLight ? 'rgba(180, 120, 40, 0.2)' : 'rgba(255, 220, 120, 0.15)',
                                    color: isLight ? 'rgba(60, 45, 35, 0.9)' : 'rgba(253, 251, 245, 0.9)',
                                    fontFamily: 'var(--font-body)',
                                }}
                                rows={3}
                            />
                            <div className="flex justify-center gap-4">
                                <button
                                    onClick={() => {
                                        setIntentionInput(intention || '');
                                        setIsEditingIntention(false);
                                    }}
                                    className="text-[10px] uppercase tracking-widest transition-colors px-3 py-1"
                                    style={{
                                        color: isLight ? 'rgba(100, 80, 60, 0.5)' : 'rgba(253, 251, 245, 0.3)',
                                        fontFamily: 'var(--font-display)',
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        setIntention(intentionInput);
                                        setIsEditingIntention(false);
                                    }}
                                    className="text-[10px] uppercase tracking-widest px-4 py-1.5 rounded-full transition-all"
                                    style={{
                                        background: isLight ? 'rgba(180, 120, 40, 0.9)' : 'rgba(255, 220, 120, 0.9)',
                                        color: isLight ? '#ffffff' : '#050508',
                                        fontFamily: 'var(--font-display)',
                                        boxShadow: isLight
                                            ? '0 2px 8px rgba(180, 120, 40, 0.3)'
                                            : '0 2px 8px rgba(255, 220, 120, 0.3)',
                                    }}
                                >
                                    Seal
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div
                            onClick={() => setIsEditingIntention(true)}
                            className="cursor-pointer group py-2 px-4 rounded-xl transition-all"
                        >
                            {intention ? (
                                <p
                                    className="text-[13px] text-center italic leading-relaxed"
                                    style={{
                                        color: isLight ? 'rgba(60, 45, 35, 0.85)' : 'rgba(253, 251, 245, 0.7)',
                                        fontFamily: 'var(--font-body)',
                                    }}
                                >
                                    "{intention}"
                                </p>
                            ) : (
                                <p
                                    className="text-[12px] text-center italic opacity-40"
                                    style={{
                                        color: isLight ? 'rgba(100, 80, 60, 0.5)' : 'rgba(253, 251, 245, 0.3)',
                                        fontFamily: 'var(--font-body)',
                                    }}
                                >
                                    Tap to set your intention...
                                </p>
                            )}

                            <div className="flex justify-center mt-2 opacity-0 group-hover:opacity-40 transition-opacity">
                                <div
                                    className="h-px w-16"
                                    style={{
                                        background: `linear-gradient(90deg, transparent, ${isLight ? 'rgba(180, 120, 40, 0.5)' : 'rgba(255, 220, 120, 0.5)'}, transparent)`,
                                    }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {isLegendOpen && (
                <div
                    className="fixed inset-0 z-[4200] flex items-center justify-center p-4"
                    style={{ background: 'rgba(2, 4, 8, 0.72)', backdropFilter: 'blur(6px)' }}
                    onClick={handleLegendDismiss}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="sigil-legend-title"
                        aria-describedby="sigil-legend-desc"
                        className="w-full max-w-md rounded-2xl p-4 sm:p-5"
                        style={{
                            background: isLight
                                ? 'linear-gradient(180deg, rgba(255, 250, 240, 0.98), rgba(248, 244, 235, 0.96))'
                                : 'linear-gradient(180deg, rgba(14, 10, 18, 0.98), rgba(8, 8, 12, 0.98))',
                            border: `1px solid ${isLight ? 'rgba(160, 120, 80, 0.28)' : 'rgba(255, 220, 120, 0.2)'}`,
                            boxShadow: isLight
                                ? '0 18px 40px rgba(80, 60, 30, 0.22)'
                                : '0 18px 40px rgba(0, 0, 0, 0.56)',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h3
                                    id="sigil-legend-title"
                                    className="text-[12px] uppercase tracking-[0.25em] font-black"
                                    style={{ color: isLight ? 'rgba(70, 50, 34, 0.95)' : 'rgba(253, 251, 245, 0.95)' }}
                                >
                                    Sigil Legend
                                </h3>
                                <p
                                    id="sigil-legend-desc"
                                    className="text-[11px] mt-1"
                                    style={{ color: isLight ? 'rgba(82, 62, 42, 0.78)' : 'rgba(253, 251, 245, 0.72)' }}
                                >
                                    3 lines log one awareness win.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={handleLegendDismiss}
                                className="text-[11px] uppercase tracking-[0.15em] px-2 py-1 rounded"
                                style={{
                                    color: isLight ? 'rgba(90, 65, 40, 0.8)' : 'rgba(253, 251, 245, 0.74)',
                                    border: `1px solid ${isLight ? 'rgba(160, 120, 80, 0.22)' : 'rgba(253, 251, 245, 0.2)'}`,
                                }}
                            >
                                Close
                            </button>
                        </div>

                        <div className="mt-3 space-y-2 text-[10px]">
                            <div style={{ color: isLight ? 'rgba(80, 58, 38, 0.84)' : 'rgba(253, 251, 245, 0.82)' }}>
                                Line 1: Vertical = Group A, Horizontal = Group B
                            </div>
                            <div style={{ color: isLight ? 'rgba(80, 58, 38, 0.84)' : 'rgba(253, 251, 245, 0.82)' }}>
                                Line 2: / picks left in group, \\ picks right in group
                            </div>
                            <div style={{ color: isLight ? 'rgba(80, 58, 38, 0.84)' : 'rgba(253, 251, 245, 0.82)' }}>
                                Line 3: Up = Choice, Down = Reaction
                            </div>
                            <div
                                className="italic"
                                style={{ color: isLight ? 'rgba(90, 64, 35, 0.72)' : 'rgba(253, 251, 245, 0.7)' }}
                            >
                                Screen-space note: +y is downward. / has dx*dy &lt; 0, \\ has dx*dy &gt; 0.
                            </div>
                        </div>

                        <div className="mt-4 space-y-2">
                            {legendRows.map((row, idx) => {
                                const configured = Boolean(trackerItems[idx]);
                                return (
                                    <div
                                        key={row.key}
                                        className="rounded-xl px-3 py-2 flex items-center justify-between gap-2"
                                        style={{
                                            background: isLight ? 'rgba(255, 255, 255, 0.65)' : 'rgba(255, 255, 255, 0.05)',
                                            border: `1px solid ${isLight ? 'rgba(160, 120, 80, 0.16)' : 'rgba(253, 251, 245, 0.12)'}`,
                                        }}
                                    >
                                        <div
                                            className="text-[10px] uppercase tracking-[0.14em]"
                                            style={{ color: isLight ? 'rgba(92, 64, 38, 0.8)' : 'rgba(253, 251, 245, 0.72)' }}
                                        >
                                            {row.pattern}
                                        </div>
                                        <div
                                            className="text-[11px] font-semibold"
                                            style={{
                                                color: configured
                                                    ? (isLight ? 'rgba(56, 38, 24, 0.95)' : 'rgba(253, 251, 245, 0.92)')
                                                    : (isLight ? 'rgba(100, 75, 53, 0.65)' : 'rgba(253, 251, 245, 0.55)'),
                                            }}
                                        >
                                            {row.label}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <label className="mt-4 flex items-center gap-2 text-[10px]" style={{ color: isLight ? 'rgba(82, 60, 42, 0.78)' : 'rgba(253, 251, 245, 0.75)' }}>
                            <input
                                type="checkbox"
                                checked={dontAutoOpenAgain || Boolean(sigilLegend?.dismissed)}
                                onChange={(e) => {
                                    const checked = e.target.checked;
                                    setDontAutoOpenAgain(checked);
                                    if (!checked && sigilLegend?.dismissed) {
                                        setSigilLegendDismissed?.(false);
                                    }
                                }}
                            />
                            Don&apos;t auto-open this again
                        </label>
                    </div>
                </div>
            )}

            {isTutorialOpen && (
                <div
                    className="fixed inset-0 z-[4300] flex items-center justify-center p-4"
                    style={{ background: 'rgba(2, 4, 8, 0.76)', backdropFilter: 'blur(7px)' }}
                    onClick={() => setIsTutorialOpen(false)}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="sigil-video-title"
                        className="w-full max-w-md rounded-2xl p-4"
                        style={{
                            background: isLight
                                ? 'linear-gradient(180deg, rgba(255, 250, 240, 0.98), rgba(248, 244, 235, 0.96))'
                                : 'linear-gradient(180deg, rgba(14, 10, 18, 0.98), rgba(8, 8, 12, 0.98))',
                            border: `1px solid ${isLight ? 'rgba(53, 145, 92, 0.3)' : 'rgba(72, 207, 139, 0.24)'}`,
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-3">
                            <h3
                                id="sigil-video-title"
                                className="text-[12px] uppercase tracking-[0.2em] font-black"
                                style={{ color: isLight ? 'rgba(42, 95, 63, 0.95)' : 'rgba(213, 255, 233, 0.92)' }}
                            >
                                Sigil Tutorial Video
                            </h3>
                            <button
                                type="button"
                                onClick={() => setIsTutorialOpen(false)}
                                className="text-[10px] uppercase tracking-[0.15em] px-2 py-1 rounded"
                                style={{
                                    color: isLight ? 'rgba(90, 65, 40, 0.8)' : 'rgba(253, 251, 245, 0.74)',
                                    border: `1px solid ${isLight ? 'rgba(160, 120, 80, 0.22)' : 'rgba(253, 251, 245, 0.2)'}`,
                                }}
                            >
                                Close
                            </button>
                        </div>

                        <video
                            controls
                            preload="metadata"
                            className="w-full rounded-xl"
                            style={{ background: 'rgba(0,0,0,0.5)' }}
                        >
                            {SIGIL_TUTORIAL_SOURCES.map((src) => (
                                <source key={src} src={src} type="video/mp4" />
                            ))}
                        </video>

                        <p
                            className="mt-3 text-[11px]"
                            style={{ color: isLight ? 'rgba(60, 45, 35, 0.76)' : 'rgba(253, 251, 245, 0.72)' }}
                        >
                            If this video is missing, add a file at public/video/sigil-tutorial.mp4 and refresh.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

export default SigilSealingArea;
