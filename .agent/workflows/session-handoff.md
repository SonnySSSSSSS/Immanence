---
description: Create a session handoff document for next session
---

# Session Handoff Protocol

## When to Use
Create a handoff document at the end of each work session to capture context for the next session.

## Standard Filename
**Location**: `C:\Users\trinh\.gemini\antigravity\brain\6ced001a-3761-41a8-b9de-7bdf77fca9dd\handoff.md`

Always use `handoff.md` - overwrite the previous one each session.

## Standard Template Structure

```markdown
# Session Handoff - [DATE]

## Next Session Goal
[One clear sentence describing what we'll work on next - the immediate next task]

---

## Key Files to Reference
[List the 3-5 most relevant files for the next task, with brief descriptions]

### [Category 1]
- `path/to/file.ext` - Description of what's relevant

### [Category 2]
- `path/to/file.ext` - Description of what's relevant

---

## What We Did This Session

### 1. [Feature/Task Name]
[2-3 sentences describing what was accomplished]

### 2. [Feature/Task Name]
[2-3 sentences describing what was accomplished]

[Continue as needed...]

---

## Current State
[Describe the current state of the feature/system - what's working, what's not]

---

## Implementation Notes for Next Session
[Specific technical notes, gotchas, or approaches to consider]

**Quick Pointers:**
- [Key insight 1]
- [Key insight 2]
- [Code snippet or reference if helpful]

---

## Quick Commands
```bash
# [Common command 1]
# [Common command 2]
```
```

## Guidelines

**Keep it CONCISE:**
- Next Session Goal: 1 sentence
- Key Files: 3-5 files max
- This Session Work: 2-3 items max, 2-3 sentences each
- Current State: 1-2 paragraphs max
- Implementation Notes: Actionable bullets only

**Focus on NEXT STEPS:**
- What needs to happen next
- Files that will be modified
- Specific technical considerations

**Avoid:**
- Long explanations of how things work
- Historical context beyond this session
- Documenting entire architecture
