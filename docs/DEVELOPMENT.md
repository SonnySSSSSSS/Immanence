# Development Guide

## Environment Setup

### Prerequisites

- Node.js 18+
- npm or pnpm
- Git
- Ollama (for AI validation)

### Clone & Install

```bash
# Clone repository
git clone https://github.com/SonnySSSSSSS/Immanence.git immanence-os
cd immanence-os

# Install dependencies
npm install
```

### Ollama Setup (Optional but Recommended)

```bash
# Install Ollama from https://ollama.com/
ollama pull gemma3:1b
```

---

## Running the Dev Server

> Canonical workspace: always run from `D:\Unity Apps\immanence-os`. Do not run from `.claude-worktrees/...` — those are temporary AI worktrees and can cause mismatched versions and port conflicts.

```bash
# Start development server
npm run dev

# Opens at http://localhost:5175/Immanence/
```

### DevPanel Access

Press **Ctrl+Shift+D** to open the developer panel for:
- Avatar preview with stage/path selection

### Server Hygiene

Use the helper scripts when ports or versions get stuck:

```powershell
- Lunar progress controls
- Path ceremony triggers
- Attention tracking data
- LLM connection testing
- Data management (export/import/reset)

---

Expected port: `http://localhost:5173/`. If Vite starts on `5174`, another process is holding `5173`. Run the reset scripts and try again from the main folder.

## Project Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run deploy` | Deploy to GitHub Pages |

---

## Key Coding Rules

### From `.agent/workflows/immanence-rules.md`:

1. **Avoid multi-line replacements** — Use single-line anchors for edits
2. **Always increment version** — Update `App.jsx` build version after changes
3. **Protected files require approval:**
   - `Avatar.jsx`
   - `MoonOrbit.jsx`
   - `MoonGlowLayer.jsx`
4. **Small changes only** — One thing at a time, verify before next change
5. **Never restore from git** without explicit user permission

---

## Backup & Restore

### Project Structure

| Path | Purpose |
|------|---------|
| `D:\Unity Apps\immanence-os` | Main development folder |
| `D:\Unity Apps\immanence-os-backup` | Git backup repository |

### Normal Backup Flow

```
immanence-os → immanence-os-backup → GitHub (branch: backup-latest)
```

### Restore Flow

1. Identify commit in backup repo
2. Checkout that commit in `immanence-os-backup`
3. Copy files from backup INTO `immanence-os`
4. **Never** run git reset/restore in the main folder

---

## State Persistence

All Zustand stores use the `persist` middleware with localStorage:

```javascript
export const useProgressStore = create(
  persist(
    (set, get) => ({ ... }),
    { name: 'immanence-progress', version: 1 }
  )
);
```

**Storage Keys:**
- `immanence-progress` — Sessions, streaks
- `immanence-chains` — Four Modes data
- `immanence-wave-profile` — Personality data
- `immanence-lunar` — Lunar tracking

To reset all data: DevPanel → Data Management → Clear All Data

---

## Building for Production

```bash
# Build
npm run build

# Preview build locally
npm run preview

# Deploy to GitHub Pages
npm run deploy
```

**Build Output:** `dist/`

---

## Troubleshooting

### "Module not found"

```bash
npm install
```

### Dev server won't start

```bash
# Clear cache
rm -rf node_modules/.vite
npm run dev
```

### LLM validation not working

1. Check Ollama is running: `ollama list`
2. Check DevPanel → LLM Test Panel → Test Connection
3. See [LLM_INTEGRATION.md](LLM_INTEGRATION.md)

### State corruption

DevPanel → Data Management → Clear All Data

Or manually clear localStorage:
```javascript
localStorage.clear();
location.reload();
```

---

## Contributing

1. Follow the coding rules above
2. Test changes in DevPanel before committing
3. Increment version in `App.jsx`
4. Run `npm run lint` before pushing
