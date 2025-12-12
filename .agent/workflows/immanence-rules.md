---
description: Rules for working on Immanence OS
---

## EXISTING ANTIGRAVITY RULES

1. Avoid multi-line replacements.
2. Use single-line anchors for edits (target a unique line).
4. Always increment the build version on the HUB page (App.jsx) when making changes.

## MANDATORY RULES

1. **NEVER restore from git** without explicit user permission
2. **ALWAYS increment version** in App.jsx after ANY code change
3. **READ-ONLY mode for critical files** - show diff first, wait for approval:
   - MoonOrbit.jsx
   - MoonGlowLayer.jsx  
   - Avatar.jsx
4. **DO NOT guess** - if something is missing, ASK instead of improvising
5. **Small changes only** - one thing at a time, verify before next change

## PROTECTED FILES
These files must NEVER be edited without showing exact diff first:
- src/components/Avatar.jsx
- src/components/MoonOrbit.jsx
- src/components/MoonGlowLayer.jsx
