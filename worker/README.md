# Immanence LLM Proxy Worker

Cloudflare Worker that securely proxies requests to Google's Gemini API.

## Features

- **Secure API Key**: Key stored in Cloudflare secrets, never exposed to client
- **Rate Limiting**: 100 requests/hour per IP using Cloudflare KV
- **Model Validation**: Only allows specific Gemini models
- **CORS Support**: Works with Electron app and web clients

## Setup

### 1. Install Wrangler CLI

```bash
npm install -g wrangler
wrangler login
```

### 2. Create KV Namespace for Rate Limiting

```bash
cd worker
wrangler kv namespace create RATE_LIMIT_KV
```

Copy the output ID and update `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "RATE_LIMIT_KV"
id = "your-kv-namespace-id"
```

### 3. Set Gemini API Key

```bash
wrangler secret put GEMINI_API_KEY
# Paste your Gemini API key when prompted
```

Get your API key from: https://aistudio.google.com/app/apikey

### 4. Deploy

```bash
wrangler deploy
```

Your worker will be available at: `https://immanence-llm-proxy.<your-subdomain>.workers.dev`

## API Usage

### Request Format

```javascript
POST https://immanence-llm-proxy.<subdomain>.workers.dev

{
  "model": "gemini-1.5-flash",
  "contents": [
    {
      "role": "user",
      "parts": [{ "text": "Your prompt here" }]
    }
  ],
  "generationConfig": {
    "temperature": 0.7,
    "maxOutputTokens": 1024
  }
}
```

### Response Format

Standard Gemini API response:

```javascript
{
  "candidates": [
    {
      "content": {
        "parts": [{ "text": "Response text" }],
        "role": "model"
      },
      "finishReason": "STOP"
    }
  ]
}
```

### Error Responses

- `400`: Invalid request (missing fields, invalid model)
- `429`: Rate limit exceeded (100 req/hour)
- `500`: Server/API error

## Rate Limiting

- 100 requests per hour per IP address
- Resets after 1 hour of inactivity
- `X-RateLimit-Remaining` header shows remaining requests

## Local Development

```bash
wrangler dev
```

Worker will run at `http://localhost:8787`

## Allowed Models

- `gemini-1.5-flash`
- `gemini-1.5-flash-latest`
- `gemini-1.5-pro`
