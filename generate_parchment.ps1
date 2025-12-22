$workflow = @'
{
  "6": {
    "inputs": {
      "text": "High quality parchment paper texture background, aged manuscript aesthetic, subtle warm beige and cream tones with soft green accents, delicate botanical watercolor illustrations of tiny seedlings, young sprouts, and fresh leaves emerging from soil scattered around the edges, minimalist zen style, natural earthy palette, pale sage green, soft moss, warm cream, light tan, gentle paper grain texture, subtle ink wash effects, ethereal and meditative atmosphere, clean center space, traditional Japanese wabi-sabi aesthetic, medieval manuscript illumination, very subtle and understated, professional digital art",
      "clip": ["4", 1]
    },
    "class_type": "CLIPTextEncode"
  },
  "7": {
    "inputs": {
      "text": "text, watermark, people, faces, modern, digital artifacts, harsh colors, bright neon, oversaturated",
      "clip": ["4", 1]
    },
    "class_type": "CLIPTextEncode"
  },
  "4": {
    "inputs": {
      "ckpt_name": "v1-5-pruned-emaonly-fp16.safetensors"
    },
    "class_type": "CheckpointLoaderSimple"
  },
  "5": {
    "inputs": {
      "width": 768,
      "height": 512,
      "batch_size": 1
    },
    "class_type": "EmptyLatentImage"
  },
  "3": {
    "inputs": {
      "seed": [Get-Random -Minimum 0 -Maximum 9999999999],
      "steps": 25,
      "cfg": 7.5,
      "sampler_name": "euler",
      "scheduler": "normal",
      "denoise": 1,
      "model": ["4", 0],
      "positive": ["6", 0],
      "negative": ["7", 0],
      "latent_image": ["5", 0]
    },
    "class_type": "KSampler"
  },
  "8": {
    "inputs": {
      "samples": ["3", 0],
      "vae": ["4", 2]
    },
    "class_type": "VAEDecode"
  },
  "9": {
    "inputs": {
      "filename_prefix": "seedling_parchment_bg",
      "images": ["8", 0]
    },
    "class_type": "SaveImage"
  }
}
'@

$seed = Get-Random -Minimum 0 -Maximum 9999999999
$workflow = $workflow.Replace('[Get-Random -Minimum 0 -Maximum 9999999999]', $seed)

$body = @{
    "prompt" = ($workflow | ConvertFrom-Json)
    "client_id" = "powershell_client"
} | ConvertTo-Json -Depth 10

Write-Host "Sending generation request to ComfyUI..."
Write-Host "Seed: $seed"

$response = Invoke-RestMethod -Uri "http://127.0.0.1:8188/prompt" -Method POST -Body $body -ContentType "application/json"

Write-Host "Prompt queued successfully!"
Write-Host "Prompt ID: $($response.prompt_id)"
Write-Host "`nImage will be saved to ComfyUI\output\seedling_parchment_bg_XXXXX.png"
Write-Host "Check the ComfyUI web interface to see progress: http://127.0.0.1:8188"
