import express from 'express';
import axios from 'axios';

/**
 * Start the MCP ComfyUI proxy server.
 * Environment variables:
 *   - PORT: server port (default 5050)
 *   - COMFY_BASE: ComfyUI base URL (default http://127.0.0.1:8188)
 */

const comfyBase = process.env.COMFY_BASE || 'http://127.0.0.1:8188';
const port = Number(process.env.PORT || 5050);

const app = express();
app.use(express.json({ limit: '10mb' }));

app.get('/health', (_req, res) => {
  res.json({ ok: true, comfy: comfyBase });
});

app.post('/prompt', async (req, res) => {
  try {
    const prompt = req.body;
    if (!prompt || typeof prompt !== 'object') {
      return res.status(400).json({ error: 'prompt object required' });
    }
    
    const { data } = await axios.post(`${comfyBase}/prompt`, prompt, { timeout: 30000 });
    res.json(data);
  } catch (err) {
    console.error(`Prompt submission failed: ${err?.message || 'unknown error'}`);
    res.status(500).json({ error: err?.message || 'comfyui prompt failed' });
  }
});

const server = app.listen(port, '127.0.0.1', () => {
  console.log(`MCP ComfyUI proxy running on http://localhost:${port} → ${comfyBase}`);
});

server.on('error', (err) => {
  console.error(`Server error: ${err.message}`);
  process.exit(1);
});
