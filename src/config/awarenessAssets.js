// Asset paths from public folder (referenced at runtime)
const BASE_PATH = `${import.meta.env.BASE_URL}awareness/body-scan`;

export const AWARENESS_ASSETS = {
    upper: `${BASE_PATH}/upper.webp`,
    middle: `${BASE_PATH}/middle.webp`,
    lower: `${BASE_PATH}/lower.webp`,
    full: `${BASE_PATH}/full.webp`,
};

export const AWARENESS_REGIONS = ['upper', 'middle', 'lower', 'full'];

// Body scan practice IDs to assets (in public/sensory folder)
export const BODY_SCAN_ASSETS = {
    full: `${import.meta.env.BASE_URL}sensory/body-scan-silhouette.webp`,
    head: `${import.meta.env.BASE_URL}sensory/body-scan-head.jpg`,
    chest: `${import.meta.env.BASE_URL}sensory/body-scan-chest.webp`,
    hips: `${import.meta.env.BASE_URL}sensory/body-scan-hips.webp`,
    hands: `${import.meta.env.BASE_URL}sensory/body-scan-hands.webp`,
    feet: `${import.meta.env.BASE_URL}sensory/body-scan-feet.webp`,
    nadis: `${import.meta.env.BASE_URL}sensory/body-scan-nadis.webp`,
};
