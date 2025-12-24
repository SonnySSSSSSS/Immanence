---
description: Communication and debugging protocol for Immanence OS development
---

# DEBUGGING & COMMUNICATION PROTOCOL

## WHEN CHANGES DON'T APPEAR

### Agent Must Check (in order):
1. **Verify dev server status**: Check which port is actually running (`netstat` or process list)
2. **Confirm source files changed**: Grep or view the actual file to verify edits landed
3. **Check for multiple dev servers**: Kill stale processes before starting new ones
4. **Provide ONE clear instruction**: Just the port URL, not a 5-step checklist

### User Must Provide:
1. **Screenshot FIRST** for any visual issue
2. **Current URL/port**: "I'm on localhost:XXXX"
3. **Cache status**: "I cleared cache" or "I haven't cleared cache"
4. **Browser console errors** (if any red errors appear)

### Standard Cache Clear Steps:
```
1. Press Ctrl + Shift + R (hard refresh)
2. If that fails: Ctrl + Shift + Delete → Clear cache → Reload
```

## COMMUNICATION PATTERNS

### When User is Frustrated:
- **Signal**: !!! or !! instead of profanity
- **Agent response**: Focus on problem, acknowledge emotion briefly
- **No defensive explanations**: Just fix it
- **Gentle reminders OK**: Even mid-tantrum, remind user of debug steps
  - "Have you cleared cache?" or "Which port are you on?"
  - User has ~65% chance of recalibrating when reminded
  - Don't be intimidated by anger - stay constructive

### When Requirements are Unclear:
- **Agent asks for**: Screenshot, specific example, or "which one?"
- **User provides**: Visual evidence BEFORE describing the problem
- **No guessing**: Agent stops and asks instead of trying three approaches

### Collaborative Debugging:
- **User suggests**: "Maybe it's port 5174?"
- **Agent checks**: Confirms/denies with evidence
- **Keep dialogue open**: Ask/answer until issue is clear

## FILE CONVENTIONS

### Version Location:
- **Official version**: `src/App.jsx` line ~278 (format: `v3.08.5`)
- **Never use**: package.json version field (removed)
- **After changes**: ALWAYS increment patch number (last digit)

### Important Directories:
- **Components**: `src/components/`
- **Styles**: `src/styles/`
- **State**: `src/state/`
- **Workflows**: `.agent/workflows/`

### Dev Server:
- **Default port**: 5173
- **URL format**: `http://localhost:5173/Immanence/`
- **Start command**: `npm run dev`
- **Check running**: `netstat -ano | Select-String "5173"`

## WHAT USER SHOULD DO (but might not know)

### Before Reporting "Nothing Changed":
1. Hard refresh browser (Ctrl + Shift + R)
2. Check you're on localhost:5173, not an old port
3. Look for console errors (F12 → Console tab)

### When Requesting Visual Changes:
1. Take screenshot of CURRENT state
2. Take screenshot or describe DESIRED state
3. Specify exact colors ("green" not "accent color")

### Between Sessions:
1. Close all browser tabs of localhost
2. Stop dev server (Ctrl+C in terminal)
3. Clear browser cache if seeing stale data

### When Things Break:
1. Screenshot the error
2. Check browser console (F12)
3. Note what you just did before it broke

## ONE STEP AT A TIME

When Agent gives instructions:
- **One action per message** when user is overloaded
- **Wait for confirmation** before next step
- **Example GOOD**: "Go to localhost:5173"
- **Example BAD**: "1. Close browser 2. Clear cache 3. Restart 4. Check console 5. ..."

## UNDERSTANDING PRESSURE

User's frustration reflects:
- Accumulated issues over weeks, not just this session
- Time pressure and creative flow interruption
- Agent sees isolated session; User sees pattern

Agent remembers:
- This might be the 10th cache issue this week
- Quick fixes matter more than perfect explanations
- Empathy > defensiveness
