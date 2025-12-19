// src/state/waveStore.js
// Wave Function Store - Persistent self-knowledge profile for Four Modes
// The "wave function" represents the user's characteristic patterns,
// built from validated psychological assessments and self-description.

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useWaveStore = create(
    persist(
        (set, get) => ({
            // ═══════════════════════════════════════════════════════════════════
            // BIG FIVE (Required for Wave/Sword modes)
            // ═══════════════════════════════════════════════════════════════════
            bigFive: null,
            // Shape: { 
            //   scores: { openness, conscientiousness, extraversion, agreeableness, neuroticism }, // 0-1
            //   version: 'tipi-10' | 'ipip-20' | 'bfi-44',
            //   reliability: 'low' | 'medium' | 'high',
            //   completedAt: timestamp
            // }

            // ═══════════════════════════════════════════════════════════════════
            // VIA CHARACTER STRENGTHS (Recommended)
            // ═══════════════════════════════════════════════════════════════════
            viaTopStrengths: [],
            // Shape: ['fairness', 'kindness', 'curiosity', ...] (top 5)

            // ═══════════════════════════════════════════════════════════════════
            // ENNEAGRAM (Optional)
            // ═══════════════════════════════════════════════════════════════════
            enneagram: null,
            // Shape: { core: 1-9, wing: 1-9 | null, tritype: [1-9, 1-9, 1-9] | null }

            // ═══════════════════════════════════════════════════════════════════
            // ATTACHMENT STYLE (Optional)
            // ═══════════════════════════════════════════════════════════════════
            attachmentStyle: null,
            // Shape: 'secure' | 'anxious' | 'avoidant' | 'disorganized'

            // ═══════════════════════════════════════════════════════════════════
            // JYOTISH (Optional)
            // ═══════════════════════════════════════════════════════════════════
            jyotish: null,
            // Shape: { 
            //   lagna: string, moon: string, sun: string,
            //   nakshatra: string | null,
            //   currentDasha: { major: string, minor: string | null } | null
            // }

            // ═══════════════════════════════════════════════════════════════════
            // USER-DEFINED TAGS (max 10, max 30 chars each)
            // ═══════════════════════════════════════════════════════════════════
            selfDescribedTags: [],

            // ═══════════════════════════════════════════════════════════════════
            // ASSESSMENT HISTORY
            // ═══════════════════════════════════════════════════════════════════
            assessmentHistory: [],
            // Shape: [{ type: 'bigFive', date: timestamp, version: 'tipi-10', data: {...} }]

            // ═══════════════════════════════════════════════════════════════════
            // COMPUTED
            // ═══════════════════════════════════════════════════════════════════

            isMinimumViable: () => get().bigFive !== null,

            getTraitSummary: () => {
                const bf = get().bigFive?.scores;
                if (!bf) return null;

                const traits = [];
                if (bf.openness > 0.6) traits.push('open to experience');
                if (bf.openness < 0.4) traits.push('practical, conventional');
                if (bf.conscientiousness > 0.6) traits.push('organized, disciplined');
                if (bf.conscientiousness < 0.4) traits.push('flexible, spontaneous');
                if (bf.extraversion > 0.6) traits.push('socially energized');
                if (bf.extraversion < 0.4) traits.push('reserved, reflective');
                if (bf.agreeableness > 0.6) traits.push('cooperative, trusting');
                if (bf.agreeableness < 0.4) traits.push('skeptical, direct');
                if (bf.neuroticism > 0.6) traits.push('emotionally sensitive');
                if (bf.neuroticism < 0.4) traits.push('emotionally stable');

                return traits;
            },

            getProfileForLLM: () => {
                const state = get();
                const parts = [];

                if (state.bigFive) {
                    const bf = state.bigFive.scores;
                    const reliability = state.bigFive.reliability;
                    parts.push(`Big Five (${reliability} reliability): O=${bf.openness.toFixed(2)}, C=${bf.conscientiousness.toFixed(2)}, E=${bf.extraversion.toFixed(2)}, A=${bf.agreeableness.toFixed(2)}, N=${bf.neuroticism.toFixed(2)}`);
                }
                if (state.viaTopStrengths.length > 0) {
                    parts.push(`Top Strengths: ${state.viaTopStrengths.join(', ')}`);
                }
                if (state.enneagram) {
                    const wing = state.enneagram.wing ? `w${state.enneagram.wing}` : '';
                    const tritype = state.enneagram.tritype ? ` (${state.enneagram.tritype.join('-')})` : '';
                    parts.push(`Enneagram: ${state.enneagram.core}${wing}${tritype}`);
                }
                if (state.attachmentStyle) {
                    parts.push(`Attachment Style: ${state.attachmentStyle}`);
                }
                if (state.jyotish) {
                    const j = state.jyotish;
                    let jyotishStr = `Jyotish: Lagna=${j.lagna}, Moon=${j.moon}, Sun=${j.sun}`;
                    if (j.nakshatra) jyotishStr += `, Nakshatra=${j.nakshatra}`;
                    if (j.currentDasha) {
                        jyotishStr += `, Dasha=${j.currentDasha.major}`;
                        if (j.currentDasha.minor) jyotishStr += `-${j.currentDasha.minor}`;
                    }
                    parts.push(jyotishStr);
                }
                if (state.selfDescribedTags.length > 0) {
                    parts.push(`Self-described: ${state.selfDescribedTags.join(', ')}`);
                }

                return parts.join('\n');
            },

            // ═══════════════════════════════════════════════════════════════════
            // ACTIONS
            // ═══════════════════════════════════════════════════════════════════

            setBigFive: (scores, version = 'tipi-10') => {
                const reliability = version === 'bfi-44' ? 'high' : version === 'ipip-20' ? 'medium' : 'low';
                const now = Date.now();
                set((state) => ({
                    bigFive: { scores, version, reliability, completedAt: now },
                    assessmentHistory: [
                        ...state.assessmentHistory,
                        { type: 'bigFive', date: now, version, data: scores }
                    ]
                }));
            },

            setViaStrengths: (strengths) => {
                // Limit to top 5
                set({ viaTopStrengths: strengths.slice(0, 5) });
            },

            setEnneagram: (core, wing = null, tritype = null) => {
                set({ enneagram: { core, wing, tritype } });
            },

            setAttachmentStyle: (style) => set({ attachmentStyle: style }),

            setJyotish: (data) => set({ jyotish: data }),

            addSelfDescribedTag: (tag) => {
                const normalized = tag.trim().toLowerCase().slice(0, 30);
                if (!normalized) return false;

                const current = get().selfDescribedTags;
                if (current.length >= 10) return false;
                if (current.includes(normalized)) return false;

                set({ selfDescribedTags: [...current, normalized] });
                return true;
            },

            removeSelfDescribedTag: (tag) => set((state) => ({
                selfDescribedTags: state.selfDescribedTags.filter(t => t !== tag)
            })),

            // For dev/testing
            clearAll: () => set({
                bigFive: null,
                viaTopStrengths: [],
                enneagram: null,
                attachmentStyle: null,
                jyotish: null,
                selfDescribedTags: [],
                assessmentHistory: []
            }),
        }),
        {
            name: 'immanenceOS.waveFunction',
            version: 1,
        }
    )
);
