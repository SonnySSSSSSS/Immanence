// src/data/pathDefinitions.js
// Path registry for attention-interface paths
// Inner sigil assets must share identical bounding boxes and anchor points to avoid layout reflow.

export const PATH_DEFINITIONS = {
    Yantra: {
        id: 'Yantra',
        name: 'Ritual',
        symbol: '△',
        interface: 'symbolic',
        description: 'Symbolic / ritual / meaning-driven attention',
    },
    Kaya: {
        id: 'Kaya',
        name: 'Somatic',
        symbol: '◍',
        interface: 'somatic',
        description: 'Somatic / perceptual / insight-driven attention',
    },
    Chitra: {
        id: 'Chitra',
        name: 'Imaginal',
        symbol: '✶',
        interface: 'visual',
        description: 'Visual / imaginal / image-driven attention',
    },
    Nada: {
        id: 'Nada',
        name: 'Sonic',
        symbol: '≋',
        interface: 'sonic',
        description: 'Sonic / rhythmic / breath-based attention',
    },
};

export const PATH_IDS = Object.keys(PATH_DEFINITIONS);

export const PATH_NAMES = PATH_IDS.reduce((acc, id) => {
    acc[id] = PATH_DEFINITIONS[id].name;
    return acc;
}, {});

export const PATH_SYMBOLS = PATH_IDS.reduce((acc, id) => {
    acc[id] = PATH_DEFINITIONS[id].symbol;
    return acc;
}, {});

export const LEGACY_PATH_MAP = {
    Soma: 'Kaya',
    Prana: 'Nada',
    Dhyana: 'Yantra',
    Drishti: 'Chitra',
    Jnana: 'Yantra',
    Samyoga: null,
};

export const LEGACY_PATH_LABELS = {
    Soma: 'Soma',
    Prana: 'Prana',
    Dhyana: 'Dhyana',
    Drishti: 'Drishti',
    Jnana: 'Jnana',
    Samyoga: 'Samyoga',
};
