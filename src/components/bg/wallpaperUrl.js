// Shared helper to construct stage wallpaper URLs using Vite's BASE_URL.
// Usage: getStageWallpaperUrl('seedling')

import { getStageAssets } from '../../config/avatarStageAssets.js';

function withBaseUrl(publicPath) {
  const base = import.meta.env.BASE_URL || '/';
  const baseUrl = base.endsWith('/') ? base : `${base}/`;
  const normalizedPath = String(publicPath || '').replace(/^\/+/, '');
  return `${baseUrl}${encodeURI(normalizedPath)}`;
}

export function getStageWallpaperUrl(stageKey) {
  return withBaseUrl(getStageAssets(stageKey).wallpaper);
}
