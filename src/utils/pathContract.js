// @ts-check

import { getPathById } from '../data/navigationData.js';
import { normalizeAndSortTimeSlots } from './scheduleUtils.js';

/**
 * @typedef {object} PathContract
 * @property {number | null} totalDays
 * @property {number | null} practiceDaysPerWeek
 * @property {number | null} maxLegsPerDay
 * @property {number | null} requiredLegsPerDay
 * @property {number | null} requiredTimeSlots
 */

/** @typedef {{ selectedDaysOfWeek?: unknown[], selectedTimes?: unknown[] }} PathSelectionInput */
/** @typedef {{ selectedDaysOfWeek: number[], selectedTimes: string[] }} NormalizedPathSelections */
/** @typedef {{ ok: boolean, error: string | null, warning: 'contract_invariant_normalized' | null, contract: PathContract, selectedDaysOfWeek: number[], selectedTimes: string[] }} PathActivationValidation */

/** @type {Readonly<PathContract>} */
const DEFAULT_CONTRACT = Object.freeze({
  totalDays: null,
  practiceDaysPerWeek: null,
  maxLegsPerDay: null,
  requiredLegsPerDay: null,
  requiredTimeSlots: null,
});

/** @param {unknown} value */
/** @returns {number | null} */
const normalizePositiveInt = (value) => {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) return null;
  return n;
};

/** @param {unknown} [days=[]] */
/** @returns {number[]} */
const normalizeDays = (days = []) => {
  const normalized = Array.isArray(days)
    ? days.filter((d) => Number.isInteger(d) && d >= 0 && d <= 6)
    : [];
  return [...new Set(normalized)].sort((a, b) => a - b);
};

/** @param {string | Record<string, unknown> | null | undefined} pathOrId */
/** @returns {PathContract} */
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

/** @param {PathSelectionInput} [arg0] */
/** @returns {NormalizedPathSelections} */
export function normalizePathSelections({ selectedDaysOfWeek = [], selectedTimes = [] } = {}) {
  return {
    selectedDaysOfWeek: normalizeDays(selectedDaysOfWeek),
    // Do not truncate here. Validation must fail-closed if count exceeds contract.
    selectedTimes: normalizeAndSortTimeSlots(selectedTimes, { maxCount: 24 }),
  };
}

/** @param {PathContract} contract */
/** @returns {{ contract: PathContract, warning: 'contract_invariant_normalized' | null }} */
const normalizeContractSafe = (contract) => {
  const next = { ...contract };
  let warning = null;

  const hasRequiredLegs = Number.isInteger(next.requiredLegsPerDay);
  const hasMaxLegs = Number.isInteger(next.maxLegsPerDay);
  if (hasRequiredLegs && hasMaxLegs && next.requiredLegsPerDay > next.maxLegsPerDay) {
    next.requiredLegsPerDay = next.maxLegsPerDay;
    warning = 'contract_invariant_normalized';
  }

  const hasRequiredTimeSlots = Number.isInteger(next.requiredTimeSlots);
  if (hasRequiredTimeSlots && hasMaxLegs && next.requiredTimeSlots > next.maxLegsPerDay) {
    next.requiredTimeSlots = next.maxLegsPerDay;
    warning = 'contract_invariant_normalized';
  }

  return { contract: next, warning };
};

/** @param {string | Record<string, unknown> | null | undefined} pathOrId */
/** @param {PathSelectionInput} [selections] */
/** @returns {PathActivationValidation} */
export function validatePathActivationSelections(pathOrId, selections = {}) {
  const path = typeof pathOrId === 'string' ? getPathById(pathOrId) : pathOrId;
  const normalizedContract = normalizeContractSafe(getPathContract(path));
  const contract = normalizedContract.contract;
  const normalized = normalizePathSelections(selections);

  if (path?.id === 'initiation-2' && contract.totalDays !== 14) {
    return {
      ok: false,
      error: 'Initiation Path 2 must be a 14-day program.',
      warning: normalizedContract.warning,
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
      warning: normalizedContract.warning,
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
      warning: normalizedContract.warning,
      contract,
      ...normalized,
    };
  }

  return {
    ok: true,
    error: null,
    warning: normalizedContract.warning,
    contract,
    ...normalized,
  };
}
