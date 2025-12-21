// src/data/bodyScanPrompts.js
// Prompts for guided Body Scan practice following energy points
// Coordinates are in percentage (0-100) relative to image bounds

// Configuration for all body scan types
export const BODY_SCANS = {
    full: {
        id: 'full',
        name: 'Full Body',
        icon: '👤',
        image: 'body-scan-silhouette.png',
        points: [
            { id: 'crown', name: 'Crown (Sahasrara)', x: 50, y: 6 },
            { id: 'thirdEye', name: 'Third Eye (Ajna)', x: 50, y: 11.5 },
            { id: 'throat', name: 'Throat (Vishuddha)', x: 50, y: 21.5 },
            { id: 'heart', name: 'Heart (Anahata)', x: 50, y: 29.7 },
            { id: 'solarPlexus', name: 'Solar Plexus (Manipura)', x: 50, y: 38.3 },
            { id: 'sacral', name: 'Sacral (Svadhisthana)', x: 50, y: 45.3 },
            { id: 'root', name: 'Root (Muladhara)', x: 50, y: 52.6 },
            { id: 'leftShoulder', name: 'Left Shoulder', x: 40.4, y: 24.5 },
            { id: 'rightShoulder', name: 'Right Shoulder', x: 59.6, y: 24.5 },
            { id: 'leftHand', name: 'Left Hand', x: 32, y: 55.5 },
            { id: 'rightHand', name: 'Right Hand', x: 68.5, y: 55.5 },
            { id: 'leftFoot', name: 'Left Foot', x: 47.7, y: 94 },
            { id: 'rightFoot', name: 'Right Foot', x: 52.3, y: 94 },
        ],
        prompts: [
            { point: 'crown', text: "Bring attention to the crown of your head...", timing: 0 },
            { point: 'thirdEye', text: "Move to the space between your eyebrows...", timing: 20 },
            { point: 'throat', text: "Descend to the throat center...", timing: 40 },
            { point: 'leftShoulder', text: "Extend awareness to your left shoulder...", timing: 60 },
            { point: 'rightShoulder', text: "Now to your right shoulder...", timing: 80 },
            { point: 'heart', text: "Rest your awareness in the heart center...", timing: 100 },
            { point: 'leftHand', text: "Extend awareness to your left hand...", timing: 120 },
            { point: 'rightHand', text: "Now to your right hand...", timing: 140 },
            { point: 'solarPlexus', text: "Return to center — the solar plexus...", timing: 160 },
            { point: 'sacral', text: "Descend to the sacral center...", timing: 180 },
            { point: 'root', text: "Ground at the base of the spine...", timing: 200 },
            { point: 'heart', text: "Return to the heart... Feel the whole body as one.", timing: 230 },
        ]
    },
    head: {
        id: 'head',
        name: 'Head & Crown',
        icon: '🧠',
        image: 'body-scan-head.jpg',
        points: [
            { id: 'head_crown', name: 'Crown', x: 45.1, y: 27.9 },
            { id: 'head_thirdEye', name: 'Ajna (Third Eye)', x: 66.4, y: 40.9 },
            { id: 'head_bindu', name: 'Bindu', x: 24, y: 48.7 },
            { id: 'head_alta', name: 'Alta Major', x: 45.6, y: 60 },
        ],
        prompts: [
            { point: 'head_crown', text: "Bring your awareness to the Crown...", timing: 0 },
            { point: 'head_thirdEye', text: "Focus on the Ajna center, the Third Eye...", timing: 25 },
            { point: 'head_bindu', text: "Shift to the Bindu point at the back top of the head...", timing: 50 },
            { point: 'head_alta', text: "Feel the Alta Major center at the base of the skull.", timing: 75 },
        ]
    },
    chest: {
        id: 'chest',
        name: 'Heart & Solar',
        icon: '🫀',
        image: 'body-scan-chest.png',
        points: [
            { id: 'chest_high_heart', name: 'High Heart', x: 50.4, y: 35.2 },
            { id: 'chest_heart', name: 'Heart Center', x: 50.4, y: 47.4 },
            { id: 'chest_hirt_padma', name: 'Hrit Padma', x: 60.3, y: 54.6 },
            { id: 'chest_solar', name: 'Solar Plexus', x: 50.4, y: 66.8 },
        ],
        prompts: [
            { point: 'chest_high_heart', text: "Focus on the High Heart, the seat of compassion...", timing: 0 },
            { point: 'chest_heart', text: "Resting in the Heart center...", timing: 25 },
            { point: 'chest_hirt_padma', text: "The Sacred Heart, Hrit Padma, on the right...", timing: 50 },
            { point: 'chest_solar', text: "Descending to the Solar Plexus...", timing: 75 },
        ]
    },
    hips: {
        id: 'hips',
        name: 'Hips & Root',
        icon: '💎',
        image: 'body-scan-hips.png',
        points: [
            { id: 'hips_hara', name: 'Hara (Lower Dan Tien)', x: 50, y: 40.8 },
            { id: 'hips_sacral', name: 'Sacral center', x: 50, y: 55.6 },
            { id: 'hips_root', name: 'Root center', x: 50, y: 67 },
        ],
        prompts: [
            { point: 'hips_hara', text: "Bring attention to the Hara, your center of gravity...", timing: 0 },
            { point: 'hips_sacral', text: "The Sacral center...", timing: 30 },
            { point: 'hips_root', text: "Grounding into the Root at the base of the pelvis.", timing: 60 },
        ]
    },
    hands: {
        id: 'hands',
        name: 'Hands & Palms',
        icon: '🖐️',
        image: 'body-scan-hands.png',
        points: [
            // Left Hand
            { id: 'hand_l_palm', name: 'Left Palm', x: 23.4, y: 56.1 },
            { id: 'hand_l_pinky', name: 'Left Pinky', x: 37.2, y: 39.9 },
            { id: 'hand_l_ring', name: 'Left Ring', x: 32.5, y: 32.1 },
            { id: 'hand_l_middle', name: 'Left Middle', x: 25.4, y: 29.3 },
            { id: 'hand_l_index', name: 'Left Index', x: 17.6, y: 31.6 },
            { id: 'hand_l_thumb', name: 'Left Thumb', x: 7.7, y: 46.4 },
            // Right Hand
            { id: 'hand_r_palm', name: 'Right Palm', x: 76.7, y: 56.1 },
            { id: 'hand_r_pinky', name: 'Right Pinky', x: 62.9, y: 39.9 },
            { id: 'hand_r_ring', name: 'Right Ring', x: 68.4, y: 32.1 },
            { id: 'hand_r_middle', name: 'Right Middle', x: 74.4, y: 29.3 },
            { id: 'hand_r_index', name: 'Right Index', x: 82.7, y: 31.6 },
            { id: 'hand_r_thumb', name: 'Right Thumb', x: 92.4, y: 46.4 },
        ],
        prompts: [
            { point: 'hand_l_palm', text: "Focus on the left palm...", timing: 0 },
            { point: 'hand_l_thumb', text: "Left thumb...", timing: 10 },
            { point: 'hand_l_index', text: "Left index...", timing: 20 },
            { point: 'hand_l_middle', text: "Left middle...", timing: 30 },
            { point: 'hand_l_ring', text: "Left ring...", timing: 40 },
            { point: 'hand_l_pinky', text: "Left pinky...", timing: 50 },
            { point: 'hand_r_palm', text: "Now focus on the right palm...", timing: 70 },
            { point: 'hand_r_thumb', text: "Right thumb...", timing: 80 },
            { point: 'hand_r_index', text: "Right index...", timing: 90 },
            { point: 'hand_r_middle', text: "Right middle...", timing: 100 },
            { point: 'hand_r_ring', text: "Right ring...", timing: 110 },
            { point: 'hand_r_pinky', text: "Right pinky...", timing: 120 },
        ]
    },
    feet: {
        id: 'feet',
        name: 'Feet Marma',
        icon: '🦶',
        image: 'body-scan-feet.png',
        points: [
            { id: 'foot_kshipra', name: 'Kshipra Marma', x: 56.2, y: 29.5 },
            { id: 'foot_krucha', name: 'Krucha Marma', x: 56.2, y: 37.6 },
            { id: 'foot_talahridaya', name: 'Talahridaya Marma', x: 48.9, y: 50.9 },
            { id: 'foot_kurchashira', name: 'Kurchashira Marma', x: 49.9, y: 68.1 },
        ],
        prompts: [
            { point: 'foot_kshipra', text: "Focusing on Kshipra Marma between big and second toe...", timing: 0 },
            { point: 'foot_krucha', text: "Move to Krucha Marma in the upper sole...", timing: 20 },
            { point: 'foot_talahridaya', text: "The Heart of the Foot, Talahridaya...", timing: 40 },
            { point: 'foot_kurchashira', text: "Descending to Kurchashira near the heel.", timing: 60 },
        ]
    },
    nadis: {
        id: 'nadis',
        name: 'Nadis System',
        icon: '🌊',
        image: 'body-scan-nadis.png',
        // Note: sushumna is handled as a special animated path in visual component
        points: [
            { id: 'nadi_pingala', name: 'Pingala (Left Nostril)', x: 48.9, y: 23.8 },
            { id: 'nadi_ida', name: 'Ida (Right Nostril)', x: 51, y: 24.6 },
            { id: 'nadi_sushumna_top', name: 'Sushumna (Top)', x: 50, y: 33.2 },
            { id: 'nadi_sushumna_bottom', name: 'Sushumna (Bottom)', x: 50, y: 75.9 },
        ],
        prompts: [
            { point: 'nadi_pingala', text: "Feel the solar breath through Pingala...", timing: 0 },
            { point: 'nadi_ida', text: "Feel the lunar breath through Ida...", timing: 20 },
            { point: 'nadi_sushumna_top', text: "Focus on the central Sushumna channel...", timing: 40 },
        ]
    }
};

// Legacy exports for backward compatibility
export const BODY_SCAN_POINTS = BODY_SCANS.full.points;
export const BODY_SCAN_PROMPTS = BODY_SCANS.full.prompts;

/**
 * Get the active prompt based on elapsed time and scan type
 * @param {number} elapsedSeconds 
 * @param {string} scanType - default 'full'
 */
export function getBodyScanPrompt(elapsedSeconds, scanType = 'full') {
    const scan = BODY_SCANS[scanType] || BODY_SCANS.full;
    const prompts = scan.prompts;

    let activePrompt = prompts[0];
    for (const prompt of prompts) {
        if (elapsedSeconds >= prompt.timing) {
            activePrompt = prompt;
        } else {
            break;
        }
    }
    return activePrompt;
}

/**
 * Get a point by ID, searching through all scans if necessary
 * @param {string} pointId 
 * @param {string} scanType - optional, optimizes search
 */
export function getPointById(pointId, scanType = null) {
    if (scanType && BODY_SCANS[scanType]) {
        return BODY_SCANS[scanType].points.find(p => p.id === pointId) || BODY_SCANS.full.points[0];
    }

    // Search all scans
    for (const scan of Object.values(BODY_SCANS)) {
        const point = scan.points.find(p => p.id === pointId);
        if (point) return point;
    }

    return BODY_SCANS.full.points[0];
}

export function getAllBodyScans() {
    return Object.values(BODY_SCANS);
}
