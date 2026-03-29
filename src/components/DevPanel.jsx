// src/components/DevPanel.jsx
// Developer-only lab for testing Immanence OS systems
// Access: Ctrl+Shift+D or tap version 5 times

import React, { useState, useCallback, useEffect, Suspense } from 'react';
import { readRuntimeChecksSnapshot, RUNTIME_CHECKS_EVENT } from '../utils/runtimeChecks';
import { useSettingsStore } from '../state/settingsStore';
import { useDisplayModeStore } from '../state/displayModeStore';
import { useTutorialStore } from '../state/tutorialStore';
import { normalizeStageKey } from '../config/avatarStageAssets.js';
import { getCanonicalAvatarStageDefaultTransforms, useAvatarStageDefaultsStore } from '../state/avatarV3Store.js';
import { AVATAR_COMPOSITE_LAYER_IDS, useDevPanelStore } from '../state/devPanelStore.js';
import { CoordinateHelper } from './dev/CoordinateHelper.jsx';
import { OnboardingContentEditor, TutorialEditor } from './dev/TutorialEditor.jsx';
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
import { resetLocalData } from '../lib/resetLocalData.js';
import DestructiveButton from './devpanel/ui/DestructiveButton.jsx';
import useDevPanelGate from './devpanel/hooks/useDevPanelGate.js';
import useDevPanelPickers from './devpanel/hooks/useDevPanelPickers.js';
import AvatarCompositeSection from './devpanel/sections/AvatarCompositeSection.jsx';
import UnifiedInspectorSection from './devpanel/sections/UnifiedInspectorSection.jsx';
import { getDevPanelProdGate } from '../lib/devPanelGate.js';
import AvatarStageSection from './dev/AvatarStageSection.jsx';
import TrackingHubSection from './dev/TrackingHubSection.jsx';
import CurriculumSection from './dev/CurriculumSection.jsx';

// Eager import: avoids transient dynamic-import failures in local dev.

function normalizeAvatarStageSnapshot(stageTransforms = {}) {
    const normalized = {};
    AVATAR_COMPOSITE_LAYER_IDS.forEach((layerId) => {
        const source = stageTransforms?.[layerId] || {};
        normalized[layerId] = {
            enabled: source.enabled === false ? false : true,
            opacity: typeof source.opacity === 'number' ? source.opacity : 1,
            scale: typeof source.scale === 'number' ? source.scale : 1,
            rotateDeg: typeof source.rotateDeg === 'number' ? source.rotateDeg : 0,
            x: typeof source.x === 'number' ? source.x : 0,
            y: typeof source.y === 'number' ? source.y : 0,
            linkTo: typeof source.linkTo === 'string' ? source.linkTo : null,
            linkOpacity: source.linkOpacity === true,
        };
    });
    return normalized;
}

function areAvatarStageSnapshotsEqual(left, right) {
    return JSON.stringify(normalizeAvatarStageSnapshot(left)) === JSON.stringify(normalizeAvatarStageSnapshot(right));
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER COMPONENTS (moved outside to avoid hook rendering issues)
// ═══════════════════════════════════════════════════════════════════════════

function TutorialAnchorCountReadout() {
    const [count, setCount] = useState(0);

    useEffect(() => {
        const update = () => setCount(document.querySelectorAll('[data-tutorial], [data-guide-step]').length);
        update();
        const interval = setInterval(update, 1000);
        return () => clearInterval(interval);
    }, []);

    return <span className="text-white/70 font-mono">{count}</span>;
}

function formatRuntimeStatus(check) {
    if (!check) {
        return { status: 'unpublished', code: '-' };
    }

    return {
        status: check.phase || check.mode || check.config || (check.ok ? 'valid' : 'unknown'),
        code: check.failureCode || check.code || '-',
    };
}

function RuntimeVerificationReadout({ isLight, isDevBuild }) {
    const [snapshot, setSnapshot] = useState(() => readRuntimeChecksSnapshot());

    useEffect(() => {
        if (!isDevBuild) return undefined;

        const handleUpdate = () => {
            setSnapshot(readRuntimeChecksSnapshot());
        };

        handleUpdate();
        window.addEventListener(RUNTIME_CHECKS_EVENT, handleUpdate);
        return () => window.removeEventListener(RUNTIME_CHECKS_EVENT, handleUpdate);
    }, [isDevBuild]);

    if (!isDevBuild) {
        return null;
    }

    const startup = formatRuntimeStatus(snapshot.startup);
    const auth = formatRuntimeStatus(snapshot.auth);
    const llm = formatRuntimeStatus(snapshot.llm);

    return (
        <div
            className="rounded-xl border px-3 py-3"
            style={{
                borderColor: isLight ? 'rgba(180, 155, 110, 0.25)' : 'rgba(255, 255, 255, 0.12)',
                background: isLight ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.04)',
            }}
        >
            <div
                className="text-[11px] font-semibold uppercase tracking-[0.18em] mb-2"
                style={{ color: isLight ? 'rgba(60, 50, 40, 0.75)' : 'rgba(255, 255, 255, 0.72)' }}
            >
                Runtime Verification
            </div>
            <div className="space-y-1 font-mono text-[11px]" style={{ color: isLight ? 'rgba(45, 40, 35, 0.9)' : 'rgba(255, 255, 255, 0.86)' }}>
                <div>startup: {startup.status} | code: {startup.code}</div>
                <div>auth: {auth.status} | code: {auth.code}</div>
                <div>llm: {llm.status} | code: {llm.code}</div>
            </div>
            <div className="mt-2 text-[10px]" style={{ color: isLight ? 'rgba(60, 50, 40, 0.55)' : 'rgba(255, 255, 255, 0.5)' }}>
                updated: {snapshot.updatedAt || 'never'}
            </div>
        </div>
    );
}

export function DevPanel({
    isOpen,
    onClose,
    avatarStage: avatarStageProp,
    setAvatarStage: setAvatarStageProp,
}) {
    // Settings store state
    const showCoordinateHelper = useSettingsStore(s => s.showCoordinateHelper);
    const setCoordinateHelper = useSettingsStore(s => s.setCoordinateHelper);
    const practiceButtonFxEnabled = useSettingsStore(s => s.practiceButtonFxEnabled);
    const setPracticeButtonFxEnabled = useSettingsStore(s => s.setPracticeButtonFxEnabled);
    const cardElectricBorderEnabled = useSettingsStore(s => s.cardElectricBorderEnabled);
    const setCardElectricBorderEnabled = useSettingsStore(s => s.setCardElectricBorderEnabled);
    const photic = useSettingsStore(s => s.photic);
    const setPhoticSetting = useSettingsStore(s => s.setPhoticSetting);

    // Color scheme detection
    const colorScheme = useDisplayModeStore(s => s.colorScheme);
    const isLight = colorScheme === 'light';
    const isDevBuild = import.meta.env.DEV;
    const isProdBuild = !isDevBuild;
    const devPanelGateEnabled = getDevPanelProdGate();
    const [prodArmed, setProdArmed] = useState(false);
    const prodGuarded = isProdBuild && devPanelGateEnabled;
    const destructiveLocked = prodGuarded && !prodArmed;
    // DevPanel should be fully functional in dev builds; do not require extra devtools unlock gates.
    const devtoolsEnabled = Boolean(isDevBuild || devPanelGateEnabled);
    const canRunDevEffects = useDevPanelGate(isOpen, devtoolsEnabled);
    // Avatar stage control (fallback to local state if no props supplied)
    const [avatarStageLocal, setAvatarStageLocal] = useState('Flame');

    const avatarStage = avatarStageProp ?? avatarStageLocal;
    const setAvatarStage = setAvatarStageProp ?? setAvatarStageLocal;
    const normalizedAvatarStageKey = normalizeStageKey(avatarStage);
    const getResolvedAvatarStageDefault = useAvatarStageDefaultsStore(s => s.getResolvedStageDefault);
    const currentAvatarCommittedStage = useAvatarStageDefaultsStore((s) => {
        const defaultsByScheme = colorScheme === 'light' ? s.defaultsByStageLight : s.defaultsByStage;
        return defaultsByScheme?.[normalizedAvatarStageKey] || null;
    });
    const getAvatarCompositeStageDraft = useDevPanelStore(s => s.getAvatarCompositeStageDraft);
    const currentAvatarWorkingCopy = useDevPanelStore((s) =>
        s.avatarComposite?.workingCopy?.colorScheme === colorScheme
            && s.avatarComposite?.workingCopy?.stageKey === normalizedAvatarStageKey
            ? s.avatarComposite.workingCopy.stageDraft
            : null
    );
    const setAvatarCompositePreviewDraft = useDevPanelStore(s => s.setAvatarCompositePreviewDraft);
    const beginAvatarCompositeWorkingCopy = useDevPanelStore(s => s.beginAvatarCompositeWorkingCopy);
    const clearAvatarCompositeWorkingCopy = useDevPanelStore(s => s.clearAvatarCompositeWorkingCopy);
    const commitAvatarCompositeWorkingCopy = useDevPanelStore(s => s.commitAvatarCompositeWorkingCopy);
    const replaceAvatarCompositeStageDraft = useDevPanelStore(s => s.replaceAvatarCompositeStageDraft);
    const [avatarDefaultStatus, setAvatarDefaultStatus] = useState(null);
    const [avatarPromoteAck, setAvatarPromoteAck] = useState(null);

    useEffect(() => {
        if (!isOpen) {
            setAvatarCompositePreviewDraft(false);
            clearAvatarCompositeWorkingCopy();
            return;
        }
        setAvatarCompositePreviewDraft(true);
        // Only initialize a fresh working copy when there isn't already one for
        // this (stage, scheme) pair. Skipping preserves any slider edits the
        // user made before switching away and coming back.
        if (!currentAvatarWorkingCopy) {
            beginAvatarCompositeWorkingCopy(normalizedAvatarStageKey, colorScheme);
        }
    }, [
        beginAvatarCompositeWorkingCopy,
        clearAvatarCompositeWorkingCopy,
        colorScheme,
        currentAvatarWorkingCopy,
        isOpen,
        normalizedAvatarStageKey,
        setAvatarCompositePreviewDraft,
    ]);

    useEffect(() => {
        return () => {
            setAvatarCompositePreviewDraft(false);
            clearAvatarCompositeWorkingCopy();
        };
    }, [clearAvatarCompositeWorkingCopy, setAvatarCompositePreviewDraft]);

    const currentAvatarCommitted = normalizeAvatarStageSnapshot(
        currentAvatarCommittedStage || getResolvedAvatarStageDefault(normalizedAvatarStageKey, colorScheme)
    );
    const currentAvatarDraft = normalizeAvatarStageSnapshot(
        currentAvatarWorkingCopy || getAvatarCompositeStageDraft(normalizedAvatarStageKey, colorScheme)
    );
    const hasUnsavedAvatarDraft = !areAvatarStageSnapshotsEqual(currentAvatarDraft, currentAvatarCommitted);
    const avatarDraftStatusLabel = hasUnsavedAvatarDraft
        ? 'Working copy has unpromoted changes'
        : 'Working copy matches last promoted value';
    const buildScopedAvatarStatus = useCallback((message) => ({
        message,
        stageKey: normalizedAvatarStageKey,
        colorScheme,
    }), [colorScheme, normalizedAvatarStageKey]);
    const visibleAvatarPromoteAck =
        avatarPromoteAck?.stageKey === normalizedAvatarStageKey && avatarPromoteAck?.colorScheme === colorScheme
            ? avatarPromoteAck.message
            : '';
    const visibleAvatarDefaultStatus =
        avatarDefaultStatus?.stageKey === normalizedAvatarStageKey && avatarDefaultStatus?.colorScheme === colorScheme
            ? avatarDefaultStatus.message
            : '';

    const handleSaveStageDefault = useCallback(async () => {
        // Verify the working copy matches the stage we intend to promote.
        // If not, bail — the guard in commitAvatarCompositeWorkingCopy would
        // also catch this, but surfacing it here gives clearer user feedback.
        if (!currentAvatarWorkingCopy) {
            setAvatarPromoteAck(buildScopedAvatarStatus(
                `No active working copy for ${normalizedAvatarStageKey} (${colorScheme}). Promote skipped.`
            ));
            return;
        }

        const nowLabel = new Date().toLocaleTimeString();
        const draftSnippet = `// ${colorScheme} scheme\n${normalizedAvatarStageKey}: ${JSON.stringify(currentAvatarDraft, null, 2)},`;
        const canUseClipboard = typeof navigator !== 'undefined' && navigator.clipboard?.writeText;

        commitAvatarCompositeWorkingCopy(normalizedAvatarStageKey, colorScheme);

        if (canUseClipboard) {
            try {
                await navigator.clipboard.writeText(draftSnippet);
                setAvatarPromoteAck(buildScopedAvatarStatus(`Promoted at ${nowLabel}; stage snippet copied.`));
            } catch {
                setAvatarPromoteAck(buildScopedAvatarStatus(`Promoted at ${nowLabel}; copy snippet manually.`));
            }
        } else {
            setAvatarPromoteAck(buildScopedAvatarStatus(`Promoted at ${nowLabel}; copy snippet manually.`));
        }

        setAvatarDefaultStatus(buildScopedAvatarStatus(`Committed current working copy for ${normalizedAvatarStageKey} (${colorScheme} scheme). Canonical code defaults are unchanged.`));
    }, [buildScopedAvatarStatus, colorScheme, commitAvatarCompositeWorkingCopy, currentAvatarDraft, currentAvatarWorkingCopy, normalizedAvatarStageKey, setAvatarDefaultStatus, setAvatarPromoteAck]);

    const handleResetDraftToDefault = useCallback(() => {
        const stageDefault = getCanonicalAvatarStageDefaultTransforms(normalizedAvatarStageKey, colorScheme);
        if (!stageDefault) return;
        replaceAvatarCompositeStageDraft(normalizedAvatarStageKey, stageDefault, colorScheme);
        setAvatarPromoteAck(null);
        setAvatarDefaultStatus(buildScopedAvatarStatus(`Loaded canonical code Default into working copy for ${normalizedAvatarStageKey} (${colorScheme} scheme). Promote to save it.`));
    }, [buildScopedAvatarStatus, colorScheme, normalizedAvatarStageKey, replaceAvatarCompositeStageDraft, setAvatarDefaultStatus, setAvatarPromoteAck]);

    // Collapsible sections
    const [expandedSections, setExpandedSections] = useState({
        avatar: true,
        avatarCompositeTuner: true,
        inspectorNew: false,
        cardTuner: true,
        navBtnTuner: false,
        curriculum: false,
        tracking: false,
        onboardingContent: false,
        data: false
    });

    // Armed state for destructive actions
    const [armed, setArmed] = useState(null);

    // Inspector modal
    const [inspectorOpen, setInspectorOpen] = useState(false);
    const [storeSnapshot, setStoreSnapshot] = useState(null);
    const [cardApplyToAll, setCardApplyToAll] = useState(false);
    const [cardIdProbeEnabled, setCardIdProbeEnabled] = useState(false);
    const [uiTargetProbeEnabled, setUiTargetProbeEnabled] = useState(false);
    const [utcViolations, setUtcViolations] = useState([]);

    const controlsElectricBorderEnabled = useSettingsStore((s) => Boolean(s.controlsElectricBorderEnabled));
    const setControlsElectricBorderEnabled = useSettingsStore((s) => s.setControlsElectricBorderEnabled);
    const [controlsFxDraft, setControlsFxDraft] = useState({ ...CONTROLS_FX_DEFAULTS });
    const [controlsPresetJson, setControlsPresetJson] = useState('');
    const [controlsPresetStatus, setControlsPresetStatus] = useState('');

    // Plates state
    const [platesFxDraft, setPlatesFxDraft] = useState({ ...PLATES_FX_DEFAULTS });
    const [platesAdvancedOpen, setPlatesAdvancedOpen] = useState(false);
    const platesFxEnabled = useSettingsStore((s) => Boolean(s.platesFxEnabled));
    const setPlatesFxEnabled = useSettingsStore((s) => s.setPlatesFxEnabled);
    const {
        practiceButtonPickMode,
        setPracticeButtonPickMode,
        practiceButtonApplyToAll,
        setPracticeButtonApplyToAll,
        practiceButtonSelectedKey,
        legacyPickersEnabled,
        setLegacyPickersEnabled,
        pickDebugEnabled,
        setPickDebugEnabledLocal,
        universalPickerKind,
        setUniversalPickerKind,
        universalPickMode,
        setUniversalPickMode,
        controlsSelectedId,
        controlsSelectedRoleGroup,
        controlsSurfaceIsRoot,
        controlsSurfaceDebug,
        pickDebugResolvedMode,
        pickDebugResolvedId,
        platesSelectedId,
        stopUniversalPickCaptureImmediate,
        handleStartUniversalPickFlow,
        handleStopUniversalPickFlow,
        stopAllPickerFlows,
    } = useDevPanelPickers({
        canRunDevEffects,
        isOpen,
        devtoolsEnabled,
        isDevBuild,
        setPickMode,
        setPickDebugEnabled,
        findCardFromEvent,
        selectCard,
        emitPickerSelection,
        attachControlsCapture,
        detachControlsCapture,
        startControlsPicking,
        stopControlsPicking,
        getControlsFxPreset,
        setControlsFxDraft,
        getPlatesFxPreset,
        setPlatesFxDraft,
        setPlatesAdvancedOpen,
    });

    const makeGuardedAction = useCallback((fn) => {
        return (...args) => {
            if (destructiveLocked) return;
            return fn(...args);
        };
    }, [destructiveLocked]);

    useEffect(() => {
        if (!canRunDevEffects) return undefined;
        if (!uiTargetProbeEnabled && !universalPickMode) {
            queueMicrotask(() => setUtcViolations([]));
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
    }, [canRunDevEffects, isOpen, devtoolsEnabled, uiTargetProbeEnabled, universalPickMode]);
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

    useEffect(() => {
        if (!canRunDevEffects) return undefined;
        initCardTuner();
        const un = subscribeCardTuner((next) => {
            setCardState(next);
            if (next.globalSettings) setGlobalDraft(next.globalSettings);
            if (next.selectedSettings) setSelectedDraft(next.selectedSettings);
        });
        return () => {
            setPickMode(false);
            un();
        };
    }, [canRunDevEffects, isOpen, devtoolsEnabled]);

    useEffect(() => {
        if (!canRunDevEffects) return undefined;
        document.body.classList.toggle('dev-card-id-probe', cardIdProbeEnabled);
        return () => document.body.classList.remove('dev-card-id-probe');
    }, [canRunDevEffects, isOpen, devtoolsEnabled, cardIdProbeEnabled]);

    useEffect(() => {
        if (!canRunDevEffects) return undefined;
        initNavButtonTuner();
        const un = subscribeNavButtonTuner((next) => {
            setNavBtnState(next);
            if (next?.settings) setNavBtnDraft(next.settings);
        });
        return () => un();
    }, [canRunDevEffects, isOpen, devtoolsEnabled]);

    useEffect(() => {
        if (!devtoolsEnabled) return undefined;
        document.body.classList.toggle('dev-nav-btn-probe', navBtnProbeEnabled);
        return () => document.body.classList.remove('dev-nav-btn-probe');
    }, [devtoolsEnabled, navBtnProbeEnabled]);


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

    const onChangeNavBtnSetting = (key, value) => {
        const next = { ...navBtnDraft, [key]: value };
        setNavBtnDraft(next);
        applyNavButtonSettings(next);
    };

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
        if (!canRunDevEffects) return undefined;
        document.body.classList.toggle('dev-ui-target-probe', uiTargetProbeEnabled);
        return () => document.body.classList.remove('dev-ui-target-probe');
    }, [canRunDevEffects, isOpen, devtoolsEnabled, uiTargetProbeEnabled]);

    const platesResolved = resolvePlatesFxPreset(platesFxDraft);
    const plateOverrideResetPatch = buildPlateFxOverrideResetPatch();
    const activePlateOverrideCount = Object.keys(plateOverrideResetPatch).reduce((acc, key) => {
        return platesFxDraft[key] !== null && platesFxDraft[key] !== undefined ? acc + 1 : acc;
    }, 0);

    if (!isOpen) return null;

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
            <div className="devpanel-shell relative pointer-events-auto ml-auto w-[400px] h-full border-l overflow-y-auto no-scrollbar" style={{
                background: isLight ? '#F5F0E6' : '#0a0a12',
                borderColor: isLight ? 'rgba(180, 155, 110, 0.25)' : 'rgba(255, 255, 255, 0.1)'
            }}>
                {/* Header */}
                <div className="devpanel-header sticky top-0 z-10 border-b px-4 py-3 flex items-center justify-between" style={{
                    background: isLight ? '#F5F0E6' : '#0a0a12',
                    borderColor: isLight ? 'rgba(180, 155, 110, 0.25)' : 'rgba(255, 255, 255, 0.1)'
                }}>
                    <div className="flex items-center gap-2">
                        <span className="text-lg">🔧</span>
                        <span className="text-sm font-semibold tracking-wide" style={{
                            color: isLight ? 'rgba(45, 40, 35, 0.95)' : 'rgba(255, 255, 255, 0.9)'
                        }}>DEVELOPER PANEL</span>
                        {isProdBuild && (
                            <span
                                className="text-[10px] font-semibold px-2 py-0.5 rounded-full border"
                                style={{
                                    borderColor: 'rgba(255, 120, 120, 0.65)',
                                    color: 'rgba(255, 140, 140, 0.9)',
                                    background: 'rgba(255, 120, 120, 0.08)',
                                    letterSpacing: '0.08em',
                                }}
                            >
                                PROD DEV PANEL
                            </span>
                        )}
                        {prodGuarded && (
                            <button
                                type="button"
                                onClick={() => setProdArmed((prev) => !prev)}
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border transition-all ${
                                    prodArmed
                                        ? 'border-emerald-400/60 text-emerald-200 bg-emerald-500/15'
                                        : 'border-amber-400/50 text-amber-200/90 bg-amber-500/10'
                                }`}
                                title={prodArmed ? 'Destructive actions enabled (prod)' : 'Arm to enable destructive actions (prod)'}
                            >
                                {prodArmed ? 'ARMED' : 'ARM'}
                            </button>
                        )}
                    </div>
                    <button
                          onClick={() => {
                              stopAllPickerFlows();
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
                <div className="devpanel-content p-4 space-y-4">

                    <RuntimeVerificationReadout isLight={isLight} isDevBuild={isDevBuild} />

                    {/* ═══════════════════════════════════════════════════════════════ */}
                    {/* AVATAR STAGE */}
                    {/* ═══════════════════════════════════════════════════════════════ */}
                    <AvatarStageSection
                        expanded={expandedSections.avatar}
                        onToggle={() => toggleSection('avatar')}
                        isLight={isLight}
                        avatarStage={avatarStage}
                        setAvatarStage={setAvatarStage}
                        normalizedAvatarStageKey={normalizedAvatarStageKey}
                        avatarDraftStatusLabel={avatarDraftStatusLabel}
                        visibleAvatarPromoteAck={visibleAvatarPromoteAck}
                        visibleAvatarDefaultStatus={visibleAvatarDefaultStatus}
                        handleSaveStageDefault={handleSaveStageDefault}
                        handleResetDraftToDefault={handleResetDraftToDefault}
                    />

                    <AvatarCompositeSection
                        expanded={expandedSections.avatarCompositeTuner}
                        onToggle={() => toggleSection('avatarCompositeTuner')}
                        isLight={isLight}
                        editingStageKey={normalizeStageKey(avatarStage)}
                        prodGuarded={prodGuarded}
                        prodArmed={prodArmed}
                    />

                    {/* ═══════════════════════════════════════════════════════════════ */}
                    {/* UNIFIED INSPECTOR */}
                    {/* ═══════════════════════════════════════════════════════════════ */}
                    <UnifiedInspectorSection
                        expanded={expandedSections.inspectorNew}
                        onToggle={() => toggleSection('inspectorNew')}
                        isLight={isLight}
                        devtoolsEnabled={devtoolsEnabled}
                        universalPickerKind={universalPickerKind}
                        setUniversalPickerKind={setUniversalPickerKind}
                        universalPickMode={universalPickMode}
                        handleStopUniversalPickFlow={handleStopUniversalPickFlow}
                        handleStartUniversalPickFlow={handleStartUniversalPickFlow}
                        legacyPickersEnabled={legacyPickersEnabled}
                        setLegacyPickersEnabled={setLegacyPickersEnabled}
                        pickDebugEnabled={pickDebugEnabled}
                        setPickDebugEnabledLocal={setPickDebugEnabledLocal}
                        uiTargetProbeEnabled={uiTargetProbeEnabled}
                        setUiTargetProbeEnabled={setUiTargetProbeEnabled}
                        cardIdProbeEnabled={cardIdProbeEnabled}
                        setCardIdProbeEnabled={setCardIdProbeEnabled}
                        pickDebugResolvedMode={pickDebugResolvedMode}
                        pickDebugResolvedId={pickDebugResolvedId}
                        controlsSelectedId={controlsSelectedId}
                        controlsSelectedRoleGroup={controlsSelectedRoleGroup}
                        controlsSurfaceIsRoot={controlsSurfaceIsRoot}
                        controlsSurfaceDebug={controlsSurfaceDebug}
                        controlsElectricBorderEnabled={controlsElectricBorderEnabled}
                        setControlsElectricBorderEnabled={setControlsElectricBorderEnabled}
                        controlsFxDraft={controlsFxDraft}
                        setControlsFxDraft={setControlsFxDraft}
                        setControlsFxPreset={setControlsFxPreset}
                        resetControlsFxPreset={makeGuardedAction(resetControlsFxPreset)}
                        getControlsFxPreset={getControlsFxPreset}
                        controlsPresetJson={controlsPresetJson}
                        setControlsPresetJson={setControlsPresetJson}
                        controlsPresetStatus={controlsPresetStatus}
                        setControlsPresetStatus={setControlsPresetStatus}
                        exportControlsFxPresetsJson={exportControlsFxPresetsJson}
                        importControlsFxPresetsJson={importControlsFxPresetsJson}
                        resetAllControlsFxPresets={makeGuardedAction(resetAllControlsFxPresets)}
                        utcViolations={utcViolations}
                        platesSelectedId={platesSelectedId}
                        platesFxEnabled={platesFxEnabled}
                        setPlatesFxEnabled={setPlatesFxEnabled}
                        platesFxDraft={platesFxDraft}
                        patchSelectedPlatePreset={patchSelectedPlatePreset}
                        platesResolved={platesResolved}
                        platesAdvancedOpen={platesAdvancedOpen}
                        setPlatesAdvancedOpen={setPlatesAdvancedOpen}
                        activePlateOverrideCount={activePlateOverrideCount}
                        resetSelectedPlateOverrides={makeGuardedAction(resetSelectedPlateOverrides)}
                        cardApplyToAll={cardApplyToAll}
                        setCardApplyToAll={setCardApplyToAll}
                        cardState={cardState}
                        activeDraft={activeDraft}
                        selectedDisabled={selectedDisabled}
                        onChangeCardSetting={onChangeCardSetting}
                        cardTunerExpanded={expandedSections.cardTuner}
                        onToggleCardTuner={() => toggleSection('cardTuner')}
                        cardElectricBorderEnabled={cardElectricBorderEnabled}
                        setCardElectricBorderEnabled={setCardElectricBorderEnabled}
                        practiceButtonFxEnabled={practiceButtonFxEnabled}
                        setPracticeButtonFxEnabled={setPracticeButtonFxEnabled}
                        practiceButtonPickMode={practiceButtonPickMode}
                        setPracticeButtonPickMode={setPracticeButtonPickMode}
                        stopUniversalPickCaptureImmediate={stopUniversalPickCaptureImmediate}
                        setUniversalPickMode={setUniversalPickMode}
                        setPickMode={setPickMode}
                        practiceButtonApplyToAll={practiceButtonApplyToAll}
                        setPracticeButtonApplyToAll={setPracticeButtonApplyToAll}
                        practiceButtonSelectedKey={practiceButtonSelectedKey}
                        saveGlobal={saveGlobal}
                        globalDraft={globalDraft}
                        saveSelected={saveSelected}
                        selectedDraft={selectedDraft}
                        resetGlobal={makeGuardedAction(resetGlobal)}
                        resetSelected={makeGuardedAction(resetSelected)}
                        clearAll={makeGuardedAction(clearAll)}
                        navBtnTunerExpanded={expandedSections.navBtnTuner}
                        onToggleNavBtnTuner={() => toggleSection('navBtnTuner')}
                        navBtnProbeEnabled={navBtnProbeEnabled}
                        setNavBtnProbeEnabled={setNavBtnProbeEnabled}
                        navBtnState={navBtnState}
                        setNavButtonTunerEnabled={setNavButtonTunerEnabled}
                        navBtnDraft={navBtnDraft}
                        onChangeNavBtnSetting={onChangeNavBtnSetting}
                        resetNavButtonSettings={makeGuardedAction(resetNavButtonSettings)}
                    />

                    {/* ═══════════════════════════════════════════════════════════════ */}
                    {/* CURRICULUM SIMULATION SECTION */}
                    {/* ═══════════════════════════════════════════════════════════════ */}
                    <CurriculumSection
                        expanded={expandedSections.curriculum}
                        onToggle={() => toggleSection('curriculum')}
                        armed={armed}
                        handleDestructive={handleDestructive}
                        destructiveLocked={destructiveLocked}
                        makeGuardedAction={makeGuardedAction}
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
                    {/* REPORTING LAYER */}
                    {/* ═══════════════════════════════════════════════════════════════ */}
                    <Section
                        title="Reporting Layer"
                        expanded={expandedSections.reporting || false}
                        onToggle={() => toggleSection('reporting')}
                        isLight={isLight}
                    >
                        <div className="text-[10px] text-white/50 mb-3">Pure reporting queries for dashboard metrics</div>

                        {/* Test lifetime scope */}
                        <div className="mb-4 bg-white/5 rounded-lg p-3">
                            <div className="text-xs text-white/80 font-mono mb-2">lifetime scope:</div>
                            {(() => {
                                let tiles = null; let lifetimeErr = null;
                                try { tiles = getQuickDashboardTiles({ scope: 'lifetime', range: '365d' }); } catch (e) { lifetimeErr = e.message; }
                                if (lifetimeErr) return <div className="text-red-300 text-[10px]">Error: {lifetimeErr}</div>;
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
                            })()}
                        </div>

                        {/* Test runId scope */}
                        <div className="mb-4 bg-white/5 rounded-lg p-3">
                            <div className="text-xs text-white/80 font-mono mb-2">runId scope (active path):</div>
                            {(() => {
                                let tilesRun = null; let runIdErr = null;
                                try { tilesRun = getQuickDashboardTiles({ scope: 'runId', range: 'all' }); } catch (e) { runIdErr = e.message; }
                                if (runIdErr) return <div className="text-red-300 text-[10px]">Error: {runIdErr}</div>;
                                return (
                                    <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                                        <div className="bg-white/5 p-1.5 rounded">
                                            Minutes: <span className="text-sky-300">{tilesRun.minutes}</span>
                                        </div>
                                        <div className="bg-white/5 p-1.5 rounded">
                                            Sessions: <span className="text-sky-300">{tilesRun.sessionCount}</span>
                                        </div>
                                        <div className="bg-white/5 p-1.5 rounded">
                                            Days: <span className="text-sky-300">{tilesRun.activeDays}</span>
                                        </div>
                                        <div className="bg-white/5 p-1.5 rounded">
                                            Complete: <span className="text-sky-300">{tilesRun.completionRate}%</span>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>

                        {/* Practice breakdown */}
                        <div className="bg-white/5 rounded-lg p-3 mb-4">
                            <div className="text-xs text-white/80 font-mono mb-2">Practice breakdown (lifetime):</div>
                            {(() => {
                                let breakdown = null; let breakdownErr = null;
                                try { breakdown = getCurriculumPracticeBreakdown({ scope: 'lifetime', range: '365d' }); } catch (e) { breakdownErr = e.message; }
                                if (breakdownErr) return <div className="text-red-300 text-[10px]">Error: {breakdownErr}</div>;
                                if (breakdown.length === 0) return <div className="text-white/40 text-[10px]">No sessions recorded</div>;
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
                            })()}
                        </div>

                        {/* Breathwork detail metrics */}
                        <div className="bg-white/5 rounded-lg p-3">
                            <div className="text-xs text-white/80 font-mono mb-2">Breathwork detail (lifetime):</div>
                            {(() => {
                                let detail = null; let detailErr = null;
                                try { detail = getPracticeDetailMetrics({ scope: 'lifetime', range: '365d', practiceFamily: 'breathwork' }); } catch (e) { detailErr = e.message; }
                                if (detailErr) return <div className="text-red-300 text-[10px]">Error: {detailErr}</div>;
                                if (!detail || detail.sessionCount === 0) return <div className="text-white/40 text-[10px]">No breathwork sessions</div>;
                                return (
                                    <div className="space-y-1 text-[10px] text-white/70 font-mono">
                                        <div>Minutes: <span className="text-white/90">{detail.totalMinutes}m</span></div>
                                        <div>Sessions: <span className="text-white/90">{detail.sessionCount}</span></div>
                                        <div>Avg Duration: <span className="text-white/90">{detail.avgDurationMin}m</span></div>
                                        <div>Completion: <span className="text-white/90">{detail.completionRate}%</span></div>
                                        <div>On-time: <span className="text-white/90">{detail.adherencePercent}%</span></div>
                                    </div>
                                );
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

                        {/* Photonic Beginner Guide */}
                        <div className="mt-4">
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

                        {/* Tutorial Script Editor */}
                        <div className="mt-4">
                            <TutorialEditor />
                        </div>
                    </Section>

                    <Section
                        title="Onboarding Content"
                        expanded={expandedSections.onboardingContent}
                        onToggle={() => toggleSection('onboardingContent')}
                        isLight={isLight}
                    >
                        <div className="text-[10px] text-white/45 mb-3">
                            Edits only the externalized non-interactive onboarding steps and previews through the live onboarding renderer.
                        </div>
                        <OnboardingContentEditor />
                    </Section>
                    {/* DATA MANAGEMENT */}
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
                            }}>Copy Snapshot</DevButton>
                        </div>

                        <div className="border-t border-white/10 mt-1 pt-3">
                            {/* Reset dev stores (destructive in-memory) */}
                            <div style={destructiveLocked ? { opacity: 0.5 } : undefined}>
                                <DestructiveButton
                                    label="Reset Dev Stores"
                                    armed={armed === 'all'}
                                    onArm={makeGuardedAction(() => handleDestructive('all', devHelpers.resetAllStores))}
                                />
                                {destructiveLocked && (
                                    <div className="text-[10px] text-white/50 mt-1">
                                        Arm to enable destructive actions (prod only).
                                    </div>
                                )}
                            </div>
                            <div className="text-[10px] text-white/40 mt-1">
                                In-memory only: resets lunarStore + pathStore. Does not wipe localStorage or session history.
                            </div>
                        </div>
                    </Section>

                    <Section
                        title="Danger Zone"
                        expanded={expandedSections.danger || false}
                        onToggle={() => toggleSection('danger')}
                        isLight={isLight}
                    >
                        <div className="text-[10px] text-white/50 mb-3">Persisted — affects all stores and cannot be undone.</div>
                        <div style={destructiveLocked ? { opacity: 0.5 } : undefined}>
                            <DestructiveButton
                                label="Wipe localStorage"
                                armed={armed === 'wipeStorage'}
                                onArm={makeGuardedAction(() => handleDestructive('wipeStorage', resetLocalData))}
                            />
                            {destructiveLocked && (
                                <div className="text-[10px] text-white/50 mt-1">
                                    Arm to enable destructive actions (prod only).
                                </div>
                            )}
                        </div>
                        <div className="text-[10px] text-white/40 mt-1">
                            Wipes all persisted immanenceOS.* localStorage keys and reloads.
                        </div>
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
                    <button
                        type="button"
                        className="absolute inset-0 bg-black/80"
                        onClick={() => setInspectorOpen(false)}
                        aria-label="Dismiss dialog"
                        style={{ border: 'none', padding: 0 }}
                    />
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

export default DevPanel;
