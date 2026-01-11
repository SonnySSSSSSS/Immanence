# Development Server Management Guide

## Canonical Workspace

- Always work from the main project folder: `D:\Unity Apps\immanence-os`.
- Do not run, edit, or back up from any `.claude-worktrees/...` folders.
- Backup scripts and automation should target the main folder only.
- Dev server commands (`npm run dev`, `npm run build`, etc.) must be run in the main folder.

Why: Claude worktrees are temporary, isolated branches used for AI sessions and can cause port conflicts, stale caches, and mismatched versions. Treat them as scratch space only; copy changes back to the main folder before running or backing up.

## Problem: Multiple Servers, Version Mismatches, Port Conflicts

### Common Issues:
- Dev server running on multiple ports (5173, 5174, etc.)
- Browser showing old version even after code changes
- "Port in use" errors - server starts on 5174 instead of 5173
- Hot Module Replacement (HMR) not working
- **Hidden/orphaned Node processes** holding ports

## 🚨 Why Port 5174? The Hidden Process Problem

When Vite tries to start on port 5173 and finds it taken, it automatically moves to 5174. This happens because:

1. **Orphaned Node processes** - processes that don't show in your terminals but are still running
2. **Background processes** - sometimes Node processes survive when you close terminals
3. **VSCode integrated terminals** - can leave processes running when you switch workspaces

**You need to kill ALL Node processes before starting the dev server.**

## Quick Fix (Recommended Workflow)

### 1. Check What's Running
```powershell
Get-Process | Where-Object {$_.ProcessName -like "*node*"}
```

### 2. Reset Everything
```powershell
.\dev-reset.ps1
```

This script will:
- Find and show all Node processes (with PIDs and ports)
- Try to kill them
- Clear Vite cache (`node_modules/.vite`)
- Clear dist folder
- **Tell you if processes need admin rights**

### 3. If Processes Won't Die (Need Admin Rights)

**Right-click PowerShell → Run as Administrator**, then:
```powershell
.\dev-kill-admin.ps1
```

OR manually:
```powershell
taskkill /F /IM node.exe
```

### 4. Start Fresh
```powershell
npm run dev
```

Verify it says: `http://localhost:5173/` (NOT 5174!)

### 5. Force Browser Refresh
- **Hard refresh**: `Ctrl + Shift + R` or `Ctrl + F5`
- **Clear cache**: Open DevTools → Application → Clear site data

## Folder Hygiene Checklist

- Main folder: `D:\Unity Apps\immanence-os` (only active workspace)
- Avoid opening multiple VS Code windows for the same project
- If you ever worked in a worktree, copy changes back and close that window
- Verify `package.json` exists in your current directory before running `npm` scripts

## Backup Guidance

- Point all backup tools/scripts to `D:\Unity Apps\immanence-os`
- Exclude: `node_modules/`, `dist/`, `.vite/` caches
- Optional: include `public/`, `src/`, `docs/`, and config files (`vite.config.js`, `package.json`)

## Prevention Best Practices

### Before Starting Work:
1. Check for running servers:
   ```powershell
   Get-Process | Where-Object {$_.ProcessName -like "*node*"}
   ```

2. If any exist, stop them:
   ```powershell
   Stop-Process -Name node -Force
   ```

### During Development:
- **Use only ONE dev server** at a time
- If port changes (5173 → 5174), stop and restart
- Clear Vite cache when seeing stale code:
  ```powershell
  Remove-Item -Recurse -Force node_modules/.vite
  ```

### After Editing:
- Watch the terminal for HMR updates (should say "hmr update")
- If no HMR, do a hard refresh in browser
- If still stale, run `dev-reset.ps1`

## Version Check

Always verify version in the UI matches your code:
- Look at bottom of sidebar: `v3.X.X`
- Should match version in `src/App.jsx`

## Nuclear Option (If All Else Fails)

```powershell
# Stop everything
Stop-Process -Name node -Force

# Clear all caches
Remove-Item -Recurse -Force node_modules/.vite
Remove-Item -Recurse -Force dist
Remove-Item -Recurse -Force node_modules

# Reinstall
npm install

# Start fresh
npm run dev
```

## Pro Tips

1. **Bookmark port 5173**: Always use `http://localhost:5173/`
2. **Use Private/Incognito**: When testing, open in private window to avoid cache
3. **Watch the terminal**: Errors often show there first
4. **One terminal per project**: Don't accidentally run `npm run dev` twice
5. **Check before committing**: If version number changed, it should be visible immediately

## Quick Commands Reference

```powershell
# Kill all Node processes
Stop-Process -Name node -Force

# Clear Vite cache
Remove-Item -Recurse -Force node_modules/.vite

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```
