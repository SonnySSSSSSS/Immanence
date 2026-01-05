# Antigravity Rules

1. Avoid multi-line replacements.
2. Use single-line anchors for edits (target a unique line).
3. For large React files, rewrite the _entire file_ and paste manually.
4. Always increment the build version on the HUB page (App.jsx) when making changes.
5. **TURBO EXECUTION POLICY (MANDATORY)**:
   - Always use `SafeToAutoRun: true` for `run_command` and `browser_subagent` calls that are part of standard dev/test workflows (build, lint, formatting, visual audit).
   - **DO NOT ASK FOR PERMISSION** for screenshots, build checks, or linting.
   - The user expects the agent to "just go" once a task is approved.
6. **BROWSER VERIFICATION ALLOWED**:
   - `browser_subagent` is permitted and encouraged for visual audits and state verification.
   - Always execute with `SafeToAutoRun` intent.
7. Terminal Safety Policy:

   - **Safe to Auto-Execute**: `ls`, `dir`, `cat`, `grep`, `git status`, `git branch`, `npm run dev`, `npm run build`, `npm run lint`, `npx prettier`.
   - **Confirmation Still Required**: Destructive ops like `rm` (except `node_modules`), `git push`, `git commit`.

8. **STOPPING IS FOR FAILURES ONLY**: Do not stop to report "success" on minor verification steps. Proceed to the next objective until the entire block is complete or a true error occurs.
