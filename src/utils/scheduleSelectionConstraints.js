import { getPathById } from '../data/navigationData.js';
import { getPathContract } from './pathContract.js';

const DEFAULT_MAX_COUNT = 3;
const DEFAULT_MIN_COUNT = 1;

const isPositiveInteger = (value) => Number.isInteger(value) && value > 0;

const pluralize = (count, singular, plural = `${singular}s`) => (count === 1 ? singular : plural);

const buildDefaultError = ({ requiredCount, minCount, maxCount }) => {
    if (isPositiveInteger(requiredCount)) {
        return `Please select exactly ${requiredCount} ${pluralize(requiredCount, 'time slot')} to begin this path.`;
    }
    if (isPositiveInteger(minCount) && isPositiveInteger(maxCount) && minCount === maxCount) {
        return `Please select exactly ${minCount} ${pluralize(minCount, 'time slot')} to begin this path.`;
    }
    if (isPositiveInteger(minCount) && isPositiveInteger(maxCount)) {
        return `Please select between ${minCount} and ${maxCount} ${pluralize(maxCount, 'time slots')} to begin this path.`;
    }
    if (isPositiveInteger(minCount)) {
        return `Please select at least ${minCount} ${pluralize(minCount, 'time slot')} to begin this path.`;
    }
    if (isPositiveInteger(maxCount)) {
        return `Please select at most ${maxCount} ${pluralize(maxCount, 'time slot')} to begin this path.`;
    }
    return null;
};

export function normalizeScheduleConstraint(constraint, { includeDefault = false } = {}) {
    const raw = (constraint && typeof constraint === 'object') ? constraint : null;

    if (!raw && !includeDefault) {
        return null;
    }

    const requiredCount = isPositiveInteger(raw?.requiredCount) ? raw.requiredCount : null;
    const minCount = isPositiveInteger(raw?.minCount) ? raw.minCount : null;
    const rawMaxCount = isPositiveInteger(raw?.maxCount) ? raw.maxCount : null;
    const maxCount = requiredCount
        ? Math.max(rawMaxCount ?? requiredCount, requiredCount)
        : rawMaxCount;

    const normalizedMin = requiredCount
        ? requiredCount
        : (minCount ?? (includeDefault ? DEFAULT_MIN_COUNT : null));

    const normalizedMax = maxCount ?? (includeDefault ? DEFAULT_MAX_COUNT : null);

    const hasConstraint = isPositiveInteger(requiredCount) || isPositiveInteger(normalizedMin) || isPositiveInteger(normalizedMax);
    if (!hasConstraint) {
        return null;
    }

    return {
        requiredCount,
        minCount: normalizedMin,
        maxCount: normalizedMax,
        errorMessage: typeof raw?.errorMessage === 'string' ? raw.errorMessage : null,
    };
}

export function getScheduleConstraintForPath(pathId) {
    const path = pathId ? getPathById(pathId) : null;
    if (!path) return null;
    if (path.simple) return null;
    const contract = getPathContract(path);
    const requiredFromContract = contract.requiredTimeSlots;
    const maxFromContract = contract.maxLegsPerDay;
    const merged = {
        ...(path.scheduleSelection || {}),
        ...(Number.isInteger(requiredFromContract) ? { requiredCount: requiredFromContract } : {}),
        ...(Number.isInteger(maxFromContract) ? { maxCount: maxFromContract } : {}),
    };
    return normalizeScheduleConstraint(merged, { includeDefault: true });
}

export function validateSelectedTimes(selectedTimes, constraint) {
    const times = Array.isArray(selectedTimes)
        ? selectedTimes.filter((time) => typeof time === 'string' && time.trim().length > 0)
        : [];
    const normalizedConstraint = normalizeScheduleConstraint(constraint);

    if (!normalizedConstraint) {
        return { ok: true, error: null };
    }

    const count = times.length;
    const { requiredCount, minCount, maxCount, errorMessage } = normalizedConstraint;
    const error = errorMessage || buildDefaultError({ requiredCount, minCount, maxCount });

    if (isPositiveInteger(requiredCount) && count !== requiredCount) {
        return { ok: false, error };
    }
    if (isPositiveInteger(minCount) && count < minCount) {
        return { ok: false, error };
    }
    if (isPositiveInteger(maxCount) && count > maxCount) {
        return { ok: false, error };
    }

    return { ok: true, error: null };
}

export function canToggleTime(nextSelectedTimes, constraint) {
    const normalizedConstraint = normalizeScheduleConstraint(constraint);
    if (!normalizedConstraint) return true;

    const maxCount = normalizedConstraint.maxCount;
    if (!isPositiveInteger(maxCount)) return true;

    const count = Array.isArray(nextSelectedTimes) ? nextSelectedTimes.length : 0;
    return count <= maxCount;
}
