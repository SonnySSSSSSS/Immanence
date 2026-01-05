// src/services/llmService.js
// Client for Immanence LLM - supports both Ollama (local) and Gemini API (cloud)

// Configuration
const USE_OLLAMA = true; // Set to false to use Cloudflare Worker/Gemini instead
const WORKER_URL = USE_OLLAMA ? '/api/ollama' : (import.meta.env.VITE_LLM_PROXY_URL || 'http://localhost:8787');

// Default generation config
const DEFAULT_CONFIG = {
    temperature: 0.7,
    maxOutputTokens: 1024,
};

/**
 * Send a prompt to the LLM and get a response
 * @param {string} systemPrompt - System instructions for the model
 * @param {string} userPrompt - User's input
 * @param {Object} options - Optional configuration
 * @returns {Promise<{success: boolean, text?: string, error?: string, raw?: Object}>}
 */
export async function sendToLLM(systemPrompt, userPrompt, options = {}) {
    const {
        model = USE_OLLAMA ? 'gemma3:1b' : 'gemini-1.5-flash',
        temperature = DEFAULT_CONFIG.temperature,
        maxOutputTokens = DEFAULT_CONFIG.maxOutputTokens,
    } = options;

    try {
        // Ollama uses different API format than Gemini
        const requestBody = USE_OLLAMA ? {
            model,
            prompt: `${systemPrompt}\n\n---\n\n${userPrompt}`,
            stream: false,
            options: {
                temperature,
                num_predict: maxOutputTokens,
            }
        } : {
            model,
            contents: [
                {
                    role: 'user',
                    parts: [
                        { text: `${systemPrompt}\n\n---\n\n${userPrompt}` }
                    ]
                }
            ],
            generationConfig: {
                temperature,
                maxOutputTokens,
            },
        };

        const endpoint = USE_OLLAMA ? `${WORKER_URL}/api/generate` : WORKER_URL;

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Client-Version': '2.96.0',
            },
            body: JSON.stringify(requestBody),
        });

        // Handle errors
        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            return {
                success: false,
                error: 'api_error',
                message: data.message || data.error || `Request failed with status ${response.status}`,
            };
        }

        const data = await response.json();

        // Extract text based on API type
        let text;
        if (USE_OLLAMA) {
            text = data.response; // Ollama format
        } else {
            text = data.candidates?.[0]?.content?.parts?.[0]?.text; // Gemini format
        }

        if (!text) {
            return {
                success: false,
                error: 'empty_response',
                message: 'No response generated',
                raw: data,
            };
        }

        return {
            success: true,
            text,
            raw: data,
        };

    } catch (error) {
        // Network error or other failure
        return {
            success: false,
            error: 'network_error',
            message: error.message || 'Failed to connect to LLM service',
        };
    }
}

/**
 * Send a prompt expecting JSON response
 * @param {string} systemPrompt - System instructions (should request JSON output)
 * @param {string} userPrompt - User's input
 * @param {Object} options - Optional configuration
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export async function sendToLLMForJSON(systemPrompt, userPrompt, options = {}) {
    const result = await sendToLLM(systemPrompt, userPrompt, options);

    if (!result.success) {
        return result;
    }

    try {
        // Extract JSON from response (handle markdown code blocks)
        let jsonText = result.text;

        // Remove markdown code block if present
        const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
            jsonText = jsonMatch[1];
        }

        const data = JSON.parse(jsonText.trim());

        return {
            success: true,
            data,
            raw: result.raw,
        };

    } catch {
        return {
            success: false,
            error: 'parse_error',
            message: 'Failed to parse JSON response',
            text: result.text,
        };
    }
}

/**
 * Check if LLM service is available
 * @returns {Promise<boolean>}
 */
export async function checkLLMAvailability() {
    try {
        if (USE_OLLAMA) {
            // Check Ollama health - just try to reach the server
            const response = await fetch(`${WORKER_URL}/api/version`, {
                method: 'GET',
            });
            return response.ok;
        } else {
            // Check Cloudflare Worker
            const response = await fetch(WORKER_URL, { method: 'OPTIONS' });
            return response.ok;
        }
    } catch {
        return false;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// FOUR MODES SPECIFIC PROMPTS
// ═══════════════════════════════════════════════════════════════════════════════

const MIRROR_SYSTEM_PROMPT = `You are a neutral language validator for emotional clarity practice.
The user is attempting to describe an experience using only observable facts.

RULES (FIRM - flag violations):
- No intent attribution ("they wanted to...", "on purpose")
- No causation claims ("because", "made me feel")
- No universal quantifiers ("always", "never")
- No mind-reading ("they thought", "they felt")
- E-Prime violations (forms of "to be" as identity: "he is selfish")

APPROACH (SOFT guidance):
- Suggest neutral reframes for violations
- Acknowledge difficulty of neutral observation
- Don't demand perfection, highlight main issues

OUTPUT FORMAT (JSON):
{
  "verdict": "clean" | "issues_found",
  "issues": [
    { "quote": "...", "type": "intent_attribution", "suggestion": "..." }
  ],
  "overall_note": "One sentence of supportive guidance"
}`;

/**
 * Validate a Mirror entry for neutral language
 * @param {Object} mirrorEntry - { context, actor, action, recipient }
 * @returns {Promise<Object>} Validation result
 */
export async function validateMirrorEntry(mirrorEntry) {
    const { context, actor, action, recipient } = mirrorEntry;

    const userPrompt = `MIRROR ENTRY:
Context: ${context.date || ''} ${context.time || ''} ${context.location || ''}
Actor: ${actor}
Action: ${action}
Recipient: ${recipient}

Validate this observation for neutral, camera-observable language.`;

    return sendToLLMForJSON(MIRROR_SYSTEM_PROMPT, userPrompt);
}

/**
 * Evaluate Prism interpretations and generate alternatives
 * @param {string} mirrorEntry - The locked mirror text
 * @param {Array} interpretations - User's interpretations with supported/unsupported marks
 * @param {string} waveProfile - Wave function profile for context
 * @returns {Promise<Object>} Evaluation and alternatives
 */
export async function evaluatePrismInterpretations(mirrorEntry, interpretations, waveProfile = '') {
    const systemPrompt = `You are a cognitive reframing assistant. The user has written an observation 
(Mirror) and is now exploring alternative interpretations.

TASK 1: Evaluate their categorizations
For each user-marked interpretation, assess if their "supported by evidence" 
vs "unsupported" classification is logically defensible based on the Mirror text alone.

TASK 2: Generate alternatives ONLY IF:
- All user interpretations blame self OR all blame other (one-sided)
- No charitable interpretation present
- No systemic/contextual frame present

If generating alternatives, provide 2-3 frames from different lenses:
- Charitable interpretation (benefit of doubt)
- Systemic/contextual (external pressures on other party)
- Self-reflective (user's contribution to dynamic)

${waveProfile ? `USER PROFILE:\n${waveProfile}\n` : ''}

OUTPUT FORMAT (JSON):
{
  "evaluation": [
    { "interpretation_id": 0, "user_marked": "supported", 
      "assessment": "valid" | "questionable", "reason": "..." }
  ],
  "alternatives": [
    { "frame": "...", "lens": "charitable" | "systemic" | "self-reflective" }
  ],
  "note": "Brief observation about user's framing patterns"
}`;

    const userPrompt = `MIRROR ENTRY:
"${mirrorEntry}"

USER INTERPRETATIONS:
${JSON.stringify(interpretations, null, 2)}`;

    return sendToLLMForJSON(systemPrompt, userPrompt);
}

/**
 * Evaluate Wave coherence - is response parallel to user's nature?
 * @param {string} mirrorEntry - The situation
 * @param {string} userResponse - What user did/felt
 * @param {string} waveProfile - Full wave function profile
 * @returns {Promise<Object>} Coherence assessment
 */
export async function evaluateWaveCoherence(mirrorEntry, userResponse, waveProfile) {
    const systemPrompt = `You are a self-coherence evaluator. The user has described a situation and their response.
You assess whether their response aligned with their characteristic patterns.

WAVE FUNCTION (user's validated self-knowledge):
${waveProfile}

DEFINITIONS:
- PARALLEL: Response flows naturally from user's nature AND addresses situation
- ANTIPARALLEL: Response contradicts nature BUT was situationally necessary 
  (sometimes you must act against type). Flag the COST, don't condemn.
- INCOHERENT: Response contradicts nature AND didn't serve the situation
  (reactive, impulsive, or confused)

OUTPUT FORMAT (JSON):
{
  "coherence": "parallel" | "antiparallel" | "incoherent",
  "analysis": "2-3 sentence explanation referencing specific wave function traits",
  "alternatives": [
    { "response": "...", "why_parallel": "..." }
  ]
}`;

    const userPrompt = `SITUATION (Mirror):
"${mirrorEntry}"

USER'S RESPONSE:
"${userResponse}"`;

    return sendToLLMForJSON(systemPrompt, userPrompt);
}

/**
 * Validate Sword commitment for clarity and coherence
 * @param {string} mirrorEntry - The situation
 * @param {string} commitment - User's proposed commitment
 * @param {string} waveProfile - Wave function profile
 * @returns {Promise<Object>} Commitment validation
 */
export async function validateSwordCommitment(mirrorEntry, commitment, waveProfile) {
    const systemPrompt = `You are a commitment clarity validator. The user is defining a boundary or action.

WAVE FUNCTION:
${waveProfile}

CRITERIA (all should be met for clarity):
1. SPECIFIC: Observable, verifiable action (not trait or intention)
2. RESPONSIVE: Addresses the actual situation from Mirror
3. COHERENT: Aligns with Wave function (or acknowledges cost if antiparallel)
4. BOUNDED: Clear scope - when it applies, when it doesn't
5. TIMED: When will this happen? (Immediate/specific date/ongoing)
6. VERIFIABLE: How would you know you did it?

OUTPUT FORMAT (JSON):
{
  "verdict": "clear" | "needs_refinement",
  "assessment": {
    "specific": { "pass": true/false, "note": "..." },
    "responsive": { "pass": true/false, "note": "..." },
    "coherent": { "pass": true/false, "note": "..." },
    "bounded": { "pass": true/false, "note": "..." },
    "timed": { "pass": true/false, "note": "..." },
    "verifiable": { "pass": true/false, "note": "..." }
  },
  "refined_suggestion": "If needs refinement, offer improved version"
}`;

    const userPrompt = `SITUATION (Mirror):
"${mirrorEntry}"

PROPOSED COMMITMENT:
"${commitment}"`;

    return sendToLLMForJSON(systemPrompt, userPrompt);
}
