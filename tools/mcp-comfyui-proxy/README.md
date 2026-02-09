# MCP ComfyUI Proxy

Minimal MCP-friendly proxy to ComfyUI. Forwards prompts, fetches history, and saves generated files to a work directory with custom filenames.

The proxy server code now lives in [src/tools/mcpComfyProxy.ts](src/tools/mcpComfyProxy.ts). It can be imported as a tool or started directly from the entrypoint in [src/index.ts](src/index.ts).

## Requirements
- Node 18+
- ComfyUI running (default: http://127.0.0.1:8188)

## Install
```
npm install
```

## Env
- `COMFY_BASE` (default `http://127.0.0.1:8188`)
- `PORT` (default `5050`)
- `WORK_DIR` (default `./work`)

## Run
Dev:
```
npm run dev
```
Build+start:
```
npm run build
npm start
```

## Use as a tool/module
- Import and start inside another app:
```
import { startProxy } from './src/tools/mcpComfyProxy.js';

startProxy({ port: 5050, comfyBase: 'http://127.0.0.1:8188', workDir: './work' });
```
- The Express app (without starting a server) can be created via `createProxyApp()` for embedding.

## API
- `GET /health` → `{ ok, comfy, workDir }`
- `GET /workflows` → lists `./workflows/*.json`
- `POST /generate` → body = ComfyUI prompt JSON → forwards to `/prompt`
- `GET /history/:id` → forwards to `/history/{id}`
- `POST /save` → `{ bufferBase64, filename? }` writes to `WORK_DIR` (sanitizes name)

## File naming & moves
Use `filename` in `/save` to assign exact output name. Outputs land in `WORK_DIR` so you (or MCP client) can move/copy as needed.

## Example curl
```
# health
curl http://localhost:5050/health

# send prompt
curl -X POST http://localhost:5050/generate -H "Content-Type: application/json" -d @prompt.json

# poll history
curl http://localhost:5050/history/12345

# save buffer
curl -X POST http://localhost:5050/save -H "Content-Type: application/json" \
  -d '{"bufferBase64":"<base64>","filename":"my-image.png"}'
```
