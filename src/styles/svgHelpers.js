// src/styles/svgHelpers.js
// Reusable SVG visibility helpers for light/dark display modes.

export const getSvgVisibilityFilter = ({ isLight }) => {
  if (isLight) {
    return 'none';
  }

  // Adjust these values as necessary for contrast on dark backgrounds.
  return 'invert(1) brightness(1.75) contrast(1.25)';
};
