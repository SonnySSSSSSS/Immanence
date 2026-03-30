export function resolveSectionSelection({
  requestedSection,
  options = undefined,
  playgroundMode = false,
  accessPosture,
  needsSetup = false,
  hasPracticeLaunchContext = false,
  hasActivePath = false,
} = {}) {
  if (playgroundMode) {
    return { shouldUpdate: true, nextSection: null };
  }

  if (accessPosture !== 'guided') {
    return { shouldUpdate: true, nextSection: requestedSection };
  }

  if (requestedSection === null) {
    return { shouldUpdate: true, nextSection: null };
  }

  if (requestedSection === 'navigation') {
    if (needsSetup || options?.forceStudentNavigation === true) {
      return { shouldUpdate: true, nextSection: 'navigation' };
    }
    return { shouldUpdate: false, nextSection: null };
  }

  if (requestedSection === 'practice') {
    if (hasPracticeLaunchContext) {
      return { shouldUpdate: true, nextSection: 'practice' };
    }

    if (options?.forceStudentNavigation === true && hasActivePath) {
      return { shouldUpdate: true, nextSection: 'practice' };
    }

    return { shouldUpdate: false, nextSection: null };
  }

  return { shouldUpdate: false, nextSection: null };
}
