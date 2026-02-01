Avatar assets (generic blocky style) with swappable facial expressions.

Files:
- avatar_blocky_neutral.svg
- avatar_blocky_happy.svg
- avatar_blocky_sad.svg

Implementation suggestion:
1) Use the neutral SVG as the base avatar.
2) Swap only the <g id="face"> or the whole SVG file for expression changes.
3) If you want runtime swapping without multiple files, inline the SVG and change the mouth path + eye shapes via DOM.

Why SVG:
- Perfect scaling (mobile/desktop)
- Tiny file size
- Easy expression swaps (just change a path)
- Can tint body colors with CSS variables later

If you must use PNG:
- Export at 1024px+ and use 1x/2x/3x variants.
