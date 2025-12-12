// src/styles/cardMaterial.js
// Unified "Plateau Material" style system for cards
// Creates consistent smoked glass / plasma frost aesthetic

/**
 * Unified card material - smoked glass with subtle texture
 * Apply this style to all cards for visual consistency
 */
export const plateauMaterial = {
  // Base obsidian gradient
  background: 'linear-gradient(145deg, rgba(18, 10, 20, 0.88) 0%, rgba(12, 6, 14, 0.94) 100%)',

  // Gradient border effect
  border: '1px solid transparent',
  backgroundImage: `
    linear-gradient(145deg, rgba(18, 10, 20, 0.88), rgba(12, 6, 14, 0.94)),
    linear-gradient(135deg, var(--accent-40) 0%, rgba(138, 43, 226, 0.12) 50%, var(--accent-30) 100%)
  `,
  backgroundOrigin: 'border-box',
  backgroundClip: 'padding-box, border-box',

  // Depth shadows with subtle sheen
  boxShadow: `
    0 8px 32px rgba(0, 0, 0, 0.6),
    0 2px 8px var(--accent-15),
    inset 0 1px 0 rgba(255, 215, 0, 0.03),
    inset 0 -1px 0 rgba(0, 0, 0, 0.3),
    inset 0 -4px 16px rgba(0, 0, 0, 0.4)
  `,
};

/**
 * Elevated variant (for primary/focused cards)
 */
export const plateauMaterialElevated = {
  ...plateauMaterial,
  boxShadow: `
    0 12px 40px rgba(0, 0, 0, 0.7),
    0 0 40px var(--accent-20),
    inset 0 1px 0 rgba(255, 215, 0, 0.05),
    inset 0 -1px 0 rgba(0, 0, 0, 0.3),
    inset 0 -4px 16px rgba(0, 0, 0, 0.5)
  `,
};

/**
 * Noise texture overlay style
 * Should be applied to an absolute-positioned div inside the card
 */
export const noiseOverlayStyle = {
  position: 'absolute',
  inset: 0,
  pointerEvents: 'none',
  opacity: 0.03,
  background: `
    url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")
  `,
  mixBlendMode: 'overlay',
  borderRadius: 'inherit',
};

/**
 * Sheen gradient overlay - subtle luminosity
 * Applied as layer above noise
 */
export const sheenOverlayStyle = {
  position: 'absolute',
  inset: 0,
  pointerEvents: 'none',
  background: `
    linear-gradient(135deg, 
      rgba(255, 255, 255, 0.02) 0%, 
      transparent 40%, 
      transparent 60%, 
      rgba(255, 255, 255, 0.01) 100%
    )
  `,
  borderRadius: 'inherit',
};

/**
 * Inner ember glow - creates depth at top
 */
export const innerGlowStyle = {
  position: 'absolute',
  inset: 0,
  pointerEvents: 'none',
  background: `radial-gradient(ellipse 80% 30% at 50% 0%, var(--accent-glow)10 0%, transparent 60%)`,
  borderRadius: 'inherit',
};

/**
 * Clear variant (for stats/dashboard cards)
 * Lighter, cleaner background for high-contrast number display
 */
export const plateauMaterialClear = {
  background: 'rgba(18, 10, 3, 0.35)',
  backdropFilter: 'blur(22px)',
  WebkitBackdropFilter: 'blur(22px)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  backgroundImage: `
    linear-gradient(rgba(18, 10, 3, 0.35), rgba(18, 10, 3, 0.35)),
    linear-gradient(135deg, var(--accent-40) 0%, rgba(138, 43, 226, 0.08) 50%, var(--accent-30) 100%)
  `,
  backgroundOrigin: 'border-box',
  backgroundClip: 'padding-box, border-box',
  boxShadow: `
    0 0 30px rgba(255, 200, 100, 0.08),
    0 8px 32px rgba(0, 0, 0, 0.6),
    inset 0 1px 0 rgba(255, 215, 0, 0.04),
    inset 0 -1px 0 rgba(0, 0, 0, 0.25)
  `,
};
