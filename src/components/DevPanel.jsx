// src/components/DevPanel.jsx
// Developer-only lab for testing Immanence OS systems
// Access: Ctrl+Shift+D or tap version 5 times

import React, { useState, useCallback, useEffect } from 'react';
import { useLunarStore } from '../state/lunarStore';
import { usePathStore, PATH_NAMES, PATH_SYMBOLS } from '../state/pathStore';
import { STAGES, STAGE_THRESHOLDS } from '../state/stageConfig';
import { Avatar } from './Avatar';
import * as devHelpers from '../utils/devHelpers';

// Available stages and paths for dropdowns
const STAGE_OPTIONS = ['seedling', 'ember', 'flame', 'beacon', 'stellar'];
const PATH_OPTIONS = ['Soma', 'Prana', 'Dhyana', 'Drishti', 'Jnana', 'Samyoga'];

export function DevPanel({
    isOpen,
    onClose,
    avatarStage = 'flame',
    setAvatarStage,
    avatarPath = 'Prana',
    setAvatarPath,
    showCore = false,
    setShowCore
}) {

    // Lunar store state
    const lunarProgress = useLunarStore(s => s.progress);
    const totalDays = useLunarStore(s => s.totalPracticeDays);
    const currentStage = useLunarStore(s => s.getCurrentStage());
    const recentActivity = useLunarStore(s => s.recentActivity);
    const sparkleMode = useLunarStore(s => s.sparkleMode);
    const cycleSparkleMode = useLunarStore(s => s.cycleSparkleMode);

    // Path store state
    const currentPath = usePathStore(s => s.currentPath);
    const pathStatus = usePathStore(s => s.pathStatus);
    const pendingCeremony = usePathStore(s => s.pendingCeremony);

    // Collapsible sections
    const [expandedSections, setExpandedSections] = useState({
        avatar: true,
        lunar: true,
        path: false,
        data: false
    });

    // Armed state for destructive actions
    const [armed, setArmed] = useState(null);

    // Slider state
    const [sliderProgress, setSliderProgress] = useState(lunarProgress);

    // Sync slider with store
    useEffect(() => {
        setSliderProgress(lunarProgress);
    }, [lunarProgress]);

    // Inspector modal
    const [inspectorOpen, setInspectorOpen] = useState(false);
    const [storeSnapshot, setStoreSnapshot] = useState(null);

    // Gyro simulation state
    const [gyroX, setGyroX] = useState(0);
    const [gyroY, setGyroY] = useState(0);

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

    // Handle slider change
    const handleProgressChange = (e) => {
        const value = parseFloat(e.target.value);
        setSliderProgress(value);
    };

    // Commit slider value on release
    const handleProgressCommit = () => {
        devHelpers.setMoonProgress(sliderProgress);
    };

    // Open inspector
    const openInspector = () => {
        setStoreSnapshot(devHelpers.getStoreSnapshot());
        setInspectorOpen(true);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Panel */}
            <div className="relative ml-auto w-[400px] h-full bg-[#0a0a12] border-l border-white/10 overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 z-10 bg-[#0a0a12] border-b border-white/10 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-lg">🔧</span>
                        <span className="text-sm font-semibold text-white/90 tracking-wide">DEVELOPER PANEL</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                    >
                        ✕
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-4">

                    {/* ═══════════════════════════════════════════════════════════════ */}
                    {/* AVATAR SECTION */}
                    {/* ═══════════════════════════════════════════════════════════════ */}
                    <Section
                        title="Avatar Preview"
                        expanded={expandedSections.avatar}
                        onToggle={() => toggleSection('avatar')}
                    >
                        {/* Avatar display */}
                        <div className="flex justify-center mb-4 scale-50 origin-center -my-16">
                            <Avatar
                                mode="hub"
                                stage={avatarStage}
                                path={showCore ? null : avatarPath}
                                showCore={showCore}
                            />
                        </div>

                        {/* Stage selector */}
                        <div className="flex items-center gap-3 mb-3">
                            <label className="text-xs text-white/50 w-16">Stage</label>
                            <select
                                value={avatarStage}
                                onChange={(e) => setAvatarStage(e.target.value)}
                                className="flex-1 bg-[#1a1a24] border border-white/10 rounded-lg px-3 py-2 text-sm text-white/90"
                                style={{ colorScheme: 'dark' }}
                            >
                                {STAGE_OPTIONS.map(s => (
                                    <option key={s} value={s} className="bg-[#1a1a24] text-white">{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                                ))}
                            </select>
                        </div>

                        {/* Path selector */}
                        <div className="flex items-center gap-3 mb-3">
                            <label className="text-xs text-white/50 w-16">Path</label>
                            <select
                                value={avatarPath}
                                onChange={(e) => setAvatarPath(e.target.value)}
                                className="flex-1 bg-[#1a1a24] border border-white/10 rounded-lg px-3 py-2 text-sm text-white/90"
                                style={{ colorScheme: 'dark' }}
                            >
                                {PATH_OPTIONS.map(p => (
                                    <option key={p} value={p} className="bg-[#1a1a24] text-white">{p}</option>
                                ))}
                            </select>
                        </div>

                        {/* Show Core toggle */}
                        <div className="flex items-center gap-3 mb-4">
                            <label className="text-xs text-white/50 w-16">Show Core</label>
                            <button
                                onClick={() => setShowCore(!showCore)}
                                className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${showCore
                                    ? 'bg-amber-500/30 text-amber-300 border border-amber-500/50'
                                    : 'bg-white/5 text-white/50 border border-white/10'
                                    }`}
                            >
                                {showCore ? 'ON' : 'OFF'}
                            </button>
                        </div>

                        {/* Gyro Simulation for Ring Drift */}
                        <div className="border-t border-white/10 pt-3 mt-2">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-white/50">🎯 Ring Drift Simulation</span>
                                <span className="text-[10px] text-cyan-400/70 font-mono">
                                    X:{gyroX.toFixed(0)} Y:{gyroY.toFixed(0)}
                                </span>
                            </div>

                            {/* X Tilt */}
                            <div className="flex items-center gap-2 mb-2">
                                <label className="text-xs text-white/40 w-8">X</label>
                                <input
                                    type="range"
                                    min="-30"
                                    max="30"
                                    value={gyroX}
                                    className="flex-1 accent-cyan-500"
                                    onChange={(e) => {
                                        const val = parseFloat(e.target.value);
                                        setGyroX(val);
                                        console.log('🎯 Gyro X:', val);
                                        window.dispatchEvent(new CustomEvent('dev-gyro', {
                                            detail: { axis: 'gamma', value: val }
                                        }));
                                    }}
                                />
                            </div>

                            {/* Y Tilt */}
                            <div className="flex items-center gap-2 mb-2">
                                <label className="text-xs text-white/40 w-8">Y</label>
                                <input
                                    type="range"
                                    min="-30"
                                    max="30"
                                    value={gyroY}
                                    className="flex-1 accent-cyan-500"
                                    onChange={(e) => {
                                        const val = parseFloat(e.target.value);
                                        setGyroY(val);
                                        console.log('🎯 Gyro Y:', val);
                                        window.dispatchEvent(new CustomEvent('dev-gyro', {
                                            detail: { axis: 'beta', value: val }
                                        }));
                                    }}
                                />
                            </div>

                            {/* Reset button */}
                            <button
                                onClick={() => {
                                    setGyroX(0);
                                    setGyroY(0);
                                    window.dispatchEvent(new CustomEvent('dev-gyro', { detail: { reset: true } }));
                                }}
                                className="w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white/60 hover:text-white/90 transition-all"
                            >
                                Reset Tilt
                            </button>
                        </div>
                    </Section>

                    {/* ═══════════════════════════════════════════════════════════════ */}
                    {/* LUNAR PROGRESS SECTION */}
                    {/* ═══════════════════════════════════════════════════════════════ */}
                    <Section
                        title="Lunar Progress"
                        expanded={expandedSections.lunar}
                        onToggle={() => toggleSection('lunar')}
                    >
                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
                            <div className="bg-white/5 rounded-lg px-3 py-2">
                                <div className="text-white/40">Progress</div>
                                <div className="text-white/90 font-mono">{lunarProgress.toFixed(2)} / 12</div>
                            </div>
                            <div className="bg-white/5 rounded-lg px-3 py-2">
                                <div className="text-white/40">Total Days</div>
                                <div className="text-white/90 font-mono">{totalDays}</div>
                            </div>
                            <div className="bg-white/5 rounded-lg px-3 py-2">
                                <div className="text-white/40">Stage</div>
                                <div className="text-white/90">{currentStage}</div>
                            </div>
                            <div className="bg-white/5 rounded-lg px-3 py-2">
                                <div className="text-white/40">Trail Length</div>
                                <div className="text-white/90">{recentActivity.filter(a => a.completed).length}/7</div>
                            </div>
                        </div>

                        {/* Sparkle mode toggle */}
                        <div className="flex items-center justify-between mb-4 bg-white/5 rounded-lg px-3 py-2">
                            <span className="text-xs text-white/50">Moon Sparkles</span>
                            <button
                                onClick={cycleSparkleMode}
                                className="px-3 py-1 rounded text-xs bg-amber-500/20 border border-amber-500/30 text-amber-300 hover:bg-amber-500/30 transition-colors"
                            >
                                {sparkleMode === 'none' ? '✗ None' : sparkleMode === 'static' ? '✦ Static' : '✧ Floating'}
                            </button>
                        </div>

                        {/* Progress slider */}
                        <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-white/50">Moon Position</span>
                                <span className="text-xs text-white/70 font-mono">{sliderProgress.toFixed(1)}</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="12"
                                step="0.1"
                                value={sliderProgress}
                                onChange={handleProgressChange}
                                onMouseUp={handleProgressCommit}
                                onTouchEnd={handleProgressCommit}
                                className="w-full accent-amber-500"
                            />
                        </div>

                        {/* Practice buttons */}
                        <div className="grid grid-cols-3 gap-2 mb-3">
                            <DevButton onClick={() => devHelpers.simulatePracticeDays(1)}>+1 Day</DevButton>
                            <DevButton onClick={() => devHelpers.simulatePracticeDays(10)}>+10 Days</DevButton>
                            <DevButton onClick={() => devHelpers.simulatePracticeDays(30)}>+30 Days</DevButton>
                        </div>

                        {/* Stage buttons */}
                        <div className="grid grid-cols-2 gap-2 mb-3">
                            <DevButton onClick={() => devHelpers.goToPreviousStage()}>← Prev Stage</DevButton>
                            <DevButton onClick={() => devHelpers.advanceToNextStage()}>Next Stage →</DevButton>
                        </div>

                        {/* Simulation buttons */}
                        <div className="grid grid-cols-2 gap-2 mb-3">
                            <DevButton onClick={() => devHelpers.simulateDrift(7)}>Simulate 7-Day Drift</DevButton>
                            <DevButton onClick={() => devHelpers.fillRecentActivity()}>Fill Trail</DevButton>
                        </div>

                        {/* Reset lunar (destructive) */}
                        <DestructiveButton
                            label="Reset Lunar"
                            armed={armed === 'lunar'}
                            onArm={() => handleDestructive('lunar', () => useLunarStore.getState()._devReset())}
                        />
                    </Section>

                    {/* ═══════════════════════════════════════════════════════════════ */}
                    {/* PATH CEREMONY SECTION */}
                    {/* ═══════════════════════════════════════════════════════════════ */}
                    <Section
                        title="Path Ceremony"
                        expanded={expandedSections.path}
                        onToggle={() => toggleSection('path')}
                    >
                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
                            <div className="bg-white/5 rounded-lg px-3 py-2">
                                <div className="text-white/40">Current Path</div>
                                <div className="text-white/90">{currentPath || 'None'}</div>
                            </div>
                            <div className="bg-white/5 rounded-lg px-3 py-2">
                                <div className="text-white/40">Status</div>
                                <div className="text-white/90">{pathStatus}</div>
                            </div>
                        </div>

                        {/* Pending ceremony indicator */}
                        {pendingCeremony && (
                            <div className="bg-amber-500/20 border border-amber-500/40 rounded-lg px-3 py-2 mb-4 text-xs text-amber-300">
                                Ceremony pending: {pendingCeremony.type} → {pendingCeremony.path}
                            </div>
                        )}

                        {/* Ceremony triggers */}
                        <div className="grid grid-cols-2 gap-2 mb-3">
                            <DevButton onClick={() => devHelpers.triggerPathEmergence('Prana')}>Trigger Emergence</DevButton>
                            <DevButton onClick={() => devHelpers.triggerPathShift('Prana', 'Dhyana')}>Trigger Shift</DevButton>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mb-3">
                            <DevButton onClick={() => devHelpers.clearCeremony()}>Clear Ceremony</DevButton>
                            <DevButton onClick={() => devHelpers.setPath('Prana')}>Set Path: Prana</DevButton>
                        </div>

                        {/* Reset path (destructive) */}
                        <DestructiveButton
                            label="Reset Path Data"
                            armed={armed === 'path'}
                            onArm={() => handleDestructive('path', () => usePathStore.getState()._devReset())}
                        />
                    </Section>

                    {/* ═══════════════════════════════════════════════════════════════ */}
                    {/* DATA SECTION */}
                    {/* ═══════════════════════════════════════════════════════════════ */}
                    <Section
                        title="Data Management"
                        expanded={expandedSections.data}
                        onToggle={() => toggleSection('data')}
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

function Section({ title, expanded, onToggle, children }) {
    return (
        <div className="bg-white/[0.03] border border-white/10 rounded-xl overflow-hidden">
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/5 transition-colors"
            >
                <span className="text-sm text-white/80 font-medium">{title}</span>
                <span className="text-white/40">{expanded ? '▼' : '▶'}</span>
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
