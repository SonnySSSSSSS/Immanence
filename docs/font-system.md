# Font System

This project uses a semantic typography system defined in `src/immanence.css`.

## Source of truth

- Font stacks: `--font-sans`, `--font-serif`, `--font-mono`
- Canonical weights: `--font-weight-regular`, `--font-weight-medium`, `--font-weight-semibold`, `--font-weight-bold`
- Tracking tokens: `--tracking-body`, `--tracking-label`, `--tracking-tight`, `--tracking-normal`, `--tracking-wide`, `--tracking-mythic`
- Type scale tokens: `--type-display-size`, `--type-h1-size`, `--type-h2-size`, `--type-h3-size`, `--type-body-size`, `--type-label-size`, `--type-caption-size`, `--type-metric-size`

Tailwind mappings live in `tailwind.config.js` under `theme.extend.fontFamily`, `fontWeight`, `letterSpacing`, and `fontSize`.

## Canonical role classes

- `.type-display`: hero and ceremonial titles
- `.type-h1`: primary section heading
- `.type-h2`: secondary heading and card title
- `.type-h3`: tertiary heading and key item title
- `.type-body`: paragraph and descriptive copy
- `.type-label`: uppercase UI labels, nav/button labels, small metadata headers
- `.type-caption`: auxiliary helper text and micro-copy
- `.type-metric`: numeric KPIs, counters, percentages, and durations

## How to choose roles

1. Start with semantic role, not visual size.
2. Use `.type-metric` for any number intended to be compared across cards or screens.
3. Use `.type-label` for short uppercase control labels; do not hand-tune `letter-spacing` per component.
4. If a true new type role is required, add it globally in `src/immanence.css` and reuse it; avoid local inline `fontFamily`, `fontWeight`, or `letterSpacing`.
