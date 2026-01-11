# For Gemini/Antigravity - Quick Start Guide

## ⚠️ CRITICAL: Working Directory

**You MUST work in this directory:**
```
D:\Unity Apps\immanence-os
```

This is the **main repository** with all backup systems configured (`work-manager.bat`). Work directly here - backups are automatic!

---

## Before Making ANY Changes

### 1. Read the Worklog
```bash
cat docs/WORKLOG.md
```

Check if Claude has any files marked `IN-PROGRESS`.

### 2. Check Protected Files
These files need user approval before editing:
- `src/components/Avatar.jsx`
- `src/components/MoonOrbit.jsx`
- `src/components/MoonGlowLayer.jsx`

### 3. Create Your Worklog Entry
Add to `docs/WORKLOG.md`:

```markdown
## YYYY-MM-DD HH:MM - Gemini - STARTED

**Task**: What you're working on

**Files Modified**:
- (Will fill in when complete)

**Status**: STARTED
```

### 4. Increment Version
Edit `src/App.jsx` lines 392 and 466:
- Current: `v3.15.14`
- Your next: `v3.15.15` (or next available)

---

## What Claude Just Did (v3.15.6 - v3.15.14)

### Session Summary Fix
**Problem**: Session summary wasn't showing after stopping curriculum circuit practices.

**Files Changed**:
- `src/components/PracticeSection.jsx` - Lines 217-234, 476-484, 573-575
- Multiple version bumps

**DO NOT modify these specific line ranges** without coordination!

### Key Changes:
1. Added `activeCircuitId` initialization for curriculum circuits
2. Circuit detection in `handleStop()`
3. Instrumentation-based duration calculation
4. Removed broken portal modal, added inline config card
5. Fixed `SacredTimeSlider` props
6. Cleaned up image preloader

---

## Current State (v3.15.14)

### ✅ Working:
- Curriculum circuit sessions show summary properly
- Session stats tracked via instrumentation
- Practice configuration screen functional
- Image preloading cleaned up

### 🔒 Locked Files (Claude is using):
None currently - Claude's work is COMPLETED

### 📂 Safe to Modify:
- Anything NOT in `src/components/PracticeSection.jsx` lines 217-234, 476-484, 573-575
- Styling, colors, text content
- New features in separate files
- Documentation

---

## Communication Protocol

### If You Need to Touch a Locked File:
1. Add `**CONFLICT**` note in your worklog entry
2. Ask user for guidance
3. Wait for approval

### When You're Done:
1. Update your worklog entry to `COMPLETED`
2. List all modified files with line numbers
3. Describe all changes
4. Include final version number

---

## Quick Commands

### Navigate to Main Directory:
```powershell
cd "D:\Unity Apps\immanence-os"
```

### Start Dev Server:
```powershell
# Kill any existing node processes first
taskkill /IM node.exe /F

# Start fresh
npm run dev
```

### Check Current Version:
```powershell
grep "v3\." src/App.jsx | head -2
```

### View Git Status:
```bash
git status
```

---

## File Structure Reference

```
immanence-os/
├── docs/
│   ├── WORKLOG.md              ← Check this FIRST
│   ├── MULTI_AI_WORKFLOW.md    ← Full protocol
│   ├── SESSION_SUMMARY_FIX.md  ← What NOT to touch
│   └── FOR_GEMINI.md           ← This file
├── src/
│   ├── components/
│   │   └── PracticeSection.jsx ← Lines 217-234, 476-484, 573-575 locked
│   ├── utils/
│   │   └── imagePreloader.js   ← Just cleaned up
│   └── App.jsx                 ← Increment version here
├── work-manager.bat            ← Backup system
└── ...
```

---

## Debugging Tips

### If Dev Server Won't Start on Port 5173:
```powershell
netstat -ano | findstr :5173
taskkill /PID <number> /F
```

### If Changes Don't Appear:
1. Hard refresh: `Ctrl + Shift + R`
2. Clear Vite cache: `Remove-Item -Recurse -Force node_modules\.vite`
3. Restart dev server

### If You See Old Code:
You might be in the wrong directory! Check:
```powershell
pwd
# Should show: D:\Unity Apps\immanence-os
```

---

## Need Help?

1. Read `docs/MULTI_AI_WORKFLOW.md` for complete workflow
2. Check `docs/WORKLOG.md` for recent changes
3. Read `docs/SESSION_SUMMARY_FIX.md` for technical details
4. Ask user for guidance

---

**Golden Rule**: Check `docs/WORKLOG.md` before touching ANY code file!
