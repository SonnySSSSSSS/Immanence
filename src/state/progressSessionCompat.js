import { getDateKey, getLocalDateKey } from '../utils/dateUtils.js';
import { isDevBuild } from '../dev/runtimeGate.js';

const IS_DEV =
    isDevBuild() ||
    (typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production');

let hasWarnedLegacyOnly = false;

export function resolveSessionTimestamp(session) {
    const raw =
        session?.date ||
        session?.timestamp ||
        session?.startedAt ||
        session?.endedAt ||
        null;

    if (raw) return raw;
    if (session?.dateKey) return `${session.dateKey}T00:00:00`;
    return null;
}

export function resolveSessionDateKey(session) {
    if (session?.dateKey) return session.dateKey;
    const raw = resolveSessionTimestamp(session);
    if (!raw) return null;
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return null;
    return getDateKey(date);
}

function inferDomainFromV2Session(sessionV2) {
    const explicit = sessionV2?.domain || sessionV2?.practiceDomain || null;
    if (explicit) return explicit;

    const practiceId = String(sessionV2?.practiceId || '').toLowerCase();
    const practiceMode = String(sessionV2?.practiceMode || '').toLowerCase();
    const token = `${practiceId} ${practiceMode}`.trim();

    if (token.includes('breath') || practiceId === 'breath') return 'breathwork';
    if (token.includes('visual') || token.includes('cymatic') || token.includes('photic')) return 'visualization';
    if (token.includes('sound')) return 'sound';
    if (token.includes('ritual') || practiceId === 'integration') return 'ritual';
    if (token.includes('feel')) return 'focus';
    if (token.includes('vipassana') || practiceId === 'awareness') return 'focus';
    if (practiceId === 'circuit') return 'circuit-training';

    return 'unknown';
}

function asLegacySessionFromV2(sessionV2) {
    const iso = resolveSessionTimestamp(sessionV2);
    const dateKey = resolveSessionDateKey(sessionV2);
    const durationMinutes =
        typeof sessionV2?.durationSec === 'number'
            ? sessionV2.durationSec / 60
            : null;

    return {
        id: sessionV2?.id || null,
        date: iso,
        dateKey,
        domain: inferDomainFromV2Session(sessionV2),
        duration: typeof durationMinutes === 'number' ? durationMinutes : 0,
        metadata: sessionV2?.configSnapshot || sessionV2?.metadata || {},
        _source: 'sessionsV2',
    };
}

/**
 * Canonical session accessor.
 * Precedence: normalize `sessionsV2` first, then append legacy `sessions` as fallback.
 * This keeps V2 authoritative while preserving backward compatibility with existing data.
 */
export function getCanonicalSessions(state) {
    const legacy = Array.isArray(state?.sessions) ? state.sessions : [];
    const v2 = Array.isArray(state?.sessionsV2) ? state.sessionsV2 : [];

    if (IS_DEV && !hasWarnedLegacyOnly && legacy.length > 0 && v2.length === 0) {
        console.warn('[progressStore] legacy-only sessions detected; consider migrating to sessionsV2.');
        hasWarnedLegacyOnly = true;
    }

    const v2AsLegacy = v2.map(asLegacySessionFromV2).filter(s => !!s.dateKey && !!s.date);
    return [...v2AsLegacy, ...legacy];
}

export function deriveLastPracticeDateFromEvents(state) {
    const sessions = getCanonicalSessions(state);
    const honorLogs = Array.isArray(state?.honorLogs) ? state.honorLogs : [];

    const keys = [];
    for (const session of sessions) {
        const raw = resolveSessionTimestamp(session);
        if (!raw) continue;
        const date = new Date(raw);
        if (Number.isNaN(date.getTime())) continue;
        keys.push(getLocalDateKey(date));
    }
    for (const honorLog of honorLogs) {
        const raw = honorLog?.date || honorLog?.timestamp || null;
        if (!raw) continue;
        const date = new Date(raw);
        if (Number.isNaN(date.getTime())) continue;
        keys.push(getLocalDateKey(date));
    }

    if (keys.length === 0) return null;
    keys.sort();
    return keys[keys.length - 1] || null;
}

export function mapLegacyType(type) {
    if (!type) return 'breathwork';
    const normalizedType = type.toLowerCase();
    if (normalizedType.includes('breath') || normalizedType.includes('stillness')) return 'breathwork';
    if (normalizedType.includes('visual') || normalizedType.includes('cymatics')) return 'visualization';
    if (normalizedType.includes('wisdom') || normalizedType.includes('reading')) return 'wisdom';
    return 'breathwork';
}
