export const BINAURAL_PRESETS = [
    { id: 'delta', name: 'Delta', hz: 2, description: 'Deep sleep, healing', color: 'rgba(147, 51, 234, 0.8)' },
    { id: 'theta', name: 'Theta', hz: 6, description: 'Meditation, creativity', color: 'rgba(99, 102, 241, 0.8)' },
    { id: 'alpha', name: 'Alpha', hz: 10, description: 'Relaxation, calm focus', color: 'rgba(34, 197, 94, 0.8)' },
    { id: 'beta', name: 'Beta', hz: 20, description: 'Active thinking, focus', color: 'rgba(234, 179, 8, 0.8)' },
    { id: 'gamma', name: 'Gamma', hz: 40, description: 'Peak awareness, insight', color: 'rgba(239, 68, 68, 0.8)' },
];

export const ISOCHRONIC_PRESETS = [
    { id: 'grounding', name: 'Grounding', hz: 7.83, description: 'Schumann resonance', color: 'rgba(168, 85, 247, 0.8)' },
    { id: 'relaxation', name: 'Relaxation', hz: 10, description: 'Alpha state calm', color: 'rgba(59, 130, 246, 0.8)' },
    { id: 'focus', name: 'Focus', hz: 14, description: 'SMR concentration', color: 'rgba(16, 185, 129, 0.8)' },
    { id: 'energy', name: 'Energy', hz: 18, description: 'Beta alertness', color: 'rgba(245, 158, 11, 0.8)' },
    { id: 'clarity', name: 'Clarity', hz: 40, description: 'Gamma perception', color: 'rgba(244, 63, 94, 0.8)' },
];

export const MANTRA_PRESETS = [
    { id: 'om', name: 'Om', description: 'Universal vibration' },
    { id: 'soham', name: 'So Hum', description: 'I am That' },
    { id: 'hamsa', name: 'Ham Sa', description: 'Breath mantra' },
    { id: 'om-namah', name: 'Om Namah Shivaya', description: 'Transformation' },
    { id: 'om-mani', name: 'Om Mani Padme Hum', description: 'Compassion' },
];

export const NATURE_PRESETS = [
    { id: 'rain', name: 'Rain', description: 'Gentle rainfall' },
    { id: 'ocean', name: 'Ocean Waves', description: 'Rhythmic waves' },
    { id: 'forest', name: 'Forest', description: 'Birds and wind' },
    { id: 'fire', name: 'Crackling Fire', description: 'Warm hearth' },
    { id: 'stream', name: 'Stream', description: 'Flowing water' },
    { id: 'thunder', name: 'Thunderstorm', description: 'Distant rumble' },
];

export const SOUND_TYPES = [
    'Binaural Beats',
    'Isochronic Tones',
    'Mantra',
    'Nature',
    'Silence',
];
