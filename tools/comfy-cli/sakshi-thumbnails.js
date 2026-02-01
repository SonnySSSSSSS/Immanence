#!/usr/bin/env node

/**
 * Sakshi Thumbnail Generator
 *
 * Generates preview thumbnails for Sakshi I & II menu cards.
 * Sakshi I uses the forest parallax (handled separately)
 * Sakshi II generates a wooden control panel reflection aesthetic
 *
 * Usage:
 *   node tools/comfy-cli/sakshi-thumbnails.js
 *   node tools/comfy-cli/sakshi-thumbnails.js --model base
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const fetch = globalThis.fetch;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../');

const COMFY_URL = 'http://127.0.0.1:8188';
const OUTPUT_DIR = path.join(ROOT, 'public/awareness/menu');

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

const THUMBNAILS = {
  sakshi_ii: {
    filename: 'sakshi_ii_menu.webp',
    width: 800,
    height: 600,
    prompt: 'ornate wooden control panel, polished wood grain, reflective surface, meditation interface, crystalline buttons and dials, ambient light reflection, contemplative atmosphere, minimalist luxury, warm wood tones, soft golden highlights, peaceful instrument, cosmic energy visualization, mystical technology, illustration style',
    negative: 'text, watermark, people, faces, loud colors, harsh lighting, busy, chaotic, cinematic, photorealistic, crude, cheap materials, modern technology, digital screen',
  },
};

class SakshiThumbnailGenerator {
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
        inputs: { images: ['7', 0], filename_prefix: 'sakshi_thumbnail' },
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

  async generateThumbnail(thumbName, seed) {
    const info = THUMBNAILS[thumbName];
    if (!info) throw new Error(`Unknown thumbnail: ${thumbName}`);

    console.log(`\n📍 ${thumbName} (${info.width}×${info.height})`);
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
      filename = `sakshi_thumbnail_00001.png`;
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

  const gen = new SakshiThumbnailGenerator(modelName);

  process.stdout.write('🔗 Testing ComfyUI... ');
  if (!(await gen.testConnection())) {
    console.log('❌ ComfyUI not accessible at', COMFY_URL);
    process.exit(1);
  }
  console.log('✅\n');

  console.log(`🎨 Sakshi Thumbnail Generator (model: ${modelName})\n`);

  try {
    // Generate Sakshi II thumbnail
    await gen.generateThumbnail('sakshi_ii', 6666);

    console.log('\n✅ Sakshi thumbnails generated!\n');
    console.log(`Output: ${OUTPUT_DIR}\n`);
    console.log('These images are ready for the Sakshi menu UI.');
  } catch (err) {
    console.error(`\n❌ Error: ${err.message}`);
    process.exit(1);
  }
}

main();
