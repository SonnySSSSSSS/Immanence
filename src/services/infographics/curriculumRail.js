// src/services/infographics/curriculumRail.js
// Compute 14-day rolling window precision rail for curriculum infographic
// WITH category/matchPolicy matching requirement
//
// PHASE 7: Session Snapshots
// Each recorded session includes a deterministic scheduleMatched snapshot
// computed at record time (in sessionRecorder.js). The rail prefers snapshots
// when present (fast-path) and falls back to computed matching for sessions
// without snapshots (backward compatibility). A snapshot only matches if:
// - legNumber matches the current leg
// - status is 'green' or 'red' (|deltaMinutes| <= 60)
// If a session has a snapshot but it doesn't match the current leg, we skip
// computed matching for that session (no fallback).

import { useCurriculumStore } from '../../state/curriculumStore.js';
import { useProgressStore } from '../../state/progressStore.js';
import { getLocalDateKey } from '../../utils/dateUtils.js';
import { resolveCategoryIdFromSessionV2 } from './sessionCategory.js';
import { MATCH_POLICY } from '../../data/curriculumMatching.js';

/**
 * Parse "HH:mm" time string to minutes since midnight
 * @param {string} timeStr - e.g., "14:30"
 * @returns {number|null} - Minutes since midnight, or null if invalid
 */
function parseTimeToMinutes(timeStr) {
    if (!timeStr || typeof timeStr !== 'string') return null;
    const parts = timeStr.split(':');
    if (parts.length !== 2) return null;
    const h = Number(parts[0]);
    const m = Number(parts[1]);
    if (Number.isNaN(h) || Number.isNaN(m)) return null;
    if (h < 0 || h > 23 || m < 0 || m > 59) return null;
    return h * 60 + m;
}

/**
 * Extract hour and minute from ISO timestamp in local timezone
 * @param {string} isoTime - ISO 8601 timestamp
 * @returns {number|null} - Minutes since midnight in local timezone, or null
 */
function getLocalMinutesFromISO(isoTime) {
    if (!isoTime) return null;
    const date = new Date(isoTime);
    if (Number.isNaN(date.getTime())) return null;
    return date.getHours() * 60 + date.getMinutes();
}

/**
 * Compute time delta: actual - scheduled (in minutes)
 * Positive = late, negative = early
 * @param {number} actualMinutes - Actual session time in minutes
 * @param {number} scheduledMinutes - Scheduled time in minutes
 * @returns {number} - Delta in minutes
 */
function computeDeltaMinutes(actualMinutes, scheduledMinutes) {
    return actualMinutes - scheduledMinutes;
}

/**
 * Determine status based on time delta
 * GREEN: |delta| <= 15
 * RED: 15 < |delta| <= 60
 * null (does not count): |delta| > 60
 * @param {number} deltaMinutes
 * @returns {'green'|'red'|null}
 */
function getDeltaStatus(deltaMinutes) {
    const absDelta = Math.abs(deltaMinutes);
    if (absDelta <= 15) return 'green';
    if (absDelta <= 60) return 'red';
    return null; // Outside acceptable range; does not count
}

/**
 * Get day of week (0=Sun, 1=Mon, ..., 6=Sat) from local date string
 * @param {string} dateKeyLocal - "YYYY-MM-DD"
 * @returns {number} - Day of week (0-6)
 */
function getDayOfWeek(dateKeyLocal) {
    const date = new Date(dateKeyLocal);
    return date.getDay();
}

/**
 * Check if a session matches a curriculum leg's category/matchPolicy requirement
 * @param {Object} session - Session from progressStore.sessionsV2
 * @param {Object} leg - Curriculum leg with categoryId and matchPolicy
 * @returns {boolean} - True if session matches leg's category requirements
 */
function doesSessionMatchLegCategory(session, leg) {
    if (!leg || !leg.categoryId) return false;

    const sessionCategory = resolveCategoryIdFromSessionV2(session);
    if (sessionCategory === null) {
        // Cannot resolve session category => does not match
        return false;
    }

    // Category must match regardless of matchPolicy
    if (sessionCategory !== leg.categoryId) {
        return false;
    }

    // If matchPolicy is EXACT_PRACTICE, also require practiceId match
    if (leg.matchPolicy === MATCH_POLICY.EXACT_PRACTICE) {
        if (!leg.practiceId || session.practiceId !== leg.practiceId) {
            return false;
        }
    }

    return true;
}

/**
 * Compute curriculum day number for a given date
 * @param {Date} date - Target date
 * @param {string} curriculumStartDate - ISO timestamp of curriculum start
 * @returns {number|null} - Day number (1-based), or null if before start
 */
function getCurriculumDayNumber(date, curriculumStartDate) {
    if (!curriculumStartDate) return null;
    const start = new Date(curriculumStartDate);
    start.setHours(0, 0, 0, 0);
    const target = new Date(date);
    target.setHours(0, 0, 0, 0);
    const daysDiff = Math.floor((target - start) / (1000 * 60 * 60 * 24));
    if (daysDiff < 0) return null; // Before curriculum start
    return daysDiff + 1; // 1-based day number
}

/**
 * Get the main precision rail for curriculum with category matching
 *
 * @param {Object} options
 * @param {Date} options.today - Reference date (default: now)
 * @param {number} options.windowDays - Rolling window length (default: 14)
 *
 * @returns {Array} Array of rail entries, each containing:
 * {
 *   dateKeyLocal: "YYYY-MM-DD",
 *   dayOfWeek: 0-6 (0=Sun),
 *   isOffDay: boolean,
 *   isVacation: boolean,
 *   precisionMode: 'curriculum'|'advanced',
 *   curriculumDayNumber: number|null,
 *   expectedSlots: ["HH:mm", ...],
 *   satisfiedSlots: [
 *     {
 *       legNumber: number,
 *       categoryId: string,
 *       matchPolicy: string,
 *       time: "HH:mm",
 *       status: 'green'|'red'|null,
 *       deltaMinutes: number|null,
 *       matchedSessionId: string|null
 *     }
 *   ],
 *   dayStatus: 'gray'|'blank'|'green'|'red'
 * }
 */
export function getCurriculumPrecisionRail({
    today = new Date(),
    windowDays = 14,
} = {}) {
    const curriculumStore = useCurriculumStore.getState();
    const progressStore = useProgressStore.getState();

    // Config
    const precisionMode = curriculumStore.precisionMode || 'curriculum';
    const offDaysOfWeek = curriculumStore.offDaysOfWeek || [0];
    const practiceTimeSlots = curriculumStore.practiceTimeSlots || [];
    const curriculumStartDate = curriculumStore.curriculumStartDate;
    const isVacation = progressStore.vacation?.active || false;

    // Sessions (use sessionsV2 where completion === "completed")
    const completedSessions = (progressStore.sessionsV2 || []).filter(
        s => s.completion === 'completed'
    );

    // Build rolling window: last N days ending today (local timezone)
    const rail = [];

    for (let i = windowDays - 1; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateKeyLocal = getLocalDateKey(d);
        const dayOfWeek = getDayOfWeek(dateKeyLocal);

        // Determine day status based on config flags
        let dayStatus = null;
        let isOffDay = false;
        let displayVacation = isVacation;
        let satisfiedSlots = [];
        let curriculumDayNumber = null;

        // Priority: advanced mode > vacation > off-day > normal
        if (precisionMode === 'advanced') {
            dayStatus = 'gray';
        } else if (isVacation) {
            dayStatus = 'gray';
            displayVacation = true;
        } else if (offDaysOfWeek.includes(dayOfWeek)) {
            dayStatus = 'gray';
            isOffDay = true;
        } else {
            // Compute curriculum day number for this date
            curriculumDayNumber = getCurriculumDayNumber(d, curriculumStartDate);

            if (!curriculumDayNumber) {
                // Curriculum hasn't started or date is before start
                dayStatus = 'gray';
            } else {
                // Get curriculum day definition
                const curriculumDay = curriculumStore.getCurriculumDay(curriculumDayNumber);

                if (!curriculumDay) {
                    // Day doesn't exist in curriculum (past curriculum end, etc.)
                    dayStatus = 'gray';
                } else {
                    // Extract required legs (only these must be satisfied)
                    const requiredLegs = (curriculumDay.legs || []).filter(
                        leg => leg.required === true
                    );

                    if (requiredLegs.length === 0) {
                        // No required legs = no measurement
                        dayStatus = 'gray';
                    } else {
                        // Find sessions for this day
                        const sessionsThisDay = completedSessions.filter(
                            s => getLocalDateKey(new Date(s.startedAt)) === dateKeyLocal
                        );

                        // Track which sessions have been used (greedy matching: each session used at most once)
                        const usedSessionIds = new Set();

                        // For each required leg, find best matching session
                        satisfiedSlots = requiredLegs.map(leg => {
                            const timeIndex = leg.legNumber - 1;
                            const time = practiceTimeSlots[timeIndex];

                            // Check if time is valid
                            const scheduledMinutes = time ? parseTimeToMinutes(time) : null;
                            if (scheduledMinutes === null) {
                                // Required leg has no valid time slot => unsatisfiable
                                return {
                                    legNumber: leg.legNumber,
                                    categoryId: leg.categoryId,
                                    matchPolicy: leg.matchPolicy,
                                    time: time || null,
                                    status: null,
                                    deltaMinutes: null,
                                    matchedSessionId: null,
                                };
                            }

                            // Find best matching session for this leg
                            // Criteria: (1) use snapshot if present, (2) category match, (3) closest time, (4) not already used
                            let bestMatch = null;
                            let bestAbsDelta = Infinity;

                            for (const session of sessionsThisDay) {
                                if (usedSessionIds.has(session.id)) continue; // Already used

                                // Phase 7: Fast-path using snapshots if present
                                if (session.scheduleMatched) {
                                    // Snapshot only matches if legNumber and status are valid
                                    if (session.scheduleMatched.legNumber === leg.legNumber &&
                                        session.scheduleMatched.status &&
                                        (session.scheduleMatched.status === 'green' || session.scheduleMatched.status === 'red')) {
                                        // Use snapshot
                                        const absDelta = Math.abs(session.scheduleMatched.deltaMinutes);
                                        if (absDelta < bestAbsDelta) {
                                            bestAbsDelta = absDelta;
                                            bestMatch = {
                                                session,
                                                deltaMinutes: session.scheduleMatched.deltaMinutes,
                                                status: session.scheduleMatched.status,
                                                fromSnapshot: true,
                                            };
                                        }
                                    }
                                    // If snapshot exists but doesn't match this leg, skip computed matching
                                    continue;
                                }

                                // Fallback: computed matching for sessions without snapshots (backward compatibility)
                                // Check category/matchPolicy requirement
                                if (!doesSessionMatchLegCategory(session, leg)) {
                                    continue; // Wrong category or matchPolicy
                                }

                                // Check time adherence
                                const actualMinutes = getLocalMinutesFromISO(session.startedAt);
                                if (actualMinutes === null) continue;

                                const deltaMin = computeDeltaMinutes(actualMinutes, scheduledMinutes);
                                const absDelta = Math.abs(deltaMin);

                                // Check if within acceptable range (within 60 minutes)
                                if (absDelta > 60) continue;

                                // Track closest match
                                if (absDelta < bestAbsDelta) {
                                    bestAbsDelta = absDelta;
                                    bestMatch = {
                                        session,
                                        deltaMinutes: deltaMin,
                                        status: getDeltaStatus(deltaMin),
                                        fromSnapshot: false,
                                    };
                                }
                            }

                            // Mark session as used if matched
                            if (bestMatch) {
                                usedSessionIds.add(bestMatch.session.id);
                                return {
                                    legNumber: leg.legNumber,
                                    categoryId: leg.categoryId,
                                    matchPolicy: leg.matchPolicy,
                                    time,
                                    status: bestMatch.status,
                                    deltaMinutes: bestMatch.deltaMinutes,
                                    matchedSessionId: bestMatch.session.id,
                                };
                            }

                            // No match found for this leg
                            return {
                                legNumber: leg.legNumber,
                                categoryId: leg.categoryId,
                                matchPolicy: leg.matchPolicy,
                                time,
                                status: null,
                                deltaMinutes: null,
                                matchedSessionId: null,
                            };
                        });

                        // Compute day status from leg satisfaction
                        const unsatisfiedLegs = satisfiedSlots.filter(s => s.status === null);
                        if (unsatisfiedLegs.length > 0) {
                            // Any leg not satisfied => BLANK
                            dayStatus = 'blank';
                        } else {
                            // All legs satisfied; check for any RED
                            const hasRed = satisfiedSlots.some(s => s.status === 'red');
                            dayStatus = hasRed ? 'red' : 'green';
                        }
                    }
                }
            }
        }

        rail.push({
            dateKeyLocal,
            dayOfWeek,
            isOffDay,
            isVacation: displayVacation,
            precisionMode,
            curriculumDayNumber,
            satisfiedSlots,
            dayStatus,
        });
    }

    return rail;
}
