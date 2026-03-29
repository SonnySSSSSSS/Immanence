import { getQuickDashboardTiles } from '../reporting/dashboardProjection.js';
import { getHomeDashboardPolicy } from '../reporting/tilePolicy';

export const DEFAULT_CURRICULUM_ID = 'ritual-initiation-14-v2';

// Prefix used by the auth-disabled smoke-mode identity created in App.jsx.
// Used here to safely extend the ownership fallback for null navigation owners.
const LOCAL_SMOKE_USER_PREFIX = 'local-smoke-';

export function getOwnedNavigationScheduleSlots({
  activeUserId,
  navigationOwnerUserId,
  getScheduleSlots,
}) {
  const isNavigationStateOwnedByCurrentUser = Boolean(
    activeUserId && navigationOwnerUserId === activeUserId
  );

  if (!isNavigationStateOwnedByCurrentUser || typeof getScheduleSlots !== 'function') {
    return [];
  }

  return getScheduleSlots() || [];
}

export function resolveHomeHubCoordinatorState({
  activeUserId,
  curriculumOwnerUserId,
  navigationOwnerUserId,
  rawCurriculumOnboardingComplete,
  rawCurriculumPracticeTimeSlots,
  rawActiveCurriculumId,
  rawCurriculumStartDate,
  rawDayCompletions,
  rawLegCompletions,
  rawActivePath,
  navigationScheduleSlots,
}) {
  const isLocalSmokeIdentity = typeof activeUserId === 'string'
    && activeUserId.startsWith(LOCAL_SMOKE_USER_PREFIX);
  const canUseUnownedCurriculumState = Boolean(
    activeUserId
    && !curriculumOwnerUserId
    && (
      navigationOwnerUserId === activeUserId
      || (isLocalSmokeIdentity && navigationOwnerUserId === null)
    )
  );
  const isCurriculumStateOwnedByCurrentUser = Boolean(
    activeUserId
    && (
      curriculumOwnerUserId === activeUserId
      || canUseUnownedCurriculumState
    )
  );
  const isNavigationStateOwnedByCurrentUser = Boolean(
    activeUserId && navigationOwnerUserId === activeUserId
  );
  const curriculumOnboardingComplete = isCurriculumStateOwnedByCurrentUser
    ? rawCurriculumOnboardingComplete
    : false;
  const curriculumPracticeTimeSlots = isCurriculumStateOwnedByCurrentUser
    ? rawCurriculumPracticeTimeSlots
    : [];
  const activePath = isNavigationStateOwnedByCurrentUser ? rawActivePath : null;
  const practiceTimeSlots = navigationScheduleSlots && navigationScheduleSlots.length > 0
    ? navigationScheduleSlots.map((slot) => slot.time)
    : curriculumPracticeTimeSlots;
  const activeCurriculumId = isCurriculumStateOwnedByCurrentUser
    ? (rawActiveCurriculumId ?? DEFAULT_CURRICULUM_ID)
    : DEFAULT_CURRICULUM_ID;
  const hasPersistedCurriculumData = Boolean(
    isCurriculumStateOwnedByCurrentUser
      && (
        curriculumOnboardingComplete
        || practiceTimeSlots.length > 0
        || Boolean(rawCurriculumStartDate)
        || Object.keys(rawDayCompletions || {}).length > 0
        || Object.keys(rawLegCompletions || {}).length > 0
      )
  );

  return {
    isCurriculumStateOwnedByCurrentUser,
    isNavigationStateOwnedByCurrentUser,
    curriculumOnboardingComplete,
    curriculumPracticeTimeSlots,
    activePath,
    practiceTimeSlots,
    activeCurriculumId,
    hasPersistedCurriculumData,
  };
}

export function getHomeHubDashboardState({ activeRunId, accessPosture }) {
  const hubPolicy = getHomeDashboardPolicy({
    activeRunId,
    accessPosture,
  });
  const hubTiles = getQuickDashboardTiles({
    scope: hubPolicy.scope,
    range: hubPolicy.range,
    includeHonor: hubPolicy.includeHonor,
    activeRunId: hubPolicy.activeRunId,
  });

  return {
    hubPolicy,
    hubTiles,
  };
}
