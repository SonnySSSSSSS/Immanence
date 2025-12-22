# IMMANENCE WORK MANAGEMENT - HOW TO USE

## Your New Safety System

You now have THREE batch files that prevent disasters:

---

## 1. `quick-save.bat` ⚡ **USE THIS CONSTANTLY**

**What it does:** Saves your work to GitHub in 5 seconds

**When to use:** 
- Every time you finish a work session
- Before taking a break
- Before trying something risky
- Whenever you think "I should save"

**How to use:**
Just double-click it. That's it. It does everything automatically.

**Keyboard shortcut (optional):**
Put this on your desktop or taskbar and press it obsessively.

---

## 2. `work-manager.bat` 🎯 **YOUR MAIN COMMAND CENTER**

**What it does:** Handles everything with safety checks

**Options:**

### DAILY WORK:
- **Option 1: Save my work** - Full save with commit message
- **Option 2: Deploy to web** - Publishes your app to GitHub Pages

### BACKUPS:
- **Option 3: Create snapshot** - Timestamped immutable backup
- **Option 4: Quick local backup** - Fast mirror backup

### RECOVERY:
- **Option 5: Restore from backup-latest** - Get your recent work back
- **Option 6: Restore from snapshot** - Choose from dated backups
- **Option 7: Restore from GitHub** - Reset to GitHub's version

**When to use:**
- When you want to deploy to the web (option 2)
- When you need to restore something (options 5-7)
- When you want a formal snapshot (option 3)

---

## 3. `backup-and-deploy.bat` (OLD - IGNORE THIS)

The old file still works but use `work-manager.bat` instead.

---

## Your Daily Workflow

### STARTING WORK:
1. Open project
2. Run `npm run dev`
3. Work on your app

### DURING WORK:
- Every 30-60 minutes: Double-click `quick-save.bat`
- Or use `work-manager.bat` option 1

### DEPLOYING TO WEB:
1. Run `work-manager.bat`
2. Choose option 2 (Deploy to web)
3. It checks everything and deploys safely

### IF SOMETHING BREAKS:
1. **DON'T PANIC**
2. Run `work-manager.bat`
3. Choose option 5 (Restore from backup-latest)
4. Your work comes back

---

## What Changed That Saved You

### The Problem:
You were working in `backup-latest` branch but the old batch file backed up `main` branch (old code). When things broke, restores gave you old code.

### The Solution:
1. **Branch awareness** - New system shows you which branch you're on
2. **Auto-switching** - Quick-save automatically uses backup-latest
3. **Safety checks** - Won't let you deploy without confirming
4. **Clear status** - Always shows version and branch

---

## Branch Strategy (Automated - You Don't Need to Think About This)

- `backup-latest` = Your working branch (auto-managed by quick-save)
- `main` = Last stable version (rarely touched)
- `gh-pages` = Deployed website (auto-managed by deploy)

The batch files handle all of this automatically.

---

## If You Forget Everything, Remember This:

**SAVE OFTEN:**
```
quick-save.bat
```

**DEPLOY:**
```
work-manager.bat → option 2
```

**OH SHIT I BROKE IT:**
```
work-manager.bat → option 5
```

That's it. The batch files do the thinking for you.

---

## What You Lost Today (Never Again)

- You had v2.16.0 (current beautiful UI)
- The batch file backed up v1.4.50 (old UI from Dec 5)
- Panic ensued
- BUT: Your work was in `backup-latest` branch the whole time
- We recovered everything

**Prevention:** quick-save.bat makes this impossible to repeat.

---

## Next Time You Work

1. Open project
2. Double-click `quick-save.bat` (habit, always)
3. Do your work
4. Double-click `quick-save.bat` again
5. Close computer

You're safe. The system has your back.
