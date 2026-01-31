#!/usr/bin/env node

/**
 * Awareness Scene Thumbnail Generator
 *
 * Generates preview images for the Awareness practice scene selector.
 * Based on the reference UI showing Forest, Street, Room, Beach, Mountain.
 *
 * Usage:
 *   node tools/comfy-cli/awareness-scenes.js
 *   node tools/comfy-cli/awareness-scenes.js --model base
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const fetch = globalThis.fetch;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../');

const COMFY_URL = 'http://127.0.0.1:8188';
const OUTPUT_DIR = path.join(ROOT, 'public/awareness/scenes');

const MODELS = {
  base: {
    ckpt: 'z_image_bf16.safetensors',
    clip: 'qwen_3_4b.safetensors',
    clipType: 'lumina2',
    steps: 25,
    cfg: 5.0,
    sampler: 'dpmpp_sde',
    scheduler: 'ddim_uniform',
  },
  turbo: {
    ckpt: 'z-image-turbo-bf16-aio.safetensors',
    clip: 'qwen_3_4b.safetensors',
    clipType: 'lumina2',
    steps: 12,
    cfg: 1.5,
    sampler: 'euler_ancestral',
    scheduler: 'ddim_uniform',
  },
};

const SCENES = {
  forest: {
    filename: 'forest.webp',
    width: 800,
    height: 600,
    prompt: 'serene forest scene, person standing in dappled sunlight, peaceful atmosphere, contemplative mood, painterly illustration style, soft lighting through trees, tranquil nature setting',
    negative: 'text, watermark, faces showing emotion, people interacting, dramatic action, busy, chaotic, cinematic, unrealistic, photorealistic detail',
  },
  street: {
    filename: 'street.webp',
    width: 800,
    height: 600,
    prompt: 'quiet urban street scene at dusk, buildings in soft golden light, peaceful sidewalk, minimal people, calm city moment, painterly illustration, warm evening atmosphere, grounded perspective',
    negative: 'text, watermark, crowds, busy traffic, dramatic lighting, harsh shadows, cinematic effects, photorealistic, unrealistic proportions',
  },
  room: {
    filename: 'room.webp',
    width: 800,
    height: 600,
    prompt: 'calm interior room scene, soft window light, peaceful home space, simple furnishings, warm neutral tones, painterly illustration, contemplative atmosphere, grounding presence, minimal objects',
    negative: 'text, watermark, people, busy clutter, dramatic lighting, cinematic effects, photorealistic, excessive detail, unrealistic proportions',
  },
  beach: {
    filename: 'beach.webp',
    width: 800,
    height: 600,
    prompt: 'serene beach scene, sunset or golden hour light, calm shoreline, waves in soft motion, peaceful horizon, painterly illustration style, tranquil mood, warm tones, minimal activity',
    negative: 'text, watermark, crowds, busy activity, dramatic cinematic lighting, photorealistic detail, harsh shadows, unrealistic proportions, excessive complexity',
  },
  mountain: {
    filename: 'mountain.webp',
    width: 800,
    height: 600,
    prompt: 'peaceful mountain landscape, soft atmospheric perspective, distant peaks in misty light, contemplative scale, painterly illustration style, calm natural setting, serene mood, grounded viewpoint',
    negative: 'text, watermark, people, dramatic action, cinematic effects, harsh lighting, photorealistic detail, unrealistic proportions, excessive complexity',
  },
};

class AwarenessSceneGenerator {
  constructor(modelName = 'turbo') {
    this.model = MODELS[modelName];
    if (!this.model) throw new Error(`Unknown model: ${modelName}`);
    this.modelName = modelName;
  }

  buildWorkflow(prompt, negPrompt, seed, width, height) {
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
        inputs: { text: prompt, clip: ['2', 0] },
      },
      4: {
        class_type: 'CLIPTextEncode',
        inputs: { text: negPrompt, clip: ['2', 0] },
      },
      5: {
        class_type: 'EmptyLatentImage',
        inputs: { width, height, batch_size: 1 },
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
        inputs: { images: ['7', 0], filename_prefix: 'awareness_scene' },
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

    throw new Error(`Job ${promptId} timed out after ${timeoutSec}s`);
  }

  async downloadImage(filename, subfolder = '') {
    const params = new URLSearchParams({ filename, type: 'output' });
    if (subfolder) params.append('subfolder', subfolder);

    const res = await fetch(`${COMFY_URL}/view?${params}`);
    if (!res.ok) throw new Error(`Download failed: ${res.status}`);

    return Buffer.from(await res.arrayBuffer());
  }

  async saveWebP(imageBytes, outPath) {
    await fs.mkdir(path.dirname(outPath), { recursive: true });
    await fs.writeFile(outPath, imageBytes);
  }

  async testConnection() {
    try {
      const res = await fetch(`${COMFY_URL}/system_stats`);
      return res.ok;
    } catch {
      return false;
    }
  }

  async generateScene(sceneName, seed) {
    const info = SCENES[sceneName];
    if (!info) throw new Error(`Unknown scene: ${sceneName}`);

    console.log(`\n📍 ${sceneName} (${info.width}×${info.height})`);
    console.log(`   "${info.prompt.substring(0, 70)}..."`);

    const workflow = this.buildWorkflow(
      info.prompt,
      info.negative,
      seed,
      info.width,
      info.height
    );

    process.stdout.write(`  📤 Submitting... `);
    const promptId = await this.submitWorkflow(workflow);
    console.log(`ID: ${promptId.substring(0, 8)}...`);

    process.stdout.write(`  ⏳ Generating (${this.modelName})... `);
    const history = await this.pollCompletion(promptId);
    console.log(`done`);

    let filename = null;
    const outputs = history.outputs?.[8];

    if (outputs?.images?.[0]) {
      filename = outputs.images[0].filename;
    } else {
      filename = `awareness_scene_00001.png`;
    }

    process.stdout.write(`  📥 Downloading... `);
    const bytes = await this.downloadImage(filename);
    console.log(`done`);

    const outPath = path.join(OUTPUT_DIR, info.filename);
    await this.saveWebP(bytes, outPath);
    console.log(`  ✅ ${outPath}`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const modelName = args.includes('--model') ? args[args.indexOf('--model') + 1] : 'turbo';

  const gen = new AwarenessSceneGenerator(modelName);

  process.stdout.write('🔗 Testing ComfyUI... ');
  if (!(await gen.testConnection())) {
    console.log('❌ ComfyUI not accessible at', COMFY_URL);
    process.exit(1);
  }
  console.log('✅\n');

  console.log(`🎨 Awareness Scene Thumbnail Generator (model: ${modelName})\n`);

  try {
    // Generate all scenes
    const sceneNames = Object.keys(SCENES);
    let seed = 7777;

    for (const sceneName of sceneNames) {
      await gen.generateScene(sceneName, seed);
      seed--;
    }

    console.log('\n✅ All awareness scenes generated!\n');
    console.log(`Output: ${OUTPUT_DIR}\n`);
    console.log('These images are ready for the Awareness practice UI.');
  } catch (err) {
    console.error(`\n❌ Error: ${err.message}`);
    process.exit(1);
  }
}

main();
