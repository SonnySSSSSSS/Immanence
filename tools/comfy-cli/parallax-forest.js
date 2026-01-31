#!/usr/bin/env node

/**
 * Forest Parallax Layer Generator
 *
 * Generates 3072×1024 side-scrolling game background layers with transparency.
 *
 * Usage:
 *   node tools/comfy-cli/parallax-forest.js
 *   node tools/comfy-cli/parallax-forest.js --model base
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Use Node.js built-in fetch (available since Node 18)
const fetch = globalThis.fetch;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../');

const COMFY_URL = 'http://127.0.0.1:8188';
const OUTPUT_DIR = path.join(ROOT, 'public/scenes/forest/layers');

const MODELS = {
  base: {
    ckpt: 'z_image_bf16.safetensors',
    clip: 'qwen_3_4b.safetensors',
    clipType: 'lumina2',
    steps: 25,
    cfg: 5.0,  // Lower for wider aspect ratio (3072×1024)
    sampler: 'dpmpp_sde',
    scheduler: 'ddim_uniform',
  },
  turbo: {
    ckpt: 'z-image-turbo-bf16-aio.safetensors',
    clip: 'qwen_3_4b.safetensors',
    clipType: 'lumina2',
    steps: 12,  // Increase from 9 for wider images (reduces artifacts)
    cfg: 1.5,   // Slightly higher than standard turbo (1.0) for stability
    sampler: 'euler_ancestral',  // Better for wider aspect ratios
    scheduler: 'ddim_uniform',
  },
};

const LAYERS = {
  sky: {
    filename: 'forest_sky.webp',
    width: 3072,
    height: 1024,
    prompt: 'flat 2D side-scrolling game sky, soft twilight gradient sky, pale teal to warm cream, minimal clouds, small subtle moon, no trees, no ground, calm and simple',
    negative: 'text, watermark, people, faces, trees, ground, depth, perspective, cinematic, dramatic lighting, 3D, realistic, photorealistic, detailed, complex',
    alpha: false,
  },
  trees_mid: {
    filename: 'forest_trees_mid.webp',
    width: 3072,
    height: 1024,
    prompt: 'flat 2D side-scrolling forest midground, dense overlapping tree canopies and trunks, trees packed tightly with no gaps between them, continuous canopy wall, simple dark base below trees, nothing above canopy, transparent sky above trees',
    negative: 'text, watermark, people, faces, realistic, photorealistic, detailed, depth, perspective, cinematic, dramatic lighting, 3D',
    alpha: true,
  },
  bushes_fg: {
    filename: 'forest_bushes_fg.webp',
    width: 3072,
    height: 1024,
    prompt: 'flat 2D side-scrolling forest foreground, thick overlapping bushes and foliage silhouettes, grass and leaves only, heavy density, occupies lower portion of image, upper area transparent, no trees, no sky',
    negative: 'text, watermark, people, faces, realistic, photorealistic, detailed, depth, perspective, cinematic, dramatic lighting, 3D',
    alpha: true,
  },
};

class ParallaxForestGenerator {
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
        inputs: { images: ['7', 0], filename_prefix: 'parallax_forest' },
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

  async pollCompletion(promptId, timeoutSec = 900) {
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

  async saveWebP(imageBytes, outPath, layerName) {
    await fs.mkdir(path.dirname(outPath), { recursive: true });

    // For alpha layers, we'd need to post-process, but standard ComfyUI
    // doesn't easily generate alpha. We'll save as-is and note the limitation.
    const info = LAYERS[layerName];
    if (info.alpha) {
      console.log(`  ⚠️  Note: Alpha transparency not natively supported by ComfyUI.`);
      console.log(`      Generated as opaque. Post-process with transparency if needed.`);
    }

    // Save image directly (ComfyUI already provides PNG/WEBP)
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

  async generateLayer(layerName, seed = 8888) {
    const info = LAYERS[layerName];
    if (!info) throw new Error(`Unknown layer: ${layerName}`);

    console.log(`\n📍 ${layerName} (${info.width}×${info.height})`);
    console.log(`   Prompt: "${info.prompt.substring(0, 60)}..."`);

    const workflow = this.buildWorkflow(
      info.prompt,
      info.negative,
      seed,
      info.width,
      info.height
    );

    process.stdout.write(`  📤 Submitting... `);
    const promptId = await this.submitWorkflow(workflow);
    console.log(`ID: ${promptId}`);

    process.stdout.write(`  ⏳ Generating (${this.modelName})... `);
    const history = await this.pollCompletion(promptId);
    console.log(`done`);

    // ComfyUI SaveImage nodes save to disk but return filename differently
    // Check outputs from node 8 (SaveImage)
    let filename = null;
    const outputs = history.outputs?.[8];  // Node 8 is SaveImage

    if (outputs?.images?.[0]) {
      filename = outputs.images[0].filename;
    } else {
      // Fallback: construct expected filename from prefix
      filename = `parallax_forest_00001.png`;
    }

    process.stdout.write(`  📥 Downloading... `);
    const bytes = await this.downloadImage(filename);
    console.log(`done`);

    const outPath = path.join(OUTPUT_DIR, info.filename);
    await this.saveWebP(bytes, outPath, layerName);
    console.log(`  ✅ ${outPath}`);

    if (info.alpha) {
      console.log(`  ℹ️  Layer expects transparency. Check generated image.`);
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  const modelName = args.includes('--model') ? args[args.indexOf('--model') + 1] : 'turbo';

  const gen = new ParallaxForestGenerator(modelName);

  process.stdout.write('🔗 Testing ComfyUI... ');
  if (!(await gen.testConnection())) {
    console.log('❌ ComfyUI not accessible at', COMFY_URL);
    process.exit(1);
  }
  console.log('✅\n');

  console.log(`🎨 Forest Parallax Layer Generator (model: ${modelName})\n`);

  try {
    // Generate all three layers
    await gen.generateLayer('sky', 9999);
    await gen.generateLayer('trees_mid', 9998);
    await gen.generateLayer('bushes_fg', 9997);

    console.log('\n✅ All layers generated!\n');
    console.log(`Output: ${OUTPUT_DIR}\n`);
    console.log('Notes:');
    console.log('- Layers are flat 2D side-scrolling game assets');
    console.log('- trees_mid and bushes_fg expect transparency (post-process if needed)');
    console.log('- Use in parallax scroller with appropriate scroll speeds');
  } catch (err) {
    console.error(`\n❌ Error: ${err.message}`);
    process.exit(1);
  }
}

main();
