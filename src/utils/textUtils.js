// src/utils/textUtils.js
/**
 * Sanitize text content by fixing common character encoding artifacts
 * that occur when UTF-8 content is incorrectly decoded as Latin-1
 */
export function sanitizeText(text) {
    if (!text || typeof text !== 'string') return text;

    return text
        // Fix curly quotes
        .replace(/â€™/g, "'")      // Right single quote
        .replace(/â€˜/g, "'")      // Left single quote
        .replace(/â€œ/g, '"')      // Left double quote
        .replace(/â€\u009d/g, '"')  // Right double quote
        .replace(/â€/g, '"')       // Generic double quote fix

        // Fix dashes
        .replace(/â€"/g, "—")      // Em dash
        .replace(/â€"/g, "–")      // En dash

        // Fix ellipsis
        .replace(/â€¦/g, "...")

        // Fix common special characters
        .replace(/Ã©/g, "é")
        .replace(/Ã¨/g, "è")
        .replace(/Ã /g, "à")
        .replace(/Ã¢/g, "â")

        // Fix any remaining mojibake patterns
        .replace(/âˆ'/g, "∞")
        .replace(/Â°/g, "°")
        .replace(/Â /g, " ")       // Non-breaking space
        ;
}

/**
 * Recursively sanitize all string properties in an object
 * Useful for sanitizing chapter data
 */
export function sanitizeObject(obj) {
    if (!obj) return obj;

    if (typeof obj === 'string') {
        return sanitizeText(obj);
    }

    if (Array.isArray(obj)) {
        return obj.map(item => sanitizeObject(item));
    }

    if (typeof obj === 'object') {
        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
            sanitized[key] = sanitizeObject(value);
        }
        return sanitized;
    }

    return obj;
}
