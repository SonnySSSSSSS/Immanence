import { startProxy } from './tools/mcpComfyProxy.js';

const PORT = Number(process.env.PORT || 5050);
const COMFY_BASE = process.env.COMFY_BASE;
const WORK_DIR = process.env.WORK_DIR;

startProxy({ port: PORT, comfyBase: COMFY_BASE, workDir: WORK_DIR });
