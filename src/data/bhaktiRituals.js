// src/data/bhaktiRituals.js
// 10 Bhakti rituals with prompt sequences

export const BHAKTI_RITUALS = [
    {
        id: 'gratitude',
        name: 'Gratitude Offering',
        icon: '🙏',
        description: 'Appreciation for existence',
        prompts: [
            { text: "Bring to mind what sustains you...", timing: 0 },
            { text: "Feel the warmth of appreciation rising in your chest...", timing: 45 },
            { text: "Let gratitude flow outward like a gentle wave...", timing: 90 },
            { text: "Thank the forces that support your existence...", timing: 135 },
            { text: "Rest in this field of thankfulness...", timing: 180 },
        ],
    },
    {
        id: 'heartOpening',
        name: 'Heart Opening',
        icon: '💗',
        description: 'Compassion and love',
        prompts: [
            { text: "Feel the warmth expanding from your heart center...", timing: 0 },
            { text: "Let the boundaries of your heart soften...", timing: 45 },
            { text: "Breathe into the spaciousness opening within...", timing: 90 },
            { text: "Allow love to flow freely, without condition...", timing: 135 },
            { text: "You are this love. Rest here.", timing: 180 },
        ],
    },
    {
        id: 'deityCommunnion',
        name: 'Deity Communion',
        icon: '✨',
        description: 'Relationship with the divine',
        prompts: [
            { text: "Visualize your ishta-devata, your chosen form of the divine...", timing: 0 },
            { text: "Feel their presence before you, luminous and alive...", timing: 45 },
            { text: "Offer your attention as a form of worship...", timing: 90 },
            { text: "Receive their blessing, their gaze meeting yours...", timing: 135 },
            { text: "Let the boundary between devotee and divine soften...", timing: 180 },
        ],
    },
    {
        id: 'surrender',
        name: 'Surrender',
        icon: '🕊️',
        description: 'Releasing control',
        prompts: [
            { text: "Offer everything you're holding to the infinite...", timing: 0 },
            { text: "Let go of the need to control the outcome...", timing: 45 },
            { text: "Your will dissolves into a greater will...", timing: 90 },
            { text: "Trust the current that carries you...", timing: 135 },
            { text: "You are held. Rest in that.", timing: 180 },
        ],
    },
    {
        id: 'metta',
        name: 'Metta (Loving-Kindness)',
        icon: '💛',
        description: 'Radiating goodwill',
        prompts: [
            { text: "May I be happy, may I be at peace...", timing: 0 },
            { text: "May those I love be happy, may they be free from suffering...", timing: 45 },
            { text: "May all beings be happy, may all beings be free...", timing: 90 },
            { text: "Let loving-kindness radiate in all directions...", timing: 135 },
            { text: "You are a beacon of goodwill. Shine.", timing: 180 },
        ],
    },
    {
        id: 'forgiveness',
        name: 'Forgiveness',
        icon: '🌿',
        description: 'Releasing resentment',
        prompts: [
            { text: "Bring to mind one you need to forgive...", timing: 0 },
            { text: "See their humanity, their suffering, their confusion...", timing: 45 },
            { text: "Let the resentment begin to loosen its grip...", timing: 90 },
            { text: "Forgiveness is a gift you give yourself...", timing: 135 },
            { text: "Release them. Release yourself.", timing: 180 },
        ],
    },
    {
        id: 'ancestral',
        name: 'Ancestral Connection',
        icon: '🌳',
        description: 'Honoring lineage',
        prompts: [
            { text: "Feel the presence of those who came before...", timing: 0 },
            { text: "Your ancestors stand behind you, a vast lineage...", timing: 45 },
            { text: "Receive their strength, their wisdom, their love...", timing: 90 },
            { text: "You carry forward what they began...", timing: 135 },
            { text: "Honor them with your presence here, now.", timing: 180 },
        ],
    },
    {
        id: 'divineLight',
        name: 'Divine Light',
        icon: '☀️',
        description: 'Receiving grace',
        prompts: [
            { text: "Imagine light descending from above, filling you...", timing: 0 },
            { text: "This light is grace, freely given...", timing: 45 },
            { text: "Let it illuminate every cell, every corner of being...", timing: 90 },
            { text: "You become translucent, radiant...", timing: 135 },
            { text: "Rest in this luminosity.", timing: 180 },
        ],
    },
    {
        id: 'sankalpa',
        name: 'Sankalpa (Sacred Vow)',
        icon: '🔥',
        description: 'Setting intention',
        prompts: [
            { text: "Speak silently: I am... I will...", timing: 0 },
            { text: "Let your intention arise from the heart, not the mind...", timing: 45 },
            { text: "Plant this seed in the soil of being...", timing: 90 },
            { text: "Trust that what is planted will grow...", timing: 135 },
            { text: "Your vow echoes through time. It is done.", timing: 180 },
        ],
    },
    {
        id: 'union',
        name: 'Union (Samyoga)',
        icon: '♾️',
        description: 'Dissolving separation',
        prompts: [
            { text: "Let the boundary between self and other soften...", timing: 0 },
            { text: "You are not separate from this moment...", timing: 45 },
            { text: "The observer and observed merge...", timing: 90 },
            { text: "There is only this. This presence.", timing: 135 },
            { text: "Rest in union.", timing: 180 },
        ],
    },
];

export function isRitualEmpty(ritual) {
    if (!ritual?.id) return true;
    const steps = ritual.steps ?? ritual.prompts;
    if (!Array.isArray(steps) || steps.length === 0) return true;
    const hasContent = steps.some((step) => {
        const hasText = Boolean(step?.text || step?.prompt || step?.instruction);
        const hasDuration = step?.duration != null || step?.timing != null;
        return hasText || hasDuration;
    });
    return !hasContent;
}

BHAKTI_RITUALS.forEach((ritual) => {
    ritual.isActive = !isRitualEmpty(ritual);
});

// Get ritual by id
export function getRitualById(ritualId) {
    return BHAKTI_RITUALS.find(r => r.id === ritualId) || BHAKTI_RITUALS[0];
}

// Get active prompt for a ritual at a given elapsed time
export function getBhaktiPrompt(elapsedSeconds, ritualId = 'gratitude') {
    const ritual = getRitualById(ritualId);
    let activePrompt = ritual.prompts[0];

    for (const prompt of ritual.prompts) {
        if (elapsedSeconds >= prompt.timing) {
            activePrompt = prompt;
        } else {
            break;
        }
    }

    return activePrompt;
}
