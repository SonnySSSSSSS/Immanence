import { getPathById } from '../data/navigationData.js';
import { normalizeAndSortTimeSlots } from './scheduleUtils.js';

const DEFAULT_CONTRACT = Object.freeze({
  totalDays: null,
  practiceDaysPerWeek: null,
  maxLegsPerDay: null,
  requiredLegsPerDay: null,
  requiredTimeSlots: null,
});

const normalizePositiveInt = (value) => {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) return null;
  return n;
};

const normalizeDays = (days = []) => {
  const normalized = Array.isArray(days)
    ? days.filter((d) => Number.isInteger(d) && d >= 0 && d <= 6)
    : [];
  return [...new Set(normalized)].sort((a, b) => a - b);
};

export function getPathContract(pathOrId) {
  const path = typeof pathOrId === 'string' ? getPathById(pathOrId) : pathOrId;
  if (!path || typeof path !== 'object') return { ...DEFAULT_CONTRACT };

  const raw = path.contract && typeof path.contract === 'object' ? path.contract : {};
  const totalDays = normalizePositiveInt(raw.totalDays)
    ?? normalizePositiveInt(path?.tracking?.durationDays)
    ?? (normalizePositiveInt(path?.duration) ? path.duration * 7 : null);
  const requiredTimeSlots = normalizePositiveInt(raw.requiredTimeSlots)
    ?? normalizePositiveInt(path?.scheduleSelection?.requiredCount)
    ?? null;
  const requiredLegsPerDay = normalizePositiveInt(raw.requiredLegsPerDay)
    ?? requiredTimeSlots
    ?? null;
  const maxLegsPerDay = normalizePositiveInt(raw.maxLegsPerDay)
    ?? normalizePositiveInt(path?.scheduleSelection?.maxCount)
    ?? requiredLegsPerDay
    ?? null;
  const practiceDaysPerWeek = normalizePositiveInt(raw.practiceDaysPerWeek) ?? null;

  return {
    totalDays,
    practiceDaysPerWeek,
    maxLegsPerDay,
    requiredLegsPerDay,
    requiredTimeSlots,
  };
}

export function normalizePathSelections({ selectedDaysOfWeek = [], selectedTimes = [] } = {}) {
  return {
    selectedDaysOfWeek: normalizeDays(selectedDaysOfWeek),
    // Do not truncate here. Validation must fail-closed if count exceeds contract.
    selectedTimes: normalizeAndSortTimeSlots(selectedTimes, { maxCount: 24 }),
  };
}

export function validatePathActivationSelections(pathOrId, selections = {}) {
  const path = typeof pathOrId === 'string' ? getPathById(pathOrId) : pathOrId;
  const contract = getPathContract(path);
  const normalized = normalizePathSelections(selections);

  if (path?.id === 'initiation-2' && contract.totalDays !== 14) {
    return { ok: false, error: 'Initiation Path 2 must be a 14-day program.', contract, ...normalized };
  }
  if (
    Number.isInteger(contract.requiredLegsPerDay) &&
    Number.isInteger(contract.maxLegsPerDay) &&
    contract.requiredLegsPerDay > contract.maxLegsPerDay
  ) {
    return {
      ok: false,
      error: 'Path contract is invalid: required legs exceed max legs per day.',
      contract,
      ...normalized,
    };
  }
  if (
    Number.isInteger(contract.practiceDaysPerWeek) &&
    normalized.selectedDaysOfWeek.length !== contract.practiceDaysPerWeek
  ) {
    return {
      ok: false,
      error: `Select exactly ${contract.practiceDaysPerWeek} active practice days.`,
      contract,
      ...normalized,
    };
  }
  if (
    Number.isInteger(contract.requiredTimeSlots) &&
    normalized.selectedTimes.length !== contract.requiredTimeSlots
  ) {
    return {
      ok: false,
      error: `Select exactly ${contract.requiredTimeSlots} time slots.`,
      contract,
      ...normalized,
    };
  }

  return { ok: true, error: null, contract, ...normalized };
}
