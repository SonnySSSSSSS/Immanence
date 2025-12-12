// src/utils/devHelpers.js
// Developer utilities for testing Immanence OS
// These wrap existing store actions for orchestration — no new logic

import { useLunarStore } from '../state/lunarStore';
import { usePathStore } from '../state/pathStore';
import { useProgressStore } from '../state/progressStore';
import { STAGES, STAGE_THRESHOLDS, getStageForDays } from '../state/stageConfig';

/**
 * Simulate multiple practice days
 * Calls recordPracticeDay() N times with unique date keys
 */
export function simulatePracticeDays(count = 1) {
    const lunarStore = useLunarStore.getState();
    const results = [];

    for (let i = 0; i < count; i++) {
        // Generate unique date key for each simulated day
        const simulatedDate = new Date();
        simulatedDate.setDate(simulatedDate.getDate() - count + i + 1);
        const dateKey = simulatedDate.toISOString().split('T')[0];

        const result = lunarStore.recordPracticeDay(dateKey);
        results.push(result);

        // If we advanced to a new stage, log it
        if (result.advanced) {
            console.log(`[DevHelper] Stage advanced to: ${result.newStage}`);
        }
    }

    return results;
}

/**
 * Simulate drift (days without practice)
 * Clears recent activity to simulate missed days
 */
export function simulateDrift(days = 7) {
    const lunarStore = useLunarStore.getState();
    const { recentActivity, progress } = lunarStore;

    // Create an array of missed days
    const driftActivity = [];
    for (let i = 0; i < Math.min(days, 7); i++) {
        const driftDate = new Date();
        driftDate.setDate(driftDate.getDate() - i);
        driftActivity.push({
            date: driftDate.toISOString().split('T')[0],
            completed: false
        });
    }

    // Replace recent activity with drift entries
    useLunarStore.setState({
        recentActivity: driftActivity.reverse(),
        lastActiveDate: Date.now() - (days * 24 * 60 * 60 * 1000)
    });

    // Optionally decay progress slightly (user coming back after time away)
    const decayedProgress = Math.max(0, progress - (days * 0.05));
    useLunarStore.setState({ progress: decayedProgress });

    console.log(`[DevHelper] Simulated ${days}-day drift. Progress decayed to ${decayedProgress.toFixed(2)}`);

    return { driftDays: days, newProgress: decayedProgress };
}

/**
 * Advance to the next stage
 * Calculates remaining days needed and simulates them
 */
export function advanceToNextStage() {
    const lunarStore = useLunarStore.getState();
    const currentStage = lunarStore.getCurrentStage();
    const stageConfig = STAGES[currentStage];

    if (stageConfig.isCeiling) {
        console.log('[DevHelper] Already at ceiling stage (Stellar III)');
        return { success: false, reason: 'ceiling' };
    }

    const nextStage = stageConfig.next;
    const nextThreshold = STAGE_THRESHOLDS[nextStage];
    const daysNeeded = Math.max(1, nextThreshold - lunarStore.totalPracticeDays);

    console.log(`[DevHelper] Advancing from ${currentStage} to ${nextStage} (adding ${daysNeeded} days)`);

    // Set total days directly to reach next stage
    useLunarStore.setState({
        totalPracticeDays: nextThreshold,
        progress: 0
    });

    return {
        success: true,
        from: currentStage,
        to: nextStage,
        daysAdded: daysNeeded
    };
}

/**
 * Go to previous stage (for testing)
 */
export function goToPreviousStage() {
    const lunarStore = useLunarStore.getState();
    const currentStage = lunarStore.getCurrentStage();
    const currentThreshold = STAGE_THRESHOLDS[currentStage];

    if (currentStage === 'SEEDLING') {
        console.log('[DevHelper] Already at first stage (Seedling)');
        return { success: false, reason: 'first' };
    }

    // Find previous stage
    const stages = Object.entries(STAGE_THRESHOLDS)
        .sort((a, b) => b[1] - a[1]);

    let prevStage = 'SEEDLING';
    for (const [stage, threshold] of stages) {
        if (threshold < currentThreshold) {
            prevStage = stage;
            break;
        }
    }

    const prevThreshold = STAGE_THRESHOLDS[prevStage];

    useLunarStore.setState({
        totalPracticeDays: prevThreshold,
        progress: 0
    });

    console.log(`[DevHelper] Went back from ${currentStage} to ${prevStage}`);

    return { success: true, from: currentStage, to: prevStage };
}

/**
 * Set moon progress directly (0-12)
 */
export function setMoonProgress(progress) {
    const clamped = Math.max(0, Math.min(12, progress));
    useLunarStore.setState({ progress: clamped });
    console.log(`[DevHelper] Moon progress set to ${clamped}`);
    return clamped;
}

/**
 * Fill recent activity (simulate 7 consecutive practice days)
 */
export function fillRecentActivity() {
    const activity = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        activity.push({
            date: date.toISOString().split('T')[0],
            completed: true
        });
    }

    useLunarStore.setState({ recentActivity: activity });
    console.log('[DevHelper] Filled 7-day activity trail');

    return activity;
}

/**
 * Clear all recent activity
 */
export function clearRecentActivity() {
    useLunarStore.setState({ recentActivity: [] });
    console.log('[DevHelper] Cleared recent activity');
}

/**
 * Reset all stores (destructive)
 */
export function resetAllStores() {
    try {
        useLunarStore.getState()._devReset();
        console.log('[DevHelper] Reset lunarStore');
    } catch (e) {
        console.warn('[DevHelper] Failed to reset lunarStore:', e);
    }

    try {
        usePathStore.getState()._devReset();
        console.log('[DevHelper] Reset pathStore');
    } catch (e) {
        console.warn('[DevHelper] Failed to reset pathStore:', e);
    }

    // Note: progressStore reset would lose all session history
    // Only reset if explicitly confirmed
    console.log('[DevHelper] All stores reset');
}

/**
 * Get snapshot of all store states for inspection
 */
export function getStoreSnapshot() {
    return {
        lunar: {
            progress: useLunarStore.getState().progress,
            totalPracticeDays: useLunarStore.getState().totalPracticeDays,
            currentStage: useLunarStore.getState().getCurrentStage(),
            recentActivity: useLunarStore.getState().recentActivity,
            intention: useLunarStore.getState().intention,
            vacationMode: useLunarStore.getState().vacationMode,
            ceilingCyclesCompleted: useLunarStore.getState().ceilingCyclesCompleted,
        },
        path: {
            currentPath: usePathStore.getState().currentPath,
            pathStatus: usePathStore.getState().pathStatus,
            pendingPath: usePathStore.getState().pendingPath,
            pendingCeremony: usePathStore.getState().pendingCeremony,
            complementaryPaths: usePathStore.getState().complementaryPaths,
            practiceLogCount: usePathStore.getState().practiceLog?.length || 0,
        },
        progress: {
            sessionsCount: useProgressStore.getState().sessions?.length || 0,
            streak: useProgressStore.getState().streak,
            lastPracticeType: useProgressStore.getState().lastPracticeType,
            vacationMode: useProgressStore.getState().vacation?.active || false,
        }
    };
}

/**
 * Trigger path emergence ceremony
 */
export function triggerPathEmergence(path = 'Prana') {
    usePathStore.getState()._devTriggerEmergence(path);
    console.log(`[DevHelper] Triggered emergence ceremony for ${path}`);
}

/**
 * Trigger path shift ceremony
 */
export function triggerPathShift(fromPath = 'Prana', toPath = 'Dhyana') {
    usePathStore.getState()._devTriggerShift(fromPath, toPath);
    console.log(`[DevHelper] Triggered shift ceremony: ${fromPath} → ${toPath}`);
}

/**
 * Clear current ceremony
 */
export function clearCeremony() {
    usePathStore.getState()._devClearCeremony();
    console.log('[DevHelper] Cleared ceremony');
}

/**
 * Set path directly
 */
export function setPath(path) {
    usePathStore.setState({
        currentPath: path,
        pathStatus: 'established'
    });
    console.log(`[DevHelper] Set path to ${path}`);
}
