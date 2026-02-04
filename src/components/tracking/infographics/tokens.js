// Design contract tokens for infographics components
// All charts and components should use these for consistency

// Stroke widths by size
export const STROKE = { sm: 2, md: 3, lg: 4 };

// Corner radii
export const RADIUS = { sm: 4, md: 8, lg: 12 };

// Chart heights
export const CHART_HEIGHT = { sm: 60, md: 90, lg: 140 };

// Circular progress ring sizes
export const RING_SIZE = { sm: 60, md: 100, lg: 140 };

// Animation durations (ms)
export const ANIM = {
    mount: 300,    // CSS ease-out
    hover: 150,    // CSS ease
    counter: 600   // Mount only, never on update
};

// Typography scale
export const TYPOGRAPHY = {
    hero:   { size: 32, lineHeight: 1.1 },
    large:  { size: 24, lineHeight: 1.2 },
    medium: { size: 14, lineHeight: 1.4 },
    small:  { size: 11, lineHeight: 1.3 },
    micro:  { size: 9,  lineHeight: 1.2 }
};

// Domain colors (borders, icons, section titles)
export const DOMAIN_COLORS = {
    practice:    '#fcd34d', // Flame Gold
    navigation:  '#22d3ee', // Beacon Cyan
    wisdom:      '#a78bfa', // Stellar Violet
    application: '#f97316'  // Ember Orange
};

// Metric state colors (fills, indicators)
export const METRIC_STATE_COLORS = {
    excellent: '#3b82f6', // Blue (90%+)
    good:      '#14b8a6', // Teal (70-89%)
    moderate:  '#f59e0b', // Amber (50-69%)
    needsWork: '#f43f5e'  // Rose (<50%)
};

// Attention quality colors (Application domain only)
export const ATTENTION_COLORS = {
    absorbed:   '#10b981', // Green
    stable:     '#60a5fa', // Lighter blue
    settling:   '#fbbf24', // Amber
    distracted: '#f87171'  // Lighter red
};

// Trend arrow colors
export const TREND_COLORS = {
    up:      '#14b8a6', // Teal
    down:    '#f43f5e', // Rose
    neutral: '#6b7280'  // Gray
};

// Get metric state based on percentage
export function getMetricState(value, max = 100) {
    const pct = (value / max) * 100;
    if (pct >= 90) return 'excellent';
    if (pct >= 70) return 'good';
    if (pct >= 50) return 'moderate';
    return 'needsWork';
}

// Get color for a metric state
export function getMetricStateColor(value, max = 100) {
    return METRIC_STATE_COLORS[getMetricState(value, max)];
}

// Tooltip styles (shared across all charts)
export const TOOLTIP_STYLES = {
    bg: 'rgba(15, 15, 25, 0.95)',
    text: '#ffffff',
    fontSize: 11,
    padding: 4,
    borderRadius: 6
};

// Elevation styles (for non-hero elements)
export const ELEVATION = {
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
    border: '1px solid rgba(255, 255, 255, 0.1)'
};

// Hero glow (one per tab max)
export const HERO_GLOW = (color) => ({
    boxShadow: `0 0 20px ${color}40, 0 0 40px ${color}20`
});
