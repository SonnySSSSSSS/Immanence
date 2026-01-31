#!/usr/bin/env node

/**
 * ComfyUI MCP Server
 *
 * Exposes ComfyUI asset generation as an MCP tool.
 *
 * Claude Code can then call:
 *   - generate-scene: Generate assets for a scene/layer
 *   - list-scenes: List available scenes
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class ComfyMCPServer {
  constructor() {
    this.tools = [
      {
        name: 'generate-scene',
        description: 'Generate Sakshi scene assets via ComfyUI',
        inputSchema: {
          type: 'object',
          properties: {
            scene: {
              type: 'string',
              description: 'Scene name: forest, city, office, beach, mountain',
              enum: ['forest', 'city', 'office', 'beach', 'mountain'],
            },
            layer: {
              type: 'string',
              description: 'Layer: background, midground, foreground (optional - generates all if not specified)',
              enum: ['background', 'midground', 'foreground'],
            },
            model: {
              type: 'string',
              description: 'Model preset: base (slower, better quality) or turbo (fast)',
              enum: ['base', 'turbo'],
              default: 'turbo',
            },
            all: {
              type: 'boolean',
              description: 'Generate all scenes and layers',
              default: false,
            },
          },
          required: ['scene'],
        },
      },
      {
        name: 'list-scenes',
        description: 'List available Sakshi scenes and layers',
        inputSchema: { type: 'object', properties: {} },
      },
    ];
  }

  async callTool(name, args) {
    if (name === 'generate-scene') {
      return this.generateScene(args);
    } else if (name === 'list-scenes') {
      return this.listScenes();
    }
    throw new Error(`Unknown tool: ${name}`);
  }

  async generateScene(args) {
    const { scene, layer, model = 'turbo', all = false } = args;

    const cliPath = path.join(__dirname, 'index.js');
    const cliArgs = [];

    if (all) {
      cliArgs.push('--all');
    } else {
      cliArgs.push(scene);
      if (layer) cliArgs.push(layer);
    }

    if (model) {
      cliArgs.push('--model', model);
    }

    return new Promise((resolve, reject) => {
      const proc = spawn('node', [cliPath, ...cliArgs], {
        stdio: ['inherit', 'pipe', 'pipe'],
      });

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data) => {
        stdout += data;
        process.stdout.write(data); // Also show in real-time
      });

      proc.stderr.on('data', (data) => {
        stderr += data;
        process.stderr.write(data);
      });

      proc.on('close', (code) => {
        if (code === 0) {
          resolve({
            content: [
              {
                type: 'text',
                text: `✅ Asset generation completed\n\n${stdout}`,
              },
            ],
          });
        } else {
          reject(new Error(`Asset generation failed:\n${stderr}`));
        }
      });
    });
  }

  listScenes() {
    const scenes = {
      forest: ['background', 'midground', 'foreground'],
      city: ['background', 'midground', 'foreground'],
      office: ['background', 'midground', 'foreground'],
      beach: ['background', 'midground', 'foreground'],
      mountain: ['background', 'midground', 'foreground'],
    };

    const text = Object.entries(scenes)
      .map(([scene, layers]) => `${scene}: ${layers.join(', ')}`)
      .join('\n');

    return {
      content: [
        {
          type: 'text',
          text: `Available Sakshi scenes:\n\n${text}`,
        },
      ],
    };
  }

  // MCP transport handler
  async handleMessage(message) {
    try {
      if (message.method === 'tools/list') {
        return { tools: this.tools };
      }

      if (message.method === 'tools/call') {
        const result = await this.callTool(message.params.name, message.params.arguments || {});
        return { result };
      }

      return { error: { code: -32601, message: 'Method not found' } };
    } catch (err) {
      return {
        error: {
          code: -32603,
          message: err.message,
        },
      };
    }
  }
}

// Simple stdio transport for MCP
async function main() {
  const server = new ComfyMCPServer();

  process.stdin.setEncoding('utf-8');

  process.stdin.on('data', async (chunk) => {
    try {
      const message = JSON.parse(chunk);
      const response = await server.handleMessage(message);
      process.stdout.write(JSON.stringify(response) + '\n');
    } catch (err) {
      process.stderr.write(`Error: ${err.message}\n`);
    }
  });

  process.stderr.write('ComfyUI MCP Server ready\n');
}

main();
