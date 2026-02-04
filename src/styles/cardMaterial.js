// src/styles/cardMaterial.js
// Unified "Plateau Material" style system for cards
// Creates consistent smoked glass / plasma frost aesthetic

/**
 * Unified card material - glassmorphism with backdrop blur
 * Apply this style to all cards for visual consistency
 */
export const plateauMaterial = {
  // Darker semi-transparent base for better legibility
  background: 'rgba(10, 10, 18, 0.7)',
  
  // Glassmorphism effect - strong blur for depth
  backdropFilter: 'blur(32px)',
  WebkitBackdropFilter: 'blur(32px)',

  // Hard 1px border (crisp, not soft) - no glow
  border: '1px solid rgba(255, 255, 255, 0.15)',

  // Tighter corners for modern precision
  borderRadius: '12px',

  // Pure depth shadows - no accent glow, just structure
  boxShadow: `
    0 8px 32px rgba(0, 0, 0, 0.8),
    0 2px 8px rgba(0, 0, 0, 0.6),
    inset 0 1px 0 rgba(255, 255, 255, 0.12),
    inset -1px -1px 0 rgba(255, 255, 255, 0.04)
  `,
};

/**
 * Elevated variant (for primary/focused cards)
 */
export const plateauMaterialElevated = {
  ...plateauMaterial,
  background: 'rgba(12, 12, 20, 0.75)',
  backdropFilter: 'blur(36px)',
  WebkitBackdropFilter: 'blur(36px)',
  border: '1px solid rgba(255, 255, 255, 0.18)',
  borderRadius: '12px',
  boxShadow: `
    0 12px 40px rgba(0, 0, 0, 0.85),
    0 4px 16px rgba(0, 0, 0, 0.7),
    inset 0 1px 0 rgba(255, 255, 255, 0.15),
    inset -1px -1px 0 rgba(255, 255, 255, 0.06)
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
  background: `radial-gradient(
    ellipse 90% 40% at 50% 0%,
    var(--accent-glow)18 0%,
    var(--accent-glow)08 35%,
    transparent 70%
  )`,
  borderRadius: 'inherit',
};

/**
 * Clear variant (for stats/dashboard cards)
 * Lighter, cleaner background for high-contrast number display
 */
export const plateauMaterialClear = {
  background: 'rgba(10, 10, 18, 0.4)',
  backdropFilter: 'blur(32px)',
  WebkitBackdropFilter: 'blur(32px)',
  border: '1px solid rgba(255, 255, 255, 0.14)',
  borderRadius: '12px',
  boxShadow: `
    0 8px 32px rgba(0, 0, 0, 0.75),
    inset 0 1px 0 rgba(255, 255, 255, 0.1),
    inset -1px -1px 0 rgba(255, 255, 255, 0.05)
  `,
};

/* ═══════════════════════════════════════════════════════════════════════════
   LIGHT MODE VARIANTS — Manuscript Aesthetic
   Use these in light mode for paper-like appearance
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Light mode card material - subtle paper/parchment look
 */
export const plateauMaterialLight = {
  background: 'rgba(255, 255, 255, 0.85)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid var(--light-border, rgba(60, 50, 35, 0.15))',
  boxShadow: `
    0 4px 16px rgba(60, 50, 35, 0.08),
    0 1px 3px rgba(60, 50, 35, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.8),
    inset 0 -1px 0 rgba(60, 50, 35, 0.05)
  `,
};

/**
 * Light mode inner glow - subtle top highlight
 */
export const innerGlowStyleLight = {
  position: 'absolute',
  inset: 0,
  pointerEvents: 'none',
  background: `radial-gradient(
    ellipse 90% 40% at 50% 0%,
    var(--accent-glow)12 0%,
    rgba(255, 255, 255, 0.2) 20%,
    transparent 70%
  )`,
  borderRadius: 'inherit',
};

/**
 * Helper function to get appropriate material based on color scheme
 */
export function getCardMaterial(isLight) {
  return isLight ? plateauMaterialLight : plateauMaterial;
}

export function getInnerGlowStyle(isLight) {
  return isLight ? innerGlowStyleLight : innerGlowStyle;
}

