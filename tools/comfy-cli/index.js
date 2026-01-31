#!/usr/bin/env node

/**
 * ComfyUI Asset Generator CLI
 *
 * Usage:
 *   node tools/comfy-cli forest midground        # Generate single layer
 *   node tools/comfy-cli --all                   # Generate all scenes/layers
 *   node tools/comfy-cli --scene forest --model turbo
 */

import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../');

const COMFY_URL = 'http://127.0.0.1:8188';
const OUTPUT_DIR = path.join(ROOT, 'public/scenes/sakshi');

const MODELS = {
  base: {
    ckpt: 'z_image_bf16.safetensors',
    clip: 'qwen_3_4b.safetensors',
    clipType: 'lumina2',
    steps: 25,
    cfg: 7.0,
    sampler: 'dpmpp_sde',
    scheduler: 'ddim_uniform',
  },
  turbo: {
    ckpt: 'z_image_turbo_bf16.safetensors',
    clip: 'qwen_3_4b.safetensors',
    clipType: 'lumina2',
    steps: 9,
    cfg: 1.0,
    sampler: 'res_multistep',
    scheduler: 'simple',
  },
};

const SCENES = {
  forest: {
    background: 'distant forest canopy, soft sky filtered through leaves, misty depth, muted greens, diffuse daylight, calm contemplative atmosphere',
    midground: 'forest path surrounded by trees, gentle depth, soft foliage forms, low contrast, tranquil mood',
    foreground: 'earth path with scattered leaves, close ground texture, painterly brush strokes, subtle detail, neutral tone',
  },
  city: {
    background: 'distant urban skyline, low-rise buildings, soft haze, muted concrete tones, overcast daylight',
    midground: 'quiet street with buildings, sidewalks, minimal signage, subdued colors, contemplative stillness',
    foreground: 'pavement and curb at walking height, subtle surface texture, neutral contrast',
  },
  office: {
    background: 'interior wall with window light, soft shadows, muted neutral colors, calm enclosed space',
    midground: 'home office room, desk, chair, shelves, minimal objects, low visual noise',
    foreground: 'floor surface and near furniture edge, close perspective, soft brush texture, grounding presence',
  },
  beach: {
    background: 'open sky meeting distant horizon, soft clouds, pale blues and warm tones, diffuse light',
    midground: 'shoreline with gentle waves, soft sand textures, calm motion implied, tranquil',
    foreground: 'sand near feet, subtle grain, muted tones, minimal detail, grounding texture',
  },
  mountain: {
    background: 'distant mountain silhouettes, soft atmospheric depth, cool muted palette',
    midground: 'mountain trail and slopes, gentle terrain forms, contemplative scale',
    foreground: 'rocky path surface, near-ground perspective, soft brush detail, neutral contrast',
  },
};

const GLOBAL_POSITIVE = 'painterly illustration, soft brush texture, muted natural colors, matte surface, diffuse daylight, contemplative atmosphere, minimal detail, no dramatic contrast, calm composition, grounded perspective';
const NEGATIVE = 'text, watermark, people, faces, animals, cinematic lighting, dramatic shadows, lens flare, bloom, harsh contrast, oversaturated colors, photorealistic, detailed faces, extra limbs, distorted proportions';

class ComfyGenerator {
  constructor(model = 'turbo') {
    this.model = MODELS[model];
    if (!this.model) throw new Error(`Unknown model: ${model}`);
  }

  buildWorkflow(promptPos, promptNeg, seed) {
    return {
      1: {
        class_type: 'CheckpointLoaderSimple',
        inputs: { ckpt_name: this.model.ckpt },
      },
      2: {
        class_type: 'CLIPLoader',
        inputs: { clip_name: this.model.clip, type: this.model.clipType },
      },
      3: {
        class_type: 'CLIPTextEncode',
        inputs: { text: promptPos, clip: ['2', 0] },
      },
      4: {
        class_type: 'CLIPTextEncode',
        inputs: { text: promptNeg, clip: ['2', 0] },
      },
      5: {
        class_type: 'EmptyLatentImage',
        inputs: { width: 1024, height: 1024, batch_size: 1 },
      },
      6: {
        class_type: 'KSampler',
        inputs: {
          seed,
          steps: this.model.steps,
          cfg: this.model.cfg,
          sampler_name: this.model.sampler,
          scheduler: this.model.scheduler,
          denoise: 1.0,
          model: ['1', 0],
          positive: ['3', 0],
          negative: ['4', 0],
          latent_image: ['5', 0],
        },
      },
      7: {
        class_type: 'VAEDecode',
        inputs: { samples: ['6', 0], vae: ['1', 2] },
      },
      8: {
        class_type: 'SaveImage',
        inputs: { images: ['7', 0], filename_prefix: 'sakshi_scene' },
      },
    };
  }

  async submitWorkflow(workflow) {
    const res = await fetch(`${COMFY_URL}/prompt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: workflow }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`ComfyUI error ${res.status}: ${text}`);
    }

    const data = await res.json();
    return data.prompt_id;
  }

  async pollCompletion(promptId, timeoutSec = 600) {
    const start = Date.now();

    while (Date.now() - start < timeoutSec * 1000) {
      const res = await fetch(`${COMFY_URL}/history/${promptId}`);
      const data = await res.json();

      if (data[promptId]?.outputs) {
        return data[promptId];
      }

      await new Promise(r => setTimeout(r, 2000));
    }

    throw new Error(`Job ${promptId} timed out`);
  }

  async downloadImage(filename, subfolder = '') {
    const params = new URLSearchParams({ filename, type: 'output' });
    if (subfolder) params.append('subfolder', subfolder);

    const res = await fetch(`${COMFY_URL}/view?${params}`);
    if (!res.ok) throw new Error(`Download failed: ${res.status}`);

    return res.buffer();
  }

  async saveWebP(imageBytes, outPath) {
    await fs.mkdir(path.dirname(outPath), { recursive: true });
    await sharp(imageBytes).webp({ quality: 90 }).toFile(outPath);
  }

  async testConnection() {
    try {
      const res = await fetch(`${COMFY_URL}/system_stats`);
      return res.ok;
    } catch {
      return false;
    }
  }

  async generateLayer(scene, layer, promptCore, seed = 8888) {
    const promptPos = `${promptCore}, ${GLOBAL_POSITIVE}`;
    const workflow = this.buildWorkflow(promptPos, NEGATIVE, seed);

    process.stdout.write(`  📤 Submitting... `);
    const promptId = await this.submitWorkflow(workflow);
    console.log(`ID: ${promptId}`);

    process.stdout.write(`  ⏳ Generating... `);
    const history = await this.pollCompletion(promptId);
    console.log(`done`);

    const outputs = Object.values(history.outputs || {})[0];
    if (!outputs?.images?.[0]) throw new Error('No image in output');

    const image = outputs.images[0];
    process.stdout.write(`  📥 Downloading... `);
    const bytes = await this.downloadImage(image.filename, image.subfolder);
    console.log(`done`);

    const outPath = path.join(OUTPUT_DIR, scene, `${layer}.webp`);
    await this.saveWebP(bytes, outPath);
    console.log(`  ✅ ${outPath}\n`);
  }
}

async function main() {
  const args = process.argv.slice(2);

  // Parse arguments
  let scene = 'forest';
  let layer = null;
  let modelName = 'turbo';
  let allScenes = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--all') {
      allScenes = true;
    } else if (args[i] === '--model' && args[i + 1]) {
      modelName = args[++i];
    } else if (args[i] === '--scene' && args[i + 1]) {
      scene = args[++i];
    } else if (!args[i].startsWith('--') && !scene) {
      scene = args[i];
    } else if (!args[i].startsWith('--') && !layer) {
      layer = args[i];
    }
  }

  // Create generator
  const gen = new ComfyGenerator(modelName);

  // Test connection
  process.stdout.write('🔗 Testing ComfyUI... ');
  if (!(await gen.testConnection())) {
    console.log('❌ ComfyUI not accessible at', COMFY_URL);
    process.exit(1);
  }
  console.log('✅\n');

  console.log(`🎨 ComfyUI Asset Generator (model: ${modelName})\n`);

  try {
    if (allScenes) {
      // Generate all scenes and layers
      for (const [sceneName, layers] of Object.entries(SCENES)) {
        for (const [layerName, prompt] of Object.entries(layers)) {
          console.log(`📍 ${sceneName}/${layerName}`);
          await gen.generateLayer(sceneName, layerName, prompt);
        }
      }
    } else if (layer) {
      // Generate specific layer
      const sceneData = SCENES[scene];
      if (!sceneData) throw new Error(`Unknown scene: ${scene}`);

      const prompt = sceneData[layer];
      if (!prompt) throw new Error(`Unknown layer: ${layer}`);

      console.log(`📍 ${scene}/${layer}`);
      await gen.generateLayer(scene, layer, prompt);
    } else {
      // Generate all layers of a scene
      const sceneData = SCENES[scene];
      if (!sceneData) throw new Error(`Unknown scene: ${scene}`);

      for (const [layerName, prompt] of Object.entries(sceneData)) {
        console.log(`📍 ${scene}/${layerName}`);
        await gen.generateLayer(scene, layerName, prompt);
      }
    }

    console.log('✅ All assets generated!\n');
  } catch (err) {
    console.error(`\n❌ Error: ${err.message}`);
    process.exit(1);
  }
}

main();
