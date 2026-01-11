import express, { Request, Response } from 'express';
import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';

export interface ProxyOptions {
  comfyBase?: string;
  port?: number;
  workDir?: string;
  generateTimeoutMs?: number;
  historyTimeoutMs?: number;
  logger?: (message: string) => void;
}

const defaultComfy = 'http://127.0.0.1:8188';
const defaultWorkDir = path.resolve('./work');

async function ensureWorkDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

function sanitizeFilename(name?: string) {
  if (!name) return `asset-${Date.now()}.bin`;
  return name.replace(/[^a-z0-9._-]/gi, '_');
}

function buildApp(options: Required<Pick<ProxyOptions, 'comfyBase' | 'workDir'>> & {
  generateTimeoutMs: number;
  historyTimeoutMs: number;
  logger: (message: string) => void;
}) {
  const { comfyBase, workDir, generateTimeoutMs, historyTimeoutMs, logger } = options;
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  app.get('/health', (_req: Request, res: Response) => {
    res.json({ ok: true, comfy: comfyBase, workDir });
  });

  app.get('/workflows', async (_req: Request, res: Response) => {
    try {
      const dir = path.resolve('./workflows');
      await fs.mkdir(dir, { recursive: true });
      const files = await fs.readdir(dir);
      const workflows = files
        .filter((f) => f.toLowerCase().endsWith('.json'))
        .map((f) => ({ id: path.parse(f).name, file: f }));
      res.json({ workflows });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'failed to list workflows' });
    }
  });

  app.post('/generate', async (req: Request, res: Response) => {
    try {
      const prompt = req.body;
      if (!prompt) return res.status(400).json({ error: 'prompt required' });
      const { data } = await axios.post(`${comfyBase}/prompt`, prompt, { timeout: generateTimeoutMs });
      res.json(data);
    } catch (err: any) {
      logger(err?.message || 'generate failed');
      res.status(500).json({ error: err?.message || 'comfy prompt failed' });
    }
  });

  app.get('/history/:id', async (req: Request, res: Response) => {
    try {
      const { data } = await axios.get(`${comfyBase}/history/${req.params.id}`, { timeout: historyTimeoutMs });
      res.json(data);
    } catch (err: any) {
      logger(err?.message || 'history failed');
      res.status(500).json({ error: err?.message || 'history fetch failed' });
    }
  });

  app.post('/save', async (req: Request, res: Response) => {
    try {
      const { bufferBase64, filename } = req.body as { bufferBase64?: string; filename?: string };
      if (!bufferBase64) return res.status(400).json({ error: 'bufferBase64 required' });
      await ensureWorkDir(workDir);
      const safeName = sanitizeFilename(filename);
      const dest = path.join(workDir, safeName);
      const buffer = Buffer.from(bufferBase64, 'base64');
      await fs.writeFile(dest, buffer);
      res.json({ saved: dest });
    } catch (err: any) {
      logger(err?.message || 'save failed');
      res.status(500).json({ error: err?.message || 'save failed' });
    }
  });

  return app;
}

export function startProxy(opts: ProxyOptions = {}) {
  const comfyBase = opts.comfyBase || process.env.COMFY_BASE || defaultComfy;
  const port = Number(opts.port ?? process.env.PORT ?? 5050);
  const workDir = opts.workDir || process.env.WORK_DIR || defaultWorkDir;
  const generateTimeoutMs = opts.generateTimeoutMs ?? 30000;
  const historyTimeoutMs = opts.historyTimeoutMs ?? 15000;
  const logger = opts.logger || console.log;

  const app = buildApp({ comfyBase, workDir, generateTimeoutMs, historyTimeoutMs, logger });
  const server = app.listen(port, async () => {
    await ensureWorkDir(workDir);
    logger(`MCP ComfyUI proxy running on http://localhost:${port} → ${comfyBase}`);
  });

  return { app, server, info: { comfyBase, workDir, port } };
}

export function createProxyApp(opts: ProxyOptions = {}) {
  const comfyBase = opts.comfyBase || process.env.COMFY_BASE || defaultComfy;
  const workDir = opts.workDir || process.env.WORK_DIR || defaultWorkDir;
  const generateTimeoutMs = opts.generateTimeoutMs ?? 30000;
  const historyTimeoutMs = opts.historyTimeoutMs ?? 15000;
  const logger = opts.logger || console.log;

  return buildApp({ comfyBase, workDir, generateTimeoutMs, historyTimeoutMs, logger });
}
