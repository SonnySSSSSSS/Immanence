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
    Soma: {
        emergence: `Your practice moves through form. Sensation is your teacher, posture your laboratory. 
        
You understand that consciousness is not housed in the body — it is the body, experienced from within.

The Soma path trains embodiment: the capacity to inhabit your physical form with full presence. Your avatar now reflects this grounding in its movement and texture.`,

        shiftTo: `Now your practice has settled into form. The body has become your laboratory — sensation your guide.

The Soma path asks: what does consciousness feel like from within? Your avatar reflects this return to ground.`,

        shiftFrom: `The body was your ground. Sensation carried you through each session, teaching what words cannot convey.

Now your practice moves toward a new center. The body remains, but it no longer leads.`
    },

    Prana: {
        emergence: `Your practice rides the breath. The rhythm of inhale and exhale has become your primary instrument of regulation.

You know that breath is the bridge — the one autonomic function you can consciously shape. Through it, you access states that lie beyond direct control.

The Prana path trains the life force itself. Your avatar now pulses with this rhythmic awareness.`,

        shiftTo: `Your practice rides the breath now. Inhale and exhale have become your instruments.

The Prana path knows that breath is the bridge between voluntary and involuntary, between body and mind. Your avatar pulses with this rhythm.`,

        shiftFrom: `The breath was your bridge. Through its rhythm, you found access to states beyond direct control.

Now your practice moves toward a new center. The breath continues, but it no longer leads.`
    },

    Dhyana: {
        emergence: `Your practice cultivates stillness. You've discovered that beneath thought is awareness, and awareness needs no object.

The witness position is becoming your natural home. Not as escape from experience, but as the ground from which experience arises.

The Dhyana path is the way of presence itself. Your avatar now reflects this centered quietude.`,

        shiftTo: `Your practice has found stillness at its center. Beneath thought, you've discovered awareness itself.

The Dhyana path is the way of the witness — not as escape from experience, but as its unchanging ground. Your avatar reflects this deep presence.`,

        shiftFrom: `Stillness was your teacher. In the space between thoughts, you found what does not come and go.

Now your practice moves toward a new center. The stillness remains, but the path turns.`
    },

    Drishti: {
        emergence: `Your practice trains the inner eye. You're building the capacity to see what isn't physically present — to hold forms in mental space, to link sound to sight.

The imaginal realm is not fantasy. It is the medium through which intention shapes reality.

The Drishti path develops the visionary faculty. Your avatar now carries the mark of focused inner sight.`,

        shiftTo: `Your practice has turned inward, toward vision. You're learning to see what isn't physically present — to navigate the imaginal realm.

The Drishti path knows that what we can clearly envision, we can eventually manifest. Your avatar reflects this focused inner sight.`,

        shiftFrom: `Vision was your teacher. Through the inner eye, you learned to see beyond the immediately present.

Now your practice moves toward a new center. The visionary capacity remains, but the path turns.`
    },

    Jnana: {
        emergence: `Your practice moves through understanding. You know that intellectual clarity is not separate from embodiment — that frameworks, maps, and conceptual precision are tools of liberation, not obstacles to it.

Study is not passive reception. It is active engagement with wisdom traditions that have mapped this territory for millennia.

The Jnana path honors the mind's capacity to illuminate. Your avatar now carries the mark of crystalline clarity.`,

        shiftTo: `Your practice has found its center in understanding. You know that clear thinking is not opposed to embodiment — it illuminates the path.

The Jnana path is the way of wisdom. Study becomes practice. Your avatar reflects this crystalline clarity.`,

        shiftFrom: `Understanding was your teacher. Through the study of wisdom, you found maps for territory you already sensed.

Now your practice moves toward a new center. The wisdom remains, but the path turns.`
    },

    Samyoga: {
        emergence: `Your practice refuses specialization. You move between body, breath, mind, vision, and wisdom with fluid balance.

This is the rarest path — not because it's "higher," but because genuine integration requires sustained attention to all domains. Most people find a home in one. You have found home in their union.

The Samyoga path is wholeness itself. Your avatar reflects the harmony of all paths moving as one.`,

        shiftTo: `Your practice has found its center in integration. Now all the paths flow through you in balanced rhythm.

Samyoga is the rarest path — not higher, but harder to maintain. It requires equal attention to body, breath, mind, vision, and wisdom. Your avatar reflects this unified wholeness.`,

        shiftFrom: `Integration was your teacher. For a time, you held all paths in balance, moving fluidly between them.

Now one path emerges more strongly. This is not loss — it is focus. The whole remains, but one note sounds more clearly.`
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
