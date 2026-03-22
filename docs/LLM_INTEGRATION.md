# LLM Integration Guide

Use docs/DOCS_INDEX.md for the current doc map.

## Overview

Immanence OS uses a configured LLM proxy for AI-powered validation in the Four Modes practice. The LLM validates:

- **Mirror** — Neutral, camera-observable language
- **Prism** — Interpretation consistency
- **Wave** — Emotional coherence
- **Sword** — Commitment clarity

The app sends requests through `src/services/llmService.js` to the endpoint defined by `VITE_LLM_PROXY_URL`, resolved by `src/config/runtimeEnv.js` (via `requireLlmProxyUrl()`), with runtime failure normalization in `src/utils/runtimeFailure.js`.

---

## Configuration

Set the proxy URL in your local environment:

```sh
VITE_LLM_PROXY_URL=http://localhost:8787
```

`src/services/llmService.js` posts Gemini-style requests to that URL and defaults to `gemini-1.5-flash` unless another model is provided in code.

---

## Testing Connection

1. Open DevPanel (`Ctrl+Shift+D`)
2. Scroll to "LLM Test Panel"
3. Click **"Test Connection"** — should show success
4. Click **"Test Mirror Validation"** — should return a JSON result

---

## API Reference

### checkLLMAvailability()

Sends an `OPTIONS` request to the configured proxy to verify it is reachable.

### validateMirrorEntry(mirrorEntry)

Validates a Mirror observation for neutral language.

### sendToLLMForJSON(systemPrompt, userPrompt, options)

General helper for JSON-response LLM calls through the configured proxy.

---

## Troubleshooting

### "Test Connection Failed"

1. Verify `VITE_LLM_PROXY_URL` is set correctly
2. Confirm the proxy endpoint responds to requests
3. Restart the dev server: `npm run dev`

### "NetworkError" / CORS Issues

1. Confirm the proxy allows requests from your app origin
2. Check browser console output for the failing request
3. Verify the proxy is reachable from the current machine

### Timeout Or Empty Response

1. Check the upstream provider and proxy logs
2. Confirm the proxy returns a Gemini-compatible response shape
3. Retry from the DevPanel LLM Test Panel after the proxy is healthy
