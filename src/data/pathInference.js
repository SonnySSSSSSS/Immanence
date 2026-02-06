// src/data/pathInference.js
// Pure inference helpers for attention-interface paths

import { PATH_IDS } from './pathDefinitions';

const DEFAULT_OPTIONS = {
    emergenceThresholdDays: 90,
    windowDays: 90,
    minSignalMinutes: 45,
    minDominantShare: 0.5,
    minDominantMinutes: 20,
    balancedMinShare: 0.15,
    balancedMaxShare: 0.45,
    complementaryMinShare: 0.2,
};

function clampNumber(value, fallback = 0) {
    if (typeof value !== 'number' || Number.isNaN(value)) return fallback;
    return value;
}

function safeString(value) {
    return typeof value === 'string' ? value.trim() : '';
}

function normalizeKey(value) {
    return safeString(value).toLowerCase();
}

function extractBreathPath(metadata = {}) {
    const preset = normalizeKey(metadata?.preset || metadata?.breathPreset || '');
    const pattern = metadata?.pattern || null;
    const tempoSync = Boolean(metadata?.tempoSync || metadata?.tempo || metadata?.bpm || metadata?.exactHz);

    if (preset.includes('box') || preset.includes('square') || preset.includes('ratio') || preset.includes('triangle')) {
        return 'Yantra';
    }

    if (tempoSync || preset.includes('coherence') || preset.includes('resonance')) {
        return 'Nada';
    }

    if (pattern && typeof pattern === 'object') {
        const inhale = clampNumber(pattern.inhale, 0);
        const exhale = clampNumber(pattern.exhale, 0);
        const hold1 = clampNumber(pattern.hold1, 0);
        const hold2 = clampNumber(pattern.hold2, 0);

        const isSymmetric = inhale > 0 && inhale === exhale && hold1 === hold2;
        if (isSymmetric) return 'Yantra';
        if (exhale >= inhale + 2) return 'Kaya';
    }

    return 'Kaya';
}

function resolvePathFromPractice({ practiceId, practiceMode, domain, metadata }) {
    const practice = normalizeKey(practiceId || domain);
    const mode = normalizeKey(practiceMode || metadata?.practiceMode || metadata?.mode || metadata?.activeMode);

    if (practice === 'awareness') {
        if (mode.includes('body') || mode.includes('scan')) return 'Kaya';
        if (mode.includes('feel') || mode.includes('emotion')) return 'Kaya';
        if (mode.includes('insight') || mode.includes('sakshi') || mode.includes('vipassana')) return 'Yantra';
        return 'Yantra';
    }

    if (practice === 'resonance' || practice === 'sound') {
        if (mode.includes('cymatics')) return 'Chitra';
        return 'Nada';
    }

    if (practice === 'perception' || practice === 'visualization' || practice === 'photic' || practice === 'cymatics') {
        return 'Chitra';
    }

    if (practice === 'breath' || practice === 'breathwork' || practice === 'breathing') {
        return extractBreathPath(metadata);
    }

    if (practice === 'integration' || practice === 'ritual' || practice === 'circuit') {
        return 'Yantra';
    }

    if (practice === 'circuit-training' || practice === 'focus' || practice === 'attention') {
        return 'Yantra';
    }

    if (practice === 'wisdom') return 'Yantra';

    if (practice.includes('vipassana') || practice.includes('sakshi') || practice.includes('meditation')) return 'Yantra';
    if (practice.includes('body') || practice.includes('bodyscan')) return 'Kaya';

    return null;
}

export function calculatePathSignals(practiceLog = [], options = {}) {
    const config = { ...DEFAULT_OPTIONS, ...options };
    const totals = PATH_IDS.reduce((acc, id) => {
        acc[id] = 0;
        return acc;
    }, {});

    practiceLog.forEach((entry) => {
        if (!entry) return;
        const minutes = clampNumber(entry.duration, 0);
        if (minutes <= 0) return;

        const metadata = entry.metadata || {};
        const practiceId = entry.practiceId || metadata.practiceId || metadata.practice || null;
        const practiceMode = entry.practiceMode || metadata.practiceMode || null;

        const resolved = resolvePathFromPractice({
            practiceId,
            practiceMode,
            domain: entry.domain,
            metadata,
        });

        if (!resolved) return;
        totals[resolved] = (totals[resolved] || 0) + minutes;
    });

    const total = Object.values(totals).reduce((sum, value) => sum + value, 0);
    const normalized = PATH_IDS.reduce((acc, id) => {
        acc[id] = total > 0 ? totals[id] / total : 0;
        return acc;
    }, {});

    return { totals, total, normalized, config };
}

export function resolvePathFromSignals(signalTotals, options = {}) {
    const config = { ...DEFAULT_OPTIONS, ...signalTotals?.config, ...options };
    const totals = signalTotals?.totals || {};
    const total = clampNumber(signalTotals?.total, 0);
    const normalized = signalTotals?.normalized || {};

    if (total < config.minSignalMinutes) {
        return { path: null, status: 'forming', complementary: [], confidence: 'low-signal' };
    }

    const sorted = PATH_IDS.map((id) => ({
        id,
        share: normalized[id] || 0,
        minutes: totals[id] || 0,
    })).sort((a, b) => b.share - a.share);

    const dominant = sorted[0];
    const secondary = sorted[1];

    if (dominant && dominant.share >= config.minDominantShare && dominant.minutes >= config.minDominantMinutes) {
        const complementary = sorted
            .filter(item => item.id !== dominant.id && item.share >= config.complementaryMinShare)
            .map(item => item.id);
        return { path: dominant.id, status: 'established', complementary, confidence: 'dominant' };
    }

    const allOver = PATH_IDS.every((id) => (normalized[id] || 0) >= config.balancedMinShare);
    const noneOver = PATH_IDS.every((id) => (normalized[id] || 0) <= config.balancedMaxShare);
    if (allOver && noneOver) {
        return { path: null, status: 'balanced', complementary: [], confidence: 'balanced' };
    }

    const complementary = sorted
        .filter(item => item.id !== (dominant?.id || null) && item.share >= config.complementaryMinShare)
        .map(item => item.id);

    return {
        path: null,
        status: 'forming',
        complementary,
        confidence: dominant?.id ? 'diffuse' : 'insufficient',
        dominant: dominant?.id || null,
        secondary: secondary?.id || null,
    };
}

export function inferPathFromLog(practiceLog = [], firstPracticeDate = null, options = {}) {
    const config = { ...DEFAULT_OPTIONS, ...options };

    if (!firstPracticeDate) {
        return { path: null, status: 'forming', complementary: [], daysUntilEmergence: null };
    }

    const daysSinceStart = (Date.now() - firstPracticeDate) / (24 * 60 * 60 * 1000);

    if (daysSinceStart < config.emergenceThresholdDays) {
        return {
            path: null,
            status: 'forming',
            complementary: [],
            daysUntilEmergence: Math.ceil(config.emergenceThresholdDays - daysSinceStart),
        };
    }

    const windowStart = Date.now() - (config.windowDays * 24 * 60 * 60 * 1000);
    const recent = practiceLog.filter(entry => entry?.timestamp >= windowStart);
    const signals = calculatePathSignals(recent, config);
    const resolved = resolvePathFromSignals(signals, config);

    return {
        ...resolved,
        signals,
        daysUntilEmergence: 0,
    };
}
