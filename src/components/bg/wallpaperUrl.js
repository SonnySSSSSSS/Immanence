// Shared helper to construct stage wallpaper URLs using Vite's BASE_URL
// Usage: getStageWallpaperUrl('seedling')

export function getStageWallpaperUrl(stageKey) {
  const base = import.meta.env.BASE_URL || '/';
  // Ensure trailing slash
  const baseUrl = base.endsWith('/') ? base : base + '/';
  return `${baseUrl}bg/bg-${stageKey.toLowerCase()}-bottom.png`;
}
