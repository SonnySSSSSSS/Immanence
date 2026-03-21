import React, { useMemo, useState } from 'react';
import { AVATAR_COMPOSITE_LAYER_IDS, useDevPanelStore } from '../../../state/devPanelStore.js';
import { normalizeStageKey } from '../../../config/avatarStageAssets.js';
import Section from '../ui/Section.jsx';
import RangeControl from '../ui/RangeControl.jsx';

const AVATAR_COMPOSITE_LINK_OPTIONS = ['none', ...AVATAR_COMPOSITE_LAYER_IDS];
const AVATAR_COMPOSITE_LAYER_LABELS = {
    bg: 'Background',
    stage: 'Plant / Foreground',
    glass: 'Glass',
    ring: 'Rune Ring',
};
const DEFAULT_ROLE_RESET = {
    enabled: true,
    opacity: 1,
    scale: 1,
    rotateDeg: 0,
    x: 0,
    y: 0,
    linkTo: null,
    linkOpacity: false,
};
function AvatarCompositeSection({
    expanded,
    onToggle,
    isLight = false,
    editingStageKey = 'seedling',
    prodGuarded = false,
    prodArmed = false,
}) {
    const avatarComposite = useDevPanelStore(s => s.avatarComposite);
    const setAvatarCompositeEnabled = useDevPanelStore(s => s.setAvatarCompositeEnabled);
    const setAvatarCompositeDebugOverlay = useDevPanelStore(s => s.setAvatarCompositeDebugOverlay);
    const getAvatarCompositeRoleTransform = useDevPanelStore(s => s.getAvatarCompositeRoleTransform);
    const setAvatarCompositeRoleTransform = useDevPanelStore(s => s.setAvatarCompositeRoleTransform);
    const setAvatarCompositeRoleTransformEnabled = useDevPanelStore(s => s.setAvatarCompositeRoleTransformEnabled);
    const setAvatarCompositeRoleTransformValue = useDevPanelStore(s => s.setAvatarCompositeRoleTransformValue);
    const setAvatarCompositeRoleTransformLink = useDevPanelStore(s => s.setAvatarCompositeRoleTransformLink);
    const setAvatarCompositeRoleTransformLinkOpacity = useDevPanelStore(s => s.setAvatarCompositeRoleTransformLinkOpacity);
    const resetAvatarCompositeStage = useDevPanelStore(s => s.resetAvatarCompositeStage);
    const getAvatarCompositeAllStagesJSON = useDevPanelStore(s => s.getAvatarCompositeAllStagesJSON);

    const [layerExpanded, setLayerExpanded] = useState({
        bg: true,
        stage: false,
        glass: false,
        ring: false,
    });
    const [jsonStatus, setJsonStatus] = useState('');

    const colorScheme = isLight ? 'light' : 'dark';
    const normalizedEditingStageKey = normalizeStageKey(editingStageKey);
    const editingStageLabel = normalizedEditingStageKey.charAt(0).toUpperCase() + normalizedEditingStageKey.slice(1);
    const layers = useMemo(() => {
        const nextLayers = {};
        AVATAR_COMPOSITE_LAYER_IDS.forEach((layerId) => {
            nextLayers[layerId] = getAvatarCompositeRoleTransform(normalizedEditingStageKey, layerId, colorScheme);
        });
        return nextLayers;
    }, [colorScheme, getAvatarCompositeRoleTransform, normalizedEditingStageKey]);
    const tunerEnabled = avatarComposite?.enabled !== false;
    const showDebugOverlay = Boolean(avatarComposite?.showDebugOverlay);

    const destructiveLocked = prodGuarded && !prodArmed;
    const toggleLayer = (layerId) => {
        setLayerExpanded(prev => ({ ...prev, [layerId]: !prev[layerId] }));
    };

    const nudgeRotation = (layerId, delta) => {
        const layer = layers[layerId];
        if (!layer) return;
        setAvatarCompositeRoleTransformValue(normalizedEditingStageKey, layerId, 'rotateDeg', layer.rotateDeg + delta, colorScheme);
    };

    const resetTransforms = (layerId) => {
        setAvatarCompositeRoleTransformValue(normalizedEditingStageKey, layerId, 'scale', 1, colorScheme);
        setAvatarCompositeRoleTransformValue(normalizedEditingStageKey, layerId, 'rotateDeg', 0, colorScheme);
        setAvatarCompositeRoleTransformValue(normalizedEditingStageKey, layerId, 'x', 0, colorScheme);
        setAvatarCompositeRoleTransformValue(normalizedEditingStageKey, layerId, 'y', 0, colorScheme);
    };

    const copyAllStagesJson = async () => {
        const json = getAvatarCompositeAllStagesJSON(colorScheme);
        if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
            try {
                await navigator.clipboard.writeText(json);
                setJsonStatus('Copied all stages JSON to clipboard.');
                return;
            } catch {
                // Fallback handled below.
            }
        }
        setJsonStatus('Clipboard unavailable; unable to copy.');
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
            <div className="text-[11px] text-white/70 mb-3">
                Editing stage: <span className="font-semibold text-white/90">{editingStageLabel}</span>
            </div>
            <div className="text-[11px] text-white/55 mb-3">
                `Save Stage Default` is the only runtime save path. JSON tools below are draft import/export only.
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

            <div className="grid grid-cols-2 gap-2 mb-4">
                <button
                    onClick={() => {
                        if (destructiveLocked) return;
                        resetAvatarCompositeStage(normalizedEditingStageKey, colorScheme);
                    }}
                    disabled={destructiveLocked}
                    className="rounded-lg px-3 py-2 text-xs bg-red-500/10 border border-red-500/35 text-red-300/80 hover:bg-red-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    Reset Current Stage
                </button>
                <button
                    onClick={copyAllStagesJson}
                    className="rounded-lg px-3 py-2 text-xs bg-white/5 border border-white/15 text-white/70 hover:bg-white/10 transition-all"
                >
                    Copy All Stages JSON
                </button>
            </div>
            {!!jsonStatus && <div className="text-[10px] text-white/55 mb-4">{jsonStatus}</div>}
            {destructiveLocked && (
                <div className="text-[10px] text-white/55 mb-4">
                    Arm to enable destructive actions (prod only).
                </div>
            )}

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
                                            onClick={() => setAvatarCompositeRoleTransformEnabled(normalizedEditingStageKey, layerId, !layer.enabled, colorScheme)}
                                            className={`rounded-lg px-2 py-1.5 text-[11px] border transition-all ${layer.enabled ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-100' : 'bg-white/5 border-white/15 text-white/65'}`}
                                        >
                                            {layer.enabled ? 'Layer On' : 'Layer Off'}
                                        </button>
                                        <button
                                            onClick={() => setAvatarCompositeRoleTransform(normalizedEditingStageKey, layerId, DEFAULT_ROLE_RESET, colorScheme)}
                                            className="rounded-lg px-2 py-1.5 text-[11px] bg-white/5 border border-white/15 text-white/70 hover:bg-white/10 transition-all"
                                        >
                                            Reset Layer
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-[1fr_auto] gap-2 items-center">
                                        <select
                                            value={linkToValue}
                                            onChange={(e) => setAvatarCompositeRoleTransformLink(normalizedEditingStageKey, layerId, e.target.value === 'none' ? null : e.target.value, colorScheme)}
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
                                                onClick={() => setAvatarCompositeRoleTransformLinkOpacity(normalizedEditingStageKey, layerId, !layer.linkOpacity, colorScheme)}
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
                                        onChange={(value) => setAvatarCompositeRoleTransformValue(normalizedEditingStageKey, layerId, 'opacity', value, colorScheme)}
                                    />
                                    <RangeControl
                                        label="Scale"
                                        value={layer.scale}
                                        min={0.5}
                                        max={2}
                                        step={0.01}
                                        disabled={!tunerEnabled || !layer.enabled || transformsLocked}
                                        onChange={(value) => setAvatarCompositeRoleTransformValue(normalizedEditingStageKey, layerId, 'scale', value, colorScheme)}
                                    />
                                    <RangeControl
                                        label="Rotate"
                                        value={layer.rotateDeg}
                                        min={-180}
                                        max={180}
                                        step={1}
                                        suffix="deg"
                                        disabled={!tunerEnabled || !layer.enabled || transformsLocked}
                                        onChange={(value) => setAvatarCompositeRoleTransformValue(normalizedEditingStageKey, layerId, 'rotateDeg', value, colorScheme)}
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
                                            onClick={() => setAvatarCompositeRoleTransformValue(normalizedEditingStageKey, layerId, 'rotateDeg', 0, colorScheme)}
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
                                        onChange={(value) => setAvatarCompositeRoleTransformValue(normalizedEditingStageKey, layerId, 'x', value, colorScheme)}
                                    />
                                    <RangeControl
                                        label="Y"
                                        value={layer.y}
                                        min={-100}
                                        max={100}
                                        step={1}
                                        suffix="px"
                                        disabled={!tunerEnabled || !layer.enabled || transformsLocked}
                                        onChange={(value) => setAvatarCompositeRoleTransformValue(normalizedEditingStageKey, layerId, 'y', value, colorScheme)}
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
        </Section>
    );
}
export default AvatarCompositeSection;
