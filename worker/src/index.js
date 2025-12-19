// Immanence OS - Gemini API Proxy Worker
// Deploy to Cloudflare Workers
// Handles: Rate limiting, API key security, request forwarding

// Rate limiting: 100 requests per hour per IP
const RATE_LIMIT = 100;
const RATE_WINDOW = 3600; // 1 hour in seconds

// Allowed endpoints - only allow specific Gemini models
const ALLOWED_MODELS = [
    'gemini-1.5-flash',
    'gemini-1.5-flash-latest',
    'gemini-1.5-pro',
];

export default {
    async fetch(request, env, ctx) {
        // CORS headers
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, X-Client-Version',
        };

        // Handle preflight
        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }

        // Only allow POST
        if (request.method !== 'POST') {
            return new Response(JSON.stringify({ error: 'Method not allowed' }), {
                status: 405,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        try {
            // Get client IP for rate limiting
            const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
            const rateKey = `rate:${clientIP}`;

            // Check rate limit using KV
            if (env.RATE_LIMIT_KV) {
                const currentCount = parseInt(await env.RATE_LIMIT_KV.get(rateKey) || '0');

                if (currentCount >= RATE_LIMIT) {
                    return new Response(JSON.stringify({
                        error: 'Rate limit exceeded',
                        message: `Maximum ${RATE_LIMIT} requests per hour. Try again later.`,
                        retryAfter: RATE_WINDOW,
                    }), {
                        status: 429,
                        headers: {
                            ...corsHeaders,
                            'Content-Type': 'application/json',
                            'Retry-After': String(RATE_WINDOW),
                        },
                    });
                }

                // Increment rate counter
                await env.RATE_LIMIT_KV.put(rateKey, String(currentCount + 1), {
                    expirationTtl: RATE_WINDOW,
                });
            }

            // Parse request body
            const body = await request.json();

            // Validate required fields
            if (!body.model || !body.contents) {
                return new Response(JSON.stringify({
                    error: 'Invalid request',
                    message: 'Missing required fields: model, contents',
                }), {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            // Validate model
            if (!ALLOWED_MODELS.includes(body.model)) {
                return new Response(JSON.stringify({
                    error: 'Invalid model',
                    message: `Allowed models: ${ALLOWED_MODELS.join(', ')}`,
                }), {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            // Get API key from environment
            const apiKey = env.GEMINI_API_KEY;
            if (!apiKey) {
                return new Response(JSON.stringify({
                    error: 'Server configuration error',
                    message: 'API key not configured',
                }), {
                    status: 500,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            // Build Gemini API URL
            const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${body.model}:generateContent?key=${apiKey}`;

            // Forward request to Gemini
            const geminiResponse = await fetch(geminiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: body.contents,
                    generationConfig: body.generationConfig || {
                        temperature: 0.7,
                        maxOutputTokens: 2048,
                    },
                    safetySettings: body.safetySettings || [
                        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
                        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
                        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
                        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
                    ],
                }),
            });

            // Get response text
            const geminiData = await geminiResponse.json();

            // Check for Gemini errors
            if (!geminiResponse.ok) {
                return new Response(JSON.stringify({
                    error: 'Gemini API error',
                    message: geminiData.error?.message || 'Unknown error',
                    status: geminiResponse.status,
                }), {
                    status: geminiResponse.status,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            // Return successful response
            return new Response(JSON.stringify(geminiData), {
                status: 200,
                headers: {
                    ...corsHeaders,
                    'Content-Type': 'application/json',
                    'X-RateLimit-Remaining': env.RATE_LIMIT_KV
                        ? String(RATE_LIMIT - (parseInt(await env.RATE_LIMIT_KV.get(rateKey) || '0')))
                        : 'unlimited',
                },
            });

        } catch (error) {
            console.error('Worker error:', error);
            return new Response(JSON.stringify({
                error: 'Internal error',
                message: error.message,
            }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }
    },
};
