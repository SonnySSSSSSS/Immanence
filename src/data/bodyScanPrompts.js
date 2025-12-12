// src/data/bodyScanPrompts.js
// Prompts for guided Body Scan practice following chakra/energy points
// Coordinates are in percentage (0-100) relative to image bounds

export const BODY_SCAN_POINTS = [
    // 7 Chakras (spine-aligned)
    { id: 'crown', name: 'Crown (Sahasrara)', x: 50, y: 6 },
    { id: 'thirdEye', name: 'Third Eye (Ajna)', x: 50, y: 12 },
    { id: 'throat', name: 'Throat (Vishuddha)', x: 50, y: 21 },
    { id: 'heart', name: 'Heart (Anahata)', x: 50, y: 29 },
    { id: 'solarPlexus', name: 'Solar Plexus (Manipura)', x: 50, y: 36 },
    { id: 'sacral', name: 'Sacral (Svadhisthana)', x: 50, y: 43 },
    { id: 'root', name: 'Root (Muladhara)', x: 50, y: 50 },

    // Shoulders - left 1 dot, down 3 dots from previous
    { id: 'leftShoulder', name: 'Left Shoulder', x: 40, y: 25 },
    { id: 'rightShoulder', name: 'Right Shoulder', x: 60, y: 25 },

    // Elbows - left/right 1 dot, down 5 dots from previous
    { id: 'leftElbow', name: 'Left Elbow', x: 37, y: 42 },
    { id: 'rightElbow', name: 'Right Elbow', x: 63, y: 42 },

    // Hands - left/right 4 dots, down 5 dots from previous
    { id: 'leftHand', name: 'Left Hand', x: 32, y: 56 },
    { id: 'rightHand', name: 'Right Hand', x: 68, y: 56 },

    // Knees - left/right 0.5 dot, down 2 dots from previous
    { id: 'leftKnee', name: 'Left Knee', x: 46, y: 71 },
    { id: 'rightKnee', name: 'Right Knee', x: 54, y: 71 },

    // Feet - adjusted per instructions
    { id: 'leftFoot', name: 'Left Foot', x: 48, y: 94 },
    { id: 'rightFoot', name: 'Right Foot', x: 53, y: 94 },
];

export const BODY_SCAN_PROMPTS = [
    {
        point: 'crown',
        text: "Bring your attention to the crown of your head...",
        detail: "Notice any sensations — warmth, tingling, pressure, or nothing at all.",
        timing: 0,
    },
    {
        point: 'thirdEye',
        text: "Move your awareness to the space between your eyebrows...",
        detail: "This is the seat of insight. What do you feel here?",
        timing: 25,
    },
    {
        point: 'throat',
        text: "Descend to the throat center...",
        detail: "The gateway of expression. Notice the breath passing through.",
        timing: 50,
    },
    {
        point: 'leftShoulder',
        text: "Extend awareness to your left shoulder...",
        detail: "Where we carry burdens. What weight do you feel?",
        timing: 75,
    },
    {
        point: 'rightShoulder',
        text: "Now to your right shoulder...",
        detail: "Release any tension you find there.",
        timing: 95,
    },
    {
        point: 'heart',
        text: "Rest your awareness in the heart center...",
        detail: "Feel the rhythm. The subtle expansion and contraction.",
        timing: 115,
    },
    {
        point: 'leftElbow',
        text: "Move to your left elbow...",
        detail: "The joint of flexibility. Allow it to soften.",
        timing: 140,
    },
    {
        point: 'rightElbow',
        text: "Now to your right elbow...",
        detail: "Notice the subtle pulse of energy here.",
        timing: 160,
    },
    {
        point: 'solarPlexus',
        text: "Return to center — the solar plexus...",
        detail: "The seat of personal power. What energy resides here?",
        timing: 180,
    },
    {
        point: 'leftHand',
        text: "Extend awareness to your left hand...",
        detail: "The hand that receives. What sensation is present?",
        timing: 205,
    },
    {
        point: 'rightHand',
        text: "Now to your right hand...",
        detail: "The hand that gives. Feel the energy in your palm.",
        timing: 225,
    },
    {
        point: 'sacral',
        text: "Descend to the sacral center...",
        detail: "The waters of creativity and emotion flow here.",
        timing: 245,
    },
    {
        point: 'root',
        text: "Ground at the base of the spine...",
        detail: "The root of stability. Feel your connection to earth.",
        timing: 265,
    },
    {
        point: 'leftKnee',
        text: "Move awareness to your left knee...",
        detail: "The joint of humility. Soften any holding.",
        timing: 290,
    },
    {
        point: 'rightKnee',
        text: "Now to your right knee...",
        detail: "Allow flexibility and strength to coexist.",
        timing: 310,
    },
    {
        point: 'leftFoot',
        text: "Extend to the sole of your left foot...",
        detail: "Your connection to the ground beneath you.",
        timing: 330,
    },
    {
        point: 'rightFoot',
        text: "Now the sole of your right foot...",
        detail: "Both feet grounded, rooted, present.",
        timing: 350,
    },
    {
        point: 'heart',
        text: "Return to the heart center...",
        detail: "Feel the whole body as one unified field of awareness.",
        timing: 370,
    },
];

export function getBodyScanPrompt(elapsedSeconds) {
    let activePrompt = BODY_SCAN_PROMPTS[0];
    for (const prompt of BODY_SCAN_PROMPTS) {
        if (elapsedSeconds >= prompt.timing) {
            activePrompt = prompt;
        } else {
            break;
        }
    }
    return activePrompt;
}

export function getPointById(pointId) {
    return BODY_SCAN_POINTS.find(p => p.id === pointId) || BODY_SCAN_POINTS[0];
}
