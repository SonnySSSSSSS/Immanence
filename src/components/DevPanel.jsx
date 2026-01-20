// src/components/DevPanel.jsx
// Developer-only lab for testing Immanence OS systems
// Access: Ctrl+Shift+D or tap version 5 times

import React, { useState, useCallback, useEffect } from 'react';
import { useLunarStore } from '../state/lunarStore';
import { usePathStore, PATH_NAMES, PATH_SYMBOLS } from '../state/pathStore';
import { useAttentionStore } from '../state/attentionStore';
import { STAGES, STAGE_THRESHOLDS } from '../state/stageConfig';
import * as devHelpers from '../utils/devHelpers';
import { calculatePathProbabilities, getDominantPath, determinePathState } from '../utils/attentionPathScoring';
import { generateMockWeeklyData, getProfileKeys, getProfileMetadata } from '../utils/mockAttentionData';
import { generateMockSessions, MOCK_PATTERNS } from '../utils/devDataGenerator';
import { useProgressStore } from '../state/progressStore';
import { useTrackingStore } from '../state/trackingStore';
import { useSettingsStore } from '../state/settingsStore';
import { useDisplayModeStore } from '../state/displayModeStore';
import { useCurriculumStore } from '../state/curriculumStore';
import { useCycleStore } from '../state/cycleStore';
import { useApplicationStore } from '../state/applicationStore';
import { useNavigationStore } from '../state/navigationStore';
import { LLMTestPanel } from './dev/LLMTestPanel.jsx';

// Available stages and paths for dropdowns
const STAGE_OPTIONS = ['Seedling', 'Ember', 'Flame', 'Beacon', 'Stellar'];
const PATH_OPTIONS = ['Soma', 'Prana', 'Dhyana', 'Drishti', 'Jnana', 'Samyoga'];

export function DevPanel({
    isOpen,
    onClose,
    avatarStage = 'flame',
    setAvatarStage,
    avatarPath = 'Prana',
    setAvatarPath,
    showCore = false,
    setShowCore,
    avatarAttention = 'vigilance',
    setAvatarAttention
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

    // Settings store state
    const showCoordinateHelper = useSettingsStore(s => s.showCoordinateHelper);
    const setCoordinateHelper = useSettingsStore(s => s.setCoordinateHelper);
    const lightModeRingType = useSettingsStore(s => s.lightModeRingType);
    const setLightModeRingType = useSettingsStore(s => s.setLightModeRingType);
    const useNewAvatars = useSettingsStore(s => s.useNewAvatars);
    const setUseNewAvatars = useSettingsStore(s => s.setUseNewAvatars);
    const buttonThemeDark = useSettingsStore(s => s.buttonThemeDark);
    const setButtonThemeDark = useSettingsStore(s => s.setButtonThemeDark);
    const buttonThemeLight = useSettingsStore(s => s.buttonThemeLight);
    const setButtonThemeLight = useSettingsStore(s => s.setButtonThemeLight);

    // Color scheme detection
    const colorScheme = useDisplayModeStore(s => s.colorScheme);
    const stageAssetStyle = useDisplayModeStore(s => s.stageAssetStyle);
    const setStageAssetStyle = useDisplayModeStore(s => s.setStageAssetStyle);
    const isLight = colorScheme === 'light';

    // Collapsible sections
    const [expandedSections, setExpandedSections] = useState({
        avatar: true,
        lunar: true,
        curriculum: false,
        path: false,
        attention: false,
        tracking: false,
        llm: false,
        data: false
    });

    // Armed state for destructive actions
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

    // ═══════════════════════════════════════════════════════════════════════════
    // TRACKING INSPECTOR SECTION (Phase 1: Read-Only Display)
    // ═══════════════════════════════════════════════════════════════════════════
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

        return (
            <Section
                title="📊 Tracking Inspector"
                expanded={expanded}
                onToggle={onToggle}
                isLight={isLight}
            >
                {/* === STREAK STATS === */}
                <div className="mb-4 p-3 rounded-lg" style={{
                    background: isLight ? 'rgba(180, 155, 110, 0.12)' : 'rgba(255, 255, 255, 0.05)',
                    border: `1px solid ${isLight ? 'rgba(180, 155, 110, 0.25)' : 'rgba(255, 255, 255, 0.1)'}`
                }}>
                    <div className="text-xs font-medium mb-2" style={{
                        color: isLight ? 'rgba(45, 40, 35, 0.7)' : 'rgba(255, 255, 255, 0.6)'
                    }}>
                            <StreakDisplay streak={currentStreak} /> Streak Status
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <div className="text-xs" style={{ color: isLight ? 'rgba(60, 50, 40, 0.5)' : 'rgba(255, 255, 255, 0.4)' }}>
                                Current
                            </div>
                            <div className="text-xl font-bold" style={{
                                color: isLight ? 'rgba(45, 40, 35, 0.9)' : 'rgba(255, 255, 255, 0.9)'
                            }}>
                                {currentStreak}
                            </div>
                        </div>
                        <div>
                            <div className="text-xs" style={{ color: isLight ? 'rgba(60, 50, 40, 0.5)' : 'rgba(255, 255, 255, 0.4)' }}>
                                Longest
                            </div>
                            <div className="text-xl font-bold" style={{
                                color: isLight ? 'rgba(45, 40, 35, 0.9)' : 'rgba(255, 255, 255, 0.9)'
                            }}>
                                {longestStreak}
                            </div>
                        </div>
                        <div>
                            <div className="text-xs" style={{ color: isLight ? 'rgba(60, 50, 40, 0.5)' : 'rgba(255, 255, 255, 0.4)' }}>
                                Status
                            </div>
                            <div className="text-sm font-medium" style={{
                                color: isVacation ? '#f59e0b' : (isLight ? 'rgba(45, 40, 35, 0.9)' : 'rgba(255, 255, 255, 0.9)')
                            }}>
                                {isVacation ? '🏖️ Vacation' : '✅ Active'}
                            </div>
                        </div>
                    </div>
                    <div className="mt-2 pt-2 border-t text-xs" style={{
                        borderColor: isLight ? 'rgba(180, 155, 110, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                        color: isLight ? 'rgba(60, 50, 40, 0.5)' : 'rgba(255, 255, 255, 0.4)'
                    }}>
                        Last: {lastPracticeDate}
                    </div>
                </div>

                {/* === RECENT SESSIONS === */}
                <div className="mb-3">
                    <div className="text-xs font-medium mb-2" style={{
                        color: isLight ? 'rgba(45, 40, 35, 0.7)' : 'rgba(255, 255, 255, 0.6)'
                    }}>
                        📝 Recent Sessions ({recentSessions.length})
                    </div>
                
                    {recentSessions.length === 0 ? (
                        <div className="text-xs text-center py-4" style={{
                            color: isLight ? 'rgba(60, 50, 40, 0.4)' : 'rgba(255, 255, 255, 0.3)'
                        }}>
                            No sessions recorded yet
                        </div>
                    ) : (
                        <div className="space-y-2 max-h-80 overflow-y-auto no-scrollbar">
                            {recentSessions.map((session) => (
                                <SessionCard key={session.id} session={session} isLight={isLight} />
                            ))}
                        </div>
                    )}
                </div>

                {/* === DATA SUMMARY === */}
                <div className="mt-3 pt-3 border-t grid grid-cols-2 gap-2" style={{
                    borderColor: isLight ? 'rgba(180, 155, 110, 0.2)' : 'rgba(255, 255, 255, 0.1)'
                }}>
                    <div className="text-xs">
                        <span style={{ color: isLight ? 'rgba(60, 50, 40, 0.5)' : 'rgba(255, 255, 255, 0.4)' }}>
                            Total Sessions:
                        </span>
                        <span className="ml-1 font-medium" style={{
                            color: isLight ? 'rgba(45, 40, 35, 0.8)' : 'rgba(255, 255, 255, 0.7)'
                        }}>
                            {sessions.length}
                        </span>
                    </div>
                    <div className="text-xs">
                        <span style={{ color: isLight ? 'rgba(60, 50, 40, 0.5)' : 'rgba(255, 255, 255, 0.4)' }}>
                            Awareness Logs:
                        </span>
                        <span className="ml-1 font-medium" style={{
                            color: isLight ? 'rgba(45, 40, 35, 0.8)' : 'rgba(255, 255, 255, 0.7)'
                        }}>
                            {awarenessLogs?.length || 0}
                        </span>
                    </div>
                </div>

                    {/* === PHASE 2: MOCK DATA INJECTION === */}
                    <div className="mt-4 pt-4 border-t" style={{
                        borderColor: isLight ? 'rgba(180, 155, 110, 0.2)' : 'rgba(255, 255, 255, 0.1)'
                    }}>
                        <div className="text-xs font-medium mb-2" style={{
                            color: isLight ? 'rgba(45, 40, 35, 0.7)' : 'rgba(255, 255, 255, 0.6)'
                        }}>
                            🧪 Mock Data Injection
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <DevButton onClick={() => injectMockPattern('beginner')}>
                                Beginner Pattern
                            </DevButton>
                            <DevButton onClick={() => injectMockPattern('dedicated')}>
                                Dedicated Pattern
                            </DevButton>
                            <DevButton onClick={() => injectMockPattern('intense')}>
                                Intense Pattern
                            </DevButton>
                            <DevButton onClick={() => injectMockPattern('burnout')}>
                                Burnout Pattern
                            </DevButton>
                        </div>
                    </div>

                    {/* === MULTI-YEAR DATA INJECTION === */}
                    <div className="mt-4 pt-4 border-t" style={{
                        borderColor: isLight ? 'rgba(180, 155, 110, 0.2)' : 'rgba(255, 255, 255, 0.1)'
                    }}>
                        <div className="text-xs font-medium mb-2" style={{
                            color: isLight ? 'rgba(45, 40, 35, 0.7)' : 'rgba(255, 255, 255, 0.6)'
                        }}>
                            📅 Long-Term Tracking Test
                        </div>
                        <DevButton onClick={injectMultiYearData}>
                            Inject 3 Years Data (295 sessions)
                        </DevButton>
                        <div className="text-xs mt-2" style={{
                            color: isLight ? 'rgba(60, 50, 40, 0.5)' : 'rgba(255, 255, 255, 0.4)'
                        }}>
                            Generates 2024-2026 sessions for lifetime insights testing
                        </div>
                    </div>

                    {/* === PHASE 2: STREAK SIMULATOR === */}
                    <div className="mt-4 pt-4 border-t" style={{
                        borderColor: isLight ? 'rgba(180, 155, 110, 0.2)' : 'rgba(255, 255, 255, 0.1)'
                    }}>
                        <div className="text-xs font-medium mb-2" style={{
                            color: isLight ? 'rgba(45, 40, 35, 0.7)' : 'rgba(255, 255, 255, 0.6)'
                        }}>
                            ⚡ Streak Simulator
                        </div>
                        <div className="grid grid-cols-2 gap-2 mb-2">
                            <DevButton onClick={() => addStreakDays(7)}>
                                +7 Days
                            </DevButton>
                            <DevButton onClick={() => addStreakDays(14)}>
                                +14 Days
                            </DevButton>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <DevButton onClick={breakStreak}>
                                Break Streak
                            </DevButton>
                            <DevButton onClick={toggleVacation}>
                                {isVacation ? 'End Vacation' : 'Start Vacation'}
                            </DevButton>
                        </div>
                    </div>

                    {/* === PHASE 2: CYCLE STATUS === */}
                    <div className="mt-4 pt-4 border-t" style={{
                        borderColor: isLight ? 'rgba(180, 155, 110, 0.2)' : 'rgba(255, 255, 255, 0.1)'
                    }}>
                        <div className="text-xs font-medium mb-2" style={{
                            color: isLight ? 'rgba(45, 40, 35, 0.7)' : 'rgba(255, 255, 255, 0.6)'
                        }}>
                            🔄 Cycle Tracking
                        </div>
                        {currentCycle ? (
                            <div className="mb-2 p-2 rounded-lg" style={{
                                background: isLight ? 'rgba(180, 155, 110, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                                border: `1px solid ${isLight ? 'rgba(180, 155, 110, 0.15)' : 'rgba(255, 255, 255, 0.08)'}`
                            }}>
                                <div className="text-xs space-y-1">
                                    <div style={{ color: isLight ? 'rgba(45, 40, 35, 0.8)' : 'rgba(255, 255, 255, 0.7)' }}>
                                        Type: <span className="font-medium">{currentCycle.type}</span>
                                    </div>
                                    <div style={{ color: isLight ? 'rgba(45, 40, 35, 0.8)' : 'rgba(255, 255, 255, 0.7)' }}>
                                        Days: <span className="font-medium">{currentCycle.practiceDays?.length || 0}/{currentCycle.targetDays}</span>
                                    </div>
                                    <div style={{ color: isLight ? 'rgba(45, 40, 35, 0.8)' : 'rgba(255, 255, 255, 0.7)' }}>
                                        Status: <span className="font-medium">{currentCycle.status}</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-xs mb-2" style={{
                                color: isLight ? 'rgba(60, 50, 40, 0.5)' : 'rgba(255, 255, 255, 0.4)'
                            }}>
                                No active cycle
                            </div>
                        )}
                    </div>

                    {/* === PHASE 2: SCHEDULE ADHERENCE === */}
                    <div className="mt-4 pt-4 border-t" style={{
                        borderColor: isLight ? 'rgba(180, 155, 110, 0.2)' : 'rgba(255, 255, 255, 0.1)'
                    }}>
                        <div className="text-xs font-medium mb-2" style={{
                            color: isLight ? 'rgba(45, 40, 35, 0.7)' : 'rgba(255, 255, 255, 0.6)'
                        }}>
                            ⏰ Schedule Adherence (Last 7 Days)
                        </div>
                        {scheduleAdherenceLog && scheduleAdherenceLog.length > 0 ? (
                            <div className="text-xs space-y-1">
                                {scheduleAdherenceLog.slice(-7).map((log, i) => (
                                    <div key={i} className="flex justify-between" style={{
                                        color: log.withinWindow 
                                            ? (isLight ? '#16a34a' : '#22c55e')
                                            : (isLight ? '#dc2626' : '#ef4444')
                                    }}>
                                        <span>{log.day}</span>
                                        <span>{log.withinWindow ? '✓' : '✕'} {log.deltaMinutes >= 0 ? '+' : ''}{log.deltaMinutes}m</span>
                                    </div>
                                ))}
                                <div className="pt-1 mt-1 border-t" style={{
                                    borderColor: isLight ? 'rgba(180, 155, 110, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                                    color: isLight ? 'rgba(60, 50, 40, 0.6)' : 'rgba(255, 255, 255, 0.5)'
                                }}>
                                    On-time: {Math.round((scheduleAdherenceLog.filter(l => l.withinWindow).length / scheduleAdherenceLog.length) * 100)}%
                                </div>
                            </div>
                        ) : (
                            <div className="text-xs" style={{
                                color: isLight ? 'rgba(60, 50, 40, 0.5)' : 'rgba(255, 255, 255, 0.4)'
                            }}>
                                No adherence data recorded
                            </div>
                        )}
                    </div>

                        {/* === PHASE 3: DATA EXPORT === */}
                        <div className="mt-4 pt-4 border-t" style={{
                            borderColor: isLight ? 'rgba(180, 155, 110, 0.2)' : 'rgba(255, 255, 255, 0.1)'
                        }}>
                            <div className="text-xs font-medium mb-2" style={{
                                color: isLight ? 'rgba(45, 40, 35, 0.7)' : 'rgba(255, 255, 255, 0.6)'
                            }}>
                                📥 Data Export
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <DevButton onClick={exportToJSON}>
                                    Export JSON
                                </DevButton>
                                <DevButton onClick={copyToClipboard}>
                                    Copy to Clipboard
                                </DevButton>
                            </div>
                        </div>

                        {/* === PHASE 3: TIMING VARIANCE === */}
                        <div className="mt-4 pt-4 border-t" style={{
                            borderColor: isLight ? 'rgba(180, 155, 110, 0.2)' : 'rgba(255, 255, 255, 0.1)'
                        }}>
                            <div className="text-xs font-medium mb-2" style={{
                                color: isLight ? 'rgba(45, 40, 35, 0.7)' : 'rgba(255, 255, 255, 0.6)'
                            }}>
                                ⏱️ Timing Variance Injector
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <DevButton onClick={() => injectTimingPattern('precise')}>
                                    Precise Week
                                </DevButton>
                                <DevButton onClick={() => injectTimingPattern('chaotic')}>
                                    Chaotic Week
                                </DevButton>
                            </div>
                        </div>

                        {/* === PHASE 3: ARMED RESET CONTROLS === */}
                        <div className="mt-4 pt-4 border-t" style={{
                            borderColor: isLight ? 'rgba(180, 155, 110, 0.2)' : 'rgba(255, 255, 255, 0.1)'
                        }}>
                            <div className="text-xs font-medium mb-2" style={{
                                color: isLight ? 'rgba(45, 40, 35, 0.7)' : 'rgba(255, 255, 255, 0.6)'
                            }}>
                                🗑️ Reset Controls
                            </div>
                            <div className="space-y-2">
                                <DestructiveButton
                                    label="Clear Mock Data"
                                    armed={armed === 'clearMock'}
                                    onArm={() => handleDestructive('clearMock', clearMockData)}
                                />
                                <DestructiveButton
                                    label="Reset Progress Store"
                                    armed={armed === 'resetProgress'}
                                    onArm={() => handleDestructive('resetProgress', resetProgressStore)}
                                />
                                <DestructiveButton
                                    label="Reset All Tracking"
                                    armed={armed === 'resetAll'}
                                    onArm={() => handleDestructive('resetAll', resetAllTracking)}
                                />
                            </div>
                        </div>
            </Section>
        );

            // === HELPER FUNCTIONS FOR PHASE 2 ===
            function injectMockPattern(patternKey) {
                const pattern = MOCK_PATTERNS[patternKey];
                if (!pattern) return;
                // Remove prior mock sessions before injecting new pattern
                const realSessions = sessions.filter(s => !s.metadata?.mock);
                useProgressStore.setState({ sessions: realSessions });

                const mockSessions = [
                    ...generateMockSessions('breathwork', pattern.breathwork),
                    ...generateMockSessions('visualization', pattern.visualization),
                    ...generateMockSessions('wisdom', pattern.wisdom)
                ];
        
                useProgressStore.setState({ 
                    sessions: [...realSessions, ...mockSessions]
                });
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
        
                useProgressStore.setState({ 
                    sessions: [...sessions, ...newSessions],
                    streak: {
                        ...streak,
                        longest: Math.max(streak?.longest || 0, currentStreak + days)
                    }
                });
                console.log(`✅ Added ${days} streak days`);
            }

            function breakStreak() {
                // Remove today's sessions to break streak
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

            // === MULTI-YEAR DATA INJECTOR (FOR LIFETIME TRACKING) ===
            function injectMultiYearData() {
                const realSessions = sessions.filter(s => !s.metadata?.mock && !s.metadata?.multiYear);
                const mockSessions = [];
                
                // Generate 3 years of data (2023, 2024, 2025)
                const domains = ['breathwork', 'visualization', 'wisdom', 'ritual'];
                const now = new Date();
                const startYear = now.getFullYear() - 2; // 2 years ago
                
                for (let year = startYear; year <= now.getFullYear(); year++) {
                    // Vary sessions per year (growth pattern)
                    const sessionsThisYear = year === startYear ? 80 : year === startYear + 1 ? 120 : 95;
                    
                    for (let i = 0; i < sessionsThisYear; i++) {
                        // Random day in year
                        const dayOfYear = Math.floor(Math.random() * 365);
                        const sessionDate = new Date(year, 0, 1);
                        sessionDate.setDate(sessionDate.getDate() + dayOfYear);
                        
                        // Random time of day (morning weighted)
                        const hour = Math.random() < 0.6 ? 6 + Math.floor(Math.random() * 4) : 17 + Math.floor(Math.random() * 5);
                        const minute = Math.floor(Math.random() * 60);
                        sessionDate.setHours(hour, minute, 0, 0);
                        
                        // Random domain (breathwork weighted)
                        const domainWeights = [0.5, 0.25, 0.15, 0.1]; // breathwork, vis, wisdom, ritual
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
                        
                        // Random duration (10-45 min)
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
                
                // Sort by date
                mockSessions.sort((a, b) => new Date(a.date) - new Date(b.date));
                
                // Update store
                useProgressStore.setState({ 
                    sessions: [...realSessions, ...mockSessions]
                });
                
                // Trigger lifetime tracking update
                useProgressStore.getState().updateLifetimeTracking();
                
                const yearCounts = mockSessions.reduce((acc, s) => {
                    acc[s.metadata.injectedYear] = (acc[s.metadata.injectedYear] || 0) + 1;
                    return acc;
                }, {});
                
                console.log(`✅ Injected ${mockSessions.length} multi-year sessions:`, yearCounts);
                console.log('📊 Lifetime tracking updated');
            }

                // === HELPER FUNCTIONS FOR PHASE 3 ===
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

                    // Clear prior mock sessions and adherence entries before injecting
                    const realSessions = sessions.filter(s => !s.metadata?.mock);
                    const adherenceLog = Array.isArray(scheduleAdherenceLog) ? scheduleAdherenceLog.filter(e => !e.mock) : [];
                    useProgressStore.setState({ sessions: realSessions });
                    useNavigationStore.setState({ scheduleAdherenceLog: adherenceLog });
        
                    // Generate 7 days of sessions with timing variance
                    for (let i = 0; i < 7; i++) {
                        const baseTime = now - (i * msPerDay);
                        const sessionDate = new Date(baseTime);
                        sessionDate.setHours(12, 0, 0, 0); // Target: noon
            
                        let offsetMs;
                        if (pattern === 'precise') {
                            // Within ±5 minutes
                            offsetMs = (Math.random() * 10 - 5) * 60 * 1000;
                        } else {
                            // Chaotic: ±2 hours
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
            
                        // Add to navigation store adherence log
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
        
                    useProgressStore.setState({ 
                        sessions: [...realSessions, ...newSessions]
                    });
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
                    // Reset all tracking stores
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
                                background: precisionPercent >= 80 ? '#22c55e' : 
                                          precisionPercent >= 60 ? '#eab308' : '#ef4444'
                            }} />
                        </div>
                        <span style={{ color: isLight ? 'rgba(60, 50, 40, 0.6)' : 'rgba(255, 255, 255, 0.5)' }}>
                            {precisionPercent}%
                        </span>
                    </div>
                </div>
                <div className="text-[10px] mt-1" style={{
                    color: isLight ? 'rgba(60, 50, 40, 0.4)' : 'rgba(255, 255, 255, 0.3)'
                }}>
                    {session.dateKey || new Date(session.timestamp).toISOString().split('T')[0]}
                </div>
            </div>
        );
    }

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
                    {/* AVATAR SECTION */}
                    {/* ═══════════════════════════════════════════════════════════════ */}
                    <Section
                        title="Avatar Preview"
                        expanded={expandedSections.avatar}
                        onToggle={() => toggleSection('avatar')}
                        isLight={isLight}
                    >
                        {/* Stage selector */}
                        <div className="flex items-center gap-3 mb-3">
                            <label className="text-sm font-medium w-16" style={{ color: isLight ? 'rgba(60, 50, 40, 0.9)' : 'white' }}>Stage</label>
                            <select
                                value={avatarStage}
                                onChange={(e) => setAvatarStage(e.target.value)}
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
                        <div className="flex items-center gap-3 mb-3">
                            <label className="text-sm font-medium w-16" style={{ color: isLight ? 'rgba(60, 50, 40, 0.9)' : 'white' }}>Path</label>
                            <select
                                value={avatarPath}
                                onChange={(e) => setAvatarPath(e.target.value)}
                                className="flex-1 rounded-lg px-3 py-2.5 text-base font-medium"
                                style={{
                                    background: isLight ? 'rgba(255, 255, 255, 0.9)' : '#0a0a12',
                                    border: isLight ? '1px solid rgba(180, 155, 110, 0.3)' : '1px solid rgba(255, 255, 255, 0.3)',
                                    color: isLight ? 'rgba(60, 50, 40, 0.95)' : 'white',
                                    colorScheme: isLight ? 'light' : 'dark'
                                }}
                            >
                                {PATH_OPTIONS.map(p => (
                                    <option key={p} value={p}>{p}</option>
                                ))}
                            </select>
                        </div>

                        {/* Attention selector */}
                        <div className="flex items-center gap-3 mb-3">
                            <label className="text-sm font-medium w-16" style={{ color: isLight ? 'rgba(60, 50, 40, 0.9)' : 'white' }}>Attention</label>
                            <select
                                value={avatarAttention}
                                onChange={(e) => setAvatarAttention(e.target.value)}
                                className="flex-1 rounded-lg px-3 py-2.5 text-base font-medium"
                                style={{
                                    background: isLight ? 'rgba(255, 255, 255, 0.9)' : '#0a0a12',
                                    border: isLight ? '1px solid rgba(180, 155, 110, 0.3)' : '1px solid rgba(255, 255, 255, 0.3)',
                                    color: isLight ? 'rgba(60, 50, 40, 0.95)' : 'white',
                                    colorScheme: isLight ? 'light' : 'dark'
                                }}
                            >
                                <option value="none">None (Stage/Path only)</option>
                                <option value="vigilance">Vigilance</option>
                                <option value="sahaja">Sahaja</option>
                                <option value="ekagrata">Ekagrata</option>
                            </select>
                        </div>

                        {/* Show Core toggle */}
                        <div className="flex items-center gap-3 mb-4">
                            <label className="text-xs w-16" style={{ color: isLight ? 'rgba(60, 50, 40, 0.7)' : 'rgba(255, 255, 255, 0.5)' }}>Show Core</label>
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

                        {/* Light Mode Ring Toggle */}
                        <div className="flex items-center gap-3 mb-4">
                            <label className="text-xs w-16" style={{ color: isLight ? 'rgba(60, 120, 140, 0.9)' : '#22d3ee' }}>Ring Type</label>
                            <div className="flex bg-white/5 rounded-lg p-1 gap-1">
                                <button
                                    onClick={() => setLightModeRingType('astrolabe')}
                                    className={`px-2 py-1 rounded text-[10px] transition-all ${lightModeRingType === 'astrolabe'
                                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                                        : 'text-white/40 hover:text-white/60'
                                        }`}
                                >
                                    ASTROLABE
                                </button>
                                <button
                                    onClick={() => setLightModeRingType('rune')}
                                    className={`px-2 py-1 rounded text-[10px] transition-all ${lightModeRingType === 'rune'
                                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                        : 'text-white/40 hover:text-white/60'
                                        }`}
                                >
                                    RUNE
                                </button>
                            </div>
                        </div>

                        {/* Cloud Background Toggle (Light Mode) */}
                        <div className="flex items-center gap-3 mb-4">
                            <label className="text-xs w-16" style={{ color: isLight ? 'rgba(60, 140, 100, 0.9)' : '#34d399' }}>Cloud BG</label>
                            <div className="flex bg-white/5 rounded-lg p-1 gap-1 flex-wrap">
                                {['none', 'light_clouds', 'cloudier', 'cloudiest'].map(cloud => (
                                    <button
                                        key={cloud}
                                        onClick={() => {
                                            // This will need to be wired to HomeHub state via props
                                            const event = new CustomEvent('dev-cloud-change', { detail: cloud });
                                            window.dispatchEvent(event);
                                        }}
                                        className="px-2 py-1 rounded text-[10px] transition-all text-white/40 hover:text-white/60 hover:bg-white/10"
                                    >
                                        {cloud === 'light_clouds' ? 'LIGHT' : cloud.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Avatar Version Toggle */}
                        <div className="flex items-center gap-3 mb-4">
                            <label className="text-xs w-16" style={{ color: isLight ? 'rgba(140, 60, 100, 0.9)' : '#ec4899' }}>Avatar Set</label>
                            <div className="flex bg-white/5 rounded-lg p-1 gap-1">
                                <button
                                    onClick={() => setUseNewAvatars(false)}
                                    className={`px-2 py-1 rounded text-[10px] transition-all ${!useNewAvatars
                                        ? 'bg-pink-500/20 text-pink-300 border border-pink-500/30'
                                        : 'text-white/40 hover:text-white/60'
                                        }`}
                                >
                                    OLD
                                </button>
                                <button
                                    onClick={() => setUseNewAvatars(true)}
                                    className={`px-2 py-1 rounded text-[10px] transition-all ${useNewAvatars
                                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                        : 'text-white/40 hover:text-white/60'
                                        }`}
                                >
                                    NEW
                                </button>
                            </div>
                        </div>

                        {/* Stage Asset Style Toggle */}
                        <div className="flex items-center gap-3 mb-4">
                            <label className="text-xs w-16" style={{ color: isLight ? 'rgba(140, 100, 60, 0.9)' : '#fb923c' }}>Title Set</label>
                            <div className="flex bg-white/5 rounded-lg p-1 gap-1">
                                {[1, 2, 3, 4, 5].map(styleSet => (
                                    <button
                                        key={styleSet}
                                        onClick={() => setStageAssetStyle(styleSet)}
                                        className={`w-7 h-7 flex items-center justify-center rounded text-[10px] font-bold transition-all ${stageAssetStyle === styleSet
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

                    {/* ═══════════════════════════════════════════════════════════════ */}
                    {/* PATH CEREMONY SECTION */}
                    {/* ═══════════════════════════════════════════════════════════════ */}
                    <Section
                        title="Path Ceremony"
                        expanded={expandedSections.path}
                        onToggle={() => toggleSection('path')}
                        isLight={isLight}
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
                    {/* ATTENTION PATH SECTION */}
                    {/* ═══════════════════════════════════════════════════════════════ */}
                    <AttentionPathSection
                        expanded={expandedSections.attention}
                        onToggle={() => toggleSection('attention')}
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
                        {/* TRACKING INSPECTOR SECTION */}
                        {/* ═══════════════════════════════════════════════════════════════ */}
                        <TrackingInspectorSection
                            expanded={expandedSections.trackingInspector}
                            onToggle={() => toggleSection('trackingInspector')}
                            isLight={isLight}
                            armed={armed}
                            handleDestructive={handleDestructive}
                        />

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
                    {/* DESIGN & DIAGNOSTIC SECTION */}
                    {/* ═══════════════════════════════════════════════════════════════ */}
                    <Section
                        title="Design & Diagnostic"
                        expanded={expandedSections.design || false}
                        onToggle={() => toggleSection('design')}
                        isLight={isLight}
                    >
                        <div className="flex items-center justify-between mb-4 bg-white/5 rounded-lg px-3 py-2">
                            <div className="flex flex-col">
                                <span className="text-xs text-white/90">Coordinate Helper</span>
                                <span className="text-[10px] text-white/40">Logs X,Y % on click</span>
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

function AttentionPathSection({ expanded, onToggle, armed, handleDestructive, isLight = false }) {
    const weeklyFeatures = useAttentionStore(s => s.weeklyFeatures);
    const windows = useAttentionStore(s => s.windows);
    const getValidWeekCount = useAttentionStore(s => s.getValidWeekCount);
    const aggregateCurrentWeek = useAttentionStore(s => s.aggregateCurrentWeek);
    const _devAggregateAll = useAttentionStore(s => s._devAggregateAll);
    const _devReset = useAttentionStore(s => s._devReset);

    const [mockProfile, setMockProfile] = useState('stable_ekagrata');
    const [mockResult, setMockResult] = useState(null);

    const validWeekCount = getValidWeekCount(12);
    const featureVector = windows.mid || windows.short;

    // Calculate current path state
    let pathState = null;
    if (featureVector) {
        pathState = determinePathState(featureVector, validWeekCount);
    }

    // Run mock profile test
    const runMockTest = () => {
        const mockData = generateMockWeeklyData(mockProfile, 8, 0.2);
        const lastWeek = mockData[mockData.length - 1];
        const probs = calculatePathProbabilities(lastWeek);
        const dominant = getDominantPath(probs);
        const metadata = getProfileMetadata(mockProfile);
        setMockResult({
            profile: metadata,
            probabilities: probs,
            dominant,
            expected: metadata?.expectedPath,
            pass: dominant.path?.includes(metadata?.expectedPath) || dominant.status === metadata?.expectedPath,
        });
    };

    return (
        <Section
            title="Attention Path (Ekagrata/Sahaja/Vigilance)"
            expanded={expanded}
            onToggle={onToggle}
            isLight={isLight}
        >
            {/* Stats */}
            <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
                <div className="bg-white/5 rounded-lg px-3 py-2">
                    <div className="text-white/40">Valid Weeks</div>
                    <div className="text-white/90 font-mono">{validWeekCount}/12</div>
                </div>
                <div className="bg-white/5 rounded-lg px-3 py-2">
                    <div className="text-white/40">State</div>
                    <div className="text-white/90">{pathState?.state || 'No Data'}</div>
                </div>
                <div className="bg-white/5 rounded-lg px-3 py-2 col-span-2">
                    <div className="text-white/40">Attention Path</div>
                    <div className="text-white/90 font-medium">
                        {pathState?.path || 'None'}
                        {pathState?.probability && <span className="text-white/50 ml-2">({(pathState.probability * 100).toFixed(0)}%)</span>}
                    </div>
                </div>
            </div>

            {/* Probability Bars */}
            {pathState?.probabilities && (
                <div className="mb-4">
                    <div className="text-xs text-white/50 mb-2">Path Probabilities</div>
                    {['Ekagrata', 'Sahaja', 'Vigilance'].map(path => {
                        const prob = pathState.probabilities[path] || 0;
                        return (
                            <div key={path} className="flex items-center gap-2 mb-1.5">
                                <span className="text-xs text-white/60 w-16">{path}</span>
                                <div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all"
                                        style={{
                                            width: `${prob * 100}%`,
                                            background: path === 'Ekagrata' ? '#a78bfa'
                                                : path === 'Sahaja' ? '#34d399'
                                                    : '#fbbf24',
                                        }}
                                    />
                                </div>
                                <span className="text-xs text-white/50 w-10 text-right font-mono">
                                    {(prob * 100).toFixed(0)}%
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2 mb-4">
                <DevButton onClick={() => aggregateCurrentWeek()}>Aggregate Now</DevButton>
                <DevButton onClick={() => _devAggregateAll()}>Aggregate All</DevButton>
            </div>

            {/* Mock Profile Testing */}
            <div className="border-t border-white/10 pt-3 mt-2">
                <div className="text-xs text-white/50 mb-2">Mock Profile Test</div>
                <div className="flex gap-2 mb-2">
                    <select
                        value={mockProfile}
                        onChange={(e) => setMockProfile(e.target.value)}
                        className="flex-1 bg-[#1a1a24] border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white/90"
                        style={{ colorScheme: 'dark' }}
                    >
                        {getProfileKeys().map(key => (
                            <option key={key} value={key}>{getProfileMetadata(key)?.name || key}</option>
                        ))}
                    </select>
                    <DevButton onClick={runMockTest}>Test</DevButton>
                </div>

                {mockResult && (
                    <div className={`text-xs p-2 rounded-lg ${mockResult.pass ? 'bg-green-500/20 border border-green-500/40' : 'bg-red-500/20 border border-red-500/40'}`}>
                        <div className="flex justify-between mb-1">
                            <span className="text-white/70">Expected: {mockResult.expected}</span>
                            <span className="text-white/70">Got: {mockResult.dominant.path || mockResult.dominant.status}</span>
                        </div>
                        <div className="text-white/50">
                            {mockResult.pass ? '✓ PASS' : '✗ FAIL'}
                        </div>
                    </div>
                )}
            </div>

            {/* Reset */}
            <div className="mt-3">
                <DestructiveButton
                    label="Reset Attention Data"
                    armed={armed === 'attention'}
                    onArm={() => handleDestructive('attention', _devReset)}
                />
            </div>
        </Section>
    );
}

function TrackingHubSection({ expanded, onToggle, isLight = false }) {
    const { sessions } = useProgressStore();
    const trackingSessions = useTrackingStore(s => s.sessions);
    const [selectedPattern, setSelectedPattern] = useState('dedicated');

    const injectMockData = (patternKey) => {
        const pattern = MOCK_PATTERNS[patternKey];
        const mockSessions = [
            ...generateMockSessions('breathwork', pattern.breathwork),
            ...generateMockSessions('visualization', pattern.visualization),
            ...generateMockSessions('wisdom', pattern.wisdom)
        ];

        // Inject into store (this will overwrite existing sessions)
        useProgressStore.setState({ sessions: mockSessions });
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

        // Inject into trackingStore
        useTrackingStore.setState({ sessions: mockSessions });
        console.log(`✅ Injected ${mockSessions.length} trajectory sessions (${config.label}) over ${weeksToGenerate} weeks`);
    };

    const clearTrajectoryData = () => {
        const realSessions = trackingSessions.filter(s => !s.metadata?.mock);
        useTrackingStore.setState({ sessions: realSessions });
        console.log('🗑️ Cleared trajectory mock data');
    };

    const mockSessionCount = sessions.filter(s => s.metadata?.mock).length;
    const totalSessionCount = sessions.length;
    const trajectoryMockCount = trackingSessions.filter(s => s.metadata?.mock).length;
    const trajectoryTotalCount = trackingSessions.length;

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
