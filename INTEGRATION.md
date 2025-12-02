# Immanence OS - Visual Redesign Integration Guide

## Step 1: Add Google Fonts to index.html

Add this inside `<head>` before any CSS:

```html
<!-- Immanence OS Typography -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600&family=Crimson+Pro:ital,wght@0,300;0,400;0,500;1,300;1,400&family=JetBrains+Mono:wght@400&display=swap" rel="stylesheet">
```

**Fonts included:**
- **Cinzel** — Ancient/classical display font for headings, labels, buttons
- **Crimson Pro** — Elegant serif for body text, descriptions
- **JetBrains Mono** — Technical font for stats, numbers

---

## Step 2: Add immanence.css

Copy `immanence.css` to your `/src/` folder and import it in your main entry point:

```jsx
// In main.jsx or App.jsx
import './immanence.css';
import './App.css'; // Keep existing if needed
```

The CSS establishes:
- Custom properties (colors, shadows, spacing)
- Component classes (panel-ornate, btn-glow, pill-group, etc.)
- Typography system
- Fixed rune ring animation (wrapper-based rotation)

---

## Step 3: Replace PracticeSection.jsx

Swap your existing `/src/components/PracticeSection.jsx` with the new one.

**Key changes:**
- Uses new CSS classes instead of Tailwind-only styling
- Same logic, completely new visual treatment
- Ornate panel with corner decorations
- Glowing gold buttons
- Proper typographic hierarchy

---

## Step 4: Fix Rune Ring Rotation (Avatar.jsx)

The CSS now includes `.rune-ring-wrapper` class. Update `RuneRingLayer` in Avatar.jsx:

```jsx
function RuneRingLayer({ stage = "flame" }) {
  const glowColor = STAGE_RUNE_COLORS[stage] || STAGE_RUNE_COLORS.flame;

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {/* Wrapper div rotates, img stays still inside */}
      <div className="rune-ring-wrapper w-[88%] h-[88%]">
        <img
          src="/sigils/rune-ring.png"
          alt="Rune ring"
          className="w-full h-full object-contain"
          style={{
            filter: `drop-shadow(0 0 18px ${glowColor}) drop-shadow(0 0 42px ${glowColor})`,
          }}
        />
      </div>
    </div>
  );
}
```

The rotation now applies to the wrapper `<div>`, not the `<img>` directly. This fixes the CSS transform issue.

---

## Step 5: Update Background (optional but recommended)

The current Background.jsx is fine, but consider updating vignette color to match:

```jsx
// In Background.jsx, update the vignette to have slight gold tint:
<div 
  className="absolute inset-0"
  style={{
    background: "radial-gradient(circle at 50% 50%, transparent 30%, rgba(5, 5, 8, 0.6) 100%)",
  }}
/>
```

---

## Visual System Summary

### Color Palette
- **Gold bright:** `#fcd34d` — Primary accent, active states
- **Gold mid:** `#f59e0b` — Secondary accent, glows
- **Gold deep:** `#b45309` — Shadows, depth
- **Background void:** `#050508` — Deepest black
- **Background surface:** `#0f0f1a` — Panel backgrounds

### Typography Scale
- **Display (Cinzel):** Labels, buttons, headings — ALL CAPS, wide tracking
- **Body (Crimson Pro):** Descriptions, paragraphs — Elegant, readable
- **Mono (JetBrains):** Stats, numbers, technical data

### Component Classes
- `.panel-ornate` — Main container with glow and texture
- `.corner-ornament` — Adds decorative corner marks
- `.btn-glow` — Primary action button (gold gradient)
- `.pill-group` + `.pill-option` — Segmented selector
- `.preset-chip` — Small selection buttons
- `.input-ornate` — Text inputs
- `.divider-ornate` — Section divider with center mark
- `.tap-target` — Interactive tap area
- `.timer-display` — Large time display
- `.label-uppercase` — Small uppercase labels
- `.stat-row` — Label/value pair row
- `.footer-mark` — Bottom attribution

---

## Next Steps

Once integrated, apply the same visual vocabulary to:
1. **WisdomSection** — Same panel style, ornate tabs
2. **NavigationSection** — Goal chips as preset-chips
3. **ApplicationSection** — Gesture tracker with ornate styling
4. **HomeHub buttons** — Replace with panel-ornate + corner ornaments

The system is designed to be consistent across all sections.
