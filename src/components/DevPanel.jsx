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

import React, { useState, useMemo, useCallback, useEffect, useRef, Suspense } from 'react';
import { generateMockSessions, MOCK_PATTERNS } from '../utils/devDataGenerator';
import { useProgressStore } from '../state/progressStore';
import { useSettingsStore } from '../state/settingsStore';
import { useDisplayModeStore } from '../state/displayModeStore';
import { useCurriculumStore } from '../state/curriculumStore';
import { useNavigationStore } from '../state/navigationStore';
import { useTutorialStore } from '../state/tutorialStore';
import { normalizeStageKey } from '../config/avatarStageAssets.js';
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
import { emitPickerSelection } from '../dev/pickerChannel.js';
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
    buildPlateFxOverrideResetPatch,
    getPlatesFxPreset,
    resolvePlatesFxPreset,
    resetPlatesFxOverrides,
    setPlatesFxPreset,
    subscribePlatesFxPresets
} from '../dev/plateFxPresets.js';
import Section from './devpanel/ui/Section.jsx';
import DevButton from './devpanel/ui/DevButton.jsx';
import RangeControl from './devpanel/ui/RangeControl.jsx';
import TextControl from './devpanel/ui/TextControl.jsx';
import DestructiveButton from './devpanel/ui/DestructiveButton.jsx';
import ControlsFxSection from './devpanel/sections/ControlsFxSection.jsx';
import PlatesFxSection from './devpanel/sections/PlatesFxSection.jsx';
import CardTunerSection from './devpanel/sections/CardTunerSection.jsx';
import NavButtonTunerSection from './devpanel/sections/NavButtonTunerSection.jsx';
import AvatarCompositeSection from './devpanel/sections/AvatarCompositeSection.jsx';

// Lazy-loaded lab component (code-split, only loads when DevPanel opens)
const BloomRingLab = React.lazy(() => import('./dev/BloomRingLab.jsx').then(m => ({ default: m.BloomRingLab })));

// Available stages and paths for dropdowns
const STAGE_OPTIONS = ['Seedling', 'Ember', 'Flame', 'Beacon', 'Stellar'];
const PATH_OPTIONS = ['Yantra', 'Kaya', 'Chitra', 'Nada'];
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
    const [platesAdvancedOpen, setPlatesAdvancedOpen] = useState(false);
    const platesFxEnabled = useSettingsStore((s) => Boolean(s.platesFxEnabled));
    const setPlatesFxEnabled = useSettingsStore((s) => s.setPlatesFxEnabled);

    const CONTROLS_PICK_STORAGE_KEY = "immanence.dev.controlsFxPicker";
    const CONTROLS_PICK_EVENT = "immanence-controls-fx-picker";

    const broadcastControlsPicker = useCallback((next) => {
        if (typeof window === 'undefined') return;
        try {
            emitPickerSelection(CONTROLS_PICK_STORAGE_KEY, CONTROLS_PICK_EVENT, next);
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
            emitPickerSelection(PRACTICE_BUTTON_PICK_STORAGE_KEY, PRACTICE_BUTTON_PICK_EVENT, next);
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
                        emitPickerSelection('immanence.dev.platesFxPicker', 'immanence-plates-fx-picker', { selectedId: resolvedId });
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
        setPlatesAdvancedOpen(false);
        return undefined;
    }, [isOpen, devtoolsEnabled, platesSelectedId]);

    useEffect(() => {
        if (!isOpen || !devtoolsEnabled || !platesSelectedId) return undefined;
        return subscribePlatesFxPresets(() => {
            setPlatesFxDraft(getPlatesFxPreset(platesSelectedId));
        });
    }, [isOpen, devtoolsEnabled, platesSelectedId]);

    const patchSelectedPlatePreset = useCallback((patch) => {
        if (!platesSelectedId) return;
        const next = { ...platesFxDraft, ...(patch || {}) };
        setPlatesFxDraft(next);
        setPlatesFxPreset(platesSelectedId, patch || {});
    }, [platesSelectedId, platesFxDraft]);

    const resetSelectedPlateOverrides = useCallback(() => {
        if (!platesSelectedId) return;
        resetPlatesFxOverrides(platesSelectedId);
        const refreshed = getPlatesFxPreset(platesSelectedId);
        setPlatesFxDraft(refreshed);
    }, [platesSelectedId]);

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

    const platesResolved = resolvePlatesFxPreset(platesFxDraft);
    const plateOverrideResetPatch = buildPlateFxOverrideResetPatch();
    const activePlateOverrideCount = Object.keys(plateOverrideResetPatch).reduce((acc, key) => {
        return platesFxDraft[key] !== null && platesFxDraft[key] !== undefined ? acc + 1 : acc;
    }, 0);

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

                    <AvatarCompositeSection
                        expanded={expandedSections.avatarCompositeTuner}
                        onToggle={() => toggleSection('avatarCompositeTuner')}
                        isLight={isLight}
                        editingStageKey={normalizeStageKey(avatarStage)}
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

                                <ControlsFxSection
                                    universalPickerKind={universalPickerKind}
                                    controlsSelectedId={controlsSelectedId}
                                    controlsSelectedRoleGroup={controlsSelectedRoleGroup}
                                    controlsSurfaceIsRoot={controlsSurfaceIsRoot}
                                    controlsSurfaceDebug={controlsSurfaceDebug}
                                    controlsElectricBorderEnabled={controlsElectricBorderEnabled}
                                    setControlsElectricBorderEnabled={setControlsElectricBorderEnabled}
                                    controlsFxDraft={controlsFxDraft}
                                    setControlsFxDraft={setControlsFxDraft}
                                    setControlsFxPreset={setControlsFxPreset}
                                    resetControlsFxPreset={resetControlsFxPreset}
                                    getControlsFxPreset={getControlsFxPreset}
                                    controlsPresetJson={controlsPresetJson}
                                    setControlsPresetJson={setControlsPresetJson}
                                    controlsPresetStatus={controlsPresetStatus}
                                    setControlsPresetStatus={setControlsPresetStatus}
                                    exportControlsFxPresetsJson={exportControlsFxPresetsJson}
                                    importControlsFxPresetsJson={importControlsFxPresetsJson}
                                    resetAllControlsFxPresets={resetAllControlsFxPresets}
                                    utcViolations={utcViolations}
                                />

                                <PlatesFxSection
                                    universalPickerKind={universalPickerKind}
                                    platesSelectedId={platesSelectedId}
                                    platesFxEnabled={platesFxEnabled}
                                    setPlatesFxEnabled={setPlatesFxEnabled}
                                    platesFxDraft={platesFxDraft}
                                    patchSelectedPlatePreset={patchSelectedPlatePreset}
                                    platesResolved={platesResolved}
                                    platesAdvancedOpen={platesAdvancedOpen}
                                    setPlatesAdvancedOpen={setPlatesAdvancedOpen}
                                    activePlateOverrideCount={activePlateOverrideCount}
                                    resetSelectedPlateOverrides={resetSelectedPlateOverrides}
                                />

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
                    <CardTunerSection
                        expanded={expandedSections.cardTuner}
                        onToggle={() => toggleSection('cardTuner')}
                        isLight={isLight}
                        devtoolsEnabled={devtoolsEnabled}
                        legacyPickersEnabled={legacyPickersEnabled}
                        cardState={cardState}
                        handleStopPickFlow={handleStopPickFlow}
                        handleStartPickFlow={handleStartPickFlow}
                        cardApplyToAll={cardApplyToAll}
                        setCardApplyToAll={setCardApplyToAll}
                        handleTogglePeek={handleTogglePeek}
                        handleConfirmPickFlow={handleConfirmPickFlow}
                        activeDraft={activeDraft}
                        selectedDisabled={selectedDisabled}
                        onChangeCardSetting={onChangeCardSetting}
                        cardElectricBorderEnabled={cardElectricBorderEnabled}
                        setCardElectricBorderEnabled={setCardElectricBorderEnabled}
                        practiceButtonFxEnabled={practiceButtonFxEnabled}
                        setPracticeButtonFxEnabled={setPracticeButtonFxEnabled}
                        practiceButtonPickMode={practiceButtonPickMode}
                        setPracticeButtonPickMode={setPracticeButtonPickMode}
                        stopUniversalPickCaptureImmediate={stopUniversalPickCaptureImmediate}
                        setUniversalPickMode={setUniversalPickMode}
                        setPickMode={setPickMode}
                        setPeekMode={setPeekMode}
                        practiceButtonApplyToAll={practiceButtonApplyToAll}
                        setPracticeButtonApplyToAll={setPracticeButtonApplyToAll}
                        practiceButtonSelectedKey={practiceButtonSelectedKey}
                        saveGlobal={saveGlobal}
                        globalDraft={globalDraft}
                        saveSelected={saveSelected}
                        selectedDraft={selectedDraft}
                        resetGlobal={resetGlobal}
                        resetSelected={resetSelected}
                        clearAll={clearAll}
                    />

                    <NavButtonTunerSection
                        expanded={expandedSections.navBtnTuner}
                        onToggle={() => toggleSection('navBtnTuner')}
                        isLight={isLight}
                        devtoolsEnabled={devtoolsEnabled}
                        navBtnProbeEnabled={navBtnProbeEnabled}
                        setNavBtnProbeEnabled={setNavBtnProbeEnabled}
                        navBtnState={navBtnState}
                        setNavButtonTunerEnabled={setNavButtonTunerEnabled}
                        navBtnDraft={navBtnDraft}
                        onChangeNavBtnSetting={onChangeNavBtnSetting}
                        resetNavButtonSettings={resetNavButtonSettings}
                    />

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

export default DevPanel;

