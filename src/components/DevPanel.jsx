// src/components/DevPanel.jsx
// Developer-only lab for testing Immanence OS systems
// Access: Ctrl+Shift+D or tap version 5 times
// Per-card wallpaper diagnostics (devtools only)
function PracticeCardWallpaperDiagnostics({ stageKey }) {
    const [status, setStatus] = React.useState('pending');
    const [url, setUrl] = React.useState('');
    const [baseUrl, setBaseUrl] = React.useState('');
    React.useEffect(() => {
        if (!stageKey) return;
        const base = import.meta.env.BASE_URL || '/';
        setBaseUrl(base);
        const wallpaperUrl = getStageWallpaperUrl(stageKey);
        setUrl(wallpaperUrl);
        const img = new window.Image();
        img.onload = () => setStatus('loaded');
        img.onerror = () => setStatus('error');
        img.src = wallpaperUrl;
        // eslint-disable-next-line
    }, [stageKey]);
    return (
        <div style={{ fontSize: 11, fontFamily: 'monospace', background: '#181818', color: '#b5f4ff', borderRadius: 6, padding: 8, margin: '8px 0' }}>
            <div><b>Practice Card Wallpaper Diagnostics</b></div>
            <div>stageKey: <span style={{ color: '#fff' }}>{stageKey}</span></div>
            <div>BASE_URL: <span style={{ color: '#fff' }}>{baseUrl}</span></div>
            <div>wallpaperUrl: <span style={{ color: '#fff' }}>{url}</span></div>
            <div>status: <span style={{ color: status === 'loaded' ? '#7fff7f' : status === 'error' ? '#ff7f7f' : '#fff' }}>{status}</span></div>
        </div>
    );
}

import React, { useState, useCallback, useEffect, useRef, Suspense } from 'react';
import { generateMockSessions, MOCK_PATTERNS } from '../utils/devDataGenerator';
import { useProgressStore } from '../state/progressStore';
import { useSettingsStore } from '../state/settingsStore';
import { useDisplayModeStore } from '../state/displayModeStore';
import { useCurriculumStore } from '../state/curriculumStore';
import { useNavigationStore } from '../state/navigationStore';
import { useTutorialStore } from '../state/tutorialStore';
import { AVATAR_COMPOSITE_LAYER_IDS, useDevPanelStore } from '../state/devPanelStore.js';
import { CoordinateHelper } from './dev/CoordinateHelper.jsx';
import { TutorialEditor } from './dev/TutorialEditor.jsx';
import { getQuickDashboardTiles, getCurriculumPracticeBreakdown, getPracticeDetailMetrics } from '../reporting/dashboardProjection.js';
import * as devHelpers from '../utils/devHelpers.js';
import {
    CARD_TUNER_DEFAULTS,
    initCardTuner,
    subscribeCardTuner,
    findCardFromEvent,
    setPickMode,
    setPickDebugEnabled,
    selectCard,
    applyGlobal,
    applySelected,
    saveGlobal,
    saveSelected,
    resetGlobal,
    resetSelected,
    clearAll,
} from '../dev/cardTuner.js';
import { isDevtoolsEnabled } from '../dev/uiDevtoolsGate.js';
import { validateUiTargetRoot } from '../dev/uiTargetContract.js';
import { attach as attachControlsCapture, detach as detachControlsCapture, startControlsPicking, stopControlsPicking } from '../dev/uiControlsCaptureManager.js';
import {
    CONTROLS_FX_DEFAULTS,
    exportControlsFxPresetsJson,
    getControlsFxPreset,
    importControlsFxPresetsJson,
    resetAllControlsFxPresets,
    resetControlsFxPreset,
    setControlsFxPreset
} from '../dev/controlsFxPresets.js';
import {
    NAV_BUTTON_TUNER_DEFAULTS,
    initNavButtonTuner,
    subscribeNavButtonTuner,
    setNavButtonTunerEnabled,
    applyNavButtonSettings,
    resetNavButtonSettings,
} from '../state/navButtonTuner.js';
import {
    PLATES_FX_DEFAULTS,
    getPlatesFxPreset,
    setPlatesFxPreset,
    subscribePlatesFxPresets
} from '../dev/plateFxPresets.js';

// Lazy-loaded lab component (code-split, only loads when DevPanel opens)
const BloomRingLab = React.lazy(() => import('./dev/BloomRingLab.jsx').then(m => ({ default: m.BloomRingLab })));

// Available stages and paths for dropdowns
const STAGE_OPTIONS = ['Seedling', 'Ember', 'Flame', 'Beacon', 'Stellar'];
const PATH_OPTIONS = ['Yantra', 'Kaya', 'Chitra', 'Nada'];
const AVATAR_COMPOSITE_LINK_OPTIONS = ['none', ...AVATAR_COMPOSITE_LAYER_IDS];
const AVATAR_COMPOSITE_LAYER_LABELS = {
    bg: 'Background',
    stage: 'Stage',
    glass: 'Glass',
    ring: 'Rune Ring',
};

// ═══════════════════════════════════════════════════════════════════════════
// HELPER COMPONENTS (moved outside to avoid hook rendering issues)
// ═══════════════════════════════════════════════════════════════════════════

function getNewestDateKey(sessions = []) {
    let newest = null;
    sessions.forEach((session) => {
        const key = session?.dateKey;
        if (!key) return;
        if (!newest || key > newest) newest = key;
    });
    return newest;
}

function TutorialAnchorCountReadout() {
    const [count, setCount] = useState(0);

    useEffect(() => {
        const update = () => setCount(document.querySelectorAll('[data-tutorial]').length);
        update();
        const interval = setInterval(update, 1000);
        return () => clearInterval(interval);
    }, []);

    return <span className="text-white/70 font-mono">{count}</span>;
}

export function DevPanel({
    isOpen,
    onClose,
    avatarStage: avatarStageProp,
    setAvatarStage: setAvatarStageProp,
    avatarPath: avatarPathProp,
    setAvatarPath: setAvatarPathProp,
    showCore: showCoreProp,
    setShowCore: setShowCoreProp,
    avatarAttention: avatarAttentionProp,
    setAvatarAttention: setAvatarAttentionProp,
}) {
    const currentStageKey = (avatarStageProp || 'seedling').toLowerCase();
    // Settings store state
    const showCoordinateHelper = useSettingsStore(s => s.showCoordinateHelper);
    const setCoordinateHelper = useSettingsStore(s => s.setCoordinateHelper);
    const practiceButtonFxEnabled = useSettingsStore(s => s.practiceButtonFxEnabled);
    const setPracticeButtonFxEnabled = useSettingsStore(s => s.setPracticeButtonFxEnabled);
    const cardElectricBorderEnabled = useSettingsStore(s => s.cardElectricBorderEnabled);
    const setCardElectricBorderEnabled = useSettingsStore(s => s.setCardElectricBorderEnabled);
    const _lightModeRingType = useSettingsStore(s => s.lightModeRingType);
    const _setLightModeRingType = useSettingsStore(s => s.setLightModeRingType);
    const photic = useSettingsStore(s => s.photic);
    const setPhoticSetting = useSettingsStore(s => s.setPhoticSetting);

    // Color scheme detection
    const colorScheme = useDisplayModeStore(s => s.colorScheme);
    const stageAssetStyle = useDisplayModeStore(s => s.stageAssetStyle);
    const setStageAssetStyle = useDisplayModeStore(s => s.setStageAssetStyle);
    const isLight = colorScheme === 'light';
    const isDevBuild = import.meta.env.DEV;
    const devtoolsEnabled = isDevtoolsEnabled();
    const currentPathname = typeof window !== 'undefined' ? window.location.pathname : '';
    const isPlaygroundPath = currentPathname === '/__playground';

    // Avatar preview controls (fallback to local state if no props supplied)
    const [avatarStageLocal, setAvatarStageLocal] = useState('Flame');
    const [avatarPathLocal, setAvatarPathLocal] = useState(PATH_OPTIONS[0] || 'Yantra');
    const [showCoreLocal, setShowCoreLocal] = useState(true);
    const [avatarAttentionLocal, setAvatarAttentionLocal] = useState('none');

    const avatarStage = avatarStageProp ?? avatarStageLocal;
    const setAvatarStage = setAvatarStageProp ?? setAvatarStageLocal;
    const avatarPath = avatarPathProp ?? avatarPathLocal;
    const setAvatarPath = setAvatarPathProp ?? setAvatarPathLocal;
    const showCore = showCoreProp ?? showCoreLocal;
    const setShowCore = setShowCoreProp ?? setShowCoreLocal;
    const avatarAttention = avatarAttentionProp ?? avatarAttentionLocal;
    const setAvatarAttention = setAvatarAttentionProp ?? setAvatarAttentionLocal;

    // Sync initial path to parent when DevPanel opens and parent has no path set
    useEffect(() => {
        if (isOpen && avatarPathProp === null && setAvatarPathProp) {
            setAvatarPathProp(avatarPathLocal);
        }
    }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

    // Collapsible sections
    const [expandedSections, setExpandedSections] = useState({
        avatar: true,
        avatarCompositeTuner: true,
        inspectorNew: false,
        cardTuner: true,
        navBtnTuner: false,
        playground: false,
        curriculum: false,
        tracking: false,
        data: false,
        bloomRingLab: false
    });

    // Armed state for destructive actions
    const [armed, setArmed] = useState(null);

    // Inspector modal
    const [inspectorOpen, setInspectorOpen] = useState(false);
    const [storeSnapshot, setStoreSnapshot] = useState(null);
    const [cardApplyToAll, setCardApplyToAll] = useState(false);
    const [peekMode, setPeekMode] = useState(false);
    const [practiceButtonPickMode, setPracticeButtonPickMode] = useState(false);
    const [practiceButtonApplyToAll, setPracticeButtonApplyToAll] = useState(true);
    const [practiceButtonSelectedKey, setPracticeButtonSelectedKey] = useState(null);
    const LEGACY_PICKERS_FLAG_KEY = "immanence.dev.pickers.legacy.enabled";
    const [legacyPickersEnabled, setLegacyPickersEnabled] = useState(true);
    const PICK_DEBUG_FLAG_KEY = "immanence.dev.pickers.pickDebug.enabled";
    const [pickDebugEnabled, setPickDebugEnabledLocal] = useState(false);
    const [cardIdProbeEnabled, setCardIdProbeEnabled] = useState(false);
    const [universalPickerKind, setUniversalPickerKind] = useState('controls'); // 'controls' | 'card' (legacy modes remain elsewhere)
    const [universalPickMode, setUniversalPickMode] = useState(false);
    const [uiTargetProbeEnabled, setUiTargetProbeEnabled] = useState(false);
    const [utcViolations, setUtcViolations] = useState([]);
    const [controlsSelectedId, setControlsSelectedId] = useState(null);
    const [controlsSelectedRoleGroup, setControlsSelectedRoleGroup] = useState(null);
    const [controlsSurfaceIsRoot, setControlsSurfaceIsRoot] = useState(false);
    const [controlsSurfaceDebug, setControlsSurfaceDebug] = useState(null);
    const [pickDebugResolvedMode, setPickDebugResolvedMode] = useState(null);
    const [pickDebugResolvedId, setPickDebugResolvedId] = useState(null);
    const practiceButtonPickHandlerRef = useRef(null);
    const universalPickHandlerRef = useRef(null);

    const controlsElectricBorderEnabled = useSettingsStore((s) => Boolean(s.controlsElectricBorderEnabled));
    const setControlsElectricBorderEnabled = useSettingsStore((s) => s.setControlsElectricBorderEnabled);
    const [controlsFxDraft, setControlsFxDraft] = useState({ ...CONTROLS_FX_DEFAULTS });
    const [controlsPresetJson, setControlsPresetJson] = useState('');
    const [controlsPresetStatus, setControlsPresetStatus] = useState('');

    // Plates state
    const [platesSelectedId, setPlatesSelectedId] = useState(null);
    const [platesFxDraft, setPlatesFxDraft] = useState({ ...PLATES_FX_DEFAULTS });
    const platesFxEnabled = useSettingsStore((s) => Boolean(s.platesFxEnabled));
    const setPlatesFxEnabled = useSettingsStore((s) => s.setPlatesFxEnabled);

    const CONTROLS_PICK_STORAGE_KEY = "immanence.dev.controlsFxPicker";
    const CONTROLS_PICK_EVENT = "immanence-controls-fx-picker";

    const broadcastControlsPicker = useCallback((next) => {
        if (typeof window === 'undefined') return;
        try {
            window.localStorage.setItem(CONTROLS_PICK_STORAGE_KEY, JSON.stringify(next));
        } catch {
            // ignore storage errors
        }
        try {
            window.dispatchEvent(new CustomEvent(CONTROLS_PICK_EVENT, { detail: next }));
        } catch {
            // ignore
        }
    }, []);

    const logNearestAncestors = useCallback((label, eventTarget) => {
        if (!import.meta.env.DEV) return;
        try {
            const start = eventTarget instanceof Element ? eventTarget : null;
            const chain = [];
            let cur = start;
            while (cur && chain.length < 5) {
                const dataset = cur.dataset ? { ...cur.dataset } : {};
                chain.push({
                    tag: String(cur.tagName || '').toLowerCase(),
                    dataset,
                });
                cur = cur.parentElement;
            }
            console.info(`[picker][${label}] resolver miss — nearest ancestors`, chain);
        } catch (err) {
            console.info(`[picker][${label}] resolver miss — failed to log ancestors`, err);
        }
    }, []);

    const toNodeDebug = useCallback((el) => {
        if (!(el instanceof Element)) return null;
        return {
            tag: String(el.tagName || '').toLowerCase(),
            class: typeof el.className === 'string' ? el.className : null,
            dataset: el.dataset ? { ...el.dataset } : {},
        };
    }, []);

    const toAncestorDebug = useCallback((eventTarget, limit = 12) => {
        const chain = [];
        let cur = eventTarget instanceof Element ? eventTarget : null;
        while (cur && chain.length < limit) {
            chain.push(toNodeDebug(cur));
            cur = cur.parentElement;
        }
        return chain;
    }, [toNodeDebug]);

    useEffect(() => {
        if (!isOpen || !devtoolsEnabled) return undefined;
        if (!uiTargetProbeEnabled && !universalPickMode) {
            setUtcViolations([]);
            return undefined;
        }

        let raf = 0;
        raf = window.requestAnimationFrame(() => {
            try {
                const roots = Array.from(document.querySelectorAll('[data-ui-target="true"]'));
                const violations = [];
                for (const root of roots) {
                    const res = validateUiTargetRoot(root);
                    if (res.ok) continue;
                    violations.push({
                        violationKey: res.violationKey || 'UNKNOWN',
                        reasons: Array.isArray(res.reasons) ? res.reasons : ['invalid'],
                    });
                }
                setUtcViolations(violations);
            } catch {
                setUtcViolations([]);
            }
        });

        return () => {
            if (raf) window.cancelAnimationFrame(raf);
        };
    }, [isOpen, devtoolsEnabled, uiTargetProbeEnabled, universalPickMode]);

    const debugLogPick = useCallback((mode, picker, event, resolvedEl) => {
        if (!pickDebugEnabled) return;
        if (!isDevBuild) return;
        try {
            const target = event?.target instanceof Element ? event.target : null;
            const payload = {
                mode,
                picker,
                target: toNodeDebug(target),
                ancestors: toAncestorDebug(target, 12),
                resolved: toNodeDebug(resolvedEl),
                resolvedId: resolvedEl?.getAttribute?.('data-ui-id') ||
                    resolvedEl?.getAttribute?.('data-card-id') ||
                    null,
            };
            console.info(`[pick-debug] ${JSON.stringify(payload)}`);
        } catch (err) {
            console.info('[pick-debug] failed to log', err);
        }
    }, [pickDebugEnabled, toAncestorDebug, toNodeDebug]);

    const stopPracticeButtonPickCaptureImmediate = useCallback(() => {
        const handler = practiceButtonPickHandlerRef.current;
        if (!handler) return;
        document.removeEventListener('click', handler, true);
        practiceButtonPickHandlerRef.current = null;
    }, []);

    const stopUniversalPickCaptureImmediate = useCallback(() => {
        const handler = universalPickHandlerRef.current;
        if (!handler) return;
        document.removeEventListener('click', handler, true);
        universalPickHandlerRef.current = null;
    }, []);
    const [cardState, setCardState] = useState({
        pickMode: false,
        hasSelected: false,
        selectedCardId: null,
        selectedCardCarouselId: null,
        selectedLabel: null,
        lastPickFailure: null,
        globalSettings: { ...CARD_TUNER_DEFAULTS },
        selectedSettings: null,
    });
    const [globalDraft, setGlobalDraft] = useState({ ...CARD_TUNER_DEFAULTS });
    const [selectedDraft, setSelectedDraft] = useState({ ...CARD_TUNER_DEFAULTS });
    const [navBtnState, setNavBtnState] = useState({
        enabled: false,
        settings: { ...NAV_BUTTON_TUNER_DEFAULTS },
    });
    const [navBtnDraft, setNavBtnDraft] = useState({ ...NAV_BUTTON_TUNER_DEFAULTS });
    const [navBtnProbeEnabled, setNavBtnProbeEnabled] = useState(false);

    const isTutorialAdminOn = localStorage.getItem("immanence.tutorial.admin") === "1";

    // Toggle section
    const toggleSection = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    // Destructive action handler (two-click arm/fire)
    const handleDestructive = useCallback((actionName, action) => {
        if (armed === actionName) {
            action();
            setArmed(null);
        } else {
            setArmed(actionName);
            setTimeout(() => setArmed(null), 3000); // Auto-disarm
        }
    }, [armed]);

    // Open inspector
    const openInspector = () => {
        setStoreSnapshot(devHelpers.getStoreSnapshot());
        setInspectorOpen(true);
    };

    const handleTutorialAdminToggle = () => {
        if (isTutorialAdminOn) {
            localStorage.removeItem("immanence.tutorial.admin");
        } else {
            localStorage.setItem("immanence.tutorial.admin", "1");
        }
        location.reload();
    };

    const handleOpenPlayground = () => {
        if (typeof window === 'undefined') return;
        sessionStorage.setItem('dev:returnPath', window.location.pathname);
        window.location.assign('/__playground');
    };

    const handleBackFromPlayground = () => {
        if (typeof window === 'undefined') return;
        const returnPath = sessionStorage.getItem('dev:returnPath') || '/';
        window.location.assign(returnPath);
    };

    useEffect(() => {
        if (!isOpen || !devtoolsEnabled) return undefined;
        initCardTuner();
        const un = subscribeCardTuner((next) => {
            setCardState(next);
            if (next.globalSettings) setGlobalDraft(next.globalSettings);
            if (next.selectedSettings) setSelectedDraft(next.selectedSettings);
        });
        return () => {
            setPickMode(false);
            setPeekMode(false);
            un();
        };
    }, [isOpen, devtoolsEnabled]);

    useEffect(() => {
        if (!isOpen || !devtoolsEnabled) return undefined;
        try {
            const raw = window.localStorage.getItem(PICK_DEBUG_FLAG_KEY);
            if (raw === "1") setPickDebugEnabledLocal(true);
            if (raw === "0") setPickDebugEnabledLocal(false);
        } catch {
            // ignore
        }
        return undefined;
    }, [isOpen, devtoolsEnabled]);

    useEffect(() => {
        if (!isOpen || !devtoolsEnabled) return undefined;
        try {
            window.localStorage.setItem(PICK_DEBUG_FLAG_KEY, pickDebugEnabled ? "1" : "0");
        } catch {
            // ignore
        }
        try {
            setPickDebugEnabled(Boolean(pickDebugEnabled));
        } catch {
            // ignore
        }
        return undefined;
    }, [isOpen, devtoolsEnabled, pickDebugEnabled]);

    useEffect(() => {
        if (!isOpen || !devtoolsEnabled) return undefined;
        document.body.classList.toggle('dev-card-id-probe', cardIdProbeEnabled);
        return () => document.body.classList.remove('dev-card-id-probe');
    }, [isOpen, devtoolsEnabled, cardIdProbeEnabled]);

    useEffect(() => {
        if (!isOpen || !devtoolsEnabled) return undefined;
        initNavButtonTuner();
        const un = subscribeNavButtonTuner((next) => {
            setNavBtnState(next);
            if (next?.settings) setNavBtnDraft(next.settings);
        });
        return () => un();
    }, [isOpen, devtoolsEnabled]);

    useEffect(() => {
        if (!devtoolsEnabled) return undefined;
        document.body.classList.toggle('dev-nav-btn-probe', navBtnProbeEnabled);
        return () => document.body.classList.remove('dev-nav-btn-probe');
    }, [devtoolsEnabled, navBtnProbeEnabled]);

    useEffect(() => {
        if (!isOpen || !devtoolsEnabled) return undefined;
        const onKeyDown = (event) => {
            const key = String(event.key || '').toLowerCase();
            if (event.ctrlKey && event.altKey && event.shiftKey && key === 'k') {
                event.preventDefault();
                setPeekMode(v => !v);
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [isOpen, devtoolsEnabled]);

    const activeDraft = cardApplyToAll
        ? globalDraft
        : (cardState.hasSelected ? selectedDraft : globalDraft);

    const selectedDisabled = !cardApplyToAll && !cardState.hasSelected;

    const onChangeCardSetting = (key, value) => {
        if (cardApplyToAll) {
            const next = { ...globalDraft, [key]: value };
            setGlobalDraft(next);
            applyGlobal(next);
            return;
        }
        if (!cardState.hasSelected) return;
        const next = { ...selectedDraft, [key]: value };
        setSelectedDraft(next);
        applySelected(next);
    };

    const handleStartPickFlow = () => {
        stopUniversalPickCaptureImmediate();
        stopPracticeButtonPickCaptureImmediate();
        setUniversalPickMode(false);
        setPracticeButtonPickMode(false);
        setPickMode(true);
        setPeekMode(true);
    };

    const onChangeNavBtnSetting = (key, value) => {
        const next = { ...navBtnDraft, [key]: value };
        setNavBtnDraft(next);
        applyNavButtonSettings(next);
    };

    const handleStopPickFlow = () => {
        setPickMode(false);
    };

    const handleConfirmPickFlow = () => {
        setPickMode(false);
        setPeekMode(false);
    };

    const handleStartUniversalPickFlow = () => {
        // Conflict prevention: remove any other capture listeners synchronously first.
        setPickMode(false);
        setPeekMode(false);
        stopPracticeButtonPickCaptureImmediate();
        setPracticeButtonPickMode(false);
        setControlsSelectedId(null);
        setControlsSelectedRoleGroup(null);
        setControlsSurfaceIsRoot(false);
        setControlsSurfaceDebug(null);
        setPickDebugResolvedMode(null);
        setPickDebugResolvedId(null);
        setPlatesSelectedId(null);

        // Effect will handle attach/start based on universalPickMode and universalPickerKind
        setUniversalPickMode(true);
    };

    const handleStopUniversalPickFlow = () => {
        // Effect will handle cleanup when universalPickMode becomes false
        setPickMode(false);
        setUniversalPickMode(false);
    };

    const handleTogglePeek = () => {
        setPeekMode(v => !v);
    };

    const PRACTICE_BUTTON_PICK_STORAGE_KEY = "immanence.dev.practiceButtonFxPicker";
    const PRACTICE_BUTTON_PICK_EVENT = "immanence-practice-button-fx-picker";

    const broadcastPracticeButtonPicker = useCallback((next) => {
        if (typeof window === 'undefined') return;
        try {
            window.localStorage.setItem(PRACTICE_BUTTON_PICK_STORAGE_KEY, JSON.stringify(next));
        } catch {
            // ignore storage errors
        }
        try {
            window.dispatchEvent(new CustomEvent(PRACTICE_BUTTON_PICK_EVENT, { detail: next }));
        } catch {
            // ignore
        }
    }, []);

    useEffect(() => {
        if (!isOpen || !devtoolsEnabled) return undefined;
        try {
            const raw = window.localStorage.getItem(PRACTICE_BUTTON_PICK_STORAGE_KEY);
            if (!raw) return undefined;
            const parsed = JSON.parse(raw);
            setPracticeButtonApplyToAll(parsed?.applyToAll !== false);
            setPracticeButtonSelectedKey(typeof parsed?.selectedKey === 'string' ? parsed.selectedKey : null);
        } catch {
            // ignore
        }
        return undefined;
    }, [isOpen, devtoolsEnabled]);

    useEffect(() => {
        if (!isOpen || !devtoolsEnabled) return undefined;
        try {
            const raw = window.localStorage.getItem(LEGACY_PICKERS_FLAG_KEY);
            if (raw === "0") setLegacyPickersEnabled(false);
            if (raw === "1") setLegacyPickersEnabled(true);
        } catch {
            // ignore
        }
        return undefined;
    }, [isOpen, devtoolsEnabled]);

    useEffect(() => {
        if (!isOpen || !devtoolsEnabled) return undefined;
        try {
            window.localStorage.setItem(LEGACY_PICKERS_FLAG_KEY, legacyPickersEnabled ? "1" : "0");
        } catch {
            // ignore
        }
        return undefined;
    }, [isOpen, devtoolsEnabled, legacyPickersEnabled]);

    useEffect(() => {
        if (!isOpen || !devtoolsEnabled) return undefined;
        if (legacyPickersEnabled) return undefined;
        // If legacy pickers are hidden, ensure their capture listeners are off.
        setPickMode(false);
        setPeekMode(false);
        stopPracticeButtonPickCaptureImmediate();
        setPracticeButtonPickMode(false);
        return undefined;
    }, [isOpen, devtoolsEnabled, legacyPickersEnabled, stopPracticeButtonPickCaptureImmediate]);

    useEffect(() => {
        if (!isOpen || !devtoolsEnabled) return undefined;
        broadcastPracticeButtonPicker({
            applyToAll: practiceButtonApplyToAll,
            selectedKey: practiceButtonSelectedKey,
        });
        return undefined;
    }, [isOpen, devtoolsEnabled, practiceButtonApplyToAll, practiceButtonSelectedKey, broadcastPracticeButtonPicker]);

    useEffect(() => {
        if (!isOpen || !devtoolsEnabled) return undefined;
        broadcastControlsPicker({ selectedId: controlsSelectedId || null });
        return undefined;
    }, [isOpen, devtoolsEnabled, controlsSelectedId, broadcastControlsPicker]);

    useEffect(() => {
        if (!isOpen || !devtoolsEnabled) return undefined;
        setControlsFxDraft(getControlsFxPreset(controlsSelectedId));
        return undefined;
    }, [isOpen, devtoolsEnabled, controlsSelectedId]);

    useEffect(() => {
        if (!isOpen || !devtoolsEnabled) return undefined;
        if (!practiceButtonPickMode) return undefined;

        // Conflict prevention: never allow two global capture listeners at once.
        setPickMode(false);
        setPeekMode(false);
        setUniversalPickMode(false);

        const normalizePracticeType = (raw) => {
            const t = String(raw || '').trim().toLowerCase();
            if (!t) return null;
            if (t === 'perception') return 'visual';
            if (t === 'resonance') return 'sound';
            return t;
        };

        const onClickCapture = (event) => {
            const target = event?.target instanceof Element ? event.target : null;
            if (!target) return;
            const el = target.closest('[data-ui="practice-button"]');
            debugLogPick('legacy:practice-button', 'legacy', event, el);
            setPickDebugResolvedMode('legacy:practice-button');
            setPickDebugResolvedId(null);
            if (!el) {
                logNearestAncestors('practice-button', target);
                return;
            }

            // Picker should not trigger the UI action underneath.
            event.preventDefault();
            event.stopPropagation();
            if (typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation();

            const practiceType = normalizePracticeType(el.getAttribute('data-practice-type'));
            const id = el.getAttribute('data-practice-id') || el.id || practiceType || 'practice';
            const key = `${practiceType || 'practice'}:${id}`;
            setPickDebugResolvedId(key);
            setPracticeButtonSelectedKey(key);
            setPracticeButtonApplyToAll(false);
        };

        // Ensure we never accidentally keep two listeners around.
        stopPracticeButtonPickCaptureImmediate();
        practiceButtonPickHandlerRef.current = onClickCapture;
        document.addEventListener('click', onClickCapture, true);
        return () => {
            document.removeEventListener('click', onClickCapture, true);
            if (practiceButtonPickHandlerRef.current === onClickCapture) {
                practiceButtonPickHandlerRef.current = null;
            }
        };
    }, [isOpen, devtoolsEnabled, practiceButtonPickMode, debugLogPick, logNearestAncestors, stopPracticeButtonPickCaptureImmediate]);

    useEffect(() => {
        const removePlatesPickerClass = () => {
            try {
                document.body.classList.remove('dev-plates-picker-active');
            } catch {
                // ignore
            }
        };

        if (!isOpen || !devtoolsEnabled) {
            stopControlsPicking();
            detachControlsCapture();
            stopUniversalPickCaptureImmediate();
            removePlatesPickerClass();
            return undefined;
        }

        // Always keep picking OFF when not actively picking.
        if (!universalPickMode) {
            stopControlsPicking();
            detachControlsCapture();
            stopUniversalPickCaptureImmediate();
            removePlatesPickerClass();
            return undefined;
        }

        // Conflict prevention: never allow two global capture listeners at once.
        setPickMode(false);
        setPeekMode(false);
        stopPracticeButtonPickCaptureImmediate();
        setPracticeButtonPickMode(false);

        if (universalPickerKind === 'controls' || universalPickerKind === 'plates') {
            stopUniversalPickCaptureImmediate();
            attachControlsCapture();

            if (universalPickerKind === 'plates') {
                try {
                    document.body.classList.add('dev-plates-picker-active');
                } catch {
                    // ignore
                }
            } else {
                removePlatesPickerClass();
            }

            startControlsPicking({
                kind: universalPickerKind,
                onPick: ({ validation }) => {
                    const resolvedId = validation?.rootId || null;
                    if (!resolvedId) return;

                    if (universalPickerKind === 'controls') {
                        setPickDebugResolvedMode('universal:controls');
                        setPickDebugResolvedId(resolvedId);
                        setControlsSelectedId(resolvedId);
                        setControlsSelectedRoleGroup(validation?.roleGroup || null);
                        setControlsSurfaceIsRoot(Boolean(validation?.surfaceIsRoot));
                        const surface = validation?.surfaceEl && typeof validation.surfaceEl.tagName === 'string' ? validation.surfaceEl : null;
                        setControlsSurfaceDebug(surface ? {
                            tag: String(surface.tagName || '').toLowerCase(),
                            className: typeof surface.className === 'string' ? surface.className : null,
                        } : null);
                        return;
                    }

                    setPickDebugResolvedMode('universal:plates');
                    setPickDebugResolvedId(resolvedId);
                    setPlatesSelectedId(resolvedId);
                    try {
                        window.localStorage.setItem('immanence.dev.platesFxPicker', JSON.stringify({ selectedId: resolvedId }));
                        window.dispatchEvent(new CustomEvent('immanence-plates-fx-picker', { detail: { selectedId: resolvedId } }));
                    } catch {
                        // ignore
                    }
                },
            });

            return () => {
                stopControlsPicking();
                detachControlsCapture();
                removePlatesPickerClass();
            };
        }

        if (universalPickerKind === 'card') {
            stopControlsPicking();
            detachControlsCapture();
            removePlatesPickerClass();
            stopUniversalPickCaptureImmediate();

            const onClickCapture = (event) => {
                const target = event?.target instanceof Element ? event.target : null;
                if (!target) return;
                if (target.closest?.('[data-devpanel-root="true"]')) return;
                const el = findCardFromEvent(event);
                debugLogPick('universal:card', 'universal', event, el);
                setPickDebugResolvedMode('universal:card');
                setPickDebugResolvedId(el?.getAttribute?.('data-card-id') || null);
                if (!el) return;
                event.preventDefault();
                event.stopPropagation();
                if (typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation();
                selectCard(el);
            };

            universalPickHandlerRef.current = onClickCapture;
            window.addEventListener('click', onClickCapture, true);
            return () => {
                window.removeEventListener('click', onClickCapture, true);
                if (universalPickHandlerRef.current === onClickCapture) {
                    universalPickHandlerRef.current = null;
                }
            };
        }

        stopControlsPicking();
        detachControlsCapture();
        stopUniversalPickCaptureImmediate();
        removePlatesPickerClass();
        return undefined;
    }, [
        isOpen,
        devtoolsEnabled,
        universalPickMode,
        universalPickerKind,
        debugLogPick,
        stopPracticeButtonPickCaptureImmediate,
        stopUniversalPickCaptureImmediate,
    ]);

    useEffect(() => {
        if (!isOpen || !devtoolsEnabled) return undefined;
        setPlatesFxDraft(getPlatesFxPreset(platesSelectedId));
        return undefined;
    }, [isOpen, devtoolsEnabled, platesSelectedId]);

    useEffect(() => {
        if (!isOpen || !devtoolsEnabled) return undefined;
        if (!cardState?.pickMode) return undefined;
        // Conflict prevention: never allow two global capture listeners at once.
        setPracticeButtonPickMode(false);
        setUniversalPickMode(false);
        return undefined;
    }, [isOpen, devtoolsEnabled, cardState?.pickMode]);

    useEffect(() => {
        if (!isOpen || !devtoolsEnabled) return undefined;
        document.body.classList.toggle('dev-ui-target-probe', uiTargetProbeEnabled);
        return () => document.body.classList.remove('dev-ui-target-probe');
    }, [isOpen, devtoolsEnabled, uiTargetProbeEnabled]);

    if (!isOpen) return null;

    if (peekMode) {
        return (
            <>
                {/* Practice Card Wallpaper Diagnostics (devtools only) */}
                <PracticeCardWallpaperDiagnostics stageKey={currentStageKey} />
                <div data-testid="devpanel-peek" className="fixed inset-0 z-[9999] pointer-events-none">
                    <div className="absolute top-3 right-3 pointer-events-auto w-[280px] rounded-xl border border-white/20 bg-[#0a0a12]/95 backdrop-blur-md p-3 shadow-2xl">
                        <div className="text-[11px] text-white/80 mb-2">Card Picker Active</div>
                        <div className="text-[10px] text-white/55 mb-3">
                            Click any marked card in the UI, then confirm to return to the panel.
                        </div>
                        <div className="text-[10px] text-white/50 mb-3">
                            Shortcut: <span className="font-mono text-white/80">Ctrl+Alt+Shift+K</span>
                        </div>
                        <div className="text-[10px] font-mono text-white/75 mb-3 bg-white/5 border border-white/10 rounded px-2 py-1.5">
                            Selected: {cardState.hasSelected ? (cardState.selectedCardId || cardState.selectedLabel || 'card') : 'none'}
                        </div>
                        {cardState.lastPickFailure?.message && (
                            <div className="text-[10px] mb-3 rounded-md border border-red-400/30 bg-red-500/10 px-2 py-1.5 text-red-200/90">
                                {cardState.lastPickFailure.message}
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={handleConfirmPickFlow}
                                className="rounded-lg px-3 py-2 text-xs bg-amber-500/20 border border-amber-400/50 text-amber-200"
                            >
                                {cardState.hasSelected ? 'Confirm + Return' : 'Return'}
                            </button>
                            <button
                                onClick={onClose}
                                className="rounded-lg px-3 py-2 text-xs bg-white/5 border border-white/15 text-white/70"
                            >
                                Close Panel
                            </button>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    return (
        <div
            data-testid="devpanel-root"
            data-devpanel-root="true"
            className="fixed inset-0 z-[9999] flex pointer-events-none"
        >
            {devtoolsEnabled && (
                <style>{`
                    .dev-card-id-probe [data-card-id] {
                        outline: 4px solid #00ffff !important;
                        box-shadow: 0 0 0 8px rgba(0, 255, 255, 0.25) !important;
                    }
                `}</style>
            )}

            {/* Panel */}
            <div className="relative pointer-events-auto ml-auto w-[400px] h-full border-l overflow-y-auto no-scrollbar" style={{
                background: isLight ? '#F5F0E6' : '#0a0a12',
                borderColor: isLight ? 'rgba(180, 155, 110, 0.25)' : 'rgba(255, 255, 255, 0.1)'
            }}>
                {/* Header */}
                <div className="sticky top-0 z-10 border-b px-4 py-3 flex items-center justify-between" style={{
                    background: isLight ? '#F5F0E6' : '#0a0a12',
                    borderColor: isLight ? 'rgba(180, 155, 110, 0.25)' : 'rgba(255, 255, 255, 0.1)'
                }}>
                    <div className="flex items-center gap-2">
                        <span className="text-lg">🔧</span>
                        <span className="text-sm font-semibold tracking-wide" style={{
                            color: isLight ? 'rgba(45, 40, 35, 0.95)' : 'rgba(255, 255, 255, 0.9)'
                        }}>DEVELOPER PANEL</span>
                    </div>
                    <button
                          onClick={() => {
                              setPickMode(false);
                              setPeekMode(false);
                              stopPracticeButtonPickCaptureImmediate();
                              setPracticeButtonPickMode(false);
                              stopUniversalPickCaptureImmediate();
                              setUniversalPickMode(false);
                              onClose();
                          }}
                         data-testid="devpanel-close"
                         className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
                         style={{ color: isLight ? 'rgba(60, 50, 40, 0.6)' : 'rgba(255, 255, 255, 0.6)' }}
                    >
                        ✕
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-4">

                    {/* ═══════════════════════════════════════════════════════════════ */}
                    {/* AVATAR STAGE (WALLPAPER CONTROL) */}
                    {/* ═══════════════════════════════════════════════════════════════ */}
                    <Section
                        title="Avatar Stage (Wallpaper)"
                        expanded={expandedSections.avatar}
                        onToggle={() => toggleSection('avatar')}
                        isLight={isLight}
                    >
                        <div className="text-xs text-white/50 mb-3">
                            Stage controls color/wallpaper. Path controls sigil geometry, breath, bloom intensity.
                        </div>

                        {/* Stage selector */}
                        <div className="flex items-center gap-3 mb-4">
                            <label className="text-sm font-medium w-16" style={{ color: isLight ? 'rgba(60, 50, 40, 0.9)' : 'white' }}>Stage</label>
                            <select
                                value={avatarStage}
                                onChange={(e) => {
                                    setAvatarStage(e.target.value);
                                    // Dispatch event for wallpaper change
                                    window.dispatchEvent(new CustomEvent('dev-avatar-stage', { 
                                        detail: { stage: e.target.value } 
                                    }));
                                }}
                                className="flex-1 rounded-lg px-3 py-2.5 text-base font-medium"
                                style={{
                                    background: isLight ? 'rgba(255, 255, 255, 0.9)' : '#0a0a12',
                                    border: isLight ? '1px solid rgba(180, 155, 110, 0.3)' : '1px solid rgba(255, 255, 255, 0.3)',
                                    color: isLight ? 'rgba(60, 50, 40, 0.95)' : 'white',
                                    colorScheme: isLight ? 'light' : 'dark'
                                }}
                            >
                                {STAGE_OPTIONS.map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>

                        {/* Path selector */}
                        <div className="flex items-center gap-3 mb-4">
                            <label className="text-sm font-medium w-16" style={{ color: isLight ? 'rgba(60, 50, 40, 0.9)' : 'white' }}>Path</label>
                            <select
                                value={avatarPath || ''}
                                onChange={(e) => setAvatarPath(e.target.value || null)}
                                className="flex-1 rounded-lg px-3 py-2.5 text-base font-medium"
                                style={{
                                    background: isLight ? 'rgba(255, 255, 255, 0.9)' : '#0a0a12',
                                    border: isLight ? '1px solid rgba(180, 155, 110, 0.3)' : '1px solid rgba(255, 255, 255, 0.3)',
                                    color: isLight ? 'rgba(60, 50, 40, 0.95)' : 'white',
                                    colorScheme: isLight ? 'light' : 'dark'
                                }}
                            >
                                <option value="">None (default)</option>
                                {PATH_OPTIONS.map(p => (
                                    <option key={p} value={p}>{p}</option>
                                ))}
                            </select>
                        </div>

                        {/* Core + Attention preview toggles */}
                        <div className="flex items-center gap-3 mb-4">
                            <label className="text-xs w-16" style={{ color: isLight ? 'rgba(140, 100, 60, 0.9)' : '#fb923c' }}>Preview</label>
                            <button
                                onClick={() => setShowCore(!showCore)}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                                style={{
                                    background: showCore ? 'rgba(212, 168, 74, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                                    color: isLight ? 'rgba(60, 50, 40, 0.9)' : 'white',
                                    border: isLight ? '1px solid rgba(180, 155, 110, 0.35)' : '1px solid rgba(255, 255, 255, 0.2)'
                                }}
                            >
                                {showCore ? 'Core On' : 'Core Off'}
                            </button>
                            <select
                                value={avatarAttention}
                                onChange={(e) => setAvatarAttention(e.target.value)}
                                className="flex-1 rounded-lg px-3 py-1.5 text-xs font-medium"
                                style={{
                                    background: isLight ? 'rgba(255, 255, 255, 0.9)' : '#0a0a12',
                                    border: isLight ? '1px solid rgba(180, 155, 110, 0.3)' : '1px solid rgba(255, 255, 255, 0.3)',
                                    color: isLight ? 'rgba(60, 50, 40, 0.95)' : 'white',
                                    colorScheme: isLight ? 'light' : 'dark'
                                }}
                            >
                                {['none', 'ekagrata', 'sahaja', 'vigilance'].map((opt) => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                        </div>

                        {/* Stage Asset Style Toggle */}
                        <div className="flex items-center gap-3 mb-4">
                            <label className="text-xs w-16" style={{ color: isLight ? 'rgba(140, 100, 60, 0.9)' : '#fb923c' }}>Title Set</label>
                            <div className="flex bg-white/5 rounded-lg p-1 gap-1">
                                {[1, 2, 3, 4, 5].map(styleSet => (
                                    <button
                                        key={styleSet}
                                        onClick={() => setStageAssetStyle(styleSet)}
                                        className={`w-7 h-7 flex items-center justify-center rounded text-[10px] font-bold transition-all ${
                                            stageAssetStyle === styleSet
                                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                                : 'text-white/40 hover:text-white/60 hover:bg-white/5'
                                        }`}
                                    >
                                        {styleSet}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </Section>

                    <AvatarCompositeTunerSection
                        expanded={expandedSections.avatarCompositeTuner}
                        onToggle={() => toggleSection('avatarCompositeTuner')}
                        isLight={isLight}
                    />

                    {/* ═══════════════════════════════════════════════════════════════ */}
                    {/* INSPECTOR (NEW) — Universal Picker */}
                    {/* ═══════════════════════════════════════════════════════════════ */}
                    <Section
                        title="Inspector (NEW)"
                        expanded={expandedSections.inspectorNew}
                        onToggle={() => toggleSection('inspectorNew')}
                        isLight={isLight}
                    >
                        {!devtoolsEnabled ? (
                            <div className="text-xs text-white/50">Locked</div>
                        ) : (
                            <>
                                <div className="text-[10px] text-white/50 mb-2">
                                    Universal picker (parity phase): controls + plates + cards. Conflict rule: only one global capture listener active.
                                </div>

                                <div className="grid grid-cols-3 gap-2 mb-2">
                                    <button
                                        onClick={() => setUniversalPickerKind('controls')}
                                        className={`px-3 py-2 rounded-lg text-xs border transition-all ${universalPickerKind === 'controls' ? 'bg-amber-500/25 text-amber-200 border-amber-400/60' : 'bg-white/5 text-white/70 border-white/15'}`}
                                    >
                                        Controls
                                    </button>
                                    <button
                                        onClick={() => setUniversalPickerKind('card')}
                                        className={`px-3 py-2 rounded-lg text-xs border transition-all ${universalPickerKind === 'card' ? 'bg-amber-500/25 text-amber-200 border-amber-400/60' : 'bg-white/5 text-white/70 border-white/15'}`}
                                    >
                                        Cards
                                    </button>
                                    <button
                                        onClick={() => setUniversalPickerKind('plates')}
                                        className={`px-3 py-2 rounded-lg text-xs border transition-all ${universalPickerKind === 'plates' ? 'bg-amber-500/25 text-amber-200 border-amber-400/60' : 'bg-white/5 text-white/70 border-white/15'}`}
                                    >
                                        Plates
                                    </button>
                                </div>

                                <button
                                    onClick={() => (universalPickMode ? handleStopUniversalPickFlow() : handleStartUniversalPickFlow())}
                                    className={`w-full mb-3 px-3 py-2 rounded-lg text-xs border transition-all ${universalPickMode ? 'bg-amber-500/25 text-amber-200 border-amber-400/60' : 'bg-white/5 text-white/70 border-white/15'}`}
                                >
                                    {universalPickMode ? 'Stop Picking' : 'Pick Target'}
                                </button>

                                <button
                                    onClick={() => setLegacyPickersEnabled(v => !v)}
                                    className={`w-full mb-3 px-3 py-2 rounded-lg text-xs border transition-all ${legacyPickersEnabled ? 'bg-white/5 text-white/70 border-white/15 hover:bg-white/10' : 'bg-fuchsia-500/15 text-fuchsia-200 border-fuchsia-400/60'}`}
                                >
                                    {legacyPickersEnabled ? 'Legacy pickers: ON' : 'Legacy pickers: OFF'}
                                </button>

                                <div className="grid grid-cols-3 gap-2 mb-3">
                                    <button
                                        onClick={() => setPickDebugEnabledLocal(v => !v)}
                                        className={`px-3 py-2 rounded-lg text-xs border transition-all ${pickDebugEnabled ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/60' : 'bg-white/5 text-white/70 border-white/15'}`}
                                    >
                                        Pick Debug {pickDebugEnabled ? 'ON' : 'OFF'}
                                    </button>
                                    <button
                                        onClick={() => setUiTargetProbeEnabled(v => !v)}
                                        className={`px-3 py-2 rounded-lg text-xs border transition-all ${uiTargetProbeEnabled ? 'bg-fuchsia-500/15 text-fuchsia-200 border-fuchsia-400/60' : 'bg-white/5 text-white/70 border-white/15'}`}
                                    >
                                        Probe: Targets
                                    </button>
                                    <button
                                        onClick={() => setCardIdProbeEnabled(v => !v)}
                                        className={`px-3 py-2 rounded-lg text-xs border transition-all ${cardIdProbeEnabled ? 'bg-cyan-500/20 text-cyan-200 border-cyan-400/50' : 'bg-white/5 text-white/70 border-white/15'}`}
                                    >
                                        Probe: Cards
                                    </button>
                                </div>

                                <div className="mb-3 text-[11px] text-white/70 font-mono bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                                    Debug resolved: {pickDebugResolvedMode ? `${pickDebugResolvedMode} → ${pickDebugResolvedId || 'null'}` : 'none'}
                                </div>

                                {universalPickerKind === 'controls' && (
                                    <>
                                        <div className="space-y-2 mb-3">
                                            <div className="rounded-lg px-3 py-2 text-[11px] text-white/70 font-mono bg-white/5 border border-white/10">
                                                Selected: {controlsSelectedId || 'none'}
                                            </div>
                                            <div className="rounded-lg px-3 py-2 text-[11px] text-white/70 font-mono bg-white/5 border border-white/10">
                                                Role group: {controlsSelectedRoleGroup || 'null'}
                                            </div>
                                            <div className="rounded-lg px-3 py-2 text-[11px] text-white/70 font-mono bg-white/5 border border-white/10">
                                                Surface: {controlsSelectedId ? (controlsSurfaceIsRoot ? 'root' : 'descendant') : 'n/a'}
                                            </div>
                                            <div className="rounded-lg px-3 py-2 text-[11px] text-white/70 font-mono bg-white/5 border border-white/10">
                                                Surface node: {controlsSurfaceDebug ? `${controlsSurfaceDebug.tag}${controlsSurfaceDebug.className ? `.${String(controlsSurfaceDebug.className).trim().split(/\s+/g).slice(0, 3).join('.')}` : ''}` : 'null'}
                                            </div>
                                        </div>

                                        <div className="border-t border-white/10 pt-3 mt-3 mb-3">
                                            <div className="text-[11px] text-white/80 font-semibold mb-2">FX: Selected Control Electric Border</div>
                                            <button
                                                onClick={() => setControlsElectricBorderEnabled(!controlsElectricBorderEnabled)}
                                                disabled={!controlsSelectedId}
                                                className={`w-full px-3 py-2 rounded-lg text-xs border transition-all ${controlsElectricBorderEnabled ? 'bg-amber-500/20 text-amber-200 border-amber-400/50' : 'bg-white/5 text-white/70 border-white/15'} ${!controlsSelectedId ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            >
                                                {controlsElectricBorderEnabled ? 'Enable Selected Control FX: ON' : 'Enable Selected Control FX: OFF'}
                                            </button>
                                            <div className="text-[10px] text-white/45 mt-2">
                                                Target: current <span className="font-mono">data-ui-id</span> (role-scope)
                                            </div>

                                            <div className="grid grid-cols-2 gap-2 mt-3">
                                                <RangeControl
                                                    label="Thickness"
                                                    value={controlsFxDraft.thickness}
                                                    min={1}
                                                    max={12}
                                                    step={1}
                                                    disabled={!controlsSelectedId}
                                                    onChange={(v) => {
                                                        const next = { ...controlsFxDraft, thickness: v };
                                                        setControlsFxDraft(next);
                                                        if (controlsSelectedId) setControlsFxPreset(controlsSelectedId, { thickness: v });
                                                    }}
                                                />
                                                <RangeControl
                                                    label="Offset"
                                                    value={controlsFxDraft.offsetPx}
                                                    min={0}
                                                    max={40}
                                                    step={1}
                                                    suffix="px"
                                                    disabled={!controlsSelectedId}
                                                    onChange={(v) => {
                                                        const next = { ...controlsFxDraft, offsetPx: v };
                                                        setControlsFxDraft(next);
                                                        if (controlsSelectedId) setControlsFxPreset(controlsSelectedId, { offsetPx: v });
                                                    }}
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-2 mt-2">
                                                <RangeControl
                                                    label="Speed"
                                                    value={controlsFxDraft.speed}
                                                    min={0}
                                                    max={0.2}
                                                    step={0.005}
                                                    disabled={!controlsSelectedId}
                                                    onChange={(v) => {
                                                        const next = { ...controlsFxDraft, speed: v };
                                                        setControlsFxDraft(next);
                                                        if (controlsSelectedId) setControlsFxPreset(controlsSelectedId, { speed: v });
                                                    }}
                                                />
                                                <RangeControl
                                                    label="Chaos"
                                                    value={controlsFxDraft.chaos}
                                                    min={0}
                                                    max={0.3}
                                                    step={0.005}
                                                    disabled={!controlsSelectedId}
                                                    onChange={(v) => {
                                                        const next = { ...controlsFxDraft, chaos: v };
                                                        setControlsFxDraft(next);
                                                        if (controlsSelectedId) setControlsFxPreset(controlsSelectedId, { chaos: v });
                                                    }}
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-2 mt-2">
                                                <RangeControl
                                                    label="Glow"
                                                    value={controlsFxDraft.glow}
                                                    min={0}
                                                    max={64}
                                                    step={1}
                                                    suffix="px"
                                                    disabled={!controlsSelectedId}
                                                    onChange={(v) => {
                                                        const next = { ...controlsFxDraft, glow: v };
                                                        setControlsFxDraft(next);
                                                        if (controlsSelectedId) setControlsFxPreset(controlsSelectedId, { glow: v });
                                                    }}
                                                />
                                                <RangeControl
                                                    label="Blur"
                                                    value={controlsFxDraft.blur}
                                                    min={0}
                                                    max={24}
                                                    step={1}
                                                    suffix="px"
                                                    disabled={!controlsSelectedId}
                                                    onChange={(v) => {
                                                        const next = { ...controlsFxDraft, blur: v };
                                                        setControlsFxDraft(next);
                                                        if (controlsSelectedId) setControlsFxPreset(controlsSelectedId, { blur: v });
                                                    }}
                                                />
                                            </div>

                                            <div className="mt-2">
                                                <RangeControl
                                                    label="Opacity"
                                                    value={controlsFxDraft.opacity}
                                                    min={0.1}
                                                    max={1}
                                                    step={0.01}
                                                    disabled={!controlsSelectedId}
                                                    onChange={(v) => {
                                                        const next = { ...controlsFxDraft, opacity: v };
                                                        setControlsFxDraft(next);
                                                        if (controlsSelectedId) setControlsFxPreset(controlsSelectedId, { opacity: v });
                                                    }}
                                                />
                                            </div>

                                            <div className="mt-2 grid grid-cols-2 gap-2 items-center">
                                                <div className="text-[10px] text-white/55">Color</div>
                                                <div className="flex items-center justify-end gap-2">
                                                    <input
                                                        type="color"
                                                        value={(typeof controlsFxDraft.color === 'string' && controlsFxDraft.color.startsWith('#')) ? controlsFxDraft.color : '#ffffff'}
                                                        disabled={!controlsSelectedId}
                                                        onChange={(e) => {
                                                            const value = e?.target?.value || null;
                                                            const next = { ...controlsFxDraft, color: value };
                                                            setControlsFxDraft(next);
                                                            if (controlsSelectedId) setControlsFxPreset(controlsSelectedId, { color: value });
                                                        }}
                                                        className="h-8 w-12 p-0 border border-white/15 rounded"
                                                        style={{ background: 'transparent' }}
                                                    />
                                                    <button
                                                        disabled={!controlsSelectedId}
                                                        onClick={() => {
                                                            const next = { ...controlsFxDraft, color: null };
                                                            setControlsFxDraft(next);
                                                            if (controlsSelectedId) setControlsFxPreset(controlsSelectedId, { color: null });
                                                        }}
                                                        className={`px-2 py-2 rounded-lg text-[10px] border transition-all ${!controlsSelectedId ? 'opacity-50 cursor-not-allowed bg-white/5 border-white/10 text-white/35' : 'bg-white/5 border-white/15 text-white/70 hover:bg-white/10'}`}
                                                    >
                                                        Use role color
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-2 mt-2">
                                                <button
                                                    disabled={!controlsSelectedId}
                                                    onClick={() => {
                                                        if (!controlsSelectedId) return;
                                                        resetControlsFxPreset(controlsSelectedId);
                                                        setControlsFxDraft(getControlsFxPreset(controlsSelectedId));
                                                    }}
                                                    className={`px-3 py-2 rounded-lg text-xs border transition-all ${!controlsSelectedId ? 'opacity-50 cursor-not-allowed bg-white/5 border-white/10 text-white/35' : 'bg-white/5 border-white/15 text-white/70 hover:bg-white/10'}`}
                                                >
                                                    Reset Preset
                                                </button>
                                                <div className="rounded-lg px-3 py-2 text-[11px] text-white/70 font-mono bg-white/5 border border-white/10">
                                                    Preset: {controlsSelectedId ? 'saved' : 'n/a'}
                                                </div>
                                            </div>

                                            <div className="mt-2 text-[10px] text-white/55">Presets JSON</div>
                                            <textarea
                                                data-testid="controls-presets-json"
                                                value={controlsPresetJson}
                                                onChange={(e) => setControlsPresetJson(e?.target?.value || '')}
                                                className="w-full mt-1 rounded-lg border border-white/15 bg-white/5 text-white/80 p-2 text-[11px] font-mono"
                                                rows={5}
                                                placeholder='{"version":2,"presets":{"homeHub:mode:navigation":{"glow":24}}}'
                                            />
                                            <div className="grid grid-cols-2 gap-2 mt-2">
                                                <button
                                                    data-testid="controls-presets-export"
                                                    onClick={() => {
                                                        const json = exportControlsFxPresetsJson();
                                                        setControlsPresetJson(json);
                                                        setControlsPresetStatus('Exported presets JSON.');
                                                    }}
                                                    className="px-3 py-2 rounded-lg text-xs border transition-all bg-white/5 border-white/15 text-white/70 hover:bg-white/10"
                                                >
                                                    Export Presets
                                                </button>
                                                <button
                                                    data-testid="controls-presets-import"
                                                    onClick={() => {
                                                        const result = importControlsFxPresetsJson(controlsPresetJson, { replace: true });
                                                        if (!result?.ok) {
                                                            setControlsPresetStatus('Import failed: invalid JSON.');
                                                            return;
                                                        }
                                                        setControlsFxDraft(getControlsFxPreset(controlsSelectedId));
                                                        setControlsPresetStatus(`Imported ${result.count} preset(s).`);
                                                    }}
                                                    className="px-3 py-2 rounded-lg text-xs border transition-all bg-white/5 border-white/15 text-white/70 hover:bg-white/10"
                                                >
                                                    Import Presets
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 mt-2">
                                                <button
                                                    data-testid="controls-presets-reset-all"
                                                    onClick={() => {
                                                        resetAllControlsFxPresets();
                                                        setControlsFxDraft(getControlsFxPreset(controlsSelectedId));
                                                        setControlsPresetStatus('Reset all control presets.');
                                                    }}
                                                    className="px-3 py-2 rounded-lg text-xs border transition-all bg-white/5 border-white/15 text-white/70 hover:bg-white/10"
                                                >
                                                    Reset All Presets
                                                </button>
                                                <div className="rounded-lg px-3 py-2 text-[11px] text-white/70 font-mono bg-white/5 border border-white/10">
                                                    {controlsPresetStatus || 'No preset action yet.'}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="rounded-lg px-3 py-2 text-[11px] text-white/70 font-mono bg-white/5 border border-white/10 mb-2">
                                            UTC Violations: {utcViolations.length}
                                        </div>
                                        {utcViolations.slice(0, 5).map((v) => (
                                            <div key={v.violationKey} className="text-[10px] mb-1 rounded-md border border-red-400/30 bg-red-500/10 px-2 py-1.5 text-red-200/90">
                                                <div className="font-mono">{v.violationKey}</div>
                                                <div className="text-red-200/70">{v.reasons.join(', ')}</div>
                                            </div>
                                        ))}
                                    </>
                                )}

                                {universalPickerKind === 'plates' && (
                                    <>
                                        <div className="space-y-2 mb-3">
                                            <div className="rounded-lg px-3 py-2 text-[11px] text-white/70 font-mono bg-white/5 border border-white/10">
                                                Selected: {platesSelectedId || 'none'}
                                            </div>
                                        </div>

                                        <div className="border-t border-white/10 pt-3 mt-3 mb-3">
                                            <div className="text-[11px] text-white/80 font-semibold mb-2">Plates (Caption Tuner)</div>
                                            <button
                                                onClick={() => setPlatesFxEnabled(!platesFxEnabled)}
                                                disabled={!platesSelectedId}
                                                className={`w-full px-3 py-2 rounded-lg text-xs border transition-all ${platesFxEnabled ? 'bg-amber-500/20 text-amber-200 border-amber-400/50' : 'bg-white/5 text-white/70 border-white/15'} ${!platesSelectedId ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            >
                                                {platesFxEnabled ? 'Enable Selected Plate FX: ON' : 'Enable Selected Plate FX: OFF'}
                                            </button>

                                            <label className="flex items-center gap-2 text-xs text-white/70 mt-3">
                                                <input
                                                    type="checkbox"
                                                    checked={platesFxDraft.enabled}
                                                    disabled={!platesSelectedId}
                                                    onChange={(e) => {
                                                        const next = { ...platesFxDraft, enabled: e.target.checked };
                                                        setPlatesFxDraft(next);
                                                        if (platesSelectedId) setPlatesFxPreset(platesSelectedId, { enabled: e.target.checked });
                                                    }}
                                                    className="rounded border-white/20"
                                                />
                                                Enabled for this plate
                                            </label>

                                            <div className="grid grid-cols-3 gap-2 mt-3">
                                                <RangeControl
                                                    label="Border Thickness"
                                                    value={platesFxDraft.borderW}
                                                    min={1}
                                                    max={6}
                                                    step={0.5}
                                                    disabled={!platesSelectedId}
                                                    onChange={(v) => {
                                                        const next = { ...platesFxDraft, borderW: v };
                                                        setPlatesFxDraft(next);
                                                        if (platesSelectedId) setPlatesFxPreset(platesSelectedId, { borderW: v });
                                                    }}
                                                />
                                                <RangeControl
                                                    label="Speed"
                                                    value={platesFxDraft.speed}
                                                    min={1}
                                                    max={8}
                                                    step={0.5}
                                                    disabled={!platesSelectedId}
                                                    onChange={(v) => {
                                                        const next = { ...platesFxDraft, speed: v };
                                                        setPlatesFxDraft(next);
                                                        if (platesSelectedId) setPlatesFxPreset(platesSelectedId, { speed: v });
                                                    }}
                                                    suffix="s"
                                                />
                                                <RangeControl
                                                    label="Opacity"
                                                    value={platesFxDraft.opacity}
                                                    min={0}
                                                    max={1}
                                                    step={0.05}
                                                    disabled={!platesSelectedId}
                                                    onChange={(v) => {
                                                        const next = { ...platesFxDraft, opacity: v };
                                                        setPlatesFxDraft(next);
                                                        if (platesSelectedId) setPlatesFxPreset(platesSelectedId, { opacity: v });
                                                    }}
                                                />
                                            </div>

                                            <div className="space-y-2 mt-3">
                                                <div className="text-[10px] text-white/55">Color Mode</div>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <button
                                                        disabled={!platesSelectedId}
                                                        onClick={() => {
                                                            const next = { ...platesFxDraft, colorMode: 'stage' };
                                                            setPlatesFxDraft(next);
                                                            if (platesSelectedId) setPlatesFxPreset(platesSelectedId, { colorMode: 'stage' });
                                                        }}
                                                        className={`px-3 py-2 rounded-lg text-xs border transition-all ${platesFxDraft.colorMode === 'stage' ? 'bg-amber-500/25 text-amber-200 border-amber-400/60' : 'bg-white/5 text-white/70 border-white/15'} ${!platesSelectedId ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                    >
                                                        Stage Accent
                                                    </button>
                                                    <button
                                                        disabled={!platesSelectedId}
                                                        onClick={() => {
                                                            const next = { ...platesFxDraft, colorMode: 'custom' };
                                                            setPlatesFxDraft(next);
                                                            if (platesSelectedId) setPlatesFxPreset(platesSelectedId, { colorMode: 'custom' });
                                                        }}
                                                        className={`px-3 py-2 rounded-lg text-xs border transition-all ${platesFxDraft.colorMode === 'custom' ? 'bg-amber-500/25 text-amber-200 border-amber-400/60' : 'bg-white/5 text-white/70 border-white/15'} ${!platesSelectedId ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                    >
                                                        Custom
                                                    </button>
                                                </div>

                                                {platesFxDraft.colorMode === 'custom' && (
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <input
                                                            type="color"
                                                            value={platesFxDraft.color || '#FFD278'}
                                                            disabled={!platesSelectedId}
                                                            onChange={(e) => {
                                                                const value = e?.target?.value || null;
                                                                const next = { ...platesFxDraft, color: value };
                                                                setPlatesFxDraft(next);
                                                                if (platesSelectedId) setPlatesFxPreset(platesSelectedId, { color: value });
                                                            }}
                                                            className="h-8 w-12 p-0 border border-white/15 rounded"
                                                            style={{ background: 'transparent' }}
                                                        />
                                                        <span className="text-xs text-white/50 font-mono">{platesFxDraft.color || '#FFD278'}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </>
                                )}

                                {universalPickerKind === 'card' && (
                                    <>
                                        <div className="grid grid-cols-2 gap-2 mb-3">
                                            <button
                                                onClick={() => setCardApplyToAll(v => !v)}
                                                className={`px-3 py-2 rounded-lg text-xs border transition-all ${cardApplyToAll ? 'bg-cyan-500/25 text-cyan-200 border-cyan-400/60' : 'bg-white/5 text-white/70 border-white/15'}`}
                                            >
                                                {cardApplyToAll ? 'Apply to all: ON' : 'Apply to all: OFF'}
                                            </button>
                                            <div className="rounded-lg px-3 py-2 text-[11px] text-white/70 font-mono bg-white/5 border border-white/10">
                                                Selected: {cardState.hasSelected ? (cardState.selectedCardId || cardState.selectedLabel || 'card') : 'none'}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <RangeControl label="Tint H" value={activeDraft.cardTintH} min={0} max={360} step={1} disabled={selectedDisabled} onChange={(v) => onChangeCardSetting('cardTintH', v)} />
                                            <RangeControl label="Tint S" value={activeDraft.cardTintS} min={0} max={100} step={1} suffix="%" disabled={selectedDisabled} onChange={(v) => onChangeCardSetting('cardTintS', v)} />
                                            <RangeControl label="Tint L" value={activeDraft.cardTintL} min={0} max={100} step={1} suffix="%" disabled={selectedDisabled} onChange={(v) => onChangeCardSetting('cardTintL', v)} />
                                            <RangeControl label="Alpha" value={activeDraft.cardAlpha} min={0} max={1} step={0.01} disabled={selectedDisabled} onChange={(v) => onChangeCardSetting('cardAlpha', v)} />
                                            <RangeControl label="Border A" value={activeDraft.cardBorderAlpha} min={0} max={1} step={0.01} disabled={selectedDisabled} onChange={(v) => onChangeCardSetting('cardBorderAlpha', v)} />
                                            <RangeControl label="Blur" value={activeDraft.cardBlur} min={0} max={60} step={1} suffix="px" disabled={selectedDisabled} onChange={(v) => onChangeCardSetting('cardBlur', v)} />
                                        </div>
                                    </>
                                )}

                            </>
                        )}
                    </Section>

                    {/* ═══════════════════════════════════════════════════════════════ */}
                    {/* UI PLAYGROUND SECTION */}
                    {/* ═══════════════════════════════════════════════════════════════ */}
                    <Section
                        title="Card Styling Tuner"
                        expanded={expandedSections.cardTuner}
                        onToggle={() => toggleSection('cardTuner')}
                        isLight={isLight}
                    >
                        {!devtoolsEnabled ? (
                            <div className="text-xs text-white/50">Locked</div>
                        ) : (
                            <>
                                <div className="text-[10px] text-white/50 mb-2">
                                    Pick a <span className="font-mono">data-card="true"</span> target and tune vars live.
                                </div>
                                {!legacyPickersEnabled && (
                                    <div className="text-[10px] text-white/45 mb-2">
                                        Legacy pick controls hidden. Use <span className="font-mono">Inspector (NEW)</span> to pick targets.
                                    </div>
                                )}
                                <div className={`grid ${legacyPickersEnabled ? 'grid-cols-2' : 'grid-cols-1'} gap-2 mb-3`}>
                                    {legacyPickersEnabled && (
                                        <button
                                            onClick={() => (cardState.pickMode ? handleStopPickFlow() : handleStartPickFlow())}
                                            className={`px-3 py-2 rounded-lg text-xs border transition-all ${cardState.pickMode ? 'bg-amber-500/25 text-amber-200 border-amber-400/60' : 'bg-white/5 text-white/70 border-white/15'}`}
                                        >
                                            {cardState.pickMode ? 'Stop Picking' : 'Pick Card'}
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setCardApplyToAll(v => !v)}
                                        className={`px-3 py-2 rounded-lg text-xs border transition-all ${cardApplyToAll ? 'bg-cyan-500/25 text-cyan-200 border-cyan-400/60' : 'bg-white/5 text-white/70 border-white/15'}`}
                                    >
                                        {cardApplyToAll ? 'Apply to all: ON' : 'Apply to all: OFF'}
                                    </button>
                                </div>
                                {legacyPickersEnabled && (
                                    <div className="grid grid-cols-2 gap-2 mb-3">
                                        <button
                                            onClick={handleTogglePeek}
                                            className="rounded-lg px-3 py-2 text-xs bg-white/5 border border-white/15 text-white/70 hover:bg-white/10 transition-all"
                                        >
                                            Peek UI
                                        </button>
                                        <button
                                            onClick={handleConfirmPickFlow}
                                            disabled={!cardState.pickMode}
                                            className={`rounded-lg px-3 py-2 text-xs transition-all ${cardState.pickMode
                                                ? 'bg-amber-500/20 border border-amber-400/50 text-amber-200'
                                                : 'bg-white/5 border border-white/10 text-white/35 cursor-not-allowed'
                                                }`}
                                        >
                                            Confirm Pick
                                        </button>
                                    </div>
                                )}
                                <div className="mb-3 text-[11px] text-white/70 font-mono bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                                    Selected: {cardState.hasSelected ? (cardState.selectedCardId || cardState.selectedLabel || 'card') : 'none'}
                                </div>
                                <div className="text-[10px] text-white/50 mb-3">
                                    Quick peek shortcut: <span className="font-mono text-white/80">Ctrl+Alt+Shift+K</span>
                                </div>

                                <div className="space-y-2 mb-3">
                                    <RangeControl label="Tint H" value={activeDraft.cardTintH} min={0} max={360} step={1} disabled={selectedDisabled} onChange={(v) => onChangeCardSetting('cardTintH', v)} />
                                    <RangeControl label="Tint S" value={activeDraft.cardTintS} min={0} max={100} step={1} suffix="%" disabled={selectedDisabled} onChange={(v) => onChangeCardSetting('cardTintS', v)} />
                                    <RangeControl label="Tint L" value={activeDraft.cardTintL} min={0} max={100} step={1} suffix="%" disabled={selectedDisabled} onChange={(v) => onChangeCardSetting('cardTintL', v)} />
                                    <RangeControl label="Alpha" value={activeDraft.cardAlpha} min={0} max={1} step={0.01} disabled={selectedDisabled} onChange={(v) => onChangeCardSetting('cardAlpha', v)} />
                                    <RangeControl label="Border A" value={activeDraft.cardBorderAlpha} min={0} max={1} step={0.01} disabled={selectedDisabled} onChange={(v) => onChangeCardSetting('cardBorderAlpha', v)} />
                                    <RangeControl label="Blur" value={activeDraft.cardBlur} min={0} max={60} step={1} suffix="px" disabled={selectedDisabled} onChange={(v) => onChangeCardSetting('cardBlur', v)} />
                                </div>

                                <div className="border-t border-white/10 pt-3 mt-3 mb-3">
                                    <div className="text-[11px] text-white/80 font-semibold mb-2">FX: Selected Card Electric Border</div>
                                    <button
                                        onClick={() => setCardElectricBorderEnabled(!cardElectricBorderEnabled)}
                                        disabled={!cardState.hasSelected}
                                        className={`w-full px-3 py-2 rounded-lg text-xs border transition-all ${cardElectricBorderEnabled ? 'bg-amber-500/20 text-amber-200 border-amber-400/50' : 'bg-white/5 text-white/70 border-white/15'} ${!cardState.hasSelected ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        {cardElectricBorderEnabled ? 'Enable Selected Card FX: ON' : 'Enable Selected Card FX: OFF'}
                                    </button>
                                    <div className="text-[10px] text-white/45 mt-2">
                                        Target: current <span className="font-mono">selectedCardId</span>
                                    </div>
                                </div>

                                <div className="border-t border-white/10 pt-3 mt-3 mb-3">
                                    <div className="text-[11px] text-white/80 font-semibold mb-2">FX: Practice Button Electric Border</div>
                                    <button
                                        onClick={() => setPracticeButtonFxEnabled(!practiceButtonFxEnabled)}
                                        className={`w-full px-3 py-2 rounded-lg text-xs border transition-all ${practiceButtonFxEnabled ? 'bg-cyan-500/20 text-cyan-200 border-cyan-400/50' : 'bg-white/5 text-white/70 border-white/15'}`}
                                    >
                                        {practiceButtonFxEnabled ? 'Enable Practice Button FX: ON' : 'Enable Practice Button FX: OFF'}
                                    </button>
                                    <div className="grid grid-cols-2 gap-2 mt-2">
                                    {legacyPickersEnabled && (
                                        <button
                                            onClick={() => setPracticeButtonPickMode((v) => {
                                                const next = !v;
                                                if (next) {
                                                    // Conflict prevention: never allow two global capture listeners at once.
                                                    stopUniversalPickCaptureImmediate();
                                                    setUniversalPickMode(false);
                                                    setPickMode(false);
                                                    setPeekMode(false);
                                                }
                                                return next;
                                            })}
                                            className={`px-3 py-2 rounded-lg text-xs border transition-all ${practiceButtonPickMode ? 'bg-amber-500/25 text-amber-200 border-amber-400/60' : 'bg-white/5 text-white/70 border-white/15'}`}
                                        >
                                            {practiceButtonPickMode ? 'Stop Picking' : 'Pick Button'}
                                        </button>
                                    )}
                                        <button
                                            onClick={() => setPracticeButtonApplyToAll(v => !v)}
                                            className={`px-3 py-2 rounded-lg text-xs border transition-all ${practiceButtonApplyToAll ? 'bg-cyan-500/25 text-cyan-200 border-cyan-400/60' : 'bg-white/5 text-white/70 border-white/15'}`}
                                        >
                                            {practiceButtonApplyToAll ? 'Apply to all: ON' : 'Apply to all: OFF'}
                                        </button>
                                    </div>
                                    <div className="mt-2 text-[11px] text-white/70 font-mono bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                                        Selected: {practiceButtonSelectedKey || 'none'}
                                    </div>
                                    <div className="text-[10px] text-white/45 mt-2">
                                        Targets: <span className="font-mono">data-ui=&quot;practice-button&quot;</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 mb-2">
                                    <DevButton onClick={() => saveGlobal(globalDraft)}>Save Global</DevButton>
                                    <button
                                        onClick={() => saveSelected(selectedDraft)}
                                        disabled={!cardState.hasSelected || !cardState.selectedCardId}
                                        className={`rounded-lg px-3 py-2 text-xs transition-all ${(!cardState.hasSelected || !cardState.selectedCardId) ? 'bg-white/5 text-white/30 border border-white/10 cursor-not-allowed' : 'bg-white/5 hover:bg-white/10 border border-white/10 text-white/70'}`}
                                    >
                                        Save Selected
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 gap-2 mb-2">
                                    <DevButton onClick={resetGlobal}>Reset Global</DevButton>
                                    <button
                                        onClick={resetSelected}
                                        disabled={!cardState.hasSelected}
                                        className={`rounded-lg px-3 py-2 text-xs transition-all ${!cardState.hasSelected ? 'bg-white/5 text-white/30 border border-white/10 cursor-not-allowed' : 'bg-white/5 hover:bg-white/10 border border-white/10 text-white/70'}`}
                                    >
                                        Reset Selected
                                    </button>
                                </div>
                                <button
                                    onClick={clearAll}
                                    className="w-full rounded-lg px-3 py-2 text-xs bg-red-500/10 border border-red-500/30 text-red-400/70 hover:bg-red-500/20 transition-all"
                                >
                                    Clear All
                                </button>
                            </>
                        )}
                    </Section>

                    <Section
                        title="Navigation Button FX Tuner"
                        expanded={expandedSections.navBtnTuner}
                        onToggle={() => toggleSection('navBtnTuner')}
                        isLight={isLight}
                    >
                        {!devtoolsEnabled ? (
                            <div className="text-xs text-white/50">Locked</div>
                        ) : (
                            <>
                                <div className="text-[10px] text-white/50 mb-2">
                                    Targets <span className="font-mono">.im-nav-btn</span> only. Uses <span className="font-mono">--nav-btn-*</span> tokens.
                                </div>
                                <button
                                    onClick={() => setNavBtnProbeEnabled(v => !v)}
                                    className={`w-full mb-2 px-3 py-2 rounded-lg text-xs border transition-all ${navBtnProbeEnabled ? 'bg-fuchsia-500/15 text-fuchsia-200 border-fuchsia-400/60' : 'bg-white/5 text-white/70 border-white/15'}`}
                                >
                                    {navBtnProbeEnabled ? 'Nav Button Probe: ON' : 'Nav Button Probe: OFF'}
                                </button>
                                <button
                                    onClick={() => setNavButtonTunerEnabled(!navBtnState.enabled)}
                                    className={`w-full mb-3 px-3 py-2 rounded-lg text-xs border transition-all ${navBtnState.enabled ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/60' : 'bg-white/5 text-white/70 border-white/15'}`}
                                >
                                    {navBtnState.enabled ? 'Nav Button Tuner: ON' : 'Nav Button Tuner: OFF'}
                                </button>

                                <div className="space-y-3">
                                    <div className="grid grid-cols-1 gap-2">
                                        <TextControl
                                            label="Border color"
                                            value={navBtnDraft.navBtnBorder}
                                            onChange={(v) => onChangeNavBtnSetting('navBtnBorder', v)}
                                            disabled={!navBtnState.enabled}
                                            placeholder="e.g. var(--accent-30) or rgba(255,255,255,0.2)"
                                        />
                                        <TextControl
                                            label="Text color"
                                            value={navBtnDraft.navBtnTextColor}
                                            onChange={(v) => onChangeNavBtnSetting('navBtnTextColor', v)}
                                            disabled={!navBtnState.enabled}
                                            placeholder="e.g. var(--accent-color)"
                                        />
                                        <TextControl
                                            label="Background RGB"
                                            value={navBtnDraft.navBtnBg}
                                            onChange={(v) => onChangeNavBtnSetting('navBtnBg', v)}
                                            disabled={!navBtnState.enabled}
                                            placeholder="e.g. 255, 255, 255"
                                        />
                                    </div>
                                    <RangeControl
                                        label="Transparency"
                                        value={navBtnDraft.navBtnOpacity}
                                        min={0}
                                        max={1}
                                        step={0.02}
                                        onChange={(v) => onChangeNavBtnSetting('navBtnOpacity', v)}
                                        disabled={!navBtnState.enabled}
                                    />
                                    <RangeControl
                                        label="Background alpha"
                                        value={navBtnDraft.navBtnBgAlpha}
                                        min={0}
                                        max={0.3}
                                        step={0.01}
                                        onChange={(v) => onChangeNavBtnSetting('navBtnBgAlpha', v)}
                                        disabled={!navBtnState.enabled}
                                    />
                                    <RangeControl
                                        label="Stroke thickness"
                                        value={navBtnDraft.navBtnBorderWidth}
                                        min={0}
                                        max={4}
                                        step={0.25}
                                        onChange={(v) => onChangeNavBtnSetting('navBtnBorderWidth', v)}
                                        disabled={!navBtnState.enabled}
                                        suffix="px"
                                    />
                                    <RangeControl
                                        label="Stroke glow"
                                        value={navBtnDraft.navBtnGlow}
                                        min={0}
                                        max={60}
                                        step={1}
                                        onChange={(v) => onChangeNavBtnSetting('navBtnGlow', v)}
                                        disabled={!navBtnState.enabled}
                                        suffix="px"
                                    />
                                    <RangeControl
                                        label="Blur"
                                        value={navBtnDraft.navBtnBackdropBlur}
                                        min={0}
                                        max={20}
                                        step={1}
                                        onChange={(v) => onChangeNavBtnSetting('navBtnBackdropBlur', v)}
                                        disabled={!navBtnState.enabled}
                                        suffix="px"
                                    />
                                    <RangeControl
                                        label="Text glow"
                                        value={navBtnDraft.navBtnTextGlow}
                                        min={0}
                                        max={60}
                                        step={1}
                                        onChange={(v) => onChangeNavBtnSetting('navBtnTextGlow', v)}
                                        disabled={!navBtnState.enabled}
                                        suffix="px"
                                    />
                                    <RangeControl
                                        label="Hover intensity"
                                        value={navBtnDraft.navBtnHoverIntensity}
                                        min={0}
                                        max={1.5}
                                        step={0.05}
                                        onChange={(v) => onChangeNavBtnSetting('navBtnHoverIntensity', v)}
                                        disabled={!navBtnState.enabled}
                                    />
                                </div>

                                <button
                                    onClick={() => {
                                        resetNavButtonSettings();
                                    }}
                                    disabled={!navBtnState.enabled}
                                    className={`w-full mt-3 rounded-lg px-3 py-2 text-xs transition-all ${!navBtnState.enabled ? 'bg-white/5 text-white/30 border border-white/10 cursor-not-allowed' : 'bg-white/5 hover:bg-white/10 border border-white/10 text-white/70'}`}
                                >
                                    Reset Nav Button FX
                                </button>
                            </>
                        )}
                    </Section>

                    <Section
                        title="UI Playground"
                        expanded={expandedSections.playground}
                        onToggle={() => toggleSection('playground')}
                        isLight={isLight}
                    >
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-xs opacity-70" style={{ color: isLight ? 'rgba(60, 50, 40, 0.75)' : 'rgba(255, 255, 255, 0.7)' }}>
                                Launcher <span className="font-mono text-[10px] opacity-80">BUILD_PROBE</span>
                            </span>
                            {!isPlaygroundPath ? (
                                <button
                                    onClick={handleOpenPlayground}
                                    className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border"
                                    style={{
                                        background: isLight ? 'rgba(180, 155, 110, 0.12)' : 'rgba(255, 255, 255, 0.06)',
                                        color: isLight ? 'rgba(60, 50, 40, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                                        borderColor: isLight ? 'rgba(180, 155, 110, 0.35)' : 'rgba(255, 255, 255, 0.22)',
                                    }}
                                >
                                    Open Playground
                                </button>
                            ) : (
                                <button
                                    onClick={handleBackFromPlayground}
                                    className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border"
                                    style={{
                                        background: isLight ? 'rgba(180, 155, 110, 0.12)' : 'rgba(255, 255, 255, 0.06)',
                                        color: isLight ? 'rgba(60, 50, 40, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                                        borderColor: isLight ? 'rgba(180, 155, 110, 0.35)' : 'rgba(255, 255, 255, 0.22)',
                                    }}
                                >
                                    Back
                                </button>
                            )}
                        </div>
                    </Section>

                    {/* ═══════════════════════════════════════════════════════════════ */}
                    {/* CURRICULUM SIMULATION SECTION */}
                    {/* ═══════════════════════════════════════════════════════════════ */}
                    <CurriculumSection
                        expanded={expandedSections.curriculum}
                        onToggle={() => toggleSection('curriculum')}
                        armed={armed}
                        handleDestructive={handleDestructive}
                        isLight={isLight}
                    />

                    {/* ═══════════════════════════════════════════════════════════════ */}
                    {/* TRACKINGHUB SECTION */}
                    {/* ═══════════════════════════════════════════════════════════════ */}
                    <TrackingHubSection
                        expanded={expandedSections.tracking}
                        onToggle={() => toggleSection('tracking')}
                        isLight={isLight}
                    />

                    {/* ═══════════════════════════════════════════════════════════════ */}
                    {/* REPORTING LAYER TEST SECTION */}
                    {/* ═══════════════════════════════════════════════════════════════ */}
                    <Section
                        title="Reporting Layer (Dashboard Queries)"
                        expanded={expandedSections.reporting || false}
                        onToggle={() => toggleSection('reporting')}
                        isLight={isLight}
                    >
                        <div className="text-[10px] text-white/50 mb-3">Pure reporting queries for dashboard metrics</div>

                        {/* Test lifetime scope */}
                        <div className="mb-4 bg-white/5 rounded-lg p-3">
                            <div className="text-xs text-white/80 font-mono mb-2">lifetime scope:</div>
                            {(() => {
                                try {
                                    const tiles = getQuickDashboardTiles({ scope: 'lifetime', range: '365d' });
                                    return (
                                        <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                                            <div className="bg-white/5 p-1.5 rounded">
                                                Minutes: <span className="text-emerald-300">{tiles.minutes}</span>
                                            </div>
                                            <div className="bg-white/5 p-1.5 rounded">
                                                Sessions: <span className="text-emerald-300">{tiles.sessionCount}</span>
                                            </div>
                                            <div className="bg-white/5 p-1.5 rounded">
                                                Days: <span className="text-emerald-300">{tiles.activeDays}</span>
                                            </div>
                                            <div className="bg-white/5 p-1.5 rounded">
                                                Complete: <span className="text-emerald-300">{tiles.completionRate}%</span>
                                            </div>
                                        </div>
                                    );
                                } catch (e) {
                                    return <div className="text-red-300 text-[10px]">Error: {e.message}</div>;
                                }
                            })()}
                        </div>

                        {/* Test runId scope */}
                        <div className="mb-4 bg-white/5 rounded-lg p-3">
                            <div className="text-xs text-white/80 font-mono mb-2">runId scope (active path):</div>
                            {(() => {
                                try {
                                    const tiles = getQuickDashboardTiles({ scope: 'runId', range: 'all' });
                                    return (
                                        <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                                            <div className="bg-white/5 p-1.5 rounded">
                                                Minutes: <span className="text-sky-300">{tiles.minutes}</span>
                                            </div>
                                            <div className="bg-white/5 p-1.5 rounded">
                                                Sessions: <span className="text-sky-300">{tiles.sessionCount}</span>
                                            </div>
                                            <div className="bg-white/5 p-1.5 rounded">
                                                Days: <span className="text-sky-300">{tiles.activeDays}</span>
                                            </div>
                                            <div className="bg-white/5 p-1.5 rounded">
                                                Complete: <span className="text-sky-300">{tiles.completionRate}%</span>
                                            </div>
                                        </div>
                                    );
                                } catch (e) {
                                    return <div className="text-red-300 text-[10px]">Error: {e.message}</div>;
                                }
                            })()}
                        </div>

                        {/* Practice breakdown */}
                        <div className="bg-white/5 rounded-lg p-3 mb-4">
                            <div className="text-xs text-white/80 font-mono mb-2">Practice breakdown (lifetime):</div>
                            {(() => {
                                try {
                                    const breakdown = getCurriculumPracticeBreakdown({ scope: 'lifetime', range: '365d' });
                                    if (breakdown.length === 0) {
                                        return <div className="text-white/40 text-[10px]">No sessions recorded</div>;
                                    }
                                    return (
                                        <div className="space-y-1">
                                            {breakdown.map(item => (
                                                <div key={item.familyKey} className="flex justify-between text-[10px] text-white/70 font-mono">
                                                    <span>{item.label}:</span>
                                                    <span className="text-white/90">{item.minutes}m ({item.count} sessions, {item.percent}%)</span>
                                                </div>
                                            ))}
                                        </div>
                                    );
                                } catch (e) {
                                    return <div className="text-red-300 text-[10px]">Error: {e.message}</div>;
                                }
                            })()}
                        </div>

                        {/* Breathwork detail metrics */}
                        <div className="bg-white/5 rounded-lg p-3">
                            <div className="text-xs text-white/80 font-mono mb-2">Breathwork detail (lifetime):</div>
                            {(() => {
                                try {
                                    const detail = getPracticeDetailMetrics({ scope: 'lifetime', range: '365d', practiceFamily: 'breathwork' });
                                    if (!detail || detail.sessionCount === 0) {
                                        return <div className="text-white/40 text-[10px]">No breathwork sessions</div>;
                                    }
                                    return (
                                        <div className="space-y-1 text-[10px] text-white/70 font-mono">
                                            <div>Minutes: <span className="text-white/90">{detail.totalMinutes}m</span></div>
                                            <div>Sessions: <span className="text-white/90">{detail.sessionCount}</span></div>
                                            <div>Avg Duration: <span className="text-white/90">{detail.avgDurationMin}m</span></div>
                                            <div>Completion: <span className="text-white/90">{detail.completionRate}%</span></div>
                                            <div>On-time: <span className="text-white/90">{detail.adherencePercent}%</span></div>
                                        </div>
                                    );
                                } catch (e) {
                                    return <div className="text-red-300 text-[10px]">Error: {e.message}</div>;
                                }
                            })()}
                        </div>
                    </Section>

                    {/* ═══════════════════════════════════════════════════════════════ */}
                    {/* TUTORIAL TOOLS SECTION */}
                    {/* ═══════════════════════════════════════════════════════════════ */}
                    <Section
                        title="Tutorial Tools"
                        expanded={expandedSections.tutorialTools || false}
                        onToggle={() => toggleSection('tutorialTools')}
                        isLight={isLight}
                    >
                        <div className="flex items-center justify-between mb-4 bg-white/5 rounded-lg px-3 py-2">
                            <div className="flex flex-col">
                                <span className="text-xs text-white/90">Tutorial Admin Mode</span>
                                <span className="text-[10px] text-white/40">Enable tutorial edit controls</span>
                            </div>
                            <button
                                onClick={handleTutorialAdminToggle}
                                className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${isTutorialAdminOn
                                    ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50'
                                    : 'bg-white/5 text-white/50 border border-white/10'
                                    }`}
                            >
                                {isTutorialAdminOn ? 'ON' : 'OFF'}
                            </button>
                        </div>

                        <div className="flex items-center justify-between mb-4 bg-white/5 rounded-lg px-3 py-2">
                            <div className="flex flex-col">
                                <span className="text-xs text-white/90">Coordinate Helper</span>
                                <span className="text-[10px] text-white/40">Tutorial Pick mode for anchors</span>
                            </div>
                            <button
                                onClick={() => setCoordinateHelper(!showCoordinateHelper)}
                                className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${showCoordinateHelper
                                    ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/50'
                                    : 'bg-white/5 text-white/50 border border-white/10'
                                    }`}
                            >
                                {showCoordinateHelper ? 'ACTIVE' : 'OFF'}
                            </button>
                        </div>

                        {/* Anchor count readout */}
                        <div className="text-[10px] text-white/40 mb-4 px-3">
                            Anchors in DOM: <TutorialAnchorCountReadout />
                        </div>

                        {/* CoordinateHelper UI - Tutorial Pick mode */}
                        {showCoordinateHelper && <CoordinateHelper />}

                        {/* Tutorial Script Editor */}
                        <div className="mt-4">
                            <TutorialEditor />
                        </div>
                    </Section>

                    {/* ═══════════════════════════════════════════════════════════════ */}
                    {/* BREATHING RING LAB (Code-Split, Lazy-Loaded) */}
                    {/* ═══════════════════════════════════════════════════════════════ */}
                    <Section
                        title="🔵 Breathing Ring Lab (Phase 1)"
                        expanded={expandedSections.bloomRingLab}
                        onToggle={() => toggleSection('bloomRingLab')}
                        isLight={isLight}
                    >
                        <Suspense fallback={
                            <div className="text-xs text-white/40 py-2">
                                Loading lab...
                            </div>
                        }>
                            <BloomRingLab isLight={isLight} />
                        </Suspense>
                    </Section>

                    {/* ═══════════════════════════════════════════════════════════════ */}
                    {/* DESIGN & DIAGNOSTIC SECTION */}
                    {/* ═══════════════════════════════════════════════════════════════ */}
                    <Section
                        title="Design & Diagnostic"
                        expanded={expandedSections.design || false}
                        onToggle={() => toggleSection('design')}
                        isLight={isLight}
                    >
                        {/* Photonic Beginner Guide */}
                        <div className="mb-3">
                            <button
                                onClick={() => {
                                    if (photic.beginnerMode) {
                                        setPhoticSetting('beginnerMode', false);
                                        setPhoticSetting('activeGuideStep', null);
                                    } else {
                                        setPhoticSetting('beginnerMode', true);
                                        setPhoticSetting('activeGuideStep', 'protocol');
                                        useTutorialStore.getState().openTutorial('page:photic-beginner');
                                    }
                                }}
                                style={{
                                    width: '100%',
                                    padding: '6px 10px',
                                    fontSize: '11px',
                                    borderRadius: '6px',
                                    border: '1px solid var(--accent-25)',
                                    background: photic.beginnerMode ? 'var(--accent)' : 'transparent',
                                    color: photic.beginnerMode ? '#000' : 'var(--text-muted)',
                                    cursor: 'pointer',
                                    fontFamily: 'var(--font-display)',
                                    fontWeight: 600,
                                    transition: 'all 200ms ease',
                                }}
                            >
                                {photic.beginnerMode ? 'End Beginner Guide' : 'Start Beginner Guide'}
                            </button>
                        </div>
                    </Section>

                    {/* ═══════════════════════════════════════════════════════════════ */}
                    {/* DATA SECTION */}
                    {/* ═══════════════════════════════════════════════════════════════ */}
                    <Section
                        title="Data Management"
                        expanded={expandedSections.data}
                        onToggle={() => toggleSection('data')}
                        isLight={isLight}
                    >
                        <div className="grid grid-cols-2 gap-2 mb-3">
                            <DevButton onClick={openInspector}>Inspect Stores</DevButton>
                            <DevButton onClick={() => {
                                const data = devHelpers.getStoreSnapshot();
                                console.log('Store Snapshot:', data);
                                navigator.clipboard?.writeText(JSON.stringify(data, null, 2));
                            }}>Copy to Clipboard</DevButton>
                        </div>

                        {/* Reset all (destructive) */}
                        <DestructiveButton
                            label="Reset ALL Stores"
                            armed={armed === 'all'}
                            onArm={() => handleDestructive('all', devHelpers.resetAllStores)}
                        />
                    </Section>

                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-[#0a0a12] border-t border-white/10 px-4 py-2 text-center text-[10px] text-white/30">
                    Dev Panel • Ctrl+Shift+D to toggle
                </div>
            </div>

            {/* Inspector Modal */}
            {inspectorOpen && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/80" onClick={() => setInspectorOpen(false)} />
                    <div className="relative bg-[#0a0a12] border border-white/20 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                            <span className="text-sm font-semibold text-white/90">Store Inspector</span>
                            <button
                                onClick={() => setInspectorOpen(false)}
                                className="text-white/50 hover:text-white"
                            >✕</button>
                        </div>
                        <pre className="p-4 text-xs text-white/70 overflow-auto max-h-[60vh] font-mono">
                            {JSON.stringify(storeSnapshot, null, 2)}
                        </pre>
                    </div>
                </div>
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

function TrackingHubSection({ expanded, onToggle, isLight = false }) {
    const { sessions } = useProgressStore();
    const [selectedPattern, setSelectedPattern] = useState('dedicated');

    const injectMockData = (patternKey) => {
        const pattern = MOCK_PATTERNS[patternKey];
        const mockSessions = [
            ...generateMockSessions('breathwork', pattern.breathwork),
            ...generateMockSessions('visualization', pattern.visualization),
            ...generateMockSessions('wisdom', pattern.wisdom)
        ];

        // Inject into store (this will overwrite existing sessions)
        const newestDateKey = mockSessions.length > 0 ? getNewestDateKey(mockSessions) : null;
        useProgressStore.setState((state) => ({
            sessions: mockSessions,
            ...(newestDateKey ? { streak: { ...state.streak, lastPracticeDate: newestDateKey } } : {})
        }));
        console.log(`✅ Injected ${mockSessions.length} mock sessions (${pattern.label})`);
    };

    const clearMockData = () => {
        const realSessions = sessions.filter(s => !s.metadata?.mock);
        useProgressStore.setState({ sessions: realSessions });
        console.log('🗑️ Cleared all mock data');
    };

    // TRAJECTORY MOCK DATA GENERATION
    const injectTrajectoryData = (pattern) => {
        const mockSessions = [];
        const now = Date.now();
        const weeksToGenerate = 8;

        // Pattern configurations
        const patterns = {
            ascending: {
                label: 'Ascending (Improving)',
                daysPerWeek: (week) => Math.min(3 + Math.floor(week * 0.5), 7), // 3 days → 6-7 days
                precision: (week) => 0.6 + (week * 0.04), // 60% → 90%+
            },
            steady: {
                label: 'Steady (Consistent)',
                daysPerWeek: () => 5, // Consistent 5 days/week
                precision: () => 0.75 + (Math.random() * 0.1 - 0.05), // 70-80% with variation
            },
            declining: {
                label: 'Declining (Falling Off)',
                daysPerWeek: (week) => Math.max(6 - Math.floor(week * 0.6), 2), // 6 days → 2 days
                precision: (week) => Math.max(0.85 - (week * 0.05), 0.4), // 85% → 45%
            },
        };

        const config = patterns[pattern];

        // Generate sessions for each week
        for (let weekOffset = weeksToGenerate - 1; weekOffset >= 0; weekOffset--) {
            const daysThisWeek = config.daysPerWeek(weeksToGenerate - weekOffset - 1);
            const msPerDay = 24 * 60 * 60 * 1000;
            const weekStartMs = now - (weekOffset * 7 * msPerDay);

            // Randomize which days of the week
            const daysOfWeek = [0, 1, 2, 3, 4, 5, 6];
            const selectedDays = daysOfWeek.sort(() => Math.random() - 0.5).slice(0, daysThisWeek);

            selectedDays.forEach((dayOfWeek) => {
                const sessionDate = new Date(weekStartMs + (dayOfWeek * msPerDay));
                const dateKey = sessionDate.toISOString().split('T')[0];
                const precisionValue = Math.min(Math.max(config.precision(weeksToGenerate - weekOffset - 1), 0), 1);

                // Random time variation (11am - 2pm)
                const targetTime = new Date(sessionDate);
                targetTime.setHours(12, 0, 0, 0);
                const offsetSeconds = (Math.random() * 120 - 60) * (1 - precisionValue * 0.5); // More variance when precision is low
                const actualTime = new Date(targetTime.getTime() + offsetSeconds * 1000);

                const duration = 10 + Math.floor(Math.random() * 5); // 10-15 minutes
                const totalCycles = Math.floor(duration * 6); // ~6 cycles per minute
                const accurateCycles = Math.floor(totalCycles * precisionValue);

                mockSessions.push({
                    id: `traj_mock_${sessionDate.getTime()}_${Math.random().toString(36).substr(2, 9)}`,
                    dateKey,
                    timestamp: actualTime.getTime(),
                    practiceType: 'breath',
                    practiceFamily: 'attention',
                    scheduledTime: '12:00',
                    actualTime: actualTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
                    duration,
                    durationMs: duration * 60 * 1000,
                    exitType: Math.random() > 0.1 ? 'completed' : 'early_exit',
                    completionRatio: Math.random() > 0.1 ? 1 : 0.7 + Math.random() * 0.2,
                    precision: {
                        breath: {
                            rhythmAccuracy: precisionValue,
                            totalCycles,
                            accurateCycles,
                            avgDeviation: Math.abs(offsetSeconds),
                        },
                    },
                    pauseCount: Math.floor(Math.random() * 2),
                    pauseTotalMs: Math.floor(Math.random() * 30000),
                    aliveSignalCount: totalCycles,
                    circuitExercises: null,
                    metadata: { mock: true, trajectoryPattern: pattern },
                });
            });
        }

        // Inject into progressStore (not trackingStore - which is dev-only)
        useProgressStore.setState({ sessions: mockSessions });
        console.log(`✅ Injected ${mockSessions.length} trajectory sessions (${config.label}) over ${weeksToGenerate} weeks`);
    };

    const clearTrajectoryData = () => {
        const realSessions = sessions.filter(s => !s.metadata?.mock);
        useProgressStore.setState({ sessions: realSessions });
        console.log('🗑️ Cleared trajectory mock data');
    };

    const trajectorySessions = sessions.filter(s => s.metadata?.trajectoryPattern);
    const trajectoryTotalCount = trajectorySessions.length;
    const trajectoryMockCount = trajectorySessions.filter(s => s.metadata?.mock).length;
    const mockSessionCount = sessions.filter(s => s.metadata?.mock).length;
    const totalSessionCount = sessions.length;

    return (
        <Section
            title="TrackingHub Mock Data"
            expanded={expanded}
            onToggle={onToggle}
            isLight={isLight}
        >
            {/* TRAJECTORY SECTION */}
            <div className="mb-6 pb-4 border-b border-white/10">
                <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{
                    color: isLight ? 'rgba(60, 50, 40, 0.7)' : 'rgba(255, 255, 255, 0.5)'
                }}>
                    📈 Trajectory (8 Weeks)
                </div>

                {/* Session counts */}
                <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                    <div className="bg-white/5 rounded-lg px-3 py-2">
                        <div className="text-white/40">Total Sessions</div>
                        <div className="text-white/90 font-mono">{trajectoryTotalCount}</div>
                    </div>
                    <div className="bg-white/5 rounded-lg px-3 py-2">
                        <div className="text-white/40">Mock Sessions</div>
                        <div className="text-white/90 font-mono">{trajectoryMockCount}</div>
                    </div>
                </div>

                {/* Pattern injection buttons */}
                <div className="space-y-2 mb-3">
                    {['ascending', 'steady', 'declining'].map((key) => (
                        <button
                            key={key}
                            onClick={() => injectTrajectoryData(key)}
                            className="w-full text-left px-3 py-2 rounded-lg text-xs transition-all bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/90 border border-white/10 hover:border-white/20"
                        >
                            {key === 'ascending' ? '↑ Ascending (Improving)' :
                                key === 'steady' ? '→ Steady (Consistent)' :
                                    '↓ Declining (Falling Off)'}
                        </button>
                    ))}
                </div>

                {/* Clear button */}
                <button
                    onClick={clearTrajectoryData}
                    className="w-full px-3 py-2 rounded-lg text-xs bg-red-500/10 border border-red-500/30 text-red-400/70 hover:bg-red-500/20 transition-all"
                >
                    🗑️ Clear Trajectory Data
                </button>
            </div>

            {/* PROGRESS STORE SECTION */}
            <div>
                <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{
                    color: isLight ? 'rgba(60, 50, 40, 0.7)' : 'rgba(255, 255, 255, 0.5)'
                }}>
                    📊 Progress Stats (Legacy)
                </div>

                {/* Session counts */}
                <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
                    <div className="bg-white/5 rounded-lg px-3 py-2">
                        <div className="text-white/40">Total Sessions</div>
                        <div className="text-white/90 font-mono">{totalSessionCount}</div>
                    </div>
                    <div className="bg-white/5 rounded-lg px-3 py-2">
                        <div className="text-white/40">Mock Sessions</div>
                        <div className="text-white/90 font-mono">{mockSessionCount}</div>
                    </div>
                </div>

                {/* Pattern injection */}
                <div className="mb-4">
                    <div className="text-xs text-white/50 mb-2">Inject Mock Pattern</div>
                    <div className="space-y-2">
                        {Object.entries(MOCK_PATTERNS).map(([key, pattern]) => (
                            <button
                                key={key}
                                onClick={() => {
                                    setSelectedPattern(key);
                                    injectMockData(key);
                                }}
                                className={`
                                    w-full text-left px-3 py-2 rounded-lg text-xs transition-all
                                    ${selectedPattern === key
                                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                                        : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/10'
                                    }
                                `}
                            >
                                {pattern.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Clear button */}
                <button
                    onClick={clearMockData}
                    className="w-full px-3 py-2 rounded-lg text-xs bg-red-500/10 border border-red-500/30 text-red-400/70 hover:bg-red-500/20 transition-all"
                >
                    🗑️ Clear Progress Data
                </button>
            </div>

            {/* Info */}
            <div className="mt-3 pt-3 border-t border-white/10">
                <div className="text-[10px] text-white/40">
                    Trajectory data populates the TrajectoryCard on the Hub
                </div>
            </div>
        </Section>
    );
}

function CurriculumSection({ expanded, onToggle, armed, handleDestructive, isLight = false }) {
    const getCurrentDayNumber = useCurriculumStore(s => s.getCurrentDayNumber);
    const _devSetDay = useCurriculumStore(s => s._devSetDay);
    const _devCompleteDay = useCurriculumStore(s => s._devCompleteDay);
    const logLegCompletion = useCurriculumStore(s => s.logLegCompletion);
    const logDayCompletion = useCurriculumStore(s => s.logDayCompletion);
    const dayCompletions = useCurriculumStore(s => s.dayCompletions);
    const legCompletions = useCurriculumStore(s => s.legCompletions);
    const onboardingComplete = useCurriculumStore(s => s.onboardingComplete);
    const _devReset = useCurriculumStore(s => s._devReset);
    const getActiveCurriculum = useCurriculumStore(s => s.getActiveCurriculum);

    // Navigation path state — blocks curriculum card when active
    const activePathId = useNavigationStore(s => s.activePath?.activePathId ?? null);
    const abandonPath = useNavigationStore(s => s.abandonPath);

    const curriculum = getActiveCurriculum();
    const totalDays = curriculum?.duration || 14;
    const totalLegsPerDay = curriculum?.days?.[0]?.legs?.length || 2;

    const currentDay = getCurrentDayNumber();
    const completedDays = Object.keys(dayCompletions).filter(d => dayCompletions[d].completed).length;
    const completedLegs = Object.keys(legCompletions).length;

    const [simDays, setSimDays] = React.useState(totalDays);
    const [simLegs, setSimLegs] = React.useState(totalLegsPerDay);

    /**
     * Ensure onboarding is complete with default time slots so the curriculum
     * card actually renders (gate condition: needsSetup must be false).
     */
    const ensureOnboarding = () => {
        const state = useCurriculumStore.getState();
        if (state.onboardingComplete && state.curriculumStartDate && state.practiceTimeSlots?.length > 0) {
            return; // Already set up
        }
        const defaultTimeSlots = state.practiceTimeSlots?.length > 0
            ? state.practiceTimeSlots
            : ['08:00', '20:00'];
        const defaultThoughts = state.thoughtCatalog?.length > 0
            ? [] // Don't overwrite existing thoughts
            : [
                { text: 'I am not good enough', weight: 1 },
                { text: 'I always mess things up', weight: 1 },
                { text: 'Everyone else has it figured out', weight: 0 },
                { text: 'I should be better by now', weight: 0 },
                { text: 'Nothing ever works out', weight: 0 },
            ];
        state.completeOnboarding(defaultTimeSlots, defaultThoughts);
        console.log('[DevPanel] Auto-completed onboarding with defaults:', {
            timeSlots: defaultTimeSlots,
            thoughts: defaultThoughts.length,
            curriculumStartDate: useCurriculumStore.getState().curriculumStartDate,
        });
    };

    const simulateEntireProgram = () => {
        // Ensure onboarding so the curriculum card actually renders
        ensureOnboarding();
        console.log('[DevPanel] Starting curriculum simulation:', { simDays, simLegs });
        for (let day = 1; day <= simDays; day++) {
            for (let leg = 1; leg <= simLegs; leg++) {
                logLegCompletion(day, leg, {
                    duration: 5 + Math.floor(Math.random() * 3), // 5-7 min
                    focusRating: 3 + Math.floor(Math.random() * 3), // 3-5 stars
                    challenges: [],
                    notes: `Dev simulated day ${day}, leg ${leg}`,
                });
            }
            // Mark the full day as complete so getStreak() and isTodayComplete() work
            logDayCompletion(day, {
                duration: simLegs * 5,
                focusRating: 4,
                challenges: [],
                notes: `Dev simulated day ${day}`,
            });
        }
        console.log(`✅ Completed curriculum simulation: ${simDays} days × ${simLegs} legs, ${simDays} dayCompletions written`);
    };

    const completeCurrentDay = () => {
        // Ensure onboarding so the curriculum card actually renders
        ensureOnboarding();
        const day = useCurriculumStore.getState().getCurrentDayNumber();
        console.log('[DevPanel] Completing current day:', day);
        logLegCompletion(day, 1, {
            duration: 5,
            focusRating: 4,
            challenges: [],
            notes: 'Dev completed leg 1',
        });
        logLegCompletion(day, 2, {
            duration: 5,
            focusRating: 5,
            challenges: [],
            notes: 'Dev completed leg 2',
        });
        // Mark the full day as complete so getStreak() and isTodayComplete() work
        logDayCompletion(day, {
            duration: 10,
            focusRating: 4,
            challenges: [],
            notes: `Dev completed day ${day}`,
        });
        console.log(`✅ Completed Day ${day}: 2 legs + dayCompletion written`);
    };

    const quickSetupOnly = () => {
        ensureOnboarding();
        console.log('✅ Onboarding complete — curriculum card should now be visible');
    };

    const populateSampleThoughts = () => {
        const { completeOnboarding, practiceTimeSlots } = useCurriculumStore.getState();
        const defaultTimeSlots = practiceTimeSlots?.length > 0 ? practiceTimeSlots : ['08:00', '20:00'];
        const sampleThoughts = [
            { text: 'I am not good enough', weight: 1 },
            { text: 'I always mess things up', weight: 1 },
            { text: 'Everyone else has it figured out', weight: 0 },
            { text: 'I should be better by now', weight: 0 },
            { text: 'Nothing ever works out', weight: 0 },
            { text: 'I am capable of growth', weight: 0 },
            { text: 'This moment is full of potential', weight: 0 },
        ];
        completeOnboarding(defaultTimeSlots, sampleThoughts);
        console.log('✅ Populated 7 sample thoughts (2 priority, 5 normal) + onboarding complete');
    };

    const testWeightedRandom = () => {
        const { getWeightedRandomThought } = useCurriculumStore.getState();
        const thought = getWeightedRandomThought();
        if (thought) {
            console.log('🎲 Random thought selected:', thought.text, `(weight: ${thought.weight})`);
        } else {
            console.log('❌ No thoughts in catalog');
        }
    };

    return (
        <Section
            title="Curriculum Simulation"
            expanded={expanded}
            onToggle={onToggle}
            isLight={isLight}
        >
            {/* Onboarding Status */}
            {!onboardingComplete && (
                <div className="mb-3 px-3 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-xs text-yellow-300">
                    ⚠️ Onboarding not complete — curriculum card won't render. Click "Quick Setup" or any simulation button below.
                </div>
            )}

            {/* Active path conflict warning */}
            {activePathId && (
                <div className="mb-3 px-3 py-2 rounded-lg bg-orange-500/10 border border-orange-500/30 text-xs text-orange-300">
                    ⚠️ Active navigation path "{activePathId}" is blocking the curriculum card.
                    <button
                        className="ml-2 underline hover:text-orange-200 transition-colors"
                        onClick={() => { abandonPath(); console.log('✅ Navigation path cleared — curriculum card should now be visible'); }}
                    >
                        Clear path
                    </button>
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 mb-4 text-xs">
                <div className="bg-white/5 rounded-lg px-3 py-2">
                    <div className="text-white/40">Current Day</div>
                    <div className="text-white/90 font-mono">{currentDay}/{totalDays}</div>
                </div>
                <div className="bg-white/5 rounded-lg px-3 py-2">
                    <div className="text-white/40">Days Done</div>
                    <div className="text-white/90 font-mono">{completedDays}</div>
                </div>
                <div className="bg-white/5 rounded-lg px-3 py-2">
                    <div className="text-white/40">Legs Done</div>
                    <div className="text-white/90 font-mono">{completedLegs}</div>
                </div>
            </div>

            {/* Quick Setup (onboarding only, no completions) */}
            {!onboardingComplete && (
                <div className="mb-3">
                    <DevButton onClick={quickSetupOnly}>⚡ Quick Setup (onboarding only)</DevButton>
                </div>
            )}

            {/* Day Navigation */}
            <div className="grid grid-cols-4 gap-2 mb-3">
                <DevButton onClick={() => _devSetDay(1)}>Day 1</DevButton>
                <DevButton onClick={() => _devSetDay(Math.floor(totalDays / 2))}>Mid</DevButton>
                <DevButton onClick={() => _devSetDay(totalDays)}>End</DevButton>
                <DevButton onClick={() => _devSetDay(Math.min(currentDay + 1, totalDays))}>+1 Day</DevButton>
            </div>

            {/* Simulation Controls */}
            <div className="mb-3">
                <div className="text-xs text-white/50 mb-2">Simulation Settings</div>
                <div className="grid grid-cols-2 gap-2 mb-2">
                    <div>
                        <label className="text-[10px] text-white/40 block mb-1">Days</label>
                        <input
                            type="number"
                            min="1"
                            max="365"
                            value={simDays}
                            onChange={(e) => setSimDays(parseInt(e.target.value) || 1)}
                            className="w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-xs text-white/90"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] text-white/40 block mb-1">Legs/Day</label>
                        <input
                            type="number"
                            min="1"
                            max="10"
                            value={simLegs}
                            onChange={(e) => setSimLegs(parseInt(e.target.value) || 1)}
                            className="w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-xs text-white/90"
                        />
                    </div>
                </div>
            </div>

            {/* Completion Actions */}
            <div className="grid grid-cols-2 gap-2 mb-3">
                <DevButton onClick={completeCurrentDay}>Complete Today</DevButton>
                <DevButton onClick={simulateEntireProgram}>Complete All {simDays} Days</DevButton>
            </div>

            {/* Thought Catalog Testing */}
            <div className="border-t border-white/10 pt-3 mt-3 mb-3">
                <div className="text-xs text-white/50 mb-2">Thought Catalog Testing</div>
                <div className="grid grid-cols-2 gap-2">
                    <DevButton onClick={populateSampleThoughts}>Add Sample Thoughts</DevButton>
                    <DevButton onClick={testWeightedRandom}>Test Random Selection</DevButton>
                </div>
            </div>

            {/* Reset curriculum (destructive) */}
            <DestructiveButton
                label="Reset Curriculum"
                armed={armed === 'curriculum'}
                onArm={() => handleDestructive('curriculum', _devReset)}
            />
        </Section>
    );
}

function AvatarCompositeTunerSection({ expanded, onToggle, isLight = false }) {
    const avatarComposite = useDevPanelStore(s => s.avatarComposite);
    const setAvatarCompositeEnabled = useDevPanelStore(s => s.setAvatarCompositeEnabled);
    const setAvatarCompositeDebugOverlay = useDevPanelStore(s => s.setAvatarCompositeDebugOverlay);
    const setAvatarCompositeLayerEnabled = useDevPanelStore(s => s.setAvatarCompositeLayerEnabled);
    const setAvatarCompositeLayerValue = useDevPanelStore(s => s.setAvatarCompositeLayerValue);
    const setAvatarCompositeLayerLink = useDevPanelStore(s => s.setAvatarCompositeLayerLink);
    const setAvatarCompositeLayerLinkOpacity = useDevPanelStore(s => s.setAvatarCompositeLayerLinkOpacity);
    const resetAvatarCompositeLayer = useDevPanelStore(s => s.resetAvatarCompositeLayer);
    const resetAvatarCompositeAll = useDevPanelStore(s => s.resetAvatarCompositeAll);
    const linkAllAvatarCompositeTo = useDevPanelStore(s => s.linkAllAvatarCompositeTo);
    const getAvatarCompositeSettingsJSON = useDevPanelStore(s => s.getAvatarCompositeSettingsJSON);
    const setAvatarCompositeSettingsJSON = useDevPanelStore(s => s.setAvatarCompositeSettingsJSON);

    const [layerExpanded, setLayerExpanded] = useState({
        bg: true,
        stage: false,
        glass: false,
        ring: false,
    });
    const [linkAllTarget, setLinkAllTarget] = useState('none');
    const [jsonDraft, setJsonDraft] = useState('');
    const [jsonStatus, setJsonStatus] = useState('');

    const layers = avatarComposite?.layers || {};
    const tunerEnabled = avatarComposite?.enabled !== false;
    const showDebugOverlay = Boolean(avatarComposite?.showDebugOverlay);

    const toggleLayer = (layerId) => {
        setLayerExpanded(prev => ({ ...prev, [layerId]: !prev[layerId] }));
    };

    const nudgeRotation = (layerId, delta) => {
        const layer = layers[layerId];
        if (!layer) return;
        setAvatarCompositeLayerValue(layerId, 'rotateDeg', layer.rotateDeg + delta);
    };

    const resetTransforms = (layerId) => {
        setAvatarCompositeLayerValue(layerId, 'scale', 1);
        setAvatarCompositeLayerValue(layerId, 'rotateDeg', 0);
        setAvatarCompositeLayerValue(layerId, 'x', 0);
        setAvatarCompositeLayerValue(layerId, 'y', 0);
    };

    const copySettings = async () => {
        const json = getAvatarCompositeSettingsJSON();
        setJsonDraft(json);
        if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
            try {
                await navigator.clipboard.writeText(json);
                setJsonStatus('Copied to clipboard.');
                return;
            } catch {
                // Fallback handled below.
            }
        }
        setJsonStatus('Copied to editor field.');
    };

    const applySettings = () => {
        const result = setAvatarCompositeSettingsJSON(jsonDraft);
        setJsonStatus(result?.ok ? 'Settings applied.' : `Paste failed: ${result?.error || 'Unknown error'}`);
    };

    return (
        <Section
            title="Avatar Composite Tuner"
            expanded={expanded}
            onToggle={onToggle}
            isLight={isLight}
        >
            <div className="text-xs text-white/50 mb-3">
                Dev-only live tuning for `bg`, `stage`, `glass`, and `ring` layers.
            </div>

            <div className="grid grid-cols-2 gap-2 mb-3">
                <button
                    onClick={() => setAvatarCompositeEnabled(!tunerEnabled)}
                    className={`rounded-lg px-3 py-2 text-xs border transition-all ${tunerEnabled ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-100' : 'bg-white/5 border-white/15 text-white/70'}`}
                >
                    {tunerEnabled ? 'Tuner Enabled' : 'Tuner Disabled'}
                </button>
                <button
                    onClick={() => setAvatarCompositeDebugOverlay(!showDebugOverlay)}
                    className={`rounded-lg px-3 py-2 text-xs border transition-all ${showDebugOverlay ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-100' : 'bg-white/5 border-white/15 text-white/70'}`}
                >
                    {showDebugOverlay ? 'Debug Overlay On' : 'Debug Overlay Off'}
                </button>
            </div>

            <div className="grid grid-cols-[1fr_auto] gap-2 mb-3 items-center">
                <select
                    value={linkAllTarget}
                    onChange={(e) => setLinkAllTarget(e.target.value)}
                    className="w-full rounded-lg px-3 py-2 text-xs"
                    style={{
                        background: isLight ? 'rgba(255, 255, 255, 0.9)' : '#0a0a12',
                        border: isLight ? '1px solid rgba(180, 155, 110, 0.3)' : '1px solid rgba(255, 255, 255, 0.25)',
                        color: isLight ? 'rgba(60, 50, 40, 0.95)' : 'white',
                        colorScheme: isLight ? 'light' : 'dark'
                    }}
                >
                    {AVATAR_COMPOSITE_LINK_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                            {option === 'none' ? 'None' : `Link all to ${option}`}
                        </option>
                    ))}
                </select>
                <button
                    onClick={() => linkAllAvatarCompositeTo(linkAllTarget === 'none' ? null : linkAllTarget)}
                    className="rounded-lg px-3 py-2 text-xs bg-white/5 border border-white/15 text-white/70 hover:bg-white/10 transition-all"
                >
                    Apply
                </button>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4">
                <button
                    onClick={resetAvatarCompositeAll}
                    className="rounded-lg px-3 py-2 text-xs bg-red-500/10 border border-red-500/35 text-red-300/80 hover:bg-red-500/20 transition-all"
                >
                    Reset All
                </button>
                <button
                    onClick={copySettings}
                    className="rounded-lg px-3 py-2 text-xs bg-white/5 border border-white/15 text-white/70 hover:bg-white/10 transition-all"
                >
                    Copy Settings JSON
                </button>
            </div>

            <div className="space-y-2 mb-4">
                {AVATAR_COMPOSITE_LAYER_IDS.map((layerId) => {
                    const layer = layers[layerId] || {
                        enabled: true,
                        opacity: 1,
                        scale: 1,
                        rotateDeg: 0,
                        x: 0,
                        y: 0,
                        linkTo: null,
                        linkOpacity: false,
                    };
                    const linkToValue = layer.linkTo || 'none';
                    const isLinked = Boolean(layer.linkTo);
                    const transformsLocked = isLinked;
                    const opacityLocked = isLinked && layer.linkOpacity;
                    return (
                        <div key={layerId} className="rounded-lg border border-white/15 bg-white/5">
                            <button
                                onClick={() => toggleLayer(layerId)}
                                className="w-full flex items-center justify-between px-3 py-2 text-left"
                            >
                                <span className="text-xs text-white/85">
                                    {AVATAR_COMPOSITE_LAYER_LABELS[layerId]} ({layerId})
                                </span>
                                <span className="text-[10px] text-white/55">
                                    {layerExpanded[layerId] ? 'Hide' : 'Show'}
                                </span>
                            </button>

                            {layerExpanded[layerId] && (
                                <div className="px-3 pb-3 space-y-2 border-t border-white/10">
                                    <div className="grid grid-cols-2 gap-2 pt-2">
                                        <button
                                            onClick={() => setAvatarCompositeLayerEnabled(layerId, !layer.enabled)}
                                            className={`rounded-lg px-2 py-1.5 text-[11px] border transition-all ${layer.enabled ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-100' : 'bg-white/5 border-white/15 text-white/65'}`}
                                        >
                                            {layer.enabled ? 'Layer On' : 'Layer Off'}
                                        </button>
                                        <button
                                            onClick={() => resetAvatarCompositeLayer(layerId)}
                                            className="rounded-lg px-2 py-1.5 text-[11px] bg-white/5 border border-white/15 text-white/70 hover:bg-white/10 transition-all"
                                        >
                                            Reset Layer
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-[1fr_auto] gap-2 items-center">
                                        <select
                                            value={linkToValue}
                                            onChange={(e) => setAvatarCompositeLayerLink(layerId, e.target.value === 'none' ? null : e.target.value)}
                                            className="w-full rounded-lg px-2 py-1.5 text-[11px]"
                                            style={{
                                                background: isLight ? 'rgba(255, 255, 255, 0.9)' : '#0a0a12',
                                                border: isLight ? '1px solid rgba(180, 155, 110, 0.3)' : '1px solid rgba(255, 255, 255, 0.25)',
                                                color: isLight ? 'rgba(60, 50, 40, 0.95)' : 'white',
                                                colorScheme: isLight ? 'light' : 'dark'
                                            }}
                                        >
                                            {AVATAR_COMPOSITE_LINK_OPTIONS.map((option) => (
                                                <option
                                                    key={`${layerId}-${option}`}
                                                    value={option}
                                                    disabled={option === layerId}
                                                >
                                                    {option === 'none' ? 'Link: None' : `Link: ${option}`}
                                                </option>
                                            ))}
                                        </select>
                                        {isLinked && (
                                            <button
                                                onClick={() => setAvatarCompositeLayerLinkOpacity(layerId, !layer.linkOpacity)}
                                                className={`rounded-lg px-2 py-1.5 text-[11px] border transition-all ${layer.linkOpacity ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-100' : 'bg-white/5 border-white/15 text-white/70'}`}
                                            >
                                                {layer.linkOpacity ? 'Opacity Linked' : 'Opacity Free'}
                                            </button>
                                        )}
                                    </div>

                                    <RangeControl
                                        label="Opacity"
                                        value={layer.opacity}
                                        min={0}
                                        max={1}
                                        step={0.01}
                                        disabled={!tunerEnabled || !layer.enabled || opacityLocked}
                                        onChange={(value) => setAvatarCompositeLayerValue(layerId, 'opacity', value)}
                                    />
                                    <RangeControl
                                        label="Scale"
                                        value={layer.scale}
                                        min={0.5}
                                        max={2}
                                        step={0.01}
                                        disabled={!tunerEnabled || !layer.enabled || transformsLocked}
                                        onChange={(value) => setAvatarCompositeLayerValue(layerId, 'scale', value)}
                                    />
                                    <RangeControl
                                        label="Rotate"
                                        value={layer.rotateDeg}
                                        min={-180}
                                        max={180}
                                        step={1}
                                        suffix="deg"
                                        disabled={!tunerEnabled || !layer.enabled || transformsLocked}
                                        onChange={(value) => setAvatarCompositeLayerValue(layerId, 'rotateDeg', value)}
                                    />
                                    <div className="grid grid-cols-3 gap-2">
                                        <button
                                            onClick={() => nudgeRotation(layerId, -5)}
                                            disabled={!tunerEnabled || !layer.enabled || transformsLocked}
                                            className="rounded-lg px-2 py-1.5 text-[11px] bg-white/5 border border-white/15 text-white/70 disabled:opacity-40 disabled:cursor-not-allowed"
                                        >
                                            -5 deg
                                        </button>
                                        <button
                                            onClick={() => nudgeRotation(layerId, 5)}
                                            disabled={!tunerEnabled || !layer.enabled || transformsLocked}
                                            className="rounded-lg px-2 py-1.5 text-[11px] bg-white/5 border border-white/15 text-white/70 disabled:opacity-40 disabled:cursor-not-allowed"
                                        >
                                            +5 deg
                                        </button>
                                        <button
                                            onClick={() => setAvatarCompositeLayerValue(layerId, 'rotateDeg', 0)}
                                            disabled={!tunerEnabled || !layer.enabled || transformsLocked}
                                            className="rounded-lg px-2 py-1.5 text-[11px] bg-white/5 border border-white/15 text-white/70 disabled:opacity-40 disabled:cursor-not-allowed"
                                        >
                                            Reset Rot
                                        </button>
                                    </div>
                                    <RangeControl
                                        label="X"
                                        value={layer.x}
                                        min={-100}
                                        max={100}
                                        step={1}
                                        suffix="px"
                                        disabled={!tunerEnabled || !layer.enabled || transformsLocked}
                                        onChange={(value) => setAvatarCompositeLayerValue(layerId, 'x', value)}
                                    />
                                    <RangeControl
                                        label="Y"
                                        value={layer.y}
                                        min={-100}
                                        max={100}
                                        step={1}
                                        suffix="px"
                                        disabled={!tunerEnabled || !layer.enabled || transformsLocked}
                                        onChange={(value) => setAvatarCompositeLayerValue(layerId, 'y', value)}
                                    />
                                    <button
                                        onClick={() => resetTransforms(layerId)}
                                        disabled={!tunerEnabled || !layer.enabled || transformsLocked}
                                        className="rounded-lg px-2 py-1.5 text-[11px] bg-white/5 border border-white/15 text-white/70 disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        Reset X/Y/Scale/Rot
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="space-y-2">
                <textarea
                    value={jsonDraft}
                    onChange={(e) => setJsonDraft(e.target.value)}
                    placeholder="Paste Avatar Composite settings JSON here"
                    rows={5}
                    className="w-full rounded-lg px-3 py-2 text-[11px] font-mono"
                    style={{
                        background: isLight ? 'rgba(255, 255, 255, 0.9)' : '#0a0a12',
                        border: isLight ? '1px solid rgba(180, 155, 110, 0.3)' : '1px solid rgba(255, 255, 255, 0.25)',
                        color: isLight ? 'rgba(60, 50, 40, 0.95)' : 'white',
                        colorScheme: isLight ? 'light' : 'dark'
                    }}
                />
                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={applySettings}
                        className="rounded-lg px-3 py-2 text-xs bg-white/5 border border-white/15 text-white/70 hover:bg-white/10 transition-all"
                    >
                        Paste Settings JSON
                    </button>
                    <button
                        onClick={() => {
                            setJsonDraft('');
                            setJsonStatus('');
                        }}
                        className="rounded-lg px-3 py-2 text-xs bg-white/5 border border-white/15 text-white/60 hover:bg-white/10 transition-all"
                    >
                        Clear JSON
                    </button>
                </div>
                {!!jsonStatus && <div className="text-[10px] text-white/55">{jsonStatus}</div>}
            </div>
        </Section>
    );
}

function Section({ title, expanded, onToggle, children, isLight = false }) {
    return (
        <div className="border rounded-xl overflow-hidden" style={{
            background: isLight ? 'rgba(180, 155, 110, 0.08)' : 'rgba(255, 255, 255, 0.03)',
            borderColor: isLight ? 'rgba(180, 155, 110, 0.2)' : 'rgba(255, 255, 255, 0.1)'
        }}>
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/5 transition-colors"
            >
                <span className="text-sm font-medium" style={{
                    color: isLight ? 'rgba(45, 40, 35, 0.85)' : 'rgba(255, 255, 255, 0.8)'
                }}>{title}</span>
                <span style={{ color: isLight ? 'rgba(60, 50, 40, 0.5)' : 'rgba(255, 255, 255, 0.4)' }}>{expanded ? '▼' : '▶'}</span>
            </button>
            {expanded && (
                <div className="px-4 pb-4 pt-2 border-t border-white/5">
                    {children}
                </div>
            )}
        </div>
    );
}

function DevButton({ onClick, children }) {
    return (
        <button
            onClick={onClick}
            className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-lg px-3 py-2 text-xs text-white/70 hover:text-white/90 transition-all"
        >
            {children}
        </button>
    );
}

function RangeControl({ label, value, min, max, step, onChange, disabled = false, suffix = '' }) {
    const displayValue = Number(step) < 1 ? Number(value).toFixed(2) : String(Math.round(value));
    return (
        <label className={`block text-[11px] ${disabled ? 'opacity-45' : ''}`}>
            <div className="flex items-center justify-between mb-1">
                <span className="text-white/70">{label}</span>
                <span className="font-mono text-white/85">{displayValue}{suffix}</span>
            </div>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                disabled={disabled}
                onChange={(e) => onChange(Number(e.target.value))}
                className="w-full accent-amber-400 disabled:cursor-not-allowed"
            />
        </label>
    );
}

function TextControl({ label, value, onChange, disabled = false, placeholder = '', mono = true }) {
    return (
        <label className={`block text-[11px] ${disabled ? 'opacity-45' : ''}`}>
            <div className="flex items-center justify-between mb-1">
                <span className="text-white/70">{label}</span>
            </div>
            <input
                type="text"
                value={value ?? ''}
                placeholder={placeholder}
                disabled={disabled}
                onChange={(e) => onChange(String(e.target.value))}
                className={`w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-xs text-white/90 ${mono ? 'font-mono' : ''}`}
            />
        </label>
    );
}

function DestructiveButton({ label, armed, onArm }) {
    return (
        <button
            onClick={onArm}
            className={`w-full rounded-lg px-3 py-2 text-xs font-medium transition-all ${armed
                ? 'bg-red-500/30 border-2 border-red-500 text-red-300 animate-pulse'
                : 'bg-red-500/10 border border-red-500/30 text-red-400/70 hover:bg-red-500/20'
                }`}
        >
            {armed ? `⚠️ CONFIRM: ${label}?` : label}
        </button>
    );
}

export default DevPanel;
