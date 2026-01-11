# MCP ComfyUI Proxy Integration

**Last Updated:** January 11, 2026

This guide explains how to use the MCP ComfyUI proxy in Immanence OS workflows for AI-powered asset generation.

---

## Quick Start

### 1. Install Dependencies

Dependencies are already in `package.json` (`express` and `axios`). Install them:

```bash
npm install
```

### 2. Start the Proxy Server

From the project root:

```bash
node src/tools/runComfyProxy.js
```

The server will start on `http://localhost:5050` by default and connect to ComfyUI at `http://127.0.0.1:8188`.

**Expected output:**
```
MCP ComfyUI proxy running on http://localhost:5050 → http://127.0.0.1:8188
```

### 3. Verify the Proxy is Running

```bash
curl http://localhost:5050/health
```

Expected response:
```json
{
  "ok": true,
  "comfy": "http://127.0.0.1:8188",
  "workDir": "/absolute/path/to/work"
}
```

---

## Environment Configuration

The proxy respects these environment variables:

| Variable | Default | Purpose |
|----------|---------|---------|
| `PORT` | `5050` | Port to run proxy server on |
| `COMFY_BASE` | `http://127.0.0.1:8188` | ComfyUI base URL |
| `WORK_DIR` | `./work` | Directory to save generated assets |

**Example:**
```bash
PORT=3000 COMFY_BASE=http://192.168.1.100:8188 WORK_DIR=./custom-work node src/tools/runComfyProxy.js
```

---

## API Endpoints

### Health Check
```http
GET /health
```

Returns proxy status and configuration.

**Response:**
```json
{
  "ok": true,
  "comfy": "http://127.0.0.1:8188",
  "workDir": "/absolute/path/to/work"
}
```

---

### List Workflows
```http
GET /workflows
```

Lists all `.json` workflow files in the `./workflows` directory.

**Response:**
```json
{
  "workflows": [
    { "id": "avatar-gen", "file": "avatar-gen.json" },
    { "id": "sigil-render", "file": "sigil-render.json" }
  ]
}
```

---

### Generate (Submit Prompt)
```http
POST /generate
Content-Type: application/json

{ <ComfyUI prompt JSON> }
```

Submits a ComfyUI prompt and returns the generation ID.

**Request:**
```json
{
  "1": {
    "inputs": {
      "ckpt_name": "model.safetensors",
      "seed": 12345,
      "steps": 20,
      "cfg": 7.5,
      "sampler_name": "euler",
      "scheduler": "normal",
      "denoise": 1,
      "positive": "beautiful landscape",
      "negative": ""
    },
    "class_type": "KSampler"
  },
  "2": {
    "inputs": { "images": [[1, 0]] },
    "class_type": "VAEDecode"
  }
}
```

**Response:**
```json
{
  "prompt_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "number": 1
}
```

---

### Get History
```http
GET /history/:id
```

Fetches generation results and metadata for a given prompt ID.

**Request:**
```http
GET /history/a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

**Response:**
```json
{
  "a1b2c3d4-e5f6-7890-abcd-ef1234567890": {
    "outputs": {
      "2": {
        "images": [
          {
            "filename": "ComfyUI_00001_.png",
            "subfolder": "",
            "type": "output"
          }
        ]
      }
    },
    "status": { "status_str": "success" }
  }
}
```

---

### Save Output
```http
POST /save
Content-Type: application/json

{
  "bufferBase64": "<base64-encoded binary data>",
  "filename": "optional-name.png"
}
```

Saves a base64-encoded buffer to disk in the `WORK_DIR`.

**Request:**
```json
{
  "bufferBase64": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "filename": "avatar-gen-001.png"
}
```

**Response:**
```json
{
  "saved": "/absolute/path/to/work/avatar-gen-001.png"
}
```

If `filename` is omitted, a timestamp-based name is generated.

---

## Usage in React Components

### Example: Trigger Generation from UI

```javascript
// In a React component or service
async function generateAvatar(prompt) {
  try {
    // 1. Submit prompt to proxy
    const generateRes = await fetch('http://localhost:5050/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(comfyPrompt),
    });
    const { prompt_id } = await generateRes.json();
    console.log('Generation started:', prompt_id);

    // 2. Poll history until complete
    let complete = false;
    let result = null;
    while (!complete) {
      await new Promise(r => setTimeout(r, 1000)); // Wait 1s before polling
      const historyRes = await fetch(`http://localhost:5050/history/${prompt_id}`);
      const history = await historyRes.json();
      
      if (history[prompt_id]?.outputs) {
        result = history[prompt_id];
        complete = true;
      }
    }
    
    console.log('Generation complete:', result);
    return result;
  } catch (err) {
    console.error('Generation failed:', err);
  }
}
```

### Example: Download and Save Result

```javascript
async function saveGeneratedImage(historyData, filename) {
  const imageData = historyData.outputs[2].images[0];
  
  // Download image from ComfyUI
  const imgRes = await fetch(
    `http://127.0.0.1:8188/view?filename=${imageData.filename}`
  );
  const blob = await imgRes.blob();
  const buffer = await blob.arrayBuffer();
  const bufferBase64 = Buffer.from(buffer).toString('base64');

  // Save via proxy
  const saveRes = await fetch('http://localhost:5050/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      bufferBase64,
      filename,
    }),
  });
  
  const { saved } = await saveRes.json();
  console.log('Saved to:', saved);
}
```

---

## Integration with Immanence OS Workflow

### 1. Asset Generation Phase

When a user triggers asset generation in a Practice or Application session:

1. **UI Component** calls the generation endpoint with a ComfyUI prompt
2. **Proxy** submits to ComfyUI and returns a `prompt_id`
3. **Component** polls `/history/:id` until generation completes
4. **Component** displays result in the UI

### 2. Storage

Generated assets are automatically saved to `WORK_DIR` (default `./work/`) using the `/save` endpoint.

### 3. State Management

Store generation status in Zustand store (e.g., `assetGenStore.js`):

```javascript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAssetGenStore = create(
  persist(
    (set) => ({
      generations: {}, // { promptId: { status, result, timestamp } }
      addGeneration: (promptId, status) =>
        set((state) => ({
          generations: { ...state.generations, [promptId]: { status, timestamp: Date.now() } },
        })),
      updateGeneration: (promptId, result) =>
        set((state) => ({
          generations: {
            ...state.generations,
            [promptId]: { ...state.generations[promptId], status: 'complete', result },
          },
        })),
    }),
    { name: 'asset-gen-store' }
  )
);
```

---

## Troubleshooting

### Proxy Won't Start

```
Error: listen EADDRINUSE: address already in use :::5050
```

**Solution:** Another process is using port 5050. Either:
- Kill the process: `lsof -i :5050 | kill -9 $(awk 'NR!=1 {print $2}')`
- Use a different port: `PORT=3000 node src/tools/runComfyProxy.js`

---

### Cannot Connect to ComfyUI

```
Error: connect ECONNREFUSED 127.0.0.1:8188
```

**Solution:** Ensure ComfyUI is running:

```bash
# In another terminal
python -m comfyui.main

# Or check if it's running
curl http://127.0.0.1:8188/api/
```

---

### Generation Hangs / Polling Never Completes

**Solution:** Check ComfyUI's actual status at `http://127.0.0.1:8188/api/status`. If blocked, restart ComfyUI or reduce generation complexity.

---

### Work Directory Permission Error

```
Error: EACCES: permission denied, open './work/...'
```

**Solution:** Ensure the application has write access to `WORK_DIR`:

```bash
chmod -R 755 ./work
```

---

## Files

| File | Purpose |
|------|---------|
| [tools/mcpComfyProxy.js](../tools/mcpComfyProxy.js) | Proxy server implementation |
| [src/tools/runComfyProxy.js](../src/tools/runComfyProxy.js) | Entrypoint to start server |
| `package.json` | Dependencies: `express`, `axios` |

---

## Next Steps

1. Ensure ComfyUI is running locally
2. Start the proxy: `node src/tools/runComfyProxy.js`
3. Test the health endpoint: `curl http://localhost:5050/health`
4. Integrate `/generate` and `/history` calls into React components
5. Use `/save` to persist generated assets
