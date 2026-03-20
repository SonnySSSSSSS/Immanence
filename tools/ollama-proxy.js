// Simple CORS proxy for Ollama
// Run with: node ollama-proxy.js

import http from 'http';

const OLLAMA_URL = 'http://localhost:11434';
const PORT = 11435;

const server = http.createServer(async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // Proxy to Ollama
    const url = `${OLLAMA_URL}${req.url}`;

    try {
        const response = await fetch(url, {
            method: req.method,
            headers: { 'Content-Type': 'application/json' },
            body: req.method === 'POST' ? await getBody(req) : undefined,
        });

        const data = await response.text();
        res.writeHead(response.status, { 'Content-Type': 'application/json' });
        res.end(data);
    } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
    }
});

function getBody(req) {
    return new Promise((resolve) => {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => resolve(body));
    });
}

server.listen(PORT, () => {
    console.log(`✓ Ollama CORS proxy running on http://localhost:${PORT}`);
    console.log(`  Forwarding to: ${OLLAMA_URL}`);
});
