# Work Manager Scripts - Rebuild Summary

**Date**: 2026-01-25
**Status**: Rebuilt with robust logging, EPERM mitigation, and reliable error handling

## Changes Made

### 1. **work-manager.bat** (Main script - fully rebuilt)

#### Key Improvements:

**A) Persistent Shell & Logging**
- Shell stays open after each operation, returns to menu
- All operations logged to `logs/workmgr-YYYYMMDD-HHMMSS-<operation>.log`
- Logs directory created automatically at startup
- Every command prints what it's running and captures both stdout/stderr

**B) Option 1: Save Work (Commit + Push)**
- Creates timestamped log for every save operation
- Runs:
  1. `git status`
  2. `git add -A`
  3. `git commit -m "Work save: <date> <time> - v<version>"` (gracefully handles "nothing to commit")
  4. `git push origin HEAD:backup-latest` (no branch switch)
- Logs all output to `logs/workmgr-<timestamp>-save.log`
- Returns to menu on failure (never exits script)

**C) Option 2: Deploy with EPERM Mitigation**
- Creates timestamped log for every deploy operation
- Runs sequential steps with proper failure guards:
  1. `git status`
  2. `git fetch --prune`
  3. **`npm ci` with EPERM mitigation** (new robust logic):
     - Attempt 1: Normal `npm ci`
     - If fails with EPERM:
       - Kill `node.exe` processes (forcefully terminates dev server, etc.)
       - Kill `vite.exe` processes (if present)
       - Wait 2 seconds for cleanup
       - Remove `node_modules` using `rmdir /s /q`
       - If rmdir fails: use robocopy fallback (mirror empty dir, delete)
       - Attempt 2: Retry `npm ci`
       - If still fails: show most recent npm debug log path and pause
     - If fails without EPERM (genuine error): show error and pause (do NOT attempt build)
  4. `npm run build` (only if npm ci succeeded)
  5. `npm run deploy` (only if build succeeded)
- Logs all output to `logs/workmgr-<timestamp>-deploy.log`
- Returns to menu on any failure with proper error messages

**D) Control Flow Fix**
- Previously: logic flow was broken (goto deploy_fail but continued to success code)
- Now: Proper `if errorlevel` guards after each step prevent continuing on failure
- Build step NEVER runs if npm ci fails
- Deploy step NEVER runs if build fails

**E) Enhanced Error Messages**
- All errors show the full log path
- User can immediately review what happened
- npm debug log path shown when npm ci fails repeatedly

### 2. **work-manager-open.cmd** (Wrapper - unchanged)
- Remains as simple launcher: `cmd /k "work-manager.bat"`
- Double-clicking this opens the main menu

## EPERM Mitigation Strategy (Detailed)

### Problem
- Windows file locks on `.node` binaries prevent deletion during npm ci
- Typically happens when dev server or build process still has handles
- Standard rmdir fails with "Access denied"

### Solution
```
npm ci attempt 1
  └─ fails with EPERM?
     ├─ Yes:
     │  ├─ kill node.exe /F /T
     │  ├─ kill vite.exe /F /T
     │  ├─ wait 2s
     │  ├─ rmdir node_modules /s /q
     │  │  └─ fails?
     │  │     ├─ Yes: robocopy mirror + delete fallback
     │  │     └─ No: proceed
     │  └─ npm ci attempt 2
     │     ├─ succeeds: continue to build
     │     └─ fails: show npm debug log path + pause
     └─ No (genuine error):
        └─ show error + pause (do NOT build)
```

### Why This Works
- **taskkill /F /T**: Forces termination of process tree (children too)
- **2-second delay**: Allows Windows to fully release file handles
- **robocopy fallback**: Bypasses file lock with mirror-then-delete pattern
- **Single retry**: Most file locks release after process kill
- **Error classification**: Only attempts cleanup for EPERM, not for other npm failures

## Testing & Verification Checklist

### ✅ Test 1: Option 1 (Save Work) - No Changes
1. Open menu: `work-manager-open.cmd`
2. Select **1** (Save my work now)
3. Expected:
   - Shows current branch, version, status
   - `git status` shows clean
   - `git add -A` runs
   - `git commit` shows "[INFO] No changes to commit"
   - `git push origin HEAD:backup-latest` succeeds
   - Log created in `logs/workmgr-<timestamp>-save.log`

### ✅ Test 2: Option 1 (Save Work) - With Changes
1. Make a dummy edit: `echo test >> test.txt`
2. Open menu: `work-manager-open.cmd`
3. Select **1** (Save my work now)
4. Expected:
   - `git status` shows `test.txt` as untracked
   - `git add -A` stages it
   - `git commit` succeeds with message "Work save: ... - v<version>"
   - `git push origin HEAD:backup-latest` succeeds
   - Log shows all steps completed
   - `git status` now shows clean (file on backup-latest)

### ✅ Test 3: Option 2 (Deploy) - Clean EPERM Scenario
**Setup**: Start dev server before deploy to lock node_modules
1. Open terminal in repo: `npm run dev` (leave running)
2. Open another terminal in repo: `work-manager-open.cmd`
3. Select **2** (Deploy to web)
4. Expected:
   - `git status` succeeds
   - `git fetch --prune` succeeds
   - `npm ci` **fails with EPERM**
   - Script detects EPERM and shows:
     - "[NPM] Detected EPERM file lock; attempting cleanup..."
     - "[NPM] Killing node.exe processes..."
     - "[NPM] Removing node_modules..."
     - "[NPM] Attempt 2: npm ci (retry after cleanup)"
   - If dev server was the only lock: `npm ci` **succeeds on retry**
   - Build and deploy proceed normally
   - Log at `logs/workmgr-<timestamp>-deploy.log` shows full flow

### ✅ Test 4: Option 2 (Deploy) - EPERM Still Fails
**Setup**: Something else holding locks (stubborn process)
1. Don't have extra processes running
2. Open menu: `work-manager-open.cmd`
3. Select **2** (Deploy to web)
4. If `npm ci` still fails after cleanup:
   - Script shows npm debug log path:
     - Example: `%LOCALAPPDATA%\npm-cache\_logs\2026-01-25T12-34-56-789Z-debug-0.log`
   - User can inspect that file
   - Script returns to menu (does NOT attempt build)

### ✅ Test 5: Logging Verification
1. Run any operation (save or deploy)
2. Check logs folder: `ls -la logs/`
3. Expected:
   - `workmgr-<timestamp>-save.log` (if save)
   - `workmgr-<timestamp>-deploy.log` (if deploy)
   - Contains all command output (stdout + stderr)
   - Contains timestamps and status messages

### ✅ Test 6: Menu Return & Persistence
1. Run any operation and let it complete/fail
2. Expected:
   - Script prints "[WORK SAVED SUCCESSFULLY]" or "[FAILED]"
   - Prompts "pause"
   - User presses Enter
   - **Menu reappears** (shell stays open)
   - Can run another operation without restarting script

## Log File Structure

Example: `logs/workmgr-20260125-143022-deploy.log`

```
============================================
============================================
DEPLOY START  01/25/2026 14:30:22
Repo: D:\Unity Apps\immanence-os
============================================
============================================

---- git status ----
CMD: git status
On branch working
...

---- npm ci (with EPERM mitigation) ----
[NPM] Attempt 1: npm ci
...
[NPM] Detected EPERM file lock; attempting cleanup...
[NPM] Killing node.exe processes...
...
[NPM] Attempt 2: npm ci (retry after cleanup)
...

---- npm run build ----
...

---- npm run deploy ----
...

============================================
DEPLOY SUCCESS  01/25/2026 14:35:18
Log: logs/workmgr-20260125-143022-deploy.log
============================================
```

## Rollback Plan

If issues arise:
1. **No code changes needed**: All logic is in batch scripts
2. **To revert**: `git checkout work-manager.bat`
3. **To restore original**: Check git history for previous version

## Files Modified

| File | Status | Changes |
|------|--------|---------|
| `work-manager.bat` | ✅ MODIFIED | Rebuilt with logging, EPERM mitigation, proper control flow |
| `work-manager-open.cmd` | ✓ UNCHANGED | Still simple wrapper (no changes needed) |

## Key Features Summary

| Feature | Option 1 | Option 2 | All |
|---------|----------|----------|-----|
| Timestamped logging | ✅ | ✅ | ✅ |
| Command echoing | ✅ | ✅ | ✅ |
| Error capture & display | ✅ | ✅ | ✅ |
| Persistent shell | ✅ | ✅ | ✅ |
| Menu return on failure | ✅ | ✅ | ✅ |
| EPERM mitigation | - | ✅ | - |
| Process cleanup | - | ✅ | - |
| npm debug log hints | - | ✅ | - |
| Graceful "nothing to commit" | ✅ | - | - |

## Next Steps

1. **Commit changes**:
   ```bash
   git add work-manager.bat
   git commit -m "Rebuild work-manager scripts: robust logging, backup push, deploy with npm EPERM handling"
   ```

2. **Test in order**:
   - Test 1 (save, no changes)
   - Test 2 (save, with changes)
   - Test 3 (deploy, with dev server running)
   - Test 4 (deploy, clean state)
   - Test 5 (verify logs)
   - Test 6 (menu persistence)

3. **Verify production**:
   - Use Option 1 to save current work
   - Use Option 2 to deploy to GitHub Pages
   - Confirm deployment succeeds

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "logs not created" | Script creates `logs/` auto at startup |
| "npm ci still fails after EPERM cleanup" | Check `%LOCALAPPDATA%\npm-cache\_logs\` for details |
| "build runs even though npm ci failed" | This is fixed; build NEVER runs if npm ci fails |
| "script closes instead of returning to menu" | This is fixed; shell is persistent, always returns to menu |
| "vite not recognized" | This only happens if npm ci failed; EPERM mitigation should prevent this |

---

**Built**: 2026-01-25
**Tested**: [pending user verification]
**Author**: Claude Code
**Status**: Ready for testing
