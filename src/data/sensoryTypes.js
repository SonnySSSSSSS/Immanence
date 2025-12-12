// src/data/sensoryTypes.js
// Sensory practice type definitions and configurations

export const SENSORY_TYPES = {
    bodyScan: {
        id: 'bodyScan',
        label: 'Body Scan',
        description: 'Sensing the body, point by point',
        icon: '🫸',
        pathContribution: 'Soma',
        promptInterval: 30, // seconds between prompts
    },
    bhakti: {
        id: 'bhakti',
        label: 'Bhakti',
        description: 'Opening the heart through devotion',
        icon: '💗',
        pathContribution: 'Samyoga',
        promptInterval: 45,
    },
    vipassana: {
        id: 'vipassana',
        label: 'Vipassana',
        description: 'Observing the stream of mental events',
        icon: '🌊',
        pathContribution: 'Dhyana',
        promptInterval: 60,
        modes: ['noting', 'watching'],
    },
    sakshi: {
        id: 'sakshi',
        label: 'Sakshi',
        description: 'Resting as awareness itself',
        icon: '◯',
        pathContribution: 'Dhyana',
        promptInterval: 90, // sparse prompts
    },
};

// Array format for UI selectors
export const SENSORY_TYPE_LIST = Object.values(SENSORY_TYPES);

// Get type by ID
export const getSensoryType = (id) => SENSORY_TYPES[id] || null;

// Labels for PracticeSection dropdown
export const SENSORY_LABELS = SENSORY_TYPE_LIST.map(t => t.label);
