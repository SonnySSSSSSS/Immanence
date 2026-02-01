// src/services/infographics/sessionCategory.js
// Resolver: convert sessionV2 properties to canonical categoryId

import { CATEGORY_IDS } from '../../data/categoryIds.js';

/**
 * Resolve a sessionV2 object to its categoryId.
 *
 * @param {Object} sessionV2 - Session object from progressStore.sessionsV2
 * @returns {string|null} - One of CATEGORY_IDS or null if unresolved
 *
 * Rules:
 * - practiceId is checked first (if it matches known practices)
 * - practiceMode is checked second (for circuit, ritual, etc.)
 * - configSnapshot.practiceType is checked third
 * - domain (legacy field) is checked last
 */
export function resolveCategoryIdFromSessionV2(sessionV2) {
    if (!sessionV2) return null;

    const { practiceId, practiceMode, configSnapshot, domain } = sessionV2;

    // ========================================
    // 1. Check practiceId (explicit practice type)
    // ========================================
    const practiceIdLower = String(practiceId || '').toLowerCase().trim();
    if (practiceIdLower) {
        if (practiceIdLower.includes('breath')) return 'breathwork';
        if (practiceIdLower.includes('aware') || practiceIdLower.includes('vipassana') || practiceIdLower.includes('insight')) return 'awareness';
        if (practiceIdLower.includes('body') || practiceIdLower.includes('scan') || practiceIdLower.includes('somatic')) return 'body_scan';
        if (practiceIdLower.includes('visual') || practiceIdLower.includes('cymatic') || practiceIdLower.includes('photic') || practiceIdLower.includes('mandala') || practiceIdLower.includes('kasina')) return 'visualization';
        if (practiceIdLower.includes('sound') || practiceIdLower.includes('binaural') || practiceIdLower.includes('isochronic')) return 'sound';
        if (practiceIdLower.includes('ritual') || practiceIdLower.includes('integration')) return 'ritual';
        if (practiceIdLower.includes('wisdom') || practiceIdLower.includes('treatise')) return 'wisdom';
        if (practiceIdLower.includes('circuit')) return 'circuit_training';
    }

    // ========================================
    // 2. Check practiceMode (circuit, ritual, etc.)
    // ========================================
    const practiceModeLower = String(practiceMode || '').toLowerCase().trim();
    if (practiceModeLower) {
        if (practiceModeLower.includes('circuit')) return 'circuit_training';
        if (practiceModeLower.includes('ritual')) return 'ritual';
        if (practiceModeLower.includes('breath')) return 'breathwork';
        if (practiceModeLower.includes('aware') || practiceModeLower.includes('vipassana')) return 'awareness';
        if (practiceModeLower.includes('body') || practiceModeLower.includes('scan')) return 'body_scan';
        if (practiceModeLower.includes('visual') || practiceModeLower.includes('cymatic')) return 'visualization';
        if (practiceModeLower.includes('sound')) return 'sound';
    }

    // ========================================
    // 3. Check configSnapshot.practiceType (if present)
    // ========================================
    const configType = String(configSnapshot?.practiceType || '').toLowerCase().trim();
    if (configType) {
        if (configType.includes('breath')) return 'breathwork';
        if (configType.includes('aware') || configType.includes('insight') || configType.includes('vipassana')) return 'awareness';
        if (configType.includes('body') || configType.includes('scan')) return 'body_scan';
        if (configType.includes('visual') || configType.includes('cymatic') || configType.includes('photic')) return 'visualization';
        if (configType.includes('sound') || configType.includes('binaural')) return 'sound';
        if (configType.includes('ritual') || configType.includes('integration')) return 'ritual';
        if (configType.includes('wisdom')) return 'wisdom';
        if (configType.includes('circuit')) return 'circuit_training';
    }

    // ========================================
    // 4. Check domain (legacy field, used by progressStore)
    // ========================================
    const domainLower = String(domain || '').toLowerCase().trim();
    if (domainLower) {
        if (domainLower === 'breathwork') return 'breathwork';
        if (domainLower === 'visualization') return 'visualization';
        if (domainLower === 'wisdom') return 'wisdom';
        if (domainLower === 'focus' || domainLower === 'awareness') return 'awareness';
        if (domainLower === 'circuit' || domainLower === 'circuit-training') return 'circuit_training';
    }

    // ========================================
    // 5. Unresolved
    // ========================================
    return null;
}
