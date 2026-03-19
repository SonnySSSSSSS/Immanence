// Preload awareness scene and card images before SensoryConfig renders.
// Called when the user selects the awareness practice so images are in
// browser cache by the time the config panel becomes visible.

const BASE = import.meta.env.BASE_URL;

const AWARENESS_IMAGE_URLS = [
  `${BASE}awareness/scenes/forest.webp`,
  `${BASE}awareness/menu/sakshi_ii_menu.webp`,
  `${BASE}awareness/scenes/street.webp`,
  `${BASE}awareness/scenes/room.webp`,
  `${BASE}awareness/scenes/beach.webp`,
  `${BASE}awareness/scenes/mountain.webp`,
];

let _preloaded = false;

export function preloadAwarenessImages() {
  if (_preloaded) return;
  _preloaded = true;
  AWARENESS_IMAGE_URLS.forEach((src) => {
    const img = new Image();
    img.src = src;
  });
}
