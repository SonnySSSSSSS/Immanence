import { addDaysToDateKey, getLocalDateKey } from './dateUtils.js';

export const DEFAULT_START_WINDOW_EARLY_MIN = 60;
export const DEFAULT_START_WINDOW_LATE_MIN = 60;

export function parseHHMM(timeStr) {
  if (typeof timeStr !== 'string') return null;
  const trimmed = timeStr.trim();
  const match = /^(\d{1,2}):(\d{2})$/.exec(trimmed);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return { hours, minutes };
}

export function formatHHMM({ hours, minutes } = {}) {
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function normalizeHHMM(timeStr) {
  const parsed = parseHHMM(timeStr);
  return parsed ? formatHHMM(parsed) : null;
}

export function timeStrToMinutes(timeStr) {
  const parsed = parseHHMM(timeStr);
  if (!parsed) return null;
  return parsed.hours * 60 + parsed.minutes;
}

export function normalizeAndSortTimeSlots(times = [], { maxCount = 3 } = {}) {
  const raw = Array.isArray(times) ? times : [];
  const normalized = raw
    .filter((t) => typeof t === 'string' && t.trim().length > 0)
    .map((t) => normalizeHHMM(t))
    .filter(Boolean);

  // De-dupe while preserving first occurrence (pre-sort) to keep user intent where possible.
  const uniq = [];
  const seen = new Set();
  for (const t of normalized) {
    if (seen.has(t)) continue;
    seen.add(t);
    uniq.push(t);
  }

  uniq.sort((a, b) => {
    const am = timeStrToMinutes(a);
    const bm = timeStrToMinutes(b);
    if (am === null && bm === null) return 0;
    if (am === null) return 1;
    if (bm === null) return -1;
    return am - bm;
  });

  const limit = Number.isFinite(maxCount) ? Math.max(0, maxCount) : 3;
  return uniq.slice(0, limit);
}

export function localDateTimeFromDateKeyAndTime(dateKey, timeStr) {
  if (typeof dateKey !== 'string' || !dateKey) return null;
  const parsed = parseHHMM(timeStr);
  if (!parsed) return null;
  // Parse YYYY-MM-DD as local date explicitly to avoid timezone issues
  const [year, month, day] = dateKey.split('-').map(Number);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null;
  const d = new Date(year, month - 1, day, 0, 0, 0, 0);
  if (Number.isNaN(d.getTime())) return null;
  d.setHours(parsed.hours, parsed.minutes, 0, 0);
  return d;
}

/**
 * Compute the effective "Day 1" anchor time based on a first slot time.
 * If the first slot's start window has already passed today, Day 1 begins tomorrow.
 */
export function computeScheduleAnchorStartAt({
  now = new Date(),
  firstSlotTime,
  lateWindowMin = DEFAULT_START_WINDOW_LATE_MIN,
} = {}) {
  const todayKey = getLocalDateKey(now);
  const todayAtFirst = localDateTimeFromDateKeyAndTime(todayKey, firstSlotTime);
  if (!todayAtFirst) return new Date(now);

  const lateByMs = now.getTime() - todayAtFirst.getTime();
  if (lateByMs > lateWindowMin * 60 * 1000) {
    const tomorrowKey = addDaysToDateKey(todayKey, 1);
    return localDateTimeFromDateKeyAndTime(tomorrowKey, firstSlotTime) ?? new Date(now);
  }

  return todayAtFirst;
}

export function getStartWindowState({
  now = new Date(),
  scheduledAt,
  earlyWindowMin = DEFAULT_START_WINDOW_EARLY_MIN,
  lateWindowMin = DEFAULT_START_WINDOW_LATE_MIN,
} = {}) {
  if (!(scheduledAt instanceof Date) || Number.isNaN(scheduledAt.getTime())) {
    return { withinWindow: true, tooEarly: false, expired: false, deltaMinutes: null };
  }

  // Positive = started late; Negative = started early
  const deltaMinutes = Math.round((now.getTime() - scheduledAt.getTime()) / 60000);
  const tooEarly = deltaMinutes < -earlyWindowMin;
  const expired = deltaMinutes > lateWindowMin;
  const withinWindow = !tooEarly && !expired;
  return { withinWindow, tooEarly, expired, deltaMinutes };
}
