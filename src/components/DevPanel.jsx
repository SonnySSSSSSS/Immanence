// src/components/DevPanel.jsx
// Developer-only lab for testing Immanence OS systems
// Access: Ctrl+Shift+D or tap version 5 times

import React, { useState, useCallback, useEffect, Suspense } from 'react';
import { useLunarStore } from '../state/lunarStore';
import { STAGES, STAGE_THRESHOLDS } from '../state/stageConfig';
import { generateMockSessions, MOCK_PATTERNS } from '../utils/devDataGenerator';
import { useProgressStore } from '../state/progressStore';
import { useSettingsStore } from '../state/settingsStore';
import { useDisplayModeStore } from '../state/displayModeStore';
import { useCurriculumStore } from '../state/curriculumStore';
import { useCycleStore } from '../state/cycleStore';
import { useApplicationStore } from '../state/applicationStore';
import { useNavigationStore } from '../state/navigationStore';
import { useTutorialStore } from '../state/tutorialStore';
import { LLMTestPanel } from './dev/LLMTestPanel.jsx';
import { CoordinateHelper } from './dev/CoordinateHelper.jsx';
import { TutorialEditor } from './dev/TutorialEditor.jsx';
import { getQuickDashboardTiles, getCurriculumPracticeBreakdown, getPracticeDetailMetrics } from '../reporting/dashboardProjection.js';

// Lazy-loaded lab component (code-split, only loads when DevPanel opens)
const BloomRingLab = React.lazy(() => import('./dev/BloomRingLab.jsx').then(m => ({ default: m.BloomRingLab })));

// Available stages and paths for dropdowns
const STAGE_OPTIONS = ['Seedling', 'Ember', 'Flame', 'Beacon', 'Stellar'];
const PATH_OPTIONS = ['Soma', 'Prana', 'Dhyana', 'Drishti', 'Jnana', 'Samyoga'];

// ═══════════════════════════════════════════════════════════════════════════
// HELPER COMPONENTS (moved outside to avoid hook rendering issues)
// ═══════════════════════════════════════════════════════════════════════════

// StreakDisplay component: Visual fire emoji intensity based on streak length
function StreakDisplay({ streak }) {
    let fireEmoji = '';

    if (streak === 0) {
        fireEmoji = '💨'; // No streak
    } else if (streak < 3) {
        fireEmoji = '🔥'; // Small fire
    } else if (streak < 7) {
        fireEmoji = '🔥🔥'; // Growing
    } else if (streak < 14) {
        fireEmoji = '🔥🔥🔥'; // Strong
    } else if (streak < 30) {
        fireEmoji = '🔥🔥🔥🔥'; // Blazing
    } else {
        fireEmoji = '🔥🔥🔥🔥🔥'; // Inferno
    }

    return <span className="inline-block">{fireEmoji}</span>;
}

function getNewestDateKey(sessions = []) {
    let newest = null;
    sessions.forEach((session) => {
        const key = session?.dateKey;
        if (!key) return;
        if (!newest || key > newest) newest = key;
    });
    return newest;
}

// SessionCard mini-component: displays type, duration, precision
function SessionCard({ session, isLight }) {
    const practiceTypeLabels = {
        breath: '🌬️ Breath',
        breathwork: '🌬️ Breath',
        visualization: '👁️ Visual',
        wisdom: '📖 Wisdom',
        circuit: '⚡ Circuit',
        cognitive_vipassana: '🧠 Cognitive',
        somatic_vipassana: '🧘 Somatic',
        cymatics: '🎵 Cymatics',
        sound: '🔊 Sound',
        ritual: '🕯️ Ritual'
    };

    const exitTypeColors = {
        completed: isLight ? '#16a34a' : '#22c55e',
        early_exit: isLight ? '#ca8a04' : '#eab308',
        abandoned: isLight ? '#dc2626' : '#ef4444'
    };

    const practiceLabel = practiceTypeLabels[session.practiceType] || session.practiceType;
    const duration = session.duration || Math.floor((session.durationMs || 0) / 60000);
    const exitType = session.instrumentation?.exit_type || session.exitType || 'completed';
    const precision = session.instrumentation?.precision || session.precision?.breath?.rhythmAccuracy || 0;
    const precisionPercent = Math.round(precision * 100);

    return (
        <div className="p-2 rounded-lg" style={{
            background: isLight ? 'rgba(180, 155, 110, 0.08)' : 'rgba(255, 255, 255, 0.03)',
            border: `1px solid ${isLight ? 'rgba(180, 155, 110, 0.15)' : 'rgba(255, 255, 255, 0.08)'}`
        }}>
            <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium" style={{
                    color: isLight ? 'rgba(45, 40, 35, 0.8)' : 'rgba(255, 255, 255, 0.8)'
                }}>
                    {practiceLabel}
                </span>
                <span className="text-xs" style={{
                    color: exitTypeColors[exitType]
                }}>
                    {exitType === 'completed' ? '✓' : exitType === 'early_exit' ? '⏸' : '✕'}
                </span>
            </div>
            <div className="flex items-center justify-between text-xs">
                <span style={{ color: isLight ? 'rgba(60, 50, 40, 0.6)' : 'rgba(255, 255, 255, 0.5)' }}>
                    {duration} min
                </span>
                <div className="flex items-center gap-1">
                    <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{
                        background: isLight ? 'rgba(180, 155, 110, 0.2)' : 'rgba(255, 255, 255, 0.1)'
                    }}>
                        <div className="h-full rounded-full transition-all" style={{
                            width: `${precisionPercent}%`,
                            background: isLight ? 'rgba(180, 155, 110, 0.6)' : 'rgba(255, 255, 255, 0.3)'
                        }} />
                    </div>
                    <span style={{ color: isLight ? 'rgba(60, 50, 40, 0.5)' : 'rgba(255, 255, 255, 0.4)' }}>
                        {precisionPercent}%
                    </span>
                </div>
            </div>
        </div>
    );
}

// TrackingInspectorSection: Large component for tracking data display and injection
// (Defined outside DevPanel to avoid hook rendering issues)
function TrackingInspectorSection({ expanded, onToggle, isLight = false, armed, handleDestructive }) {
    const { sessions, streak, vacation } = useProgressStore();
    const { currentCycle } = useCycleStore();
    const { awarenessLogs } = useApplicationStore();
    const { scheduleAdherenceLog } = useNavigationStore();

    // Get last 10 sessions
    const recentSessions = sessions.slice(-10).reverse();

    // Calculate current streak
    const calculateCurrentStreak = () => {
        if (!sessions || sessions.length === 0) return 0;
    
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        let currentStreak = 0;
        let checkDate = new Date(today);
    
        for (let i = 0; i < 365; i++) {
            const dateKey = checkDate.toISOString().split('T')[0];
            const hasSession = sessions.some(s => s.dateKey === dateKey);
        
            if (hasSession) {
                currentStreak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else if (i === 0) {
                // Check yesterday
                checkDate.setDate(checkDate.getDate() - 1);
                const yesterdayKey = checkDate.toISOString().split('T')[0];
                if (sessions.some(s => s.dateKey === yesterdayKey)) {
                    currentStreak++;
                    checkDate.setDate(checkDate.getDate() - 1);
                } else {
                    break;
                }
            } else {
                break;
            }
        }
    
        return currentStreak;
    };

    const currentStreak = calculateCurrentStreak();
    const longestStreak = streak?.longest || 0;
    const isVacation = vacation?.active || false;
    const lastPracticeDate = sessions.length > 0 ? sessions[sessions.length - 1].dateKey : 'Never';

    // Helper functions need to be defined inside the component to access hooks
    function injectMockPattern(patternKey) {
        const pattern = MOCK_PATTERNS[patternKey];
        if (!pattern) return;
        const realSessions = sessions.filter(s => !s.metadata?.mock);
        useProgressStore.setState({ sessions: realSessions });

        const mockSessions = [
            ...generateMockSessions('breathwork', pattern.breathwork),
            ...generateMockSessions('visualization', pattern.visualization),
            ...generateMockSessions('wisdom', pattern.wisdom)
        ];

        const nextSessions = [...realSessions, ...mockSessions];
        const newestDateKey = mockSessions.length > 0 ? getNewestDateKey(nextSessions) : null;
        useProgressStore.setState((state) => ({
            sessions: nextSessions,
            ...(newestDateKey ? { streak: { ...state.streak, lastPracticeDate: newestDateKey } } : {})
        }));
        console.log(`✅ Injected ${mockSessions.length} mock sessions (${pattern.label})`);
    }

    function addStreakDays(days) {
        const now = Date.now();
        const msPerDay = 24 * 60 * 60 * 1000;
        const newSessions = [];

        for (let i = 0; i < days; i++) {
            const sessionDate = new Date(now - (i * msPerDay));
            const dateKey = sessionDate.toISOString().split('T')[0];
    
            newSessions.push({
                id: `streak_mock_${sessionDate.getTime()}`,
                dateKey,
                timestamp: sessionDate.getTime(),
                practiceType: 'breath',
                practiceFamily: 'attention',
                duration: 10,
                durationMs: 600000,
                exitType: 'completed',
                metadata: { mock: true, streakSimulator: true },
                instrumentation: {
                    precision: 0.8,
                    exit_type: 'completed'
                }
            });
        }

        useProgressStore.setState((state) => {
            const nextSessions = [...state.sessions, ...newSessions];
            const newestDateKey = newSessions.length > 0 ? getNewestDateKey(nextSessions) : null;
            return {
                sessions: nextSessions,
                streak: {
                    ...state.streak,
                    ...(newestDateKey ? { lastPracticeDate: newestDateKey } : {}),
                    longest: Math.max(state.streak?.longest || 0, currentStreak + days)
                }
            };
        });
        console.log(`✅ Added ${days} streak days`);
    }

    function breakStreak() {
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        const filteredSessions = sessions.filter(s => 
            s.dateKey !== today && s.dateKey !== yesterday
        );

        useProgressStore.setState({ 
            sessions: filteredSessions
        });
        console.log('🔥 Streak broken (removed today & yesterday)');
    }

    function toggleVacation() {
        const newVacationState = !isVacation;
        useProgressStore.setState({ 
            vacation: {
                active: newVacationState,
                startDate: newVacationState ? new Date().toISOString().split('T')[0] : null,
                frozenStreak: newVacationState ? currentStreak : 0
            }
        });
        console.log(`🏖️ Vacation mode ${newVacationState ? 'activated' : 'deactivated'}`);
    }

    function injectMultiYearData() {
        const realSessions = sessions.filter(s => !s.metadata?.mock && !s.metadata?.multiYear);
        const mockSessions = [];
        
        const domains = ['breathwork', 'visualization', 'wisdom', 'ritual'];
        const now = new Date();
        const startYear = now.getFullYear() - 2;
        
        for (let year = startYear; year <= now.getFullYear(); year++) {
            const sessionsThisYear = year === startYear ? 80 : year === startYear + 1 ? 120 : 95;
            
            for (let i = 0; i < sessionsThisYear; i++) {
                const dayOfYear = Math.floor(Math.random() * 365);
                const sessionDate = new Date(year, 0, 1);
                sessionDate.setDate(sessionDate.getDate() + dayOfYear);
                
                const hour = Math.random() < 0.6 ? 6 + Math.floor(Math.random() * 4) : 17 + Math.floor(Math.random() * 5);
                const minute = Math.floor(Math.random() * 60);
                sessionDate.setHours(hour, minute, 0, 0);
                
                const domainWeights = [0.5, 0.25, 0.15, 0.1];
                const rand = Math.random();
                let domain = domains[0];
                let cumulative = 0;
                for (let j = 0; j < domains.length; j++) {
                    cumulative += domainWeights[j];
                    if (rand < cumulative) {
                        domain = domains[j];
                        break;
                    }
                }
                
                const duration = 10 + Math.floor(Math.random() * 36);
                
                mockSessions.push({
                    id: `multiyear_${sessionDate.getTime()}`,
                    date: sessionDate.toISOString(),
                    dateKey: sessionDate.toISOString().split('T')[0],
                    domain,
                    duration,
                    metadata: { 
                        mock: true, 
                        multiYear: true,
                        injectedYear: year
                    }
                });
            }
        }
        
        mockSessions.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        const nextSessions = [...realSessions, ...mockSessions];
        const newestDateKey = mockSessions.length > 0 ? getNewestDateKey(nextSessions) : null;
        useProgressStore.setState((state) => ({
            sessions: nextSessions,
            ...(newestDateKey ? { streak: { ...state.streak, lastPracticeDate: newestDateKey } } : {})
        }));
        
        useProgressStore.getState().updateLifetimeTracking();
        
        const yearCounts = mockSessions.reduce((acc, s) => {
            acc[s.metadata.injectedYear] = (acc[s.metadata.injectedYear] || 0) + 1;
            return acc;
        }, {});
        
        console.log(`✅ Injected ${mockSessions.length} multi-year sessions:`, yearCounts);
    }

    function exportToJSON() {
        const exportData = {
            exportDate: new Date().toISOString(),
            version: '1.0',
            progressStore: {
                sessions: sessions,
                streak: streak,
                vacation: vacation,
                honorLogs: useProgressStore.getState().honorLogs || []
            },
            cycleStore: {
                currentCycle: currentCycle,
                completedCycles: useCycleStore.getState().completedCycles || []
            },
            applicationStore: {
                awarenessLogs: awarenessLogs || []
            },
            navigationStore: {
                scheduleAdherenceLog: scheduleAdherenceLog || [],
                activePathId: useNavigationStore.getState().activePathId
            }
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `immanence-tracking-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        console.log('📥 Exported tracking data to JSON');
    }

    function copyToClipboard() {
        const exportData = {
            exportDate: new Date().toISOString(),
            progressStore: { sessions, streak, vacation },
            cycleStore: { currentCycle },
            applicationStore: { awarenessLogs },
            navigationStore: { scheduleAdherenceLog }
        };

        navigator.clipboard.writeText(JSON.stringify(exportData, null, 2))
            .then(() => console.log('📋 Copied to clipboard'))
            .catch(err => console.error('❌ Copy failed:', err));
    }

    function injectTimingPattern(pattern) {
        const now = Date.now();
        const msPerDay = 24 * 60 * 60 * 1000;
        const newSessions = [];

        const realSessions = sessions.filter(s => !s.metadata?.mock);
        const adherenceLog = Array.isArray(scheduleAdherenceLog) ? scheduleAdherenceLog.filter(e => !e.mock) : [];
        useProgressStore.setState({ sessions: realSessions });
        useNavigationStore.setState({ scheduleAdherenceLog: adherenceLog });

        for (let i = 0; i < 7; i++) {
            const baseTime = now - (i * msPerDay);
            const sessionDate = new Date(baseTime);
            sessionDate.setHours(12, 0, 0, 0);
    
            let offsetMs;
            if (pattern === 'precise') {
                offsetMs = (Math.random() * 10 - 5) * 60 * 1000;
            } else {
                offsetMs = (Math.random() * 240 - 120) * 60 * 1000;
            }
    
            const actualTime = new Date(sessionDate.getTime() + offsetMs);
            const dateKey = sessionDate.toISOString().split('T')[0];
            const deltaMinutes = Math.round(offsetMs / (60 * 1000));
    
            newSessions.push({
                id: `timing_mock_${actualTime.getTime()}`,
                dateKey,
                timestamp: actualTime.getTime(),
                domain: 'breathwork',
                practiceType: 'breath',
                practiceFamily: 'attention',
                date: sessionDate.toISOString(),
                duration: 10,
                durationMs: 600000,
                exitType: 'completed',
                metadata: { mock: true, timingPattern: pattern },
                instrumentation: {
                    precision: pattern === 'precise' ? 0.9 : 0.5,
                    exit_type: 'completed'
                }
            });
    
            const adherenceLogNext = Array.isArray(adherenceLog) ? adherenceLog : [];
            if (Array.isArray(adherenceLogNext)) {
                const adherenceEntry = {
                    day: dateKey,
                    scheduledTime: '12:00',
                    actualStartTime: actualTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
                    deltaMinutes: deltaMinutes,
                    withinWindow: Math.abs(deltaMinutes) <= 15,
                    mock: true
                };
    
                useNavigationStore.setState({
                    scheduleAdherenceLog: [...adherenceLogNext, adherenceEntry]
                });
            }
        }

        const nextSessions = [...realSessions, ...newSessions];
        const newestDateKey = getNewestDateKey(nextSessions);
        useProgressStore.setState((state) => ({
            sessions: nextSessions,
            ...(newestDateKey ? { streak: { ...state.streak, lastPracticeDate: newestDateKey } } : {})
        }));
        console.log(`⏱️ Injected ${pattern} timing pattern (7 days)`);
    }

    function clearMockData() {
        const realSessions = sessions.filter(s => !s.metadata?.mock);
        useProgressStore.setState({ sessions: realSessions });
        console.log('🗑️ Cleared all mock data');
    }

    function resetProgressStore() {
        useProgressStore.setState({
            sessions: [],
            streak: { lastPracticeDate: null, longest: 0 },
            vacation: { active: false, startDate: null, frozenStreak: 0 },
            honorLogs: []
        });
        console.log('🗑️ Reset progressStore');
    }

    function resetAllTracking() {
        useProgressStore.setState({
            sessions: [],
            streak: { lastPracticeDate: null, longest: 0 },
            vacation: { active: false, startDate: null, frozenStreak: 0 },
            honorLogs: []
        });

        useCycleStore.setState({
            currentCycle: null,
            completedCycles: []
        });

        useApplicationStore.setState({
            awarenessLogs: []
        });

        useNavigationStore.setState({
            scheduleAdherenceLog: []
        });

        console.log('🗑️ RESET ALL TRACKING DATA');
    }

    // NOTE: Full JSX return was removed during refactor - component currently non-functional
    // This needs to be restored with the complete Section JSX
    return <div>TrackingInspectorSection JSX needs to be restored</div>;
}

export function DevPanel({
    isOpen,
    onClose
}) {
    // Early return BEFORE any hooks to avoid hook count mismatch
    if (!isOpen) return null;

    // Lunar store state
    const lunarProgress = useLunarStore(s => s.progress);
    const totalDays = useLunarStore(s => s.totalPracticeDays);
    const currentStage = useLunarStore(s => s.getCurrentStage());
    const recentActivity = useLunarStore(s => s.recentActivity);
    const sparkleMode = useLunarStore(s => s.sparkleMode);
    const cycleSparkleMode = useLunarStore(s => s.cycleSparkleMode);

    // Settings store state
    const showCoordinateHelper = useSettingsStore(s => s.showCoordinateHelper);
    const setCoordinateHelper = useSettingsStore(s => s.setCoordinateHelper);
    const lightModeRingType = useSettingsStore(s => s.lightModeRingType);
    const setLightModeRingType = useSettingsStore(s => s.setLightModeRingType);
    const buttonThemeDark = useSettingsStore(s => s.buttonThemeDark);
    const setButtonThemeDark = useSettingsStore(s => s.setButtonThemeDark);
    const buttonThemeLight = useSettingsStore(s => s.buttonThemeLight);
    const setButtonThemeLight = useSettingsStore(s => s.setButtonThemeLight);
    const photic = useSettingsStore(s => s.photic);
    const setPhoticSetting = useSettingsStore(s => s.setPhoticSetting);

    // Color scheme detection
    const colorScheme = useDisplayModeStore(s => s.colorScheme);
    const stageAssetStyle = useDisplayModeStore(s => s.stageAssetStyle);
    const setStageAssetStyle = useDisplayModeStore(s => s.setStageAssetStyle);
    const isLight = colorScheme === 'light';

    // Avatar stage for wallpaper (simplified until avatar system rebuilt)
    const [avatarStage, setAvatarStage] = useState('Flame');
    const [gyroX, setGyroX] = useState(0);
    const [gyroY, setGyroY] = useState(0);

    // Collapsible sections
    const [expandedSections, setExpandedSections] = useState({
        avatar: true,
        lunar: true,
        curriculum: false,
        path: false,
        attention: false,
        tracking: false,
        llm: false,
        data: false,
        bloomRingLab: false
    });

    // Armed state for destructive actions
    const [armed, setArmed] = useState(null);

    // Background layer visibility state
    const [showBgTop, setShowBgTop] = useState(true);
    const [showBgBottom, setShowBgBottom] = useState(true);

    // Slider state
    const [sliderProgress, setSliderProgress] = useState(lunarProgress);

    // Listen for background layer changes from App
    useEffect(() => {
        const handleTopChange = (e) => {
            setShowBgTop(e.detail);
            console.log('DevPanel: Top layer toggled to', e.detail);
        };
        const handleBottomChange = (e) => {
            setShowBgBottom(e.detail);
            console.log('DevPanel: Bottom layer toggled to', e.detail);
        };
        // Listen on capture to catch events from other instances
        window.addEventListener('dev-background-top', handleTopChange, true);
        window.addEventListener('dev-background-bottom', handleBottomChange, true);
        return () => {
            window.removeEventListener('dev-background-top', handleTopChange, true);
            window.removeEventListener('dev-background-bottom', handleBottomChange, true);
        };
    }, []);

    // Sync slider with store
    useEffect(() => {
        setSliderProgress(lunarProgress);
    }, [lunarProgress]);

    // Inspector modal
    const [inspectorOpen, setInspectorOpen] = useState(false);
    const [storeSnapshot, setStoreSnapshot] = useState(null);

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

    const handleTutorialAdminToggle = () => {
        if (isTutorialAdminOn) {
            localStorage.removeItem("immanence.tutorial.admin");
        } else {
            localStorage.setItem("immanence.tutorial.admin", "1");
        }
        location.reload();
    };

    return (
        <div className="fixed inset-0 z-[9999] flex">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Panel */}
            <div className="relative ml-auto w-[400px] h-full border-l overflow-y-auto no-scrollbar" style={{
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
                        onClick={onClose}
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
                            Stage controls wallpaper only. Full avatar system coming soon.
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
                    {/* BUTTON AESTHETICS SECTION */}
                    {/* ═══════════════════════════════════════════════════════════════ */}
                    <Section
                        title="Button Aesthetics"
                        expanded={expandedSections.buttons || false}
                        onToggle={() => toggleSection('buttons')}
                        isLight={isLight}
                    >
                        {/* Dark Mode Theme */}
                        {!isLight && (
                            <div className="flex flex-col gap-2 mb-4">
                                <label className="text-xs font-semibold uppercase tracking-wider text-white/30">
                                    Dark Mode Theme (Cosmic)
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {['cosmic', 'bioluminescent', 'aurora', 'crystalline', 'electric'].map(theme => (
                                        <button
                                            key={theme}
                                            onClick={() => setButtonThemeDark(theme)}
                                            className={`px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-tight transition-all border ${buttonThemeDark === theme
                                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                                : 'bg-white/5 text-white/40 border-white/10 hover:bg-white/10'
                                                }`}
                                        >
                                            {theme}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Light Mode Theme */}
                        {isLight && (
                            <div className="flex flex-col gap-2 mb-4">
                                <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(60, 50, 40, 0.4)' }}>
                                    Light Mode Theme (Pastel)
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {['watercolor', 'sketch', 'botanical', 'inkwash', 'cloudscape'].map(theme => (
                                        <button
                                            key={theme}
                                            onClick={() => setButtonThemeLight(theme)}
                                            className={`px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-tight transition-all border ${buttonThemeLight === theme
                                                ? 'bg-amber-700/20 text-amber-800 border-amber-700/30'
                                                : 'bg-black/5 text-black/40 border-black/10 hover:bg-black/10'
                                                }`}
                                        >
                                            {theme}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="text-[10px] text-center opacity-40 mt-2 italic">
                            {isLight ? 'Pastel & Watercolor' : 'Dramatic & Cosmic'}
                        </div>
                    </Section>

                    {/* ═══════════════════════════════════════════════════════════════ */}
                    {/* LUNAR PROGRESS SECTION */}
                    {/* ═══════════════════════════════════════════════════════════════ */}
                    <Section
                        title="Lunar Progress"
                        expanded={expandedSections.lunar}
                        onToggle={() => toggleSection('lunar')}
                        isLight={isLight}
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
                    {/* CURRICULUM SIMULATION SECTION */}
                    {/* ═══════════════════════════════════════════════════════════════ */}
                    <CurriculumSection
                        expanded={expandedSections.curriculum}
                        onToggle={() => toggleSection('curriculum')}
                        armed={armed}
                        handleDestructive={handleDestructive}
                        isLight={isLight}
                    />

                    {/* Path Ceremony and Attention Path sections removed - legacy systems */}

                    {/* ═══════════════════════════════════════════════════════════════ */}
                    {/* TRACKINGHUB SECTION */}
                    {/* ═══════════════════════════════════════════════════════════════ */}
                    <TrackingHubSection
                        expanded={expandedSections.tracking}
                        onToggle={() => toggleSection('tracking')}
                        isLight={isLight}
                    />

                        {/* ═══════════════════════════════════════════════════════════════ */}
                        {/* TRACKING INSPECTOR SECTION */}
                        {/* ═══════════════════════════════════════════════════════════════ */}
                        {/* TEMPORARILY DISABLED - Component needs JSX restoration */}
                        {/* <TrackingInspectorSection
                            expanded={expandedSections.trackingInspector}
                            onToggle={() => toggleSection('trackingInspector')}
                            isLight={isLight}
                            armed={armed}
                            handleDestructive={handleDestructive}
                        /> */}

                    {/* ═══════════════════════════════════════════════════════════════ */}
                    {/* LLM TEST SECTION */}
                    {/* ═══════════════════════════════════════════════════════════════ */}
                    <Section
                        title="LLM Service (Gemini)"
                        expanded={expandedSections.llm}
                        onToggle={() => toggleSection('llm')}
                        isLight={isLight}
                    >
                        <LLMTestPanel />
                    </Section>

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
                            Anchors in DOM: <span className="text-white/70 font-mono">{(() => {
                                const [count, setCount] = React.useState(0);
                                React.useEffect(() => {
                                    const update = () => setCount(document.querySelectorAll('[data-tutorial]').length);
                                    update();
                                    const interval = setInterval(update, 1000);
                                    return () => clearInterval(interval);
                                }, []);
                                return count;
                            })()}</span>
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
                        title="🔵 Breathing Ring Lab (Phase 0)"
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

// AttentionPathSection removed - legacy system

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
    const dayCompletions = useCurriculumStore(s => s.dayCompletions);
    const legCompletions = useCurriculumStore(s => s.legCompletions);
    const _devReset = useCurriculumStore(s => s._devReset);
    const getActiveCurriculum = useCurriculumStore(s => s.getActiveCurriculum);

    const curriculum = getActiveCurriculum();
    const totalDays = curriculum?.duration || 14;
    const totalLegsPerDay = curriculum?.days?.[0]?.legs?.length || 2;

    const currentDay = getCurrentDayNumber();
    const completedDays = Object.keys(dayCompletions).filter(d => dayCompletions[d].completed).length;
    const completedLegs = Object.keys(legCompletions).length;

    const [simDays, setSimDays] = React.useState(totalDays);
    const [simLegs, setSimLegs] = React.useState(totalLegsPerDay);

    const simulateEntireProgram = () => {
        // Simulate full curriculum with configurable days and legs
        for (let day = 1; day <= simDays; day++) {
            for (let leg = 1; leg <= simLegs; leg++) {
                logLegCompletion(day, leg, {
                    duration: 5 + Math.floor(Math.random() * 3), // 5-7 min
                    focusRating: 3 + Math.floor(Math.random() * 3), // 3-5 stars
                    challenges: [],
                    notes: `Dev simulated day ${day}, leg ${leg}`,
                });
            }
        }
        console.log(`✅ Simulated ${simDays} days with ${simLegs} legs each`);
    };

    const completeCurrentDay = () => {
        // Complete both legs for the current day
        logLegCompletion(currentDay, 1, {
            duration: 5,
            focusRating: 4,
            challenges: [],
            notes: 'Dev completed leg 1',
        });
        logLegCompletion(currentDay, 2, {
            duration: 5,
            focusRating: 5,
            challenges: [],
            notes: 'Dev completed leg 2',
        });
        console.log(`✅ Completed both legs for Day ${currentDay}`);
    };

    const populateSampleThoughts = () => {
        const { completeOnboarding, practiceTimeSlots } = useCurriculumStore.getState();
        const sampleThoughts = [
            { text: 'I am not good enough', weight: 1 },
            { text: 'I always mess things up', weight: 1 },
            { text: 'Everyone else has it figured out', weight: 0 },
            { text: 'I should be better by now', weight: 0 },
            { text: 'Nothing ever works out', weight: 0 },
            { text: 'I am capable of growth', weight: 0 },
            { text: 'This moment is full of potential', weight: 0 },
        ];
        completeOnboarding(practiceTimeSlots, sampleThoughts);
        console.log('✅ Populated 7 sample thoughts (2 priority, 5 normal)');
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
