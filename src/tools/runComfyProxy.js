import { startProxy } from '../../tools/mcpComfyProxy.js';

/**
 * Entrypoint to start the MCP ComfyUI proxy server.
 * Environment variables:
 *   - PORT: server port (default 5050)
 *   - COMFY_BASE: ComfyUI base URL (default http://127.0.0.1:8188)
 *   - WORK_DIR: working directory for generated assets (default ./work)
 */

startProxy({
  port: Number(process.env.PORT || 5050),
  comfyBase: process.env.COMFY_BASE || 'http://127.0.0.1:8188',
  workDir: process.env.WORK_DIR || './work',
});
