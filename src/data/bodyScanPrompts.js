// src/data/bodyScanPrompts.js
// Prompts for guided Body Scan practice following energy points
// Coordinates are in percentage (0-100) relative to image bounds

/**
 * Energy Center Metadata Categories for UI:
 * - label_anatomical: Primary navigation (Anatomical)
 * - label_functional: Secondary labels (Functional)
 * - type: Tertiary detail (Traditional Chakra, Marma, etc.)
 */

export const BODY_SCANS = {
    full: {
        id: 'full',
        name: 'Full Body',
        icon: '👤',
        image: 'body-scan-silhouette.png',
        points: [
            {
                id: 'crown',
                name: 'Crown (Sahasrara)',
                x: 50, y: 6,
                type: 'Traditional Chakra',
                label_anatomical: 'Head',
                label_functional: 'Signal Processing / Uplink',
                location: 'Top of head (fontanelle) or slightly above',
                function: 'Interface with the void/source code; dissolution of individual identity into universal awareness',
                physical: 'Cerebral cortex, pineal gland',
                sensory: 'Tingling, pressure at crown; sense of infinite space'
            },
            {
                id: 'thirdEye',
                name: 'Third Eye (Ajna)',
                x: 50, y: 11.5,
                type: 'Traditional Chakra',
                label_anatomical: 'Head',
                label_functional: 'Signal Processing / Uplink',
                location: 'Center of brain/forehead (pineal-pituitary axis)',
                function: 'Visualization screen; command center for will and perception; integration of duality',
                physical: 'Pineal and pituitary glands',
                sensory: 'Pressure between eyebrows, visual phenomena with closed eyes'
            },
            {
                id: 'throat',
                name: 'Throat (Vishuddha)',
                x: 50, y: 21.5,
                type: 'Traditional Chakra',
                label_anatomical: 'Throat',
                label_functional: 'Broadcast Center / Translation Hub',
                location: 'Hollow of throat (thyroid)',
                function: 'Converts internal states into external expression; communication; authentic voice; purification',
                physical: 'Thyroid, parathyroid, vocal cords',
                sensory: 'Tightness or opening in throat; urge to speak or sing'
            },
            {
                id: 'heart',
                name: 'Heart (Anahata)',
                x: 50, y: 29.7,
                type: 'Traditional Chakra',
                label_anatomical: 'Chest',
                label_functional: 'Fusion Reactor / Emotional Processing',
                location: 'Center of chest (midline)',
                function: 'Central processing node; generates strongest electromagnetic field in body; love, connection, grief',
                physical: 'Heart, cardiac plexus, lungs',
                sensory: 'Warmth, pressure, expansion or contraction in chest'
            },
            {
                id: 'solarPlexus',
                name: 'Solar Plexus (Manipura)',
                x: 50, y: 38.3,
                type: 'Traditional Chakra',
                label_anatomical: 'Abdomen',
                label_functional: 'Fusion Reactor / Emotional Processing',
                location: 'Pit of stomach (above navel, below ribcage)',
                function: 'Thermal battery; willpower, digestion, ego identity, personal power',
                physical: 'Adrenal glands, digestive organs, solar plexus',
                sensory: 'Heat, butterflies, tightness, or fire in belly'
            },
            {
                id: 'sacral',
                name: 'Sacral (Svadhisthana)',
                x: 50, y: 45.3,
                type: 'Traditional Chakra',
                label_anatomical: 'Abdomen',
                label_functional: 'Battery / Grounding / Creation',
                location: 'Lower abdomen, below navel (ovaries/testes region)',
                function: 'Creativity, sexuality, pleasure, emotional flow, reproductive energy',
                physical: 'Gonads, reproductive organs',
                sensory: 'Warmth, fluidity, pulsing, arousal'
            },
            {
                id: 'root',
                name: 'Root (Muladhara)',
                x: 50, y: 52.6,
                type: 'Traditional Chakra',
                label_anatomical: 'Pelvis',
                label_functional: 'Battery / Grounding / Creation',
                location: 'Base of spine/perineum (between genitals and anus)',
                function: 'Survival, grounding, physical existence, connection to earth; "hardware anchor"',
                physical: 'Adrenal glands, base of spine, legs',
                sensory: 'Solidity, groundedness, or fear/instability when blocked'
            },
            { id: 'leftShoulder', name: 'Left Shoulder', x: 40.4, y: 24.5, type: 'Joint Node', label_anatomical: 'Shoulder', label_functional: 'Lateral Support' },
            { id: 'rightShoulder', name: 'Right Shoulder', x: 59.6, y: 24.5, type: 'Joint Node', label_anatomical: 'Shoulder', label_functional: 'Lateral Support' },
            { id: 'leftHand', name: 'Left Hand', x: 32, y: 55.5, type: 'Projection Gate', label_anatomical: 'Hand', label_functional: 'Projectors' },
            { id: 'rightHand', name: 'Right Hand', x: 68.5, y: 55.5, type: 'Projection Gate', label_anatomical: 'Hand', label_functional: 'Projectors' },
            { id: 'leftFoot', name: 'Left Foot', x: 47.7, y: 94, type: 'Grounding Anchor', label_anatomical: 'Foot', label_functional: 'Roots' },
            { id: 'rightFoot', name: 'Right Foot', x: 52.3, y: 94, type: 'Grounding Anchor', label_anatomical: 'Foot', label_functional: 'Roots' },
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
            {
                id: 'head_crown',
                name: 'Crown (Sahasrara)',
                x: 45.1, y: 27.9,
                type: 'Traditional Chakra',
                label_anatomical: 'Head',
                label_functional: 'Signal Processing / Uplink',
                location: 'Top of head (fontanelle) or slightly above',
                function: 'Interface with the void/source code; dissolution of individual identity into universal awareness',
                physical: 'Cerebral cortex, pineal gland',
                sensory: 'Tingling, pressure at crown; sense of infinite space'
            },
            {
                id: 'head_thirdEye',
                name: 'Ajna (Third Eye)',
                x: 66.4, y: 40.9,
                type: 'Traditional Chakra',
                label_anatomical: 'Head',
                label_functional: 'Signal Processing / Uplink',
                location: 'Center of brain/forehead (pineal-pituitary axis)',
                function: 'Visualization screen; command center for will and perception; integration of duality',
                physical: 'Pineal and pituitary glands',
                sensory: 'Pressure between eyebrows, visual phenomena with closed eyes'
            },
            {
                id: 'head_bindu',
                name: 'Bindu',
                x: 24, y: 48.7,
                type: 'Esoteric Chakra',
                label_anatomical: 'Head',
                label_functional: 'Signal Processing / Uplink',
                location: 'Upper back of skull (occipital region, where hair swirls)',
                function: 'Entry point where consciousness "downloads" into the system; reservoir of soma/nectar',
                tradition: 'Tantric, often described as dripping moonlight',
                sensory: 'Cool sensation, sense of liquid flowing downward'
            },
            {
                id: 'head_alta',
                name: 'Alta Major (Mouth of God)',
                x: 45.6, y: 60,
                type: 'Minor Chakra',
                label_anatomical: 'Head',
                label_functional: 'Signal Processing / Uplink',
                location: 'Base of skull/top of brainstem (medulla oblongata)',
                function: 'Autonomic regulation; fight-flight-freeze gateway; connection between brain and spine',
                physical: 'Brainstem, medulla',
                sensory: 'Deep relaxation when activated; "reset button" feeling'
            },
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
            {
                id: 'chest_high_heart',
                name: 'High Heart (Thymus)',
                x: 50.4, y: 35.2,
                type: 'Minor Chakra',
                label_anatomical: 'Chest',
                label_functional: 'Fusion Reactor / Emotional Processing',
                location: 'Upper chest, between throat and heart',
                function: 'Universal compassion; immune intelligence; bridge between individual and collective',
                physical: 'Thymus gland',
                sensory: 'Expansive warmth; sense of connection to all beings'
            },
            {
                id: 'chest_heart',
                name: 'Heart (Anahata)',
                x: 50.4, y: 47.4,
                type: 'Traditional Chakra',
                label_anatomical: 'Chest',
                label_functional: 'Fusion Reactor / Emotional Processing',
                location: 'Center of chest (midline)',
                function: 'Central processing node; generates strongest electromagnetic field in body; love, connection, grief',
                physical: 'Heart, cardiac plexus, lungs',
                sensory: 'Warmth, pressure, expansion or contraction in chest'
            },
            {
                id: 'chest_hirt_padma',
                name: 'Hrit Padma (Sacred Heart)',
                x: 60.3, y: 54.6,
                type: 'Esoteric Chakra',
                label_anatomical: 'Chest',
                label_functional: 'Fusion Reactor / Emotional Processing',
                location: 'Just below/slightly right of physical heart',
                function: 'Seat of witness consciousness (Sakshi); the "observer" that watches experience without identification',
                tradition: 'Vedantic, seat of the jivatman',
                sensory: 'Quiet stillness; sense of "watching from here"'
            },
            {
                id: 'chest_solar',
                name: 'Solar Plexus (Manipura)',
                x: 50.4, y: 66.8,
                type: 'Traditional Chakra',
                label_anatomical: 'Abdomen',
                label_functional: 'Fusion Reactor / Emotional Processing',
                location: 'Pit of stomach (above navel, below ribcage)',
                function: 'Thermal battery; willpower, digestion, ego identity, personal power',
                physical: 'Adrenal glands, digestive organs, solar plexus',
                sensory: 'Heat, butterflies, tightness, or fire in belly'
            },
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
            {
                id: 'hips_hara',
                name: 'Hara (Lower Dantian)',
                x: 50, y: 40.8,
                type: 'Taoist Center',
                label_anatomical: 'Abdomen',
                label_functional: 'Battery / Grounding / Creation',
                location: 'Two inches below navel, deep inside body',
                function: 'Center of gravity; physical vitality; weighted presence; storage battery for life force (qi/prana)',
                physical: 'Enteric nervous system ("gut brain")',
                sensory: 'Deep warmth, heaviness, sense of being anchored'
            },
            {
                id: 'hips_sacral',
                name: 'Sacral (Svadhisthana)',
                x: 50, y: 55.6,
                type: 'Traditional Chakra',
                label_anatomical: 'Abdomen',
                label_functional: 'Battery / Grounding / Creation',
                location: 'Lower abdomen, below navel (ovaries/testes region)',
                function: 'Creativity, sexuality, pleasure, emotional flow, reproductive energy',
                physical: 'Gonads, reproductive organs',
                sensory: 'Warmth, fluidity, pulsing, arousal'
            },
            {
                id: 'hips_root',
                name: 'Root (Muladhara)',
                x: 50, y: 67,
                type: 'Traditional Chakra',
                label_anatomical: 'Pelvis',
                label_functional: 'Battery / Grounding / Creation',
                location: 'Base of spine/perineum (between genitals and anus)',
                function: 'Survival, grounding, physical existence, connection to earth; "hardware anchor"',
                physical: 'Adrenal glands, base of spine, legs',
                sensory: 'Solidity, groundedness, or fear/instability when blocked'
            },
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
            {
                id: 'hand_l_palm',
                name: 'Left Palm (Laogong)',
                x: 23.4, y: 56.1,
                type: 'Acupuncture Point',
                label_anatomical: 'Hand',
                label_functional: 'Projectors',
                location: 'Center of palm',
                function: 'Major energy gate for projection (healing, intention) and reception (sensing fields)',
                physical: 'Mid-palm, Pericardium meridian',
                sensory: 'Heat, tingling, magnetic push/pull'
            },
            {
                id: 'hand_l_pinky',
                name: 'Left Pinky',
                x: 37.2, y: 39.9,
                type: 'Meridian Terminal',
                label_anatomical: 'Hand',
                label_functional: 'Projectors',
                location: 'Tip of pinky finger',
                function: 'Circulation, discernment, absorption of nutrients',
                physical: 'Heart and Small Intestine meridians'
            },
            {
                id: 'hand_l_ring',
                name: 'Left Ring',
                x: 32.5, y: 32.1,
                type: 'Meridian Terminal',
                label_anatomical: 'Hand',
                label_functional: 'Projectors',
                location: 'Tip of ring finger',
                function: 'Thermoregulation, immune system, transformation between body cavities',
                physical: 'Triple Warmer (San Jiao) meridian'
            },
            {
                id: 'hand_l_middle',
                name: 'Left Middle',
                x: 25.4, y: 29.3,
                type: 'Meridian Terminal',
                label_anatomical: 'Hand',
                label_functional: 'Projectors',
                location: 'Tip of middle finger',
                function: 'Heart protector, emotional boundaries',
                physical: 'Pericardium meridian'
            },
            {
                id: 'hand_l_index',
                name: 'Left Index',
                x: 17.6, y: 31.6,
                type: 'Meridian Terminal',
                label_anatomical: 'Hand',
                label_functional: 'Projectors',
                location: 'Tip of index finger',
                function: 'Elimination, releasing what no longer serves',
                physical: 'Large Intestine meridian'
            },
            {
                id: 'hand_l_thumb',
                name: 'Left Thumb',
                x: 7.7, y: 46.4,
                type: 'Meridian Terminal',
                label_anatomical: 'Hand',
                label_functional: 'Projectors',
                location: 'Tip of thumb',
                function: 'Respiratory system, grief, letting go',
                physical: 'Lung meridian'
            },
            // Right Hand
            {
                id: 'hand_r_palm',
                name: 'Right Palm (Laogong)',
                x: 76.7, y: 56.1,
                type: 'Acupuncture Point',
                label_anatomical: 'Hand',
                label_functional: 'Projectors',
                location: 'Center of palm',
                function: 'Major energy gate for projection and reception',
                physical: 'Pericardium meridian',
                sensory: 'Heat, tingling, magnetic push/pull'
            },
            { id: 'hand_r_pinky', name: 'Right Pinky', x: 62.9, y: 39.9, type: 'Meridian Terminal', label_anatomical: 'Hand', label_functional: 'Projectors', function: 'Circulation, discernment', physical: 'Heart/Small Intestine meridians' },
            { id: 'hand_r_ring', name: 'Right Ring', x: 68.4, y: 32.1, type: 'Meridian Terminal', label_anatomical: 'Hand', label_functional: 'Projectors', function: 'Thermoregulation, immune system', physical: 'Triple Warmer meridian' },
            { id: 'hand_r_middle', name: 'Right Middle', x: 74.4, y: 29.3, type: 'Meridian Terminal', label_anatomical: 'Hand', label_functional: 'Projectors', function: 'Heart protector, boundaries', physical: 'Pericardium meridian' },
            { id: 'hand_r_index', name: 'Right Index', x: 82.7, y: 31.6, type: 'Meridian Terminal', label_anatomical: 'Hand', label_functional: 'Projectors', function: 'Elimination, releasing', physical: 'Large Intestine meridian' },
            { id: 'hand_r_thumb', name: 'Right Thumb', x: 92.4, y: 46.4, type: 'Meridian Terminal', label_anatomical: 'Hand', label_functional: 'Projectors', function: 'Respiratory, grief', physical: 'Lung meridian' },
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
            {
                id: 'foot_kshipra',
                name: 'Kshipra Marma',
                x: 56.2, y: 29.5,
                type: 'Marma Point',
                label_anatomical: 'Foot',
                label_functional: 'Roots',
                location: 'Web between big toe and second toe',
                function: 'Regulates heat, relieves headaches; regulates excess mental energy',
                sensory: 'Sharp sensitivity, radiating warmth when pressed'
            },
            {
                id: 'foot_krucha',
                name: 'Kurcha Marma',
                x: 56.2, y: 37.6,
                type: 'Marma Point',
                label_anatomical: 'Foot',
                label_functional: 'Roots',
                location: 'Ball of foot (where toes meet the arch)',
                function: 'Structural balance; distributes weight and energetic load; reflexology zone for upper organs',
                sensory: 'Pressure sensitivity, connection to spine'
            },
            {
                id: 'foot_talahridaya',
                name: 'Talahridaya Marma (Bubbling Spring)',
                x: 48.9, y: 50.9,
                type: 'Marma Point',
                label_anatomical: 'Foot',
                label_functional: 'Roots',
                location: 'Center of sole, in the depression formed when toes curl',
                function: 'Primary intake valve for earth energy; roots consciousness into physical reality',
                physical: 'Kidney-1 (Kidney meridian)',
                sensory: 'Tingling, warmth, sense of drawing energy up from earth'
            },
            {
                id: 'foot_kurchashira',
                name: 'Kurchashira Marma',
                x: 49.9, y: 68.1,
                type: 'Marma Point',
                label_anatomical: 'Foot',
                label_functional: 'Roots',
                location: 'Base of toes / heel junction',
                function: 'Energetic distribution node; reflex point for lower body; balances lower chakra energy',
                sensory: 'Grounding sensation, sense of stability'
            },
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
        points: [
            {
                id: 'nadi_pingala',
                name: 'Pingala Nadi (Solar)',
                x: 48.9, y: 23.8,
                type: 'Energy Channel',
                label_functional: 'Heating / Active',
                location: 'Right nostril / Right side of spine',
                function: 'Heating, active, expressive; sympathetic nervous system control',
                quality: 'Sun, masculine, yang',
                sensory: 'Heating sensation'
            },
            {
                id: 'nadi_ida',
                name: 'Ida Nadi (Lunar)',
                x: 51, y: 24.6,
                type: 'Energy Channel',
                label_functional: 'Cooling / Receptive',
                location: 'Left nostril / Left side of spine',
                function: 'Cooling, receptive, introspective; parasympathetic nervous system control',
                quality: 'Moon, feminine, yin',
                sensory: 'Cooling sensation'
            },
            {
                id: 'nadi_sushumna_top',
                name: 'Sushumna Nadi (Central)',
                x: 50, y: 33.2,
                type: 'Inner Channel',
                label_functional: 'Main Trunk Line',
                location: 'Core of spine from root to crown',
                function: 'When open, allows consciousness to rise unobstructed; balance point of Ida and Pingala',
                sensory: 'Neutral, balanced, expansive stillness'
            },
            { id: 'nadi_sushumna_bottom', name: 'Sushumna (Bottom Entry)', x: 50, y: 75.9, type: 'Energy Gate' },
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
 */
export function getPointById(pointId, scanType = null) {
    if (scanType && BODY_SCANS[scanType]) {
        return BODY_SCANS[scanType].points.find(p => p.id === pointId) || BODY_SCANS.full.points[0];
    }

    for (const scan of Object.values(BODY_SCANS)) {
        const point = scan.points.find(p => p.id === pointId);
        if (point) return point;
    }

    return BODY_SCANS.full.points[0];
}

export function getAllBodyScans() {
    return Object.values(BODY_SCANS);
}
