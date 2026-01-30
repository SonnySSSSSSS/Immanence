// Asset paths from public folder (referenced at runtime)
const BASE_PATH = `${import.meta.env.BASE_URL}awareness/body-scan`;

export const AWARENESS_ASSETS = {
    upper: `${BASE_PATH}/upper.png`,
    middle: `${BASE_PATH}/middle.png`,
    lower: `${BASE_PATH}/lower.png`,
    full: `${BASE_PATH}/full.png`,
};

export const AWARENESS_REGIONS = ['upper', 'middle', 'lower', 'full'];

// Body scan practice IDs to assets (in public/sensory folder)
export const BODY_SCAN_ASSETS = {
    full: `${import.meta.env.BASE_URL}sensory/body-scan-silhouette.png`,
    head: `${import.meta.env.BASE_URL}sensory/body-scan-head.jpg`,
    chest: `${import.meta.env.BASE_URL}sensory/body-scan-chest.png`,
    hips: `${import.meta.env.BASE_URL}sensory/body-scan-hips.png`,
    hands: `${import.meta.env.BASE_URL}sensory/body-scan-hands.png`,
    feet: `${import.meta.env.BASE_URL}sensory/body-scan-feet.png`,
    nadis: `${import.meta.env.BASE_URL}sensory/body-scan-nadis.png`,
};
