# Multi-AI Collaboration Workflow

## Purpose
This document defines the protocol for coordinating work between multiple AI assistants (Claude Code, Gemini/Antigravity, etc.) to prevent merge conflicts, code overwrites, and lost work.

## Core Principles

1. **Atomic File Ownership**: Only ONE AI works on a given file at a time
2. **Transparent Communication**: All changes are logged immediately
3. **Version Tracking**: Every change increments build version
4. **Session Isolation**: Each AI checks the worklog before starting work

## The Worklog System

### Location
`docs/WORKLOG.md` - Single source of truth for all AI activity

### Entry Format
```markdown
## YYYY-MM-DD HH:MM - [AI Name] - [Status]

**Task**: Brief description of what's being worked on

**Files Modified**:
- `path/to/file.ext` (lines X-Y, Z-W)
- `path/to/other.ext` (lines A-B)

**Changes**:
- Specific change 1
- Specific change 2

**Version**: vX.Y.Z

**Status**: [STARTED | IN-PROGRESS | COMPLETED | BLOCKED]

**Notes**: Any important context for other AIs

---
```

### Example Entry
```markdown
## 2026-01-04 15:30 - Claude Code - COMPLETED

**Task**: Fix session summary not showing for curriculum circuit practices

**Files Modified**:
- `src/components/PracticeSection.jsx` (lines 217-234, 476-484, 574-575)
- `src/App.jsx` (lines 392, 466) - version bump only

**Changes**:
- Added `setActiveCircuitId('curriculum')` when loading multi-leg curriculum
- Modified `handleStop()` to detect circuit sessions and delegate to `handleCircuitComplete()`
- Changed duration calculation to use instrumentation data instead of state variable
- Removed all debug console.logs

**Version**: v3.15.11

**Status**: COMPLETED

**Notes**:
- Circuit detection requires both `activeCircuitId` AND `circuitConfig` to be truthy
- Instrumentation provides accurate duration via `duration_ms` field
- This fixes curriculum Day 2 (which has 2 legs = circuit mode)

---
```

## Workflow Protocol

### Before Starting Work

1. **Read the Worklog** (`docs/WORKLOG.md`)
   - Check if any AI is currently working on target files
   - Read recent entries to understand current state

2. **Check for Conflicts**
   - If file is locked by another AI with status `IN-PROGRESS`, WAIT or coordinate
   - If status is `COMPLETED` or `BLOCKED`, safe to proceed

3. **Create START Entry**
   ```markdown
   ## 2026-01-04 16:00 - Gemini - STARTED

   **Task**: Update avatar particle effects for new stage colors

   **Files Modified**: (Will update when complete)
   - `src/components/Avatar.jsx`

   **Status**: STARTED
   ```

### During Work

1. **Update to IN-PROGRESS** once first change is made
   ```markdown
   **Status**: IN-PROGRESS
   ```

2. **Do NOT edit files locked by other AIs**
   - If you MUST touch a locked file, add a `**CONFLICT**` note and ask user

3. **Increment Version** in `src/App.jsx` after ANY code change
   - Patch version (+0.0.1) for bug fixes
   - Minor version (+0.1.0) for new features
   - Major version (+1.0.0) for breaking changes

### After Completing Work

1. **Update Entry to COMPLETED**
   - Fill in all modified files with line numbers
   - List all specific changes
   - Add final version number
   - Include any important notes for future work

2. **Commit Pattern** (if user requests git commit)
   ```
   [AI-Name] Brief description

   - Detailed change 1
   - Detailed change 2

   Version: vX.Y.Z
   Worklog: docs/WORKLOG.md entry YYYY-MM-DD HH:MM

   🤖 Generated with Claude Code/Gemini
   ```

## Conflict Resolution

### If Two AIs Modified Same File

1. **Detect Conflict**
   - User reports unexpected behavior
   - OR git shows merge conflict
   - OR version numbers are out of sync

2. **Resolution Steps**
   ```markdown
   ## 2026-01-04 16:30 - [AI Name] - CONFLICT DETECTED

   **Conflict**: File X was modified by both Claude (v3.15.11) and Gemini (v3.16.0)

   **User Action Required**:
   - Review both worklogs
   - Decide which changes to keep
   - Manually merge or ask AI to reapply changes
   ```

3. **Recovery**
   - User provides guidance
   - AI reapplies changes with updated worklog entry
   - New version number assigned

## File Lock Protocol

### Locking a File
When an AI starts work on a file, it's implicitly "locked" via worklog status `IN-PROGRESS`.

### Lock Duration
- Maximum 1 hour without update
- If no update for 1 hour, other AIs may assume abandoned
- User can manually unlock by marking status `COMPLETED` or `ABANDONED`

### Emergency Override
User can override any lock with explicit instruction:
> "Claude, ignore the lock on Avatar.jsx and proceed with changes"

## Special Files

### Protected Files (Require Explicit User Approval)
As defined in `CLAUDE.md`:
- `src/components/Avatar.jsx`
- `src/components/MoonOrbit.jsx`
- `src/components/MoonGlowLayer.jsx`

**Protocol**: Show diff, wait for user approval, then log in worklog

### Auto-Increment Files
- `src/App.jsx` - Version numbers only (safe to auto-increment)

### Worklog Itself
- `docs/WORKLOG.md` - APPEND ONLY, never modify existing entries
- Each AI adds new entry at TOP of file (after header)

## Version Synchronization

### Version Number Authority
The version in `src/App.jsx` is the single source of truth.

### Before Making Changes
1. Read current version from `src/App.jsx`
2. Increment appropriately
3. Log in worklog entry

### After Changes
1. Verify version in file matches worklog
2. User should see updated version in UI footer

## Communication Channels

### AI-to-AI (via Worklog)
- Status updates
- Blocking issues
- Important context

### AI-to-User
- Conflict detection
- Lock timeouts
- Completion notifications

### User-to-AI
- Override locks
- Resolve conflicts
- Approve protected file changes

## Daily Workflow Example

```markdown
# WORKLOG.md

## Active Sessions

### 2026-01-04 - Session Summary

- Claude Code: Fixed circuit session summary (v3.15.11) ✅
- Gemini: Avatar particle updates (v3.16.0) 🔄 IN-PROGRESS

---

## 2026-01-04 16:45 - Gemini - IN-PROGRESS

**Task**: Add new particle effects for Beacon stage

**Files Modified**:
- `src/components/Avatar.jsx` (lines TBD)
- `src/data/pathFX.js` (lines TBD)

**Status**: IN-PROGRESS

**Notes**: Waiting for user to approve avatar changes (protected file)

---

## 2026-01-04 15:30 - Claude Code - COMPLETED

**Task**: Fix session summary not showing for curriculum circuit practices

**Files Modified**:
- `src/components/PracticeSection.jsx` (lines 217-234, 476-484, 574-575)
- `src/App.jsx` (lines 392, 466)

**Changes**:
- Added circuit detection via activeCircuitId
- Use instrumentation for duration calculation
- Removed debug logging

**Version**: v3.15.11

**Status**: COMPLETED

---
```

## Maintenance

### Archiving Old Entries
When `WORKLOG.md` exceeds 1000 lines:
1. User creates `docs/archive/WORKLOG_YYYY_MM.md`
2. Moves entries older than 7 days to archive
3. Keeps "Active Sessions" section in main worklog

### Worklog Verification
User should periodically verify:
- Version numbers are sequential
- No duplicate version numbers
- All IN-PROGRESS items are actually active

## Summary

**Golden Rule**: Before touching ANY code file, check `docs/WORKLOG.md` first.

**Quick Checklist**:
- [ ] Read worklog for conflicts
- [ ] Create START entry
- [ ] Increment version in App.jsx
- [ ] Make changes
- [ ] Update entry to COMPLETED with details
- [ ] Verify version matches worklog

This ensures all AIs work in harmony without stepping on each other's toes.
