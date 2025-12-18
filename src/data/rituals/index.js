// src/data/rituals/index.js
// Central registry for all rituals - 10 rituals with 30 images
// ALL RITUALS INLINED TO AVOID IMPORT ISSUES

import { RITUAL_CATEGORIES } from './ritualCategories';

// ============ DIVINE LIGHT ============
const DIVINE_LIGHT = {
    id: 'divineLight',
    name: 'Divine Light Descent',
    tradition: 'Universal Mysticism',
    category: 'purification',
    icon: '✦',
    iconName: 'star',
    unlockStage: 'seedling',
    prerequisite: null,
    duration: { min: 10, max: 15 },
    recommendation: 'Best performed at dawn or before sleep.',
    description: 'Invoke divine light to purify and illuminate the energy body.',
    history: `The descent of divine light is found across all mystical traditions.`,
    steps: [
        {
            id: 'source',
            name: 'The Source',
            duration: 180,
            instruction: 'Visualize a brilliant, diamond-white star hovering six inches above the crown of your head.',
            sensoryCues: ['The star is impossibly bright yet does not hurt your inner eye.', 'Feel a warmth and pressure at the very top of your skull.'],
            image: 'rituals/ritual_00001_.png',
        },
        {
            id: 'flush',
            name: 'The Flush',
            duration: 240,
            instruction: 'Allow the light to pour down through your crown, flooding your entire body.',
            sensoryCues: ['Liquid light cascades through your skull, your throat, your chest.', 'Dark smoke exits through your pores.'],
            image: 'rituals/ritual_00002_.png',
        },
        {
            id: 'anchor',
            name: 'The Anchor',
            duration: 180,
            instruction: 'Ground the light by sending golden roots from your base deep into the earth.',
            sensoryCues: ['Feel roots of ember-gold extending from your perineum.', 'You are a conduit between heaven and earth.'],
            image: 'rituals/ritual_00003_.png',
        }
    ],
    completion: {
        expectedOutput: ['Feeling cleansed and light', 'Warmth in the central channel'],
        closingInstruction: 'Seal the energy by placing both palms over your heart.'
    }
};

// ============ SANKALPA ============
const SANKALPA = {
    id: 'sankalpa',
    name: 'Sankalpa (Intention Seed)',
    tradition: 'Yoga Nidra / Vedic',
    category: 'grounding',
    icon: '🌱',
    iconName: 'seed',
    unlockStage: 'seedling',
    prerequisite: null,
    duration: { min: 8, max: 12 },
    recommendation: 'Perform at new moon or when beginning new ventures.',
    description: 'Plant a deep intention in the fertile void of consciousness.',
    history: `Sankalpa is an ancient Vedic practice of planting a resolve in the subconscious mind.`,
    steps: [
        {
            id: 'void',
            name: 'The Void',
            duration: 120,
            instruction: 'Enter the fertile darkness. Sense infinite potential in the stillness before creation.',
            sensoryCues: ['You float in a warm, dark womb of possibility.', 'There is no form here, only potential.'],
            image: 'rituals/ritual_00004_.png',
        },
        {
            id: 'formation',
            name: 'The Formation',
            duration: 180,
            instruction: 'A single golden seed appears, containing your deepest intention.',
            sensoryCues: ['The seed glows with concentrated purpose.', 'Sacred geometry spirals around it.'],
            image: 'rituals/ritual_00005_.png',
        },
        {
            id: 'planting',
            name: 'The Planting',
            duration: 180,
            instruction: 'Bury the seed deep within your being. It pulses beneath the surface.',
            sensoryCues: ['The seed descends into the dark earth of your subconscious.', 'A faint vertical pulse of light.'],
            image: 'rituals/ritual_00006_.png',
        }
    ],
    completion: {
        expectedOutput: ['Clear sense of your core intention', 'Feeling of quiet confidence'],
        closingInstruction: 'Whisper your Sankalpa three times silently.'
    }
};

// ============ ANCESTRAL HEALING ============
const ANCESTRAL_HEALING = {
    id: 'ancestralHealing',
    name: 'Ancestral Healing',
    tradition: 'Shamanic / Family Constellation',
    category: 'invocation',
    icon: '👥',
    iconName: 'ancestors',
    unlockStage: 'flame',
    prerequisite: null,
    duration: { min: 12, max: 18 },
    recommendation: 'Perform on ancestor days or when feeling disconnected.',
    description: 'Connect with and receive blessings from the ancestral lineage.',
    history: `Every mystical tradition honors the ancestors.`,
    steps: [
        {
            id: 'lineage',
            name: 'The Lineage',
            duration: 180,
            instruction: 'Turn to face your lineage. See the infinite line of ancestors stretching back through time.',
            sensoryCues: ['Glowing figures stand in a line behind you, fading into golden mist.', 'Feel the weight of ten thousand generations.'],
            image: 'rituals/ritual_00007_.png',
        },
        {
            id: 'offering',
            name: 'The Offering',
            duration: 180,
            instruction: 'Bow deeply to your ancestors. Offer them your gratitude, your forgiveness, and your love.',
            sensoryCues: ['Golden dust and sparks float between you and them.', 'Your bow carries genuine humility.'],
            image: 'rituals/ritual_00008_.png',
        },
        {
            id: 'reception',
            name: 'The Reception',
            duration: 180,
            instruction: 'Feel ancestral hands resting on your shoulders. Receive their blessing.',
            sensoryCues: ['Warm, golden hands press gently on your shoulders.', 'You are not alone.'],
            image: 'rituals/ritual_00009_.png',
        }
    ],
    completion: {
        expectedOutput: ['Feeling of support and connection', 'Sense of belonging'],
        closingInstruction: 'Bow once more. Turn and face forward.'
    }
};

// ============ FORGIVENESS (Cord Cutting) ============
const FORGIVENESS = {
    id: 'forgiveness',
    name: 'Cord Cutting (Forgiveness)',
    tradition: 'Energy Healing / Shamanic',
    category: 'transmutation',
    icon: '⚔️',
    iconName: 'sword',
    unlockStage: 'flame',
    prerequisite: null,
    duration: { min: 10, max: 15 },
    recommendation: 'Perform when feeling bound to past hurts or relationships.',
    description: 'Sever energetic cords of attachment and resentment.',
    history: `Cord cutting appears in Huna, Reiki, and shamanic traditions.`,
    steps: [
        {
            id: 'cord',
            name: 'The Cord',
            duration: 120,
            instruction: 'See the thick, dark cord connecting you to the person or situation.',
            sensoryCues: ['A heavy cord connects your solar plexus to theirs.', 'It drains energy, creates tension.'],
            image: 'rituals/ritual_00010_.png',
        },
        {
            id: 'severing',
            name: 'The Severing',
            duration: 120,
            instruction: 'A sword of pure white light appears. With one decisive cut, sever the cord.',
            sensoryCues: ['The sword is impossibly sharp, made of laser-white fire.', 'One clean slice—the cord splits.'],
            image: 'rituals/ritual_00011_.png',
        },
        {
            id: 'release',
            name: 'The Release',
            duration: 180,
            instruction: 'Watch the severed cord dissolve into golden dust. Feel the lightness.',
            sensoryCues: ['The dark cord crumbles into golden particles.', 'Your solar plexus heals and seals itself.'],
            image: 'rituals/ritual_00012_.png',
        }
    ],
    completion: {
        expectedOutput: ['Feeling lighter and freer', 'Release of resentment'],
        closingInstruction: 'Place your hand over your solar plexus. Affirm: "I am free."'
    }
};

// ============ HEART OPENING ============
const HEART_OPENING = {
    id: 'heartOpening',
    name: 'Heart Opening',
    tradition: 'Bhakti Yoga / Heart Chakra Work',
    category: 'invocation',
    icon: '🪷',
    iconName: 'lotus',
    unlockStage: 'seedling',
    prerequisite: null,
    duration: { min: 10, max: 15 },
    recommendation: 'Perform when feeling closed or disconnected from love.',
    description: 'Soften the armor around the heart and allow love to bloom.',
    history: `The armored heart is a universal human condition.`,
    steps: [
        {
            id: 'armor',
            name: 'The Armor',
            duration: 120,
            instruction: 'Feel the protective armor around your heart. See it as dark stone.',
            sensoryCues: ['Your chest is encased in heavy stone plates.', 'Cracks glow with pink light.'],
            image: 'rituals/ritual_00013_.png',
        },
        {
            id: 'bloom',
            name: 'The Bloom',
            duration: 180,
            instruction: 'The armor shatters. A luminous lotus flower blooms in its place.',
            sensoryCues: ['Stone falls away, dissolving.', 'A lotus unfolds petal by petal in your chest.'],
            image: 'rituals/ritual_00014_.png',
        },
        {
            id: 'radiance',
            name: 'The Radiance',
            duration: 180,
            instruction: 'The lotus blazes with light. Love radiates from your heart.',
            sensoryCues: ['The lotus becomes blindingly bright.', 'Waves of pink and green light fill the room.'],
            image: 'rituals/ritual_00015_.png',
        }
    ],
    completion: {
        expectedOutput: ['Warmth and expansion in the chest', 'Feeling of vulnerability'],
        closingInstruction: 'Cross your arms over your chest. Whisper: "I am love."'
    }
};

// ============ GRATITUDE ============
const GRATITUDE = {
    id: 'gratitude',
    name: 'The Overflowing Cup',
    tradition: 'Universal / Abundance Practice',
    category: 'devotional',
    icon: '🏆',
    iconName: 'chalice',
    unlockStage: 'seedling',
    prerequisite: null,
    duration: { min: 8, max: 12 },
    recommendation: 'Daily practice, especially when feeling lack.',
    description: 'Cultivate the felt sense of overflowing abundance.',
    history: `The chalice symbol appears across traditions.`,
    steps: [
        {
            id: 'cup',
            name: 'The Cup',
            duration: 120,
            instruction: 'See an ornate golden chalice before you, empty and waiting.',
            sensoryCues: ['The cup gleams in a spotlight.', 'Feel the emptiness—the space for receiving.'],
            image: 'rituals/ritual_00016_.png',
        },
        {
            id: 'rain',
            name: 'The Rain',
            duration: 180,
            instruction: 'Drops of liquid gold begin falling. With each blessing, more gold pours in.',
            sensoryCues: ['Viscous, glowing gold drips from above.', 'The cup fills faster than expected.'],
            image: 'rituals/ritual_00017_.png',
        },
        {
            id: 'spill',
            name: 'The Spill',
            duration: 180,
            instruction: 'The cup overflows. Where the gold touches, flowers bloom.',
            sensoryCues: ['Gold cascades over the rim.', 'Tiny golden flowers sprout where it lands.'],
            image: 'rituals/ritual_00018_.png',
        }
    ],
    completion: {
        expectedOutput: ['Genuine feeling of gratitude', 'Shift from scarcity to abundance'],
        closingInstruction: 'Open your hands. Say: "I have enough. I am enough."'
    }
};

// ============ METTA ============
const METTA = {
    id: 'metta',
    name: 'Metta (Loving Kindness)',
    tradition: 'Buddhist / Theravada',
    category: 'devotional',
    icon: '🔥',
    iconName: 'fire',
    unlockStage: 'seedling',
    prerequisite: null,
    duration: { min: 10, max: 15 },
    recommendation: 'Daily practice, especially when feeling isolated.',
    description: 'Expand loving kindness from self to all beings.',
    history: `Metta Bhavana is one of the oldest Buddhist practices.`,
    steps: [
        {
            id: 'ember',
            name: 'The Ember',
            duration: 120,
            instruction: 'Find a small ember of warmth in your heart. Fan it gently.',
            sensoryCues: ['A single warm ember glows in your chest.', 'It brightens with each breath.'],
            image: 'rituals/ritual_00019_.png',
        },
        {
            id: 'campfire',
            name: 'The Campfire',
            duration: 180,
            instruction: 'The ember grows into a campfire. See loved ones gathering around.',
            sensoryCues: ['The flame grows, crackling and warm.', 'Familiar faces appear in the circle of light.'],
            image: 'rituals/ritual_00020_.png',
        },
        {
            id: 'infinite',
            name: 'The Infinite',
            duration: 180,
            instruction: 'The fire expands to embrace the entire world.',
            sensoryCues: ['Your love becomes a web of golden light covering Earth.', 'Every node is a being.'],
            image: 'rituals/ritual_00021_.png',
        }
    ],
    completion: {
        expectedOutput: ['Warmth and openness', 'Reduced feelings of separation'],
        closingInstruction: 'Repeat: "May all beings be happy. May all beings be at peace."'
    }
};

// ============ SURRENDER ============
const SURRENDER = {
    id: 'surrender',
    name: 'Surrender',
    tradition: 'Taoist / Christian Mysticism',
    category: 'witnessing',
    icon: '🌊',
    iconName: 'wave',
    unlockStage: 'flame',
    prerequisite: null,
    duration: { min: 10, max: 15 },
    recommendation: 'Perform when feeling controlling or anxious.',
    description: 'Release control and surrender to the flow of life.',
    history: `The practice of surrender appears in Taoism (wu wei) and Christian mysticism.`,
    steps: [
        {
            id: 'grip',
            name: 'The Grip',
            duration: 120,
            instruction: 'Feel where you are holding on. See your hands as stone, clenched tight.',
            sensoryCues: ['Your hands are like cold grey stone.', 'Every muscle is tense.'],
            image: 'rituals/ritual_00022_.png',
        },
        {
            id: 'release',
            name: 'The Release',
            duration: 180,
            instruction: 'Let go. Watch your hands turn to sand and blow away.',
            sensoryCues: ['Your stone fingers loosen, crumble, fall away.', 'Sand slips through.'],
            image: 'rituals/ritual_00023_.png',
        },
        {
            id: 'float',
            name: 'The Float',
            duration: 180,
            instruction: 'You are floating on a dark river under the stars. The current carries you.',
            sensoryCues: ['Cool water supports your weightless body.', 'Stars wheel slowly overhead.'],
            image: 'rituals/ritual_00024_.png',
        }
    ],
    completion: {
        expectedOutput: ['Deep physical relaxation', 'Trust in the process of life'],
        closingInstruction: 'Open your palms. Whisper: "Thy will, not mine."'
    }
};

// ============ DEITY YOGA ============
const DEITY_YOGA = {
    id: 'deityYoga',
    name: 'Deity Yoga',
    tradition: 'Tibetan Buddhist / Tantric',
    category: 'invocation',
    icon: '👁',
    iconName: 'eye',
    unlockStage: 'ember',
    prerequisite: null,
    duration: { min: 15, max: 25 },
    recommendation: 'Perform for deep transformation.',
    description: 'Invoke a divine form and merge with its qualities.',
    history: `Deity Yoga is central to Vajrayana Buddhism.`,
    steps: [
        {
            id: 'summoning',
            name: 'The Summoning',
            duration: 180,
            instruction: 'Call forth the deity. See a towering luminous figure manifest before you.',
            sensoryCues: ['A vast being of pure light coalesces from the void.', 'Feel their presence fill the space.'],
            image: 'rituals/ritual_00025_.png',
        },
        {
            id: 'gaze',
            name: 'The Gaze',
            duration: 180,
            instruction: 'Meet the deity\'s eyes. In their gaze, see your own reflection.',
            sensoryCues: ['Golden eyes like mirrors regard you.', 'You see your own face—luminous.'],
            image: 'rituals/ritual_00026_.png',
        },
        {
            id: 'merge',
            name: 'The Merge',
            duration: 180,
            instruction: 'Step forward. Merge with the deity. You ARE the divine form.',
            sensoryCues: ['You step into their luminous body.', 'Light floods every cell.'],
            image: 'rituals/ritual_00027_.png',
        }
    ],
    completion: {
        expectedOutput: ['Feeling of expanded identity', 'Access to divine qualities'],
        closingInstruction: 'Press palms together at heart. The deity dissolves into a seed of light.'
    }
};

// ============ STORM ANCHOR ============
const STORM_ANCHOR = {
    id: 'stormAnchor',
    name: 'The Storm Anchor',
    tradition: 'Somatic / Neuroscience',
    category: 'grounding',
    icon: '⚓',
    iconName: 'anchor',
    unlockStage: 'seedling',
    prerequisite: null,
    duration: { min: 8, max: 12 },
    recommendation: 'Practice while calm to train your nervous system for crisis.',
    description: 'Prepare your nervous system for panic states through biological reset and cognitive rehearsal.',
    history: `The Physiological Sigh is a scientifically validated technique to rapidly downregulate the sympathetic nervous system.`,
    steps: [
        {
            id: 'sighting',
            name: 'The Sighting',
            duration: 120,
            instruction: 'Recall the earliest signs of rising panic: tightening chest, racing thoughts, narrowing vision.',
            sensoryCues: ['Feel the ghost of these sensations.', 'This is the signal, not the storm.'],
            image: 'rituals/ritual_00031_.png',
        },
        {
            id: 'sigh',
            name: 'The Physiological Sigh',
            duration: 180,
            instruction: 'Double-inhale through the nose: first breath fills, second sips more air. Then one long, slow exhale through the mouth.',
            sensoryCues: ['The double-inhale pops open collapsed alveoli.', 'The extended exhale activates the parasympathetic brake.'],
            image: 'rituals/ritual_00032_.png',
        },
        {
            id: 'weight',
            name: 'The Weight of Being',
            duration: 120,
            instruction: 'Feel gravity pressing you into the earth. Name 5 physical points of contact.',
            sensoryCues: ['Your body is a stone.', 'The ground does not move.'],
            image: 'rituals/ritual_00033_.png',
        },
        {
            id: 'triage',
            name: 'The Triage Script',
            duration: 120,
            instruction: 'Mentally rehearse: "Right now, I am safe. What is the next small action?"',
            sensoryCues: ['Future-you has this phrase memorized.', 'The crisis is not here yet.'],
            image: 'rituals/ritual_00034_.png',
        }
    ],
    completion: {
        expectedOutput: ['Slower heart rate', 'Clearer mental field'],
        closingInstruction: 'Place one hand on your chest. Say: "The anchor is set."'
    }
};

// ============ UNION ============
const UNION = {
    id: 'union',
    name: 'Union (Oceanic Dissolution)',
    tradition: 'Non-Dual / Advaita',
    category: 'witnessing',
    icon: '💧',
    iconName: 'droplet',
    unlockStage: 'star',
    prerequisite: null,
    duration: { min: 12, max: 20 },
    recommendation: 'For experienced practitioners.',
    description: 'Experience the dissolution of the separate self into infinite awareness.',
    history: `The "oceanic feeling" was described by Romain Rolland as the essence of mystical experience.`,
    steps: [
        {
            id: 'drop',
            name: 'The Drop',
            duration: 180,
            instruction: 'You are a single drop of water, suspended in space.',
            sensoryCues: ['Feel the surface tension of your individuality.', 'Inside you, a galaxy swirls.'],
            image: 'rituals/ritual_00028_.png',
        },
        {
            id: 'impact',
            name: 'The Impact',
            duration: 120,
            instruction: 'You fall. The moment of contact with the infinite ocean.',
            sensoryCues: ['Contact. Ripples radiate in perfect circles.', 'The membrane of self begins to dissolve.'],
            image: 'rituals/ritual_00029_.png',
        },
        {
            id: 'ocean',
            name: 'The Ocean',
            duration: 180,
            instruction: 'You are the ocean. There is no drop. There never was.',
            sensoryCues: ['Boundless dark water under starlight.', 'No horizon—infinite in all directions.'],
            image: 'rituals/ritual_00030_.png',
        }
    ],
    completion: {
        expectedOutput: ['Dissolution of ego boundaries', 'Experience of vastness'],
        closingInstruction: 'Remain in the ocean. When ready, a new drop will condense.'
    }
};

// Registry of all rituals
export const RITUAL_REGISTRY = {
    sankalpa: SANKALPA,
    divineLight: DIVINE_LIGHT,
    ancestralHealing: ANCESTRAL_HEALING,
    heartOpening: HEART_OPENING,
    deityYoga: DEITY_YOGA,
    forgiveness: FORGIVENESS,
    surrender: SURRENDER,
    stormAnchor: STORM_ANCHOR,
    union: UNION,
    gratitude: GRATITUDE,
    metta: METTA,
};

// Debug log to verify all rituals are loaded
console.log('=== RITUAL REGISTRY LOADED ===');
console.log('Total rituals:', Object.keys(RITUAL_REGISTRY).length);
console.log('Ritual names:', Object.keys(RITUAL_REGISTRY));

export const getAllRituals = () => {
    return Object.values(RITUAL_REGISTRY);
};

export const getRitualsByCategory = (categoryId) => {
    return getAllRituals().filter(r => r.category === categoryId);
};

export const getRitualById = (id) => {
    return RITUAL_REGISTRY[id];
};

export { RITUAL_CATEGORIES };
