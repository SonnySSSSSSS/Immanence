---
description: Project structure and git restore rules for Immanence OS
---

# PROJECT STRUCTURE & GIT RULES FOR THIS WORKSPACE

## 1. CANONICAL PROJECT (EDIT HERE)
- **Path:** `D:\Unity Apps\immanence-os`
- This is the ONLY place where active development happens.
- All coding, refactors, and AI-generated changes MUST be applied in this folder.
- Do NOT clone another copy elsewhere and treat it as the main project.

## 2. BACKUP REPOSITORY (MIRROR + GITHUB)
- **Path:** `D:\Unity Apps\immanence-os-backup`
- This folder is a GIT REPOSITORY whose job is to mirror the canonical project.
- The branch used for backups is: `backup-latest`
- The backup script copies from:
    ```
    D:\Unity Apps\immanence-os  -->  D:\Unity Apps\immanence-os-backup
    ```
    then runs git add/commit/push from inside:
    ```
    D:\Unity Apps\immanence-os-backup
    ```

## 3. IMPORTANT DIRECTIONAL RULE

**Direction of truth for normal work:**
```
USER edits  ->  D:\Unity Apps\immanence-os  (SOURCE)
Backup script -> copies SOURCE to D:\Unity Apps\immanence-os-backup (TARGET)
Git pushes TARGET to GitHub (branch: backup-latest)
```

**Direction of truth for RESTORE:**
```
Git commit in backup repo (or GitHub)  ->  files copied BACK INTO
D:\Unity Apps\immanence-os
```

In other words:
- **NORMAL FLOW:**  `immanence-os  -->  immanence-os-backup  -->  GitHub`
- **RESTORE FLOW:** `GitHub/backup commit  -->  immanence-os-backup  -->  immanence-os`

**Never invert this silently.**
**Never treat immanence-os-backup as the main dev folder.**

## 4. HOW TO RESTORE CODE (WHAT "FROM" AND "TO" MEAN)

When the user says something like:
> "Restore the project to the state from [date]/[commit]"

You MUST follow this restore pipeline:

### STEP 1 – Identify the restore point (FROM)
- The restore source is ALWAYS A GIT COMMIT in the backup repository.
- You can get it in one of two ways:

  a) **Locally:**
     - Folder: `D:\Unity Apps\immanence-os-backup`
     - Run: `git fetch origin`
     - Check out the desired commit or backup-latest branch at that commit.

  b) **From GitHub:**
     - Branch: `backup-latest`
     - Pick the commit by date/message the user specifies.

### STEP 2 – Materialize that commit into the backup folder
- Work inside: `D:\Unity Apps\immanence-os-backup`
- Commands (example):
  ```bash
  git fetch origin
  git checkout backup-latest
  git reset --hard <target-commit-sha>
  ```
- At this point, `D:\Unity Apps\immanence-os-backup` contains the EXACT FILES
  the user wants to restore FROM.

### STEP 3 – Copy FROM backup TO canonical project
- **FROM:** `D:\Unity Apps\immanence-os-backup`
- **TO:** `D:\Unity Apps\immanence-os`
- Use a file-level copy (NOT a git reset inside the canonical folder):
  - Example:
    ```
    xcopy D:\Unity Apps\immanence-os-backup  ->  D:\Unity Apps\immanence-os
    ```
  - Overwrite files in immanence-os with those from immanence-os-backup
- Only after copying do you run/build/validate in the canonical folder.

### STEP 4 – NEVER do these actions automatically
- Do NOT run `git reset --hard`, `git checkout .`, or "restore from remote" directly
  inside `D:\Unity Apps\immanence-os` unless the user EXPLICITLY asks for that.
- Do NOT change branches, hard-reset, or pull remote changes into
  `D:\Unity Apps\immanence-os` on your own initiative.
- All destructive git operations MUST be done only in the backup repo:
  `D:\Unity Apps\immanence-os-backup`

## 5. WHAT "RESTORE THE PROJECT" MEANS IN THIS WORKSPACE

When the user says:
- "Restore to the version from yesterday"
- "Restore before the moon effect got overwritten"
- "Go back to my last good backup"

You should interpret it as:

1. Identify a commit in the BACKUP REPO (`immanence-os-backup`, branch `backup-latest`)
   that matches what they want.
2. Check out that commit in `immanence-os-backup`.
3. COPY those files into `immanence-os` (overwriting current files).
4. DO NOT run git restore/reset inside `immanence-os` unless the user explicitly
   says something like "I want a hard reset in the main repo."

## 6. SUMMARY FOR ANTIGRAVITY

| Purpose | Path |
|---------|------|
| Main editing folder | `D:\Unity Apps\immanence-os` (never do destructive git here) |
| Backup Git repo | `D:\Unity Apps\immanence-os-backup` (safe place to use git history) |
| Backup branch | `backup-latest` |

| Flow | Direction |
|------|-----------|
| NORMAL | copy `immanence-os` → `immanence-os-backup` → commit/push |
| RESTORE | pick commit in `immanence-os-backup` → copy back into `immanence-os` |
