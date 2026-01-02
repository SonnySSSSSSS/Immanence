# Antigravity Rules

1. Avoid multi-line replacements.
2. Use single-line anchors for edits (target a unique line).
3. For large React files, rewrite the _entire file_ and paste manually.
4. Always increment the build version on the HUB page (App.jsx) when making changes.
5. Terminal Safety Policy:
   - **Safe to Auto-Execute**: `ls`, `dir`, `cat`, `grep`, `git status`, `git branch`, `npm run dev` (starting dev server), and non-destructive python analysis scripts.
   - **Always Require Confirmation**: `rm`, `del`, `rd`, `git push`, `git commit`, `git merge`, `npm install`, `npm publish`, `npx create-...`, and any script with potential side-effects outside project bounds.
6. **NO BROWSER VERIFICATION**: NEVER use browser verification tools (`browser_subagent`, `open_browser_url`, etc.). All verification is performed manually by the user. Do not attempt to read or interact with the DOM or live site.
