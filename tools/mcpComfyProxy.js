import express from 'express';
import axios from 'axios';

const defaultComfy = 'http://127.0.0.1:8188';

function buildApp(options) {
  const { comfyBase, logger } = options;
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
      logger(`Prompt submission failed: ${err?.message || 'unknown error'}`);
      res.status(500).json({ error: err?.message || 'comfyui prompt failed' });
    }
  });

  return app;
}

export function startProxy(opts = {}) {
  const comfyBase = opts.comfyBase || process.env.COMFY_BASE || defaultComfy;
  const port = Number(opts.port ?? process.env.PORT ?? 5050);
  const logger = opts.logger || console.log;

  return new Promise((resolve, reject) => {
    const app = buildApp({ comfyBase, logger });
    
    const server = app.listen(port, '127.0.0.1', () => {
      logger(`MCP ComfyUI proxy running on http://localhost:${port} → ${comfyBase}`);
      resolve({ app, server, info: { comfyBase, port } });
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        logger(`Port ${port} already in use`);
      } else {
        logger(`Server error: ${err.message}`);
      }
      reject(err);
    });
  });
}
