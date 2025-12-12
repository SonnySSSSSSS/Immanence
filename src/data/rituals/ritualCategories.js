export const RITUAL_CATEGORIES = [
    {
        id: 'grounding',
        name: 'Grounding & Centering',
        description: 'Establish a stable foundation and connect with the earth.',
        icon: '🌍'
    },
    {
        id: 'purification',
        name: 'Purification & Clearing',
        description: 'Cleanse the energy body and space of stagnation.',
        icon: '🌊'
    },
    {
        id: 'concentration',
        name: 'Concentration & Focus',
        description: 'Sharpen the mind and develop single-pointed attention.',
        icon: '👁️'
    },
    {
        id: 'circulation',
        name: 'Circulation & Energy',
        description: 'Cultivate and flow vital energy through the body.',
        icon: '🔄'
    },
    {
        id: 'invocation',
        name: 'Invocation & Connection',
        description: 'Connect with archetypal energies and higher principles.',
        icon: '🙏'
    },
    {
        id: 'transmutation',
        name: 'Transmutation',
        description: 'Transform difficult emotions and energies into wisdom.',
        icon: '🔥'
    },
    {
        id: 'witnessing',
        name: 'Witnessing & Non-Dual',
        description: 'Rest in the nature of mind and open awareness.',
        icon: '🌌'
    },
    {
        id: 'devotional',
        name: 'Devotional',
        description: 'Surrender the ego through sacred movement and love.',
        icon: '💖'
    },
    {
        id: 'paradox',
        name: 'Paradox & Dissolution',
        description: 'Transcend conceptual mind through impossible questions.',
        icon: '🌀'
    }
];

export const getCategoryById = (id) => RITUAL_CATEGORIES.find(c => c.id === id);
