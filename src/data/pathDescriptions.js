// src/data/pathDescriptions.js
// Narrative text for path ceremonies

/**
 * Path descriptions for emergence and shift ceremonies.
 * Each path has:
 * - emergence: Text shown when path is first revealed (90 days)
 * - shiftFrom: Text shown when leaving this path
 * - shiftTo: Text shown when arriving at this path
 */
export const PATH_DESCRIPTIONS = {
    Yantra: {
        emergence: `Your practice moves through structure. You work with symbols, ritual precision, and deliberate form to tune attention.

You understand that meaning can be engineered. When the form is clean, the mind becomes clear.

The Yantra path trains intentional structure. Your avatar now reflects this geometric clarity.`,

        shiftTo: `Your practice is shaped by structure now. Symbol, sequence, and precise form guide your attention.

The Yantra path knows that ritual design can stabilize consciousness. Your avatar reflects this clarity of form.`,

        shiftFrom: `Structure was your teacher. Through ritual precision, you learned to align mind with form.

Now your practice moves toward a new center. The structure remains, but it no longer leads.`
    },

    Kaya: {
        emergence: `Your practice moves through sensation. The body is your field, perception your laboratory.

You understand that consciousness is not housed in the body — it is the body, experienced from within.

The Kaya path trains embodied presence. Your avatar now reflects this grounded field.`,

        shiftTo: `Your practice has settled into sensation. The body is your field, perception your guide.

The Kaya path asks: what does awareness feel like from within? Your avatar reflects this grounded presence.`,

        shiftFrom: `Sensation was your teacher. The body carried you through each session, revealing what words cannot.

Now your practice moves toward a new center. The body remains, but it no longer leads.`
    },

    Chitra: {
        emergence: `Your practice trains the imaginal field. You build the capacity to see what is not physically present.

The imaginal realm is not fantasy — it is the medium through which intention becomes form.

The Chitra path develops vision and image. Your avatar now carries the mark of luminous seeing.`,

        shiftTo: `Your practice has turned toward vision. You are learning to move within the imaginal field.

The Chitra path knows that what we can clearly see within, we can bring into form. Your avatar reflects this inner seeing.`,

        shiftFrom: `Vision was your teacher. The imaginal field trained your focus and your clarity.

Now your practice moves toward a new center. The vision remains, but the path turns.`
    },

    Nada: {
        emergence: `Your practice moves through rhythm. Breath and sound have become your primary instruments of attention.

You understand that rhythm is a bridge — a temporal structure the nervous system can follow into coherence.

The Nada path trains resonance itself. Your avatar now pulses with this rhythmic awareness.`,

        shiftTo: `Your practice is carried by rhythm now. Breath and sound shape your field of attention.

The Nada path knows that resonance stabilizes the mind. Your avatar reflects this rhythmic coherence.`,

        shiftFrom: `Rhythm was your teacher. Through resonance, you learned to entrain attention to time.

Now your practice moves toward a new center. The rhythm remains, but it no longer leads.`
    }
};

/**
 * Get ceremony text for a path emergence
 */
export function getEmergenceText(path) {
    return PATH_DESCRIPTIONS[path]?.emergence || '';
}

/**
 * Get ceremony text for shifting TO a path
 */
export function getShiftToText(path) {
    return PATH_DESCRIPTIONS[path]?.shiftTo || '';
}

/**
 * Get ceremony text for shifting FROM a path
 */
export function getShiftFromText(path) {
    return PATH_DESCRIPTIONS[path]?.shiftFrom || '';
}

/**
 * Get full shift narrative (combines from + to)
 */
export function getFullShiftText(fromPath, toPath) {
    const fromText = getShiftFromText(fromPath);
    const toText = getShiftToText(toPath);
    return { fromText, toText };
}
