# LLM Integration Guide

STATUS: May be outdated if Four Modes has been removed/paused; verify before using.
Use docs/DOCS_INDEX.md for the current doc map.


## Overview

Immanence OS uses local LLM (Ollama) for AI-powered validation in the Four Modes practice. The LLM validates:

- **Mirror** — Neutral, camera-observable language
- **Prism** — Interpretation consistency
- **Wave** — Emotional coherence
- **Sword** — Commitment clarity

All processing happens locally. No data leaves your machine.

---

## Setup

### 1. Install Ollama

Download from [ollama.com](https://ollama.com/) and install.

### 2. Pull a Model

```bash
# Recommended: Small, fast model for validation
ollama pull gemma3:1b

# Alternative: Larger, more capable
ollama pull gemma2:2b
```

### 3. Verify Ollama is Running

```bash
# Check version
ollama --version

# List models
ollama list

# Test generation
ollama run gemma3:1b "Hello, can you respond?"
```

Ollama runs on `http://localhost:11434` by default.

---

## Configuration

### Vite Proxy (vite.config.js)

The app uses Vite's proxy to bypass CORS:

```javascript
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/ollama': {
        target: 'http://localhost:11434',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/ollama/, ''),
      },
    },
  },
});
```

### LLM Service (src/services/llmService.js)

```javascript
const USE_OLLAMA = true;
const WORKER_URL = USE_OLLAMA ? '/api/ollama' : 'https://your-worker.workers.dev';
const DEFAULT_MODEL = USE_OLLAMA ? 'gemma3:1b' : 'cloud-model-name';
```

---

## Testing Connection

1. Open DevPanel (Ctrl+Shift+D)
2. Scroll to "LLM Test Panel"
3. Click **"Test Connection"** — Should show ✓ Success
4. Click **"Test Mirror Validation"** — Should return JSON result

---

## API Reference

### checkLLMAvailability()

Pings Ollama to verify it's running.

```javascript
const result = await checkLLMAvailability();
// { available: true, model: 'gemma3:1b' }
```

### validateMirrorEntry(mirrorEntry)

Validates a Mirror observation for neutral language.

```javascript
const result = await validateMirrorEntry({
  context: { date: '2024-12-19', time: '3pm', location: 'office' },
  actor: 'my manager',
  action: 'raised his voice',
  recipient: 'while discussing the report'
});

// Returns:
{
  success: true,
  data: {
    verdict: 'clean' | 'issues_found',
    issues: [{ quote, type, suggestion }],
    overall_note: 'string'
  }
}
```

### sendToLLMForJSON(systemPrompt, userPrompt, options)

General function for JSON-response LLM calls.

```javascript
const result = await sendToLLMForJSON(
  'You are a validator. Respond in JSON.',
  'Validate this: ...',
  { model: 'gemma3:1b', stream: false }
);
```

---

## Troubleshooting

### "Test Connection Failed"

1. Is Ollama running? Check `ollama list`
2. Restart Ollama: Close and reopen the Ollama app
3. Check port: `http://localhost:11434` should respond

### "NetworkError" / CORS Issues

1. Make sure Vite proxy is configured
2. Restart dev server: `npm run dev`
3. Check browser console for specific error

### Timeout Errors

1. Use smaller model: `gemma3:1b` (1.5GB)
2. First request is slow (model loading)
3. Subsequent requests are faster

### Model Not Found

```bash
# Pull the model
ollama pull gemma3:1b

# Or use different model and update llmService.js
const DEFAULT_MODEL = 'your-model-name';
```

---

## Switching to Cloud API

If you want to use a cloud API instead of local Ollama:

1. Deploy Cloudflare Worker (in `/worker` folder)
2. Set API key as secret: `wrangler secret put API_KEY`
3. Update `llmService.js`:

```javascript
const USE_OLLAMA = false;
const WORKER_URL = 'https://your-worker.your-subdomain.workers.dev';
```

---

## Model Recommendations

| Model | Size | Speed | Quality | Use Case |
|-------|------|-------|---------|----------|
| gemma3:1b | 1.5GB | Fast | Good | Development, validation |
| gemma2:2b | 2GB | Medium | Better | Production |
| llama3:8b | 5GB+ | Slow | Best | Complex analysis |

For Four Modes validation, `gemma3:1b` is sufficient and recommended.

