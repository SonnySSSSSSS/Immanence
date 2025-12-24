---
description: How to use ComfyUI to generate assets for Immanence OS
---

# ComfyUI MCP Server - Usage Instructions

You have access to two ComfyUI tools for generating AI assets:

## Tool 1: check_comfyui_status

**Purpose**: Check if ComfyUI is running  
**Parameters**: None  
**When to use**: Before generating images, or when troubleshooting

**Example**:
```javascript
check_comfyui_status({})
```

---

## Tool 2: generate_comfyui_asset

**Purpose**: Generate images using ComfyUI's AI  

**Parameters**:
- `positive_prompt` (required): What to generate
- `negative_prompt` (optional): What to avoid
- `output_path` (optional): Where to save (relative to `D:\Unity Apps\immanence-os\`)

**Examples**:

### Generate with default location
```javascript
generate_comfyui_asset({
  "positive_prompt": "mystical purple avatar, ethereal glow, spiritual energy"
})
```

### Generate with specific output
```javascript
generate_comfyui_asset({
  "positive_prompt": "serene buddha statue, meditation pose, golden light",
  "negative_prompt": "text, watermark, blurry, distorted",
  "output_path": "public/avatars/buddha_01.png"
})
```

### Generate chakra visualization
```javascript
generate_comfyui_asset({
  "positive_prompt": "heart chakra symbol, green energy, lotus flower, sacred geometry",
  "negative_prompt": "text, watermark",
  "output_path": "public/chakras/anahata.png"
})
```

---

## Usage Patterns

When the user says:
- **"Generate a mystical avatar"** → Use `generate_comfyui_asset` with appropriate prompt
- **"Create a chakra image"** → Use `generate_comfyui_asset` with chakra-themed prompt
- **"Is ComfyUI running?"** → Use `check_comfyui_status`
- **"Make me a banner for..."** → Use `generate_comfyui_asset` with banner-style prompt

---

## Best Practices

### Always:
- Check ComfyUI status first if unsure
- Use descriptive, detailed prompts for better results
- Include negative prompts to avoid unwanted elements (text, watermarks, etc.)
- Specify `output_path` when user indicates where they want the file

### Default output location (if not specified):
`public/generated/[random-id].png`

### Good prompt patterns:
**Format**: Subject + style + lighting + quality modifiers

**Example**: `"mystical avatar, ethereal style, soft purple glow, high quality, detailed"`

### Common negative prompts:
`"text, watermark, blurry, distorted, low quality"`

### Path format:
- Use forward slashes: `public/avatars/test.png`
- Or double backslashes: `public\\avatars\\test.png`
- Relative to project root: `D:\Unity Apps\immanence-os\`

---

## Asset Organization

Recommended directories for generated assets:
- **Avatars**: `public/avatars/`
- **Chakras**: `public/chakras/`
- **Icons**: `public/icons/`
- **Backgrounds**: `public/backgrounds/`
- **UI Elements**: `public/ui/`
- **Generated**: `public/generated/` (for temporary/test assets)
