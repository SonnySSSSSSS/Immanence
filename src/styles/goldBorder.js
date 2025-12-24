// src/styles/goldBorder.js
// Refined Gold Border - Beveled Light Simulation
// Triple-stroke system with specular highlights for engraved jewelry aesthetic

/**
 * Creates a refined gold border with multi-layered light simulation
 * @param {Object} options - Border configuration
 * @param {boolean} options.isLight - Light mode flag
 * @param {string} options.borderRadius - Border radius (e.g., '16px', '50%')
 * @returns {Object} CSS style object
 */
export function getRefinedGoldBorder({ isLight = false, borderRadius = '16px' } = {}) {
    // Color palette
    const deepGold = '#D4AF37';
    const brightBrass = '#FBF5B7';
    const darkBronze = '#AF8B2C';
    const specularHighlight = 'rgba(255, 250, 235, 0.9)';

    return {
        position: 'relative',

        // LAYER 1: Outer separation stroke (dark bronze)
        // LAYER 2: Main gradient stroke (deep gold → bright brass → dark bronze)
        // LAYER 3: Inner specular highlight (top-left only via box-shadow)
        border: isLight
            ? `2px solid transparent`
            : `2px solid transparent`,

        // Multi-layer border via background-image
        backgroundImage: isLight
            ? `
        linear-gradient(var(--light-bg-surface), var(--light-bg-surface)),
        linear-gradient(135deg, ${darkBronze} 0%, ${deepGold} 25%, ${brightBrass} 50%, ${deepGold} 75%, ${darkBronze} 100%)
      `
            : `
        linear-gradient(rgba(26, 15, 28, 0.92), rgba(26, 15, 28, 0.92)),
        linear-gradient(135deg, ${darkBronze} 0%, ${deepGold} 25%, ${brightBrass} 50%, ${deepGold} 75%, ${darkBronze} 100%)
      `,
        backgroundOrigin: 'padding-box, border-box',
        backgroundClip: 'padding-box, border-box',

        borderRadius,

        // Contact shadow (underneath for depth)
        boxShadow: `
      0 0 0 0.5px ${darkBronze},
      inset 1px 1px 0 0.5px ${specularHighlight},
      0 2px 4px rgba(0, 0, 0, 0.15)
    `,
    };
}

/**
 * Noise texture overlay for brushed metal effect
 * Apply this as a pseudo-element or overlay div
 */
export const goldBorderNoiseOverlay = {
    position: 'absolute',
    inset: '-2px', // Extend slightly to cover border
    borderRadius: 'inherit',
    pointerEvents: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E")`,
    mixBlendMode: 'overlay',
    opacity: 0.6,
};
