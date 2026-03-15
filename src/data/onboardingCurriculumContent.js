const ONBOARDING_CONTENT_STORAGE_KEY = 'immanence.onboarding.curriculum.content';
const ONBOARDING_CONTENT_CHANGE_EVENT = 'onboarding-curriculum-content-changed';

export const ONBOARDING_SPACING_OPTIONS = ['compact', 'normal', 'roomy'];

export const ONBOARDING_CURRICULUM_STEP_OPTIONS = [
    { key: 'welcome', label: 'Welcome' },
    { key: 'curriculumOverview', label: '14-Day Arc' },
    { key: 'postureGuidance', label: 'Posture Guidance' },
    { key: 'stillnessFocusIntensity', label: 'Focus Intensity' },
    { key: 'confirm', label: 'Final Summary' },
];

const DEFAULT_ONBOARDING_CURRICULUM_CONTENT = Object.freeze({
    welcome: {
        stepKey: 'welcome',
        title: 'Initiation Path',
        intro: 'This onboarding takes about 3 minutes.',
        paragraphs: [
            'You are setting a fixed 14-day contract built around one morning breath leg and one evening focus leg.',
            'The rule is simple: show up for the sessions you commit to.',
        ],
        contractMeaning: {
            title: 'What the contract means',
            paragraphs: [
                'Completion is evaluated against the days and times you choose. Outside-schedule sessions are still logged, but they are not credited.',
            ],
        },
        dailyStructure: {
            title: 'Daily structure',
            items: [
                {
                    label: 'Morning · 10 min',
                    description: 'Resonance breathing',
                },
                {
                    label: 'Evening Focus Reset · 10 min',
                    description: 'Focus intervals followed by a 1-minute decompression.',
                },
            ],
        },
        trainingFocus: {
            title: 'What this trains',
            bulletItems: [
                'Feel your body more clearly',
                'Keep your attention steady',
                'Notice tension before it controls you',
                'Track where tension gathers and how attention holds each day',
            ],
        },
        calloutText: 'Next you will see the 14-day arc, then the posture cues used for both breathwork and stillness.',
        spacing: {
            step: 'normal',
            content: 'normal',
            card: 'normal',
        },
    },
    curriculumOverview: {
        stepKey: 'curriculumOverview',
        title: 'The 14-Day Arc',
        weekCards: [
            {
                title: 'Week 1: Establish',
                description: 'Morning breath + evening focus reset every obligation day.',
            },
            {
                title: 'Week 2: Consolidate',
                description: 'Same structure, tighter execution, no drift.',
            },
        ],
        paragraphs: [
            'Day 1 captures your baseline breath benchmark.',
            'Day 14 repeats it so you can compare your change directly.',
        ],
        spacing: {
            step: 'normal',
        },
    },
    postureGuidance: {
        stepKey: 'postureGuidance',
        title: 'Posture of Practice',
        intro: 'Both breathwork and stillness depend on the same principle: an upright spine that feels stable, grounded, and not rigid.',
        imageCards: [
            {
                src: '/tutorial/breath and stillness/straight spine 1.png',
                alt: 'Standing breath posture with a long spine and relaxed shoulders',
                label: '',
                caption: 'Standing breath: feet grounded, spine long.',
            },
            {
                src: '/tutorial/breath and stillness/straight spine 2.png',
                alt: 'Seated stillness posture with an upright but relaxed spine',
                label: '',
                caption: 'Seated stillness: sit tall without hardening.',
            },
            {
                src: '/tutorial/breath and stillness/straight spine 3.png',
                alt: 'Balanced standing posture with neutral head and easy neck',
                label: '',
                caption: 'Balanced stance: neck easy, chin neutral.',
            },
            {
                src: '/tutorial/breath and stillness/straight spine 4.png',
                alt: 'Aligned posture example showing relaxed shoulders and upright alignment',
                label: '',
                caption: 'Aligned line: shoulders soft, body steady.',
            },
        ],
        guidanceTitle: 'Practical guidance',
        guidanceParagraphs: [
            'Keep the spine upright and long, let the shoulders relax, and keep the neck easy with a neutral chin.',
            'Standing breath posture should feel balanced rather than stiff. Seated stillness should feel grounded rather than collapsed.',
            'Stable does not mean tense. Let the body organize around ease, then keep attention there.',
        ],
        spacing: {
            step: 'normal',
            cards: 'normal',
            guidance: 'normal',
        },
    },
    stillnessFocusIntensity: {
        stepKey: 'stillnessFocusIntensity',
        title: 'Stillness Focus Intensity',
        intro: 'This page is for the stillness meditation leg of the evening practice. It teaches attentional intensity, not breathwork intensity.',
        intervalTitle: 'Interval structure',
        intervalParagraphs: [
            'The stillness leg alternates work and rest intervals, similar to HIIT. During active intervals, aim at the current focus stage. During short rest intervals, release effort briefly, then repeat until the stillness timer ends.',
            'As the session progresses, the required intensity of focus rises in three stages: light, medium, then high. Rest periods are part of the method, not failure.',
        ],
        imageCards: [
            {
                src: '/tutorial/breath and stillness/intensity 1.webp',
                alt: 'Two people speaking in a quiet room to represent light focus intensity',
                label: 'Light Focus',
                caption: 'Like a 1-on-1 conversation in a quiet room.',
                description: 'Low distraction load. Hold attention gently, then release fully during rest.',
            },
            {
                src: '/tutorial/breath and stillness/intensity 2.webp',
                alt: 'Two people speaking in a crowded bar to represent medium focus intensity',
                label: 'Medium Focus',
                caption: 'Like a 1-on-1 conversation in a crowded bar.',
                description: 'More filtering is required. Keep the target clear without hardening the body.',
            },
            {
                src: '/tutorial/breath and stillness/intensity 3.webp',
                alt: 'Two workers speaking beside a construction site to represent high focus intensity',
                label: 'High Focus',
                caption: 'Like a 1-on-1 conversation beside a construction site.',
                description: 'Narrow attention more selectively, but do not add facial tension, clenching, or strain.',
            },
        ],
        meaningTitle: 'What intensity means here',
        meaningParagraphs: [
            'In breathwork, phases refer to breathing demand or capacity. In stillness meditation, these phases refer to attentional demand.',
            'High intensity means narrower, more selective attention. It does not mean physical tension, facial clenching, or stressful effort.',
        ],
        spacing: {
            step: 'normal',
            cards: 'normal',
            callout: 'normal',
        },
    },
    confirm: {
        stepKey: 'confirm',
        title: 'Final Contract Summary',
        introPrefix: 'Your 14-day contract starts ',
        introSuffix: '.',
        daysLabel: 'Days',
        timesLabel: 'Times',
        creditNote: 'Outside these days/times is logged but not credited.',
        benchmarkWarning: 'Complete the breathing benchmark first.',
        closingText: 'This is about keeping your word, one day at a time.',
        spacing: {
            step: 'normal',
            summary: 'normal',
        },
    },
});

function cloneContent(value) {
    return JSON.parse(JSON.stringify(value));
}

function isPlainObject(value) {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function mergeContent(defaultValue, overrideValue) {
    if (Array.isArray(defaultValue)) {
        return Array.isArray(overrideValue) ? cloneContent(overrideValue) : cloneContent(defaultValue);
    }

    if (isPlainObject(defaultValue)) {
        const merged = {};
        const overrideObject = isPlainObject(overrideValue) ? overrideValue : {};
        Object.keys(defaultValue).forEach((key) => {
            merged[key] = mergeContent(defaultValue[key], overrideObject[key]);
        });
        return merged;
    }

    return overrideValue === undefined ? defaultValue : overrideValue;
}

function dispatchChangeEvent() {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent(ONBOARDING_CONTENT_CHANGE_EVENT));
}

export function createDefaultOnboardingCurriculumContent() {
    return cloneContent(DEFAULT_ONBOARDING_CURRICULUM_CONTENT);
}

export function getDefaultOnboardingCurriculumStepContent(stepKey) {
    const defaults = createDefaultOnboardingCurriculumContent();
    return defaults[stepKey] || null;
}

export function readOnboardingCurriculumContent() {
    const defaults = createDefaultOnboardingCurriculumContent();
    if (typeof window === 'undefined') {
        return defaults;
    }

    try {
        const raw = window.localStorage.getItem(ONBOARDING_CONTENT_STORAGE_KEY);
        if (!raw) return defaults;
        const overrides = JSON.parse(raw);
        return mergeContent(defaults, overrides);
    } catch {
        return defaults;
    }
}

export function writeOnboardingCurriculumContent(nextContent) {
    if (typeof window === 'undefined') {
        return nextContent;
    }

    window.localStorage.setItem(ONBOARDING_CONTENT_STORAGE_KEY, JSON.stringify(nextContent));
    dispatchChangeEvent();
    return nextContent;
}

export function resetOnboardingCurriculumContent() {
    if (typeof window !== 'undefined') {
        window.localStorage.removeItem(ONBOARDING_CONTENT_STORAGE_KEY);
        dispatchChangeEvent();
    }
    return createDefaultOnboardingCurriculumContent();
}

export {
    DEFAULT_ONBOARDING_CURRICULUM_CONTENT,
    ONBOARDING_CONTENT_CHANGE_EVENT,
    ONBOARDING_CONTENT_STORAGE_KEY,
};
