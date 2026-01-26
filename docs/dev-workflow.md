# Dev Workflow

## Dependency Restore (Recommended)

Use `npm ci` as the primary restore command (lockfile-consistent):

```bash
npm ci
```

If `npm run build` fails with something like `'vite' is not recognized`, first confirm the install is complete:

```powershell
Test-Path node_modules\\.bin
Get-ChildItem -Force node_modules\\.bin | Select-String -Pattern 'vite' -CaseSensitive
npm ls vite --depth=0
```

## Windows: EPERM / Native Binding Locked During `npm ci`

On Windows, `npm ci` / `npm install` can fail with `EPERM: operation not permitted, unlink ... .node` if a running `node.exe` process is holding a native binding (Vite dev server, preview server, tests, etc.).

1. Close all running Node-based processes (Vite dev server, preview, tests, Storybook, etc.).
2. Retry:
   - `npm ci`
3. If `EPERM` persists:
   - rerun from an elevated terminal (Run as Administrator), or
   - reboot, then run `npm ci` again.

