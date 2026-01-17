// src/data/practiceFamily.js
// ═══════════════════════════════════════════════════════════════════════════
// ATTENTION PATH INSTRUMENTATION — PRACTICE FAMILY MAPPING
// ═══════════════════════════════════════════════════════════════════════════
//
// INVARIANT: This module must be PURE.
// - No inference. No heuristics. No user history.
// - Only deterministic mapping from metadata → family.
//
// Practice family is determined by the ATTENTIONAL JOB, not by:
// - Modality (visual, auditory, somatic)
// - Theme (devotional, healing, focus)
// - Tradition (yoga, Buddhist, shamanic)
//
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Practice Families — categorized by attentional demand
 */
export const PRACTICE_FAMILIES = {
    SETTLE: 'SETTLE',   // Single-anchor stabilization
    SCAN: 'SCAN',       // Distributed or sequential attention
    RELATE: 'RELATE',   // Attentional engagement with others / self-as-other
    INQUIRE: 'INQUIRE', // Conceptual / insight-directed attention
};

/**
 * SENSORY TYPE → FAMILY
 * Highest priority — overrides domain and ritual category
 */
const SENSORY_TYPE_TO_FAMILY = {
    // SCAN — Distributed/sequential attention
    bodyScan: PRACTICE_FAMILIES.SCAN,
    vipassana: PRACTICE_FAMILIES.SCAN,
    sakshi: PRACTICE_FAMILIES.SCAN,

    // RELATE — Attunement, emotional engagement
    bhakti: PRACTICE_FAMILIES.RELATE,
};

/**
 * RITUAL CATEGORY → FAMILY
 * Second priority — overrides domain
 */
const RITUAL_CATEGORY_TO_FAMILY = {
    // SETTLE — Single-anchor stabilization
    grounding: PRACTICE_FAMILIES.SETTLE,
    concentration: PRACTICE_FAMILIES.SETTLE,

    // SCAN — Sequential attention, movement with coherence
    purification: PRACTICE_FAMILIES.SCAN,
    circulation: PRACTICE_FAMILIES.SCAN,
    witnessing: PRACTICE_FAMILIES.SCAN,

    // RELATE — Attunement, emotional engagement
    devotional: PRACTICE_FAMILIES.RELATE,
    invocation: PRACTICE_FAMILIES.RELATE,
    transmutation: PRACTICE_FAMILIES.RELATE,

    // INQUIRE — Insight-directed, conceptual
    paradox: PRACTICE_FAMILIES.INQUIRE,
};

/**
 * DOMAIN → FAMILY (lowest priority)
 * Only used when sensoryType and ritualCategory don't apply
 * 
 * NOTE: 'yoga' and 'wisdom' are intentionally OMITTED here.
 * - yoga: spans SETTLE (static) and SCAN (dynamic) — must resolve via sensoryType/ritualCategory
 * - wisdom: spans INQUIRE (reading), SETTLE (contemplation), RELATE (devotion) — must resolve via subcategory
 */
const DOMAIN_TO_FAMILY = {
    // SETTLE — Single-anchor stabilization
    breathwork: PRACTICE_FAMILIES.SETTLE,
    breathing: PRACTICE_FAMILIES.SETTLE,
    meditation: PRACTICE_FAMILIES.SETTLE,
    visualization: PRACTICE_FAMILIES.SETTLE,
    cymatics: PRACTICE_FAMILIES.SETTLE,
    sound: PRACTICE_FAMILIES.SETTLE,
    // Combined umbrella practices
    integration: PRACTICE_FAMILIES.SETTLE,
    awareness: PRACTICE_FAMILIES.SCAN,
    resonance: PRACTICE_FAMILIES.SETTLE,
    perception: PRACTICE_FAMILIES.SETTLE,

    // Domains that need resolution (return null → falls through to default)
    // yoga: null,   // Intentionally omitted
    // wisdom: null, // Intentionally omitted
};

/**
 * Get practice family from session metadata
 * 
 * Resolution priority order (highest → lowest):
 * 1. sensoryType
 * 2. ritualCategory
 * 3. domain
 * 4. default = SETTLE
 * 
 * @param {Object} params
 * @param {string} [params.domain] - e.g., 'breathwork', 'visualization', 'yoga'
 * @param {string} [params.ritualCategory] - e.g., 'grounding', 'devotional', 'paradox'
 * @param {string} [params.sensoryType] - e.g., 'bodyScan', 'bhakti', 'vipassana'
 * @returns {string} SETTLE | SCAN | RELATE | INQUIRE
 */
export function getPracticeFamily({ domain, ritualCategory, sensoryType }) {
    // Priority 1: sensoryType (highest specificity)
    if (sensoryType) {
        const sensoryFamily = SENSORY_TYPE_TO_FAMILY[sensoryType];
        if (sensoryFamily) return sensoryFamily;
    }

    // Priority 2: ritualCategory
    if (ritualCategory) {
        const ritualFamily = RITUAL_CATEGORY_TO_FAMILY[ritualCategory];
        if (ritualFamily) return ritualFamily;
    }

    // Priority 3: domain (lowest specificity)
    if (domain) {
        const normalizedDomain = domain.toLowerCase();
        const domainFamily = DOMAIN_TO_FAMILY[normalizedDomain];
        if (domainFamily) return domainFamily;
    }

    // Default: SETTLE (safe fallback for unknown practices)
    return PRACTICE_FAMILIES.SETTLE;
}

/**
 * Export mapping tables for DevPanel inspection
 */
export const MAPPING_TABLES = {
    sensoryType: SENSORY_TYPE_TO_FAMILY,
    ritualCategory: RITUAL_CATEGORY_TO_FAMILY,
    domain: DOMAIN_TO_FAMILY,
};
