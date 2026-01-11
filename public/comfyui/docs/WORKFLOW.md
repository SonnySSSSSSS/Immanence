# Workflow: MCP ComfyUI Proxy

This document describes how to use the MCP-friendly ComfyUI proxy to generate assets and move them into a working directory with custom filenames.

## Overview
- Server: Node/TypeScript proxy to ComfyUI
- Default ports/paths: COMFY_BASE=http://127.0.0.1:8188, PORT=5050, WORK_DIR=./work
- Capabilities: send prompts, poll history, list local workflows, save buffers to disk with explicit filenames

## Quickstart
1) Install deps
```
npm install
```
2) Run in dev
```
npm run dev
```
3) Ensure ComfyUI is running (default 127.0.0.1:8188)

## Environment
Set as needed before start:
- COMFY_BASE: ComfyUI base URL
- WORK_DIR: where saved outputs land (will be created if missing)
- PORT: proxy port (default 5050)

## Endpoints
- GET /health → { ok, comfy, workDir }
- GET /workflows → lists ./workflows/*.json
- POST /generate → body: ComfyUI prompt JSON; forwards to /prompt
- GET /history/:id → forwards to /history/{id}
- POST /save → { bufferBase64, filename? } writes to WORK_DIR with sanitized name

## Custom filenames and moves
- Provide `filename` in /save to control the exact output name.
- All saves land in WORK_DIR; from there you can move/copy into your pipeline or other repos.
- The server logic is centralized in [src/tools/mcpComfyProxy.ts](../src/tools/mcpComfyProxy.ts) so it can be embedded or started as a standalone tool.

## Example calls
Health:
```
curl http://localhost:5050/health
```
Generate (prompt.json contains a ComfyUI graph):
```
curl -X POST http://localhost:5050/generate \
  -H "Content-Type: application/json" \
  -d @prompt.json
```
Poll history:
```
curl http://localhost:5050/history/12345
```
Save buffer with a chosen name:
```
curl -X POST http://localhost:5050/save \
  -H "Content-Type: application/json" \
  -d '{"bufferBase64":"<base64>","filename":"my-cover.png"}'
```

## Notes
- WORK_DIR is created automatically on start.
- Filenames are sanitized to avoid unsafe characters.
- Timeout defaults: 30s for generate, 15s for history.
