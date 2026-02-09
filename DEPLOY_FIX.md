# GitHub Pages Deployment Fix

## Problem

**Symptom**: GitHub Pages shows stale content (Last-Modified: Jan 23, 2026)

**Root Cause**: `npm run deploy` was wired to the `gh-pages` npm package, which can hit Windows command-line limits (`spawn ENAMETOOLONG`) when the publish directory contains lots of files/long paths. In this repo, `dist/` was bloated because Vite copies `public/` verbatim — and `public/comfyui/` contained a full Node project including `node_modules/`, adding ~1,400 extra files to the publish set.

**Evidence**:
```bash
# Check live site headers:
powershell -NoProfile -Command "Invoke-WebRequest -UseBasicParsing -Method Head -Uri 'https://sonnysssssss.github.io/Immanence/' | Select-Object -ExpandProperty Headers"
```

Output shows:
- Last-Modified: Fri, 23 Jan 2026 04:50:11 GMT (17 days old)
- ETag: "6972fe03-7aa" (unchanged)

## Solution

Use **direct git deployment** instead of the `gh-pages` npm package.

### Option 0: Fix the underlying `dist/` bloat (Recommended)

Move server/tool projects out of `public/` so Vite doesn’t ship them to the web build. In particular, `public/comfyui/` should not live under `public/` (it included `node_modules/` and caused most of the deploy failure surface).

### Option 1: Use `deploy-direct.bat` (Recommended)

A new non-interactive script that deploys directly via git commands:

```bash
deploy-direct.bat
```

**What it does**:
1. Builds the app (`npm run build`)
2. Switches to `gh-pages` branch
3. Clears old files (except `.git`)
4. Copies `dist/*` to root
5. Commits and force-pushes to `origin gh-pages`
6. Returns to original branch

**Advantages**:
- ✅ Avoids Windows path-length issues
- ✅ No npm package dependencies
- ✅ Non-interactive (scriptable)
- ✅ Clear error messages
- ✅ Auto-returns to original branch

### Option 2: Use `backup-and-deploy.bat` (Interactive)

The existing batch file has a working deployment option (menu option 4):

```bash
backup-and-deploy.bat
# Select option 4: Deploy to GitHub Pages
```

**Note**: This requires manual menu selection.

### Option 3: Update `package.json` Deploy Script

Replace the `gh-pages` package with the direct deployment:

**Current** (broken):
```json
"deploy": "gh-pages -d dist"
```

**Option A** - Use batch script:
```json
"deploy": "deploy-direct.bat"
```

**Option B** - Use Node (cross-platform, avoids long arg lists):
```json
"deploy": "node scripts/deploy-gh-pages.mjs --no-build"
```

## Testing the Fix

### Step 1: Test Build

```bash
npm run build
```

**Expected**: Should complete without errors and create `dist/` folder.

### Step 2: Run Direct Deploy

```bash
deploy-direct.bat
```

**Expected output**:
```
========================================
IMMANENCE - Direct Deploy to GitHub Pages
========================================

[1/4] Building application...
[BUILD] OK

[2/4] Saving current branch...
Current branch: main

[3/4] Switching to gh-pages branch...
[4/4] Cleaning old files and deploying...

Committing changes...
[gh-pages abc1234] Deploy: 02/09/2026 11:00:00
 XX files changed, XX insertions(+), XX deletions(-)

Pushing to GitHub Pages...
Enumerating objects: XX, done.
...

Returning to main...
========================================
DEPLOYMENT COMPLETE
========================================

Live at: https://sonnysssssss.github.io/Immanence/
```

### Step 3: Verify Deployment

Wait 1-2 minutes for GitHub Pages to update, then check:

```bash
# Check headers
powershell -NoProfile -Command "Invoke-WebRequest -UseBasicParsing -Method Head -Uri 'https://sonnysssssss.github.io/Immanence/?v=%RANDOM%' | Select-Object -ExpandProperty Headers"
```

**Expected**:
- `Last-Modified` should be recent (today's date)
- `ETag` should be different from "6972fe03-7aa"

**Check GitHub**:
- Visit: https://github.com/SonnySSSSSSS/Immanence/tree/gh-pages
- Verify recent commit in `gh-pages` branch

**Check Live Site**:
- Visit: https://sonnysssssss.github.io/Immanence/
- Verify changes are visible
- Check browser console for any errors

## Alternative Solutions

### Enable Windows Long Paths (Requires Admin)

If you prefer to keep using the `gh-pages` npm package:

1. **Enable via Registry** (requires admin):
   ```bash
   # Run as Administrator
   reg add HKLM\SYSTEM\CurrentControlSet\Control\FileSystem /v LongPathsEnabled /t REG_DWORD /d 1 /f
   ```

2. **Restart** your terminal/IDE

3. **Test**:
   ```bash
   npm run deploy
   ```

**Note**: This is a system-wide change and may have side effects.

### Move to Shorter Path

Rename `D:\Unity Apps\immanence-os` to `D:\imm`:
- Reduces base path length
- May allow `gh-pages` to work
- **Not recommended** - requires updating all scripts

## Recommended Workflow

Going forward, use this deployment flow:

```bash
# 1. Make your changes
# 2. Test locally
npm run dev

# 3. Build
npm run build

# 4. Deploy
deploy-direct.bat

# 5. Verify
# Wait 1-2 min, then visit https://sonnysssssss.github.io/Immanence/
```

Or use the all-in-one batch menu:
```bash
backup-and-deploy.bat
# Select option 5: All of the above
```

## Troubleshooting

### "fatal: A branch named 'gh-pages' already exists"
This is fine - the script will use the existing branch.

### "Could not checkout gh-pages"
Create the branch manually:
```bash
git checkout -b gh-pages
git push -u origin gh-pages
git checkout main
```

### "error: The following untracked working tree files would be overwritten"
Stash or commit your changes first:
```bash
git stash
deploy-direct.bat
git stash pop
```

### Deployment succeeds but site still stale
- Check GitHub Actions: https://github.com/SonnySSSSSSS/Immanence/actions
- Wait 2-5 minutes for CDN cache to clear
- Try hard-refresh: Ctrl+Shift+R
- Check repository settings → Pages → Branch is set to `gh-pages`

## Verification Checklist

After deployment:

- [ ] Build completes without errors
- [ ] `gh-pages` branch shows new commit on GitHub
- [ ] Commit timestamp matches deployment time
- [ ] Live site HTTP headers show recent `Last-Modified`
- [ ] Changes are visible on live site
- [ ] No console errors in browser DevTools
- [ ] Version number matches (check footer/DevPanel)
- [ ] Main branch still intact (not on `gh-pages`)

## Reference

**Files**:
- `deploy-direct.bat` - New non-interactive deployment script
- `backup-and-deploy.bat` - Existing interactive menu (option 4)
- `package.json` - Contains broken `"deploy": "gh-pages -d dist"`

**Branches**:
- `main` - Development branch (local source of truth)
- `gh-pages` - Deployment branch (auto-generated, force-pushed)

**URLs**:
- Live site: https://sonnysssssss.github.io/Immanence/
- Repo: https://github.com/SonnySSSSSSS/Immanence
- Pages settings: https://github.com/SonnySSSSSSS/Immanence/settings/pages
