// src/data/programRegistry.js
// Central registry for programs, curriculum legs, and launcher metadata
import { RITUAL_FOUNDATION_14 } from './ritualFoundation14.js';
import { PILOT_TEST_PROGRAM } from './pilotTestProgram.js';

// Helper to merge default and day-specific leg overrides
const mergeLegOverrides = (baseLegs = [], overrides = {}, dayNumber) => {
  const defaultOverrides = overrides.default || {};
  const dayOverrides = overrides[dayNumber] || {};

  return baseLegs.map((leg) => {
    const override = dayOverrides[leg.legNumber] || defaultOverrides[leg.legNumber];
    return override ? { ...leg, ...override } : leg;
  });
};

export const programRegistry = {
  'pilot-test-program': {
    id: 'pilot-test-program',
    name: 'Pilot Test Program',
    curriculum: PILOT_TEST_PROGRAM,
  },
  'ritual-foundation-14': {
    id: 'ritual-foundation-14',
    name: 'Ritual Foundation',
    curriculum: RITUAL_FOUNDATION_14,
    // Launcher metadata keyed by launcherId
    launchers: {
      'thought-detachment-onboarding': {
        id: 'thought-detachment-onboarding',
        title: 'Thought Detachment Onboarding',
        returnTo: 'hub',
      },
    },
    // Leg overrides applied to every day unless a day-specific override exists
    legOverrides: {
      default: {
        2: {
          launcherId: 'thought-detachment-onboarding',
          label: 'Thought Detachment',
          description: 'Detach from the day\'s recurring thought',
        },
      },
    },
  },
};

export function getProgramDefinition(programId) {
  return programRegistry[programId] || null;
}

export function getProgramDay(programId, dayNumber) {
  const program = getProgramDefinition(programId);
  if (!program?.curriculum?.days) return null;

  const baseDay = program.curriculum.days.find((d) => d.dayNumber === dayNumber);
  if (!baseDay) return null;

  const legs = mergeLegOverrides(baseDay.legs, program.legOverrides || {}, dayNumber);
  return { ...baseDay, legs };
}

export function getProgramLeg(programId, dayNumber, legNumber) {
  const day = getProgramDay(programId, dayNumber);
  if (!day?.legs) return null;
  return day.legs.find((leg) => leg.legNumber === legNumber) || null;
}

export function getProgramLauncher(programId, launcherId) {
  const program = getProgramDefinition(programId);
  return program?.launchers?.[launcherId] || null;
}
