// src/components/Codex/codexCards.js
// 10 placeholder cards for the Codex system

export const codexCards = [
    {
        id: '001',
        mode: 'mirror',
        punchline: "You're not broken. You're misaligned.",
        body: "When your actions contradict your truth, your entire field collapses inward. Realign one behavior today. The world around you will adjust.",
    },
    {
        id: '002',
        mode: 'resonator',
        punchline: "Your mind is not loud. You are simply alone with it.",
        body: "Silence is not the cure—connection is. Share one thought today that you've been holding hostage.",
    },
    {
        id: '003',
        mode: 'mirror',
        punchline: "Despair is not wisdom. It's your body running out of fuel.",
        body: "The mind mistakes chemical signals for philosophical truths. Eat. Sleep. Move. Then revisit the problem.",
    },
    {
        id: '004',
        mode: 'sword',
        punchline: "Your anger is proof you still care.",
        body: "Rage only lives where love once stood. Let that anger guide you toward what you're protecting.",
    },
    {
        id: '005',
        mode: 'prism',
        punchline: "Numbness is your spirit turning the volume down.",
        body: "When external pain exceeds internal capacity, you dissociate. The cure is not more stimulation—it's safety.",
    },
    {
        id: '006',
        mode: 'sword',
        punchline: "You are not afraid of failing. You're afraid of wasting your life.",
        body: "The fear behind ambition is mortality. Move anyway. Time passes whether you do or not.",
    },
    {
        id: '007',
        mode: 'resonator',
        punchline: "Loneliness is your unexpressed love looking for an exit.",
        body: "You are not empty—you are overflowing with no one to receive it. Create something. It counts.",
    },
    {
        id: '008',
        mode: 'prism',
        punchline: "Shame did not begin with you.",
        body: "You inherited your deepest wounds. What you carry is ancestral. What you heal is generational.",
    },
    {
        id: '009',
        mode: 'resonator',
        punchline: "You are not too much. Your environment was too little.",
        body: "The world rewards reduction. But you were made for expression. Find the spaces that expand you.",
    },
    {
        id: '010',
        mode: 'sword',
        punchline: "Anxiety is momentum with nowhere to go.",
        body: "Your nervous system is prepared for action. Give it a channel. Idle engines burn themselves out.",
    },
];

// Mode metadata for filtering UI
export const CODEX_MODES = {
    mirror: {
        label: 'Mirror',
        icon: '◇',
        description: 'Self-reflection and alignment',
        color: 'rgba(147, 197, 253, 0.8)', // blue
    },
    resonator: {
        label: 'Resonator',
        icon: '◎',
        description: 'Connection and expression',
        color: 'rgba(167, 139, 250, 0.8)', // purple
    },
    prism: {
        label: 'Prism',
        icon: '△',
        description: 'Perception and shadow work',
        color: 'rgba(251, 191, 36, 0.8)', // amber
    },
    sword: {
        label: 'Sword',
        icon: '⚔',
        description: 'Action and momentum',
        color: 'rgba(248, 113, 113, 0.8)', // red
    },
};
