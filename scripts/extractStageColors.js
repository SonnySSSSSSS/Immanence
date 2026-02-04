// scripts/extractStageColors.js
// Extracts dominant colors from stage background images using k-means clustering

import sharp from 'sharp';
import { kmeans } from 'ml-kmeans';
import { writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Stage names matching the background files
const STAGES = ['seedling', 'ember', 'flame', 'beacon', 'stellar'];

// Configuration
const CONFIG = {
  downsampleSize: 200,        // Resize images to this size for performance
  samplingRate: 0.1,          // Sample 10% of pixels
  numClusters: 5,             // k-means k value
  minContrastRatio: 4.5,      // WCAG AA standard
};

/**
 * Calculate relative luminance for contrast ratio
 * https://www.w3.org/TR/WCAG20/#relativeluminancedef
 */
function getLuminance(r, g, b) {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors
 */
function getContrastRatio(rgb1, rgb2) {
  const lum1 = getLuminance(...rgb1);
  const lum2 = getLuminance(...rgb2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Convert RGB to hex string
 */
function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(x => {
    const hex = Math.round(x).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

/**
 * Convert RGB to HSL
 */
function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return [h * 360, s * 100, l * 100];
}

/**
 * Darken a color by reducing lightness
 */
function darken(rgb, amount) {
  const [h, s, l] = rgbToHsl(...rgb);
  const newL = Math.max(0, l - (amount * 100));
  return hslToRgb(h, s, newL);
}

/**
 * Lighten a color by increasing lightness
 */
function lighten(rgb, amount) {
  const [h, s, l] = rgbToHsl(...rgb);
  const newL = Math.min(100, l + (amount * 100));
  return hslToRgb(h, s, newL);
}

/**
 * Convert HSL to RGB
 */
function hslToRgb(h, s, l) {
  h /= 360;
  s /= 100;
  l /= 100;

  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  return [r * 255, g * 255, b * 255];
}

/**
 * Sample pixels from image data
 */
function samplePixels(data, width, height, rate) {
  const pixels = [];
  const totalPixels = width * height;
  const sampleSize = Math.floor(totalPixels * rate);

  // Random sampling for better distribution
  const indices = new Set();
  while (indices.size < sampleSize) {
    indices.add(Math.floor(Math.random() * totalPixels));
  }

  for (const idx of indices) {
    const i = idx * 4;
    if (i + 2 < data.length) {
      pixels.push([data[i], data[i + 1], data[i + 2]]);
    }
  }

  return pixels;
}

/**
 * Apply k-means clustering to find dominant colors
 */
function findDominantColors(pixels, k) {
  const result = kmeans(pixels, k, {
    initialization: 'kmeans++',
    maxIterations: 100,
  });

  return result.centroids;
}

/**
 * Calculate saturation for sorting
 */
function getSaturation(rgb) {
  const [h, s, l] = rgbToHsl(...rgb);
  return s;
}

/**
 * Extract colors from a single image
 */
async function extractColorsFromImage(imagePath, stageName) {
  console.log(`\nProcessing ${stageName}...`);

  // Check if image exists
  if (!existsSync(imagePath)) {
    throw new Error(`Image not found: ${imagePath}`);
  }

  // Load and downsample image
  const image = sharp(imagePath);
  const resized = await image
    .resize(CONFIG.downsampleSize, CONFIG.downsampleSize, {
      fit: 'cover',
    })
    .raw()
    .toBuffer({ resolveWithObject: true });

  console.log(`  Loaded and downsampled to ${CONFIG.downsampleSize}x${CONFIG.downsampleSize}`);

  // Sample pixels
  const pixels = samplePixels(
    resized.data,
    resized.info.width,
    resized.info.height,
    CONFIG.samplingRate
  );

  console.log(`  Sampled ${pixels.length} pixels (${(CONFIG.samplingRate * 100).toFixed(1)}%)`);

  // Apply k-means clustering
  const clusters = findDominantColors(pixels, CONFIG.numClusters);

  console.log(`  Found ${clusters.length} dominant colors via k-means`);

  // Sort by saturation (most saturated first)
  const sorted = clusters
    .map(rgb => ({
      rgb,
      saturation: getSaturation(rgb),
      hex: rgbToHex(...rgb),
    }))
    .sort((a, b) => b.saturation - a.saturation);

  // Build color palette
  const primary = sorted[0].rgb;
  const secondary = sorted[1].rgb;
  const accent = sorted[0].rgb; // Use most saturated for accent
  const muted = darken(primary, 0.3);
  const highlight = lighten(primary, 0.2);

  // Validate contrast ratios
  const darkBg = [10, 10, 18]; // From plateauMaterial background
  const primaryContrast = getContrastRatio(primary, darkBg);
  const passesWCAG = primaryContrast >= CONFIG.minContrastRatio;

  console.log(`  Primary color: ${rgbToHex(...primary)} (contrast: ${primaryContrast.toFixed(2)}:1)`);
  console.log(`  WCAG AA ${passesWCAG ? '✓ PASS' : '✗ FAIL'} (${CONFIG.minContrastRatio}:1 required)`);

  return {
    primary: rgbToHex(...primary),
    secondary: rgbToHex(...secondary),
    accent: rgbToHex(...accent),
    muted: rgbToHex(...muted),
    highlight: rgbToHex(...highlight),
    source: `bg/bg-${stageName}-bottom.png`,
    extractedAt: new Date().toISOString(),
    contrastRatio: primaryContrast.toFixed(2),
    wcagAA: passesWCAG,
  };
}

/**
 * Main extraction function
 */
async function extractAllStageColors() {
  console.log('=== Stage Color Extraction ===');
  console.log(`Extracting colors from ${STAGES.length} background images...\n`);

  const results = {};

  for (const stage of STAGES) {
    const imagePath = join(__dirname, '..', 'public', 'bg', `bg-${stage}-bottom.png`);

    try {
      const colors = await extractColorsFromImage(imagePath, stage);
      results[stage] = colors;
    } catch (error) {
      console.error(`Error processing ${stage}:`, error.message);
      process.exit(1);
    }
  }

  // Write results to JSON file
  const outputDir = join(__dirname, '..', 'src', 'data');
  const outputPath = join(outputDir, 'extractedStageColors.json');

  writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf-8');

  console.log(`\n✓ Color extraction complete!`);
  console.log(`  Output: ${outputPath}`);
  console.log(`\nExtracted color palettes:`);

  for (const [stage, colors] of Object.entries(results)) {
    console.log(`\n  ${stage.toUpperCase()}:`);
    console.log(`    Primary:    ${colors.primary}`);
    console.log(`    Secondary:  ${colors.secondary}`);
    console.log(`    Accent:     ${colors.accent}`);
    console.log(`    Muted:      ${colors.muted}`);
    console.log(`    Highlight:  ${colors.highlight}`);
  }

  console.log('\nYou can now use these colors in src/theme/stageColors.js');
}

// Run extraction
extractAllStageColors().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
