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

export function localDateTimeFromDateKeyAndTime(dateKey, timeStr) {
  if (typeof dateKey !== 'string' || !dateKey) return null;
  const parsed = parseHHMM(timeStr);
  if (!parsed) return null;
  const d = new Date(`${dateKey}T00:00:00`);
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

