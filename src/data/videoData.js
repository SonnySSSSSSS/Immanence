// src/data/videoData.js
// Video catalog with provider abstraction for future migration

/**
 * Video categories matching app domains
 */
export const VIDEO_CATEGORIES = [
    { id: 'foundation', label: 'Foundation', icon: '🌱', description: 'Start here' },
    { id: 'breathwork', label: 'Breathwork', icon: '🫁', description: 'Breathing techniques' },
    { id: 'visualization', label: 'Visualization', icon: '👁️', description: 'Visual practices' },
    { id: 'wisdom', label: 'Wisdom', icon: '📖', description: 'Teachings & philosophy' },
    { id: 'practice', label: 'Practice Guides', icon: '🧘', description: 'How-to sessions' }
];

/**
 * Video catalog
 * 
 * Structure:
 * - id: unique identifier
 * - provider: 'youtube' | 'vimeo' | 'cloudflare' | 'self'
 * - externalId: provider-specific video ID
 * - title: display title
 * - category: one of VIDEO_CATEGORIES.id
 * - duration: human-readable (e.g., "5:30")
 * - durationSec: total seconds (for calculations)
 * - description: short description
 * - order: sequence within category
 * - tags: searchable keywords
 * - isFeatured: show in featured section
 * - pathId: link to specific path (optional)
 * - week: link to specific week (optional)
 * - embedOptions: provider-specific options
 */
export const VIDEOS = [
    // ═══════════════════════════════════════════════════════════════════════════
    // WISDOM - Philosophy & Teachings
    // ═══════════════════════════════════════════════════════════════════════════
    {
        id: 'music-transmission-consciousness',
        provider: 'self',
        externalId: 'videos/Music__A_Transmission_of_Consciousness.mp4',
        title: 'Music: A Transmission of Consciousness',
        category: 'wisdom',
        duration: '~10:00',
        durationSec: 600,
        description: 'Exploring how music transmits and transforms consciousness.',
        order: 1,
        tags: ['music', 'consciousness', 'transmission'],
        isFeatured: true,
        pathId: null,
        week: null,
        iconType: 'circle',
        embedOptions: {}
    },
    {
        id: 'ai-oracle',
        provider: 'self',
        externalId: 'videos/The_AI_Oracle.mp4',
        title: 'The AI Oracle',
        category: 'wisdom',
        duration: '~15:00',
        durationSec: 900,
        description: 'AI as a modern oracle and tool for consciousness exploration.',
        order: 2,
        tags: ['ai', 'oracle', 'technology', 'consciousness'],
        isFeatured: true,
        pathId: null,
        week: null,
        iconType: 'hex',
        embedOptions: {}
    },
    {
        id: 'cosmic-dance',
        provider: 'self',
        externalId: 'videos/The_Cosmic_Dance.mp4',
        title: 'The Cosmic Dance',
        category: 'wisdom',
        duration: '~14:00',
        durationSec: 840,
        description: 'The universal dance of creation and dissolution.',
        order: 3,
        tags: ['cosmos', 'dance', 'creation', 'philosophy'],
        isFeatured: true,
        pathId: null,
        week: null,
        iconType: 'circle',
        embedOptions: {}
    },
    {
        id: 'map-of-self',
        provider: 'self',
        externalId: 'videos/The_Map_of_The_Self.mp4',
        title: 'The Map of The Self',
        category: 'wisdom',
        duration: '~14:00',
        durationSec: 840,
        description: 'Understanding the layers and territories of self.',
        order: 4,
        tags: ['self', 'identity', 'psychology', 'map'],
        isFeatured: true,
        pathId: null,
        week: null,
        iconType: 'triangle',
        embedOptions: {}
    },
    {
        id: 'mechanics-life-death',
        provider: 'self',
        externalId: 'videos/The_Mechanics_of_Life_&_Death.mp4',
        title: 'The Mechanics of Life & Death',
        category: 'wisdom',
        duration: '~13:00',
        durationSec: 780,
        description: 'The fundamental mechanics underlying life and death.',
        order: 5,
        tags: ['life', 'death', 'mechanics', 'philosophy'],
        isFeatured: false,
        pathId: null,
        week: null,
        iconType: 'circle',
        embedOptions: {}
    },
    {
        id: 'mechanics-meaning',
        provider: 'self',
        externalId: 'videos/The_Mechanics_of_Meaning.mp4',
        title: 'The Mechanics of Meaning',
        category: 'wisdom',
        duration: '~12:00',
        durationSec: 720,
        description: 'How meaning arises and organizes experience.',
        order: 6,
        tags: ['meaning', 'mechanics', 'philosophy', 'semiotics'],
        isFeatured: false,
        pathId: null,
        week: null,
        iconType: 'hex',
        embedOptions: {}
    },
    {
        id: 'souls-journey',
        provider: 'self',
        externalId: 'videos/The_Soul_s_Journey.mp4',
        title: "The Soul's Journey",
        category: 'wisdom',
        duration: '~11:00',
        durationSec: 660,
        description: "The path of the soul through transformation.",
        order: 7,
        tags: ['soul', 'journey', 'transformation', 'spirituality'],
        isFeatured: false,
        pathId: null,
        week: null,
        iconType: 'triangle',
        embedOptions: {}
    },
    {
        id: 'what-is-information',
        provider: 'self',
        externalId: 'videos/What_is_Information,_Really_.mp4',
        title: 'What is Information, Really?',
        category: 'wisdom',
        duration: '~12:00',
        durationSec: 720,
        description: 'Deep exploration of the nature of information.',
        order: 8,
        tags: ['information', 'reality', 'physics', 'philosophy'],
        isFeatured: false,
        pathId: null,
        week: null,
        iconType: 'hex',
        embedOptions: {}
    },
];

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get all videos in a category, sorted by order
 */
export function getVideosByCategory(categoryId) {
    return VIDEOS
        .filter(v => v.category === categoryId)
        .sort((a, b) => a.order - b.order);
}

/**
 * Get featured videos
 */
export function getFeaturedVideos() {
    return VIDEOS.filter(v => v.isFeatured);
}

/**
 * Get videos for a specific path/week
 */
export function getVideosForPath(pathId, week = null) {
    return VIDEOS.filter(v =>
        v.pathId === pathId && (week === null || v.week === week)
    );
}

/**
 * Search videos by title or tags
 */
export function searchVideos(query) {
    const q = query.toLowerCase().trim();
    if (!q) return VIDEOS;

    return VIDEOS.filter(v =>
        v.title.toLowerCase().includes(q) ||
        v.tags.some(t => t.toLowerCase().includes(q)) ||
        v.description.toLowerCase().includes(q)
    );
}

/**
 * Get a single video by ID
 */
export function getVideoById(id) {
    return VIDEOS.find(v => v.id === id) || null;
}

/**
 * Get embed URL for a video based on provider
 */
export function getEmbedUrl(video, options = {}) {
    const { autoplay = false, start = 0 } = options;

    switch (video.provider) {
        case 'youtube': {
            const params = new URLSearchParams({
                modestbranding: '1',
                rel: '0',
                enablejsapi: '1',  // Required for IFrame API
                origin: window.location.origin
            });
            if (autoplay) params.set('autoplay', '1');
            if (start > 0) params.set('start', String(Math.floor(start)));
            return `https://www.youtube.com/embed/${video.externalId}?${params}`;
        }

        case 'vimeo': {
            const params = new URLSearchParams({
                title: '0',
                byline: '0',
                portrait: '0'
            });
            if (autoplay) params.set('autoplay', '1');
            return `https://player.vimeo.com/video/${video.externalId}?${params}`;
        }

        case 'cloudflare':
            return `https://iframe.cloudflarestream.com/${video.externalId}`;

        case 'self':
            // Local videos from public folder
            return `${import.meta.env.BASE_URL}${video.externalId}`;

        default:
            console.warn(`Unknown video provider: ${video.provider}`);
            return null;
    }
}
