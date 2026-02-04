// Infographics components barrel export
// All charts and visualizations use shared design tokens for consistency

// Design tokens and utilities
export {
    STROKE,
    RADIUS,
    CHART_HEIGHT,
    RING_SIZE,
    ANIM,
    TYPOGRAPHY,
    DOMAIN_COLORS,
    METRIC_STATE_COLORS,
    ATTENTION_COLORS,
    TREND_COLORS,
    TOOLTIP_STYLES,
    ELEVATION,
    HERO_GLOW,
    getMetricState,
    getMetricStateColor
} from './tokens';

// Core components
export { ChartTooltip, useChartTooltip } from './ChartTooltip';
export { CircularProgress } from './CircularProgress';
export { StatCard } from './StatCard';
export { Sparkline } from './Sparkline';
export { TrendArrow } from './TrendArrow';

// Dashboard headers
export { PracticeDashboardHeader } from './PracticeDashboardHeader';
export { NavigationDashboardHeader } from './NavigationDashboardHeader';
export { ApplicationDashboardHeader } from './ApplicationDashboardHeader';

// Advanced charts
export { DonutChart } from './DonutChart';
export { HorizontalBarStack } from './HorizontalBarStack';
export { AreaLineChart } from './AreaLineChart';
